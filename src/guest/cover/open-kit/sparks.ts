/**
 * open-kit/sparks (solution-v4a-2bc.md bảng API "Hạt trên cover"; design-v4a-2bc §1.4, §3.0): hạt chạy TRÊN cover
 * trong lúc mở thiệp, dùng chung ParticleField (canvas nâng lên trên cover bằng `setOverCover`, hạ lại khi cover gỡ).
 * Loại hạt chưa có loader (vd `sparkle`, `petal-lotus` của v4a-2c) -> loại kế trong danh sách, cuối cùng là loại `k0`
 * của theme; burst chưa có -> `petals` (registry). Không tạo canvas khi Tắt/reduced (getField trả null).
 */
import { ctx, on } from '../../context';
import { getField } from '../../effects/service';
import type { BurstParticle, ParticleField } from '../../effects/particles/field';

/** Lớp vẽ sprite trong ô 24×24 tâm (0,0) (định dạng `envelope-e12/e12.json` của designer B). */
export interface Layer { d?: string; r?: number; fill?: string; stroke?: string; lw?: number; a?: number }

export interface SparkReq {
  count: number;
  /** loại hạt theo thứ tự ưu tiên (loại đầu tiên có loader) */
  kind?: string[];
  /** sprite riêng (E12): mỗi biến thể là danh sách lớp */
  shapes?: Layer[][];
  /** burst theo id registry (vd `petals`, `confetti`); chưa có module -> dùng kind/shapes làm dự phòng */
  burst?: string;
  /** [c1, c2]; mặc định = màu tự nhiên của loại hoặc accent/primary-decor */
  colors?: string[];
  origin: Element | { x: number; y: number };
  /** góc phát (độ; 0 = sang phải, -90 = lên) */
  angle?: [number, number];
  speed?: [number, number];
  life?: [number, number];
  size?: [number, number];
  gravity?: number;
  drag?: number;
  spin?: number;
  /** rải điểm phát quanh gốc (± px theo x, y) */
  spread?: [number, number];
  /** trễ (ms đồng hồ thật) */
  at?: number;
}

const rnd = ([a, b]: [number, number]) => a + Math.random() * (b - a);
const hooked = new WeakSet<ParticleField>();

/** Vàng kim theo mode (design §3.1: sáng `#B8862F/#C9A24A`, tối `#F3D48C`; lõi sáng). */
export const gold = (): string[] => (document.documentElement.dataset.mode === 'dark' ? ['#F3D48C', '#FFF8E6'] : ['#B8862F', '#FFF4D6']);

/** Tải sẵn canvas hạt (gọi trong `prepare()` để lúc chạm đã có). */
export const prepareSparks = (): Promise<ParticleField | null> => getField();

function drawLayers(g: CanvasRenderingContext2D, s: number, layers: Layer[], c: string[]): void {
  g.scale(s / 24, s / 24);
  for (const l of layers) {
    const col = (v?: string) => (v === 'c1' ? c[0]! : v === 'c2' ? c[1] ?? c[0]! : v ?? '');
    g.globalAlpha = l.a ?? 1;
    const p = new Path2D(l.d ?? '');
    if (l.r) p.arc(0, 0, l.r, 0, Math.PI * 2);
    if (l.fill) { g.fillStyle = col(l.fill); g.fill(p); }
    if (l.stroke) { g.strokeStyle = col(l.stroke); g.lineWidth = l.lw ?? 1; g.stroke(p); }
  }
}

async function sprites(f: ParticleField, r: SparkReq, max: number): Promise<string[]> {
  const t = ctx.resolved.tokens;
  if (r.shapes) {
    const c = r.colors ?? [t.accent, t.accent2];
    return r.shapes.map((ls, i) => {
      const key = `op:${c.join()}:${i}:${ls.length}:${ls[0]?.d ?? ls[0]?.r}`;
      f.makeSprite(key, max, (g, s) => drawLayers(g, s, ls, c));
      return key;
    });
  }
  const { PARTICLE_LOADERS } = await import('../../effects/particles/types');
  for (const id of r.kind ?? []) {
    const l = PARTICLE_LOADERS[id];
    if (!l) continue;
    const k = (await l()).kind;
    const c = r.colors ?? k.natural ?? [t.accent, t.primaryDecor];
    const key = `op:${id}:${c.join()}`;
    f.makeSprite(key, max, (g, s) => k.draw(g, s, c[0]!, c[1] ?? c[0]!));
    return [key];
  }
  return ['k0']; // loại hạt nền của theme (sprite field tự vẽ)
}

/** Phát `count` hạt từ `origin`; trả số hạt đã thêm (0 khi Tắt/reduced hoặc không có canvas). */
export async function coverSparks(r: SparkReq): Promise<number> {
  const f = await getField();
  if (!f || r.count <= 0) return 0;
  if (r.at) await new Promise((res) => setTimeout(res, r.at));
  f.setOverCover(true);
  f.refreshZones(); // vùng dịu `.env-addr` / `.cv-plaque` (SOFT_SELECTOR) có trên cover
  if (!hooked.has(f)) { hooked.add(f); on('cover-gone', () => f.setOverCover(false)); }
  const o = r.origin instanceof Element ? (() => { const b = r.origin.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })() : r.origin;
  if (r.burst) {
    // burst có module (vd `confetti` của v4a-2c) -> dùng; chưa có -> vẽ bằng kind/shapes của lời gọi (nếu có), không thì `petals`
    const m = await import('../../effects/burst/registry');
    if (m.BURST_LOADERS[r.burst] || !(r.kind || r.shapes)) return m.playBurst(r.burst, f, { count: r.count, origin: o, kindCount: 1 });
  }
  const size = r.size ?? [4, 7];
  const keys = await sprites(f, r, size[1]);
  const [sx, sy] = r.spread ?? [6, 6];
  const list: BurstParticle[] = [];
  for (let i = 0; i < r.count; i++) {
    const a = (rnd(r.angle ?? [0, 360]) * Math.PI) / 180;
    const v = rnd(r.speed ?? [60, 180]);
    list.push({
      x: o.x + rnd([-sx, sx]), y: o.y + rnd([-sy, sy]), vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      size: rnd(size), life: rnd(r.life ?? [600, 800]), gravity: r.gravity ?? 40, drag: r.drag ?? 2.4,
      sprite: keys[i % keys.length]!, spin: r.spin ?? 2,
    });
  }
  const before = f.burstActive;
  f.addBurst(list);
  return f.burstActive - before;
}
