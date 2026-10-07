import type { ParticleKind } from '../kind';

/** Tim phẳng màu primary/accent, nổi lên (design 5.7). */
export const kind: ParticleKind = {
  id: 'heart', motion: 'float-up', density: 1, size: [10, 18], speed: [20, 42], spin: 0.4, natural: null,
  draw(g, s, color) {
    const r = s / 2;
    g.beginPath();
    g.moveTo(0, r * 0.85);
    g.bezierCurveTo(-r * 1.1, r * 0.05, -r * 0.75, -r * 0.95, 0, -r * 0.35);
    g.bezierCurveTo(r * 0.75, -r * 0.95, r * 1.1, r * 0.05, 0, r * 0.85);
    g.fillStyle = color;
    g.fill();
  },
};
