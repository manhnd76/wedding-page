/**
 * Thao tác trên nháp (thuần, test được):
 *  - 4 thao tác "quay lại" (solution 3.4, design 8.7)
 *  - đổi theme: chỉ thay phần "Theo theme" / dùng trọn gói (solution 5.2 quy tắc Q17, design 8.12)
 */
import type { ImageRef, WeddingConfig } from '@shared/config/types';
import type { ThemeId } from '@shared/config/enums';
import { hash8Of, repoPathOfSrc, type BackupManifest, type ManifestFile } from '@shared/storage/manifest';
import { clone, getAt, sameJson, setAt } from './paths';

// ------------------------------------------------------------------ 1. Hoàn tác thay đổi nháp (1 slot)

export interface SlotUndo { draft: WeddingConfig; previous: unknown }

/** Slot nháp có khác bản đang xuất bản không. */
export function slotChanged(draft: WeddingConfig, published: WeddingConfig, slot: string): boolean {
  return !sameJson(getAt(draft, slot), getAt(published, slot));
}

/** `draft[slot] = published[slot]`; trả giá trị nháp trước đó để [Làm lại] (toast 5s). */
export function revertSlot(draft: WeddingConfig, published: WeddingConfig, slot: string): SlotUndo {
  const previous = clone(getAt(draft, slot));
  return { draft: setAt(draft, slot, clone(getAt(published, slot) ?? null)), previous };
}

/** [Làm lại] sau Hoàn tác thay đổi nháp. */
export function redoSlot(draft: WeddingConfig, slot: string, previous: unknown): WeddingConfig {
  return setAt(draft, slot, clone(previous));
}

// ------------------------------------------------------------------ 2. Lấy lại ảnh trước đó (từ backup -> nháp)

/**
 * Mục backup (existed=true) của slot. Chỉ có khi slot đổi ảnh trong lần xuất bản gần nhất.
 * Album: tìm theo ảnh đang xuất bản (`publishedSrc`) để không lệ thuộc thứ tự.
 */
export function previousImageEntry(manifest: BackupManifest | null, slot: string, publishedSrc?: string | null): ManifestFile | null {
  if (!manifest) return null;
  const backed = manifest.files.filter((f) => f.existed && f.backupPath && !f.path.endsWith('/config.json'));
  let targetSlot = slot;
  if (publishedSrc) {
    // ảnh đang xuất bản do lần ghi gần nhất tạo ra -> slot lúc đó (album có thể đã đổi thứ tự)
    const created = manifest.files.find((f) => f.path === repoPathOfSrc(publishedSrc) && f.slot);
    if (created?.slot) targetSlot = created.slot;
  }
  const hit = backed.find((f) => f.slot === targetSlot);
  if (!hit) return null;
  // ảnh trước phải khác ảnh đang xuất bản
  if (publishedSrc && hit.path === repoPathOfSrc(publishedSrc)) return null;
  return hit;
}

