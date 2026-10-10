/** v4a-2a: nguyên tử theo cấp + chốt chặn (solution-v4a-2a.md 2.3, 2.5, 8.1). */
import { describe, expect, it } from 'vitest';
import { atomFor, degrade, fxSlow } from '@guest/effects/reveal/atoms';
import { graphemeCount, hasLetters, wordCount } from '@guest/effects/reveal/text';
import { groupLines } from '@guest/effects/reveal/mask-lines';
import { WipeQueue } from '@guest/effects/reveal/wipe-queue';
import { pieceStagger, segment } from '@guest/effects/reveal/reveal-split';
import { REVEAL_PACKS } from '@shared/reveal-plan';

const VI = 'Nguyễn Thuỳ Linh · Đặng Hữu Phước · Hường · Quỳnh · Ngọc Ẩn · ẦẪỂỖỮ';

describe('atomFor / degrade - chốt chặn nội dung (design §6 mục 4)', () => {
  it('font script: mask-up / split-* / blur-in (đã hạ) -> wipe', () => {
    for (const a of ['mask-up', 'split-words', 'split-chars'] as const) expect(degrade('heading', a, 'medium', { script: true })).toBe('wipe');
    expect(degrade('heading', 'blur-in', 'medium', { script: true })).toBe('wipe');
    expect(degrade('heading', 'blur-in', 'high', { script: true })).toBe('blur-in');
  });
  it('> 40 grapheme -> split-words; > 20 từ -> fade-up; chuỗi không có chữ -> fade-up', () => {
    expect(degrade('heading', 'split-chars', 'medium', { graphemes: 41, words: 6 })).toBe('split-words');
    expect(degrade('heading', 'split-chars', 'medium', { graphemes: 40, words: 6 })).toBe('split-chars');
    expect(degrade('heading', 'split-words', 'medium', { words: 21 })).toBe('fade-up');
    expect(degrade('heading', 'split-chars', 'medium', { letters: false })).toBe('fade-up');
    expect(degrade('heading', 'split-words', 'medium', { letters: false })).toBe('fade-up');
    expect(degrade('heading', 'mask-up', 'medium', { letters: false })).toBe('fade-up');
  });
  it('máy yếu: split-chars -> split-words; ô album wipe -> photo-settle', () => {
    expect(degrade('heading', 'split-chars', 'medium', { lowEnd: true })).toBe('split-words');
    expect(degrade('image', 'wipe', 'medium', { tile: true, lowEnd: true })).toBe('photo-settle');
    expect(degrade('image', 'wipe', 'medium', { tile: true })).toBe('wipe');
  });
  it('ảnh lồng trong khối có reveal -> photo-settle (giữ wipe/fade); khung rỗng -> fade', () => {
    for (const a of ['zoom-in', 'rise-tilt', 'slide-side', 'fade-up'] as const) expect(degrade('image', a, 'medium', { nested: true })).toBe('photo-settle');
    expect(degrade('image', 'wipe', 'medium', { nested: true })).toBe('wipe');
    expect(degrade('image', 'fade', 'medium', { nested: true })).toBe('fade');
    expect(degrade('image', 'wipe', 'medium', { emptyFrame: true })).toBe('fade');
    expect(degrade('image', 'photo-settle', 'medium', { emptyFrame: true })).toBe('fade');
  });
  it('ảnh không nhận nguyên tử chữ; vai trò khác không nhận parallax-layers', () => {
    expect(degrade('image', 'mask-up', 'high')).toBe('fade-up');
    expect(degrade('image', 'split-chars', 'high')).toBe('fade-up');
    expect(degrade('block', 'parallax-layers', 'high')).toBe('fade-up');
    expect(degrade('image', 'parallax-layers', 'high')).toBe('parallax-layers');
    expect(degrade('image', 'parallax-layers', 'medium')).toBe('photo-settle');
  });
  it('blur-in (R2A-02): Vừa / mobile / phần tử thứ 4 / máy yếu -> mask-up', () => {
    const cine = REVEAL_PACKS.cinematic;
    expect(atomFor('heading', cine, 'medium')).toBe('mask-up');
    expect(atomFor('heading', cine, 'high', { wide: false })).toBe('mask-up');
    expect(atomFor('heading', cine, 'high', { blurUsed: 3 })).toBe('mask-up');
    expect(atomFor('heading', cine, 'high', { blurUsed: 2 })).toBe('blur-in');
    expect(atomFor('heading', cine, 'high', { lowEnd: true })).toBe('mask-up');
  });
  it('cặp cột đối xứng ở Nhiều -> slide-side; Vừa giữ', () => {
    expect(degrade('block', 'fade', 'high', { pairCol: true })).toBe('slide-side');
    expect(degrade('block', 'fade-up', 'high', { pairCol: true })).toBe('slide-side');
    expect(degrade('block', 'zoom-in', 'high', { pairCol: true })).toBe('zoom-in');
    expect(degrade('block', 'fade', 'medium', { pairCol: true })).toBe('fade');
  });
  it('reduced -> fade-fast; Nhẹ -> gentle (hoạ tiết none); Tắt -> none', () => {
    for (const p of Object.values(REVEAL_PACKS)) {
      expect(atomFor('heading', p, 'reduced')).toBe('fade-fast');
      expect(atomFor('heading', p, 'low')).toBe('fade');
      expect(atomFor('image', p, 'low')).toBe('fade');
      expect(atomFor('ornament', p, 'low')).toBe('none');
      expect(atomFor('block', p, 'off')).toBe('none');
    }
  });
  it('4 gói mới ở Vừa (không ngữ cảnh đặc biệt)', () => {
    const at = (s: keyof typeof REVEAL_PACKS) => (['heading', 'block', 'image', 'ornament'] as const).map((r) => atomFor(r, REVEAL_PACKS[s], 'medium'));
    expect(at('editorial')).toEqual(['mask-up', 'fade', 'wipe', 'svg-draw']);
    expect(at('letter')).toEqual(['split-chars', 'fade', 'zoom-in', 'svg-draw']);
    expect(at('playful')).toEqual(['split-words', 'zoom-in', 'rise-tilt', 'svg-draw']);
    expect(at('cinematic')).toEqual(['mask-up', 'fade-up', 'photo-settle', 'svg-draw']);
  });
  it('fxSlow', () => {
    expect(fxSlow(0.5)).toBe(2);
    expect(fxSlow(1)).toBe(1);
    expect(fxSlow(2)).toBe(1);
  });
});

