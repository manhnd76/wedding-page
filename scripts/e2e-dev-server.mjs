/**
 * E2E: chạy `vite dev` ở cổng PW_DEV_PORT (mặc định 5175) với dev-admin-save ghi vào THƯ MỤC TẠM (bản sao public/content),
 * để test chế độ Máy chủ dev không đụng file thật của dự án. Không dùng cổng 5173 (dev server của người dùng).
 */
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const port = process.env.PW_DEV_PORT ?? '5175';
const root = mkdtempSync(path.join(tmpdir(), 'wp-e2e-'));
cpSync('public/content', path.join(root, 'public', 'content'), { recursive: true });
console.log(`[e2e-dev] WP_DEV_SAVE_ROOT=${root}`);
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', port, '--strictPort'], {
  stdio: 'inherit',
  env: { ...process.env, WP_DEV_SAVE_ROOT: root, WP_VITE_CACHE_DIR: `node_modules/.vite-e2e-${port}` },
});
const stop = () => { child.kill(); try { rmSync(root, { recursive: true, force: true }); } catch { /* ignore */ } };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
child.on('exit', (code) => process.exit(code ?? 0));
