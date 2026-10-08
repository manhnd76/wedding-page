import { describe, expect, it } from 'vitest';
import {
  LOCK_MS, MAX_FAILS, PBKDF2_ITER, UnlockGuard, VaultError, createVault, loadVault, openVault, parseRepoInput,
  saveVault, tokenKind, unlock, VAULT_KEY,
} from '../src/admin/auth/vault';
import { base64ToBytes } from '../src/shared/storage/bytes';

class Mem { m = new Map<string, string>(); getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, v); } removeItem(k: string) { this.m.delete(k); } }
const TOKEN = 'github_pat_11ABCDEFG0FAKEFAKEFAKE_notARealTokenJustForUnitTests1234567890';
const CONN = { owner: 'minhanh', repo: 'wedding', branch: 'main' };
const FAST = { iter: 1000 }; // test logic khoá tạm nhanh; tham số thật kiểm riêng

describe('vault (solution 2.4)', () => {
  it('tham số mặc định: PBKDF2-SHA256 600.000 vòng, salt 16 byte, IV 12 byte; mở được bằng đúng passphrase', async () => {
    const v = await createVault(TOKEN, 'mật khẩu dài 123', CONN, '2027-01-12T00:00:00+07:00');
    expect(v).toMatchObject({ v: 1, kdf: 'PBKDF2-SHA256', iter: PBKDF2_ITER, owner: 'minhanh', repo: 'wedding', branch: 'main', expiresAt: '2027-01-12T00:00:00+07:00' });
    expect(PBKDF2_ITER).toBe(600_000);
    expect(base64ToBytes(v.salt)).toHaveLength(16);
    expect(base64ToBytes(v.iv)).toHaveLength(12);
    expect(await openVault(v, 'mật khẩu dài 123')).toBe(TOKEN);
  }, 30_000);

  it('sai passphrase bị từ chối (VaultError wrong-passphrase)', async () => {
    const v = await createVault(TOKEN, 'dung-passphrase', CONN, null, FAST);
    const e = await openVault(v, 'sai-passphrase').catch((x) => x);
    expect(e).toBeInstanceOf(VaultError);
    expect(e.code).toBe('wrong-passphrase');
  });

  it('ciphertext gắn với repo (additionalData): đổi owner/repo -> không mở được', async () => {
    const v = await createVault(TOKEN, 'dung-passphrase', CONN, null, FAST);
    await expect(openVault({ ...v, repo: 'repo-khac' }, 'dung-passphrase')).rejects.toMatchObject({ code: 'wrong-passphrase' });
  });

  it('ciphertext KHÔNG chứa token dạng rõ (kể cả base64) - kiểm cả localStorage', async () => {
    const v = await createVault(TOKEN, 'dung-passphrase', CONN, null, FAST);
    const s = new Mem();
    saveVault(s, v);
    const stored = s.getItem(VAULT_KEY)!;
    for (const needle of [TOKEN, TOKEN.slice(0, 20), btoa(TOKEN), btoa(TOKEN).slice(0, 20), 'dung-passphrase']) expect(stored).not.toContain(needle);
    expect(loadVault(s)?.ct).toBe(v.ct);
    // 2 lần mã hoá cùng token -> ciphertext khác nhau (salt + IV ngẫu nhiên)
    const v2 = await createVault(TOKEN, 'dung-passphrase', CONN, null, FAST);
    expect(v2.ct).not.toBe(v.ct);
    expect(v2.iv).not.toBe(v.iv);
  });

  it('v2.3: không còn yêu cầu passphrase ≥ 8 ký tự (khoá = mật khẩu đăng nhập, đã kiểm bằng hash)', async () => {
    const v = await createVault(TOKEN, 'ngan', CONN, null, FAST);
    expect(await openVault(v, 'ngan')).toBe(TOKEN);
  });

  it(`${MAX_FAILS} lần sai -> khoá ${LOCK_MS / 1000}s có đếm ngược; hết khoá thì thử lại được; đúng thì reset`, async () => {
    const v = await createVault(TOKEN, 'dung-passphrase', CONN, null, FAST);
    let now = 1_000_000;
    const s = new Mem();
    const g = new UnlockGuard(s, () => now);
    for (let i = 1; i < MAX_FAILS; i++) {
      await expect(unlock(v, `sai-${i}`, g)).rejects.toMatchObject({ code: 'wrong-passphrase' });
      expect(g.remaining()).toBe(0);
    }
    const fifth = await unlock(v, 'sai-5', g).catch((x) => x);
    expect(fifth.code).toBe('locked');
    expect(g.remaining()).toBe(LOCK_MS);
    // đang khoá: kể cả passphrase đúng cũng bị chặn, không thử giải mã
    now += 10_000;
    const locked = await unlock(v, 'dung-passphrase', g).catch((x) => x);
    expect(locked.code).toBe('locked');
    expect(locked.message).toMatch(/20 giây/);
    // tải lại trang (guard mới, cùng storage) vẫn khoá
    expect(new UnlockGuard(s, () => now).remaining()).toBe(20_000);
    now += 20_001;
    expect(await unlock(v, 'dung-passphrase', g)).toBe(TOKEN);
    expect(g.failures()).toBe(0);
  });

  it('tách owner/repo khi dán link; nhận diện loại token', () => {
    expect(parseRepoInput('https://github.com/minhanh/wedding', '')).toEqual({ owner: 'minhanh', repo: 'wedding' });
    expect(parseRepoInput('github.com/a-b/c.git', '')).toEqual({ owner: 'a-b', repo: 'c' });
    expect(parseRepoInput(' minhanh ', ' wedding ')).toEqual({ owner: 'minhanh', repo: 'wedding' });
    expect(tokenKind('github_pat_x')).toBe('fine-grained');
    expect(tokenKind('ghp_x')).toBe('classic');
    expect(tokenKind('  ')).toBe('empty');
  });
});
