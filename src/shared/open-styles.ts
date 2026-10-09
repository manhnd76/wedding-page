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
  /** có hạt (canvas ParticleField / burst) ở mức Vừa hoặc Nhiều */
  usesParticles: boolean;
  /**
   * Họ bố cục (design-v4a-2bc §1.1): `object` = đầu đề + vật thể ở giữa; `gate` = cổng toàn màn + biển chữ `.cv-plaque`;
   * `flat` = toàn màn không biển (light-gather, ink-spread). Không có = 4 kiểu cũ (DOM riêng).
   */
  family?: 'object' | 'gate' | 'flat';
}

export const OPEN_META: Record<OpenStyle, OpenMeta> = {
  // 4 kiểu đang có (số thật theo module hiện tại)
  envelope: { cost: 'medium', ms: 1950, usesParticles: false },
  'card-flip': { cost: 'medium', ms: 1700, usesParticles: false },
  'fade-zoom': { cost: 'low', ms: 700, usesParticles: false },
  none: { cost: 'low', ms: 200, usesParticles: false },
  // 13 kiểu v4a-2b: ms = tổng mức Vừa theo module thật (design-v4a-2bc §2), chi phí theo bảng 1.1
  curtain: { cost: 'low', ms: 1250, usesParticles: true, family: 'gate' },
  'wax-seal': { cost: 'medium', ms: 1700, usesParticles: true, family: 'object' },
  origami: { cost: 'medium', ms: 1800, usesParticles: true, family: 'object' },
  'double-door': { cost: 'medium', ms: 1600, usesParticles: true, family: 'gate' },
  'flower-gate': { cost: 'medium', ms: 1800, usesParticles: true, family: 'gate' },
  scroll: { cost: 'medium', ms: 2100, usesParticles: true, family: 'object' },
  'card-3d': { cost: 'low', ms: 1400, usesParticles: false, family: 'object' },
  'light-gather': { cost: 'high', ms: 2400, usesParticles: true, family: 'flat' },
  'gift-box': { cost: 'medium', ms: 1900, usesParticles: true, family: 'object' },
  'moon-gate': { cost: 'medium', ms: 1600, usesParticles: true, family: 'gate' },
  book: { cost: 'low', ms: 1800, usesParticles: false, family: 'object' },
  'ink-spread': { cost: 'medium', ms: 1200, usesParticles: false, family: 'flat' },
  polaroid: { cost: 'low', ms: 2200, usesParticles: false, family: 'object' },
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
