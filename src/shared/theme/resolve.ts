import { capOr } from '../capabilities.ts';
import type {
  BurstOnOpen, Divider, EnvelopeStyle, FontId, OpenStyle, OrnamentSet, ParticleType, PhotoFrame, RevealAtom, RevealStyle, Texture, ThemeId,
} from '../config/enums.ts';
import type { WeddingConfig } from '../config/types.ts';
import { FONT_PRESET_MAP } from '../fonts/registry.ts';
import { contrast } from './contrast.ts';
import { deriveFromPrimary, rgba } from './derive.ts';
import { PRESETS, STATUS_TOKENS, type ThemePreset } from './presets.ts';

export interface ResolvedTokens {
  primary: string; onPrimary: string; accent: string; accent2: string; primaryDecor: string;
  bg: string; surface: string; text: string; muted: string; line: string; lineStrong: string;
  overlay: string; success: string; danger: string;
}

/** Phong bì đã resolve (design-review-v1 4.3). */
export interface ResolvedEnvelope {
  style: EnvelopeStyle;
  /** true = nhuộm theo token theme; false = bảng màu cố định của mẫu (kraft/song-hy/velvet trên theme sáng) */
  themed: boolean;
  /** màu giấy tự chọn (hex) + mực tự chọn theo tương phản; null = theo mẫu/theme */
  paper: string | null;
  ink: string | null;
  guestOnFront: boolean;
  liner: boolean;
}

/** Mẫu giữ màu cố định khi `color = "auto"` (velvet chỉ cố định khi theme sáng). */
export function envelopeFixed(style: EnvelopeStyle, mode: 'light' | 'dark'): boolean {
  return style === 'kraft' || style === 'song-hy' || (style === 'velvet' && mode === 'light');
}

/** Mực trên giấy tự chọn: đen ấm hoặc trắng, cái nào tương phản cao hơn (≥ 4.5:1 khi có thể). */
export function inkOn(paper: string): string {
  return contrast('#1F1A17', paper) >= contrast('#FFFFFF', paper) ? '#1F1A17' : '#FFFFFF';
}

export interface RevealPack { heading: RevealAtom; block: RevealAtom; image: RevealAtom; ornament: RevealAtom; stagger: number }

export interface ResolvedTheme {
  preset: ThemeId;
  mode: 'light' | 'dark';
  tokens: ResolvedTokens;
  fonts: { heading: FontId; script: FontId; body: FontId };
  fontScale: number;
  ornamentSet: OrnamentSet;
  texture: Texture;
  photoFrame: PhotoFrame;
  divider: Divider;
  openStyle: OpenStyle;
  burstOnOpen: BurstOnOpen;
  envelope: ResolvedEnvelope;
  particles: { types: ParticleType[]; color: string; densityFactor: number };
  reveal: RevealPack & { style: RevealStyle };
  /** cảnh báo fallback (giá trị do config chọn mà bản hiện tại chưa có) */
  warnings: string[];
}

/** Bảng gói reveal (design 5.8). */
export const REVEAL_PACKS: Record<RevealStyle, RevealPack> = {
  soft: { heading: 'fade-up', block: 'fade-up', image: 'photo-settle', ornament: 'svg-draw', stagger: 80 },
  editorial: { heading: 'mask-up', block: 'fade', image: 'wipe', ornament: 'svg-draw', stagger: 90 },
  letter: { heading: 'split-chars', block: 'fade', image: 'zoom-in', ornament: 'svg-draw', stagger: 60 },
  gentle: { heading: 'fade', block: 'fade', image: 'fade', ornament: 'none', stagger: 60 },
  playful: { heading: 'split-words', block: 'zoom-in', image: 'rise-tilt', ornament: 'svg-draw', stagger: 100 },
  cinematic: { heading: 'blur-in', block: 'fade-up', image: 'photo-settle', ornament: 'svg-draw', stagger: 120 },
};

export interface ResolveOptions {
  /** false: bỏ qua capabilities (admin xem dữ liệu thô). Mặc định true. */
  applyCapabilities?: boolean;
}

/**
 * Resolver dùng chung (plugin build, preview, admin) - solution 5.2.
 * Giá trị config khác "theme"/null thì thắng; ngược lại lấy từ preset.
 */
