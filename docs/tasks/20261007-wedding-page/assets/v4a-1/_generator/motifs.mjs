// B2: hoạ tiết nền vector. Mỗi bộ 4 mảnh: medallion (400), corner (200, vẽ cho góc trên-trái), band (240x40 lặp ngang), tile (lặp 2 chiều).
// Tự vẽ, lấy cảm hứng từ mô-típ dân gian (không sao chép ảnh/scan có bản quyền). Tô currentColor; dùng làm mask-image -> màu do CSS.
import { f, pt, polar, rng, svgDoc, smoothOpen } from './lib.mjs';

const sizes = {};
let DEFS = ''; let UID = 0; let ROS = null;
const def = (content) => { const id = 'd' + (++UID); DEFS += `<g id="${id}">${content}</g>`; return id; };
const use = (id, tf) => `<use href="#${id}" transform="${tf}"/>`;
const piece = (set, name, vb, inner0, sw) => {
  const inner = ((DEFS ? `<defs>${DEFS}</defs>` : '') + inner0).replace(/(\d+\.\d)\d+/g, '$1').replace(/\.0(?=\D)/g, ''); DEFS = ''; UID = 0; ROS = null;
  const s = svgDoc(`motifs/${set}/${name}.svg`, `B2 motif ${set}/${name} - ui-ux-designer v4a-1. Tự vẽ.`, vb,
    `<g fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`, 15360);
  sizes[set] = (sizes[set] ?? 0) + s;
};
const path = (d, a = '') => (d ? `<path d="${d}"${a ? ' ' + a : ''}/>` : '');
const fillP = (d) => path(d, 'fill="currentColor" stroke="none"');
const circ = (cx, cy, r) => `M${pt(cx - r, cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
const arc = (cx, cy, r, a0, a1) => { const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1); return `M${pt(x0, y0)}A${f(r)} ${f(r)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(x1, y1)}`; };
const ringOrArc = (cx, cy, r, a0, a1) => (a1 - a0 >= 360 ? circ(cx, cy, r) : arc(cx, cy, r, a0, a1));
const steps = (n, a0, a1, fn) => { let d = ''; const full = a1 - a0 >= 360; const cnt = full ? n : Math.round((n * (a1 - a0)) / 360) + 1; for (let i = 0; i < cnt; i++) d += fn(a0 + (i * 360) / n, i); return d; };
const zigzag = (cx, cy, r1, r2, n, a0 = 0, a1 = 360) => { const pts = []; const full = a1 - a0 >= 360; const cnt = full ? 2 * n : Math.round((2 * n * (a1 - a0)) / 360) + 1; for (let i = 0; i <= cnt; i++) pts.push(polar(cx, cy, i % 2 ? r2 : r1, a0 + (i * 180) / n)); return 'M' + pts.map((p) => pt(...p)).join('L'); };
const hatch = (cx, cy, r1, r2, n, a0 = 0, a1 = 360) => steps(n, a0, a1, (a) => { const [x1, y1] = polar(cx, cy, r1, a), [x2, y2] = polar(cx, cy, r2, a); return `M${pt(x1, y1)}L${pt(x2, y2)}`; });
// vòng tròn chấm giữa nối tiếp tuyến (mô-típ đặc trưng trống đồng)
const tangentCircles = (cx, cy, R, n, c, a0 = 0, a1 = 360) => {
  const step = 360 / n; const [x, y] = [cx + R, cy]; const [x2, y2] = polar(cx, cy, R, step);
  const [p1x, p1y] = polar(x, y, c, 90 - 50); const [p2x, p2y] = polar(x2, y2, c, -90 + 50 + step);
  const id = def(`<path d="${circ(x, y, c)}M${pt(p1x, p1y)}L${pt(p2x, p2y)}"/><path fill="currentColor" stroke="none" d="${circ(x, y, c * 0.28)}"/>`);
  return steps(n, a0, a1, (a) => use(id, `rotate(${f(a)} ${pt(cx, cy)})`));
};
// chim Lạc cách điệu: mỏ dài, mào, cánh xoè, đuôi chẻ (hệ toạ độ địa phương hướng +x)
const BIRD = 'M-14 0C-8-5 4-5 10-1.4L27-2.4 10 1.6C4 5-8 5-14 0Z' + 'M5-3 1-12M8-3.4 6.5-13M2.5-2.6-3-10' + 'M-2-3.5C-6-14-14-19-24-19C-17-13-11-8.5-6-3.6' + 'M-6-3.6C-12-9-18-11-24-11' + 'M-14 0-29-5M-14 0-30 0.5M-14 0.6-28 6';
const birds = (cx, cy, R, n, s, a0 = 0, a1 = 360) => { const id = def(`<path transform="translate(${pt(cx + R, cy)}) rotate(-90) scale(${f(s)} ${f(-s)})" d="${BIRD}"/><circle cx="6" cy="1" r="1.1" transform="translate(${pt(cx + R, cy)}) rotate(-90) scale(${f(s)} ${f(-s)})" fill="currentColor" stroke="none"/>`); return steps(n, a0, a1, (a) => use(id, `rotate(${f(a)} ${pt(cx, cy)})`)); };
const _unusedBirdEyes = (cx, cy, R, n, s, a0 = 0, a1 = 360) =>
  steps(n, a0, a1, (a) => { const [x, y] = polar(cx, cy, R, a); const [ex, ey] = [x + Math.cos(((a - 90) * Math.PI) / 180) * 6 * s - Math.cos((a * Math.PI) / 180) * 1 * s, y + Math.sin(((a - 90) * Math.PI) / 180) * 6 * s - Math.sin((a * Math.PI) / 180) * 1 * s]; return `<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(1.1 * s)}" fill="currentColor" stroke="none"/>`; });
