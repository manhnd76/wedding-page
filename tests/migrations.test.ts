import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { V0_DROPPED_FIELDS, migrate, parseLegacyConfigJs } from '@shared/config/migrations';
import { mergeWithDefaults } from '@shared/config/merge';

const ORIGINAL = 'E:/claudecode/wedding-site/data/config.js';
const FIXTURE = path.join(__dirname, 'fixtures', 'wedding-site-config.js');
const src = existsSync(ORIGINAL) ? ORIGINAL : FIXTURE;
const legacy = parseLegacyConfigJs(readFileSync(src, 'utf8'));
const { config: migrated, fromVersion } = migrate(legacy);
const { config, warnings } = mergeWithDefaults(migrated);

type Obj = Record<string, unknown>;
function leaves(v: unknown, p = ''): [string, unknown][] {
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, `${p}[${i}]`));
  if (v && typeof v === 'object') return Object.entries(v as Obj).flatMap(([k, x]) => leaves(x, p ? `${p}.${k}` : k));
  return [[p, v]];
}
const allValues = new Set(leaves(config).map(([, v]) => (typeof v === 'string' ? v.normalize('NFC') : v)));
const has = (v: unknown) => allValues.has(typeof v === 'string' ? v.normalize('NFC') : v);

/** Field cũ được BIẾN ĐỔI (không giữ nguyên chuỗi) -> kiểm riêng. */
const TRANSFORMED: Record<string, (v: unknown) => boolean> = {
  theme: () => config.theme.preset === 'tram-vang',
  'invitation.day': () => config.cover.dateText === '12 · 12 · 2026',
  'invitation.month': () => config.cover.dateText.includes('12'),
  'invitation.year': () => config.cover.dateText.endsWith('2026'),
  'invitation.guestNameFromUrl': (v) => config.guest.fromUrl === v,
  'events[*].date': () => config.content.events.items.every((e) => /^\d{4}-\d{2}-\d{2}T/.test(e.startAt)),
  'events[*].startTime': () => config.content.events.items[1]!.startAt === '2026-12-12T11:30:00+07:00',
  'events[*].rsvpEnabled': () => config.content.events.items.every((e) => e.rsvpEnabled),
  'album.images[*]': (v) => config.content.album.images.some((im) => im.src === v),
  'gift.showBankInfo': (v) => config.content.gift.showBankInfo === v,
  'vendor.show': (v) => config.content.footer.vendor.show === v,
  'music.enabled': (v) => config.music.enabled === v,
  'music.autoplayAfterOpen': (v) => config.music.autoplayAfterOpen === v,
  'effects.petals.enabled': (v) => config.effects.particles.enabled === v,
  'effects.petals.types[*]': () => JSON.stringify(config.effects.particles.types) === JSON.stringify(['petal-rose', 'heart']),
  'effects.petals.colors[0]': (v) => config.effects.particles.color === v,
  'effects.coverUnlock.unlockAnimation': (v) => config.cover.openStyle === v,
  // decisions 2026-10-08: import v0 luôn bật tự cuộn (giá trị cũ không giữ, có chủ đích)
  'effects.autoScroll.enabled': () => config.effects.autoScroll.enabled === true,
  'effects.autoScroll.speed': (v) => config.effects.autoScroll.speed === v,
  // v2.1: kẹp tối thiểu 1500ms (design-review-v1 5.4: 650 của wedding-site -> 1500)
  'effects.autoScroll.startDelayMs': (v) => config.effects.autoScroll.startDelayMs === Math.max(1500, v as number),
  'guestbook.pollIntervalSeconds': (v) => config.content.guestbook.pollIntervalSec === v,
  'sections.order[*]': (v) => config.sections.items.some((s) => s.type === v && s.enabled),
  'cover.caption': (v) => config.content.hero.image?.alt === v,
};
/** Khớp danh sách V0_DROPPED_FIELDS (field cũ cố ý bỏ, có lý do). */
function isDropped(p: string, generic: string): boolean {
  if (/^effects\.petals\.colors\[[1-9]\d*\]$/.test(p)) return 'effects.petals.colors[1..]' in V0_DROPPED_FIELDS;
  if (generic.startsWith('effects.scrollReveal.')) return 'effects.scrollReveal.*' in V0_DROPPED_FIELDS;
  return generic in V0_DROPPED_FIELDS;
}

