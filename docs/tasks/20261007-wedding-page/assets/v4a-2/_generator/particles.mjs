// Sprite 16 loại hạt nền (design 5.7; spec design-v4a-2bc.md §4) + mảnh burst (§5) + mảnh E12 (§3).
// Đầu ra:
//   ../particles/particles.json  : manifest (path data cho Path2D, hệ toạ độ tâm (0,0), ô -12..12 = 24 đơn vị)
//   ../particles/<id>.svg        : xem thử (biến thể cạnh nhau, màu tự nhiên / màu mẫu)
//   ../burst/bursts.json, ../burst/<id>.svg, ../envelope-e12/e12.json, ../envelope-e12/pieces.svg
// Layer: { d, fill|stroke: 'c1'|'c2'|'light'|'dark'|'#hex', a?: alpha, lw?: nét } hoặc
//        { circle:[cx,cy,r], fill|stroke... } hoặc { radial:[cx,cy,r], stops:[[t,tone,a],...] }
// tone: c1/c2 = 2 màu truyền vào draw(); light = mix(c1,#fff,.4); dark = mix(c1,#000,.28).
import { blob, f1, gz, leafPath, pt1, rng, smoothClosed, smoothOpen, write, xf } from './lib.mjs';

const poly = (pts) => 'M' + pts.map(([x, y]) => pt1(x, y)).join('L') + 'Z';
const sm = (pts) => smoothClosed(pts);
const rot = (pts, a, dx = 0, dy = 0, sx = 1, sy = sx) => xf(pts, a, dx, dy, sx, sy);

// ---------- hình học dùng chung
/** cánh anh đào: obovate, khía chữ V ở đỉnh (đỉnh hướng lên -y) */
const sakuraPts = (len = 20, w = 7.2, notch = 1.8) => [
  [0, len / 2], [-w * 0.55, len * 0.32], [-w, 0], [-w * 0.92, -len * 0.3], [-w * 0.5, -len * 0.47], [-0.7, -len * 0.42],
  [0, -len * 0.42 + notch], [0.7, -len * 0.42], [w * 0.5, -len * 0.47], [w * 0.92, -len * 0.3], [w, 0], [w * 0.55, len * 0.32],
];
const heartD = (r) => { const p = (x, y) => pt1(x * r, y * r); return `M${p(0, 0.85)}C${p(-1.1, 0.05)} ${p(-0.75, -0.95)} ${p(0, -0.35)}C${p(0.75, -0.95)} ${p(1.1, 0.05)} ${p(0, 0.85)}Z`; };
const star4 = (R, r) => { const pts = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2; const rr = i % 2 ? r : R; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } let d = `M${pt1(...pts[0])}`; for (let i = 1; i <= 8; i++) { const p = pts[i % 8]; const prev = pts[i - 1]; if (i % 2) d += `Q${pt1(0, 0)} ${pt1(...p)}`; else d += `Q${pt1(0, 0)} ${pt1(...p)}`; void prev; } return d + 'Z'; };
const star4b = (R, k = 0.18) => `M0 ${f1(-R)}C${f1(R * k)} ${f1(-R * k)} ${f1(R * k)} ${f1(-R * k)} ${f1(R)} 0C${f1(R * k)} ${f1(R * k)} ${f1(R * k)} ${f1(R * k)} 0 ${f1(R)}C${f1(-R * k)} ${f1(R * k)} ${f1(-R * k)} ${f1(R * k)} ${f1(-R)} 0C${f1(-R * k)} ${f1(-R * k)} ${f1(-R * k)} ${f1(-R * k)} 0 ${f1(-R)}Z`;
void star4;

// ---------- 16 loại hạt
const K = [];

