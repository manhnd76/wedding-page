/** v4a-2a B1: revealPlan / revealHarmony / roleAtom / sectionStagger (solution-v4a-2a.md 8.1, design-v4a-2a 2.3-2.4). */
import { describe, expect, it } from 'vitest';
import { REVEAL_STYLES, type RevealStyle, type SectionType } from '@shared/config/enums';
import { REVEAL_AFFINITY, REVEAL_PACKS, REVEAL_TIER, revealHarmony, revealPlan, type PlanEntry } from '@shared/reveal-plan';
import { roleAtom, sectionStagger } from '@shared/reveal-role';
import { PRESETS } from '@shared/theme/presets';

const ALL = [...REVEAL_STYLES] as string[];
const DEFAULT_ORDER: SectionType[] = ['hero', 'couple', 'families', 'announcement', 'events', 'countdown', 'timeline', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer'];
const secs = (types: SectionType[]) => types.map((t) => ({ id: t, type: t }));
const plan = (main: RevealStyle, types = DEFAULT_ORDER, o: { mode?: 'auto' | 'uniform'; pins?: Record<string, RevealStyle>; supported?: string[] } = {}) =>
  revealPlan(secs(types), { main, mode: o.mode ?? 'auto', pins: o.pins ?? {}, harmony: revealHarmony(main, o.supported ?? ALL) });
const packs = (p: Record<string, PlanEntry>) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.pack]));

