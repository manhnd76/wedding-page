import { readFileSync } from 'node:fs';
import { P, C, G, STROKE, mirrorX, leaf, rng, f, pt, sprite, svgDoc } from './lib.mjs';

const S = (inner, w = 1) => G(inner, STROKE(w));
const one = (name, comment, inner) => sprite(`dividers/${name}.svg`, comment, [['divider', '0 0 160 24', inner]], 4096);
const symOf = (file, id) => readFileSync(`E:/claudecode/wedding-page/src/guest/theme-assets/ornaments/${file}.svg`, 'utf8').match(new RegExp(`<symbol id="${id}" viewBox="[^"]+">([\\s\\S]*?)</symbol>`))[1];

// leaf-branch: một cành liền xuyên qua, lá so le, nụ tròn ở giữa (Hồng Phấn)
{
  const lv = [[20, 12.6, -35], [28, 12.9, 28], [38, 12.4, -32], [47, 11.4, 30], [57, 10.6, -28], [66, 10.6, 24]];
  const half = lv.map(([x, y, a]) => leaf(x, y, a, 0.85)).join('');
  one('leaf-branch', 'Divider leaf-branch: cành lá liền, lá so le, nụ tròn ở giữa. Tự vẽ (ui-ux-designer v4a-1).',
    S(P('M10 13C30 13.5 50 9.5 74 11.4M86 11.4C110 9.5 130 13.5 150 13') + half + mirrorX(half, 160) + C(80, 11.6, 3.2) + C(80, 11.6, 5.6, 'opacity=".45"')) + G(C(80, 11.6, 1.2) + C(8, 13, 1) + C(152, 13, 1), 'fill="currentColor"'));
}
// double-line: 2 đường mảnh song song, thoi ở giữa (Lục Bảo, Hoài Cổ)
one('double-line', 'Divider double-line: hai đường mảnh song song, hình thoi rỗng + thoi đặc ở giữa. Tự vẽ (ui-ux-designer v4a-1).',
  S(P('M10 10.5H68M10 13.5H68M92 10.5h58M92 13.5h58') + P('M80 5 87 12 80 19 73 12Z')) + G(P('M80 9.5 82.5 12 80 14.5 77.5 12Z'), 'fill="currentColor"'));
