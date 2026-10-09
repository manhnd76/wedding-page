/**
 * Mẫu `kraft`: giấy kraft có thớ (noise tĩnh), dây gai buộc chữ thập + nơ, thẻ tên giấy ngà, nhánh oải hương.
 * Pha mở: nơ tuột (stroke-dashoffset 260ms), dây trượt sang 2 bên + mờ, thẻ tên lắc ±4°.
 */
import type { Layer } from '../open-kit/sparks';
import { svg } from '../../dom';
import { box, path, shell, type EnvelopeSkin } from './kit';

/** e12-lavender (designer B `envelope-e12/e12.json`): ô 24×24; c1 = nụ, c2 = cuống. */
const LAVENDER: Layer[] = [
  { d: 'M0 11V-6', stroke: 'c2', lw: 0.9 },
  { d: 'M0-11.2C1.3-2.2-7.4 2.2-9 2.2-1.6-6.8-1.3-2.2-9-2.2Z', fill: 'c1' },
  { d: 'M-2.4-7.7C1.3-3.1-3.3.5-6.4 2.2-2.4-3-1.3-3.7-4.8-2.2Z', fill: '#A895D6' },
  { d: 'M2.4-6.5C1.3-1-3.6 3.7-3.6 2.2-.7-2.9-1.3-.5-5.2-2.2Z', fill: 'c1' },
  { d: 'M-2.4-3.7C1.3-3.1.7.5-2.4 2.2-2.4 1-1.3-3.7-.8-2.2Z', fill: '#A895D6' },
  { d: 'M2.4-2.1C1.3-1 .8 3.7.8 2.2-.7 1.5-1.3-.5-.8-2.2Z', fill: 'c1' },
  { d: 'M-1.9.9C1.3-2.8 5.2.9 2.3 2.2-2 5.6-1.3-3.3 3.7-2.2Z', fill: '#A895D6' },
];

export const skin: EnvelopeSkin = {
  build(p, o) {
    const fid = `kg-${o.uid}`;
    const grain = (d: string) => path(d, 'kr-grain', { filter: `url(#${fid})` });
    const g = shell(p, 'kraft', o, {
      back: [svg('defs', {}, svg('filter', { id: fid, x: 0, y: 0, width: 1, height: 1 },
        svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 2, seed: 7 }),
        svg('feColorMatrix', { values: '0 0 0 0 .23 0 0 0 0 .16 0 0 0 0 .1 0 0 0 .5 0' }),
        svg('feComposite', { operator: 'in', in2: 'SourceGraphic' })))],
    });
    // thớ giấy: phủ đúng hình túi / nắp (filter khai ở lớp back, cùng tài liệu)
    p.front.querySelector('svg')?.append(grain(g.pocket));
    p.flapF.querySelector('svg')?.append(grain(g.flap));
    // dây gai: 2 nửa (trượt sang 2 bên khi mở). E02: đoạn dọc phía dưới nút chỉ tới mép trên thẻ tên
    // (thẻ "treo" từ nút nơ; thẻ: bottom 6% + cao 40% -> mép trên y ≈ 129) - không vẽ đè lên chữ
    p.deco.append(
      box('tw tw-l', path('M0 112H170M170 0V129', 'tw-s')),
      box('tw tw-r', path('M170 112H340', 'tw-s')));
    // nơ + oải hương ở nút dây (lớp seal)
    p.seal.append(svg('svg', { viewBox: '-32 -32 64 64', class: 'seal-art kr-bow', 'aria-hidden': 'true', focusable: 'false' },
      path('M-4 2C-18 18-26 22-22 6M4 2C14 20 24 22 22 8', 'lv-s'),
      ...[[-20, 12], [-23, 6], [-17, 17], [20, 13], [23, 7], [16, 18]].map(([x, y]) => svg('ellipse', { cx: x!, cy: y!, rx: 2.2, ry: 3.4, class: 'lv-f' })),
      path('M0 0C-8-14-22-12-18-3S-6 2 0 0ZM0 0C8-14 22-12 18-3S6 2 0 0Z', 'tw-s bow', { pathLength: 100 }),
      path('M0 0-7 16M0 0 6 17', 'tw-s bow', { pathLength: 100 }),
      svg('circle', { r: 3.2, class: 'tw-k' })));
  },
  unlock(p, light) {
    if (light) {
      return { steps: [{ el: p.seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 120 }, { el: p.deco, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 160 }], flapAt: 0 };
    }
    const bows = Array.from(p.seal.querySelectorAll('.bow'));
    return {
      steps: [
        ...bows.map((el) => ({ el, frames: [{ strokeDashoffset: 0 }, { strokeDashoffset: 100 }], start: 0, dur: 260 })),
        { el: p.seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 160, dur: 160 },
        { el: p.deco.querySelector('.tw-l'), frames: [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-120%)', opacity: 0 }], start: 140, dur: 240 },
        { el: p.deco.querySelector('.tw-r'), frames: [{ transform: 'none', opacity: 1 }, { transform: 'translateX(120%)', opacity: 0 }], start: 140, dur: 240 },
        { el: p.front.querySelector('.env-addr'), frames: [{ transform: 'rotate(-3deg)' }, { transform: 'rotate(1deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(-3deg)' }], start: 120, dur: 420 },
      ],
      flapAt: 300,
    };
  },
  // E12: 10 nhánh oải hương rơi theo 2 quạt chéo xuống khi nơ bắt đầu tuột (né rơi thẳng lên thẻ tên)
  rich: () => [20, 100].map((a) => ({
    at: 120, count: 5, angle: [a, a + 60] as [number, number], speed: [40, 140] as [number, number], gravity: 380, drag: 1.4, life: [1000, 1300] as [number, number],
    size: [10, 16] as [number, number], spin: 3, colors: ['#8E7CC3', '#7A8F5C'], shapes: [LAVENDER]
  })),
};
