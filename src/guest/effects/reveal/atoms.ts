/**
 * Nguyên tử reveal theo cấp + chốt chặn nội dung (solution-v4a-2a.md 2.3, design-v4a-2a §3). Thuần, test được trong node.
 */
import type { RevealAtom } from '@shared/config/enums';
import type { RevealPack, RevealRole } from '@shared/reveal-plan';
import { MATRIX, type FxState } from '../intensity';

export type Atom = RevealAtom | 'fade-fast';

/** Ngữ cảnh của phần tử (engine đọc từ DOM lúc chuẩn bị). Thiếu field = mặc định: wide/letters true, còn lại false/0. */
export interface AtomCtx {
  lowEnd: boolean;
  /** heading font script (`.h2-script`, `.hero-names`, chữ ký) */
  script: boolean;
  /** ảnh lồng trong khối có reveal */
  nested: boolean;
  /** ô album */
  tile: boolean;
  /** cột đối xứng (`.person`, `.fam-col`) */
  pairCol: boolean;
  /** khung ảnh rỗng (không có <img>) */
  emptyFrame: boolean;
  graphemes: number;
  words: number;
  /** chuỗi có chữ cái (không chỉ ký hiệu/rỗng) */
  letters: boolean;
  /** viewport ≥ 1024px lúc chuẩn bị */
  wide: boolean;
  /** số phần tử đã nhận blur-in trước phần tử này (thứ tự DOM) */
  blurUsed: number;
}

const TEXT_ONLY = new Set<Atom>(['mask-up', 'split-words', 'split-chars', 'blur-in']);
const NESTED_OK = new Set<Atom>(['photo-settle', 'wipe', 'fade', 'fade-fast', 'none']);

/** Nguyên tử thực tế của 1 vai trò sau hạ cấp + chốt chặn (thứ tự áp đúng solution 2.3). */
export function degrade(role: RevealRole, atom: RevealAtom, state: FxState, c: Partial<AtomCtx> = {}): Atom {
  const mode = MATRIX.reveal[state];
  if (mode === 'none') return 'none';
  if (mode === 'fade200') return 'fade-fast';
  if (mode === 'gentle') return role === 'ornament' ? 'none' : 'fade';
  let a: Atom = atom;
  // 2. không hợp vai trò
  if (role === 'image' ? TEXT_ONLY.has(a) : a === 'parallax-layers') a = 'fade-up';
  // 3. Vừa (R2A-02: blur-in -> mask-up)
  if (mode === 'pack-') {
    if (a === 'blur-in') a = 'mask-up';
    if (a === 'parallax-layers') a = 'photo-settle';
  }
  // 4. blur-in chỉ desktop rộng, ≤ 3/trang, không máy yếu
  if (a === 'blur-in' && (c.wide === false || (c.blurUsed ?? 0) >= 3 || c.lowEnd)) a = 'mask-up';
  // 5. font script: tách span/mask theo dòng làm đứt nét -> wipe
  if (c.script && (a === 'mask-up' || a === 'split-words' || a === 'split-chars')) a = 'wipe';
  // 6-7. độ dài chuỗi
  if (a === 'split-chars' && ((c.graphemes ?? 0) > 40 || c.lowEnd)) a = 'split-words';
  if ((a === 'split-words' || a === 'split-chars') && (c.words ?? 0) > 20) a = 'fade-up';
  if (c.letters === false && TEXT_ONLY.has(a) && a !== 'blur-in') a = 'fade-up';
  // 8.
  if (!MATRIX.split[state] && (a === 'split-chars' || a === 'split-words')) a = 'fade';
  // 9-11. ảnh
  if (role === 'image') {
    if (c.nested && !NESTED_OK.has(a)) a = 'photo-settle';
    if (c.emptyFrame && (a === 'wipe' || a === 'photo-settle')) a = 'fade';
    if (c.tile && a === 'wipe' && c.lowEnd) a = 'photo-settle';
  }
  // 12. cặp cột đối xứng ở Nhiều
  if (c.pairCol && state === 'high' && (a === 'fade' || a === 'fade-up')) a = 'slide-side';
  // 13.
  if (a === 'svg-draw' && MATRIX.svgDraw[state] === 'static') a = 'none';
  return a;
}

/** Kiểu nguyên tử thực tế theo cấp (giữ chữ ký cũ; tham số 4 tuỳ chọn). */
export function atomFor(role: RevealRole, pack: RevealPack, state: FxState, c?: Partial<AtomCtx>): Atom {
  return degrade(role, pack[role], state, c);
}

/** Hệ số `--fx-slow` của preview 0.5x (R2A-06): thời lượng CSS nhân với giá trị này. */
export const fxSlow = (timeScale: number): number => (timeScale > 0 && timeScale < 1 ? 1 / timeScale : 1);
