/**
 * v2.2 - sửa UX admin (design-review-admin-v2):
 * A02 trạng thái xuất bản không nói sai (chưa từng xuất bản / chế độ không kết nối),
 * A07 mọi giá trị enum có nhãn tiếng Việt, "Theo theme (…)" ghi đúng cái khách thấy, diff không lộ mã thô.
 */
import { describe, expect, it } from 'vitest';
import {
  BURSTS_ON_OPEN, COUNTDOWN_STYLES, DIVIDERS, ENVELOPE_STYLES, INTENSITIES, OPEN_STYLES, ORNAMENT_SETS, PARTICLE_TYPES,
  PHOTO_FRAMES, REVEAL_ATOMS, REVEAL_STYLES, TEXTURES, THEME_IDS,
} from '../src/shared/config/enums';
import { mergeWithDefaults } from '../src/shared/config/merge';
import {
  BURST_LABEL, COUNTDOWN_STYLE_LABEL, DIVIDER_LABEL, ENVELOPE_STYLE_LABEL, INTENSITY_LABEL, OPEN_STYLE_LABEL, ORNAMENT_LABEL,
  PARTICLE_LABEL, PHOTO_FRAME_LABEL, REVEAL_ATOM_LABEL, REVEAL_LABEL, TEXTURE_LABEL, THEME_LABEL, capLabel, enumLabel, followThemeLabel,
} from '../src/shared/labels';
import { diffConfigs } from '../src/admin/draft/diff';
import { ENVELOPE_META } from '../src/shared/envelope';
import { statusOf } from '../src/admin/editor/status';
import type { EditorState } from '../src/admin/state/store';
import type { WeddingConfig } from '../src/shared/config/types';

const cfg = (at = ''): WeddingConfig => {
  const c = mergeWithDefaults({}).config;
  c.publish = { id: at ? 'p1' : '', at };
  return c;
};
type S = Parameters<typeof statusOf>[0];
const st = (o: Partial<EditorState> & { kind?: 'github' | 'download' | 'dev' } = {}): S => {
  const published = o.published ?? cfg();
  return {
    busy: null, error: null, save: 'idle', live: null, lastPublishAt: null, exported: null,
    adapter: { kind: o.kind ?? 'github', label: 'x' } as unknown as EditorState['adapter'],
    published, draft: o.draft ?? published,
    ...o,
  } as S;
};

describe('A02 statusOf: không bao giờ ghi "Đã xuất bản" khi chưa xuất bản', () => {
  it('github, chưa từng xuất bản (publish.at rỗng)', () => {
    expect(statusOf(st(), 0)).toEqual({ text: 'Chưa xuất bản lần nào', tone: 'clean' });
    expect(statusOf(st(), 3).text).toBe('Chưa xuất bản lần nào · 3 thay đổi trong nháp');
    expect(statusOf(st(), 3).tone).toBe('dirty');
  });
  it('github, đã xuất bản', () => {
    const s = st({ published: cfg('2026-10-08T07:32:00Z') });
    expect(statusOf(s, 0).text).toMatch(/^Đã xuất bản · 14:32, 08\/10\/2026$/);
    expect(statusOf(s, 2).text).toBe('Có 2 thay đổi chưa xuất bản');
    expect(statusOf({ ...s, live: { publishId: 'p1', state: 'waiting', since: 0 } }, 0).text).toBe('Đã xuất bản! Khách sẽ thấy sau khoảng 1 phút');
  });
  it('chế độ không kết nối: "Nháp trên máy này" / "chưa tải gói" / "Đã tải gói"', () => {
    const pub = cfg('2026-10-08T07:32:00Z'); // kể cả config mẫu có publish.at -> chế độ này vẫn không "Đã xuất bản"
    expect(statusOf(st({ kind: 'download', published: pub }), 0)).toEqual({ text: 'Nháp trên máy này', tone: 'clean' });
    expect(statusOf(st({ kind: 'download' }), 4).text).toBe('Có 4 thay đổi chưa tải gói');
    const draft = cfg();
    const s = st({ kind: 'download', draft, exported: { at: '2026-10-08T07:32:00Z', draft } });
    expect(statusOf(s, 4).text).toMatch(/^Đã tải gói xuất bản · 14:32/);
    // sửa tiếp sau khi tải gói -> lại "chưa tải gói"
    expect(statusOf({ ...s, draft: cfg() }, 5).text).toBe('Có 5 thay đổi chưa tải gói');
  });
  it('bận / lỗi / đang lưu được ưu tiên', () => {
    expect(statusOf(st({ busy: { kind: 'publish', done: 1, total: 3 } }), 1).text).toBe('Đang xuất bản… (1/3 tệp)');
    expect(statusOf(st({ kind: 'download', busy: { kind: 'publish', done: 0, total: 1 } }), 1).text).toBe('Đang tạo gói…');
    expect(statusOf(st({ save: 'saving' }), 1).text).toBe('Đang lưu nháp…');
    expect(statusOf(st({ error: { message: 'Mất mạng' } as EditorState['error'] }), 0)).toEqual({ text: 'Lỗi: Mất mạng', tone: 'err' });
  });
});

