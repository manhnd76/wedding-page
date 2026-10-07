/**
 * Sheet mừng cưới (chunk lazy, design 4.9): bottom sheet (mobile) / dialog (desktop),
 * tab Chú rể/Cô dâu (segmented-slide), QR nền trắng (ảnh upload hoặc VietQR sinh client-side),
 * Sao chép STK (copy-morph + toast), Tải ảnh QR (PNG), Esc / nút Đóng 44px / vuốt xuống để đóng.
 */
import type { BankAccount } from '@shared/config/types';
import { assetUrl } from '@shared/assets';
import { buildVietQrPayload, groupAccount, validateVietQr } from '@shared/vietqr/payload';
import { bankByBin } from '@shared/vietqr/banks';
import { closeOverlay, ctx, openOverlay, toast } from '../context';
import { css, downloadBlob, h, trapFocus } from '../dom';
import { icon } from '../icons';

const QR_PX = 220;

async function qrMatrix(text: string): Promise<boolean[][]> {
  const { encode } = await import('uqr');
  return encode(text, { ecc: 'M', border: 0 }).data;
}

function drawQr(canvas: HTMLCanvasElement, m: boolean[][], px: number, pad = 12) {
  const n = m.length;
  const scale = Math.max(1, Math.floor((px - pad * 2) / n));
  const size = n * scale + pad * 2;
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#FFFFFF';
  g.fillRect(0, 0, size, size);
  g.fillStyle = '#000000';
  m.forEach((row, y) => row.forEach((on, x) => { if (on) g.fillRect(pad + x * scale, pad + y * scale, scale, scale); }));
}

