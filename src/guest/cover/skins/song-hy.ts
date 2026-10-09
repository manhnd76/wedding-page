/**
 * Mẫu `song-hy`: đỏ son, viền chỉ vàng kép, mây cát tường chìm, nắp vát tù; huy hiệu tròn vàng có chữ 囍 (vẽ hình học).
 * Pha mở: huy hiệu xoay rotateY 0→90° rồi biến mất (200ms) + vệt sáng quét qua viền vàng (300ms).
 */
import { envelopeGeom } from '@shared/envelope';
import { svg } from '../../dom';
import { path, sheen, shell, type EnvelopeSkin } from './kit';

const CLOUD = 'M3 17H37C40 17 40 12 36.5 12C37 7 31 5.5 28.5 9C27.5 3 19 2 17.5 8C15 5 9.5 6.5 10.5 11C6.5 10 3.5 13 5 15.5';
const SONGHY = 'M6 7h72M21 2v13M63 2v13M11 15h20M53 15h20M12 20h18v9H12zM54 20h18v9H54zM14 34l2.5 4M28 34l-2.5 4M56 34l2.5 4M70 34l-2.5 4M3 42h78M12 47h18v13H12zM54 47h18v13H54z';

export const skin: EnvelopeSkin = {
  build(p, o) {
    const cid = `sh-${o.uid}`;
    const g = envelopeGeom('song-hy');
    const clip = { 'clip-path': `url(#${cid})` };
    const cloud = (x: number, y: number, k: number) => path(CLOUD, 'sh-cloud', { transform: `translate(${x} ${y}) scale(${k})` });
    shell(p, 'song-hy', o, {
      front: [
        svg('defs', {}, svg('clipPath', { id: cid }, path(g.pocket, ''))),
        cloud(30, 150, 2.2), cloud(220, 172, 2), cloud(130, 96, 1.6),
        svg('rect', { x: 7, y: 7, width: 326, height: 224, rx: 3, class: 'sh-b', ...clip }),
        svg('rect', { x: 11.5, y: 11.5, width: 317, height: 215, rx: 2, class: 'sh-b sh-b2', ...clip }),
      ],
      flap: [path('M10 .5 170 40 330 .5', 'el-l')],
    });
    // huy hiệu tròn vàng + song hỷ (symbol `songhy` của bộ traditional, nét vuông, không cần font CJK)
    p.seal.append(svg('svg', { viewBox: '-32 -32 64 64', class: 'seal-art sh-badge', 'aria-hidden': 'true', focusable: 'false' },
      svg('circle', { r: 27, class: 'sh-gold' }), svg('circle', { r: 23.5, class: 'sh-ring' }),
      svg('g', { transform: 'translate(-16.8 -12.8) scale(.4)' }, path(SONGHY, 'sh-hy'))));
  },
  unlock(p, light) {
    if (light) return { steps: [{ el: p.seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 120 }], flapAt: 0 };
    return {
      steps: [
        { el: p.seal, frames: [{ transform: 'perspective(300px) rotateY(0deg)', opacity: 1 }, { transform: 'perspective(300px) rotateY(90deg)', opacity: 0 }], start: 0, dur: 200 },
        sheen(p, 40, 300),
      ],
      flapAt: 200,
    };
  },
  // E12: 24 xác pháo đỏ bung quạt lên từ huy hiệu 囍 + 8 sao vàng (red-paper của v4a-2c khi có, hiện = cánh hoa nhuộm đỏ)
  rich: () => [
    { at: 60, count: 24, kind: ['red-paper', 'petal-rose'], colors: ['#C8231F', '#E0392B'], size: [7, 11], angle: [-160, -20], speed: [180, 420], gravity: 520, drag: 1.6, life: [1100, 1400], spin: 4 },
    { at: 60, count: 8, kind: ['gold-dust'], colors: ['#E8C46A', '#FFF4D6'], size: [4, 7], speed: [60, 160], gravity: 40, drag: 2.4, life: [700, 900] },
  ],
};
