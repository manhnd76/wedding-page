import type { ParticleKind } from '../kind';

/**
 * Tuyết (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng `drawLayers` (sprite-kit).
 * Sinh từ `assets/v4a-2/particles/particles.json` (ô 24×24 tâm 0,0). theme -> trắng + vành xanh xám .5 để thấy trên nền sáng; theme tối bỏ vành. depth: cỡ lớn = rơi nhanh + rõ hơn
 * Vòng sửa P02 (`scripts/particles-overrides.mjs`): theme sáng: lòng tuyết hơi lạnh #EEF3F8 + stops đặc hơn để đọc như khối (không thành vòng rỗng); naturalDark giữ
 */
export const kind: ParticleKind = {
  id: 'snow', motion: 'fall', density: 1.5, size: [2, 6], speed: [14, 30],
  sway: [6, 14], depth: true,
  natural: ['#EEF3F8', '#9FB3C8'], naturalDark: ['#FFFFFF', 'rgba(255,255,255,0)'],
  variants: [
    { w: 1, layers: [{ radial: [0, 0, 12], stops: [[0, 'c1', 1], [0.6, 'c1', 0.95], [0.8, 'c2', 0.45], [1, 'c2', 0]] }] },
  ],
};
