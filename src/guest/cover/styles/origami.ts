/**
 * Kiểu mở `origami` - Gấp giấy (design-v4a-2bc §2.3, họ vật thể, chi phí Vừa).
 * Tờ vuông + 4 cánh tam giác 2 mặt (path asset `open/origami/inline.svg`; mặt sau = hoạ tiết mask `flap-pattern.svg`).
 * Tên khách DƯỚI tờ giấy; trang trong lặp lại câu mời (trang trí, aria-hidden).
 * Vừa ~1.8s: đầu đề rút 0–240 (cánh trên lật lên đè đầu đề) · sticker 0–160 · tên khách dưới tờ rút 360–520 (O09)
 *   · cánh trên 160, phải 280, dưới 400, trái 520 (380ms mỗi cánh)
 *   · tờ giấy phóng 1300–1800 + cover mờ từ 1500. Nhẹ ~0.8s: 4 cánh cùng lúc 100–480, mờ 480–800.
 * Nhiều: + bóng nếp mỗi cánh khi lật + 24 mảnh giấy vuông accent/accent-2 bung từ tâm (t=900; burst `confetti` khi v4a-2c có).
 */
import './origami.css';
import { ctx } from '../../context';
import { h } from '../../dom';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, mk, paths, rise, tl, zoomOut, type StepSpec, type Timeline } from '../open-kit/layers';
import { coverSparks, prepareSparks } from '../open-kit/sparks';

/** [lớp, path mặt trước, nếp, trục lật] - asset designer B (hệ 100×100, mũi chồm qua tâm 2 đơn vị). */
const FLAPS: [string, string, string, string][] = [
  ['og-l', 'M0 0V100L52 50Z', 'M0 50H50M52 50 18 70', 'rotateY(-180deg)'],
  ['og-r', 'M100 0V100L48 50Z', 'M100 50H50M48 50 82 30', 'rotateY(180deg)'],
  ['og-b', 'M0 100H100L50 48Z', 'M50 100V50M50 48 70 82', 'rotateX(180deg)'],
  ['og-t', 'M0 0H100L50 52Z', 'M50 0V50M50 52 30 18', 'rotateX(-180deg)'],
];
const HEART = 'M0 5.5C-7 1-6.5-4.5-3.2-4.8-1.4-5 0-3.4 0-2.4 0-3.4 1.4-5 3.2-4.8 6.5-4.5 7 1 0 5.5Z';

/** O09: dòng "Kính gửi / tên khách" dưới tờ giấy rút xuống + mờ TRƯỚC khi cánh dưới lật đè lên (trang trong đã lặp tên khách). */
const guestOut = (s: number, d: number): StepSpec =>
  ({ k: 'cv-guestline', f: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], s, d });

export function timeline(level: OpenLevelCtx['level']): Timeline {
  const flip = (i: number, s: number, d: number): StepSpec =>
    ({ k: FLAPS[i]![0], f: [{ transform: `perspective(900px) ${FLAPS[i]![3].replace(/-?180/, '0')}` }, { transform: `perspective(900px) ${FLAPS[i]![3]}` }], s, d, e: EASE_INOUT });
  if (level === 'light') {
    return tl([rise('cv-head', 0, 150), fade('og-stk', 0, 120), guestOut(0, 140), ...[0, 1, 2, 3].map((i) => flip(i, 100, 380)), fade('cover', 480, 320)]);
  }
  // thứ tự lật: trên, phải, dưới, trái
  const order = [3, 1, 2, 0];
  const steps: StepSpec[] = [
    rise('cv-head', 0, 240),
    { k: 'og-stk', f: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.4 }, { transform: 'scale(0)', opacity: 0 }], s: 0, d: 160, e: 'cubic-bezier(.34,1.56,.64,1)' },
    ...order.map((i, n) => flip(i, 160 + n * 120, 380)),
    guestOut(360, 160),
    zoomOut('og', 1300, 500, 2.4),
    fade('cover', 1500, 300),
  ];
  if (level === 'full+') {
    order.forEach((i, n) => steps.push({ k: `${FLAPS[i]![0]}s`, f: [{ opacity: 0 }, { opacity: 0.35 }, { opacity: 0 }], s: 160 + n * 120, d: 380 }));
  }
  return tl(steps);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const flaps = FLAPS.map(([cls, d, crease]) => div(`og-f ${cls}`,
    paths('0 0 100 100', 'og-fr', [[d, 'og-face'], [crease, 'og-crease']]),
    div('og-bk', mk('og-pat')),
    div(`og-sd ${cls}s`)));
  cover.querySelector('.op-stage')!.append(div('og',
    div('og-in', h('p', { class: 'og-inv' }, 'Trân trọng kính mời'), h('p', { class: 'og-gst' }, ctx.guest.display)),
    ...flaps,
    paths('-12 -12 24 24', 'og-stk', [['M0-11a11 11 0 1 0 .01 0Z', 'og-stk-c'], [HEART, 'og-stk-h']])));
  if (info.mode === 'full+') void prepareSparks();
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  if (c.level === 'full+') {
    const sq = (fill: string) => [{ d: 'M-7-5H7V5H-7Z', fill }];
    void coverSparks({ count: 24, burst: 'confetti', shapes: [sq('c1'), sq('c2')], size: [6, 9], origin: cover.querySelector('.og')!, speed: [120, 320], life: [900, 1200], gravity: 260, drag: 1.6, spin: 5, at: 900 / c.timeScale });
  }
  return bind(cover, timeline(c.level), c);
}
