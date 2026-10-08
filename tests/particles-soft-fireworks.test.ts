/**
 * R03 "vùng dịu" (hạt bay qua chữ trọng tâm mờ xuống 0.3, không ẩn hẳn) + R04 pháo hoa
 * (không nổ trên tiêu đề, bán kính ≤ 60px ở mobile, theme sáng dùng sao 4 cánh với primary chỉ 1/3).
 */
import { describe, expect, it } from 'vitest';
import { SOFT_ALPHA, SOFT_MARGIN, SOFT_SELECTOR, alphaTarget, approach, visibleZones, MAX_SOFT_ZONES } from '@guest/effects/particles/geometry';
import { FW_DRAG, FW_MOBILE_MAX_SPEED, fireworksPalette, originBands, pickOrigin } from '@guest/effects/burst/fireworks';

const R = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });

describe('R03: vùng dịu của hạt nền', () => {
  const names = R(40, 200, 320, 320);
  it('vùng dịu là tên khách / tên cặp đôi / lời mời / tiêu đề section', () => {
    for (const s of ['.hero-names', '.ann-names', '.ann-invite', '.sec-head']) expect(SOFT_SELECTOR).toContain(s);
  });
  it('trong vùng (+8px): alpha kẹp ≤ 0.3, KHÔNG về 0', () => {
    expect(SOFT_ALPHA).toBe(0.3);
    expect(alphaTarget(100, 250, 0.9, [], [names])).toBe(0.3);
    expect(alphaTarget(40 - SOFT_MARGIN, 250, 0.9, [], [names])).toBe(0.3);
    expect(alphaTarget(40 - SOFT_MARGIN - 1, 250, 0.9, [], [names])).toBe(0.9);
    // maxA của section thấp hơn 0.3 thì giữ maxA
    expect(alphaTarget(100, 250, 0.2, [], [names])).toBe(0.2);
  });
  it('vùng loại trừ (form) vẫn thắng: alpha 0', () => {
    expect(alphaTarget(100, 250, 0.9, [names], [names])).toBe(0);
  });
  it('fade 200ms khi vào vùng dịu', () => {
    let a = 0.9;
    for (let t = 0; t < 200; t += 16) a = approach(a, 0.3, 16, 200);
    expect(a).toBeCloseTo(0.3, 5);
  });
  it('tối đa 4 vùng dịu (gần giữa màn)', () => {
    const many = Array.from({ length: 9 }, (_, i) => R(0, i * 100, 300, i * 100 + 40));
    expect(visibleZones(many, 360, 900, MAX_SOFT_ZONES)).toHaveLength(4);
  });
});

describe('R04: pháo hoa', () => {
  // section 360px, tiêu đề phía trên, 4 ô số
  const sec = R(0, 0, 360, 600);
  const head = R(40, 60, 320, 190);
  const digits = R(24, 240, 336, 330);

  it('gốc nổ không bao giờ nằm trên tiêu đề (+16px) hay khối số (+12px)', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 500; i++) {
      const o = pickOrigin(sec, digits, rnd, head);
      expect(o.y > head.bottom + 16 || o.y < head.top - 16 || o.x < head.left - 16 || o.x > head.right + 16, JSON.stringify(o)).toBe(true);
      expect(o.x >= digits.left - 12 && o.x <= digits.right + 12 && o.y >= digits.top - 12 && o.y <= digits.bottom + 12).toBe(false);
      expect(o.x).toBeGreaterThanOrEqual(sec.left);
      expect(o.x).toBeLessThanOrEqual(sec.right);
    }
  });

  it('desktop: có dải 2 bên ô số (x < 18% hoặc > 82%)', () => {
    const wide = R(0, 0, 1200, 700);
    const d = R(360, 260, 840, 380);
    const bands = originBands(wide, d, R(300, 60, 900, 200));
    expect(bands.some((b) => b.right <= 1200 * 0.18 + 0.01)).toBe(true);
    expect(bands.some((b) => b.left >= 1200 * 0.82 - 0.01)).toBe(true);
    expect(bands.every((b) => b.top >= 200 + 16)).toBe(true);
  });

  it('mobile: bán kính chùm ≈ v/drag ≤ 60px', () => {
    expect(FW_MOBILE_MAX_SPEED / FW_DRAG).toBeLessThanOrEqual(60);
  });

  it('theme sáng: accent + accent sáng + primary (primary = 1/3 số màu), sprite sao; theme tối giữ chấm vàng', () => {
    const t = { accent: '#C9A86A', primary: '#8A6A3B', primaryDecor: '#8A6A3B' };
    const light = fireworksPalette(t, 'light');
    expect(light.star).toBe(true);
    expect(light.colors).toHaveLength(3);
    expect(light.colors.filter((c) => c === t.primary)).toHaveLength(1);
    expect(light.colors[1]).not.toBe(t.accent);
    const dark = fireworksPalette({ accent: '#9C7A45', primary: '#D9B77E', primaryDecor: '#D9B77E' }, 'dark');
    expect(dark).toEqual({ colors: ['#D9B77E', '#9C7A45'], star: false });
  });
});
