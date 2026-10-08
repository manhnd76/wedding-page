/**
 * v2.2 - sửa UX admin (design-review-admin-v2). Điểm Cao: A02 trạng thái chưa xuất bản, A03 Hoàn tác trên mobile,
 * A04 tab Xem trước mobile không bị che/cắt ở 390×844, A07 không còn mã thô. Kèm A01, A05, A06, A08, A09, A12, A13,
 * A15 (không nạp lại preview khi đang ẩn), A20. Chỉ dùng chế độ không kết nối (bản build :4173), không gọi GitHub.
 */
import { expect, test, type Page } from '@playwright/test';
import {
  ALBUM_LAYOUTS, AUTO_SCROLL_MODES, BODY_FONTS, BURSTS_ON_OPEN, COUNTDOWN_FIREWORKS, COUNTDOWN_STYLES, COUPLE_ORDERS, DIVIDERS,
  ENVELOPE_STYLES, FONT_PRESETS, HEADING_FONTS, INTENSITIES, OPEN_STYLES, ORNAMENT_SETS, PARTICLE_TYPES, PHOTO_FRAMES, REVEAL_ATOMS,
  REVEAL_STYLES, SCRIPT_FONTS, TEXTURES, THEME_IDS, WISH_FLY,
} from '../../src/shared/config/enums';

async function fresh(page: Page) {
  await page.goto('/admin/');
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await new Promise<void>((r) => { const q = indexedDB.deleteDatabase('wp-admin'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  });
  await page.goto('/admin/');
}
async function offline(page: Page) {
  await fresh(page);
  await page.getByTestId('mode-download').click();
  await expect(page.getByTestId('save-status')).toBeVisible();
}
const preview = (page: Page) => page.frameLocator('iframe.pv-frame.is-active');

/** Mã enum không được hiện ra (giữ "kraft": từ thường dùng "giấy kraft"). */
const RAW = [...new Set<string>([
  ...THEME_IDS, ...ORNAMENT_SETS, ...TEXTURES, ...PHOTO_FRAMES, ...DIVIDERS, ...FONT_PRESETS, ...OPEN_STYLES, ...ENVELOPE_STYLES,
  ...AUTO_SCROLL_MODES, ...INTENSITIES, ...PARTICLE_TYPES, ...BURSTS_ON_OPEN, ...COUNTDOWN_FIREWORKS, ...REVEAL_STYLES, ...REVEAL_ATOMS,
  ...WISH_FLY, ...COUNTDOWN_STYLES, ...ALBUM_LAYOUTS, ...COUPLE_ORDERS, ...HEADING_FONTS, ...SCRIPT_FONTS, ...BODY_FONTS,
])].filter((v) => v !== 'kraft');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RAW_RE = RAW.map((v) => ({ v, re: new RegExp(`(?<![\\p{L}\\p{N}_-])${esc(v)}(?![\\p{L}\\p{N}_-])`, 'u') }));

/** Toàn bộ chữ admin đang có trong DOM (kể cả phần ẩn, option, aria-label), bỏ iframe/code/textarea. */
async function adminText(page: Page, sel = '.ed'): Promise<string> {
  return page.evaluate((s) => {
    const parts: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(s))) {
      const c = el.cloneNode(true) as HTMLElement;
      c.querySelectorAll('iframe, code, textarea, script, style').forEach((x) => x.remove());
      parts.push(c.textContent ?? '');
      c.querySelectorAll('[aria-label], [title]').forEach((x) => parts.push(x.getAttribute('aria-label') ?? '', x.getAttribute('title') ?? ''));
    }
    return parts.join('\n');
  }, sel);
}
const rawHits = (text: string) => RAW_RE.filter(({ re }) => re.test(text)).map(({ v }) => v);

