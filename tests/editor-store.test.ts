import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { EditorStore } from '../src/admin/state/store';
import { GitHubAdapter } from '../src/admin/storage/github';
import { mergeWithDefaults } from '../src/shared/config/merge';
import { sha256Hex } from '../src/shared/storage/bytes';
import { MANIFEST_PATH } from '../src/shared/storage/manifest';
import { FakeGitHub, respond } from './helpers/fake-github';

const HERO = 'public/content/images/hero/hero.aaaaaaaa.webp';
let gh: FakeGitHub;
let store: EditorStore;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  globalThis.indexedDB = new IDBFactory();
  gh = new FakeGitHub();
  const c = mergeWithDefaults({}).config;
  c.publish = { id: 'pub-0', at: '2026-10-01T00:00:00Z' };
  c.content.hero.image = { src: 'content/images/hero/hero.aaaaaaaa.webp', w: 1, h: 1, alt: 'cũ' };
  await gh.seed({ 'public/content/config.json': JSON.stringify(c), [HERO]: 'old-hero' });
  store = new EditorStore(new GitHubAdapter({ owner: 'minhanh', repo: 'wedding', branch: 'main', token: 'fake', fetch: gh.fetch, sleep: async () => {} }));
  await store.init();
});
afterEach(() => { store.dispose(); vi.useRealTimers(); });

async function newHero(bytes: string) {
  const blob = new Blob([bytes], { type: 'image/webp' });
  const key = await sha256Hex(new TextEncoder().encode(bytes));
  const src = `content/images/hero/hero.${key.slice(0, 8)}.webp`;
  await store.addBlob({ key, blob, mime: 'image/webp', src, slot: 'content.hero.image', origin: 'upload' });
  store.setPath('content.hero.image', { src, w: 2, h: 2, alt: 'mới' });
  return src;
}

describe('EditorStore + GitHubAdapter (luồng v2 trên repo giả)', () => {
  it('thay ảnh hero -> publish 1 commit, ảnh cũ vào backup, nháp sạch, manifest có slot', async () => {
    const src = await newHero('new-hero');
    expect(store.changes().length).toBeGreaterThan(0);
    const commits = gh.commits.size;
    const r = await store.publish();
    expect(r).not.toBeNull();
    expect(gh.commits.size).toBe(commits + 1);
    const t = gh.headTree();
    expect(t[`public/${src}`]).toBeDefined();
    expect(t[HERO]).toBeUndefined();
    expect(t[`backup/files/${HERO}`]).toBeDefined();
    expect(store.changes()).toEqual([]);
    expect(store.s.manifest?.files.some((f) => f.slot === 'content.hero.image' && f.existed)).toBe(true);
    expect(store.s.live?.state).toBe('waiting');
  });

  it('Hoàn tác thay đổi nháp / Hoàn tác tất cả không ghi lên repo', async () => {
    await newHero('x');
    const redo = store.revertSlot('content.hero.image');
    expect(store.s.draft.content.hero.image?.src).toBe('content/images/hero/hero.aaaaaaaa.webp');
    redo();
    expect(store.s.draft.content.hero.image?.alt).toBe('mới');
    store.setPath('meta.title', 'Khác');
    await store.revertAll();
    expect(store.changes()).toEqual([]);
    expect(gh.count('POST', /\/git\//)).toBe(0);
  });

  it('khôi phục khi còn nháp -> nháp đặt lại theo bản vừa khôi phục; bấm lại = làm lại', async () => {
    await newHero('new-hero');
    await store.publish();
    store.setPath('meta.title', 'Nháp chưa xuất bản');
    expect(store.changes().length).toBe(1);
    const r = await store.restore();
    expect(r?.restoredPublishId).toBe('pub-0');
    expect(store.s.published.content.hero.image?.alt).toBe('cũ');
    expect(store.s.draft).toEqual(store.s.published);
    expect(store.changes()).toEqual([]);
    expect(store.s.canUndo).toBe(false);
    expect(JSON.parse(gh.text(MANIFEST_PATH)!).reason).toBe('restore');
    await store.restore();
    expect(store.s.published.content.hero.image?.alt).toBe('mới');
  });

  it('xung đột (tab khác vừa xuất bản) -> lỗi conflict, nháp giữ nguyên, không ghi', async () => {
    store.setPath('meta.title', 'Của tôi');
    await gh.seed({ 'public/content/config.json': '{}' });
    const r = await store.publish();
    expect(r).toBeNull();
    expect(store.s.error?.code).toBe('conflict');
    expect(store.s.draft.meta.title).toBe('Của tôi');
  });

  it('401 giữa phiên -> onAuthLost (kèm thao tác đang chạy), nháp vẫn trong IndexedDB', async () => {
    store.setPath('meta.title', 'Giữ nháp này');
    await store.flush();
    const lost = vi.fn();
    store.onAuthLost = lost;
    gh.overrides.push({ re: /./, res: respond(401, { message: 'Bad credentials' }) });
    expect(await store.publish()).toBeNull();
    expect(lost).toHaveBeenCalledOnce();
    expect(lost.mock.calls[0]![1]).toBe('publish'); // v2.3: thao tác đang chạy -> mở Kết nối rồi làm tiếp
    expect((await store.db!.getDraft())?.config.meta.title).toBe('Giữ nháp này');
    // đăng nhập lại -> store mới đọc lại nháp
    gh.overrides = [];
    const again = new EditorStore(new GitHubAdapter({ owner: 'minhanh', repo: 'wedding', branch: 'main', token: 'fake', fetch: gh.fetch }));
    await again.init();
    expect(again.s.draft.meta.title).toBe('Giữ nháp này');
    again.dispose();
  });

  it('nháp dựa trên commit cũ -> hỏi "Tiếp tục nháp / Dùng bản đang xuất bản"', async () => {
    store.setPath('meta.title', 'Nháp cũ');
    await store.flush();
    store.dispose();
    await gh.seed({ 'public/content/config.json': JSON.stringify({ ...mergeWithDefaults({}).config, publish: { id: 'other', at: '' } }) });
    const s2 = new EditorStore(new GitHubAdapter({ owner: 'minhanh', repo: 'wedding', branch: 'main', token: 'fake', fetch: gh.fetch }));
    await s2.init();
    expect(s2.s.staleDraft?.draft.meta.title).toBe('Nháp cũ');
    await s2.resolveStale(true);
    expect(s2.s.draft.meta.title).toBe('Nháp cũ');
    s2.dispose();
    store = new EditorStore(new GitHubAdapter({ owner: 'minhanh', repo: 'wedding', branch: 'main', token: 'fake', fetch: gh.fetch }));
  });
});
