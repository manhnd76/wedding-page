/**
 * Store của trang quản lý: nháp (IndexedDB, autosave 800ms), bản đang xuất bản, undo/redo,
 * publish/restore qua StorageAdapter, poll "đã lên trang". Không framework state - subscribe + hook.
 */
import { useEffect, useState } from 'preact/hooks';
import type { WeddingConfig } from '@shared/config/types';
import { migrate } from '@shared/config/migrations';
import { mergeWithDefaults } from '@shared/config/merge';
import { collectAssetRefs, diffAssets } from '@shared/storage/asset-refs';
import { CONFIG_PATH, backupPathOf, repoPathOfSrc, type BackupManifest } from '@shared/storage/manifest';
import { isStorageError, StorageError, type StorageAdapter } from '../storage/adapter';
import { DraftDb, type BlobRecord } from '../storage/draft-db';
import { History } from '../draft/history';
import { diffConfigs, type DiffItem } from '../draft/diff';
import { clone, getAt, sameJson, setAt } from '../draft/paths';
import { afterRestore, revertAll as opRevertAll, revertSlot as opRevertSlot } from '../draft/ops';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
export type Busy = null | { kind: 'publish' | 'restore'; done: number; total: number };
export type LiveState = null | { publishId: string; state: 'waiting' | 'live' | 'timeout' | 'unknown'; since: number };

export interface EditorState {
  ready: boolean;
  adapter: StorageAdapter;
  commit: string;
  manifest: BackupManifest | null;
  paths: Record<string, string>;
  published: WeddingConfig;
  draft: WeddingConfig;
  save: SaveState;
  busy: Busy;
  error: StorageError | null;
  lastPublishAt: string | null;
  live: LiveState;
  /** src -> blob: URL (ảnh/nhạc nháp chưa có trên trang) */
  blobUrls: Record<string, string>;
  tokenExpiresAt: string | null;
  /** hỏi khi nháp dựa trên commit cũ (design 8.8) */
  staleDraft: null | { draft: WeddingConfig; baseCommit: string };
  canUndo: boolean;
  canRedo: boolean;
  /** section vừa sửa (preview cuộn tới + highlight) */
  focus: { section: string; at: number } | null;
}

type Listener = (s: EditorState) => void;

export const AUTOSAVE_MS = 800;
const POLL_MS = 10_000;
const POLL_MAX_MS = 5 * 60_000;

export const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

export function normalizeConfig(raw: unknown): { config: WeddingConfig; warnings: string[] } {
  const m = migrate(raw ?? {});
  const r = mergeWithDefaults(m.config);
  return { config: r.config, warnings: [...m.warnings, ...r.warnings] };
}

export class EditorStore {
  s: EditorState;
  private listeners = new Set<Listener>();
  private history = new History<WeddingConfig>(50);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  db: DraftDb | null = null;
  /** gọi khi lỗi 401 giữa phiên (app chuyển về Login, giữ nháp) */
  onAuthLost: ((e: StorageError) => void) | null = null;

