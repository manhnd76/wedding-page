/**
 * Bảng gói reveal + bộ hài hoà (design 5.8, design-v4a-2a 2.4). File nhỏ, tách khỏi `reveal-plan.ts`: resolver
 * (bundle admin ban đầu) và engine guest chỉ cần phần này; `reveal-plan.ts` re-export lại.
 */
import type { RevealAtom, RevealStyle } from './config/enums.ts';

export type RevealRole = 'heading' | 'block' | 'image' | 'ornament';
export interface RevealPack { heading: RevealAtom; block: RevealAtom; image: RevealAtom; ornament: RevealAtom; stagger: number }

/** Bảng gói reveal (design 5.8). */
export const REVEAL_PACKS: Record<RevealStyle, RevealPack> = {
  soft: { heading: 'fade-up', block: 'fade-up', image: 'photo-settle', ornament: 'svg-draw', stagger: 80 },
  editorial: { heading: 'mask-up', block: 'fade', image: 'wipe', ornament: 'svg-draw', stagger: 90 },
  letter: { heading: 'split-chars', block: 'fade', image: 'zoom-in', ornament: 'svg-draw', stagger: 60 },
  gentle: { heading: 'fade', block: 'fade', image: 'fade', ornament: 'none', stagger: 60 },
  playful: { heading: 'split-words', block: 'zoom-in', image: 'rise-tilt', ornament: 'svg-draw', stagger: 100 },
  cinematic: { heading: 'blur-in', block: 'fade-up', image: 'photo-settle', ornament: 'svg-draw', stagger: 120 },
};

/** Bộ hài hoà: gói chính -> 2 gói đồng hành (design 2.4). */
export const REVEAL_HARMONY: Record<RevealStyle, readonly [RevealStyle, RevealStyle]> = {
  soft: ['editorial', 'letter'],
  editorial: ['letter', 'soft'],
  letter: ['editorial', 'soft'],
  gentle: ['soft', 'editorial'],
  playful: ['soft', 'letter'],
  cinematic: ['editorial', 'letter'],
};

/** [A, ...đồng hành] chỉ giữ gói đã hỗ trợ (A luôn có, kể cả khi không nằm trong `supported`). */
export function revealHarmony(main: RevealStyle, supported: readonly string[]): RevealStyle[] {
  return [main, ...REVEAL_HARMONY[main].filter((p) => supported.includes(p))];
}
