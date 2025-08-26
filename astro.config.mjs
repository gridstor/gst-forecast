// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';
 
export default defineConfig({
  // Remove site URL - let it serve from its own domain
  // This allows Netlify proxies to work correctly
  integrations: [react(), tailwind()],
  output: 'server',
  adapter: netlify(),
  vite: {
    build: {
      rollupOptions: {
        external: ['@prisma/client']
      }
    }
    // Remove ASSET_URL definition - let assets load from current domain
  }
});
