/**
 * v4a-1 (solution.md Rev 5 mục 10.8 #2): 12 preset với capabilities, hoạ tiết nền (bảng 10.1), `motifCap` (bảng 1.7.5 ±.01
 * + 300 bộ màu ngẫu nhiên), `--motif-cap`, nhóm `motif` trong Q17 (ops), `planMotif` (luật 1.7.3).
 */
import { describe, expect, it } from 'vitest';
import { mergeWithDefaults } from '@shared/config/merge';
import { THEME_IDS, type MotifPlacement, type ThemeId } from '@shared/config/enums';
import type { WeddingConfig } from '@shared/config/types';
import { CAPABILITIES } from '@shared/capabilities';
import { PRESETS } from '@shared/theme/presets';
import { resolveTheme, themeCssVars } from '@shared/theme/resolve';
import { motifCap } from '@shared/theme/motif-cap';
import { hexToRgb } from '@shared/theme/oklch';
import { fontStack } from '@shared/fonts/registry';
import { planSections } from '@shared/sections/meta';
import { planMotif } from '@shared/motif/plan';
import { changeTheme, customizedGroups, resetGroup } from '../src/admin/draft/ops';

const cfg = (o: Record<string, unknown> = {}) => mergeWithDefaults(o).config;

/** Bảng 1.7.5 design (script WCAG 2026-10-09). */
const CAP: Record<ThemeId, number> = {
  'tram-vang': 0.05, 'hong-phan': 0.34, 'luc-bao': 0.27, 'son-do': 0.6, 'muc-giay': 0.28, 'hoai-co': 0.35,
  'sen-cham': 0.54, 'mau-nuoc': 0.39, 'dat-nung': 0.29, 'pastel-han': 0.63, 'dem-nhung': 0.33, 'bien-dao': 0.41,
};
/** Bảng 10.1 solution. */
const MOTIF: Record<ThemeId, [string, MotifPlacement[], string, string[]]> = {
  'son-do': ['dong-son', ['title', 'band'], 'light', ['may-cat-tuong', 'chu-hy']],
  'sen-cham': ['hoa-sen', ['title', 'corners'], 'light', ['song-nuoc', 'dong-son']],
  'dem-nhung': ['art-deco', ['corners', 'band'], 'medium', []],
  'bien-dao': ['song-nuoc', ['band'], 'medium', []],
  'tram-vang': ['none', ['band'], 'medium', ['la-canh']],
  'hong-phan': ['none', ['band'], 'medium', ['la-canh']],
  'mau-nuoc': ['none', ['band'], 'medium', ['la-canh']],
  'dat-nung': ['none', ['band'], 'medium', ['la-canh']],
  'pastel-han': ['none', ['band'], 'medium', ['la-canh']],
  'luc-bao': ['none', ['band'], 'medium', ['la-canh', 'art-deco']],
  'muc-giay': ['none', ['band'], 'medium', ['art-deco']],
  'hoai-co': ['none', ['band'], 'medium', ['art-deco', 'la-canh']],
};

describe('12 preset bật đủ (capabilities v4a-1)', () => {
  it('capabilities đủ 12 theme / 11 ornament / 10 texture / 11 khung / 12 divider / 28 font / 8 motif', () => {
    expect(CAPABILITIES.theme.supported).toHaveLength(12);
    expect(CAPABILITIES.ornamentSet.supported).toHaveLength(11);
    expect(CAPABILITIES.texture.supported).toHaveLength(10);
    expect(CAPABILITIES.photoFrame.supported).toHaveLength(11);
    expect(CAPABILITIES.divider.supported).toHaveLength(12);
    expect(CAPABILITIES.font.supported).toHaveLength(28);
    expect([...CAPABILITIES.motifSet.supported].sort()).toEqual(['art-deco', 'chu-hy', 'dong-son', 'hoa-sen', 'la-canh', 'may-cat-tuong', 'none', 'song-nuoc']);
    expect(CAPABILITIES.motifSet.fallback).toBe('none');
  });
  for (const id of THEME_IDS) {
    it(`${id}: giữ đúng gói (ornament/texture/khung/divider/font/hoạ tiết), không cảnh báo`, () => {
      const p = PRESETS[id];
      const r = resolveTheme(cfg({ theme: { preset: id } }));
      expect(r.preset).toBe(id);
      expect({ o: r.ornamentSet, t: r.texture, f: r.photoFrame, d: r.divider }).toEqual({ o: p.ornamentSet, t: p.texture, f: p.photoFrame, d: p.divider });
      expect(r.fonts).toEqual(p.fonts);
      // kiểu mở/hạt/reveal gợi ý chưa có là việc của 2a/2b/2c: fallback im lặng -> không có cảnh báo nào
      expect(r.warnings).toEqual([]);
      const [set, pl, intensity, suggest] = MOTIF[id];
      expect(p.motif).toEqual({ set, placements: pl, intensity });
      expect(p.motifSuggest).toEqual(suggest);
      expect(r.motif).toMatchObject({ set, placements: set === 'none' ? [] : pl, intensity, motion: 'auto' });
    });
  }
});

