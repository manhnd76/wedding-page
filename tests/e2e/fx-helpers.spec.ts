/**
 * Kiểm chính helper e2e dùng chung (`fx-helpers.ts`, solution-v4a-2bc.md 0.10) trên bản build.
 * Ít test, chạy nhanh: đảm bảo các đợt v4a dựa vào được `bootPreview` / `coverTiming` / `remainingAfterFastForward`.
 */
import { expect, test } from '@playwright/test';
import { bootPreview, coverTiming, fxSnap, remainingAfterFastForward, watchConsole } from './fx-helpers';

test.describe('fx-helpers (Bước 0)', () => {
  test('bootPreview: config mẫu ⊕ patch được dùng (card-flip), coverTiming đo theo WAAPI', async ({ page }) => {
    const errors = watchConsole(page);
    await bootPreview(page, { cover: { enabled: true, openStyle: 'card-flip' }, effects: { intensity: 'medium' } });
    await expect(page.locator('.cover .cv-flip-inner')).toHaveCount(1);
    const ms = await coverTiming(page);
    // card-flip Vừa: lật 700 + giữ (150|600) + kết 400
    expect(ms).toBeGreaterThan(1100);
    expect(ms).toBeLessThanOrEqual(2400);
    expect(errors).toEqual([]);
  });

  test('bootPreview + fx { target: cover, simulate.reducedMotion }: cấp reduced, cover tự mở bằng fade', async ({ page }) => {
    await bootPreview(page, { cover: { enabled: true, openStyle: 'envelope' } }, { target: 'cover', simulate: { reducedMotion: true } });
    await expect(page.locator('html')).toHaveAttribute('data-fx', 'reduced');
    await expect(page.locator('.cover')).toHaveCount(0, { timeout: 6000 });
    expect(await fxSnap(page)).toBeNull(); // Tắt/reduced: không tạo canvas
  });

  test('remainingAfterFastForward: chạm lần 2 -> phần còn lại ~300 ms; fxSnap có ParticleField sau khi mở', async ({ page }) => {
    await bootPreview(page, { cover: { enabled: true, openStyle: 'envelope' }, effects: { intensity: 'medium' } });
    const rest = await remainingAfterFastForward(page, 400);
    // envelope Vừa ~1950 ms: không tua thì còn ~1500 ms. runSteps hiện tính "đã chạy" từ lúc tạo animation (sớm hơn
    // frame bắt đầu thật ~1 frame) nên đo được ~300-310 ms; ngưỡng ≤ 300 chặt là việc của v4a-2b (anim.ts, mục 1.4).
    expect(rest).toBeGreaterThan(0);
    expect(rest).toBeLessThanOrEqual(350);
    await expect(page.locator('.cover')).toHaveCount(0, { timeout: 2000 });
    await expect.poll(async () => (await fxSnap(page)) !== null, { timeout: 5000 }).toBe(true);
  });
});