describe('tiếng Việt: đếm + tách grapheme không tách dấu', () => {
  it('graphemeCount: Segmenter = regex, cả đầu vào NFD', () => {
    const seg = new Intl.Segmenter('vi', { granularity: 'grapheme' });
    const bySeg = [...seg.segment(VI.normalize('NFC').replace(/\s+/g, ''))].length;
    expect(graphemeCount(VI)).toBe(bySeg);
    expect(graphemeCount(VI.normalize('NFD'))).toBe(bySeg);
    expect(graphemeCount('ẦẪỂỖỮ')).toBe(5);
    expect(wordCount('  Cô Dâu   & Chú Rể ')).toBe(5);
    expect(hasLetters('· & ·')).toBe(false);
    expect(hasLetters('Hường')).toBe(true);
  });
  it('segment(): ghép lại đúng chuỗi NFC; mỗi mảnh 1 chữ cái gốc (không mảnh nào chỉ là dấu)', () => {
    for (const input of [VI, VI.normalize('NFD')]) {
      for (const useSeg of [true, false]) {
        const parts = segment(input, 'chars', useSeg);
        expect(parts.map((w) => w.join('')).join(' ')).toBe(VI.normalize('NFC').split(/\s+/).join(' '));
        for (const g of parts.flat()) expect(g, JSON.stringify(g)).toMatch(/^\P{M}\p{M}*$/u);
      }
      expect(segment(input, 'chars', true)).toEqual(segment(input, 'chars', false));
    }
    expect(segment('Hai bên  gia đình', 'words')).toEqual([['Hai'], ['bên'], ['gia'], ['đình']]);
  });
  it('pieceStagger: tổng ≤ 900ms', () => {
    expect(pieceStagger('chars', 11)).toBe(28);
    expect(pieceStagger('chars', 40) * 39 + 450).toBeLessThanOrEqual(900);
    expect(pieceStagger('words', 20) * 19 + 500).toBeLessThanOrEqual(900);
    expect(pieceStagger('words', 1)).toBe(40);
  });
});

describe('groupLines + WipeQueue', () => {
  it('groupLines: lệch ≤ 2px cùng dòng', () => {
    expect(groupLines([10, 10, 11.5, 48, 49, 90])).toEqual([0, 0, 0, 1, 1, 2]);
    expect(groupLines([])).toEqual([]);
  });
  it('WipeQueue: trần 3 / 2; release chạy người chờ; chờ > 600ms -> expired', () => {
    let t = 0;
    const q = new WipeQueue<string>(3, 600, () => t);
    expect(['a', 'b', 'c', 'd', 'e'].map((x) => q.request(x))).toEqual(['run', 'run', 'run', 'wait', 'wait']);
    t = 300;
    expect(q.release('a')).toEqual(['d']);
    t = 700;
    expect(q.release('b')).toEqual([]); // e chờ 700ms > 600 -> không chạy
    expect(q.expired()).toEqual(['e']);
    expect(q.expired()).toEqual([]);
    const lo = new WipeQueue<string>(2, 600, () => 0);
    expect(['a', 'b', 'c'].map((x) => lo.request(x))).toEqual(['run', 'run', 'wait']);
  });
});

describe('estimateSectionMs - nhịp section (R2A-08, design 3.8)', () => {
  // section mẫu: head 3 (eyebrow i0, h2 i1, hoạ tiết i2) + 4 khối (i 0..3) + 2 ảnh + 9 ô album (i 0..8)
  const sample = (pack: keyof typeof REVEAL_PACKS, state: 'medium' | 'high') => {
    const p = REVEAL_PACKS[pack];
    const at = (r: 'heading' | 'block' | 'image' | 'ornament', c = {}) => atomFor(r, p, state, c);
    const head = at('heading');
    const n = head === 'split-chars' ? 14 : head === 'split-words' ? 4 : 2;
    return [
      { atom: at('block'), i: 0 }, { atom: head, i: 1, n }, { atom: at('ornament'), i: 2 },
      ...[0, 1, 2, 3].map((i) => ({ atom: at('block'), i })),
      { atom: at('image', { nested: true }), i: 0 }, { atom: at('image'), i: 1 },
      ...Array.from({ length: 9 }, (_, i) => ({ atom: at('image', { tile: true }), i, tile: true })),
    ];
  };
  it('≤ 1800ms mỗi gói ở Vừa; cinematic ≤ 2200ms (cả Nhiều)', async () => {
    const { estimateSectionMs } = await import('@guest/effects/reveal/fx-preview');
    for (const pack of Object.keys(REVEAL_PACKS) as (keyof typeof REVEAL_PACKS)[]) {
      const ms = estimateSectionMs(sample(pack, 'medium'), REVEAL_PACKS[pack].stagger, pack);
      expect(ms, pack).toBeLessThanOrEqual(pack === 'cinematic' ? 2200 : 1800);
    }
    expect(estimateSectionMs(sample('cinematic', 'high'), 120, 'cinematic', true)).toBeLessThanOrEqual(2200);
  });
});
