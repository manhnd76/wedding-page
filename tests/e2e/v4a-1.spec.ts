/**
 * v4a-1 (solution.md Rev 5 mục 10.8): 12 theme + asset (texture/khung/divider) + B2 hoạ tiết nền + admin panel.
 * Guest: `bootPreview` (resolve lúc chạy qua preview-assets.json) - không cần build lại; riêng "texture trên build" và
 * font cover Trầm Vàng đo trên trang build thật `/`. Admin: bản build, chế độ không kết nối.
 */
import { expect, test, type Page } from '@playwright/test';
import { THEME_IDS } from '../../src/shared/config/enums';
import { PRESETS } from '../../src/shared/theme/presets';
import { isDividerSprite } from '../../src/shared/theme/parts';
import { bootPreview, tapOpen, watchConsole } from './fx-helpers';
import { offline } from './helpers';

const OPEN = { skipCover: true } as const;
const waitLanding = (page: Page) => page.locator('#main .sec').first().waitFor({ state: 'attached', timeout: 15_000 });

/** Trạng thái trang sau render (texture ::before, divider <use>, khung, html data-*). */
function landingInfo(page: Page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const sec = document.querySelector<HTMLElement>('#main .sec.tone-bg') ?? document.querySelector<HTMLElement>('#main .sec');
    const cs = sec ? getComputedStyle(sec, '::before') : null;
    const uses = Array.from(document.querySelectorAll('#main .divider use')).map((u) => u.getAttribute('href') ?? '');
    return {
      theme: html.dataset.theme, texture: html.dataset.texture, orn: html.dataset.orn,
      before: cs ? { content: cs.content, bg: cs.backgroundImage, mask: cs.maskImage || cs.getPropertyValue('-webkit-mask-image') } : null,
      dividers: Array.from(document.querySelectorAll('#main .divider')).map((d) => d.className),
      uses,
      frames: Array.from(document.querySelectorAll('#main .frame')).map((f) => f.className),
    };
  });
}

