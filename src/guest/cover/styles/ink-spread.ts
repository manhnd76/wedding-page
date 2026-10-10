/**
 * Kiểu mở `ink-spread` - Mực loang (design-v4a-2bc §2.12, họ toàn màn, chi phí Vừa - repaint vì mask).
 * Kỹ thuật A (decisions 2026-10-09): KHOÉT LỖ thật trên `.cover` bằng mask `blob-core.svg` + `mask-composite: exclude`
 * (`-webkit-mask-composite: xor`), WAAPI animate mask-size/mask-position để tâm luôn ở điểm chạm -> lộ landing thật.
 * Vành sắc tố `.ik-rim` (mask `blob-rim.svg`) là phần tử fixed TRÊN cover (không bị lỗ khoét), chỉ animate transform.
 * Dự phòng B (không có mask-composite): lớp mực `.ik-fill` phóng scale(0→1) phủ cover rồi cover mờ.
 * Vừa ~1.2s: lỗ + vành nở 0–1000 · vành mờ 700–1000 · cover mờ 1000–1200. Nhẹ ~0.65s: từ tâm màn, không vành.
 * Nhiều: + 2 vệt bắn phụ lệch (±30% w, ±20% h), trễ 150ms, scale(0→.12), blob-core đặc accent .35 (O02b; chỉ trang trí).
 * O11: khối chữ cover `.cv-inner` mờ 1→0 trong 0–300ms (--ease-out, không dời/không clip) để lỗ khoét đi qua chữ đã mờ.
 */
import './ink-spread.css';
import { css } from '../../dom';
import { EASE_OUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, mk, tl, waitMasks, type StepSpec, type Timeline } from '../open-kit/layers';

/** Cạnh file mask cần để vệt mực (phủ kín vòng tròn r ≈ 36% cạnh) che hết góc xa nhất. */
/** Loang chậm ở đầu (vệt to dần quanh điểm chạm) rồi phủ nhanh tới góc xa. */
const SPREAD = 'cubic-bezier(.55,0,.45,1)';

export const blobSize = (x: number, y: number, w: number, h: number): number => Math.ceil(2.8 * Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));

export function timeline(level: OpenLevelCtx['level'], g = { x: 180, y: 370, s: 1200, hole: true }): Timeline {
  const light = level === 'light';
  const d = light ? 600 : 1000;
  const p = (s: number) => `${Math.round(g.x - s / 2)}px ${Math.round(g.y - s / 2)}px, 0px 0px`;
  const sz = (s: number) => `${s}px ${s}px, 100% 100%`;
  const steps: StepSpec[] = g.hole
    ? [{ k: 'cover', f: [{ maskSize: sz(0), webkitMaskSize: sz(0), maskPosition: p(0), webkitMaskPosition: p(0) }, { maskSize: sz(g.s), webkitMaskSize: sz(g.s), maskPosition: p(g.s), webkitMaskPosition: p(g.s) }] as Keyframe[], s: 0, d, e: SPREAD }]
    : [{ k: 'ik-fill', f: [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], s: 0, d, e: SPREAD }];
  steps.push(fade('cv-inner', 0, 300, 1, 0, EASE_OUT));
  steps.push(fade('cover', light ? 450 : 1000, light ? 200 : 200));
  if (!light) {
    steps.push({ k: 'ik-rim', f: [{ transform: 'scale(0)', opacity: 0.55 }, { transform: 'scale(.7)', opacity: 0.55, offset: 0.7 }, { transform: 'scale(1)', opacity: 0 }], s: 0, d, e: SPREAD });
    if (level === 'full+') steps.push({ k: 'ik-rim2', f: [{ transform: 'scale(0)', opacity: 0.35 }, { transform: 'scale(.12)', opacity: 0.35, offset: 0.6 }, { transform: 'scale(.12)', opacity: 0 }], s: 150, d: 850 });
  }
  return tl(steps);
}

let rims: HTMLElement[] = [];
const hole = () => typeof CSS !== 'undefined' && (CSS.supports('mask-composite', 'exclude') || CSS.supports('-webkit-mask-composite', 'xor'));

export async function prepare(cover: HTMLElement, _info: OpenPrepareInfo): Promise<void> {
  const pre = div('ik-pre', mk('ik-p1'), mk('ik-p2'));
  cover.querySelector('.op-layers')!.append(pre);
  await waitMasks(pre);
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const w = innerWidth, h = innerHeight;
  const light = c.level === 'light';
  const { x, y } = !light && c.tap ? c.tap : { x: w / 2, y: h / 2 };
  const s = blobSize(x, y, w, h);
  const ok = hole();
  const place = (el: HTMLElement, cx: number, cy: number) => { css(el, { left: `${cx - s / 2}px`, top: `${cy - s / 2}px`, width: `${s}px`, height: `${s}px` }); return el; };
  if (ok) cover.classList.add('ik-hole');
  else cover.append(place(div('ik-fill'), x, y));
  if (!light) {
    // vành nằm ngoài cover (fixed, trên cùng) để lỗ khoét không xoá mất nửa trong của vành
    rims = [place(div('ik-rim'), x, y)];
    if (c.level === 'full+') rims.push(place(div('ik-rim2'), x + w * 0.3, y - h * 0.2), place(div('ik-rim2'), x - w * 0.3, y + h * 0.2));
    document.body.append(...rims);
  }
  const t = timeline(c.level, { x, y, s, hole: ok });
  // vành ở ngoài cover: bind theo body
  const run = bind(cover, { ...t, steps: t.steps.filter((x) => !x.k.startsWith('ik-rim')) }, c);
  const rr = bind(document.body, { ...t, steps: t.steps.filter((x) => x.k.startsWith('ik-rim')) }, c);
  return { ...run, fastForward: () => { run.fastForward(); rr.fastForward(); } };
}

export function dispose(): void { rims.forEach((r) => r.remove()); rims = []; }
