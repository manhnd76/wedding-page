/** Section tĩnh: hero, couple, families, announcement, timeline, loveStory, thankyou, footer (design 4.1-4.4, 4.7, 4.12, 4.13). */
import type { PlannedSection } from '@shared/sections/meta';
import { mainEvent } from '@shared/sections/meta';
import { fillGuest } from '@shared/guest-name';
import { assetUrl, telHref } from '@shared/assets';
import type { Person } from '@shared/config/types';
import { ctx } from '../context';
import { css, h, multiline, nonEmpty } from '../dom';
import { icon, ornament } from '../icons';
import { namesBlock } from '../cover/cover';
import { cap1, framed, img, shell, vnParts } from './common';

const initials = (name: string) => name.trim().split(/\s+/).pop()?.charAt(0).toLocaleUpperCase('vi-VN') ?? '';

export function hero(p: PlannedSection): HTMLElement {
  const c = ctx.config.content.hero;
  const im = c.image?.src ? c.image : null;
  const media = im
    ? h('div', { class: 'hero-media' }, img(im, { eager: true, cls: 'hero-img' }), h('div', { class: 'hero-shade', 'aria-hidden': 'true' }))
    : null;
  if (im?.dominantColor && media) css(media, { '--ph': im.dominantColor });
  const names = namesBlock('hero-names', 'h1');
  names.setAttribute('tabindex', '-1');
  names.id = 'hero-title';
  names.setAttribute('data-rv', 'heading');
  const sec = h('section', { id: p.item.id, class: `sec sec-hero ${im ? 'has-img' : 'no-img'}`, 'data-type': 'hero', 'data-pd': p.meta.particle.density, 'data-po': p.meta.particle.maxOpacity, 'aria-labelledby': 'hero-title' },
    media,
    h('div', { class: 'hero-content' },
      nonEmpty(c.eyebrow) ? h('p', { class: 'eyebrow hero-eyebrow', lang: 'en', 'data-rv': 'block' }, c.eyebrow) : null,
      names,
      nonEmpty(c.dateText) ? h('p', { class: 'hero-date', 'data-rv': 'block' }, c.dateText) : null,
      nonEmpty(c.lunarText) ? h('p', { class: 'hero-lunar', 'data-rv': 'block' }, c.lunarText) : null,
      h('a', { class: 'hero-cue', href: '#main-next', 'aria-label': 'Cuộn xuống' }, icon('chevD', 22))));
  return sec;
}

function person(pp: Person, side: 'groom' | 'bride'): HTMLElement {
  return h('article', { class: `person person--${side}`, 'data-rv': 'block' },
    framed(pp.photo, { ratio: '4 / 5', fallbackText: initials(pp.shortName || pp.fullName), cls: 'person-photo' }),
    nonEmpty(pp.label) ? h('p', { class: 'eyebrow person-label' }, pp.label) : null,
    h('h3', { class: 'h3 person-name' }, pp.fullName || pp.shortName),
    nonEmpty(pp.bio) ? h('p', { class: 'person-bio muted' }, pp.bio) : null);
}

export function couple(p: PlannedSection): HTMLElement {
  const c = ctx.config.content.couple;
  const a = c.order === 'bride-first' ? person(c.bride, 'bride') : person(c.groom, 'groom');
  const b = c.order === 'bride-first' ? person(c.groom, 'groom') : person(c.bride, 'bride');
  return shell(p, { eyebrow: c.eyebrow, heading: c.heading },
    h('div', { class: 'couple-grid' }, a, h('p', { class: 'couple-amp', 'aria-hidden': 'true', 'data-rv': 'ornament' }, '&'), b));
}

export function families(p: PlannedSection): HTMLElement {
  const f = ctx.config.content.families;
  const col = (fam: typeof f.groom) => h('div', { class: 'fam-col', 'data-rv': 'block' },
    f.showPhotos && fam.photo?.src ? framed(fam.photo, { ratio: '3 / 2', cls: 'fam-photo' }) : null,
    h('h3', { class: 'eyebrow fam-title' }, fam.title),
    nonEmpty(fam.parentsLabel) ? h('p', { class: 'muted fam-label' }, fam.parentsLabel) : null,
    nonEmpty(fam.father) ? h('p', { class: 'fam-name' }, fam.father) : null,
    nonEmpty(fam.mother) ? h('p', { class: 'fam-name' }, fam.mother) : null,
    nonEmpty(fam.address) ? h('p', { class: 'small muted fam-addr' }, fam.address) : null);
  return shell(p, { eyebrow: f.eyebrow, heading: f.heading },
    h('div', { class: 'fam-grid' }, col(f.groom), h('div', { class: 'fam-rule', 'aria-hidden': 'true', 'data-rv': 'ornament' }), col(f.bride)));
}

