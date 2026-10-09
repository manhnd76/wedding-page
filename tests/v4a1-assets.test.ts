/** v4a-1 (solution.md Rev 5 mục 10.4, 10.8 #3): asset theme trong src/guest/theme-assets đúng quy ước + an toàn. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { MOTIF_SETS, ORNAMENT_SETS, TEXTURES } from '@shared/config/enums';
import { DIVIDER_SPRITES, MOTIF_PIECES } from '@shared/theme/parts';

const DIR = path.resolve(__dirname, '..', 'src', 'guest', 'theme-assets');
const read = (rel: string) => readFileSync(path.join(DIR, rel), 'utf8');
const KB = 1024;
const SYMBOLS = ['divider', 'title', 'corner', 'amp', 'monogram', 'gift'];

function allSvgs(dir = DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? allSvgs(p) : e.name.endsWith('.svg') ? [p] : [];
  });
}

describe('ornament sprite (11 bộ)', () => {
  for (const set of ORNAMENT_SETS) {
    it(`${set}: đủ 6 symbol, có pathLength, ≤ 12 KB`, () => {
      const s = read(`ornaments/${set}.svg`);
      for (const id of [...SYMBOLS, ...(set === 'traditional' ? ['songhy', 'cloud'] : [])]) expect(s, `#${id}`).toContain(`<symbol id="${id}"`);
      expect(s).toContain('pathLength');
      expect(statSync(path.join(DIR, 'ornaments', `${set}.svg`)).size).toBeLessThanOrEqual(12 * KB);
    });
  }
  it('watercolor: vệt .wash dùng thuộc tính opacity (không fill-opacity) để reveal điều khiển được', () => {
    const s = read('ornaments/watercolor.svg');
    const wash = s.match(/<path\b[^>]*class="wash"[^>]*>/g) ?? [];
    expect(wash.length).toBeGreaterThan(0);
    for (const w of wash) { expect(w).toMatch(/ opacity="/); expect(w).not.toContain('fill-opacity'); }
  });
});

describe('divider sprite riêng (8 file)', () => {
  for (const id of DIVIDER_SPRITES) {
    it(`${id}: đúng 1 id="divider", ≤ 2.5 KB`, () => {
      const s = read(`dividers/${id}.svg`);
      expect(s.match(/id="divider"/g)).toHaveLength(1);
      expect(statSync(path.join(DIR, 'dividers', `${id}.svg`)).size).toBeLessThanOrEqual(2.5 * KB);
    });
  }
  it('torn-paper là mask CSS (không phải sprite)', () => {
    expect(existsSync(path.join(DIR, 'dividers', 'torn-paper.svg'))).toBe(true);
    expect((DIVIDER_SPRITES as readonly string[]).includes('torn-paper')).toBe(false);
  });
});

describe('hoạ tiết nền B2 (7 bộ)', () => {
  for (const set of MOTIF_SETS) {
    it(`${set}: đủ mảnh theo MOTIF_PIECES, ≤ 15 KB/bộ chưa nén`, () => {
      let total = 0;
      for (const piece of MOTIF_PIECES[set]) {
        const f = path.join(DIR, 'motifs', set, `${piece}.svg`);
        expect(existsSync(f), `${set}/${piece}`).toBe(true);
        total += statSync(f).size;
      }
      expect(total).toBeLessThanOrEqual(15 * KB);
    });
  }
  it('dong-son không có corner (góc = 1/4 medallion)', () => {
    expect(MOTIF_PIECES['dong-son']).not.toContain('corner');
    expect(existsSync(path.join(DIR, 'motifs', 'dong-son', 'corner.svg'))).toBe(false);
  });
});

describe('texture tile', () => {
  for (const t of TEXTURES.filter((x) => !['paper', 'velvet', 'none'].includes(x))) {
    it(`${t}: ≤ 4 KB gzip`, () => {
      expect(gzipSync(readFileSync(path.join(DIR, 'textures', `${t}.svg`))).length).toBeLessThanOrEqual(4 * KB);
    });
  }
  it('wash-mask khung ảnh tồn tại', () => expect(existsSync(path.join(DIR, 'frames', 'wash-mask.svg'))).toBe(true));
});

describe('mọi SVG an toàn + có viewBox', () => {
  const files = allSvgs();
  it('có đủ file', () => expect(files.length).toBeGreaterThanOrEqual(55));
  for (const f of files) {
    it(path.relative(DIR, f), () => {
      const s = readFileSync(f, 'utf8');
      expect(s).toContain('viewBox');
      expect(s).not.toMatch(/<script/i);
      expect(s).not.toMatch(/\son[a-z]+\s*=/i);
      expect(s).not.toMatch(/<foreignObject/i);
      expect(s).not.toMatch(/href="https?:/i);
    });
  }
});
