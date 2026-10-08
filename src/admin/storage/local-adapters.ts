/**
 * DevServerAdapter (phương án B: chỉ khi `vite dev`, ghi qua middleware `dev-admin-save`)
 * và DownloadAdapter ("Chế độ không kết nối": xuất .zip để tự commit).
 */
import { bytesToBase64, mimeOf, utf8 } from '@shared/storage/bytes';
import { CONFIG_PATH, parseManifest } from '@shared/storage/manifest';
import {
  StorageError, type PublishChange, type Progress, type Snapshot, type StorageAdapter, type StorageErrorCode,
} from './adapter';
import { zip, type ZipEntry } from './zip';

const base = () => (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';

async function devJson<T>(f: typeof fetch, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await f(`${base()}__admin/${path}`, { cache: 'no-store', ...init });
  } catch (e) {
    throw new StorageError('offline', 'Không kết nối được máy chủ dev (npm run dev).', String(e));
  }
  if (!res.ok) {
    let body: { error?: StorageErrorCode; message?: string } = {};
    try { body = (await res.json()) as typeof body; } catch { /* ignore */ }
    throw new StorageError(body.error ?? (res.status === 409 ? 'conflict' : 'server'), body.message ?? `Máy chủ dev lỗi (HTTP ${res.status}).`, `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Có middleware dev-admin-save không (chỉ `vite dev`). */
export async function devServerAvailable(f: typeof fetch = fetch): Promise<boolean> {
  try {
    const r = await f(`${base()}__admin/ping`, { cache: 'no-store' });
    if (!r.ok) return false;
    const j = (await r.json()) as { ok?: boolean };
    return j.ok === true;
  } catch { return false; }
}

export class DevServerAdapter implements StorageAdapter {
  readonly kind = 'dev' as const;
  readonly label = 'Máy chủ dev (ghi vào public/content)';
  constructor(private f: typeof fetch = (...a) => fetch(...a)) {}

  async loadSnapshot(): Promise<Snapshot> {
    const s = await devJson<Snapshot>(this.f, 'snapshot');
    return { ...s, manifest: parseManifest(s.manifest) };
  }
  async readAsset(path: string): Promise<Blob> {
    let res: Response;
    try { res = await this.f(`${base()}__admin/file?path=${encodeURIComponent(path)}`, { cache: 'no-store' }); } catch (e) {
      throw new StorageError('offline', 'Không kết nối được máy chủ dev.', String(e));
    }
    if (!res.ok) throw new StorageError('not-found', 'Không tìm thấy tệp.', path);
    return new Blob([await res.arrayBuffer()], { type: mimeOf(path) });
  }
  async publish(change: PublishChange, onProgress?: Progress): Promise<{ commit: string; publishId: string }> {
    const uploads = [];
    let i = 0;
    onProgress?.(0, change.uploads.length + 1);
    for (const u of change.uploads) {
      uploads.push(u.blob
        ? { path: u.path, slot: u.slot, base64: bytesToBase64(new Uint8Array(await u.blob.arrayBuffer())) }
        : { path: u.path, slot: u.slot, fromRepo: true });
      onProgress?.(++i, change.uploads.length + 1);
    }
    const r = await devJson<{ commit: string; publishId: string }>(this.f, 'publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseCommit: change.baseCommit, config: change.config, uploads, deletes: change.deletes }),
    });
    onProgress?.(change.uploads.length + 1, change.uploads.length + 1);
    return r;
  }
  restoreLastBackup(baseCommit: string) {
    return devJson<{ commit: string; restoredPublishId: string }>(this.f, 'restore', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseCommit }),
    });
  }
}

/** Tải file về máy (trình duyệt). */
export function saveFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Gói xuất bản (.zip): các file đặt đúng đường dẫn repo + HUONG-DAN.txt (file cần xoá). */
export async function buildPublishZip(change: PublishChange, now = new Date()): Promise<Uint8Array> {
  const entries: ZipEntry[] = [{ path: CONFIG_PATH, data: utf8(`${JSON.stringify(change.config, null, 2)}\n`) }];
  for (const u of change.uploads) if (u.blob) entries.push({ path: u.path, data: new Uint8Array(await u.blob.arrayBuffer()) });
  const lines = [
    'GOI XUAT BAN THIEP CUOI',
    '',
    '1. Giai nen goi nay vao thu muc goc cua du an (ghi de cac file cung ten).',
    '2. Xoa cac file sau (anh/nhac khong con dung):',
    ...(change.deletes.length ? change.deletes.map((d) => `   - ${d.path}`) : ['   (khong co)']),
    '3. Commit va push len GitHub; Cloudflare Pages se tu build.',
    '',
    `Tao luc: ${now.toISOString()}`,
  ];
  entries.push({ path: 'HUONG-DAN.txt', data: utf8(lines.join('\r\n')) });
  return zip(entries, now);
}

export class DownloadAdapter implements StorageAdapter {
  readonly kind = 'download' as const;
  readonly label = 'Chế độ không kết nối';
  constructor(
    private f: typeof fetch = (...a) => fetch(...a),
    private save: (b: Blob, name: string) => void = saveFile,
  ) {}

  async loadSnapshot(): Promise<Snapshot> {
    let config: unknown = null;
    try {
      const r = await this.f(`${base()}content/config.json`, { cache: 'no-cache' });
      if (r.ok) config = await r.json();
    } catch { /* trang chưa có config */ }
    return { commit: 'local', config, manifest: null, paths: {} };
  }
  async readAsset(path: string): Promise<Blob> {
    const r = await this.f(`${base()}${path.replace(/^public\//, '')}`);
    if (!r.ok) throw new StorageError('not-found', 'Không tìm thấy tệp.', path);
    return r.blob();
  }
  async publish(change: PublishChange): Promise<{ commit: string; publishId: string }> {
    const data = await buildPublishZip(change);
    this.save(new Blob([data as BlobPart], { type: 'application/zip' }), `thiep-cuoi-xuat-ban-${new Date().toISOString().slice(0, 10)}.zip`);
    return { commit: change.baseCommit, publishId: change.config.publish.id };
  }
  async restoreLastBackup(): Promise<{ commit: string; restoredPublishId: string }> {
    throw new StorageError('unsupported', 'Chế độ không kết nối không có bản sao lưu trên repo. Hãy kết nối GitHub để dùng tính năng này.');
  }
}
