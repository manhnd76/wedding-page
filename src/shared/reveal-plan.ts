/**
 * B1 reveal theo section (design-v4a-2a.md §2, solution-v4a-2a.md mục 2): bảng gói, phân loại section, bộ hài hoà,
 * thuật toán "xen kẽ tự động" và thứ tự ưu tiên theo vai trò. Thuần, tất định.
 * Plan tính 1 lần từ config (`planOf`, cùng `planSections` với admin): plugin build inline vào `#wp-resolved`
 * (`reveal.plan`), preview/fallback tính ở nhánh resolve lười của guest -> entry guest chỉ cần `roleAtom`/`sectionStagger`.
 */
import type { RevealMode, RevealStyle, SectionType } from './config/enums.ts';
import type { WeddingConfig } from './config/types.ts';
import { planSections } from './sections/meta.ts';

export { REVEAL_HARMONY, REVEAL_PACKS, revealHarmony, type RevealPack, type RevealRole } from './reveal-packs.ts';
// `roleAtom`/`sectionStagger` ở `reveal-role.ts` (chỉ engine guest); KHÔNG re-export giá trị ở đây để admin (khối reveal,
// route lười) không kéo `reveal-role` thành chunk dùng chung với entry guest
export type { PlanEntry, PlanSrc } from './reveal-role.ts';
import type { PlanEntry } from './reveal-role.ts';

export type RevealTier = 'opening' | 'expressive' | 'functional';

/** Phân loại section (design 2.3). */
export const REVEAL_TIER: Record<SectionType, RevealTier> = {
  hero: 'opening',
  couple: 'expressive', families: 'expressive', announcement: 'expressive', loveStory: 'expressive', album: 'expressive', thankyou: 'expressive',
  events: 'functional', countdown: 'functional', timeline: 'functional', gift: 'functional', guestbook: 'functional', rsvp: 'functional', footer: 'functional',
};

/** Thứ tự ưu tiên gói của từng section expressive (design 2.3). */
export const REVEAL_AFFINITY: Partial<Record<SectionType, readonly RevealStyle[]>> = {
  couple: ['letter', 'playful', 'editorial', 'soft', 'cinematic', 'gentle'],
  families: ['editorial', 'soft', 'gentle', 'letter', 'cinematic', 'playful'],
  announcement: ['editorial', 'letter', 'cinematic', 'soft', 'gentle', 'playful'],
  loveStory: ['playful', 'letter', 'soft', 'cinematic', 'editorial', 'gentle'],
  album: ['editorial', 'playful', 'cinematic', 'soft', 'letter', 'gentle'],
  thankyou: ['cinematic', 'letter', 'editorial', 'soft', 'gentle', 'playful'],
};

export interface PlanInput {
  main: RevealStyle;
  mode: RevealMode;
  pins: Readonly<Record<string, RevealStyle>>;
  harmony: readonly RevealStyle[];
}

/**
 * Gói hiệu lực của từng section (design 2.4). Không có 2 section expressive liền kề (bỏ qua functional) cùng gói
 * khi chạy tự động; hero và phần functional luôn A (trừ khi ghim); section ghim vẫn tính vào "gói trước".
 */
export function revealPlan(secs: readonly { id: string; type: SectionType }[], inp: PlanInput): Record<string, PlanEntry> {
  const out: Record<string, PlanEntry> = {};
  const A = inp.main;
  let prev: RevealStyle | null = null;
  for (const s of secs) {
    const tier = REVEAL_TIER[s.type];
    const pin = Object.prototype.hasOwnProperty.call(inp.pins, s.id) ? inp.pins[s.id] : undefined;
    let e: PlanEntry;
    if (pin) e = { pack: pin, src: 'pinned' };
    else if (inp.mode === 'uniform' || tier !== 'expressive') e = { pack: A, src: 'main' };
    else {
      const cands = (REVEAL_AFFINITY[s.type] ?? []).filter((p) => inp.harmony.includes(p));
      e = { pack: cands.find((p) => p !== prev) ?? A, src: 'auto' };
    }
    if (tier === 'expressive') prev = e.pack;
    out[s.id] = e;
  }
  return out;
}

/** Plan của config (section hiển thị theo `planSections`) với reveal đã resolve (`style` = gói chính A). */
export function planOf(config: WeddingConfig, rv: { style: RevealStyle; mode: RevealMode; pins: Readonly<Record<string, RevealStyle>>; harmony: readonly RevealStyle[] }): Record<string, PlanEntry> {
  return revealPlan(planSections(config, 'none').map((p) => ({ id: p.item.id, type: p.item.type })), { main: rv.style, mode: rv.mode, pins: rv.pins, harmony: rv.harmony });
}
