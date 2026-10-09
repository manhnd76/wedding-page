/**
 * v4a-2b: 13 kiểu mở thiệp + E12 + admin (solution-v4a-2bc.md 4.2, 5). Chạy bằng preview stash (`bootPreview`, máy khoẻ
 * giả lập) trên bản build, viewport 360×740, khách "Nguyễn Thuỳ Linh". Đo bằng thời gian animation (WAAPI), không đo đồng hồ
 * treo tường (trừ ngưỡng gỡ cover khi tua nhanh).
 */
import { expect, test, type Page } from '@playwright/test';
import { bootPreview, remainingAfterFastForward, tapOpen, watchConsole } from './fx-helpers';
import { offline } from './helpers';

const GUEST = 'Nguyễn Thuỳ Linh';
/** Thời lượng mức Vừa theo design-v4a-2bc §2 (ms). */
const DESIGN_MS: Record<string, number> = {
  curtain: 1250, 'wax-seal': 1700, origami: 1800, 'double-door': 1600, 'flower-gate': 1800, scroll: 2100, 'card-3d': 1400,
  'light-gather': 2400, 'gift-box': 1900, 'moon-gate': 1600, book: 1800, 'ink-spread': 1200, polaroid: 2200,
};
const STYLES = Object.keys(DESIGN_MS);
/** Số hạt trên cover ở mức Nhiều (design-v4a-2bc §2; flower-gate = burst cánh hoa 40, light-gather = canvas riêng). */
const RICH_SPARKS: Record<string, number> = { curtain: 16, 'wax-seal': 14, origami: 24, 'double-door': 20, 'flower-gate': 40, scroll: 12, 'gift-box': 80, 'moon-gate': 12 };
const ALLOWED = ['transform', 'opacity', 'clipPath', 'zIndex', 'translate', 'scale', 'rotate', 'strokeDashoffset', 'maskSize', 'webkitMaskSize', 'maskPosition', 'webkitMaskPosition'];

test.use({ viewport: { width: 360, height: 740 } });

interface Watch { total: number; level: string; effective: string; viol: string[]; props: string[]; maxBursts: number; goneMs: number; canvas: boolean }

async function open(page: Page, patch: object, fx: Parameters<typeof bootPreview>[2] = null): Promise<string[]> {
  const errors = watchConsole(page);
  await bootPreview(page, patch, fx, { guestName: GUEST });
  await page.locator('.cover').waitFor({ state: 'attached' });
  return errors;
}

/**
 * Chạm mở rồi lấy mẫu mỗi 100ms tới khi cover gỡ: tổng thời lượng (endTime/playbackRate lớn nhất), hộp `.cv-names`/`.cv-guest`
 * khi đang hiện (opacity cộng dồn > .1) phải nằm trọn trong viewport, thuộc tính được animate, đỉnh số hạt burst.
 */
async function tapAndWatch(page: Page): Promise<Watch> {
  await tapOpen(page);
  return page.evaluate(async () => {
    const w = window as unknown as { __wpCover: { level: string; effective: string }; __wpFx?: { snapshot: () => { bursts: unknown[] } | undefined } };
    const t0 = performance.now();
    let total = 0;
    let maxBursts = 0;
    const viol: string[] = [];
    const props = new Set<string>();
    const vis = (el: Element | null) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
    const { level, effective } = w.__wpCover;
    await new Promise<void>((done) => {
      const tick = () => {
        const c = document.querySelector('.cover');
        const snap = w.__wpFx?.snapshot();
        if (snap) maxBursts = Math.max(maxBursts, snap.bursts.length);
        if (!c) { done(); return; }
        // chỉ animation của kiểu mở (WAAPI); bỏ CSS transition/animation (vd tên hiện dần khi font tải xong, nút "thở")
        for (const a of c.getAnimations({ subtree: true }).filter((x) => !(x instanceof CSSTransition) && !(x instanceof CSSAnimation))) {
          total = Math.max(total, Number(a.effect?.getComputedTiming().endTime ?? 0) / Math.abs(a.playbackRate || 1));
          for (const k of (a.effect as KeyframeEffect).getKeyframes()) for (const p of Object.keys(k)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(p)) props.add(p);
        }
        c.querySelectorAll('.cv-names, .cv-guest').forEach((el) => {
          if (vis(el) <= 0.1) return;
          const r = el.getBoundingClientRect();
          if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) {
            viol.push(`${el.className}@${Math.round(performance.now() - t0)}ms: ${[r.left, r.top, r.right, r.bottom].map(Math.round).join(',')}`);
          }
        });
        setTimeout(tick, 100);
      };
      tick();
    });
    return { total, level, effective, viol, props: [...props], maxBursts, goneMs: performance.now() - t0, canvas: !!document.querySelector('.fx-canvas') };
  });
}

