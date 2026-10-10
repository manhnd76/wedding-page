import { describe, expect, it } from 'vitest';
import { mergeWithDefaults } from '@shared/config/merge';
import { resolveTheme, REVEAL_PACKS, themeCssVars } from '@shared/theme/resolve';
import { PRESETS } from '@shared/theme/presets';
import { FONT_PRESET_MAP, fontStack } from '@shared/fonts/registry';
import { CAPABILITIES, isSupported, type CapabilityKey } from '@shared/capabilities';
import {
  BURSTS_ON_OPEN, DIVIDERS, HEADING_FONTS, OPEN_STYLES, ORNAMENT_SETS, PARTICLE_TYPES, PHOTO_FRAMES, REVEAL_ATOMS, REVEAL_STYLES, TEXTURES, THEME_IDS,
} from '@shared/config/enums';
import { MOTIF_SETS } from '@shared/config/enums';

const cfg = (o: Record<string, unknown> = {}) => mergeWithDefaults(o).config;
const raw = (o: Record<string, unknown> = {}) => resolveTheme(cfg(o), { applyCapabilities: false });

describe('resolveTheme - mặc định', () => {
  it('Trầm Vàng + envelope + petals + soft + font Cổ điển', () => {
    const r = resolveTheme(cfg());
    expect(r).toMatchObject({
      preset: 'tram-vang', mode: 'light', openStyle: 'envelope', burstOnOpen: 'petals',
      fonts: { heading: 'playfair-display', script: 'great-vibes', body: 'be-vietnam-pro' },
      ornamentSet: 'classic-line', texture: 'paper', photoFrame: 'arch', divider: 'ornament',
      particles: { types: ['petal-rose'], color: 'theme', densityFactor: 1 },
      reveal: { style: 'soft', heading: 'fade-up', block: 'fade-up', image: 'photo-settle', ornament: 'svg-draw', stagger: 80 },
    });
    expect(r.tokens.primary).toBe('#8A6A3B');
    expect(r.tokens.lineStrong).toBe(r.tokens.muted);
    expect(r.warnings).toEqual([]);
  });
});

describe('quy tắc "theme" cho mọi nhóm (solution 5.2) - không áp capabilities', () => {
  for (const id of Object.keys(PRESETS) as (keyof typeof PRESETS)[]) {
    it(`mọi field "theme" theo gói ${id}`, () => {
      const p = PRESETS[id];
      const r = raw({ theme: { preset: id } });
      expect(r.mode).toBe(p.mode);
      expect(r.tokens).toMatchObject({ primary: p.tokens.primary, bg: p.tokens.bg, text: p.tokens.text, muted: p.tokens.muted, accent: p.tokens.accent });
      expect(r.fonts).toEqual(p.fonts);
      expect([r.ornamentSet, r.texture, r.photoFrame, r.divider]).toEqual([p.ornamentSet, p.texture, p.photoFrame, p.divider]);
      expect(r.openStyle).toBe(p.suggest.openStyle);
      expect(r.burstOnOpen).toBe(p.suggest.burstOnOpen);
      expect(r.particles.types).toEqual(p.suggest.particles.types);
      expect(r.particles.color).toBe(p.suggest.particles.color);
      expect(r.particles.densityFactor).toBe(p.densityFactor ?? 1);
      expect(r.reveal.style).toBe(p.suggest.revealStyle);
    });
  }
  it('giá trị config khác "theme" thắng ở từng nhóm', () => {
    const r = raw({
      theme: { preset: 'tram-vang', ornamentSet: 'lotus', texture: 'linen', photoFrame: 'oval' },
      sections: { divider: 'dots' },
      cover: { openStyle: 'book' },
      effects: { burst: { onOpen: 'gold' }, particles: { types: ['snow'], color: '#112233' }, reveal: { style: 'playful', heading: 'wipe' } },
    });
    expect([r.ornamentSet, r.texture, r.photoFrame, r.divider, r.openStyle, r.burstOnOpen]).toEqual(['lotus', 'linen', 'oval', 'dots', 'book', 'gold']);
    expect(r.particles).toMatchObject({ types: ['snow'], color: '#112233' });
    expect(r.reveal).toMatchObject({ style: 'playful', heading: 'wipe', block: REVEAL_PACKS.playful.block });
  });
  it('font: field riêng > fonts.preset > theme', () => {
    expect(raw({ fonts: { preset: 'am-ap' } }).fonts).toEqual(FONT_PRESET_MAP['am-ap']);
    expect(raw({ fonts: { preset: 'am-ap', heading: 'prata' } }).fonts).toEqual({ ...FONT_PRESET_MAP['am-ap'], heading: 'prata' });
    expect(raw({ theme: { preset: 'son-do' }, fonts: { body: 'mulish' } }).fonts).toEqual({ ...PRESETS['son-do'].fonts, body: 'mulish' });
  });
  it('màu: primaryColor -> derive; overrides áp sau cùng', () => {
    const r = raw({ theme: { primaryColor: '#3355AA', overrides: { accent: '#EEDDCC', bg: '#FAFAFA' } } });
    expect(r.tokens.primaryDecor).toBe('#3355AA');
    expect(r.tokens.accent).toBe('#EEDDCC');
    expect(r.tokens.bg).toBe('#FAFAFA');
    expect(r.tokens.primary).not.toBe(PRESETS['tram-vang'].tokens.primary);
  });
  it('đổi theme chỉ đổi phần "theme": field đã chỉnh giữ nguyên', () => {
    const base = { fonts: { heading: 'lora' }, cover: { openStyle: 'card-flip' } };
    const a = raw({ ...base, theme: { preset: 'tram-vang' } });
    const b = raw({ ...base, theme: { preset: 'dem-nhung' } });
    expect(a.fonts.heading).toBe('lora');
    expect(b.fonts.heading).toBe('lora');
    expect(b.openStyle).toBe('card-flip');
    expect(b.fonts.script).toBe(PRESETS['dem-nhung'].fonts.script);
    expect(b.mode).toBe('dark');
  });
  it('fontScale theo scaleStep', () => {
    expect(raw({ fonts: { scaleStep: -1 } }).fontScale).toBe(0.92);
    expect(raw({ fonts: { scaleStep: 1 } }).fontScale).toBe(1.08);
  });
});

