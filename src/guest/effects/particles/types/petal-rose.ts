import type { ParticleKind } from '../kind';

/** Trộn màu hex với trắng (t = tỉ lệ trắng). */
const lighten = (hex: string, t: number) =>
  /^#[0-9a-f]{6}$/i.test(hex)
    ? `#${[1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + 255 * t).toString(16).padStart(2, '0')).join('')}`
    : hex;

/** Cánh hồng (design-review-v1 R13): giọt nước ngược, đầu tròn rộng, gốc nhọn, mép trên có 1 khía; 2 lớp. */
const PETAL = 'M10 23C4 18 1 12 2 7 3 2.5 7 1 10 3.5 13 1 17 2.5 18 7 19 12 16 18 10 23Z';

export const kind: ParticleKind = {
  id: 'petal-rose', motion: 'fall', density: 1, size: [12, 22], speed: [28, 60], flip: true, spin: 1.2, natural: null,
  draw(g, s, color) {
    const k = s / 24;
    g.scale(k, k);
    g.translate(-10, -12);
    const p = new Path2D(PETAL);
    g.fillStyle = color;
    g.fill(p);
    // lớp sáng mix(accent, #fff, 35%) phủ ~40% diện tích phía trên
    g.save();
    g.beginPath();
    g.rect(0, 0, 20, 10);
    g.clip();
    g.fillStyle = lighten(color, 0.35);
    g.fill(p);
    g.restore();
  },
};
