import { findBankBin } from '../vietqr/banks.ts';
import { OPEN_STYLES, SECTION_TYPES, isHex, isOneOf } from './enums.ts';
import type { DeepPartial, ImageRef, SectionItem, WeddingConfig } from './types.ts';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v.normalize('NFC') : typeof v === 'number' ? String(v) : d);
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const obj = (v: unknown): Obj => (isObj(v) ? v : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export const CURRENT_SCHEMA_VERSION = 1;

export interface MigrateResult { config: unknown; warnings: string[]; fromVersion: number }

/**
 * Chạy migration tuần tự. Không có `schemaVersion` = v0 (config.js của wedding-site).
 */
export function migrate(raw: unknown): MigrateResult {
  const warnings: string[] = [];
  if (!isObj(raw)) return { config: {}, warnings: ['config không phải object -> dùng mặc định'], fromVersion: CURRENT_SCHEMA_VERSION };
  const v = raw.schemaVersion;
  if (v === undefined) {
    return { config: migrateV0toV1(raw, warnings), warnings, fromVersion: 0 };
  }
  if (typeof v === 'number' && v > CURRENT_SCHEMA_VERSION) {
    warnings.push(`schemaVersion ${v} mới hơn bản đang chạy (${CURRENT_SCHEMA_VERSION}) -> đọc như v1`);
  }
  return { config: raw, warnings, fromVersion: typeof v === 'number' ? v : CURRENT_SCHEMA_VERSION };
}

/** Đổi path ảnh cũ (chuỗi) sang ImageRef. Kích thước chưa biết -> 0 (renderer tự xử lý, admin v2 đo lại). */
export function legacyImage(src: unknown, alt: string): ImageRef {
  const s = str(src).trim();
  if (!s) return null;
  return { src: s.replace(/^\.?\//, ''), w: 0, h: 0, alt };
}

const LEGACY_THEME: Record<string, WeddingConfig['theme']['preset']> = {
  'tram-vang': 'tram-vang', 'hong-phan': 'hong-phan', 'xanh-ngoc': 'luc-bao', 'xanh-navy': 'luc-bao',
};
const LEGACY_PARTICLE: Record<string, string> = { petal: 'petal-rose', heart: 'heart', leaf: 'leaf-green', 'snow-dot': 'snow' };

/** "Tháng 12" -> "12" */
const monthNum = (m: string) => (m.match(/\d{1,2}/)?.[0] ?? m).trim();

/**
 * Field cũ CỐ Ý bỏ (không có chỗ trong schema v1) - dùng cho test "không mất dữ liệu" và report.
 * Mỗi mục kèm lý do.
 */
export const V0_DROPPED_FIELDS: Record<string, string> = {
  'album.folder': 'Ảnh album được liệt kê từng ảnh (album.images), không quét thư mục',
  'guestbook.storageKey': 'Khoá localStorage do code quyết định (wp_guestbook_v1)',
  'guestbook.mode': 'Suy ra từ integrations.appsScriptUrl (rỗng = local)',
  'rsvp.storageKey': 'Khoá localStorage do code quyết định (wp_rsvp_v1)',
  'effects.petals.density': 'Số hạt theo ma trận cường độ (design 5.10), không cấu hình số tuyệt đối',
  'effects.petals.colors[1..]': 'Schema v1 chỉ nhận 1 màu hex hoặc "multi"; giữ màu đầu tiên',
  'effects.scrollReveal.*': 'Bỏ theo solution 5.7; dùng effects.reveal.style',
  'effects.coverUnlock.enabled': 'Gộp vào cover.openStyle (false -> "none")',
  'music.volume': 'Bỏ theo solution 5.7 (fade bằng GainNode)',
  'invitation.weekday': 'Thứ trong tuần đã có trong events[].displayDate; dateText gộp ngày/tháng/năm',
};

export function migrateV0toV1(old: Obj, warnings: string[] = []): DeepPartial<WeddingConfig> {
  const site = obj(old.site);
  const inv = obj(old.invitation);
  const couple = obj(old.couple);
  const groom = obj(couple.groom);
  const bride = obj(couple.bride);
  const fam = obj(old.families);
  const gf = obj(fam.groomFamily);
  const bf = obj(fam.brideFamily);
  const ann = obj(old.announcement);
  const cover = obj(old.cover);
  const album = obj(old.album);
  const gift = obj(old.gift);
  const gb = obj(old.guestbook);
  const rsvp = obj(old.rsvp);
  const cd = obj(old.countdown);
  const ty = obj(old.thankYou);
  const vendor = obj(old.vendor);
  const music = obj(old.music);
  const fx = obj(old.effects);
  const petals = obj(fx.petals);
  const unlock = obj(fx.coverUnlock);
  const autoScroll = obj(fx.autoScroll);

  // ---- theme
  const themeRaw = str(old.theme);
  const preset = LEGACY_THEME[themeRaw] ?? 'tram-vang';
  if (themeRaw && !LEGACY_THEME[themeRaw]) warnings.push(`theme cũ "${themeRaw}" không có -> tram-vang`);

  // ---- ngày
  const day = str(inv.day);
  const month = monthNum(str(inv.month));
  const year = str(inv.year);
  const dateText = [day, month, year].filter(Boolean).join(' · ');

  // ---- events
  const events = arr(old.events).filter(isObj).map((e, i) => {
    const date = str(e.date);
    const time = str(e.startTime) || '00:00';
    const startAt = date ? `${date}T${time.length === 5 ? time : '00:00'}:00+07:00` : '';
    return {
      id: str(e.id) || `event-${i + 1}`,
      name: str(e.name),
      startAt,
      endAt: null,
      welcomeTime: str(e.welcomeTime),
      displayDate: str(e.displayDate),
      lunarText: str(e.lunarDate),
      venueName: str(e.venueName),
      address: str(e.address),
      mapUrl: str(e.mapUrl),
      mapEmbedUrl: str(e.mapEmbedUrl),
      image: legacyImage(e.image, str(e.name)),
      rsvpEnabled: bool(e.rsvpEnabled, true),
      addToCalendar: true,
    };
  });
  const target = str(cd.targetDate);
  const targetDay = target.slice(0, 10);
  const main = events.find((e) => e.startAt.slice(0, 10) === targetDay) ?? events[events.length - 1];

  // ---- sections
  const order = arr(obj(old.sections).order).map((x) => str(x)).map((x) => (x === 'thankYou' ? 'thankyou' : x));
  const items: SectionItem[] = [];
  for (const t of order) {
    if (t === 'vendor') continue; // vendor -> footer.vendor
    if (!isOneOf(SECTION_TYPES, t)) { warnings.push(`section cũ "${t}" không có trong v1 -> bỏ`); continue; }
    if (!items.some((x) => x.type === t)) items.push({ id: t, type: t, enabled: true });
  }
  if (order.length) {
    for (const t of SECTION_TYPES) {
      if (!items.some((x) => x.type === t)) items.push({ id: t, type: t, enabled: t === 'footer' || t === 'hero' });
    }
  }

  // ---- particles
  const oldTypes = arr(petals.types ?? (petals.type !== undefined ? [petals.type] : []))
    .map((x) => LEGACY_PARTICLE[str(x)])
    .filter((x): x is string => !!x);
  const colors = arr(petals.colors).map((c) => str(c)).filter(isHex);

  // ---- open style
  const unlockAnim = str(unlock.unlockAnimation);
  let openStyle: string = 'theme';
  if (unlock.enabled === false) openStyle = 'none';
  else if (isOneOf(OPEN_STYLES, unlockAnim)) openStyle = unlockAnim;

  const groomName = str(groom.fullName);
  const brideName = str(bride.fullName);
  const monogram = str(couple.monogram);

  const out: DeepPartial<WeddingConfig> = {
    schemaVersion: 1,
    meta: {
      siteUrl: str(site.canonicalUrl),
      title: str(site.title),
      description: str(site.metaDescription),
      ogImage: legacyImage(site.ogImage, str(site.title)),
      favicon: legacyImage(site.favicon, ''),
      locale: str(site.locale, 'vi_VN') || 'vi_VN',
    },
    theme: { preset },
    effects: {
      particles: {
        enabled: bool(petals.enabled, true),
        ...(oldTypes.length ? { types: [...new Set(oldTypes)].slice(0, 2) as never } : {}),
        ...(colors.length ? { color: colors[0] } : {}),
      },
      // decisions 2026-10-08 (sau v2.1): import config v0 LUÔN bật tự cuộn (bỏ qua `enabled` cũ); có `speed` thì giữ,
      // thiếu -> mặc định (45px/s, 2.5s). startDelayMs được kẹp ≥ 1500 ở merge. Không có migration cho config v1.
      autoScroll: {
        enabled: true,
        ...(typeof autoScroll.speed === 'number' ? { speed: autoScroll.speed } : {}),
        ...(typeof autoScroll.startDelayMs === 'number' ? { startDelayMs: autoScroll.startDelayMs } : {}),
      },
    },
    music: {
      enabled: bool(music.enabled, true),
      src: str(music.src) || null,
      title: str(music.title),
      autoplayAfterOpen: bool(music.autoplayAfterOpen, true),
      startAt: typeof music.startAtSec === 'number' ? music.startAtSec : 0,
    },
    guest: {
      fromUrl: bool(inv.guestNameFromUrl, true),
      queryParam: str(inv.guestUrlParam) || 'to',
      pathPrefix: str(inv.guestUrlPathPrefix) || 'invite',
      fallbackName: str(inv.guestName) || 'Quý khách',
      template: str(inv.guestNameTemplate) || '{name}',
    },
    cover: {
      openStyle: openStyle as never,
      eyebrow: str(inv.eyebrow),
      dateText,
      monogram,
      tapToOpenLabel: str(inv.tapToOpenLabel) || 'Chạm để mở thiệp',
      openedGreeting: str(inv.openedGreeting),
      openedSubline: str(inv.openedSubline),
    },
    content: {
      hero: {
        eyebrow: str(inv.kicker),
        image: legacyImage(cover.image, str(cover.caption) || [groomName, brideName].filter(Boolean).join(' & ')),
        dateText,
        lunarText: str(inv.lunarDate),
      },
      couple: {
        groom: {
          labelEn: str(groom.label), label: str(groom.labelVi), fullName: groomName, shortName: str(groom.shortName),
          photo: legacyImage(groom.photo, groomName), bio: str(groom.bio),
        },
        bride: {
          labelEn: str(bride.label), label: str(bride.labelVi), fullName: brideName, shortName: str(bride.shortName),
          photo: legacyImage(bride.photo, brideName), bio: str(bride.bio),
        },
      },
      families: {
        groom: {
          title: str(gf.title), parentsLabel: str(gf.parentsLabel), father: str(gf.father), mother: str(gf.mother),
          address: str(gf.address), photo: legacyImage(gf.photo, str(gf.title)),
        },
        bride: {
          title: str(bf.title), parentsLabel: str(bf.parentsLabel), father: str(bf.father), mother: str(bf.mother),
          address: str(bf.address), photo: legacyImage(bf.photo, str(bf.title)),
        },
        showPhotos: !!(str(gf.photo) || str(bf.photo)),
      },
      announcement: { heading: str(ann.heading), subheading: str(ann.subheading) },
      events: {
        ...(main ? { mainEventId: main.id } : {}),
        ...(events.length ? { items: events } : {}),
      },
      countdown: {
        targetAt: target || null,
        ...(str(cd.todayLabel) ? { todayLabel: str(cd.todayLabel) } : {}),
        ...(str(cd.heading) ? { heading: str(cd.heading) } : {}),
      },
      timeline: {
        items: arr(old.timeline).filter(isObj).map((t) => ({ date: str(t.date), time: str(t.time), label: str(t.label) })),
      },
      album: {
        images: arr(album.images)
          .map((s, i) => legacyImage(s, `Ảnh cưới ${i + 1}`))
          .filter((x): x is NonNullable<ImageRef> => x !== null),
      },
      gift: {
        heading: str(gift.heading),
        message: str(gift.message),
        showBankInfo: bool(gift.showBankInfo, true),
        bankAccounts: arr(gift.bankAccounts).filter(isObj).map((b, i) => ({
          role: str(b.role) || (i === 0 ? 'Chú rể' : i === 1 ? 'Cô dâu' : 'Tài khoản'),
          owner: str(b.owner),
          bank: str(b.bank),
          bankBin: str(b.bankBin) || findBankBin(str(b.bank)),
          accountNumber: str(b.accountNumber),
          qrImage: legacyImage(b.qrImage, `QR ${str(b.owner)}`),
        })),
      },
      guestbook: {
        heading: str(gb.heading),
        subheading: str(gb.subheading),
        ...(typeof gb.pollIntervalSeconds === 'number' ? { pollIntervalSec: gb.pollIntervalSeconds } : {}),
        seedMessages: arr(gb.seedMessages).filter(isObj).map((m) => ({
          name: str(m.name), message: str(m.message), ...(str(m.time) ? { time: str(m.time) } : {}),
        })),
      },
      rsvp: {
        heading: str(rsvp.heading),
        subheading: str(rsvp.subheading),
        attendingLabel: str(rsvp.attendingLabel) || 'Tôi sẽ đến',
        notAttendingLabel: str(rsvp.notAttendingLabel) || 'Rất tiếc, tôi không thể đến',
        guestCountLabel: str(rsvp.guestCountLabel) || 'Bạn đi mấy người?',
      },
      thankyou: { heading: str(ty.heading), message: str(ty.message), signature: str(ty.signature) },
      footer: {
        monogram,
        dateText,
        vendor: {
          show: bool(vendor.show, false), name: str(vendor.name), tagline: str(vendor.tagline),
          phone: str(vendor.phone), logo: legacyImage(vendor.logo, str(vendor.name)),
        },
      },
    },
    integrations: { appsScriptUrl: str(gb.apiUrl) },
  };
  if (items.length) out.sections = { items };
  return stripEmptyStrings(out) as DeepPartial<WeddingConfig>;
}

/**
 * Bỏ chuỗi rỗng ở các field có mặc định (để merge lấy mặc định thay vì ghi đè bằng '').
 * Chỉ áp cho field "nhãn" - giá trị nội dung rỗng vẫn rỗng sau merge vì mặc định nội dung cũng rỗng.
 */
function stripEmptyStrings(v: unknown): unknown {
  if (Array.isArray(v)) return v; // phần tử mảng giữ nguyên (merge dùng ITEM_TEMPLATES)
  if (isObj(v)) {
    const o: Obj = {};
    for (const [k, x] of Object.entries(v)) {
      if (x === '' || x === undefined) continue;
      o[k] = stripEmptyStrings(x);
    }
    return o;
  }
  return v;
}

/**
 * Đọc file `config.js` cũ (dạng `window.WEDDING_CONFIG = {...};`) KHÔNG dùng eval.
 * Hỗ trợ comment, dấu phẩy thừa, key có/không nháy kép.
 */
export function parseLegacyConfigJs(text: string): Obj {
  let s = text.replace(/^﻿/, '');
  // bỏ comment (không đụng chuỗi chứa // trong URL: chỉ bỏ // ở đầu dòng hoặc sau khoảng trắng ngoài chuỗi)
  s = stripComments(s);
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Không tìm thấy object cấu hình trong file');
  let body = s.slice(start, end + 1);
  body = body.replace(/,\s*([}\]])/g, '$1');
  // key không nháy: { abc: -> { "abc":
  body = body.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
  const parsed: unknown = JSON.parse(body);
  if (!isObj(parsed)) throw new Error('Cấu hình cũ không phải object');
  return parsed;
}

function stripComments(src: string): string {
  let out = '';
  let i = 0;
  let inStr: string | null = null;
  while (i < src.length) {
    const c = src[i]!;
    const n = src[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\') { out += n ?? ''; i += 2; continue; }
      if (c === inStr) inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; i++; continue; }
    if (c === '/' && n === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
    if (c === '/' && n === '/') { const e = src.indexOf('\n', i); i = e < 0 ? src.length : e; continue; }
    out += c;
    i++;
  }
  return out;
}