describe('capabilities v1 (fallback + cảnh báo)', () => {
  it('3 theme bật chạy đúng gói, phần chưa có của gói fallback im lặng', () => {
    for (const id of CAPABILITIES.theme.supported) {
      const r = resolveTheme(cfg({ theme: { preset: id } }));
      expect(r.preset).toBe(id);
      expect(r.warnings).toEqual([]);
      expect(CAPABILITIES.openStyle.supported).toContain(r.openStyle);
      expect(CAPABILITIES.ornamentSet.supported).toContain(r.ornamentSet);
      expect(CAPABILITIES.photoFrame.supported).toContain(r.photoFrame);
      expect(CAPABILITIES.divider.supported).toContain(r.divider);
      expect(CAPABILITIES.texture.supported).toContain(r.texture);
      r.particles.types.forEach((t) => expect(CAPABILITIES.particle.supported).toContain(t));
      Object.values(r.fonts).forEach((f) => expect(CAPABILITIES.font.supported).toContain(f));
    }
    expect(resolveTheme(cfg({ theme: { preset: 'son-do' } })).ornamentSet).toBe('traditional');
    expect(resolveTheme(cfg({ theme: { preset: 'dem-nhung' } }))).toMatchObject({
      ornamentSet: 'luxe', texture: 'velvet', photoFrame: 'deco-cut', divider: 'deco-fan', mode: 'dark', particles: { types: ['gold-dust', 'firefly'] },
    });
  });
  /**
   * Không phụ thuộc capability (solution-v4a-2bc.md 0.9): mỗi nhóm tự chọn 1 giá trị hợp lệ theo schema nhưng
   * CHƯA có trong `CAPABILITIES` (enum − supported); nhóm đã đủ thì bỏ qua. Số cảnh báo = số nhóm đã chọn.
   */
  it('giá trị config chưa hỗ trợ -> fallback khai báo + warning (tự chọn theo capability)', () => {
    const missing = <T extends string>(key: CapabilityKey, list: readonly T[]): T | undefined =>
      list.find((v) => !isSupported(key, v));
    const theme = missing('theme', THEME_IDS);
    const photoFrame = missing('photoFrame', PHOTO_FRAMES);
    const ornamentSet = missing('ornamentSet', ORNAMENT_SETS);
    const texture = missing('texture', TEXTURES);
    const divider = missing('divider', DIVIDERS);
    const openStyle = missing('openStyle', OPEN_STYLES);
    const burst = missing('burstOnOpen', BURSTS_ON_OPEN);
    const heading = missing('font', HEADING_FONTS);
    const particle = missing('particle', PARTICLE_TYPES);
    const revealStyle = missing('revealStyle', REVEAL_STYLES);
    const atom = missing('revealAtom', REVEAL_ATOMS);
    const otherParticle = CAPABILITIES.particle.supported.find((t) => t !== CAPABILITIES.particle.fallback)!;

    const r = resolveTheme(cfg({
      theme: { ...(theme ? { preset: theme } : {}), ...(photoFrame ? { photoFrame } : {}), ...(ornamentSet ? { ornamentSet } : {}), ...(texture ? { texture } : {}) },
      sections: divider ? { divider } : {},
      cover: openStyle ? { openStyle } : {},
      fonts: heading ? { heading } : {},
      effects: {
        burst: burst ? { onOpen: burst } : {},
        particles: particle ? { types: [particle, otherParticle] } : {},
        reveal: { ...(revealStyle ? { style: revealStyle } : {}), ...(atom ? { heading: atom } : {}) },
      },
    }));
    const picked = [theme, photoFrame, ornamentSet, texture, divider, openStyle, burst, heading, particle, revealStyle, atom].filter(Boolean);

    if (theme) expect(r.preset).toBe(CAPABILITIES.theme.fallback);
    if (photoFrame) expect(r.photoFrame).toBe(CAPABILITIES.photoFrame.fallback);
    if (ornamentSet) expect(r.ornamentSet).toBe(CAPABILITIES.ornamentSet.fallback);
    if (texture) expect(r.texture).toBe(CAPABILITIES.texture.fallback);
    if (divider) expect(r.divider).toBe(CAPABILITIES.divider.fallback);
    if (openStyle) expect(r.openStyle).toBe(CAPABILITIES.openStyle.fallback);
    if (burst) expect(r.burstOnOpen).toBe(CAPABILITIES.burstOnOpen.fallback);
    if (heading) expect(r.fonts.heading).toBe(PRESETS['tram-vang'].fonts.heading);
    if (particle) expect(r.particles.types).toEqual([CAPABILITIES.particle.fallback, otherParticle]);
    if (revealStyle) expect(r.reveal.style).toBe(CAPABILITIES.revealStyle.fallback);
    if (atom) expect(r.reveal.heading).toBe(REVEAL_PACKS[r.reveal.style].heading);
    expect(r.warnings, r.warnings.join('\n')).toHaveLength(picked.length);
    for (const v of picked) expect(r.warnings.some((w) => w.includes(`"${v}"`)), `cảnh báo cho "${v}"`).toBe(true);
  });
  it('5 font preset dùng được ở v1', () => {
    for (const fp of Object.keys(FONT_PRESET_MAP)) {
      const r = resolveTheme(cfg({ fonts: { preset: fp } }));
      expect(r.fonts).toEqual(FONT_PRESET_MAP[fp as keyof typeof FONT_PRESET_MAP]);
      expect(r.warnings).toEqual([]);
    }
  });
  it('themeCssVars sinh đủ biến', () => {
    const r = resolveTheme(cfg());
    const v = themeCssVars(r, { heading: fontStack('playfair-display'), script: fontStack('great-vibes'), body: fontStack('be-vietnam-pro') });
    const keys = ['--c-primary', '--c-on-primary', '--c-accent', '--c-accent-2', '--c-primary-decor', '--c-bg', '--c-surface', '--c-text', '--c-muted',
      '--c-line', '--c-line-strong', '--c-overlay', '--c-success', '--c-danger', '--ff-heading', '--ff-script', '--ff-body', '--fs-k'];
    for (const k of keys) expect(v[k], k).toBeTruthy();
    expect(v['--ff-script']).toContain('Great Vibes');
  });
});

