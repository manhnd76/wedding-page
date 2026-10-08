/**
 * Smoke admin (v2): mở admin, chế độ không kết nối (bản build :4173) và Máy chủ dev (:5175, ghi vào thư mục tạm),
 * sửa text -> preview đổi, bật/tắt section, xuất bản (zip / dev) + khôi phục, giao diện mobile.
 * Không gọi GitHub thật.
 */
import { expect, test, type Page } from '@playwright/test';

const DEV = 'http://localhost:5175';

test.use({ viewport: { width: 1360, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

async function fresh(page: Page, base = '') {
  await page.goto(`${base}/admin/`);
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await new Promise<void>((r) => { const q = indexedDB.deleteDatabase('wp-admin'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  await page.goto(`${base}/admin/`);
}

const preview = (page: Page) => page.frameLocator('iframe.pv-frame.is-active');

async function waitPreviewReady(page: Page) {
  await expect(page.locator('iframe.pv-frame.is-active')).toHaveCount(1);
  await expect(preview(page).locator('main#main')).toBeAttached({ timeout: 15_000 });
}

test('không có kết nối: màn Kết nối lần đầu 3 bước, không gọi api.github.com', async ({ page }) => {
  const gh: string[] = [];
  page.on('request', (r) => { if (r.url().includes('api.github.com')) gh.push(r.url()); });
  await fresh(page);
  await expect(page.getByRole('heading', { name: 'Kết nối trang quản lý với GitHub' })).toBeVisible();
  await expect(page.getByTestId('conn-check')).toBeDisabled();
  // dán link repo vào ô owner -> tự tách
  await page.getByTestId('conn-owner').fill('https://github.com/minhanh/wedding');
  await expect(page.getByTestId('conn-owner')).toHaveValue('minhanh');
  await expect(page.getByTestId('conn-repo')).toHaveValue('wedding');
  await expect(page.getByTestId('conn-save')).toBeDisabled();
  expect(gh).toEqual([]);
});

test('chế độ không kết nối: sửa text -> preview đổi; bật/tắt section; tải gói .zip', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await fresh(page);
  await page.getByTestId('mode-download').click();
  await expect(page.getByText('Chế độ không kết nối').first()).toBeVisible();
  await waitPreviewReady(page);

  // sửa tên chú rể -> preview (iframe guest thật) đổi
  await page.getByRole('link', { name: 'Cô dâu & Chú rể' }).first().click();
  const name = page.getByTestId('f-content.couple.groom.fullName');
  await name.fill('Quang Huy');
  await expect(preview(page).locator('#couple')).toContainText('Quang Huy', { timeout: 15_000 });
  await expect(page.getByTestId('save-status')).toContainText(/thay đổi chưa xuất bản|Đang lưu nháp/);

  // tắt section Album -> biến mất trong preview; bật lại -> hiện
  await page.getByRole('link', { name: 'Sections' }).click();
  await expect(preview(page).locator('#album')).toBeAttached();
  await page.getByTestId('sec-toggle-album').uncheck();
  await expect(preview(page).locator('#album')).toHaveCount(0, { timeout: 15_000 });
  await page.getByTestId('sec-toggle-album').check();
  await expect(preview(page).locator('#album')).toBeAttached({ timeout: 15_000 });

  // sắp xếp bằng nút ↑ (thay kéo thả)
  const order = () => page.locator('[data-testid="sections-list"] > li').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
  const o1 = await order();
  await page.getByRole('button', { name: 'Đưa Đếm ngược lên' }).click();
  const o2 = await order();
  const i = o1.indexOf('sec-countdown');
  expect(o2.indexOf('sec-countdown')).toBe(i - 1);
  expect(o2[0]).toBe('sec-hero');
  expect(o2.at(-1)).toBe('sec-footer');
  // preview theo thứ tự mới
  await expect.poll(async () => preview(page).locator('main > .sec').evaluateAll((els) => els.map((e) => e.id)), { timeout: 15_000 })
    .toEqual(o2.map((x) => x!.slice(4)).filter((id) => id !== 'loveStory'));

  // nháp còn sau khi tải lại trang (IndexedDB)
  await page.waitForTimeout(1200);
  await page.reload();
  await page.getByRole('link', { name: 'Cô dâu & Chú rể' }).first().click();
  await expect(page.getByTestId('f-content.couple.groom.fullName')).toHaveValue('Quang Huy');

  // xuất bản ở chế độ không kết nối = tải gói .zip (checklist + diff trước)
  await page.getByTestId('publish-btn').click();
  await expect(page.getByTestId('diff')).toContainText('Quang Huy');
  const dl = page.waitForEvent('download');
  await page.getByTestId('publish-confirm').click();
  expect((await dl).suggestedFilename()).toMatch(/\.zip$/);
  expect(errors).toEqual([]);
});

test('chọn kiểu mở thiệp -> preview phát cover và báo xong (fx:replay / fx:done)', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('mode-download').click();
  await waitPreviewReady(page);
  await page.getByRole('link', { name: 'Hiệu ứng' }).click();
  await page.getByTestId('open-card-flip').click();
  await expect(page.locator('.pv-now')).toContainText('Đang phát');
  await expect(preview(page).locator('.cover')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('.pv-now')).toContainText('Đang xem', { timeout: 20_000 });
  await expect(preview(page).locator('.cover')).toHaveCount(0);
});

test('máy chủ dev: xuất bản ghi vào thư mục (tạm), khôi phục = hoán đổi, bấm lại = làm lại', async ({ page }) => {
  await fresh(page, DEV);
  await page.getByTestId('mode-dev').click();
  await expect(page.getByText('Máy chủ dev').first()).toBeVisible();
  await waitPreviewReady(page);
  const snap = () => page.evaluate(async () => (await (await fetch('/__admin/snapshot')).json()) as { config: { meta: { title: string }; publish: { id: string } }; manifest: { reason: string } | null });
  const title0 = (await snap()).config.meta.title;

  await page.getByRole('link', { name: 'Chung' }).click();
  await page.getByTestId('f-meta.title').fill('Tiêu đề thử E2E');
  await page.getByTestId('publish-btn').click();
  await page.getByTestId('publish-confirm').click();
  await expect(page.getByText(/Đã xuất bản!/).first()).toBeVisible({ timeout: 15_000 });
  const s1 = await snap();
  expect(s1.config.meta.title).toBe('Tiêu đề thử E2E');
  expect(s1.manifest?.reason).toBe('publish');
  await page.getByRole('button', { name: 'Đóng' }).last().click();

  // khôi phục: dialog 2 bước
  await page.getByRole('link', { name: 'Sao lưu/Khôi phục' }).click();
  await page.getByTestId('restore-btn').click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByTestId('restore-confirm').click();
  await expect(page.getByTestId('restore-btn')).toHaveText('Làm lại (quay về bản vừa thay)', { timeout: 15_000 });
  expect((await snap()).config.meta.title).toBe(title0);
  // bấm lại = làm lại
  await page.getByTestId('restore-btn').click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByTestId('restore-confirm').click();
  await expect.poll(async () => (await snap()).config.meta.title, { timeout: 15_000 }).toBe('Tiêu đề thử E2E');
});

test('link khách: giữ dấu mặc định, toggle Mã hoá link, CSV', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('mode-download').click();
  await waitPreviewReady(page);
  await page.getByRole('link', { name: 'Link khách mời' }).click();
  await page.getByTestId('links-names').fill('Gia đình anh Mạnh\nChị Hường');
  await page.getByTestId('links-make').click();
  const table = page.getByTestId('links-table');
  await expect(table).toContainText('?to=Gia-đình-anh-Mạnh');
  await expect(table.getByRole('button', { name: 'Chép' }).first()).toHaveAttribute('data-link', /\?to=Gia-đình-anh-Mạnh$/);
  await page.getByTestId('links-encode').check();
  await expect(table.getByRole('button', { name: 'Chép' }).first()).toHaveAttribute('data-link', /\?to=Gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh$/);
  await expect(table).toContainText('?to=Gia-đình-anh-Mạnh'); // bảng vẫn dạng dễ đọc
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  test('bottom tab Chỉnh sửa · Xem trước · Thêm', async ({ page }) => {
    await fresh(page);
    await page.getByTestId('mode-download').click();
    await expect(page.getByTestId('tab-edit')).toBeVisible();
    await page.getByRole('link', { name: 'Chung' }).click();
    await expect(page.getByTestId('f-meta.title')).toBeVisible();
    const box = await page.getByTestId('f-meta.title').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    await page.getByTestId('tab-preview').click();
    await expect(page.locator('iframe.pv-frame.is-active')).toBeVisible();
    await page.getByTestId('tab-more').click();
    await expect(page.getByRole('button', { name: /Sao lưu\/Khôi phục/ })).toBeVisible();
  });
});

test('mọi mục quản lý mở được, không lỗi JS; đổi theme cập nhật preview', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await fresh(page);
  await page.getByTestId('mode-download').click();
  await waitPreviewReady(page);
  for (const r of ['overview', 'general', 'theme', 'fonts', 'effects', 'music', 'sections', 'content', 'cover', 'hero', 'events', 'gift', 'album', 'media', 'links', 'backup', 'json']) {
    await page.goto(`/admin/#/${r}`);
    await expect(page.locator('#form-col h1').first()).toBeVisible();
  }
  await page.goto('/admin/#/theme');
  const other = page.locator('.tcard[aria-checked="false"]').first();
  const id = (await other.getAttribute('data-testid'))!.replace('theme-', '');
  await other.click();
  await expect(preview(page).locator('html')).toHaveAttribute('data-theme', id, { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('CSP production của /admin/* (dist/_headers): không vi phạm, preview guest chạy dưới CSP khách', async ({ page }) => {
  const { readFileSync } = await import('node:fs');
  const lines = readFileSync('dist/_headers', 'utf8').split('\n');
  const pick = (start: number) => lines.slice(start).find((l) => l.trim().startsWith('Content-Security-Policy:'))!.split('Content-Security-Policy:')[1]!.trim();
  const guestCsp = pick(0);
  const adminCsp = pick(lines.findIndex((l) => l.startsWith('/admin/*')));
  expect(adminCsp).toContain('connect-src');
  expect(adminCsp).not.toContain('unsafe-inline');
  const violations: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  await page.route('**/*', async (route) => {
    const res = await route.fetch();
    const h = { ...res.headers() };
    if ((h['content-type'] ?? '').includes('text/html')) h['content-security-policy'] = new URL(route.request().url()).pathname.startsWith('/admin') ? adminCsp : guestCsp;
    await route.fulfill({ response: res, headers: h });
  });
  await fresh(page);
  await page.getByTestId('mode-download').click();
  await waitPreviewReady(page);
  await page.goto('/admin/#/theme');
  await page.locator('.tcard[aria-checked="false"]').first().click();
  await page.goto('/admin/#/effects');
  await page.getByTestId('open-envelope').click();
  await expect(page.locator('.pv-now')).toContainText('Đang phát');
  await expect(preview(page).locator('.cover')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('.pv-now')).toContainText('Đang xem', { timeout: 20_000 });
  expect(violations).toEqual([]);
});
