/**
 * Metadata form admin (solution 6 `schema-meta.ts`, design 8.3/8.11): admin sinh form từ đây,
 * diff "Xem thay đổi" dùng nhãn ở đây. Chỉ dữ liệu - không phụ thuộc DOM.
 */
import { ITEM_TEMPLATES } from './defaults.ts';
import type { SectionType } from './enums.ts';

export type ImageSlotKind = 'hero' | 'cover' | 'album' | 'portrait' | 'family' | 'event' | 'story' | 'og' | 'qr' | 'logo' | 'other';

export type FieldType =
  | 'text' | 'textarea' | 'toggle' | 'select' | 'number' | 'datetime' | 'date' | 'time'
  | 'url' | 'tel' | 'image' | 'strings' | 'bank';

export interface FieldMeta {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  slotKind?: ImageSlotKind;
  /** chuỗi tiếng Anh (eyebrow) */
  en?: boolean;
}

export interface ListMeta {
  key: string;
  label: string;
  type: 'list';
  itemTitle: string;
  /** field dùng làm tiêu đề thẻ */
  titleKey: string;
  fields: FieldMeta[];
  template: Record<string, unknown>;
  max?: number;
}

export type AnyField = FieldMeta | ListMeta;

export interface FormGroup {
  id: string;
  title: string;
  /** tiền tố path trong config */
  base: string;
  intro?: string;
  fields: AnyField[];
  /** section guest tương ứng (preview cuộn tới) */
  section?: SectionType | 'cover';
}

const eyebrow: FieldMeta = { key: 'eyebrow', label: 'Dòng chữ nhỏ phía trên (eyebrow)', type: 'text', en: true, help: 'Thường là tiếng Anh, vd "Save the Date". Để trống thì không hiện.' };
const heading: FieldMeta = { key: 'heading', label: 'Tiêu đề', type: 'text' };
const yes = (v: string, l: string) => ({ value: v, label: l });

const person = (who: 'groom' | 'bride', title: string): FieldMeta[] => [
  { key: `${who}.fullName`, label: `${title}: họ tên đầy đủ`, type: 'text' },
  { key: `${who}.shortName`, label: `${title}: tên gọi (hiện trên thiệp)`, type: 'text', placeholder: who === 'groom' ? 'Minh Anh' : 'Thuỳ Linh' },
  { key: `${who}.label`, label: `${title}: nhãn`, type: 'text' },
  { key: `${who}.labelEn`, label: `${title}: nhãn tiếng Anh`, type: 'text', en: true },
  { key: `${who}.photo`, label: `${title}: ảnh chân dung`, type: 'image', slotKind: 'portrait' },
  { key: `${who}.bio`, label: `${title}: vài dòng giới thiệu`, type: 'textarea' },
];
const family = (who: 'groom' | 'bride', title: string): FieldMeta[] => [
  { key: `${who}.title`, label: `${title}: tiêu đề`, type: 'text' },
  { key: `${who}.parentsLabel`, label: `${title}: nhãn bố mẹ`, type: 'text' },
  { key: `${who}.father`, label: `${title}: bố`, type: 'text' },
  { key: `${who}.mother`, label: `${title}: mẹ`, type: 'text' },
  { key: `${who}.address`, label: `${title}: địa chỉ`, type: 'text' },
  { key: `${who}.photo`, label: `${title}: ảnh gia đình`, type: 'image', slotKind: 'family' },
];

