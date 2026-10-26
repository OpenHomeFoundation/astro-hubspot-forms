import { defineConfig } from 'astro/config';

export default defineConfig({
  // Read HUBSPOT_* from the workspace root .env
  vite: { envDir: '..' },
});
