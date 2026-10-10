import type { ParticleKind } from '../kind';

/**
 * Tim giấy (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng `drawLayers` (sprite-kit).
 * Sinh từ `assets/v4a-2/particles/particles.json` (ô 24×24 tâm 0,0). theme -> c1 = accent, c2 = primary-decor; mặt sau tự đậm hơn
 * Vòng sửa P03 (`scripts/particles-overrides.mjs`): nét sáng nằm trong thuỳ trái (path cũ nằm hẳn ngoài tim)
 * Vòng sửa P04 (`scripts/particles-overrides.mjs`): mặt sau = tim màu c2 (theme: primary-decor) .9 + gân giữa sáng (dark của accent nhạt ra nâu xám)
 */
export const kind: ParticleKind = {
  id: 'paper-heart', motion: 'fall', density: 0.8, size: [12, 20], speed: [24, 44],
  sway: [12, 24], spin: 0.7, flip: true,
  natural: null,
  back: [{ d: 'M0 8.9C-11.5 0.5 -7.9 -10 0 -3.7C7.9 -10 11.6 0.5 0 8.9Z', fill: 'c2', a: 0.9 }, { d: 'M0-3.7V8.9', stroke: 'light', lw: 0.6, a: 0.6 }],
  variants: [
    { w: 1, layers: [{ d: 'M0 8.9C-11.5 0.5 -7.9 -10 0 -3.7C7.9 -10 11.6 0.5 0 8.9Z', fill: 'c1' }, { d: 'M0-3.7L12-12V12H0Z', clip: 'M0 8.9C-11.5 0.5 -7.9 -10 0 -3.7C7.9 -10 11.6 0.5 0 8.9Z', fill: 'dark', a: 0.16 }, { d: 'M0-3.7V8.9', stroke: 'light', lw: 0.7, a: 0.7 }, { d: 'M-5.8 -0.4C-6.3 -2 -5.6 -3.6 -4.2 -4C-3.3 -4.3 -2.5 -4 -2 -3.4', stroke: 'light', lw: 1, a: 0.55 }] },
  ],
};
