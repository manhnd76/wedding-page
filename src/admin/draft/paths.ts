/** Đọc/ghi giá trị theo đường dẫn field kiểu `content.album.images[3].alt` (bất biến - trả bản sao). */

export type PathPart = string | number;

export function parsePath(path: string): PathPart[] {
  const out: PathPart[] = [];
  for (const seg of path.split('.')) {
    const re = /([^[\]]+)|\[(\d+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg))) out.push(m[2] !== undefined ? Number(m[2]) : m[1]!);
  }
  return out;
}

export function getAt(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const p of parsePath(path)) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string | number, unknown>)[p];
  }
  return cur;
}

/** Trả object mới với giá trị tại path đổi (copy-on-write theo nhánh). */
export function setAt<T>(obj: T, path: string, value: unknown): T {
  const parts = parsePath(path);
  const rec = (cur: unknown, i: number): unknown => {
    if (i === parts.length) return value;
    const p = parts[i]!;
    const base: Record<string | number, unknown> | unknown[] = Array.isArray(cur)
      ? [...cur]
      : cur && typeof cur === 'object' ? { ...(cur as object) } : typeof p === 'number' ? [] : {};
    (base as Record<string | number, unknown>)[p] = rec((cur as Record<string | number, unknown> | undefined)?.[p], i + 1);
    return base;
  };
  return rec(obj, 0) as T;
}

export const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

export const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
