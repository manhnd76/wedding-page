// Helper sinh asset v4a-2 (ui-ux-designer). Chỉ là công cụ tài liệu trong docs/, không phải code ứng dụng.
// Đường dẫn TƯƠNG ĐỐI theo vị trí file này (chạy được trên mọi máy): node docs/tasks/<id>/assets/v4a-2/_generator/<x>.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

export const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const f = (n) => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? '0' : String(v); };
export const f1 = (n) => { const v = Math.round(n * 10) / 10; return Object.is(v, -0) ? '0' : String(v); };
export const pt = (x, y) => `${f(x)} ${f(y)}`;
export const pt1 = (x, y) => `${f1(x)} ${f1(y)}`;
const rad = (d) => (d * Math.PI) / 180;
export const polar = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
export const tr = (x, y, a = 0, s = 1) => `translate(${f(x)} ${f(y)})${a ? ` rotate(${f(a)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;

/** PRNG có seed (vẽ tay lặp lại được) */
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** đường cong khép kín mượt qua các điểm (Catmull-Rom -> Bezier), làm tròn 1 chữ số */
export function smoothClosed(pts, p = pt1) {
  const n = pts.length; let d = `M${p(...pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${p(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)} ${p(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)} ${p(...p2)}`;
  }
  return d + 'Z';
}
export function smoothOpen(pts, p = pt1) {
  const n = pts.length; let d = `M${p(...pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    d += `C${p(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)} ${p(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)} ${p(...p2)}`;
  }
  return d;
}
/** vệt loang (blob) có seed */
export function blob(cx, cy, rx, ry, seed, n = 9, jit = 0.22, p = pt1) {
  const r = rng(seed); const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.3; const k = 1 - jit / 2 + r() * jit;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts, p);
}
/** áp transform điểm (xoay quanh gốc + dời) */
export const xf = (pts, a = 0, dx = 0, dy = 0, sx = 1, sy = sx) => pts.map(([x, y]) => {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return [x * sx * c - y * sy * s + dx, x * sx * s + y * sy * c + dy];
});

/** cánh/lá đối xứng dọc trục: profile = [[t (0..1 dọc trục), nửa bề rộng]] -> path khép kín, gốc (0,0) mũi (0,-len) */
export function leafPath(len, profile, p = pt1) {
  const right = profile.map(([t, w]) => [w, -t * len]);
  const left = [...profile].reverse().map(([t, w]) => [-w, -t * len]);
  return smoothClosed([[0, 0], ...right.slice(1, -1), [0, -len], ...left.slice(1, -1)], p);
}

export function write(file, body, limit) {
  const full = join(OUT, file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, body);
  const raw = Buffer.byteLength(body);
  const gz = gzipSync(body, { level: 9 }).length;
  const warn = limit && raw > limit ? `  !! vượt ${limit}B` : '';
  console.log(`${relative(OUT, full).padEnd(48)} ${String(raw).padStart(6)} B  gz ${String(gz).padStart(5)} B${warn}`);
  return { file, raw, gz };
}

/** SVG đơn: dùng làm mask-image (1 màu, alpha) hoặc xem thử */
/** XML comment không được chứa "--" (SVG hỏng -> mask không tải): biến CSS ghi dạng "‐‐op-x" (U+2010) */
export const cmt = (s) => s.replace(/--/g, '\u2010\u2010');
export function svgDoc(file, comment, vb, inner, limit = 0, extra = '') {
  comment = cmt(comment);
  const [, , w, h] = vb.split(' ');
  const body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}"${extra}>\n<!-- ${comment} -->\n${inner}\n</svg>\n`;
  return write(file, body, limit);
}

/** sprite nhiều symbol (dùng <use href="file#id"> hoặc chép path vào TS) */
export function sprite(file, comment, symbols, limit = 0) {
  comment = cmt(comment);
  const body = `<svg xmlns="http://www.w3.org/2000/svg">\n<!-- ${comment} -->\n${symbols.map(([id, vb, inner]) => `<symbol id="${id}" viewBox="${vb}">${inner}</symbol>`).join('\n')}\n</svg>\n`;
  return write(file, body, limit);
}

/** cỡ gzip của chuỗi (ước lượng phần dữ liệu path nhúng vào module TS) */
export const gz = (s) => gzipSync(s, { level: 9 }).length;
