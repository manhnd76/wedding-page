/**
 * Hoạ tiết nền B2 (design 1.7.8, solution Rev 5 mục 10.5f) - chunk lười, chỉ tải khi bộ đã resolve khác `none`.
 * Chèn phần tử rỗng `<div class="mtf mtf--{kiểu}" aria-hidden="true">` (h(), không innerHTML/inline style);
 * ảnh mask nằm trong motif.css theo `html[data-motif]` -> chỉ mảnh của kiểu đặt đang dùng được tải.
 * 1 IntersectionObserver bật `.is-playing` (xoay/trôi) + hiện góc khi section vào viewport; không tạo observer khi
 * chuyển động bị tắt (motion off, data-fx off/reduced, máy yếu).
 */
import './motif.css';
import type { PlannedSection } from '@shared/sections/meta';
import { planMotif } from '@shared/motif/plan';
import { ctx } from '../context';
import { h } from '../dom';

const mtf = (cls: string) => h('div', { class: `mtf ${cls}`, 'aria-hidden': 'true' });

/** Trả số phần tử đã chèn (debug/test). */
export function mountMotifs(main: HTMLElement, plan: readonly PlannedSection[]): number {
  const m = ctx.resolved.motif;
  if (!m || m.set === 'none' || !m.placements.length) return 0;
  const html = document.documentElement;
  html.dataset.motif = m.set;
  html.dataset.mtfLevel = m.intensity;
  html.dataset.mtfMotion = m.motion;
  const rot = m.set !== 'chu-hy' ? ' mtf--rot' : '';
  const slots = planMotif(plan, ctx.config, m.placements);
  const watched: HTMLElement[] = [];
  let n = 0;
  slots.forEach((slot) => {
    const sec = main.querySelector<HTMLElement>(`#${CSS.escape(slot.sectionId)}`);
    if (!sec) return;
    // thứ tự section trên trang (1-based) quyết định cặp góc chéo
    const odd = Array.prototype.indexOf.call(main.querySelectorAll('.sec'), sec) % 2 === 0;
    const add: HTMLElement[] = [];
    for (const pl of slot.placements) {
      if (pl === 'corners') add.push(mtf(`mtf--corner ${odd ? 'tl' : 'tr'}`), mtf(`mtf--corner ${odd ? 'br' : 'bl'}`));
      else if (pl === 'band') add.push(mtf('mtf--band'));
      else if (pl === 'pattern') add.push(mtf('mtf--pattern'));
      else if (pl === 'hero') add.push(mtf(`mtf--hero${rot}`));
      else if (pl === 'title') {
        const head = sec.querySelector<HTMLElement>('.sec-head');
        if (head) { head.prepend(mtf(`mtf--title${rot}`)); n++; }
      }
    }
    sec.prepend(...add);
    n += add.length;
    if (sec.querySelector('.mtf')) watched.push(sec);
  });

  const still = m.motion === 'off' || ctx.fx.state === 'off' || ctx.fx.state === 'reduced' || ctx.fx.lowEnd || typeof IntersectionObserver === 'undefined';
  if (still) {
    main.querySelectorAll('.mtf--corner').forEach((el) => el.classList.add('is-in'));
    return n;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const sec = e.target as HTMLElement;
      if (e.isIntersecting) sec.querySelectorAll('.mtf--corner').forEach((el) => el.classList.add('is-in'));
      sec.querySelectorAll('.mtf--rot, .mtf--band').forEach((el) => el.classList.toggle('is-playing', e.isIntersecting));
    }
  }, { rootMargin: '10% 0px' });
  watched.forEach((s) => io.observe(s));
  return n;
}
