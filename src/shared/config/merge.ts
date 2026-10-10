import { DEFAULT_CONFIG, ITEM_TEMPLATES } from './defaults.ts';
import {
  ALBUM_LAYOUTS, AUTO_SCROLL_MODES, BODY_FONTS, BURSTS_ON_OPEN, COUNTDOWN_FIREWORKS, COUNTDOWN_STYLES, COUPLE_ORDERS,
  COVER_BACKGROUNDS, DIVIDERS, ENVELOPE_STYLES, FONT_PRESETS, HEADING_FONTS, INTENSITIES, OPEN_STYLES, ORNAMENT_SETS,
  PARTICLE_SCOPES, PARTICLE_TYPES, PHOTO_FRAMES, REVEAL_ATOMS, REVEAL_STYLES, SCRIPT_FONTS, SECTION_TYPES,
  TEXTURES, THEME_IDS, WISH_FLY, isHex, isOneOf,
} from './enums.ts';
import type { SectionItem, WeddingConfig } from './types.ts';
// [v4a-1] imports >>>
import { MOTIF_INTENSITIES, MOTIF_MOTIONS, MOTIF_SETS } from './enums.ts';
import { sanitizeMotifPlacements } from '../theme/parts.ts';
// [v4a-1] imports <<<
// [v4a-2a] imports >>>
import { REVEAL_MODES } from './enums.ts';
// [v4a-2a] imports <<<

type Obj = Record<string, unknown>;

/** Giới hạn tự cuộn (design-review-v1 5.4) - admin dùng chung. */
export const AUTO_SCROLL_LIMITS = { speed: [20, 120], startDelayMs: [1500, 8000], dwellMs: [0, 4000] } as const;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Merge sâu: object merge theo key, MẢNG THAY THẾ (solution 5.1).
 * Giá trị `undefined` ở override bị bỏ qua; `null` được giữ (null có nghĩa trong schema).
 * Kiểu khác nhau giữa base và override (vd base là object, override là string) -> giữ base.
 */
export function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) return clone(base);
  if (isObj(base)) {
    if (!isObj(override)) return clone(base);
    const out: Obj = {};
    for (const k of Object.keys(base)) out[k] = deepMerge((base as Obj)[k], override[k]);
    // key lạ không có trong base: giữ lại (vd theme.overrides.accent) - chỉ khi base là "map mở"
    for (const k of Object.keys(override)) if (!(k in out)) out[k] = clone(override[k]);
    return out as T;
  }
  if (Array.isArray(base)) return (Array.isArray(override) ? clone(override) : clone(base)) as T;
  // primitive / null base
  if (base === null) return clone(override) as T;
  // base primitive có giá trị, override null -> giữ base (mọi field cho phép null đều có mặc định null)
  if (override === null) return base;
  // ThemeOr<T[]>: mặc định "theme" (chuỗi) nhưng config cho mảng -> nhận mảng
  if (typeof base === 'string' && Array.isArray(override)) return clone(override) as T;
  if (typeof base !== typeof override) return base;
  return override as T;
}

function clone<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

export interface SanitizeResult { config: WeddingConfig; warnings: string[] }

/**
 * effective = deepMerge(DEFAULT_CONFIG, migrated) + kiểm enum.
 * Giá trị enum không hợp lệ -> về mặc định + warning (solution 5.1).
 */
