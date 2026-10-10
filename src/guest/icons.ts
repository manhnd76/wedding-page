/** Bộ icon SVG thống nhất (design 0: không dùng ký tự/emoji). stroke = currentColor. */
import { svg } from './dom';

const P: Record<string, string> = {
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  pin: 'M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  route: 'M5 19l5-14 2 6 7 2-14 6z',
  close: 'M6 6l12 12M18 6L6 18',
  chevL: 'M15 5l-7 7 7 7',
  chevR: 'M9 5l7 7-7 7',
  chevU: 'M5 15l7-7 7 7',
  chevD: 'M5 9l7 7 7-7',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  check: 'M5 12.5l4.5 4.5L19 7',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1s3 1 5 1zm0 0c1.5-3 5-3.5 5-1s-3 1-5 1z',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  phone: 'M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  album: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5a1.5 1.5 0 1 0 0-.01',
  wand: 'M5 19L15 9M14 4v3M18.5 5.5l-2 2M20 10h-3',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a2.5 2.5 0 1 0 0-5M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 14c2.8 0 5 2.2 5 5',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  zoom: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5M8 11h6M11 8v6',
  pause: 'M9 6v12M15 6v12',
  playDown: 'M6 5l8 5-8 5zM18 6v11M15.5 14.5 18 17l2.5-2.5',
};

export type IconName = keyof typeof P;

export function icon(name: IconName | string, size = 20): SVGElement {
  return svg('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true', focusable: 'false', class: 'ic' },
    svg('path', { d: P[name] ?? name, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}

/** <svg><use href="sprite#id"></svg> cho ornament (sprite tô bằng currentColor). */
export function ornament(spriteUrl: string, id: string, cls = 'orn', w = 160, h = 24): SVGElement | null {
  if (!spriteUrl) return null;
  const s = svg('svg', { class: cls, viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true', focusable: 'false' });
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `${spriteUrl}#${id}`);
  s.appendChild(use);
  return s;
}

/** calendar-flip (design-v4a-2a 4.9): lịch 2 phần - khung + khoen (`cal-body`) và tờ lịch (`cal-page`) lật giả bằng scaleY. */
export function calendarFlipIcon(size = 18): SVGElement {
  const s = icon('M4 6h16v14H4zM8 3v4M16 3v4', size);
  s.firstElementChild!.setAttribute('class', 'cal-body');
  s.append(svg('g', { class: 'cal-page' }, svg('path', { d: 'M4 10h16v10H4z', fill: 'currentColor', 'fill-opacity': 0.15 }), icon('M4 10h16').firstElementChild as SVGElement));
  return s;
}
