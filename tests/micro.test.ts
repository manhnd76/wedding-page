/** v4a-2a micro (solution-v4a-2a.md 6, 8.1; R2A-05, R2A-07). */
import { describe, expect, it } from 'vitest';
import { ATTN_DUR, SessionLimiter, attentionPlan } from '@guest/effects/micro/micro-attn';
import { odometerSteps } from '@guest/effects/micro/odometer';
import { isDoubleTap } from '@guest/effects/micro/heart-tap';
import { FX_STATES, scrollProgressOn } from '@guest/effects/intensity';

describe('attention ≤ 5s/đợt, ≤ 3 đợt/phiên (R2A-07, WCAG 2.2.2)', () => {
  it('lịch btn-shine 0.4s + 2.9s; name-sparkle 0.8s + 3.8s (≤ 4.7s)', () => {
    expect(attentionPlan('btnShine')).toEqual([400, 2900]);
    expect(attentionPlan('nameSparkle')).toEqual([800, 3800]);
    for (const k of ['btnShine', 'nameSparkle'] as const) expect(Math.max(...attentionPlan(k)) + ATTN_DUR[k]).toBeLessThanOrEqual(5000);
    expect(Math.max(...attentionPlan('nameSparkle')) + ATTN_DUR.nameSparkle).toBeLessThanOrEqual(4700);
  });
  it('SessionLimiter: đợt 4 bị từ chối; đợt mới trước 20s hoặc chưa rời viewport bị từ chối', () => {
    let t = 0;
    const lim = new SessionLimiter<string>(3, 20_000, () => t);
    expect(lim.enter('a')).toBe(true);
    t = 25_000;
    expect(lim.enter('a')).toBe(false); // chưa rời viewport
    lim.leave('a');
    t = 30_000;
    expect(lim.enter('a')).toBe(true);
    lim.leave('a');
    t = 40_000;
    expect(lim.enter('a')).toBe(false); // < 20s từ đợt trước
    t = 51_000;
    expect(lim.enter('a')).toBe(true); // đợt 3
    lim.leave('a');
    t = 100_000;
    expect(lim.enter('a')).toBe(false); // đợt 4
    expect(lim.enter('b')).toBe(true); // phần tử khác tính riêng
  });
});

describe('odometerSteps', () => {
  it('10 -> 09: hàng chục và đơn vị cùng đổi, hàng chục trễ 60ms, đơn vị quay vòng qua 9*', () => {
    expect(odometerSteps(10, 9)).toEqual({ drop: 0, steps: [
      { i: 0, from: 1, to: 0, wrap: false, delay: 60 },
      { i: 1, from: 0, to: 9, wrap: true, delay: 0 },
    ] });
  });
  it('0 -> 9 quay vòng; chỉ cửa sổ đổi mới chạy', () => {
    expect(odometerSteps(0, 9).steps).toEqual([{ i: 1, from: 0, to: 9, wrap: true, delay: 0 }]);
    expect(odometerSteps('45', '44').steps).toEqual([{ i: 1, from: 5, to: 4, wrap: false, delay: 0 }]);
  });
  it('100 -> 99 bỏ cửa sổ đầu', () => {
    const r = odometerSteps(100, 99);
    expect(r.drop).toBe(1);
    expect(r.steps.map((s) => [s.i, s.from, s.to, s.wrap])).toEqual([[0, 0, 9, true], [1, 0, 9, true]]);
  });
});

describe('isDoubleTap / scrollProgressOn', () => {
  it('≤ 300ms và ≤ 24px', () => {
    const a = { t: 0, x: 100, y: 100 };
    expect(isDoubleTap(null, a)).toBe(false);
    expect(isDoubleTap(a, { t: 300, x: 110, y: 110 })).toBe(true);
    expect(isDoubleTap(a, { t: 301, x: 100, y: 100 })).toBe(false);
    expect(isDoubleTap(a, { t: 100, x: 125, y: 100 })).toBe(false);
  });
  it('scrollProgressOn: 5 cấp × bật/tắt (R2A-05)', () => {
    const want: Record<string, boolean> = { off: false, low: false, medium: true, high: true, reduced: true };
    for (const s of FX_STATES) {
      expect(scrollProgressOn(s, true), s).toBe(want[s]);
      expect(scrollProgressOn(s, false), s).toBe(false);
    }
  });
});
