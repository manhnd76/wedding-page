/**
 * Bộ dựng chung cho skin phong bì (design-review-v1 3.2, 4.1): mỗi skin vẽ SVG vào các lớp có sẵn
 * (env-back / env-front / env-flap-f / env-flap-b / env-deco / env-seal) và khai báo pha "mở khoá" riêng
 * (thay pha seal 0–~380ms). Màu luôn qua class CSS -> biến --env-* (không thuộc tính style, CSP).
 */
import { envelopeGeom, type EnvelopeGeom } from '@shared/envelope';
import type { EnvelopeStyle } from '@shared/config/enums';
import { h, svg } from '../../dom';
import type { Step } from '../anim';
import type { SparkReq } from '../open-kit/sparks';

export interface EnvParts {
  cover: HTMLElement;
  env: HTMLElement;
  back: HTMLElement;
  front: HTMLElement;
  flap: HTMLElement;
  flapF: HTMLElement;
  flapB: HTMLElement;
  deco: HTMLElement;
  seal: HTMLElement;
  card: HTMLElement;
}

export interface SkinOpts { liner: boolean; monogram: string; uid: string }

export interface UnlockPlan {
  steps: Step[];
  /** mốc bắt đầu lật nắp (ms) */
  flapAt: number;
  /** thời lượng lật nắp (Vừa) */
  flapDur?: number;
}

/**
 * E12 (design-v4a-2bc §3.1): hạt lóe trong pha mở khoá ở mức Nhiều (lace: cả mức Vừa). Dữ liệu thuần - `envelope.ts`
 * import động `open-kit/sparks` để phát (skin không import tĩnh open-kit). `at` theo timeline skin (ms), gốc phát = seal.
 */
export type SparkPlan = Omit<SparkReq, 'origin' | 'at'> & { at: number };

export interface EnvelopeSkin {
  build(p: EnvParts, o: SkinOpts): void;
  unlock(p: EnvParts, light: boolean): UnlockPlan;
  /** không khai báo = 12 bụi vàng lóe ở seal (DEFAULT_RICH) */
  rich?(level: 'full' | 'full+'): SparkPlan[];
}

/** Mặc định E12 (`classic`): 12 hạt vàng toả 360° tại mốc 2 nửa seal bắt đầu tách (mảnh burst `gold` chấm 70% / sao 30%, nhấp nháy). */
export const DEFAULT_RICH: SparkPlan = { at: 90, count: 12, burst: 'gold', kind: ['gold-dust'], size: [3, 6], speed: [60, 180], gravity: 40, drag: 2.6, life: [600, 800] };

const NS_VIEW = '0 0 340 238';

export function box(cls: string, ...children: SVGElement[]): SVGElement {
  return svg('svg', { viewBox: NS_VIEW, preserveAspectRatio: 'none', class: `env-svg ${cls}`, 'aria-hidden': 'true', focusable: 'false' }, ...children);
}
export const path = (d: string, cls: string, extra: Record<string, string | number> = {}) => svg('path', { d, class: cls, ...extra });

/** Lớp nền chung: lòng phong bì, túi + nếp gấp, nắp (mặt trước + lót). Trả về hình học để skin vẽ thêm. */
export function shell(p: EnvParts, style: EnvelopeStyle, o: SkinOpts, extra: { front?: SVGElement[]; flap?: SVGElement[]; liner?: SVGElement[]; back?: SVGElement[] } = {}): EnvelopeGeom {
  const g = envelopeGeom(style);
  p.back.append(box('', svg('rect', { x: 0.5, y: 0.5, width: 339, height: 237, rx: 6, class: 'ep2' }), ...(extra.back ?? [])));
  p.front.prepend(box('', path(g.pocket, 'ep'), path(g.seams, 'es'), ...(extra.front ?? [])));
  p.flapF.append(box('', path(g.flap, 'ep'), ...(extra.flap ?? [])));
  const pid = `envl-${o.uid}`;
  const liner = o.liner
    ? [svg('defs', {}, svg('pattern', { id: pid, width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, path('M0 5h10', 'el-s'))),
      path(g.flap, 'ep2'), path(g.liner, 'el-f', { fill: `url(#${pid})` }), ...(extra.liner ?? [])]
    : [path(g.flap, 'ep2')];
  p.flapB.append(box('', ...liner));
  p.cover.style.setProperty('--env-tip', `${((g.tipY / 238) * 100).toFixed(1)}%`);
  return g;
}

/** Dấu sáp (3.2): khối sáp liền + vành trong; 2 nửa clip ở tầng DOM để tách đôi khi mở. */
export function waxSeal(p: EnvParts, o: SkinOpts, label = o.monogram || '♡'): void {
  const gid = `wax-${o.uid}`;
  const art = () => svg('svg', { viewBox: '-32 -32 64 64', class: 'seal-art', 'aria-hidden': 'true', focusable: 'false' },
    svg('defs', {}, svg('radialGradient', { id: gid, cx: '40%', cy: '35%', r: '70%' },
      svg('stop', { offset: 0, class: 'wx-hi' }), svg('stop', { offset: 0.55, class: 'wx-mid' }), svg('stop', { offset: 1, class: 'wx-lo' }))),
    svg('g', { fill: `url(#${gid})` },
      ...[[0, 0, 24], [0, -21, 8], [15, -15, 7.5], [21, 0, 8.5], [15, 15, 7], [0, 21, 8], [-15, 15, 7.5], [-21, 0, 7], [-15, -15, 8]]
        .map(([cx, cy, r]) => svg('circle', { cx: cx!, cy: cy!, r: r! }))),
    svg('circle', { r: 17, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.35 }),
    svg('circle', { r: 14.5, fill: 'none', stroke: '#000', 'stroke-opacity': 0.25 }));
  const half = (side: 'l' | 'r') => h('span', { class: `seal-h seal-${side}` }, h('span', { class: 'seal-full' }, art(), h('span', { class: 'seal-mono' }, label)));
  p.seal.append(half('l'), half('r'));
}

/** Pha seal tách đôi (3.2): nhấn scale .92 (0–90ms) rồi 2 nửa dạt ±10px xoay ±16° + mờ (tới 260ms). */
export function sealSplit(p: EnvParts, light: boolean): Step[] {
  if (light) return [{ el: p.seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 120 }];
  const l = p.seal.querySelector('.seal-l');
  const r = p.seal.querySelector('.seal-r');
  return [
    { el: p.seal, frames: [{ transform: 'scale(1)' }, { transform: 'scale(.92)' }], start: 0, dur: 90 },
    { el: l, frames: [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-10px) rotate(-16deg)', opacity: 0 }], start: 90, dur: 170 },
    { el: r, frames: [{ transform: 'none', opacity: 1 }, { transform: 'translateX(10px) rotate(16deg)', opacity: 0 }], start: 90, dur: 170 },
  ];
}

/** Vệt sáng chéo lướt qua (velvet / song-hy). */
export function sheen(p: EnvParts, start: number, dur: number): Step {
  const el = h('span', { class: 'env-sheen', 'aria-hidden': 'true' });
  p.deco.append(el);
  return { el, frames: [{ transform: 'translateX(-120%) skewX(-20deg)', opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: 'translateX(220%) skewX(-20deg)', opacity: 0 }], start, dur };
}
