/**
 * Ma trận cường độ (design 5.3 + 5.10) dạng bảng tra MATRIX[effect][state]
 * và cách tính cường độ hiệu lực (solution 8.4).
 */
import type { Intensity } from '@shared/config/enums';

export type FxState = Intensity | 'reduced';
export const FX_STATES: readonly FxState[] = ['off', 'low', 'medium', 'high', 'reduced'];

type Row<T> = Record<FxState, T>;
const row = <T>(off: T, low: T, medium: T, high: T, reduced: T): Row<T> => ({ off, low, medium, high, reduced });

export interface FireworksSpec { bursts: number; perBurst: number }

/**
 * Mỗi dòng là 1 hiệu ứng; cột theo cấp. Giá trị là "chế độ" để module hiệu ứng đọc.
 * Ghi chú cột reduced = prefers-reduced-motion (design 5.4).
 */
export const MATRIX = {
  /** Kiểu mở thiệp: fade200 = fade 200ms; light = bản Nhẹ; full = đầy đủ; full+ = đầy đủ + phần "Nhiều" */
  openStyle: row<'fade200' | 'light' | 'full' | 'full+'>('fade200', 'light', 'full', 'full+', 'fade200'),
  /** Burst sau mở thiệp: 0 = không, 1 = số hạt Vừa, 2 = số hạt Nhiều */
  burstOnOpen: row<0 | 1 | 2>(0, 0, 1, 2, 0),
  /** Số hạt nền cơ sở (trước hệ số loại/section/theme) */
  particles: row(0, 8, 16, 28, 0),
  /** Gió theo cuộn */
  wind: row(false, false, false, true, false),
  /** Pháo hoa đếm ngược */
  fireworks: row<FireworksSpec | null>(null, { bursts: 1, perBurst: 24 }, { bursts: 3, perBurst: 40 }, { bursts: 5, perBurst: 40 }, null),
  /** Reveal: none = hiện ngay; gentle = mọi gói rơi về gentle; pack- = gói đã chọn bỏ blur-in/parallax-layers; pack = đầy đủ; fade200 = fade ≤ 200ms */
  reveal: row<'none' | 'gentle' | 'pack-' | 'pack' | 'fade200'>('none', 'gentle', 'pack-', 'pack', 'fade200'),
  /** Khoảng dịch chuyển reveal (px) - design 5.3 */
  revealDistance: row(0, 0, 24, 32, 0),
  /** split-chars / split-words */
  split: row(false, false, true, true, false),
  /** svg-draw: static = hiện nét hoàn chỉnh */
  svgDraw: row<'static' | 'draw'>('static', 'draw', 'draw', 'draw', 'static'),
  parallaxLayers: row(false, false, false, true, false),
  /** parallax ảnh nền hero/thank-you (5.3) */
  parallax: row(false, false, false, true, false),
  kenBurns: row(false, false, true, true, false),
  photoTilt: row(false, false, true, true, false),
  /** btn-shine, cta-breathe, name-sparkle */
  attention: row(false, false, true, true, false),
  /** btn-press, copy-morph, stepper-bump, segmented-slide: instant = đổi màu tức thì; color = chỉ đổi màu/opacity */
  press: row<'instant' | 'anim' | 'color'>('instant', 'anim', 'anim', 'anim', 'color'),
  wishFly: row<'insert' | 'heart4' | 'variant' | 'insert-fade'>('insert', 'heart4', 'variant', 'variant', 'insert-fade'),
  rsvpSuccess: row<'static' | 'draw' | 'draw+confetti-small' | 'draw+confetti'>('static', 'draw', 'draw+confetti-small', 'draw+confetti', 'static'),
  countdown: row<'instant' | 'fade' | 'full'>('instant', 'fade', 'full', 'full', 'instant'),
  /** scroll-progress: config = theo config admin (R2A-05: chỉ khi admin bật, ở Vừa/Nhiều/reduced) */
  scrollProgress: row<boolean | 'config'>(false, false, 'config', 'config', 'config'),
  /** chữ ký / line-draw */
  signature: row<'instant' | 'anim'>('instant', 'anim', 'anim', 'anim', 'instant'),
  /** tim bay, heartbeat */
  heartbeat: row(false, false, true, true, false),
} as const;

