import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // Remove site and base - let the sub-site serve from its own root domain
  // The main site's proxy will handle the /forecasts/ routing
  output: 'server',
  adapter: netlify(),
  integrations: [react(), tailwind()],
  vite: { build: { rollupOptions: { external: ['@prisma/client'] } } }
});