export function resolveTheme(config: WeddingConfig, opts: ResolveOptions = {}): ResolvedTheme {
  const caps = opts.applyCapabilities !== false;
  const warnings: string[] = [];
  /** user = giá trị lấy từ config (cảnh báo nếu fallback); preset = gợi ý theme (fallback im lặng) */
  const cap = <T extends string>(key: Parameters<typeof capOr>[0], v: T, fromUser: boolean, fb?: T): T =>
    caps ? capOr(key, v, fromUser ? warnings : undefined, fb) : v;

  const presetId = cap('theme', config.theme.preset, true);
  const preset: ThemePreset = PRESETS[presetId];
  const mode = preset.mode;

  // ---- màu
  const ov = config.theme.overrides ?? {};
  const base = config.theme.primaryColor
    ? deriveFromPrimary(config.theme.primaryColor, mode, ov.accent)
    : { ...preset.tokens, primaryDecor: preset.tokens.primary, lineStrong: preset.tokens.muted, overlay: mode === 'dark' ? rgba(preset.tokens.bg, 0.55) : rgba(preset.tokens.text, 0.45) };
  const status = STATUS_TOKENS[mode];
  const tokens: ResolvedTokens = {
    primary: base.primary, onPrimary: base.onPrimary, accent: base.accent,
    accent2: base.accent2 ?? preset.tokens.accent2 ?? base.accent,
    primaryDecor: base.primaryDecor, bg: base.bg, surface: base.surface, text: base.text, muted: base.muted,
    line: base.line, lineStrong: base.lineStrong, overlay: base.overlay, success: status.success, danger: status.danger,
  };
  for (const [k, v] of Object.entries(ov)) if (v) (tokens as unknown as Record<string, string>)[k] = v;
  if (ov.muted) tokens.lineStrong = ov.muted;
  if (ov.primary && !config.theme.primaryColor) tokens.primaryDecor = ov.primary;
  if (contrast(tokens.text, tokens.bg) < 4.5) warnings.push(`Tương phản chữ/nền ${contrast(tokens.text, tokens.bg).toFixed(2)}:1 < 4.5:1`);

  // ---- font: field riêng > fonts.preset > preset theme
  const fp = config.fonts.preset !== 'theme' ? FONT_PRESET_MAP[config.fonts.preset] : null;
  const pickFont = (role: 'heading' | 'script' | 'body'): FontId => {
    const own = config.fonts[role];
    const fromUser = own !== 'theme' || !!fp;
    const id: FontId = own !== 'theme' ? own : fp ? fp[role] : preset.fonts[role];
    return cap('font', id, fromUser, PRESETS['tram-vang'].fonts[role]);
  };
  const fonts = { heading: pickFont('heading'), script: pickFont('script'), body: pickFont('body') };

  // ---- thành phần
  const pick = <T extends string>(key: Parameters<typeof capOr>[0], v: 'theme' | T, presetV: T, fb?: T): T =>
    v === 'theme' ? cap(key, presetV, false, fb) : cap(key, v, true, fb);
  const ornamentSet = pick('ornamentSet', config.theme.ornamentSet, preset.ornamentSet);
  const texture = pick('texture', config.theme.texture, preset.texture);
  const photoFrame = pick('photoFrame', config.theme.photoFrame, preset.photoFrame);
  const divider = pick('divider', config.sections.divider, preset.divider);
  const openStyle = pick('openStyle', config.cover.openStyle, preset.suggest.openStyle);
  const burstOnOpen = pick('burstOnOpen', config.effects.burst.onOpen, preset.suggest.burstOnOpen);
  const ev = config.cover.envelope;
  const envStyle = pick('envelopeStyle', ev.style, preset.suggest.envelopeStyle);
  const paper = /^#[0-9a-f]{6}$/i.test(ev.color) ? ev.color.toUpperCase() : null;
  const envelope: ResolvedEnvelope = {
    style: envStyle,
    themed: paper ? false : ev.color === 'theme' || !envelopeFixed(envStyle, mode),
    paper, ink: paper ? inkOn(paper) : null,
    guestOnFront: ev.guestOnFront, liner: ev.liner,
  };

  // ---- hạt
  const pt = config.effects.particles;
  const rawTypes = pt.types === 'theme' ? preset.suggest.particles.types : pt.types;
  const types = [...new Set(rawTypes.map((t) => cap('particle', t, pt.types !== 'theme')))].slice(0, 2);
  const color = pt.color === 'theme' ? preset.suggest.particles.color : pt.color;

  // ---- reveal
  const rv = config.effects.reveal;
  const style = pick('revealStyle', rv.style, preset.suggest.revealStyle);
  const pack = REVEAL_PACKS[style];
  const role = (r: 'heading' | 'block' | 'image' | 'ornament'): RevealAtom => {
    const v = rv[r];
    if (v === null) return pack[r];
    return caps ? (capOr('revealAtom', v, warnings, pack[r]) as RevealAtom) : v;
  };

  return {
    preset: presetId,
    mode,
    tokens,
    fonts,
    fontScale: config.fonts.scaleStep === -1 ? 0.92 : config.fonts.scaleStep === 1 ? 1.08 : 1,
    ornamentSet, texture, photoFrame, divider, openStyle, burstOnOpen, envelope,
    particles: { types, color, densityFactor: preset.densityFactor ?? 1 },
    reveal: { style, heading: role('heading'), block: role('block'), image: role('image'), ornament: role('ornament'), stagger: pack.stagger },
    warnings,
  };
}

/** CSS custom properties của theme (inline vào `:root` lúc build, hoặc set qua CSSOM ở preview). */
export function themeCssVars(r: ResolvedTheme, stacks: { heading: string; script: string; body: string }): Record<string, string> {
  const t = r.tokens;
  return {
    '--c-primary': t.primary, '--c-on-primary': t.onPrimary, '--c-accent': t.accent, '--c-accent-2': t.accent2,
    '--c-primary-decor': t.primaryDecor, '--c-bg': t.bg, '--c-surface': t.surface, '--c-text': t.text,
    '--c-muted': t.muted, '--c-line': t.line, '--c-line-strong': t.lineStrong, '--c-overlay': t.overlay,
    '--c-success': t.success, '--c-danger': t.danger,
    '--ff-heading': stacks.heading, '--ff-script': stacks.script, '--ff-body': stacks.body,
    '--fs-k': String(r.fontScale),
  };
}
