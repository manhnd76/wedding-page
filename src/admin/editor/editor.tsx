/**
 * Khung trang quản lý (design 8.3-8.5, 8.8): top bar trạng thái + Xuất bản, sidebar IA, form, live preview.
 * ≥ 1200px: 3 cột; 768-1199px: preview ẩn/hiện; < 768px: bottom tab Chỉnh sửa · Xem trước · Thêm.
 */
import type { ComponentType } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { FORM_GROUPS, groupById } from '@shared/config/schema-meta';
import { saveMonogram } from '../auth/vault';
import type { EditorStore } from '../state/store';
import { useStore } from '../state/store';
import { ConnectionFlow, type ConnectRequest, type GhAction } from '../state/connection';
import type { Session } from '../auth/vault';
import type { ConnectProps } from '../screens/connect';
import { Modal, Spinner, toast } from '../ui/ui';
import { Icon, type IconName } from '../ui/icons';
import { Preview, type PreviewApi } from './preview';
import { GroupForm } from './form';
import { Overview } from './routes/overview';
import { SectionsRoute } from './routes/sections';
import { PublishDialog } from './publish-dialog';
import { publishLabel, statusOf } from './status';

const CONTENT_IDS = ['cover', 'hero', 'couple', 'families', 'announcement', 'events', 'countdown', 'timeline', 'loveStory', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer'];

const isCompact = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 767px)').matches;

/** Route nặng tải lười (solution 9.1: gallery/hiệu ứng/crop lazy). */
const LAZY: Record<string, () => Promise<{ default: ComponentType<RouteProps> }>> = {
  theme: () => import('./routes/theme'),
  fonts: () => import('./routes/fonts'),
  effects: () => import('./routes/effects'),
  music: () => import('./routes/music'),
  media: () => import('./routes/media'),
  links: () => import('./routes/links'),
  backup: () => import('./routes/backup'),
  json: () => import('./routes/json'),
  album: () => import('./routes/album'),
};

export interface PeekAction { label: string; run: () => void }
export interface RouteProps {
  store: EditorStore;
  go: (r: string) => void;
  preview: PreviewApi;
  /**
   * Sau một lựa chọn "chọn = phát" (theme, kiểu mở, hạt…): trên mobile hiện toast có nút [Xem ↗] chuyển sang tab
   * Xem trước (preview đang ẩn giữ lại hiệu ứng và phát khi hiện - A05). Desktop: chỉ toast khi có `actions`.
   */
  peek: (text: string, actions?: PeekAction[]) => void;
  /** thao tác cần GitHub (Khôi phục…): chưa kết nối -> mở màn Kết nối, xong thì làm tiếp */
  requireGitHub: (action: GhAction) => void;
}

function Lazy(p: RouteProps & { id: string }) {
  const [C, setC] = useState<ComponentType<RouteProps> | null>(null);
  useEffect(() => {
    let alive = true;
    setC(null);
    void LAZY[p.id]!().then((m) => { if (alive) setC(() => m.default); });
    return () => { alive = false; };
  }, [p.id]);
  return C ? <C store={p.store} go={p.go} preview={p.preview} peek={p.peek} requireGitHub={p.requireGitHub} /> : <p class="muted"><Spinner /> Đang tải…</p>;
}

const NAV: { id: string; icon: IconName; label: string; more?: boolean }[] = [
  { id: 'overview', icon: 'overview', label: 'Tổng quan' },
  { id: 'general', icon: 'gear', label: 'Chung' },
  { id: 'theme', icon: 'palette', label: 'Theme & Màu' },
  { id: 'fonts', icon: 'font', label: 'Font' },
  { id: 'effects', icon: 'sparkle', label: 'Hiệu ứng' },
  { id: 'music', icon: 'music', label: 'Nhạc' },
  { id: 'sections', icon: 'list', label: 'Các phần & thứ tự' },
  { id: 'content', icon: 'pen', label: 'Nội dung' },
  { id: 'media', icon: 'image', label: 'Ảnh', more: true },
  { id: 'links', icon: 'link', label: 'Link khách mời', more: true },
  { id: 'backup', icon: 'backup', label: 'Sao lưu/Khôi phục', more: true },
  { id: 'json', icon: 'braces', label: 'Chỉnh JSON nâng cao', more: true },
];

const readHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'overview';

const PURPOSE: Record<GhAction, string> = {
  publish: 'Để xuất bản, cần kết nối GitHub (chỉ làm 1 lần).',
  restore: 'Bản sao lưu nằm trên GitHub, cần kết nối để xem và khôi phục.',
  connect: 'Kết nối 1 lần để xuất bản thiệp lên trang và dùng bản sao lưu.',
};

