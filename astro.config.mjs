// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.events.denys-dutykh.com',
  output: 'static',
  build: {
    assets: 'assets'
  },
  integrations: [
    tailwind({
      applyBaseStyles: false, // We'll handle base styles in our custom CSS
    })
  ],
  vite: {
    server: {
      fs: {
        strict: false
      },
      watch: {
        ignored: [
          '**/*.tmp*',
          '**/.*',
          'node_modules/**',
          '**/.DS_Store',
          '**/Thumbs.db'
        ]
      }
    }
  }
});
