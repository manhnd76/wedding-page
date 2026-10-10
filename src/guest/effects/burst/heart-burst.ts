/**
 * Burst `heart-burst` - tim bung (design-v4a-2bc §5, `bursts.json`): dành cho nút "Gửi lời chúc" (v3 móc vào nút;
 * v4a-2c chỉ có module + hook debug `__wpBurst('heart-burst', { from })`). Không thuộc "Sau khi mở".
 * Tim đặc .6 · tim viền .25 · cặp tim nhỏ .15; từ giữa mép trên `from` (rect nút), −150…−30°, 220–380 px/s, g 260, drag 1.2,
 * đời 1000–1200 ms, phóng vào .4 -> 1 trong 150 ms (`--ease-pop`). Số tim Nhẹ/Vừa/Nhiều = 0/8/12.
 * Màu: sáng [primary, accent, primary pha trắng .35]; tối [primary, accent, #F2E9E1].
 */
import { ctx } from '../../context';
import type { ParticleField } from '../particles/field';
import type { Layer } from '../particles/kind';
import type { BurstOpts } from './registry';

export const DURATION_MS = 1200;
const H = 'M0 8.9C-11.5 0.5 -7.9 -10 0 -3.7C7.9 -10 11.6 0.5 0 8.9Z';
const SHAPES: [number, Layer[]][] = [
  [0.6, [{ d: H, fill: 'c1' }, { d: 'M-6.6-4.6C-5.6-7.4-3-7.6-1.8-6', stroke: '#FFFFFF', lw: 1.3, a: 0.55 }]],
  [0.25, [{ d: 'M0 8.2C-10.6 0.5 -7.2 -9.1 0 -3.4C7.2 -9.1 10.6 0.5 0 8.2Z', stroke: 'c1', lw: 1.8 }]],
  [0.15, [{ d: 'M-3 6.6C-9.9 3.6 -9.1 -2.2 -4.4 0.1C-1.1 -3.9 2 1 -3 6.6Z', fill: 'c1' }, { d: 'M4.1 0.5C0.5 -3.9 2.9 -7.7 5.4 -4.5C9.1 -6.1 9.4 -1.7 4.1 0.5Z', fill: 'c1', a: 0.7 }]],
];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function palette(f: Pick<ParticleField, 'mix'>): string[] {
  const t = ctx.resolved.tokens;
  return [t.primary, t.accent, ctx.resolved.mode === 'dark' ? '#F2E9E1' : f.mix(t.primary, '#ffffff', 0.35)];
}

export function play(f: ParticleField, o: BurstOpts): number {
  if (o.count <= 0) return 0;
  const cols = palette(f);
  const keys = SHAPES.map(([, l], i) => cols.map((c) => f.layerSprite(`b:hb:${i}:${c}`, 20, l, c, c)));
  const { w, h } = f.size;
  const at = o.from ? { x: (o.from.left + o.from.right) / 2, y: o.from.top } : o.origin ?? { x: w / 2, y: h * 0.6 };
  // P07 (Q1): tim phát từ nút khách vừa bấm (trong form `data-fx-exclude`) không chịu vùng loại trừ, vẫn chịu vùng dịu
  const zones = o.from || o.origin ? false : undefined;
  const before = f.burstActive;
  f.addBurst(Array.from({ length: o.count }, () => {
    const r = Math.random();
    const row = keys[r < 0.6 ? 0 : r < 0.85 ? 1 : 2]!;
    const a = (rnd(-150, -30) * Math.PI) / 180;
    const v = rnd(220, 380);
    return {
      x: at.x + rnd(-10, 10), y: at.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(10, 20), life: rnd(1000, 1200),
      gravity: 260, drag: 1.2, sprite: row[Math.floor(Math.random() * row.length)]!, spin: 0.6, flip: false, scaleIn: [0.4, 150] as [number, number],
      ...(zones === false ? { zones } : {}),
    };
  }));
  return f.burstActive - before;
}
