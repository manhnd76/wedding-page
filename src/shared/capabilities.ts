/**
 * Giá trị enum ĐÃ CÓ module ở giai đoạn hiện tại (v1) + fallback (solution "Kế hoạch triển khai").
 * Giá trị hợp lệ theo schema nhưng chưa có ở đây -> resolver dùng fallback + cảnh báo.
 * Thêm theme/hiệu ứng ở giai đoạn sau: chỉ cần bổ sung vào danh sách, KHÔNG đổi schema.
 * Từ v4a (solution-v4a-2bc.md 0.1): danh sách dưới đây là GỐC (v2.3), KHÔNG sửa; mỗi đợt bật thêm id
 * trong `caps/<đợt>.ts`. Key mới chỉ thêm trong vùng `[<đợt>] keys` cuối object.
 */
import type { CapsAddon } from './caps/types.ts';
import { CAPS_V4A_1 } from './caps/v4a-1.ts';
import { CAPS_V4A_2A } from './caps/v4a-2a.ts';
import { CAPS_V4A_2B } from './caps/v4a-2b.ts';
import { CAPS_V4A_2C } from './caps/v4a-2c.ts';

export const STAGE = 'v2.1';

export interface Capability<T extends string> { supported: readonly T[]; fallback: T }

/** Add-on của các đợt v4a (solution-v4a-2bc.md 0.1): mỗi đợt chỉ sửa file `caps/<đợt>.ts` của mình. */
const ADDONS: readonly CapsAddon[] = [CAPS_V4A_1, CAPS_V4A_2A, CAPS_V4A_2B, CAPS_V4A_2C];

type AddonValue<K extends keyof CapsAddon> = NonNullable<CapsAddon[K]>[number] & string;

/** `supported` = danh sách gốc (v2.3) + id các đợt bật thêm (giữ thứ tự, bỏ trùng). */
function cap<K extends keyof CapsAddon>(key: K, base: readonly AddonValue<K>[], fallback: AddonValue<K>): Capability<AddonValue<K>> {
  const all = [...base];
  for (const a of ADDONS) for (const v of (a[key] ?? []) as readonly AddonValue<K>[]) if (!all.includes(v)) all.push(v);
  return { supported: all, fallback };
}

export const CAPABILITIES = {
  theme: cap('theme', ['tram-vang', 'son-do', 'dem-nhung'], 'tram-vang'),
  openStyle: cap('openStyle', ['envelope', 'card-flip', 'fade-zoom', 'none'], 'envelope'),
  particle: cap('particle', ['petal-rose', 'heart', 'petal-peach', 'gold-dust', 'firefly'], 'petal-rose'),
  /** mẫu phong bì (skin của `envelope`, v2.1) */
  envelopeStyle: cap('envelopeStyle', ['classic', 'kraft', 'song-hy', 'lace', 'minimal', 'velvet'], 'classic'),
  burstOnOpen: cap('burstOnOpen', ['none', 'petals'], 'petals'),
  revealStyle: cap('revealStyle', ['soft', 'gentle'], 'soft'),
  /** kiểu reveal nguyên tử dùng được khi admin ghi đè vai trò (không có -> theo gói) */
  revealAtom: cap('revealAtom', ['fade', 'fade-up', 'slide-side', 'zoom-in', 'photo-settle', 'rise-tilt', 'svg-draw', 'none'], 'fade'),
  ornamentSet: cap('ornamentSet', ['classic-line', 'traditional', 'luxe'], 'classic-line'),
  texture: cap('texture', ['paper', 'velvet', 'none'], 'paper'),
  photoFrame: cap('photoFrame', ['arch', 'circle-moon', 'deco-cut'], 'arch'),
  divider: cap('divider', ['ornament', 'wave', 'none', 'cloud', 'deco-fan'], 'ornament'),
  countdownStyle: cap('countdownStyle', ['flip', 'simple'], 'flip'),
  /** font đã cài @fontsource (font của 3 theme v1 + 5 font preset) */
  font: cap(
    'font',
    [
      'playfair-display', 'cormorant-garamond', 'lora', 'noto-serif-display', 'fraunces',
      'great-vibes', 'pinyon-script', 'alex-brush', 'dancing-script', 'imperial-script', 'charm',
      'be-vietnam-pro', 'mulish', 'quicksand',
    ],
    'playfair-display',
  ),
  // [v4a-1] keys >>>
  // [v4a-1] keys <<<

  // [v4a-2a] keys >>>
  // [v4a-2a] keys <<<
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