// 1. petal-sakura
{
  const v1 = sakuraPts();
  const v2 = rot(sakuraPts(19, 5.4, 1.4), 8);
  const blossom = []; for (let i = 0; i < 5; i++) blossom.push(sm(rot(sakuraPts(9.5, 3.6, 1).map(([x, y]) => [x, y - 5.2]), i * 72)));
  K.push({ id: 'petal-sakura', name: 'Hoa anh đào', motion: 'fall', density: 1.0, size: [12, 20], speed: [18, 36], sway: [22, 40], spin: 0.9, flip: true,
    natural: ['#F4B6C2', '#FBE3E8'], naturalDark: ['#F7C3CD', '#FDE9ED'], colorNote: 'theme -> màu tự nhiên hồng nhạt (như petal-peach); multi/hex -> theo cấu hình',
    variants: [
      { w: 0.55, layers: [{ d: sm(v1), fill: 'c1' }, { d: 'M0 10C-2 7-2 4 0 1.6 2 4 2 7 0 10Z', fill: 'dark', a: 0.22 }, { d: 'M0 9.4V-4.6', stroke: 'dark', lw: 0.5, a: 0.25 }, { d: sm(rot(sakuraPts(12, 4, 0.9), 0, 0, -3.4)), fill: 'c2', a: 0.55 }] },
      { w: 0.3, layers: [{ d: sm(v2), fill: 'c1' }, { d: smoothOpen(rot([[-4.2, 4], [-5, -2], [-3.4, -6.6]], 8)), stroke: 'light', lw: 0.9, a: 0.7 }] },
      { w: 0.15, layers: [{ d: blossom.join(''), fill: 'c1' }, { circle: [0, 0, 2.2], fill: 'c2' }, { d: [0, 72, 144, 216, 288].map((a) => { const [x, y] = rot([[0, -3.6]], a)[0]; return `M0 0L${pt1(x, y)}`; }).join(''), stroke: 'dark', lw: 0.5, a: 0.5 }] },
    ] });
}
// 2. petal-lotus
{
  const prof = (len, w) => [[0, 0], [0.12, w * 0.55], [0.4, w], [0.72, w * 0.8], [0.92, w * 0.32], [1, 0]];
  const L1 = 22, W1 = 8.6;
  const outline = (len, w, bend = 0) => xf((() => { const right = prof(len, w).map(([t, ww]) => [ww, -t * len]); const left = [...prof(len, w)].reverse().map(([t, ww]) => [-ww, -t * len]); return [[0, 0], ...right.slice(1, -1), [0, -len], ...left.slice(1, -1)]; })().map(([x, y]) => [x + bend * (y / len) ** 2 * 3, y]), 0, 0, len / 2);
  // ửng hồng đầu cánh: 2 bản thu nhỏ lệch về mũi, alpha chồng -> chuyển màu mềm (không có mép cứng)
  const tip = (pts, k, up) => sm(pts.map(([x, y]) => [x * k, y * k - up]));
  const veins = (len) => [-0.45, 0, 0.45].map((k) => `M${pt1(0, len / 2 - 1)}Q${pt1(k * 6, 0)} ${pt1(k * 2.4, -len / 2 + 2.5)}`).join('');
  K.push({ id: 'petal-lotus', name: 'Cánh sen', motion: 'fall', density: 0.5, size: [24, 36], speed: [10, 20], sway: [14, 26], spin: 0.35, flip: true,
    natural: ['#E7A9B6', '#FBEFF1'], naturalDark: ['#EDB5C1', '#FBEFF1'], colorNote: 'theme -> hồng sen tự nhiên (= accent sen-cham)',
    variants: [
      { w: 0.6, layers: [{ d: sm(outline(L1, W1)), fill: 'c2' }, { d: tip(outline(L1, W1), 0.78, 2.4), fill: 'c1', a: 0.5 }, { d: tip(outline(L1, W1), 0.5, 5.4), fill: 'c1', a: 0.6 }, { d: veins(L1), stroke: 'dark', lw: 0.45, a: 0.22 }, { d: sm(outline(L1, W1)), stroke: 'dark', lw: 0.4, a: 0.25 }] },
      { w: 0.4, layers: [{ d: sm(outline(20, 7.6, 1.2)), fill: 'c2' }, { d: tip(outline(20, 7.6, 1.2), 0.78, 2.2), fill: 'c1', a: 0.5 }, { d: tip(outline(20, 7.6, 1.2), 0.5, 5), fill: 'c1', a: 0.6 }, { d: sm(outline(20, 7.6, 1.2).filter(([x]) => x > 1.5)), fill: 'dark', a: 0.12 }, { d: veins(20), stroke: 'dark', lw: 0.45, a: 0.2 }] },
    ] });
}
// 3. petal-dried
{
  const q = rng(31);
  const crinkle = (len, w, n = 26) => { const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const k = 1 + (q() - 0.5) * 0.22; const x = Math.sin(a) * w * k * (0.7 + 0.3 * Math.cos(a)); const y = -Math.cos(a) * (len / 2) * k; pts.push([x, y]); } return pts; };
  const p1 = crinkle(20, 7.5);
  const curl = [[0, 9], [-3, 4], [-4.5, -3], [-2.5, -9], [0.5, -8], [-1, -3], [-0.5, 3], [1.5, 7]];
  const frag = leafPath(14, [[0, 0], [0.3, 3], [0.65, 3.2], [1, 0]]);
  K.push({ id: 'petal-dried', name: 'Hoa khô', motion: 'fall', density: 0.8, size: [12, 20], speed: [22, 40], sway: [12, 24], vx: [6, 18], spin: 1.1, flip: true,
    natural: ['#B07A55', '#D4A985'], naturalDark: ['#C99470', '#E3C09F'], colorNote: 'theme -> sepia/đất nung tự nhiên; vx: trôi ngang nhẹ (fall + drift)',
    variants: [
      { w: 0.5, layers: [{ d: sm(p1), fill: 'c1' }, { d: sm(p1), stroke: 'dark', lw: 0.6, a: 0.35 }, { d: smoothOpen([[0, 8], [0.6, 2], [-0.4, -4], [0.3, -8]]) + smoothOpen([[0, 3], [-3, -2], [-4, -5]]) + smoothOpen([[0.2, 0], [3.2, -3.5]]), stroke: 'dark', lw: 0.45, a: 0.3 }, { d: sm(p1.map(([x, y]) => [x * 0.5 - 1.5, y * 0.55 - 2])), fill: 'light', a: 0.25 }] },
      { w: 0.3, layers: [{ d: sm(curl), fill: 'c2' }, { d: sm(curl), stroke: 'dark', lw: 0.6, a: 0.4 }] },
      { w: 0.2, layers: [{ d: frag.replace(/^M/, 'M'), fill: 'c1', a: 0.95 }, { d: 'M0 0V-12', stroke: 'dark', lw: 0.5, a: 0.4 }], offset: [0, 7] },
    ] });
}
// 4. petal-watercolor (vector thay raster: 3 lớp trong suốt + vành sắc tố)
{
  const shape = (seed, len, w) => { const q = rng(seed); const base = sakuraPts(len, w, 0.4); return base.map(([x, y]) => [x * (1 + (q() - 0.5) * 0.16), y * (1 + (q() - 0.5) * 0.1)]); };
  const a = shape(41, 21, 7.6), b = shape(42, 18, 6.4);
  K.push({ id: 'petal-watercolor', name: 'Cánh màu nước', motion: 'fall', density: 0.8, size: [14, 24], speed: [20, 40], sway: [16, 30], spin: 0.8, flip: true, alpha: [0.75, 0.85],
    natural: null, colorNote: 'theme -> c1 = accent, c2 = accent-2 (khác 5 loại có màu tự nhiên); không raster',
    variants: [
      { w: 0.55, layers: [{ d: sm(a), fill: 'c1', a: 0.42 }, { d: sm(a.map(([x, y]) => [x * 0.72 + 0.8, y * 0.7 - 1.6])), fill: 'c1', a: 0.32 }, { d: sm(a.map(([x, y]) => [x * 0.45, y * 0.35 + 5])), fill: 'c2', a: 0.35 }, { d: sm(a), stroke: 'dark', lw: 0.8, a: 0.3 }] },
      { w: 0.45, layers: [{ d: sm(rot(b, -14)), fill: 'c2', a: 0.45 }, { d: sm(rot(b, -14).map(([x, y]) => [x * 0.7 - 0.6, y * 0.72 + 1])), fill: 'c1', a: 0.3 }, { d: sm(rot(b, -14)), stroke: 'dark', lw: 0.8, a: 0.28 }] },
    ] });
}
// 5. plumeria (hoa sứ)
{
  const petal = (a) => sm(rot([[0, 0], [-2.2, -3], [-3.4, -7.4], [-1.8, -10.4], [1.6, -10.6], [3.6, -8], [2.6, -3.4]], a, 0, 0).map(([x, y]) => [x, y]));
  const base = (a) => sm(rot([[0, 0], [-1, -2.4], [-0.6, -4.6], [0.9, -4.4], [1.4, -2.2]], a));
  const all = [0, 72, 144, 216, 288];
  K.push({ id: 'plumeria', name: 'Hoa sứ', motion: 'fall', density: 0.6, size: [16, 24], speed: [22, 40], sway: [10, 22], spin: 1.4, flip: false,
    natural: ['#FFFDF6', '#F6C445'], naturalDark: ['#FFFDF6', '#F6C445'], colorNote: 'theme -> trắng nhuỵ vàng; viền nâu .35 để thấy trên nền sáng (bg bien-dao #FAF6EE)',
    variants: [{ w: 1, layers: [{ d: all.map(petal).join(''), fill: 'c1' }, { d: all.map(petal).join(''), stroke: '#8C6A3A', lw: 0.5, a: 0.35 }, { d: all.map(base).join(''), fill: 'c2', a: 0.9 }, { circle: [0, 0, 1.2], fill: '#E09A2B' }] }] });
}
// 6. paper-heart (tim gấp giấy, 2 mặt)
{
  const H = heartD(10.5);
  K.push({ id: 'paper-heart', name: 'Tim giấy', motion: 'fall', density: 0.8, size: [12, 20], speed: [24, 44], sway: [12, 24], spin: 0.7, flip: true,
    natural: null, colorNote: 'theme -> c1 = accent, c2 = primary-decor; mặt sau tự đậm hơn',
    variants: [{ w: 1, layers: [{ d: H, fill: 'c1' }, { d: 'M0-3.7L12-12V12H0Z', clip: H, fill: 'dark', a: 0.16 }, { d: 'M0-3.7V8.9', stroke: 'light', lw: 0.7, a: 0.7 }, { d: 'M-5.8 -0.4C-6.3 -2 -5.6 -3.6 -4.2 -4C-3.3 -4.3 -2.5 -4 -2 -3.4', stroke: 'light', lw: 1, a: 0.55 } /* P03 vòng 1: nằm trong thuỳ trái */] }],
    back: [{ d: H, fill: 'c2', a: 0.9 }, { d: 'M0-3.7V8.9', stroke: 'light', lw: 0.6, a: 0.6 }] }); // P04 vòng 1: mặt sau = c2 (dark của accent nhạt ra nâu xám)
}
// 7. leaf-green
{
  const oval = leafPath(20, [[0, 0], [0.15, 4.2], [0.45, 5.6], [0.78, 3.8], [1, 0]]);
  const veins = [0.25, 0.45, 0.65].map((t) => `M0 ${f1(-t * 20)}l3.6 ${f1(-3.4)}M0 ${f1(-t * 20)}l-3.6 ${f1(-3.4)}`).join('');
  const willow = leafPath(22, [[0, 0], [0.2, 2.4], [0.55, 2.9], [0.85, 1.6], [1, 0]]);
  const twig = smoothOpen([[0, 11], [0.6, 2], [-0.4, -6], [0.8, -11]]);
  const sm3 = leafPath(8, [[0, 0], [0.4, 2.4], [1, 0]]);
  K.push({ id: 'leaf-green', name: 'Lá xanh', motion: 'drift', density: 0.8, size: [14, 22], speed: [16, 30], sway: [8, 18], spin: 0.9, flip: true,
    natural: ['#8FAE88', '#6E8F68'], naturalDark: ['#9DBB95', '#7FA079'], colorNote: 'theme -> xanh xô thơm tự nhiên; biến thể 2 dùng c2 cho đậm nhạt xen kẽ',
    variants: [
      { w: 0.5, offset: [0, 10], layers: [{ d: oval, fill: 'c1' }, { d: 'M0 2V-19' + veins, stroke: 'light', lw: 0.5, a: 0.55 }, { d: 'M0 0V3', stroke: 'dark', lw: 0.9 }] },
      { w: 0.35, offset: [0, 11], layers: [{ d: willow, fill: 'c2' }, { d: 'M0 1V-21', stroke: 'light', lw: 0.45, a: 0.5 }] },
      { w: 0.15, layers: [{ d: twig, stroke: 'dark', lw: 0.8 }, ...[[0.4, 4, -60], [-0.1, -3, 55], [0.6, -9, -35]].map(([x, y, a], i) => ({ d: tf(sm3, x, y, a), fill: i % 2 ? 'c2' : 'c1' }))] },
    ] });
}
/** biến đổi path tuyệt đối (chỉ M/L/C/Q/Z với toạ độ tuyệt đối, đủ cho leafPath/sm) */
function tf(d, dx, dy, a, s = 1) {
  const c = Math.cos((a * Math.PI) / 180), sn = Math.sin((a * Math.PI) / 180);
  return d.replace(/(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, (_, x, y) => { const X = +x * s, Y = +y * s; return pt1(X * c - Y * sn + dx, X * sn + Y * c + dy); });
}
// 8. leaf-eucalyptus
{
  const coin = (r) => sm(Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; const k = i === 0 ? 0.9 : 1; return [Math.sin(a) * r * 1.05, -Math.cos(a) * r * k]; }));
  K.push({ id: 'leaf-eucalyptus', name: 'Lá bạch đàn', motion: 'fall', density: 0.8, size: [12, 20], speed: [26, 46], sway: [10, 20], spin: 2.6, flip: true,
    natural: ['#9DB4A8', '#7C978C'], naturalDark: ['#AFC4B9', '#8FA89D'], colorNote: 'theme -> xanh xám tự nhiên; xoay nhanh (spin 2.6)',
    variants: [
      { w: 0.65, layers: [{ d: coin(8.4), fill: 'c1' }, { d: 'M-8.8 0A8.8 8.8 0 0 1 8.8 0Z', clip: coin(8.4), fill: 'light', a: 0.22 }, { d: 'M0 8V-7', stroke: 'dark', lw: 0.45, a: 0.25 }, { d: 'M0 8V11.5', stroke: 'dark', lw: 0.9, a: 0.8 }] },
      { w: 0.35, layers: [{ d: 'M0 11.5V-11', stroke: 'dark', lw: 0.7, a: 0.8 }, { d: tf(coin(5.4), -4.2, 3.6, -20), fill: 'c1' }, { d: tf(coin(5), 4, -4.4, 15), fill: 'c2' }] },
    ] });
}
// 9. leaf-maple
{
  const maple = () => { const pts = []; const lobes = [[-90, 11, 0.46], [-30, 9.4, 0.46], [-150, 9.4, 0.46], [25, 6.2, 0.5], [-205, 6.2, 0.5]]; // [góc, r, độ rộng]
    const N = 90; for (let i = 0; i < N; i++) { const a = -90 + (i / N) * 360; let r = 2.6; for (const [la, lr, lw] of lobes) { let d = Math.abs(((a - la + 540) % 360) - 180); r = Math.max(r, lr * Math.max(0, 1 - d / (lw * 60)) ** 0.75); }
      const tooth = r > 4 ? 0.55 * Math.sin(i * 1.9) : 0; const R = r + tooth; const ar = (a * Math.PI) / 180; pts.push([Math.cos(ar) * R, Math.sin(ar) * R + 1.2]); }
    return 'M' + pts.map((p) => pt1(...p)).join('L') + 'Z'; };
  const tri = () => { const pts = []; const lobes = [[-90, 10.5, 0.55], [-25, 8.6, 0.55], [-155, 8.6, 0.55]]; const N = 72; for (let i = 0; i < N; i++) { const a = -90 + (i / N) * 360; let r = 3; for (const [la, lr, lw] of lobes) { let d = Math.abs(((a - la + 540) % 360) - 180); r = Math.max(r, lr * Math.max(0, 1 - d / (lw * 60)) ** 0.7); } const ar = (a * Math.PI) / 180; pts.push([Math.cos(ar) * r, Math.sin(ar) * r + 1]); } return sm(pts.filter((_, i) => i % 2 === 0)); };
  const veins = 'M0 1.2V-9.6M0 1.2L8 -4.5M0 1.2L-8-4.5M0 1.2L5.4 3.8M0 1.2L-5.4 3.8M0 1.2V10';
  K.push({ id: 'leaf-maple', name: 'Lá phong thu', motion: 'drift', density: 0.7, size: [18, 28] /* P05 vòng 1 */, speed: [18, 34], sway: [10, 22], spin: 1.2, flip: true,
    natural: ['#D9662B', '#E8A13A'], naturalDark: ['#E07A40', '#F0B455'], colorNote: 'theme -> cam đỏ/vàng thu tự nhiên, 2 biến thể khác màu',
    variants: [
      { w: 0.6, layers: [{ d: maple(), fill: 'c1' }, { d: veins, stroke: 'dark', lw: 0.5, a: 0.35 }] },
      { w: 0.4, layers: [{ d: tri(), fill: 'c2' }, { d: 'M0 1V-8.6M0 1 7-3.6M0 1-7-3.6M0 1V10', stroke: 'dark', lw: 0.5, a: 0.3 }] },
    ] });
}
// 10. pampas (cỏ lau)
{
  const q = rng(53);
  const stemPts = [[-1, 11.5], [0.4, 4], [1, -3], [0.2, -10.5]];
  const stem = smoothOpen(stemPts);
  let fil = '';
  for (let i = 0; i < 34; i++) { const t = 0.12 + (i / 34) * 0.86; const y = 11.5 - t * 22; const x = 0.4 * Math.sin(t * 3); const side = i % 2 ? 1 : -1; const len = (2.6 + 3.4 * Math.sin(Math.PI * Math.min(1, t * 1.1))) * (0.8 + q() * 0.4); const ang = -60 - q() * 25; const ar = (ang * Math.PI) / 180; fil += `M${pt1(x, y)}q${pt1(side * len * 0.5, -len * 0.15)} ${pt1(side * Math.cos(ar) * -len, Math.sin(ar) * len)}`; }
  let tuft = ''; for (let i = 0; i < 10; i++) { const side = i % 2 ? 1 : -1; const y = 6 - i * 1.4; tuft += `M0 ${f1(y)}q${f1(side * 2)} -0.6 ${f1(side * (3 + q() * 2))} ${f1(-2.6 - q())}`; }
  K.push({ id: 'pampas', name: 'Cỏ lau', motion: 'drift', density: 0.6, size: [26, 40], speed: [14, 26], sway: [4, 10], spin: 0.25, flip: false,
    natural: ['#C9B08A', '#9C7F55'], naturalDark: ['#E6D3B3', '#C2A67C'], colorNote: 'theme -> be rơm tự nhiên (đậm hơn kraft để thấy trên nền dat-nung #F6EEE4); bay ngang chậm',
    variants: [
      { w: 0.7, layers: [{ d: fil, stroke: 'c1', lw: 0.5, a: 0.85 }, { d: stem, stroke: 'c2', lw: 0.75 }] },
      { w: 0.3, layers: [{ d: tuft, stroke: 'c1', lw: 0.55, a: 0.9 }, { d: 'M0 9V-8', stroke: 'c2', lw: 0.7 }] },
    ] });
}
// 11. snow (thủ tục: chấm radial nhiều lớp độ sâu)
K.push({ id: 'snow', name: 'Tuyết', motion: 'fall', density: 1.5, size: [2, 6], speed: [14, 30], sway: [6, 14], spin: 0, flip: false, depth: true,
  natural: ['#EEF3F8', '#9FB3C8'] /* P02 vòng 1 */, naturalDark: ['#FFFFFF', 'rgba(255,255,255,0)'], colorNote: 'theme -> trắng + vành xanh xám .5 để thấy trên nền sáng; theme tối bỏ vành. depth: cỡ lớn = rơi nhanh + rõ hơn',
  variants: [{ w: 1, layers: [{ radial: [0, 0, 12], stops: [[0, 'c1', 1], [0.6, 'c1', 0.95], [0.8, 'c2', 0.45], [1, 'c2', 0]] }] }] });
