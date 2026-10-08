/**
 * Backup manifest + thuật toán Publish / Restore = swap (solution 3.3, 3.5).
 * Thuần (không I/O): làm việc trên bảng `path -> sha` (TreeMap). Dùng chung cho GitHubAdapter
 * (sha = git blob sha) và DevServerAdapter / plugin dev-admin-save (sha = git blob sha tính trên file local).
 */

export type TreeMap = Record<string, string>;

export interface ManifestFile {
  /** đường dẫn trong repo, vd `public/content/images/hero/hero.3f9a1c2e.webp` */
  path: string;
  /** `backup/files/<path>` khi existed=true, null khi existed=false */
  backupPath: string | null;
  /** true = file có ở trạng thái trước và đã chép vào backupPath; false = do lần ghi gần nhất tạo ra */
  existed: boolean;
  /** đường dẫn field trong config, vd `content.hero.image`, `content.album.images[3]` */
  slot?: string;
  /** album: hash8 trong tên file để không lệ thuộc thứ tự */
  imageKey?: string;
}

export interface BackupManifest {
  schema: 1;
  createdAt: string;
  reason: 'publish' | 'restore';
  /** publish.id của config đang chạy NGAY SAU commit tạo manifest này */
  publishId: string;
  /** restore: publish.id của config vừa được khôi phục (= publishId); publish: null */
  restoredPublishId: string | null;
  /** publish.id của config nằm trong bản sao lưu (trạng thái trước) - để UI hiển thị */
  backupPublishId?: string | null;
  /** commit gốc lúc tạo manifest */
  fromCommit: string;
  files: ManifestFile[];
}

/** Một thay đổi trên tree: sha mới, hoặc null = xoá. */
export interface TreeChange { path: string; sha: string | null }

export const CONFIG_PATH = 'public/content/config.json';
export const MANIFEST_PATH = 'backup/manifest.json';
export const BACKUP_PREFIX = 'backup/files/';
export const PUBLIC_PREFIX = 'public/';