test.describe('13 kiểu mở - mức Vừa / tua nhanh / Nhẹ / Nhiều / Tắt', () => {
  for (const id of STYLES) {
    test(`${id}: Vừa ≤ 2.4s (±15% design), tên không bị cắt khỏi màn, chỉ animate thuộc tính cho phép`, async ({ page }) => {
      const errors = await open(page, { cover: { openStyle: id }, effects: { intensity: 'medium' } });
      await expect(page.locator('.cover .cv-guest')).toHaveText(GUEST);
      const r = await tapAndWatch(page);
      expect(r.level).toBe('full');
      expect(r.effective).toBe(id);
      expect(r.total).toBeLessThanOrEqual(2400);
      expect(Math.abs(r.total - DESIGN_MS[id]!) / DESIGN_MS[id]!).toBeLessThanOrEqual(0.15);
      expect(r.viol).toEqual([]);
      for (const p of r.props) expect(ALLOWED, p).toContain(p);
      await expect(page.locator('#main')).toBeVisible();
      expect(errors).toEqual([]);
    });

    test(`${id}: chạm lần 2 -> phần còn lại ≤ 300ms, cover gỡ ≤ 450ms`, async ({ page }) => {
      await open(page, { cover: { openStyle: id }, effects: { intensity: 'medium' } });
      // mốc chạm lần 2 = click capture trên cover khi đang mở; cover gỡ = MutationObserver trên body
      await page.evaluate(() => {
        const w = window as unknown as { __ffGone: Promise<number> };
        w.__ffGone = new Promise((res) => {
          const cover = document.querySelector('.cover')!;
          let t0 = 0;
          cover.addEventListener('click', () => { if (cover.classList.contains('is-opening') && !t0) t0 = performance.now(); }, { capture: true });
          new MutationObserver((_, mo) => { if (!cover.isConnected) { mo.disconnect(); res(performance.now() - t0); } }).observe(document.body, { childList: true });
        });
      });
      const rem = await remainingAfterFastForward(page, Math.round(DESIGN_MS[id]! * 0.3));
      expect(rem).toBeLessThanOrEqual(300);
      // thời gian thật từ chạm lần 2 tới khi cover gỡ, đo TRONG trang (không cộng độ trễ vòng gọi của Playwright)
      const gone = await page.evaluate(() => (window as unknown as { __ffGone: Promise<number> }).__ffGone);
      expect(gone).toBeLessThanOrEqual(450);
    });

    test(`${id}: Nhẹ ngắn hơn Vừa, không hạt; Nhiều ≤ 2.4s (+ hạt nếu có)`, async ({ page }) => {
      await open(page, { cover: { openStyle: id }, effects: { intensity: 'low' } });
      const lo = await tapAndWatch(page);
      expect(lo.level).toBe('light');
      expect(lo.total).toBeLessThan(DESIGN_MS[id]!);
      // light-gather Nhẹ = fade-zoom + 12 hạt lấp lánh (design §2.8); kiểu khác Nhẹ không có hạt
      expect(lo.maxBursts).toBe(id === 'light-gather' ? 12 : 0);
      expect(lo.viol).toEqual([]);
      await open(page, { cover: { openStyle: id }, effects: { intensity: 'high' } });
      const hi = await tapAndWatch(page);
      expect(hi.level).toBe('full+');
      expect(hi.total).toBeLessThanOrEqual(2400);
      expect(hi.viol).toEqual([]);
      if (RICH_SPARKS[id]) expect(hi.maxBursts).toBeGreaterThanOrEqual(RICH_SPARKS[id]!);
    });

    test(`${id}: Tắt -> fade ≤ 200ms, không canvas hạt, hình tĩnh của kiểu vẫn dựng`, async ({ page }) => {
      await open(page, { cover: { openStyle: id }, effects: { intensity: 'off' } });
      await page.waitForFunction(() => document.querySelector('.cover')?.classList.contains('is-skin'));
      if (id !== 'light-gather') expect(await page.locator('.cover :is(.op-layers, .op-stage) > *').count()).toBeGreaterThan(0);
      const r = await tapAndWatch(page);
      expect(r.level).toBe('fade200');
      expect(r.total).toBeLessThanOrEqual(200);
      expect(r.canvas).toBe(false);
    });
  }
});

