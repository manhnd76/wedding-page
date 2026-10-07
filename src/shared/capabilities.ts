/**
 * Giá trị enum ĐÃ CÓ module ở giai đoạn hiện tại (v1) + fallback (solution "Kế hoạch triển khai").
 * Giá trị hợp lệ theo schema nhưng chưa có ở đây -> resolver dùng fallback + cảnh báo.
 * Thêm theme/hiệu ứng ở giai đoạn sau: chỉ cần bổ sung vào danh sách, KHÔNG đổi schema.
 */
import type {
  BurstOnOpen, CountdownStyle, Divider, FontId, OpenStyle, OrnamentSet, ParticleType, PhotoFrame,
  RevealAtom, RevealStyle, Texture, ThemeId,
} from './config/enums.ts';

export const STAGE = 'v1';

export interface Capability<T extends string> { supported: readonly T[]; fallback: T }

export const CAPABILITIES = {
  theme: { supported: ['tram-vang', 'son-do', 'dem-nhung'], fallback: 'tram-vang' } as Capability<ThemeId>,
  openStyle: { supported: ['envelope', 'card-flip', 'fade-zoom', 'none'], fallback: 'envelope' } as Capability<OpenStyle>,
  particle: { supported: ['petal-rose', 'heart', 'petal-peach', 'gold-dust', 'firefly'], fallback: 'petal-rose' } as Capability<ParticleType>,
  burstOnOpen: { supported: ['none', 'petals'], fallback: 'petals' } as Capability<BurstOnOpen>,
  revealStyle: { supported: ['soft', 'gentle'], fallback: 'soft' } as Capability<RevealStyle>,
  /** kiểu reveal nguyên tử dùng được khi admin ghi đè vai trò (không có -> theo gói) */
  revealAtom: { supported: ['fade', 'fade-up', 'slide-side', 'zoom-in', 'photo-settle', 'rise-tilt', 'svg-draw', 'none'], fallback: 'fade' } as Capability<RevealAtom>,
  ornamentSet: { supported: ['classic-line', 'traditional', 'luxe'], fallback: 'classic-line' } as Capability<OrnamentSet>,
  texture: { supported: ['paper', 'velvet', 'none'], fallback: 'paper' } as Capability<Texture>,
  photoFrame: { supported: ['arch', 'circle-moon', 'deco-cut'], fallback: 'arch' } as Capability<PhotoFrame>,
  divider: { supported: ['ornament', 'wave', 'none', 'cloud', 'deco-fan'], fallback: 'ornament' } as Capability<Divider>,
  countdownStyle: { supported: ['flip', 'simple'], fallback: 'flip' } as Capability<CountdownStyle>,
  /** font đã cài @fontsource (font của 3 theme v1 + 5 font preset) */
  font: {
    supported: [
      'playfair-display', 'cormorant-garamond', 'lora', 'noto-serif-display', 'fraunces',
      'great-vibes', 'pinyon-script', 'alex-brush', 'dancing-script', 'imperial-script', 'charm',
      'be-vietnam-pro', 'mulish', 'quicksand',
    ],
    fallback: 'playfair-display',
  } as Capability<FontId>,
} as const;

export type CapabilityKey = keyof typeof CAPABILITIES;

export function isSupported<K extends CapabilityKey>(key: K, value: string): boolean {
  return (CAPABILITIES[key].supported as readonly string[]).includes(value);
}

/** Trả về value nếu đã hỗ trợ, ngược lại fallback (+ ghi cảnh báo). */
export function capOr<T extends string>(key: CapabilityKey, value: T, warnings?: string[], fallback?: T): T {
  if (isSupported(key, value)) return value;
  const fb = (fallback ?? CAPABILITIES[key].fallback) as T;
  warnings?.push(`"${value}" (${key}) chưa có ở bản ${STAGE} -> dùng "${fb}"`);
  return fb;
}