describe('migrations v0 -> v1 (wedding-site/data/config.js)', () => {
  it(`đọc được file cũ không dùng eval (${src === ORIGINAL ? 'bản gốc' : 'fixture'})`, () => {
    expect(legacy.theme).toBe('tram-vang');
    expect(fromVersion).toBe(0);
    expect(config.schemaVersion).toBe(1);
  });

  it('không mất dữ liệu: mọi giá trị lá của config cũ có mặt trong config mới (hoặc nằm trong danh sách bỏ có lý do)', () => {
    expect(leaves(legacy).length).toBeGreaterThan(100);
    const missing: string[] = [];
    for (const [p, v] of leaves(legacy)) {
      const generic = p.replace(/\[\d+\]/g, '[*]');
      if (isDropped(p, generic)) continue;
      const t = TRANSFORMED[p] ?? TRANSFORMED[generic];
      if (t) { if (!t(v)) missing.push(`${p} (biến đổi)`); continue; }
      if (v === '' || v === null) continue;
      if (!has(v)) missing.push(`${p} = ${JSON.stringify(v)}`);
    }
    expect(missing).toEqual([]);
  });

  it('ánh xạ chính xác các field quan trọng', () => {
    const c = config.content;
    expect(c.couple.groom.fullName).toBe('Nguyễn Minh Anh');
    expect(c.couple.bride.shortName).toBe('Thuỳ Linh');
    expect(c.couple.groom.photo).toMatchObject({ src: 'images/couple/groom.jpg', alt: 'Nguyễn Minh Anh' });
    expect(c.families.groom.father).toBe('Nguyễn Văn Bình');
    expect(c.families.bride.address).toBe('Số 45 Đường Láng, Đống Đa, Hà Nội');
    expect(c.events.items).toHaveLength(2);
    expect(c.events.mainEventId).toBe('thanh-hon');
    expect(c.events.items[0]).toMatchObject({ id: 'an-hoi', startAt: '2026-12-10T08:30:00+07:00', welcomeTime: '08:00', lunarText: 'Tức ngày 1 tháng 11 năm Bính Ngọ', mapEmbedUrl: '' });
    expect(c.countdown.targetAt).toBe('2026-12-12T11:30:00+07:00');
    expect(c.album.images).toHaveLength(8);
    expect(c.gift.bankAccounts.map((b) => b.bankBin)).toEqual(['970436', '970407']);
    expect(c.gift.bankAccounts.map((b) => b.role)).toEqual(['Chú rể', 'Cô dâu']);
    expect(c.thankyou.signature).toBe('Minh Anh & Thuỳ Linh');
    expect(c.footer.vendor).toMatchObject({ show: true, name: 'Thiệp Cưới Của Bạn', phone: '0900000000' });
    expect(c.hero.image?.src).toBe('images/cover/cover.jpg');
    expect(config.cover.monogram).toBe('M & L');
    expect(config.cover.openedSubline).toContain('một lời hẹn trọn đời');
    expect(config.guest).toMatchObject({ queryParam: 'to', pathPrefix: 'invite', fallbackName: 'Quý khách', template: '{name}' });
    expect(config.meta.siteUrl).toBe('https://vidu.vn/thiep/minh-anh-thuy-linh');
    expect(config.music.src).toBe('assets/audio/wedding-song.mp3');
  });

  it('sections: thứ tự cũ giữ, hero đầu, footer cuối, loveStory tắt', () => {
    const types = config.sections.items.map((s) => s.type);
    expect(types[0]).toBe('hero');
    expect(types[types.length - 1]).toBe('footer');
    expect(types.slice(1, 6)).toEqual(['couple', 'families', 'announcement', 'events', 'album']);
    expect(config.sections.items.find((s) => s.type === 'loveStory')?.enabled).toBe(false);
    expect(config.sections.items.find((s) => s.type === 'footer')?.enabled).toBe(true);
  });

  it('theme cũ xanh-ngoc / xanh-navy -> luc-bao; id lạ -> tram-vang + warning', () => {
    for (const [o, n] of [['xanh-ngoc', 'luc-bao'], ['xanh-navy', 'luc-bao'], ['hong-phan', 'hong-phan']] as const) {
      expect(mergeWithDefaults(migrate({ theme: o }).config).config.theme.preset).toBe(n);
    }
    const m = migrate({ theme: 'tim-mong-mo' });
    expect(mergeWithDefaults(m.config).config.theme.preset).toBe('tram-vang');
    expect(m.warnings.join()).toContain('tim-mong-mo');
  });

  it('petals.enabled=false -> particles.enabled=false; type cũ -> type mới; coverUnlock tắt -> openStyle none', () => {
    const c = mergeWithDefaults(migrate({ effects: { petals: { enabled: false, types: ['leaf', 'snow-dot'] }, coverUnlock: { enabled: false } } }).config).config;
    expect(c.effects.particles.enabled).toBe(false);
    expect(c.effects.particles.types).toEqual(['leaf-green', 'snow']);
    expect(c.cover.openStyle).toBe('none');
  });

  it('config đã là v1 thì giữ nguyên', () => {
    const r = migrate({ schemaVersion: 1, theme: { preset: 'son-do' } });
    expect(r.fromVersion).toBe(1);
    expect(r.config).toEqual({ schemaVersion: 1, theme: { preset: 'son-do' } });
  });

  it('không có warning lỗi enum khi merge config đã migrate', () => {
    expect(warnings).toEqual([]);
  });

  it('parseLegacyConfigJs chịu comment, dấu phẩy thừa, key không nháy, URL có //', () => {
    const o = parseLegacyConfigJs(`// x\nwindow.WEDDING_CONFIG = { /* a */ theme: "son-do", site: { canonicalUrl: "https://a.b/c", }, list: [1,2,], };`);
    expect(o).toEqual({ theme: 'son-do', site: { canonicalUrl: 'https://a.b/c' }, list: [1, 2] });
  });
});
