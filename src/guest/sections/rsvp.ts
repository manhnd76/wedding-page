/**
 * Xác nhận tham dự (design 4.11, solution 8.7).
 * - appsScriptUrl rỗng -> khối liên hệ (gọi điện) thay form.
 * - có URL -> form: thẻ chọn lớn, stepper, chọn sự kiện, lời nhắn; submissionId lưu localStorage, "Sửa phản hồi".
 * Micro rsvp-success/choice-card/stepper-bump + confetti onRsvp là phạm vi v3.
 */
import type { PlannedSection } from '@shared/sections/meta';
import { telHref } from '@shared/assets';
import { ctx, emit, toast } from '../context';
import { h, nonEmpty } from '../dom';
import { icon } from '../icons';
import { isPast } from './events';
import { shell } from './common';

const KEY = 'wp_rsvp_v1';
interface Saved { submissionId: string; name: string; attending: boolean; count: number; eventIds: string[]; note: string }

export function rsvpDone(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

export function rsvp(p: PlannedSection): HTMLElement {
  const r = ctx.config.content.rsvp;
  const url = ctx.config.integrations.appsScriptUrl;
  const head = { eyebrow: r.eyebrow, heading: r.heading };
  const sub = nonEmpty(r.subheading) ? h('p', { class: 'sec-sub', 'data-rv': 'block' }, r.subheading) : null;
  if (!nonEmpty(url)) {
    const tel = telHref(r.contactPhone);
    return shell(p, head, sub, h('div', { class: 'rsvp-card card', 'data-rv': 'block', 'data-fx-exclude': '' },
      h('p', null, 'Bạn vui lòng báo cho chúng mình biết nhé:'),
      tel ? h('a', { class: 'btn btn-primary btn-block', href: tel }, icon('phone', 18), `Gọi ${r.contactPhone}`) : null));
  }

  const events = ctx.config.content.events.items.filter((e) => e.rsvpEnabled && nonEmpty(e.name) && !isPast(e));
  const askEvents = r.askEvents && events.length > 1;
  const name = h('input', { id: 'rs-name', class: 'input', autocomplete: 'name', maxlength: 60, value: ctx.guest.fromUrl ? ctx.guest.raw : '', 'data-sync-name': '' });
  const choice = (val: 'yes' | 'no', label: string) => h('label', { class: 'choice' },
    h('input', { type: 'radio', name: 'attending', value: val, class: 'choice-in' }),
    h('span', { class: 'choice-card' }, icon(val === 'yes' ? 'heart' : 'close', 20), h('span', null, label)));
  const countIn = h('input', { id: 'rs-count', type: 'number', min: 1, max: r.maxGuests, value: 1, class: 'input stepper-v', inputmode: 'numeric' });
  const step = (d: number) => { countIn.value = String(Math.min(r.maxGuests, Math.max(1, (Number(countIn.value) || 1) + d))); };
  const more = h('div', { class: 'rs-more' }, h('div', { class: 'rs-more-in' },
    h('label', { class: 'label', for: 'rs-count' }, r.guestCountLabel),
    h('div', { class: 'stepper' },
      h('button', { type: 'button', class: 'stepper-b', 'aria-label': 'Bớt 1 người', onclick: () => step(-1) }, icon('minus', 18)),
      countIn,
      h('button', { type: 'button', class: 'stepper-b', 'aria-label': 'Thêm 1 người', onclick: () => step(1) }, icon('plus', 18))),
    askEvents ? h('fieldset', { class: 'rs-events' }, h('legend', { class: 'label' }, 'Bạn sẽ dự sự kiện nào?'),
      ...events.map((e) => h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'ev', value: e.id, checked: e.id === ctx.config.content.events.mainEventId }), h('span', null, e.name)))) : null));
  const note = r.askNote ? h('textarea', { id: 'rs-note', class: 'input', rows: 2, maxlength: 300 }) : null;
  const hp = h('input', { name: 'website', tabindex: -1, autocomplete: 'off', class: 'hp', 'aria-hidden': 'true' });
  const err = h('p', { class: 'field-err', role: 'alert' });
  const status = h('p', { class: 'form-status', role: 'status' });
  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, h('span', null, 'Gửi xác nhận'));
  const deadlinePast = r.deadline && new Date(r.deadline).getTime() < Date.now();
  const form = h('form', { class: 'rsvp-form', novalidate: true },
    h('label', { class: 'label', for: 'rs-name' }, 'Họ và tên'), name,
    h('fieldset', { class: 'choices' }, h('legend', { class: 'label' }, 'Bạn có tham dự không?'), choice('yes', r.attendingLabel), choice('no', r.notAttendingLabel)),
    more,
    note ? h('label', { class: 'label', for: 'rs-note' }, 'Lời nhắn (không bắt buộc)') : null, note,
    hp, err, submit, status,
    nonEmpty(r.deadlineText) ? h('p', { class: 'small muted' }, r.deadlineText) : null,
    deadlinePast ? h('p', { class: 'small muted' }, 'Đã quá hạn xác nhận, chúng mình vẫn rất vui nếu bạn báo lại') : null);
  const done = h('div', { class: 'rs-done', hidden: true });
  const card = h('div', { class: 'rsvp-card card', 'data-rv': 'block', 'data-fx-exclude': '' }, form, done);

  form.addEventListener('change', () => {
    const yes = (form.querySelector<HTMLInputElement>('input[name=attending]:checked')?.value) === 'yes';
    more.classList.toggle('is-open', yes);
  });

  const showDone = (s: Saved) => {
    form.hidden = true;
    done.hidden = false;
    const evNames = ctx.config.content.events.items.filter((e) => s.eventIds.includes(e.id)).map((e) => e.name).join(', ');
    done.replaceChildren(
      h('p', { class: 'rs-done-ic', 'aria-hidden': 'true' }, icon('check', 28)),
      h('p', { class: 'h3' }, `Cảm ơn ${s.name}!`),
      h('p', null, s.attending ? `Chúng mình đã ghi nhận: ${s.count} người${evNames ? ` · ${evNames}` : ''}` : 'Tiếc quá, cảm ơn bạn đã báo. Bạn vẫn có thể gửi lời chúc nhé!'),
      h('button', { type: 'button', class: 'btn btn-outline', onclick: () => { form.hidden = false; done.hidden = true; name.focus(); } }, 'Sửa phản hồi'));
  };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    if (saved) {
      name.value = saved.name;
      countIn.value = String(saved.count);
      if (note) note.value = saved.note;
      showDone(saved);
    }
  } catch { /* ignore */ }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const att = form.querySelector<HTMLInputElement>('input[name=attending]:checked')?.value;
    const nm = name.value.normalize('NFC').trim();
    if (nm.length < 2) { err.textContent = 'Vui lòng nhập họ tên (ít nhất 2 ký tự)'; name.focus(); return; }
    if (!att) { err.textContent = 'Vui lòng chọn bạn có tham dự hay không'; return; }
    err.textContent = '';
    if (hp.value) return;
    let prev: Saved | null = null;
    try { prev = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null; } catch { /* ignore */ }
    const body: Saved = {
      submissionId: prev?.submissionId ?? uuid(), name: nm, attending: att === 'yes',
      count: att === 'yes' ? Math.min(r.maxGuests, Math.max(1, Number(countIn.value) || 1)) : 0,
      eventIds: askEvents ? Array.from(form.querySelectorAll<HTMLInputElement>('input[name=ev]:checked')).map((x) => x.value) : events.map((x) => x.id),
      note: note?.value.normalize('NFC').trim().slice(0, 300) ?? '',
    };
    submit.disabled = true;
    submit.querySelector('span')!.textContent = 'Đang gửi…';
    const as = await import('../integrations/apps-script');
    const res = await as.postRsvp(url, { ...body, guestLabel: ctx.guest.display, hp: '' });
    submit.disabled = false;
    submit.querySelector('span')!.textContent = 'Gửi xác nhận';
    if (!res.ok) { status.textContent = 'Chưa gửi được, kiểm tra mạng và thử lại'; status.className = 'form-status is-err'; return; }
    try { localStorage.setItem(KEY, JSON.stringify(body)); } catch { /* ignore */ }
    showDone(body);
    toast('Đã gửi xác nhận');
    emit('rsvp-done', body);
  });

  // nút "Xác nhận tham dự" trên thẻ sự kiện: tick sẵn sự kiện đó
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-rsvp-event]');
    if (!a) return;
    const cb = form.querySelector<HTMLInputElement>(`input[name=ev][value="${CSS.escape(a.dataset.rsvpEvent ?? '')}"]`);
    if (cb) cb.checked = true;
  });

  return shell(p, head, sub, card);
}
