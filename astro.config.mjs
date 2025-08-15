import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://gridstordayzer.netlify.app',
  base: '/dayzer',
  output: 'server',
  adapter: netlify(),
  integrations: [react(), tailwind()],
  vite: { build: { rollupOptions: { external: ['@prisma/client'] } } }
});
