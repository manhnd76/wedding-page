/**
 * Màn Đăng nhập (v2.3, decisions 2026-10-08): 1 ô mật khẩu, so với hash PBKDF2 trong code.
 * Sai -> "Mật khẩu chưa đúng"; 5 lần -> khoá 30s có đếm ngược (UnlockGuard). Phiên chỉ trong tab (sessionStorage).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { UnlockGuard, VaultError, loadMonogram } from '../auth/vault';
import { checkLogin } from '../auth/password';
import { Icon } from '../ui/icons';
import { Spinner } from '../ui/ui';

export interface LoginProps {
  notice?: string | null;
  /** mật khẩu đúng (app giữ trong bộ nhớ để mở / mã hoá token "Ghi nhớ") */
  onDone: (password: string) => Promise<void> | void;
}

export function LoginScreen(p: LoginProps) {
  const guard = new UnlockGuard(localStorage);
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockLeft, setLockLeft] = useState(guard.remaining());
  const inputRef = useRef<HTMLInputElement>(null);

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
      await checkLogin(pass, guard);
      await p.onDone(pass);
    } catch (e2) {
      if (e2 instanceof VaultError) {
        setErr(e2.code === 'locked' ? e2.message : 'Mật khẩu chưa đúng');
        setLockLeft(guard.remaining());
        // sai: xoá ô, giữ focus để gõ lại (solution 2.7)
        setPass('');
        requestAnimationFrame(() => inputRef.current?.focus());
      } else setErr('Trình duyệt này không hỗ trợ đăng nhập (thiếu WebCrypto). Hãy dùng Chrome, Edge, Safari hoặc Firefox bản mới.');
      setBusy(false);
    }
  };

  // chữ lồng thật của thiệp (lưu khi vào admin lần trước, A17); chưa có -> icon ổ khoá
  const mono = loadMonogram(localStorage);
  return (
    <main class="login">
      <form class="login-card" onSubmit={(e) => void submit(e)}>
        <div class={`login-mono${mono.length > 4 ? ' login-mono--long' : ''}`} aria-hidden="true">{mono || <Icon name="lock" size={28} />}</div>
        <h1>Quản lý thiệp cưới</h1>
        {p.notice && <p class="banner banner--warn" role="alert">{p.notice}</p>}
        <div class={`field${err ? ' has-error' : ''}`}>
          <label for="login-pass">Mật khẩu</label>
          <div class="input-row">
            <input ref={inputRef} id="login-pass" class="input" type={show ? 'text' : 'password'} value={pass} autoComplete="current-password" data-testid="login-pass"
              aria-invalid={err ? true : undefined} aria-describedby={err ? 'login-err' : undefined}
              onInput={(e) => setPass((e.currentTarget as HTMLInputElement).value)} />
            <button type="button" class="icon-btn" aria-pressed={show} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow(!show)}><Icon name="eye" /></button>
          </div>
          <p class="err" id="login-err" aria-live="assertive" data-testid="login-err">{err ? `⚠ ${err}` : ''}</p>
        </div>
        <button type="submit" class="btn btn-primary btn-block" disabled={busy || lockLeft > 0 || !pass} data-testid="login-submit">
          {busy ? <><Spinner /> Đang kiểm tra…</> : lockLeft > 0 ? `Thử lại sau ${Math.ceil(lockLeft / 1000)} giây` : 'Vào trang quản lý'}
        </button>
        <p class="help">Đóng tab là phải đăng nhập lại. Quên mật khẩu: người giữ mã nguồn đặt lại bằng <code>npm run admin:hash</code> (README).</p>
      </form>
    </main>
  );
}
