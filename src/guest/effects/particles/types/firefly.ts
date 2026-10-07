import type { ParticleKind } from '../kind';

/** Đom đóm: chấm sáng vàng có quầng vẽ sẵn (không shadowBlur mỗi frame) - design 5.7. */
export const kind: ParticleKind = {
  id: 'firefly', motion: 'twinkle', density: 1.5, size: [10, 16], speed: [5, 12], natural: ['#F6D88A', '#FFF2C4'],
  draw(g, s, color, alt) {
    const r = s / 2;
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, alt);
    grd.addColorStop(0.18, color);
    grd.addColorStop(0.4, color + '55');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(-r, -r, s, s);
  },
};
