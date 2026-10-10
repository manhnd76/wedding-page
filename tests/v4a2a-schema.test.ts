/** v4a-2a (solution-v4a-2a.md 1.1-1.6, 4.4): schema `effects.reveal.mode/sections`, resolve, ops, nhãn, diff, checklist. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mergeWithDefaults } from '@shared/config/merge';
import { CURRENT_SCHEMA_VERSION, migrate, parseLegacyConfigJs } from '@shared/config/migrations';
import { DEFAULT_CONFIG } from '@shared/config/defaults';
import { REVEAL_PACKS, resolveTheme } from '@shared/theme/resolve';
import { CAPABILITIES } from '@shared/capabilities';
import { labelForPath } from '@shared/config/schema-meta';
import { REVEAL_MODE_LABEL, enumLabel } from '@shared/labels';
import { changeTheme, customizedGroups, resetGroup } from '../src/admin/draft/ops';
import { diffConfigs } from '../src/admin/draft/diff';
import { runChecklist } from '../src/admin/draft/checklist';

const merge = (o: unknown) => mergeWithDefaults(o);
const reveal = (r: unknown) => merge({ effects: { reveal: r } });

describe('schema - mặc định + tương thích', () => {
  it('mặc định mode auto, sections {}; schemaVersion vẫn 1', () => {
    expect(DEFAULT_CONFIG.effects.reveal).toMatchObject({ mode: 'auto', sections: {} });
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
    const r = merge({});
    expect(r.config.effects.reveal.mode).toBe('auto');
    expect(r.config.effects.reveal.sections).toEqual({});
    expect(r.config.schemaVersion).toBe(1);
    expect(r.warnings).toEqual([]);
  });
  it('config v1 thiếu field -> mặc định, không cảnh báo', () => {
    const r = merge({ schemaVersion: 1, effects: { reveal: { style: 'editorial' } } });
    expect(r.config.effects.reveal).toMatchObject({ style: 'editorial', mode: 'auto', sections: {} });
    expect(r.warnings).toEqual([]);
  });
  it('import v0 (wedding-site) -> mặc định', () => {
    const legacy = parseLegacyConfigJs(readFileSync(path.join(__dirname, 'fixtures', 'wedding-site-config.js'), 'utf8'));
    const r = merge(migrate(legacy).config);
    expect(r.config.effects.reveal).toMatchObject({ mode: 'auto', sections: {} });
    expect(r.config.schemaVersion).toBe(1);
  });
});

describe('schema - sanitize', () => {
  it('mode lạ -> auto + cảnh báo; uniform giữ', () => {
    const r = reveal({ mode: 'random' });
    expect(r.config.effects.reveal.mode).toBe('auto');
    expect(r.warnings.some((w) => w.includes('effects.reveal.mode'))).toBe(true);
    expect(reveal({ mode: 'uniform' }).config.effects.reveal.mode).toBe('uniform');
  });
  it('sections là mảng/chuỗi/null -> {} (mảng/chuỗi có cảnh báo)', () => {
    for (const v of [['couple'], 'couple']) {
      const r = reveal({ sections: v });
      expect(r.config.effects.reveal.sections).toEqual({});
      expect(r.warnings.some((w) => w.includes('effects.reveal.sections'))).toBe(true);
    }
    const n = reveal({ sections: null });
    expect(n.config.effects.reveal.sections).toEqual({});
    expect(n.warnings).toEqual([]);
  });
  it('khoá không có trong sections.items và giá trị lạ bị bỏ + cảnh báo; hợp lệ giữ', () => {
    const r = reveal({ sections: { couple: 'letter', ghost: 'soft', families: 'spin', album: 'theme' } });
    expect(r.config.effects.reveal.sections).toEqual({ couple: 'letter' });
    expect(r.warnings.some((w) => w.includes('sections.ghost') && w.includes('không có phần này'))).toBe(true);
    expect(r.warnings.some((w) => w.includes('sections.families'))).toBe(true);
    expect(r.warnings.some((w) => w.includes('sections.album'))).toBe(true);
  });
  it('ghim của section đang tắt được giữ', () => {
    const r = merge({ effects: { reveal: { sections: { loveStory: 'playful' } } } });
    expect(r.config.sections.items.find((x) => x.id === 'loveStory')!.enabled).toBe(false);
    expect(r.config.effects.reveal.sections).toEqual({ loveStory: 'playful' });
  });
  it('khoá __proto__ không làm bẩn prototype', () => {
    const r = merge(JSON.parse('{"effects":{"reveal":{"sections":{"__proto__":{"x":1},"couple":"soft"}}}}'));
    expect(Object.getPrototypeOf(r.config.effects.reveal.sections)).toBe(Object.prototype);
    expect(r.config.effects.reveal.sections).toEqual({ couple: 'soft' });
  });
});

describe('resolveTheme - reveal', () => {
  it('Trầm Vàng mặc định: field cũ không đổi + mode/overrides/pins/harmony', () => {
    const r = resolveTheme(merge({}).config);
    expect(r.reveal).toEqual({
      style: 'soft', mode: 'auto', heading: 'fade-up', block: 'fade-up', image: 'photo-settle', ornament: 'svg-draw', stagger: 80,
      overrides: { heading: null, block: null, image: null, ornament: null }, pins: {}, harmony: ['soft', 'editorial', 'letter'],
    });
    expect(r.warnings).toEqual([]);
  });
  it('4 gói mới + 6 nguyên tử đã bật: không cảnh báo', () => {
    for (const style of ['editorial', 'letter', 'playful', 'cinematic'] as const) {
      const r = resolveTheme(merge({ effects: { reveal: { style, sections: { couple: style } } } }).config);
      expect(r.reveal.style).toBe(style);
      expect(r.reveal.pins).toEqual({ couple: style });
      expect(r.warnings).toEqual([]);
    }
    for (const atom of ['mask-up', 'wipe', 'blur-in', 'split-words', 'split-chars'] as const) {
      const r = resolveTheme(merge({ effects: { reveal: { heading: atom } } }).config);
      expect(r.reveal.heading).toBe(atom);
      expect(r.reveal.overrides.heading).toBe(atom);
      expect(r.warnings).toEqual([]);
    }
    const p = resolveTheme(merge({ effects: { reveal: { image: 'parallax-layers' } } }).config);
    expect(p.reveal.overrides.image).toBe('parallax-layers');
    expect(CAPABILITIES.countdownStyle.supported).toEqual(expect.arrayContaining(['flip', 'simple', 'slide', 'odometer']));
  });
  it('overrides tách riêng; field cũ = gói A đã áp ghi đè', () => {
    const r = resolveTheme(merge({ effects: { reveal: { style: 'editorial', block: 'zoom-in' } } }).config);
    expect(r.reveal.overrides).toEqual({ heading: null, block: 'zoom-in', image: null, ornament: null });
    expect(r.reveal.block).toBe('zoom-in');
    expect(r.reveal.heading).toBe(REVEAL_PACKS.editorial.heading);
    expect(r.reveal.harmony).toEqual(['editorial', 'letter', 'soft']);
  });
  it('mode uniform đi qua resolve', () => {
    expect(resolveTheme(merge({ effects: { reveal: { mode: 'uniform' } } }).config).reveal.mode).toBe('uniform');
  });
});

describe('ops - nhóm reveal khi đổi theme', () => {
  const base = merge({}).config;
  it('customizedGroups bật bởi từng loại field', () => {
    expect(customizedGroups(base)).not.toContain('reveal');
    const mk = (r: object) => ({ ...base, effects: { ...base.effects, reveal: { ...base.effects.reveal, ...r } } });
    for (const r of [{ style: 'letter' }, { mode: 'uniform' }, { sections: { couple: 'soft' } }, { heading: 'wipe' }]) {
      expect(customizedGroups(mk(r) as typeof base), JSON.stringify(r)).toContain('reveal');
    }
  });
  it('resetGroup("reveal") đặt đủ 7 field', () => {
    const c = merge({ effects: { reveal: { style: 'letter', mode: 'uniform', sections: { couple: 'soft' }, heading: 'wipe' } } }).config;
    expect(resetGroup(c, 'reveal').effects.reveal).toEqual({ style: 'theme', mode: 'auto', sections: {}, heading: null, block: null, image: null, ornament: null });
  });
  it('changeTheme keep giữ ghim; full xoá', () => {
    const c = merge({ effects: { reveal: { sections: { couple: 'editorial' } } } }).config;
    expect(changeTheme(c, 'son-do').effects.reveal.sections).toEqual({ couple: 'editorial' });
    expect(changeTheme(c, 'son-do', 'full').effects.reveal.sections).toEqual({});
  });
});

describe('nhãn + diff + checklist', () => {
  it('REVEAL_MODE_LABEL, enumLabel, labelForPath', () => {
    expect(REVEAL_MODE_LABEL).toEqual({ auto: 'Xen kẽ tự động', uniform: 'Giống nhau mọi phần' });
    expect(enumLabel('effects.reveal.mode', 'uniform')).toBe('Giống nhau mọi phần');
    expect(enumLabel('effects.reveal.sections.families', 'editorial')).toBe('Tạp chí');
    expect(labelForPath('effects.reveal.mode')).toBe('Cách áp dụng hiện nội dung');
    expect(labelForPath('effects.reveal.sections')).toBe('Kiểu hiện từng phần');
    expect(labelForPath('effects.reveal.sections.families')).toMatch(/^Kiểu hiện · /);
    expect(labelForPath('effects.reveal.sections.families')).not.toContain('families');
  });
  it('diff ghim đầu tiên: 1 dòng có nhãn, không có dòng "xoá {}"', () => {
    const a = merge({}).config;
    const b = merge({ effects: { reveal: { sections: { families: 'editorial' } } } }).config;
    const d = diffConfigs(a, b);
    expect(d.map((x) => x.text)).toEqual([expect.stringMatching(/^Kiểu hiện · .+: thêm Tạp chí$/)]);
    expect(diffConfigs(b, a).map((x) => x.text)).toEqual([expect.stringMatching(/: xoá Tạp chí$/)]);
  });
  it('checklist: ghim Điện ảnh + light-gather + Nhiều -> cảnh báo tổ hợp nặng', () => {
    const heavy = (style: string, sections: object) => runChecklist(merge({
      cover: { openStyle: 'light-gather' }, effects: { intensity: 'high', reveal: { style, sections } },
    }).config).some((i) => i.message.includes('Tổ hợp hiệu ứng khá nặng'));
    expect(heavy('soft', {})).toBe(false);
    expect(heavy('soft', { thankyou: 'cinematic' })).toBe(true);
    expect(heavy('cinematic', {})).toBe(true);
  });
});