const hatchRing = (cx, cy, r1, r2, n) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f((r1 + r2) / 2)}" pathLength="${n}" stroke-width="${f(r2 - r1)}" stroke-dasharray=".22 .78" stroke-linecap="butt"/>`;
const star = (cx, cy, R, r, n, a0 = -90) => { let d = ''; for (let i = 0; i < 2 * n; i++) { const [x, y] = polar(cx, cy, i % 2 ? r : R, a0 + (i * 180) / n); d += (i ? 'L' : 'M') + pt(x, y); } return d + 'Z'; };

/* ================= 1. dong-son: trống đồng Đông Sơn ================= */
{
  const drum = (cx, cy, a0, a1, sw = 1.6) => {
    const R = (r) => ringOrArc(cx, cy, r, a0, a1);
    let between = ''; steps(14, a0, a1, (a) => { const [x1, y1] = polar(cx, cy, 20, a + 360 / 28); const [x2, y2] = polar(cx, cy, 30, a + 360 / 28 - 7); const [x3, y3] = polar(cx, cy, 30, a + 360 / 28 + 7); between += `M${pt(x2, y2)}L${pt(x1, y1)}L${pt(x3, y3)}`; return ''; });
    return (a1 - a0 >= 360 ? fillP(star(cx, cy, 42, 13, 14)) + path(circ(cx, cy, 6)) : fillP(star(cx, cy, 42, 13, 14)))
      + path(between)
      + path(R(48) + R(56)) + tangentCircles(cx, cy, 64, 26, 5.2, a0, a1) + path(R(72) + zigzag(cx, cy, 72, 80, 48, a0, a1) + R(80) + R(84))
      + birds(cx, cy, 106, 8, 1.32, a0 + 10, a1) + path(R(128) + R(132))
      + tangentCircles(cx, cy, 141, 44, 6, a0, a1) + path(R(150) + R(160)) + hatchRing(cx, cy, 150, 160, 120) + path('' + zigzag(cx, cy, 164, 174, 64, a0, a1) + R(178) + R(186) + R(192));
  };
  piece('dong-son', 'medallion', '0 0 400 400', drum(200, 200, 0, 360), 1.6);
  const b = (() => { let tc = '', dots = '', zz = 'M0 30'; for (let x = 0; x < 240; x += 24) { tc += circ(x + 12, 14, 6); dots += circ(x + 12, 14, 1.7); tc += `M${pt(x + 12 + 4, 14 - 4.5)}L${pt(x + 36 - 4, 14 + 4.5)}`; } for (let x = 0; x < 240; x += 12) zz += `L${x + 6} 24L${x + 12} 30`; let ht = ''; for (let x = 3; x < 240; x += 6) ht += `M${x} 34v5`; return path('M0 2H240M0 26.5H240M0 38.5H240' + tc + zz + ht) + fillP(dots); })();
  piece('dong-son', 'band', '0 0 240 40', b, 1.4);
  const t = [[0, 0], [160, 0], [0, 160], [160, 160], [80, 80]].map(([x, y]) => fillP(star(x, y, 16, 5, 14)) + path(circ(x, y, 22) + circ(x, y, 26))).join('') + tangentCircles(80, 80, 40, 12, 3.4);
  piece('dong-son', 'tile', '0 0 160 160', t, 1.1);
}

