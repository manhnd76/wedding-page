import { rng, f, pt, smoothOpen, svgDoc } from './lib.mjs';

const noise = (id, freq, oct, rgb, seed = 1, type = 'fractalNoise', alphaSlope = 1, alphaInt = 0) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="${type}" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" stitchTiles="stitch"/>` +
  `<feColorMatrix values="0 0 0 0 ${rgb[0]} 0 0 0 0 ${rgb[1]} 0 0 0 0 ${rgb[2]} 0 0 0 ${alphaSlope} ${alphaInt}"/></filter>`;
const doc = (name, comment, w, h, inner) => svgDoc(`textures/${name}.svg`, comment, `0 0 ${w} ${h}`, inner, 10240);

// grain-fine: noise rất mịn (Mực & Giấy, Pastel Hàn)
doc('grain-fine', 'Texture grain-fine: noise rất mịn, tile 128. CSS opacity .035 (sáng) / .05 (tối, đảo màu).', 128, 128,
  noise('n', '1.15', 1, [0.1, 0.1, 0.1], 3) + '<rect width="128" height="128" filter="url(#n)"/>');

// paper-aged: noise giấy + vết ố (foxing) tần số thấp đã nâng ngưỡng; viền tối do CSS gradient
doc('paper-aged', 'Texture paper-aged: noise giấy + vết ố nâu tần số thấp (ngưỡng hoá), tile 240. CSS opacity .07 + gradient tối 2 mép trái/phải.', 240, 240,
  noise('n', '.85', 2, [0.25, 0.17, 0.08], 5) +
  '<filter id="o" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="11" stitchTiles="stitch"/>' +
  '<feColorMatrix values="0 0 0 0 .42 0 0 0 0 .26 0 0 0 0 .08 0 0 0 -3.2 1.9"/><feComponentTransfer><feFuncA type="linear" slope=".9"/></feComponentTransfer></filter>' +
  '<rect width="240" height="240" filter="url(#n)"/><rect width="240" height="240" filter="url(#o)"/>');

// linen: sợi dọc + sợi ngang bằng noise dị hướng (tránh moiré của repeating-linear-gradient 1px trên màn DPR cao)
doc('linen', 'Texture linen: 2 lớp noise dị hướng (sợi ngang + sợi dọc), tile 160. CSS opacity .06. Thay cho 2 lớp repeating-linear-gradient 1px (dễ moiré ở DPR 2.6-3).', 160, 160,
  noise('h', '.012 .9', 2, [0.15, 0.15, 0.12], 2) + noise('v', '.9 .012', 2, [0.15, 0.15, 0.12], 4) +
  '<rect width="160" height="160" filter="url(#h)"/><rect width="160" height="160" filter="url(#v)" opacity=".8"/>');

// kraft: noise thô + sợi ngắn nâu
{
  const r = rng(99); let fib = '';
  for (let i = 0; i < 70; i++) { const x = r() * 200, y = r() * 200, a = r() * Math.PI, L = 3 + r() * 7; fib += `M${pt(x, y)}l${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`; }
  doc('kraft', 'Texture kraft: noise thô nâu + 70 sợi ngắn ngẫu nhiên (seed cố định), tile 200. CSS opacity .1. Nên dùng cùng bg ngả nâu của theme.', 200, 200,
    noise('n', '.6', 3, [0.36, 0.22, 0.1], 8) + '<rect width="200" height="200" filter="url(#n)"/>' +
    `<path d="${fib}" fill="none" stroke="#5c3a1c" stroke-width=".6" stroke-linecap="round" opacity=".55"/>`);
}

// rice-paper (giấy dó): noise mịn + 30 sợi dài cong, sợi chạm mép được vẽ lặp ở mép đối diện để tile liền
{
  const W = 400, r = rng(2024); let fib = '';
  for (let i = 0; i < 30; i++) {
    const x = r() * W, y = r() * W, a = r() * Math.PI * 2, L = 40 + r() * 90, bend = (r() - 0.5) * 0.9; const pts = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5, ang = a + bend * t; pts.push([x + Math.cos(ang) * L * t, y + Math.sin(ang) * L * t]); }
    const d = smoothOpen(pts).replace(/(\d+\.\d)\d/g, '$1'); fib += `<path d="${d}"/>`;
    const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
    for (const [dx, dy] of [[minX < 0 ? W : maxX > W ? -W : 0, 0], [0, minY < 0 ? W : maxY > W ? -W : 0]]) if (dx || dy) fib += `<path d="${d}" transform="translate(${dx} ${dy})"/>`;
  }
  doc('rice-paper', 'Texture rice-paper (giấy dó): noise mịn + 30 sợi dài cong (tile 400, sợi tràn mép được lặp nên tile liền). CSS opacity .08.', W, W,
    noise('n', '1', 2, [0.2, 0.18, 0.14], 6) + `<rect width="${W}" height="${W}" filter="url(#n)"/>` +
    `<g fill="none" stroke="#4a3f30" stroke-width=".7" stroke-linecap="round" opacity=".6">${fib}</g>`);
}

// sand: noise thô + hạt thưa (ngưỡng cao)
doc('sand', 'Texture sand: noise thô ấm + hạt cát thưa (turbulence ngưỡng cao), tile 200. CSS opacity .07.', 200, 200,
  noise('n', '.7', 2, [0.4, 0.3, 0.18], 12) +
  '<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="31" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .22 0 0 0 0 .12 0 0 0 -9 5.2"/></filter>' +
  '<rect width="200" height="200" filter="url(#n)"/><rect width="200" height="200" filter="url(#g)"/>');

// watercolor-wash: một vệt loang dùng làm MASK (tô màu bằng background-color = accent / accent-2)
doc('watercolor-wash', 'Texture watercolor-wash: vệt màu nước dùng làm mask-image (alpha). Viền đậm hơn lòng (sắc tố đọng mép) + hạt. Màu do CSS background-color (accent / accent-2). Không ảnh WebP.', 520, 520,
  '<filter id="w" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">' +
  '<feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="7" result="t"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="t" scale="90" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
  '<feGaussianBlur in="d" stdDeviation="3" result="b"/>' +
  '<feMorphology in="b" operator="erode" radius="5" result="e"/>' +
  '<feComposite in="b" in2="e" operator="out" result="edge"/>' +
  '<feComponentTransfer in="b" result="body"><feFuncA type="linear" slope=".42"/></feComponentTransfer>' +
  '<feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="3" result="g"/>' +
  '<feColorMatrix in="g" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.9 1.25" result="ga"/>' +
  '<feMerge result="m"><feMergeNode in="body"/><feMergeNode in="edge"/></feMerge>' +
  '<feComposite in="m" in2="ga" operator="in"/></filter>' +
  '<g filter="url(#w)"><ellipse cx="300" cy="215" rx="185" ry="140"/><ellipse cx="190" cy="300" rx="120" ry="95"/><circle cx="395" cy="120" r="55"/></g>');
