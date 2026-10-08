/**
 * Plugin `dev-admin-save` (solution 1, 6): CHỈ chạy ở `vite dev` (apply: 'serve').
 * Middleware `/__admin/*` cho DevServerAdapter - cùng thuật toán publish/restore (manifest + swap) với GitHub,
 * nhưng thao tác trên file system: `public/content/**` và `backup/**`.
 *
 * Gốc ghi = biến môi trường WP_DEV_SAVE_ROOT (e2e dùng thư mục tạm) hoặc thư mục dự án.
 * "commit" = sha1 của bảng path->sha hiện tại (optimistic lock: baseCommit khác -> 409).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
  CONFIG_PATH, MANIFEST_PATH, backupPathOf, parseManifest, planPublish, planRestore, type TreeMap,
} from '../../src/shared/storage/manifest.ts';

const gitSha = (b: Buffer) => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const ALLOWED = /^(public\/content\/|backup\/)[^\0]*$/;

function safeRel(p: string): string {
  const n = path.posix.normalize(p.replace(/\\/g, '/'));
  if (n.startsWith('..') || n.startsWith('/') || n.includes('/../') || !ALLOWED.test(n)) throw new HttpError(400, 'bad-path', `Đường dẫn không hợp lệ: ${p}`);
  return n;
}

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function scanTree(root: string): TreeMap {
  const out: TreeMap = {};
  const walk = (rel: string) => {
    const abs = path.join(root, rel);
    if (!existsSync(abs)) return;
    for (const name of readdirSync(abs)) {
      const r = `${rel}/${name}`;
      const st = statSync(path.join(root, r));
      if (st.isDirectory()) walk(r);
      else out[r] = gitSha(readFileSync(path.join(root, r)));
    }
  };
  walk('public/content');
  walk('backup');
  return out;
}

export function treeCommit(t: TreeMap): string {
  const h = createHash('sha1');
  for (const k of Object.keys(t).sort()) h.update(`${k}\0${t[k]}\n`);
  return h.digest('hex');
}

function readJsonAt(root: string, rel: string): unknown {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) return null;
  try { return JSON.parse(readFileSync(abs, 'utf8')); } catch { return null; }
}

const publishIdOf = (c: unknown) => {
  const id = (c as { publish?: { id?: unknown } } | null)?.publish?.id;
  return typeof id === 'string' && id ? id : null;
};

/** Áp danh sách thay đổi lên đĩa: đọc mọi nội dung nguồn TRƯỚC rồi mới ghi/xoá. */
function applyOnDisk(root: string, tree: TreeMap, changes: { path: string; sha: string | null }[], fresh: Map<string, Buffer>) {
  const bySha = new Map<string, string>();
  for (const [p, s] of Object.entries(tree)) if (!bySha.has(s)) bySha.set(s, p);
  const contents = new Map<string, Buffer | null>();
  for (const c of changes) {
    if (c.sha === null) { contents.set(c.path, null); continue; }
    const buf = fresh.get(c.sha) ?? (bySha.has(c.sha) ? readFileSync(path.join(root, bySha.get(c.sha)!)) : null);
    if (!buf) throw new HttpError(500, 'server', `Thiếu nội dung cho ${c.path}`);
    contents.set(c.path, buf);
  }
  for (const [rel, buf] of contents) {
    const abs = path.join(root, safeRel(rel));
    if (buf === null) { if (existsSync(abs)) rmSync(abs); continue; }
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, buf);
  }
}

async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const s = Buffer.concat(chunks).toString('utf8');
  return s ? JSON.parse(s) : {};
}

const send = (res: ServerResponse, status: number, v: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(v));
};

