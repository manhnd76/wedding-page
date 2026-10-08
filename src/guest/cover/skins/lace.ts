/**
 * Mẫu `lace`: nền theme pha hồng, mép nắp lượn ren + lỗ đục (SVG tĩnh), cụm hoa ép (2 bông + 3 lá) thay dấu sáp.
 * Pha mở: cụm hoa nhấc lên translateY(-12px) rotate(-10deg) + mờ 260ms.
 */
import { svg } from '../../dom';
import { path, shell, type EnvelopeSkin } from './kit';

/** Lỗ đục dọc 2 cạnh nắp, lùi vào trong 9px. */
function holes(n = 9): SVGElement[] {
  const out: SVGElement[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const y = (0.5 + 127.5 * t - 9).toFixed(1);
    out.push(svg('circle', { cx: (339.5 - 169.5 * t).toFixed(1), cy: y, r: 2.2, class: 'lc-h' }));
    out.push(svg('circle', { cx: (0.5 + 169.5 * t).toFixed(1), cy: y, r: 2.2, class: 'lc-h' }));
  }
  return out;
}

function blossom(x: number, y: number, r: number, cls: string): SVGElement {
  return svg('g', { transform: `translate(${x} ${y})` },
    ...[0, 72, 144, 216, 288].map((a) => svg('ellipse', { cx: 0, cy: -r * 0.55, rx: r * 0.42, ry: r * 0.58, transform: `rotate(${a})`, class: cls })),
    svg('circle', { r: r * 0.24, class: 'fl-c' }));
}

export const skin: EnvelopeSkin = {
  build(p, o) {
    shell(p, 'lace', o, { flap: holes() });
    p.seal.append(svg('svg', { viewBox: '-32 -32 64 64', class: 'seal-art lc-bunch', 'aria-hidden': 'true', focusable: 'false' },
      ...[[-14, 8, -35], [14, 10, 30], [0, 16, 90]].map(([x, y, a]) => svg('ellipse', { cx: x!, cy: y!, rx: 11, ry: 4.6, transform: `rotate(${a} ${x} ${y})`, class: 'fl-l' })),
      path('M-14 8Q0 2 14 10M0 2V16', 'fl-st'),
      blossom(-9, -4, 15, 'fl-1'), blossom(11, -8, 12, 'fl-2')));
  },
  unlock(p, light) {
    if (light) return { steps: [{ el: p.seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 120 }], flapAt: 0 };
    return { steps: [{ el: p.seal, frames: [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-12px) rotate(-10deg)', opacity: 0 }], start: 0, dur: 260 }], flapAt: 200 };
  },
};
