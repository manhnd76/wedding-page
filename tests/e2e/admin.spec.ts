/**
 * Smoke admin (v2, v2.3): đăng nhập mật khẩu, chưa kết nối GitHub vẫn sửa/xem trước, Xuất bản -> màn Kết nối GitHub;
 * chế độ không kết nối (bản build :4173) và Máy chủ dev (:5175, ghi vào thư mục tạm), sửa text -> preview đổi,
 * bật/tắt section, xuất bản (zip / dev) + khôi phục, giao diện mobile. Không gọi GitHub thật.
 */
import { expect, test, type Page } from '@playwright/test';
import { ADMIN_PASSWORD, fresh, login, offline, openConnect } from './helpers';

const DEV = `http://localhost:${process.env.PW_DEV_PORT ?? 5175}`;

test.use({ viewport: { width: 1360, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

const preview = (page: Page) => page.frameLocator('iframe.pv-frame.is-active');

async function waitPreviewReady(page: Page) {
  await expect(page.locator('iframe.pv-frame.is-active')).toHaveCount(1);
  await expect(preview(page).locator('main#main')).toBeAttached({ timeout: 15_000 });
}

test('v2.3 đăng nhập: sai -> báo lỗi; đúng -> vào thẳng trang quản lý; sửa + xem trước không cần token; Xuất bản -> màn Kết nối GitHub', async ({ page }) => {
  const gh: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => { if (r.url().includes('api.github.com')) gh.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await fresh(page);
  await expect(page.getByRole('heading', { name: 'Quản lý thiệp cưới' })).toBeVisible();
  await expect(page.getByTestId('save-status')).toHaveCount(0);
  await page.getByTestId('login-pass').fill(`${ADMIN_PASSWORD}-sai`);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-err')).toContainText('Mật khẩu chưa đúng');
  await expect(page.getByTestId('save-status')).toHaveCount(0);
  // mật khẩu không nằm trong storage
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))).not.toContain(ADMIN_PASSWORD);
  await page.getByTestId('login-pass').fill(ADMIN_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('save-status')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('tb-mode')).toHaveText('Chưa kết nối GitHub');
  await expect(page.getByTestId('ov-hint')).toContainText('Chưa kết nối GitHub');
  await waitPreviewReady(page);

  // sửa text -> preview đổi, không cần token
  await page.getByRole('link', { name: 'Cô dâu & Chú rể' }).first().click();
  await page.getByTestId('f-content.couple.groom.fullName').fill('Quang Huy');
  await expect(preview(page).locator('#couple')).toContainText('Quang Huy', { timeout: 15_000 });
  await expect(page.getByTestId('save-status')).toContainText(/1 thay đổi|Đang lưu nháp/);

  // tải lại trang: vẫn đăng nhập (sessionStorage), nháp còn
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.getByTestId('save-status')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('link', { name: 'Cô dâu & Chú rể' }).first().click();
  await expect(page.getByTestId('f-content.couple.groom.fullName')).toHaveValue('Quang Huy');

  // Xuất bản khi chưa có token -> màn Kết nối GitHub (nói rõ lý do); Quay lại -> trang quản lý, nháp giữ nguyên
  await page.getByTestId('publish-btn').click();
  await expect(page.getByTestId('connect')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kết nối GitHub' })).toBeVisible();
  await expect(page.getByText('Để xuất bản, cần kết nối GitHub')).toBeVisible();
  await expect(page.locator('.ed')).toBeHidden();
  await expect(page.getByTestId('conn-check')).toBeDisabled();
  // dán link repo vào ô owner -> tự tách
  await page.getByTestId('conn-owner').fill('https://github.com/minhanh/wedding');
  await expect(page.getByTestId('conn-owner')).toHaveValue('minhanh');
  await expect(page.getByTestId('conn-repo')).toHaveValue('wedding');
  await expect(page.getByTestId('conn-save')).toBeDisabled();
  // bước 3 không còn passphrase riêng (mã hoá bằng mật khẩu đăng nhập)
  await expect(page.getByTestId('conn-pass')).toHaveCount(0);
  await expect(page.getByText('mã hoá bằng mật khẩu đăng nhập').first()).toBeAttached();
  await page.getByTestId('conn-cancel').click();
  await expect(page.getByTestId('connect')).toHaveCount(0);
  await expect(page.getByTestId('f-content.couple.groom.fullName')).toHaveValue('Quang Huy');
  // Sao lưu/Khôi phục khi chưa kết nối -> nút "Kết nối GitHub để khôi phục" mở cùng màn
  await page.getByRole('link', { name: 'Sao lưu/Khôi phục' }).click();
  await page.getByTestId('restore-connect').click();
  await expect(page.getByText('Bản sao lưu nằm trên GitHub, cần kết nối')).toBeVisible();
  await page.getByTestId('conn-cancel').click();
  expect(gh).toEqual([]);
  expect(errors).toEqual([]);

  // Đăng xuất -> màn Đăng nhập
  await page.locator('.nav-logout').click();
  await expect(page.getByTestId('login-pass')).toBeVisible();
});

test('bundle dist/ không chứa mật khẩu dạng rõ, chỉ có hash', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const path = await import('node:path');
  const files: string[] = [];
  const walk = (d: string) => { for (const n of readdirSync(d)) { const f = path.join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.(js|html|css|json|map|txt)$|_headers$/.test(n)) files.push(f); } };
  walk('dist');
  expect(files.length).toBeGreaterThan(10);
  const hits = files.filter((f) => readFileSync(f, 'utf8').includes(ADMIN_PASSWORD));
  expect(hits).toEqual([]);
  expect(files.some((f) => readFileSync(f, 'utf8').includes('pbkdf2-sha256$600000$'))).toBe(true);
});

