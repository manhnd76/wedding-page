import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeWithDefaults } from '@shared/config/merge';
import { planSections } from '@shared/sections/meta';
import { buildState } from '../scripts/vite-plugins/inject-config-og';
import { FONT_PRESET_MAP, FONT_REGISTRY } from '@shared/fonts/registry';
import { buildIcs, eventEnd, googleCalendarUrl } from '@shared/ics';
import { EXCLUSION_MARGIN, SpawnLimiter, approach, insideAny, visibleZones, weightedDensity } from '@guest/effects/particles/geometry';

const ROOT = path.resolve(__dirname, '..');
const SAMPLE = JSON.parse(readFileSync(path.join(ROOT, 'public/content/config.json'), 'utf8')) as Record<string, unknown>;
const withSample = (patch: (c: Record<string, any>) => void) => { const c = structuredClone(SAMPLE) as Record<string, any>; patch(c); return c; };

describe('planSections (solution 5.8, design 4.0)', () => {
  const plan = (patch: (c: Record<string, any>) => void = () => {}) => {
    const c = mergeWithDefaults(withSample(patch)).config;
    return planSections(c, 'ornament');
  };
  it('config mẫu: số thứ tự theo section hiện, bỏ hero/countdown/thankyou/footer', () => {
    const p = plan();
    expect(p.map((x) => x.item.type)).toEqual(['hero', 'couple', 'families', 'announcement', 'events', 'countdown', 'timeline', 'album', 'gift', 'guestbook', 'rsvp', 'thankyou', 'footer']);
    expect(p.filter((x) => x.number).map((x) => `${x.item.type}:${x.number}`)).toEqual([
      'couple:01', 'families:02', 'announcement:03', 'events:04', 'timeline:05', 'album:06', 'gift:07', 'guestbook:08', 'rsvp:09',
    ]);
  });
  it('tắt section -> đánh số lại, nền xen kẽ không bao giờ trùng nhau cạnh nhau', () => {
    const p = plan((c) => { c.sections.items.find((i: any) => i.type === 'families').enabled = false; c.sections.items.find((i: any) => i.type === 'loveStory').enabled = true; });
    expect(p.find((x) => x.item.type === 'announcement')?.number).toBe('02');
    expect(p.find((x) => x.item.type === 'loveStory')?.number).toBe('05');
    const tones = p.filter((x) => x.tone).map((x) => x.tone);
    for (let i = 1; i < tones.length; i++) expect(tones[i]).not.toBe(tones[i - 1]);
    expect(p.find((x) => x.item.type === 'hero')?.tone).toBeNull();
  });
  it('sắp xếp lại giữ hero đầu / footer cuối', () => {
    const p = plan((c) => { c.sections.items.reverse(); });
    expect(p[0]!.item.type).toBe('hero');
    expect(p[p.length - 1]!.item.type).toBe('footer');
    expect(p[1]!.item.type).toBe('thankyou');
  });
  it('section rỗng tự ẩn (album 0 ảnh, gift không STK + không lời nhắn, RSVP không URL + không SĐT)', () => {
    const p = plan((c) => { c.content.album.images = []; c.content.gift.message = ''; c.content.gift.bankAccounts = []; c.content.rsvp.contactPhone = ''; });
    const types = p.map((x) => x.item.type);
    expect(types).not.toContain('album');
    expect(types).not.toContain('gift');
    expect(types).not.toContain('rsvp');
  });
  it('showNumbers=false -> không số; divider không kề section ảnh nền', () => {
    const p = plan((c) => { c.sections.showNumbers = false; });
    expect(p.every((x) => x.number === null)).toBe(true);
    expect(p.find((x) => x.item.type === 'couple')?.dividerBefore).toBe(false); // ngay sau hero
    expect(p.find((x) => x.item.type === 'thankyou')?.dividerBefore).toBe(false);
    expect(p.find((x) => x.item.type === 'families')?.dividerBefore).toBe(true);
    expect(planSections(mergeWithDefaults(SAMPLE).config, 'none').every((x) => !x.dividerBefore)).toBe(true);
  });
});