export function mergeWithDefaults(migrated: unknown): SanitizeResult {
  const cfg = deepMerge(DEFAULT_CONFIG, nfcDeep(migrated));
  const warnings: string[] = [];
  const d = DEFAULT_CONFIG;
  const fix = <T>(path: string, ok: boolean, get: () => T, set: (v: T) => void, def: T) => {
    if (!ok) { warnings.push(`config.${path} không hợp lệ (${JSON.stringify(get())}) -> dùng mặc định ${JSON.stringify(def)}`); set(def); }
  };
  const t = cfg.theme;
  fix('theme.preset', isOneOf(THEME_IDS, t.preset), () => t.preset, (v) => (t.preset = v), d.theme.preset);
  fix('theme.primaryColor', t.primaryColor === null || isHex(t.primaryColor), () => t.primaryColor, (v) => (t.primaryColor = v), null);
  if (!isObj(t.overrides)) t.overrides = {};
  for (const [k, v] of Object.entries(t.overrides)) {
    if (!['primary', 'onPrimary', 'accent', 'accent2', 'bg', 'surface', 'text', 'muted', 'line'].includes(k) || !isHex(v)) {
      warnings.push(`config.theme.overrides.${k} không hợp lệ -> bỏ qua`);
      delete (t.overrides as Obj)[k];
    }
  }
  const themeOr = (list: readonly string[], v: unknown) => v === 'theme' || isOneOf(list, v);
  fix('theme.ornamentSet', themeOr(ORNAMENT_SETS, t.ornamentSet), () => t.ornamentSet, (v) => (t.ornamentSet = v), 'theme');
  fix('theme.texture', themeOr(TEXTURES, t.texture), () => t.texture, (v) => (t.texture = v), 'theme');
  fix('theme.photoFrame', themeOr(PHOTO_FRAMES, t.photoFrame), () => t.photoFrame, (v) => (t.photoFrame = v), 'theme');
  // [v4a-1] >>>
  // B2 hoạ tiết nền (solution Rev 5 mục 10.1): config cũ không có `theme.motif` -> deepMerge điền "theme"
  if (!isObj(t.motif)) t.motif = { ...d.theme.motif };
  const mo = t.motif;
  fix('theme.motif.set', mo.set === 'none' || themeOr(MOTIF_SETS, mo.set), () => mo.set, (v) => (mo.set = v), 'theme');
  if (mo.placements !== 'theme') {
    const clean = sanitizeMotifPlacements(mo.placements);
    if (!clean.length || JSON.stringify(clean) !== JSON.stringify(mo.placements)) {
      warnings.push(`config.theme.motif.placements không hợp lệ (${JSON.stringify(mo.placements)}) -> ${clean.length ? JSON.stringify(clean) : '"theme"'}`);
    }
    mo.placements = clean.length ? clean : 'theme';
  }
  fix('theme.motif.intensity', themeOr(MOTIF_INTENSITIES, mo.intensity), () => mo.intensity, (v) => (mo.intensity = v), 'theme');
  fix('theme.motif.motion', isOneOf(MOTIF_MOTIONS, mo.motion), () => mo.motion, (v) => (mo.motion = v), 'auto');
  // [v4a-1] <<<

  const f = cfg.fonts;
  fix('fonts.preset', themeOr(FONT_PRESETS, f.preset), () => f.preset, (v) => (f.preset = v), 'theme');
  fix('fonts.heading', themeOr(HEADING_FONTS, f.heading), () => f.heading, (v) => (f.heading = v), 'theme');
  fix('fonts.script', themeOr(SCRIPT_FONTS, f.script), () => f.script, (v) => (f.script = v), 'theme');
  fix('fonts.body', themeOr(BODY_FONTS, f.body), () => f.body, (v) => (f.body = v), 'theme');
  fix('fonts.scaleStep', [-1, 0, 1].includes(f.scaleStep), () => f.scaleStep, (v) => (f.scaleStep = v), 0);

  const e = cfg.effects;
  fix('effects.intensity', isOneOf(INTENSITIES, e.intensity), () => e.intensity, (v) => (e.intensity = v), 'medium');
  const p = e.particles;
  if (p.types !== 'theme') {
    const arr = Array.isArray(p.types) ? p.types.filter((x) => isOneOf(PARTICLE_TYPES, x)) : [];
    const uniq = [...new Set(arr)].slice(0, 2);
    if (uniq.length === 0 || uniq.length !== (p.types as unknown[]).length) {
      warnings.push(`config.effects.particles.types không hợp lệ -> ${uniq.length ? JSON.stringify(uniq) : '"theme"'}`);
    }
    p.types = uniq.length ? uniq : 'theme';
  }
  fix('effects.particles.color', p.color === 'theme' || p.color === 'multi' || isHex(p.color), () => p.color, (v) => (p.color = v), 'theme');
  fix('effects.particles.scope', isOneOf(PARTICLE_SCOPES, p.scope), () => p.scope, (v) => (p.scope = v), 'all');
  const b = e.burst;
  fix('effects.burst.onOpen', themeOr(BURSTS_ON_OPEN, b.onOpen), () => b.onOpen, (v) => (b.onOpen = v), 'theme');
  fix('effects.burst.countdownFireworks', isOneOf(COUNTDOWN_FIREWORKS, b.countdownFireworks), () => b.countdownFireworks, (v) => (b.countdownFireworks = v), 'every-view');
  const r = e.reveal;
  fix('effects.reveal.style', themeOr(REVEAL_STYLES, r.style), () => r.style, (v) => (r.style = v), 'theme');
  for (const role of ['heading', 'block', 'image', 'ornament'] as const) {
    const v = r[role];
    fix(`effects.reveal.${role}`, v === null || isOneOf(REVEAL_ATOMS, v), () => v, (nv) => (r[role] = nv), null);
    if (r[role] === 'parallax-layers' && role !== 'image') {
      warnings.push(`config.effects.reveal.${role} = parallax-layers chỉ dùng cho image -> null`);
      r[role] = null;
    }
  }
  // [v4a-2a] >>>
  fix('effects.reveal.mode', isOneOf(REVEAL_MODES, r.mode), () => r.mode, (v) => (r.mode = v), 'auto');
  // [v4a-2a] <<<
  const as = e.autoScroll;
  fix('effects.autoScroll.mode', isOneOf(AUTO_SCROLL_MODES, as.mode), () => as.mode, (v) => (as.mode = v), 'flow');
  as.speed = clampInt(as.speed, AUTO_SCROLL_LIMITS.speed[0], AUTO_SCROLL_LIMITS.speed[1], 45);
  // config cũ (wedding-site 650ms) -> kẹp tối thiểu 1500 (design-review-v1 5.4)
  as.startDelayMs = clampInt(as.startDelayMs, AUTO_SCROLL_LIMITS.startDelayMs[0], AUTO_SCROLL_LIMITS.startDelayMs[1], 2500);
  as.dwellMs = clampInt(as.dwellMs, AUTO_SCROLL_LIMITS.dwellMs[0], AUTO_SCROLL_LIMITS.dwellMs[1], 1200);
  fix('effects.micro.wishFly', isOneOf(WISH_FLY, e.micro.wishFly), () => e.micro.wishFly, (v) => (e.micro.wishFly = v), 'paper-plane');

  const c = cfg.cover;
  fix('cover.openStyle', themeOr(OPEN_STYLES, c.openStyle), () => c.openStyle, (v) => (c.openStyle = v), 'theme');
  fix('cover.background', isOneOf(COVER_BACKGROUNDS, c.background), () => c.background, (v) => (c.background = v), 'paper');
  const env = c.envelope;
  fix('cover.envelope.style', themeOr(ENVELOPE_STYLES, env.style), () => env.style, (v) => (env.style = v), 'theme');
  fix('cover.envelope.color', env.color === 'auto' || env.color === 'theme' || isHex(env.color), () => env.color, (v) => (env.color = v), 'auto');

  const s = cfg.sections;
  fix('sections.divider', themeOr(DIVIDERS, s.divider), () => s.divider, (v) => (s.divider = v), 'theme');
  s.items = normalizeSectionItems(s.items, warnings);
  // [v4a-2a] >>> ghim reveal theo section (solution-v4a-2a.md 1.2): cần danh sách id nên đặt sau normalizeSectionItems
  {
    // đọc bản gốc (deepMerge đã đổi mảng/chuỗi thành {}) để cảnh báo; dựng object mới (không gán khoá động)
    const raw: unknown = (((migrated as Obj | null)?.effects as Obj | undefined)?.reveal as Obj | undefined)?.sections ?? {};
    const ids = new Set(s.items.map((x) => x.id));
    r.sections = Object.fromEntries((isObj(raw) ? Object.entries(raw) : [['', raw] as [string, unknown]]).filter(([k, v]) => (ids.has(k) && isOneOf(REVEAL_STYLES, v))
      || !warnings.push(`config.effects.reveal.sections${k ? `.${k}` : ''} = ${JSON.stringify(v)}: không hợp lệ hoặc không có phần này -> bỏ`))) as typeof r.sections;
  }
  // [v4a-2a] <<<

  const ct = cfg.content;
  fix('content.countdown.style', isOneOf(COUNTDOWN_STYLES, ct.countdown.style), () => ct.countdown.style, (v) => (ct.countdown.style = v), 'flip');
  fix('content.album.layout', isOneOf(ALBUM_LAYOUTS, ct.album.layout), () => ct.album.layout, (v) => (ct.album.layout = v), 'masonry');
  fix('content.couple.order', isOneOf(COUPLE_ORDERS, ct.couple.order), () => ct.couple.order, (v) => (ct.couple.order = v), 'groom-first');
  ct.rsvp.maxGuests = clampInt(ct.rsvp.maxGuests, 1, 20, 5);
  ct.guestbook.maxLength = clampInt(ct.guestbook.maxLength, 20, 1000, 300);
  ct.guestbook.pageSize = clampInt(ct.guestbook.pageSize, 1, 50, 6);
  ct.album.previewCount = clampInt(ct.album.previewCount, 1, 200, 9);
  cfg.guest.maxLength = clampInt(cfg.guest.maxLength, 10, 200, 60);
  // ảnh album phải là ImageRef có src
  ct.album.images = (Array.isArray(ct.album.images) ? ct.album.images : []).filter(
    (im): im is NonNullable<typeof im> => isObj(im) && typeof (im as Obj).src === 'string' && (im as Obj).src !== '',
  );
  const items = <T>(list: unknown, tpl: T): T[] =>
    (Array.isArray(list) ? list : []).filter(isObj).map((x) => deepMerge(tpl as T, x));
  ct.events.items = items(ct.events.items, ITEM_TEMPLATES.event) as typeof ct.events.items;
  ct.events.items.forEach((ev, i) => { if (!ev.id) ev.id = `event-${i + 1}`; });
  ct.gift.bankAccounts = items(ct.gift.bankAccounts, ITEM_TEMPLATES.bankAccount) as typeof ct.gift.bankAccounts;
  ct.timeline.items = items(ct.timeline.items, ITEM_TEMPLATES.timeline);
  ct.loveStory.items = items(ct.loveStory.items, ITEM_TEMPLATES.loveStory) as typeof ct.loveStory.items;
  ct.guestbook.seedMessages = items(ct.guestbook.seedMessages, ITEM_TEMPLATES.seedMessage);
  cfg.schemaVersion = 1;
  return { config: cfg, warnings };
}

