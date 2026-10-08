/**
 * Cổng đăng nhập trang quản lý (decisions 2026-10-08 "Đổi luồng đăng nhập admin").
 * Mật khẩu chỉ có dạng hash PBKDF2-HMAC-SHA-256 (salt cố định nằm trong hằng số) - không có chuỗi rõ trong repo/bundle.
 * Đổi mật khẩu: `npm run admin:hash -- "<mật khẩu mới>"` rồi thay `ADMIN_PASSWORD_HASH` (README).
 *
 * Lưu ý: site tĩnh nên ai cũng tải được bundle và hash; đây là cổng phía client (chặn người lạ mở /admin),
 * không phải lớp bảo mật thật. Quyền ghi vẫn nằm ở token GitHub (solution 2.1).
 */
import { ab, base64ToBytes, utf8 } from '@shared/storage/bytes';
import { MAX_FAILS, UnlockGuard, VaultError } from './vault';

/** pbkdf2-sha256$<vòng>$<salt b64>$<hash b64> - sinh bằng `npm run admin:hash`. */
export const ADMIN_PASSWORD_HASH = 'pbkdf2-sha256$600000$9m14GHueDKcQedwFK/m1bA==$rDViQYxpSFcUvcobrb1NYIJi+PpSVVm2o8QGGgGMwrc=';

/** sessionStorage: đã đăng nhập trong tab này (đóng tab là phải đăng nhập lại). */
export const AUTH_KEY = 'wp_admin_auth_v1';

interface ParsedHash { iter: number; salt: Uint8Array; hash: Uint8Array }

export function parseHash(s: string): ParsedHash | null {
  const m = /^pbkdf2-sha256\$(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/.exec(s.trim());
  if (!m) return null;
  const iter = Number(m[1]);
  if (!Number.isSafeInteger(iter) || iter < 1000) return null;
  try { return { iter, salt: base64ToBytes(m[2]!), hash: base64ToBytes(m[3]!) }; } catch { return null; }
}

export async function pbkdf2(password: string, salt: Uint8Array, iter: number, bytes = 32): Promise<Uint8Array> {
  const subtle = globalThis.crypto.subtle;
  const key = await subtle.importKey('raw', ab(utf8(password.normalize('NFC'))), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: ab(salt), iterations: iter }, key, bytes * 8));
}

/** So khớp mật khẩu với hash (so sánh hết độ dài, không dừng sớm). */
export async function verifyPassword(password: string, stored = ADMIN_PASSWORD_HASH): Promise<boolean> {
  const p = parseHash(stored);
  if (!p || !password) return false;
  const got = await pbkdf2(password, p.salt, p.iter, p.hash.length);
  let diff = got.length ^ p.hash.length;
  for (let i = 0; i < p.hash.length; i++) diff |= (got[i] ?? 0) ^ p.hash[i]!;
  return diff === 0;
}

/**
 * Đăng nhập có khoá tạm: 5 lần sai -> khoá 30 giây (tái dùng UnlockGuard của vault, chỉ là UX phía client).
 * Sai -> VaultError('wrong-password'); đang khoá -> VaultError('locked').
 */
export async function checkLogin(password: string, guard: UnlockGuard, stored = ADMIN_PASSWORD_HASH): Promise<void> {
  const rem = guard.remaining();
  if (rem > 0) throw new VaultError('locked', `Nhập sai nhiều lần. Thử lại sau ${Math.ceil(rem / 1000)} giây.`, rem);
  if (await verifyPassword(password, stored)) { guard.reset(); return; }
  guard.recordFailure();
  const r = guard.remaining();
  if (r > 0) throw new VaultError('locked', `Nhập sai ${MAX_FAILS} lần. Thử lại sau ${Math.ceil(r / 1000)} giây.`, r);
  throw new VaultError('wrong-password', 'Mật khẩu chưa đúng.');
}

// ------------------------------------------------------------------ phiên đăng nhập (sessionStorage)

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Gắn phiên với hash hiện tại: đổi mật khẩu (hash mới) thì phiên cũ hết hiệu lực. */
const tag = (stored: string) => stored.slice(-16);

export function isLoggedIn(s: KV, stored = ADMIN_PASSWORD_HASH): boolean {
  try {
    const v = JSON.parse(s.getItem(AUTH_KEY) ?? 'null') as { v?: number; k?: string } | null;
    return !!v && v.v === 1 && v.k === tag(stored);
  } catch { return false; }
}
export function markLoggedIn(s: KV, stored = ADMIN_PASSWORD_HASH): void {
  s.setItem(AUTH_KEY, JSON.stringify({ v: 1, k: tag(stored), at: new Date().toISOString() }));
}
export const clearLogin = (s: KV) => s.removeItem(AUTH_KEY);

// ------------------------------------------------------------------ mật khẩu trong bộ nhớ (để mã hoá token "Ghi nhớ")

let memPassword: string | null = null;
/** Giữ mật khẩu vừa đăng nhập CHỈ trong bộ nhớ của trang (tải lại trang là mất; khi cần sẽ hỏi lại). */
export const rememberLoginPassword = (p: string | null) => { memPassword = p; };
export const loginPassword = () => memPassword;