/* ================= 2. may-cat-tuong: mây cát tường ================= */
const CLOUD = 'M0 0H52C60 0 60-10 53-11C55-20 44-24 39-17C37-28 22-29 20-18C14-24 4-20 7-12C0-12-3-4 2-1' + 'M39-17C44-16 45-10 40-9C37-8.5 36-12 38.5-12.5' + 'M20-18C25-17 26-11 21-10.5C18-10 17.5-13.5 20-14' + 'M0 0C-10 0-14 4-24 3.4';
const cloud = (x, y, a = 0, s = 1, flip = false) => `<path transform="translate(${pt(x, y)})${a ? ` rotate(${f(a)})` : ''} scale(${f(flip ? -s : s)} ${f(s)})" d="${CLOUD}"/>`;
{
  let med = path(circ(200, 200, 40) + circ(200, 200, 46) + circ(200, 200, 186) + circ(200, 200, 192));
  for (let i = 0; i < 8; i++) { const a = i * 45; const [x, y] = polar(200, 200, 118, a); med += cloud(x, y, a + 90, 1.55, false); }
  for (let i = 0; i < 8; i++) { const a = i * 45 + 22.5; const [x, y] = polar(200, 200, 70, a); med += cloud(x, y, a + 90, 0.62); }
  med += path(circ(200, 200, 12)) + fillP(circ(200, 200, 4));
  piece('may-cat-tuong', 'medallion', '0 0 400 400', med, 1.5);
  piece('may-cat-tuong', 'corner', '0 0 200 200', path('M6 194V6h188M14 194V14h180') + cloud(40, 70, 0, 1.6) + cloud(110, 44, 0, 1.1, true) + cloud(36, 140, -90, 1), 1.4);
  piece('may-cat-tuong', 'band', '0 0 240 40', path('M0 36H240M0 3H240') + cloud(24, 30, 0, 0.75) + cloud(144, 30, 0, 0.75) + cloud(108, 30, 0, 0.55, true) + cloud(228, 30, 0, 0.55, true), 1.5);
  { // tile 200: mây rải lệch, mây chạm mép được vẽ lặp ở mép đối diện (tile liền)
    const T = 200; let o = '';
    for (const [x, y, sc, fl] of [[30, 70, 1, false], [120, 160, 0.9, false], [168, 64, 0.6, true], [70, 196, 0.6, true]]) {
      const x0 = fl ? x - 60 * sc : x - 24 * sc, x1 = fl ? x + 24 * sc : x + 60 * sc, y0 = y - 29 * sc, y1 = y + 4;
      const dxs = [...new Set([0, x0 < 0 ? T : 0, x1 > T ? -T : 0])], dys = [...new Set([0, y0 < 0 ? T : 0, y1 > T ? -T : 0])];
      for (const dx of dxs) for (const dy of dys) o += cloud(x + dx, y + dy, 0, sc, fl);
    }
    piece('may-cat-tuong', 'tile', '0 0 200 200', o, 1.2);
  }
}

