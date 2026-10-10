/**
 * Kiểu mở `wax-seal` - Dấu sáp vỡ (design-v4a-2bc §2.2, họ vật thể, chi phí Vừa).
 * Thiệp gập cổng 2 cánh + dấu sáp (path asset `open/wax-seal/inline.svg`). Monogram chữ HTML trên lõi ép, mờ trước khi nứt;
 * tên khách DƯỚI thẻ (thẻ tách đôi ở giữa nên không in tên lên cánh).
 * Vừa ~1.7s: rung 0–240 · vệt nứt 240–360 · 2 nửa rơi ra ngoài mép thẻ 360–700 · 6 mảnh vụn 360–760 · 2 cánh lật 420–1020
 *   · lời chào 700–1000 · đầu đề rút 900–1100 · thẻ phóng 1300–1700 + cover mờ từ 1400.
 * Nhẹ ~0.9s: dấu mờ, cánh mở, không rung/nứt/vụn. Nhiều: + 14 hạt vàng lóe ở vết nứt (t=360).
 */
import './wax-seal.css';
import { ctx } from '../../context';
import { h, svg } from '../../dom';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, greet, rise, tl, zoomOut, type StepSpec, type Timeline } from '../open-kit/layers';
import { coverSparks, gold, prepareSparks } from '../open-kit/sparks';

const BODY = 'M38.7 0C38.7 4.3 44.4 9.3 43.3 12.7C42.2 16.2 35 17.7 32.2 20.7C29.3 23.6 28.8 27.6 26.3 30.3C23.7 33 20.1 34.4 16.8 36.9C13.5 39.3 10.2 44.9 6.5 45C2.8 45.2-1.7 39.6-5.5 37.9C-9.2 36.3-12.6 36.4-16.1 35.1C-19.5 33.9-22.8 32.3-26.4 30.5C-30.1 28.7-36.1 27.7-38 24.4C-39.8 21.2-37.2 15.1-37.5 11C-37.7 6.9-39.4 3.7-39.6 0C-39.7-3.7-38.5-7.1-38.3-11.2C-38.2-15.4-40.7-21.7-38.7-24.9C-36.7-28-29.9-28.4-26.2-30.2C-22.5-32-19.7-34.4-16.3-35.7C-12.8-36.9-9.3-36-5.5-38C-1.6-40 3.3-48.3 6.9-47.8C10.4-47.2 12.7-37.7 15.8-34.7C18.9-31.6 22.7-31.7 25.5-29.4C28.2-27.1 29.3-23.5 32.3-20.7C35.3-18 42.5-16.3 43.6-12.8C44.7-9.3 38.8-4.3 38.7 0Z';
const CRACK = 'L2-50-3-34 5-24-2-12 4 0-4 12 3 24-3 36 1 50';
const SHARDS = ['M0-3 3-1 2 3-2 2-3-1Z', 'M-2-2 3-3 4 1 0 3Z', 'M0-4 2 0 0 4-2 0Z', 'M-3-1 1-3 3 2-1 3Z', 'M-2-3 2-2 3 1-1 2-3 0Z', 'M0-2 3 1-2 2Z'];
const VB = '-48 -48 96 96';

