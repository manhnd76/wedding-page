/**
 * Kiểu mở `scroll` - Cuộn thư (design-v4a-2bc §2.6, họ vật thể, chi phí Vừa - repaint vì clip-path).
 * Trục trên + giấy (giữ chỗ từ đầu, không CLS) + trục dưới + ruy băng (path asset `open/scroll/inline.svg`).
 * Chữ "Kính gửi + khách" nằm TRONG vùng giấy nhưng ở lớp trên giấy, không bị clip: đọc được cả trước khi chạm
 * (lệch nhỏ so với ảnh designer - xem report), giấy trải ra phía sau chữ.
 * Vừa ~2.1s: ruy băng tuột 0–300 · trục dưới lăn + giấy trải (clip-path, cùng easing) 250–1150 · giữ 1150–1650
 *   · phóng 1650–2100 + cover mờ. Nhẹ ~0.9s: trải 100–600, không giữ. Nhiều: + vân gỗ trục lăn + 12 mảnh rơi khi trải xong.
 */
import './scroll.css';
import { ctx } from '../../context';
import { h } from '../../dom';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { SAFE, bind, div, fade, move, paths, tl, zoomOut, type StepSpec, type Timeline } from '../open-kit/layers';
import { coverSparks, gold, prepareSparks } from '../open-kit/sparks';

const ROD: [string, string][] = [
  ['M16 6H304Q307 6 307 9V15Q307 18 304 18H16Q13 18 13 15V9Q13 6 16 6Z', 'sc-rod'],
  ['M18 8.5H302', 'sc-hi'],
  ['M13 4.5H8Q5 4.5 5 7.5V16.5Q5 19.5 8 19.5H13ZM307 4.5H312Q315 4.5 315 7.5V16.5Q315 19.5 312 19.5H307ZM5 9.5H1Q0 9.5 0 10.5V13.5Q0 14.5 1 14.5H5ZM315 9.5H319Q320 9.5 320 10.5V13.5Q320 14.5 319 14.5H315Z', 'sc-knob'],
];
const RIBBON: [string, string][] = [
  ['M22 0H38V72H22Z', 'sc-rib'],
  ['M30 30C18 14 4 16 6 27S22 36 30 30ZM30 30C42 14 56 16 54 27S38 36 30 30Z', 'sc-rib'],
  ['M30 30 18 60 24 58 26 66ZM30 30 42 60 36 58 34 66Z', 'sc-rib2'],
  ['M30 25a5 5 0 1 0 .01 0Z', 'sc-rib2'],
];

/** `h` = chiều cao vùng giấy (px). */
export function timeline(level: OpenLevelCtx['level'], g = { h: 300 }): Timeline {
  const light = level === 'light';
  const s = light ? 100 : 250;
  const d = light ? 500 : 900;
  const steps: StepSpec[] = [
    light ? fade('sc-rbn', 0, 150) : { k: 'sc-rbn', f: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(.8)' }], s: 0, d: 300 },
    { k: 'sc-rb', f: [{ transform: 'translateY(0)' }, { transform: `translateY(${Math.round(g.h)}px)` }], s, d, e: EASE_INOUT },
    { k: 'sc-paper', f: [{ clipPath: `inset(0 0 100% 0)` }, { clipPath: `inset(${SAFE})` }], s, d, e: EASE_INOUT },
    fade('sc-tail', s + d * 0.6, d * 0.4, 0, 1),
  ];
  if (light) return tl([...steps, fade('cover', 600, 300)]);
  steps.push(zoomOut('sc', 1650, 450, 1.08), fade('cover', 1700, 400));
  if (level === 'full+') steps.push({ k: 'sc-grain', f: [0, 3, -3, 3, -3, 3, 0].map((y) => ({ transform: `translateY(${y}px)` })), s, d, e: 'linear' });
  return tl(steps);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const rod = (cls: string, grain = false) => {
    const r = paths('0 0 320 24', `sc-r ${cls}`, ROD);
    if (grain) r.append(paths('0 0 320 24', 'sc-grain', [['M40 10H120M150 13H260M70 15H200', 'sc-gl']]));
    return r;
  };
  const txt = h('div', { class: 'sc-txt op-fit' });
  const body = h('div', { class: 'sc-body' }, div('sc-paper'), txt, rod('sc-rb', true));
  cover.querySelector('.op-stage')!.append(h('div', { class: 'sc' }, rod('sc-rt'), body, paths('0 0 60 72', 'sc-rbn', RIBBON)));
  const gl = move(cover, '.cv-guestline', txt);
  gl?.after(h('p', { class: 'sc-tail', 'aria-hidden': 'true' }, 'tới dự lễ thành hôn'));
  if (info.mode === 'full+') void prepareSparks();
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const body = cover.querySelector('.sc-body');
  if (c.level === 'full+') {
    const red = ctx.config.theme.preset === 'son-do';
    void coverSparks({
      count: 12, ...(red ? {} : { burst: 'gold' }), kind: red ? ['red-paper', 'petal-rose'] : ['gold-dust'], colors: red ? ['#C8231F', '#E0392B'] : gold(), size: red ? [7, 11] : [3, 6],
      origin: { x: innerWidth / 2, y: -10 }, spread: [innerWidth * 0.4, 4], angle: [70, 110], speed: [60, 140], life: [1200, 1500], gravity: 120, drag: 0.8, at: 1150 / c.timeScale,
    });
  }
  return bind(cover, timeline(c.level, { h: body?.getBoundingClientRect().height || 300 }), c);
}
