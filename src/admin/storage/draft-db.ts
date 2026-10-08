/**
 * IndexedDB `wp-admin` v1 (solution 3.2): store `draft`, `blobs`, `published`.
 * Wrapper promise tối giản (không thêm thư viện).
 */
import type { WeddingConfig } from '@shared/config/types';

export const DB_NAME = 'wp-admin';
export const DB_VERSION = 1;

export interface DraftRecord {
  config: WeddingConfig;
  baseCommit: string;
  basePublishId: string;
  updatedAt: string;
  changeCount: number;
}
export interface PublishedRecord { config: WeddingConfig; commit: string; at: string }
export interface BlobRecord {
  /** SHA-256 hex của file */
  key: string;
  blob: Blob;
  mime: string;
  /** đường dẫn src trong config, vd content/images/hero/hero.3f9a1c2e.webp */
  src: string;
  slot: string;
  origin: 'upload' | 'backup';
  createdAt: string;
}

type Stores = 'draft' | 'blobs' | 'published';

export class DraftDb {
  private constructor(private db: IDBDatabase) {}

  static open(factory: IDBFactory = indexedDB, name = DB_NAME): Promise<DraftDb> {
    return new Promise((resolve, reject) => {
      const req = factory.open(name, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('draft')) db.createObjectStore('draft');
        if (!db.objectStoreNames.contains('published')) db.createObjectStore('published');
        if (!db.objectStoreNames.contains('blobs')) {
          const s = db.createObjectStore('blobs', { keyPath: 'key' });
          s.createIndex('src', 'src', { unique: false });
        }
      };
      req.onsuccess = () => resolve(new DraftDb(req.result));
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB bị chặn (đang mở ở tab khác với phiên bản cũ)'));
    });
  }

  private tx<T>(store: Stores, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = this.db.transaction(store, mode);
      const s = t.objectStore(store);
      let result: T;
      const r = fn(s);
      if (r) r.onsuccess = () => { result = r.result; };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error ?? new Error('IndexedDB transaction aborted'));
    });
  }

  getDraft() { return this.tx<DraftRecord | undefined>('draft', 'readonly', (s) => s.get('current')); }
  putDraft(d: DraftRecord) { return this.tx('draft', 'readwrite', (s) => { s.put(d, 'current'); }); }
  clearDraft() { return this.tx('draft', 'readwrite', (s) => { s.delete('current'); }); }

  getPublished() { return this.tx<PublishedRecord | undefined>('published', 'readonly', (s) => s.get('current')); }
  putPublished(p: PublishedRecord) { return this.tx('published', 'readwrite', (s) => { s.put(p, 'current'); }); }

  putBlob(b: BlobRecord) { return this.tx('blobs', 'readwrite', (s) => { s.put(b); }); }
  getBlob(key: string) { return this.tx<BlobRecord | undefined>('blobs', 'readonly', (s) => s.get(key)); }
  allBlobs() { return this.tx<BlobRecord[]>('blobs', 'readonly', (s) => s.getAll()); }
  async blobBySrc(src: string): Promise<BlobRecord | undefined> {
    const list = await this.tx<BlobRecord[]>('blobs', 'readonly', (s) => s.index('src').getAll(src));
    return list[0];
  }
  deleteBlob(key: string) { return this.tx('blobs', 'readwrite', (s) => { s.delete(key); }); }

  /** GC: xoá blob không còn được tham chiếu bởi tập src cho trước (sau publish / Hoàn tác tất cả). */
  async gcBlobs(keepSrc: Set<string>): Promise<number> {
    const all = await this.allBlobs();
    let n = 0;
    for (const b of all) if (!keepSrc.has(b.src)) { await this.deleteBlob(b.key); n++; }
    return n;
  }

  close() { this.db.close(); }
}