describe('A07 nhãn tiếng Việt cho mọi enum', () => {
  const tables: [string, readonly string[], Record<string, string>][] = [
    ['theme', THEME_IDS, THEME_LABEL], ['openStyle', OPEN_STYLES, OPEN_STYLE_LABEL], ['envelope', ENVELOPE_STYLES, ENVELOPE_STYLE_LABEL],
    ['particle', PARTICLE_TYPES, PARTICLE_LABEL], ['burst', BURSTS_ON_OPEN, BURST_LABEL], ['reveal', REVEAL_STYLES, REVEAL_LABEL],
    ['revealAtom', [...REVEAL_ATOMS, 'none'], REVEAL_ATOM_LABEL], ['ornament', ORNAMENT_SETS, ORNAMENT_LABEL], ['texture', TEXTURES, TEXTURE_LABEL],
    ['photoFrame', PHOTO_FRAMES, PHOTO_FRAME_LABEL], ['divider', DIVIDERS, DIVIDER_LABEL], ['countdown', COUNTDOWN_STYLES, COUNTDOWN_STYLE_LABEL],
    ['intensity', INTENSITIES, INTENSITY_LABEL],
  ];
  it.each(tables)('%s: đủ nhãn, không nhãn nào là mã thô', (_n, ids, labels) => {
    for (const id of ids) {
      const l = labels[id];
      expect(l, id).toBeTruthy();
      expect(l, id).not.toBe(id);
      expect(l, id).not.toMatch(/\b[a-z]+-[a-z]+\b/); // không lộ kebab-case
    }
  });
  it('"Theo theme (…)" ghi đúng cái khách thấy khi theme gợi ý kiểu chưa có', () => {
    expect(followThemeLabel(OPEN_STYLE_LABEL, 'envelope', 'envelope')).toBe('Theo theme (Phong bì)');
    expect(followThemeLabel(OPEN_STYLE_LABEL, 'scroll', 'envelope')).toBe('Theo theme (Phong bì · Cuộn thư sẽ có ở bản sau)');
    expect(followThemeLabel(BURST_LABEL, 'red-paper', 'petals')).toBe('Theo theme (Cánh hoa · Pháo giấy đỏ sẽ có ở bản sau)');
    // v4a-2c bật đủ 21 loại hạt -> không còn hậu tố; hậu tố vẫn đúng cho giá trị chưa bật (gói reveal của 2a)
    expect(capLabel('particle', PARTICLE_LABEL, 'red-paper')).toBe('Giấy đỏ');
    expect(capLabel('revealStyle', REVEAL_LABEL, 'cinematic')).toBe('Điện ảnh (sẽ có ở bản sau)');
    expect(capLabel('particle', PARTICLE_LABEL, 'petal-peach')).toBe('Hoa đào');
  });
  it('tên mẫu phong bì khớp ENVELOPE_META (một nguồn hiển thị)', () => {
    for (const id of ENVELOPE_STYLES) expect(ENVELOPE_STYLE_LABEL[id]).toBe(ENVELOPE_META[id].name);
  });
  it('enumLabel theo đường dẫn; "theme" -> "Theo theme"', () => {
    expect(enumLabel('cover.openStyle', 'card-flip')).toBe('Lật thiệp');
    expect(enumLabel('cover.envelope.style', 'song-hy')).toBe('Phong bì đỏ Song Hỷ');
    expect(enumLabel('effects.burst.onOpen', 'theme')).toBe('Theo theme');
    expect(enumLabel('meta.title', 'abc')).toBeUndefined();
  });
  it('diff "Xem thay đổi" dùng nhãn, không lộ mã', () => {
    const a = cfg();
    const b = cfg();
    b.cover.openStyle = 'card-flip';
    b.effects.particles.types = ['gold-dust', 'firefly'];
    b.cover.envelope.style = 'song-hy';
    b.sections.divider = 'deco-fan';
    const text = diffConfigs(a, b).map((d) => d.text).join('\n');
    expect(text).toContain('Kiểu mở thiệp: Theo theme thành Lật thiệp');
    expect(text).toContain('Bụi vàng, Đom đóm');
    expect(text).toContain('Phong bì đỏ Song Hỷ');
    expect(text).toContain('Đường phân cách: Theo theme thành Quạt Deco');
    expect(text).not.toMatch(/card-flip|gold-dust|song-hy|deco-fan|"theme"/);
  });
});
