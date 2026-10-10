/** Capability bật bởi đợt v4a-2c (16 loại hạt + burst, solution-v4a-2bc.md mục 2). Chỉ đợt này sửa file này; thêm id khi module đạt tiêu chí. */
import type { CapsAddon } from './types.ts';

export const CAPS_V4A_2C: CapsAddon = {
  // 16 module `src/guest/effects/particles/types/<id>.ts` (≤ 1.5 KB gz/loại, design-v4a-2bc §4.2)
  particle: [
    'petal-sakura', 'petal-lotus', 'petal-dried', 'petal-watercolor', 'plumeria', 'paper-heart', 'leaf-green', 'leaf-eucalyptus',
    'leaf-maple', 'pampas', 'snow', 'bubble', 'sparkle', 'ink-dot', 'dust-mote', 'red-paper',
  ],
  // burst "Sau khi mở" (`src/guest/effects/burst/<id>.ts`); `heart-burst` không thuộc enum (lời chúc, v3)
  burstOnOpen: ['confetti', 'gold', 'red-paper'],
};