test.describe('giảm chuyển động / máy yếu / module lỗi', () => {
  for (const id of ['curtain', 'wax-seal', 'light-gather', 'ink-spread']) {
    test(`${id}: prefers-reduced-motion -> fade ≤ 200ms, không canvas`, async ({ page }) => {
      await open(page, { cover: { openStyle: id }, effects: { intensity: 'high' } }, { target: 'cover', simulate: { reducedMotion: true } });
      await page.waitForFunction(() => document.querySelector('.cover')?.classList.contains('is-opening'), null, { timeout: 8000 });
      const r = await page.evaluate(() => {
        const c = document.querySelector('.cover');
        const anims = (c?.getAnimations({ subtree: true }) ?? []).filter((x) => !(x instanceof CSSTransition) && !(x instanceof CSSAnimation));
        const total = Math.max(0, ...anims.map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0)));
        return { total, level: (window as unknown as { __wpCover: { level: string } }).__wpCover.level };
      });
      expect(r.level).toBe('fade200');
      expect(r.total).toBeLessThanOrEqual(200);
      await page.locator('.cover').waitFor({ state: 'detached' });
      expect(await page.locator('.fx-canvas').count()).toBe(0);
    });
  }

  test('máy yếu: light-gather -> fade-zoom; kiểu chi phí Vừa ở Nhiều -> bản Nhẹ', async ({ page }) => {
    await open(page, { cover: { openStyle: 'light-gather' }, effects: { intensity: 'high' } }, { target: 'cover', simulate: { lowEnd: true } });
    await page.waitForFunction(() => !!(window as unknown as { __wpCover?: unknown }).__wpCover);
    expect(await page.evaluate(() => (window as unknown as { __wpCover: { effective: string } }).__wpCover.effective)).toBe('fade-zoom');
    await open(page, { cover: { openStyle: 'wax-seal' }, effects: { intensity: 'high' } }, { target: 'cover', simulate: { lowEnd: true } });
    await page.waitForFunction(() => !!(window as unknown as { __wpCover?: unknown }).__wpCover);
    expect(await page.evaluate(() => (window as unknown as { __wpCover: { level: string } }).__wpCover.level)).toBe('light');
  });

  test('module kiểu mở lỗi tải -> vẫn mở bằng fade-zoom, không lỗi JS', async ({ page }) => {
    await page.route(/\/assets\/wax-seal-[\w-]+\.js$/, (route) => route.abort());
    const errors = await open(page, { cover: { openStyle: 'wax-seal' }, effects: { intensity: 'medium' } });
    const r = await tapAndWatch(page);
    expect(r.total).toBeGreaterThan(600);
    expect(r.total).toBeLessThanOrEqual(800);
    await expect(page.locator('#main')).toBeVisible();
    expect(errors.filter((e) => !/Failed to load resource|net::ERR_FAILED|Failed to fetch dynamically imported module/.test(e))).toEqual([]);
  });
});

test.describe('E12 - mức Nhiều riêng 6 mẫu phong thư', () => {
  const COUNT: Record<string, number> = { classic: 12, kraft: 10, 'song-hy': 32, lace: 12, minimal: 10, velvet: 16 };
  for (const [style, n] of Object.entries(COUNT)) {
    test(`${style}: Nhiều có ${n} hạt trên cover, thời lượng lệch ≤ 50ms so với Vừa`, async ({ page }) => {
      await open(page, { cover: { openStyle: 'envelope', envelope: { style } }, effects: { intensity: 'medium' } });
      const mid = await tapAndWatch(page);
      expect(mid.maxBursts).toBe(style === 'lace' ? 6 : 0);
      await open(page, { cover: { openStyle: 'envelope', envelope: { style } }, effects: { intensity: 'high' } });
      const hi = await tapAndWatch(page);
      expect(hi.level).toBe('full+');
      expect(hi.maxBursts).toBeGreaterThanOrEqual(n);
      expect(Math.abs(hi.total - mid.total)).toBeLessThanOrEqual(50);
      expect(hi.viol).toEqual([]);
    });
  }
});

test.describe('admin - gallery 17 kiểu mở', () => {
  test.use({ viewport: { width: 1360, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  test('17 thẻ + "Theo theme"; badge Nặng ⚠ + ghi chú ở light-gather; chọn wax-seal -> preview phát đúng kiểu', async ({ page }) => {
    await offline(page);
    await expect(page.locator('iframe.pv-frame.is-active')).toHaveCount(1);
    await page.goto('/admin/#/effects');
    const cards = page.locator('.ogrid[aria-label="Kiểu mở thiệp"] [role="radio"]');
    await expect(cards).toHaveCount(18);
    await expect(page.getByTestId('open-light-gather')).toContainText('Nặng ⚠');
    await expect(page.getByTestId('open-heavy-note')).toHaveCount(0);
    await page.getByTestId('open-light-gather').click();
    await expect(page.getByTestId('open-heavy-note')).toBeVisible();
    await page.getByTestId('open-wax-seal').click();
    await expect(page.getByTestId('open-heavy-note')).toHaveCount(0);
    const pv = page.frameLocator('iframe.pv-frame.is-active');
    await expect(pv.locator('.cover[data-open="wax-seal"]')).toBeAttached({ timeout: 15_000 });
    await expect(page.locator('.pv-now')).toContainText('Đang xem', { timeout: 20_000 });
  });
});
