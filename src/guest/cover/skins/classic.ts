/** Mẫu `classic` ★ (design-review-v1 3.2): giấy ngà, nắp nhọn, lót sọc chéo accent, dấu sáp monogram tách đôi. */
import { path, sealSplit, shell, waxSeal, type EnvelopeSkin } from './kit';

export const skin: EnvelopeSkin = {
  build(p, o) {
    shell(p, 'classic', o, { flap: [path('M12 .5 170 123 328 .5', 'el-l')] });
    waxSeal(p, o);
  },
  unlock: (p, light) => ({ steps: sealSplit(p, light), flapAt: light ? 0 : 180 }),
};
