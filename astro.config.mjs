import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  // Remove base - let the sub-site serve from its own root domain
  // The main site's proxy will handle the /forecasts/ routing
  integrations: [
    react(),
    tailwind()
  ]
});