  constructor(adapter: StorageAdapter, tokenExpiresAt: string | null = null) {
    const empty = normalizeConfig({}).config;
    this.s = {
      ready: false, adapter, commit: '', manifest: null, paths: {}, published: empty, draft: empty,
      save: 'idle', busy: null, error: null, lastPublishAt: null, live: null, blobUrls: {}, tokenExpiresAt,
      staleDraft: null, canUndo: false, canRedo: false, focus: null,
    };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private set(p: Partial<EditorState>) {
    this.s = { ...this.s, ...p, canUndo: this.history.canUndo, canRedo: this.history.canRedo };
    this.listeners.forEach((l) => l(this.s));
  }

  // ------------------------------------------------------------------ khởi động

  async init(): Promise<void> {
    try {
      this.db = await DraftDb.open();
    } catch {
      this.db = null; // IndexedDB không dùng được (chế độ riêng tư) - vẫn chạy, không autosave
    }
    try { await navigator.storage?.persist?.(); } catch { /* ignore */ }
    await this.reloadSnapshot({ keepDraft: true });
  }

  /** Tải trạng thái repo. keepDraft: giữ nháp IndexedDB (hỏi nếu nháp dựa trên commit cũ). */
  async reloadSnapshot(o: { keepDraft: boolean }): Promise<void> {
    let snap;
    try {
      snap = await this.s.adapter.loadSnapshot();
    } catch (e) {
      this.fail(e);
      throw e;
    }
    const published = normalizeConfig(snap.config).config;
    const rec = o.keepDraft ? await this.db?.getDraft() : undefined;
    let draft = clone(published);
    let staleDraft: EditorState['staleDraft'] = null;
    if (rec) {
      const recDraft = normalizeConfig(rec.config).config;
      const changed = diffConfigs(published, recDraft).length > 0;
      if (changed && rec.baseCommit && rec.baseCommit !== snap.commit) staleDraft = { draft: recDraft, baseCommit: rec.baseCommit };
      else if (changed) draft = recDraft;
    }
    this.set({ ready: true, commit: snap.commit, manifest: snap.manifest, paths: snap.paths, published, draft, staleDraft, error: null });
    await this.db?.putPublished({ config: published, commit: snap.commit, at: new Date().toISOString() });
    await this.persist();
    await this.refreshBlobUrls();
  }

  /** Trả lời câu hỏi "Tiếp tục nháp / Dùng bản đang xuất bản". */
  async resolveStale(useDraft: boolean): Promise<void> {
    const st = this.s.staleDraft;
    if (!st) return;
    this.set({ draft: useDraft ? st.draft : clone(this.s.published), staleDraft: null });
    await this.persist();
    await this.refreshBlobUrls();
  }

  // ------------------------------------------------------------------ sửa nháp

  /** Đổi nháp (ghi undo). `group` gộp các lần gõ liên tiếp cùng ô thành 1 bước. */
  update(fn: (c: WeddingConfig) => WeddingConfig, group = '', focusSection?: string): void {
    const next = fn(this.s.draft);
    if (sameJson(next, this.s.draft)) return;
    this.history.push(this.s.draft, group);
    this.set({ draft: next, ...(focusSection ? { focus: { section: focusSection, at: Date.now() } } : {}) });
    this.scheduleSave();
  }
  setPath(path: string, value: unknown, focusSection?: string): void {
    this.update((c) => setAt(c, path, value), path, focusSection);
  }
  get(path: string): unknown { return getAt(this.s.draft, path); }

  undo(): void {
    const prev = this.history.undo(this.s.draft);
    if (prev) { this.set({ draft: prev }); this.scheduleSave(); void this.refreshBlobUrls(); }
  }
  redo(): void {
    const next = this.history.redo(this.s.draft);
    if (next) { this.set({ draft: next }); this.scheduleSave(); void this.refreshBlobUrls(); }
  }

  /** Thao tác 1: Hoàn tác thay đổi nháp của 1 slot -> trả hàm [Làm lại]. */
  revertSlot(slot: string): () => void {
    const r = opRevertSlot(this.s.draft, this.s.published, slot);
    this.history.push(this.s.draft, '');
    this.set({ draft: r.draft });
    this.scheduleSave();
    return () => this.setPath(slot, r.previous);
  }

  /** Thao tác 3: Hoàn tác tất cả (không đảo ngược). */
  async revertAll(): Promise<void> {
    this.history.clear();
    this.set({ draft: opRevertAll(this.s.published) });
    await this.persist();
    await this.gcBlobs();
    await this.refreshBlobUrls();
  }

  /** Thay toàn bộ nháp (nhập file). */
  replaceDraft(c: WeddingConfig): void {
    this.history.push(this.s.draft, '');
    this.set({ draft: c });
    this.scheduleSave();
    void this.refreshBlobUrls();
  }

  changes(): DiffItem[] { return diffConfigs(this.s.published, this.s.draft); }
  get dirty(): boolean { return !sameJson(stripPublish(this.s.published), stripPublish(this.s.draft)); }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.set({ save: 'saving' });
    this.saveTimer = setTimeout(() => { void this.persist(); }, AUTOSAVE_MS);
  }
  async flush(): Promise<void> {
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; await this.persist(); }
  }
  private async persist(): Promise<void> {
    if (!this.db) { this.set({ save: 'idle' }); return; }
    try {
      await this.db.putDraft({
        config: this.s.draft, baseCommit: this.s.commit, basePublishId: this.s.published.publish.id,
        updatedAt: new Date().toISOString(), changeCount: this.changes().length,
      });
      this.set({ save: 'saved' });
    } catch {
      this.set({ save: 'error' });
    }
  }

  // ------------------------------------------------------------------ blob (ảnh/nhạc nháp)

  async addBlob(rec: Omit<BlobRecord, 'createdAt'>): Promise<void> {
    await this.db?.putBlob({ ...rec, createdAt: new Date().toISOString() });
    const url = URL.createObjectURL(rec.blob);
    this.set({ blobUrls: { ...this.s.blobUrls, [rec.src]: url } });
  }

  /** blob: URL cho mọi asset nháp có trong IndexedDB. */
  async refreshBlobUrls(): Promise<void> {
    if (!this.db) return;
    const urls: Record<string, string> = { ...this.s.blobUrls };
    for (const r of collectAssetRefs(this.s.draft)) {
      if (urls[r.src]) continue;
      const b = await this.db.blobBySrc(r.src);
      if (b) urls[r.src] = URL.createObjectURL(b.blob);
    }
    this.set({ blobUrls: urls });
  }

  /** URL hiển thị cho 1 src: blob nháp hoặc file trên trang. */
  urlOf(src: string | null | undefined): string {
    if (!src) return '';
    if (/^(https?:|data:|blob:)/.test(src)) return src;
    return this.s.blobUrls[src] ?? `${import.meta.env.BASE_URL}${src.replace(/^\.?\/+/, '')}`;
  }

  private async gcBlobs() {
    const keep = new Set(collectAssetRefs(this.s.draft).map((r) => r.src));
    await this.db?.gcBlobs(keep);
  }

  // ------------------------------------------------------------------ xuất bản

  private fail(e: unknown) {
    const se = isStorageError(e) ? e : new StorageError('unknown', 'Có lỗi không mong muốn.', String(e));
    this.set({ error: se, busy: null });
    if (se.code === 'unauthorized' || se.code === 'expired') this.onAuthLost?.(se);
  }
  clearError() { this.set({ error: null }); }

  async publish(): Promise<{ commit: string; publishId: string } | null> {
    if (this.s.busy) return null;
    await this.flush();
    const cfg = clone(this.s.draft);
    cfg.publish = { id: uuid(), at: new Date().toISOString() };
    const { added, removed } = diffAssets(this.s.published, cfg);
    const uploads = [];
    for (const r of added) {
      const b = await this.db?.blobBySrc(r.src);
      uploads.push({ path: repoPathOfSrc(r.src), slot: r.slot, blob: b?.blob ?? null });
    }
    const deletes = removed.map((r) => ({ path: repoPathOfSrc(r.src), slot: r.slot }));
    this.set({ busy: { kind: 'publish', done: 0, total: uploads.length + 1 }, error: null });
    try {
      const res = await this.s.adapter.publish({ config: cfg, uploads, deletes, baseCommit: this.s.commit }, (done, total) =>
        this.set({ busy: { kind: 'publish', done, total } }));
      if (this.s.adapter.kind === 'download') {
        this.set({ busy: null });
        return res;
      }
      this.history.clear();
      this.set({ busy: null, published: cfg, draft: clone(cfg), commit: res.commit, lastPublishAt: cfg.publish.at });
      await this.persist();
      await this.gcBlobs();
      try { await this.reloadSnapshot({ keepDraft: false }); } catch { /* đã publish xong; snapshot sẽ tải lại sau */ }
      this.startPoll(res.publishId);
      return res;
    } catch (e) {
      this.fail(e);
      return null;
    }
  }

  async restore(): Promise<{ restoredPublishId: string } | null> {
    if (this.s.busy) return null;
    this.set({ busy: { kind: 'restore', done: 0, total: 1 }, error: null });
    try {
      const res = await this.s.adapter.restoreLastBackup(this.s.commit);
      const snap = await this.s.adapter.loadSnapshot();
      const restored = normalizeConfig(snap.config).config;
      const { published, draft } = afterRestore(restored);
      this.history.clear();
      this.set({ busy: null, published, draft, commit: snap.commit, manifest: snap.manifest, paths: snap.paths, lastPublishAt: new Date().toISOString() });
      await this.db?.putPublished({ config: published, commit: snap.commit, at: new Date().toISOString() });
      await this.persist();
      await this.refreshBlobUrls();
      this.startPoll(res.restoredPublishId);
      return res;
    } catch (e) {
      this.fail(e);
      return null;
    }
  }

  /** Poll `/content/config.json?ts=` mỗi 10s (tối đa 5 phút) tới khi publish.id khớp (solution 1). */
  startPoll(publishId: string): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.s.adapter.kind === 'dev') { this.set({ live: { publishId, state: 'live', since: Date.now() } }); return; }
    if (!publishId) { this.set({ live: { publishId, state: 'unknown', since: Date.now() } }); return; }
    const since = Date.now();
    this.set({ live: { publishId, state: 'waiting', since } });
    const tick = async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}content/config.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (r.ok) {
          const j = (await r.json()) as { publish?: { id?: string } };
          if (j.publish?.id === publishId) { this.set({ live: { publishId, state: 'live', since } }); return; }
        }
      } catch { /* thử lại */ }
      if (Date.now() - since > POLL_MAX_MS) { this.set({ live: { publishId, state: 'timeout', since } }); return; }
      this.pollTimer = setTimeout(() => void tick(), POLL_MS);
    };
    this.pollTimer = setTimeout(() => void tick(), POLL_MS);
  }

  /** Config trong bản sao lưu (metadata ảnh trước, thumbnail, diff nội dung). */
  async readBackupConfig(): Promise<WeddingConfig | null> {
    if (!this.s.manifest) return null;
    try {
      const b = await this.s.adapter.readAsset(backupPathOf(CONFIG_PATH));
      return normalizeConfig(JSON.parse(await b.text())).config;
    } catch { return null; }
  }

  dispose() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    Object.values(this.s.blobUrls).forEach((u) => URL.revokeObjectURL(u));
    this.db?.close();
  }
}

const stripPublish = (c: WeddingConfig) => ({ ...c, publish: null });

/** Hook: chọn 1 phần state; re-render khi đổi. */
export function useStore<T>(store: EditorStore, pick: (s: EditorState) => T): T {
  const [v, setV] = useState(() => pick(store.s));
  useEffect(() => {
    setV(pick(store.s));
    return store.subscribe((s) => setV(() => pick(s)));
  }, [store]);
  return v;
}
