/**
 * v4a-2a: B1 reveal theo section + 4 gói + nguyên tử + micro (solution-v4a-2a.md 8.2, T1-T8).
 * Preview stash (`bootPreview`, máy khoẻ) hoặc bản build thường (`strongDevice`). Mọi test: 0 lỗi console.
 */
import { expect, test, type Page } from '@playwright/test';
import { bootPreview, strongDevice, watchConsole } from './fx-helpers';
import { offline } from './helpers';

const NO_PARTICLES = { particles: { enabled: false }, burst: { onOpen: 'none' } };
const fxDone = (page: Page) => page.evaluate(() => ((window as unknown as { __wpFxDone?: { target: string }[] }).__wpFxDone ?? []).map((x) => x.target));

/** Cuộn từng màn tới cuối bằng script (không phải thao tác người dùng). */
async function scrollAll(page: Page, wait = 250): Promise<void> {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y <= h; y += Math.round(vh * 0.6)) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(wait);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
}

test.describe('B1 reveal theo section', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('B1 data-rvp Tram Vang: khớp bảng design 2.4, phần thông tin = gói chính', async ({ page }) => {
    const errors = watchConsole(page);
    await bootPreview(page, { cover: { enabled: false } });
    await expect(page.locator('#couple[data-rvp]')).toHaveCount(1);
    const got = await page.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll<HTMLElement>('main .sec')).map((s) => [s.id, s.dataset.rvp])));
    expect(got).toEqual({
      hero: 'soft', couple: 'letter', families: 'editorial', announcement: 'letter', events: 'soft', countdown: 'soft', timeline: 'soft',
      album: 'editorial', gift: 'soft', guestbook: 'soft', rsvp: 'soft', thankyou: 'letter', footer: 'soft',
    });
    await expect(page.locator('#couple')).toHaveAttribute('data-rvs', 'auto');
    await expect(page.locator('#events')).toHaveAttribute('data-rvs', 'main');
    // gói tự động chỉ đổi tiêu đề + ảnh; khối chữ theo gói chính
    await expect(page.locator('#families .fam-col').first()).toHaveAttribute('data-rvk', 'soft');
    await expect(page.locator('#families .sec-head .h2')).toHaveAttribute('data-rvk', 'editorial');
    expect(errors).toEqual([]);
  });

  test('mask-up khong lo dau: heading ẦẪỂỖỮ ở trạng thái ẩn không có pixel mực', async ({ page }) => {
    const errors = watchConsole(page);
    await bootPreview(page, {
      theme: { preset: 'tram-vang' }, cover: { enabled: false },
      effects: { intensity: 'medium', reveal: { style: 'editorial', mode: 'uniform' }, ...NO_PARTICLES },
      content: { announcement: { heading: 'ẦẪỂỖỮ Thuỳ Ngọc' } },
    });
    await page.waitForFunction(() => !!(window as unknown as { __wpReveal?: unknown }).__wpReveal);
    await page.evaluate(() => (window as unknown as { __wpReveal: { hold(id: string): Promise<void> } }).__wpReveal.hold('announcement'));
    const h2 = page.locator('#announcement .sec-head .h2');
    await expect(h2.locator('.rv-ln').first()).toBeAttached();
    await expect(h2).toHaveAttribute('data-rva', 'mask-up');
    await h2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const clip = await h2.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const em = parseFloat(getComputedStyle(el).fontSize) * 0.6;
      return { x: Math.max(0, r.left - em), y: Math.max(0, r.top - em), width: r.width + 2 * em, height: r.height + 2 * em };
    });
    const a = await page.screenshot({ clip });
    await h2.evaluate((el) => el.style.setProperty('visibility', 'hidden'));
    const b = await page.screenshot({ clip });
    expect(a.equals(b)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('trang thai cuoi khong clip: hết wrapper tách, wipe/blur về none (build thường)', async ({ page }) => {
    const errors = watchConsole(page);
    await strongDevice(page);
    await page.goto('/?cover=0');
    await expect(page.locator('#couple[data-rvp="letter"]')).toHaveCount(1);
    await scrollAll(page);
    await page.waitForTimeout(2500);
    expect(await page.locator('.rv-ln, .rv-vis, .rv-w, .rv-c').count()).toBe(0);
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      // bỏ phần tử không hiển thị (ô album ngoài previewCount: `hidden`, chỉ hiện khi bấm "Xem tất cả")
      document.querySelectorAll<HTMLElement>('[data-rva="wipe"]').forEach((el) => {
        if (!el.offsetParent) return;
        const t = el.matches('[data-rv="image"]') ? el.querySelector('img') : el;
        if (t && getComputedStyle(t).clipPath !== 'none') out.push(`${el.className}: ${getComputedStyle(t).clipPath}`);
      });
      document.querySelectorAll<HTMLElement>('[data-rva="blur-in"]').forEach((el) => { if (getComputedStyle(el).filter !== 'none') out.push(`blur ${el.className}`); });
      return out;
    });
    expect(bad).toEqual([]);
    // có ít nhất 1 wipe (chữ ký / tiêu đề script / ảnh) để kiểm có nghĩa
    expect(await page.locator('[data-rva="wipe"]').count()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('reduced motion: không tách chữ/dòng, không filter, chỉ fade-fast', async ({ page }) => {
    const errors = watchConsole(page);
    await strongDevice(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?cover=0');
    await scrollAll(page, 120);
    await page.waitForTimeout(600);
    expect(await page.locator('.rv-w, .rv-c, .rv-ln').count()).toBe(0);
    const r = await page.evaluate(() => ({
      atoms: [...new Set(Array.from(document.querySelectorAll<HTMLElement>('[data-rva]')).map((e) => e.dataset.rva))],
      filters: Array.from(document.querySelectorAll('[data-rv="heading"]')).map((e) => getComputedStyle(e).filter).filter((f) => f !== 'none'),
    }));
    expect(r.atoms.every((a) => a === 'fade-fast')).toBe(true);
    expect(r.filters).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('fx replay reveal: reveal:families có fx:done; tour 3 phần ≤ 9s', async ({ page }) => {
    const errors = watchConsole(page);
    await bootPreview(page, { effects: NO_PARTICLES }, { target: 'reveal:families' });
    await expect.poll(() => fxDone(page), { timeout: 5000 }).toContain('reveal:families');
    await expect(page.locator('#families .sec-head .h2')).toHaveClass(/is-in/);
    const page2 = await page.context().newPage();
    const errors2 = watchConsole(page2);
    const t0 = Date.now();
    await bootPreview(page2, { effects: NO_PARTICLES }, { target: 'reveal' });
    await expect.poll(() => fxDone(page2), { timeout: 9000 }).toContain('reveal');
    expect(Date.now() - t0).toBeLessThan(9000 + 3000); // + thời gian tải trang
    expect([...errors, ...errors2]).toEqual([]);
  });
});

test.describe('CLS letter editorial', () => {
  for (const vp of [{ width: 1280, height: 800 }, { width: 375, height: 740 }]) {
    for (const style of ['letter', 'editorial']) {
      test(`CLS ${style} ${vp.width}px < 0.05`, async ({ page }) => {
        const errors = watchConsole(page);
        await page.setViewportSize(vp);
        await bootPreview(page, { cover: { enabled: false }, effects: { intensity: 'high', reveal: { style, mode: 'uniform' }, ...NO_PARTICLES } });
        await page.waitForFunction(() => !!(window as unknown as { __wpReveal?: unknown }).__wpReveal);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        await page.evaluate(async () => {
          await (window as unknown as { __wpReveal: { rearmAll(): Promise<void> } }).__wpReveal.rearmAll();
          const w = window as unknown as { __cls: number };
          w.__cls = 0;
          new PerformanceObserver((l) => {
            for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) w.__cls += e.value;
          }).observe({ type: 'layout-shift' });
        });
        await scrollAll(page, 350);
        await page.waitForTimeout(2500);
        const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
        expect(cls).toBeLessThan(0.05);
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('admin reveal block', () => {
  test.use({ viewport: { width: 1360, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  test('admin reveal block: Cách áp dụng, Từng phần, ghim + nhãn ở Các phần, deep link, Bỏ chọn riêng + Hoàn tác', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await offline(page);
    await page.goto('/admin/#/effects');
    const mode = page.getByRole('group', { name: 'Cách áp dụng' });
    await expect(mode.getByRole('radio', { name: 'Xen kẽ tự động' })).toBeChecked();
    await expect(page.getByTestId('rv-mode-help')).toContainText('Mềm mại · Tạp chí · Từng chữ');
    const sum = page.getByTestId('rv-summary');
    await expect(sum).toContainText('0 phần chọn riêng');
    await sum.click();
    const sel = page.locator('#rv-sec-families');
    await expect(sel).toBeVisible();
    await expect(sel.locator('option').first()).toHaveText('Tự động · Tạp chí');
    await sel.selectOption({ label: 'Tạp chí' });
    await expect(sum).toContainText('1 phần chọn riêng');
    await expect(page.getByTestId('rv-row-families')).toContainText('Chọn riêng');
    await expect(page.getByTestId('rv-row-events')).toContainText('Phần thông tin');
    const frame = page.frameLocator('iframe.pv-frame.is-active');
    await expect(frame.locator('#families[data-rvp="editorial"][data-rvs="pinned"]')).toHaveCount(1, { timeout: 15_000 });

    await page.goto('/admin/#/sections');
    const pin = page.getByRole('button', { name: 'Hiện: Tạp chí' });
    await expect(pin).toBeVisible();
    await pin.click();
    await expect(page.locator('#rv-sec-families')).toBeFocused();

    await page.getByRole('button', { name: 'Bỏ chọn riêng ở mọi phần (1)' }).click();
    await expect(sum).toContainText('0 phần chọn riêng');
    await page.locator('.toast').getByRole('button', { name: 'Hoàn tác' }).click();
    await expect(sum).toContainText('1 phần chọn riêng');
    await expect(page.locator('#rv-sec-families')).toHaveValue('editorial');
    expect(errors).toEqual([]);
  });
});

test.describe('micro smoke', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('micro smoke: thanh tiến độ theo cấp, vệt sáng CTA, odometer/slide, chạm đúp thả tim', async ({ page }) => {
    const errors = watchConsole(page);
    const base = { cover: { enabled: false }, effects: { ...NO_PARTICLES, micro: { scrollProgress: true, coupleHeartTap: true } } };
    // thanh tiến độ: Vừa có, giảm chuyển động có, Nhẹ không
    await bootPreview(page, base);
    await expect(page.locator('.scroll-prog')).toHaveCount(1, { timeout: 4000 });
    await bootPreview(page, base, { target: 'particles', simulate: { reducedMotion: true } });
    await expect(page.locator('.scroll-prog')).toHaveCount(1, { timeout: 4000 });
    await bootPreview(page, { ...base, effects: { ...base.effects, intensity: 'low' } });
    await page.waitForTimeout(2500);
    await expect(page.locator('.scroll-prog')).toHaveCount(0);
    // vệt sáng trên CTA đầu tiên
    await bootPreview(page, base, { target: 'micro:buttonShine' });
    await expect(page.locator('.is-shine').first()).toBeAttached({ timeout: 4000 });
    await expect(page.locator('.is-shine').first()).toHaveClass(/gift-btn|btn-primary/);
    // odometer: cửa sổ chữ số; slide: không lỗi
    await bootPreview(page, { ...base, content: { countdown: { style: 'odometer' } } }, { target: 'micro:countdown' });
    await expect(page.locator('#countdown .od-win').first()).toBeAttached({ timeout: 4000 });
    await bootPreview(page, { ...base, content: { countdown: { style: 'slide' } } }, { target: 'micro:countdown' });
    await expect.poll(() => fxDone(page), { timeout: 4000 }).toContain('micro:countdown');
    // chạm đúp ảnh cô dâu/chú rể -> tim rồi tự xoá ≤ 1s
    await bootPreview(page, base);
    await page.waitForTimeout(1800);
    const photo = page.locator('.person-photo').first();
    await photo.scrollIntoViewIfNeeded();
    await photo.dblclick();
    await expect(page.locator('.ht-heart')).toHaveCount(1);
    await expect(page.locator('.ht-heart')).toHaveCount(0, { timeout: 1000 });
    expect(errors).toEqual([]);
  });
});
