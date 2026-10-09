// Asset 13 kiểu mở thiệp (design 3.4/3.4b, spec bổ sung design-v4a-2bc.md §2).
// Quy ước 2 loại asset:
//  - "mask"  : file SVG 1 màu (fill #000 + fill-opacity = alpha), FE đặt ở public/theme-assets/open/<id>/ và tô bằng
//              `background-color: var(--token); mask-image: url(...)` (CSP an toàn, màu theo token, 0 byte JS).
//  - "inline": sprite symbol có class; FE chép `d` vào module TS và dựng bằng svg() (cần animate từng phần).
// Chạy: node open.mjs  (ghi vào ../open/<id>/)
import { blob, f, f1, gz, leafPath, polar, pt, pt1, rng, smoothClosed, smoothOpen, sprite, svgDoc, tr, xf } from './lib.mjs';

const sizes = {};
const note = (id, r) => { (sizes[id] ??= []).push(r); };
const M = (d, a = '') => `<path d="${d}"${a ? ' ' + a : ''}/>`;
const inlineBudget = {};
/** ghi sprite inline + đo gzip phần dữ liệu `d` (ước lượng byte nhúng vào TS) */
function inline(id, comment, symbols) {
  const r = sprite(`open/${id}/inline.svg`, comment, symbols);
  const data = symbols.map(([, , inner]) => [...inner.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join('|')).join('|');
  inlineBudget[id] = gz(data);
  note(id, r);
}

// ---------------------------------------------------------------- curtain
{
  // diềm rèm (valance): tile 160×64, 1 võng + nửa quả tua mỗi mép -> lặp ngang liền
  const swag = 'M0 0H160V15C130 15 112 58 80 58S30 15 0 15Z';
  const tassel = (x) => `M${x - 5} 14h10l-1.5 6h-7Z M${x - 6} 20h12l2 22h-16Z`;
  note('curtain', svgDoc('open/curtain/valance-fill.svg', 'curtain: diềm rèm (mask, tô --op-fabric-deep). Tile 160×64 repeat-x, mask-size auto 100%', '0 0 160 64',
    M(swag) + M(tassel(0)) + M(tassel(160))));
  const fringe = Array.from({ length: 15 }, (_, i) => { const x = 8 + i * 10; const y = 15 + 43 * Math.sin((Math.PI * x) / 160) ** 1.2; return `M${f1(x)} ${f1(y - 1)}v4`; }).join('');
  note('curtain', svgDoc('open/curtain/valance-trim.svg', 'curtain: viền chỉ + tua của diềm (mask, tô --c-accent)', '0 0 160 64',
    `<g fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round">${M('M0 11.5H160')}${M('M0 15C30 15 48 55 80 55S130 15 160 15')}${M(fringe, 'stroke-width="1.1" stroke-opacity=".8"')}</g>`
    + `<g fill="#000">${M('M-4 21h8v2h-8ZM156 21h8v2h-8Z')}${M('M-3 30h6v1.4h-6ZM157 30h6v1.4h-6Z', 'fill-opacity=".7"')}<circle cx="80" cy="57" r="2.6"/></g>`));
  // dải viền dọc mép trong của 2 cánh rèm: chuỗi thoi + chấm, tile 16×40 repeat-y
  note('curtain', svgDoc('open/curtain/trim.svg', 'curtain: dải viền dọc mép giữa (mask, tô --c-accent), tile 16×40 repeat-y', '0 0 16 40',
    `<g fill="none" stroke="#000" stroke-width="1.2">${M('M2 0V40M14 0V40', 'stroke-width=".8"')}${M('M8 6 13 14 8 22 3 14Z')}</g><circle cx="8" cy="31" r="1.8"/>`));
}

// ---------------------------------------------------------------- wax-seal (inline: dấu sáp 96px vỡ đôi + mảnh vụn)
{
  const r = rng(11);
  const pts = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const drip = i % 4 === 1 ? 5 + r() * 4 : 0; // giọt sáp chảy
    const R = 38 + r() * 3 + drip;
    pts.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  const body = smoothClosed(pts);
  // đường nứt zíc-zắc từ trên xuống, lệch nhẹ khỏi trục để không cắt đôi đúng giữa monogram
  const zz = [[2, -50], [-3, -34], [5, -24], [-2, -12], [4, 0], [-4, 12], [3, 24], [-3, 36], [1, 50]];
  const zzs = zz.map(([x, y]) => pt(x, y)).join(' ');
  const crackL = `M-60 -60H2 L${zzs} V60H-60Z`;
  const crackR = `M60 -60H2 L${zzs} V60H60Z`;
  const shards = [
    'M0 -3 3 -1 2 3-2 2-3-1Z', 'M-2-2 3-3 4 1 0 3Z', 'M0-4 2 0 0 4-2 0Z', 'M-3-1 1-3 3 2-1 3Z', 'M-2-3 2-2 3 1-1 2-3 0Z', 'M0-2 3 1-2 2Z',
  ];
  inline('wax-seal', 'wax-seal: dấu sáp 96px (viewBox -48 -48 96 96). Lớp: .wx-body (gradient 3 điểm --op-wax), .wx-ring (vành ép), .wx-press (lõi lõm), 2 nửa = cùng hình + clipPath #crack-l/#crack-r (tĩnh), .wx-crack (vệt nứt hiện 120ms trước khi tách), 6 mảnh vụn .wx-shard', [
    ['wx-body', '-48 -48 96 96', M(body, 'class="wx-body"')],
    ['wx-press', '-48 -48 96 96', `<circle r="29" class="wx-press"/><circle r="31.5" fill="none" class="wx-ring"/><circle r="26.5" fill="none" class="wx-ring2"/>`],
    ['wx-crack', '-48 -48 96 96', M(`M${zzs.split(' ').slice(0, 2).join(' ')} L${zzs}`, 'class="wx-crack" fill="none" pathLength="100"')],
    ['crack-l', '-48 -48 96 96', M(crackL)],
    ['crack-r', '-48 -48 96 96', M(crackR)],
    ...shards.map((d, i) => [`wx-shard-${i + 1}`, '-5 -5 10 10', M(d, 'class="wx-body"')]),
  ]);
}

// ---------------------------------------------------------------- origami (inline: 4 cánh + nếp; mask: hoạ tiết mặt sau)
{
  inline('origami', 'origami: tờ giấy vuông 100×100, 4 cánh tam giác chồng mũi qua tâm 2 đơn vị. Mặt trước .og-face (--op-paper) + nếp .og-crease; mặt sau dùng mask flap-pattern.svg tô --c-accent trên nền --op-paper-2', [
    ['og-top', '0 0 100 100', M('M0 0H100L50 52Z', 'class="og-face"') + M('M50 0V50M50 52 30 18', 'class="og-crease"')],
    ['og-right', '0 0 100 100', M('M100 0V100L48 50Z', 'class="og-face"') + M('M100 50H50M48 50 82 30', 'class="og-crease"')],
    ['og-bottom', '0 0 100 100', M('M0 100H100L50 48Z', 'class="og-face"') + M('M50 100V50M50 48 70 82', 'class="og-crease"')],
    ['og-left', '0 0 100 100', M('M0 0V100L52 50Z', 'class="og-face"') + M('M0 50H50M52 50 18 70', 'class="og-crease"')],
    ['og-sticker', '-12 -12 24 24', `<circle r="11" class="og-stk"/><circle r="9" fill="none" class="og-stk-ring"/>` + M('M0 5.5C-7 1-6.5-4.5-3.2-4.8-1.4-5 0-3.4 0-2.4 0-3.4 1.4-5 3.2-4.8 6.5-4.5 7 1 0 5.5Z', 'class="og-stk-heart"')],
  ]);
  // hoạ tiết mặt sau cánh: tile 24×24 hoa 4 cánh nhỏ + chấm (lệch nửa ô)
  const fl = (x, y, s) => [0, 90, 180, 270].map((a) => M('M0 0C-1.6-1.5-1.4-4 0-4.6 1.4-4 1.6-1.5 0 0Z', `transform="${tr(x, y, a, s)}"`)).join('');
  note('origami', svgDoc('open/origami/flap-pattern.svg', 'origami: hoạ tiết mặt sau cánh (mask tile 24×24, tô --c-accent, opacity .55)', '0 0 24 24',
    fl(6, 6, 1) + fl(18, 18, 1) + `<circle cx="18" cy="6" r="1"/><circle cx="6" cy="18" r="1"/>`));
}

// ---------------------------------------------------------------- double-door (mask: chạm khắc cánh cửa + vòng nắm)
{
  // 1 cánh (trái) 200×520; cánh phải = lật ngang bằng CSS scaleX(-1)
  const W = 200, H = 520;
  let s = '';
  s += M(`M10 10H${W - 10}V${H - 10}H10Z M18 18H${W - 18}V${H - 18}H18Z`, 'fill-rule="evenodd"'); // khung kép
  // ô trên: vòm + song cửa chéo (lattice) + hoa giữa
  const top = { x: 30, y: 34, w: W - 60, h: 250 };
  s += M(`M${top.x} ${top.y + 60}Q${top.x} ${top.y} ${W / 2} ${top.y}Q${top.x + top.w} ${top.y} ${top.x + top.w} ${top.y + 60}V${top.y + top.h}H${top.x}Z`, 'fill="none" stroke="#000" stroke-width="3"');
  let lat = '';
  for (let k = -6; k <= 12; k++) {
    const x0 = top.x + k * 22;
    lat += `M${x0} ${top.y + top.h}l${top.h} -${top.h}M${x0} ${top.y}l${top.h} ${top.h}`;
  }
  s += `<clipPath id="dd-c"><path d="M${top.x + 6} ${top.y + 62}Q${top.x + 6} ${top.y + 6} ${W / 2} ${top.y + 6}Q${top.x + top.w - 6} ${top.y + 6} ${top.x + top.w - 6} ${top.y + 62}V${top.y + top.h - 6}H${top.x + 6}Z"/></clipPath>`;
  s += `<g clip-path="url(#dd-c)" fill="none" stroke="#000" stroke-width="1.4" stroke-opacity=".75">${M(lat)}</g>`;
  // hoa chạm giữa ô trên (8 cánh)
  const cx = W / 2, cy = top.y + 130;
  s += `<circle cx="${cx}" cy="${cy}" r="34" fill="#fff" fill-opacity="0"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="30"/><circle cx="${cx}" cy="${cy}" r="27" fill="#000" fill-opacity="0" stroke="#fff"/>`;
  // lõi trống để thấy nền cửa: vẽ hoa bằng các cánh rỗng evenodd
  let petals = '';
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    const [x1, y1] = polar(cx, cy, 6, a - 90);
    const [x2, y2] = polar(cx, cy, 24, a - 90);
    const [c1x, c1y] = polar(cx, cy, 18, a - 90 - 18);
    const [c2x, c2y] = polar(cx, cy, 18, a - 90 + 18);
    petals += `M${pt(x1, y1)}Q${pt(c1x, c1y)} ${pt(x2, y2)}Q${pt(c2x, c2y)} ${pt(x1, y1)}Z`;
  }
  s = s.replace(`<circle cx="${cx}" cy="${cy}" r="30"/>`, M(`M${cx - 30} ${cy}a30 30 0 1 0 60 0a30 30 0 1 0-60 0Z${petals}M${cx - 4} ${cy}a4 4 0 1 0 8 0a4 4 0 1 0-8 0Z`, 'fill-rule="evenodd"'));
  s = s.replace(`<circle cx="${cx}" cy="${cy}" r="34" fill="#fff" fill-opacity="0"/>`, '').replace(`<circle cx="${cx}" cy="${cy}" r="27" fill="#000" fill-opacity="0" stroke="#fff"/>`, '');
  // ô giữa nhỏ: thanh ngang có hoạ tiết hồi văn
  const my = top.y + top.h + 22;
  s += M(`M30 ${my}H${W - 30}V${my + 34}H30Z M36 ${my + 6}H${W - 36}V${my + 28}H36Z`, 'fill-rule="evenodd"');
  let meander = `M42 ${my + 23}`;
  for (let x = 42; x < W - 50; x += 16) meander += `V${my + 11}H${x + 10}V${my + 19}H${x + 5}V${my + 15}`;
  s += M(meander, 'fill="none" stroke="#000" stroke-width="1.4"');
  // ô dưới: khung + thoi giữa
  const by = my + 56, bh = H - 34 - by;
  s += M(`M30 ${by}H${W - 30}V${by + bh}H30Z M36 ${by + 6}H${W - 36}V${by + bh - 6}H36Z`, 'fill-rule="evenodd"');
  s += M(`M${W / 2} ${by + 22}L${W - 54} ${by + bh / 2}L${W / 2} ${by + bh - 22}L54 ${by + bh / 2}Z`, 'fill="none" stroke="#000" stroke-width="2"');
  s += `<circle cx="${W / 2}" cy="${by + bh / 2}" r="6"/>`;
  note('double-door', svgDoc('open/double-door/door-carve.svg', 'double-door: chạm khắc 1 cánh (trái) 200×520 (mask, tô --c-accent .9). Cánh phải = scaleX(-1). Nền cánh = --op-door (CSS)', `0 0 ${W} ${H}`, s));
  // vòng nắm cửa (đặt sát mép giữa, ngang 52% chiều cao)
  note('double-door', svgDoc('open/double-door/ring.svg', 'double-door: vòng nắm cửa 32×48 (mask, tô --c-accent)', '0 0 32 48',
    `<circle cx="16" cy="9" r="6"/>${M('M16 15a13 13 0 1 0 .01 0Z M16 18.5a9.5 9.5 0 1 1-.01 0Z', 'fill-rule="evenodd"')}`));
}

