import { expect, test, type Page } from '@playwright/test';

/** Thu thập lỗi console (cho phép warn). */
function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

async function openCard(page: Page, url = '/?to=gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh&debug=fx') {
  await page.goto(url);
  const cta = page.locator('.cv-cta');
  await expect(cta).toBeEnabled({ timeout: 6000 });
  await cta.click();
  await expect(page.locator('.cover')).toHaveCount(0, { timeout: 4000 });
}

/** Theme đã resolve lúc build (config mẫu trong public/ là file người dùng sửa được - không ghim cứng theme). */
async function builtTheme(): Promise<{ preset: string; openStyle: string; envelope?: { style: string }; tokens: { primary: string } }> {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync('dist/index.html', 'utf8');
  const m = /<script type="application\/json" id="wp-resolved">([\s\S]*?)<\/script>/.exec(html)!;
  return JSON.parse(m[1]!) as { preset: string; openStyle: string; envelope?: { style: string }; tokens: { primary: string } };
}

/** tên khách trên cover: mặt phong bì (`.env-guest`) hoặc thẻ (`.cv-guest`, kiểu mở khác) */
const GUEST = '.env-guest, .cv-guest';

type Snap = { bg: { x: number; y: number; a: number }[]; bursts: { x: number; y: number; a: number }[]; zones: unknown[]; running: boolean; frames: number };
const snap = (page: Page) => page.evaluate(() => (window as unknown as { __wpFx?: { snapshot: () => Snap } }).__wpFx?.snapshot() ?? null);

