/**
 * Sổ lưu bút (design 4.10). v1: lưu local (localStorage) khi chưa có appsScriptUrl;
 * có URL -> đọc/gửi qua Apps Script (chunk lazy). Không cuộn lồng: hiện pageSize + "Xem thêm".
 * Vi-hiệu ứng wish-fly là phạm vi v3: v1 chèn lời chúc + highlight (đúng cột "Tắt" của ma trận).
 */
import type { PlannedSection } from '@shared/sections/meta';
import { ctx, toast } from '../context';
import { h, nonEmpty } from '../dom';
import { icon } from '../icons';
import { shell } from './common';

interface Msg { name: string; message: string; createdAt?: string; time?: string }
const LOCAL_KEY = 'wp_guestbook_v1';

function readLocal(): Msg[] {
  try { const v = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as Msg[]; return Array.isArray(v) ? v : []; } catch { return []; }
}
function writeLocal(list: Msg[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 100))); } catch { /* đầy bộ nhớ */ }
}

export function relTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.round((t - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  const abs = Math.abs(s);
  if (abs < 60) return 'vừa xong';
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (abs < 86400 * 14) return rtf.format(Math.round(s / 86400), 'day');
  if (abs < 86400 * 60) return rtf.format(Math.round(s / (86400 * 7)), 'week');
  return rtf.format(Math.round(s / (86400 * 30)), 'month');
}

export function guestbook(p: PlannedSection): HTMLElement {
  const g = ctx.config.content.guestbook;
  const remote = nonEmpty(ctx.config.integrations.appsScriptUrl) ? ctx.config.integrations.appsScriptUrl : '';
  const prefill = ctx.guest.fromUrl ? ctx.guest.raw : '';
  const name = h('input', { id: 'gb-name', name: 'name', class: 'input', autocomplete: 'name', maxlength: 60, value: prefill, 'data-sync-name': '' });
  const msg = h('textarea', { id: 'gb-msg', name: 'message', class: 'input', rows: 3, maxlength: g.maxLength });
  const count = h('span', { class: 'small muted gb-count', 'aria-live': 'off' }, `0/${g.maxLength}`);
  const hp = h('input', { name: 'website', tabindex: -1, autocomplete: 'off', class: 'hp', 'aria-hidden': 'true' });
  const errName = h('p', { class: 'field-err', id: 'gb-name-err', role: 'alert' });
  const errMsg = h('p', { class: 'field-err', id: 'gb-msg-err', role: 'alert' });
  const status = h('p', { class: 'form-status', role: 'status' });
  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, icon('send', 18), h('span', null, 'Gửi lời chúc'));
  const chips = g.suggestions.filter(nonEmpty).map((s) => h('button', { type: 'button', class: 'chip' }, s));
  const form = h('form', { class: 'gb-form card', novalidate: true, 'data-fx-exclude': '', 'data-rv': 'block' },
    h('label', { for: 'gb-name', class: 'label' }, 'Tên của bạn'), name, errName,
    h('label', { for: 'gb-msg', class: 'label' }, 'Lời chúc'), msg,
    h('div', { class: 'gb-meta' }, count),
    errMsg,
    chips.length ? h('div', { class: 'chips', 'aria-label': 'Gợi ý lời chúc' }, ...chips) : null,
    hp, submit, status);
  const list = h('ul', { class: 'gb-list', 'data-fx-exclude': '', 'aria-live': 'polite' });
  const more = h('button', { type: 'button', class: 'btn btn-outline gb-more', hidden: true });
  let items: Msg[] = [...readLocal(), ...g.seedMessages.filter((m) => nonEmpty(m.message))];
  let shown = g.pageSize;

  const renderList = (highlightFirst = false) => {
    list.replaceChildren();
    if (!items.length) {
      list.append(h('li', { class: 'gb-empty muted' }, 'Hãy là người đầu tiên gửi lời chúc'));
    }
    items.slice(0, shown).forEach((m, i) => {
      const when = m.createdAt ? relTime(m.createdAt) : m.time ?? '';
      list.append(h('li', { class: `gb-item card${highlightFirst && i === 0 ? ' is-new' : ''}` },
        h('p', { class: 'gb-text' }, m.message),
        h('p', { class: 'small muted gb-by' }, `— ${m.name}${when ? ` · ${when}` : ''}`)));
    });
    more.hidden = items.length <= shown;
    more.textContent = `Xem thêm lời chúc (${items.length - shown})`;
  };
  more.addEventListener('click', () => { shown += g.pageSize; renderList(); });
  msg.addEventListener('input', () => {
    count.textContent = `${msg.value.length}/${g.maxLength}`;
    msg.style.setProperty('height', 'auto');
    msg.style.setProperty('height', `${Math.min(msg.scrollHeight, 6 * 28)}px`);
  });
  chips.forEach((c) => c.addEventListener('click', () => {
    const t = c.textContent ?? '';
    msg.value = msg.value ? `${msg.value.trim()} ${t}` : t;
    msg.dispatchEvent(new Event('input'));
    msg.focus();
  }));

  const setErr = (input: HTMLElement, el: HTMLElement, text: string) => {
    el.textContent = text;
    if (text) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', el.id); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = name.value.normalize('NFC').trim();
    const m = msg.value.normalize('NFC').trim();
    setErr(name, errName, n.length < 2 ? 'Tên cần ít nhất 2 ký tự' : '');
    setErr(msg, errMsg, m.length < 2 ? 'Lời chúc cần ít nhất 2 ký tự' : '');
    if (n.length < 2) { name.focus(); return; }
    if (m.length < 2) { msg.focus(); return; }
    if (hp.value) return;
    submit.disabled = true;
    submit.querySelector('span')!.textContent = 'Đang gửi…';
    status.textContent = '';
    const entry: Msg = { name: n, message: m.slice(0, g.maxLength), createdAt: new Date().toISOString() };
    let ok = true;
    if (remote) {
      const as = await import('../integrations/apps-script');
      const r = await as.postGuestbook(remote, { name: entry.name, message: entry.message, hp: '' });
      ok = r.ok;
    } else {
      writeLocal([entry, ...readLocal()]);
    }
    submit.disabled = false;
    submit.querySelector('span')!.textContent = 'Gửi lời chúc';
    if (!ok) {
      status.textContent = 'Chưa gửi được, kiểm tra mạng và thử lại';
      status.className = 'form-status is-err';
      return;
    }
    items = [entry, ...items];
    renderList(true);
    msg.value = '';
    msg.dispatchEvent(new Event('input'));
    toast('Cảm ơn lời chúc của bạn!');
  });

  if (remote) {
    list.append(...[0, 1, 2].map(() => h('li', { class: 'gb-item card is-skel', 'aria-hidden': 'true' })));
    const load = async () => {
      const as = await import('../integrations/apps-script');
      if (!as.isAppsScriptUrl(remote)) { renderList(); return; }
      const r = await as.fetchGuestbook(remote, 50);
      if (r.ok) { items = [...r.items, ...g.seedMessages.filter((x) => nonEmpty(x.message))]; }
      renderList();
    };
    void load();
    // poll khi section trong viewport và tab hiện
    let visible = false;
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es.some((x) => x.isIntersecting); }).observe(list);
    setInterval(() => { if (visible && !document.hidden) void load(); }, Math.max(15, g.pollIntervalSec) * 1000);
  } else renderList();

  return shell(p, { eyebrow: g.eyebrow, heading: g.heading },
    nonEmpty(g.subheading) ? h('p', { class: 'sec-sub', 'data-rv': 'block' }, g.subheading) : null,
    h('div', { class: 'gb-grid' }, form, h('div', { class: 'gb-col' }, list, more)));
}