// ---------------------------------------------------------------- flower-gate (vector thay WebP: 4 lớp mask 1 màu)
{
  const W = 260, H = 560;
  const r = rng(2026);
  const leaf = [], bloom = [], deep = [], line = [];
  // dây leo cong: chân trái-dưới -> vòm trên-phải (cụm trái của cổng; cụm phải = scaleX(-1))
  const vine = [[18, 560], [26, 470], [30, 380], [42, 290], [64, 205], [104, 130], [160, 76], [228, 40], [262, 30]];
  line.push(M(smoothOpen(vine), 'fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round"'));
  const along = (t) => { const i = Math.min(vine.length - 2, Math.floor(t * (vine.length - 1))); const k = t * (vine.length - 1) - i; const a = vine[i], b = vine[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI]; };
  // lá dọc dây
  const LEAF = (len) => leafPath(len, [[0, 0], [0.2, len * 0.2], [0.55, len * 0.24], [0.85, len * 0.12], [1, 0]]);
  for (let i = 0; i < 26; i++) {
    const t = 0.03 + (i / 26) * 0.95 + (r() - 0.5) * 0.02;
    const [x, y, a] = along(t);
    const side = i % 2 ? 1 : -1;
    const len = 22 + r() * 18;
    const ang = a + 90 + side * (40 + r() * 35) - 90;
    leaf.push(M(LEAF(len), `transform="${tr(x, y, ang + 90 * side, 1)}"`));
    line.push(M(`M0 0V${f1(-len * 0.85)}`, `transform="${tr(x, y, ang + 90 * side)}" fill="none" stroke="#000" stroke-width=".9"`));
  }
  // hoa: bông lớn (mẫu đơn/hồng) - silhouette nhiều thuỳ, lớp sâu = cánh trong hình lưỡi liềm, nét = mép cánh xoắn
  const flower = (cx, cy, R, seed) => {
    const q = rng(seed);
    const pts = [];
    const lobes = 7 + Math.floor(q() * 3);
    for (let i = 0; i < lobes * 3; i++) {
      const a = (i / (lobes * 3)) * Math.PI * 2;
      const k = 0.86 + 0.14 * Math.abs(Math.sin((i * Math.PI) / 3)) + (q() - 0.5) * 0.05;
      pts.push([cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k * 0.92]);
    }
    bloom.push(M(smoothClosed(pts)));
    // cánh trong: 3 vòng lưỡi liềm lệch dần về tâm
    [[0.74, 0], [0.54, 70], [0.34, 150]].forEach(([k, rot], j) => {
      const rr = R * k;
      const a0 = rot + q() * 30;
      const p1 = polar(cx, cy, rr, a0), p2 = polar(cx, cy, rr, a0 + 200), pc = polar(cx, cy, rr * 0.35, a0 + 100);
      deep.push(M(`M${pt1(...p1)}A${f1(rr)} ${f1(rr * 0.92)} 0 1 1 ${pt1(...p2)}Q${pt1(...pc)} ${pt1(...p1)}Z`, `fill-opacity="${[0.55, 0.75, 0.95][j]}"`));
      line.push(M(`M${pt1(...p1)}A${f1(rr)} ${f1(rr * 0.92)} 0 1 1 ${pt1(...p2)}`, 'fill="none" stroke="#000" stroke-width="1.1"'));
    });
    deep.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(R * 0.12)}"/>`);
  };
  const small = (cx, cy, R, seed) => {
    // hoa 5 cánh nhỏ
    const q = rng(seed);
    const rot = q() * 72;
    for (let i = 0; i < 5; i++) bloom.push(M(leafPath(R, [[0, 0], [0.3, R * 0.38], [0.75, R * 0.42], [1, 0]]), `transform="${tr(cx, cy, rot + i * 72)}"`));
    deep.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(R * 0.26)}"/>`);
  };
  const bud = (cx, cy, R, a) => { bloom.push(M(leafPath(R, [[0, 0], [0.35, R * 0.42], [0.8, R * 0.3], [1, 0]]), `transform="${tr(cx, cy, a)}"`)); leaf.push(M(leafPath(R * 0.55, [[0, 0], [0.4, R * 0.32], [1, 0]]), `transform="${tr(cx, cy, a + 180)}"`)); };
  flower(64, 250, 50, 1); flower(150, 104, 44, 2); flower(36, 400, 40, 3);
  small(108, 182, 17, 4); small(222, 52, 15, 5); small(70, 330, 14, 6); small(18, 480, 15, 7); small(104, 70, 12, 8);
  bud(194, 82, 16, -40); bud(22, 312, 14, 200); bud(86, 446, 13, 160); bud(122, 230, 12, 30);
  // chấm hoa li ti (baby's breath)
  for (let i = 0; i < 26; i++) { const [x, y] = along(0.05 + r() * 0.9); deep.push(`<circle cx="${f1(x + (r() - 0.5) * 70)}" cy="${f1(y + (r() - 0.5) * 50)}" r="${f1(1.6 + r() * 1.6)}" fill-opacity=".7"/>`); }
  const vb = `0 0 ${W} ${H}`;
  note('flower-gate', svgDoc('open/flower-gate/cluster-leaf.svg', 'flower-gate cụm trái: LÁ (mask, tô --op-leaf). Cụm phải = scaleX(-1)', vb, leaf.join('')));
  note('flower-gate', svgDoc('open/flower-gate/cluster-bloom.svg', 'flower-gate cụm trái: CÁNH HOA (mask, tô --op-bloom)', vb, bloom.join('')));
  note('flower-gate', svgDoc('open/flower-gate/cluster-deep.svg', 'flower-gate cụm trái: CÁNH TRONG/NHỤY (mask, tô --op-bloom-deep)', vb, deep.join('')));
  note('flower-gate', svgDoc('open/flower-gate/cluster-line.svg', 'flower-gate cụm trái: NÉT (mask, tô --c-primary-decor, opacity .55)', vb, line.join('')));
  // vòm cổng: 2 cung mảnh + chồi nhỏ - nửa trái 200×560 (CSS lật cho nửa phải)
  note('flower-gate', svgDoc('open/flower-gate/arch.svg', 'flower-gate: vòm cổng nửa trái 200×560 (mask, tô --c-accent)', '0 0 200 560',
    M('M14 560V200C14 96 96 14 200 14M26 560V200C26 103 103 26 200 26', 'fill="none" stroke="#000" stroke-width="2"')
    + [120, 220, 320, 420, 520].map((y) => `<circle cx="20" cy="${y}" r="3"/>`).join('')));
}

