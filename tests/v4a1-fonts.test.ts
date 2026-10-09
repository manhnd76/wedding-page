/**
 * v4a-1 (solution.md Rev 5 mục 10.3, 10.8 #3): 28 family có đủ file woff2 (vietnamese + latin) và ngân sách font
 * ban đầu (màn cover trước khi chạm) ≤ 180 000 byte cho cả 12 theme.
 */
import { statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAPABILITIES } from '@shared/capabilities';
import { THEME_IDS } from '@shared/config/enums';
import { FONT_REGISTRY, FONT_SUBSETS, type FontFaceSpec } from '@shared/fonts/registry';
import { PRESETS } from '@shared/theme/presets';
import { fontFiles } from '../scripts/vite-plugins/inject-config-og';

const ROOT = path.resolve(__dirname, '..');
const BUDGET = 180_000;

describe('28 family @fontsource: đủ faces × {vietnamese, latin}', () => {
  it('capability font = 28 family của registry', () => {
    expect([...CAPABILITIES.font.supported].sort()).toEqual(Object.keys(FONT_REGISTRY).sort());
  });
  for (const id of CAPABILITIES.font.supported) {
    it(id, () => {
      const meta = FONT_REGISTRY[id];
      const files = fontFiles(ROOT, id, meta.role);
      expect(files, `thiếu @fontsource/${meta.pkg}`).not.toBeNull();
      expect(files).toHaveLength(meta.faces.length * FONT_SUBSETS.length);
      for (const s of FONT_SUBSETS) expect(files!.filter((f) => f.subset === s)).toHaveLength(meta.faces.length);
      for (const f of files!) expect(statSync(f.abs).size).toBeGreaterThan(0);
    });
  }
});

/** Quy tắc khớp font CSS rút gọn: cùng style nếu có (không thì thường), weight gần nhất. */
function nearest(faces: FontFaceSpec[], want: FontFaceSpec): FontFaceSpec {
  const same = faces.filter((f) => f.style === want.style);
  const pool = same.length ? same : faces.filter((f) => f.style === 'normal');
  return [...pool].sort((a, b) => Math.abs(a.weight - want.weight) - Math.abs(b.weight - want.weight))[0]!;
}
/**
 * Face vẽ trên cover: heading {500 thường, 400 nghiêng} + script {400} + body {600, 400}.
 * Mục 10.3 chỉ ghi body 600; đo thật trên build (e2e T6) cover còn tải body 400 (đúng "8 file" của v1) nên tính cả
 * body 400 (chặt hơn). Cận trên: mỗi face tính đủ latin + vietnamese (trình duyệt chỉ tải subset cần vẽ).
 */
const COVER: Record<'heading' | 'script' | 'body', FontFaceSpec[]> = {
  heading: [{ weight: 500, style: 'normal' }, { weight: 400, style: 'italic' }],
  script: [{ weight: 400, style: 'normal' }],
  body: [{ weight: 600, style: 'normal' }, { weight: 400, style: 'normal' }],
};

function coverFontBytes(id: (typeof THEME_IDS)[number]): number {
  let total = 0;
  for (const role of ['heading', 'script', 'body'] as const) {
    const fid = PRESETS[id].fonts[role];
    const files = fontFiles(ROOT, fid, role)!;
    const picked = new Set(COVER[role].map((w) => nearest(FONT_REGISTRY[fid].faces, w)));
    for (const f of files) if ([...picked].some((p) => p.weight === f.weight && p.style === f.style)) total += statSync(f.abs).size;
  }
  return total;
}

describe(`font cover ≤ ${BUDGET} byte (12 theme)`, () => {
  it('2 theme nặng nhất (e2e T6 đo thật): Trầm Vàng + Hoa Lá Màu Nước', () => {
    const top = [...THEME_IDS].sort((a, b) => coverFontBytes(b) - coverFontBytes(a)).slice(0, 2);
    expect(top).toEqual(['tram-vang', 'mau-nuoc']);
  });
  for (const id of THEME_IDS) {
    it(id, () => {
      const bytes = coverFontBytes(id);
      expect(bytes, `${id}: ${(bytes / 1000).toFixed(1)} KB`).toBeLessThanOrEqual(BUDGET);
    });
  }
});