test('cover: tên khách từ ?to=, chạm mở, landing hiện, không lỗi console', async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto('/?to=gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh');
  await expect(page.locator(GUEST)).toHaveText('Gia đình anh Mạnh');
  await expect(page.locator('#main')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', (await builtTheme()).preset);
  await page.locator('.cv-cta').click();
  await expect(page.locator('.cover')).toHaveCount(0, { timeout: 4000 });
  await expect(page.locator('#main')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('h1#hero-title')).toContainText('Minh Anh');
  await expect(page.locator('.ann-invite').first()).toHaveText('Trân trọng kính mời Gia đình anh Mạnh tới dự');
  // thứ tự + số thứ tự section
  const ids = await page.locator('#main > .sec').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['hero', 'couple', 'families', 'announcement', 'events', 'countdown', 'timeline', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer']);
  await expect(page.locator('#couple .eyebrow-n')).toHaveText('01');
  await expect(page.locator('#rsvp .eyebrow-n')).toHaveText('09');
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test('link /invite/<slug> và link mã hoá cho cùng kết quả', async ({ page }) => {
  await page.goto('/invite/c%C3%B4-ch%C3%BA--T%C6%B0');
  await expect(page.locator(GUEST)).toHaveText('Cô chú-Tư');
  await page.goto('/?to=<script>alert(1)</script>');
  await expect(page.locator(GUEST)).toHaveText('Scriptalert(1)/script');
  await page.goto('/?to=');
  await expect(page.locator(GUEST)).toHaveText('Quý khách');
});

test('hạt nền cả trang: 0 hạt vẽ trong vùng form RSVP / lời chúc; dừng khi focus ô nhập', async ({ page }) => {
  const errors = watchConsole(page);
  await openCard(page);
  await expect.poll(async () => (await snap(page))?.frames ?? 0, { timeout: 8000 }).toBeGreaterThan(10);

  const zoneRects = () => page.evaluate(() =>
    Array.from(document.querySelectorAll('.gb-form, .gb-list, .rsvp-card, .ev-card')).map((e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }));
  // vị trí hạt + vùng form đo trong CÙNG 1 lần evaluate (trang có thể còn đang cuộn mượt / tự cuộn vừa dừng)
  const snapWithRects = () => page.evaluate(() => ({
    s: (window as unknown as { __wpFx?: { snapshot: () => Snap } }).__wpFx?.snapshot() ?? null,
    rects: Array.from(document.querySelectorAll('.gb-form, .gb-list, .rsvp-card, .ev-card')).map((e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }),
  }));
  void zoneRects;
  let checked = 0;
  for (const target of ['#guestbook', '#rsvp', '#events']) {
    await page.locator(target).scrollIntoViewIfNeeded();
    // chờ cuộn đứng yên
    let prevY = -1;
    await expect.poll(async () => { const yy = await page.evaluate(() => window.scrollY); const same = yy === prevY; prevY = yy; return same; }, { intervals: [120] }).toBe(true);
    await page.waitForTimeout(300);
    for (let i = 0; i < 25; i++) {
      const { s, rects } = await snapWithRects();
      expect(s).not.toBeNull();
      for (const p of [...s!.bg, ...s!.bursts]) {
        if (p.a <= 0.01) continue; // không vẽ
        const inside = rects.some((r) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom);
        expect(inside, `hạt (${p.x.toFixed(0)},${p.y.toFixed(0)}) a=${p.a.toFixed(2)} nằm trong vùng form`).toBe(false);
        checked++;
      }
      await page.waitForTimeout(80);
    }
  }
  expect(checked).toBeGreaterThan(0);

  // focus vào ô nhập -> rAF dừng
  await page.locator('#guestbook').scrollIntoViewIfNeeded();
  await page.locator('#gb-msg').focus();
  await page.waitForTimeout(150);
  const f1 = (await snap(page))!.frames;
  await page.waitForTimeout(600);
  const s2 = (await snap(page))!;
  expect(s2.running).toBe(false);
  expect(s2.frames).toBe(f1);
  // rời focus +1.5s -> chạy lại
  await page.locator('#gb-msg').blur();
  await page.waitForTimeout(1900);
  expect((await snap(page))!.running).toBe(true);
  expect(errors).toEqual([]);
});

test('mừng cưới: sheet + VietQR sinh client-side, Esc đóng, particles dừng khi sheet mở', async ({ page }) => {
  const errors = watchConsole(page);
  await openCard(page);
  await page.locator('#gift').scrollIntoViewIfNeeded();
  await page.locator('.gift-btn').click();
  await expect(page.locator('.sheet')).toBeVisible();
  await expect(page.locator('.qr-box canvas')).toHaveCount(1);
  await expect(page.locator('.gs-acc')).toHaveText('012 345 678 9');
  await page.waitForTimeout(300);
  expect((await snap(page))?.running).toBe(false);
  await page.locator('.seg-btn').nth(1).click();
  await expect(page.locator('.gs-acc')).toHaveText('987 654 321 0');
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet-wrap')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('album: lightbox mở/đổi ảnh/đóng', async ({ page }) => {
  await openCard(page);
  await page.locator('#album').scrollIntoViewIfNeeded();
  await page.locator('.al-tile').first().click();
  await expect(page.locator('.lightbox')).toBeVisible();
  await expect(page.locator('.lb-count')).toHaveText('1 / 8');
  await page.locator('.lb-next').click();
  await expect(page.locator('.lb-count')).toHaveText('2 / 8');
  await page.keyboard.press('Escape');
  await expect(page.locator('.lightbox')).toHaveCount(0);
});

test('reduced-motion: không tạo canvas, cover mở bằng fade', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = watchConsole(page);
  await page.goto('/?debug=fx');
  await page.locator('.cv-cta').click();
  await expect(page.locator('.cover')).toHaveCount(0, { timeout: 2000 });
  await page.waitForTimeout(800);
  await expect(page.locator('canvas.fx-canvas')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-fx', 'reduced');
  // tự cuộn: không tự chạy, nút ở trạng thái dừng (khách tự bấm được)
  await expect(page.getByTestId('autoscroll-btn')).toHaveAttribute('aria-label', 'Tiếp tục tự cuộn');
  await page.waitForTimeout(3200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('sổ lưu bút (chế độ local khi chưa có Apps Script): validate, gửi, chèn đầu danh sách', async ({ page }) => {
  const errors = watchConsole(page);
  await openCard(page);
  await page.locator('#guestbook').scrollIntoViewIfNeeded();
  await expect(page.locator('#gb-name')).toHaveValue('Gia đình anh Mạnh');
  await page.locator('.gb-form button[type=submit]').click();
  await expect(page.locator('#gb-msg-err')).toHaveText('Lời chúc cần ít nhất 2 ký tự');
  await page.locator('.chip').first().click();
  await expect(page.locator('#gb-msg')).toHaveValue('Trăm năm hạnh phúc');
  await page.locator('.gb-form button[type=submit]').click();
  await expect(page.locator('.gb-item').first()).toContainText('Trăm năm hạnh phúc');
  await expect(page.locator('.gb-item').first()).toContainText('Gia đình anh Mạnh');
  await expect(page.locator('.toast')).toHaveText('Cảm ơn lời chúc của bạn!');
  expect(errors).toEqual([]);
});

test('CSP production (dist/_headers): không vi phạm, theme inline áp dụng nhờ sha256', async ({ page }) => {
  const { readFileSync } = await import('node:fs');
  const headers = readFileSync('dist/_headers', 'utf8');
  const csp = headers.split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'))!.split('Content-Security-Policy:')[1]!.trim();
  expect(csp).toMatch(/style-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
  const errors = watchConsole(page);
  await page.route('**/*', async (route) => {
    const res = await route.fetch();
    const h = { ...res.headers() };
    if ((h['content-type'] ?? '').includes('text/html')) h['content-security-policy'] = csp;
    await route.fulfill({ response: res, headers: h });
  });
  await openCard(page);
  // giá trị viết hoa đến từ <style id="wp-theme"> inline (tokens.css fallback viết thường)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-primary').trim())).toBe((await builtTheme()).tokens.primary);
  await page.locator('#gift').scrollIntoViewIfNeeded();
  await page.locator('.gift-btn').click();
  await expect(page.locator('.qr-box canvas')).toHaveCount(1);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test.describe('360×740', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('phong bì ngang: tên cặp đôi ở trên, "Kính gửi + tên khách" trên mặt phong bì; ~2s, không khung nào bị cắt', async ({ page }) => {
    const built = await builtTheme();
    test.skip(built.openStyle !== 'envelope', `config mẫu đang dùng kiểu mở ${built.openStyle}`);
    const errors = watchConsole(page);
    await page.goto('/?to=gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh');
    await expect(page.locator('.cv-cta')).toBeEnabled({ timeout: 6000 });
    await expect(page.locator('.cover')).toHaveAttribute('data-env', built.envelope!.style);
    await expect(page.locator('.env-prefix')).toHaveText('Kính gửi');
    await expect(page.locator('.env-guest')).toHaveText('Gia đình anh Mạnh');
    const box = async (sel: string) => (await page.locator(sel).first().boundingBox())!;
    const names = await box('.cv-head .cv-names');
    const env = await box('.cv-env');
    expect(names.y + names.height).toBeLessThanOrEqual(env.y + 1); // tên cặp đôi NGOÀI, phía trên phong bì
    expect(env.width / env.height).toBeGreaterThan(1.35); // phong bì ngang 10:7
    const inner = await box('.cv-inner');
    expect(inner.y).toBeGreaterThanOrEqual(0);
    expect(inner.y + inner.height).toBeLessThanOrEqual(740);

    // chạm mở rồi dừng mọi animation, tua từng 50ms để đo (không phụ thuộc tốc độ máy)
    const total = await page.evaluate(() => {
      (document.querySelector('.cv-cta') as HTMLElement).click();
      const all = document.getAnimations().filter((a) => ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest('.cover'));
      all.forEach((a) => a.pause());
      return Math.max(...all.map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0)));
    });
    expect(total).toBeGreaterThan(1600);
    expect(total).toBeLessThanOrEqual(2400);
    const frames = await page.evaluate((end) => {
      const out: { t: number; top: number; bottom: number; left: number; right: number }[] = [];
      for (let t = 0; t <= end; t += 50) {
        document.getAnimations().filter((a) => ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest('.cover')).forEach((a) => { a.currentTime = t; });
        const r = document.querySelector('.cv-card')!.getBoundingClientRect();
        out.push({ t, top: r.top, bottom: r.bottom, left: r.left, right: r.right });
      }
      return out;
    }, total);
    for (const f of frames) {
      expect(f.top, `t=${f.t}`).toBeGreaterThanOrEqual(-0.5);
      expect(f.bottom, `t=${f.t}`).toBeLessThanOrEqual(740.5);
      expect(f.left, `t=${f.t}`).toBeGreaterThanOrEqual(-0.5);
      expect(f.right, `t=${f.t}`).toBeLessThanOrEqual(360.5);
    }
    // thẻ kết thúc ở giữa màn
    const last = frames[frames.length - 1]!;
    expect(Math.abs((last.top + last.bottom) / 2 - 370)).toBeLessThan(12);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
    await expect(page.locator('.cover')).toHaveCount(0, { timeout: 4000 });
    expect(errors).toEqual([]);
  });
});

test('tự cuộn: chạy sau khi mở, dừng hẳn khi wheel / chạm, nút Tiếp tục chạy lại', async ({ page }) => {
  const errors = watchConsole(page);
  await openCard(page);
  const btn = page.getByTestId('autoscroll-btn');
  await expect(btn).toHaveAttribute('aria-label', 'Dừng tự cuộn', { timeout: 5000 });
  const y = () => page.evaluate(() => Math.round(window.scrollY));
  await expect.poll(y, { timeout: 10_000 }).toBeGreaterThan(30);
  // wheel -> dừng hẳn + toast lần đầu
  await page.mouse.move(180, 400);
  await page.mouse.wheel(0, 40);
  await expect(btn).toHaveAttribute('aria-label', 'Tiếp tục tự cuộn');
  await expect(page.locator('.toast')).toContainText('Đã dừng tự cuộn');
  await page.waitForTimeout(400);
  const y1 = await y();
  await page.waitForTimeout(2500);
  expect(await y()).toBe(y1); // không tự tiếp tục
  // bấm Tiếp tục -> chạy lại ngay (không chờ startDelayMs)
  await btn.click();
  await expect(btn).toHaveAttribute('aria-label', 'Dừng tự cuộn');
  await expect.poll(y, { timeout: 6000 }).toBeGreaterThan(y1 + 20);
  // chạm (touchstart) ở lề trang -> dừng
  await page.touchscreen.tap(6, 420);
  await expect(btn).toHaveAttribute('aria-label', 'Tiếp tục tự cuộn');
  await page.waitForTimeout(300);
  const y2 = await y();
  await page.waitForTimeout(2000);
  expect(await y()).toBe(y2);
  expect(errors).toEqual([]);
});

// ---------------------------------------------------------------- v2.3: design-review-envelopes E01/E02/E05/E10/E11

/** Bỏ config inline của bản build -> guest đọc `/content/config.json` (đã ghi đè mẫu phong bì) và resolve lúc chạy. */
async function useEnvelope(page: Page, style: string): Promise<void> {
  const { readFileSync } = await import('node:fs');
  const cfg = JSON.parse(readFileSync('public/content/config.json', 'utf8')) as { cover: { openStyle: string; envelope: { style: string; guestOnFront: boolean } } };
  cfg.cover.openStyle = 'envelope';
  cfg.cover.envelope = { ...cfg.cover.envelope, style, guestOnFront: true };
  await page.route(/\/content\/config\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cfg) }));
  await page.route((u) => u.pathname === '/', async (r) => {
    const res = await r.fetch();
    const html = (await res.text()).replace(/<script type="application\/json" id="wp-(config|resolved)">[\s\S]*?<\/script>/g, '');
    await r.fulfill({ response: res, body: html });
  });
}

const LONG_NAMES = ['Gia đình anh chị Nguyễn Văn Mạnh và các cháu', 'Phượng', 'Quỳnh', 'Ngọc Ẩn'];
const ENV_STYLES = ['classic', 'kraft', 'song-hy', 'lace', 'minimal', 'velvet'];

test.describe('E01 tên khách trên phong bì không bị cắt (360×740)', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  for (const style of ENV_STYLES) {
    test(`mẫu ${style}: không clamp, chữ (kể cả dấu nặng) nằm trong vùng địa chỉ, ≤ 3 dòng, ≥ 15px`, async ({ page }) => {
      const errors = watchConsole(page);
      await useEnvelope(page, style);
      for (const name of LONG_NAMES) {
        await page.goto(`/?to=${encodeURIComponent(name.replace(/ /g, '-'))}`);
        await expect(page.locator('.cv-cta')).toBeEnabled({ timeout: 6000 });
        await expect(page.locator('.cover')).toHaveAttribute('data-env', style);
        const g = page.locator('.env-guest');
        await expect(g).toHaveText(name);
        await expect(page.locator('.env-addr')).toHaveAttribute('data-fit', /^\d+(\.\d+)?\/[123]$/);
        const m = await page.evaluate(() => {
          const el = document.querySelector<HTMLElement>('.env-guest')!;
          const addr = document.querySelector<HTMLElement>('.env-addr')!;
          const cs = getComputedStyle(el);
          const range = document.createRange();
          range.selectNodeContents(el);
          const lines = Array.from(range.getClientRects()).map((r) => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right }));
          const a = addr.getBoundingClientRect();
          const env = document.querySelector('.cv-env')!.getBoundingClientRect();
          // phần nhìn thấy của dấu: sticker (minimal) hoặc hình SVG (các mẫu khác)
          const seal = (document.querySelector('.env-seal .mn-sticker') ?? document.querySelector('.env-seal .seal-art') ?? document.querySelector('.env-seal')!).getBoundingClientRect();
          const tw = document.querySelector('.tw-l path')?.getBoundingClientRect() ?? null;
          return {
            clamp: cs.getPropertyValue('-webkit-line-clamp'), overflow: cs.overflowY, fontPx: parseFloat(cs.fontSize),
            scrollH: el.scrollHeight, clientH: el.clientHeight, lines,
            addr: { top: a.top, bottom: a.bottom, left: a.left, right: a.right, cy: (a.top + a.bottom) / 2, h: addr.offsetHeight },
            env: { top: env.top, bottom: env.bottom, left: env.left, right: env.right },
            seal: { top: seal.top, bottom: seal.bottom, left: seal.left, right: seal.right },
            twBottom: tw?.bottom ?? null,
          };
        });
        const tag = `${style} · "${name}"`;
        expect(m.clamp, tag).toBe('none');
        expect(m.overflow, tag).toBe('visible');
        expect(m.fontPx, tag).toBeGreaterThanOrEqual(15);
        expect(m.scrollH, tag).toBeLessThanOrEqual(m.clientH + 1);
        // số dòng thật (gộp các rect cùng hàng)
        const rows = [...new Set(m.lines.map((l) => Math.round(l.top)))];
        expect(rows.length, tag).toBeLessThanOrEqual(3);
        for (const l of m.lines) {
          expect(l.top, tag).toBeGreaterThanOrEqual(m.addr.top - 1);
          expect(l.bottom, tag).toBeLessThanOrEqual(m.addr.bottom + 1);
          expect(l.left, tag).toBeGreaterThanOrEqual(m.env.left);
          expect(l.right, tag).toBeLessThanOrEqual(m.env.right);
          expect(l.bottom, tag).toBeLessThanOrEqual(m.env.bottom);
          // không chạm seal / nút dây
          const overlapX = l.right > m.seal.left && l.left < m.seal.right;
          expect(overlapX && l.top < m.seal.bottom - 1 && l.bottom > m.seal.top, tag).toBe(false);
        }
        // E02: dây gai dọc dừng ở mép trên thẻ tên (không vẽ qua chữ)
        if (style === 'kraft') expect(m.twBottom!, tag).toBeLessThanOrEqual(m.addr.cy - m.addr.h / 2 + 3);
      }
      expect(errors).toEqual([]);
    });
  }
});

