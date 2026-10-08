/**
 * GitHubAdapter (solution 2.3, 3.5, 4.1): Git Data API, 1 commit mỗi lần publish/restore,
 * optimistic lock bằng SHA nhánh (`force: false`). Không bao giờ log token.
 */
import { base64ToBytes, bytesToBase64, gitBlobSha, mimeOf, utf8 } from '@shared/storage/bytes';
import {
  CONFIG_PATH, MANIFEST_PATH, backupPathOf, parseManifest, planPublish, planRestore,
  type BackupManifest, type TreeChange, type TreeMap,
} from '@shared/storage/manifest';
import {
  StorageError, type ConnectInput, type ConnectReport, type ConnectStep, type PublishChange, type Progress,
  type Snapshot, type StorageAdapter,
} from './adapter';
import { MSG, classify, offlineError, parseExpiryHeader, secondaryRetryAfter, viDate, type ClassifyCtx } from './github-errors';

export const API = 'https://api.github.com';

export interface GitHubOptions extends ConnectInput {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** hạn token đã biết (vault) - để báo "đã hết hạn" khi 401 */
  knownExpiresAt?: string | null;
  isOnline?: () => boolean;
}

interface Req { method?: string; path: string; body?: unknown; ctx?: ClassifyCtx }

/** Ngày cưới từ config thô (events.mainEventId -> startAt, fallback countdown.targetAt). */
export function weddingDateOf(config: unknown): string | null {
  const c = config as { content?: { events?: { mainEventId?: string; items?: { id?: string; startAt?: string }[] }; countdown?: { targetAt?: string | null } } } | null;
  const ev = c?.content?.events;
  const main = ev?.items?.find((e) => e.id === ev.mainEventId) ?? ev?.items?.[0];
  const v = main?.startAt || c?.content?.countdown?.targetAt || '';
  return v && !Number.isNaN(new Date(v).getTime()) ? v : null;
}

/** Cảnh báo hạn token (solution 2.6): hạn < ngày cưới hoặc còn < 14 ngày. */
export function expiryWarning(expiresAt: string | null, weddingAt: string | null, now = Date.now()): string | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  if (!Number.isFinite(exp)) return null;
  const wed = weddingAt ? new Date(weddingAt).getTime() : NaN;
  if (Number.isFinite(wed) && exp < wed) {
    return `Token hết hạn ${viDate(expiresAt)}, trước ngày cưới ${viDate(weddingAt!)}. Nên tạo token có hạn dài hơn.`;
  }
  if (exp - now < 14 * 86400_000) return `Token sắp hết hạn (${viDate(expiresAt)}). Nên tạo token mới.`;
  return null;
}

export class GitHubAdapter implements StorageAdapter {
  readonly kind = 'github' as const;
  readonly label: string;
  /** hạn token đọc được từ header gần nhất */
  expiresAt: string | null = null;
  /** số request đã gửi (test đếm "không upload lại") */
  requestCount = 0;
  private f: typeof fetch;
  private sleep: (ms: number) => Promise<void>;
  private now: () => number;
  private lastTree: TreeMap | null = null;

  constructor(private o: GitHubOptions) {
    this.label = `${o.owner}/${o.repo}`;
    this.f = o.fetch ?? ((...a) => globalThis.fetch(...a));
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.now = o.now ?? Date.now;
  }

  private get repoPath() {
    return `/repos/${encodeURIComponent(this.o.owner)}/${encodeURIComponent(this.o.repo)}`;
  }