/* ================= 3. song-nuoc: sóng nước cuộn ================= */
{
  // con sóng cuộn: đường nước dâng lên đỉnh rồi cuộn xoắn vào trong, kèm 2 đường song song phía dưới
  const crest = (x, y, s = 1) => `<path transform="translate(${pt(x, y)}) scale(${f(s)})" d="M0 0C12 0 16-18 32-18C44-18 48-8 42-3C37 1 31-3 34-7C36-9.5 39-8.5 39-6M-4 6C10 6 18-10 32-10M-8 12C8 12 20-2 34-2C46-2 52 6 60 6"/>`;
  let ser = ''; // vảy sóng (3 cung lồng), lệch hàng
  for (let row = 0; row < 5; row++) for (let col = -1; col < 5; col++) { const cx = col * 40 + (row % 2 ? 20 : 0), cy = row * 20 + 20; for (const r of [20, 14, 8]) ser += arc(cx, cy, r, 180, 360); }
  piece('song-nuoc', 'tile', '0 0 160 80', path(ser), 1);
  let med = path(circ(200, 200, 60) + circ(200, 200, 66) + circ(200, 200, 176) + circ(200, 200, 182));
  for (let i = 0; i < 12; i++) { const a = i * 30; const [x, y] = polar(200, 200, 112, a); med += `<g transform="translate(${pt(x, y)}) rotate(${f(a + 90)}) translate(-26 8)">${crest(0, 0, 1.15)}</g>`; }
  let inner = ''; for (const r of [44, 30, 16]) inner += circ(200, 200, r);
  med += path(inner);
  piece('song-nuoc', 'medallion', '0 0 400 400', med, 1.5);
  piece('song-nuoc', 'corner', '0 0 200 200', crest(10, 60, 2.2) + crest(60, 130, 1.4) + crest(-30, 180, 1.4) + path('M6 194V6h188', 'opacity=".6"'), 1.3);
  piece('song-nuoc', 'band', '0 0 240 40', crest(0, 30, 0.75) + crest(60, 30, 0.75) + crest(120, 30, 0.75) + crest(180, 30, 0.75) + crest(240, 30, 0.75) + path('M0 39H240'), 1.5);
}

/* ================= 4. hoa-sen ================= */
{
  const PET = (L, W) => `M0 0C${f(W)} ${f(-L * 0.3)} ${f(W * 0.7)} ${f(-L * 0.8)} 0 ${f(-L)}C${f(-W * 0.7)} ${f(-L * 0.8)} ${f(-W)} ${f(-L * 0.3)} 0 0Z`;
  const rosette = (cx, cy, s) => { if (!ROS) { const po = def(`<path d="${PET(46, 15)}" transform="translate(0 -14)"/>`), pi = def(`<path d="${PET(30, 10)}M0 -6V-24" transform="rotate(22.5) translate(0 -12)"/>`); let d = ''; for (let i = 0; i < 8; i++) d += use(po, `rotate(${i * 45})`) + use(pi, `rotate(${i * 45})`); let dots = ''; for (let i = 0; i < 6; i++) { const [x, y] = polar(0, 0, 6.5, i * 60); dots += circ(x, y, 1.4); } ROS = def(d + path(circ(0, 0, 12)) + fillP(dots + circ(0, 0, 1.4))); } return use(ROS, `translate(${pt(cx, cy)}) scale(${f(s)})`); };
  let med = rosette(200, 200, 1.6) + path(circ(200, 200, 112) + circ(200, 200, 118));
  for (let i = 0; i < 24; i++) med += `<path transform="translate(200 200) rotate(${i * 15}) translate(0 -122)" d="${PET(26, 8)}"/>`;
  med += path(circ(200, 200, 156) + circ(200, 200, 186));
  let dts = ''; for (let i = 0; i < 48; i++) { const [x, y] = polar(200, 200, 171, i * 7.5); dts += circ(x, y, 2); } med += fillP(dts);
  piece('hoa-sen', 'medallion', '0 0 400 400', med, 1.5);
  const sideLotus = (x, y, s) => `<path transform="translate(${pt(x, y)}) scale(${f(s)})" d="M0 0C4-4 4-10 0-14C-4-10-4-4 0 0ZM0 0C-3-3-7-7-9-11C-9.5-6-6-1.5 0 0ZM0 0C3-3 7-7 9-11C9.5-6 6-1.5 0 0ZM0 0C-6-.5-11-3-13-6.5C-9-7-4-4.5 0 0ZM0 0C6-.5 11-3 13-6.5C9-7 4-4.5 0 0Z"/>`;
  const leafTop = (cx, cy, r) => { const [x1, y1] = polar(cx, cy, r, -90), [x2, y2] = polar(cx, cy, r, -66); let v = ''; for (let i = 0; i < 8; i++) { const [x, y] = polar(cx, cy, r * 0.8, -30 + i * 42); v += `M${pt(cx, cy)}L${pt(x, y)}`; } return path(`M${pt(cx, cy)}L${pt(x1, y1)}A${f(r)} ${f(r)} 0 1 0 ${pt(x2, y2)}Z` + v); };
  piece('hoa-sen', 'corner', '0 0 200 200', sideLotus(70, 96, 4) + path('M70 96C72 130 60 160 40 196M40 140C70 150 100 140 120 120') + leafTop(150, 100, 34) + leafTop(26, 40, 22) + path('M110 180q10-7 20 0t20 0t20 0M126 192q10-7 20 0t20 0'), 1.3);
  let bd = path('M0 34H240'); for (const x of [30, 150]) bd += sideLotus(x, 32, 1.6); for (const x of [90, 210]) bd += path(`M${x - 18} 32q9-12 18-12t18 12M${x - 10} 32q5-6 10-6t10 6`);
  piece('hoa-sen', 'band', '0 0 240 40', bd, 1.4);
  piece('hoa-sen', 'tile', '0 0 140 140', rosette(70, 70, 0.62) + rosette(0, 0, 0.36) + rosette(140, 0, 0.36) + rosette(0, 140, 0.36) + rosette(140, 140, 0.36), 1);
}