export const FORM_GROUPS: FormGroup[] = [
  {
    id: 'general', title: 'Chung', base: '', intro: 'Tiêu đề trang, mô tả khi chia sẻ link, ảnh chia sẻ, tên tham số link khách.',
    fields: [
      { key: 'meta.title', label: 'Tiêu đề trang', type: 'text', help: 'Hiện trên tab trình duyệt và khi chia sẻ link.' },
      { key: 'meta.description', label: 'Mô tả khi chia sẻ', type: 'textarea' },
      { key: 'meta.siteUrl', label: 'Địa chỉ trang (https://…)', type: 'url', placeholder: 'https://ten-trang.pages.dev', help: 'Dùng cho ảnh chia sẻ (OG) và công cụ tạo link khách.' },
      { key: 'meta.ogImage', label: 'Ảnh chia sẻ (OG, 1200×630)', type: 'image', slotKind: 'og' },
      { key: 'meta.noindex', label: 'Ẩn khỏi Google (khuyên dùng)', type: 'toggle' },
      { key: 'guest.queryParam', label: 'Tên tham số link khách', type: 'text', help: 'Mặc định "to": …/?to=Gia-đình-anh-Mạnh' },
      { key: 'guest.fallbackName', label: 'Tên hiện khi link không có tên khách', type: 'text' },
      { key: 'guest.template', label: 'Mẫu tên khách', type: 'text', help: '{name} là tên lấy từ link. Vd "Thân gửi {name}".' },
      { key: 'integrations.appsScriptUrl', label: 'Địa chỉ Google Apps Script (RSVP, lời chúc)', type: 'url', help: 'Để trống: lời chúc lưu trên máy khách, RSVP hiện số điện thoại liên hệ.' },
      { key: 'floating.quickAction', label: 'Nút hành động nhanh', type: 'toggle' },
      { key: 'floating.scrollTop', label: 'Nút lên đầu trang', type: 'toggle' },
    ],
  },
  {
    id: 'cover', title: 'Thiệp mời (cover)', base: 'cover', section: 'cover',
    fields: [
      { key: 'enabled', label: 'Hiện màn thiệp mời trước khi vào trang', type: 'toggle' },
      { key: 'eyebrow', label: 'Dòng chữ nhỏ', type: 'text' },
      { key: 'dateText', label: 'Ngày hiển thị', type: 'text', placeholder: '12 · 12 · 2026' },
      { key: 'monogram', label: 'Chữ lồng (monogram)', type: 'text', placeholder: 'M & L' },
      { key: 'guestPrefix', label: 'Dòng trước tên khách', type: 'text', placeholder: 'Kính gửi:' },
      { key: 'tapToOpenLabel', label: 'Chữ trên nút mở', type: 'text' },
      { key: 'musicHint', label: 'Gợi ý bật loa', type: 'text' },
      { key: 'background', label: 'Nền', type: 'select', options: [yes('paper', 'Giấy (theo theme)'), yes('image', 'Ảnh')] },
      { key: 'backgroundImage', label: 'Ảnh nền cover', type: 'image', slotKind: 'cover' },
      { key: 'showOpenedGreeting', label: 'Hiện lời chào khi mở', type: 'toggle' },
      { key: 'openedGreeting', label: 'Lời chào', type: 'text' },
      { key: 'openedSubline', label: 'Dòng phụ lời chào', type: 'textarea' },
    ],
  },
  {
    id: 'hero', title: 'Ảnh bìa (Hero)', base: 'content.hero', section: 'hero',
    fields: [
      eyebrow,
      { key: 'image', label: 'Ảnh bìa', type: 'image', slotKind: 'hero' },
      { key: 'dateText', label: 'Ngày hiển thị', type: 'text' },
      { key: 'lunarText', label: 'Ngày âm lịch', type: 'text', placeholder: 'Tức ngày 3 tháng 11 năm Bính Ngọ', help: 'Tra lịch âm rồi gõ vào; để trống thì không hiện.' },
    ],
  },
  {
    id: 'couple', title: 'Cô dâu & Chú rể', base: 'content.couple', section: 'couple',
    fields: [
      eyebrow, heading,
      { key: 'order', label: 'Thứ tự', type: 'select', options: [yes('groom-first', 'Chú rể trước'), yes('bride-first', 'Cô dâu trước')] },
      ...person('groom', 'Chú rể'), ...person('bride', 'Cô dâu'),
    ],
  },
  {
    id: 'families', title: 'Hai bên gia đình', base: 'content.families', section: 'families',
    fields: [eyebrow, heading, ...family('groom', 'Nhà trai'), ...family('bride', 'Nhà gái'), { key: 'showPhotos', label: 'Hiện ảnh gia đình', type: 'toggle' }],
  },
  {
    id: 'announcement', title: 'Lời mời', base: 'content.announcement', section: 'announcement',
    fields: [
      eyebrow, heading,
      { key: 'subheading', label: 'Tiêu đề phụ', type: 'text' },
      { key: 'inviteLine', label: 'Câu mời', type: 'text', help: '{guest} sẽ được thay bằng tên khách.' },
      { key: 'inviteLine2', label: 'Câu mời (dòng 2)', type: 'text' },
    ],
  },
  {
    id: 'events', title: 'Sự kiện', base: 'content.events', section: 'events',
    fields: [
      eyebrow, heading,
      {
        key: 'items', label: 'Danh sách sự kiện', type: 'list', itemTitle: 'Sự kiện', titleKey: 'name', max: 6,
        template: { ...ITEM_TEMPLATES.event },
        fields: [
          { key: 'name', label: 'Tên sự kiện', type: 'text' },
          { key: 'startAt', label: 'Ngày giờ bắt đầu', type: 'datetime' },
          { key: 'welcomeTime', label: 'Giờ đón khách', type: 'time' },
          { key: 'displayDate', label: 'Ngày hiển thị', type: 'text', placeholder: 'Thứ Bảy 12 Tháng 12 · 2026' },
          { key: 'lunarText', label: 'Ngày âm lịch', type: 'text', placeholder: 'Tức ngày 3 tháng 11 năm Bính Ngọ', help: 'Tra lịch âm rồi gõ vào; để trống thì không hiện.' },
          { key: 'venueName', label: 'Địa điểm', type: 'text' },
          { key: 'address', label: 'Địa chỉ', type: 'text' },
          { key: 'mapUrl', label: 'Link Google Maps (chỉ đường)', type: 'url' },
          { key: 'mapEmbedUrl', label: 'Link nhúng bản đồ', type: 'url', help: 'Chỉ nhận link www.google.com/maps/embed…' },
          { key: 'image', label: 'Ảnh địa điểm', type: 'image', slotKind: 'event' },
          { key: 'rsvpEnabled', label: 'Cho xác nhận tham dự sự kiện này', type: 'toggle' },
          { key: 'addToCalendar', label: 'Nút thêm vào lịch', type: 'toggle' },
        ],
      },
    ],
  },
  {
    id: 'countdown', title: 'Đếm ngược', base: 'content.countdown', section: 'countdown',
    fields: [
      eyebrow, heading,
      { key: 'targetAt', label: 'Đếm tới (để trống = giờ sự kiện chính)', type: 'datetime' },
      { key: 'style', label: 'Kiểu số', type: 'select', options: [yes('flip', 'Lật số'), yes('simple', 'Đơn giản')] },
      { key: 'milestones', label: 'Hiện mốc 100/30/7/1 ngày', type: 'toggle' },
      { key: 'todayLabel', label: 'Chữ trong ngày cưới', type: 'text' },
      { key: 'afterLabel', label: 'Chữ sau ngày cưới', type: 'text' },
      { key: 'hideAfter', label: 'Ẩn sau ngày cưới', type: 'toggle' },
    ],
  },
  {
    id: 'timeline', title: 'Lịch trình', base: 'content.timeline', section: 'timeline',
    fields: [
      eyebrow, heading,
      {
        key: 'items', label: 'Các mốc', type: 'list', itemTitle: 'Mốc', titleKey: 'label', max: 20, template: { ...ITEM_TEMPLATES.timeline },
        fields: [{ key: 'date', label: 'Ngày', type: 'text' }, { key: 'time', label: 'Giờ', type: 'text' }, { key: 'label', label: 'Nội dung', type: 'text' }],
      },
    ],
  },
  {
    id: 'loveStory', title: 'Chuyện tình', base: 'content.loveStory', section: 'loveStory',
    fields: [
      eyebrow, heading,
      {
        key: 'items', label: 'Các cột mốc', type: 'list', itemTitle: 'Cột mốc', titleKey: 'title', max: 12, template: { ...ITEM_TEMPLATES.loveStory },
        fields: [
          { key: 'year', label: 'Năm', type: 'text' }, { key: 'title', label: 'Tiêu đề', type: 'text' },
          { key: 'text', label: 'Nội dung', type: 'textarea' }, { key: 'photo', label: 'Ảnh', type: 'image', slotKind: 'story' },
        ],
      },
    ],
  },
  {
    id: 'album', title: 'Album', base: 'content.album', section: 'album',
    fields: [
      eyebrow, heading,
      { key: 'layout', label: 'Bố cục', type: 'select', options: [yes('masonry', 'So le'), yes('grid', 'Lưới')] },
      { key: 'previewCount', label: 'Số ảnh hiện trước', type: 'number', min: 1, max: 60 },
    ],
  },
  {
    id: 'gift', title: 'Mừng cưới', base: 'content.gift', section: 'gift',
    fields: [
      eyebrow, heading,
      { key: 'message', label: 'Lời nhắn', type: 'textarea' },
      { key: 'showBankInfo', label: 'Hiện thông tin chuyển khoản (QR)', type: 'toggle' },
      { key: 'buttonLabel', label: 'Chữ trên nút', type: 'text' },
      {
        key: 'bankAccounts', label: 'Tài khoản', type: 'list', itemTitle: 'Tài khoản', titleKey: 'role', max: 4, template: { ...ITEM_TEMPLATES.bankAccount },
        fields: [
          { key: 'role', label: 'Của ai', type: 'text', placeholder: 'Chú rể' },
          { key: 'owner', label: 'Chủ tài khoản', type: 'text' },
          { key: 'bank', label: 'Ngân hàng', type: 'bank' },
          { key: 'accountNumber', label: 'Số tài khoản', type: 'text' },
          { key: 'qrImage', label: 'Ảnh QR (nếu muốn dùng QR của ngân hàng)', type: 'image', slotKind: 'qr' },
        ],
      },
    ],
  },
  {
    id: 'guestbook', title: 'Sổ lưu bút', base: 'content.guestbook', section: 'guestbook',
    fields: [
      eyebrow, heading, { key: 'subheading', label: 'Tiêu đề phụ', type: 'text' },
      { key: 'maxLength', label: 'Độ dài tối đa lời chúc', type: 'number', min: 20, max: 1000 },
      { key: 'pageSize', label: 'Số lời chúc mỗi trang', type: 'number', min: 1, max: 50 },
      { key: 'suggestions', label: 'Lời chúc gợi ý', type: 'strings' },
    ],
  },
  {
    id: 'rsvp', title: 'Xác nhận tham dự', base: 'content.rsvp', section: 'rsvp',
    fields: [
      eyebrow, heading, { key: 'subheading', label: 'Tiêu đề phụ', type: 'text' },
      { key: 'attendingLabel', label: 'Nhãn "sẽ đến"', type: 'text' },
      { key: 'notAttendingLabel', label: 'Nhãn "không đến"', type: 'text' },
      { key: 'guestCountLabel', label: 'Câu hỏi số người', type: 'text' },
      { key: 'maxGuests', label: 'Số người tối đa', type: 'number', min: 1, max: 20 },
      { key: 'deadlineText', label: 'Hạn xác nhận (chữ)', type: 'text' },
      { key: 'askEvents', label: 'Hỏi tham dự sự kiện nào', type: 'toggle' },
      { key: 'askNote', label: 'Cho ghi chú', type: 'toggle' },
      { key: 'contactPhone', label: 'Số điện thoại liên hệ', type: 'tel' },
    ],
  },
  {
    id: 'thankyou', title: 'Lời cảm ơn', base: 'content.thankyou', section: 'thankyou',
    fields: [
      heading, { key: 'message', label: 'Lời nhắn', type: 'textarea' },
      { key: 'signature', label: 'Chữ ký', type: 'text' },
      { key: 'photo', label: 'Ảnh nền', type: 'image', slotKind: 'other' },
    ],
  },
  {
    id: 'footer', title: 'Chân trang', base: 'content.footer', section: 'footer',
    fields: [
      { key: 'monogram', label: 'Chữ lồng', type: 'text' },
      { key: 'dateText', label: 'Ngày', type: 'text' },
      { key: 'madeWithText', label: 'Dòng cuối', type: 'text' },
    ],
  },
];

