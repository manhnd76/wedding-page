import { describe, expect, it } from 'vitest';
import { contrast } from '@shared/theme/contrast';
import { deriveFromPrimary } from '@shared/theme/derive';
import { hexToOklch, oklchToHex, rgbToHex, hexToRgb } from '@shared/theme/oklch';
import { PRESETS } from '@shared/theme/presets';
import { THEME_IDS } from '@shared/config/enums';

/** Bảng 1.6.3 design: primary/bg, primary/surface, onPrimary/primary, text/bg, text/surface, muted/bg, muted/surface, accent/bg */
const TABLE: Record<string, number[]> = {
  'tram-vang': [4.68, 4.99, 4.99, 14.42, 15.40, 5.86, 6.25, 2.12],
  'hong-phan': [5.22, 5.71, 5.71, 13.12, 14.36, 5.80, 6.34, 1.57],
  'luc-bao': [7.04, 7.89, 8.02, 13.05, 14.62, 5.46, 6.12, 2.13],
  'son-do': [7.16, 7.55, 7.55, 14.82, 15.63, 7.33, 7.73, 2.20],
  'muc-giay': [14.40, 15.16, 15.16, 16.21, 17.07, 6.18, 6.50, 3.51],
  'hoai-co': [7.64, 8.32, 8.97, 12.91, 14.07, 5.77, 6.28, 2.11],
  'sen-cham': [9.64, 10.34, 10.70, 13.80, 14.80, 6.06, 6.50, 1.76],
  'mau-nuoc': [5.58, 5.96, 5.96, 12.92, 13.79, 5.65, 6.03, 1.79],
  'dat-nung': [5.39, 5.86, 6.19, 11.93, 12.96, 5.66, 6.15, 1.91],
  'pastel-han': [5.75, 6.08, 6.08, 13.23, 13.99, 5.71, 6.04, 1.46],
  'dem-nhung': [9.43, 8.62, 9.43, 14.99, 13.70, 7.68, 7.01, 4.52],
  'bien-dao': [6.80, 7.33, 7.33, 13.53, 14.58, 5.81, 6.27, 1.88],
};

describe('contrast 12 preset khớp bảng 1.6.3 (±0.05)', () => {
  it('đủ 12 theme', () => expect(Object.keys(TABLE).sort()).toEqual([...THEME_IDS].sort()));
  for (const id of THEME_IDS) {
    it(id, () => {
      const t = PRESETS[id].tokens;
      const got = [
        contrast(t.primary, t.bg), contrast(t.primary, t.surface), contrast(t.onPrimary, t.primary),
        contrast(t.text, t.bg), contrast(t.text, t.surface), contrast(t.muted, t.bg), contrast(t.muted, t.surface),
        contrast(t.accent, t.bg),
      ];
      got.forEach((g, i) => expect(Math.abs(g - TABLE[id]![i]!), `${id} cột ${i}: ${g.toFixed(3)} vs ${TABLE[id]![i]}`).toBeLessThanOrEqual(0.05));
      // AA cho chữ/nút
      got.slice(0, 7).forEach((g) => expect(g).toBeGreaterThanOrEqual(4.5));
    });
  }
});

describe('OKLCH', () => {
  it('khứ hồi hex -> oklch -> hex', () => {
    for (const hx of ['#8A6A3B', '#A3201D', '#D9B77E', '#1C1517', '#FFFFFF', '#000000', '#2D3E5E']) {
      expect(oklchToHex(hexToOklch(hx))).toBe(hx);
    }
  });
  it('màu ngoài gamut được gamut-map (không NaN, hex hợp lệ)', () => {
    const hx = oklchToHex({ l: 0.7, c: 0.4, h: 150 });
    expect(hx).toMatch(/^#[0-9A-F]{6}$/);
    expect(rgbToHex(hexToRgb(hx))).toBe(hx);
  });
});

/** PRNG có seed để test lặp lại được. */
function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

describe('derive: 500 primary ngẫu nhiên luôn đạt >= 4.5:1 (sáng + tối)', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(mode, () => {
      const rnd = mulberry32(mode === 'light' ? 20261007 : 7102026);
      const fails: string[] = [];
      for (let i = 0; i < 500; i++) {
        const P = '#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
        const d = deriveFromPrimary(P, mode);
        const checks: [string, number][] = [
          ['primary/bg', contrast(d.primary, d.bg)], ['primary/surface', contrast(d.primary, d.surface)],
          ['onPrimary/primary', contrast(d.onPrimary, d.primary)], ['text/bg', contrast(d.text, d.bg)],
          ['text/surface', contrast(d.text, d.surface)], ['muted/bg', contrast(d.muted, d.bg)], ['muted/surface', contrast(d.muted, d.surface)],
        ];
        for (const [k, v] of checks) if (v < 4.5) fails.push(`${P} ${k}=${v.toFixed(2)}`);
        expect(d.primaryDecor).toBe(P);
        expect(d.lineStrong).toBe(d.muted);
      }
      expect(fails).toEqual([]);
    });
  }
  it('theme sáng: bg sáng, text tối; theme tối: ngược lại', () => {
    const l = deriveFromPrimary('#8A6A3B', 'light');
    const k = deriveFromPrimary('#8A6A3B', 'dark');
    expect(hexToOklch(l.bg).l).toBeGreaterThan(0.95);
    expect(hexToOklch(l.text).l).toBeLessThan(0.3);
    expect(hexToOklch(k.bg).l).toBeLessThan(0.2);
    expect(hexToOklch(k.text).l).toBeGreaterThan(0.9);
    expect(k.onPrimary).toBe(k.bg);
    expect(l.onPrimary).toBe('#FFFFFF');
  });
  it('accent override được giữ', () => {
    expect(deriveFromPrimary('#123456', 'light', '#ABCDEF').accent).toBe('#ABCDEF');
  });
});
