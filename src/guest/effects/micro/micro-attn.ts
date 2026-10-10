/**
 * Micro tự chạy nhóm `attention` (chunk lười, design-v4a-2a §4.1, 4.6, 4.8; R2A-07): btn-shine, name-sparkle, gift-shake.
 * Quy tắc chung: mỗi đợt ≤ 5s (WCAG 2.2.2), ≤ 3 đợt/phiên/phần tử, đợt mới chỉ khi rời viewport rồi vào lại sau ≥ 20s,
 * không chạy khi `fxBlocked()`. Phần tử thêm vào DOM: `aria-hidden` + `pointer-events: none` (CSS).
 */
import { ctx, fxBlocked } from '../../context';
import { h } from '../../dom';
import { icon } from '../../icons';
import { EffectRegistry } from '../registry';

export type AttnKind = 'btnShine' | 'nameSparkle';
/** Thời lượng 1 lần chạy (ms): vệt sáng 900, lấp lánh 3 đốm lệch 120ms ≈ 850. */
export const ATTN_DUR: Record<AttnKind, number> = { btnShine: 900, nameSparkle: 850 };

/** Mốc bắt đầu (ms) các lần chạy trong 1 đợt: vệt sáng 0.4s + 2.9s; lấp lánh 0.8s + 3.8s sau khi tên hiện xong. */
export function attentionPlan(kind: AttnKind): number[] {
  return kind === 'btnShine' ? [400, 2900] : [800, 3800];
}

/** Giới hạn đợt theo phiên cho từng phần tử. */
export class SessionLimiter<T = Element> {
  private m = new Map<T, { n: number; at: number; out: boolean }>();
  constructor(private max = 3, private gapMs = 20_000, private now: () => number = () => performance.now()) {}

  /** Phần tử vào viewport: có được chạy đợt mới không (và ghi nhận nếu có). */
  enter(el: T): boolean {
    const t = this.now();
    const s = this.m.get(el);
    if (!s) { this.m.set(el, { n: 1, at: t, out: false }); return true; }
    if (s.n >= this.max || !s.out || t - s.at < this.gapMs) return false;
    s.n++;
    s.at = t;
    s.out = false;
    return true;
  }

  leave(el: T): void {
    const s = this.m.get(el);
    if (s) s.out = true;
  }
}

const CTA = '.gift-btn, .gb-form [type=submit], .rsvp-card [type=submit]';
const ok = (b: Element) => !b.matches('.btn-outline, [disabled], [aria-busy="true"]');

/** Chạy 1 vệt sáng (class `is-shine` 900ms). */
function shine(b: HTMLElement): void {
  if (!ok(b)) return;
  b.classList.remove('is-shine');
  void b.offsetWidth;
  b.classList.add('is-shine');
  setTimeout(() => b.classList.remove('is-shine'), ATTN_DUR.btnShine * 2);
}

/** Desktop hover/focus-visible: chạy 1 lần, cách ≥ 2s. */
function onHover(el: HTMLElement, run: () => void): void {
  let last = 0;
  const go = (e: Event) => {
    if (e.type === 'focus' && !el.matches(':focus-visible')) return;
    if (performance.now() - last < 2000) return;
    last = performance.now();
    run();
  };
  el.addEventListener('pointerenter', go);
  el.addEventListener('focus', go);
}

const hover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Chạy `fn` khi reveal của phần tử xong (`rv-done`) - ngay nếu không có reveal / đã xong. */
function whenDone(el: HTMLElement, fn: () => void): void {
  if (!el.dataset.rva || el.classList.contains('rv-done')) { fn(); return; }
  const mo = new MutationObserver(() => { if (el.classList.contains('rv-done')) { mo.disconnect(); fn(); } });
  mo.observe(el, { attributes: true, attributeFilter: ['class'] });
}
let mounted = false;

export function mount(): void {
  if (mounted) return;
  mounted = true;
  const lim = new SessionLimiter<Element>();
  // ---- btn-shine: hiện ≥ 60% được 400ms -> 2 lần (0.4s, 2.9s)
  if (ctx.config.effects.micro.buttonShine) {
    const btns = Array.from(document.querySelectorAll<HTMLElement>(CTA)).filter(ok);
    const timers = new Map<Element, ReturnType<typeof setTimeout>[]>();
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        const b = e.target as HTMLElement;
        timers.get(b)?.forEach(clearTimeout);
        if (!e.isIntersecting) { lim.leave(b); continue; }
        const [first, second] = attentionPlan('btnShine');
        timers.set(b, [setTimeout(() => {
          if (fxBlocked() || !lim.enter(b)) return;
          shine(b);
          timers.get(b)?.push(setTimeout(() => { if (!fxBlocked()) shine(b); }, second! - first!));
        }, first)]);
      }
    }, { threshold: 0.6 });
    for (const b of btns) { io.observe(b); if (hover()) onHover(b, () => shine(b)); }
  }
  // ---- name-sparkle: 3 đốm quanh "&" ở hero
  const amp = document.querySelector<HTMLElement>('.hero-names .nm-amp');
  const names = amp?.closest<HTMLElement>('.hero-names');
  if (amp && names) {
    amp.classList.add('has-spk');
    amp.append(...[12, 16, 9].map((s) => h('span', { class: 'spk', 'aria-hidden': 'true' }, icon('sparkle', s))));
    const fontOk = () => document.fonts?.check?.(`16px ${getComputedStyle(names).fontFamily}`) !== false;
    const burst = () => {
      if (fxBlocked() || !fontOk()) return;
      amp.classList.remove('is-spk');
      void amp.offsetWidth;
      amp.classList.add('is-spk');
      setTimeout(() => amp.classList.remove('is-spk'), ATTN_DUR.nameSparkle + 200);
    };
    const nameLim = new SessionLimiter<Element>(2);
    let first = true;
    const start = () => {
      if (!nameLim.enter(names)) return;
      const plan = attentionPlan('nameSparkle');
      // đợt đầu: 2 lần (≤ 4.7s); đợt sau khi cuộn lại hero sau ≥ 20s: 1 lần
      (first ? plan : plan.slice(0, 1)).forEach((t) => setTimeout(burst, t));
      first = false;
    };
    const ready = () => new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) start(); else nameLim.leave(names);
    }).observe(names);
    whenDone(names, ready);
  }
  // ---- gift-shake: 1 lần 200ms sau khi hình hộp quà hiện xong; desktop hover/focus nút quà
  const gift = document.querySelector<HTMLElement>('.gift-art:not(.gift-songhy)');
  if (gift) {
    const shake = () => {
      if (fxBlocked()) return;
      gift.classList.remove('is-shake');
      void gift.getBoundingClientRect();
      gift.classList.add('is-shake');
    };
    gift.addEventListener('animationend', () => gift.classList.remove('is-shake'));
    whenDone(gift, () => setTimeout(shake, 200));
    const btn = document.querySelector<HTMLElement>('.gift-btn');
    if (btn && hover()) onHover(btn, shake);
  }
}

// preview: 1 vệt sáng trên CTA hiển thị đầu tiên, bỏ giới hạn phiên
EffectRegistry.register('micro:buttonShine', {
  play() {
    const b = Array.from(document.querySelectorAll<HTMLElement>(CTA)).find((x) => ok(x) && x.offsetParent !== null);
    if (!b) return;
    b.scrollIntoView({ block: 'center' });
    setTimeout(() => shine(b), 200);
  },
});
