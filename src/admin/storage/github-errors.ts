/**
 * Bảng xử lý lỗi GitHub (solution 2.5, design 8.2b): mã HTTP + header -> StorageError có câu dễ hiểu.
 * Mã thô chỉ nằm trong `detail` ("Chi tiết kỹ thuật").
 */
import { StorageError } from './adapter';

export const MSG = {
  unauthorized: 'Token không đúng. Hãy sao chép lại toàn bộ token từ GitHub.',
  expired: (d: string) => `Token đã hết hạn ngày ${d}. Hãy tạo token mới.`,
  readonly: 'Token chỉ có quyền đọc. Cần bật Contents: Read and write.',
  notFound: (o: string, r: string) => `Không thấy repo ${o}/${r}. Kiểm tra lại tên, hoặc token chưa được cấp quyền cho repo này.`,
  branch: (b: string, list: string[]) =>
    list.length ? `Repo không có nhánh '${b}'. Các nhánh hiện có: ${list.join(', ')}.` : `Repo không có nhánh '${b}'.`,
  empty: 'Repo đang trống, hãy tạo commit đầu tiên (đẩy mã nguồn dự án) rồi thử lại.',
  conflict: 'Trang vừa được xuất bản từ nơi khác. Tải lại để xem bản mới nhất.',
  rate: (min: number) => `GitHub tạm giới hạn, thử lại sau khoảng ${min} phút.`,
  offline: 'Không kết nối được tới GitHub. Kiểm tra mạng rồi thử lại.',
  server: 'GitHub đang gặp sự cố. Hãy thử lại sau ít phút, hoặc tải file cấu hình về máy.',
  unknown: 'Có lỗi không mong muốn khi làm việc với GitHub.',
  noBackup: 'Chưa có bản sao lưu. Bản sao lưu được tạo tự động mỗi lần Xuất bản.',
} as const;

/** dd/mm/yyyy theo giờ Việt Nam. */
export function viDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
}

/**
 * Header `github-authentication-token-expiration`: "2026-12-01 10:00:00 +0700" hoặc "... UTC".
 * Trả ISO hoặc null.
 */
export function parseExpiryHeader(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\s*(UTC|Z|[+-]\d{2}:?\d{2})?$/.exec(v.trim());
  if (!m) return null;
  let tz = m[3] ?? 'Z';
  if (tz === 'UTC') tz = 'Z';
  else if (/^[+-]\d{4}$/.test(tz)) tz = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  const d = new Date(`${m[1]}T${m[2]}${tz}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export interface ClassifyCtx {
  /** thao tác ghi (POST blobs/trees/commits, PATCH ref) -> 404/403 = thiếu quyền ghi */
  write?: boolean;
  /** đang PATCH ref -> 409/422 = xung đột */
  ref?: boolean;
  owner?: string;
  repo?: string;
  /** hạn token đã biết (vault) để báo "đã hết hạn" khi 401 */
  knownExpiresAt?: string | null;
  now?: number;
}

/** true nếu là rate limit chính (remaining = 0). */
export function isPrimaryRateLimit(res: Pick<Response, 'status' | 'headers'>): boolean {
  return (res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0';
}
/** rate limit phụ: có retry-after. */
export function secondaryRetryAfter(res: Pick<Response, 'status' | 'headers'>): number | null {
  if (res.status !== 403 && res.status !== 429) return null;
  const ra = res.headers.get('retry-after');
  if (ra === null) return null;
  const n = Number(ra);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Dịch response lỗi -> StorageError (không ném). */
export function classify(res: Pick<Response, 'status' | 'headers'>, body: string, c: ClassifyCtx = {}): StorageError {
  const s = res.status;
  const detail = `HTTP ${s}${body ? `: ${body.slice(0, 300)}` : ''}`;
  const now = c.now ?? Date.now();
  if (isPrimaryRateLimit(res)) {
    const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0) * 1000;
    const min = Math.max(1, Math.ceil((reset - now) / 60000));
    return new StorageError('rate-limit', MSG.rate(min), detail, { status: s, retryAt: reset || now + 60000 });
  }
  const ra = secondaryRetryAfter(res);
  if (ra !== null) {
    return new StorageError('rate-limit', MSG.rate(Math.max(1, Math.ceil(ra / 60))), detail, { status: s, retryAt: now + ra * 1000 });
  }
  if (s === 401) {
    const exp = c.knownExpiresAt ? new Date(c.knownExpiresAt).getTime() : NaN;
    if (Number.isFinite(exp) && exp <= now) return new StorageError('expired', MSG.expired(viDate(c.knownExpiresAt!)), detail, { status: s });
    return new StorageError('unauthorized', MSG.unauthorized, detail, { status: s });
  }
  if ((s === 409 || s === 422) && c.ref) return new StorageError('conflict', MSG.conflict, detail, { status: s });
  if (s === 409 && /empty/i.test(body)) return new StorageError('empty', MSG.empty, detail, { status: s });
  if (s === 409) return new StorageError('conflict', MSG.conflict, detail, { status: s });
  if (s === 403) return new StorageError('readonly', MSG.readonly, detail, { status: s });
  if (s === 404) {
    if (c.write) return new StorageError('readonly', MSG.readonly, detail, { status: s });
    return new StorageError('not-found', MSG.notFound(c.owner ?? '?', c.repo ?? '?'), detail, { status: s });
  }
  if (s >= 500) return new StorageError('server', MSG.server, detail, { status: s });
  return new StorageError('unknown', MSG.unknown, detail, { status: s });
}

export function offlineError(e: unknown): StorageError {
  return new StorageError('offline', MSG.offline, e instanceof Error ? `${e.name}: ${e.message}` : String(e));
}
