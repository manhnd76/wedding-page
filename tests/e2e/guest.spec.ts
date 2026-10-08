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
async function builtTheme(): Promise<{ preset: string; tokens: { primary: string } }> {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync('dist/index.html', 'utf8');
  const m = /<script type="application\/json" id="wp-resolved">([\s\S]*?)<\/script>/.exec(html)!;
  return JSON.parse(m[1]!) as { preset: string; tokens: { primary: string } };
}

type Snap = { bg: { x: number; y: number; a: number }[]; bursts: { x: number; y: number; a: number }[]; zones: unknown[]; running: boolean; frames: number };
const snap = (page: Page) => page.evaluate(() => (window as unknown as { __wpFx?: { snapshot: () => Snap } }).__wpFx?.snapshot() ?? null);

test('cover: tên khách từ ?to=, chạm mở, landing hiện, không lỗi console', async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto('/?to=gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh');
  await expect(page.locator('.cv-guest')).toHaveText('Gia đình anh Mạnh');
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
  await expect(page.locator('.cv-guest')).toHaveText('Cô chú-Tư');
  await page.goto('/?to=<script>alert(1)</script>');
  await expect(page.locator('.cv-guest')).toHaveText('Scriptalert(1)/script');
  await page.goto('/?to=');
  await expect(page.locator('.cv-guest')).toHaveText('Quý khách');
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
  let checked = 0;
  for (const target of ['#guestbook', '#rsvp', '#events']) {
    await page.locator(target).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    for (let i = 0; i < 25; i++) {
      const s = await snap(page);
      const rects = await zoneRects();
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
