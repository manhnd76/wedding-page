/**
 * Kiểu mở `moon-gate` - Cửa trăng (design-v4a-2bc §2.10, họ cổng, chi phí Vừa).
 * Vách gỗ 2 nửa có lỗ tròn (mask radial CSS - tròn tuyệt đối mọi tỉ lệ màn) + song cửa (mask tile) + vành trăng + hoa sen;
 * trong lỗ là ảnh: ảnh nền cover -> ảnh hero -> nền + monogram (open-kit/photo). Biển chữ đặt dưới cửa.
 * Vừa ~1.6s: biển rút 0–200 · sen mờ 0–250 · 2 nửa vách trượt 150–850 · ảnh nở tròn (clip-path circle) 700–1400 · ảnh mờ 1200–1600.
 * Nhẹ ~0.8s: bỏ bước nở tròn. Nhiều: + 12 cánh sen rơi từ mép trên (t=700) - hạt `petal-lotus` (v4a-2c), dự phòng loại hạt của theme.
 */
import './moon-gate.css';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, mk, rise, tl, waitMasks, type StepSpec, type Timeline } from '../open-kit/layers';
import { photoEl } from '../open-kit/photo';
import { coverSparks, prepareSparks } from '../open-kit/sparks';

/** `r` = bán kính lỗ (px), `cy` = tâm lỗ theo trục dọc (px). */
export function timeline(level: OpenLevelCtx['level'], g = { r: 130, cy: 266 }): Timeline {
  const light = level === 'light';
  const sl = (k: string, x: string): StepSpec => ({ k, f: [{ transform: 'translateX(0)' }, { transform: `translateX(${x})` }], s: light ? 100 : 150, d: light ? 500 : 700, e: EASE_INOUT });
  if (light) return tl([rise('cv-plaque', 0, 150), fade('mg-lotus', 0, 150), sl('mg-l', '-100%'), sl('mg-r', '100%'), fade('cover', 500, 300)]);
  return tl([
    rise('cv-plaque', 0, 200, ' scale(.98)'),
    { k: 'mg-lotus', f: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px)' }], s: 0, d: 250 },
    sl('mg-l', '-100%'), sl('mg-r', '100%'),
    { k: 'mg-ph', f: [{ clipPath: `circle(${g.r}px at 50% ${g.cy}px)` }, { clipPath: `circle(150% at 50% ${g.cy}px)` }], s: 700, d: 700 },
    fade('mg-ph', 1200, 400),
  ]);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const half = (s: string) => div(`mg-h mg-${s}`, mk('mg-lat'), div('mg-ring'));
  const layers = cover.querySelector('.op-layers')!;
  layers.append(div('mg-ph', photoEl('mg-img')), half('l'), half('r'), div('mg-lotus', mk('mg-lf'), mk('mg-ll')));
  if (info.mode === 'full+') void prepareSparks();
  await waitMasks(layers);
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const ring = cover.querySelector('.mg-ring')?.getBoundingClientRect();
  const g = ring ? { r: Math.round(ring.height / 2 - 7), cy: Math.round(ring.top + ring.height / 2) } : undefined;
  if (c.level === 'full+') {
    void coverSparks({ count: 12, kind: ['petal-lotus'], size: [16, 24], origin: { x: innerWidth / 2, y: -16 }, spread: [innerWidth * 0.45, 4], angle: [75, 105], speed: [40, 90], life: [1400, 1600], gravity: 60, drag: 0.4, spin: 1.2, at: 700 / c.timeScale });
  }
  return bind(cover, timeline(c.level, g), c);
}