test.describe('guest (preview runtime)', () => {
  test('T1: 12 theme render đúng gói, texture/divider/khung, mọi SVG + woff2 trả 200, không lỗi JS', async ({ browser }) => {
    test.setTimeout(180_000);
    for (const id of THEME_IDS) {
      const p = PRESETS[id];
      const page = await browser.newPage();
      const errors = watchConsole(page);
      const bad: string[] = [];
      page.on('response', (r) => { if (/\.(svg|woff2)(\?|$)/.test(r.url()) && r.status() !== 200) bad.push(`${r.status()} ${r.url()}`); });
      await bootPreview(page, { theme: { preset: id } }, null, OPEN);
      await waitLanding(page);
      await page.waitForLoadState('networkidle');
      const info = await landingInfo(page);
      expect(info.theme, id).toBe(id);
      expect(info.texture, id).toBe(p.texture);
      expect(info.orn, id).toBe(p.ornamentSet);
      // texture thành lớp riêng của section
      expect(info.before?.content, id).not.toBe('none');
      if (p.texture === 'watercolor-wash') expect(info.before?.mask, id).toContain('watercolor-wash');
      else expect(info.before?.bg, id).not.toBe('none');
      // divider
      expect(info.dividers.length, id).toBeGreaterThan(0);
      expect(info.dividers[0], id).toContain(`divider--${p.divider}`);
      if (p.divider === 'ornament') expect(info.uses[0], id).toMatch(new RegExp(`/ornaments/${p.ornamentSet}\\.[0-9a-f]{8}\\.svg#divider$`));
      else if (isDividerSprite(p.divider)) expect(info.uses[0], id).toMatch(new RegExp(`/ornaments/divider-${p.divider}\\.[0-9a-f]{8}\\.svg#divider$`));
      else expect(info.uses, id).toEqual([]);
      // khung ảnh
      expect(info.frames.length, id).toBeGreaterThan(0);
      for (const f of info.frames) expect(f, id).toContain(`frame--${p.photoFrame}`);
      if (p.photoFrame === 'stamp') await expect(page.locator('.frame-wrap--stamp > .frame--stamp').first()).toBeAttached();
      if (p.photoFrame === 'polaroid' && info.frames.length > 1) await expect(page.locator('.frame--polaroid.tilt-r').first()).toBeAttached();
      expect(bad, id).toEqual([]);
      expect(errors, id).toEqual([]);
      await page.close();
    }
  });

  test('T2: Trầm Vàng + divider "cloud" -> sprite mây riêng (không phải cành lá của classic-line)', async ({ page }) => {
    await bootPreview(page, { theme: { preset: 'tram-vang' }, sections: { divider: 'cloud' } }, null, OPEN);
    await waitLanding(page);
    const href = await page.locator('#main .divider use').first().getAttribute('href');
    expect(href).toMatch(/\/ornaments\/divider-cloud\.[0-9a-f]{8}\.svg#divider$/);
    const res = await page.request.get(href!.split('#')[0]!);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('id="divider"');
  });

  test('T3: Son Đỏ mặc định - title/band đúng section, opacity ≤ --motif-cap, trống đồng xoay 240s ở mức Vừa', async ({ page }) => {
    const errors = watchConsole(page);
    await bootPreview(page, { theme: { preset: 'son-do' } }, null, OPEN);
    await page.locator('.mtf').first().waitFor({ state: 'attached', timeout: 10_000 });
    const r = await page.evaluate(() => {
      const html = document.documentElement;
      const cap = Number(getComputedStyle(html).getPropertyValue('--motif-cap'));
      const title = Array.from(document.querySelectorAll<HTMLElement>('.mtf--title'));
      const band = Array.from(document.querySelectorAll<HTMLElement>('.mtf--band'));
      return {
        motif: html.dataset.motif, level: html.dataset.mtfLevel, fx: html.dataset.fx, cap,
        titleSecs: title.map((m) => m.closest('.sec')!.getAttribute('data-type')),
        titleFirst: title.every((m) => m.parentElement!.classList.contains('sec-head') && m.parentElement!.firstElementChild === m),
        bandOk: band.every((m) => { const s = m.closest('.sec')!; return s.classList.contains('tone-surface') || s.classList.contains('sec-footer'); }),
        bandN: band.length,
        opacity: title.map((m) => Number(getComputedStyle(m).opacity)),
        anim: title.map((m) => ({ name: getComputedStyle(m).animationName, dur: getComputedStyle(m).animationDuration, rot: m.classList.contains('mtf--rot') })),
        aria: [...title, ...band].every((m) => m.getAttribute('aria-hidden') === 'true'),
        mask: getComputedStyle(title[0]!).maskImage || getComputedStyle(title[0]!).getPropertyValue('-webkit-mask-image'),
      };
    });
    expect(r).toMatchObject({ motif: 'dong-son', level: 'light', fx: 'medium', cap: 0.6, titleFirst: true, bandOk: true, aria: true });
    expect(r.titleSecs.length).toBeGreaterThan(0);
    for (const t of ['album', 'rsvp', 'guestbook', 'hero', 'thankyou', 'footer']) expect(r.titleSecs).not.toContain(t);
    expect(r.bandN).toBeGreaterThan(0);
    for (const o of r.opacity) expect(o).toBeLessThanOrEqual(r.cap + 1e-6);
    for (const a of r.anim) expect(a).toEqual({ name: 'mtf-spin', dur: '240s', rot: true });
    expect(r.mask).toContain('medallion');
    expect(errors).toEqual([]);
  });

  test('T4: Trầm Vàng mặc định - 0 phần tử .mtf, không tải chunk hoạ tiết', async ({ page }) => {
    const motifReq: string[] = [];
    page.on('request', (q) => { if (/\/assets\/motif-[\w-]+\.(js|css)/.test(q.url())) motifReq.push(q.url()); });
    await bootPreview(page, { theme: { preset: 'tram-vang' } }, null, OPEN);
    await waitLanding(page);
    await page.waitForTimeout(2000);
    expect(await page.locator('.mtf').count()).toBe(0);
    expect(motifReq).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.dataset.motif ?? null)).toBeNull();
  });

  test('T5: Song Hỷ sau tiêu đề không xoay; giảm chuyển động -> không hoạ tiết nào chạy animation', async ({ page, browser }) => {
    await bootPreview(page, { theme: { preset: 'son-do', motif: { set: 'chu-hy', placements: ['title', 'band'] } } }, null, OPEN);
    await page.locator('.mtf--title').first().waitFor({ state: 'attached', timeout: 10_000 });
    const hy = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('.mtf--title')).map((m) => ({ rot: m.classList.contains('mtf--rot'), name: getComputedStyle(m).animationName })));
    expect(hy.length).toBeGreaterThan(0);
    for (const m of hy) expect(m).toEqual({ rot: false, name: 'none' });

    const p2 = await browser.newPage();
    await bootPreview(p2, { theme: { preset: 'bien-dao', motif: { placements: ['title', 'band'] } } }, { target: 'particles', simulate: { reducedMotion: true } });
    await p2.locator('.mtf').first().waitFor({ state: 'attached', timeout: 10_000 });
    const st = await p2.evaluate(() => ({
      fx: document.documentElement.dataset.fx,
      names: Array.from(document.querySelectorAll<HTMLElement>('.mtf')).map((m) => getComputedStyle(m).animationName),
      running: Array.from(document.querySelectorAll<HTMLElement>('.mtf')).flatMap((m) => m.getAnimations()).length,
      corners: document.querySelectorAll('.mtf--corner:not(.is-in)').length,
    }));
    expect(st.fx).toBe('reduced');
    expect(st.names.every((n) => n === 'none')).toBe(true);
    expect(st.running).toBe(0);
    await p2.close();
  });

  test('T6: font tải trước khi chạm mở ≤ 180 KB (2 theme nặng nhất: Trầm Vàng trên build, Hoa Lá Màu Nước)', async ({ page, browser }) => {
    /** `pkgs`: chỉ tính font của theme (preview chạy trên index.html build cho Trầm Vàng nên có preload Great Vibes thừa). */
    const measure = async (pg: Page, go: () => Promise<unknown>, pkgs: string[]) => {
      const sizes = new Map<string, number>();
      pg.on('response', async (r) => {
        const name = r.url().split('/').pop() ?? '';
        if (!name.endsWith('.woff2') || !pkgs.some((p) => name.startsWith(`${p}-`))) return;
        try { sizes.set(r.url(), (await r.body()).length); } catch { /* bỏ qua */ }
      });
      await go();
      await pg.locator('.cv-cta').waitFor({ state: 'visible', timeout: 10_000 });
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForLoadState('networkidle');
      await pg.waitForTimeout(500);
      return { total: [...sizes.values()].reduce((a, b) => a + b, 0), files: sizes.size };
    };
    const fontsOf = (id: keyof typeof PRESETS) => Object.values(PRESETS[id].fonts);
    const tram = await measure(page, () => page.goto('/'), fontsOf('tram-vang'));
    const p2 = await browser.newPage();
    const nuoc = await measure(p2, () => bootPreview(p2, { theme: { preset: 'mau-nuoc' } }), fontsOf('mau-nuoc'));
    console.log(`[T6] font trước khi chạm: tram-vang ${tram.total} B / ${tram.files} file, mau-nuoc ${nuoc.total} B / ${nuoc.files} file`);
    for (const [id, m] of [['tram-vang', tram], ['mau-nuoc', nuoc]] as const) {
      expect(m.total, id).toBeGreaterThan(0);
      expect(m.total, `${id} ${m.total} B`).toBeLessThanOrEqual(180_000);
    }
    await p2.close();
  });
});

