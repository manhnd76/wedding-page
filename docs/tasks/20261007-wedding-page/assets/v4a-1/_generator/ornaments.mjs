import { P, C, G, STROKE, mirrorX, swapXY, tr, leaf, oval, blob, polar, quadAt, f, pt, sprite } from './lib.mjs';

const S = (inner, w = 1, cap = 'round') => G(inner, STROKE(w, cap));
const FILL = (inner) => G(inner, 'fill="currentColor"');
const VB = { divider: '0 0 160 24', title: '0 0 80 16', corner: '0 0 96 96', amp: '0 0 120 24', monogram: '0 0 120 120', gift: '0 0 64 64' };
const out = (name, comment, sy) => sprite(`ornaments/${name}.svg`, comment, Object.entries(sy).map(([id, inner]) => [id, VB[id], inner]));

/* ---------- hình cơ bản dùng lại ---------- */
// hoa hồng: xoắn bằng nửa vòng tròn tăng dần + đài hoa hình chén
function rose(cx, cy, s) {
  const r = (k) => f(k * s);
  const spiral = `M${pt(cx, cy)}a${r(1)} ${r(1)} 0 0 1 ${r(2)} 0a${r(2)} ${r(2)} 0 0 1 ${r(-4)} 0a${r(3)} ${r(3)} 0 0 1 ${r(6)} 0a${r(4)} ${r(4)} 0 0 1 ${r(-8)} 0`;
  const cup = `M${pt(cx - 6.4 * s, cy - 0.6 * s)}C${pt(cx - 7 * s, cy + 5 * s)} ${pt(cx - 3 * s, cy + 7.4 * s)} ${pt(cx, cy + 7.4 * s)}C${pt(cx + 3 * s, cy + 7.4 * s)} ${pt(cx + 7 * s, cy + 5 * s)} ${pt(cx + 6.4 * s, cy - 0.6 * s)}`;
  return P(spiral) + P(cup);
}
const heart = (x, y, s = 1) => P(`M${pt(x, y + 2.6 * s)}C${pt(x - 2.8 * s, y + 0.6 * s)} ${pt(x - 3.6 * s, y - 1.2 * s)} ${pt(x - 2.4 * s, y - 2.2 * s)}C${pt(x - 1.4 * s, y - 3 * s)} ${pt(x - 0.4 * s, y - 2.4 * s)} ${pt(x, y - 1.6 * s)}C${pt(x + 0.4 * s, y - 2.4 * s)} ${pt(x + 1.4 * s, y - 3 * s)} ${pt(x + 2.4 * s, y - 2.2 * s)}C${pt(x + 3.6 * s, y - 1.2 * s)} ${pt(x + 2.8 * s, y + 0.6 * s)} ${pt(x, y + 2.6 * s)}Z`);
// nơ: 2 vòng + 2 đuôi + nút
function bow(x, y, s) {
  const k = (a, b) => pt(x + a * s, y + b * s);
  return P(`M${k(0, 0)}C${k(-5, -6)} ${k(-12, -6)} ${k(-11, -1)}C${k(-10, 3)} ${k(-4, 2)} ${k(0, 0)}Z`) +
    P(`M${k(0, 0)}C${k(5, -6)} ${k(12, -6)} ${k(11, -1)}C${k(10, 3)} ${k(4, 2)} ${k(0, 0)}Z`) +
    P(`M${k(-0.8, 0.8)}C${k(-2.5, 4)} ${k(-4.5, 7)} ${k(-6.5, 9)}M${k(0.8, 0.8)}C${k(2.5, 4)} ${k(4.5, 7)} ${k(6.5, 9)}`) + C(x, y, 1.3 * s);
}
// hoa sen nhìn ngang: gốc ở (cx, by)
function lotus(cx, by, s) {
  const k = (a, b) => pt(cx + a * s, by - b * s);
  const center = `M${k(0, 0)}C${k(4, 4)} ${k(4, 10)} ${k(0, 14)}C${k(-4, 10)} ${k(-4, 4)} ${k(0, 0)}Z`;
  const inner = (m) => `M${k(0, 0)}C${k(-3 * m, 3)} ${k(-7 * m, 7)} ${k(-9 * m, 11)}C${k(-9.5 * m, 6)} ${k(-6 * m, 1.5)} ${k(0, 0)}Z`;
  const outer = (m) => `M${k(0, 0)}C${k(-6 * m, 0.5)} ${k(-11 * m, 3)} ${k(-13 * m, 6.5)}C${k(-9 * m, 7)} ${k(-4 * m, 4.5)} ${k(0, 0)}`;
  return P(center) + P(inner(1)) + P(inner(-1)) + P(outer(1)) + P(outer(-1));
}
const bud = (x, y, a, s = 1) => P('M0 0C-2.4-2-2.4-6 0-8.6C2.4-6 2.4-2 0 0Z', `transform="${tr(x, y, a, s)}"`);
// hoa 5 cánh tròn (Hàn)
function flower5(cx, cy, p) { let d = ''; for (let i = 0; i < 5; i++) { const [x, y] = polar(cx, cy, p * 1.15, -90 + i * 72); d += C(x, y, p); } return d + C(cx, cy, p * 0.55); }
const sparkle = (x, y, r) => P(`M${pt(x, y - r)}Q${pt(x, y)} ${pt(x + r, y)}Q${pt(x, y)} ${pt(x, y + r)}Q${pt(x, y)} ${pt(x - r, y)}Q${pt(x, y)} ${pt(x, y - r)}Z`);
// mặt trời nửa vòng + tia
function sun(cx, by, r, rays = 5) {
  let d = `M${pt(cx - r, by)}A${f(r)} ${f(r)} 0 0 1 ${pt(cx + r, by)}`;
  for (let i = 0; i < rays; i++) { const a = -180 + (180 / (rays + 1)) * (i + 1); const [x1, y1] = polar(cx, by, r + 2, a); const [x2, y2] = polar(cx, by, r + 4.5, a); d += `M${pt(x1, y1)}L${pt(x2, y2)}`; }
  return P(d);
}
// cầu vồng boho: các cung lồng
const rainbow = (cx, by, rs) => P(rs.map((r) => `M${pt(cx - r, by)}A${f(r)} ${f(r)} 0 0 1 ${pt(cx + r, by)}`).join(''));
// bông cỏ lau: thân cong + lông vũ hai bên
function pampas(p0, p1, p2, n, len) {
  let stem = `M${pt(...p0)}Q${pt(...p1)} ${pt(...p2)}`, fe = '';
  for (let i = 0; i < n; i++) {
    const t = 0.35 + (0.62 * i) / (n - 1); const [x, y, a] = quadAt(p0, p1, p2, t); const L = len * (1 - 0.55 * ((t - 0.35) / 0.62)) + 1;
    for (const side of [-1, 1]) { const [ex, ey] = polar(x, y, L, a + side * 32); fe += `M${pt(x, y)}L${pt(ex, ey)}`; }
  }
  return P(stem) + P(fe, 'opacity=".8"');
}
// vỏ sò điệp: bản lề ở (cx, by), bán kính R
function shell(cx, by, R) {
  const [lx, ly] = polar(cx, by - R * 0.15, R, 200), [rx, ry] = polar(cx, by - R * 0.15, R, -20);
  let d = `M${pt(cx, by)}L${pt(lx, ly)}`;
  const lobes = 6; for (let i = 0; i < lobes; i++) { const a2 = 200 + (140 / lobes) * (i + 1); const [x2, y2] = polar(cx, by - R * 0.15, R, a2); d += `A${f(R / lobes * 1.25)} ${f(R / lobes * 1.25)} 0 0 1 ${pt(x2, y2)}`; }
  d += `Z`;
  let ribs = ''; for (let i = 1; i < lobes; i++) { const a2 = 200 + (140 / lobes) * i; const [x2, y2] = polar(cx, by - R * 0.15, R * 0.93, a2); ribs += `M${pt(cx, by)}L${pt(x2, y2)}`; }
  const ears = `M${pt(cx - R * 0.35, by + R * 0.1)}h${f(R * 0.7)}`;
  return P(d) + P(ribs, 'opacity=".7"') + P(ears);
}
// tàu lá cọ: sống lá Bezier bậc 2 + lá chét
function palm(p0, p1, p2, n, len) {
  let rib = `M${pt(...p0)}Q${pt(...p1)} ${pt(...p2)}`, lf = '';
  for (let i = 0; i < n; i++) {
    const t = 0.12 + (0.84 * i) / (n - 1); const [x, y, a] = quadAt(p0, p1, p2, t); const L = len * Math.sin(Math.PI * (0.15 + 0.8 * t));
    for (const side of [-1, 1]) { const [mx, my] = polar(x, y, L * 0.55, a + side * 50); const [ex, ey] = polar(x, y, L, a + side * 38); lf += `M${pt(x, y)}Q${pt(mx, my)} ${pt(ex, ey)}`; }
  }
  return P(rib) + P(lf);
}
const wave = (x, y, n, w, h) => P(`M${pt(x, y)}q${f(w / 2)} ${f(-h)} ${f(w)} 0` + `t${f(w)} 0`.repeat(n - 1));
// hoa sứ (plumeria): 5 cánh xoay
function plumeria(cx, cy, r) { let d = ''; for (let i = 0; i < 5; i++) { const a = i * 72; d += P(`M0 0C${f(r * .2)} ${f(-r * .55)} ${f(r * .75)} ${f(-r * .8)} ${f(r)} ${f(-r * .35)}C${f(r * .95)} ${f(-r * .05)} ${f(r * .45)} ${f(r * .1)} 0 0Z`, `transform="${tr(cx, cy, a)}"`); } return d + C(cx, cy, r * 0.15); }
// lá sen nhìn từ trên: tròn có khía + gân
function lotusLeaf(cx, cy, r) {
  const [x1, y1] = polar(cx, cy, r, -90), [x2, y2] = polar(cx, cy, r, -68);
  let d = `M${pt(cx, cy)}L${pt(x1, y1)}A${f(r)} ${f(r)} 0 1 0 ${pt(x2, y2)}Z`, v = '';
  for (let i = 0; i < 7; i++) { const [x, y] = polar(cx, cy, r * 0.78, -40 + i * 45); v += `M${pt(cx, cy)}L${pt(x, y)}`; }
  return P(d) + P(v, 'opacity=".55"');
}
// vành chấm (dùng cho minimal, korean)
const dotsAlong = (x0, x1, y, step, r) => { let d = ''; for (let x = x0; x <= x1 + 0.01; x += step) d += C(x, y, r); return d; };
// sao 5 cánh
function star5(cx, cy, R, r) { let d = ''; for (let i = 0; i < 10; i++) { const [x, y] = polar(cx, cy, i % 2 ? r : R, -90 + i * 36); d += (i ? 'L' : 'M') + pt(x, y); } return P(d + 'Z'); }

