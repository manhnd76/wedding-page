/**
 * Burst `gold` - kim tuyến vàng (design-v4a-2bc §5, `bursts.json`): chấm quầng 3–6 px (70%) + sao 4 cánh 6–10 px (30%)
 * toả 360° từ tâm (50%, 42%), 100–420 px/s, g 30, drag 2.4, đời 1100–1400 ms, nhấp nháy `.6 + .4·sin`.
 * Màu theo mode (không theo accent - bụi vàng nhạt biến mất trên nền giấy): sáng `#C9A24A/#B8862F`, tối `#F3D48C/#D9B77E`, lõi sáng.
 */
import { ctx } from '../../context';
import type { ParticleField } from '../particles/field';
import type { Layer } from '../particles/kind';
import type { BurstOpts, BurstPieces } from './registry';

export const DURATION_MS = 1400;
const DOT: Layer[] = [{ radial: [0, 0, 12], stops: [[0, 'c2', 1], [0.3, 'c1', 0.95], [1, 'c1', 0]] }];
const STAR: Layer[] = [
  { d: 'M0 -11C1.8 -1.8 1.8 -1.8 11 0C1.8 1.8 1.8 1.8 0 11C-1.8 1.8 -1.8 1.8 -11 0C-1.8 -1.8 -1.8 -1.8 0 -11Z', fill: 'c1' },
  { circle: [0, 0, 1.8], fill: 'c2', a: 0.95 },
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** [vàng 1, vàng 2, lõi] theo mode. */
export const goldColors = (): [string, string, string] =>
  ctx.resolved.mode === 'dark' ? ['#F3D48C', '#D9B77E', '#FFF8E6'] : ['#C9A24A', '#B8862F', '#FFF4D6'];

/** Sprite [chấm, sao] cho 1 màu vàng + lõi. */
const sprites = (f: ParticleField, c1: string, core: string): [string, string] =>
  [f.layerSprite(`b:gd:0:${c1}`, 6, DOT, c1, core), f.layerSprite(`b:gd:1:${c1}`, 10, STAR, c1, core)];

export function play(f: ParticleField, o: BurstOpts): number {
  if (o.count <= 0) return 0;
  const [g1, g2, core] = goldColors();
  const sets = [sprites(f, g1, core), sprites(f, g2, core)];
  const { w, h } = f.size;
  const c = o.origin ?? (o.from ? { x: (o.from.left + o.from.right) / 2, y: (o.from.top + o.from.bottom) / 2 } : { x: w / 2, y: h * 0.42 });
  const before = f.burstActive;
  f.addBurst(Array.from({ length: o.count }, () => {
    const star = Math.random() < 0.3;
    const a = Math.random() * Math.PI * 2;
    const v = rnd(100, 420);
    return {
      x: c.x + rnd(-6, 6), y: c.y + rnd(-6, 6), vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      size: star ? rnd(6, 10) : rnd(3, 6), life: rnd(1100, 1400), gravity: 30, drag: 2.4,
      sprite: sets[Math.random() < 0.5 ? 0 : 1]![star ? 1 : 0], spin: star ? 1.5 : 0, flip: false, twinkle: true,
    };
  }));
  return f.burstActive - before;
}

/** Mảnh cho hạt trên cover (rèm, dấu sáp, E12 classic/velvet): chấm : sao = 7 : 3, nhấp nháy. */
export function pieces(f: ParticleField, colors?: readonly string[]): BurstPieces {
  const [g1, , core] = goldColors();
  const [dot, star] = sprites(f, colors?.[0] ?? g1, colors?.[1] ?? core);
  return { keys: [dot, dot, star, dot, dot, star, dot, dot, star, dot], twinkle: true };
}