/** Nhãn nhóm phụ (không nằm trong FORM_GROUPS) cho diff. */
const EXTRA_LABELS: Record<string, string> = {
  theme: 'Theme & Màu', 'theme.preset': 'Theme', 'theme.primaryColor': 'Màu chủ đạo', 'theme.overrides': 'Màu tuỳ chỉnh',
  'theme.ornamentSet': 'Họa tiết', 'theme.texture': 'Texture nền', 'theme.photoFrame': 'Khung ảnh',
  fonts: 'Font', 'fonts.preset': 'Bộ font', 'fonts.heading': 'Font tiêu đề', 'fonts.script': 'Font chữ ký', 'fonts.body': 'Font nội dung', 'fonts.scaleStep': 'Cỡ chữ',
  effects: 'Hiệu ứng', 'effects.intensity': 'Cường độ hiệu ứng', 'effects.particles': 'Hạt nền', 'effects.burst': 'Hiệu ứng sau khi mở',
  'effects.reveal': 'Hiện nội dung khi cuộn', music: 'Nhạc', 'music.src': 'Bài nhạc', 'music.title': 'Tên bài nhạc',
  sections: 'Sections', 'sections.items': 'Thứ tự / bật tắt section', 'sections.showNumbers': 'Hiện số thứ tự', 'sections.divider': 'Divider',
  'cover.openStyle': 'Kiểu mở thiệp', 'content.album.images': 'Ảnh album', publish: 'Xuất bản',
};