/** Mọi chuỗi -> NFC (bàn phím Telex kiểu tổ hợp NFD hiển thị dấu lệch, design 2.1). */
export function nfcDeep(v: unknown): unknown {
  if (typeof v === 'string') return v.normalize('NFC');
  if (Array.isArray(v)) return v.map(nfcDeep);
  if (isObj(v)) { const o: Obj = {}; for (const [k, x] of Object.entries(v)) o[k] = nfcDeep(x); return o; }
  return v;
}

function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : def;
  return Math.min(max, Math.max(min, n));
}

/** Ép hero đầu, footer cuối; bỏ type lạ + trùng id (solution 5.8). */
export function normalizeSectionItems(items: unknown, warnings: string[] = []): SectionItem[] {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set<string>();
  const out: SectionItem[] = [];
  for (const raw of list) {
    if (!isObj(raw)) continue;
    const type = raw.type;
    if (!isOneOf(SECTION_TYPES, type)) { warnings.push(`section type lạ "${String(type)}" -> bỏ qua`); continue; }
    const id = typeof raw.id === 'string' && raw.id ? raw.id : type;
    if (seen.has(id)) { warnings.push(`section id trùng "${id}" -> bỏ qua`); continue; }
    seen.add(id);
    out.push({ id, type, enabled: raw.enabled !== false });
  }
  for (const pinned of ['hero', 'footer'] as const) {
    if (!out.some((x) => x.type === pinned)) out.push({ id: pinned, type: pinned, enabled: true });
  }
  const hero = out.filter((x) => x.type === 'hero');
  const footer = out.filter((x) => x.type === 'footer');
  const mid = out.filter((x) => x.type !== 'hero' && x.type !== 'footer');
  return [...hero, ...mid, ...footer];
}
