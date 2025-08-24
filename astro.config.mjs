// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'http://localhost:4321',
  output: 'static',
  build: {
    assets: 'assets'
  },
  integrations: [
    tailwind({
      applyBaseStyles: false, // We'll handle base styles in our custom CSS
    })
  ]
});
