import type {
  BodyFontId, BurstOnOpen, Divider, HeadingFontId, OpenStyle, OrnamentSet, ParticleType, PhotoFrame,
  RevealStyle, ScriptFontId, Texture, ThemeId, ThemeTag,
} from '../config/enums.ts';

export interface ThemeTokens {
  primary: string; onPrimary: string; accent: string; accent2?: string;
  bg: string; surface: string; text: string; muted: string; line: string;
}

export interface ThemePreset {
  id: ThemeId;
  name: string;
  tags: ThemeTag[];
  mode: 'light' | 'dark';
  tokens: ThemeTokens;
  fonts: { heading: HeadingFontId; script: ScriptFontId; body: BodyFontId };
  ornamentSet: OrnamentSet;
  texture: Texture;
  photoFrame: PhotoFrame;
  divider: Divider;
  suggest: {
    openStyle: OpenStyle;
    burstOnOpen: BurstOnOpen;
    particles: { types: ParticleType[]; color: 'theme' | 'multi' | string };
    revealStyle: RevealStyle;
  };
  densityFactor?: number;
  hidden?: boolean;
}

/** Token trạng thái dùng chung (design 1.6.2). */
export const STATUS_TOKENS = {
  light: { success: '#2E6B3F', danger: '#B3261E' },
  dark: { success: '#7BC59A', danger: '#F2A09A' },
} as const;

/**
 * 12 preset - token nguyên văn design 1.6.2, trọn gói 1.6.4.
 * `suggest.burstOnOpen` không có cột trong design 1.6.4: Trầm Vàng = petals (3.4b); các theme khác
 * chọn theo mood (son-do = red-paper, dem-nhung = gold...) - ui-ux-designer duyệt lại ở v4.
 */
