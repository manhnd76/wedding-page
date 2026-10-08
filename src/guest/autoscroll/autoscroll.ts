/**
 * Tự động cuộn sau khi mở thiệp (design-review-v1 mục 5; decisions 2026-10-08). Chunk lazy, tải sau khi cover gỡ xong.
 * - bắt đầu sau `startDelayMs`, tăng tốc 800ms, `flow` dừng ngắn đầu mỗi section
 * - khách wheel/touch/chuột/phím/kéo thanh cuộn/focus ô nhập/mở lightbox-sheet-menu/chọn chữ -> DỪNG HẲN, không tự tiếp tục
 * - nút tròn 44px (cột phải, trên nút nhạc): Dừng/Tiếp tục; lần dừng đầu có toast; tới cuối trang thì ẩn
 * - tab ẩn / resize: tạm dừng rồi tự chạy lại (nguyên nhân hệ thống)
 * - reduced-motion: không tự chạy; khách bấm thì chạy steady 32px/s
 */
import { ctx, emit, on, toast } from '../context';
import { h } from '../dom';
import { icon } from '../icons';
import { AutoScroller, REDUCED_SPEED, autoStartBlocker, isModifierOnly, type AutoScrollState, type UserStop } from './core';

export interface AutoScrollMount {
  /** đã khôi phục vị trí cuộn cũ (reload giữa trang) */
  restored: boolean;
  hasHash: boolean;
  /** preview admin "Phát lại tự cuộn": chạy ngay ~8s rồi dừng */
  previewMs?: number;
  onPreviewDone?: () => void;
}

const PREFETCH_SCREENS = 1.5;

export function mountAutoScroll(o: AutoScrollMount): AutoScroller | null {
  const cfg = ctx.config.effects.autoScroll;
  const html = document.documentElement;
  const fxState = ctx.fx.state;
  const reduced = fxState === 'reduced';
  const blocker = o.previewMs ? null : autoStartBlocker({
    enabled: cfg.enabled, fxState, reducedMotion: reduced, restoredScroll: o.restored, hasHash: o.hasHash,
    pageH: html.scrollHeight, vh: window.innerHeight,
  });
  if (blocker === 'disabled' || blocker === 'short') return null;

  const sectionMarks = () => Array.from(document.querySelectorAll<HTMLElement>('#main > .sec'))
    .map((el) => ({ top: el.getBoundingClientRect().top + window.scrollY, type: el.dataset.type ?? '' }));
  const sc = new AutoScroller({
    getY: () => window.scrollY,
    setY: (y) => window.scrollTo(0, y),
    maxY: () => Math.max(0, html.scrollHeight - window.innerHeight),
    vh: () => window.innerHeight,
    dpr: () => window.devicePixelRatio || 1,
  }, { speed: cfg.speed, mode: cfg.mode, dwellMs: cfg.dwellMs, landing: !!document.querySelector('#main > .sec-thankyou'), sections: sectionMarks() });

  // ---- nút Dừng/Tiếp tục
  const btn = h('button', { type: 'button', class: 'fl-btn fl-auto', 'aria-pressed': 'false', 'aria-label': 'Tiếp tục tự cuộn', 'data-testid': 'autoscroll-btn' });
  const right = document.querySelector('.fl-right');
  // DOM sau nút nhạc (thứ tự Tab: nhạc -> tự cuộn), CSS `order` đưa lên trên nút nhạc (design-review-v1 5.2)
  right?.append(btn);
  btn.hidden = blocker === 'off'; // cấp "Tắt": chỉ có trong menu nhanh

  let raf = 0;
  let prefetchAt = 0;
  const loop = (t: number) => {
    raf = 0;
    if (sc.tick(t)) raf = requestAnimationFrame(loop);
    if (t - prefetchAt > 500 && (sc.state === 'running' || sc.state === 'dwell')) { prefetchAt = t; prefetch(); }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const running = (s: AutoScrollState) => s === 'running' || s === 'dwell' || s === 'waiting' || s === 'paused';
  const sync = (s: AutoScrollState) => {
    const on_ = running(s);
    html.classList.toggle('is-autoscroll', on_ && s !== 'waiting');
    btn.setAttribute('aria-pressed', String(on_));
    btn.setAttribute('aria-label', on_ ? 'Dừng tự cuộn' : 'Tiếp tục tự cuộn');
    btn.replaceChildren(icon(on_ ? 'pause' : 'playDown', 20));
    btn.dataset.state = s;
    if (s === 'done') btn.hidden = true;
    if (s === 'stopped' && sc.stopReason !== 'manual' && sc.userStops === 1) toast('Đã dừng tự cuộn · bấm ▶ để tiếp tục', 3000);
    emit('autoscroll-change', on_);
  };
  sc.onChange = sync;
  sync(sc.state);

  const play = () => {
    if (reduced) { sc.opts.mode = 'steady'; sc.opts.speed = REDUCED_SPEED; }
    sc.opts.sections = sectionMarks();
    btn.hidden = false;
    sc.resume(performance.now());
    kick();
  };
  const toggle = () => { if (running(sc.state)) sc.stop('manual'); else play(); };
  btn.addEventListener('click', toggle);
  on('autoscroll-toggle', toggle);

  // ---- khách tác động -> dừng hẳn (bỏ qua thao tác trên chính nút tự cuộn)
  const own = (e: Event) => e.target instanceof Node && btn.contains(e.target);
  const stop = (r: UserStop) => (e: Event) => { if (!own(e) && running(sc.state)) sc.stop(r); };
  const opt = { passive: true, capture: true } as const;
  window.addEventListener('wheel', stop('wheel'), opt);
  window.addEventListener('touchstart', stop('touch'), opt);
  window.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') stop('pointer')(e); }, opt);
  window.addEventListener('keydown', (e) => { if (!isModifierOnly(e.key)) stop('key')(e); }, true);
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLElement && e.target.matches('input,textarea,select,button,a')) stop('focus')(e);
  });
  document.addEventListener('selectionchange', () => {
    const sel = document.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim() && running(sc.state)) sc.stop('selection');
  });
  on('pause-change', () => { if (ctx.overlays.size > 0 && running(sc.state)) sc.stop('overlay'); });
  // ---- hệ thống: tạm dừng rồi tự chạy lại
  document.addEventListener('visibilitychange', () => {
    const now = performance.now();
    if (document.hidden) sc.pause('hidden', now); else sc.visible(now);
    kick();
  });
  window.addEventListener('resize', () => { sc.pause('resize', performance.now()); sc.opts.sections = sectionMarks(); kick(); }, { passive: true });

  if (o.previewMs) {
    sc.schedule(performance.now(), 300);
    setTimeout(() => { if (running(sc.state)) sc.stop('manual'); o.onPreviewDone?.(); }, o.previewMs);
    kick();
  } else if (!blocker) {
    sc.schedule(performance.now(), cfg.startDelayMs);
    kick();
  }
  if (ctx.debug) (window as unknown as Record<string, unknown>).__wpAuto = sc;
  return sc;
}

/** Ảnh lazy trong 1.5 màn phía trước -> tải ngay để không cuộn vào ô trống. */
function prefetch(): void {
  const lim = window.innerHeight * (1 + PREFETCH_SCREENS);
  document.querySelectorAll<HTMLImageElement>('#main img[loading="lazy"]').forEach((im) => {
    if (im.getBoundingClientRect().top < lim) im.loading = 'eager';
  });
}
