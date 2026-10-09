/**
 * Kiểu mở `flower-gate` - Cổng hoa (design-v4a-2bc §2.5, họ cổng, chi phí Vừa). Vector 4 lớp mask (không WebP - decisions
 * 2026-10-09): lá -> hoa -> lòng hoa -> nét; cụm phải = lật gương cụm trái; vòm 2 nửa. Màu theo token theme.
 * Vừa ~1.8s: biển rút 0–200 · 2 cụm hoa dạt chéo 150–950 · 24 cánh hoa (loại hạt nền của theme) bung từ tâm t=300
 *   · vòm phóng + mờ 400–1000 · cover mờ 1100–1800. Nhẹ ~0.9s: chỉ trượt, không hạt. Nhiều: 40 cánh, rơi tiếp thành hạt nền.
 */
import './flower-gate.css';
import { type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, mk, rise, tl, waitMasks, type StepSpec, type Timeline } from '../open-kit/layers';
import { coverSparks, prepareSparks } from '../open-kit/sparks';

export function timeline(level: OpenLevelCtx['level']): Timeline {
  const light = level === 'light';
  const slide = (k: string, m: string): StepSpec =>
    ({ k, f: [{ transform: `${m}translate(0,0) rotate(0deg)` }, { transform: `${m}translate(-55%,-18%) rotate(-8deg)` }], s: light ? 100 : 150, d: light ? 600 : 800 });
  if (light) return tl([rise('cv-plaque', 0, 150), slide('fg-cl', ''), slide('fg-cr', 'scaleX(-1) '), fade('fg-arch', 100, 500), fade('cover', 500, 400)]);
  return tl([
    rise('cv-plaque', 0, 200, ' scale(.98)'),
    slide('fg-cl', ''), slide('fg-cr', 'scaleX(-1) '),
    { k: 'fg-arch', f: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.25)', opacity: 0 }], s: 400, d: 600 },
    fade('cover', 1100, 700),
  ]);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const cluster = (s: string) => div(`fg-c fg-c${s}`, mk('fg-lf'), mk('fg-bl'), mk('fg-dp'), mk('fg-ln'));
  const layers = cover.querySelector('.op-layers')!;
  layers.append(div('fg-arch', mk('fg-al'), mk('fg-ar')), cluster('l'), cluster('r'));
  if (info.mode === 'full' || info.mode === 'full+') void prepareSparks();
  await waitMasks(layers);
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  if (c.level !== 'light') {
    void coverSparks({ burst: 'petals', count: c.level === 'full+' ? 40 : 24, origin: { x: innerWidth / 2, y: innerHeight * 0.42 }, at: 300 / c.timeScale });
  }
  return bind(cover, timeline(c.level), c);
}
