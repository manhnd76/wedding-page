import type { ParticleKind } from '../kind';

/** Bụi vàng 1-3px, rơi rất chậm + nhấp nháy (design 5.7). */
export const kind: ParticleKind = {
  id: 'gold-dust', motion: 'twinkle', density: 1.5, size: [3, 6], speed: [6, 14], natural: null,
  draw(g, s, color) {
    const r = s / 2;
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, color);
    grd.addColorStop(0.45, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(-r, -r, s, s);
  },
};