describe('plugin inject-config-og: sửa config.json -> HTML đổi đúng', () => {
  const st = (patch: (c: Record<string, any>) => void = () => {}) => buildState(ROOT, withSample(patch));
  it('mặc định: Trầm Vàng, 3 family, CSS vars + @font-face, không cảnh báo', () => {
    const s = st();
    expect(s.resolved.preset).toBe('tram-vang');
    expect(s.styleText).toContain('--c-primary:#8A6A3B');
    expect(s.styleText).toContain("font-family:'Great Vibes'");
    expect(new Set(s.fonts.map((f) => f.family))).toEqual(new Set(['Playfair Display', 'Great Vibes', 'Be Vietnam Pro']));
    expect(s.fonts.every((f) => f.url.startsWith('/fonts/') && /\.[0-9a-f]{8}\.woff2$/.test(f.url))).toBe(true);
    expect(s.fonts.filter((f) => f.subset === 'vietnamese').length).toBe(6);
    expect(s.fonts.some((f) => f.subset === 'latin-ext')).toBe(false);
    expect(s.ornament.url).toMatch(/^\/ornaments\/classic-line\.[0-9a-f]{8}\.svg$/);
    expect(s.styleHash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(s.warnings).toEqual([]);
  });
  for (const [id, mode, primary, script] of [['son-do', 'light', '#A3201D', 'Charm'], ['dem-nhung', 'dark', '#D9B77E', 'Imperial Script']] as const) {
    it(`theme ${id}`, () => {
      const s = st((c) => { c.theme.preset = id; });
      expect(s.resolved.mode).toBe(mode);
      expect(s.styleText).toContain(`--c-primary:${primary}`);
      expect(s.fonts.some((f) => f.family === script)).toBe(true);
      expect(s.warnings).toEqual([]);
    });
  }
  for (const fp of Object.keys(FONT_PRESET_MAP) as (keyof typeof FONT_PRESET_MAP)[]) {
    it(`font preset ${fp}`, () => {
      const s = st((c) => { c.fonts.preset = fp; });
      const want = FONT_PRESET_MAP[fp];
      expect(new Set(s.fonts.map((f) => f.family))).toEqual(new Set([want.heading, want.script, want.body].map((id) => FONT_REGISTRY[id].family)));
      expect(s.fonts.every((f) => f.url.includes(FONT_REGISTRY[want.heading].pkg) || f.url.includes(FONT_REGISTRY[want.script].pkg) || f.url.includes(FONT_REGISTRY[want.body].pkg))).toBe(true);
    });
  }
  it('giá trị chưa hỗ trợ -> fallback + chỉ cảnh báo, build không lỗi', () => {
    const s = st((c) => { c.theme.preset = 'bien-dao'; c.cover.openStyle = 'origami'; c.fonts.script = 'moon-dance'; c.sections.divider = 'zigzag'; });
    expect(s.resolved.preset).toBe('tram-vang');
    expect(s.resolved.openStyle).toBe('envelope');
    expect(s.fonts.some((f) => f.family === 'Great Vibes')).toBe(true);
    expect(s.warnings.length).toBe(4);
  });
  it('config JSON chỉ chứa giá trị đã merge (đủ field)', () => {
    const s = st((c) => { delete c.effects; });
    expect(s.config.effects.intensity).toBe('medium');
  });
});

describe('ics', () => {
  const ev = { uid: 'thanh-hon@x', title: 'Lễ Thành Hôn · Minh Anh & Thuỳ Linh', startAt: '2026-12-12T11:30:00+07:00', location: 'Số 200 Trần Duy Hưng, Cầu Giấy', description: 'Thứ Bảy; 12/12' };
  it('DTSTART UTC, DTEND = +3h, nhắc trước 1 ngày, escape , ;', () => {
    const s = buildIcs(ev, new Date('2026-10-07T00:00:00Z'));
    expect(s).toContain('DTSTART:20261212T043000Z');
    expect(s).toContain('DTEND:20261212T073000Z');
    expect(s).toContain('TRIGGER:-P1D');
    expect(s).toContain('LOCATION:Số 200 Trần Duy Hưng\\, Cầu Giấy');
    expect(s).toContain('DESCRIPTION:Thứ Bảy\\; 12/12');
    expect(s.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
  it('endAt có -> dùng endAt; link Google Calendar dự phòng', () => {
    expect(eventEnd('2026-12-12T11:30:00+07:00', '2026-12-12T14:00:00+07:00').toISOString()).toBe('2026-12-12T07:00:00.000Z');
    expect(googleCalendarUrl(ev)).toContain('dates=20261212T043000Z%2F20261212T073000Z');
  });
});

describe('ParticleField - phần tính thuần (4 lớp bảo vệ)', () => {
  it('vùng loại trừ có biên 16px', () => {
    const z = [{ left: 100, top: 100, right: 200, bottom: 200 }];
    expect(insideAny(150, 150, z)).toBe(true);
    expect(insideAny(100 - EXCLUSION_MARGIN, 150, z)).toBe(true);
    expect(insideAny(100 - EXCLUSION_MARGIN - 1, 150, z)).toBe(false);
  });
  it('chỉ vùng trong viewport, tối đa 6 (ưu tiên gần giữa màn)', () => {
    const rects = Array.from({ length: 10 }, (_, i) => ({ left: 0, right: 100, top: i * 100 - 300, bottom: i * 100 - 220 }));
    const v = visibleZones(rects, 400, 800);
    expect(v.length).toBe(6);
    expect(v.every((r) => r.bottom > 0 && r.top < 800)).toBe(true);
  });
  it('mật độ = trung bình có trọng số theo chiều cao đang hiện; scope hero-thankyou', () => {
    const d = weightedDensity([{ visible: 300, density: 1, maxOpacity: 1, group: 'hero-thankyou' }, { visible: 100, density: 0.25, maxOpacity: 0.6, group: 'other' }]);
    expect(d.density).toBeCloseTo(0.8125);
    expect(d.maxOpacity).toBeCloseTo(0.9);
    expect(weightedDensity([{ visible: 400, density: 0.6, maxOpacity: 0.85, group: 'other' }], 'hero-thankyou').density).toBe(0);
    expect(weightedDensity([]).density).toBe(0);
  });
  it('sinh tối đa 2 hạt/giây', () => {
    const l = new SpawnLimiter(2, 0);
    let n = 0;
    for (let i = 0; i < 300; i++) { l.tick(1000 / 60); if (l.take()) n++; }
    expect(n).toBeGreaterThanOrEqual(9);
    expect(n).toBeLessThanOrEqual(10);
  });
  it('fade về 0 trong 200ms khi vào vùng loại trừ', () => {
    let a = 1;
    for (let t = 0; t < 200; t += 16) a = approach(a, 0, 16, 200);
    expect(a).toBeLessThanOrEqual(0.0001);
    expect(approach(1, 0, 100, 200)).toBeCloseTo(0.5);
  });
});