// ---------------------------------------------------------------- scroll (inline: trục gỗ + ruy băng)
{
  inline('scroll', 'scroll: trục 320×24 (.sc-rod --op-wood, .sc-knob --c-accent, .sc-hi trắng .35) + ruy băng 60×72 (.sc-rib --op-ribbon, .sc-rib2 đậm hơn) có nút thắt và 2 đuôi', [
    ['sc-rod', '0 0 320 24', M('M16 6H304Q307 6 307 9V15Q307 18 304 18H16Q13 18 13 15V9Q13 6 16 6Z', 'class="sc-rod"') + M('M18 8.5H302', 'class="sc-hi"')
      + M('M13 4.5H8Q5 4.5 5 7.5V16.5Q5 19.5 8 19.5H13ZM307 4.5H312Q315 4.5 315 7.5V16.5Q315 19.5 312 19.5H307Z', 'class="sc-knob"')
      + M('M5 9.5H1Q0 9.5 0 10.5V13.5Q0 14.5 1 14.5H5ZM315 9.5H319Q320 9.5 320 10.5V13.5Q320 14.5 319 14.5H315Z', 'class="sc-knob"')],
    ['sc-ribbon', '0 0 60 72', M('M22 0H38V72H22Z', 'class="sc-rib"')
      + M('M30 30C18 14 4 16 6 27S22 36 30 30ZM30 30C42 14 56 16 54 27S38 36 30 30Z', 'class="sc-rib" pathLength="100"')
      + M('M30 30 18 60 24 58 26 66ZM30 30 42 60 36 58 34 66Z', 'class="sc-rib2"') + '<circle cx="30" cy="30" r="5" class="sc-rib2"/>'],
  ]);
}