// 12. bubble
K.push({ id: 'bubble', name: 'Bong bóng', motion: 'float-up', density: 0.7, size: [10, 22], speed: [16, 30], sway: [8, 16], spin: 0, flip: false,
  natural: null, colorNote: 'theme -> c1 = accent-2 (bien-dao #8FD0CF, pastel-han #CFC6E8), c2 = accent (ánh cầu vồng); viền .7 + lòng .08',
  variants: [{ w: 1, layers: [{ circle: [0, 0, 10.6], fill: 'c1', a: 0.08 }, { circle: [0, 0, 10.6], stroke: 'c1', lw: 0.9, a: 0.75 }, { d: 'M4.6 8.6A10 10 0 0 0 9.4 3.2', stroke: 'c2', lw: 1.1, a: 0.45 }, { d: 'M-7.4-2.6A7.8 7.8 0 0 1-2.6-7.4', stroke: '#FFFFFF', lw: 1.6, a: 0.9 }, { circle: [-3.6, -6.6, 0.9], fill: '#FFFFFF', a: 0.95 }] }] });
// 13. sparkle
K.push({ id: 'sparkle', name: 'Lấp lánh', motion: 'twinkle', density: 1.2, size: [8, 14], speed: [4, 10], sway: [2, 6], spin: 0.2, flip: false,
  natural: null, colorNote: 'theme -> c1 = accent (theme tối: primary vàng), lõi trắng .9 (bài học R04: không chấm nâu đục)',
  variants: [
    { w: 0.7, layers: [{ d: star4b(11), fill: 'c1' }, { d: star4b(6, 0.22), fill: 'light', a: 0.9 }, { circle: [0, 0, 1.4], fill: '#FFFFFF', a: 0.95 }] },
    { w: 0.3, layers: [{ d: star4b(10, 0.12), fill: 'c1' }, { d: tf(star4b(5, 0.1), 0, 0, 45), fill: 'c1', a: 0.6 }, { circle: [0, 0, 1.2], fill: '#FFFFFF', a: 0.95 }] },
  ] });
