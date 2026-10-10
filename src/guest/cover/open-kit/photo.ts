/**
 * open-kit/photo: ảnh cho `moon-gate` / `polaroid` (solution-v4a-2bc.md 1.2, decisions 2026-10-09):
 * ảnh nền cover (khi `cover.background = image`) -> ảnh hero (đã preload) -> không có: nền màu + monogram.
 * Không thêm preload mới.
 */
import type { WeddingConfig } from '@shared/config/types';
import { assetUrl } from '@shared/assets';
import { ctx } from '../../context';
import { h } from '../../dom';

/** Đường dẫn ảnh theo chuỗi ưu tiên (thuần, unit test). */
export function pickPhoto(c: Pick<WeddingConfig, 'cover' | 'content'>): string | null {
  if (c.cover.background === 'image' && c.cover.backgroundImage?.src) return c.cover.backgroundImage.src;
  return c.content.hero.image?.src || null;
}

/** `<img>` ảnh (trang trí, alt rỗng) hoặc khối monogram khi không có ảnh. */
export function photoEl(cls: string): HTMLElement {
  const src = pickPhoto(ctx.config);
  if (src) return h('img', { class: cls, src: assetUrl(src, ctx.base), alt: '', decoding: 'async', 'aria-hidden': 'true' });
  return h('div', { class: `${cls} op-mono`, 'aria-hidden': 'true' }, ctx.config.cover.monogram || '♡');
}
