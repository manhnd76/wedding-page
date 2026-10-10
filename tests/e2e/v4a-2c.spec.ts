/**
 * v4a-2c: 16 hạt nền + 4 burst + admin (solution-v4a-2bc.md 4.2, 5). Chạy bằng preview stash (`bootPreview`, preview tự coi
 * máy khoẻ) trên bản build, viewport 360×740.
 */
import { expect, test, type Page } from '@playwright/test';
import { bootPreview, fxSnap, watchConsole, type FxSnapshot } from './fx-helpers';
import { offline } from './helpers';

test.use({ viewport: { width: 360, height: 740 } });

/** Loại hạt -> theme gợi ý loại đó (presets.ts `suggest.particles`); loại không theme nào gợi ý -> tram-vang. */
const KINDS: Record<string, string> = {
  'petal-sakura': 'pastel-han', 'petal-lotus': 'sen-cham', 'petal-dried': 'hoai-co', 'petal-watercolor': 'mau-nuoc',
  plumeria: 'bien-dao', 'paper-heart': 'hong-phan', 'leaf-green': 'mau-nuoc', 'leaf-eucalyptus': 'luc-bao', 'leaf-maple': 'dat-nung',
  pampas: 'dat-nung', snow: 'tram-vang', bubble: 'bien-dao', sparkle: 'dem-nhung', 'ink-dot': 'muc-giay', 'dust-mote': 'hoai-co', 'red-paper': 'son-do',
};

const particles = (theme: string, id: string, intensity = 'medium') =>
  ({ theme: { preset: theme }, effects: { intensity, particles: { enabled: true, types: [id], color: 'theme', scope: 'all' } } });

/** Số điểm ảnh có alpha > 0 trên canvas hạt (sprite thật sự vẽ ra, không trống). */
const inkPixels = (page: Page) => page.evaluate(() => {
  const c = document.querySelector<HTMLCanvasElement>('.fx-canvas');
  if (!c) return -1;
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++;
  return n;
});

