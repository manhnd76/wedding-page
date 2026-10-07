/** Chuyển đổi sRGB <-> OKLab/OKLCH (Björn Ottosson), gamut-map về sRGB bằng giảm chroma. */

export type RGB = [number, number, number]; // 0..1, sRGB gamma
export interface OKLCH { l: number; c: number; h: number }

export function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`hex không hợp lệ: ${hex}`);
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const to = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklch(rgb: RGB): OKLCH {
  const [r, g, b] = rgb.map(toLinear) as RGB;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

/** OKLCH -> sRGB tuyến tính chưa clamp (có thể ngoài gamut). */
function oklchToLinear({ l: L, c, h }: OKLCH): RGB {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (lin: RGB, eps = 1e-6) => lin.every((x) => x >= -eps && x <= 1 + eps);

/** OKLCH -> sRGB (gamma) đã gamut-map: giữ L, H; giảm C bằng chia đôi tới khi vào gamut. */
export function oklchToRgb(col: OKLCH): RGB {
  const L = Math.min(1, Math.max(0, col.l));
  let lin = oklchToLinear({ ...col, l: L });
  if (!inGamut(lin)) {
    let lo = 0;
    let hi = col.c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l: L, c: mid, h: col.h }))) lo = mid;
      else hi = mid;
    }
    lin = oklchToLinear({ l: L, c: lo, h: col.h });
  }
  return lin.map((x) => toGamma(Math.min(1, Math.max(0, x)))) as RGB;
}

export const oklchToHex = (c: OKLCH) => rgbToHex(oklchToRgb(c));
export const hexToOklch = (hex: string) => rgbToOklch(hexToRgb(hex));
