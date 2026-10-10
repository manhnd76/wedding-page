#!/usr/bin/env node
/**
 * Sinh 16 module hạt nền v4a-2c (`src/guest/effects/particles/types/<id>.ts`) từ dữ liệu designer
 * `docs/tasks/20261007-wedding-page/assets/v4a-2/particles/particles.json` + ghi đè vòng sửa (`particles-overrides.mjs`).
 * Module chỉ chứa dữ liệu (engine vẽ bằng `drawLayers`); màu theo token (`tones`) do FE quyết định - bảng `TONES` dưới đây.
 *
 * Chạy (từ gốc repo hoặc bất kỳ đâu - đường dẫn tính theo vị trí script):
 *   node scripts/gen-particles.mjs            -> ghi lại module (chỉ file có thay đổi), in danh sách
 *   node scripts/gen-particles.mjs --check    -> không ghi; exit 1 nếu module lệch dữ liệu (CI / trước khi commit)
 *   node scripts/gen-particles.mjs --json <đường dẫn particles.json khác>
 * Unit test `tests/particle-modules.test.ts` gọi `renderAll()` và so với file trong repo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OVERRIDES } from './particles-overrides.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const JSON_PATH = path.join(ROOT, 'docs', 'tasks', '20261007-wedding-page', 'assets', 'v4a-2', 'particles', 'particles.json');
export const OUT_DIR = path.join(ROOT, 'src', 'guest', 'effects', 'particles', 'types');

/** Màu "theme" theo token (không có trong json; design §4.2 ghi bằng lời trong `colorNote`). */
export const TONES = {
  'petal-watercolor': { tones: ['accent', 'accent2'] },
  bubble: { tones: ['accent2', 'accent'] },
  sparkle: { tones: ['accent', 'accent'], tonesDark: ['primary', 'primary'] },
};

/** Khoá đầu module (dòng 1) và khoá bỏ qua khi in dòng 2 (tuỳ chọn chuyển động). */
const HEAD = ['id', 'motion', 'density', 'size', 'speed'];
const SKIP = new Set([...HEAD, 'name', 'natural', 'naturalDark', 'backColor', 'colorNote', 'variants', 'back']);

/** Literal JS gọn (khoá không ngoặc, chuỗi nháy đơn) - đúng định dạng module đã sinh ở 2c. */
export function lit(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return `[${v.map(lit).join(', ')}]`;
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : lit(k)}: ${lit(x)}`).join(', ')} }`;
  return String(v);
}

/** Bản sao json đã áp ghi đè (không đổi dữ liệu gốc). */
export function applyOverrides(items, overrides = OVERRIDES) {
  return items.map((it) => {
    const c = structuredClone(it);
    for (const o of overrides[c.id] ?? []) o.apply(c);
    return c;
  });
}

/** Nội dung module của 1 loại (đã áp ghi đè). */
export function renderItem(it, overrides = OVERRIDES) {
  const notes = (overrides[it.id] ?? []).map((o) => `\n * Vòng sửa ${o.id} (\`scripts/particles-overrides.mjs\`): ${o.note}`).join('');
  const l1 = HEAD.map((k) => `${k}: ${lit(it[k])}`).join(', ');
  const opt = Object.keys(it).filter((k) => !SKIP.has(k) && !(k === 'spin' && !it.spin) && !(k === 'flip' && !it.flip));
  const l2 = opt.map((k) => `${k}: ${lit(it[k])}`).join(', ');
  const col = [`natural: ${lit(it.natural ?? null)}`];
  if (it.naturalDark) col.push(`naturalDark: ${lit(it.naturalDark)}`);
  const t = TONES[it.id];
  if (t) { col.push(`tones: ${lit(t.tones)}`); if (t.tonesDark) col.push(`tonesDark: ${lit(t.tonesDark)}`); }
  const variant = (v) => {
    const o = { w: v.w };
    if (v.offset) o.offset = v.offset;
    o.layers = v.layers;
    if (v.back) o.back = v.back;
    return `    ${lit(o)},`;
  };
  return [
    "import type { ParticleKind } from '../kind';",
    '',
    '/**',
    ` * ${it.name} (design-v4a-2bc §4.2). Chỉ dữ liệu - engine vẽ bằng \`drawLayers\` (sprite-kit).`,
    ` * Sinh từ \`assets/v4a-2/particles/particles.json\` (ô 24×24 tâm 0,0). ${it.colorNote}${notes}`,
    ' */',
    'export const kind: ParticleKind = {',
    `  ${l1},`,
    ...(l2 ? [`  ${l2},`] : []),
    `  ${col.join(', ')},`,
    ...(it.back ? [`  back: ${lit(it.back)},`] : []),
    '  variants: [',
    ...it.variants.map(variant),
    '  ],',
    '};',
    '',
  ].join('\n');
}

/** { id -> nội dung module } cho mọi loại trong json. */
export function renderAll(jsonPath = JSON_PATH) {
  const j = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const unknown = Object.keys(OVERRIDES).filter((id) => !j.items.some((it) => it.id === id));
  if (unknown.length) throw new Error(`particles-overrides: loại không có trong json: ${unknown.join(', ')}`);
  return Object.fromEntries(applyOverrides(j.items).map((it) => [it.id, renderItem(it)]));
}

function main(argv) {
  const check = argv.includes('--check');
  const ji = argv.indexOf('--json');
  const files = renderAll(ji >= 0 ? path.resolve(argv[ji + 1]) : JSON_PATH);
  const diff = [];
  for (const [id, src] of Object.entries(files)) {
    const fp = path.join(OUT_DIR, `${id}.ts`);
    let cur = '';
    try { cur = readFileSync(fp, 'utf8').replace(/\r\n/g, '\n'); } catch { /* file mới */ }
    if (cur === src) continue;
    diff.push(id);
    if (!check) writeFileSync(fp, src);
  }
  const n = Object.keys(files).length;
  if (check) {
    console.log(diff.length ? `Lệch dữ liệu (${diff.length}/${n}): ${diff.join(', ')} - chạy: node scripts/gen-particles.mjs` : `OK: ${n} module khớp particles.json + ghi đè`);
    process.exitCode = diff.length ? 1 : 0;
  } else console.log(diff.length ? `Đã ghi ${diff.length}/${n}: ${diff.join(', ')}` : `Không đổi (${n} module)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
