/**
 * Màn Login: mở khoá vault bằng passphrase (design 8.2, solution 2.4).
 * Sai -> "Passphrase chưa đúng"; 5 lần -> khoá 30s có đếm ngược; giải mã được nhưng GitHub 401/403 -> sang 8.2b.
 */
import { useEffect, useState } from 'preact/hooks';
import { UnlockGuard, VaultError, clearVault, saveSession, unlock, type Session, type VaultRecord } from '../auth/vault';
import { GitHubAdapter } from '../storage/github';
import { Modal, Spinner } from '../ui/ui';

export interface LoginProps {
  vault: VaultRecord;
  notice?: string | null;
  onDone: (s: Session) => void;
  /** token không còn dùng được / quên passphrase -> màn Kết nối */
  onReconnect: (notice: string | null) => void;
}

export function LoginScreen(p: LoginProps) {
  const guard = new UnlockGuard(localStorage);
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockLeft, setLockLeft] = useState(guard.remaining());
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setInterval(() => setLockLeft(guard.remaining()), 500);
    return () => clearInterval(t);
  }, [lockLeft > 0]);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (busy || lockLeft > 0) return;
    setBusy(true);
    setErr(null);
    try {
      const token = await unlock(p.vault, pass, guard);
      // kiểm tra lại quyền repo (bước 1 + 4, bỏ ghi thử)
      const gh = new GitHubAdapter({ owner: p.vault.owner, repo: p.vault.repo, branch: p.vault.branch, token, knownExpiresAt: p.vault.expiresAt });
      const r = await gh.connect({ full: false });
      const bad = r.steps.find((s) => s.status === 'error');
      if (bad) {
        if (r.errorCode === 'unauthorized' || r.errorCode === 'expired' || r.errorCode === 'readonly' || r.errorCode === 'not-found') {
          p.onReconnect(bad.message);
          return;
        }
        setErr(bad.message);
        setBusy(false);
        return;
      }
      const sess: Session = { owner: p.vault.owner, repo: p.vault.repo, branch: p.vault.branch, token, expiresAt: r.expiresAt ?? p.vault.expiresAt };
      if (r.expiresAt && r.expiresAt !== p.vault.expiresAt) {
        p.vault.expiresAt = r.expiresAt;
        localStorage.setItem('wp_admin_vault_v1', JSON.stringify(p.vault));
      }
      saveSession(sessionStorage, sess);
      p.onDone(sess);
    } catch (e2) {
      if (e2 instanceof VaultError) {
        setErr(e2.code === 'locked' ? e2.message : 'Passphrase chưa đúng');
        setLockLeft(guard.remaining());
      } else setErr(String(e2));
      setBusy(false);
    }
  };

  const mono = `${p.vault.owner.slice(0, 1).toUpperCase()}&`;
  return (
    <main class="login">
      <form class="login-card" onSubmit={(e) => void submit(e)}>
        <div class="login-mono" aria-hidden="true">{mono}</div>
        <h1>Quản lý thiệp cưới</h1>
        <p class="muted">Kết nối: {p.vault.owner}/{p.vault.repo}</p>
        {p.notice && <p class="banner banner--warn" role="alert">{p.notice}</p>}
        <div class={`field${err ? ' has-error' : ''}`}>
          <label for="login-pass">Passphrase của máy này</label>
          <div class="input-row">
            <input id="login-pass" class="input" type={show ? 'text' : 'password'} value={pass} autoComplete="current-password" data-testid="login-pass"
              aria-invalid={err ? true : undefined} aria-describedby={err ? 'login-err' : undefined}
              onInput={(e) => setPass((e.currentTarget as HTMLInputElement).value)} />
            <button type="button" class="icon-btn" aria-pressed={show} aria-label={show ? 'Ẩn passphrase' : 'Hiện passphrase'} onClick={() => setShow(!show)}>👁</button>
          </div>
          {err && <p class="err" id="login-err" role="alert">⚠ {err}</p>}
        </div>
        <button type="submit" class="btn btn-primary btn-block" disabled={busy || lockLeft > 0 || !pass} data-testid="login-submit">
          {busy ? <><Spinner /> Đang mở khoá…</> : lockLeft > 0 ? `Thử lại sau ${Math.ceil(lockLeft / 1000)} giây` : 'Mở khoá'}
        </button>
        <button type="button" class="btn btn-link" onClick={() => setForgot(true)}>Quên passphrase? Kết nối lại</button>
      </form>
      <Modal open={forgot} onClose={() => setForgot(false)} title="Kết nối lại"
        footer={<>
          <button type="button" class="btn btn-ghost" onClick={() => setForgot(false)}>Huỷ</button>
          <button type="button" class="btn btn-primary" onClick={() => { clearVault(localStorage); new UnlockGuard(localStorage).reset(); p.onReconnect(null); }}>Kết nối lại</button>
        </>}>
        <p>Token đã lưu trên máy này sẽ bị xoá. Bạn cần dán lại token GitHub. Bản nháp và trang đang xuất bản không bị ảnh hưởng.</p>
      </Modal>
    </main>
  );
}