// cloud / deco-fan: tách khỏi bộ ornament để trộn được với bộ khác (nội dung = symbol divider của traditional / luxe)
one('cloud', 'Divider cloud (mây cát tường), tách độc lập từ ornament traditional#divider để dùng với bộ họa tiết bất kỳ.', symOf('traditional', 'divider'));
one('deco-fan', 'Divider deco-fan (quạt art-deco), tách độc lập từ ornament luxe#divider để dùng với bộ họa tiết bất kỳ.', symOf('luxe', 'divider'));
// lotus: hoa sen + mặt nước + gợn
{
  const k = (a, b) => pt(80 + a, 19.5 - b);
  const lotus = P(`M${k(0, 0)}C${k(4, 4)} ${k(4, 10)} ${k(0, 14)}C${k(-4, 10)} ${k(-4, 4)} ${k(0, 0)}Z`) +
    [1, -1].map((m) => P(`M${k(0, 0)}C${k(-3 * m, 3)} ${k(-7 * m, 7)} ${k(-9 * m, 11)}C${k(-9.5 * m, 6)} ${k(-6 * m, 1.5)} ${k(0, 0)}Z`) + P(`M${k(0, 0)}C${k(-6 * m, 0.5)} ${k(-11 * m, 3)} ${k(-13 * m, 6.5)}C${k(-9 * m, 7)} ${k(-4 * m, 4.5)} ${k(0, 0)}`)).join('');
  const side = P('M8 19.5H62') + P('M26 16.5q4-2.6 8 0M40 16.5q4-2.6 8 0M14 22.5q3-2 6 0', 'opacity=".5"');
  one('lotus', 'Divider lotus: hoa sen trên mặt nước, gợn sóng hai bên. Tự vẽ (ui-ux-designer v4a-1).', S(lotus + side + mirrorX(side, 160)));
}
// dots: 3 chấm
one('dots', 'Divider dots: ba chấm, chấm giữa lớn hơn. Tự vẽ (ui-ux-designer v4a-1).', G(C(68, 12, 1.6) + C(80, 12, 2.2) + C(92, 12, 1.6), 'fill="currentColor"'));
// brush-stroke: vệt cọ khô thon hai đầu, có khe xước (evenodd)
{
  const r = rng(42); const N = 28; const top = [], bot = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = 14 + 132 * u; const th = 4.6 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.55) + 0.3; const c = 12 + 1.4 * Math.sin(u * 5.2);
    top.push([x, c - th * (0.85 + r() * 0.3)]); bot.push([x, c + th * (0.85 + r() * 0.3)]);
  }
  let d = `M${pt(...top[0])}` + top.slice(1).map((p) => `L${pt(...p)}`).join('') + bot.reverse().map((p) => `L${pt(...p)}`).join('') + 'Z';
  // khe xước khô (lỗ thủng mảnh)
  for (const [x0, x1, y] of [[70, 118, 11.2], [96, 140, 13.4], [40, 74, 12.6]]) d += `M${f(x0)} ${f(y)}Q${f((x0 + x1) / 2)} ${f(y - 0.6)} ${f(x1)} ${f(y + 0.2)}Q${f((x0 + x1) / 2)} ${f(y + 0.2)} ${f(x0)} ${f(y)}Z`;
  one('brush-stroke', 'Divider brush-stroke: vệt cọ khô thon hai đầu, khe xước bằng evenodd. Tô currentColor, CSS nên đặt opacity .75. Tự vẽ (ui-ux-designer v4a-1).',
    `<path d="${d}" fill="currentColor" fill-rule="evenodd"/>`);
}
// wave-ocean: sóng 2 lớp + bọt
{
  const w1 = 'M8 15' + 'q6-4.2 12 0t12 0'.repeat(1) + 't12 0'.repeat(10);
  const w2 = 'M14 10.5q6-3 12 0' + 't12 0'.repeat(10);
  one('wave-ocean', 'Divider wave-ocean: hai lớp sóng (lớp sau mờ), bọt sóng chấm. Tự vẽ (ui-ux-designer v4a-1).',
    S(P(w1, 'stroke-width="1.2"') + P(w2, 'opacity=".5"')) + G(C(80, 5.5, 1) + C(56, 6.2, 0.7) + C(104, 6.2, 0.7), 'fill="currentColor" opacity=".7"'));
}
// torn-paper: KHÔNG phải symbol giữa trang mà là mép giấy xé chạy hết chiều ngang -> ảnh mask lặp theo trục x
{
  const r = rng(7); const W = 240;
  const edge = (yMin, yMax, step) => { const pts = []; for (let x = 0; x <= W; x += step) pts.push([x, x === 0 || x >= W ? (yMin + yMax) / 2 : yMin + r() * (yMax - yMin)]); return pts; };
  const e1 = edge(2, 9, 6), e2 = edge(7, 13, 4);
  const poly = (pts) => `M0 20L${pts.map((p) => pt(...p)).join('L')}L${W} 20Z`;
  svgDoc('dividers/torn-paper.svg', 'Divider torn-paper: tile mask 240x20 lặp ngang (mask-repeat: repeat-x). Lớp 1 alpha .55 = xơ giấy, lớp 2 đặc = thân giấy. Hai đầu cùng cao độ nên nối liền. Tự vẽ (ui-ux-designer v4a-1).',
    '0 0 240 20', `<path d="${poly(e1)}" fill="#000" fill-opacity=".55"/><path d="${poly(e2)}" fill="#000"/>`, 4096, ' preserveAspectRatio="none"');
}
