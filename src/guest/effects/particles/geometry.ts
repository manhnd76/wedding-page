/**
 * Phần tính toán thuần (không DOM) của ParticleField - để unit test.
 * Design 5.7: lớp 1 (mật độ theo section) + lớp 2 (vùng loại trừ).
 */
export interface Rect { left: number; top: number; right: number; bottom: number }

export const EXCLUSION_MARGIN = 16;
export const MAX_EXCLUSION_ZONES = 6;

export function insideAny(x: number, y: number, rects: readonly Rect[], margin = EXCLUSION_MARGIN): boolean {
  for (const r of rects) {
    if (x >= r.left - margin && x <= r.right + margin && y >= r.top - margin && y <= r.bottom + margin) return true;
  }
  return false;
}

/** Lọc vùng loại trừ: chỉ vùng cắt viewport, tối đa 6 (ưu tiên vùng gần giữa màn). */
export function visibleZones(rects: readonly Rect[], vw: number, vh: number, max = MAX_EXCLUSION_ZONES): Rect[] {
  const inView = rects.filter((r) => r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && r.bottom > r.top);
  if (inView.length <= max) return inView;
  const mid = vh / 2;
  return [...inView].sort((a, b) => Math.abs((a.top + a.bottom) / 2 - mid) - Math.abs((b.top + b.bottom) / 2 - mid)).slice(0, max);
}

export interface SectionVis { visible: number; density: number; maxOpacity: number; group?: 'hero-thankyou' | 'other' }

/**
 * Hệ số mật độ + opacity tối đa = trung bình có trọng số theo phần chiều cao section đang hiện.
 * scope hero-thankyou: chỉ hero/thankyou góp mật độ, phần còn lại = 0.
 */
export function weightedDensity(list: readonly SectionVis[], scope: 'all' | 'hero-thankyou' = 'all'): { density: number; maxOpacity: number } {
  let w = 0;
  let d = 0;
  let o = 0;
  for (const s of list) {
    if (s.visible <= 0) continue;
    const dens = scope === 'hero-thankyou' && s.group !== 'hero-thankyou' ? 0 : s.density;
    w += s.visible;
    d += s.visible * dens;
    o += s.visible * s.maxOpacity;
  }
  if (w === 0) return { density: 0, maxOpacity: 0 };
  return { density: d / w, maxOpacity: o / w };
}

/** Bộ giới hạn sinh hạt: tối đa `perSec` hạt/giây (design 5.7: 2 hạt/giây). */
export class SpawnLimiter {
  private budget: number;
  constructor(private perSec = 2, initial = 0) { this.budget = initial; }
  tick(dtMs: number): void { this.budget = Math.min(this.perSec, this.budget + (dtMs / 1000) * this.perSec); }
  take(): boolean {
    if (this.budget >= 1) { this.budget -= 1; return true; }
    return false;
  }
}

/** Tiến alpha về đích với tốc độ hết 1 đơn vị trong `ms` (fade 200ms khi vào vùng loại trừ). */
export function approach(cur: number, target: number, dtMs: number, ms = 200): number {
  const step = dtMs / ms;
  return cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);
}
