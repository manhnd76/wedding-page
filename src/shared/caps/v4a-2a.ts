/** Capability bật bởi đợt v4a-2a (B1 reveal theo section, design-v4a-2a.md Phụ lục A). Chỉ đợt này sửa file này; thêm id khi module đạt tiêu chí. */
import type { CapsAddon } from './types.ts';

export const CAPS_V4A_2A: CapsAddon = {
  // nguyên tử: engine `src/guest/effects/reveal.ts` + `reveal/*` (mask-up/wipe/blur-in trong entry; split-*, parallax-layers lười)
  revealAtom: ['mask-up', 'wipe', 'blur-in', 'split-words', 'split-chars', 'parallax-layers'],
  // 4 gói (bảng `REVEAL_PACKS` trong `src/shared/reveal-packs.ts`, re-export qua `reveal-plan.ts`)
  revealStyle: ['editorial', 'letter', 'playful', 'cinematic'],
  // đếm ngược: `slide` trong `sections/countdown.ts`, `odometer` chunk lười `effects/micro/odometer.ts`
  countdownStyle: ['slide', 'odometer'],
};