describe('revealPlan - bảng ví dụ design 2.4 (thứ tự mặc định, loveStory tắt)', () => {
  const table: Record<string, [string, Record<string, RevealStyle>]> = {
    'tram-vang': ['soft', { couple: 'letter', families: 'editorial', announcement: 'letter', album: 'editorial', thankyou: 'letter' }],
    'dem-nhung': ['cinematic', { couple: 'letter', families: 'editorial', announcement: 'letter', album: 'editorial', thankyou: 'cinematic' }],
    'dat-nung': ['playful', { couple: 'letter', families: 'soft', announcement: 'letter', album: 'playful', thankyou: 'letter' }],
    'sen-cham': ['gentle', { couple: 'editorial', families: 'soft', announcement: 'editorial', album: 'soft', thankyou: 'editorial' }],
  };
  for (const [theme, [main, expressive]] of Object.entries(table)) {
    it(`${theme} (A = ${main})`, () => {
      expect(PRESETS[theme as keyof typeof PRESETS].suggest.revealStyle).toBe(main);
      const p = plan(main as RevealStyle);
      for (const t of DEFAULT_ORDER) {
        const want = expressive[t] ?? main;
        expect(p[t]!.pack, t).toBe(want);
        expect(p[t]!.src, t).toBe(REVEAL_TIER[t] === 'expressive' ? 'auto' : 'main');
      }
    });
  }
  it('Đất Nung + loveStory bật', () => {
    const order: SectionType[] = ['hero', 'couple', 'families', 'announcement', 'events', 'countdown', 'timeline', 'loveStory', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer'];
    expect(packs(plan('playful', order))).toMatchObject({ couple: 'letter', families: 'soft', announcement: 'letter', loveStory: 'playful', album: 'soft', thankyou: 'letter' });
  });
});

/** PRNG tất định (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('revealPlan - property: không có 2 phần expressive liền kề cùng gói', () => {
  const MID = DEFAULT_ORDER.filter((t) => t !== 'hero' && t !== 'footer').concat('loveStory');
  it('200 hoán vị × 6 gói chính (seed cố định)', () => {
    const r = rng(20261010);
    for (let n = 0; n < 200; n++) {
      const mid = [...MID];
      for (let i = mid.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [mid[i], mid[j]] = [mid[j]!, mid[i]!]; }
      const order: SectionType[] = ['hero', ...mid.filter(() => r() > 0.25), 'footer'];
      for (const main of REVEAL_STYLES) {
        const p = plan(main, order);
        const expr = order.filter((t) => REVEAL_TIER[t] === 'expressive').map((t) => p[t]!.pack);
        for (let i = 1; i < expr.length; i++) expect(expr[i], `${main} ${order.join(',')}`).not.toBe(expr[i - 1]);
        for (const t of order) if (REVEAL_TIER[t] !== 'expressive') expect(p[t]!.pack).toBe(main);
      }
    }
  });
});

describe('revealPlan - ghim, uniform, hài hoà', () => {
  it('ghim thắng auto; ghim bằng A giữ A; ghim tính vào "gói trước"', () => {
    const p = plan('soft', DEFAULT_ORDER, { pins: { couple: 'editorial', families: 'soft' } });
    expect(p.couple).toEqual({ pack: 'editorial', src: 'pinned' });
    expect(p.families).toEqual({ pack: 'soft', src: 'pinned' });
    // announcement: editorial ≠ prev (soft) -> editorial
    expect(p.announcement).toEqual({ pack: 'editorial', src: 'auto' });
  });
  it('uniform -> mọi phần chưa ghim = A', () => {
    const p = plan('letter', DEFAULT_ORDER, { mode: 'uniform', pins: { album: 'playful' } });
    for (const t of DEFAULT_ORDER) expect(p[t]!.pack).toBe(t === 'album' ? 'playful' : 'letter');
    expect(p.couple!.src).toBe('main');
  });
  it('hero và functional luôn A (kể cả auto)', () => {
    const p = plan('cinematic');
    for (const t of ['hero', 'events', 'countdown', 'timeline', 'gift', 'guestbook', 'rsvp', 'footer']) expect(p[t]).toEqual({ pack: 'cinematic', src: 'main' });
  });
  it('revealHarmony lọc đồng hành chưa hỗ trợ; chỉ còn A -> mọi phần = A, không lỗi', () => {
    expect(revealHarmony('soft', ['soft', 'gentle'])).toEqual(['soft']);
    expect(revealHarmony('soft', ALL)).toEqual(['soft', 'editorial', 'letter']);
    const p = plan('soft', DEFAULT_ORDER, { supported: ['soft', 'gentle'] });
    for (const t of DEFAULT_ORDER) expect(p[t]!.pack).toBe('soft');
  });
  it('AFFINITY đủ 6 gói cho đúng 6 section expressive', () => {
    const expr = Object.entries(REVEAL_TIER).filter(([, v]) => v === 'expressive').map(([k]) => k).sort();
    expect(Object.keys(REVEAL_AFFINITY).sort()).toEqual(expr);
    for (const list of Object.values(REVEAL_AFFINITY)) expect([...list!].sort()).toEqual([...ALL].sort());
  });
});

describe('roleAtom - 4 bậc ưu tiên + sectionStagger', () => {
  const none = { heading: null, block: null, image: null, ornament: null } as const;
  it('1. ghim: trọn gói cả 4 vai trò, kể cả khi có ghi đè', () => {
    const e: PlanEntry = { pack: 'playful', src: 'pinned' };
    const ov = { ...none, heading: 'wipe' as const, block: 'fade' as const };
    expect(roleAtom(e, 'heading', 'soft', ov)).toEqual({ atom: 'split-words', from: 'playful' });
    expect(roleAtom(e, 'block', 'soft', ov)).toEqual({ atom: 'zoom-in', from: 'playful' });
    expect(sectionStagger(e, 'soft')).toBe(REVEAL_PACKS.playful.stagger);
  });
  it('2. ghi đè vai trò (không ghim) thắng auto/A', () => {
    const e: PlanEntry = { pack: 'letter', src: 'auto' };
    expect(roleAtom(e, 'heading', 'soft', { ...none, heading: 'wipe' })).toEqual({ atom: 'wipe', from: 'override' });
    expect(sectionStagger(e, 'soft')).toBe(REVEAL_PACKS.soft.stagger);
  });
  it('3. auto chỉ đổi heading + image; 4. block/ornament theo A', () => {
    const e: PlanEntry = { pack: 'editorial', src: 'auto' };
    expect(roleAtom(e, 'heading', 'soft', none)).toEqual({ atom: 'mask-up', from: 'editorial' });
    expect(roleAtom(e, 'image', 'soft', none)).toEqual({ atom: 'wipe', from: 'editorial' });
    expect(roleAtom(e, 'block', 'soft', none)).toEqual({ atom: 'fade-up', from: 'soft' });
    expect(roleAtom(e, 'ornament', 'soft', none)).toEqual({ atom: 'svg-draw', from: 'soft' });
    expect(roleAtom(undefined, 'heading', 'gentle', none)).toEqual({ atom: 'fade', from: 'gentle' });
  });
});
