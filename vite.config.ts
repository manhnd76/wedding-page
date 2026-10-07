import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { injectConfigOg } from './scripts/vite-plugins/inject-config-og.ts';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: '/',
  plugins: [injectConfigOg()],
  resolve: {
    alias: { '@shared': r('./src/shared'), '@guest': r('./src/guest') },
  },
  build: {
    target: ['es2020', 'safari14', 'chrome87'],
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    sourcemap: false,
    rollupOptions: {
      input: {
        main: r('./index.html'),
        admin: r('./admin/index.html'),
      },
    },
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