export function announcement(p: PlannedSection): HTMLElement {
  const a = ctx.config.content.announcement;
  const cp = ctx.config.content.couple;
  const ev = mainEvent(ctx.config);
  const parts = ev ? vnParts(ev.startAt) : null;
  const [n1, n2] = cp.order === 'bride-first' ? [cp.bride.fullName, cp.groom.fullName] : [cp.groom.fullName, cp.bride.fullName];
  const lunar = ev?.lunarText || ctx.config.content.hero.lunarText;
  const invite = nonEmpty(a.inviteLine) ? fillGuest(a.inviteLine, ctx.guest.display) : '';
  return shell(p, { eyebrow: a.eyebrow, heading: a.heading, cls: 'sec-print' },
    nonEmpty(a.subheading) ? h('p', { class: 'ann-sub', 'data-rv': 'block' }, a.subheading) : null,
    h('p', { class: 'ann-names', 'data-rv': 'block' }, h('span', null, n1), h('span', { class: 'ann-amp', 'aria-hidden': 'true' }, '&'), h('span', { class: 'sr-only' }, ' và '), h('span', null, n2)),
    invite ? h('p', { class: 'ann-invite', 'data-rv': 'block' }, invite) : null,
    nonEmpty(a.inviteLine2) ? h('p', { class: 'ann-invite', 'data-rv': 'block' }, a.inviteLine2) : null,
    parts ? h('div', { class: 'ann-date', 'data-rv': 'block' },
      h('span', { class: 'ann-date-side' }, cap1(parts.weekday)),
      h('time', { class: 'ann-date-day', datetime: ev!.startAt }, parts.day),
      h('span', { class: 'ann-date-side' }, `Tháng ${parts.month}`, h('br'), parts.year)) : null,
    nonEmpty(lunar) ? h('p', { class: 'muted ann-lunar', 'data-rv': 'block' }, `(${lunar.replace(/^\(|\)$/g, '')})`) : null,
    parts ? h('p', { class: 'ann-time', 'data-rv': 'block' }, `Vào lúc ${parts.time}`) : null);
}

export function timeline(p: PlannedSection): HTMLElement {
  const t = ctx.config.content.timeline;
  return shell(p, { eyebrow: t.eyebrow, heading: t.heading },
    h('ol', { class: 'tl' }, h('li', { class: 'tl-axis', 'aria-hidden': 'true', 'data-rv': 'ornament' }),
      ...t.items.filter((i) => nonEmpty(i.label)).map((i) => h('li', { class: 'tl-item', 'data-rv': 'block' },
        h('span', { class: 'tl-dot', 'aria-hidden': 'true' }),
        h('p', { class: 'tl-when' }, [i.time, i.date].filter(nonEmpty).join(' · ')),
        h('p', { class: 'tl-label' }, i.label)))));
}

export function loveStory(p: PlannedSection): HTMLElement {
  const t = ctx.config.content.loveStory;
  return shell(p, { eyebrow: t.eyebrow, heading: t.heading },
    h('ol', { class: 'tl tl-story' }, h('li', { class: 'tl-axis', 'aria-hidden': 'true', 'data-rv': 'ornament' }),
      ...t.items.filter((i) => nonEmpty(i.title) || nonEmpty(i.text)).map((i) => h('li', { class: 'tl-item', 'data-rv': 'block' },
        h('span', { class: 'tl-dot', 'aria-hidden': 'true' }),
        nonEmpty(i.year) ? h('p', { class: 'tl-when' }, i.year) : null,
        nonEmpty(i.title) ? h('h3', { class: 'h3 tl-title' }, i.title) : null,
        i.photo?.src ? framed(i.photo, { ratio: '16 / 10', cls: 'tl-photo' }) : null,
        nonEmpty(i.text) ? h('p', { class: 'tl-text' }, ...multiline(i.text)) : null))));
}

export function thankyou(p: PlannedSection): HTMLElement {
  const t = ctx.config.content.thankyou;
  const im = t.photo?.src ? t.photo : null;
  const sig = t.signatureSvg
    ? h('img', { class: 'ty-sig-svg', src: assetUrl(t.signatureSvg, ctx.base), alt: t.signature || 'Chữ ký', 'data-rv': 'ornament' })
    : nonEmpty(t.signature) ? h('p', { class: 'ty-sig', 'data-rv': 'ornament', 'data-sig': '' }, t.signature) : null;
  return h('section', { id: p.item.id, class: `sec sec-thankyou ${im ? 'has-img' : 'no-img'}`, 'data-type': 'thankyou', 'data-pd': p.meta.particle.density, 'data-po': p.meta.particle.maxOpacity, 'aria-labelledby': 'h-thankyou' },
    im ? h('div', { class: 'ty-media' }, img(im, { cls: 'ty-img' }), h('div', { class: 'hero-shade', 'aria-hidden': 'true' })) : null,
    h('div', { class: 'ty-content' },
      h('h2', { id: 'h-thankyou', class: 'h2 h2-script', 'data-rv': 'heading' }, t.heading),
      nonEmpty(t.message) ? h('p', { class: 'ty-msg', 'data-rv': 'block' }, ...multiline(t.message)) : null,
      sig));
}

export function footer(p: PlannedSection): HTMLElement {
  const f = ctx.config.content.footer;
  const v = f.vendor;
  const mono = f.monogram || ctx.config.cover.monogram;
  const date = f.dateText || ctx.config.content.hero.dateText;
  const tel = telHref(v.phone);
  return h('footer', { id: p.item.id, class: 'sec sec-footer', 'data-type': 'footer', 'data-pd': p.meta.particle.density, 'data-po': p.meta.particle.maxOpacity },
    h('div', { class: 'sec-in' },
      nonEmpty(mono) ? h('p', { class: 'ft-mono' }, mono) : null,
      ornament(ctx.resolved.ornamentUrl ?? '', 'divider', 'orn ft-orn'),
      nonEmpty(date) ? h('p', { class: 'ft-date' }, date) : null,
      nonEmpty(f.madeWithText) ? h('p', { class: 'small muted' }, f.madeWithText.replace('♡', '').trim(), ' ', icon('heart', 14)) : null,
      v.show && nonEmpty(v.name) ? h('div', { class: 'ft-vendor small muted' },
        v.logo?.src ? img({ ...v.logo, w: v.logo.w || 32, h: v.logo.h || 32 }, { cls: 'ft-logo' }) : null,
        h('p', null, v.name),
        nonEmpty(v.tagline) ? h('p', null, v.tagline) : null,
        tel ? h('a', { href: tel }, v.phone) : null) : null));
}
