import type { ParticleKind } from '../kind';

/**
 * Chấm mực (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng `drawLayers` (sprite-kit).
 * Sinh từ `assets/v4a-2/particles/particles.json` (ô 24×24 tâm 0,0). theme -> mực đen (theme tối: mực sáng); alpha .12–.22 theo hạt (§5.7: .15)
 */
export const kind: ParticleKind = {
  id: 'ink-dot', motion: 'fall', density: 0.6, size: [6, 14], speed: [6, 14],
  sway: [3, 8], spin: 0.2, alpha: [0.12, 0.22],
  natural: ['#1C1C1A', '#3A3A36'], naturalDark: ['#F2E9E1', '#CFC4BA'],
  variants: [
    { w: 0.5, layers: [{ d: 'M9.8 -0.7C9.7 1 9.2 4.1 8.3 5.3C7.4 6.5 6.1 6 4.5 6.6C2.8 7.1 0 8.5 -1.7 8.3C-3.3 8.2 -4.1 6.5 -5.3 5.6C-6.4 4.6 -7.9 3.7 -8.6 2.4C-9.4 1.2 -10.4 -0.1 -9.9 -1.8C-9.4 -3.6 -6.9 -6.9 -5.6 -7.9C-4.3 -8.8 -3.9 -7.5 -2.3 -7.5C-0.7 -7.5 2.4 -8.5 4.2 -8C6.1 -7.6 7.7 -5.8 8.6 -4.6C9.6 -3.4 9.8 -2.3 9.8 -0.7Z', fill: 'c1' }] },
    { w: 0.3, layers: [{ d: 'M6 0.1C6.3 1.5 5.8 3.5 4.7 4.8C3.6 6 0.9 7.4 -0.5 7.6C-2 7.9 -2.9 7 -3.9 6.2C-4.9 5.5 -6.1 4.5 -6.6 3.2C-7.1 1.8 -6.9 -0.6 -6.7 -2C-6.6 -3.4 -6.7 -4.5 -5.7 -5C-4.7 -5.6 -2.4 -5.7 -0.9 -5.4C0.5 -5.2 1.8 -4.4 2.9 -3.5C4.1 -2.5 5.7 -1.3 6 0.1Z', fill: 'c1' }, { circle: [6.6, -5.4, 1.6], fill: 'c1' }, { circle: [8.4, 1.6, 0.9], fill: 'c2' }] },
    { w: 0.2, layers: [{ circle: [0, 0, 4.2], fill: 'c2' }] },
  ],
};
