#!/usr/bin/env node
/**
 * Sinh ảnh/nhạc mẫu NHẸ cho dữ liệu demo (không tải từ internet):
 *  - ảnh: SVG gradient + bokeh, tên có hash nội dung (cache immutable)
 *  - nhạc: WAV mono 8-bit 11 kHz ~10 giây (arpeggio sine có envelope) - chỉ để thử player
 * Chạy: node scripts/gen-placeholders.mjs  -> in ra JSON ImageRef để dán vào config.json
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const out = path.join(root, 'public', 'content');
const h8 = (b) => createHash('sha256').update(b).digest('hex').slice(0, 8);

// màu tông ấm (hợp Trầm Vàng, vẫn trung tính cho son-do / dem-nhung)
const PALETTES = [
  ['#7d6a58', '#c9a88a', '#efe2d2'], ['#5e4b3c', '#b08968', '#e6ccb2'], ['#6b5a6e', '#c2a3b5', '#f0dfe6'],
  ['#4f5d56', '#9fb3a6', '#e3ebe4'], ['#80604d', '#d2a679', '#f5e3c8'], ['#5a4a42', '#a98b76', '#eadbc8'],
  ['#3f4a5a', '#8d9db5', '#dde3ee'], ['#6e4f4a', '#c48e7e', '#f3d9cf'],
];

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function svg(w, h, pal, kind) {
  const [a, b, c] = pal;
  const circles = Array.from({ length: 9 }, () => {
    const r = (0.04 + rnd() * 0.12) * w;
    return `<circle cx="${(rnd() * w).toFixed(0)}" cy="${(rnd() * h).toFixed(0)}" r="${r.toFixed(0)}" fill="${c}" opacity="${(0.08 + rnd() * 0.18).toFixed(2)}"/>`;
  }).join('');
  // hình người cách điệu (2 đầu + vai) cho ảnh cưới, 1 người cho chân dung
  const fig = (cx, s) => `<g fill="${a}" opacity=".55"><circle cx="${cx}" cy="${h * 0.52}" r="${s * 0.09}"/><path d="M${cx - s * 0.2} ${h} C${cx - s * 0.2} ${h * 0.68} ${cx + s * 0.2} ${h * 0.68} ${cx + s * 0.2} ${h}Z"/></g>`;
  const people = kind === 'couple' ? fig(w * 0.42, w) + fig(w * 0.6, w * 0.92) : kind === 'single' ? fig(w * 0.5, w * 1.1) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${c}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient><radialGradient id="l" cx=".7" cy=".2" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#l)"/>${circles}${people}</svg>`;
}

function writeImg(slot, name, w, h, pal, kind, alt) {
  const dir = path.join(out, 'images', slot);
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.startsWith(`${name}.`)) rmSync(path.join(dir, f));
  const s = svg(w, h, pal, kind);
  const file = `${name}.${h8(s)}.svg`;
  writeFileSync(path.join(dir, file), s);
  return { src: `content/images/${slot}/${file}`, w, h, alt, dominantColor: pal[1] };
}

function wav() {
  const rate = 11025;
  const secs = 10;
  const n = rate * secs;
  const buf = Buffer.alloc(44 + n);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate, 28); buf.writeUInt16LE(1, 32); buf.writeUInt16LE(8, 34); buf.write('data', 36); buf.writeUInt32LE(n, 40);
  const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 587.33, 440.0, 349.23]; // C-E-G-C... arpeggio
  const step = (secs / notes.length) * rate;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(i / step);
    const t = (i - k * step) / rate;
    const env = Math.exp(-t * 2.2) * Math.min(1, t * 60);
    const f = notes[k % notes.length];
    const s = 0.28 * env * (Math.sin(2 * Math.PI * f * (i / rate)) + 0.3 * Math.sin(4 * Math.PI * f * (i / rate)));
    buf[44 + i] = Math.max(0, Math.min(255, Math.round(128 + s * 127)));
  }
  const dir = path.join(out, 'audio');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.startsWith('sample-chime.')) rmSync(path.join(dir, f));
  const file = `sample-chime.${h8(buf)}.wav`;
  writeFileSync(path.join(dir, file), buf);
  return `content/audio/${file}`;
}

const res = {
  hero: writeImg('hero', 'hero', 900, 1600, PALETTES[0], 'couple', 'Minh Anh và Thuỳ Linh trong ngày chụp ảnh cưới'),
  groom: writeImg('couple', 'groom', 800, 1000, PALETTES[6], 'single', 'Chú rể Nguyễn Minh Anh'),
  bride: writeImg('couple', 'bride', 800, 1000, PALETTES[2], 'single', 'Cô dâu Trần Thuỳ Linh'),
  thankyou: writeImg('thankyou', 'thankyou', 1200, 800, PALETTES[4], 'couple', 'Minh Anh và Thuỳ Linh'),
  album: [
    [900, 1200], [1200, 800], [900, 1200], [1000, 1000], [1200, 800], [900, 1350], [1200, 900], [900, 1200],
  ].map(([w, h], i) => writeImg('album', `album-${String(i + 1).padStart(2, '0')}`, w, h, PALETTES[i % PALETTES.length], i % 3 === 1 ? 'single' : 'couple', `Ảnh cưới ${i + 1}`)),
  audio: wav(),
};
console.log(JSON.stringify(res, null, 2));
