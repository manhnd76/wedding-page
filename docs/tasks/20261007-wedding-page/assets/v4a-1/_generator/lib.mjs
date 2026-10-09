// Helper tạo SVG cho asset v4a-1 (ui-ux-designer). Chỉ dùng để sinh file trong docs/, không phải code ứng dụng.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const OUT = 'E:/claudecode/wedding-page/docs/tasks/20261007-wedding-page/assets/v4a-1';
export const f = (n) => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? '0' : String(v); };
export const pt = (x, y) => `${f(x)} ${f(y)}`;
const rad = (d) => (d * Math.PI) / 180;
export const polar = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

/** path nét (pathLength=100 để reveal svg-draw dùng chung) */
export const P = (d, attrs = '') => `<path pathLength="100" d="${d}"${attrs ? ' ' + attrs : ''}/>`;
export const C = (cx, cy, r, attrs = '') => `<circle pathLength="100" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${attrs ? ' ' + attrs : ''}/>`;
export const G = (inner, attrs = '') => `<g${attrs ? ' ' + attrs : ''}>${inner}</g>`;
export const STROKE = (w = 1, cap = 'round') => `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"`;
export const mirrorX = (inner, w) => `<g transform="matrix(-1 0 0 1 ${w} 0)">${inner}</g>`;
export const mirrorY = (inner, h) => `<g transform="matrix(1 0 0 -1 0 ${h})">${inner}</g>`;
export const swapXY = (inner) => `<g transform="matrix(0 1 1 0 0 0)">${inner}</g>`;
export const tr = (x, y, a = 0, s = 1) => `translate(${f(x)} ${f(y)})${a ? ` rotate(${f(a)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;

/** lá thon chuẩn của classic-line (dài 10) */
export const LEAF = 'M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z';
export const leaf = (x, y, a, s = 1) => P(LEAF, `transform="${tr(x, y, a, s)}"`);
/** lá bầu dục (khuynh diệp/ô-liu), dài 8 */
export const OVAL = 'M0 0C2-2.6 6-2.6 8 0C6 2.6 2 2.6 0 0Z';
export const oval = (x, y, a, s = 1) => P(OVAL, `transform="${tr(x, y, a, s)}"`);

/** PRNG có seed để vẽ tay lặp lại được */
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** đường cong khép kín mượt đi qua các điểm (Catmull-Rom -> cubic Bezier) */
export function smoothClosed(pts) {
  const n = pts.length; let d = `M${pt(...pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(...c1)} ${pt(...c2)} ${pt(...p2)}`;
  }
  return d + 'Z';
}
/** đường mở mượt qua các điểm */
export function smoothOpen(pts) {
  const n = pts.length; let d = `M${pt(...pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(...c1)} ${pt(...c2)} ${pt(...p2)}`;
  }
  return d;
}
/** vệt loang (blob) có seed */
export function blob(cx, cy, rx, ry, seed, n = 9, jit = 0.22) {
  const r = rng(seed); const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.3; const k = 1 - jit / 2 + r() * jit;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts);
}

/** điểm trên Bezier bậc 2 + tiếp tuyến (độ) */
export function quadAt(p0, p1, p2, t) {
  const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
  const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
  const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return [x, y, (Math.atan2(dy, dx) * 180) / Math.PI];
}

export function sprite(file, comment, symbols, limit = 12288) {
  const body = `<svg xmlns="http://www.w3.org/2000/svg">\n<!-- ${comment} -->\n${symbols.map(([id, vb, inner]) => `<symbol id="${id}" viewBox="${vb}">${inner}</symbol>`).join('\n')}\n</svg>\n`;
  return write(file, body, limit);
}
export function svgDoc(file, comment, vb, inner, limit, extra = '') {
  const [, , w, h] = vb.split(' ');
  const body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}"${extra}>\n<!-- ${comment} -->\n${inner}\n</svg>\n`;
  return write(file, body, limit);
}
export function write(file, body, limit = Infinity) {
  const p = `${OUT}/${file}`; mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, body);
  const size = Buffer.byteLength(body);
  const ok = size <= limit;
  console.log(`${ok ? 'OK ' : 'OVER'} ${file} ${size}B${limit !== Infinity ? ` / ${limit}` : ''}`);
  if (!ok) process.exitCode = 1;
  return size;
}
