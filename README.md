# astro-hubspot-forms

Render HubSpot forms in Astro as native HTML instead of HubSpot's iframe embed, so they inherit each site's own styles.

Forms are fetched on the server from HubSpot's V4 render definition (the same data HubSpot's own embed uses), which
includes the steps, rows, rich text and headings from the form editor. Submissions go to HubSpot's
[Forms submission API](https://developers.hubspot.com/docs/api/marketing/forms) from the browser.

> The render definition endpoint is undocumented. The component fails at build/render time with a clear error if its
> shape changes or a form uses a module type we don't support, rather than breaking a live form.

## Usage

```astro
---
import { HubSpotForm } from '@openhomefoundation/astro-hubspot-forms';
import '@openhomefoundation/astro-hubspot-forms/layout.css'; // optional
---

<HubSpotForm formId="70ee1690-..." />
```

Set `HUBSPOT_PORTAL_ID` in the environment, or pass `portalId` as a prop. No API token is needed.

### Styling

The package ships no visual CSS. Fields are plain `input`, `select`, `textarea` and `button` elements with `hsf-*`
class names, so a site's existing element styles apply. For class-based styling, pass site classes:

```astro
<HubSpotForm formId="..." classes={{ input: 'form-control', button: 'btn', submit: 'btn-primary' }} />
```

`layout.css` is an optional stylesheet for rows (side-by-side fields), spacing and stacking. Every selector uses
`:where()`, so any site rule overrides it.

### Events

`<hubspot-form>` dispatches `hubspot-form:step`, `hubspot-form:success` and `hubspot-form:error`, all bubbling.

### Not supported yet

- File upload fields (not accepted by the submissions API)
- Conditional logic
- reCAPTCHA

## Development

```sh
pnpm install
cp .env.example .env   # set HUBSPOT_PORTAL_ID and HUBSPOT_FORM_ID
pnpm dev               # playground at http://localhost:4321
pnpm dump-form <formId> # save a form's render definition to fixtures/
```
