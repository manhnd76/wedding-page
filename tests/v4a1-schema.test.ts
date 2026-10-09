/** v4a-1 (solution.md Rev 5 mục 10.1, 10.8 #1): schema `theme.motif` - mặc định, sanitize, tương thích config cũ. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mergeWithDefaults } from '@shared/config/merge';
import { CURRENT_SCHEMA_VERSION, migrate, parseLegacyConfigJs } from '@shared/config/migrations';
import { DEFAULT_CONFIG } from '@shared/config/defaults';
import { sanitizeMotifPlacements } from '@shared/theme/parts';
import { labelForPath } from '@shared/config/schema-meta';
import { enumLabel } from '@shared/labels';

const merge = (o: unknown) => mergeWithDefaults(o);
const motifOf = (motif: unknown) => merge({ theme: { motif } });

describe('theme.motif - mặc định', () => {
  it('DEFAULT_CONFIG có theme.motif "theme"/auto; schemaVersion vẫn 1', () => {
    expect(DEFAULT_CONFIG.theme.motif).toEqual({ set: 'theme', placements: 'theme', intensity: 'theme', motion: 'auto' });
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
    expect(merge({}).config.schemaVersion).toBe(1);
  });
  it('config v1 không có theme.motif -> điền mặc định, không cảnh báo', () => {
    const r = merge({ schemaVersion: 1, theme: { preset: 'son-do' } });
    expect(r.config.theme.motif).toEqual(DEFAULT_CONFIG.theme.motif);
    expect(r.warnings.filter((w) => w.includes('motif'))).toEqual([]);
  });
  it('import config v0 (wedding-site) -> theme.motif "theme" (migrator không ghi motif)', () => {
    const legacy = parseLegacyConfigJs(readFileSync(path.join(__dirname, 'fixtures', 'wedding-site-config.js'), 'utf8'));
    const m = migrate(legacy);
    expect(m.fromVersion).toBe(0);
    expect((m.config as { theme?: { motif?: unknown } }).theme?.motif).toBeUndefined();
    const r = merge(m.config);
    expect(r.config.theme.motif).toEqual(DEFAULT_CONFIG.theme.motif);
    expect(r.config.schemaVersion).toBe(1);
  });
  it('giá trị hợp lệ giữ nguyên', () => {
    const r = motifOf({ set: 'none', placements: ['corners', 'band'], intensity: 'strong', motion: 'off' });
    expect(r.config.theme.motif).toEqual({ set: 'none', placements: ['corners', 'band'], intensity: 'strong', motion: 'off' });
    expect(r.warnings).toEqual([]);
    expect(motifOf({ set: 'dong-son' }).config.theme.motif.set).toBe('dong-son');
  });
});

describe('theme.motif - sanitize (sai -> mặc định + warn)', () => {
  it('set / intensity / motion ngoài enum', () => {
    const r = motifOf({ set: 'chu-van', intensity: 'max', motion: 'spin' });
    expect(r.config.theme.motif).toMatchObject({ set: 'theme', intensity: 'theme', motion: 'auto' });
    expect(r.warnings.filter((w) => w.includes('theme.motif'))).toHaveLength(3);
  });
  it('placements: bỏ phần tử lạ, bỏ trùng (giữ thứ tự)', () => {
    const r = motifOf({ placements: ['band', 'xx', 'band', 'corners'] });
    expect(r.config.theme.motif.placements).toEqual(['band', 'corners']);
    expect(r.warnings.some((w) => w.includes('placements'))).toBe(true);
  });
  it('placements: 3 phần tử -> cắt còn 2', () => {
    expect(motifOf({ placements: ['band', 'corners', 'hero'] }).config.theme.motif.placements).toEqual(['band', 'corners']);
  });
  it('placements: có cả pattern + title -> giữ cái đứng trước', () => {
    expect(motifOf({ placements: ['title', 'pattern'] }).config.theme.motif.placements).toEqual(['title']);
    expect(motifOf({ placements: ['pattern', 'band', 'title'] }).config.theme.motif.placements).toEqual(['pattern', 'band']);
  });
  it('placements: rỗng / không phải mảng / chuỗi lạ -> "theme"', () => {
    for (const bad of [[], ['xx'], 'band', 42, { a: 1 }]) {
      const r = motifOf({ placements: bad });
      expect(r.config.theme.motif.placements, JSON.stringify(bad)).toBe('theme');
    }
    // null -> deepMerge giữ mặc định (không cảnh báo)
    expect(motifOf({ placements: null }).config.theme.motif.placements).toBe('theme');
  });
  it('theme.motif không phải object -> mặc định', () => {
    expect(merge({ theme: { motif: 'dong-son' } }).config.theme.motif).toEqual(DEFAULT_CONFIG.theme.motif);
    expect(merge({ theme: { motif: null } }).config.theme.motif).toEqual(DEFAULT_CONFIG.theme.motif);
  });
  it('sanitizeMotifPlacements thuần', () => {
    expect(sanitizeMotifPlacements(['hero', 'hero'])).toEqual(['hero']);
    expect(sanitizeMotifPlacements(['corners', 'title', 'pattern'])).toEqual(['corners', 'title']);
    expect(sanitizeMotifPlacements(undefined)).toEqual([]);
  });
});

describe('nhãn tiếng Việt (diff "Xem thay đổi")', () => {
  it('đường dẫn + giá trị enum', () => {
    expect(labelForPath('theme.motif.set')).toBe('Hoạ tiết nền › Bộ');
    expect(labelForPath('theme.motif.placements[0]')).toBe('Hoạ tiết nền › Vị trí 1');
    expect(enumLabel('theme.motif.set', 'dong-son')).toBe('Trống đồng');
    expect(enumLabel('theme.motif.set', 'none')).toBe('Không dùng');
    expect(enumLabel('theme.motif.placements[1]', 'title')).toBe('Sau tiêu đề');
    expect(enumLabel('theme.motif.intensity', 'light')).toBe('Nhạt');
    expect(enumLabel('theme.motif.motion', 'auto')).toBe('Theo mức hiệu ứng');
  });
});
