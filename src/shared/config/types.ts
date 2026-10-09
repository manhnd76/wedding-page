import type {
  AlbumLayout, AutoScrollMode, BodyFontId, BurstOnOpen, CountdownFireworks, CountdownStyle, CoupleOrder,
  CoverBackground, Divider, EnvelopeStyle, FontPresetId, HeadingFontId, Intensity, OpenStyle, OrnamentSet,
  ParticleScope, ParticleType, PhotoFrame, RevealAtom, RevealStyle, ScriptFontId, SectionType,
  Texture, ThemeId, WishFly,
} from './enums.ts';

/** Ảnh trong config (solution 5.5). `null` = chưa có ảnh. */
export type ImageRef = {
  src: string;
  w: number;
  h: number;
  alt: string;
  thumb?: string;
  focalPoint?: { x: number; y: number };
  dominantColor?: string;
  lqip?: string;
  updatedAt?: string;
} | null;

export type ThemeOr<T> = 'theme' | T;

export interface TokenOverrides {
  primary?: string; onPrimary?: string; accent?: string; accent2?: string;
  bg?: string; surface?: string; text?: string; muted?: string; line?: string;
}

export interface SectionItem { id: string; type: SectionType; enabled: boolean }

export interface Person {
  labelEn: string; label: string; fullName: string; shortName: string; photo: ImageRef; bio: string;
}
export interface Family {
  title: string; parentsLabel: string; father: string; mother: string; address: string; photo: ImageRef;
}
export interface EventItem {
  id: string; name: string; startAt: string; endAt: string | null; welcomeTime: string;
  displayDate: string; lunarText: string; venueName: string; address: string;
  mapUrl: string; mapEmbedUrl: string; image: ImageRef; rsvpEnabled: boolean; addToCalendar: boolean;
}
export interface BankAccount {
  role: string; owner: string; bank: string; bankBin: string; accountNumber: string; qrImage: ImageRef;
}
export interface SeedMessage { name: string; message: string; time?: string }

export interface WeddingConfig {
  schemaVersion: 1;
  publish: { id: string; at: string };
  meta: {
    siteUrl: string; title: string; description: string; ogImage: ImageRef; favicon: ImageRef;
    locale: string; noindex: boolean;
  };
  theme: {
    preset: ThemeId;
    primaryColor: string | null;
    overrides: TokenOverrides;
    ornamentSet: ThemeOr<OrnamentSet>;
    texture: ThemeOr<Texture>;
    photoFrame: ThemeOr<PhotoFrame>;
    // [v4a-1] >>>
    // [v4a-1] <<<
  };
  fonts: {
    preset: ThemeOr<FontPresetId>;
    heading: ThemeOr<HeadingFontId>;
    script: ThemeOr<ScriptFontId>;
    body: ThemeOr<BodyFontId>;
    scaleStep: -1 | 0 | 1;
  };
  effects: {
    intensity: Intensity;
    respectReducedMotion: boolean;
    autoDowngrade: boolean;
    guestToggle: boolean;
    particles: {
      enabled: boolean;
      types: ThemeOr<ParticleType[]>;
      color: string; // 'theme' | 'multi' | hex
      scope: ParticleScope;
      wind: boolean;
    };
    burst: { onOpen: ThemeOr<BurstOnOpen>; onRsvp: boolean; countdownFireworks: CountdownFireworks };
    reveal: {
      style: ThemeOr<RevealStyle>;
      heading: RevealAtom | null; block: RevealAtom | null; image: RevealAtom | null; ornament: RevealAtom | null;
      // [v4a-2a] >>>
      // [v4a-2a] <<<
    };
    parallax: boolean;
    kenBurns: boolean;
    micro: { buttonShine: boolean; photoTilt: boolean; wishFly: WishFly; scrollProgress: boolean; coupleHeartTap: boolean };
    /** v2.1: + mode, dwellMs (field mới có mặc định, không bump schemaVersion) */
    autoScroll: { enabled: boolean; speed: number; startDelayMs: number; mode: AutoScrollMode; dwellMs: number };
  };
  music: { enabled: boolean; src: string | null; title: string; autoplayAfterOpen: boolean; loop: boolean; startAt: number };
  guest: { fromUrl: boolean; queryParam: string; pathPrefix: string; fallbackName: string; template: string; maxLength: number };
  cover: {
    enabled: boolean; openStyle: ThemeOr<OpenStyle>; background: CoverBackground; backgroundImage: ImageRef;
    eyebrow: string; dateText: string; monogram: string; guestPrefix: string; tapToOpenLabel: string;
    musicHint: string; showOpenedGreeting: boolean; openedGreeting: string; openedSubline: string;
    /** v2.1: mẫu phong bì (chỉ dùng khi kiểu mở resolve ra `envelope`) */
    envelope: {
      style: ThemeOr<EnvelopeStyle>;
      /** 'auto' = theo mẫu (cố định với kraft/song-hy/velvet); 'theme' = nhuộm theo theme; hex = màu giấy */
      color: string;
      guestOnFront: boolean;
      liner: boolean;
    };
  };
  sections: { items: SectionItem[]; showNumbers: boolean; divider: ThemeOr<Divider> };
  content: {
    hero: { eyebrow: string; image: ImageRef; dateText: string; lunarText: string };
    couple: { eyebrow: string; heading: string; order: CoupleOrder; groom: Person; bride: Person };
    families: { eyebrow: string; heading: string; groom: Family; bride: Family; showPhotos: boolean };
    announcement: { eyebrow: string; heading: string; subheading: string; inviteLine: string; inviteLine2: string };
    events: { eyebrow: string; heading: string; mainEventId: string; items: EventItem[] };
    countdown: {
      eyebrow: string; heading: string; targetAt: string | null; style: CountdownStyle; milestones: boolean;
      todayLabel: string; afterLabel: string; hideAfter: boolean;
    };
    timeline: { eyebrow: string; heading: string; items: { date: string; time: string; label: string }[] };
    loveStory: { eyebrow: string; heading: string; items: { year: string; title: string; text: string; photo: ImageRef }[] };
    album: { eyebrow: string; heading: string; layout: AlbumLayout; previewCount: number; images: NonNullable<ImageRef>[] };
    gift: {
      eyebrow: string; heading: string; message: string; showBankInfo: boolean; buttonLabel: string;
      bankAccounts: BankAccount[];
    };
    guestbook: {
      eyebrow: string; heading: string; subheading: string; maxLength: number; pageSize: number;
      pollIntervalSec: number; suggestions: string[]; seedMessages: SeedMessage[]; showBubbles: boolean;
    };
    rsvp: {
      eyebrow: string; heading: string; subheading: string; attendingLabel: string; notAttendingLabel: string;
      guestCountLabel: string; maxGuests: number; deadline: string | null; deadlineText: string;
      askEvents: boolean; askNote: boolean; contactPhone: string;
    };
    thankyou: { heading: string; message: string; signature: string; photo: ImageRef; signatureSvg: string | null };
    footer: {
      monogram: string; dateText: string; madeWithText: string;
      vendor: { show: boolean; name: string; tagline: string; phone: string; logo: ImageRef };
    };
  };
  floating: { quickAction: boolean; scrollTop: boolean };
  integrations: { appsScriptUrl: string };
}

/** Deep partial dùng cho config thô / override. */
export type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
