import type { ParticleKind } from '../kind';

/**
 * Xác pháo giấy (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng `drawLayers` (sprite-kit).
 * Sinh từ `assets/v4a-2/particles/particles.json` (ô 24×24 tâm 0,0). theme -> đỏ xác pháo tự nhiên; mặt sau giấy hồng nhạt #F2B8A2 (lật thấy 2 màu)
 */
export const kind: ParticleKind = {
  id: 'red-paper', motion: 'fall', density: 1, size: [8, 14], speed: [60, 110],
  sway: [8, 18], spin: 3, flip: true,
  natural: ['#C8231F', '#E0392B'], naturalDark: ['#D93A2E', '#F04E3E'],
  variants: [
    { w: 0.45, layers: [{ d: 'M-3.7 -5.5L0 -4.9L3.7 -5.4L3.7 5.5L0.3 4.9L-3.7 5.2Z', fill: 'c1' }, { d: 'M-3.7-2.4H3.7', stroke: '#E8B04A', lw: 0.6, a: 0.55 }], back: [{ d: 'M-3.7 -5.5L0 -4.9L3.7 -5.4L3.7 5.5L0.3 4.9L-3.7 5.2Z', fill: '#F2B8A2' }] },
    { w: 0.35, layers: [{ d: 'M-2.5 -6.8L0 -6L2.5 -6.9L2.5 6.7L0.3 6.6L-2.5 6.6Z', fill: 'c2' }], back: [{ d: 'M-2.5 -6.8L0 -6L2.5 -6.9L2.5 6.7L0.3 6.6L-2.5 6.6Z', fill: '#F2B8A2' }] },
    { w: 0.2, layers: [{ d: 'M-3.4 -3.8L3.8 -3L3.2 3.8L-3.8 3.2Z', fill: 'c1' }], back: [{ d: 'M-3.4 -3.8L3.8 -3L3.2 3.8L-3.8 3.2Z', fill: '#F2B8A2' }] },
  ],
};