// ---------------------------------------------------------------- card-3d (mask: khung thẻ hiện đại)
{
  const W = 300, H = 420;
  let s = M(`M14 8H${W - 14}Q${W - 8} 8 ${W - 8} 14V${H - 14}Q${W - 8} ${H - 8} ${W - 14} ${H - 8}H14Q8 ${H - 8} 8 ${H - 14}V14Q8 8 14 8Z`, 'fill="none" stroke="#000" stroke-width="1.2"');
  s += M(`M22 18H${W - 22}M22 ${H - 18}H${W - 22}M18 22V${H - 22}M${W - 18} 22V${H - 22}`, 'fill="none" stroke="#000" stroke-width=".7" stroke-dasharray="1 4" stroke-linecap="round"');
  const corner = (x, y, a) => `<g transform="${tr(x, y, a)}">${M('M0 0H22M0 0V22', 'fill="none" stroke="#000" stroke-width="2"')}<circle cx="5" cy="5" r="2"/></g>`;
  s += corner(14, 14, 0) + corner(W - 14, 14, 90) + corner(W - 14, H - 14, 180) + corner(14, H - 14, 270);
  s += `<circle cx="${W / 2}" cy="8" r="3"/><circle cx="${W / 2}" cy="${H - 8}" r="3"/>`;
  note('card-3d', svgDoc('open/card-3d/card-frame.svg', 'card-3d: khung mặt thẻ 300×420 (5:7) (mask, tô --c-accent). Mặt sau dùng cùng khung', `0 0 ${W} ${H}`, s));
}

