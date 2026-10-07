import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: { alias: { '@shared': r('./src/shared'), '@guest': r('./src/guest') } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
