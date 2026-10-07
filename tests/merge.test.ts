import { describe, expect, it } from 'vitest';
import { deepMerge, mergeWithDefaults, normalizeSectionItems } from '@shared/config/merge';
import { DEFAULT_CONFIG } from '@shared/config/defaults';

describe('merge (solution 5.1)', () => {
  it('object merge sâu, mảng THAY THẾ', () => {
    const r = deepMerge({ a: { b: 1, c: 2 }, l: [1, 2, 3] }, { a: { c: 9 }, l: [7] });
    expect(r).toEqual({ a: { b: 1, c: 9 }, l: [7] });
  });
  it('undefined bỏ qua; null giữ khi mặc định là null; khác kiểu -> giữ mặc định', () => {
    expect(deepMerge({ x: null as string | null, y: 'a', z: 1 }, { x: 'k', y: undefined, z: 'sai' })).toEqual({ x: 'k', y: 'a', z: 1 });
    expect(deepMerge({ s: 'abc' }, { s: null })).toEqual({ s: 'abc' });
  });
  it('không đổi object mặc định (immutable)', () => {
    const before = JSON.stringify(DEFAULT_CONFIG);
    mergeWithDefaults({ theme: { preset: 'son-do' }, content: { album: { images: [{ src: 'a.webp', w: 1, h: 1, alt: '' }] } } });
    expect(JSON.stringify(DEFAULT_CONFIG)).toBe(before);
  });
  it('config rỗng -> đúng mặc định', () => {
    const { config, warnings } = mergeWithDefaults({});
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warnings).toEqual([]);
  });
  it('enum không hợp lệ -> mặc định + warning', () => {
    const { config, warnings } = mergeWithDefaults({
      theme: { preset: 'cau-vong', primaryColor: 'red', texture: 'gỗ', overrides: { accent: '#abcdef', bogus: '#000000', bg: 'xanh' } },
      effects: { intensity: 'max', particles: { types: ['heart', 'heart', 'unicorn', 'snow', 'sparkle'], color: 'tim', scope: 'nowhere' }, reveal: { heading: 'spin', ornament: 'parallax-layers' } },
      cover: { openStyle: 'rocket' },
      sections: { divider: 'zigzag' },
      content: { countdown: { style: 'digital' }, album: { layout: 'wall' } },
    });
    expect(config.theme.preset).toBe('tram-vang');
    expect(config.theme.primaryColor).toBeNull();
    expect(config.theme.texture).toBe('theme');
    expect(config.theme.overrides).toEqual({ accent: '#abcdef' });
    expect(config.effects.intensity).toBe('medium');
    expect(config.effects.particles.types).toEqual(['heart', 'snow']);
    expect(config.effects.particles.color).toBe('theme');
    expect(config.effects.particles.scope).toBe('all');
    expect(config.effects.reveal.heading).toBeNull();
    expect(config.effects.reveal.ornament).toBeNull();
    expect(config.cover.openStyle).toBe('theme');
    expect(config.sections.divider).toBe('theme');
    expect(config.content.countdown.style).toBe('flip');
    expect(config.content.album.layout).toBe('masonry');
    expect(warnings.length).toBeGreaterThanOrEqual(12);
  });
  it('phần tử mảng được bù field thiếu theo mẫu', () => {
    const { config } = mergeWithDefaults({ content: { events: { items: [{ name: 'Tiệc', startAt: '2026-12-12T18:00:00+07:00' }] }, gift: { bankAccounts: [{ accountNumber: '123' }] } } });
    expect(config.content.events.items[0]).toMatchObject({ id: 'event-1', name: 'Tiệc', mapUrl: '', rsvpEnabled: true, addToCalendar: true, image: null });
    expect(config.content.gift.bankAccounts[0]).toMatchObject({ accountNumber: '123', bankBin: '', qrImage: null });
  });
  it('ảnh album thiếu src bị loại', () => {
    const { config } = mergeWithDefaults({ content: { album: { images: [{ src: '' }, null, { src: 'a.webp', w: 10, h: 10, alt: 'x' }] } } });
    expect(config.content.album.images).toHaveLength(1);
  });
  it('sections: hero đầu, footer cuối, bỏ type lạ + trùng, thêm hero/footer nếu thiếu', () => {
    const w: string[] = [];
    const items = normalizeSectionItems([
      { id: 'album', type: 'album', enabled: true }, { id: 'footer', type: 'footer' }, { id: 'x', type: 'vendor' },
      { id: 'album', type: 'album' }, { id: 'rsvp', type: 'rsvp', enabled: false },
    ], w);
    expect(items.map((i) => `${i.type}:${i.enabled}`)).toEqual(['hero:true', 'album:true', 'rsvp:false', 'footer:true']);
    expect(w).toHaveLength(2);
  });
  it('giá trị số bị kẹp trong biên', () => {
    const { config } = mergeWithDefaults({ content: { rsvp: { maxGuests: 99 }, guestbook: { pageSize: 0 } }, guest: { maxLength: 5 } });
    expect(config.content.rsvp.maxGuests).toBe(20);
    expect(config.content.guestbook.pageSize).toBe(1);
    expect(config.guest.maxLength).toBe(10);
  });
});

describe('NFC', () => {
  it('mọi chuỗi trong config được chuẩn hoá NFC', () => {
    const nfd = 'Nguyễn Thuỳ Linh'.normalize('NFD');
    const { config } = mergeWithDefaults({ content: { couple: { bride: { fullName: nfd } }, timeline: { items: [{ label: nfd }] } } });
    expect(config.content.couple.bride.fullName).toBe('Nguyễn Thuỳ Linh'.normalize('NFC'));
    expect(config.content.timeline.items[0]!.label).toBe('Nguyễn Thuỳ Linh'.normalize('NFC'));
  });
});