/* ============ 1. romantic (Hồng Phấn) ============ */
{
  const vineR = P('M87 13.5C95 15.5 99 9.5 107 10.2C114 10.8 116 15 124 14.2C132 13.4 138 11 151 12') + P('M107 10.2c.6-3 3.8-4.2 5.3-2.2s-.6 3.4-2.3 2.4') +
    leaf(97.5, 12.6, -35, 0.8) + leaf(117, 13.8, 25, 0.8) + leaf(131, 13.4, -30, 0.75);
  const divider = S(rose(80, 9.6, 0.8) + leaf(75.5, 15.2, 150, 0.8) + leaf(84.5, 15.2, 30, 0.8) + vineR + mirrorX(vineR, 160)) + FILL(C(153.5, 12, 1.1) + C(6.5, 12, 1.1));
  const title = S(rose(40, 6.8, 0.5) + P('M6 9h23M51 9h23') + leaf(35, 10.2, 160, 0.55) + leaf(45, 10.2, 20, 0.55));
  const vineT = P('M34 21C46 22 50 16 62 17.5C71 18.6 75 23 86 20.5') + leaf(44, 21.2, -30, 0.9) + leaf(55, 17.2, 25, 0.9) + leaf(68, 19, -25, 0.85) + bud(87, 20.6, 70, 0.75);
  const corner = S(P('M5 91V25Q5 5 25 5h66') + P('M11 91V28Q11 11 28 11h63', 'opacity=".45"') + rose(24, 22, 1.25) + vineT + swapXY(vineT) + leaf(30, 32, 45, 0.9));
  const amp = S(P('M8 12H38') + heart(44, 12, 1) + mirrorX(P('M8 12H38') + heart(44, 12, 1), 120) + leaf(30, 12, -30, 0.7) + leaf(26, 12, 30, 0.7) + mirrorX(leaf(30, 12, -30, 0.7) + leaf(26, 12, 30, 0.7), 120));
  const monoSide = leaf(25, 90, -140, 0.9) + leaf(33, 100, -160, 0.9) + leaf(44, 106.5, 175, 0.9);
  const monogram = S(C(60, 60, 50) + C(60, 60, 45, 'opacity=".45"') + bow(60, 11, 1.05) + rose(60, 103, 1) + P('M52 111C40 111 28 104 20 90') + P('M68 111C80 111 92 104 100 90') + monoSide + mirrorX(monoSide, 120));
  const gift = S(P('M12 30h40v26H12zM8 22h48v8H8zM32 22v34', 'stroke-width="1.3"') + P('M32 22C26 13 18 12 19 17C20 21 27 22 32 22ZM32 22C38 13 46 12 45 17C44 21 37 22 32 22Z', 'stroke-width="1.3"') + P('M31 23C29 27 26 29 23 31M33 23C35 27 38 29 41 31', 'stroke-width="1.3"') + heart(43, 43, 1.2));
  out('romantic', 'Bộ họa tiết romantic (Hồng Phấn): hoa hồng xoắn line-art, cành dây leo, nơ, tim. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram, gift });
}

/* ============ 2. minimal (Mực & Giấy) ============ */
{
  const divider = S(P('M16 12H70M90 12h54M16 9v6M144 9v6') + C(80, 12, 3.2)) + FILL(C(80, 12, 0.9));
  const title = S(P('M16 8h17M47 8h17')) + FILL(C(40, 8, 1.2));
  const corner = S(P('M5 64V5h59') + P('M13 34V13h21', 'opacity=".5"') ) + FILL(C(22, 22, 1.2));
  const amp = S(P('M18 12H44M76 12h26M44 9.5v5M76 9.5v5'));
  let ticks = ''; for (let i = 0; i < 12; i++) { if (i % 3 === 0) continue; const [x, y] = polar(60, 60, 45, i * 30); ticks += C(x, y, 0.8); }
  const monogram = S(C(60, 60, 50) + P('M60 3v5M60 112v5M3 60h5M112 60h5')) + FILL(ticks, '') ;
  const gift = S(P('M14 28h36v28H14zM10 22h44v6H10zM32 22v34M32 22l-8-7v7zM32 22l8-7v7z', 'stroke-width="1.2"'), 1, 'square');
  out('minimal', 'Bộ họa tiết minimal (Mực & Giấy): đường kẻ mảnh, chấm, vạch kiểu mặt đồng hồ. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram: monogram.replace('<g fill="currentColor">', '<g fill="currentColor" opacity=".6">'), gift });
}

/* ============ 3. deco (Hoài Cổ: tem thư, dấu bưu điện, khung cắt góc) ============ */
{
  const cancelR = wave(92, 8, 4, 7, 2.6) + wave(92, 12, 4, 7, 2.6) + wave(92, 16, 4, 7, 2.6);
  const divider = S(C(80, 12, 8.5) + C(80, 12, 6, 'opacity=".6"') + cancelR + mirrorX(cancelR, 160) + P('M124 12H151M9 12H36') + P('M151 12l2.5-2.5 2.5 2.5-2.5 2.5zM9 12l-2.5-2.5L4 12l2.5 2.5z')) + G(star5(80, 12.3, 3.4, 1.4), 'fill="currentColor"');
  const title = S(P('M29 3.5h22l3.5 4.5-3.5 4.5H29l-3.5-4.5zM4 8h18M58 8h18')) + FILL(C(40, 8, 1.1));
  const corner = S(P('M5 91V19L19 5h72') + P('M11 91V22l11-11h69', 'opacity=".5"') + P('M17 91V32M32 17h59', 'opacity=".35"') + C(40, 40, 9) + C(40, 40, 6.5, 'opacity=".6"') + wave(51, 37, 3, 6, 2.2) + wave(51, 43, 3, 6, 2.2)) + G(star5(40, 40.3, 3.4, 1.4), 'fill="currentColor"');
  const ampSide = P('M6 12H36M8 15H34', '') + P('M40 9l3 3-3 3-3-3z');
  const amp = S(ampSide + mirrorX(ampSide, 120));
  // tem thư: răng cưa = khía nửa tròn r2 mỗi 8 đơn vị, luôn khía vào trong
  const edge = (h, sgn) => (h ? `h${2 * sgn}a2 2 0 0 0 ${4 * sgn} 0h${2 * sgn}` : `v${2 * sgn}a2 2 0 0 0 0 ${4 * sgn}v${2 * sgn}`).repeat(12);
  const stamp = `M12 12${edge(true, 1)}${edge(false, 1)}${edge(true, -1)}${edge(false, -1)}Z`;
  const monogram = S(P(stamp) + P('M21 21h78v78H21z', 'opacity=".55"'));
  const gift = S(P('M10 22h44v34H10zM32 22v34M10 39h44') + P('M32 22c-3-6-10-7-9-2.5s6 2.5 9 2.5zM32 22c3-6 10-7 9-2.5s-6 2.5-9 2.5z') + P('M41 22l9-11') + P('M47 5.5l8 3-3.2 8-8-3z') + C(51.6, 8.8, 1.1), 1.2);
  out('deco', 'Bộ họa tiết deco (Hoài Cổ): dấu bưu điện + vạch huỷ tem, tem răng cưa, khung cắt góc. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram, gift });
}

/* ============ 4. lotus (Sen Chàm) ============ */
{
  const sideL = P('M12 19.5H62') + bud(10, 19.5, -90, 0.8) + P('M30 16.5q4-2.6 8 0M44 16.5q4-2.6 8 0', 'opacity=".55"');
  const divider = S(lotus(80, 19.5, 1) + sideL + mirrorX(sideL, 160));
  const title = S(lotus(40, 13.5, 0.62) + P('M6 13.5h25M49 13.5h25'));
  const corner = S(P('M5 91V31A26 26 0 0 1 31 5h60') + P('M11 91V33A22 22 0 0 1 33 11h58', 'opacity=".45"') + lotusLeaf(31, 31, 12) +
    P('M40 39C48 46 56 42 60 31') + bud(61, 30, 25, 1.1) + P('M20 60q5-3.4 10 0t10 0M20 66q5-3.4 10 0', 'opacity=".55"'));
  const ampSide = P('M8 12H38') + bud(38, 12, 90, 0.75);
  const amp = S(ampSide + mirrorX(ampSide, 120));
  const monogram = S(P('M77.1 107A50 50 0 1 0 42.9 107') + P('M77.9 100.2A44 44 0 1 0 42.1 100.2', 'opacity=".45"') + lotus(60, 112, 1.25) + P('M38 114.5h44', 'opacity=".55"') + P('M44 6.5q4-2.6 8 0t8 0t8 0t8 0', 'opacity=".5"'));
  const gift = S(P('M12 30h40v26H12zM8 22h48v8H8zM32 30v26', 'stroke-width="1.3"') + lotus(32, 22, 0.75) + P('M17 46q4-2.6 8 0M39 46q4-2.6 8 0', 'opacity=".55"'));
  out('lotus', 'Bộ họa tiết lotus (Sen Chàm): hoa sen, nụ sen, lá sen, sóng gợn, cửa trăng hở đáy. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram, gift });
}

/* ============ 5. watercolor (Hoa Lá Màu Nước): line + vệt màu bằng path mờ, không WebP ============ */
{
  const W = (d, op) => `<path class="wash" d="${d}" fill="currentColor" fill-opacity="${op}"/>`;
  const branch = (pts, leaves) => P(pts) + leaves.map(([x, y, a, s]) => oval(x, y, a, s ?? 0.8)).join('');
  const divider = W(blob(80, 12, 30, 8.5, 11), 0.14) + W(blob(88, 13, 14, 5.5, 5), 0.2) +
    S(branch('M14 13C38 14 58 9 80 11.5S122 15 146 11', [[24, 13.4, -35], [32, 13.6, 30], [44, 12.4, -30], [54, 11, 28], [66, 10.2, -25], [94, 13.2, 25], [106, 14, -28], [118, 13.8, 30], [130, 12.6, -30], [140, 11.6, 25]]) + C(80, 11.4, 1.3));
  const title = W(blob(40, 8, 15, 5, 3), 0.16) + S(branch('M10 9C24 9 30 7 40 8S58 9 70 7', [[20, 8.8, -35, 0.6], [28, 8.4, 30, 0.6], [50, 8.6, -30, 0.6], [60, 8, 28, 0.6]]));
  const corner = W(blob(28, 26, 27, 20, 21, 10), 0.14) + W(blob(20, 40, 13, 16, 8), 0.2) +
    S(branch('M8 84C12 52 30 26 78 10', [[10, 72, -120], [11.5, 66, -40], [15, 56, -125], [17.5, 50, -45], [23, 41, -130], [27, 35, -50], [35, 28, -140], [40, 24, -60], [50, 19, -150], [56, 16, -70], [66, 13, -160]]) + P('M23 41C30 46 40 47 48 45', 'opacity=".7"') + oval(42, 46, 20, 0.7) + oval(36, 45, -30, 0.7));
  const amp = W(blob(26, 12, 18, 6, 13), 0.16) + W(blob(94, 12, 18, 6, 17), 0.16) + S(P('M10 12.5C20 11 30 13 40 11.5M80 11.5C90 13 100 11 110 12.5', 'opacity=".8"'));
  let wreath = ''; for (let i = 0; i < 9; i++) { const a = 100 + i * 17; const [x, y] = polar(60, 60, 44, a); wreath += oval(x, y, a + 90 + (i % 2 ? 30 : -30), 1); }
  const monogram = W(blob(60, 60, 50, 48, 31, 11, 0.16), 0.1) + W(blob(78, 36, 20, 16, 4), 0.14) +
    S(P('M60 104A44 44 0 0 1 22 38') + P('M60 104A44 44 0 0 0 98 38') + wreath + `<g transform="matrix(-1 0 0 1 120 0)">${wreath}</g>` + C(60, 104, 1.4));
  const gift = W(blob(30, 42, 26, 18, 9), 0.16) + S(P('M12 30h40v26H12zM8 22h48v8H8zM32 22v34', 'stroke-width="1.2"') + oval(32, 21, -150, 1.1) + oval(32, 21, -30, 1.1) + oval(32, 21, -90, 0.9));
  out('watercolor', 'Bộ họa tiết watercolor (Hoa Lá Màu Nước): cành khuynh diệp line-art + vệt màu nước bằng path fill-opacity (class wash), không cần ảnh WebP. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram, gift });
}

/* ============ 6. boho (Đất Nung) ============ */
{
  let stitch = ''; for (let x = 18; x < 64; x += 6) stitch += `M${x} 19h3`;
  const sideL = P(stitch) + P('M8 19h4');
  const divider = S(rainbow(80, 19, [10, 6.8, 3.6]) + P('M66 19h28') + sideL + mirrorX(sideL, 160));
  const title = S(sun(40, 12.5, 4, 5) + P('M6 12.5h25M49 12.5h25'));
  const corner = S(P('M5 91V5h86', 'opacity=".45"') + pampas([12, 90], [14, 50], [44, 22], 9, 7) + pampas([12, 90], [30, 62], [70, 46], 7, 6) + C(26, 22, 6) +
    P(Array.from({ length: 8 }, (_, i) => { const [a, b] = polar(26, 22, 8.5, i * 45); const [c, d] = polar(26, 22, 11.5, i * 45); return `M${pt(a, b)}L${pt(c, d)}`; }).join('')));
  let st2 = ''; for (let x = 8; x < 38; x += 6) st2 += `M${x} 12h3`;
  const ampSide = P(st2) + rainbow(44, 14.5, [4, 2]);
  const amp = S(ampSide + mirrorX(ampSide, 120));
  const monogram = S(P('M22 112V58a38 38 0 0 1 76 0v54') + P('M28 112V58a32 32 0 0 1 64 0v54', 'opacity=".45"') + rainbow(60, 44, [18, 13, 8]) + P('M14 112h92') +
    pampas([20, 112], [16, 96], [8, 84], 5, 5) + pampas([100, 112], [104, 96], [112, 84], 5, 5));
  const gift = S(P('M12 30h40v26H12zM8 22h48v8H8zM32 22v34M12 43h40', 'stroke-width="1.2"') + P('M32 22c-4-6-11-6-10-1.5s7 2 10 1.5zM32 22c4-6 11-6 10-1.5s-7 2-10 1.5z') + pampas([38, 30], [44, 18], [54, 8], 5, 4));
  out('boho', 'Bộ họa tiết boho (Đất Nung): cầu vồng boho, mặt trời, cỏ lau (pampas), đường khâu. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram, gift });
}

/* ============ 7. korean (Pastel Hàn) ============ */
{
  const sideR = dotsAlong(94, 136, 12, 6, 0.8) + flower5(147, 12, 2.1);
  const divider = S(bow(80, 11, 0.95)) + G(dotsAlong(94, 136, 12, 6, 0.8) + mirrorX(dotsAlong(94, 136, 12, 6, 0.8), 160), 'fill="currentColor"') + S(flower5(147, 12, 2.1) + flower5(13, 12, 2.1) + sparkle(156, 5, 2.4) + sparkle(4, 19, 2.4));
  const title = S(flower5(40, 8, 2.1) + P('M12 8h18M50 8h18'));
  const corner = S(P('M5 91V35Q5 5 35 5h56') + P('M11 91V37Q11 11 37 11h54', 'opacity=".45"') + flower5(24, 24, 4) + flower5(42, 17, 2.4) + flower5(17, 43, 2.4) + sparkle(54, 28, 4) + sparkle(30, 52, 3) + heart(40, 34, 1.1));
  const ampSide = heart(42, 12, 1);
  const amp = S(ampSide + mirrorX(ampSide, 120)) + G(dotsAlong(10, 34, 12, 6, 0.8) + mirrorX(dotsAlong(10, 34, 12, 6, 0.8), 120), 'fill="currentColor"');
  const monogram = S(P('M36 16h48a26 26 0 0 1 26 26v44a26 26 0 0 1-26 26H36a26 26 0 0 1-26-26V42a26 26 0 0 1 26-26Z') + P('M38 22h44a22 22 0 0 1 22 22v40a22 22 0 0 1-22 22H38a22 22 0 0 1-22-22V44a22 22 0 0 1 22-22Z', 'opacity=".45"') + bow(60, 16, 1.25) + flower5(22, 100, 3) + flower5(98, 100, 3) + sparkle(100, 30, 3.5) + sparkle(20, 34, 2.6));
  const gift = S(P('M12 30h40v26a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3zM8 24a2 2 0 0 1 2-2h44a2 2 0 0 1 2 2v6H8zM32 22v37', 'stroke-width="1.2"') + bow(32, 20, 1) + sparkle(52, 12, 3.4) + sparkle(12, 13, 2.4));
  out('korean', 'Bộ họa tiết korean (Pastel Hàn): nơ ruy băng, hoa 5 cánh tròn, lấp lánh, tim, khung bo tròn lớn, chấm. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram, gift });
}

/* ============ 8. tropical (Biển Đảo) ============ */
{
  const sideR = wave(93, 10.5, 7, 7.5, 2.6) + P('M93 15q3.75-2.6 7.5 0' + 't7.5 0'.repeat(6), 'opacity=".5"');
  const divider = S(shell(80, 21, 10) + sideR + mirrorX(sideR, 160)) + FILL(C(150, 15, 1.1) + C(10, 15, 1.1));
  const title = S(shell(40, 14.5, 6) + P('M6 12h26M48 12h26'));
  const corner = S(P('M5 91V5h86', 'opacity=".4"') + palm([8, 8], [44, 16], [84, 40], 10, 11) + palm([8, 8], [18, 44], [40, 84], 9, 10) + shell(52, 66, 8) + wave(66, 84, 3, 8, 2.6));
  const ampSide = wave(8, 12, 4, 8, 2.6);
  const amp = S(ampSide + mirrorX(ampSide, 120));
  const monogram = S(P('M71 11A50 50 0 1 1 49 11') + P('M70 17.3A44 44 0 1 1 50 17.3', 'opacity=".45"') + shell(60, 17, 10) + palm([60, 112], [30, 108], [16, 80], 8, 8) + palm([60, 112], [90, 108], [104, 80], 8, 8));
  const gift = S(P('M12 30h40v26H12zM8 22h48v8H8zM32 30v26', 'stroke-width="1.2"') + plumeria(32, 20, 8) + wave(15, 47, 2, 7, 2.2) + wave(37, 47, 2, 7, 2.2));
  out('tropical', 'Bộ họa tiết tropical (Biển Đảo): vỏ sò điệp, lá cọ, sóng, hoa sứ. Tự vẽ (ui-ux-designer v4a-1).', { divider, title, corner, amp, monogram, gift });
}
