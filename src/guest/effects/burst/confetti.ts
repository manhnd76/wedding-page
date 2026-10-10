/**
 * Burst `confetti` (design-v4a-2bc §5, `assets/v4a-2/burst/bursts.json`): giấy chữ nhật / vuông / tròn / dải xoắn,
 * mỗi mảnh 1 màu theme, lật thấy mặt sau `dark`.
 * - Sau khi mở (không có `origin`/`from`): 2 góc dưới (6%, 102%) góc −80…−55° và (94%, 102%) −125…−100°, mỗi bên 3 nhịp 40 ms;
 *   v = 2.0–2.8·vh, g = 0.6·vh, drag 2.2, đời 1500–1800 ms.
 * - RSVP "Tôi sẽ đến" (v3 móc nút; `from` = rect nút) / có `origin`: mép trên nút, −140…−40°, 520–820 px/s, g 1100, drag 1.6, đời 1100–1400 ms.
 * Số mảnh Nhẹ/Vừa/Nhiều = `BURST_COUNTS` (0/80/120; RSVP 0/40/60 do v3 truyền `count`).
 * Cỡ ô 16–24 px (P06, Q5: chữ nhật thật 7–11 × 4–6 px, tròn 5–8 px, dải xoắn 12–18 px; `bursts.json` cũ [7, 12] như bụi);
 * sprite vẽ ở 24 px. `gift-box` (`pieces()`) giữ cỡ riêng của lời gọi `coverSparks` (đã duyệt ở 2b).
 */
import { ctx } from '../../context';
import type { BurstParticle, ParticleField } from '../particles/field';
import type { Layer } from '../particles/kind';
import type { BurstOpts, BurstPieces } from './registry';

export const DURATION_MS = 1800;
const R = 'M-4.9 -3H4.9Q5.5 -3 5.5 -2.4V2.4Q5.5 3 4.9 3H-4.9Q-5.5 3 -5.5 2.4V-2.4Q-5.5 -3 -4.9 -3Z';
const Q = 'M-3 -3.5H3Q3.5 -3.5 3.5 -3V3Q3.5 3.5 3 3.5H-3Q-3.5 3.5 -3.5 3V-3Q-3.5 -3.5 -3 -3.5Z';
/** [trọng số, lớp, mặt sau] */
const SHAPES: [number, Layer[], Layer[]?][] = [
  [0.4, [{ d: R, fill: 'c1' }], [{ d: R, fill: 'dark' }]],
  [0.2, [{ d: Q, fill: 'c1' }], [{ d: Q, fill: 'dark' }]],
  [0.2, [{ circle: [0, 0, 4], fill: 'c1' }]],
  [0.2, [{ d: 'M-1.5-9C3-6-3-2 1.5 1S-3 6 1.5 9', stroke: 'c1', lw: 2.4 }]],
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Bảng màu theo mode: sáng [accent, accent-2, primary, accent pha trắng .45]; tối [primary, accent, #F2E9E1, primary pha trắng .3]. */
export function palette(f: Pick<ParticleField, 'mix'>): string[] {
  const t = ctx.resolved.tokens;
  return ctx.resolved.mode === 'dark'
    ? [t.primary, t.accent, '#F2E9E1', f.mix(t.primary, '#ffffff', 0.3)]
    : [t.accent, t.accent2, t.primary, f.mix(t.accent, '#ffffff', 0.45)];
}

/** Cỡ ô mảnh (px) - P06. */
export const SIZE: [number, number] = [16, 24];

/** Sprite hình × màu (4 × 4 = 16 sprite, vẽ ở 24 px); `[hình][màu]`. */
function sprites(f: ParticleField, cols: readonly string[]): string[][] {
  return SHAPES.map(([, l, b], si) => cols.map((c) => f.layerSprite(`b:cf:${si}:${c}`, SIZE[1], l, c, c, b)));
}

function pickShape(): number {
  let r = Math.random();
  for (let i = 0; i < SHAPES.length; i++) { r -= SHAPES[i]![0]; if (r < 0) return i; }
  return 0;
}

interface Emit { x: number; y: number; ang: [number, number]; sp: [number, number]; g: number; drag: number; life: [number, number]; zones?: false }

function piece(keys: string[][], e: Emit): BurstParticle {
  const si = pickShape();
  const row = keys[si]!;
  const a = (rnd(e.ang[0], e.ang[1]) * Math.PI) / 180;
  const v = rnd(e.sp[0], e.sp[1]);
  return {
    x: e.x + rnd(-8, 8), y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(SIZE[0], SIZE[1]), life: rnd(e.life[0], e.life[1]),
    gravity: e.g, drag: e.drag, sprite: row[Math.floor(Math.random() * row.length)]!, spin: rnd(4, 9), flip: true, flipRate: rnd(3, 7),
    ...(e.zones === false ? { zones: e.zones } : {}),
  };
}

export function play(f: ParticleField, o: BurstOpts): number {
  const n = o.count;
  if (n <= 0) return 0;
  const keys = sprites(f, palette(f));
  const { w, h } = f.size;
  const at = o.from ? { x: (o.from.left + o.from.right) / 2, y: o.from.top } : o.origin;
  if (at) {
    // P07 (Q1): mảnh phát từ nút RSVP (trong `.rsvp-card[data-fx-exclude]`) không chịu vùng loại trừ, vẫn chịu vùng dịu
    const e: Emit = { ...at, ang: [-140, -40], sp: [520, 820], g: 1100, drag: 1.6, life: [1100, 1400], zones: false };
    const before = f.burstActive;
    f.addBurst(Array.from({ length: n }, () => piece(keys, e)));
    return f.burstActive - before;
  }
  const sides: Emit[] = [
    { x: w * 0.06, y: h * 1.02, ang: [-80, -55], sp: [2 * h, 2.8 * h], g: 0.6 * h, drag: 2.2, life: [1500, 1800] },
    { x: w * 0.94, y: h * 1.02, ang: [-125, -100], sp: [2 * h, 2.8 * h], g: 0.6 * h, drag: 2.2, life: [1500, 1800] },
  ];
  // 6 nhịp (2 bên × 3 nhịp 40 ms), chia đều số mảnh
  let added = 0;
  for (let i = 0; i < 6; i++) {
    const m = Math.floor(((i + 1) * n) / 6) - Math.floor((i * n) / 6);
    const list = Array.from({ length: m }, () => piece(keys, sides[i % 2]!));
    const t = Math.floor(i / 2) * 40;
    if (t) { setTimeout(() => f.addBurst(list), t); added += m; } else { const b = f.burstActive; f.addBurst(list); added += f.burstActive - b; }
  }
  return added;
}

/** Mảnh cho hạt trên cover (`gift-box`): lặp theo tỉ lệ hình 4:2:2:2, màu xoay vòng. */
export function pieces(f: ParticleField, colors?: readonly string[]): BurstPieces {
  const keys = sprites(f, colors?.length ? colors : palette(f));
  const out: string[] = [];
  [0, 1, 0, 2, 0, 3, 0, 1, 2, 3].forEach((si, i) => out.push(keys[si]![i % keys[si]!.length]!));
  return { keys: out, flip: true };
}
