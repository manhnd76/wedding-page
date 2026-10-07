/**
 * Helper tạo DOM an toàn: mọi chuỗi động đi qua textContent / setAttribute (không innerHTML),
 * không đặt thuộc tính `style` (CSP style-src không có 'unsafe-inline') - dùng CSSOM setProperty.
 */
type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | number | boolean | null | undefined | EventListener>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs | null, ...children: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) setAttrs(el, attrs);
  append(el, children);
  return el;
}

export function setAttrs(el: Element, attrs: Attrs): void {
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === 'class') {
      el.setAttribute('class', String(v));
    } else if (k === 'style') {
      throw new Error('Không dùng thuộc tính style (CSP) - dùng css()');
    } else {
      el.setAttribute(k, v === true ? '' : String(v));
    }
  }
}

export function append(el: Node, children: (Child | Child[])[]): void {
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false || c === '') continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
}

/** Đặt CSS custom property / thuộc tính qua CSSOM (không bị CSP chặn). */
export function css(el: HTMLElement | SVGElement, props: Record<string, string | number>): void {
  for (const [k, v] of Object.entries(props)) el.style.setProperty(k, String(v));
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function svg(tag: string, attrs: Record<string, string | number> = {}, ...children: SVGElement[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) el.appendChild(c);
  return el;
}

/** Dòng chữ có xuống dòng "\n" -> <br> (không innerHTML). */
export function multiline(text: string): (Node | string)[] {
  const parts = text.split(/\r?\n/);
  const out: (Node | string)[] = [];
  parts.forEach((p, i) => { if (i) out.push(document.createElement('br')); out.push(p); });
  return out;
}

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

export const nonEmpty = (s: string | null | undefined): s is string => !!s && s.trim() !== '';

/** Chạy khi trình duyệt rảnh (fallback setTimeout). */
export function idle(fn: () => void, timeout = 1500): void {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(fn, { timeout });
  else setTimeout(fn, 200);
}

/** Tải file về máy từ Blob (ics, ảnh QR). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename, class: 'sr-only' });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Focus trap đơn giản cho dialog/sheet/lightbox. Trả hàm gỡ. */
export function trapFocus(container: HTMLElement): () => void {
  const sel = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const items = $$(sel, container).filter((x) => x.offsetParent !== null || x === document.activeElement);
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}
