/**
 * v2.3 - cổng đăng nhập admin (decisions 2026-10-08): hash mật khẩu, khoá tạm, phiên tab, vault mã hoá bằng mật khẩu
 * đăng nhập, script `admin:hash`, và KHÔNG có mật khẩu dạng rõ trong mã nguồn / test / bundle.
 * Mật khẩu thật đọc từ biến môi trường WP_ADMIN_TEST_PASSWORD hoặc ghép chuỗi lúc chạy (không có literal trong file).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_PASSWORD_HASH, AUTH_KEY, checkLogin, clearLogin, isLoggedIn, markLoggedIn, parseHash, pbkdf2, verifyPassword,
} from '../src/admin/auth/password';
import {
  LOCK_MS, MAX_FAILS, SESSION_KEY, UnlockGuard, VAULT_KEY, createVault, loadSession, loadVault, saveVault,
  restoreRememberedToken,
} from '../src/admin/auth/vault';
import { bytesToBase64 } from '../src/shared/storage/bytes';

const PASSWORD = process.env.WP_ADMIN_TEST_PASSWORD ?? ['manh', '111'].join('');
class Mem { m = new Map<string, string>(); getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, v); } removeItem(k: string) { this.m.delete(k); } }
const TOKEN = 'github_pat_11FAKEFAKEFAKE_notARealTokenOnlyForUnitTests000000000000000000';
const CONN = { owner: 'minhanh', repo: 'wedding', branch: 'main' };

/** hash rẻ (1000 vòng) cho test logic khoá tạm - tham số thật kiểm riêng */
async function cheapHash(pw: string): Promise<string> {
  const salt = new Uint8Array(16).fill(7);
  return `pbkdf2-sha256$1000$${bytesToBase64(salt)}$${bytesToBase64(await pbkdf2(pw, salt, 1000))}`;
}

describe('mật khẩu đăng nhập (hash PBKDF2-SHA256)', () => {
  it('hằng số hash: PBKDF2-SHA256 ≥ 600.000 vòng, salt 16 byte, hash 32 byte', () => {
    const p = parseHash(ADMIN_PASSWORD_HASH)!;
    expect(p).not.toBeNull();
    expect(p.iter).toBeGreaterThanOrEqual(600_000);
    expect(p.salt).toHaveLength(16);
    expect(p.hash).toHaveLength(32);
  });

  it('đúng mật khẩu -> true; sai / rỗng / khác hoa thường / thừa khoảng trắng -> false', async () => {
    expect(await verifyPassword(PASSWORD)).toBe(true);
    expect(await verifyPassword(`${PASSWORD}x`)).toBe(false);
    expect(await verifyPassword(PASSWORD.toUpperCase())).toBe(false);
    expect(await verifyPassword(` ${PASSWORD}`)).toBe(false);
    expect(await verifyPassword('')).toBe(false);
    expect(await verifyPassword(PASSWORD, 'không-phải-hash')).toBe(false);
  }, 30_000);

  it(`${MAX_FAILS} lần sai -> khoá ${LOCK_MS / 1000}s (kể cả mật khẩu đúng); hết khoá thì đăng nhập được, bộ đếm reset`, async () => {
    const stored = await cheapHash('dung-roi');
    const s = new Mem();
    let now = 5_000_000;
    const g = new UnlockGuard(s, () => now);
    for (let i = 1; i < MAX_FAILS; i++) await expect(checkLogin(`sai-${i}`, g, stored)).rejects.toMatchObject({ code: 'wrong-password' });
    await expect(checkLogin('sai-5', g, stored)).rejects.toMatchObject({ code: 'locked' });
    now += 1000;
    const e = await checkLogin('dung-roi', g, stored).catch((x) => x);
    expect(e.code).toBe('locked');
    expect(e.message).toMatch(/29 giây/);
    expect(new UnlockGuard(s, () => now).remaining()).toBe(LOCK_MS - 1000); // tải lại trang vẫn khoá
    now += LOCK_MS;
    await expect(checkLogin('dung-roi', g, stored)).resolves.toBeUndefined();
    expect(g.failures()).toBe(0);
  });

  it('phiên đăng nhập: sessionStorage, gắn với hash hiện tại (đổi mật khẩu -> phiên cũ hết hiệu lực)', async () => {
    const s = new Mem();
    expect(isLoggedIn(s)).toBe(false);
    markLoggedIn(s);
    expect(isLoggedIn(s)).toBe(true);
    expect(s.getItem(AUTH_KEY)).not.toContain(PASSWORD);
    expect(isLoggedIn(s, await cheapHash('mat-khau-moi'))).toBe(false);
    clearLogin(s);
    expect(isLoggedIn(s)).toBe(false);
  });

  it('`npm run admin:hash` sinh hash mà verifyPassword chấp nhận (salt ngẫu nhiên mỗi lần)', async () => {
    const pw = `thu-${Math.random().toString(36).slice(2)}-Mật khẩu`;
    const run = () => spawnSync(process.execPath, ['scripts/admin-hash.mjs', pw], { encoding: 'utf8' });
    const a = run();
    expect(a.status).toBe(0);
    const line = a.stdout.trim();
    expect(line).toMatch(/^pbkdf2-sha256\$600000\$/);
    expect(line).not.toContain(pw);
    expect(await verifyPassword(pw, line)).toBe(true);
    expect(await verifyPassword(`${pw}!`, line)).toBe(false);
    expect(run().stdout.trim()).not.toBe(line);
    const viaStdin = spawnSync(process.execPath, ['scripts/admin-hash.mjs', '--stdin'], { encoding: 'utf8', input: `${pw}\n` });
    expect(await verifyPassword(pw, viaStdin.stdout.trim())).toBe(true);
    expect(spawnSync(process.execPath, ['scripts/admin-hash.mjs'], { encoding: 'utf8', env: { ...process.env, WP_ADMIN_PASSWORD: '' } }).status).toBe(1);
  }, 30_000);
});

