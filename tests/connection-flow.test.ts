/**
 * v2.3 - "token GitHub chỉ hỏi khi cần" (decisions 2026-10-08): đăng nhập xong sửa nháp từ bản trên site,
 * bấm Xuất bản khi chưa có token -> yêu cầu kết nối -> kết nối (GitHub giả) -> tiếp tục xuất bản, nháp giữ nguyên.
 * Không gọi GitHub thật: FakeGitHub + fetch giả cho `/content/config.json` của site.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { EditorStore } from '../src/admin/state/store';
import { ConnectionFlow, initialAdapter, type FlowDeps } from '../src/admin/state/connection';
import { GitHubAdapter } from '../src/admin/storage/github';
import { DownloadAdapter, SiteAdapter } from '../src/admin/storage/local-adapters';
import { MODE_KEY, SESSION_KEY, VAULT_KEY, loadSession, saveSession, type Session } from '../src/admin/auth/vault';
import { statusOf } from '../src/admin/editor/status';
import { mergeWithDefaults } from '../src/shared/config/merge';
import { FakeGitHub, respond } from './helpers/fake-github';

class Mem { m = new Map<string, string>(); getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, v); } removeItem(k: string) { this.m.delete(k); } }

let gh: FakeGitHub;
let siteConfig: unknown;
let siteCalls: string[];
let store: EditorStore;
let deps: FlowDeps;
let flow: ConnectionFlow;
const SESS: Session = { owner: 'minhanh', repo: 'wedding', branch: 'main', token: 'fake-token', expiresAt: '2027-01-12T00:00:00+07:00' };

const siteFetch = (async (input: RequestInfo | URL) => {
  const u = String(input);
  siteCalls.push(u);
  if (u.endsWith('content/config.json')) return new Response(JSON.stringify(siteConfig), { status: 200, headers: { 'content-type': 'application/json' } });
  return new Response('not found', { status: 404 });
}) as typeof fetch;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  globalThis.indexedDB = new IDBFactory();
  const c = mergeWithDefaults({}).config;
  c.publish = { id: 'pub-0', at: '2026-10-01T00:00:00Z' };
  c.meta.title = 'Bản đang xuất bản';
  siteConfig = c;
  siteCalls = [];
  gh = new FakeGitHub();
  await gh.seed({ 'public/content/config.json': JSON.stringify(c) });
  deps = {
    session: new Mem(), local: new Mem(),
    github: (s) => new GitHubAdapter({ ...s, fetch: gh.fetch, sleep: async () => {} }),
    site: () => new SiteAdapter(siteFetch),
    download: () => new DownloadAdapter(siteFetch, () => {}),
  };
  store = new EditorStore(initialAdapter(deps, false).adapter);
  flow = new ConnectionFlow(store, deps);
  await store.init();
});
afterEach(() => { store.dispose(); vi.useRealTimers(); });

describe('luồng cần token', () => {
  it('chưa có token: nơi lưu = site; sửa nháp không gọi GitHub; trạng thái nói rõ chưa kết nối', async () => {
    expect(store.s.adapter.kind).toBe('site');
    expect(store.s.published.meta.title).toBe('Bản đang xuất bản');
    expect(siteCalls.some((u) => u.endsWith('content/config.json'))).toBe(true);
    store.setPath('meta.title', 'Sửa khi chưa có token');
    await store.flush();
    expect(gh.calls).toHaveLength(0);
    const st = statusOf(store.s, store.changes().length);
    expect(st.text).toBe('Có 1 thay đổi chưa xuất bản');
    expect(st.hint).toMatch(/Chưa kết nối GitHub/);
    // gọi thẳng publish ở chế độ site (phòng hờ): báo cần kết nối, không ghi gì
    expect(await store.publish()).toBeNull();
    expect(store.s.error?.code).toBe('need-connection');
    store.clearError();
  });

  it('Xuất bản khi chưa có token -> yêu cầu kết nối -> kết nối xong tiếp tục xuất bản, nháp giữ nguyên (không hỏi "nháp cũ")', async () => {
    store.setPath('meta.title', 'Tiêu đề mới');
    await store.flush();
    const seen: unknown[] = [];
    flow.subscribe(() => seen.push(flow.pending));
    expect(flow.request('publish')).toBe('connect');
    expect(flow.pending).toEqual({ action: 'publish', notice: null });
    expect(gh.calls).toHaveLength(0);

    saveSession(deps.session, SESS); // màn Kết nối lưu phiên trước khi gọi onDone
    expect(await flow.connected(SESS)).toBe('publish');
    expect(flow.pending).toBeNull();
    expect(seen.at(-1)).toBeNull();
    expect(store.s.adapter.kind).toBe('github');
    expect(store.s.tokenExpiresAt).toBe(SESS.expiresAt);
    expect(store.s.staleDraft).toBeNull();
    expect(store.s.draft.meta.title).toBe('Tiêu đề mới');

    // tiếp tục đúng thao tác: lần này không cần kết nối nữa
    expect(flow.request('publish')).toBe('run');
    const r = await store.publish();
    expect(r?.commit).toBeTruthy();
    expect(JSON.parse(gh.text('public/content/config.json')!).meta.title).toBe('Tiêu đề mới');
  });

  it('repo đã có lần xuất bản mới hơn bản trên site -> vẫn hỏi "Tiếp tục nháp / Dùng bản đang xuất bản"', async () => {
    store.setPath('meta.title', 'Nháp dựa trên bản cũ');
    await store.flush();
    await gh.seed({ 'public/content/config.json': JSON.stringify({ ...(siteConfig as object), publish: { id: 'pub-1', at: '2026-10-05T00:00:00Z' } }) });
    flow.request('publish');
    await flow.connected(SESS);
    expect(store.s.staleDraft?.draft.meta.title).toBe('Nháp dựa trên bản cũ');
  });

  it('sửa nháp trong lúc đang đổi nơi lưu (tải lại snapshot) -> không bị bản IndexedDB cũ ghi đè', async () => {
    store.setPath('meta.title', 'Sửa 1');
    await store.flush();
    saveSession(deps.session, SESS);
    const p = flow.connected(SESS);
    store.setPath('meta.title', 'Sửa 2 lúc đang kết nối');
    await p;
    expect(store.s.adapter.kind).toBe('github');
    expect(store.s.draft.meta.title).toBe('Sửa 2 lúc đang kết nối');
  });

  it('Khôi phục khi chưa kết nối -> kết nối -> trả "restore" + đánh dấu mở lại dialog', async () => {
    expect(flow.request('restore')).toBe('connect');
    expect(await flow.connected(SESS)).toBe('restore');
    expect(store.takeResume('restore')).toBe(true);
    expect(store.takeResume('restore')).toBe(false);
  });

  it('"Tải gói .zip" thay vì kết nối -> chế độ không kết nối, Xuất bản = tải gói; Khôi phục vẫn cần GitHub', async () => {
    flow.request('publish');
    expect(await flow.useDownload()).toBe('publish');
    expect(store.s.adapter.kind).toBe('download');
    expect(deps.session.getItem(MODE_KEY)).toBe('download');
    expect(flow.needs('publish')).toBe(false);
    expect(flow.needs('restore')).toBe(true);
    expect(initialAdapter(deps, false).adapter.kind).toBe('download'); // tải lại trang giữ chế độ
  });

  it('Ngắt kết nối: xoá token (phiên + ghi nhớ), về đọc từ site; 401 giữa lúc xuất bản -> mở lại Kết nối kèm thông báo', async () => {
    saveSession(deps.session, SESS);
    deps.local.setItem(VAULT_KEY, '{"v":1}');
    await flow.connected(SESS);
    expect(initialAdapter(deps, false).adapter.kind).toBe('github');
    await flow.disconnect();
    expect(store.s.adapter.kind).toBe('site');
    expect(deps.session.getItem(SESSION_KEY)).toBeNull();
    expect(deps.local.getItem(VAULT_KEY)).toBeNull();
    expect(initialAdapter(deps, false).adapter.kind).toBe('site');

    // kết nối lại, token bị thu hồi giữa phiên
    saveSession(deps.session, SESS);
    await flow.connected(SESS);
    store.onAuthLost = (e, op) => void flow.authLost(e, op);
    store.setPath('meta.title', 'Giữ nháp');
    gh.overrides.push({ re: /./, res: respond(401, { message: 'Bad credentials' }) });
    expect(await store.publish()).toBeNull();
    await vi.waitFor(() => expect(flow.pending?.action).toBe('publish'));
    expect(flow.pending?.notice).toBeTruthy();
    await vi.waitFor(() => expect(store.s.adapter.kind).toBe('site'));
    expect(loadSession(deps.session)).toBeNull();
    expect(store.s.draft.meta.title).toBe('Giữ nháp');
  });
});