/** Lấy ImageRef (w/h/alt/lqip) của slot trong config backup; tìm theo đường dẫn file nếu slot album đã dời. */
export function imageRefFromBackupConfig(backupConfig: unknown, entry: ManifestFile): ImageRef {
  const src = entry.path.replace(/^public\//, '');
  const bySlot = entry.slot ? (getAt(backupConfig, entry.slot) as ImageRef | undefined) : undefined;
  if (bySlot && typeof bySlot === 'object' && bySlot.src === src) return clone(bySlot);
  // tìm ImageRef có src khớp ở bất kỳ đâu
  let found: ImageRef = null;
  const walk = (v: unknown) => {
    if (found || !v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    const o = v as Record<string, unknown>;
    if (o.src === src) { found = clone(o) as ImageRef; return; }
    Object.values(o).forEach(walk);
  };
  walk(backupConfig);
  return found ?? { src, w: 0, h: 0, alt: '' };
}

/** Đưa ảnh trước đó vào nháp (không ghi lên trang). */
export function takePreviousIntoDraft(draft: WeddingConfig, slot: string, ref: ImageRef): SlotUndo {
  const previous = clone(getAt(draft, slot));
  return { draft: setAt(draft, slot, ref), previous };
}

// ------------------------------------------------------------------ 3. Hoàn tác tất cả

export function revertAll(published: WeddingConfig): WeddingConfig {
  return clone(published);
}

// ------------------------------------------------------------------ 4. Khôi phục bản xuất bản trước -> nháp

/** Sau restore commit thành công: published = config vừa khôi phục, draft = published (solution 3.4). */
export function afterRestore(restored: WeddingConfig): { published: WeddingConfig; draft: WeddingConfig } {
  return { published: clone(restored), draft: clone(restored) };
}

// ------------------------------------------------------------------ đổi theme (Q17)

export type ThemeGroup = 'colors' | 'fonts' | 'ornament' | 'texture' | 'photoFrame' | 'divider' | 'motif' | 'openStyle' | 'burst' | 'particles' | 'reveal';

export const THEME_GROUP_LABEL: Record<ThemeGroup, string> = {
  colors: 'Màu sắc', fonts: 'Font chữ', ornament: 'Hoạ tiết', texture: 'Texture nền', photoFrame: 'Khung ảnh',
  divider: 'Đường phân cách', motif: 'Hoạ tiết nền', openStyle: 'Kiểu mở thiệp', burst: 'Hiệu ứng sau khi mở', particles: 'Hạt nền', reveal: 'Hiện nội dung khi cuộn',
};

/** Nhóm nào đang "Đã chỉnh riêng" (khác mặc định-theo-theme). */
export function customizedGroups(c: WeddingConfig): ThemeGroup[] {
  const out: ThemeGroup[] = [];
  if (c.theme.primaryColor !== null || Object.keys(c.theme.overrides ?? {}).length > 0) out.push('colors');
  const f = c.fonts;
  if (f.preset !== 'theme' || f.heading !== 'theme' || f.script !== 'theme' || f.body !== 'theme') out.push('fonts');
  if (c.theme.ornamentSet !== 'theme') out.push('ornament');
  if (c.theme.texture !== 'theme') out.push('texture');
  if (c.theme.photoFrame !== 'theme') out.push('photoFrame');
  if (c.sections.divider !== 'theme') out.push('divider');
  // B2 hoạ tiết nền (v4a-1): `motion` là sở thích của chủ nhà, không thuộc nhóm (giống effects.intensity)
  const mo = c.theme.motif;
  if (mo && (mo.set !== 'theme' || mo.placements !== 'theme' || mo.intensity !== 'theme')) out.push('motif');
  // mẫu phong bì (v2.1) thuộc nhóm "Kiểu mở thiệp"
  if (c.cover.openStyle !== 'theme' || (c.cover.envelope && c.cover.envelope.style !== 'theme')) out.push('openStyle');
  if (c.effects.burst.onOpen !== 'theme') out.push('burst');
  if (c.effects.particles.types !== 'theme' || c.effects.particles.color !== 'theme') out.push('particles');
  const r = c.effects.reveal;
  // v4a-2a: + cách áp dụng và ghim theo section (design-v4a-2a 5.2)
  if (r.style !== 'theme' || (r.mode ?? 'auto') !== 'auto' || Object.keys(r.sections ?? {}).length > 0
    || r.heading !== null || r.block !== null || r.image !== null || r.ornament !== null) out.push('reveal');
  return out;
}

/** Đặt 1 nhóm về "Theo theme". */
export function resetGroup(c: WeddingConfig, g: ThemeGroup): WeddingConfig {
  const n = clone(c);
  switch (g) {
    case 'colors': n.theme.primaryColor = null; n.theme.overrides = {}; break;
    case 'fonts': n.fonts = { ...n.fonts, preset: 'theme', heading: 'theme', script: 'theme', body: 'theme' }; break;
    case 'ornament': n.theme.ornamentSet = 'theme'; break;
    case 'texture': n.theme.texture = 'theme'; break;
    case 'photoFrame': n.theme.photoFrame = 'theme'; break;
    case 'divider': n.sections.divider = 'theme'; break;
    case 'motif': n.theme.motif = { ...(n.theme.motif ?? { motion: 'auto' }), set: 'theme', placements: 'theme', intensity: 'theme' }; break;
    case 'openStyle': n.cover.openStyle = 'theme'; if (n.cover.envelope) n.cover.envelope.style = 'theme'; break;
    case 'burst': n.effects.burst.onOpen = 'theme'; break;
    case 'particles': n.effects.particles.types = 'theme'; n.effects.particles.color = 'theme'; break;
    case 'reveal': n.effects.reveal = { style: 'theme', mode: 'auto', sections: {}, heading: null, block: null, image: null, ornament: null }; break;
  }
  return n;
}

/**
 * Đổi theme. `keep` (mặc định): CHỈ ghi theme.preset - phần đã chỉnh giữ nguyên.
 * `full`: dùng trọn gói - mọi nhóm về "Theo theme". Field ngoài theme (intensity, micro, scaleStep...) không đụng.
 */
export function changeTheme(c: WeddingConfig, preset: ThemeId, mode: 'keep' | 'full' = 'keep'): WeddingConfig {
  let n = clone(c);
  n.theme.preset = preset;
  if (mode === 'full') for (const g of customizedGroups(n)) n = resetGroup(n, g);
  return n;
}

/** Album: hash8 của ảnh (khoá ổn định). */
export const imageKey = (src: string) => hash8Of(src) ?? src;