// ---------------------------------------------------------------- gift-box (inline)
{
  inline('gift-box', 'gift-box: hộp quà 240×240 phẳng-line. .gb-box (--op-box), .gb-side (--op-box-deep), .gb-rib (--op-ribbon), .gb-line (nét --c-primary-decor 1.4). Nơ 2 vòng có pathLength=100 (tuột bằng stroke-dashoffset 0→100)', [
    ['gb-body', '0 0 240 240', M('M42 116H198V214Q198 220 192 220H48Q42 220 42 214Z', 'class="gb-box"') + M('M42 116H198V128H42Z', 'class="gb-side"')
      + M('M108 116H132V220H108Z', 'class="gb-rib"') + M('M42 116H198V214Q198 220 192 220H48Q42 220 42 214Z', 'class="gb-line" fill="none"')],
    ['gb-lid', '0 0 240 240', M('M32 84H208Q212 84 212 88V112Q212 116 208 116H32Q28 116 28 112V88Q28 84 32 84Z', 'class="gb-box"')
      + M('M106 84H134V116H106Z', 'class="gb-rib"') + M('M28 108H212V112Q212 116 208 116H32Q28 116 28 112Z', 'class="gb-side"')
      + M('M32 84H208Q212 84 212 88V112Q212 116 208 116H32Q28 116 28 112V88Q28 84 32 84Z', 'class="gb-line" fill="none"')],
    ['gb-bow', '0 0 240 240', M('M120 82C98 52 66 50 70 70S104 88 120 82Z', 'class="gb-bowl" pathLength="100"') + M('M120 82C142 52 174 50 170 70S136 88 120 82Z', 'class="gb-bowl" pathLength="100"')
      + M('M120 82C112 94 104 104 92 110M120 82C128 94 136 104 148 110', 'class="gb-tail" pathLength="100"') + '<circle cx="120" cy="82" r="7" class="gb-knot"/>'],
    ['gb-tag', '0 0 72 40', M('M10 2H70V38H10L1 20Z', 'class="gb-tagp"') + '<circle cx="12" cy="20" r="2.4" class="gb-hole"/>'],
  ]);
}

