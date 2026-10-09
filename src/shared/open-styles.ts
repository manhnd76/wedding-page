/**
 * Meta kiểu mở thiệp (chi phí / thời lượng mức Vừa / có dùng hạt) + quy tắc hạ cấp thuần
 * (solution-v4a-2bc.md 1.1, 1.5). Dùng chung guest + admin; không phụ thuộc DOM.
 * Bước 0 tạo khung; v4a-2b sở hữu sau đó (điền/chỉnh số theo module thật).
 */
import type { OpenStyle } from './config/enums.ts';

export type OpenCost = 'low' | 'medium' | 'high';
/** Chế độ chạy kiểu mở (= `MATRIX.openStyle` của guest). */
export type OpenMode = 'fade200' | 'light' | 'full' | 'full+';

export interface OpenMeta {
  cost: OpenCost;
  /** tổng thời lượng mức Vừa (ms), ≤ 2400 */
  ms: number;
  /** có hạt (canvas ParticleField / burst) ở mức ≥ Vừa */
  usesParticles: boolean;
}

export const OPEN_META: Record<OpenStyle, OpenMeta> = {
  // 4 kiểu đang có (số thật theo module hiện tại)
  envelope: { cost: 'medium', ms: 1950, usesParticles: false },
  'card-flip': { cost: 'medium', ms: 1700, usesParticles: false },
  'fade-zoom': { cost: 'low', ms: 700, usesParticles: false },
  none: { cost: 'low', ms: 200, usesParticles: false },
  // 13 kiểu v4a-2b (bảng 1.1, cột Vừa / Chi phí / Hạt)
  curtain: { cost: 'low', ms: 1200, usesParticles: true },
  'wax-seal': { cost: 'medium', ms: 1700, usesParticles: true },
  origami: { cost: 'medium', ms: 1800, usesParticles: false },
  'double-door': { cost: 'medium', ms: 1600, usesParticles: true },
  'flower-gate': { cost: 'medium', ms: 1800, usesParticles: true },
  scroll: { cost: 'medium', ms: 2100, usesParticles: false },
  'card-3d': { cost: 'low', ms: 1400, usesParticles: false },
  'light-gather': { cost: 'high', ms: 2400, usesParticles: true },
  'gift-box': { cost: 'medium', ms: 1900, usesParticles: true },
  'moon-gate': { cost: 'medium', ms: 1600, usesParticles: true },
  book: { cost: 'low', ms: 1800, usesParticles: false },
  'ink-spread': { cost: 'medium', ms: 1200, usesParticles: false },
  polaroid: { cost: 'low', ms: 2200, usesParticles: false },
};

export interface EffectiveOpen { id: OpenStyle; mode: OpenMode }

/**
 * Kiểu mở + chế độ thật sự chạy (bảng 1.5):
 *  - `fade200` (Tắt / reduced-motion): giữ `id` để `prepare` vẽ hình tĩnh, phát fade 200 ms;
 *  - máy yếu + chi phí Cao: `fade-zoom` bản Nhẹ;
 *  - máy yếu + chi phí Vừa: bản Nhẹ (kể cả khi `high` đã bị hạ còn `medium`);
 *  - còn lại: giữ nguyên.
 * `lowEnd` = `autoDowngrade` && máy yếu (caller tính).
 */
export function effectiveOpen(id: OpenStyle, mode: OpenMode, lowEnd: boolean): EffectiveOpen {
  if (mode === 'fade200' || !lowEnd) return { id, mode };
  const cost = OPEN_META[id].cost;
  if (cost === 'high') return { id: 'fade-zoom', mode: 'light' };
  if (cost === 'medium') return { id, mode: 'light' };
  return { id, mode };
}
