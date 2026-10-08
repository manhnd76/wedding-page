import type { ParticleKind } from '../kind';

const rgba = (hex: string, a: number) =>
  /^#[0-9a-f]{6}$/i.test(hex) ? `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${a})` : hex;

/**
 * Đom đóm (design 5.7; design-review-v1 R24): lõi #FFE7A8 + quầng alpha .25 vẽ sẵn (không shadowBlur mỗi frame),
 * không có lớp nâu đục.
 */
export const kind: ParticleKind = {
  id: 'firefly', motion: 'twinkle', density: 1.5, size: [10, 16], speed: [5, 12], natural: ['#FFE7A8', '#FFF8E6'],
  draw(g, s, color, alt) {
    const r = s / 2;
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, alt);
    grd.addColorStop(0.16, color);
    grd.addColorStop(0.32, rgba(color, 0.25));
    grd.addColorStop(1, rgba(color, 0));
    g.fillStyle = grd;
    g.fillRect(-r, -r, s, s);
  },
};