// ---------------------------------------------------------------- moon-gate (mask: song cửa tile + sen)
{
  // song cửa "mắt cáo" + chữ vạn đơn giản: tile 48×48
  const s = `<g fill="none" stroke="#000" stroke-width="2">${M('M0 24H48M24 0V48')}${M('M8 8H40V40H8Z', 'stroke-width="1.4"')}${M('M16 16H32V32H16Z', 'stroke-width="1.2"')}</g><g fill="#000"><circle cx="24" cy="24" r="2.4"/><circle cx="0" cy="0" r="2"/><circle cx="48" cy="0" r="2"/><circle cx="0" cy="48" r="2"/><circle cx="48" cy="48" r="2"/></g>`;
  note('moon-gate', svgDoc('open/moon-gate/lattice-tile.svg', 'moon-gate: song cửa gỗ (mask tile 48×48, tô --op-wood-line). Ghép mask với radial-gradient để chừa lỗ cửa trăng', '0 0 48 48', s));
  // sen dưới cửa trăng: hoa nở + nụ + 2 lá (fill) và nét gân
  const fill = [], line = [];
  const petal = (len, w) => leafPath(len, [[0, 0], [0.3, w * 0.8], [0.62, w], [0.9, w * 0.45], [1, 0]]);
  [[-62, 0.78], [-34, 0.92], [-10, 1], [10, 1], [34, 0.92], [62, 0.78], [0, 1.06]].forEach(([a, k], i) => {
    fill.push(M(petal(46 * k, 13 * k), `transform="${tr(110, 96, a)}"${i === 6 ? '' : ' fill-opacity=".85"'}`));
    line.push(M(`M0 -4V${f1(-40 * k)}`, `transform="${tr(110, 96, a)}" fill="none" stroke="#000" stroke-width=".9"`));
  });
  fill.push(M(petal(26, 8), `transform="${tr(176, 110, 18)}"`));
  // lá sen nhìn nghiêng (elip có khía)
  fill.push(M('M10 128C10 112 44 104 70 110L58 122 76 118C78 126 62 136 40 136 22 136 10 134 10 128Z', 'fill-opacity=".9"'));
  fill.push(M('M210 132C210 116 176 108 150 114L162 126 144 122C142 130 158 140 180 140 198 140 210 138 210 132Z', 'fill-opacity=".9"'));
  line.push(M('M110 96V150M176 110 172 150', 'fill="none" stroke="#000" stroke-width="1.6"'));
  note('moon-gate', svgDoc('open/moon-gate/lotus-fill.svg', 'moon-gate: sen dưới cửa trăng 220×150 - KHỐI (mask, tô --op-lotus = --c-accent của sen-cham)', '0 0 220 150', fill.join('')));
  note('moon-gate', svgDoc('open/moon-gate/lotus-line.svg', 'moon-gate: sen - NÉT gân + cuống (mask, tô --c-primary, opacity .6)', '0 0 220 150', line.join('')));
}

