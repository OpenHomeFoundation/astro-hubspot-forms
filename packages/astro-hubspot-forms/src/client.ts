import type { ClientFormConfig } from './types';

const SUBMIT_URL = 'https://api.hsforms.com/submissions/v3/integration/submit';

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`))
    ?.split('=')[1];
}

class HubSpotFormElement extends HTMLElement {
  #config!: ClientFormConfig;
  #form!: HTMLFormElement;
  #steps: HTMLElement[] = [];
  #current = 0;

  connectedCallback() {
    const configEl = this.querySelector<HTMLScriptElement>('script.hsf-config');
    const form = this.querySelector<HTMLFormElement>('form.hsf-form');
    if (!configEl || !form) return;

    this.#config = JSON.parse(configEl.textContent ?? '{}');
    this.#form = form;
    this.#steps = [...form.querySelectorAll<HTMLElement>('.hsf-step')];
    this.setAttribute('data-step', '0');

    form.addEventListener('submit', (e) => this.#onSubmit(e));
    form.addEventListener('click', (e) => {
      if ((e.target as Element).closest('[data-action="previous"]')) this.#goTo(this.#current - 1);
    });

    // Once a field has shown an error, re-check it as the user fixes it.
    const recheck = (e: Event) => {
      const el = e.target as Control;
      if (this.#config.liveValidation && el.getAttribute('aria-invalid') === 'true') this.#validateField(el);
    };
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);
  }

  // --- Steps ---------------------------------------------------------------

  #goTo(index: number) {
    if (index < 0 || index >= this.#steps.length) return;
    this.#steps.forEach((step, i) => (step.hidden = i !== index));
    this.#current = index;
    this.setAttribute('data-step', String(index));
    const step = this.#steps[index];
    step.focus({ preventScroll: true });
    if (step.getBoundingClientRect().top < 0) step.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.dispatchEvent(new CustomEvent('hubspot-form:step', { bubbles: true, detail: { step: index } }));
  }

  // --- Validation ------------------------------------------------------------

  #errorFor(el: Control): HTMLElement | null {
    const ids = el.closest('fieldset')?.getAttribute('aria-describedby') ?? el.getAttribute('aria-describedby') ?? '';
    return ids
      .split(' ')
      .map((id) => document.getElementById(id))
      .find((n) => n?.classList.contains('hsf-field-error')) ?? null;
  }

  #messageFor(el: Control): string {
    const { messages } = this.#config;
    const group = el.closest<HTMLFieldSetElement>('fieldset[data-required]');

    // Checkbox groups: native `required` would demand every box, so check "at least one" ourselves.
    if (group && el.type === 'checkbox') {
      return group.querySelector('input:checked') ? '' : messages.required;
    }
    if (el.validity.valid) return '';
    if (el.validity.valueMissing) return messages.required;
    if (el.validity.typeMismatch && el.type === 'email') return messages.email;
    if (el.validity.badInput && el.type === 'number') return messages.number;
    if (el.validity.badInput && el.type === 'date') return messages.date;
    return el.validationMessage;
  }

  #validateField(el: Control): boolean {
    const message = this.#messageFor(el);
    const group = el.closest('fieldset');
    const targets = group ? [...group.querySelectorAll<Control>('input')] : [el];
    targets.forEach((t) => t.setAttribute('aria-invalid', String(!!message)));

    const error = this.#errorFor(el);
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    return !message;
  }

  /** Validates every field in a step, focusing the first invalid one. */
  #validateStep(step: HTMLElement): boolean {
    const controls = [...step.querySelectorAll<Control>('input:not([type="hidden"]), select, textarea')];
    // Validate each radio/checkbox group once, via its first input.
    const seen = new Set<string>();
    const invalid = controls.filter((el) => {
      if (el.type === 'radio' || (el.type === 'checkbox' && el.closest('fieldset'))) {
        if (seen.has(el.name)) return false;
        seen.add(el.name);
      }
      return !this.#validateField(el);
    });
    invalid[0]?.focus();
    return invalid.length === 0;
  }

  // --- Submission ------------------------------------------------------------

  #buildPayload() {
    const data = new FormData(this.#form);
    const fields = new Map<string, string[]>();

    for (const [key, value] of data) {
      if (key.startsWith('consent:') || typeof value !== 'string') continue;
      fields.set(key, [...(fields.get(key) ?? []), value]);
    }

    // Unchecked single checkboxes aren't in FormData; HubSpot expects "false".
    for (const box of this.#form.querySelectorAll<HTMLInputElement>('.hsf-field--singleCheckbox input')) {
      if (!box.checked) fields.set(box.name, ['false']);
    }

    const { consent } = this.#config;
    const communications = (consent?.communications ?? []).map((c) => ({
      value: data.has(`consent:communication:${c.subscriptionTypeId}`),
      subscriptionTypeId: c.subscriptionTypeId,
      text: c.text,
    }));

    return {
      submittedAt: Date.now(),
      fields: [...fields]
        .map(([key, values]) => {
          const [objectTypeId, name] = key.split('/');
          return { objectTypeId, name, value: values.join(';') };
        })
        .filter((f) => f.value !== ''),
      context: {
        hutk: getCookie('hubspotutk'),
        pageUri: location.href,
        pageName: document.title,
      },
      ...(consent && {
        legalConsentOptions: consent.legitimateInterest
          ? { legitimateInterest: { value: true, ...consent.legitimateInterest } }
          : {
              consent: {
                consentToProcess: consent.processing === 'implicit' || data.has('consent:process'),
                text: consent.processingText,
                communications,
              },
            },
      }),
    };
  }

  async #onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const step = this.#steps[this.#current];
    if (!step || !this.#validateStep(step)) return;

    // Enter in any field triggers the form's first submit button, so act on the current step instead.
    if (this.#current < this.#steps.length - 1) {
      this.#goTo(this.#current + 1);
      return;
    }

    const errorEl = this.querySelector<HTMLElement>('.hsf-error')!;
    const buttons = this.#form.querySelectorAll<HTMLButtonElement>('.hsf-button');
    errorEl.hidden = true;
    this.toggleAttribute('data-submitting', true);
    buttons.forEach((b) => (b.disabled = true));

    try {
      const { portalId, formId } = this.#config;
      const res = await fetch(`${SUBMIT_URL}/${portalId}/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.#buildPayload()),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = body.errors?.map((e: { message: string }) => e.message).join(' ') || body.message;
        throw new Error(detail || this.#config.messages.generic);
      }

      if (body.redirectUri) {
        location.assign(body.redirectUri);
        return;
      }

      const success = this.querySelector<HTMLElement>('.hsf-success')!;
      if (!success.textContent?.trim()) success.innerHTML = body.inlineMessage || 'Thanks for submitting the form.';
      this.#form.hidden = true;
      success.hidden = false;
      success.focus();
      this.dispatchEvent(new CustomEvent('hubspot-form:success', { bubbles: true, detail: body }));
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : this.#config.messages.generic;
      errorEl.hidden = false;
      this.dispatchEvent(new CustomEvent('hubspot-form:error', { bubbles: true, detail: err }));
    } finally {
      this.removeAttribute('data-submitting');
      buttons.forEach((b) => (b.disabled = false));
    }
  }
}

if (!customElements.get('hubspot-form')) customElements.define('hubspot-form', HubSpotFormElement);
