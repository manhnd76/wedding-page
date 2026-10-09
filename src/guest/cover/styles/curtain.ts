/**
 * Kiểu mở `curtain` - Rèm kéo (design-v4a-2bc §2.1, họ cổng, chi phí Thấp).
 * Vừa ~1.25s: biển chữ rút 0–200 · 2 cánh rèm dồn ra mép 150–1050 · diềm kéo lên 800–1100 · cover mờ 950–1250.
 * Nhẹ ~0.75s: cánh chỉ trượt 100–700, diềm mờ cùng cover. Nhiều: + 16 hạt vàng dọc khe giữa (t=200) + tua diềm lắc.
 */
import './curtain.css';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, mk, rise, tl, waitMasks, type Timeline } from '../open-kit/layers';
import { coverSparks, gold, prepareSparks } from '../open-kit/sparks';

export function timeline(level: OpenLevelCtx['level']): Timeline {
  const sl = (dx: string, k: number) => [{ transform: 'translateX(0) scaleX(1)' }, { transform: `translateX(${dx}) scaleX(${k})` }];
  if (level === 'light') {
    return tl([
      rise('cv-plaque', 0, 150),
      { k: 'ct-l', f: sl('-100%', 1), s: 100, d: 600, e: EASE_INOUT },
      { k: 'ct-r', f: sl('100%', 1), s: 100, d: 600, e: EASE_INOUT },
      fade('cover', 550, 200),
    ]);
  }
  const steps = [
    rise('cv-plaque', 0, 200, ' scale(.98)'),
    { k: 'ct-l', f: sl('-100%', 0.82), s: 150, d: 900, e: EASE_INOUT },
    { k: 'ct-r', f: sl('100%', 0.82), s: 150, d: 900, e: EASE_INOUT },
    { k: 'ct-val', f: [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], s: 800, d: 300, e: 'cubic-bezier(.4,0,1,1)' },
    fade('cover', 950, 300),
  ];
  if (level === 'full+') steps.push({ k: 'ct-vt', f: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(0deg)' }], s: 150, d: 600, e: EASE_INOUT });
  return tl(steps);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const layers = cover.querySelector('.op-layers')!;
  layers.append(div('ct-l', mk('ct-trim')), div('ct-r', mk('ct-trim')), div('ct-val', mk('ct-vf'), mk('ct-vt')));
  if (info.mode === 'full+') void prepareSparks();
  await waitMasks(layers);
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  if (c.level === 'full+') {
    // 16 hạt vàng dọc khe giữa (x = 50%, y 20–80%), bay ra 2 bên
    const h = innerHeight;
    for (const angle of [[-25, 25], [155, 205]] as [number, number][]) {
      void coverSparks({ count: 8, kind: ['gold-dust'], colors: gold(), size: [3, 6], origin: { x: innerWidth / 2, y: h / 2 }, spread: [4, h * 0.3], angle, speed: [60, 160], life: [800, 950], at: 200 / c.timeScale });
    }
  }
  return bind(cover, timeline(c.level), c);
}