test('chế độ không kết nối: sửa text -> preview đổi; bật/tắt section; tải gói .zip', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await offline(page);
  await expect(page.getByText('Chế độ không kết nối').first()).toBeVisible();
  await waitPreviewReady(page);

  // sửa tên chú rể -> preview (iframe guest thật) đổi
  await page.getByRole('link', { name: 'Cô dâu & Chú rể' }).first().click();
  const name = page.getByTestId('f-content.couple.groom.fullName');
  await name.fill('Quang Huy');
  await expect(preview(page).locator('#couple')).toContainText('Quang Huy', { timeout: 15_000 });
  // chế độ không kết nối: không bao giờ "Đã xuất bản" (A02)
  await expect(page.getByTestId('save-status')).toContainText(/thay đổi chưa tải gói|Đang lưu nháp/);

  // tắt section Album -> biến mất trong preview; bật lại -> hiện
  await page.getByRole('link', { name: 'Các phần & thứ tự' }).click();
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
  await expect(page.getByTestId('save-status')).toContainText('Đã tải gói xuất bản');
  expect(errors).toEqual([]);
});

test('chọn kiểu mở thiệp -> preview phát cover và báo xong (fx:replay / fx:done)', async ({ page }) => {
  await offline(page);
  await waitPreviewReady(page);
  await page.getByRole('link', { name: 'Hiệu ứng' }).click();
  await page.getByTestId('open-card-flip').click();
  await expect(page.locator('.pv-now')).toContainText('Đang phát');
  await expect(preview(page).locator('.cover')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('.pv-now')).toContainText('Đang xem', { timeout: 20_000 });
  await expect(preview(page).locator('.cover')).toHaveCount(0);
});

test('mẫu phong thư: gallery chọn mẫu -> preview phát cover với mẫu mới; phím mũi tên + Enter; Phát lại', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await offline(page);
  await waitPreviewReady(page);
  await page.getByRole('link', { name: 'Hiệu ứng' }).click();
  // gallery chỉ hiện khi kiểu mở resolve ra phong bì (không phụ thuộc theme mẫu)
  await page.getByTestId('open-envelope').click();
  const gal = page.getByRole('radiogroup', { name: 'Mẫu phong bì' });
  await expect(gal).toBeVisible();
  await expect(gal.getByRole('radio')).toHaveCount(7);
  await page.getByTestId('env-song-hy').click();
  await expect(page.getByTestId('env-song-hy')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.pv-now')).toContainText('Đang phát');
  await expect(preview(page).locator('.cover[data-env="song-hy"]')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('.pv-now')).toContainText('Đang xem', { timeout: 20_000 });
  // bàn phím: mũi tên duyệt, Enter chọn
  await page.getByTestId('env-song-hy').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('env-lace')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('env-lace')).toHaveAttribute('aria-checked', 'true');
  await expect(preview(page).locator('.cover[data-env="lace"]')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('.pv-now')).toContainText('Đang xem', { timeout: 20_000 });
  await page.getByTestId('pv-replay').click();
  await expect(preview(page).locator('.cover[data-env="lace"]')).toBeAttached({ timeout: 15_000 });
  // khối tự cuộn: phát lại trong preview -> khung preview cuộn xuống
  await page.getByTestId('as-replay').click();
  await expect.poll(async () => preview(page).locator('html').evaluate(() => window.scrollY), { timeout: 15_000 }).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});

test('máy chủ dev: xuất bản ghi vào thư mục (tạm), khôi phục = hoán đổi, bấm lại = làm lại', async ({ page }) => {
  await fresh(page, DEV);
  await login(page);
  await openConnect(page);
  await page.getByTestId('mode-dev').click();
  await expect(page.getByText('Máy chủ dev').first()).toBeVisible();
  await waitPreviewReady(page);
  const snap = () => page.evaluate(async () => (await (await fetch('/__admin/snapshot')).json()) as { config: { meta: { title: string }; publish: { id: string } }; manifest: { reason: string } | null });
  const title0 = (await snap()).config.meta.title;
  // config mẫu chưa từng xuất bản (publish.at rỗng) -> không được ghi "Đã xuất bản" (A02)
  if (!(await snap()).config.publish.id) await expect(page.getByTestId('save-status')).toContainText('Chưa xuất bản lần nào');

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
  await offline(page);
  await waitPreviewReady(page);
  await page.getByRole('link', { name: 'Link khách mời' }).click();
  await page.getByTestId('links-names').fill('Gia đình anh Mạnh\nChị Hường');
  await page.getByTestId('links-make').click();
  const table = page.getByTestId('links-table');
  await expect(table).toContainText('?to=Gia-đình-anh-Mạnh');
  await expect(table.getByRole('button', { name: /^Sao chép link của/ }).first()).toHaveAttribute('data-link', /\?to=Gia-đình-anh-Mạnh$/);
  await page.getByTestId('links-encode').check();
  await expect(table.getByRole('button', { name: /^Sao chép link của/ }).first()).toHaveAttribute('data-link', /\?to=Gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh$/);
  await expect(table).toContainText('?to=Gia-đình-anh-Mạnh'); // bảng vẫn dạng dễ đọc
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  test('bottom tab Chỉnh sửa · Xem trước · Thêm', async ({ page }) => {
    await offline(page);
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
  await offline(page);
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
  await offline(page);
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
