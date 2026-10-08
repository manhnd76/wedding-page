/**
 * StorageAdapter (solution 4.2): GitHub (production), DevServer (vite dev), Download (không kết nối).
 */
import type { WeddingConfig } from '@shared/config/types';
import type { BackupManifest } from '@shared/storage/manifest';

export type AdapterKind = 'github' | 'dev' | 'download';

export interface ConnectInput { owner: string; repo: string; branch: string; token: string }

export type StepId = 'token-repo' | 'branch' | 'write' | 'expiry';
export interface ConnectStep { id: StepId; status: 'ok' | 'warn' | 'error'; message: string; detail?: string }
export interface ConnectReport {
  steps: ConnectStep[];
  expiresAt: string | null;
  branches?: string[];
  /** mã lỗi đầu tiên (nếu có) - để UI quyết định hiện nút gì */
  errorCode?: string;
}

export interface Snapshot {
  commit: string;
  /** config thô (chưa migrate/merge); null = repo chưa có config */
  config: unknown;
  manifest: BackupManifest | null;
  /** path -> sha (chỉ public/content/** và backup/**) */
  paths: Record<string, string>;
}

/** File mới cần ghi khi publish. `blob` null = đã có sẵn trong repo (vd ảnh lấy lại từ backup). */
export interface PendingUpload { path: string; blob: Blob | null; slot?: string }

export interface PublishChange {
  config: WeddingConfig;
  uploads: PendingUpload[];
  deletes: { path: string; slot?: string }[];
  baseCommit: string;
}

export type Progress = (done: number, total: number) => void;

export interface StorageAdapter {
  readonly kind: AdapterKind;
  /** nhãn hiển thị: "minhanh/wedding", "Máy chủ dev", "Không kết nối" */
  readonly label: string;
  loadSnapshot(): Promise<Snapshot>;
  readAsset(path: string): Promise<Blob>;
  publish(change: PublishChange, onProgress?: Progress): Promise<{ commit: string; publishId: string }>;
  restoreLastBackup(baseCommit: string): Promise<{ commit: string; restoredPublishId: string }>;
}

/** Lỗi lưu trữ đã dịch sang thông điệp dễ hiểu (solution 2.5). */
export type StorageErrorCode =
  | 'unauthorized' | 'expired' | 'readonly' | 'not-found' | 'branch-not-found' | 'empty'
  | 'conflict' | 'rate-limit' | 'offline' | 'server' | 'no-backup' | 'unsupported' | 'unknown';

export class StorageError extends Error {
  constructor(
    public code: StorageErrorCode,
    message: string,
    public detail = '',
    public extra: { status?: number; retryAt?: number; branches?: string[] } = {},
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export const isStorageError = (e: unknown): e is StorageError => e instanceof StorageError;