// v4a-1 (solution-v4a-2bc.md 3.2: khối describe motif riêng)
describe('v4a-1: hoạ tiết nền B2 (theme.motif)', () => {
  it('mặc định Trầm Vàng: tắt hoạ tiết, cap .05', () => {
    expect(resolveTheme(cfg()).motif).toEqual({ set: 'none', placements: [], intensity: 'medium', motion: 'auto', cap: 0.05 });
  });
  it('4 theme bật mặc định (decisions 2026-10-09)', () => {
    const on = THEME_IDS.filter((id) => resolveTheme(cfg({ theme: { preset: id } })).motif.set !== 'none');
    expect(on.sort()).toEqual(['bien-dao', 'dem-nhung', 'sen-cham', 'son-do']);
  });
  it('config chọn bộ thắng preset; "theme" theo preset', () => {
    expect(resolveTheme(cfg({ theme: { preset: 'son-do', motif: { set: 'chu-hy' } } })).motif.set).toBe('chu-hy');
    expect(resolveTheme(cfg({ theme: { preset: 'son-do' } })).motif.set).toBe('dong-son');
  });
  it('bộ chưa có capability -> fallback none + cảnh báo (chỉ khi do config chọn)', () => {
    const unsupported = MOTIF_SETS.find((s) => !isSupported('motifSet', s));
    if (!unsupported) return; // v4a-1 bật đủ 7 bộ
    const r = resolveTheme(cfg({ theme: { motif: { set: unsupported } } }));
    expect(r.motif.set).toBe('none');
    expect(r.warnings.some((w) => w.includes(unsupported))).toBe(true);
  });
  it('primaryColor/overrides.accent -> cap tính lại từ token cuối cùng', () => {
    const a = resolveTheme(cfg({ theme: { preset: 'son-do' } })).motif.cap;
    const b = resolveTheme(cfg({ theme: { preset: 'son-do', overrides: { accent: '#3B1A14' } } })).motif.cap;
    expect(b).toBeLessThan(a);
  });
  it('applyCapabilities: false giữ nguyên giá trị', () => {
    expect(raw({ theme: { motif: { set: 'la-canh' } } }).motif.set).toBe('la-canh');
  });
});
