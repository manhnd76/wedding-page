import type { WeddingConfig } from './types.ts';

/** Mặc định schema v1 - nguyên văn solution.md 5.5. */
export const DEFAULT_CONFIG: WeddingConfig = {
  schemaVersion: 1,
  publish: { id: '', at: '' },
  meta: {
    siteUrl: '',
    title: 'Minh Anh & Thuỳ Linh · 12.12.2026',
    description: 'Trân trọng kính mời bạn đến chung vui...',
    ogImage: null, favicon: null, locale: 'vi_VN', noindex: true,
  },
  theme: {
    preset: 'tram-vang', primaryColor: null, overrides: {},
    ornamentSet: 'theme', texture: 'theme', photoFrame: 'theme',
    // [v4a-1] >>>
    motif: { set: 'theme', placements: 'theme', intensity: 'theme', motion: 'auto' },
    // [v4a-1] <<<
  },
  fonts: { preset: 'theme', heading: 'theme', script: 'theme', body: 'theme', scaleStep: 0 },
  effects: {
    intensity: 'medium',
    respectReducedMotion: true,
    autoDowngrade: true,
    guestToggle: true,
    particles: { enabled: true, types: 'theme', color: 'theme', scope: 'all', wind: true },
    burst: { onOpen: 'theme', onRsvp: true, countdownFireworks: 'every-view' },
    reveal: {
      style: 'theme', heading: null, block: null, image: null, ornament: null,
      // [v4a-2a] >>>
      // [v4a-2a] <<<
    },
    parallax: true,
    kenBurns: true,
    micro: { buttonShine: true, photoTilt: true, wishFly: 'paper-plane', scrollProgress: false, coupleHeartTap: false },
    // v2.1 (decisions 2026-10-08): bật mặc định, 45px/s, sau 2.5s, flow dừng 1.2s đầu mỗi section
    autoScroll: { enabled: true, speed: 45, startDelayMs: 2500, mode: 'flow', dwellMs: 1200 },
  },
  music: { enabled: true, src: null, title: '', autoplayAfterOpen: true, loop: true, startAt: 0 },
  guest: { fromUrl: true, queryParam: 'to', pathPrefix: 'invite', fallbackName: 'Quý khách', template: '{name}', maxLength: 60 },
  cover: {
    enabled: true, openStyle: 'theme', background: 'paper', backgroundImage: null,
    eyebrow: 'Thiệp mời cưới', dateText: '12 · 12 · 2026', monogram: 'M & L', guestPrefix: 'Kính gửi:',
    tapToOpenLabel: 'Chạm để mở thiệp', musicHint: 'Thiệp có nhạc, bật loa',
    showOpenedGreeting: true, openedGreeting: 'Chúng mình sắp cưới!', openedSubline: '',
    envelope: { style: 'theme', color: 'auto', guestOnFront: true, liner: true },
  },
  sections: {
    items: [
      { id: 'hero', type: 'hero', enabled: true },
      { id: 'couple', type: 'couple', enabled: true },
      { id: 'families', type: 'families', enabled: true },
      { id: 'announcement', type: 'announcement', enabled: true },
      { id: 'events', type: 'events', enabled: true },
      { id: 'countdown', type: 'countdown', enabled: true },
      { id: 'timeline', type: 'timeline', enabled: true },
      { id: 'loveStory', type: 'loveStory', enabled: false },
      { id: 'album', type: 'album', enabled: true },
      { id: 'gift', type: 'gift', enabled: true },
      { id: 'guestbook', type: 'guestbook', enabled: true },
      { id: 'rsvp', type: 'rsvp', enabled: true },
      { id: 'thankyou', type: 'thankyou', enabled: true },
      { id: 'footer', type: 'footer', enabled: true },
    ],
    showNumbers: true,
    divider: 'theme',
  },
  content: {
    hero: { eyebrow: 'Save the Date', image: null, dateText: '12 · 12 · 2026', lunarText: 'Tức ngày 3 tháng 11 năm Bính Ngọ' },
    couple: {
      eyebrow: 'The Bride & Groom', heading: 'Cô Dâu & Chú Rể', order: 'groom-first',
      groom: { labelEn: 'The Groom', label: 'Chú rể', fullName: '', shortName: '', photo: null, bio: '' },
      bride: { labelEn: 'The Bride', label: 'Cô dâu', fullName: '', shortName: '', photo: null, bio: '' },
    },
    families: {
      eyebrow: 'Our Families', heading: 'Hai bên gia đình',
      groom: { title: 'Nhà Trai', parentsLabel: 'Ông bà', father: '', mother: '', address: '', photo: null },
      bride: { title: 'Nhà Gái', parentsLabel: 'Ông bà', father: '', mother: '', address: '', photo: null },
      showPhotos: false,
    },
    announcement: {
      eyebrow: '', heading: 'Trân trọng báo tin', subheading: 'Lễ Thành Hôn của con chúng tôi',
      inviteLine: 'Trân trọng kính mời {guest} tới dự', inviteLine2: 'bữa tiệc chung vui cùng gia đình chúng tôi',
    },
    events: {
      eyebrow: 'Wedding Events', heading: 'Sự kiện cưới', mainEventId: 'thanh-hon',
      items: [{
        id: 'thanh-hon', name: 'Lễ Thành Hôn',
        startAt: '2026-12-12T11:30:00+07:00', endAt: null, welcomeTime: '11:00',
        displayDate: 'Thứ Bảy 12 Tháng 12 · 2026', lunarText: '',
        venueName: '', address: '', mapUrl: '', mapEmbedUrl: '',
        image: null, rsvpEnabled: true, addToCalendar: true,
      }],
    },
    countdown: {
      eyebrow: '', heading: 'Đếm ngược', targetAt: null, style: 'flip', milestones: true,
      todayLabel: 'Hôm nay là ngày trọng đại!', afterLabel: 'Cảm ơn bạn đã đến chung vui', hideAfter: false,
    },
    timeline: { eyebrow: 'Schedule', heading: 'Lịch trình', items: [{ date: '', time: '', label: '' }] },
    loveStory: { eyebrow: 'Our Story', heading: 'Chuyện chúng mình', items: [{ year: '2019', title: '', text: '', photo: null }] },
    album: { eyebrow: 'Gallery', heading: 'Album cưới', layout: 'masonry', previewCount: 9, images: [] },
    gift: {
      eyebrow: 'Wedding Gift', heading: 'Mừng cưới', message: '', showBankInfo: true, buttonLabel: 'Gửi quà mừng cưới',
      bankAccounts: [{ role: 'Chú rể', owner: '', bank: 'Vietcombank', bankBin: '970436', accountNumber: '', qrImage: null }],
    },
    guestbook: {
      eyebrow: 'Guestbook', heading: 'Sổ lưu bút', subheading: '', maxLength: 300, pageSize: 6, pollIntervalSec: 30,
      suggestions: ['Trăm năm hạnh phúc', 'Sớm có tin vui', 'Mãi yêu thương nhau nhé', 'Chúc mừng hạnh phúc'],
      seedMessages: [], showBubbles: false,
    },
    rsvp: {
      eyebrow: 'RSVP', heading: 'Xác nhận tham dự', subheading: '', attendingLabel: 'Tôi sẽ đến',
      notAttendingLabel: 'Rất tiếc, tôi không thể đến', guestCountLabel: 'Bạn đi mấy người?', maxGuests: 5,
      deadline: null, deadlineText: '', askEvents: true, askNote: true, contactPhone: '',
    },
    thankyou: { heading: 'Trân trọng cảm ơn', message: '', signature: 'Minh Anh & Thuỳ Linh', photo: null, signatureSvg: null },
    footer: {
      monogram: '', dateText: '', madeWithText: 'Thiệp được làm với ♡',
      vendor: { show: false, name: '', tagline: '', phone: '', logo: null },
    },
  },
  floating: { quickAction: true, scrollTop: true },
  integrations: { appsScriptUrl: '' },
};

/** Mẫu trống cho phần tử mảng (mảng thay thế khi merge nên từng phần tử cần mẫu riêng). */
export const ITEM_TEMPLATES = {
  event: {
    id: '', name: '', startAt: '', endAt: null, welcomeTime: '', displayDate: '', lunarText: '',
    venueName: '', address: '', mapUrl: '', mapEmbedUrl: '', image: null, rsvpEnabled: true, addToCalendar: true,
  },
  bankAccount: { role: '', owner: '', bank: '', bankBin: '', accountNumber: '', qrImage: null },
  timeline: { date: '', time: '', label: '' },
  loveStory: { year: '', title: '', text: '', photo: null },
  seedMessage: { name: '', message: '' },
} as const;
