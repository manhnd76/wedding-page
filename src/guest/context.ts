import type { WeddingConfig } from '@shared/config/types';
import type { ResolvedTheme } from '@shared/theme/resolve';
import type { GuestNameResult } from '@shared/guest-name';
import type { EffectiveIntensity } from './effects/intensity';

export type Resolved = ResolvedTheme & { ornamentUrl?: string };

/**
 * Trạng thái chạy chung của guest app. Một instance duy nhất (`ctx`).
 * "pause" = các lý do tạm dừng hiệu ứng nền (overlay mở, đang gõ, tab ẩn, cover chưa mở).
 */
export interface GuestCtx {
  config: WeddingConfig;
  resolved: Resolved;
  guest: GuestNameResult;
  fx: EffectiveIntensity;
  base: string;
  opened: boolean;
  /** tên các overlay đang mở (lightbox, sheet, menu) */
  overlays: Set<string>;
  /** đang gõ trong ô nhập (kéo dài 1.5s sau blur) */
  typing: boolean;
  debug: boolean;
  /** chỉ có khi chạy trong khung preview của admin (?preview=1) */
  preview?: {
    simulate: { lowEnd?: boolean; reducedMotion?: boolean };
    /** chạy reveal có hoạt ảnh (Phát lại reveal / kiểu mở); ngược lại hiện ngay */
    animateReveal: boolean;
    /** cho phép burst sau mở thiệp */
    burst: boolean;
  };
}

export const ctx = {} as GuestCtx;

type Handler = (detail?: unknown) => void;
const bus = new Map<string, Set<Handler>>();
export function on(evt: string, fn: Handler): () => void {
  if (!bus.has(evt)) bus.set(evt, new Set());
  bus.get(evt)!.add(fn);
  return () => bus.get(evt)?.delete(fn);
}
export function emit(evt: string, detail?: unknown): void {
  bus.get(evt)?.forEach((fn) => fn(detail));
}

export function openOverlay(name: string): void {
  ctx.overlays.add(name);
  document.documentElement.classList.add('has-overlay');
  emit('pause-change');
}
export function closeOverlay(name: string): void {
  ctx.overlays.delete(name);
  if (!ctx.overlays.size) document.documentElement.classList.remove('has-overlay');
  emit('pause-change');
}

/** Hiệu ứng nền có bị chặn tạm thời không (design 5.7 lớp 3). */
export function fxBlocked(): boolean {
  return !ctx.opened || document.hidden || ctx.overlays.size > 0 || ctx.typing;
}

/** Theo dõi focus trong input/textarea/select (+1.5s sau blur). */
export function watchTyping(): void {
  let t: ReturnType<typeof setTimeout> | null = null;
  const isField = (el: EventTarget | null) => el instanceof HTMLElement && el.matches('input,textarea,select');
  document.addEventListener('focusin', (e) => {
    if (!isField(e.target)) return;
    if (t) clearTimeout(t);
    if (!ctx.typing) { ctx.typing = true; document.documentElement.classList.add('is-typing'); emit('pause-change'); }
  });
  document.addEventListener('focusout', (e) => {
    if (!isField(e.target)) return;
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      if (isField(document.activeElement)) return;
      ctx.typing = false;
      document.documentElement.classList.remove('is-typing');
      emit('pause-change');
    }, 1500);
  });
  document.addEventListener('visibilitychange', () => emit('pause-change'));
  window.addEventListener('pagehide', () => emit('pause-change'));
  window.addEventListener('pageshow', () => emit('pause-change'));
}

/** Toast (role=status) phía trên cụm nút nổi. */
let toastEl: HTMLElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function toast(msg: string): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl?.classList.remove('is-on'), 2500);
}
