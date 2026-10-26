// Saves a form's V4 render definition to fixtures/ for inspection.
import { writeFile } from 'node:fs/promises';

const { HUBSPOT_PORTAL_ID: portalId, HUBSPOT_FORM_ID } = process.env;
const formId = process.argv[2] ?? HUBSPOT_FORM_ID;

if (!portalId || !formId) {
  console.error('Set HUBSPOT_PORTAL_ID in .env and pass a form ID (or set HUBSPOT_FORM_ID).');
  process.exit(1);
}

const res = await fetch(`https://forms.hsforms.com/embed/v4/render-definition/${portalId}/${formId}`);
if (!res.ok) {
  console.error(`HubSpot returned ${res.status}`);
  process.exit(1);
}

const body = await res.json();
const out = `fixtures/${formId}.json`;
await writeFile(out, JSON.stringify(body, null, 2));
console.log(`Saved ${out} (${body.form.modules.length} step(s))`);
