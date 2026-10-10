/**
 * Enum đầy đủ của schema v1 (solution.md 5.6, design Phụ lục B).
 * Đây là danh sách HỢP LỆ của schema. Danh sách giá trị đã có module ở giai
 * đoạn hiện tại nằm ở `src/shared/capabilities.ts`.
 */

export const THEME_IDS = [
  'tram-vang', 'hong-phan', 'luc-bao', 'son-do', 'muc-giay', 'hoai-co',
  'sen-cham', 'mau-nuoc', 'dat-nung', 'pastel-han', 'dem-nhung', 'bien-dao',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const ORNAMENT_SETS = [
  'classic-line', 'romantic', 'traditional', 'minimal', 'deco', 'lotus',
  'watercolor', 'boho', 'korean', 'luxe', 'tropical',
] as const;
export type OrnamentSet = (typeof ORNAMENT_SETS)[number];

export const TEXTURES = [
  'paper', 'paper-aged', 'linen', 'kraft', 'rice-paper', 'watercolor-wash',
  'velvet', 'grain-fine', 'sand', 'none',
] as const;
export type Texture = (typeof TEXTURES)[number];

export const PHOTO_FRAMES = [
  'arch', 'arch-double', 'rect-offset', 'soft-rect', 'circle-moon', 'oval',
  'polaroid', 'stamp', 'scallop', 'wash-mask', 'deco-cut',
] as const;
export type PhotoFrame = (typeof PHOTO_FRAMES)[number];

export const DIVIDERS = [
  'ornament', 'wave', 'none', 'leaf-branch', 'double-line', 'cloud', 'lotus',
  'dots', 'brush-stroke', 'torn-paper', 'deco-fan', 'wave-ocean',
] as const;
export type Divider = (typeof DIVIDERS)[number];

// [v4a-1] >>>
/** B2 hoạ tiết nền (design 1.7, solution Rev 5 mục 10.1). `none` không nằm trong danh sách bộ. */
export const MOTIF_SETS = ['dong-son', 'may-cat-tuong', 'song-nuoc', 'hoa-sen', 'chu-hy', 'art-deco', 'la-canh'] as const;
export type MotifSet = (typeof MOTIF_SETS)[number];
export const MOTIF_PLACEMENTS = ['pattern', 'corners', 'title', 'band', 'hero'] as const;
export type MotifPlacement = (typeof MOTIF_PLACEMENTS)[number];
export const MOTIF_INTENSITIES = ['light', 'medium', 'strong'] as const;
export type MotifIntensity = (typeof MOTIF_INTENSITIES)[number];
export const MOTIF_MOTIONS = ['auto', 'off'] as const;
export type MotifMotion = (typeof MOTIF_MOTIONS)[number];
/** `--mtf-level` theo độ đậm (design 1.7.4). */
export const MOTIF_LEVEL: Record<MotifIntensity, number> = { light: 0.1, medium: 0.18, strong: 0.28 };
// [v4a-1] <<<

export const FONT_PRESETS = ['co-dien', 'thanh-lich', 'am-ap', 'bien-tap', 'truyen-thong'] as const;
export type FontPresetId = (typeof FONT_PRESETS)[number];

export const HEADING_FONTS = [
  'playfair-display', 'cormorant-garamond', 'lora', 'eb-garamond', 'prata',
  'noto-serif-display', 'fraunces', 'newsreader', 'old-standard-tt',
  'crimson-pro', 'spectral',
] as const;
export const SCRIPT_FONTS = [
  'great-vibes', 'pinyon-script', 'alex-brush', 'dancing-script', 'allura',
  'imperial-script', 'charm', 'birthstone', 'moon-dance', 'style-script',
] as const;
export const BODY_FONTS = [
  'be-vietnam-pro', 'mulish', 'quicksand', 'josefin-sans', 'lexend', 'manrope', 'nunito',
] as const;
export type HeadingFontId = (typeof HEADING_FONTS)[number];
export type ScriptFontId = (typeof SCRIPT_FONTS)[number];
export type BodyFontId = (typeof BODY_FONTS)[number];
export type FontId = HeadingFontId | ScriptFontId | BodyFontId;
export type FontRole = 'heading' | 'script' | 'body';

export const OPEN_STYLES = [
  'envelope', 'card-flip', 'curtain', 'fade-zoom', 'none', 'wax-seal', 'origami',
  'double-door', 'flower-gate', 'scroll', 'card-3d', 'light-gather', 'gift-box',
  'moon-gate', 'book', 'ink-spread', 'polaroid',
] as const;
export type OpenStyle = (typeof OPEN_STYLES)[number];

/** Mẫu phong bì (skin của kiểu mở `envelope`) - design-review-v1 mục 4 (v2.1). */
export const ENVELOPE_STYLES = ['classic', 'kraft', 'song-hy', 'lace', 'minimal', 'velvet'] as const;
export type EnvelopeStyle = (typeof ENVELOPE_STYLES)[number];

/** Tự động cuộn: flow = dừng ngắn đầu mỗi section; steady = chạy đều (design-review-v1 mục 5). */
export const AUTO_SCROLL_MODES = ['flow', 'steady'] as const;
export type AutoScrollMode = (typeof AUTO_SCROLL_MODES)[number];

export const COVER_BACKGROUNDS = ['paper', 'image'] as const;
export type CoverBackground = (typeof COVER_BACKGROUNDS)[number];

export const INTENSITIES = ['off', 'low', 'medium', 'high'] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const PARTICLE_TYPES = [
  'petal-rose', 'petal-sakura', 'petal-peach', 'petal-lotus', 'petal-dried',
  'petal-watercolor', 'plumeria', 'heart', 'paper-heart', 'leaf-green',
  'leaf-eucalyptus', 'leaf-maple', 'pampas', 'snow', 'bubble', 'firefly',
  'sparkle', 'gold-dust', 'ink-dot', 'dust-mote', 'red-paper',
] as const;
export type ParticleType = (typeof PARTICLE_TYPES)[number];

export const PARTICLE_SCOPES = ['all', 'hero-thankyou'] as const;
export type ParticleScope = (typeof PARTICLE_SCOPES)[number];

export const BURSTS_ON_OPEN = ['none', 'confetti', 'petals', 'gold', 'red-paper'] as const;
export type BurstOnOpen = (typeof BURSTS_ON_OPEN)[number];

export const COUNTDOWN_FIREWORKS = ['off', 'wedding-day', 'every-view'] as const;
export type CountdownFireworks = (typeof COUNTDOWN_FIREWORKS)[number];

export const REVEAL_STYLES = ['soft', 'editorial', 'letter', 'gentle', 'playful', 'cinematic'] as const;
export type RevealStyle = (typeof REVEAL_STYLES)[number];

export const REVEAL_ATOMS = [
  'fade', 'fade-up', 'slide-side', 'zoom-in', 'mask-up', 'wipe', 'photo-settle',
  'rise-tilt', 'blur-in', 'split-words', 'split-chars', 'svg-draw', 'parallax-layers',
] as const;
export type RevealAtom = (typeof REVEAL_ATOMS)[number] | 'none';

// [v4a-2a] >>>
/** B1: cách áp gói reveal cho các section (solution-v4a-2a.md 1.1) */
export const REVEAL_MODES = ['auto', 'uniform'] as const;
export type RevealMode = (typeof REVEAL_MODES)[number];
// [v4a-2a] <<<

export const WISH_FLY = ['paper-plane', 'bubble', 'heart'] as const;
export type WishFly = (typeof WISH_FLY)[number];

export const COUNTDOWN_STYLES = ['flip', 'slide', 'odometer', 'simple'] as const;
export type CountdownStyle = (typeof COUNTDOWN_STYLES)[number];

export const ALBUM_LAYOUTS = ['masonry', 'grid', 'carousel'] as const;
export type AlbumLayout = (typeof ALBUM_LAYOUTS)[number];

export const COUPLE_ORDERS = ['groom-first', 'bride-first'] as const;
export type CoupleOrder = (typeof COUPLE_ORDERS)[number];

export const SECTION_TYPES = [
  'hero', 'couple', 'families', 'announcement', 'events', 'countdown', 'timeline',
  'loveStory', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const THEME_TAGS = ['co-dien', 'truyen-thong', 'hien-dai', 'thien-nhien', 'toi'] as const;
export type ThemeTag = (typeof THEME_TAGS)[number];

export function isOneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v);
}

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;
export function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v);
}
