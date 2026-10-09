/**
 * Mẫu `minimal`: giấy phẳng, nắp chữ nhật thấp (38%), 1 đường kẻ mảnh, sticker tròn 28px chữ cái đầu thay seal,
 * dòng địa chỉ kiểu tem nhãn. Pha mở: sticker bóc từ góc rotate(-25deg) translate(8px,-6px) + mờ 220ms; nắp 380ms.
 */
import { h } from '../../dom';
import { path, shell, type EnvelopeSkin } from './kit';

export const skin: EnvelopeSkin = {
  build(p, o) {
    shell(p, 'minimal', o, { front: [path('M24 206H316', 'el-l')] });
    const initial = (o.monogram.trim().match(/\p{L}/u)?.[0] ?? '♡').toLocaleUpperCase('vi-VN');
    p.seal.append(h('span', { class: 'mn-sticker' }, initial));
  },
  unlock(p, light) {
    if (light) return { steps: [{ el: p.seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 120 }], flapAt: 0 };
    return { steps: [{ el: p.seal, frames: [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-25deg) translate(8px,-6px)', opacity: 0 }], start: 0, dur: 220 }], flapAt: 160, flapDur: 380 };
  },
  // E12: 10 chấm sticker (7 đặc + 3 vòng) toả ngắn rồi dừng nhanh (bán kính ≤ 50px), không rơi
  rich: () => [
    { at: 40, count: 7, shapes: [[{ r: 8, fill: 'c1' }]], size: [4, 8], speed: [90, 200], gravity: 0, drag: 4, life: [500, 650] },
    { at: 40, count: 3, shapes: [[{ r: 7, stroke: 'c2', lw: 2.4 }]], size: [6, 8], speed: [90, 200], gravity: 0, drag: 4, life: [500, 650] },
  ],
};