// ---------------------------------------------------------------- book (mask: khung bìa + giấy lót)
{
  const W = 300, H = 420;
  let s = M(`M12 12H${W - 12}V${H - 12}H12Z M15 15H${W - 15}V${H - 15}H15Z`, 'fill-rule="evenodd"');
  s += M(`M24 24H${W - 24}V${H - 24}H24Z`, 'fill="none" stroke="#000" stroke-width=".8"');
  const fleuron = (x, y, a) => `<g transform="${tr(x, y, a)}">${M('M0 0C10 0 16 6 16 16C10 12 4 10 0 0Z M0 0C0 10 6 16 16 16C12 10 10 4 0 0Z', 'fill-opacity=".9"')}<circle cx="20" cy="20" r="2"/></g>`;
  s += fleuron(24, 24, 0) + fleuron(W - 24, 24, 90) + fleuron(W - 24, H - 24, 180) + fleuron(24, H - 24, 270);
  // vòng monogram giữa (r 44) + 2 nhánh lá
  s += M(`M${W / 2 - 44} ${H / 2 - 20}a44 44 0 1 0 88 0a44 44 0 1 0-88 0Z M${W / 2 - 41} ${H / 2 - 20}a41 41 0 1 0 82 0a41 41 0 1 0-82 0Z`, 'fill-rule="evenodd"');
  const sprig = (dir) => { let o = M(`M${W / 2 + dir * 48} ${H / 2 - 20}H${W / 2 + dir * 110}`, 'fill="none" stroke="#000" stroke-width="1"'); for (let i = 0; i < 4; i++) { const x = W / 2 + dir * (58 + i * 14); o += M('M0 0C2-3 6-3.4 9-1.6 6 1.4 2 2 0 0Z', `transform="${tr(x, H / 2 - 20, dir > 0 ? -30 : 210)}"`) + M('M0 0C2-3 6-3.4 9-1.6 6 1.4 2 2 0 0Z', `transform="${tr(x + dir * 6, H / 2 - 20, dir > 0 ? 30 : 150)}"`); } return o; };
  s += sprig(1) + sprig(-1);
  // dải tiêu đề dưới (chỗ chữ "Thiệp mời")
  s += M(`M90 ${H - 96}H210M100 ${H - 60}H200`, 'fill="none" stroke="#000" stroke-width=".8"') + `<circle cx="${W / 2}" cy="${H - 60}" r="2"/>`;
  note('book', svgDoc('open/book/cover-frame.svg', 'book: khung bìa 300×420 (mask, tô --c-accent). Vòng giữa (cx150 cy190 r41) chứa monogram text HTML; dải y 324–360 chứa chữ "Thiệp mời"', `0 0 ${W} ${H}`, s));
  note('book', svgDoc('open/book/endpaper.svg', 'book: giấy lót mặt trong bìa (mask tile 40×40, tô --c-accent opacity .22)', '0 0 40 40',
    M('M20 4 24 20 20 36 16 20Z M4 20 20 16 36 20 20 24Z', 'fill-opacity=".8"') + `<circle cx="0" cy="0" r="3"/><circle cx="40" cy="0" r="3"/><circle cx="0" cy="40" r="3"/><circle cx="40" cy="40" r="3"/>`));
}