test.describe('desktop 1360×900', () => {
  test.use({ viewport: { width: 1360, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  test('A02: chế độ không kết nối không bao giờ "Đã xuất bản"; top bar và Tổng quan cùng một câu', async ({ page }) => {
    await offline(page);
    const status = page.getByTestId('save-status');
    await expect(status).toContainText('Nháp trên máy này');
    await expect(status).not.toContainText('Đã xuất bản');
    await expect(page.getByTestId('ov-status')).toHaveText('Nháp trên máy này');
    await expect(page.getByTestId('ov-publish')).toHaveText('Tải gói xuất bản (.zip)'); // A19 cùng nhãn top bar
    await expect(page.getByTestId('publish-btn')).toContainText('Tải gói xuất bản (.zip)');
    await page.getByRole('link', { name: 'Chung' }).click();
    await page.getByTestId('f-meta.title').fill('Tiêu đề A02');
    await expect(status).toContainText('Có 1 thay đổi chưa tải gói');
    await page.getByRole('link', { name: 'Tổng quan' }).click();
    await expect(page.getByTestId('ov-status')).toHaveText('Có 1 thay đổi chưa tải gói');
  });

  test('A07: không còn mã thô (theme Son Đỏ, mọi mục, dialog xuất bản); A01 công tắc rộng 44px; A06 mũi tên mở/đóng', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await offline(page);
    // Son Đỏ gợi ý kiểu mở "scroll" chưa có -> nhãn ghi đúng cái khách thấy
    await page.goto('/admin/#/theme');
    await page.getByTestId('theme-son-do').click();
    await expect(page.getByTestId('theme-son-do')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.comp')).toContainText('Cuộn thư sẽ có ở bản sau');
    await page.goto('/admin/#/effects');
    await expect(page.getByTestId('open-theme')).toContainText('Theo theme (Phong bì · Cuộn thư sẽ có ở bản sau)');
    await page.getByTestId('open-card-flip').click();

    const hits: Record<string, string[]> = {};
    const routes = ['overview', 'general', 'theme', 'fonts', 'effects', 'music', 'sections', 'content', 'cover', 'hero', 'couple',
      'families', 'announcement', 'events', 'countdown', 'timeline', 'loveStory', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer',
      'media', 'links', 'backup'];
    for (const r of routes) {
      await page.goto(`/admin/#/${r}`);
      await expect(page.locator('#form-col h1').first()).toBeVisible();
      await page.waitForTimeout(150);
      const h = rawHits(await adminText(page));
      if (h.length) hits[r] = h;
    }
    // dialog xuất bản: diff dễ đọc
    await page.getByTestId('publish-btn').click();
    await expect(page.getByTestId('diff')).toContainText('Kiểu mở thiệp');
    await expect(page.getByTestId('diff')).toContainText('Lật thiệp');
    const d = rawHits(await adminText(page, 'dialog[open]'));
    if (d.length) hits['publish-dialog'] = d;
    expect(hits).toEqual({});
    await page.keyboard.press('Escape');

    // A01: công tắc trong form có rãnh 44px + chữ Bật/Tắt
    await page.goto('/admin/#/music');
    const tg = page.locator('.field--toggle .toggle').first();
    await expect(tg).toBeVisible();
    expect((await tg.locator('.toggle-track').boundingBox())!.width).toBeCloseTo(44, 0);
    await expect(tg.locator('.toggle-state')).toHaveText(/^(Bật|Tắt)$/);

    // A06: summary có mũi tên (::before) và cao ≥ 44px
    await page.goto('/admin/#/effects');
    const sum = page.locator('details.details > summary').first();
    expect(await sum.evaluate((el) => getComputedStyle(el, '::before').content)).toBe('""');
    expect((await sum.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(errors).toEqual([]);
  });

  test('A12: danh sách lặp - nút ↑↓ Xoá không nằm trong nút tiêu đề; dời xong focus giữ đúng thẻ; A09 lý do nút Lưu tắt', async ({ page }) => {
    await offline(page);
    await page.goto('/admin/#/events');
    const cards = page.locator('.list-field .card');
    await expect(cards.first()).toBeVisible();
    expect(await page.locator('.card-toggle button, summary button').count()).toBe(0);
    await expect(page.locator('.card-toggle').first()).toHaveAttribute('aria-expanded', /true|false/);
    if (await cards.count() >= 2) {
      const t0 = (await cards.nth(0).locator('.card-title').textContent())!;
      await cards.nth(0).getByRole('button', { name: `Đưa ${t0} xuống` }).click();
      await expect(cards.nth(1).locator('.card-title')).toHaveText(t0);
      // focus vẫn ở thẻ vừa dời (nút "xuống" bị tắt ở cuối -> focus nút "lên" của chính thẻ đó)
      await expect(page.locator(':focus')).toHaveAttribute('aria-label', new RegExp(`^Đưa ${t0.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (lên|xuống)$`));
    }
    // A09: màn Kết nối nói lý do nút Lưu đang tắt
    await fresh(page);
    await expect(page.getByTestId('conn-save')).toBeDisabled();
    await expect(page.getByTestId('conn-save-why')).toContainText('Hoàn tất bước 2');
  });
});

test.describe('mobile 390×844', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  test('A03: Hoàn tác từng bước ở top bar (44×44) + Làm lại trong Thêm; A13: danh sách nhóm 8 dòng', async ({ page }) => {
    await offline(page);
    // A13: chỉ 8 nhóm, không lặp mục con/Thêm
    await expect(page.locator('.sidebar .nav-a:visible')).toHaveCount(8);
    const undo = page.getByTestId('undo-btn');
    await expect(undo).toBeVisible();
    await expect(undo).toBeDisabled();
    const ub = (await undo.boundingBox())!;
    expect(ub.width).toBeGreaterThanOrEqual(44);
    expect(ub.height).toBeGreaterThanOrEqual(44);
    const tb = (await page.locator('.topbar').boundingBox())!;
    expect(ub.y).toBeGreaterThanOrEqual(tb.y - 1);
    expect(ub.y + ub.height).toBeLessThanOrEqual(tb.y + tb.height + 1);

    await page.getByRole('link', { name: 'Chung' }).click();
    const title = page.getByTestId('f-meta.title');
    const before = await title.inputValue();
    await title.fill('Tiêu đề thử hoàn tác');
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(title).toHaveValue(before);
    await page.getByTestId('tab-more').click();
    await page.getByTestId('redo-btn').click();
    await page.getByTestId('tab-edit').click();
    await expect(page.getByTestId('f-meta.title')).toHaveValue('Tiêu đề thử hoàn tác');
  });

  test('A04 + A15: tab Xem trước không bị top bar che, khung không bị cắt; không nạp lại preview khi đang ẩn', async ({ page }) => {
    await offline(page);
    const pv = page.getByTestId('pv');
    // đang ở tab Chỉnh sửa: preview ẩn -> chưa nạp iframe lần nào
    await page.waitForTimeout(800);
    expect(await pv.getAttribute('data-loads')).toBeNull();
    await page.getByRole('link', { name: 'Chung' }).click();
    await page.getByTestId('f-meta.title').fill('Ẩn thì không nạp');
    await page.waitForTimeout(800);
    expect(await pv.getAttribute('data-loads')).toBeNull();

    await page.getByTestId('tab-preview').click();
    await expect(preview(page).locator('main#main')).toBeAttached({ timeout: 15_000 });
    await expect(pv).toHaveAttribute('data-loads', '1');

    const top = (await page.locator('.topbar').boundingBox())!;
    const bar = (await page.getByTestId('pv-toolbar').boundingBox())!;
    const frame = (await page.locator('iframe.pv-frame.is-active').boundingBox())!;
    const tabs = (await page.locator('.bottom-tabs').boundingBox())!;
    expect(bar.y).toBeGreaterThanOrEqual(top.y + top.height - 1); // không bị top bar che
    expect(bar.height).toBeLessThanOrEqual(60); // 1 hàng
    // điểm giữa thanh công cụ thuộc thanh công cụ (không có gì đè lên)
    expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x!, y!)?.closest('[data-testid="pv-toolbar"]'), [bar.x + 30, bar.y + bar.height / 2])).toBe(true);
    expect(frame.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);
    expect(frame.x).toBeGreaterThanOrEqual(-1);
    expect(frame.width).toBeGreaterThanOrEqual(380); // phủ ngang, không khung điện thoại thu nhỏ
    expect(frame.x + frame.width).toBeLessThanOrEqual(391);
    expect(frame.y + frame.height).toBeLessThanOrEqual(tabs.y + 1); // không bị cắt đáy / bottom tab che
    expect(frame.height).toBeGreaterThan(500);
    await expect(page.getByRole('button', { name: '375px' })).toHaveCount(0);
    await expect(page.getByTestId('pv-replay')).toBeVisible();
    await expect(page.getByTestId('pv-skip-cover')).toBeVisible();
    await expect(page.locator('.back-to-edit')).toHaveCount(0);

    // quay lại Chỉnh sửa, sửa tiếp: không nạp; mở lại Xem trước: đúng 1 lần nạp với nháp mới nhất
    await page.getByTestId('tab-edit').click();
    await page.getByTestId('f-meta.title').fill('Sửa lần 2');
    await page.getByTestId('f-meta.title').fill('Sửa lần 3');
    await page.waitForTimeout(800);
    await expect(pv).toHaveAttribute('data-loads', '1');
    await page.getByTestId('tab-preview').click();
    await expect(pv).toHaveAttribute('data-loads', '2', { timeout: 15_000 });
    await page.waitForTimeout(800);
    await expect(pv).toHaveAttribute('data-loads', '2');
  });

  test('A05: chọn kiểu mở trên mobile -> toast [Xem ↗] -> tab Xem trước phát đúng hiệu ứng', async ({ page }) => {
    await offline(page);
    await page.getByRole('link', { name: 'Hiệu ứng' }).click();
    await page.getByTestId('open-card-flip').click();
    const view = page.locator('.toast').getByRole('button', { name: 'Xem ↗' });
    await expect(view).toBeVisible();
    await view.click();
    await expect(page.getByTestId('tab-preview')).toHaveAttribute('aria-pressed', 'true');
    await expect(preview(page).locator('.cover')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('.pv-now')).toContainText('Lật thiệp');
  });

  test('A08: Kết nối mobile có "Bước trước" và stepper quay về; A20: link khách dạng thẻ, không cuộn ngang', async ({ page }) => {
    await fresh(page);
    await expect(page.locator('.connect')).toHaveAttribute('data-step', '1');
    await page.locator('.cstep-1').getByRole('button', { name: 'Tiếp' }).click();
    await expect(page.locator('.connect')).toHaveAttribute('data-step', '2');
    await page.getByTestId('conn-owner').fill('minhanh');
    await page.getByTestId('cstep-back-2').click();
    await expect(page.locator('.connect')).toHaveAttribute('data-step', '1');
    await page.locator('.cstep-1').getByRole('button', { name: 'Tiếp' }).click();
    await expect(page.getByTestId('conn-owner')).toHaveValue('minhanh'); // giữ dữ liệu đã nhập
    await page.getByRole('button', { name: 'Quay lại bước 1: Tạo token' }).click();
    await expect(page.locator('.connect')).toHaveAttribute('data-step', '1');

    await page.getByTestId('mode-download').click();
    await page.getByTestId('tab-more').click();
    await page.getByRole('button', { name: /Link khách mời/ }).click();
    await page.getByTestId('links-names').fill('Gia đình anh Mạnh\nChị Hường và gia đình bên ngoại');
    await page.getByTestId('links-make').click();
    const copy = page.getByRole('button', { name: /^Sao chép link của/ }).first();
    await expect(copy).toBeVisible();
    expect((await copy.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