/** Hình học thật: `w` = bề rộng thẻ (px) - 2 nửa dấu rơi ra NGOÀI mép thẻ. */
export function timeline(level: OpenLevelCtx['level'], g = { w: 240 }): Timeline {
  const wing = (k: string, deg: number, s: number, d: number): StepSpec =>
    ({ k, f: [{ transform: 'perspective(1200px) rotateY(0deg)' }, { transform: `perspective(1200px) rotateY(${deg}deg)` }], s, d, e: EASE_INOUT });
  if (level === 'light') {
    return tl([fade('ws-seal', 0, 150), wing('ws-wl', -160, 100, 500), wing('ws-wr', 160, 100, 500), fade('ws-greet', 300, 250, 0, 1), fade('cover', 600, 300)]);
  }
  const fall = (k: string, sx: number): StepSpec => ({
    k, f: [{ transform: 'none', opacity: 1 }, { opacity: 1, offset: 0.5 }, { transform: `translate(${sx * (g.w / 2 + 24)}px,40px) rotate(${sx * 38}deg)`, opacity: 0 }],
    s: 360, d: 340, e: 'cubic-bezier(.4,0,1,1)',
  });
  const steps: StepSpec[] = [
    { k: 'ws-seal', f: [0, -4, 4, -4, 0].map((a) => ({ transform: `rotate(${a}deg)` })), s: 0, d: 240 },
    fade('ws-mono', 200, 120),
    { k: 'ws-ck', f: [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], s: 240, d: 120, e: 'linear' },
    fade('ws-ckg', 360, 60),
    fall('ws-hl', -1), fall('ws-hr', 1),
    ...SHARDS.map((_, i): StepSpec => {
      const a = ((i * 60 + 25) * Math.PI) / 180;
      const r = 30 + ((i * 17) % 40);
      return { k: `ws-s${i}`, f: [{ transform: 'none', opacity: 1 }, { transform: `translate(${Math.round(Math.cos(a) * r)}px,${Math.round(Math.sin(a) * r)}px) rotate(${90 + i * 40}deg)`, opacity: 0 }], s: 360, d: 400 };
    }),
    wing('ws-wl', -160, 420, 600), wing('ws-wr', 160, 420, 600),
    fade('ws-greet', 700, 300, 0, 1),
    rise('cv-head', 900),
    zoomOut('ws-card', 1300, 400),
    fade('cover', 1400, 300),
  ];
  return tl(steps);
}

function seal(uid: string): HTMLElement {
  const half = (side: 'l' | 'r') => {
    const id = `wck${side}-${uid}`;
    return svg('svg', { viewBox: VB, class: `ws-h ws-h${side}`, 'aria-hidden': 'true' },
      svg('clipPath', { id }, svg('path', { d: side === 'l' ? `M-60-60H2${CRACK}V60H-60Z` : `M60-60H2${CRACK}V60H60Z` })),
      svg('g', { 'clip-path': `url(#${id})` },
        svg('path', { d: BODY, fill: `url(#wxg-${uid})` }),
        svg('circle', { r: 29, class: 'wx-press' }), svg('circle', { r: 31.5, class: 'wx-ring' }), svg('circle', { r: 26.5, class: 'wx-ring2' })));
  };
  const hl = half('l');
  hl.prepend(svg('radialGradient', { id: `wxg-${uid}`, cx: '40%', cy: '35%', r: '70%' },
    svg('stop', { offset: 0, class: 'wxs-hi' }), svg('stop', { offset: 0.55, class: 'wxs-mid' }), svg('stop', { offset: 1, class: 'wxs-lo' })));
  return div('ws-seal', hl, half('r'),
    svg('svg', { viewBox: VB, class: 'ws-ckg' }, svg('path', { d: `M2-50${CRACK}`, class: 'ws-ck', pathLength: 100 })),
    ...SHARDS.map((d, i) => svg('svg', { viewBox: '-5 -5 10 10', class: `ws-sh ws-s${i}` }, svg('path', { d, fill: `url(#wxg-${uid})` }))),
    h('span', { class: 'ws-mono' }, ctx.config.cover.monogram || '♡'));
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const uid = Math.random().toString(36).slice(2, 7);
  const wing = (s: string) => div(`ws-w ws-w${s}`, div('ws-f'), div('ws-b'));
  cover.querySelector('.op-stage')!.append(div('ws-card', div('ws-in', greet('ws-greet')), wing('l'), wing('r'), seal(uid)));
  if (info.mode === 'full+') void prepareSparks();
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const card = cover.querySelector('.ws-card');
  if (c.level === 'full+') {
    void coverSparks({ count: 14, burst: 'gold', kind: ['gold-dust'], colors: gold(), size: [3, 6], origin: cover.querySelector('.ws-seal')!, speed: [60, 160], life: [600, 800], at: 360 / c.timeScale });
  }
  return bind(cover, timeline(c.level, { w: card?.getBoundingClientRect().width || 240 }), c);
}