export function openGiftSheet(accounts: BankAccount[], opener: HTMLElement): void {
  let idx = 0;
  const reduced = ctx.fx.state === 'off' || ctx.fx.state === 'reduced';
  const tabs = accounts.length > 1
    ? h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Chọn tài khoản' }, h('span', { class: 'seg-ind', 'aria-hidden': 'true' }),
        ...accounts.map((a, i) => h('button', { type: 'button', role: 'tab', class: 'seg-btn', 'aria-selected': String(i === 0), id: `gift-tab-${i}` }, a.role || `Tài khoản ${i + 1}`)))
    : null;
  if (tabs) css(tabs, { '--n': accounts.length });
  const qrBox = h('div', { class: 'qr-box', role: 'img', 'aria-label': 'Mã QR chuyển khoản' });
  const owner = h('p', { class: 'gs-owner' });
  const bank = h('p', { class: 'small muted gs-bank' });
  const accNo = h('p', { class: 'gs-acc' });
  const copyBtn = h('button', { type: 'button', class: 'btn btn-outline btn-sm gs-copy' }, h('span', { class: 'gs-copy-ic' }, icon('copy', 18), icon('check', 18)), h('span', { class: 'gs-copy-l' }, 'Sao chép'));
  const dlBtn = h('button', { type: 'button', class: 'btn btn-outline gs-dl' }, icon('download', 18), 'Tải ảnh QR');
  const closeBtn = h('button', { type: 'button', class: 'lb-btn gs-close', 'aria-label': 'Đóng' }, icon('close', 22));
  const handle = h('div', { class: 'gs-handle', 'aria-hidden': 'true' });
  const panel = h('div', { class: 'gs-panel', role: 'tabpanel' }, qrBox, owner, bank, h('div', { class: 'gs-acc-row' }, accNo, copyBtn), dlBtn, h('p', { class: 'small muted' }, 'Quét bằng app ngân hàng bất kỳ'));
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gs-title' },
    handle, closeBtn, h('h2', { id: 'gs-title', class: 'h3 gs-title' }, ctx.config.content.gift.heading || 'Mừng cưới'), tabs, panel);
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const wrap = h('div', { class: 'sheet-wrap' }, backdrop, sheet);
  let canvas: HTMLCanvasElement | null = null;

  const render = async (i: number) => {
    idx = i;
    const a = accounts[i]!;
    tabs?.querySelectorAll('.seg-btn').forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    if (tabs) css(tabs, { '--i': i });
    owner.textContent = a.owner.toLocaleUpperCase('vi-VN');
    bank.textContent = a.bank || bankByBin(a.bankBin)?.short || '';
    accNo.textContent = groupAccount(a.accountNumber);
    copyBtn.hidden = !a.accountNumber;
    qrBox.replaceChildren();
    canvas = null;
    if (a.qrImage?.src) {
      qrBox.append(h('img', { src: assetUrl(a.qrImage.src, ctx.base), alt: `QR ${a.owner}`, width: QR_PX, height: QR_PX }));
    } else if (!validateVietQr({ bankBin: a.bankBin, accountNumber: a.accountNumber })) {
      try {
        const m = await qrMatrix(buildVietQrPayload({ bankBin: a.bankBin, accountNumber: a.accountNumber }));
        if (idx !== i) return;
        canvas = h('canvas', { class: 'qr-canvas' });
        drawQr(canvas, m, QR_PX * 2);
        qrBox.append(canvas);
      } catch {
        qrBox.append(h('p', { class: 'small muted' }, 'Không tạo được mã QR'));
      }
    } else {
      qrBox.append(h('p', { class: 'small muted' }, 'Chưa có mã QR cho tài khoản này'));
    }
    dlBtn.hidden = !canvas && !a.qrImage?.src;
  };

  tabs?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('.seg-btn');
    if (!b) return;
    void render(Array.from(tabs.querySelectorAll('.seg-btn')).indexOf(b));
  });
  tabs?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const n = (idx + (e.key === 'ArrowRight' ? 1 : -1) + accounts.length) % accounts.length;
    void render(n);
    (tabs.querySelectorAll<HTMLElement>('.seg-btn')[n])?.focus();
  });
  copyBtn.addEventListener('click', async () => {
    const acc = accounts[idx]!.accountNumber;
    let ok = false;
    try { await navigator.clipboard.writeText(acc); ok = true; } catch {
      const r = document.createRange();
      r.selectNodeContents(accNo);
      const s = getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    if (ok) {
      copyBtn.classList.add('is-done');
      copyBtn.querySelector('.gs-copy-l')!.textContent = 'Đã chép';
      toast('Đã sao chép số tài khoản');
      setTimeout(() => { copyBtn.classList.remove('is-done'); copyBtn.querySelector('.gs-copy-l')!.textContent = 'Sao chép'; }, 2000);
    } else toast('Hãy nhấn giữ để sao chép');
  });
  dlBtn.addEventListener('click', () => {
    const a = accounts[idx]!;
    if (canvas) canvas.toBlob((b) => b && downloadBlob(b, `qr-${a.role || 'mung-cuoi'}.png`), 'image/png');
    else if (a.qrImage?.src) window.open(assetUrl(a.qrImage.src, ctx.base), '_blank', 'noopener');
  });

  const close = () => {
    document.removeEventListener('keydown', onKey);
    untrap();
    wrap.classList.remove('is-open');
    setTimeout(() => wrap.remove(), reduced ? 0 : 280);
    closeOverlay('gift');
    opener.focus({ preventScroll: true });
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  // vuốt xuống để đóng (từ tay cầm / đầu sheet)
  let y0 = -1;
  handle.addEventListener('pointerdown', (e) => { y0 = e.clientY; handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', (e) => { if (y0 >= 0) css(sheet, { transform: `translateY(${Math.max(0, e.clientY - y0)}px)` }); });
  handle.addEventListener('pointerup', (e) => { const d = e.clientY - y0; y0 = -1; sheet.style.removeProperty('transform'); if (d > 80) close(); });

  document.body.appendChild(wrap);
  openOverlay('gift');
  const untrap = trapFocus(sheet);
  void render(0);
  requestAnimationFrame(() => wrap.classList.add('is-open'));
  closeBtn.focus({ preventScroll: true });
}
