import type { ImageRef } from '@shared/config/types';
import type { PlannedSection } from '@shared/sections/meta';
import { assetUrl } from '@shared/assets';
import { ctx } from '../context';
import { css, h, nonEmpty } from '../dom';
import { ornament } from '../icons';

export interface SectionShellOpts {
  eyebrow?: string;
  heading?: string;
  /** heading dùng font script */
  scriptHeading?: boolean;
  cls?: string;
}

/** <section> chuẩn: id cố định, số thứ tự + eyebrow EN, h2, ornament nhỏ (design 4.0). */
export function shell(p: PlannedSection, o: SectionShellOpts, ...body: (Node | null | false | undefined)[]): HTMLElement {
  const id = p.item.id;
  const hid = `h-${id}`;
  const eyebrowText = [p.number, nonEmpty(o.eyebrow) ? o.eyebrow : null].filter(Boolean);
  const header = nonEmpty(o.heading)
    ? h('header', { class: 'sec-head' },
        eyebrowText.length ? h('p', { class: 'eyebrow', 'data-rv': 'block' },
          p.number ? h('span', { class: 'eyebrow-n' }, p.number) : null,
          p.number && nonEmpty(o.eyebrow) ? h('span', { class: 'eyebrow-dot', 'aria-hidden': 'true' }, ' · ') : null,
          nonEmpty(o.eyebrow) ? h('span', { lang: 'en' }, o.eyebrow) : null) : null,
        h('h2', { id: hid, class: o.scriptHeading ? 'h2 h2-script' : 'h2', 'data-rv': 'heading' }, o.heading),
        withRv(ornament(ctx.resolved.ornamentUrl ?? '', 'title', 'orn sec-orn', 80, 16)))
    : null;
  const sec = h('section', {
    id,
    class: `sec sec-${p.item.type}${p.tone ? ` tone-${p.tone}` : ''}${o.cls ? ` ${o.cls}` : ''}`,
    'data-type': p.item.type,
    'data-pd': p.meta.particle.density,
    'data-po': p.meta.particle.maxOpacity,
    ...(header ? { 'aria-labelledby': hid } : { 'aria-label': p.meta.label }),
  }, h('div', { class: 'sec-in' }, header, ...body));
  return sec;
}

function withRv(el: SVGElement | null): SVGElement | null {
  el?.setAttribute('data-rv', 'ornament');
  return el;
}

/** <img> có width/height (chống CLS), lazy ngoài màn đầu. */
export function img(ref: NonNullable<ImageRef>, o: { eager?: boolean; cls?: string; sizes?: string; thumb?: boolean } = {}): HTMLImageElement {
  const src = assetUrl(o.thumb && ref.thumb ? ref.thumb : ref.src, ctx.base);
  const el = h('img', {
    src, alt: ref.alt ?? '', class: o.cls,
    width: ref.w || null, height: ref.h || null,
    loading: o.eager ? 'eager' : 'lazy', decoding: 'async',
    ...(o.eager ? { fetchpriority: 'high' } : {}),
  });
  if (ref.focalPoint) css(el, { 'object-position': `${Math.round(ref.focalPoint.x * 100)}% ${Math.round(ref.focalPoint.y * 100)}%` });
  el.addEventListener('error', () => el.closest('.frame')?.classList.add('is-broken'), { once: true });
  return el;
}

/** Ảnh trong khung theo theme (photoFrame) - giữ aspect-ratio cố định, placeholder dominantColor. */
export function framed(ref: ImageRef, o: { ratio: string; fallbackText?: string; cls?: string; eager?: boolean }): HTMLElement {
  const fig = h('figure', { class: `frame frame--${ctx.resolved.photoFrame}${o.cls ? ` ${o.cls}` : ''}`, 'data-rv': 'image' });
  css(fig, { '--ar': o.ratio });
  if (ref?.src) {
    if (ref.dominantColor) css(fig, { '--ph': ref.dominantColor });
    fig.appendChild(img(ref, { eager: !!o.eager }));
  } else {
    fig.classList.add('is-empty');
    fig.appendChild(h('span', { class: 'frame-mono', 'aria-hidden': 'true' }, o.fallbackText ?? ''));
  }
  return fig;
}

/** Dải phân cách giữa 2 section (container chèn, section không tự vẽ). */
export function divider(kind: string): HTMLElement {
  const d = h('div', { class: `divider divider--${kind}`, 'aria-hidden': 'true' });
  if (kind === 'ornament' || kind === 'cloud' || kind === 'deco-fan') {
    const o = ornament(ctx.resolved.ornamentUrl ?? '', 'divider', 'orn div-orn');
    if (o) { o.setAttribute('data-rv', 'ornament'); d.appendChild(o); }
  }
  return d;
}

/** Ngày giờ theo giờ Việt Nam. */
const TZ = 'Asia/Ho_Chi_Minh';
export function vnParts(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, ...o }).format(d);
  return {
    date: d,
    weekday: f({ weekday: 'long' }),
    day: f({ day: '2-digit' }),
    month: f({ month: 'numeric' }),
    year: f({ year: 'numeric' }),
    time: f({ hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

export function vnDayKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export const cap1 = (s: string) => (s ? s.charAt(0).toLocaleUpperCase('vi-VN') + s.slice(1) : s);
