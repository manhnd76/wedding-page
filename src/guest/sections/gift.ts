/** Mừng cưới (design 4.9): lời nhắn + nút mở sheet; không hiện STK trần trên trang. */
import type { PlannedSection } from '@shared/sections/meta';
import { hasImage } from '@shared/sections/meta';
import { ctx } from '../context';
import { h, multiline, nonEmpty } from '../dom';
import { icon, ornament } from '../icons';
import { shell } from './common';

export function giftAccounts() {
  return ctx.config.content.gift.bankAccounts.filter((b) => nonEmpty(b.accountNumber) || hasImage(b.qrImage));
}

export function gift(p: PlannedSection): HTMLElement {
  const g = ctx.config.content.gift;
  const accounts = g.showBankInfo ? giftAccounts() : [];
  const btn = accounts.length
    ? h('button', { type: 'button', class: 'btn btn-primary gift-btn', 'aria-haspopup': 'dialog' }, icon('gift', 18), g.buttonLabel || 'Gửi quà mừng cưới')
    : null;
  btn?.addEventListener('click', async () => {
    const { openGiftSheet } = await import('./gift-sheet');
    openGiftSheet(accounts, btn);
  });
  const box = ornament(ctx.resolved.ornamentUrl ?? '', 'gift', 'orn gift-art', 64, 64);
  box?.setAttribute('data-rv', 'ornament');
  return shell(p, { eyebrow: g.eyebrow, heading: g.heading },
    box,
    nonEmpty(g.message) ? h('p', { class: 'gift-msg', 'data-rv': 'block' }, ...multiline(g.message)) : null,
    btn);
}
