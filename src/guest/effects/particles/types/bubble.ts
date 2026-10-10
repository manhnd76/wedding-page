import type { ParticleKind } from '../kind';

/**
 * Bong bóng (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng `drawLayers` (sprite-kit).
 * Sinh từ `assets/v4a-2/particles/particles.json` (ô 24×24 tâm 0,0). theme -> c1 = accent-2 (bien-dao #8FD0CF, pastel-han #CFC6E8), c2 = accent (ánh cầu vồng); viền .7 + lòng .08
 */
export const kind: ParticleKind = {
  id: 'bubble', motion: 'float-up', density: 0.7, size: [10, 22], speed: [16, 30],
  sway: [8, 16],
  natural: null, tones: ['accent2', 'accent'],
  variants: [
    { w: 1, layers: [{ circle: [0, 0, 10.6], fill: 'c1', a: 0.08 }, { circle: [0, 0, 10.6], stroke: 'c1', lw: 0.9, a: 0.75 }, { d: 'M4.6 8.6A10 10 0 0 0 9.4 3.2', stroke: 'c2', lw: 1.1, a: 0.45 }, { d: 'M-7.4-2.6A7.8 7.8 0 0 1-2.6-7.4', stroke: '#FFFFFF', lw: 1.6, a: 0.9 }, { circle: [-3.6, -6.6, 0.9], fill: '#FFFFFF', a: 0.95 }] },
  ],
};