/* ================= 5. chu-hy: song hỷ hình học + hồi văn + kim tiền ================= */
{
  // song hỷ dựng bằng nét vuông (cùng hình học với traditional#songhy, phóng to), không dùng font CJK
  const SH = 'M6 7h72M21 2v13M63 2v13M11 15h20M53 15h20M12 20h18v9H12zM54 20h18v9H54zM14 34l2.5 4M28 34l-2.5 4M56 34l2.5 4M70 34l-2.5 4M3 42h78M12 47h18v13H12zM54 47h18v13H54z';
  const songhy = (cx, cy, s, sw) => `<path transform="translate(${pt(cx - 42 * s, cy - 31 * s)}) scale(${f(s)})" stroke-width="${f(sw / s)}" stroke-linecap="square" d="${SH}"/>`;
  // hồi văn: móc vuông lặp (chữ "回" mở), chu kỳ 20
  const keyRow = (x0, y, n, u = 1) => { let d = ''; for (let i = 0; i < n; i++) { const x = x0 + i * 20 * u; d += `M${pt(x, y)}h${f(16 * u)}v${f(-12 * u)}h${f(-12 * u)}v${f(8 * u)}h${f(8 * u)}v${f(-4 * u)}`; } return d; };
  let med = songhy(200, 200, 2.1, 4.2) + path(circ(200, 200, 112) + circ(200, 200, 120) + circ(200, 200, 186) + circ(200, 200, 192));
  for (let i = 0; i < 16; i++) med += `<g transform="translate(200 200) rotate(${i * 22.5}) translate(-20 -128)">${path(keyRow(0, 0, 2) + 'M0 2h36')}</g>`;
  for (let i = 0; i < 8; i++) { const a = i * 45 + 22.5; const [x, y] = polar(200, 200, 168, a); med += cloud(x, y, a + 90, 0.55); }
  piece('chu-hy', 'medallion', '0 0 400 400', med, 1.5);
  piece('chu-hy', 'corner', '0 0 200 200', path('M6 194V6h188M14 194V14h180' + keyRow(28, 34, 8)) + `<g transform="matrix(0 1 1 0 0 0)">${path(keyRow(48, 34, 7))}</g>` + songhy(60, 70, 0.42, 3), 1.4);
  piece('chu-hy', 'band', '0 0 240 40', path('M0 3H240M0 37H240' + keyRow(0, 30, 12, 1)), 1.6);
  // kim tiền (đồng tiền xu lồng nhau): tile 80
  piece('chu-hy', 'tile', '0 0 80 80', path(circ(0, 0, 40) + circ(80, 0, 40) + circ(0, 80, 40) + circ(80, 80, 40) + circ(40, 40, 40) + 'M36 36h8v8h-8z'), 1);
}