describe('motifCap (design 1.7.5)', () => {
  for (const id of THEME_IDS) {
    it(`${id}: cap ${CAP[id]} ±.01 (cả resolve)`, () => {
      expect(Math.abs(motifCap(PRESETS[id].tokens) - CAP[id])).toBeLessThanOrEqual(0.01);
      expect(Math.abs(resolveTheme(cfg({ theme: { preset: id } })).motif.cap - CAP[id])).toBeLessThanOrEqual(0.01);
    });
  }

  // kiểm độc lập: trộn sRGB gamma tuyến tính, contrast WCAG
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (rgb: number[]) => 0.2126 * lin(rgb[0]!) + 0.7152 * lin(rgb[1]!) + 0.0722 * lin(rgb[2]!);
  const minContrastAt = (t: ReturnType<typeof resolveTheme>['tokens'], a: number) => {
    const acc = hexToRgb(t.accent);
    let min = Infinity;
    for (const b of [t.bg, t.surface]) {
      const base = hexToRgb(b);
      const m = base.map((c, i) => c + (acc[i]! - c) * a);
      const lm = lum(m);
      for (const ink of [t.text, t.muted, t.primary]) {
        const li = lum(hexToRgb(ink));
        min = Math.min(min, (Math.max(li, lm) + 0.05) / (Math.min(li, lm) + 0.05));
      }
    }
    return min;
  };
  /** mulberry32 - seed cố định */
  const rng = (seed: number) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hex = (r: () => number) => `#${Array.from({ length: 3 }, () => Math.floor(r() * 256).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

  it('300 bộ primaryColor / overrides.accent ngẫu nhiên (sáng + tối): tại cap mọi cặp ≥ 4.5, tại cap + .01 có cặp < 4.5', () => {
    const r = rng(20261009);
    let checked = 0;
    for (let i = 0; i < 300; i++) {
      const preset = i % 2 ? 'dem-nhung' : THEME_IDS[i % THEME_IDS.length]!;
      const theme: Record<string, unknown> = { preset };
      if (i % 3 !== 0) theme.primaryColor = hex(r);
      if (i % 3 !== 1) theme.overrides = { accent: hex(r) };
      const res = resolveTheme(cfg({ theme }));
      const cap = res.motif.cap;
      expect(cap).toBeGreaterThanOrEqual(0);
      expect(cap).toBeLessThanOrEqual(1);
      if (minContrastAt(res.tokens, 0) < 4.5) { expect(cap).toBe(0); continue; }
      for (let a = 0; a <= cap + 1e-9; a += 0.01) expect(minContrastAt(res.tokens, a), `${JSON.stringify(theme)} α=${a.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      if (cap < 1) expect(minContrastAt(res.tokens, cap + 0.01), JSON.stringify(theme)).toBeLessThan(4.5);
      checked++;
    }
    expect(checked).toBeGreaterThan(200);
  });

  it('--motif-cap có trong themeCssVars', () => {
    const res = resolveTheme(cfg({ theme: { preset: 'son-do' } }));
    const v = themeCssVars(res, { heading: fontStack('noto-serif-display'), script: fontStack('charm'), body: fontStack('be-vietnam-pro') });
    expect(v['--motif-cap']).toBe('0.6');
  });
});

describe('resolve theme.motif (config thắng preset, capability motifSet)', () => {
  it('Tự chọn trên theme tắt -> dùng vị trí/độ đậm của preset (band + medium, Còn mở #11)', () => {
    const r = resolveTheme(cfg({ theme: { preset: 'tram-vang', motif: { set: 'la-canh' } } }));
    expect(r.motif).toMatchObject({ set: 'la-canh', placements: ['band'], intensity: 'medium', cap: 0.05 });
  });
  it('set none -> placements rỗng; motion lấy thẳng config', () => {
    const r = resolveTheme(cfg({ theme: { preset: 'son-do', motif: { set: 'none', motion: 'off' } } }));
    expect(r.motif).toMatchObject({ set: 'none', placements: [], motion: 'off' });
  });
  it('vị trí + độ đậm tự chọn', () => {
    const r = resolveTheme(cfg({ theme: { preset: 'sen-cham', motif: { placements: ['pattern', 'band'], intensity: 'strong' } } }));
    expect(r.motif).toMatchObject({ set: 'hoa-sen', placements: ['pattern', 'band'], intensity: 'strong' });
  });
});

