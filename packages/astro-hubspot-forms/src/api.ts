import type { RenderDefinition } from './types';

// The generic host redirects to the portal's region (e.g. forms-eu1), so no region setting is needed.
const RENDER_DEFINITION_URL = 'https://forms.hsforms.com/embed/v4/render-definition';

export const SUPPORTED_MODULES = new Set([
  'step',
  'row',
  'navigationRow',
  'nextButton',
  'previousButton',
  'submitButton',
  'progressBar',
  'richText',
  'heading',
  'divider',
  'image',
  'hidden',
  'dataPrivacy',
  'text',
  'email',
  'textarea',
  'number',
  'phoneNumber',
  'url',
  'date',
  'dropdownSelect',
  'radioSelect',
  'multipleCheckbox',
  'singleCheckbox',
]);

/**
 * Fetches a form's V4 render definition. This is the public endpoint HubSpot's own embed uses,
 * so it needs no token, but it is undocumented: we fail loudly if its shape changes.
 */
export async function fetchRenderDefinition(portalId: string, formId: string): Promise<RenderDefinition> {
  const url = `${RENDER_DEFINITION_URL}/${encodeURIComponent(portalId)}/${encodeURIComponent(formId)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HubSpot form ${formId} could not be loaded (${res.status}). Is it published?`);
  }

  const definition: RenderDefinition = await res.json();
  if (!Array.isArray(definition?.form?.modules)) {
    throw new Error(`HubSpot form ${formId}: unexpected render definition shape. HubSpot may have changed their format.`);
  }

  return definition;
}

/** Module types in the definition that we don't know how to render. */
export function findUnsupportedModules(definition: RenderDefinition): string[] {
  const unsupported = new Set<string>();
  const walk = (m: { type: string; modules?: unknown[] }) => {
    if (!SUPPORTED_MODULES.has(m.type)) unsupported.add(m.type);
    (m.modules as (typeof m)[] | undefined)?.forEach(walk);
  };
  [...definition.form.modules, ...definition.postSubmit.modules].forEach(walk);
  return [...unsupported];
}
