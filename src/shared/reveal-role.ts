/**
 * Ưu tiên nguyên tử theo vai trò trong 1 section (solution-v4a-2a.md 2.2) - chỉ engine guest dùng (entry);
 * `reveal-plan.ts` re-export lại.
 */
import type { RevealAtom, RevealStyle } from './config/enums.ts';
import { REVEAL_PACKS, type RevealRole } from './reveal-packs.ts';

export type PlanSrc = 'pinned' | 'main' | 'auto';
export interface PlanEntry { pack: RevealStyle; src: PlanSrc }

/**
 * Nguyên tử theo vai trò trước hạ cấp (solution 2.2): ghim (trọn gói) > ghi đè vai trò cấp trang >
 * gói tự động (chỉ heading/image) > gói chính. `from` = gói nguồn (`data-rvk`) hoặc 'override'.
 */
export function roleAtom(entry: PlanEntry | undefined, role: RevealRole, main: RevealStyle, overrides: Readonly<Record<RevealRole, RevealAtom | null>>):
  { atom: RevealAtom; from: RevealStyle | 'override' } {
  if (entry?.src === 'pinned') return { atom: REVEAL_PACKS[entry.pack][role], from: entry.pack };
  const ov = overrides[role];
  if (ov) return { atom: ov, from: 'override' };
  if (entry?.src === 'auto' && (role === 'heading' || role === 'image')) return { atom: REVEAL_PACKS[entry.pack][role], from: entry.pack };
  return { atom: REVEAL_PACKS[main][role], from: main };
}

/** Stagger của section: gói ghim hoặc gói chính. */
export function sectionStagger(entry: PlanEntry | undefined, main: RevealStyle): number {
  return REVEAL_PACKS[entry?.src === 'pinned' ? entry.pack : main].stagger;
}
