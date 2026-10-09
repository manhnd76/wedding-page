import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke guest + admin. Dùng Chrome/Edge đã cài trên máy (không tải browser):
 * PW_CHANNEL=msedge npm run test:e2e   (mặc định: chrome). Cần `npm run build` trước.
 * Máy không có Chrome (vd Claude Code cloud): PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:e2e
 * Chạy song song nhiều bộ e2e (mỗi worktree một bộ): đặt PW_PREVIEW_PORT / PW_DEV_PORT khác nhau (mặc định 4173 / 5175).
 * - :4173 `vite preview` (bản build) - guest + admin chế độ không kết nối
 * - :5175 `vite dev` + dev-admin-save ghi vào thư mục tạm - admin chế độ Máy chủ dev
 */
const executablePath = process.env.PW_EXECUTABLE_PATH;
const previewPort = Number(process.env.PW_PREVIEW_PORT ?? 4173);
const devPort = Number(process.env.PW_DEV_PORT ?? 5175);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${previewPort}`,
    ...(executablePath ? { launchOptions: { executablePath } } : { channel: process.env.PW_CHANNEL ?? 'chrome' }),
    ...devices['Pixel 7'],
    trace: 'off',
  },
  webServer: [
    {
      command: `npx vite preview --port ${previewPort} --strictPort`,
      url: `http://localhost:${previewPort}`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'node scripts/e2e-dev-server.mjs',
      url: `http://localhost:${devPort}/admin/`,
      reuseExistingServer: false,
      timeout: 90_000,
    },
  ],
});
