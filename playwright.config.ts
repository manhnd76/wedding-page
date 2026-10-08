import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke guest + admin. Dùng Chrome/Edge đã cài trên máy (không tải browser):
 * PW_CHANNEL=msedge npm run test:e2e   (mặc định: chrome). Cần `npm run build` trước.
 * - :4173 `vite preview` (bản build) - guest + admin chế độ không kết nối
 * - :5175 `vite dev` + dev-admin-save ghi vào thư mục tạm - admin chế độ Máy chủ dev
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: process.env.PW_CHANNEL ?? 'chrome',
    ...devices['Pixel 7'],
    trace: 'off',
  },
  webServer: [
    {
      command: 'npx vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'node scripts/e2e-dev-server.mjs',
      url: 'http://localhost:5175/admin/',
      reuseExistingServer: false,
      timeout: 90_000,
    },
  ],
});
