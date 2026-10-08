/**
 * Khung trang quản lý (design 8.3-8.5, 8.8): top bar trạng thái + Xuất bản, sidebar IA, form, live preview.
 * ≥ 1200px: 3 cột; 768-1199px: preview ẩn/hiện; < 768px: bottom tab Chỉnh sửa · Xem trước · Thêm.
 */
import type { ComponentType } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { FORM_GROUPS, groupById } from '@shared/config/schema-meta';
import type { EditorStore } from '../state/store';
import { useStore } from '../state/store';
import { Modal, Spinner, toast } from '../ui/ui';
import { Preview, type PreviewApi } from './preview';
import { GroupForm } from './form';
import { Overview } from './routes/overview';
import { SectionsRoute } from './routes/sections';
import { PublishDialog } from './publish-dialog';
import { fmtTime } from './util';

const CONTENT_IDS = ['cover', 'hero', 'couple', 'families', 'announcement', 'events', 'countdown', 'timeline', 'loveStory', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer'];

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

export interface RouteProps { store: EditorStore; go: (r: string) => void; preview: PreviewApi }

function Lazy(p: RouteProps & { id: string }) {
  const [C, setC] = useState<ComponentType<RouteProps> | null>(null);
  useEffect(() => {
    let alive = true;
    setC(null);
    void LAZY[p.id]!().then((m) => { if (alive) setC(() => m.default); });
    return () => { alive = false; };
  }, [p.id]);
  return C ? <C store={p.store} go={p.go} preview={p.preview} /> : <p class="muted"><Spinner /> Đang tải…</p>;
}

const NAV: { id: string; icon: string; label: string; more?: boolean }[] = [
  { id: 'overview', icon: '◧', label: 'Tổng quan' },
  { id: 'general', icon: '⚙', label: 'Chung' },
  { id: 'theme', icon: '◐', label: 'Theme & Màu' },
  { id: 'fonts', icon: 'Aa', label: 'Font' },
  { id: 'effects', icon: '✦', label: 'Hiệu ứng' },
  { id: 'music', icon: '♪', label: 'Nhạc' },
  { id: 'sections', icon: '☰', label: 'Sections' },
  { id: 'content', icon: '✎', label: 'Nội dung' },
  { id: 'media', icon: '▣', label: 'Ảnh', more: true },
  { id: 'links', icon: '🔗', label: 'Link khách mời', more: true },
  { id: 'backup', icon: '⟲', label: 'Sao lưu/Khôi phục', more: true },
  { id: 'json', icon: '{ }', label: 'Chỉnh JSON nâng cao', more: true },
];

const readHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'overview';

export function Editor(p: { store: EditorStore; onLogout: () => void }) {
  const { store } = p;
  const s = useStore(store, (x) => x);
  const [route, setRoute] = useState(readHash());
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview' | 'more'>('edit');
  /** mobile: true = đang ở trang con (form), false = danh sách nhóm */
  const [sub, setSub] = useState(readHash() !== 'overview');
  const [showPreview, setShowPreview] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [api, setApi] = useState<PreviewApi | null>(null);

  useEffect(() => {
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
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onUnload); };
  }, [store]);

  const go = (r: string) => {
    location.hash = `#/${r}`;
    setRoute(r);
    setSub(true);
    setMobileTab('edit');
    document.getElementById('form-col')?.scrollTo?.(0, 0);
  };

  const changes = useMemo(() => (s.ready ? store.changes() : []), [s.draft, s.published, s.ready]);
  const n = changes.length;

  const statusText = s.busy?.kind === 'publish' ? `Đang xuất bản… ${s.busy.total > 1 ? `(${s.busy.done}/${s.busy.total} tệp)` : ''}`
    : s.busy?.kind === 'restore' ? 'Đang khôi phục…'
    : s.error ? `✕ ${s.error.message}`
    : s.save === 'saving' ? '◌ Đang lưu nháp…'
    : n > 0 ? `Có ${n} thay đổi chưa xuất bản`
    : s.live?.state === 'waiting' ? 'Đã xuất bản! Khách sẽ thấy sau khoảng 1 phút'
    : s.live?.state === 'live' ? `Khách đã thấy bản mới${s.lastPublishAt ? ` · ${fmtTime(s.lastPublishAt)}` : ''}`
    : `Đã xuất bản${s.published.publish.at ? ` · ${fmtTime(s.published.publish.at)}` : ''}`;
  const tone = s.error ? 'err' : s.busy ? 'busy' : n > 0 ? 'dirty' : s.live?.state === 'waiting' ? 'ok' : 'clean';

  let content;
  if (!s.ready) content = s.error ? <ErrorPanel store={store} /> : <p class="muted"><Spinner /> Đang tải dữ liệu…</p>;
  else if (route === 'overview') content = <Overview store={store} go={go} openPublish={() => setPublishOpen(true)} />;
  else if (route === 'sections') content = <SectionsRoute store={store} go={go} />;
  else if (route === 'content') content = <ContentList go={go} />;
  else if (LAZY[route]) content = api ? <Lazy id={route} store={store} go={go} preview={api} /> : null;
  else if (groupById(route)) content = <GroupForm store={store} group={groupById(route)!} go={go} />;
  else content = <p>Không có mục này. <button type="button" class="btn btn-link" onClick={() => go('overview')}>Về Tổng quan</button></p>;

  const navItem = (it: (typeof NAV)[number]) => (
    <li key={it.id}>
      <a href={`#/${it.id}`} class={`nav-a${route === it.id || (it.id === 'content' && CONTENT_IDS.includes(route)) ? ' is-on' : ''}`}
        aria-current={route === it.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go(it.id); }}>
        <span class="nav-ic" aria-hidden="true">{it.icon}</span>{it.label}
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

  return (
    <div class={`ed${showPreview ? ' has-preview' : ''}`} data-tab={mobileTab} data-sub={sub ? '1' : undefined}>
      <header class="topbar">
        <div class="tb-brand">
          <span class="tb-mono" aria-hidden="true">{s.draft.cover.monogram || '♡'}</span>
          <span class="tb-title">Quản lý thiệp</span>
          <span class="tb-mode" title={s.adapter.label}>{s.adapter.kind === 'download' ? 'Chế độ không kết nối' : s.adapter.kind === 'dev' ? 'Máy chủ dev' : s.adapter.label}</span>
        </div>
        <p class={`tb-status tb-status--${tone}`} role="status" aria-live="polite" data-testid="save-status">
          <span class="dot" aria-hidden="true" />{statusText}
          {s.error && <>
            <button type="button" class="btn btn-link" onClick={() => { store.clearError(); void store.reloadSnapshot({ keepDraft: true }).catch(() => {}); }}>Tải lại</button>
          </>}
        </p>
        <div class="tb-actions">
          <button type="button" class="btn btn-ghost" disabled={!s.canUndo} onClick={() => store.undo()} title="Ctrl+Z">Hoàn tác</button>
          <button type="button" class="btn btn-ghost hide-sm" disabled={n === 0 || !!s.busy} onClick={() => setRevertOpen(true)}>Hoàn tác tất cả</button>
          <button type="button" class="btn btn-ghost hide-lg" aria-pressed={showPreview} onClick={() => setShowPreview(!showPreview)}>Xem trước</button>
          <a class="btn btn-ghost hide-sm" href={import.meta.env.BASE_URL} target="_blank" rel="noopener">Xem trang ↗</a>
          <button type="button" class="btn btn-primary" data-testid="publish-btn" disabled={!s.ready || !!s.busy || (n === 0 && s.adapter.kind !== 'download')}
            onClick={() => setPublishOpen(true)}>
            {s.busy?.kind === 'publish' ? <><Spinner /> Đang xuất bản…</> : s.adapter.kind === 'download' ? 'Tải gói xuất bản (.zip)' : 'Xuất bản'}
          </button>
        </div>
      </header>

      {s.staleDraft && (
        <div class="banner banner--warn stale" role="alert">
          Trang vừa được xuất bản từ nơi khác sau khi bạn bắt đầu bản nháp này.
          <button type="button" class="btn btn-secondary" onClick={() => void store.resolveStale(true)}>Tiếp tục nháp</button>
          <button type="button" class="btn btn-ghost" onClick={() => void store.resolveStale(false)}>Dùng bản đang xuất bản</button>
        </div>
      )}

      <nav class="sidebar" aria-label="Mục quản lý">
        <ul>{NAV.map(navItem)}</ul>
        <button type="button" class="btn btn-ghost nav-logout" onClick={p.onLogout}>Đăng xuất</button>
      </nav>

      <main class="form-col" id="form-col" tabIndex={-1}>
        <button type="button" class="btn btn-link back mobile-only" onClick={() => (CONTENT_IDS.includes(route) ? go('content') : setSub(false))}>← Quay lại</button>
        {content}
      </main>

      <aside class="preview-col" aria-label="Xem trước">
        <Preview store={store} onReady={setApi} />
        <button type="button" class="btn btn-secondary mobile-only back-to-edit" onClick={() => setMobileTab('edit')}>← Quay lại chỉnh sửa</button>
      </aside>

      <nav class="bottom-tabs" aria-label="Chế độ">
        {([['edit', 'Chỉnh sửa'], ['preview', 'Xem trước'], ['more', 'Thêm']] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={mobileTab === k} onClick={() => setMobileTab(k)} data-testid={`tab-${k}`}>{l}</button>
        ))}
      </nav>
      {mobileTab === 'more' && (
        <div class="more-sheet">
          <ul>
            {NAV.filter((x) => x.more).map((it) => <li key={it.id}><button type="button" class="list-btn" onClick={() => go(it.id)}>{it.icon} {it.label}</button></li>)}
            <li><button type="button" class="list-btn" disabled={n === 0} onClick={() => setRevertOpen(true)}>↶ Hoàn tác tất cả</button></li>
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
