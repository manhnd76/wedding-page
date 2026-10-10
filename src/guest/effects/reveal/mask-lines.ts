/**
 * mask-up: tách heading theo dòng (R2A-01, design-v4a-2a 3.2). Gọi khi đã có layout + font đã tải.
 * `.rv-ln` (overflow clip, padding/margin ±.3em bù nhau -> CLS 0) > `.rv-li` (dịch 100% + .55em + mờ khi ẩn).
 */
import { css, h } from '../../dom';
import { keep, pieces, restore, wrapA11y } from './wrap';

/** Chỉ số dòng cho từng từ theo `offsetTop`; lệch ≤ 2px coi cùng dòng. */
export function groupLines(tops: number[]): number[] {
  let line = -1;
  let top = -Infinity;
  return tops.map((t) => {
    if (Math.abs(t - top) > 2) { line++; top = t; }
    return line;
  });
}

export function splitLines(el: HTMLElement): void {
  restore(el);
  const text = el.textContent ?? '';
  const parts = pieces(keep(el));
  const words = parts.map((p) => h('span', { class: 'rv-m' }, p));
  const tmp: (Node | string)[] = [];
  words.forEach((w, i) => { if (i) tmp.push(' '); tmp.push(w); });
  el.replaceChildren(...tmp);
  const lines = groupLines(words.map((w) => w.offsetTop));
  const vis = h('span');
  let li: HTMLElement | null = null;
  words.forEach((w, i) => {
    if (!li || lines[i] !== lines[i - 1]) {
      li = h('span', { class: 'rv-li' });
      css(li, { '--ln': lines[i]! });
      vis.append(h('span', { class: 'rv-ln' }, li));
    } else li.append(' ');
    li.append(...w.childNodes);
  });
  wrapA11y(el, text, vis);
}

let ro: ResizeObserver | null = null;
let roT: ReturnType<typeof setTimeout> | undefined;
const pend = new Set<HTMLElement>();
const widths = new WeakMap<Element, number>();

/** Bề rộng heading đổi > 1px trước khi hiện -> tách dòng lại (debounce 150ms). */
export function watch(el: HTMLElement): void {
  widths.set(el, el.clientWidth);
  if (!ro && 'ResizeObserver' in window) {
    ro = new ResizeObserver((entries) => {
      for (const e of entries) pend.add(e.target as HTMLElement);
      clearTimeout(roT);
      roT = setTimeout(() => {
        pend.forEach((x) => {
          const w = x.clientWidth;
          if (x.isConnected && !x.classList.contains('is-in') && x.querySelector('.rv-ln') && Math.abs(w - (widths.get(x) ?? w)) > 1) {
            splitLines(x);
            widths.set(x, w);
          }
        });
        pend.clear();
      }, 150);
    });
  }
  ro?.observe(el);
}

export const unwatch = (el: HTMLElement): void => ro?.unobserve(el);
