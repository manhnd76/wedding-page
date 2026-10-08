/**
 * Vault: mã hoá token GitHub bằng passphrase (solution 2.4).
 * PBKDF2-HMAC-SHA-256 600.000 vòng, salt 16 byte -> khoá AES-GCM 256 (không extractable),
 * IV 12 byte mỗi lần, tag 128 bit, additionalData = "{owner}/{repo}". Không lưu passphrase.
 */
import { ab, base64ToBytes, bytesToBase64, utf8 } from '@shared/storage/bytes';

export const VAULT_KEY = 'wp_admin_vault_v1';
export const CONN_KEY = 'wp_admin_conn_v1';
export const SESSION_KEY = 'wp_admin_session_v1';
export const LOCK_KEY = 'wp_admin_lock_v1';
export const PBKDF2_ITER = 600_000;
export const MIN_PASSPHRASE = 8;

export interface VaultRecord {
  v: 1;
  kdf: 'PBKDF2-SHA256';
  iter: number;
  salt: string;
  iv: string;
  ct: string;
  owner: string;
  repo: string;
  branch: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface ConnInfo { owner: string; repo: string; branch: string }

export class VaultError extends Error {
  constructor(public code: 'wrong-passphrase' | 'locked' | 'invalid' | 'weak', message: string, public retryInMs = 0) {
    super(message);
    this.name = 'VaultError';
  }
}

const subtle = () => globalThis.crypto.subtle;
const rand = (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(n));

async function deriveKey(passphrase: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await subtle().importKey('raw', ab(utf8(passphrase.normalize('NFC'))), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: ab(salt), iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

const aad = (c: ConnInfo) => ab(utf8(`${c.owner}/${c.repo}`));

/** Độ mạnh passphrase dạng chữ (design 8.2b): Yếu / Được / Tốt. */
export function passphraseStrength(p: string): 'Yếu' | 'Được' | 'Tốt' {
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  if (p.length >= 14 || (p.length >= 10 && kinds >= 3)) return 'Tốt';
  if (p.length >= 8 && kinds >= 2) return 'Được';
  return 'Yếu';
}

export async function createVault(
  token: string, passphrase: string, conn: ConnInfo, expiresAt: string | null,
  opts: { iter?: number; now?: () => Date } = {},
): Promise<VaultRecord> {
  if (passphrase.length < MIN_PASSPHRASE) throw new VaultError('weak', `Passphrase cần ít nhất ${MIN_PASSPHRASE} ký tự.`);
  const iter = opts.iter ?? PBKDF2_ITER;
  const salt = rand(16);
  const iv = rand(12);
  const key = await deriveKey(passphrase, salt, iter);
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv: ab(iv), additionalData: aad(conn), tagLength: 128 }, key, ab(utf8(token)));
  return {
    v: 1, kdf: 'PBKDF2-SHA256', iter, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ct: bytesToBase64(new Uint8Array(ct)),
    owner: conn.owner, repo: conn.repo, branch: conn.branch, expiresAt, createdAt: (opts.now?.() ?? new Date()).toISOString(),
  };
}

/** Giải mã. Sai passphrase (hoặc vault bị sửa / sai repo) -> VaultError('wrong-passphrase'). */
export async function openVault(rec: VaultRecord, passphrase: string): Promise<string> {
  if (rec.v !== 1 || rec.kdf !== 'PBKDF2-SHA256') throw new VaultError('invalid', 'Dữ liệu token đã lưu không đọc được. Hãy kết nối lại.');
  const key = await deriveKey(passphrase, base64ToBytes(rec.salt), rec.iter);
  try {
    const pt = await subtle().decrypt(
      { name: 'AES-GCM', iv: ab(base64ToBytes(rec.iv)), additionalData: aad(rec), tagLength: 128 },
      key, ab(base64ToBytes(rec.ct)),
    );
    return new TextDecoder().decode(pt);
  } catch {
    throw new VaultError('wrong-passphrase', 'Passphrase chưa đúng.');
  }
}

// ------------------------------------------------------------------ lưu trữ

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadVault(s: KV): VaultRecord | null {
  try {
    const v = JSON.parse(s.getItem(VAULT_KEY) ?? 'null') as VaultRecord | null;
    return v && v.v === 1 && typeof v.ct === 'string' ? v : null;
  } catch { return null; }
}
export const saveVault = (s: KV, v: VaultRecord) => s.setItem(VAULT_KEY, JSON.stringify(v));
export const clearVault = (s: KV) => s.removeItem(VAULT_KEY);

export function loadConn(s: KV): ConnInfo | null {
  try {
    const v = JSON.parse(s.getItem(CONN_KEY) ?? 'null') as ConnInfo | null;
    return v && typeof v.owner === 'string' ? v : null;
  } catch { return null; }
}
export const saveConn = (s: KV, c: ConnInfo) => s.setItem(CONN_KEY, JSON.stringify({ owner: c.owner, repo: c.repo, branch: c.branch }));

/** Phiên: token chỉ trong bộ nhớ + sessionStorage của tab (mất khi đóng tab). */
export interface Session extends ConnInfo { token: string; expiresAt: string | null }
export function loadSession(s: KV): Session | null {
  try {
    const v = JSON.parse(s.getItem(SESSION_KEY) ?? 'null') as Session | null;
    return v && typeof v.token === 'string' && v.token ? v : null;
  } catch { return null; }
}
export const saveSession = (s: KV, v: Session) => s.setItem(SESSION_KEY, JSON.stringify(v));
export const clearSession = (s: KV) => s.removeItem(SESSION_KEY);

// ------------------------------------------------------------------ khoá tạm sau 5 lần sai

export const MAX_FAILS = 5;
export const LOCK_MS = 30_000;

/**
 * 5 lần sai -> khoá 30 giây (chỉ là UX phía client, không phải bảo mật thật - solution 2.4).
 * Trạng thái lưu localStorage để tải lại trang không xoá được bộ đếm.
 */
export class UnlockGuard {
  constructor(private s: KV, private now: () => number = Date.now) {}
  private read(): { fails: number; lockedUntil: number } {
    try {
      const v = JSON.parse(this.s.getItem(LOCK_KEY) ?? 'null') as { fails: number; lockedUntil: number } | null;
      return v && typeof v.fails === 'number' ? v : { fails: 0, lockedUntil: 0 };
    } catch { return { fails: 0, lockedUntil: 0 }; }
  }
  private write(v: { fails: number; lockedUntil: number }) { this.s.setItem(LOCK_KEY, JSON.stringify(v)); }
  /** ms còn bị khoá (0 = không khoá). */
  remaining(): number {
    return Math.max(0, this.read().lockedUntil - this.now());
  }
  failures(): number { return this.read().fails; }
  recordFailure(): void {
    const v = this.read();
    if (v.lockedUntil && v.lockedUntil <= this.now()) { v.fails = 0; v.lockedUntil = 0; }
    v.fails += 1;
    if (v.fails >= MAX_FAILS) { v.lockedUntil = this.now() + LOCK_MS; v.fails = 0; }
    this.write(v);
  }
  reset(): void { this.s.removeItem(LOCK_KEY); }
}

/**
 * Mở khoá có kiểm tra khoá tạm: đang khoá -> VaultError('locked'); sai -> ghi nhận + ném lại.
 */
export async function unlock(rec: VaultRecord, passphrase: string, guard: UnlockGuard): Promise<string> {
  const rem = guard.remaining();
  if (rem > 0) throw new VaultError('locked', `Nhập sai nhiều lần. Thử lại sau ${Math.ceil(rem / 1000)} giây.`, rem);
  try {
    const t = await openVault(rec, passphrase);
    guard.reset();
    return t;
  } catch (e) {
    if (e instanceof VaultError && e.code === 'wrong-passphrase') {
      guard.recordFailure();
      const r = guard.remaining();
      if (r > 0) throw new VaultError('locked', `Nhập sai ${MAX_FAILS} lần. Thử lại sau ${Math.ceil(r / 1000)} giây.`, r);
    }
    throw e;
  }
}

/** Tách owner/repo khi dán link `https://github.com/<owner>/<repo>` (design 8.2b). */
export function parseRepoInput(owner: string, repo: string): { owner: string; repo: string } {
  const m = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/i.exec(owner.trim());
  if (m) return { owner: m[1]!, repo: m[2]!.replace(/\.git$/i, '') };
  return { owner: owner.trim(), repo: repo.trim().replace(/\.git$/i, '') };
}

/** Nhận diện loại token (design 8.2b). */
export function tokenKind(t: string): 'fine-grained' | 'classic' | 'other' | 'empty' {
  const s = t.trim();
  if (!s) return 'empty';
  if (s.startsWith('github_pat_')) return 'fine-grained';
  if (s.startsWith('ghp_')) return 'classic';
  return 'other';
}
