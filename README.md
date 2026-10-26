# Astro HubSpot Forms

[![Publish](https://github.com/OpenHomeFoundation/astro-hubspot-forms/actions/workflows/publish.yml/badge.svg)](https://github.com/OpenHomeFoundation/astro-hubspot-forms/actions/workflows/publish.yml)
[![Release](https://img.shields.io/github/v/tag/OpenHomeFoundation/astro-hubspot-forms?label=release)](https://github.com/OpenHomeFoundation/astro-hubspot-forms/tags)
[![License](https://img.shields.io/github/license/OpenHomeFoundation/astro-hubspot-forms)](LICENSE)

Render HubSpot forms in Astro as **native, unstyled HTML** instead of HubSpot's iframe embed, so every form looks like
it belongs on the site it's on.

```astro
<HubSpotForm formId="70ee1690-62fb-45a8-b1af-abf89ff2f137" />
```

- **Looks like your site.** Plain `<input>`, `<select>`, `<textarea>` and `<button>` elements pick up the site's
  existing styles. No iframe, no shadow DOM, no HubSpot CSS.
- **Built the way you designed it.** Steps, side-by-side fields, headings, rich text, consent checkboxes and the thank-you
  message all come from the HubSpot form editor.
- **Rendered on the server.** The form is in the HTML at build or request time: no layout shift, no third-party embed
  script, and no API token.
- **Accessible.** Real labels, fieldsets and legends, inline errors linked with `aria-describedby`, and focus management
  between steps.
- **Submits straight to HubSpot.** Contacts, company fields, consent and the `hubspotutk` tracking cookie all go through
  HubSpot's submissions API, just like the embed.

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Props](#props)
- [Styling](#styling)
- [Events](#events)
- [How it works](#how-it-works)
- [Limitations](#limitations)
- [Development](#development)
- [Releasing](#releasing)

## Installation

The package is published to [GitHub Packages](https://github.com/OpenHomeFoundation/astro-hubspot-forms/pkgs/npm/astro-hubspot-forms),
which needs a GitHub token to install, even though the package is public.

**1. Point the `@openhomefoundation` scope at GitHub Packages** in an `.npmrc` at the root of your site:

```ini
@openhomefoundation:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

**2. Provide a token** as `NODE_AUTH_TOKEN`:

| Where              | Token                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locally            | A [personal access token (classic)](https://github.com/settings/tokens) with the `read:packages` scope                                                     |
| GitHub Actions     | `${{ secrets.GITHUB_TOKEN }}`, with `permissions: packages: read`, and your repo granted access under the package's **Manage Actions access** settings |
| Netlify and others | A personal access token stored as an environment variable                                                                                                 |

**3. Install:**

```sh
pnpm add @openhomefoundation/astro-hubspot-forms
```

Requires Astro 5 or later.

## Quick start

**1. Set your HubSpot portal ID** (the account number in HubSpot's top-right menu) in `.env`:

```ini
HUBSPOT_PORTAL_ID=146078899
```

**2. Add the form to a page.** The form ID is in the form editor's URL: `.../forms/{portalId}/editor/{formId}/...`.

```astro
---
import { HubSpotForm } from '@openhomefoundation/astro-hubspot-forms';
import '@openhomefoundation/astro-hubspot-forms/layout.css'; // optional, see Styling
---

<HubSpotForm formId="70ee1690-62fb-45a8-b1af-abf89ff2f137" />
```

The form must be **published** in HubSpot. On a static site, it's fetched at build time, so rebuild the site to pick
up changes made in the HubSpot editor. With SSR, it's fetched on each request.

## Props

| Prop         | Type                 | Description                                                                                   |
| ------------ | -------------------- | --------------------------------------------------------------------------------------------- |
| `formId`     | `string`             | **Required.** The HubSpot form ID.                                                            |
| `portalId`   | `string`             | HubSpot portal ID. Defaults to the `HUBSPOT_PORTAL_ID` environment variable.                  |
| `classes`    | `HubSpotFormClasses` | Extra classes for inputs, labels and buttons. See [Using your site's classes](#using-your-sites-classes). |
| `class`      | `string`             | Classes for the `<hubspot-form>` wrapper.                                                     |
| `definition` | `RenderDefinition`   | A form definition to render instead of fetching one, for tests or fixtures.                   |

## Styling

The package ships **no visual CSS**. Fields are native elements, so if your site already styles `input`, `select`,
`textarea`, `label` and `button`, the form looks right with no extra work.

### Using your site's classes

If your site styles form elements with classes (Tailwind, Bootstrap-style `.btn`, etc.), pass them in. They're added
next to the built-in `hsf-*` classes, never instead of them.

```astro
<HubSpotForm
  formId="..."
  classes={{
    input: 'form-control',
    button: 'btn',
    submit: 'btn-primary',
    previous: 'btn-outline',
  }}
/>
```

| Key        | Applied to                                           |
| ---------- | ---------------------------------------------------- |
| `input`    | Text inputs, selects and textareas                   |
| `checkbox` | Checkbox and radio inputs, including consent boxes   |
| `label`    | Field labels and legends                             |
| `button`   | Every button                                         |
| `next`     | The **Next** button (added on top of `button`)       |
| `previous` | The **Previous** button (added on top of `button`)   |
| `submit`   | The **Submit** button (added on top of `button`)     |
| `error`    | Inline field error messages                          |

### Layout stylesheet

Fields that share a row in the HubSpot editor need some CSS to sit side by side. `layout.css` handles that, along
with spacing between fields, and nothing else: no colours, fonts or borders.

```js
import '@openhomefoundation/astro-hubspot-forms/layout.css';
```

Every selector is a single class, so it beats element rules and CSS resets (a reset's `section { display: block }`
would otherwise break the step layout), while **any rule in your site's CSS that uses a class wins**.
Tune it with custom properties:

| Property          | Default   | Description                                                    |
| ----------------- | --------- | -------------------------------------------------------------- |
| `--hsf-gap`       | `1.25rem` | Space between rows and fields                                  |
| `--hsf-label-gap` | `0.375rem` | Space between a label and its input                           |
| `--hsf-columns`   | per row   | Set automatically on each `.hsf-row` from the form editor      |

Rows collapse to a single column below `30rem`.

Prefer to write your own layout? Skip the import and use `.hsf-row[data-columns="2"]` or `var(--hsf-columns)`.

### Class reference

| Class                     | Element                                                                    |
| ------------------------- | -------------------------------------------------------------------------- |
| `.hsf`                    | The `<hubspot-form>` wrapper                                               |
| `.hsf-form`               | The `<form>`                                                               |
| `.hsf-step`               | A step (`<section>`); inactive steps have the `hidden` attribute           |
| `.hsf-row`                | A row of fields, with `data-columns` and `--hsf-columns`                   |
| `.hsf-field`              | A field wrapper, plus a type modifier such as `.hsf-field--email`          |
| `.hsf-label`              | A label or legend                                                          |
| `.hsf-required`           | The `*` after a required field's label                                     |
| `.hsf-description`        | Help text under a label                                                    |
| `.hsf-input`              | Text inputs, selects and textareas                                         |
| `.hsf-option`             | A label wrapping a checkbox or radio                                       |
| `.hsf-field-error`        | An inline field error; the field also gets `aria-invalid="true"`           |
| `.hsf-heading`            | A heading from the form editor                                             |
| `.hsf-richtext`           | A rich text block from the form editor                                     |
| `.hsf-consent`            | The privacy and consent block                                              |
| `.hsf-progress`           | The step progress text and `<progress>` bar                                |
| `.hsf-nav`                | The row of step buttons                                                    |
| `.hsf-button`             | Every button, plus `.hsf-next`, `.hsf-previous` or `.hsf-submit`           |
| `.hsf-error`              | The form-level error shown when a submission fails                         |
| `.hsf-success`            | The thank-you message shown after submitting                               |

While a submission is in flight, the wrapper has a `data-submitting` attribute. The current step index is in
`data-step`.

> [!NOTE]
> The one rule the package always includes is `.hsf [hidden] { display: none !important; }`. It keeps inactive
> steps hidden even when your site gives `.hsf-step` a `display` value.

> [!TIP]
> Site has a sticky header? Set `scroll-margin-top` on `.hsf-step` to the header's height, so moving between steps
> scrolls the new step clear of it. Invalid fields are scrolled to the middle of the screen, so they're never hidden.

> [!TIP]
> Rich text written in the HubSpot editor can contain inline styles (such as a font size on a heading). Inline styles
> beat your stylesheet, so keep rich text plain in HubSpot if you want it to follow your site's typography. Empty
> paragraphs and stray line breaks the editor adds for spacing are removed, so spacing comes from your CSS.

## Events

`<hubspot-form>` dispatches bubbling events you can hook into for analytics or custom behaviour:

| Event                  | `detail`                                   | When                                 |
| ---------------------- | ------------------------------------------ | ------------------------------------ |
| `hubspot-form:step`    | `{ step: number }`                         | The visitor moves to another step    |
| `hubspot-form:success` | HubSpot's response                         | The submission succeeded             |
| `hubspot-form:error`   | The `Error`                                | The submission failed                |

```html
<script>
  document.addEventListener('hubspot-form:success', (event) => {
    window.plausible?.('Form submitted', { props: { form: event.target.dataset.formId } });
  });
</script>
```

## How it works

1. **On the server**, the component fetches the form's _render definition_ from HubSpot: the same JSON that HubSpot's
   own embed uses to draw forms built in the new editor. It's public, so no token is needed.
2. It renders the steps, rows, fields and content blocks as plain HTML inside a `<hubspot-form>` custom element.
3. **In the browser**, `<hubspot-form>` handles step navigation, validation using HubSpot's own error messages, and
   submission to HubSpot's [Forms submission API](https://developers.hubspot.com/docs/api/marketing/forms).
4. On success it shows the thank-you message from the form editor, or follows HubSpot's redirect if one is set.

> [!WARNING]
> The render definition endpoint is **undocumented**, so HubSpot could change it. If it changes shape, or a form uses
> a block this package doesn't support, the component throws a clear error when the page is built or rendered, so it
> fails in your build rather than on your live site.

## Limitations

- **File upload fields** aren't supported, because HubSpot's submissions API doesn't accept files.
- **Conditional logic** isn't supported yet. Forms that use it render with every field visible, and a warning is logged.
- **reCAPTCHA** isn't supported, so spam protection is up to the site.

## Development

This repo is a [pnpm](https://pnpm.io) workspace:

```
packages/astro-hubspot-forms/   the published package
playground/                     an Astro site for trying it out
fixtures/                       saved form definitions
scripts/dump-form.mjs           saves a form definition to fixtures/
```

```sh
pnpm install
cp .env.example .env     # set HUBSPOT_PORTAL_ID and HUBSPOT_FORM_ID
pnpm dev                 # playground at http://localhost:4321
pnpm dump-form <formId>  # save a form's definition to fixtures/
```

The playground's stylesheet stands in for a real site's, so it's a good place to check a change doesn't depend on
styles the package doesn't ship.

## Releasing

Create a [GitHub release](https://github.com/OpenHomeFoundation/astro-hubspot-forms/releases/new) with a new tag, such
as `v0.2.0`, or push the tag yourself:

```sh
git tag -a v0.2.0 -m "v0.2.0" && git push origin v0.2.0
```

The [publish workflow](.github/workflows/publish.yml) takes the version from the tag and publishes to GitHub Packages.
There's no need to bump the version in `package.json`.

## License

[Apache License 2.0](LICENSE)
