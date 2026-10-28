import { defineConfig } from 'vite';

// User site (Mika1011-blip.github.io) is served from the domain root.
export default defineConfig({
  base: '/',
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
