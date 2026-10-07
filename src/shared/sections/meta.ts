import type { SectionType } from '../config/enums.ts';
import type { ImageRef, SectionItem, WeddingConfig } from '../config/types.ts';

export interface SectionMeta {
  numbered: boolean;
  pinned?: 'first' | 'last';
  hasBgImage: boolean;
  /** hệ số mật độ hạt + opacity tối đa (design 5.7 lớp 1) */
  particle: { density: number; maxOpacity: number };
  /** section có vùng loại trừ hạt (form, thẻ sự kiện) - selector trong DOM guest */
  exclusionSelectors: string[];
  /** tên menu nhanh / nhãn admin */
  label: string;
  isEmpty: (c: WeddingConfig) => boolean;
}

const G1 = { density: 1, maxOpacity: 1 };
const G2 = { density: 0.6, maxOpacity: 0.85 };
const G3 = { density: 0.35, maxOpacity: 0.7 };
const G4 = { density: 0.25, maxOpacity: 0.6 };
const t = (s: string | null | undefined) => !!(s && s.trim());
export const hasImage = (im: ImageRef | undefined): im is NonNullable<ImageRef> => !!im && typeof im.src === 'string' && im.src.trim() !== '';

/** Ngày mục tiêu đếm ngược: targetAt hoặc startAt của sự kiện chính (solution 5.7). */
export function countdownTarget(c: WeddingConfig): Date | null {
  const raw = c.content.countdown.targetAt || mainEvent(c)?.startAt || '';
  const d = new Date(raw);
  return raw && !Number.isNaN(d.getTime()) ? d : null;
}

export function mainEvent(c: WeddingConfig) {
  const items = c.content.events.items;
  return items.find((e) => e.id === c.content.events.mainEventId) ?? items[0];
}

export const SECTION_META: Record<SectionType, SectionMeta> = {
  hero: { numbered: false, pinned: 'first', hasBgImage: true, particle: G1, exclusionSelectors: [], label: 'Ảnh bìa', isEmpty: () => false },
  couple: {
    numbered: true, hasBgImage: false, particle: G2, exclusionSelectors: [], label: 'Cô dâu & Chú rể',
    isEmpty: (c) => !t(c.content.couple.groom.fullName) && !t(c.content.couple.groom.shortName) && !t(c.content.couple.bride.fullName) && !t(c.content.couple.bride.shortName),
  },
  families: {
    numbered: true, hasBgImage: false, particle: G2, exclusionSelectors: [], label: 'Gia đình',
    isEmpty: (c) => { const f = c.content.families; return ![f.groom.father, f.groom.mother, f.bride.father, f.bride.mother].some(t); },
  },
  announcement: {
    numbered: true, hasBgImage: false, particle: G2, exclusionSelectors: [], label: 'Lời mời',
    isEmpty: (c) => { const a = c.content.announcement; return !t(a.heading) && !t(a.subheading) && !t(a.inviteLine); },
  },
  events: {
    numbered: true, hasBgImage: false, particle: G3, exclusionSelectors: ['.ev-card'], label: 'Sự kiện & chỉ đường',
    isEmpty: (c) => !c.content.events.items.some((e) => t(e.name)),
  },
  countdown: { numbered: false, hasBgImage: false, particle: G2, exclusionSelectors: [], label: 'Đếm ngược', isEmpty: (c) => countdownTarget(c) === null },
  timeline: { numbered: true, hasBgImage: false, particle: G3, exclusionSelectors: [], label: 'Lịch trình', isEmpty: (c) => !c.content.timeline.items.some((i) => t(i.label)) },
  loveStory: {
    numbered: true, hasBgImage: false, particle: G3, exclusionSelectors: [], label: 'Chuyện tình',
    isEmpty: (c) => !c.content.loveStory.items.some((i) => t(i.title) || t(i.text)),
  },
  album: { numbered: true, hasBgImage: false, particle: G2, exclusionSelectors: [], label: 'Album', isEmpty: (c) => c.content.album.images.length === 0 },
  gift: {
    numbered: true, hasBgImage: false, particle: G4, exclusionSelectors: [], label: 'Mừng cưới',
    isEmpty: (c) => {
      const g = c.content.gift;
      const hasBank = g.showBankInfo && g.bankAccounts.some((b) => t(b.accountNumber) || hasImage(b.qrImage));
      return !t(g.message) && !hasBank;
    },
  },
  guestbook: { numbered: true, hasBgImage: false, particle: G4, exclusionSelectors: ['.gb-form', '.gb-list'], label: 'Gửi lời chúc', isEmpty: () => false },
  rsvp: {
    numbered: true, hasBgImage: false, particle: G4, exclusionSelectors: ['.rsvp-card'], label: 'Xác nhận tham dự',
    isEmpty: (c) => !t(c.integrations.appsScriptUrl) && !t(c.content.rsvp.contactPhone),
  },
  thankyou: {
    numbered: false, hasBgImage: true, particle: G1, exclusionSelectors: [], label: 'Lời cảm ơn',
    isEmpty: (c) => !t(c.content.thankyou.heading) && !t(c.content.thankyou.message),
  },
  footer: { numbered: false, pinned: 'last', hasBgImage: false, particle: G4, exclusionSelectors: [], label: 'Chân trang', isEmpty: () => false },
};

export interface PlannedSection {
  item: SectionItem;
  meta: SectionMeta;
  /** "01".. hoặc null nếu không đánh số */
  number: string | null;
  /** nền xen kẽ; null nếu section có ảnh nền */
  tone: 'bg' | 'surface' | null;
  /** chèn divider TRƯỚC section này? */
  dividerBefore: boolean;
}

/**
 * Lọc enabled + !isEmpty -> đánh số + nền xen kẽ + divider (solution 5.8, design 4.0).
 */
export function planSections(c: WeddingConfig, divider: string, warn: (m: string) => void = () => {}): PlannedSection[] {
  const visible = c.sections.items.filter((it) => {
    const meta = SECTION_META[it.type];
    if (!meta) { warn(`section type lạ "${String(it.type)}" -> bỏ qua`); return false; }
    return it.enabled && !meta.isEmpty(c);
  });
  let n = 0;
  let toneIdx = 0;
  const out: PlannedSection[] = [];
  visible.forEach((item, i) => {
    const meta = SECTION_META[item.type];
    const number = meta.numbered && c.sections.showNumbers ? String(++n).padStart(2, '0') : null;
    const tone = meta.hasBgImage ? null : toneIdx++ % 2 === 0 ? 'bg' : 'surface';
    const prev = i > 0 ? SECTION_META[visible[i - 1]!.type] : null;
    const dividerBefore = divider !== 'none' && i > 0 && !!prev && !prev.hasBgImage && !meta.hasBgImage;
    out.push({ item, meta, number, tone, dividerBefore });
  });
  return out;
}
