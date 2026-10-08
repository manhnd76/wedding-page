/**
 * Tìm mọi file asset (ảnh/nhạc) mà config tham chiếu, kèm "slot" (đường dẫn field) - dùng để tính
 * file cần upload / xoá khi publish (solution 3.1, 3.5) và slot trong manifest.
 */
import { repoPathOfSrc } from './manifest.ts';

export interface AssetRef { src: string; slot: string; kind: 'image' | 'thumb' | 'audio' }

const isLocal = (s: unknown): s is string => typeof s === 'string' && /^\.?\/?content\//.test(s);
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Duyệt config, trả về danh sách tham chiếu asset nằm trong `content/`. */
export function collectAssetRefs(config: unknown): AssetRef[] {
  const out: AssetRef[] = [];
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
    if (!isObj(v)) return;
    // ImageRef: có src + w/h
    if (typeof v.src === 'string' && ('w' in v || 'h' in v || 'alt' in v)) {
      if (isLocal(v.src)) out.push({ src: norm(v.src), slot: path, kind: 'image' });
      if (isLocal(v.thumb)) out.push({ src: norm(v.thumb), slot: path, kind: 'thumb' });
      return;
    }
    for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(config, '');
  const music = isObj(config) && isObj(config.music) ? config.music.src : null;
  if (isLocal(music)) out.push({ src: norm(music), slot: 'music.src', kind: 'audio' });
  return out;
}

const norm = (s: string) => s.replace(/^\.?\/+/, '');

/** Tập đường dẫn repo được config tham chiếu. */
export function referencedRepoPaths(config: unknown): Map<string, AssetRef> {
  const m = new Map<string, AssetRef>();
  for (const r of collectAssetRefs(config)) if (!m.has(repoPathOfSrc(r.src))) m.set(repoPathOfSrc(r.src), r);
  return m;
}

/**
 * Tính thay đổi asset giữa bản đang xuất bản và bản nháp:
 *  - `added`: asset nháp tham chiếu mà bản xuất bản không có (cần file: IndexedDB hoặc đã có trong tree)
 *  - `removed`: asset bản xuất bản có mà nháp bỏ (xoá khỏi public/, chuyển vào backup)
 */
export function diffAssets(published: unknown, draft: unknown): { added: AssetRef[]; removed: AssetRef[] } {
  const a = referencedRepoPaths(published);
  const b = referencedRepoPaths(draft);
  const added = [...b].filter(([p]) => !a.has(p)).map(([, r]) => r);
  const removed = [...a].filter(([p]) => !b.has(p)).map(([, r]) => r);
  return { added, removed };
}
