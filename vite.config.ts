import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { injectConfigOg } from './scripts/vite-plugins/inject-config-og.ts';
import { devAdminSave } from './scripts/vite-plugins/dev-admin-save.ts';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: '/',
  // e2e chạy dev server thứ 2 (cổng 5175): tách thư mục cache deps để không đụng dev server :5173 đang chạy
  cacheDir: process.env.WP_VITE_CACHE_DIR || 'node_modules/.vite',
  // devAdminSave: chỉ chạy ở `vite dev` (apply: 'serve') - phương án B lưu trữ
  plugins: [injectConfigOg(), devAdminSave()],
  resolve: {
    alias: { '@shared': r('./src/shared'), '@guest': r('./src/guest'), '@admin': r('./src/admin') },
  },
  // admin: Preact JSX (không cần @preact/preset-vite - Vite 8 tự biên dịch JSX bằng Oxc)
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  build: {
    target: ['es2020', 'safari14', 'chrome87'],
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    sourcemap: false,
    // SVG trong theme-assets (ornament/divider/frame/texture/motif) luôn ra file riêng, không inline data URI
    // (solution.md Rev 5 mục 10, Còn mở #18); file khác theo mặc định của Vite.
    assetsInlineLimit: (file) => (/[\\/]theme-assets[\\/]/.test(file) ? false : undefined),
    rollupOptions: {
      input: {
        main: r('./index.html'),
        admin: r('./admin/index.html'),
      },
      output: {
        // helper dùng chung của các kiểu mở (src/guest/cover/open-kit/**) -> đúng 1 chunk `open-kit`
        // (solution-v4a-2bc.md 0.6). Không kéo theo phụ thuộc (anim.ts, dom.ts... đã ở entry).
        codeSplitting: {
          groups: [{ name: 'open-kit', test: /[\\/]src[\\/]guest[\\/]cover[\\/]open-kit[\\/]/, includeDependenciesRecursively: false }],
        },
      },
    },
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
