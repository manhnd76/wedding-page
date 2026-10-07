import type { ParticleKind } from '../kind';

/** Hoa đào Tết: 5 cánh hồng đậm + nhụy (design 5.7). */
export const kind: ParticleKind = {
  id: 'petal-peach', motion: 'fall', density: 1, size: [14, 22], speed: [26, 52], flip: true, spin: 1, natural: ['#E8798F', '#F4A7B5'],
  draw(g, s, color, alt) {
    const r = s / 2;
    g.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      g.save();
      g.rotate((i * Math.PI * 2) / 5);
      g.beginPath();
      g.ellipse(0, -r * 0.52, r * 0.34, r * 0.48, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.beginPath();
    g.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    g.fillStyle = alt;
    g.fill();
  },
};
