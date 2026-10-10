import type { ParticleKind } from '../kind';

/**
 * Lấp lánh (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng `drawLayers` (sprite-kit).
 * Sinh từ `assets/v4a-2/particles/particles.json` (ô 24×24 tâm 0,0). theme -> c1 = accent (theme tối: primary vàng), lõi trắng .9 (bài học R04: không chấm nâu đục)
 */
export const kind: ParticleKind = {
  id: 'sparkle', motion: 'twinkle', density: 1.2, size: [8, 14], speed: [4, 10],
  sway: [2, 6], spin: 0.2,
  natural: null, tones: ['accent', 'accent'], tonesDark: ['primary', 'primary'],
  variants: [
    { w: 0.7, layers: [{ d: 'M0 -11C2 -2 2 -2 11 0C2 2 2 2 0 11C-2 2 -2 2 -11 0C-2 -2 -2 -2 0 -11Z', fill: 'c1' }, { d: 'M0 -6C1.3 -1.3 1.3 -1.3 6 0C1.3 1.3 1.3 1.3 0 6C-1.3 1.3 -1.3 1.3 -6 0C-1.3 -1.3 -1.3 -1.3 0 -6Z', fill: 'light', a: 0.9 }, { circle: [0, 0, 1.4], fill: '#FFFFFF', a: 0.95 }] },
    { w: 0.3, layers: [{ d: 'M0 -10C1.2 -1.2 1.2 -1.2 10 0C1.2 1.2 1.2 1.2 0 10C-1.2 1.2 -1.2 1.2 -10 0C-1.2 -1.2 -1.2 -1.2 0 -10Z', fill: 'c1' }, { d: 'M3.5 -3.5C0.7 0 0.7 0 3.5 3.5C0 0.7 0 0.7 -3.5 3.5C-0.7 0 -0.7 0 -3.5 -3.5C0 -0.7 0 -0.7 3.5 -3.5Z', fill: 'c1', a: 0.6 }, { circle: [0, 0, 1.2], fill: '#FFFFFF', a: 0.95 }] },
  ],
};