export const PRESETS: Record<ThemeId, ThemePreset> = {
  'tram-vang': {
    id: 'tram-vang', name: 'Trầm Vàng', tags: ['co-dien'], mode: 'light',
    tokens: { primary: '#8A6A3B', onPrimary: '#FFFFFF', accent: '#C9A86A', bg: '#FBF7F0', surface: '#FFFFFF', text: '#2B2320', muted: '#6B5E55', line: '#D9CDBE' },
    fonts: { heading: 'playfair-display', script: 'great-vibes', body: 'be-vietnam-pro' },
    ornamentSet: 'classic-line', texture: 'paper', photoFrame: 'arch', divider: 'ornament',
    suggest: { openStyle: 'envelope', burstOnOpen: 'petals', particles: { types: ['petal-rose'], color: 'theme' }, revealStyle: 'soft' },
  },
  'hong-phan': {
    id: 'hong-phan', name: 'Hồng Phấn', tags: ['co-dien', 'hien-dai'], mode: 'light',
    tokens: { primary: '#A4495A', onPrimary: '#FFFFFF', accent: '#E3BDB5', bg: '#FBF3F1', surface: '#FFFFFF', text: '#3A2428', muted: '#75585D', line: '#E6D3CF' },
    fonts: { heading: 'lora', script: 'dancing-script', body: 'quicksand' },
    ornamentSet: 'romantic', texture: 'paper', photoFrame: 'arch-double', divider: 'leaf-branch',
    suggest: { openStyle: 'flower-gate', burstOnOpen: 'petals', particles: { types: ['petal-rose', 'heart'], color: 'theme' }, revealStyle: 'soft' },
  },
  'luc-bao': {
    id: 'luc-bao', name: 'Lục Bảo', tags: ['co-dien'], mode: 'light',
    tokens: { primary: '#1F5A4A', onPrimary: '#FFFFFF', accent: '#C2A26A', bg: '#F3F0E8', surface: '#FFFDF8', text: '#1E2A25', muted: '#56645D', line: '#D5D2C6' },
    fonts: { heading: 'cormorant-garamond', script: 'pinyon-script', body: 'mulish' },
    ornamentSet: 'classic-line', texture: 'linen', photoFrame: 'rect-offset', divider: 'double-line',
    suggest: { openStyle: 'double-door', burstOnOpen: 'gold', particles: { types: ['leaf-eucalyptus', 'sparkle'], color: 'theme' }, revealStyle: 'editorial' },
  },
  'son-do': {
    id: 'son-do', name: 'Son Đỏ (Song Hỷ)', tags: ['truyen-thong'], mode: 'light',
    tokens: { primary: '#A3201D', onPrimary: '#FFFFFF', accent: '#D4A23C', bg: '#FFF8EE', surface: '#FFFFFF', text: '#3B1A14', muted: '#6E4A40', line: '#EBD6B8' },
    fonts: { heading: 'noto-serif-display', script: 'charm', body: 'be-vietnam-pro' },
    ornamentSet: 'traditional', texture: 'paper', photoFrame: 'circle-moon', divider: 'cloud',
    suggest: { openStyle: 'scroll', burstOnOpen: 'red-paper', particles: { types: ['petal-peach', 'red-paper'], color: 'theme' }, revealStyle: 'soft' },
  },
  'muc-giay': {
    id: 'muc-giay', name: 'Mực & Giấy', tags: ['hien-dai'], mode: 'light',
    tokens: { primary: '#262624', onPrimary: '#FFFFFF', accent: '#C2703D', bg: '#FAF9F6', surface: '#FFFFFF', text: '#1C1C1A', muted: '#5F5E58', line: '#E2E0DA' },
    fonts: { heading: 'newsreader', script: 'birthstone', body: 'manrope' },
    ornamentSet: 'minimal', texture: 'grain-fine', photoFrame: 'soft-rect', divider: 'dots',
    suggest: { openStyle: 'book', burstOnOpen: 'none', particles: { types: ['ink-dot'], color: 'theme' }, revealStyle: 'editorial' },
    densityFactor: 0.5,
  },
  'hoai-co': {
    id: 'hoai-co', name: 'Hoài Cổ', tags: ['co-dien'], mode: 'light',
    tokens: { primary: '#6B3E26', onPrimary: '#FFFFFF', accent: '#C99A8B', bg: '#F4ECDD', surface: '#FBF6EC', text: '#2E241C', muted: '#6A5848', line: '#D8C8AE' },
    fonts: { heading: 'old-standard-tt', script: 'pinyon-script', body: 'josefin-sans' },
    ornamentSet: 'deco', texture: 'paper-aged', photoFrame: 'stamp', divider: 'double-line',
    suggest: { openStyle: 'wax-seal', burstOnOpen: 'petals', particles: { types: ['petal-dried', 'dust-mote'], color: 'theme' }, revealStyle: 'letter' },
  },
  'sen-cham': {
    id: 'sen-cham', name: 'Sen Chàm', tags: ['truyen-thong'], mode: 'light',
    tokens: { primary: '#2D3E5E', onPrimary: '#FFFFFF', accent: '#E7A9B6', bg: '#F5F3EC', surface: '#FCFBF7', text: '#1F2533', muted: '#545C6B', line: '#D9D6CC' },
    fonts: { heading: 'prata', script: 'allura', body: 'mulish' },
    ornamentSet: 'lotus', texture: 'rice-paper', photoFrame: 'circle-moon', divider: 'lotus',
    suggest: { openStyle: 'moon-gate', burstOnOpen: 'petals', particles: { types: ['petal-lotus'], color: 'theme' }, revealStyle: 'gentle' },
    densityFactor: 0.5,
  },
  'mau-nuoc': {
    id: 'mau-nuoc', name: 'Hoa Lá Màu Nước', tags: ['thien-nhien'], mode: 'light',
    tokens: { primary: '#4E6B4A', onPrimary: '#FFFFFF', accent: '#A9C3A0', accent2: '#E9C2B8', bg: '#F7F8F3', surface: '#FFFFFF', text: '#243024', muted: '#5A665A', line: '#DCE2D6' },
    fonts: { heading: 'eb-garamond', script: 'alex-brush', body: 'nunito' },
    ornamentSet: 'watercolor', texture: 'watercolor-wash', photoFrame: 'wash-mask', divider: 'brush-stroke',
    suggest: { openStyle: 'ink-spread', burstOnOpen: 'petals', particles: { types: ['leaf-green', 'petal-watercolor'], color: 'multi' }, revealStyle: 'soft' },
  },
  'dat-nung': {
    id: 'dat-nung', name: 'Đất Nung', tags: ['thien-nhien'], mode: 'light',
    tokens: { primary: '#9A4A2C', onPrimary: '#FFFFFF', accent: '#D9A47E', bg: '#F6EEE4', surface: '#FCF8F2', text: '#3A2A20', muted: '#6E5A4C', line: '#E3D3C1' },
    fonts: { heading: 'fraunces', script: 'style-script', body: 'lexend' },
    ornamentSet: 'boho', texture: 'kraft', photoFrame: 'arch', divider: 'torn-paper',
    suggest: { openStyle: 'origami', burstOnOpen: 'confetti', particles: { types: ['pampas', 'petal-dried'], color: 'theme' }, revealStyle: 'playful' },
  },
  'pastel-han': {
    id: 'pastel-han', name: 'Pastel Hàn', tags: ['hien-dai'], mode: 'light',
    tokens: { primary: '#6A5A8C', onPrimary: '#FFFFFF', accent: '#F3C6B8', accent2: '#CFC6E8', bg: '#FBF8F6', surface: '#FFFFFF', text: '#2E2A36', muted: '#67606F', line: '#E8E2EA' },
    fonts: { heading: 'crimson-pro', script: 'moon-dance', body: 'quicksand' },
    ornamentSet: 'korean', texture: 'grain-fine', photoFrame: 'polaroid', divider: 'dots',
    suggest: { openStyle: 'polaroid', burstOnOpen: 'confetti', particles: { types: ['petal-sakura', 'bubble'], color: 'multi' }, revealStyle: 'playful' },
  },
  'dem-nhung': {
    id: 'dem-nhung', name: 'Đêm Nhung', tags: ['toi', 'co-dien'], mode: 'dark',
    tokens: { primary: '#D9B77E', onPrimary: '#1C1517', accent: '#9C7A45', bg: '#1C1517', surface: '#261D20', text: '#F2E9E1', muted: '#B5A79C', line: '#3D3134' },
    fonts: { heading: 'playfair-display', script: 'imperial-script', body: 'mulish' },
    ornamentSet: 'luxe', texture: 'velvet', photoFrame: 'deco-cut', divider: 'deco-fan',
    suggest: { openStyle: 'light-gather', burstOnOpen: 'gold', particles: { types: ['gold-dust', 'firefly'], color: 'theme' }, revealStyle: 'cinematic' },
  },
  'bien-dao': {
    id: 'bien-dao', name: 'Biển Đảo', tags: ['thien-nhien'], mode: 'light',
    tokens: { primary: '#1D5C7A', onPrimary: '#FFFFFF', accent: '#F2A38A', accent2: '#8FD0CF', bg: '#FAF6EE', surface: '#FFFFFF', text: '#1B2B33', muted: '#4F6370', line: '#D8E0E2' },
    fonts: { heading: 'spectral', script: 'dancing-script', body: 'nunito' },
    ornamentSet: 'tropical', texture: 'sand', photoFrame: 'scallop', divider: 'wave-ocean',
    suggest: { openStyle: 'card-3d', burstOnOpen: 'confetti', particles: { types: ['plumeria', 'bubble'], color: 'theme' }, revealStyle: 'playful' },
  },
};
