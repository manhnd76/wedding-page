/**
 * Helper vẽ sprite dùng chung (solution-v4a-2bc.md 2.1, design-v4a-2bc §4.1): chỉ `field.ts` import file này
 * (nằm trong chunk field), module loại hạt / burst chỉ chứa dữ liệu `Layer[]` -> mỗi module ≤ 1.5 KB gz.
 * Thuần (không DOM) trừ `drawLayers` (cần context canvas) -> unit test được.
 */
import type { Layer, ParticleKind, ToneToken, Variant } from './kind';

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Trộn màu hex `h` về phía `to` theo tỉ lệ `k` (0 = giữ nguyên). Không phải hex -> trả nguyên. */
export function mix(h: string, to: string, k: number): string {
  if (!HEX.test(h) || !HEX.test(to)) return h;
  const b = rgb(to);
  return `#${rgb(h).map((v, i) => Math.round(v + (b[i]! - v) * k).toString(16).padStart(2, '0')).join('')}`;
}

/** Hex + alpha -> rgba(); màu không phải hex (vd `rgba(...)`) trả nguyên. */
export function rgba(h: string, a: number): string {
  return HEX.test(h) ? `rgba(${rgb(h).join(',')},${a})` : h;
}

/** Màu của 1 lớp: c1 / c2 / light / dark / mã màu. */
export function tone(t: string, c1: string, c2: string): string {
  return t === 'c1' ? c1 : t === 'c2' ? c2 : t === 'light' ? mix(c1, '#ffffff', 0.4) : t === 'dark' ? mix(c1, '#000000', 0.28) : t;
}

/**
 * Vẽ các lớp vào ô `s` px (gốc ở tâm). Alpha lớp NHÂN với alpha hiện có của context (design §4.1: bản thử đầu
 * ghi đè làm `ink-dot` đen kịt).
 */
export function drawLayers(g: CanvasRenderingContext2D, s: number, layers: readonly Layer[], c1: string, c2: string, offset?: readonly [number, number]): void {
  const base = g.globalAlpha;
  g.save();
  g.scale(s / 24, s / 24);
  if (offset) g.translate(offset[0], offset[1]);
  for (const l of layers) {
    g.save();
    g.globalAlpha = base * (l.a ?? 1);
    if (l.clip) g.clip(new Path2D(l.clip));
    if (l.radial) {
      const [x, y, r] = l.radial;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      for (const [t, tn, a] of l.stops ?? []) gr.addColorStop(t, rgba(tone(tn, c1, c2), a));
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    } else {
      const p = new Path2D(l.d);
      if (l.circle) p.arc(l.circle[0], l.circle[1], l.circle[2], 0, Math.PI * 2);
      if (l.fill) { g.fillStyle = tone(l.fill, c1, c2); g.fill(p); }
      else if (l.stroke) {
        g.strokeStyle = tone(l.stroke, c1, c2);
        g.lineWidth = l.lw ?? 1;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.stroke(p);
      }
    }
    g.restore();
  }
  g.restore();
}

/** Vẽ biến thể `v` (mặt sau nếu `back`) của loại `k`; loại v1 (có `draw`) bỏ qua biến thể. */
export function paintKind(g: CanvasRenderingContext2D, s: number, k: ParticleKind, c1: string, c2: string, v = 0, back = false): void {
  const vr: Variant | undefined = k.variants?.[v];
  if (!vr) { k.draw?.(g, s, c1, c2); return; }
  drawLayers(g, s, back ? vr.back ?? k.back ?? vr.layers : vr.layers, c1, c2, vr.offset);
}

/** Loại `k` có mặt sau ở biến thể `v` không. */
export const hasBack = (k: ParticleKind, v: number): boolean => !!(k.flip && (k.variants?.[v]?.back ?? k.back));

/** Chọn biến thể theo trọng số `w` (r ∈ [0,1)). */
export function pickVariant(vs: readonly Variant[] | undefined, r: number): number {
  if (!vs || vs.length < 2) return 0;
  let acc = 0;
  for (let i = 0; i < vs.length; i++) { acc += vs[i]!.w; if (r < acc) return i; }
  return vs.length - 1;
}

export interface PaletteOpts {
  /** màu theo cấu hình (theme: accent + primary-decor; multi: accent + accent-2; hex) */
  colors: readonly string[];
  /** particles.color = "theme" */
  themeColors: boolean;
  dark?: boolean;
  tokens?: Partial<Record<ToneToken, string>>;
}

/**
 * Màu [c1, c2] của 1 loại (design-v4a-2bc §4.2, giữ quy tắc v1 `themeColors && natural`):
 * "theme" -> màu tự nhiên (tối: `naturalDark`) / token riêng của loại (`tones`, tối: `tonesDark`) / accent + primary-decor;
 * "multi" / hex -> theo cấu hình cho mọi loại.
 */
export function kindPalette(k: ParticleKind, o: PaletteOpts): [string, string] {
  let pal: readonly (string | undefined)[] = o.colors;
  if (o.themeColors) {
    const nat = (o.dark && k.naturalDark) || k.natural;
    const tk = (o.dark && k.tonesDark) || k.tones;
    if (nat) pal = nat;
    else if (tk && o.tokens) pal = tk.map((n) => o.tokens![n]);
  }
  const c1 = pal[0] ?? o.colors[0] ?? '#C9A86A';
  return [c1, pal[1] ?? c1];
}
