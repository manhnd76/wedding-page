/**
 * Luồng màn hình (solution 2.4): có phiên -> trang quản lý; có vault -> Login; không -> Kết nối lần đầu.
 * Chế độ không kết nối (Download) và máy chủ dev (DevServer, chỉ `vite dev`).
 */
import { useEffect, useState } from 'preact/hooks';
import { clearSession, loadSession, loadVault, type Session } from './auth/vault';
import { ConnectScreen } from './screens/connect';
import { LoginScreen } from './screens/login';
import { Editor } from './editor/editor';
import { EditorStore } from './state/store';
import { GitHubAdapter } from './storage/github';
import { DevServerAdapter, DownloadAdapter, devServerAvailable } from './storage/local-adapters';
import { Toasts, toast } from './ui/ui';

const MODE_KEY = 'wp_admin_mode_v1';
type Phase =
  | { k: 'boot' }
  | { k: 'connect'; notice: string | null }
  | { k: 'login'; notice: string | null }
  | { k: 'editor'; store: EditorStore };

export function App() {
  const [phase, setPhase] = useState<Phase>({ k: 'boot' });
  const [dev, setDev] = useState(false);

  const openEditor = (store: EditorStore) => {
    store.onAuthLost = (e) => {
      clearSession(sessionStorage);
      toast('Phiên đã hết, mở khoá lại để tiếp tục. Bản nháp vẫn còn.', { tone: 'err', ms: 6000 });
      setPhase(loadVault(localStorage) ? { k: 'login', notice: e.message } : { k: 'connect', notice: e.message });
    };
    setPhase({ k: 'editor', store });
  };
  const github = (s: Session) => openEditor(new EditorStore(new GitHubAdapter({ ...s, knownExpiresAt: s.expiresAt }), s.expiresAt));
  const offline = () => { sessionStorage.setItem(MODE_KEY, 'download'); openEditor(new EditorStore(new DownloadAdapter())); };
  const devMode = () => { sessionStorage.setItem(MODE_KEY, 'dev'); openEditor(new EditorStore(new DevServerAdapter())); };

  useEffect(() => {
    void (async () => {
      const isDev = import.meta.env.DEV && (await devServerAvailable());
      setDev(isDev);
      const mode = sessionStorage.getItem(MODE_KEY);
      if (mode === 'dev' && isDev) return devMode();
      if (mode === 'download') return offline();
      const sess = loadSession(sessionStorage);
      if (sess) return github(sess);
      setPhase(loadVault(localStorage) ? { k: 'login', notice: null } : { k: 'connect', notice: null });
    })();
  }, []);

  const logout = () => {
    clearSession(sessionStorage);
    sessionStorage.removeItem(MODE_KEY);
    if (phase.k === 'editor') phase.store.dispose();
    setPhase(loadVault(localStorage) ? { k: 'login', notice: null } : { k: 'connect', notice: null });
  };

  let body;
  if (phase.k === 'boot') body = <main class="boot" aria-busy="true"><p>Đang tải…</p></main>;
  else if (phase.k === 'connect') {
    body = <ConnectScreen notice={phase.notice} onDone={github} onOffline={offline} onDevServer={dev ? devMode : null} />;
  } else if (phase.k === 'login') {
    const v = loadVault(localStorage);
    body = v
      ? <LoginScreen vault={v} notice={phase.notice} onDone={github} onReconnect={(n) => setPhase({ k: 'connect', notice: n })} />
      : <ConnectScreen notice={phase.notice} onDone={github} onOffline={offline} onDevServer={dev ? devMode : null} />;
  } else body = <Editor store={phase.store} onLogout={logout} />;

  return <>{body}<Toasts /></>;
}
