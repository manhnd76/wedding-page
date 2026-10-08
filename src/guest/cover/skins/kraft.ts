/**
 * Mẫu `kraft`: giấy kraft có thớ (noise tĩnh), dây gai buộc chữ thập + nơ, thẻ tên giấy ngà, nhánh oải hương.
 * Pha mở: nơ tuột (stroke-dashoffset 260ms), dây trượt sang 2 bên + mờ, thẻ tên lắc ±4°.
 */
import { svg } from '../../dom';
import { box, path, shell, type EnvelopeSkin } from './kit';

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
    // dây gai: 2 nửa (trượt sang 2 bên khi mở)
    p.deco.append(
      box('tw tw-l', path('M0 112H170M170 0V238', 'tw-s')),
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
};
