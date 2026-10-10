// Mảnh + tham số 4 burst (confetti, gold, red-paper, heart-burst) và mảnh E12 (6 mẫu phong thư).
// Đầu ra: ../burst/bursts.json + ../burst/<id>.svg ; ../envelope-e12/e12.json + ../envelope-e12/pieces.svg
// Tham số vật lý khớp engine ParticleField.addBurst: vx *= e^(-drag·dt); vy = vy·e^(-drag·dt) + gravity·dt (px, s).
// Đơn vị "vh" = window.innerHeight (tham số nhân lúc chạy để màn cao/thấp có quỹ đạo tương đương).
import { K, heartD, star4b, tf, writeKinds } from './particles.mjs';
import { f1, write } from './lib.mjs';

const rect = (w, h, r = 0.6) => `M${f1(-w / 2 + r)} ${f1(-h / 2)}H${f1(w / 2 - r)}Q${f1(w / 2)} ${f1(-h / 2)} ${f1(w / 2)} ${f1(-h / 2 + r)}V${f1(h / 2 - r)}Q${f1(w / 2)} ${f1(h / 2)} ${f1(w / 2 - r)} ${f1(h / 2)}H${f1(-w / 2 + r)}Q${f1(-w / 2)} ${f1(h / 2)} ${f1(-w / 2)} ${f1(h / 2 - r)}V${f1(-h / 2 + r)}Q${f1(-w / 2)} ${f1(-h / 2)} ${f1(-w / 2 + r)} ${f1(-h / 2)}Z`;
const redPaper = K.find((k) => k.id === 'red-paper');

// ---------- mảnh burst (cùng định dạng layer với hạt nền; "piece" = 1 sprite)
const PIECES = [
  { id: 'confetti', name: 'Giấy màu', motion: 'burst', flip: true, size: [16, 24] /* P06 vòng 1 (confetti.ts SIZE; gift-box giữ cỡ riêng [6, 10]) */, natural: null,
    colorNote: 'theme sáng: [accent, accent-2, primary, mix(accent,#fff,.45)]; theme tối: [primary, accent, #F2E9E1, mix(primary,#fff,.3)]. Mỗi mảnh 1 màu ngẫu nhiên -> sprite = hình × màu (4×4 = 16 sprite nhỏ)',
    variants: [
      { w: 0.4, key: 'cf-rect', layers: [{ d: rect(11, 6), fill: 'c1' }], back: [{ d: rect(11, 6), fill: 'dark' }] },
      { w: 0.2, key: 'cf-square', layers: [{ d: rect(7, 7, 0.5), fill: 'c1' }], back: [{ d: rect(7, 7, 0.5), fill: 'dark' }] },
      { w: 0.2, key: 'cf-circle', layers: [{ circle: [0, 0, 4], fill: 'c1' }] },
      { w: 0.2, key: 'cf-strip', layers: [{ d: 'M-1.5-9C3-6-3-2 1.5 1S-3 6 1.5 9', stroke: 'c1', lw: 2.4 }] },
    ] },
  { id: 'gold', name: 'Bụi vàng', motion: 'burst', flip: false, size: [3, 10], natural: ['#C9A24A', '#FFF4D6'], naturalDark: ['#F3D48C', '#FFF8E6'],
    colorNote: 'theo mode: sáng = vàng đậm #C9A24A/#B8862F (bụi vàng nhạt biến mất trên nền giấy), tối = #F3D48C. Lõi c2 sáng',
    variants: [
      { w: 0.7, key: 'gd-dot', layers: [{ radial: [0, 0, 12], stops: [[0, 'c2', 1], [0.3, 'c1', 0.95], [1, 'c1', 0]] }] },
      { w: 0.3, key: 'gd-star', layers: [{ d: star4b(11, 0.16), fill: 'c1' }, { circle: [0, 0, 1.8], fill: 'c2', a: 0.95 }] },
    ] },
  { id: 'red-paper', name: 'Xác pháo giấy', motion: 'burst', flip: true, size: [8, 14], natural: redPaper.natural, naturalDark: redPaper.naturalDark,
    colorNote: 'dùng chung sprite với hạt nền red-paper (particles.json) - 3 biến thể + mặt sau #F2B8A2', variants: redPaper.variants.map((v, i) => ({ ...v, key: `rp-${i + 1}` })) },
  { id: 'heart-burst', name: 'Tim bung', motion: 'burst', flip: false, size: [10, 20], natural: null,
    colorNote: 'theme: [primary, accent, mix(primary,#fff,.35)] (theme tối: primary vàng, accent, #F2E9E1)',
    variants: [
      { w: 0.6, key: 'hb-solid', layers: [{ d: heartD(10.5), fill: 'c1' }, { d: 'M-6.6-4.6C-5.6-7.4-3-7.6-1.8-6', stroke: '#FFFFFF', lw: 1.3, a: 0.55 }] },
      { w: 0.25, key: 'hb-line', layers: [{ d: heartD(9.6), stroke: 'c1', lw: 1.8 }] },
      { w: 0.15, key: 'hb-mini', layers: [{ d: tf(heartD(5.5), -4, 2, -12), fill: 'c1' }, { d: tf(heartD(4.2), 5, -3, 14), fill: 'c1', a: 0.7 }] },
    ] },
];

