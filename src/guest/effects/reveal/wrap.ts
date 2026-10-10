/**
 * Giữ/khôi phục nội dung gốc cho mask-up/split (chunk lười cùng reveal-split, solution-v4a-2a.md 2.5).
 * Không innerHTML: giữ node gốc trong WeakMap rồi `replaceChildren`.
 */
import { h } from '../../dom';

const ORIG = new WeakMap<Element, Node[]>();

/** Lưu node gốc (1 lần) + trả về. */
export function keep(el: HTMLElement): Node[] {
  let o = ORIG.get(el);
  if (!o) ORIG.set(el, (o = [...el.childNodes]));
  return o;
}

/** Khôi phục nội dung gốc (trả lại kerning, tự xuống dòng khi phóng chữ). */
export function restore(el: HTMLElement): void {
  const o = ORIG.get(el);
  if (!o) return;
  el.replaceChildren(...o);
  ORIG.delete(el);
}

/** Từ (chuỗi NFC) hoặc khối inline (bản sao phần tử con, vd `<span lang="en">`); bỏ `.sr-only`/`[aria-hidden]`. */
export function pieces(nodes: Node[]): (string | Node)[] {
  const out: (string | Node)[] = [];
  for (const n of nodes) {
    if (n.nodeType === 3) { for (const w of (n.textContent ?? '').normalize('NFC').split(/\s+/)) if (w) out.push(w); }
    else if (n instanceof Element && !n.matches('.sr-only,[aria-hidden="true"]')) out.push(n.cloneNode(true));
  }
  return out;
}

/** Đặt phần hiển thị đã tách: chuỗi gốc cho trình đọc màn hình + bản `aria-hidden`. */
export function wrapA11y(el: HTMLElement, text: string, vis: HTMLElement): void {
  vis.className = 'rv-vis';
  vis.setAttribute('aria-hidden', 'true');
  el.replaceChildren(h('span', { class: 'sr-only' }, text), vis);
}
