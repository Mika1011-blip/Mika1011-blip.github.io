import { defineConfig } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS } from './src/content.js';
import { projectDocument } from './src/project-page.js';

// User site (Mika1011-blip.github.io) is served from the domain root.
const base = '/';
const root = dirname(fileURLToPath(import.meta.url));

// One static page per project, pre-rendered from content.js so it reads without
// JavaScript: projects/<id>/index.html (generated, gitignored), served at
// /projects/<id>/. Regenerated whenever Vite loads this config.
const projectPages = Object.fromEntries(PROJECTS.map((p) => {
  const file = resolve(root, 'projects', p.id, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, projectDocument(p.id, base));
  return [`project-${p.id}`, file];
}));

export default defineConfig({
  base,
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: resolve(root, 'index.html'), ...projectPages } },
  },
});