// ---------- tham số phát (counts: [Nhẹ, Vừa, Nhiều] khớp BURST_COUNTS trong intensity.ts)
const EMIT = {
  confetti: {
    counts: [0, 80, 120], rsvpCounts: [0, 40, 60], durationMs: 1800,
    onOpen: { emitters: [{ x: 0.06, y: 1.02, angle: [-80, -55], share: 0.5 }, { x: 0.94, y: 1.02, angle: [-125, -100], share: 0.5 }],
      speedVh: [2.0, 2.8], gravityVh: 0.6, drag: 2.2, life: [1500, 1800], spin: [4, 9], flipRate: [3, 7], stagger: 'trong 120ms đầu, mỗi bên 3 nhịp 40ms',
      result: 'đỉnh 26–41% chiều cao màn lúc ~950ms, rơi chậm ~200px/s (giới hạn = g/drag), mờ từ 70% đời' },
    rsvp: { emitters: [{ anchor: 'nút "Gửi xác nhận" (rect.top, giữa ngang)', angle: [-140, -40] }], speedPx: [520, 820], gravityPx: 1100, drag: 1.6, life: [1100, 1400],
      result: 'vồng 100–130px trên nút, không phủ form (form là vùng loại trừ, hạt mờ khi vào)' },
  },
  gold: {
    counts: [0, 60, 100], durationMs: 1400,
    onOpen: { emitters: [{ x: 0.5, y: 0.42, angle: [0, 360] }], speedPx: [100, 420], gravity: 30, drag: 2.4, life: [1100, 1400], twinkle: 'alpha × (0.6 + 0.4·sin(ph·9)) - nhấp nháy ~1.4Hz, không đồng pha', sizeByPiece: { 'gd-dot': [3, 6], 'gd-star': [6, 10] },
      result: 'toả tròn bán kính 40–175px quanh tâm, tắt dần' },
  },
  'red-paper': {
    counts: [0, 80, 120], durationMs: 1800,
    onOpen: { waves: [
      { at: 0, share: 0.4, from: 'điểm (50%, 12%)', angle: [20, 160], speedPx: [300, 650] },
      { at: 150, share: 0.3, from: 'dải mép trên x 12–88%, y -12px', angle: [70, 110], speedPx: [150, 420] },
      { at: 300, share: 0.3, from: 'dải mép trên x 12–88%, y -12px', angle: [70, 110], speedPx: [150, 420] }],
      gravity: 520, drag: 1.6, life: [1500, 1800], spin: [3, 6], flipRate: [4, 8], toBg: 'true nếu hạt nền có red-paper (như burst petals)',
      result: 'bung hình quạt từ trên rồi mưa xác pháo, rơi ~325px/s' },
  },
  'heart-burst': {
    counts: [0, 8, 12], durationMs: 1200,
    onWish: { emitters: [{ anchor: 'nút "Gửi lời chúc" (giữa, mép trên)', angle: [-150, -30] }], speedPx: [220, 380], gravity: 260, drag: 1.2, life: [1000, 1200], scaleIn: '0.4 -> 1 trong 150ms (--ease-pop)', spin: [-0.6, 0.6],
      result: 'vồng 60–100px trên nút, toả ±60°' },
  },
};