test('Build: texture lớp .sec::before hiện thấy (Trầm Vàng / paper) - không bị nền section che', async ({ page }) => {
  await page.goto('/?cover=0');
  await page.locator('#couple').waitFor();
  const st = await page.evaluate(() => {
    const sec = document.getElementById('couple')!;
    const b = getComputedStyle(sec, '::before');
    return { texture: document.documentElement.dataset.texture, bg: b.backgroundImage, z: b.zIndex, opacity: b.opacity, iso: getComputedStyle(sec).isolation };
  });
  expect(st.texture).toBe('paper');
  expect(st.bg).not.toBe('none');
  expect(st).toMatchObject({ z: '0', opacity: '0.05', iso: 'isolate' });
  // thấy được: ảnh section đứng yên (ẩn canvas hạt, hiện hết reveal) khác hẳn khi tắt texture; 2 lần chụp có texture giống nhau
  // tự cuộn (bật mặc định, bắt đầu sau 2.5s) làm ảnh chạy: chờ nó chạy rồi bấm phím để dừng hẳn
  await page.waitForFunction(() => document.documentElement.classList.contains('is-autoscroll'), null, { timeout: 6000 }).catch(() => undefined);
  await page.keyboard.press('ArrowDown');
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('.fx-canvas, .floating').forEach((e) => e.style.setProperty('display', 'none'));
    document.querySelectorAll('[data-rva]').forEach((e) => e.classList.add('is-in'));
  });
  // cuộn tức thì tới đầu section, chụp dải 240px đầu (padding trên: chỉ nền + texture)
  await page.evaluate(() => {
    document.documentElement.style.setProperty('scroll-behavior', 'auto');
    window.scrollTo(0, document.getElementById('couple')!.offsetTop);
  });
  await page.waitForTimeout(800);
  const clip = { x: 0, y: 0, width: page.viewportSize()!.width, height: 240 };
  const a = await page.screenshot({ clip, animations: 'disabled' });
  const b = await page.screenshot({ clip, animations: 'disabled' });
  expect(a.equals(b), 'ảnh ổn định').toBe(true);
  await page.evaluate(() => { document.documentElement.dataset.texture = 'none'; });
  const off = await page.screenshot({ clip, animations: 'disabled' });
  expect(a.equals(off), 'texture tạo khác biệt thấy được').toBe(false);
});

