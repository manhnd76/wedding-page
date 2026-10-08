/**
 * Luồng "token GitHub chỉ hỏi khi cần" (decisions 2026-10-08, v2.3). Không phụ thuộc UI để unit test được:
 *
 *   đăng nhập -> trang quản lý (SiteAdapter: đọc bản đang xuất bản từ chính site, nháp IndexedDB)
 *   bấm Xuất bản / Khôi phục -> request() = 'connect' -> màn Kết nối GitHub (nhớ thao tác đang làm)
 *   kết nối xong -> connected(): đổi sang GitHubAdapter (giữ nháp) -> trả thao tác để UI làm tiếp
 *   hoặc chọn "Tải gói .zip" / "Máy chủ dev" -> useDownload() / useDev()
 *   401 giữa phiên -> authLost(): xoá token, về chưa kết nối; đang xuất bản/khôi phục thì mở lại Kết nối
 */
import type { StorageAdapter, StorageError } from '../storage/adapter';
import { GitHubAdapter } from '../storage/github';
import { DevServerAdapter, DownloadAdapter, SiteAdapter } from '../storage/local-adapters';
import { MODE_KEY, clearSession, clearVault, loadSession, type Session } from '../auth/vault';
import type { EditorStore } from './store';

export type GhAction = 'publish' | 'restore' | 'connect';
export interface ConnectRequest { action: GhAction; notice: string | null }

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface FlowDeps {
  session: KV;
  local: KV;
  github?: (s: Session) => StorageAdapter;
  site?: () => StorageAdapter;
  download?: () => StorageAdapter;
  dev?: () => StorageAdapter;
}

/** Nơi lưu khi mở trang quản lý (sau đăng nhập / tải lại trang). */
export function initialAdapter(d: FlowDeps, devAvailable: boolean): { adapter: StorageAdapter; expiresAt: string | null } {
  const mode = d.session.getItem(MODE_KEY);
  if (mode === 'dev' && devAvailable) return { adapter: (d.dev ?? (() => new DevServerAdapter()))(), expiresAt: null };
  if (mode === 'download') return { adapter: (d.download ?? (() => new DownloadAdapter()))(), expiresAt: null };
  const sess = loadSession(d.session);
  if (sess) return { adapter: (d.github ?? defaultGitHub)(sess), expiresAt: sess.expiresAt };
  return { adapter: (d.site ?? (() => new SiteAdapter()))(), expiresAt: null };
}

const defaultGitHub = (s: Session) => new GitHubAdapter({ ...s, knownExpiresAt: s.expiresAt });

export class ConnectionFlow {
  pending: ConnectRequest | null = null;
  private listeners = new Set<() => void>();

  constructor(private store: EditorStore, private d: FlowDeps) {}

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() { this.listeners.forEach((l) => l()); }

  /** Có cần kết nối GitHub trước khi làm `action` không. */
  needs(action: GhAction): boolean {
    const kind = this.store.s.adapter.kind;
    if (action === 'connect') return kind !== 'github';
    if (action === 'restore') return kind === 'site' || kind === 'download';
    return kind === 'site';
  }

  /** 'run' = làm luôn; 'connect' = đã mở màn Kết nối (nhớ thao tác để làm tiếp). */
  request(action: GhAction, notice: string | null = null): 'run' | 'connect' {
    if (!this.needs(action)) return 'run';
    this.pending = { action, notice };
    this.emit();
    return 'connect';
  }

  cancel(): void {
    this.pending = null;
    this.emit();
  }

  /** Kết nối xong (phiên đã lưu sessionStorage): đổi sang GitHub, giữ nháp; trả thao tác cần làm tiếp. */
  async connected(s: Session): Promise<GhAction | null> {
    this.d.session.removeItem(MODE_KEY);
    await this.store.setAdapter((this.d.github ?? defaultGitHub)(s), s.expiresAt);
    return this.finish();
  }

  /** "Tải gói .zip thay vì kết nối": Xuất bản thành tải gói. */
  async useDownload(): Promise<GhAction | null> {
    this.d.session.setItem(MODE_KEY, 'download');
    await this.store.setAdapter((this.d.download ?? (() => new DownloadAdapter()))());
    const a = this.finish();
    return a === 'publish' ? a : null;
  }

  /** Máy chủ dev (chỉ `vite dev`): Xuất bản/Khôi phục ghi vào thư mục dự án. */
  async useDev(): Promise<GhAction | null> {
    this.d.session.setItem(MODE_KEY, 'dev');
    await this.store.setAdapter((this.d.dev ?? (() => new DevServerAdapter()))());
    const a = this.finish();
    return a === 'connect' ? null : a;
  }

  /** "Ngắt kết nối GitHub": xoá token (phiên + đã ghi nhớ), giữ owner/repo để điền sẵn; về đọc từ site. */
  async disconnect(): Promise<void> {
    clearSession(this.d.session);
    clearVault(this.d.local);
    this.d.session.removeItem(MODE_KEY);
    await this.store.setAdapter((this.d.site ?? (() => new SiteAdapter()))());
  }

  /** Token không còn dùng được (401) giữa phiên. Nháp giữ nguyên. */
  async authLost(e: StorageError, op: 'publish' | 'restore' | null): Promise<void> {
    clearSession(this.d.session);
    clearVault(this.d.local);
    await this.store.setAdapter((this.d.site ?? (() => new SiteAdapter()))());
    if (op) {
      this.pending = { action: op, notice: e.message };
      this.emit();
    }
  }

  private finish(): GhAction | null {
    const a = this.pending?.action ?? null;
    this.pending = null;
    if (a === 'restore') this.store.setResume('restore');
    this.emit();
    return a;
  }
}