/** Nhãn dễ đọc cho 1 đường dẫn config (diff). Vd `content.thankyou.heading` -> "Lời cảm ơn › Tiêu đề". */
export function labelForPath(path: string): string {
  const clean = path.replace(/\[(\d+)\]/g, '.$1');
  if (EXTRA_LABELS[path]) return EXTRA_LABELS[path]!;
  let best: { g: FormGroup; rest: string } | null = null;
  for (const g of FORM_GROUPS) {
    const pre = g.base ? `${g.base}.` : '';
    if (pre && !clean.startsWith(pre)) continue;
    const rest = clean.slice(pre.length);
    if (!best || (g.base.length > best.g.base.length)) {
      if (!pre && !g.fields.some((f) => rest === f.key || rest.startsWith(`${f.key}.`))) continue;
      best = { g, rest };
    }
  }
  if (best) {
    const { g, rest } = best;
    for (const f of g.fields) {
      if (rest === f.key) return `${g.title} › ${f.label}`;
      if (rest.startsWith(`${f.key}.`)) {
        if (f.type === 'list') {
          const m = /^(\d+)\.?(.*)$/.exec(rest.slice(f.key.length + 1));
          const sub = m?.[2] ? f.fields.find((x) => m[2] === x.key || m[2]!.startsWith(`${x.key}.`)) : null;
          return `${g.title} › ${f.itemTitle} ${Number(m?.[1] ?? 0) + 1}${sub ? ` › ${sub.label}` : ''}`;
        }
        return `${g.title} › ${f.label}`;
      }
    }
    return `${g.title} › ${rest}`;
  }
  // tiền tố dài nhất trong EXTRA_LABELS
  const keys = Object.keys(EXTRA_LABELS).filter((k) => path.startsWith(`${k}.`) || path.startsWith(`${k}[`)).sort((a, b) => b.length - a.length);
  return keys[0] ? `${EXTRA_LABELS[keys[0]]!} › ${path.slice(keys[0].length + 1)}` : path;
}

export const groupById = (id: string) => FORM_GROUPS.find((g) => g.id === id);
