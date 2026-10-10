/** Sự kiện + bản đồ bấm mới tải + thêm vào lịch (design 4.5, solution 8.5). */
import type { EventItem } from '@shared/config/types';
import type { PlannedSection } from '@shared/sections/meta';
import { safeHttpsUrl, safeMapEmbedUrl } from '@shared/assets';
import { ctx, toast } from '../context';
import { downloadBlob, h, nonEmpty } from '../dom';
import { calendarFlipIcon, icon } from '../icons';
import { framed, shell, vnParts } from './common';

export function directionsUrl(ev: EventItem): string | null {
  return safeHttpsUrl(ev.mapUrl) ?? (nonEmpty(ev.address) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}` : null);
}

export function embedUrl(ev: EventItem): string | null {
  return safeMapEmbedUrl(ev.mapEmbedUrl) ?? (nonEmpty(ev.address) ? `https://www.google.com/maps?q=${encodeURIComponent(ev.address)}&output=embed` : null);
}

/** Đã qua: now > endAt ?? startAt + 6h. */
export function isPast(ev: EventItem, now = Date.now()): boolean {
  const s = new Date(ev.startAt).getTime();
  if (Number.isNaN(s)) return false;
  const e = ev.endAt ? new Date(ev.endAt).getTime() : s + 6 * 3600_000;
  return now > (Number.isNaN(e) ? s + 6 * 3600_000 : e);
}

function mapBlock(ev: EventItem): HTMLElement | null {
  const src = embedUrl(ev);
  if (!src) return null;
  const box = h('div', { class: 'ev-map' });
  const btn = h('button', { type: 'button', class: 'linkbtn ev-map-btn', 'aria-expanded': 'false' }, icon('map', 18), 'Xem bản đồ');
  btn.addEventListener('click', () => {
    btn.remove();
    const frame = h('iframe', { src, title: `Bản đồ ${ev.venueName || ev.name}`, loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: true, class: 'ev-iframe' });
    const dir = directionsUrl(ev);
    const fallback = dir ? h('a', { href: dir, target: '_blank', rel: 'noopener', class: 'small ev-map-fallback' }, 'Mở Google Maps') : null;
    frame.addEventListener('error', () => { frame.remove(); if (fallback) box.prepend(fallback); });
    box.append(frame);
    if (fallback) box.append(fallback);
  });
  box.append(btn);
  return box;
}

/** Bấm "Thêm vào lịch": tờ lịch lật ngay (calendar-flip, CSS theo cấp) rồi tạo .ics. */
const calClick = (ev: EventItem) => (e: Event) => {
  const b = e.currentTarget as HTMLElement;
  b.classList.remove('is-flip');
  void b.offsetWidth;
  b.classList.add('is-flip');
  void addToCalendar(ev);
};

async function addToCalendar(ev: EventItem) {
  try {
    const { buildIcs, eventEnd } = await import('@shared/ics');
    const cp = ctx.config.content.couple;
    const ics = buildIcs({
      uid: `${ev.id}-${new Date(ev.startAt).getTime()}@wedding-page`,
      title: `${ev.name} · ${[cp.groom.shortName, cp.bride.shortName].filter(Boolean).join(' & ')}`,
      startAt: ev.startAt, endAt: eventEnd(ev.startAt, ev.endAt).toISOString(),
      location: [ev.venueName, ev.address].filter(nonEmpty).join(', '),
      description: ev.displayDate,
      ...(ctx.config.meta.siteUrl ? { url: ctx.config.meta.siteUrl } : {}),
    });
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), `${ev.id}.ics`);
  } catch {
    toast('Không tạo được lịch, thử lại sau');
  }
}

export function events(p: PlannedSection, rsvpVisible: boolean): HTMLElement {
  const e = ctx.config.content.events;
  const items = e.items.filter((x) => nonEmpty(x.name));
  const cards = items.map((ev) => {
    const parts = vnParts(ev.startAt);
    const past = isPast(ev);
    const main = ev.id === e.mainEventId && items.length > 1;
    const dir = directionsUrl(ev);
    return h('article', { class: `ev-card${main ? ' is-main' : ''}${past ? ' is-past' : ''}`, 'data-rv': 'block', 'data-fx-exclude': '' },
      ev.image?.src ? framed(ev.image, { ratio: '16 / 10', cls: 'ev-photo' }) : null,
      main ? h('p', { class: 'ev-badge' }, 'Sự kiện chính') : null,
      past ? h('p', { class: 'ev-badge ev-badge--past' }, 'Đã diễn ra') : null,
      h('h3', { class: 'h3 ev-name' }, ev.name),
      nonEmpty(ev.displayDate) ? h('p', { class: 'ev-date' }, ev.displayDate) : null,
      nonEmpty(ev.lunarText) ? h('p', { class: 'small muted' }, ev.lunarText) : null,
      h('div', { class: 'ev-times' },
        nonEmpty(ev.welcomeTime) ? h('div', { class: 'ev-time' }, h('span', { class: 'eyebrow' }, 'Đón khách'), h('span', { class: 'ev-time-v' }, ev.welcomeTime)) : null,
        parts ? h('div', { class: 'ev-time' }, h('span', { class: 'eyebrow' }, 'Khai tiệc'), h('time', { class: 'ev-time-v', datetime: ev.startAt }, parts.time)) : null),
      nonEmpty(ev.venueName) || nonEmpty(ev.address) ? h('div', { class: 'ev-venue' }, icon('pin', 18),
        h('div', null, nonEmpty(ev.venueName) ? h('p', { class: 'ev-venue-n' }, ev.venueName) : null, nonEmpty(ev.address) ? h('p', { class: 'small muted' }, ev.address) : null)) : null,
      h('div', { class: 'ev-actions' },
        dir ? h('a', { class: 'btn btn-outline', href: dir, target: '_blank', rel: 'noopener' }, icon('route', 18), 'Chỉ đường') : null,
        ev.addToCalendar && parts && !past ? h('button', { class: 'btn btn-outline', type: 'button', onclick: calClick(ev) }, calendarFlipIcon(18), 'Thêm vào lịch') : null),
      ev.rsvpEnabled && rsvpVisible && !past ? h('a', { class: 'btn btn-primary btn-block', href: '#rsvp', 'data-rsvp-event': ev.id }, 'Xác nhận tham dự') : null,
      mapBlock(ev));
  });
  return shell(p, { eyebrow: e.eyebrow, heading: e.heading }, h('div', { class: `ev-grid${cards.length > 1 ? ' is-multi' : ''}` }, ...cards));
}
