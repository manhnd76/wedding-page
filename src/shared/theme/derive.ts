import { AA, contrast } from './contrast.ts';
import { hexToOklch, oklchToHex } from './oklch.ts';
import type { ThemeTokens } from './presets.ts';

export interface DerivedTokens extends ThemeTokens {
  primaryDecor: string;
  lineStrong: string;
  overlay: string;
}

/**
 * Suy token từ màu chủ đạo P theo OKLCH (solution 5.2.1, design 1.4).
 * Bảo đảm: primary, text, muted đạt >= 4.5:1 với cả bg và surface; onPrimary >= 4.5:1 với primary.
 */
export function deriveFromPrimary(primary: string, mode: 'light' | 'dark', accentOverride?: string): DerivedTokens {
  const P = hexToOklch(primary);
  const { c: C, h: H } = P;
  const at = (l: number, cMul: number, cMax: number, h = H) => oklchToHex({ l, c: Math.min(C * cMul, cMax), h });
  const dark = mode === 'dark';
  const bg = at(dark ? 0.17 : 0.975, 0.12, 0.012);
  const surface = at(dark ? 0.21 : 0.995, 0.06, 0.006);
  let text = at(dark ? 0.94 : 0.24, 0.35, 0.035);
  let muted = at(dark ? 0.75 : 0.47, 0.3, 0.04);
  const line = at(dark ? 0.32 : 0.86, 0.25, 0.03);
  const accent = accentOverride ?? oklchToHex({ l: 0.76, c: Math.min(C * 0.7, 0.1), h: (H + 25) % 360 });

  const step = dark ? 0.02 : -0.02;
  const fit = (hex: string, l0: number, c: number, h: number) => {
    let l = l0;
    let out = hex;
    let guard = 0;
    while ((contrast(out, bg) < AA || contrast(out, surface) < AA) && guard++ < 60) {
      l = Math.min(1, Math.max(0, l + step));
      out = oklchToHex({ l, c, h });
      if (l === 0 || l === 1) break;
    }
    return out;
  };
  const prim = fit(oklchToHex(P), P.l, C, H);
  const tC = hexToOklch(text);
  text = fit(text, tC.l, tC.c, tC.h);
  const mC = hexToOklch(muted);
  muted = fit(muted, mC.l, mC.c, mC.h);

  let onPrimary: string;
  if (dark) onPrimary = contrast(bg, prim) >= AA ? bg : pickBest(prim, [bg, '#000000']);
  else onPrimary = contrast('#FFFFFF', prim) >= AA ? '#FFFFFF' : pickBest(prim, [text, '#000000']);

  return {
    primary: prim, onPrimary, accent, bg, surface, text, muted, line,
    primaryDecor: primary.toUpperCase(),
    lineStrong: muted,
    overlay: dark ? rgba(bg, 0.55) : rgba(text, 0.45),
  };
}

function pickBest(on: string, candidates: string[]): string {
  return candidates.reduce((best, c) => (contrast(c, on) > contrast(best, on) ? c : best), candidates[0]!);
}

export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