// 14. ink-dot
{
  K.push({ id: 'ink-dot', name: 'Chấm mực', motion: 'fall', density: 0.6, size: [6, 14], speed: [6, 14], sway: [3, 8], spin: 0.2, flip: false, alpha: [0.12, 0.22],
    natural: ['#1C1C1A', '#3A3A36'], naturalDark: ['#F2E9E1', '#CFC4BA'], colorNote: 'theme -> mực đen (theme tối: mực sáng); alpha .12–.22 theo hạt (§5.7: .15)',
    variants: [
      { w: 0.5, layers: [{ d: blob(0, 0, 9, 8.4, 61, 11, 0.28), fill: 'c1' }] },
      { w: 0.3, layers: [{ d: blob(-1.4, 0.6, 6.6, 6.2, 62, 9, 0.3), fill: 'c1' }, { circle: [6.6, -5.4, 1.6], fill: 'c1' }, { circle: [8.4, 1.6, 0.9], fill: 'c2' }] },
      { w: 0.2, layers: [{ circle: [0, 0, 4.2], fill: 'c2' }] },
    ] });
}
// 15. dust-mote
K.push({ id: 'dust-mote', name: 'Bụi nắng', motion: 'drift', density: 1.0, size: [5, 12] /* P01 vòng 1 */, speed: [4, 10], sway: [4, 10], spin: 0, flip: false, alpha: [0.45, 0.8], twinkle: 0.25,
  natural: ['#B8925A', '#FFF1CC'], naturalDark: ['#FFE7B0', '#FFF6E0'], colorNote: 'theme -> lõi kem sáng + vành nâu ấm (nền sáng hoai-co #F4ECDD vẫn thấy); theme tối: vàng nhạt',
  variants: [{ w: 1, layers: [{ radial: [0, 0, 12], stops: [[0, 'c2', 1], [0.35, 'c2', 0.85], [0.6, 'c1', 0.45], [1, 'c1', 0]] }] }] });
