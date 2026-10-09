/**
 * Thành phần theme dạng file (solution Rev 5 mục 10.4, 10.5a): divider sprite riêng, mảnh hoạ tiết nền B2.
 * Dùng chung guest + plugin + admin + test. Chỉ dữ liệu + hàm thuần.
 */
import { MOTIF_PLACEMENTS, isOneOf, type Divider, type MotifPlacement, type MotifSet } from '../config/enums.ts';

/**
 * Divider có hình là 1 file sprite riêng (1 symbol `id="divider"` 160×24), design 1.6.7b.
 * `ornament` = divider của bộ hoạ tiết đang dùng; `wave`/`torn-paper` chỉ CSS; `none` không chèn.
 */
export const DIVIDER_SPRITES = ['leaf-branch', 'double-line', 'cloud', 'lotus', 'dots', 'brush-stroke', 'deco-fan', 'wave-ocean'] as const satisfies readonly Divider[];
export type DividerSprite = (typeof DIVIDER_SPRITES)[number];
export const isDividerSprite = (d: string): d is DividerSprite => (DIVIDER_SPRITES as readonly string[]).includes(d);

/** Mảnh hoạ tiết nền theo bộ (design 1.7.2). `dong-son` không có `corner` (góc = 1/4 medallion). */
export type MotifPiece = 'medallion' | 'corner' | 'band' | 'tile';
export const MOTIF_PIECES: Record<MotifSet, readonly MotifPiece[]> = {
  'dong-son': ['medallion', 'band', 'tile'],
  'may-cat-tuong': ['medallion', 'corner', 'band', 'tile'],
  'song-nuoc': ['medallion', 'corner', 'band', 'tile'],
  'hoa-sen': ['medallion', 'corner', 'band', 'tile'],
  'chu-hy': ['medallion', 'corner', 'band', 'tile'],
  'art-deco': ['medallion', 'corner', 'band', 'tile'],
  'la-canh': ['medallion', 'corner', 'band', 'tile'],
};

/** Kiểu đặt nằm sau chữ (chịu `--motif-cap`, design 1.7.3). */
export const MOTIF_BEHIND_TEXT: readonly MotifPlacement[] = ['pattern', 'corners', 'title', 'hero'];

/**
 * Chuẩn hoá danh sách vị trí (solution 10.1): bỏ phần tử lạ, bỏ trùng (giữ thứ tự),
 * có cả `pattern` + `title` -> giữ cái đứng trước, cắt còn 2. Không phải mảng -> [].
 */
export function sanitizeMotifPlacements(v: unknown): MotifPlacement[] {
  if (!Array.isArray(v)) return [];
  const out: MotifPlacement[] = [];
  for (const x of v) {
    if (!isOneOf(MOTIF_PLACEMENTS, x) || out.includes(x)) continue;
    if ((x === 'pattern' && out.includes('title')) || (x === 'title' && out.includes('pattern'))) continue;
    out.push(x);
  }
  return out.slice(0, 2);
}
