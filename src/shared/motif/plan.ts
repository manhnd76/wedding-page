/**
 * Kế hoạch đặt hoạ tiết nền B2 theo section (design 1.7.3, solution Rev 5 mục 10.5f). Hàm thuần, dùng chung
 * guest (motif.ts chèn phần tử) + admin (preview cuộn tới section đầu tiên có hoạ tiết).
 * Luật: loại Hero/Cảm ơn CÓ ảnh + Album; RSVP/Lời chúc chỉ `band`; `band` chỉ section tone-surface + footer;
 * `hero` chỉ Hero/Cảm ơn KHÔNG ảnh; `title` chỉ khi section có tiêu đề (`.sec-head`).
 */
import type { MotifPlacement, SectionType } from '../config/enums.ts';
import type { WeddingConfig } from '../config/types.ts';
import type { PlannedSection } from '../sections/meta.ts';
import { hasImage } from '../sections/meta.ts';

export interface MotifSlot { sectionId: string; type: SectionType; placements: MotifPlacement[] }

/** Section vẽ bằng `shell()` có `.sec-head` khi tiêu đề khác rỗng (hero/thankyou/footer không có `.sec-head`). */
const HEADED: Partial<Record<SectionType, (c: WeddingConfig) => string>> = {
  couple: (c) => c.content.couple.heading,
  families: (c) => c.content.families.heading,
  announcement: (c) => c.content.announcement.heading,
  events: (c) => c.content.events.heading,
  countdown: (c) => c.content.countdown.heading,
  timeline: (c) => c.content.timeline.heading,
  loveStory: (c) => c.content.loveStory.heading,
  album: (c) => c.content.album.heading,
  gift: (c) => c.content.gift.heading,
  guestbook: (c) => c.content.guestbook.heading,
  rsvp: (c) => c.content.rsvp.heading,
};

export function sectionHasImage(type: SectionType, c: WeddingConfig): boolean {
  if (type === 'hero') return hasImage(c.content.hero.image);
  if (type === 'thankyou') return hasImage(c.content.thankyou.photo);
  return false;
}

export function planMotif(plan: readonly PlannedSection[], config: WeddingConfig, placements: readonly MotifPlacement[]): MotifSlot[] {
  if (!placements.length) return [];
  const out: MotifSlot[] = [];
  for (const p of plan) {
    const type = p.item.type;
    const withImg = sectionHasImage(type, config);
    if (withImg || type === 'album') continue;
    const formOnly = type === 'rsvp' || type === 'guestbook';
    const heading = HEADED[type]?.(config) ?? '';
    const ok = placements.filter((pl) => {
      switch (pl) {
        case 'band': return p.tone === 'surface' || type === 'footer';
        case 'hero': return type === 'hero' || type === 'thankyou';
        case 'title': return !formOnly && heading.trim() !== '';
        case 'pattern': case 'corners': return !formOnly;
        default: return false;
      }
    });
    if (ok.length) out.push({ sectionId: p.item.id, type, placements: ok });
  }
  return out;
}
