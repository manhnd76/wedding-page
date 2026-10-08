/**
 * Pipeline ảnh client (solution 8.8 "ImageSlot + pipeline", design 8.7):
 * crop -> resize cạnh dài theo slot -> WebP q0.82 (Safari: JPEG q0.85) -> giảm chất lượng ≤ 3 lần nếu vượt
 * mục tiêu -> tên `<slot>.<hash8>.<ext>` (SHA-256 của bytes) + w/h, dominantColor, lqip.
 * Canvas bỏ EXIF/GPS. Phần tính toán là hàm thuần (unit test), phần canvas chỉ chạy trên trình duyệt.
 */
import type { ImageSlotKind } from '@shared/config/schema-meta';
import { sha256Hex } from '@shared/storage/bytes';

export interface SlotSpec {
  /** cạnh dài tối đa (px) */
  maxEdge: number;
  /** tỉ lệ crop w/h; null = tự do */
  aspect: number | null;
  /** thư mục trong content/images/ */
  dir: string;
  /** mục tiêu dung lượng (byte) */
  targetBytes: number;
  /** ép định dạng */
  format?: 'jpeg';
  /** kích thước cố định (OG) */
  exact?: { w: number; h: number };
  thumbEdge?: number;
  lqip?: boolean;
}

export const SLOT_SPECS: Record<ImageSlotKind, SlotSpec> = {
  hero: { maxEdge: 2000, aspect: 9 / 16, dir: 'hero', targetBytes: 300_000, lqip: true },
  cover: { maxEdge: 2000, aspect: 9 / 16, dir: 'cover', targetBytes: 300_000, lqip: true },
  album: { maxEdge: 1600, aspect: null, dir: 'album', targetBytes: 300_000, thumbEdge: 600 },
  portrait: { maxEdge: 1200, aspect: 4 / 5, dir: 'couple', targetBytes: 200_000 },
  family: { maxEdge: 1200, aspect: 3 / 2, dir: 'families', targetBytes: 200_000 },
  event: { maxEdge: 1200, aspect: 3 / 2, dir: 'events', targetBytes: 200_000 },
  story: { maxEdge: 1200, aspect: null, dir: 'story', targetBytes: 200_000 },
  og: { maxEdge: 1200, aspect: 1200 / 630, dir: 'og', targetBytes: 250_000, format: 'jpeg', exact: { w: 1200, h: 630 } },
  qr: { maxEdge: 1000, aspect: 1, dir: 'gift', targetBytes: 150_000 },
  logo: { maxEdge: 600, aspect: null, dir: 'misc', targetBytes: 80_000 },
  other: { maxEdge: 1200, aspect: null, dir: 'misc', targetBytes: 200_000 },
};
export const THUMB_TARGET = 80_000;
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;
export const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