export type FxEffect = keyof typeof MATRIX;

export function fx<E extends FxEffect>(effect: E, state: FxState): (typeof MATRIX)[E][FxState] {
  return MATRIX[effect][state];
}

export interface DeviceInfo {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  saveData?: boolean;
  reducedMotion: boolean;
}

export interface IntensityInput {
  intensity: Intensity;
  respectReducedMotion: boolean;
  autoDowngrade: boolean;
  guestToggle: boolean;
  /** lựa chọn của khách lưu localStorage */
  guestPref: 'on' | 'off' | null;
}

export interface EffectiveIntensity {
  /** cấp đã tính (trước khi áp reduced) */
  level: Intensity;
  /** cột tra ma trận */
  state: FxState;
  reduced: boolean;
  lowEnd: boolean;
}

const ORDER: Intensity[] = ['off', 'low', 'medium', 'high'];

export function downgrade(level: Intensity): Intensity {
  const i = ORDER.indexOf(level);
  return i <= 1 ? level : ORDER[i - 1]!;
}

export function isLowEnd(d: DeviceInfo): boolean {
  return (d.hardwareConcurrency !== undefined && d.hardwareConcurrency <= 4)
    || (d.deviceMemory !== undefined && d.deviceMemory <= 2)
    || d.saveData === true;
}

export function computeIntensity(cfg: IntensityInput, dev: DeviceInfo): EffectiveIntensity {
  let level = cfg.intensity;
  const pref = cfg.guestToggle ? cfg.guestPref : null;
  if (pref === 'off') return { level: 'off', state: 'off', reduced: false, lowEnd: false };
  const lowEnd = cfg.autoDowngrade && isLowEnd(dev);
  if (lowEnd) level = downgrade(level);
  // khách chủ động "Bật hiệu ứng" thì bỏ qua reduced-motion (design 5.4)
  if (pref === 'on' && level === 'off') level = 'low';
  const reduced = cfg.respectReducedMotion && dev.reducedMotion && pref !== 'on';
  return { level, state: reduced ? 'reduced' : level, reduced, lowEnd };
}

/** Trần cứng hạt nền SAU khi nhân hệ số (design 5.7 lớp 4): 40, máy yếu 12; cấp Tắt/reduced = 0. */
export function particleCap(state: FxState, lowEnd: boolean): number {
  if (MATRIX.particles[state] === 0) return 0;
  return lowEnd ? 12 : 40;
}

/** Số hạt mục tiêu = cấp × hệ số loại × densityFactor theme × hệ số section, ≤ trần. */
export function targetParticleCount(state: FxState, lowEnd: boolean, typeFactor: number, themeFactor: number, sectionFactor: number): number {
  const cap = particleCap(state, lowEnd);
  return Math.min(cap, Math.round(MATRIX.particles[state] * typeFactor * themeFactor * sectionFactor));
}

/** Số hạt burst onOpen theo loại (design 5.7: Nhẹ/Vừa/Nhiều). */
export const BURST_COUNTS: Record<string, [number, number, number]> = {
  confetti: [0, 80, 120],
  petals: [0, 30, 50],
  gold: [0, 60, 100],
  'red-paper': [0, 80, 120],
  'heart-burst': [0, 8, 12],
};

export function burstCount(kind: string, state: FxState): number {
  const c = BURST_COUNTS[kind];
  if (!c) return 0;
  const mode = MATRIX.burstOnOpen[state];
  return mode === 0 ? 0 : mode === 1 ? c[1] : c[2];
}

/** Pháo hoa: máy yếu luôn bản Nhẹ (design 5.7). */
export function fireworksSpec(state: FxState, lowEnd: boolean): FireworksSpec | null {
  const s = MATRIX.fireworks[state];
  if (!s) return null;
  return lowEnd ? { bursts: 1, perBurst: 24 } : s;
}

/** Thanh tiến độ đọc hiện khi và chỉ khi admin bật + cấp Vừa/Nhiều/reduced (design-v4a-2a 4.5). */
export const scrollProgressOn = (state: FxState, cfg: boolean): boolean => fx('scrollProgress', state) === 'config' && cfg;