test.describe('E05/E10/E11 nút tự cuộn sau khi khách dừng (360×740)', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test('đang chạy: pill thu nhỏ suốt (không nháy); đã dừng: khách cuộn -> nút ẩn, đứng yên 1.2s -> hiện lại; tooltip nhạc không đè nút', async ({ page }) => {
    const errors = watchConsole(page);
    await openCard(page);
    const btn = page.getByTestId('autoscroll-btn');
    await expect(btn).toHaveAttribute('aria-label', 'Dừng tự cuộn', { timeout: 5000 });
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 10_000 }).toBeGreaterThan(30);
    // E11: lấy mẫu 3s trong lúc tự cuộn (có dừng ngắn đầu section): pill luôn thu nhỏ
    const minis = await page.evaluate(async () => {
      const out: boolean[] = [];
      for (let i = 0; i < 30; i++) { out.push(!!document.querySelector('.pill')?.classList.contains('is-mini')); await new Promise((r) => setTimeout(r, 100)); }
      return { out, auto: document.documentElement.classList.contains('is-autoscroll') };
    });
    if (minis.auto && (await page.locator('.pill').count())) expect(minis.out.every(Boolean)).toBe(true);
    // E10: tooltip nhạc ở bên trái nút nhạc, không chồng lên nút tự cuộn
    const tip = await page.locator('.fl-tip').boundingBox();
    const bb = (await btn.boundingBox())!;
    if (tip) {
      const music = (await page.locator('.fl-music').boundingBox())!;
      expect(tip.x + tip.width).toBeLessThanOrEqual(music.x + 1);
      expect(tip.y >= bb.y + bb.height || tip.x + tip.width <= bb.x).toBe(true);
    }
    // dừng bằng wheel -> khách cuộn tiếp -> nút ẩn (không nhận chạm)
    await page.mouse.move(180, 400);
    await page.mouse.wheel(0, 60);
    await expect(btn).toHaveAttribute('aria-label', 'Tiếp tục tự cuộn');
    await page.mouse.wheel(0, 200);
    await expect(btn).toHaveClass(/is-hiding/);
    expect(await btn.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    await page.waitForTimeout(400);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(600);
    await expect(btn).toHaveClass(/is-hiding/); // vẫn đang cuộn gần đây
    await expect(btn).not.toHaveClass(/is-hiding/, { timeout: 2500 });
    await expect.poll(() => btn.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    // hiện lại thì bấm được: Tiếp tục
    await btn.click();
    await expect(btn).toHaveAttribute('aria-label', 'Dừng tự cuộn');
    expect(errors).toEqual([]);
  });
});