test.describe('admin (bản build, không kết nối)', () => {
  test.use({ viewport: { width: 1360, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  const preview = (page: Page) => page.frameLocator('iframe.pv-frame.is-active');

  test('T7: 12 thẻ theme; panel Hoạ tiết nền (lười): Tự chọn, Mây cát tường, vị trí tối đa 2, Phủ nền ⟂ Sau tiêu đề; đổi theme Giữ / Trọn gói', async ({ page }) => {
    // favicon.ico 404 của trang admin có từ trước (không thuộc v4a-1) -> bỏ qua theo URL
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) errors.push(`${m.text()} @ ${m.location().url}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    const panelReq: string[] = [];
    page.on('request', (q) => { if (/\/assets\/motif-panel-[\w-]+\.js/.test(q.url())) panelReq.push(q.url()); });
    await offline(page);
    await page.goto('/admin/#/theme');
    await expect(page.locator('.tcard')).toHaveCount(12);
    await expect(page.locator('#form-col')).not.toContainText('/12 theme');
    await expect(page.locator('.comp')).toContainText('Hoạ tiết nền');
    await expect(page.locator('.comp')).toContainText('Theo theme · Không dùng');
    expect(panelReq).toEqual([]); // chưa bấm [Đổi] -> chưa tải chunk panel

    await page.getByTestId('motif-open').click();
    const panel = page.getByTestId('motif-panel');
    await expect(panel).toBeVisible();
    expect(panelReq.length).toBe(1);
    await expect(page.getByTestId('motif-follow')).toBeChecked();
    await expect(page.getByTestId('motif-none')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.mgrid [role="radio"]')).toHaveCount(8);
    await expect(page.getByTestId('motif-la-canh')).toContainText('★');

    await page.getByTestId('motif-custom').check();
    await page.getByTestId('motif-may-cat-tuong').click();
    await expect(page.getByTestId('motif-may-cat-tuong')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.comp')).toContainText('Đã chỉnh riêng');
    // tram-vang preset: Dải viền -> thêm Góc, bỏ Dải viền, thêm Phủ nền
    await expect(page.getByTestId('motif-pl-band')).toBeChecked();
    await page.getByTestId('motif-pl-corners').check();
    await page.getByTestId('motif-pl-band').uncheck();
    await page.getByTestId('motif-pl-pattern').check();
    await expect(page.getByTestId('motif-pl-pattern')).toBeChecked();
    // Sau tiêu đề -> Phủ nền tự bỏ + aria-live
    await page.getByTestId('motif-pl-title').check();
    await expect(page.getByTestId('motif-pl-pattern')).not.toBeChecked();
    await expect(page.getByTestId('motif-live')).toContainText('Đã bỏ "Phủ nền"');
    // đủ 2 -> ô thứ 3 vô hiệu + dòng giải thích
    await expect(page.getByTestId('motif-pl-band')).toBeDisabled();
    await expect(page.getByTestId('motif-pl-hero')).toBeDisabled();
    await expect(page.getByTestId('motif-full')).toBeVisible();
    // T06: "Phủ nền" vẫn bật vì nó thay "Sau tiêu đề" -> dòng nhắc nói đúng điều đó
    await expect(page.getByTestId('motif-full')).toHaveText('Đã chọn đủ 2 vị trí. Chọn "Phủ nền" sẽ thay cho "Sau tiêu đề".');
    // Trầm Vàng cap .05 + vị trí sau chữ -> cảnh báo
    await expect(page.getByTestId('motif-lowcap')).toBeVisible();
    // preview có góc hoạ tiết
    await expect(preview(page).locator('.mtf--corner').first()).toBeAttached({ timeout: 20_000 });
    await expect(preview(page).locator('html')).toHaveAttribute('data-motif', 'may-cat-tuong');

    // đổi sang Sen Chàm, giữ phần đã chỉnh -> vẫn Mây cát tường
    await page.getByTestId('theme-sen-cham').click();
    await page.getByTestId('theme-keep').click();
    await expect(page.getByTestId('theme-sen-cham')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('motif-may-cat-tuong')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('motif-custom')).toBeChecked();
    // đổi sang Son Đỏ, dùng trọn gói -> về Theo theme (Trống đồng)
    await page.getByTestId('theme-son-do').click();
    await page.getByRole('button', { name: /Dùng trọn gói/ }).click();
    await expect(page.getByTestId('motif-follow')).toBeChecked();
    await expect(page.getByTestId('motif-dong-son')).toHaveAttribute('aria-checked', 'true');
    // T06: nhãn không lồng ngoặc, không tên phụ "(Song Hỷ)"
    await expect(page.locator('label', { has: page.getByTestId('motif-follow') })).toHaveText(/^\s*Theo theme · Son Đỏ: Trống đồng — Sau tiêu đề \+ Dải viền\s*$/);
    await expect(page.locator('.comp')).toContainText('Trống đồng (Sau tiêu đề + Dải viền)');
    expect(errors).toEqual([]);
  });
});

test('Cover: tap mở được với theme mới (Pastel Hàn, font Moon Dance)', async ({ page }) => {
  const errors = watchConsole(page);
  await bootPreview(page, { theme: { preset: 'pastel-han' } });
  await tapOpen(page, 10_000);
  await expect(page.locator('html')).toHaveClass(/is-opened/, { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test.describe('review v4a-1 (mobile 360px)', () => {
  const VW = 360;
  test.use({ viewport: { width: VW, height: 740 } });

  test('T05: 12 theme - không cuộn ngang ở 360px sau khi cuộn hết trang; Biển Đảo card-3d không nhảy khi chạm', async ({ context }) => {
    test.setTimeout(240_000);
    const wide: string[] = [];
    for (const id of THEME_IDS) {
      const page = await context.newPage();
      await bootPreview(page, { theme: { preset: id } }, null, OPEN);
      await waitLanding(page);
      await page.waitForLoadState('networkidle');
      // cuộn từng màn tới cuối để mọi phần tử lười (hoạ tiết, reveal) đã gắn
      await page.evaluate(async () => {
        document.documentElement.style.setProperty('scroll-behavior', 'auto');
        for (let y = 0; y <= document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.8)) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await page.waitForTimeout(400);
      // mobile: tràn ngang làm layout viewport nới ra (innerWidth cũng thành 504) -> so với bề rộng viewport đã đặt (360)
      const m = await page.evaluate((W) => {
        const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
        const over = sw > W
          ? Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((e) => e.getBoundingClientRect().right > W + 1).slice(0, 3).map((e) => e.className)
          : [];
        return { W, sw, over };
      }, VW);
      if (m.sw !== m.W) wide.push(`${id}: scrollWidth ${m.sw} > ${m.W} (${m.over.join(' | ')})`);
      await page.close();
    }
    expect(wide).toEqual([]);

    // Biển Đảo (song-nuoc band trôi) + card-3d theo theme: khung .cv-inner không đổi bề rộng/vị trí ngay sau khi chạm
    const page = await context.newPage();
    await bootPreview(page, { theme: { preset: 'bien-dao' } });
    await page.locator('.cv-cta').waitFor({ state: 'visible', timeout: 10_000 });
    const box = () => page.evaluate(() => { const e = document.querySelector<HTMLElement>('.cv-inner'); return e ? { w: e.offsetWidth, l: e.offsetLeft } : null; });
    const before = await box();
    await tapOpen(page, 10_000);
    await page.waitForTimeout(60);
    const after = await box();
    const sw = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth));
    expect(before).not.toBeNull();
    if (after) expect(after).toEqual(before);
    expect(sw).toBe(VW);
    await page.close();
  });
});