  /** Gửi request, xử lý offline / 5xx (thử lại 1 lần sau 2s) / rate limit phụ (tự thử lại ≤ 2 lần). */
  private async raw(r: Req): Promise<Response> {
    const online = this.o.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
    let serverRetry = 1;
    let secondaryRetry = 2;
    for (;;) {
      if (!online()) throw offlineError(new Error('navigator.onLine = false'));
      let res: Response;
      try {
        this.requestCount++;
        res = await this.f(`${API}${r.path}`, {
          method: r.method ?? 'GET',
          headers: {
            Authorization: `Bearer ${this.o.token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(r.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(r.body !== undefined ? { body: JSON.stringify(r.body) } : {}),
          cache: 'no-store',
        });
      } catch (e) {
        throw offlineError(e);
      }
      const exp = parseExpiryHeader(res.headers.get('github-authentication-token-expiration'));
      if (exp) this.expiresAt = exp;
      if (res.ok) return res;
      const ra = secondaryRetryAfter(res);
      if (ra !== null && res.headers.get('x-ratelimit-remaining') !== '0' && secondaryRetry > 0 && ra <= 120) {
        secondaryRetry--;
        await this.sleep(ra * 1000 * (3 - secondaryRetry)); // backoff
        continue;
      }
      if (res.status >= 500 && serverRetry > 0) {
        serverRetry--;
        await this.sleep(2000);
        continue;
      }
      return res;
    }
  }

  private async json<T>(r: Req): Promise<T> {
    const res = await this.raw(r);
    if (!res.ok) throw await this.error(res, r.ctx);
    return (await res.json()) as T;
  }

  private async error(res: Response, ctx: ClassifyCtx = {}): Promise<StorageError> {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    return classify(res, body, { owner: this.o.owner, repo: this.o.repo, knownExpiresAt: this.o.knownExpiresAt ?? null, now: this.now(), ...ctx });
  }

  // ------------------------------------------------------------------ kết nối (2.3)

  /**
   * Kiểm tra kết nối tuần tự. `full=false` (Login) bỏ bước ghi thử để nhanh.
   * `onStep` gọi sau mỗi bước để UI cập nhật vùng aria-live.
   */
  async connect(opts: { full?: boolean; onStep?: (s: ConnectStep[]) => void } = {}): Promise<ConnectReport> {
    const full = opts.full !== false;
    const steps: ConnectStep[] = [];
    const push = (s: ConnectStep) => { steps.push(s); opts.onStep?.([...steps]); };
    const fail = (e: unknown, id: ConnectStep['id']): ConnectReport => {
      const se = e instanceof StorageError ? e : new StorageError('unknown', MSG.unknown, String(e));
      push({ id, status: 'error', message: se.message, detail: se.detail });
      return { steps, expiresAt: this.expiresAt, errorCode: se.code, ...(se.extra.branches ? { branches: se.extra.branches } : {}) };
    };
    // 1. token + repo
    try {
      await this.json({ path: this.repoPath });
      push({ id: 'token-repo', status: 'ok', message: `Token hợp lệ · Tìm thấy repo ${this.label}` });
    } catch (e) { return fail(e, 'token-repo'); }
    // 2. nhánh
    try {
      await this.json({ path: `${this.repoPath}/branches/${encodeURIComponent(this.o.branch)}` });
      push({ id: 'branch', status: 'ok', message: `Có nhánh ${this.o.branch}` });
    } catch (e) {
      if (e instanceof StorageError && e.code === 'not-found') {
        let list: string[] = [];
        try {
          list = (await this.json<{ name: string }[]>({ path: `${this.repoPath}/branches?per_page=20` })).map((b) => b.name);
        } catch { /* giữ list rỗng */ }
        const err = list.length === 0
          ? new StorageError('empty', MSG.empty, e.detail)
          : new StorageError('branch-not-found', MSG.branch(this.o.branch, list), e.detail, { branches: list });
        return fail(err, 'branch');
      }
      return fail(e, 'branch');
    }
    // 3. quyền ghi: ghi thử 1 blob (không ref nào trỏ tới -> vô hại)
    if (full) {
      try {
        await this.json({ method: 'POST', path: `${this.repoPath}/git/blobs`, body: { content: 'wp-connect-check', encoding: 'utf-8' }, ctx: { write: true } });
        push({ id: 'write', status: 'ok', message: 'Có quyền ghi (Contents: Read and write)' });
      } catch (e) { return fail(e, 'write'); }
    }
    // 4. hạn token (+ ngày cưới nếu repo đã có config)
    let wedding: string | null = null;
    try { wedding = weddingDateOf((await this.loadSnapshot()).config); } catch { /* repo chưa có config */ }
    const warn = expiryWarning(this.expiresAt, wedding, this.now());
    if (!this.expiresAt) push({ id: 'expiry', status: 'ok', message: 'Token không có hạn' });
    else if (warn) push({ id: 'expiry', status: 'warn', message: warn });
    else push({ id: 'expiry', status: 'ok', message: `Token hết hạn ${viDate(this.expiresAt)}${wedding ? ` (sau ngày cưới ${viDate(wedding)})` : ''}` });
    return { steps, expiresAt: this.expiresAt };
  }

  // ------------------------------------------------------------------ đọc (cố định tại 1 commit)

  private async head(): Promise<string> {
    const ref = await this.json<{ object: { sha: string } }>({ path: `${this.repoPath}/git/ref/heads/${encodeURIComponent(this.o.branch)}` });
    return ref.object.sha;
  }

  private async treeAt(commitSha: string): Promise<{ treeSha: string; tree: TreeMap }> {
    const c = await this.json<{ tree: { sha: string } }>({ path: `${this.repoPath}/git/commits/${commitSha}` });
    const t = await this.json<{ tree: { path: string; type: string; sha: string }[]; truncated?: boolean }>({ path: `${this.repoPath}/git/trees/${c.tree.sha}?recursive=1` });
    const tree: TreeMap = {};
    for (const e of t.tree) {
      if (e.type === 'blob' && (e.path.startsWith('public/content/') || e.path.startsWith('backup/'))) tree[e.path] = e.sha;
    }
    if (t.truncated) throw new StorageError('unknown', 'Repo quá lớn để đọc một lần (tree bị cắt).', 'truncated tree');
    this.lastTree = tree;
    return { treeSha: c.tree.sha, tree };
  }

  private async blobBytes(sha: string): Promise<Uint8Array> {
    const b = await this.json<{ content: string; encoding: string }>({ path: `${this.repoPath}/git/blobs/${sha}` });
    return b.encoding === 'base64' ? base64ToBytes(b.content) : utf8(b.content);
  }

  private async readJson(tree: TreeMap, path: string): Promise<unknown> {
    const sha = tree[path];
    if (!sha) return null;
    try {
      return JSON.parse(new TextDecoder().decode(await this.blobBytes(sha)));
    } catch (e) {
      if (e instanceof StorageError) throw e;
      return null;
    }
  }

  async loadSnapshot(): Promise<Snapshot> {
    const commit = await this.head();
    const { tree } = await this.treeAt(commit);
    const [config, manifestRaw] = await Promise.all([this.readJson(tree, CONFIG_PATH), this.readJson(tree, MANIFEST_PATH)]);
    return { commit, config, manifest: parseManifest(manifestRaw), paths: tree };
  }

  async readAsset(path: string): Promise<Blob> {
    let sha = this.lastTree?.[path];
    if (!sha) sha = (await this.treeAt(await this.head())).tree[path];
    if (!sha) throw new StorageError('not-found', 'Không tìm thấy tệp trong repo.', path);
    const bytes = await this.blobBytes(sha);
    return new Blob([bytes as BlobPart], { type: mimeOf(path) });
  }

  // ------------------------------------------------------------------ ghi

  private async uploadBlob(bytes: Uint8Array): Promise<string> {
    const r = await this.json<{ sha: string }>({ method: 'POST', path: `${this.repoPath}/git/blobs`, body: { content: bytesToBase64(bytes), encoding: 'base64' }, ctx: { write: true } });
    return r.sha;
  }

  private async commitChanges(headSha: string, treeSha: string, changes: TreeChange[], message: string): Promise<string> {
    const tree = await this.json<{ sha: string }>({
      method: 'POST', path: `${this.repoPath}/git/trees`, ctx: { write: true },
      body: { base_tree: treeSha, tree: changes.map((c) => ({ path: c.path, mode: '100644', type: 'blob', sha: c.sha })) },
    });
    const commit = await this.json<{ sha: string }>({
      method: 'POST', path: `${this.repoPath}/git/commits`, ctx: { write: true },
      body: { message, tree: tree.sha, parents: [headSha] },
    });
    await this.json({
      method: 'PATCH', path: `${this.repoPath}/git/refs/heads/${encodeURIComponent(this.o.branch)}`, ctx: { write: true, ref: true },
      body: { sha: commit.sha, force: false },
    });
    return commit.sha;
  }

  private async lockedHead(baseCommit: string): Promise<string> {
    const head = await this.head();
    if (baseCommit && head !== baseCommit) throw new StorageError('conflict', MSG.conflict, `head ${head.slice(0, 7)} ≠ base ${baseCommit.slice(0, 7)}`);
    return head;
  }

  async publish(change: PublishChange, onProgress?: Progress): Promise<{ commit: string; publishId: string }> {
    const head = await this.lockedHead(change.baseCommit);
    const { treeSha, tree } = await this.treeAt(head);
    const known = new Set(Object.values(tree));
    const prevConfig = await this.readJson(tree, CONFIG_PATH);

    // chuẩn bị nội dung + sha cục bộ (git blob sha) -> chỉ upload file chưa có trong repo
    const items: { path: string; slot?: string; bytes: Uint8Array | null; sha: string }[] = [];
    const cfgBytes = utf8(`${JSON.stringify(change.config, null, 2)}\n`);
    items.push({ path: CONFIG_PATH, bytes: cfgBytes, sha: await gitBlobSha(cfgBytes) });
    for (const u of change.uploads) {
      if (u.blob) {
        const bytes = new Uint8Array(await u.blob.arrayBuffer());
        items.push({ path: u.path, ...(u.slot ? { slot: u.slot } : {}), bytes, sha: await gitBlobSha(bytes) });
      } else {
        const sha = tree[u.path] ?? tree[backupPathOf(u.path)];
        if (!sha) throw new StorageError('unknown', 'Thiếu tệp ảnh/nhạc của bản nháp trên máy này. Hãy chọn lại tệp.', u.path);
        items.push({ path: u.path, ...(u.slot ? { slot: u.slot } : {}), bytes: null, sha });
      }
    }
    const toUpload = items.filter((i) => i.bytes && !known.has(i.sha));
    const total = toUpload.length + 1; // + manifest
    let done = 0;
    onProgress?.(done, total);
    for (const it of toUpload) {
      const sha = await this.uploadBlob(it.bytes!);
      it.sha = sha;
      known.add(sha);
      onProgress?.(++done, total);
    }
    const plan = planPublish({
      tree, files: items.map((i) => ({ path: i.path, sha: i.sha, ...(i.slot ? { slot: i.slot } : {}) })),
      deletes: change.deletes, publishId: change.config.publish.id,
      backupPublishId: publishIdOf(prevConfig), createdAt: new Date(this.now()).toISOString(), fromCommit: head,
    });
    const manifestSha = await this.uploadBlob(utf8(`${JSON.stringify(plan.manifest, null, 2)}\n`));
    onProgress?.(++done, total);
    const commit = await this.commitChanges(head, treeSha, [...plan.changes, { path: MANIFEST_PATH, sha: manifestSha }], `admin: publish ${stamp(this.now())}`);
    return { commit, publishId: change.config.publish.id };
  }

  async restoreLastBackup(baseCommit: string): Promise<{ commit: string; restoredPublishId: string }> {
    const head = await this.lockedHead(baseCommit);
    const { treeSha, tree } = await this.treeAt(head);
    const manifest = parseManifest(await this.readJson(tree, MANIFEST_PATH));
    if (!manifest || manifest.files.length === 0) throw new StorageError('no-backup', MSG.noBackup);
    const backupCfg = await this.readJson(tree, backupPathOf(CONFIG_PATH));
    const currentCfg = await this.readJson(tree, CONFIG_PATH);
    const restoredPublishId = publishIdOf(backupCfg) ?? '';
    const plan = planRestore({
      tree, manifest, restoredPublishId, currentPublishId: publishIdOf(currentCfg),
      createdAt: new Date(this.now()).toISOString(), fromCommit: head,
    });
    const manifestSha = await this.uploadBlob(utf8(`${JSON.stringify(plan.manifest, null, 2)}\n`));
    const commit = await this.commitChanges(head, treeSha, [...plan.changes, { path: MANIFEST_PATH, sha: manifestSha }], `admin: restore ${stamp(this.now())}`);
    return { commit, restoredPublishId };
  }

  /** Đọc config trong bản sao lưu (thumbnail/metadata "Lấy lại ảnh trước đó"). */
  async readBackupConfig(): Promise<unknown> {
    const tree = this.lastTree ?? (await this.treeAt(await this.head())).tree;
    return this.readJson(tree, backupPathOf(CONFIG_PATH));
  }
}

export function publishIdOf(cfg: unknown): string | null {
  const id = (cfg as { publish?: { id?: unknown } } | null)?.publish?.id;
  return typeof id === 'string' && id ? id : null;
}

/** "2026-10-07 10:15" giờ Việt Nam. */
export function stamp(ms: number): string {
  const d = new Date(ms + 7 * 3600_000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export type { BackupManifest };