export function devPublish(root: string, input: {
  baseCommit: string; config: { publish: { id: string } };
  uploads: { path: string; slot?: string; base64?: string; fromRepo?: boolean }[];
  deletes: { path: string; slot?: string }[];
}, now = new Date()) {
  const tree = scanTree(root);
  const head = treeCommit(tree);
  if (input.baseCommit && input.baseCommit !== head) throw new HttpError(409, 'conflict', 'Trang vừa được xuất bản từ nơi khác. Tải lại để xem bản mới nhất.');
  const fresh = new Map<string, Buffer>();
  const files: { path: string; sha: string; slot?: string }[] = [];
  const cfg = Buffer.from(`${JSON.stringify(input.config, null, 2)}\n`, 'utf8');
  fresh.set(gitSha(cfg), cfg);
  files.push({ path: CONFIG_PATH, sha: gitSha(cfg) });
  for (const u of input.uploads ?? []) {
    const p = safeRel(u.path);
    let sha: string | undefined;
    if (u.base64) {
      const b = Buffer.from(u.base64, 'base64');
      sha = gitSha(b);
      fresh.set(sha, b);
    } else sha = tree[p] ?? tree[backupPathOf(p)];
    if (!sha) throw new HttpError(400, 'unknown', `Thiếu nội dung tệp ${p}`);
    files.push({ path: p, sha, ...(u.slot ? { slot: u.slot } : {}) });
  }
  const plan = planPublish({
    tree, files, deletes: (input.deletes ?? []).map((d) => ({ ...d, path: safeRel(d.path) })),
    publishId: input.config.publish.id, backupPublishId: publishIdOf(readJsonAt(root, CONFIG_PATH)),
    createdAt: now.toISOString(), fromCommit: head,
  });
  const man = Buffer.from(`${JSON.stringify(plan.manifest, null, 2)}\n`, 'utf8');
  fresh.set(gitSha(man), man);
  applyOnDisk(root, tree, [...plan.changes, { path: MANIFEST_PATH, sha: gitSha(man) }], fresh);
  return { commit: treeCommit(scanTree(root)), publishId: input.config.publish.id };
}

export function devRestore(root: string, baseCommit: string, now = new Date()) {
  const tree = scanTree(root);
  const head = treeCommit(tree);
  if (baseCommit && baseCommit !== head) throw new HttpError(409, 'conflict', 'Trang vừa được xuất bản từ nơi khác. Tải lại để xem bản mới nhất.');
  const manifest = parseManifest(readJsonAt(root, MANIFEST_PATH));
  if (!manifest || !manifest.files.length) throw new HttpError(400, 'no-backup', 'Chưa có bản sao lưu. Bản sao lưu được tạo tự động mỗi lần Xuất bản.');
  const restoredPublishId = publishIdOf(readJsonAt(root, backupPathOf(CONFIG_PATH))) ?? '';
  const plan = planRestore({
    tree, manifest, restoredPublishId, currentPublishId: publishIdOf(readJsonAt(root, CONFIG_PATH)),
    createdAt: now.toISOString(), fromCommit: head,
  });
  const man = Buffer.from(`${JSON.stringify(plan.manifest, null, 2)}\n`, 'utf8');
  applyOnDisk(root, tree, [...plan.changes, { path: MANIFEST_PATH, sha: gitSha(man) }], new Map([[gitSha(man), man]]));
  return { commit: treeCommit(scanTree(root)), restoredPublishId };
}

export function devAdminSave(): Plugin {
  let root = process.cwd();
  return {
    name: 'wp:dev-admin-save',
    apply: 'serve',
    configResolved(c) {
      root = process.env.WP_DEV_SAVE_ROOT ? path.resolve(process.env.WP_DEV_SAVE_ROOT) : c.root;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://x');
        if (!url.pathname.startsWith('/__admin/')) return next();
        try {
          const action = url.pathname.slice('/__admin/'.length);
          if (action === 'ping') return send(res, 200, { ok: true, root: path.basename(root) });
          if (action === 'snapshot' && req.method === 'GET') {
            const tree = scanTree(root);
            return send(res, 200, { commit: treeCommit(tree), config: readJsonAt(root, CONFIG_PATH), manifest: readJsonAt(root, MANIFEST_PATH), paths: tree });
          }
          if (action === 'file' && req.method === 'GET') {
            const rel = safeRel(url.searchParams.get('path') ?? '');
            const abs = path.join(root, rel);
            if (!existsSync(abs)) throw new HttpError(404, 'not-found', 'Không tìm thấy tệp');
            res.setHeader('Cache-Control', 'no-store');
            return res.end(readFileSync(abs));
          }
          if (action === 'publish' && req.method === 'POST') {
            const r = devPublish(root, (await body(req)) as Parameters<typeof devPublish>[1]);
            server.ws.send({ type: 'custom', event: 'wp:content-changed', data: {} });
            return send(res, 200, r);
          }
          if (action === 'restore' && req.method === 'POST') {
            const b = (await body(req)) as { baseCommit?: string };
            const r = devRestore(root, b.baseCommit ?? '');
            server.ws.send({ type: 'custom', event: 'wp:content-changed', data: {} });
            return send(res, 200, r);
          }
          throw new HttpError(404, 'not-found', 'Không có endpoint này');
        } catch (e) {
          if (e instanceof HttpError) return send(res, e.status, { error: e.code, message: e.message });
          return send(res, 500, { error: 'server', message: (e as Error).message });
        }
      });
    },
  };
}