test.describe('16 loại hạt nền - mức Vừa trên theme gợi ý', () => {
  for (const [id, theme] of Object.entries(KINDS)) {
    test(`${id} (${theme}): có hạt trong 3s, alpha ≤ 1, ≤ 40 hạt, canvas có vẽ, không lỗi console`, async ({ page }) => {
      const errors = watchConsole(page);
      await bootPreview(page, particles(theme, id), { target: 'particles' });
      await expect.poll(async () => (await fxSnap(page))?.bg.length ?? 0, { timeout: 3000 }).toBeGreaterThan(0);
      await page.waitForTimeout(800);
      const s = (await fxSnap(page))!;
      expect(s.bg.length).toBeLessThanOrEqual(40);
      for (const p of s.bg) expect(p.a).toBeLessThanOrEqual(1);
      await expect.poll(() => inkPixels(page), { timeout: 3000 }).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('lớp bảo vệ', () => {
  for (const id of ['snow', 'bubble']) {
    test(`${id}: 0 hạt vẽ trong vùng form RSVP / lời chúc`, async ({ page }) => {
      await bootPreview(page, particles('tram-vang', id, 'high'), { target: 'particles' });
      await expect.poll(async () => (await fxSnap(page))?.frames ?? 0, { timeout: 8000 }).toBeGreaterThan(10);
      let checked = 0;
      for (const target of ['#rsvp', '#guestbook']) {
        await page.locator(target).scrollIntoViewIfNeeded();
        let prevY = -1;
        await expect.poll(async () => { const y = await page.evaluate(() => window.scrollY); const same = y === prevY; prevY = y; return same; }, { intervals: [120] }).toBe(true);
        await page.waitForTimeout(400);
        for (let i = 0; i < 20; i++) {
          const { s, rects } = await page.evaluate(() => ({
            s: (window as unknown as { __wpFx?: { snapshot: () => FxSnapshot } }).__wpFx?.snapshot() ?? null,
            rects: Array.from(document.querySelectorAll('.gb-form, .gb-list, .rsvp-card')).map((e) => {
              const r = e.getBoundingClientRect();
              return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
            }),
          }));
          for (const p of [...s!.bg, ...s!.bursts]) {
            if (p.a <= 0.01) continue;
            const inside = rects.some((r) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom);
            expect(inside, `hạt (${p.x.toFixed(0)},${p.y.toFixed(0)}) a=${p.a.toFixed(2)} trong vùng form`).toBe(false);
            checked++;
          }
          await page.waitForTimeout(80);
        }
      }
      expect(checked).toBeGreaterThan(0);
    });
  }

  test('Tắt và giảm chuyển động: không tạo canvas', async ({ page }) => {
    await bootPreview(page, particles('pastel-han', 'petal-sakura', 'off'), { target: 'particles' });
    await page.locator('#main').waitFor();
    await page.waitForTimeout(1200);
    expect(await page.locator('.fx-canvas').count()).toBe(0);
    await bootPreview(page, particles('pastel-han', 'petal-sakura', 'high'), { target: 'particles', simulate: { reducedMotion: true } });
    await page.locator('#main').waitFor();
    await page.waitForTimeout(1200);
    expect(await page.locator('.fx-canvas').count()).toBe(0);
  });
});

/** Thời lượng (design §5) + mốc đợt trễ cuối (ms). */
const BURSTS: Record<string, { n: number; ms: number; lastWave: number }> = {
  confetti: { n: 80, ms: 1800, lastWave: 80 }, gold: { n: 60, ms: 1400, lastWave: 0 }, 'red-paper': { n: 80, ms: 1800, lastWave: 300 },
};

test.describe('burst sau khi mở', () => {
  for (const [id, b] of Object.entries(BURSTS)) {
    test(`${id}: Vừa ≈ ${b.n} hạt (±10%), tự dọn trong thời lượng + 300ms; Nhẹ = 0`, async ({ page }) => {
      const errors = watchConsole(page);
      // theme tram-vang + hạt cánh hồng: red-paper không chuyển thành hạt nền (toBg chỉ khi hạt nền có red-paper)
      await bootPreview(page, { theme: { preset: 'tram-vang' }, effects: { intensity: 'medium', burst: { onOpen: id }, particles: { types: ['petal-rose'] } } }, { target: 'burst' });
      await page.waitForFunction(() => !!(window as unknown as { __wpFx?: unknown }).__wpFx, null, { timeout: 8000 });
      // đo trong trang: đỉnh số hạt + thời gian từ hạt đầu tiên tới khi về 0
      const r = await page.evaluate(() => new Promise<{ peak: number; ms: number }>((res) => {
        const w = window as unknown as { __wpFx: { snapshot: () => { bursts: unknown[] } | undefined } };
        let peak = 0;
        let t0 = 0;
        const tick = () => {
          const n = w.__wpFx.snapshot()?.bursts.length ?? 0;
          const now = performance.now();
          if (n > 0 && !t0) t0 = now;
          peak = Math.max(peak, n);
          if (t0 && n === 0) { res({ peak, ms: now - t0 }); return; }
          if (now > 15000 + (t0 || now)) { res({ peak, ms: -1 }); return; }
          requestAnimationFrame(tick);
        };
        tick();
      }));
      expect(r.peak).toBeGreaterThanOrEqual(Math.floor(b.n * 0.9));
      expect(r.peak).toBeLessThanOrEqual(Math.min(120, Math.ceil(b.n * 1.1)));
      expect(r.ms).toBeGreaterThan(0);
      expect(r.ms).toBeLessThanOrEqual(b.ms + b.lastWave + 300);
      expect(errors).toEqual([]);

      await bootPreview(page, { theme: { preset: 'tram-vang' }, effects: { intensity: 'low', burst: { onOpen: id } } }, { target: 'burst' });
      await page.waitForFunction(() => !!(window as unknown as { __wpFx?: unknown }).__wpFx, null, { timeout: 8000 });
      await page.waitForTimeout(1200);
      expect((await fxSnap(page))!.bursts.length).toBe(0);
    });
  }

  test('chunk burst tải SAU khi cover gỡ (không nằm trong JS ban đầu)', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __coverGone?: number };
      new MutationObserver((recs) => {
        if (w.__coverGone) return;
        for (const r of recs) for (const n of r.removedNodes) if (n instanceof Element && n.classList.contains('cover')) w.__coverGone = performance.now();
      }).observe(document, { childList: true, subtree: true });
    });
    await bootPreview(page, { theme: { preset: 'tram-vang' }, cover: { openStyle: 'envelope' }, effects: { intensity: 'medium', burst: { onOpen: 'confetti' } } }, { target: 'cover' });
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').some((e) => /\/confetti-[\w-]+\.js$/.test(e.name))), { timeout: 10000 }).toBe(true);
    const r = await page.evaluate(() => ({
      gone: (window as unknown as { __coverGone?: number }).__coverGone ?? -1,
      start: performance.getEntriesByType('resource').find((e) => /\/confetti-[\w-]+\.js$/.test(e.name))!.startTime,
    }));
    // HTML ban đầu không modulepreload chunk burst (link do Vite chèn lúc import() động thì có sau khi mở)
    expect(await (await page.request.get('/')).text()).not.toMatch(/confetti-[\w-]+\.js/);
    expect(r.gone).toBeGreaterThan(0);
    expect(r.start).toBeGreaterThanOrEqual(r.gone);
  });

  test('heart-burst qua hook debug: 8 tim (Vừa) / 12 (Nhiều) từ mép trên nút', async ({ page }) => {
    for (const [intensity, n] of [['medium', 8], ['high', 12]] as const) {
      const errors = watchConsole(page);
      await bootPreview(page, { theme: { preset: 'hong-phan' }, effects: { intensity, burst: { onOpen: 'none' } } }, { target: 'particles' });
      await page.waitForFunction(() => !!(window as unknown as { __wpBurst?: unknown }).__wpBurst, null, { timeout: 8000 });
      const added = await page.evaluate(() => (window as unknown as { __wpBurst: (id: string, o: object) => Promise<number> })
        .__wpBurst('heart-burst', { from: { left: 60, top: 500, right: 300, bottom: 548 } }));
      expect(added).toBe(n);
      const s = (await fxSnap(page))!;
      expect(s.bursts.length).toBeGreaterThanOrEqual(n);
      await expect.poll(async () => (await fxSnap(page))!.bursts.length, { timeout: 2500 }).toBe(0);
      expect(errors).toEqual([]);
    }
  });
});

test.describe('P07 - burst phát từ nút trong form bỏ qua vùng loại trừ (Q1)', () => {
  for (const id of ['heart-burst', 'confetti']) {
    test(`${id} từ nút "Gửi lời chúc" (.gb-form[data-fx-exclude]): mảnh hiện (a > .05), kể cả trong form; hạt nền vẫn né form`, async ({ page }) => {
      const errors = watchConsole(page);
      await bootPreview(page, { theme: { preset: 'hong-phan' }, effects: { intensity: 'high', burst: { onOpen: 'none' }, particles: { enabled: true, types: ['snow'], color: 'theme', scope: 'all' } } }, { target: 'particles' });
      await page.waitForFunction(() => !!(window as unknown as { __wpBurst?: unknown }).__wpBurst, null, { timeout: 8000 });
      const btn = page.locator('.gb-form button[type="submit"]');
      await btn.scrollIntoViewIfNeeded();
      let prevY = -1;
      await expect.poll(async () => { const y = await page.evaluate(() => window.scrollY); const same = y === prevY; prevY = y; return same; }, { intervals: [120] }).toBe(true);
      await page.waitForTimeout(400);
      const r = await page.evaluate((burst) => {
        const b = document.querySelector('.gb-form button[type="submit"]')!.getBoundingClientRect();
        const f = document.querySelector('.gb-form')!.getBoundingClientRect();
        const from = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
        void (window as unknown as { __wpBurst: (id: string, o: object) => Promise<number> }).__wpBurst(burst, { from });
        return { left: f.left, top: f.top, right: f.right, bottom: f.bottom };
      }, id);
      let visible = 0;
      let insideForm = 0;
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(60);
        const s = (await fxSnap(page))!;
        for (const p of s.bursts) {
          if (p.a <= 0.05) continue;
          visible++;
          if (p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) insideForm++;
        }
        // hạt nền vẫn né form
        for (const p of s.bg) {
          if (p.a <= 0.01) continue;
          expect(p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom, `hạt nền (${p.x.toFixed(0)},${p.y.toFixed(0)}) trong form`).toBe(false);
        }
      }
      expect(visible).toBeGreaterThan(0);
      expect(insideForm).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('admin - chọn loại hạt', () => {
  test.use({ viewport: { width: 1360, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  test('8 chip + "Xem thêm (13)" -> đủ 21; tối đa 2 (bỏ loại cũ nhất); "Sau khi mở" 5 lựa chọn + Theo theme', async ({ page }) => {
    await offline(page);
    await expect(page.locator('iframe.pv-frame.is-active')).toHaveCount(1);
    await page.goto('/admin/#/effects');
    const first = page.locator('[data-testid="pchips"] [data-testid^="pchip-"]');
    await expect(first).toHaveCount(8);
    // tram-vang gợi ý cánh hồng -> đứng đầu
    await expect(first.first()).toHaveAttribute('data-testid', 'pchip-petal-rose');
    // P11: chip "Theo theme" luôn hiện, đứng đầu, bật khi đang theo theme; loại gợi ý có dấu "· theme" (không aria-pressed)
    const follow = page.getByTestId('ptheme');
    await expect(page.locator('[data-testid="pchips"] > .chip').first()).toHaveAttribute('data-testid', 'ptheme');
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('pchip-petal-rose')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('pchip-petal-rose')).toContainText('· theme');
    await expect(page.locator('legend', { hasText: 'Loại (tối đa 2)' })).not.toContainText('đang theo theme');
    const more = page.locator('summary', { hasText: 'Xem thêm (13)' });
    await expect(more).toBeVisible();
    await more.click();
    await expect(page.locator('[data-testid^="pchip-"]')).toHaveCount(21);
    // P10: bỏ chọn loại trong "Xem thêm" -> panel vẫn mở
    const panel = page.getByTestId('pmore');
    await page.getByTestId('pchip-petal-sakura').click();
    await expect(follow).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('pchip-petal-rose')).not.toContainText('· theme');
    await page.getByTestId('pchip-petal-sakura').click();
    await expect(page.getByTestId('pchip-petal-sakura')).toHaveAttribute('aria-pressed', 'false');
    await expect(panel).toHaveAttribute('open', '');
    await follow.click();
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    // P10: loại trong panel bị đẩy ra bởi 2 loại hàng đầu -> panel vẫn mở + báo loại bị bỏ
    await page.getByTestId('pchip-petal-sakura').click();
    await page.getByTestId('pchip-heart').click();
    await page.getByTestId('pchip-snow').click();
    await expect(page.getByTestId('pchip-petal-sakura')).toHaveAttribute('aria-pressed', 'false');
    await expect(panel).toHaveAttribute('open', '');
    await expect(page.getByTestId('pdrop')).toHaveText('Đã bỏ "Hoa anh đào" - chọn tối đa 2 loại.');
    await follow.click();
    await expect(page.getByTestId('pdrop')).toHaveText('');
    await page.getByTestId('pchip-snow').click();
    await page.getByTestId('pchip-sparkle').click();
    await expect(page.getByTestId('pchip-snow')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('pchip-sparkle')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('pchip-leaf-maple').click();
    await expect(page.getByTestId('pchip-snow')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-testid^="pchip-"][aria-pressed="true"]')).toHaveCount(2);
    const sel = page.getByLabel('Sau khi mở');
    await expect(sel.locator('option')).toHaveCount(6);
    await expect(sel.locator('option').first()).toHaveText(/^Theo theme \(/);
    expect((await sel.locator('option').allTextContents()).slice(1)).toEqual(['Không', 'Cánh hoa', 'Hoa giấy', 'Kim tuyến vàng', 'Pháo giấy đỏ']);
  });
});
