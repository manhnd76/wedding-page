/** "Xem thay đổi" dễ đọc (design 8.8): "Lời cảm ơn › Tiêu đề: 'A' thành 'B'". */
import { labelForPath } from '@shared/config/schema-meta';
import { enumLabel, hasEnumLabels } from '@shared/labels';

export interface DiffItem { path: string; label: string; before: unknown; after: unknown; text: string }

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Mảng nguyên tử: so sánh cả mảng (thứ tự section, gợi ý, loại hạt). */
const ATOMIC_ARRAYS = new Set(['sections.items', 'effects.particles.types', 'content.guestbook.suggestions']);
/** Đối tượng nguyên tử (ImageRef): đổi ảnh = 1 dòng. */
const isImageRef = (v: unknown) => isObj(v) && typeof v.src === 'string' && ('w' in v || 'alt' in v);

function flatten(v: unknown, path: string, out: Map<string, unknown>) {
  if (path && (ATOMIC_ARRAYS.has(path) || isImageRef(v))) { out.set(path, v); return; }
  if (Array.isArray(v)) {
    if (v.length === 0) out.set(path, v);
    v.forEach((x, i) => flatten(x, `${path}[${i}]`, out));
    return;
  }
  if (isObj(v)) {
    const keys = Object.keys(v);
    if (keys.length === 0 && path) out.set(path, v);
    for (const k of keys) flatten(v[k], path ? `${path}.${k}` : k, out);
    return;
  }
  out.set(path, v);
}

export function fmt(v: unknown, path = ''): string {
  if (v === null || v === undefined || v === '') return '(trống)';
  // giá trị enum -> nhãn tiếng Việt (không lộ mã thô: A07)
  const el = enumLabel(path, v);
  if (el) return el;
  if (Array.isArray(v) && hasEnumLabels(path) && v.every((x) => typeof x === 'string')) {
    return v.length ? v.map((x) => enumLabel(path, x) ?? String(x)).join(', ') : '(trống)';
  }
  if (typeof v === 'boolean') return v ? 'Bật' : 'Tắt';
  if (isImageRef(v)) return `ảnh ${String((v as Obj).src).split('/').pop()}`;
  if (typeof v === 'string') return `"${v.length > 60 ? `${v.slice(0, 57)}…` : v}"`;
  if (Array.isArray(v)) return `${v.length} mục`;
  return JSON.stringify(v).slice(0, 60);
}

/** Danh sách thay đổi giữa 2 config (bỏ qua publish.*). */
export function diffConfigs(before: unknown, after: unknown, ignore: string[] = ['publish']): DiffItem[] {
  const a = new Map<string, unknown>();
  const b = new Map<string, unknown>();
  flatten(before, '', a);
  flatten(after, '', b);
  const paths = new Set([...a.keys(), ...b.keys()]);
  const out: DiffItem[] = [];
  for (const p of paths) {
    if (ignore.some((x) => p === x || p.startsWith(`${x}.`))) continue;
    const x = a.get(p);
    const y = b.get(p);
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    const label = labelForPath(p);
    let text: string;
    if (p === 'sections.items') text = `${label}: đã đổi`;
    else if (x === undefined) text = `${label}: thêm ${fmt(y, p)}`;
    else if (y === undefined) text = `${label}: xoá ${fmt(x, p)}`;
    else text = `${label}: ${fmt(x, p)} thành ${fmt(y, p)}`;
    out.push({ path: p, label, before: x, after: y, text });
  }
  return out.sort((m, n) => m.path.localeCompare(n.path));
}
