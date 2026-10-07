/** Album (design 4.8): masonry/grid/carousel, previewCount + "Xem tất cả", lightbox lazy. */
import type { PlannedSection } from '@shared/sections/meta';
import { ctx } from '../context';
import { css, h } from '../dom';
import { img, shell } from './common';

export function album(p: PlannedSection): HTMLElement {
  const a = ctx.config.content.album;
  const list = a.images;
  const grid = h('div', { class: `al-grid al--${a.layout}` });
  const tiles = list.map((im, i) => {
    const btn = h('button', { type: 'button', class: 'al-tile', 'aria-label': `Xem ảnh ${i + 1}/${list.length}${im.alt ? `: ${im.alt}` : ''}`, 'data-rv': 'image' },
      img(im, { thumb: true }));
    if (im.w && im.h) css(btn, { '--ar': `${im.w} / ${im.h}` });
    if (im.dominantColor) css(btn, { '--ph': im.dominantColor });
    if (i < 9) css(btn, { '--i': i });
    if (i >= a.previewCount) btn.hidden = true;
    btn.addEventListener('click', () => void openLightbox(i, btn));
    return btn;
  });
  grid.append(...tiles);
  const more = list.length > a.previewCount
    ? h('button', { type: 'button', class: 'btn btn-outline al-more' }, `Xem tất cả ${list.length} ảnh`)
    : null;
  more?.addEventListener('click', () => {
    tiles.forEach((t) => { t.hidden = false; t.classList.add('is-in'); });
    more.remove();
    tiles[a.previewCount]?.focus();
  });
  return shell(p, { eyebrow: a.eyebrow, heading: a.heading }, grid, more);
}

async function openLightbox(i: number, from: HTMLElement) {
  const { openLightbox: open } = await import('./lightbox');
  open(ctx.config.content.album.images, i, from);
}
