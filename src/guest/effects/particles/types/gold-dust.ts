import type { ParticleKind } from '../kind';

/**
 * Bụi vàng (design 5.7; design-review-v1 R24): ≤ 4px, rơi rất chậm + nhấp nháy.
 * Màu "theme" dùng vàng sáng tự nhiên (không lấy accent nâu đục của theme tối).
 */
export const kind: ParticleKind = {
  id: 'gold-dust', motion: 'twinkle', density: 1.5, size: [2, 4], speed: [6, 14], natural: ['#F3D48C', '#FFF4D6'],
  draw(g, s, color, alt) {
    const r = s / 2;
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, alt);
    grd.addColorStop(0.35, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(-r, -r, s, s);
  },
};