/** Thu nhỏ để cạnh dài ≤ maxEdge, giữ tỉ lệ, KHÔNG phóng to. */
export function fitWithin(w: number, h: number, maxEdge: number): { w: number; h: number } {
  const long = Math.max(w, h);
  if (long <= maxEdge || long === 0) return { w: Math.round(w), h: Math.round(h) };
  const k = maxEdge / long;
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

export interface Rect { x: number; y: number; w: number; h: number }

/** Vùng crop lớn nhất theo tỉ lệ, căn giữa (mặc định trước khi người dùng kéo). */
export function centerCrop(w: number, h: number, aspect: number | null): Rect {
  if (!aspect) return { x: 0, y: 0, w, h };
  if (w / h > aspect) {
    const cw = Math.round(h * aspect);
    return { x: Math.round((w - cw) / 2), y: 0, w: cw, h };
  }
  const ch = Math.round(w / aspect);
  return { x: 0, y: Math.round((h - ch) / 2), w, h: ch };
}

/** Kích thước đầu ra cho 1 slot từ vùng crop. */
export function outputSize(crop: Rect, spec: SlotSpec): { w: number; h: number } {
  if (spec.exact) return { ...spec.exact };
  return fitWithin(crop.w, crop.h, spec.maxEdge);
}

/** Tên slug ASCII an toàn cho file (không dấu, a-z0-9-). */
export function safeBase(name: string, fallback = 'anh'): string {
  const s = name.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
  return s || fallback;
}

/** `content/images/<dir>/<base>.<hash8>.<ext>` - hash8 = 8 ký tự đầu SHA-256 của bytes. */
export async function hashedImagePath(bytes: Uint8Array, dir: string, base: string, ext: string): Promise<{ path: string; hash: string; sha256: string }> {
  const sha256 = await sha256Hex(bytes);
  const hash = sha256.slice(0, 8);
  return { path: `content/images/${dir}/${base}.${hash}.${ext}`, hash, sha256 };
}

export async function hashedAudioPath(bytes: Uint8Array, base: string, ext: string): Promise<{ path: string; hash: string; sha256: string }> {
  const sha256 = await sha256Hex(bytes);
  return { path: `content/audio/${base}.${sha256.slice(0, 8)}.${ext}`, hash: sha256.slice(0, 8), sha256 };
}

/** Lịch chất lượng: bắt đầu q, giảm tối đa 3 lần. */
export function qualitySteps(format: 'webp' | 'jpeg'): number[] {
  return format === 'webp' ? [0.82, 0.74, 0.66, 0.58] : [0.85, 0.77, 0.69, 0.61];
}

export const fmtBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`);

// ------------------------------------------------------------------ phần trình duyệt

export interface ProcessedImage {
  blob: Blob;
  bytes: Uint8Array;
  path: string;
  sha256: string;
  w: number;
  h: number;
  ext: 'webp' | 'jpg';
  dominantColor: string;
  lqip?: string;
  thumb?: { blob: Blob; bytes: Uint8Array; path: string; sha256: string; w: number; h: number };
  inputBytes: number;
  summary: string;
}

/** Giải mã file ảnh (xoay theo EXIF). HEIC: thử createImageBitmap, lỗi -> thông điệp. */
export async function decodeImage(file: Blob): Promise<ImageBitmap> {
  if (file.size > MAX_INPUT_BYTES) throw new Error('Ảnh lớn hơn 20MB. Hãy chọn ảnh nhỏ hơn.');
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(/heic|heif/i.test(file.type) ? 'Hãy chọn ảnh JPG/PNG (máy này không đọc được ảnh HEIC).' : 'Không xử lý được ảnh này. Hãy chọn ảnh JPG/PNG.');
  }
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob | null>((res) => c.toBlob((b) => res(b), type, q));

async function encode(c: HTMLCanvasElement, prefer: 'webp' | 'jpeg', target: number): Promise<{ blob: Blob; ext: 'webp' | 'jpg' }> {
  if (prefer === 'webp') {
    let last: Blob | null = null;
    for (const q of qualitySteps('webp')) {
      const b = await toBlob(c, 'image/webp', q);
      if (!b || b.type !== 'image/webp') { last = null; break; } // Safari không encode WebP (ra PNG) -> JPEG
      last = b;
      if (b.size <= target) break;
    }
    if (last) return { blob: last, ext: 'webp' };
  }
  let last: Blob | null = null;
  for (const q of qualitySteps('jpeg')) {
    const b = await toBlob(c, 'image/jpeg', q);
    if (!b) continue;
    last = b;
    if (b.size <= target) break;
  }
  if (!last) throw new Error('Không nén được ảnh.');
  return { blob: last, ext: 'jpg' };
}

function dominant(src: CanvasImageSource): string {
  const c = canvas(1, 1);
  const g = c.getContext('2d')!;
  g.drawImage(src, 0, 0, 1, 1);
  const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
  return `#${[r, gg, b].map((x) => (x ?? 0).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Xử lý 1 ảnh: crop (theo `crop` trên ảnh đã xoay `rotate` độ) -> resize -> nén -> tên hash.
 */
export async function processImage(file: Blob, kind: ImageSlotKind, opts: { crop?: Rect; rotate?: 0 | 90 | 180 | 270; name?: string } = {}): Promise<ProcessedImage> {
  const spec = SLOT_SPECS[kind];
  const bmp = await decodeImage(file);
  const rot = opts.rotate ?? 0;
  const sw = rot % 180 ? bmp.height : bmp.width;
  const sh = rot % 180 ? bmp.width : bmp.height;
  // ảnh đã xoay
  const src = canvas(sw, sh);
  const sg = src.getContext('2d')!;
  sg.translate(sw / 2, sh / 2);
  sg.rotate((rot * Math.PI) / 180);
  sg.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  bmp.close?.();
  const crop = opts.crop ?? centerCrop(sw, sh, spec.aspect);
  const out = outputSize(crop, spec);
  const c = canvas(out.w, out.h);
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, out.w, out.h);
  const { blob, ext } = await encode(c, spec.format ?? 'webp', spec.targetBytes);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const base = safeBase(opts.name ?? spec.dir, spec.dir);
  const named = await hashedImagePath(bytes, spec.dir, base, ext);
  const res: ProcessedImage = {
    blob, bytes, path: named.path, sha256: named.sha256, w: out.w, h: out.h, ext,
    dominantColor: dominant(c), inputBytes: file.size,
    summary: `${fmtBytes(file.size)} thành ${fmtBytes(blob.size)}, ${ext === 'webp' ? 'WebP' : 'JPEG'} ${Math.max(out.w, out.h)}px`,
  };
  if (spec.lqip) {
    const l = fitWithin(out.w, out.h, 24);
    const lc = canvas(l.w, l.h);
    lc.getContext('2d')!.drawImage(c, 0, 0, l.w, l.h);
    res.lqip = lc.toDataURL('image/jpeg', 0.5);
  }
  if (spec.thumbEdge) {
    const t = fitWithin(out.w, out.h, spec.thumbEdge);
    const tc = canvas(t.w, t.h);
    const tg = tc.getContext('2d')!;
    tg.imageSmoothingQuality = 'high';
    tg.drawImage(c, 0, 0, t.w, t.h);
    const te = await encode(tc, 'webp', THUMB_TARGET);
    const tb = new Uint8Array(await te.blob.arrayBuffer());
    const tn = await hashedImagePath(tb, spec.dir, `${base}-thumb`, te.ext);
    res.thumb = { blob: te.blob, bytes: tb, path: tn.path, sha256: tn.sha256, w: t.w, h: t.h };
  }
  return res;
}

// ------------------------------------------------------------------ nhạc

export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const WARN_AUDIO_BYTES = 5 * 1024 * 1024;

/** Kiểm tra file nhạc: mp3/m4a ≤ 8MB, cảnh báo > 5MB. */
export function checkAudio(f: { name: string; type: string; size: number }): { ok: boolean; ext?: 'mp3' | 'm4a'; error?: string; warning?: string } {
  const ext = /\.mp3$/i.test(f.name) || f.type === 'audio/mpeg' ? 'mp3'
    : /\.(m4a|mp4|aac)$/i.test(f.name) || /audio\/(mp4|x-m4a|aac)/.test(f.type) ? 'm4a' : null;
  if (!ext) return { ok: false, error: 'Chỉ nhận file nhạc .mp3 hoặc .m4a.' };
  if (f.size > MAX_AUDIO_BYTES) return { ok: false, error: `File nhạc ${fmtBytes(f.size)} vượt quá 8MB. Hãy nén lại (96-128 kbps là đủ).` };
  return { ok: true, ext, ...(f.size > WARN_AUDIO_BYTES ? { warning: `File ${fmtBytes(f.size)} khá nặng; khuyên ≤ 5MB (96-128 kbps) để khách tải nhanh.` } : {}) };
}
