import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke + kiểm hạt né form (solution v1). Dùng Chrome/Edge đã cài trên máy (không tải browser):
 * PW_CHANNEL=msedge npm run test:e2e   (mặc định: chrome). Cần `npm run build` trước.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: process.env.PW_CHANNEL ?? 'chrome',
    ...devices['Pixel 7'],
    trace: 'off',
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
