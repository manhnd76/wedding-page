import type { ParticleKind } from '../kind';

/**
 * Bụi nắng (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng `drawLayers` (sprite-kit).
 * Sinh từ `assets/v4a-2/particles/particles.json` (ô 24×24 tâm 0,0). theme -> lõi kem sáng + vành nâu ấm (nền sáng hoai-co #F4ECDD vẫn thấy); theme tối: vàng nhạt
 */
export const kind: ParticleKind = {
  id: 'dust-mote', motion: 'drift', density: 1, size: [5, 12], speed: [4, 10],
  sway: [4, 10], alpha: [0.45, 0.8], twinkle: 0.25,
  natural: ['#B8925A', '#FFF1CC'], naturalDark: ['#FFE7B0', '#FFF6E0'],
  variants: [
    { w: 1, layers: [{ radial: [0, 0, 12], stops: [[0, 'c2', 1], [0.35, 'c2', 0.85], [0.6, 'c1', 0.45], [1, 'c1', 0]] }] },
  ],
};
