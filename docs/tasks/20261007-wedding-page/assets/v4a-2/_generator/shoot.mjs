// Chụp ảnh xem thử asset v4a-2 bằng Chromium của Playwright (không cần Chrome).
// node shoot.mjs <page.html> <out.png> [width] [height] [query]
// Server tĩnh tạm phục vụ thư mục assets/v4a-2 (mask-image cần http, file:// bị chặn CORS).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');                       // assets/v4a-2
const SHOTS = join(HERE, '../../../screenshots/v4a-2'); // docs/tasks/<id>/screenshots/v4a-2
const require = createRequire(join(HERE, '../../../../../../package.json'));
const { chromium } = require('playwright');
const EXEC = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';

const [page = 'preview/open.html', out = 'open.png', w = '1400', h = '900', query = ''] = process.argv.slice(2);
const types = { '.html': 'text/html', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const srv = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^([/\\])+/, '');
  const nm = p.startsWith('nm/') || p.startsWith('nm\\');
  const file = nm ? join(HERE, '../../../../../../node_modules', p.slice(3)) : join(ROOT, p);
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;
let exe = EXEC;
try { const { statSync, readdirSync } = await import('node:fs'); if (statSync(EXEC).isDirectory()) { const d = readdirSync(EXEC).find((x) => x.startsWith('chrome-linux')); exe = join(EXEC, d ?? '', 'chrome'); } } catch { /* dùng nguyên */ }
const browser = await chromium.launch({ executablePath: exe });
const pg = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
pg.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await pg.goto(`http://127.0.0.1:${port}/_generator/${page}${query ? '?' + query : ''}`);
await pg.waitForFunction(() => window.__ready === true, null, { timeout: 15000 }).catch(() => console.log('(không thấy __ready, chụp luôn)'));
await mkdir(SHOTS, { recursive: true });
await pg.screenshot({ path: join(SHOTS, out), fullPage: true });
console.log('->', join('screenshots/v4a-2', out));
await browser.close();
srv.close();