export const backupPathOf = (path: string) => `${BACKUP_PREFIX}${path}`;
/** `content/images/a.webp` (src trong config) -> `public/content/images/a.webp` (repo). */
export const repoPathOfSrc = (src: string) => `${PUBLIC_PREFIX}${src.replace(/^\.?\/+/, '')}`;
export const srcOfRepoPath = (path: string) => path.replace(/^public\//, '');
/** hash8 trong tên `name.<hash8>.<ext>` */
export const hash8Of = (path: string) => /\.([0-9a-f]{8})\.[a-z0-9]+$/i.exec(path)?.[1];

export interface PublishInput {
  tree: TreeMap;
  /** file mới (config.json + ảnh/nhạc) với sha đã biết */
  files: { path: string; sha: string; slot?: string }[];
  /** file bị bỏ khỏi config (đang có trong tree) */
  deletes: { path: string; slot?: string }[];
  publishId: string;
  backupPublishId: string | null;
  createdAt: string;
  fromCommit: string;
}

export interface Plan { changes: TreeChange[]; manifest: BackupManifest }

/**
 * Kế hoạch publish: file sắp bị thay/xoá được chép (bằng sha) vào backup/files, file mới ghi đè,
 * manifest mới thay cũ, backup cũ không còn tham chiếu bị xoá. KHÔNG gồm entry của manifest.json
 * (caller upload manifest rồi thêm `{ path: MANIFEST_PATH, sha }`).
 */
export function planPublish(inp: PublishInput): Plan {
  const { tree } = inp;
  const changes = new Map<string, string | null>();
  const files: ManifestFile[] = [];
  const keyOf = (slot: string | undefined, path: string) =>
    slot?.startsWith('content.album.images') ? hash8Of(path) : undefined;
  const entry = (path: string, existed: boolean, slot?: string): ManifestFile => {
    const f: ManifestFile = { path, backupPath: existed ? backupPathOf(path) : null, existed };
    if (slot) f.slot = slot;
    const k = keyOf(slot, path);
    if (k) f.imageKey = k;
    return f;
  };
  const seen = new Set<string>();
  for (const f of inp.files) {
    if (seen.has(f.path)) continue;
    seen.add(f.path);
    const cur = tree[f.path];
    if (cur === f.sha) continue; // không đổi
    if (cur !== undefined) {
      changes.set(backupPathOf(f.path), cur);
      files.push(entry(f.path, true, f.slot));
    } else {
      files.push(entry(f.path, false, f.slot));
    }
    changes.set(f.path, f.sha);
  }
  for (const d of inp.deletes) {
    if (seen.has(d.path) || tree[d.path] === undefined) continue;
    seen.add(d.path);
    changes.set(backupPathOf(d.path), tree[d.path]!);
    files.push(entry(d.path, true, d.slot));
    changes.set(d.path, null);
  }
  dropUnreferencedBackups(tree, files, changes);
  return {
    changes: [...changes].map(([path, sha]) => ({ path, sha })),
    manifest: {
      schema: 1, createdAt: inp.createdAt, reason: 'publish', publishId: inp.publishId,
      restoredPublishId: null, backupPublishId: inp.backupPublishId, fromCommit: inp.fromCommit, files,
    },
  };
}

export interface RestoreInput {
  tree: TreeMap;
  manifest: BackupManifest;
  /** publish.id của config trong backup (sẽ thành config đang chạy) */
  restoredPublishId: string;
  /** publish.id của config hiện tại (sẽ vào backup) */
  currentPublishId: string | null;
  createdAt: string;
  fromCommit: string;
}

/**
 * Restore = swap (solution 3.5): đổi chỗ trạng thái hiện tại và bản sao lưu.
 * Chạy lại với manifest mới -> quay về như trước (redo). Không upload file nào ngoài manifest.
 */
export function planRestore(inp: RestoreInput): Plan {
  const { tree, manifest } = inp;
  const changes = new Map<string, string | null>();
  const files: ManifestFile[] = [];
  const withMeta = (f: ManifestFile, src: ManifestFile): ManifestFile => {
    if (src.slot) f.slot = src.slot;
    if (src.imageKey) f.imageKey = src.imageKey;
    return f;
  };
  for (const e of manifest.files) {
    const cur = tree[e.path];
    if (e.existed) {
      const bp = e.backupPath ?? backupPathOf(e.path);
      const backupSha = tree[bp];
      if (backupSha === undefined) continue; // bản sao lưu bị mất -> không làm gì với file này
      changes.set(e.path, backupSha);
      if (cur !== undefined) {
        changes.set(bp, cur);
        files.push(withMeta({ path: e.path, backupPath: bp, existed: true }, e));
      } else {
        changes.set(bp, null);
        files.push(withMeta({ path: e.path, backupPath: null, existed: false }, e));
      }
    } else {
      if (cur === undefined) continue;
      const bp = backupPathOf(e.path);
      changes.set(bp, cur);
      changes.set(e.path, null);
      files.push(withMeta({ path: e.path, backupPath: bp, existed: true }, e));
    }
  }
  dropUnreferencedBackups(tree, files, changes);
  return {
    changes: [...changes].map(([path, sha]) => ({ path, sha })),
    manifest: {
      schema: 1, createdAt: inp.createdAt, reason: 'restore', publishId: inp.restoredPublishId,
      restoredPublishId: inp.restoredPublishId, backupPublishId: inp.currentPublishId,
      fromCommit: inp.fromCommit, files,
    },
  };
}

/** Xoá `backup/files/*` cũ không còn được manifest mới tham chiếu (chỉ giữ 1 bản). */
function dropUnreferencedBackups(tree: TreeMap, files: ManifestFile[], changes: Map<string, string | null>) {
  const keep = new Set(files.map((f) => f.backupPath).filter((x): x is string => !!x));
  for (const p of Object.keys(tree)) {
    if (p.startsWith(BACKUP_PREFIX) && !keep.has(p) && !changes.has(p)) changes.set(p, null);
  }
  // backupPath được set null bởi swap nhưng vẫn nằm trong keep? (không xảy ra: keep chỉ gồm entry existed)
}

/** Áp kế hoạch lên tree (dùng cho test, DevServer). */
export function applyChanges(tree: TreeMap, changes: TreeChange[]): TreeMap {
  const out: TreeMap = { ...tree };
  for (const c of changes) {
    if (c.sha === null) delete out[c.path];
    else out[c.path] = c.sha;
  }
  return out;
}

/** Kiểm tra cấu trúc manifest đọc từ repo. */
export function parseManifest(raw: unknown): BackupManifest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const m = raw as Partial<BackupManifest>;
  if (m.schema !== 1 || !Array.isArray(m.files)) return null;
  const files = m.files.filter((f): f is ManifestFile =>
    typeof f === 'object' && f !== null && typeof f.path === 'string' && typeof f.existed === 'boolean');
  return {
    schema: 1,
    createdAt: typeof m.createdAt === 'string' ? m.createdAt : '',
    reason: m.reason === 'restore' ? 'restore' : 'publish',
    publishId: typeof m.publishId === 'string' ? m.publishId : '',
    restoredPublishId: typeof m.restoredPublishId === 'string' ? m.restoredPublishId : null,
    backupPublishId: typeof m.backupPublishId === 'string' ? m.backupPublishId : null,
    fromCommit: typeof m.fromCommit === 'string' ? m.fromCommit : '',
    files,
  };
}

/** Bản sao lưu có gì để khôi phục không. */
export const manifestHasBackup = (m: BackupManifest | null) => !!m && m.files.length > 0;