describe('token "Ghi nhớ" mã hoá bằng mật khẩu đăng nhập', () => {
  it('đăng nhập -> mở vault bằng chính mật khẩu -> phiên GitHub của tab; vault không chứa token/mật khẩu rõ', async () => {
    const local = new Mem();
    const session = new Mem();
    saveVault(local, await createVault(TOKEN, PASSWORD, CONN, '2027-01-12T00:00:00+07:00', { iter: 1000 }));
    const raw = local.getItem(VAULT_KEY)!;
    for (const needle of [TOKEN, PASSWORD, btoa(TOKEN).slice(0, 24)]) expect(raw).not.toContain(needle);
    expect(await restoreRememberedToken(local, session, PASSWORD)).toBe('restored');
    expect(loadSession(session)).toMatchObject({ ...CONN, token: TOKEN, expiresAt: '2027-01-12T00:00:00+07:00' });
  });

  it('vault cũ (passphrase riêng v2.2 / mật khẩu đã đổi) -> bỏ vault, không có phiên; không có vault -> none', async () => {
    const local = new Mem();
    const session = new Mem();
    saveVault(local, await createVault(TOKEN, 'passphrase-rieng-v22', CONN, null, { iter: 1000 }));
    expect(await restoreRememberedToken(local, session, PASSWORD)).toBe('dropped');
    expect(loadVault(local)).toBeNull();
    expect(session.getItem(SESSION_KEY)).toBeNull();
    expect(await restoreRememberedToken(local, session, PASSWORD)).toBe('none');
  });
});

describe('không có mật khẩu dạng rõ trong repo / bundle', () => {
  const ROOT = path.resolve(__dirname, '..');
  const TEXT = /\.(ts|tsx|js|mjs|cjs|json|html|css|md|txt|map|svg|webmanifest|_headers|_redirects)$|^_headers$|^_redirects$/;
  const SKIP = new Set(['node_modules', '.git', 'test-results', 'playwright-report', '.vite', '.vite-e2e']);
  function* walk(p: string): Generator<string> {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isFile()) { if (TEXT.test(path.basename(p))) yield p; return; }
    for (const n of readdirSync(p)) if (!SKIP.has(n)) yield* walk(path.join(p, n));
  }
  it('src/, tests/, scripts/, public/, admin/, README, index.html, dist/ (nếu đã build)', () => {
    const roots = ['src', 'tests', 'scripts', 'public', 'admin', 'index.html', 'README.md', 'package.json', 'vite.config.ts', 'dist'];
    const hits: string[] = [];
    let n = 0;
    for (const r of roots) {
      for (const f of walk(path.join(ROOT, r))) {
        n++;
        const t = readFileSync(f, 'utf8');
        if (t.includes(PASSWORD) || t.includes(btoa(PASSWORD))) hits.push(path.relative(ROOT, f));
      }
    }
    expect(n).toBeGreaterThan(50);
    expect(hits).toEqual([]);
  });
});
