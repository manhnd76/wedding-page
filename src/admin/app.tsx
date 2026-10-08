/**
 * Luồng màn hình v2.3 (decisions 2026-10-08 "Đổi luồng đăng nhập admin"):
 * chưa đăng nhập -> Login (mật khẩu, so hash) -> trang quản lý ngay (không cần token).
 * Token GitHub chỉ hỏi khi cần (Xuất bản / Khôi phục) - xem `state/connection.ts`.
 * Có token "Ghi nhớ" -> mở bằng chính mật khẩu đăng nhập, dùng GitHub luôn.
 */
import { useEffect, useState } from 'preact/hooks';
import { MODE_KEY, clearSession, restoreRememberedToken } from './auth/vault';
import { clearLogin, isLoggedIn, markLoggedIn, rememberLoginPassword } from './auth/password';
import { LoginScreen } from './screens/login';
import { Editor } from './editor/editor';
import { EditorStore } from './state/store';
import { initialAdapter } from './state/connection';
import { devServerAvailable } from './storage/local-adapters';
import { Toasts, toast } from './ui/ui';

type Phase = { k: 'boot' } | { k: 'login' } | { k: 'editor'; store: EditorStore };

const deps = () => ({ session: sessionStorage, local: localStorage });

export function App() {
  const [phase, setPhase] = useState<Phase>({ k: 'boot' });
  const [dev, setDev] = useState(false);

  const openEditor = (isDev: boolean) => {
    const { adapter, expiresAt } = initialAdapter(deps(), isDev);
    setPhase({ k: 'editor', store: new EditorStore(adapter, expiresAt) });
  };

  useEffect(() => {
    void (async () => {
      const isDev = import.meta.env.DEV && (await devServerAvailable());
      setDev(isDev);
      if (isLoggedIn(sessionStorage)) openEditor(isDev);
      else setPhase({ k: 'login' });
    })();
  }, []);

  const onLogin = async (password: string) => {
    rememberLoginPassword(password);
    markLoggedIn(sessionStorage);
    const r = await restoreRememberedToken(localStorage, sessionStorage, password);
    if (r === 'dropped') toast('Token GitHub đã ghi nhớ trước đây không mở được bằng mật khẩu này. Khi Xuất bản sẽ hỏi lại token.', { ms: 7000 });
    openEditor(dev);
  };

  const logout = () => {
    clearLogin(sessionStorage);
    clearSession(sessionStorage);
    sessionStorage.removeItem(MODE_KEY);
    rememberLoginPassword(null);
    if (phase.k === 'editor') phase.store.dispose();
    setPhase({ k: 'login' });
  };

  let body;
  if (phase.k === 'boot') body = <main class="boot" aria-busy="true"><p>Đang tải…</p></main>;
  else if (phase.k === 'login') body = <LoginScreen onDone={onLogin} />;
  else body = <Editor store={phase.store} onLogout={logout} devAvailable={dev} />;

  return <>{body}<Toasts /></>;
}