/* ================= 6. art-deco (trung tính, hiện đại) ================= */
{
  let med = path(circ(200, 200, 26) + circ(200, 200, 34) + circ(200, 200, 150) + circ(200, 200, 158) + circ(200, 200, 192));
  med += path(hatch(200, 200, 40, 146, 24) + hatch(200, 200, 40, 104, 24, 7.5, 367.5));
  let fan = ''; for (let i = 0; i < 24; i++) { const a = i * 15 + 7.5; const [x1, y1] = polar(200, 200, 112, a - 4), [x2, y2] = polar(200, 200, 140, a), [x3, y3] = polar(200, 200, 112, a + 4); fan += `M${pt(x1, y1)}L${pt(x2, y2)}L${pt(x3, y3)}`; }
  let steps2 = ''; for (let i = 0; i < 24; i++) { const a = i * 15; const [x, y] = polar(200, 200, 175, a); steps2 += `<path transform="translate(${pt(x, y)}) rotate(${a + 90})" d="M-8 6V0h4v-5h8v5h4v6"/>`; }
  med += path(fan) + steps2 + fillP(circ(200, 200, 6));
  piece('art-deco', 'medallion', '0 0 400 400', med, 1.4);
  let cfan = ''; for (let i = 0; i <= 9; i++) { const [x, y] = polar(30, 30, 110, i * 10); cfan += `M30 30L${pt(x, y)}`; }
  piece('art-deco', 'corner', '0 0 200 200', path('M6 194V6h188M14 194V40l26-26h154M22 194V60M60 22h134' + cfan + arc(30, 30, 110, 0, 90) + arc(30, 30, 80, 0, 90) + arc(30, 30, 40, 0, 90)) + fillP('M188 0l6 6-6 6-6-6zM0 188l6 6-6 6-6-6z'), 1.3);
  let fans = ''; for (let x = 0; x <= 240; x += 40) { fans += arc(x, 36, 18, 180, 360) + arc(x, 36, 11, 180, 360); for (let k = 1; k < 6; k++) { const [a, b] = polar(x, 36, 11, 180 + k * 30), [c, d] = polar(x, 36, 18, 180 + k * 30); fans += `M${pt(a, b)}L${pt(c, d)}`; } }
  piece('art-deco', 'band', '0 0 240 40', path('M0 37H240M0 4H240M0 8H240' + fans), 1.3);
  // vảy quạt art-deco: tile 60x30
  let sc = ''; for (const [cx, cy] of [[0, 30], [60, 30], [30, 15], [0, 0], [60, 0], [30, 45]]) { sc += arc(cx, cy, 30, 180, 360) + arc(cx, cy, 20, 180, 360); for (let k = 1; k < 4; k++) { const [a, b] = polar(cx, cy, 20, 180 + k * 45), [c, d] = polar(cx, cy, 30, 180 + k * 45); sc += `M${pt(a, b)}L${pt(c, d)}`; } }
  piece('art-deco', 'tile', '0 0 60 30', path(sc), 0.9);
}

/* ================= 7. la-canh: cành lá line-art (trung tính) ================= */
{
  const LF = 'M0 0C4-4.5 11-5 16-2.4C11 2 4 2.6 0 0Z';
  const lf = (x, y, a, s = 1) => `<path transform="translate(${pt(x, y)}) rotate(${f(a)}) scale(${f(s)})" d="${LF}M0 0H12"/>`;
  const branch = (pts, every = 1, s = 1, seed = 1) => { const r = rng(seed); let o = path(smoothOpen(pts)); for (let i = 1; i < pts.length; i += every) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const a = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI; o += lf(x1, y1, a - 40 - r() * 15, s) + lf(x1, y1, a + 40 + r() * 15, s); } return o; };
  let wreath = ''; for (const side of [-1, 1]) { const pts = []; for (let k = 0; k <= 10; k++) { const a = 90 + side * (8 + k * 15.5); pts.push(polar(200, 200, 150, a)); } wreath += branch(pts, 1, 1.5, side + 3); }
  piece('la-canh', 'medallion', '0 0 400 400', wreath + path(circ(200, 200, 168)) + fillP(circ(200, 350, 3)), 1.4);
  piece('la-canh', 'corner', '0 0 200 200', branch([[8, 190], [16, 150], [30, 112], [52, 80], [80, 56], [114, 38], [150, 26], [190, 18]], 1, 1.3, 7) + branch([[30, 112], [52, 120], [76, 118]], 1, 1, 9), 1.3);
  const bp = []; for (let x = 0; x <= 240; x += 20) bp.push([x, 20 + 7 * Math.sin((x / 240) * Math.PI * 4)]);
  piece('la-canh', 'band', '0 0 240 40', branch(bp, 1, 0.75, 5), 1.3);
  piece('la-canh', 'tile', '0 0 160 160', lf(30, 40, -30, 1.2) + lf(30, 40, 30, 1.2) + path('M14 40H30') + lf(110, 100, 150, 1.2) + lf(110, 100, 210, 1.2) + path('M126 100H110') + lf(120, 20, 60, 0.8) + lf(40, 130, -120, 0.8), 1);
}

console.log('Tổng mỗi bộ:', Object.entries(sizes).map(([k, v]) => `${k} ${v}B${v > 15360 ? ' (VƯỢT 15KB)' : ''}`).join(', '));