const sizes = writeKinds(PIECES, 'burst', 'bursts.json', ['#C9A86A', '#8A6A3B']);
// gắn tham số phát vào manifest
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT } from './lib.mjs';
const bj = JSON.parse(readFileSync(join(OUT, 'burst/bursts.json'), 'utf8'));
bj.items = bj.items.map((it) => ({ ...it, emit: EMIT[it.id] }));
bj.physics = 'vx *= e^(-drag·dt); vy = vy·e^(-drag·dt) + gravity·dt; alpha = 1 tới 70% đời rồi tuyến tính về 0 (field.ts hiện có)';
writeFileSync(join(OUT, 'burst/bursts.json'), JSON.stringify(bj, null, 1) + '\n');
console.log('# burst (gz ước lượng):', JSON.stringify(sizes));

// ---------- mảnh E12
const E12 = [
  { id: 'e12-lavender', name: 'Oải hương (kraft)', motion: 'burst', flip: true, size: [10, 16], natural: ['#8E7CC3', '#7A8F5C'],
    variants: [{ w: 1, key: 'e12-lav', layers: [{ d: 'M0 11V-6', stroke: 'c2', lw: 0.9 }, ...[[0, -9, 0], [-1.6, -5.6, -20], [1.6, -4.4, 20], [-1.6, -1.6, -20], [1.6, 0, 20], [-1.2, 3, -18]].map(([x, y, a], i) => ({ d: tf('M0 -2.2C1.3-2.2 1.6 2.2 0 2.2-1.6 2.2-1.3-2.2 0-2.2Z', x, y, a), fill: i % 2 ? '#A895D6' : 'c1' }))] }] },
  { id: 'e12-lace-petal', name: 'Cánh hoa ép (lace)', motion: 'burst', flip: true, size: [9, 14], natural: null, colorNote: 'c1 = accent, c2 = accent-2 (đúng màu cụm hoa của skin lace: .fl-1/.fl-2)',
    variants: [
      { w: 0.5, key: 'e12-lp1', layers: [{ d: 'M0 9C-5.4 6-6 -2-3.4-6.6-2-9 2-9 3.4-6.6 6-2 5.4 6 0 9Z', fill: 'c1' }, { d: 'M0 8V-5', stroke: 'dark', lw: 0.5, a: 0.25 }] },
      { w: 0.5, key: 'e12-lp2', layers: [{ d: 'M0 9C-5.4 6-6 -2-3.4-6.6-2-9 2-9 3.4-6.6 6-2 5.4 6 0 9Z', fill: 'c2' }, { d: 'M-2-4C-1-6.4 1.4-6.6 2.4-5', stroke: 'light', lw: 0.9, a: 0.6 }] },
    ] },
  { id: 'e12-dot', name: 'Chấm sticker (minimal)', motion: 'burst', flip: false, size: [4, 8], natural: null, colorNote: 'c1 = accent (màu sticker), c2 = --env-ink',
    variants: [{ w: 0.7, key: 'e12-dot', layers: [{ circle: [0, 0, 8], fill: 'c1' }] }, { w: 0.3, key: 'e12-ring', layers: [{ circle: [0, 0, 7], stroke: 'c2', lw: 2.4 }] }] },
];
const eSizes = writeKinds(E12, 'envelope-e12', 'e12.json', ['#E3BDB5', '#A4495A']);
console.log('# e12 (gz ước lượng):', JSON.stringify(eSizes));
