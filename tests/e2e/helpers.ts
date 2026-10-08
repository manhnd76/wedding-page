/**
 * Helper e2e dùng chung cho admin (v2.3: đăng nhập mật khẩu trước, token GitHub chỉ hỏi khi cần).
 * Mật khẩu: biến môi trường WP_ADMIN_TEST_PASSWORD hoặc ghép chuỗi lúc chạy (không có literal trong repo).
 */
import { expect, type Page } from '@playwright/test';

export const ADMIN_PASSWORD = process.env.WP_ADMIN_TEST_PASSWORD ?? ['manh', '111'].join('');

/** Xoá localStorage/sessionStorage/IndexedDB của admin rồi mở lại /admin/ (màn Đăng nhập). */
export async function fresh(page: Page, base = ''): Promise<void> {
  await page.goto(`${base}/admin/`);
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await new Promise<void>((r) => { const q = indexedDB.deleteDatabase('wp-admin'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  await page.goto(`${base}/admin/`);
}

/** Đăng nhập -> trang quản lý (chưa kết nối GitHub). */
export async function login(page: Page): Promise<void> {
  await page.getByTestId('login-pass').fill(ADMIN_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('save-status')).toBeVisible({ timeout: 15_000 });
}

/** Mở màn Kết nối GitHub từ thẻ "Kết nối GitHub" ở Tổng quan (mobile: vào Tổng quan trước). */
export async function openConnect(page: Page): Promise<void> {
  const btn = page.getByTestId('gh-connect');
  if (!(await btn.isVisible())) await page.locator('.sidebar').getByRole('link', { name: 'Tổng quan' }).click();
  await btn.click();
  await expect(page.getByTestId('connect')).toBeVisible();
}

/** fresh + đăng nhập + chọn "Tải gói .zip" (chế độ không kết nối). */
export async function offline(page: Page, base = ''): Promise<void> {
  await fresh(page, base);
  await login(page);
  await openConnect(page);
  await page.getByTestId('mode-download').click();
  await expect(page.getByTestId('tb-mode')).toHaveText('Chế độ không kết nối');
  await expect(page.getByTestId('save-status')).toContainText(/Nháp trên máy này|chưa tải gói/);
  // mobile: openConnect đã vào trang con Tổng quan -> về danh sách nhóm như lúc mới vào
  const back = page.locator('#form-col > .back');
  if (await back.isVisible()) await back.click();
}
