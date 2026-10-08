/**
 * v2.1: field schema mới `cover.envelope` + `effects.autoScroll.{mode,dwellMs}` (design-review-v1 4.3, 5.4).
 * Chỉ thêm field có mặc định -> không bump schemaVersion; config cũ được merge mặc định.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '@shared/config/defaults';
import { ENVELOPE_STYLES, THEME_IDS } from '@shared/config/enums';
import { mergeWithDefaults } from '@shared/config/merge';
import { migrate } from '@shared/config/migrations';
import { labelForPath } from '@shared/config/schema-meta';
import { CAPABILITIES } from '@shared/capabilities';
import { contrast } from '@shared/theme/contrast';
import { PRESETS } from '@shared/theme/presets';
import { envelopeFixed, inkOn, resolveTheme } from '@shared/theme/resolve';
import { ENVELOPE_FIXED_PALETTE, ENVELOPE_META, envelopeGeom } from '@shared/envelope';
import { cardTravel } from '@guest/cover/styles/envelope';

const merged = (patch: unknown) => mergeWithDefaults(migrate(patch).config);

describe('cover.envelope - mặc định, enum, merge', () => {
  it('mặc định: style "theme", color "auto", in tên khách trên phong bì, có lót', () => {
    expect(DEFAULT_CONFIG.cover.envelope).toEqual({ style: 'theme', color: 'auto', guestOnFront: true, liner: true });
    expect(DEFAULT_CONFIG.schemaVersion).toBe(1);
  });

  it('config v1 cũ (không có cover.envelope) -> merge mặc định, không cảnh báo, schemaVersion vẫn 1', () => {
    const { config, warnings } = merged({ schemaVersion: 1, cover: { openStyle: 'envelope' } });
    expect(config.cover.envelope).toEqual(DEFAULT_CONFIG.cover.envelope);
    expect(config.schemaVersion).toBe(1);
    expect(warnings).toEqual([]);
  });

  it('6 mẫu hợp lệ + "theme"; giá trị lạ -> mặc định + cảnh báo', () => {
    expect(ENVELOPE_STYLES).toEqual(['classic', 'kraft', 'song-hy', 'lace', 'minimal', 'velvet']);
    for (const s of ['theme', ...ENVELOPE_STYLES]) expect(merged({ schemaVersion: 1, cover: { envelope: { style: s } } }).config.cover.envelope.style).toBe(s);
    const bad = merged({ schemaVersion: 1, cover: { envelope: { style: 'airmail', color: 'red' } } });
    expect(bad.config.cover.envelope.style).toBe('theme');
    expect(bad.config.cover.envelope.color).toBe('auto');
    expect(bad.warnings.some((w) => w.includes('cover.envelope.style'))).toBe(true);
    expect(bad.warnings.some((w) => w.includes('cover.envelope.color'))).toBe(true);
  });

  it('color: "auto" | "theme" | hex', () => {
    expect(merged({ schemaVersion: 1, cover: { envelope: { color: 'theme' } } }).config.cover.envelope.color).toBe('theme');
    expect(merged({ schemaVersion: 1, cover: { envelope: { color: '#F2E6D0' } } }).config.cover.envelope.color).toBe('#F2E6D0');
  });

  it('capabilities có đủ 6 mẫu; nhãn diff cho admin', () => {
    expect([...CAPABILITIES.envelopeStyle.supported].sort()).toEqual([...ENVELOPE_STYLES].sort());
    expect(labelForPath('cover.envelope.style')).toBe('Mẫu phong bì');
    expect(labelForPath('effects.autoScroll.mode')).toBe('Dừng ngắn ở mỗi phần');
  });
});

describe('preset registry: map gợi ý mẫu phong bì theo 12 theme (design-review-v1 4.4)', () => {
  const MAP: Record<string, string> = {
    'tram-vang': 'classic', 'hong-phan': 'lace', 'luc-bao': 'classic', 'son-do': 'song-hy', 'muc-giay': 'minimal', 'hoai-co': 'kraft',
    'sen-cham': 'classic', 'mau-nuoc': 'lace', 'dat-nung': 'kraft', 'pastel-han': 'lace', 'dem-nhung': 'velvet', 'bien-dao': 'minimal',
  };
  it('đủ 12 theme', () => {
    for (const id of THEME_IDS) expect(PRESETS[id].suggest.envelopeStyle, id).toBe(MAP[id]);
  });
});

describe('resolve: mẫu phong bì + màu', () => {
  const cfg = (patch: Record<string, unknown>) => merged({ schemaVersion: 1, ...patch }).config;

  it('"theme" -> mẫu gợi ý của preset (chỉ những theme đã bật trong capabilities)', () => {
    for (const id of CAPABILITIES.theme.supported) {
      expect(resolveTheme(cfg({ theme: { preset: id } })).envelope.style, id).toBe(PRESETS[id].suggest.envelopeStyle);
    }
  });

  it('kraft / song-hy / velvet (theme sáng) giữ màu cố định khi color = auto; "theme" thì nhuộm theo theme', () => {
    const light = 'tram-vang';
    for (const s of ['kraft', 'song-hy', 'velvet'] as const) {
      expect(resolveTheme(cfg({ theme: { preset: light }, cover: { envelope: { style: s } } })).envelope.themed, s).toBe(false);
      expect(resolveTheme(cfg({ theme: { preset: light }, cover: { envelope: { style: s, color: 'theme' } } })).envelope.themed, s).toBe(true);
    }
    for (const s of ['classic', 'lace', 'minimal'] as const) {
      expect(resolveTheme(cfg({ theme: { preset: light }, cover: { envelope: { style: s } } })).envelope.themed, s).toBe(true);
    }
    // velvet theo theme khi mode = dark
    expect(envelopeFixed('velvet', 'dark')).toBe(false);
    expect(resolveTheme(cfg({ theme: { preset: 'dem-nhung' } })).envelope).toMatchObject({ style: 'velvet', themed: true });
  });

  it('màu giấy tự chọn (hex): mực đen/trắng tự chọn, tương phản ≥ 4.5:1', () => {
    for (const paper of ['#FFFFFF', '#F2E6D0', '#A3201D', '#1C1517', '#2F4A43', '#C9A86A']) {
      const r = resolveTheme(cfg({ cover: { envelope: { color: paper } } }));
      expect(r.envelope.paper).toBe(paper);
      expect(r.envelope.ink).toBe(inkOn(paper));
      expect(contrast(r.envelope.ink!, paper), paper).toBeGreaterThanOrEqual(4.5);
    }
    // xám giữa: không màu mực nào đạt 4.5 -> admin hiện badge cảnh báo (envelope-gallery), mực vẫn chọn bên tốt hơn
    expect(contrast(inkOn('#7A7A7A'), '#7A7A7A')).toBeLessThan(4.5);
    expect(contrast(inkOn('#7A7A7A'), '#7A7A7A')).toBeGreaterThan(4);
  });

  it('bảng màu cố định: chữ trên phong bì ≥ 4.5:1', () => {
    for (const [id, p] of Object.entries(ENVELOPE_FIXED_PALETTE)) {
      expect(contrast(p!.ink, p!.paper), id).toBeGreaterThanOrEqual(4.5);
      expect(ENVELOPE_META[id as keyof typeof ENVELOPE_META].fixed).toBe(true);
    }
  });

  it('hình học: mỗi mẫu có túi/nắp/lót, mũi nắp nằm trong phong bì', () => {
    for (const s of ENVELOPE_STYLES) {
      const g = envelopeGeom(s);
      expect(g.pocket.startsWith('M')).toBe(true);
      expect(g.flap.endsWith('Z')).toBe(true);
      expect(g.tipY).toBeGreaterThan(0);
      expect(g.tipY).toBeLessThan(238);
    }
  });
});

describe('phong bì: thẻ không bị cắt (cardTravel)', () => {
  it('360×740: rút lên tối đa tới mép trên - 8px, về giữa màn khi phóng 1.12 vẫn nằm trọn', () => {
    const card = { top: 321, height: 199 };
    const { pull, center } = cardTravel(card, 740);
    expect(card.top - pull).toBeGreaterThanOrEqual(8);
    const mid = card.top + card.height / 2 + center;
    expect(mid).toBeCloseTo(370, 0);
    expect(mid - (card.height * 1.12) / 2).toBeGreaterThanOrEqual(0);
    expect(mid + (card.height * 1.12) / 2).toBeLessThanOrEqual(740);
  });
  it('màn thấp (thẻ sát mép trên): không rút quá mép', () => {
    const { pull } = cardTravel({ top: 60, height: 300 }, 600);
    expect(pull).toBe(52);
  });
});