// 16. red-paper (xác pháo)
{
  const torn = (w, h, seed) => { const q = rng(seed); const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2; return poly([[x0, y0 + q() * 0.8], [0, y0 + q() * 1.2], [x1, y0 + q() * 0.8], [x1, y1 - q() * 0.8], [0.3, y1 - q() * 1.2], [x0, y1 - q() * 0.8]]); };
  const v1 = torn(7.4, 11.5, 71), v2 = torn(5, 14, 72), v3 = poly([[-3.4, -3.8], [3.8, -3], [3.2, 3.8], [-3.8, 3.2]]);
  K.push({ id: 'red-paper', name: 'Xác pháo giấy', motion: 'fall', density: 1.0, size: [8, 14], speed: [60, 110], sway: [8, 18], spin: 3, flip: true,
    natural: ['#C8231F', '#E0392B'], naturalDark: ['#D93A2E', '#F04E3E'], backColor: '#F2B8A2', colorNote: 'theme -> đỏ xác pháo tự nhiên; mặt sau giấy hồng nhạt #F2B8A2 (lật thấy 2 màu)',
    variants: [
      { w: 0.45, layers: [{ d: v1, fill: 'c1' }, { d: 'M-3.7-2.4H3.7', stroke: '#E8B04A', lw: 0.6, a: 0.55 }], back: [{ d: v1, fill: '#F2B8A2' }] },
      { w: 0.35, layers: [{ d: v2, fill: 'c2' }], back: [{ d: v2, fill: '#F2B8A2' }] },
      { w: 0.2, layers: [{ d: v3, fill: 'c1' }], back: [{ d: v3, fill: '#F2B8A2' }] },
    ] });
}

