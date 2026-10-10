/**
 * Burst `red-paper` - pháo giấy đỏ (design-v4a-2bc §5, `bursts.json`): dùng chung 3 biến thể + mặt sau `#F2B8A2`
 * với hạt nền `red-paper` (import dữ liệu từ module loại -> 1 chunk dùng chung, không chép path).
 * 3 đợt: 0 ms 40% quạt 20–160° từ (50%, 12%) 300–650 px/s; 150 ms + 300 ms mỗi đợt 30% mưa từ mép trên (x 12–88%, y −12)
 * góc 70–110° 150–420 px/s. g 520, drag 1.6, đời 1500–1800 ms, xoay 3–6, lật 4–8. `toBg` khi hạt nền có `red-paper`.
 */
import { ctx } from '../../context';
import type { BurstParticle, ParticleField } from '../particles/field';
import { kind } from '../particles/types/red-paper';
import type { BurstOpts, BurstPieces } from './registry';

export const DURATION_MS = 1800;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Sprite 3 biến thể (mặt sau `~b`), màu tự nhiên theo mode hoặc `colors`. */
function sprites(f: ParticleField, colors?: readonly string[]): string[] {
  const nat = (ctx.resolved.mode === 'dark' && kind.naturalDark) || kind.natural!;
  const c1 = colors?.[0] ?? nat[0]!;
  return f.kindSprites(`b:rp:${c1}`, kind, c1, colors?.[1] ?? nat[1]!, 14);
}

/** Biến thể theo trọng số .45/.35/.2. */
const pick = (keys: string[]) => keys[Math.random() < 0.45 ? 0 : Math.random() < 0.636 ? 1 : 2]!;

export function play(f: ParticleField, o: BurstOpts): number {
  const n = o.count;
  if (n <= 0) return 0;
  const keys = sprites(f);
  const { w, h } = f.size;
  const ki = f.kindIndex('red-paper');
  const mk = (x: number, y: number, ang: [number, number], sp: [number, number]): BurstParticle => {
    const a = (rnd(ang[0], ang[1]) * Math.PI) / 180;
    const v = rnd(sp[0], sp[1]);
    return {
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(8, 14), life: rnd(1500, 1800), gravity: 520, drag: 1.6,
      sprite: pick(keys), spin: rnd(3, 6), flip: true, flipRate: rnd(4, 8), ...(ki >= 0 ? { toBg: true, kindIdx: ki } : {}),
    };
  };
  const top = o.origin ?? (o.from ? { x: (o.from.left + o.from.right) / 2, y: o.from.top } : { x: w / 2, y: h * 0.12 });
  if (o.origin || o.from) {
    const before = f.burstActive;
    f.addBurst(Array.from({ length: n }, () => mk(top.x, top.y, [20, 160], [300, 650])));
    return f.burstActive - before;
  }
  const n1 = Math.round(n * 0.4);
  const n2 = Math.round((n - n1) / 2);
  const before = f.burstActive;
  f.addBurst(Array.from({ length: n1 }, () => mk(top.x + rnd(-10, 10), top.y, [20, 160], [300, 650])));
  const added = f.burstActive - before;
  const rain = (m: number) => Array.from({ length: m }, () => mk(rnd(0.12, 0.88) * w, -12, [70, 110], [150, 420]));
  const r1 = rain(n2);
  const r2 = rain(n - n1 - n2);
  setTimeout(() => f.addBurst(r1), 150);
  setTimeout(() => f.addBurst(r2), 300);
  return added + r1.length + r2.length;
}

/** Mảnh cho hạt trên cover (scroll `son-do`, E12 song-hy): biến thể lặp ~ .45/.35/.2, lật thấy mặt sau. */
export function pieces(f: ParticleField, colors?: readonly string[]): BurstPieces {
  const [a, b, c] = sprites(f, colors);
  return { keys: [a!, b!, a!, c!, b!, a!, b!, a!, c!], flip: true };
}
