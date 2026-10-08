/**
 * Ngân sách bundle guest (solution 9.1). Danh sách file lấy từ .wp-build/budget.json
 * (plugin inject-config-og ghi lúc build: entry + module openStyle + loại hạt đang dùng = "JS ban đầu";
 * admin: entry admin + import tĩnh = "Admin JS ban đầu", route tải lười = "admin lazy").
 */
const fs = require('node:fs');
const path = require('node:path');

const budgetPath = path.join(__dirname, '.wp-build', 'budget.json');
if (!fs.existsSync(budgetPath)) {
  throw new Error('Chưa có .wp-build/budget.json - chạy `vite build` trước khi chạy size-limit.');
}
const b = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
// size-limit dùng glob -> luôn dùng "/" (kể cả trên Windows)
const p = (f) => `${b.outDir.split(path.sep).join('/')}/${f}`;
const base = (f) => path.basename(f).replace(/-[\w-]{8}\.js$/, '');

module.exports = [
  { name: 'JS ban đầu (entry + openStyle + hạt đang dùng)', path: b.initialJs.map(p), limit: '60 KB', gzip: true },
  { name: 'CSS ban đầu', path: b.initialCss.map(p), limit: '25 KB', gzip: true },
  ...b.openStyle.map((f) => ({ name: `openStyle: ${base(f)}`, path: p(f), limit: '4 KB', gzip: true })),
  ...b.particle.map((f) => ({ name: `hạt: ${base(f)}`, path: p(f), limit: '1.5 KB', gzip: true })),
  ...b.lazy.map((f) => ({ name: `lazy: ${base(f)}`, path: p(f), limit: '15 KB', gzip: true })),
  // admin (v2) - solution 9.1 cho phép ≤ 150 KB; đặt chặt hơn để phát hiện phình sớm (frontend-report-v2 mục ngân sách)
  ...(b.adminInitialJs?.length ? [{ name: 'Admin JS ban đầu', path: b.adminInitialJs.map(p), limit: '80 KB', gzip: true }] : []),
  ...(b.adminInitialCss?.length ? [{ name: 'Admin CSS', path: b.adminInitialCss.map(p), limit: '10 KB', gzip: true }] : []),
  ...(b.adminLazy ?? []).map((f) => ({ name: `admin lazy: ${base(f)}`, path: p(f), limit: '15 KB', gzip: true })),
];
