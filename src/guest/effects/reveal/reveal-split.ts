/**
 * Chunk lười tách chữ/dòng (tải trong `prepareReveal` khi plan có heading mask-up/split, lúc cover đang hiện):
 * split-words / split-chars (design-v4a-2a 3.4, R2A-04) + mask-up theo dòng (`mask-lines.ts`, R2A-01) + hàng đợi wipe. Tách grapheme: NFC + `Intl.Segmenter('vi')`,
 * fallback regex - không bao giờ tách dấu khỏi nguyên âm. Span không có padding/overflow (không CLS, không cắt dấu).
 */
import { css, h } from '../../dom';
import { keep, pieces, restore, wrapA11y } from './wrap';

export { restore } from './wrap';
export { splitLines, unwatch, watch } from './mask-lines';
export { WipeQueue } from './wipe-queue';

const GRAPHEME = /\P{M}\p{M}*/gu;

/** Tách chuỗi thành từ, mỗi từ là danh sách mảnh (từ nguyên hoặc grapheme). Thuần. */
export function segment(text: string, kind: 'words' | 'chars', useSegmenter = true): string[][] {
  const words = text.normalize('NFC').split(/\s+/).filter(Boolean);
  if (kind === 'words') return words.map((w) => [w]);
  const seg = useSegmenter && typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('vi', { granularity: 'grapheme' }) : null;
  return words.map((w) => (seg ? [...seg.segment(w)].map((x) => x.segment) : w.match(GRAPHEME) ?? [w]));
}

/** Độ trễ giữa các mảnh (ms): từ min(40, 400/(n-1)), ký tự min(28, 450/(n-1)) - tổng ≤ 900ms. */
export const pieceStagger = (kind: 'words' | 'chars', n: number): number =>
  Math.floor(Math.min(kind === 'words' ? 40 : 28, (kind === 'words' ? 400 : 450) / Math.max(1, n - 1)));

export function split(el: HTMLElement, kind: 'words' | 'chars'): void {
  restore(el);
  const text = el.textContent ?? '';
  const vis = h('span');
  let k = 0;
  pieces(keep(el)).forEach((p, i) => {
    if (i) vis.append(' ');
    const w = h('span', { class: 'rv-w' });
    const parts = typeof p !== 'string' ? [p] : kind === 'words' ? [p] : segment(p, 'chars')[0] ?? [p];
    if (kind === 'words') { css(w, { '--k': k++ }); w.append(...parts); }
    else for (const g of parts) { const c = h('span', { class: 'rv-c' }, g); css(c, { '--k': k++ }); w.append(c); }
    vis.append(w);
  });
  css(el, { '--rv-ps': `${pieceStagger(kind, k)}ms` });
  wrapA11y(el, text, vis);
}