/** Màn Kết nối GitHub tải lười: chỉ cần khi Xuất bản / Khôi phục lần đầu. */
function LazyConnect(p: ConnectProps) {
  const [C, setC] = useState<ComponentType<ConnectProps> | null>(null);
  useEffect(() => { void import('../screens/connect').then((m) => setC(() => m.default)); }, []);
  return C ? <C {...p} /> : <main class="boot" aria-busy="true"><p><Spinner /> Đang tải…</p></main>;
}

export function Editor(p: { store: EditorStore; onLogout: () => void; devAvailable?: boolean }) {
  const { store } = p;
  const s = useStore(store, (x) => x);
  const flow = useMemo(() => new ConnectionFlow(store, { session: sessionStorage, local: localStorage }), [store]);
  const [connectReq, setConnectReq] = useState<ConnectRequest | null>(null);
  const [route, setRoute] = useState(readHash());
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview' | 'more'>('edit');
  /** mobile: true = đang ở trang con (form), false = danh sách nhóm */
  const [sub, setSub] = useState(readHash() !== 'overview');
  const [showPreview, setShowPreview] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [api, setApi] = useState<PreviewApi | null>(null);
  const edRef = useRef<HTMLDivElement>(null);
  const tbRef = useRef<HTMLElement>(null);
  const errRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const offFlow = flow.subscribe(() => setConnectReq(flow.pending));
    store.onAuthLost = (e, op) => {
      setPublishOpen(false);
      if (!op) toast('Token GitHub không còn dùng được. Bản nháp vẫn còn; lần Xuất bản tới sẽ hỏi lại token.', { tone: 'err', ms: 6000 });
      void flow.authLost(e, op);
    };
    void store.init().catch(() => { /* lỗi hiện qua s.error */ });
    const onHash = () => setRoute(readHash());
    window.addEventListener('hashchange', onHash);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest?.('input,textarea,select,[contenteditable]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) store.redo(); else store.undo(); }
    };
    window.addEventListener('keydown', onKey);
    const onUnload = (e: BeforeUnloadEvent) => { if (store.dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onUnload);
    return () => { offFlow(); window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onUnload); };
  }, [store]);

  // chiều cao thật của top bar (mobile không cố định 56px) -> khung preview mobile nằm ngay dưới, không bị che (A04)
  useEffect(() => {
    const tb = tbRef.current;
    const ed = edRef.current;
    if (!tb || !ed) return;
    const set = () => ed.style.setProperty('--a-tbh', `${Math.round(tb.getBoundingClientRect().height)}px`);
    set();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(set);
    ro.observe(tb);
    return () => ro.disconnect();
  }, []);

  // chữ lồng cho màn Login lần sau (A17) - không bí mật
  const mono = s.ready ? s.draft.cover.monogram : '';
  useEffect(() => { saveMonogram(localStorage, mono); }, [mono]);

  const go = (r: string) => {
    location.hash = `#/${r}`;
    setRoute(r);
    setSub(true);
    setMobileTab('edit');
    document.getElementById('form-col')?.scrollTo?.(0, 0);
  };

  /** Xuất bản: chưa kết nối GitHub -> màn Kết nối trước, xong mở tiếp dialog Xuất bản */
  const openPublish = () => { if (flow.request('publish') === 'run') setPublishOpen(true); };
  const requireGitHub = (a: GhAction) => { flow.request(a); };
  const resume = (a: GhAction | null) => {
    if (a === 'publish' && !store.s.staleDraft && !store.s.error) setPublishOpen(true);
    if (a === 'restore') go('backup');
  };
  const onConnected = async (sess: Session) => {
    const a = await flow.connected(sess);
    toast(`Đã kết nối GitHub (${sess.owner}/${sess.repo}).`, { tone: 'ok' });
    resume(a);
  };

  const changes = useMemo(() => (s.ready ? store.changes() : []), [s.draft, s.published, s.ready]);
  const n = changes.length;
  const st = statusOf(s, n);
  const peek = (text: string, actions: PeekAction[] = []) => {
    if (isCompact()) toast(text, { actions: [...actions, { label: 'Xem ↗', run: () => setMobileTab('preview') }] });
    else if (actions.length) toast(text, { actions });
  };

  let content;
  if (!s.ready) content = s.error ? <ErrorPanel store={store} /> : <p class="muted"><Spinner /> Đang tải dữ liệu…</p>;
  else if (route === 'overview') {
    content = <Overview store={store} go={go} openPublish={openPublish} connect={() => requireGitHub('connect')}
      disconnect={() => void flow.disconnect().then(() => toast('Đã ngắt kết nối GitHub. Token đã xoá khỏi máy này; bản nháp vẫn còn.'))} />;
  }
  else if (route === 'sections') content = <SectionsRoute store={store} go={go} />;
  else if (route === 'content') content = <ContentList go={go} />;
  else if (LAZY[route]) content = api ? <Lazy id={route} store={store} go={go} preview={api} peek={peek} requireGitHub={requireGitHub} /> : null;
  else if (groupById(route)) content = <GroupForm store={store} group={groupById(route)!} go={go} />;
  else content = <p>Không có mục này. <button type="button" class="btn btn-link" onClick={() => go('overview')}>Về Tổng quan</button></p>;

  const navItem = (it: (typeof NAV)[number]) => (
    <li key={it.id} class={it.more ? 'nav-more' : undefined}>
      <a href={`#/${it.id}`} class={`nav-a${route === it.id || (it.id === 'content' && CONTENT_IDS.includes(route)) ? ' is-on' : ''}`}
        aria-current={route === it.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go(it.id); }}>
        <span class="nav-ic"><Icon name={it.icon} /></span>{it.label}
      </a>
      {it.id === 'content' && (
        <ul class="nav-sub">
          {['cover', ...s.draft.sections.items.map((x) => x.type)].filter((id, i, a) => a.indexOf(id) === i && groupById(id)).map((id) => (
            <li key={id}><a href={`#/${id}`} class={`nav-a${route === id ? ' is-on' : ''}`} aria-current={route === id ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); go(id); }}>{groupById(id)!.title}</a></li>
          ))}
        </ul>
      )}
    </li>
  );

  const zip = s.adapter.kind === 'download';
  const modeLabel = zip ? 'Chế độ không kết nối' : s.adapter.kind === 'dev' ? 'Máy chủ dev' : s.adapter.label;
  return (
    <>
    {connectReq && (
      <LazyConnect notice={connectReq.notice} purpose={PURPOSE[connectReq.action]} onDone={(x) => void onConnected(x)} onCancel={() => flow.cancel()}
        onOffline={() => void flow.useDownload().then(resume)} onDevServer={p.devAvailable ? () => void flow.useDev().then(resume) : null} />
    )}
    <div class={`ed${showPreview ? ' has-preview' : ''}${connectReq ? ' is-covered' : ''}`} data-tab={mobileTab} data-sub={sub ? '1' : undefined} ref={edRef}>
      <header class="topbar" ref={tbRef}>
        <div class="tb-brand">
          <span class="tb-mono" aria-hidden="true">{s.draft.cover.monogram || '♡'}</span>
          <span class="tb-title">Quản lý thiệp</span>
          <span class={`tb-mode${s.adapter.kind === 'site' ? ' tb-mode--off' : ''}`} title={s.adapter.label} data-testid="tb-mode">{modeLabel}</span>
        </div>
        <p class={`tb-status tb-status--${st.tone}`} role="status" aria-live="polite" data-testid="save-status">
          <span class="dot" aria-hidden="true" />
          {s.error && s.ready
            ? <span class="tb-text">✕ Lỗi · <button type="button" class="btn btn-link" onClick={() => errRef.current?.focus()}>Xem</button></span>
            : <span class="tb-text">{st.text}</span>}
        </p>
        <div class="tb-actions">
          <button type="button" class="btn btn-ghost tb-undo" disabled={!s.canUndo} onClick={() => store.undo()} title="Hoàn tác (Ctrl+Z)"
            aria-label="Hoàn tác" data-testid="undo-btn"><Icon name="undo" /><span class="tb-undo-l">Hoàn tác</span></button>
          <button type="button" class="btn btn-ghost hide-sm" disabled={n === 0 || !!s.busy} onClick={() => setRevertOpen(true)}>Hoàn tác tất cả</button>
          <button type="button" class="btn btn-ghost hide-lg hide-sm" aria-pressed={showPreview} onClick={() => setShowPreview(!showPreview)}>Xem trước</button>
          <a class="btn btn-ghost hide-sm" href={import.meta.env.BASE_URL} target="_blank" rel="noopener">Xem trang ↗</a>
          <button type="button" class="btn btn-primary" data-testid="publish-btn" disabled={!s.ready || !!s.busy || (n === 0 && !zip)}
            onClick={openPublish}>
            {s.busy?.kind === 'publish' ? <><Spinner /> {zip ? 'Đang tạo gói…' : 'Đang xuất bản…'}</>
              : zip ? <><span class="lbl-long">{publishLabel('download')}</span><span class="lbl-short">Tải gói</span></>
              : publishLabel(s.adapter.kind)}
          </button>
        </div>
      </header>

      <div class="tb-banners">
        {s.staleDraft && (
          <div class="banner banner--warn stale" role="alert">
            Trang vừa được xuất bản từ nơi khác sau khi bạn bắt đầu bản nháp này.
            <button type="button" class="btn btn-secondary" onClick={() => void store.resolveStale(true)}>Tiếp tục nháp</button>
            <button type="button" class="btn btn-ghost" onClick={() => void store.resolveStale(false)}>Dùng bản đang xuất bản</button>
          </div>
        )}
        {s.error && s.ready && (
          <div class="banner banner--err stale" role="alert" tabIndex={-1} ref={errRef} data-testid="error-banner">
            <span>✕ {s.error.message}</span>
            <button type="button" class="btn btn-secondary" onClick={() => { store.clearError(); void store.reloadSnapshot({ keepDraft: true }).catch(() => {}); }}>Tải lại</button>
            <button type="button" class="btn btn-ghost" onClick={() => store.clearError()}>Đóng</button>
            {s.error.detail && <details class="details"><summary>Chi tiết kỹ thuật</summary><code>{s.error.detail}</code></details>}
          </div>
        )}
      </div>

      <nav class="sidebar" aria-label="Mục quản lý">
        <ul>{NAV.map(navItem)}</ul>
        <button type="button" class="btn btn-ghost nav-logout" onClick={p.onLogout}>Đăng xuất</button>
      </nav>

      <main class="form-col" id="form-col" tabIndex={-1}>
        <button type="button" class="btn btn-link back mobile-only" onClick={() => (CONTENT_IDS.includes(route) ? go('content') : setSub(false))}>
          <Icon name="left" /> Quay lại
        </button>
        {content}
      </main>

      <aside class="preview-col" aria-label="Xem trước">
        <Preview store={store} onReady={setApi} />
      </aside>

      <nav class="bottom-tabs" aria-label="Chế độ">
        {([['edit', 'Chỉnh sửa'], ['preview', 'Xem trước'], ['more', 'Thêm']] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={mobileTab === k} onClick={() => setMobileTab(k)} data-testid={`tab-${k}`}>{l}</button>
        ))}
      </nav>
      {mobileTab === 'more' && (
        <div class="more-sheet">
          <ul>
            {NAV.filter((x) => x.more).map((it) => (
              <li key={it.id}><button type="button" class="list-btn" onClick={() => go(it.id)}><span class="list-ic"><Icon name={it.icon} /> {it.label}</span></button></li>
            ))}
            <li><button type="button" class="list-btn" disabled={!s.canRedo} onClick={() => store.redo()} data-testid="redo-btn"><span class="list-ic"><Icon name="redo" /> Làm lại</span></button></li>
            <li><button type="button" class="list-btn" disabled={n === 0} onClick={() => setRevertOpen(true)}><span class="list-ic"><Icon name="undo" /> Hoàn tác tất cả</span></button></li>
            <li><a class="list-btn" href={import.meta.env.BASE_URL} target="_blank" rel="noopener">Xem trang ↗</a></li>
            <li><button type="button" class="list-btn" onClick={p.onLogout}>Đăng xuất</button></li>
          </ul>
        </div>
      )}

      {publishOpen && <PublishDialog store={store} onClose={() => setPublishOpen(false)} go={(r) => { setPublishOpen(false); go(r); }} />}
      <Modal open={revertOpen} onClose={() => setRevertOpen(false)} title="Hoàn tác tất cả?" alert
        footer={<>
          <button type="button" class="btn btn-ghost" onClick={() => setRevertOpen(false)}>Huỷ</button>
          <button type="button" class="btn btn-danger" onClick={() => { setRevertOpen(false); void store.revertAll().then(() => toast('Đã bỏ toàn bộ bản nháp, về đúng bản đang xuất bản.')); }}>Bỏ {n} thay đổi</button>
        </>}>
        <p>Toàn bộ {n} thay đổi chưa xuất bản sẽ bị bỏ, quay về đúng bản đang xuất bản. Thao tác này không đảo ngược được.</p>
      </Modal>
    </div>
    </>
  );
}

function ContentList(p: { go: (r: string) => void }) {
  return (
    <section>
      <h1>Nội dung</h1>
      <ul class="big-list">
        {FORM_GROUPS.filter((g) => CONTENT_IDS.includes(g.id)).map((g) => (
          <li key={g.id}><button type="button" class="list-btn" onClick={() => p.go(g.id)}>{g.title}<span aria-hidden="true">›</span></button></li>
        ))}
      </ul>
    </section>
  );
}

function ErrorPanel(p: { store: EditorStore }) {
  const e = useStore(p.store, (x) => x.error);
  if (!e) return null;
  return (
    <div class="banner banner--err" role="alert">
      <p>{e.message}</p>
      <button type="button" class="btn btn-secondary" onClick={() => { p.store.clearError(); void p.store.reloadSnapshot({ keepDraft: true }).catch(() => {}); }}>Thử lại</button>
      {e.detail && <details class="details"><summary>Chi tiết kỹ thuật</summary><code>{e.detail}</code></details>}
    </div>
  );
}
