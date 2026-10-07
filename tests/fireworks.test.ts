import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FW_COOLDOWN_MS, FW_HOLD_MS, FireworksTrigger } from '@guest/effects/burst/fireworks-trigger';
import { pickOrigin } from '@guest/effects/burst/fireworks';

const SHOW_MS = 2400;

function setup(extra: Partial<ConstructorParameters<typeof FireworksTrigger>[0]> = {}) {
  const fire = vi.fn(() => new Promise<void>((r) => setTimeout(r, SHOW_MS)));
  const t = new FireworksTrigger({ mode: 'every-view', fire, now: () => Date.now(), ...extra });
  return { t, fire };
}

describe('pháo hoa every-view (design 5.7) - fake timers', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-01T10:00:00+07:00')); });
  afterEach(() => vi.useRealTimers());

  it('cần >= 50% liên tục 400ms mới bắn', async () => {
    const { t, fire } = setup();
    t.update(0.6);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS - 1);
    expect(fire).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('lướt nhanh (< 400ms) thì không bắn', async () => {
    const { t, fire } = setup();
    t.update(0.7);
    await vi.advanceTimersByTimeAsync(300);
    t.update(0.3);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fire).not.toHaveBeenCalled();
  });

  it('dưới 50% nhưng chưa < 10% rồi vào lại: không lên đạn lại', async () => {
    const { t, fire } = setup();
    t.update(0.8);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + SHOW_MS + FW_COOLDOWN_MS + 10);
    expect(fire).toHaveBeenCalledTimes(1);
    t.update(0.3); // ra khỏi ngưỡng vào nhưng vẫn > 10%
    t.update(0.9);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + 10);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('đứng yên trong section không bắn lặp', async () => {
    const { t, fire } = setup();
    t.update(1);
    await vi.advanceTimersByTimeAsync(60_000);
    t.update(0.95);
    t.update(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('rời < 10% rồi vào lại sau cooldown -> bắn lần 2', async () => {
    const { t, fire } = setup();
    t.update(0.6);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + SHOW_MS);
    t.update(0.05);
    await vi.advanceTimersByTimeAsync(FW_COOLDOWN_MS);
    t.update(0.6);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS);
    expect(fire).toHaveBeenCalledTimes(2);
  });

  it('cooldown 15s tính từ lúc chùm cuối tắt; vào lại trong cooldown thì bỏ (không xếp hàng)', async () => {
    const { t, fire } = setup();
    t.update(0.6);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS); // bắn ở t=400
    await vi.advanceTimersByTimeAsync(SHOW_MS); // tắt ở t=2800 -> cooldown tới 17800
    t.update(0.05);
    await vi.advanceTimersByTimeAsync(5000);
    t.update(0.6); // vào lại t=7800 (trong cooldown)
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS);
    expect(fire).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(20_000); // chờ hết cooldown nhưng không xếp hàng
    expect(fire).toHaveBeenCalledTimes(1);
    // đã dùng mất lần lên đạn? -> chưa: lần trong cooldown không bắn nên vẫn còn đạn khi vào lại hợp lệ
    t.update(0.05);
    t.update(0.6);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS);
    expect(fire).toHaveBeenCalledTimes(2);
  });

  it('cooldown đo từ lúc show KẾT THÚC chứ không phải lúc bắt đầu', async () => {
    const { t, fire } = setup();
    t.update(0.6);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS); // bắt đầu show
    await vi.advanceTimersByTimeAsync(SHOW_MS);
    t.update(0.05);
    // 15s sau lúc BẮT ĐẦU nhưng chưa đủ 15s sau lúc kết thúc
    await vi.advanceTimersByTimeAsync(FW_COOLDOWN_MS - SHOW_MS - FW_HOLD_MS);
    t.update(0.6);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('không bắn khi bị chặn (tab ẩn / lightbox / đang gõ)', async () => {
    let blocked = true;
    const { t, fire } = setup({ isBlocked: () => blocked });
    t.update(0.7);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + 10);
    expect(fire).not.toHaveBeenCalled();
    blocked = false;
    t.update(0.05);
    t.update(0.7);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + 10);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('mode off: không bao giờ bắn', async () => {
    const { t, fire } = setup({ mode: 'off' });
    t.update(1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fire).not.toHaveBeenCalled();
  });

  it('wedding-day: chỉ bắn đúng ngày, 1 lần/phiên', async () => {
    let fired = false;
    let today = false;
    const { t, fire } = setup({ mode: 'wedding-day', isWeddingDay: () => today, sessionFired: { get: () => fired, set: () => { fired = true; } } });
    t.update(0.7);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + 10);
    expect(fire).not.toHaveBeenCalled();
    today = true;
    t.update(0.05);
    t.update(0.7);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + SHOW_MS + FW_COOLDOWN_MS);
    expect(fire).toHaveBeenCalledTimes(1);
    t.update(0.05);
    t.update(0.7);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + 10);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('wedding-day: đồng hồ về 0 lúc đang xem -> bắn 1 lần', async () => {
    let fired = false;
    const { t, fire } = setup({ mode: 'wedding-day', isWeddingDay: () => false, sessionFired: { get: () => fired, set: () => { fired = true; } } });
    t.update(0.7);
    await vi.advanceTimersByTimeAsync(FW_HOLD_MS + 10);
    t.countdownReachedZero();
    await vi.advanceTimersByTimeAsync(10);
    t.countdownReachedZero();
    expect(fire).toHaveBeenCalledTimes(1);
  });
});

describe('vị trí gốc nổ', () => {
  it('không đè khối 4 ô số', () => {
    const sec = { left: 0, top: 0, right: 400, bottom: 600 };
    const digits = { left: 40, top: 200, right: 360, bottom: 300 };
    let s = 1;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 500; i++) {
      const o = pickOrigin(sec, digits, rnd);
      const inside = o.x >= digits.left - 12 && o.x <= digits.right + 12 && o.y >= digits.top - 12 && o.y <= digits.bottom + 12;
      expect(inside).toBe(false);
      expect(o.x).toBeGreaterThanOrEqual(sec.left);
      expect(o.x).toBeLessThanOrEqual(sec.right);
    }
  });
});