// ---------- ghi manifest + svg xem thử + ước lượng module
const TONE = (t, [c1, c2]) => {
  const mixh = (h, to, k) => { const p = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16)); const a = p(h), b = p(to); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  if (t === 'c1') return c1; if (t === 'c2') return c2.startsWith('rgba') ? c1 : c2; if (t === 'light') return mixh(c1, '#ffffff', 0.4); if (t === 'dark') return mixh(c1, '#000000', 0.28); return t;
};
function layerSvg(l, pal, uid) {
  const a = l.a ?? 1;
  const paint = l.fill ? `fill="${TONE(l.fill, pal)}"${a < 1 ? ` fill-opacity="${a}"` : ''}` : `fill="none" stroke="${TONE(l.stroke, pal)}" stroke-width="${l.lw ?? 0.6}" stroke-linecap="round"${a < 1 ? ` stroke-opacity="${a}"` : ''}`;
  const clip = l.clip ? ` clip-path="url(#${uid})"` : '';
  const def = l.clip ? `<clipPath id="${uid}"><path d="${l.clip}"/></clipPath>` : '';
  if (l.circle) return `${def}<circle cx="${l.circle[0]}" cy="${l.circle[1]}" r="${l.circle[2]}" ${paint}${clip}/>`;
  if (l.radial) { const id = uid + 'g'; return `<radialGradient id="${id}">${l.stops.map(([t, tone, al]) => `<stop offset="${t}" stop-color="${TONE(tone, pal)}" stop-opacity="${al}"/>`).join('')}</radialGradient><circle r="${l.radial[2]}" fill="url(#${id})"/>`; }
  if (!l.d || (l.stroke && l.lw === 0)) return '';
  return `${def}<path d="${l.d}" ${paint}${clip}/>`;
}
export function writeKinds(list, dir, file, sampleColors) {
  const out = [];
  const sizes = {};
  for (const k of list) {
    const pal = k.natural ?? sampleColors;
    let x = 0; const cells = [];
    k.variants.forEach((v, i) => {
      const off = v.offset ? ` translate(${v.offset[0]} ${v.offset[1]})` : '';
      cells.push(`<g transform="translate(${x + 14} 14)${off}"><title>v${i + 1} w=${v.w}</title>${v.layers.map((l, j) => layerSvg(l, pal, `${k.id}-${i}-${j}`)).join('')}</g>`);
      x += 28;
      const back = v.back ?? k.back;
      if (back) { cells.push(`<g transform="translate(${x + 14} 14)${off}"><title>v${i + 1} mặt sau</title>${back.map((l, j) => layerSvg(l, pal, `${k.id}-${i}-b${j}`)).join('')}</g>`); x += 28; }
    });
    write(`${dir}/${k.id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} 28" width="${x * 4}" height="112">\n<!-- ${k.id}: xem thử ${k.variants.length} biến thể (ô 24×24 tâm 0,0; màu ${k.natural ? 'tự nhiên' : 'mẫu ' + sampleColors.join('/')}). Dữ liệu thật: ${file} -->\n${cells.join('\n')}\n</svg>\n`);
    const data = JSON.stringify({ ...k, name: undefined, colorNote: undefined });
    sizes[k.id] = gz(data) + 140; // + ~140B khung module (import type, export const kind = {...})
    out.push(k);
  }
  write(`${dir}/${file}`, JSON.stringify({ $schema: 'design-v4a-2bc.md §4.1/§5.1', unit: 'ô 24×24, tâm (0,0); draw: g.scale(s/24) rồi vẽ layers theo thứ tự', tones: { c1: 'màu 1', c2: 'màu 2', light: 'mix(c1,#fff,.4)', dark: 'mix(c1,#000,.28)' }, items: out }, null, 1) + '\n');
  return sizes;
}

import { pathToFileURL } from 'node:url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pSizes = writeKinds(K, 'particles', 'particles.json', ['#C9A86A', '#8A6A3B']);
  console.log('\n# ước lượng module hạt (gz, dữ liệu + khung ~140B; trần 1.5KB = 1536B):');
  for (const [id, s] of Object.entries(pSizes)) console.log(`  ${id.padEnd(18)} ${s} B${s > 1536 ? '  !! VƯỢT' : ''}`);
}
export { K, tf, heartD, star4b, sakuraPts, poly, sm, rot };
