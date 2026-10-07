import type { ParticleKind } from '../kind';

/** Cánh hồng cong 2 tông (design 5.7). */
export const kind: ParticleKind = {
  id: 'petal-rose', motion: 'fall', density: 1, size: [12, 22], speed: [28, 60], flip: true, spin: 1.2, natural: null,
  draw(g, s, color, alt) {
    const r = s / 2;
    g.beginPath();
    g.moveTo(0, -r);
    g.bezierCurveTo(r * 0.95, -r * 0.7, r * 0.8, r * 0.55, 0, r);
    g.bezierCurveTo(-r * 0.8, r * 0.55, -r * 0.95, -r * 0.7, 0, -r);
    g.fillStyle = color;
    g.fill();
    g.beginPath();
    g.moveTo(0, -r * 0.8);
    g.bezierCurveTo(r * 0.45, -r * 0.4, r * 0.35, r * 0.4, 0, r * 0.8);
    g.fillStyle = alt;
    g.globalAlpha = 0.45;
    g.fill();
    g.globalAlpha = 1;
  },
};
