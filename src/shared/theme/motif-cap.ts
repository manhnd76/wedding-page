/**
 * `--motif-cap` (design 1.7.5, solution Rev 5 mục 10.1): opacity tối đa của hoạ tiết nền khi NẰM SAU CHỮ.
 * Pixel xấu nhất = chữ nằm đúng trên nét hoạ tiết, nền = mix(bg|surface, accent, α) (trộn tuyến tính từng kênh sRGB
 * đã gamma, như trình duyệt tổng hợp opacity; không làm tròn). cap = α lớn nhất (bước .01) mà MỌI α' ≤ α đều giữ
 * text, muted, primary ≥ 4.5:1 trên cả bg lẫn surface. Chạy ở plugin build / preview / admin (guest đọc giá trị inline).
 */
import { AA } from './contrast.ts';
import { hexToRgb } from './oklch.ts';

type RGB = readonly [number, number, number];

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a: number, b: number) => (a > b ? (a + 0.05) / (b + 0.05) : (b + 0.05) / (a + 0.05));

export interface MotifCapTokens { bg: string; surface: string; text: string; muted: string; primary: string; accent: string }

export function motifCap(t: MotifCapTokens): number {
  const acc = hexToRgb(t.accent) as unknown as RGB;
  const bases = [t.bg, t.surface].map((x) => hexToRgb(x) as unknown as RGB);
  const inks = [t.text, t.muted, t.primary].map((x) => lum(hexToRgb(x) as unknown as RGB));
  let cap = -1;
  for (let i = 0; i <= 100; i++) {
    const a = i / 100;
    let ok = true;
    for (const b of bases) {
      const m: RGB = [b[0] + (acc[0] - b[0]) * a, b[1] + (acc[1] - b[1]) * a, b[2] + (acc[2] - b[2]) * a];
      const lm = lum(m);
      if (inks.some((li) => ratio(li, lm) < AA)) { ok = false; break; }
    }
    if (!ok) break;
    cap = a;
  }
  return cap < 0 ? 0 : Math.round(cap * 100) / 100;
}
