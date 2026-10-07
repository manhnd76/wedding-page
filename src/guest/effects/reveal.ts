/**
 * Reveal khi cuộn (design 4.0, 5.8): IntersectionObserver một lần, class `is-in`.
 * Phần tử đánh dấu `data-rv="heading|block|image|ornament"` lúc render; engine gán `data-rva=<kiểu nguyên tử>`
 * theo gói đã resolve và cấp cường độ (MATRIX.reveal).
 */
import type { RevealAtom } from '@shared/config/enums';
import { MATRIX, type FxState } from './intensity';
import type { RevealPack } from '@shared/theme/resolve';

type Role = 'heading' | 'block' | 'image' | 'ornament';

/** Kiểu nguyên tử thực tế theo cấp (thuần, để test). */
export function atomFor(role: Role, pack: RevealPack, state: FxState): RevealAtom | 'fade-fast' {
  const mode = MATRIX.reveal[state];
  if (mode === 'none') return 'none';
  if (mode === 'fade200') return 'fade-fast';
  if (mode === 'gentle') return role === 'ornament' ? 'none' : 'fade';
  let a = pack[role];
  if (mode === 'pack-') {
    if (a === 'blur-in') a = 'fade-up';
    if (a === 'parallax-layers') a = 'photo-settle';
  }
  if (!MATRIX.split[state] && (a === 'split-chars' || a === 'split-words')) a = 'fade';
  if (a === 'svg-draw' && MATRIX.svgDraw[state] === 'static') a = 'none';
  return a;
}

let io: IntersectionObserver | null = null;

/** Gán kiểu cho mọi phần tử [data-rv] (gọi trước khi mở cover để tránh nháy). */
export function prepareReveal(root: ParentNode, pack: RevealPack, state: FxState): void {
  const html = document.documentElement;
  html.style.setProperty('--stagger', `${pack.stagger}ms`);
  html.style.setProperty('--reveal-distance', `${MATRIX.revealDistance[state]}px`);
  root.querySelectorAll<HTMLElement>('[data-rv]').forEach((el) => {
    const atom = atomFor(el.dataset.rv as Role, pack, state);
    if (atom === 'none') { el.removeAttribute('data-rva'); return; }
    el.dataset.rva = atom;
  });
}

/** Bắt đầu quan sát (sau khi mở thiệp). */
export function startReveal(root: ParentNode): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-rva]:not(.is-in)'));
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  io?.disconnect();
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io!.unobserve(e.target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  els.forEach((e) => io!.observe(e));
}

/** Hiện tất cả ngay (khách tắt hiệu ứng). */
export function revealAll(root: ParentNode): void {
  io?.disconnect();
  root.querySelectorAll('[data-rva]').forEach((e) => e.classList.add('is-in'));
}