// ---------------------------------------------------------------- ink-spread (mask: vệt mực lõi + vành sắc tố + giọt bắn)
{
  const C = 200;
  const mk = (seed, R) => {
    const q = rng(seed); const pts = [];
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 0.84 + q() * 0.16 + (i % 7 === 3 ? 0.12 : 0);
      pts.push([C + Math.cos(a) * R * k, C + Math.sin(a) * R * k]);
    }
    return pts;
  };
  const outer = mk(77, 172);
  const inner = outer.map(([x, y]) => [C + (x - C) * 0.93, C + (y - C) * 0.93]);
  const drops = [];
  const q = rng(78);
  for (let i = 0; i < 11; i++) { const a = q() * 360; const [x, y] = polar(C, C, 184 + q() * 12, a); drops.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2 + q() * 4)}"/>`); }
  note('ink-spread', svgDoc('open/ink-spread/blob-core.svg', 'ink-spread: lõi vệt loang 400×400 (mask, tô --c-bg của landing -> trông như khoét lỗ). Tâm (200,200) đặt tại điểm chạm', '0 0 400 400', M(smoothClosed(outer)) + drops.join('')));
  const gran = [];
  for (let i = 0; i < 70; i++) { const t = q(); const j = Math.floor(t * outer.length); const [x, y] = outer[j]; const k = 0.9 + q() * 0.08; gran.push(`<circle cx="${f1(C + (x - C) * k)}" cy="${f1(C + (y - C) * k)}" r="${f1(0.6 + q() * 1.4)}" fill-opacity="${f1(0.3 + q() * 0.5)}"/>`); }
  note('ink-spread', svgDoc('open/ink-spread/blob-rim.svg', 'ink-spread: vành sắc tố đọng mép (mask, tô --c-accent opacity .55; theme muc-giay tô --c-text .35)', '0 0 400 400',
    M(smoothClosed(outer) + smoothClosed([...inner].reverse()), 'fill-rule="evenodd"') + gran.join('') + drops.join('')));
}

// ---------------------------------------------------------------- polaroid (mask: mặt sau giấy ảnh + băng dính washi)
{
  let s = '';
  for (let y = 26; y < 200; y += 14) s += M(`M18 ${y}H182`, 'fill="none" stroke="#000" stroke-width=".6" stroke-dasharray="2 3"');
  s += M('M150 14H186V48H150Z', 'fill="none" stroke="#000" stroke-width=".8" stroke-dasharray="2 2"');
  note('polaroid', svgDoc('open/polaroid/back-print.svg', 'polaroid: mặt sau giấy ảnh 200×240 (mask, tô --c-muted opacity .18): dòng kẻ chấm + ô tem. Chữ "Kính gửi …" là text HTML đè lên', '0 0 200 240', s));
  const q = rng(5);
  let top = 'M0 4'; for (let x = 6; x <= 84; x += 6) top += `L${x} ${f1(1 + q() * 4)}`;
  let bot = ''; for (let x = 84; x >= 0; x -= 6) bot += `L${x} ${f1(26 - q() * 4)}`;
  const tapeD = top + bot + 'Z';
  let stripes = ''; for (let x = -20; x < 100; x += 10) stripes += `M${x} 30L${x + 18} 0`;
  note('polaroid', svgDoc('open/polaroid/tape.svg', 'polaroid: băng dính washi 84×30 mép xé (mask, tô --c-accent-2 opacity .7); sọc chéo alpha .55', '0 0 84 30',
    `<clipPath id="tp"><path d="${tapeD}"/></clipPath><path d="${tapeD}" fill-opacity=".8"/><path clip-path="url(#tp)" d="${stripes}" fill="none" stroke="#000" stroke-width="3.5" stroke-opacity=".25"/>`));
}

// ---------------------------------------------------------------- tổng kết
console.log('\n# gzip phần path nhúng TS (inline):', JSON.stringify(inlineBudget));
const tot = {};
for (const [id, list] of Object.entries(sizes)) tot[id] = { files: list.length, raw: list.reduce((s, x) => s + x.raw, 0), gz: list.reduce((s, x) => s + x.gz, 0) };
console.log('# tổng theo kiểu:', JSON.stringify(tot));