describe('Q17: nhóm "Hoạ tiết nền" (admin/draft/ops)', () => {
  const custom = (): WeddingConfig => {
    const c = cfg({ theme: { preset: 'son-do' } });
    c.theme.motif = { set: 'may-cat-tuong', placements: ['corners'], intensity: 'strong', motion: 'off' };
    return c;
  };
  it('customizedGroups: chỉ khi set/placements/intensity khác "theme"; motion không tính', () => {
    const c = cfg();
    expect(customizedGroups(c)).not.toContain('motif');
    c.theme.motif.motion = 'off';
    expect(customizedGroups(c)).not.toContain('motif');
    expect(customizedGroups(custom())).toContain('motif');
    const only = cfg();
    only.theme.motif.intensity = 'light';
    expect(customizedGroups(only)).toContain('motif');
  });
  it('resetGroup("motif") -> 3 field về "theme", giữ motion', () => {
    const n = resetGroup(custom(), 'motif');
    expect(n.theme.motif).toEqual({ set: 'theme', placements: 'theme', intensity: 'theme', motion: 'off' });
  });
  it('changeTheme: keep giữ phần đã chỉnh; full về theo theme, không đụng motion', () => {
    const keep = changeTheme(custom(), 'sen-cham', 'keep');
    expect(keep.theme.preset).toBe('sen-cham');
    expect(keep.theme.motif.set).toBe('may-cat-tuong');
    expect(resolveTheme(keep).motif.set).toBe('may-cat-tuong');
    const full = changeTheme(custom(), 'sen-cham', 'full');
    expect(full.theme.motif).toEqual({ set: 'theme', placements: 'theme', intensity: 'theme', motion: 'off' });
    expect(resolveTheme(full).motif.set).toBe('hoa-sen');
  });
});

describe('planMotif (design 1.7.3)', () => {
  const sample = (patch: (c: WeddingConfig) => void = () => {}) => {
    const c = cfg({ theme: { preset: 'son-do' } });
    c.content.couple.groom.fullName = 'Nguyễn Minh Anh';
    c.content.families.groom.father = 'Ông A';
    c.content.album.images = [{ src: 'a.webp', w: 10, h: 10, alt: '' }];
    c.integrations.appsScriptUrl = 'https://script.google.com/x';
    c.content.thankyou.message = 'Cảm ơn';
    patch(c);
    return { c, plan: planSections(c, 'cloud') };
  };
  const byType = (slots: ReturnType<typeof planMotif>) => Object.fromEntries(slots.map((s) => [s.type, s.placements]));

  it('title: section có tiêu đề, trừ Album/RSVP/Lời chúc; không ở hero/thankyou/footer', () => {
    const { c, plan } = sample();
    const m = byType(planMotif(plan, c, ['title']));
    for (const t of ['album', 'rsvp', 'guestbook', 'hero', 'thankyou', 'footer']) expect(m[t], t).toBeUndefined();
    for (const t of ['couple', 'families', 'announcement', 'events']) expect(m[t], t).toEqual(['title']);
  });
  it('title bỏ section có tiêu đề rỗng', () => {
    const { c, plan } = sample((x) => { x.content.couple.heading = ' '; });
    expect(byType(planMotif(plan, c, ['title'])).couple).toBeUndefined();
  });
  it('band: chỉ section tone-surface + footer (kể cả RSVP/Lời chúc)', () => {
    const { c, plan } = sample();
    const slots = planMotif(plan, c, ['band']);
    const tone = Object.fromEntries(plan.map((p) => [p.item.id, p.tone]));
    for (const s of slots) expect(tone[s.sectionId] === 'surface' || s.type === 'footer', s.type).toBe(true);
    expect(slots.some((s) => s.type === 'footer')).toBe(true);
    expect(slots.map((s) => s.type)).not.toContain('album');
  });
  it('hero: chỉ Hero/Cảm ơn không ảnh; có ảnh -> bỏ cả section', () => {
    const { c, plan } = sample();
    expect(planMotif(plan, c, ['hero']).map((s) => s.type).sort()).toEqual(['hero', 'thankyou']);
    const withImg = sample((x) => { x.content.hero.image = { src: 'h.webp', w: 1, h: 1, alt: '' }; });
    const slots = planMotif(withImg.plan, withImg.c, ['hero', 'corners']);
    expect(slots.map((s) => s.type)).not.toContain('hero');
    expect(slots.find((s) => s.type === 'thankyou')?.placements).toEqual(['hero', 'corners']);
  });
  it('corners/pattern: mọi section trừ loại trừ (Album, RSVP, Lời chúc, Hero/Cảm ơn có ảnh)', () => {
    const { c, plan } = sample();
    const types = planMotif(plan, c, ['corners']).map((s) => s.type);
    for (const t of ['album', 'rsvp', 'guestbook']) expect(types).not.toContain(t);
    expect(types).toEqual(expect.arrayContaining(['hero', 'couple', 'thankyou', 'footer']));
  });
  it('không vị trí -> rỗng', () => {
    const { c, plan } = sample();
    expect(planMotif(plan, c, [])).toEqual([]);
  });
});
