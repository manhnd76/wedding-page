/**
 * Lightbox (chunk lazy, design 4.8): FLIP mở từ thumb 320ms, vuốt ngang đổi ảnh, vuốt xuống đóng,
 * double-tap zoom 2x, nút ‹ › Đóng 48px, bộ đếm, phím ← → Esc, focus trap, khoá cuộn, preload ảnh kề.
 */
import type { ImageRef } from '@shared/config/types';
import { assetUrl } from '@shared/assets';
import { closeOverlay, ctx, openOverlay } from '../context';
import { css, h, trapFocus } from '../dom';
import { icon } from '../icons';

type Img = NonNullable<ImageRef>;

export function openLightbox(list: Img[], start: number, from: HTMLElement): void {
  let i = start;
  let zoom = false;
  const pic = h('img', { class: 'lb-img', alt: '', decoding: 'async' });
  const counter = h('p', { class: 'lb-count', 'aria-live': 'polite' });
  const btnClose = h('button', { type: 'button', class: 'lb-btn lb-close', 'aria-label': 'Đóng' }, icon('close', 24));
  const btnPrev = h('button', { type: 'button', class: 'lb-btn lb-prev', 'aria-label': 'Ảnh trước' }, icon('chevL', 26));
  const btnNext = h('button', { type: 'button', class: 'lb-btn lb-next', 'aria-label': 'Ảnh sau' }, icon('chevR', 26));
  const stage = h('div', { class: 'lb-stage' }, pic);
  const box = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Xem ảnh' }, stage, counter, btnPrev, btnNext, btnClose);
  const reduced = ctx.fx.state === 'off' || ctx.fx.state === 'reduced';

  const show = (n: number) => {
    i = (n + list.length) % list.length;
    const im = list[i]!;
    pic.src = assetUrl(im.src, ctx.base);
    pic.alt = im.alt || `Ảnh ${i + 1}`;
    if (im.w && im.h) { pic.width = im.w; pic.height = im.h; }
    counter.textContent = `${i + 1} / ${list.length}`;
    setZoom(false);
    for (const k of [i - 1, i + 1]) {
      const nb = list[(k + list.length) % list.length];
      if (nb) new Image().src = assetUrl(nb.src, ctx.base);
    }
  };
  const setZoom = (z: boolean) => { zoom = z; box.classList.toggle('is-zoom', z); };
  const close = () => {
    document.removeEventListener('keydown', onKey);
    untrap();
    box.classList.remove('is-open');
    setTimeout(() => box.remove(), reduced ? 0 : 200);
    document.documentElement.classList.remove('lb-on');
    closeOverlay('lightbox');
    from.focus({ preventScroll: true });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
  };
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(i - 1));
  btnNext.addEventListener('click', () => show(i + 1));
  document.addEventListener('keydown', onKey);

  // ---- cử chỉ: vuốt ngang/xuống, double-tap
  let sx = 0, sy = 0, st = 0, dx = 0, dy = 0, axis: 'x' | 'y' | null = null, lastTap = 0;
  stage.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st = performance.now(); dx = dy = 0; axis = null; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (!stage.hasPointerCapture(e.pointerId) || zoom) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis === 'x') css(pic, { transform: `translateX(${dx}px)` });
    if (axis === 'y' && dy > 0) css(pic, { transform: `translateY(${dy}px) scale(${1 - Math.min(0.3, dy / 1200)})` });
  });
  stage.addEventListener('pointerup', () => {
    const v = Math.abs(dx) / Math.max(1, performance.now() - st);
    const w = stage.clientWidth;
    pic.style.removeProperty('transform');
    if (axis === 'x' && (Math.abs(dx) > w * 0.2 || v > 0.3)) show(dx < 0 ? i + 1 : i - 1);
    else if (axis === 'y' && dy > 120) close();
    else if (!axis) {
      const now = performance.now();
      if (now - lastTap < 300) setZoom(!zoom);
      lastTap = now;
    }
    axis = null;
  });

  document.body.appendChild(box);
  document.documentElement.classList.add('lb-on');
  openOverlay('lightbox');
  show(start);
  const untrap = trapFocus(box);
  btnClose.focus({ preventScroll: true });
  // FLIP: phóng từ vị trí thumb
  if (!reduced && typeof pic.animate === 'function') {
    const r = from.getBoundingClientRect();
    const cx = r.left + r.width / 2 - window.innerWidth / 2;
    const cy = r.top + r.height / 2 - window.innerHeight / 2;
    const s = Math.max(0.15, r.width / Math.min(window.innerWidth, 1200));
    pic.animate([{ transform: `translate(${cx}px, ${cy}px) scale(${s})`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  requestAnimationFrame(() => box.classList.add('is-open'));
}
