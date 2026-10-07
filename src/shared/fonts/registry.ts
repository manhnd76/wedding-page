import type { FontId, FontPresetId, FontRole } from '../config/enums.ts';

export interface FontFaceSpec { weight: number; style: 'normal' | 'italic' }

export interface FontMeta {
  id: FontId;
  family: string;
  role: FontRole;
  /** tên package @fontsource/<pkg> */
  pkg: string;
  faces: FontFaceSpec[];
  /** cỡ tối thiểu khuyến nghị (font nét mảnh) */
  minPx?: number;
}

const HEADING_FACES: FontFaceSpec[] = [{ weight: 500, style: 'normal' }, { weight: 600, style: 'normal' }, { weight: 400, style: 'italic' }];
const BODY_FACES: FontFaceSpec[] = [{ weight: 400, style: 'normal' }, { weight: 600, style: 'normal' }];
const SCRIPT_FACES: FontFaceSpec[] = [{ weight: 400, style: 'normal' }];

const h = (id: FontId, family: string, faces = HEADING_FACES): FontMeta => ({ id, family, role: 'heading', pkg: id, faces });
const s = (id: FontId, family: string, minPx?: number): FontMeta => ({ id, family, role: 'script', pkg: id, faces: SCRIPT_FACES, ...(minPx ? { minPx } : {}) });
const b = (id: FontId, family: string): FontMeta => ({ id, family, role: 'body', pkg: id, faces: BODY_FACES });

/** 28 family whitelist (design 2.3 + 2.3b, solution 5.4). Tất cả có subset vietnamese. */
export const FONT_REGISTRY: Record<FontId, FontMeta> = {
  'playfair-display': h('playfair-display', 'Playfair Display'),
  'cormorant-garamond': h('cormorant-garamond', 'Cormorant Garamond'),
  lora: h('lora', 'Lora'),
  'eb-garamond': h('eb-garamond', 'EB Garamond'),
  prata: h('prata', 'Prata', [{ weight: 400, style: 'normal' }]),
  'noto-serif-display': h('noto-serif-display', 'Noto Serif Display'),
  fraunces: h('fraunces', 'Fraunces'),
  newsreader: h('newsreader', 'Newsreader'),
  'old-standard-tt': h('old-standard-tt', 'Old Standard TT', [{ weight: 400, style: 'normal' }, { weight: 400, style: 'italic' }]),
  'crimson-pro': h('crimson-pro', 'Crimson Pro'),
  spectral: h('spectral', 'Spectral'),
  'great-vibes': s('great-vibes', 'Great Vibes'),
  'pinyon-script': s('pinyon-script', 'Pinyon Script'),
  'alex-brush': s('alex-brush', 'Alex Brush'),
  'dancing-script': s('dancing-script', 'Dancing Script'),
  allura: s('allura', 'Allura'),
  'imperial-script': s('imperial-script', 'Imperial Script'),
  charm: s('charm', 'Charm'),
  birthstone: s('birthstone', 'Birthstone', 40),
  'moon-dance': s('moon-dance', 'Moon Dance', 40),
  'style-script': s('style-script', 'Style Script'),
  'be-vietnam-pro': b('be-vietnam-pro', 'Be Vietnam Pro'),
  mulish: b('mulish', 'Mulish'),
  quicksand: b('quicksand', 'Quicksand'),
  'josefin-sans': b('josefin-sans', 'Josefin Sans'),
  lexend: b('lexend', 'Lexend'),
  manrope: b('manrope', 'Manrope'),
  nunito: b('nunito', 'Nunito'),
};

export const FONT_FALLBACK: Record<FontRole, string> = {
  heading: "Georgia, 'Times New Roman', serif",
  script: "'Segoe Script', 'Apple Chancery', cursive",
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
};

export function fontStack(id: FontId): string {
  const m = FONT_REGISTRY[id];
  return `'${m.family}', ${FONT_FALLBACK[m.role]}`;
}

/** 5 font preset (solution 5.4). */
export const FONT_PRESET_MAP: Record<FontPresetId, { heading: FontId; script: FontId; body: FontId }> = {
  'co-dien': { heading: 'playfair-display', script: 'great-vibes', body: 'be-vietnam-pro' },
  'thanh-lich': { heading: 'cormorant-garamond', script: 'pinyon-script', body: 'mulish' },
  'am-ap': { heading: 'lora', script: 'dancing-script', body: 'quicksand' },
  'bien-tap': { heading: 'fraunces', script: 'alex-brush', body: 'be-vietnam-pro' },
  'truyen-thong': { heading: 'noto-serif-display', script: 'charm', body: 'be-vietnam-pro' },
};

/** Subset cần cho tiếng Việt. Thứ tự = thứ tự @font-face. */
/**
 * Tiếng Việt phủ đủ bằng latin (U+00C0-00FF: à á â ã è é ê...) + vietnamese (ă đ ĩ ũ ơ ư, U+1EA0-1EF9).
 * Bỏ latin-ext: unicode-range của nó chồng lên vietnamese (ă đ ơ ư, ỳ ỵ ỷ ỹ) nên trình duyệt tải thêm ~115 KB vô ích.
 */
export const FONT_SUBSETS = ['vietnamese', 'latin'] as const;
export type FontSubset = (typeof FONT_SUBSETS)[number];

/** Tên file woff2 trong @fontsource/<pkg>/files/. */
export function fontsourceFile(pkg: string, subset: FontSubset, f: FontFaceSpec): string {
  return `${pkg}-${subset}-${f.weight}-${f.style}.woff2`;
}
