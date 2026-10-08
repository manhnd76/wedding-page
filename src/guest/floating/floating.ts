/**
 * Thành phần nổi (design 6.1, 7): nút nhạc (đĩa than) + scroll-top (cột phải),
 * pill hành động nhanh (trái dưới) + menu nhanh có "Bật/Tắt hiệu ứng".
 */
import { closeOverlay, ctx, emit, on, openOverlay } from '../context';
import { h, trapFocus } from '../dom';
import { icon, type IconName } from '../icons';
import type { MusicPlayer, MusicState } from '../music/player';
import { fxEnabled, setGuestFx } from '../effects/service';
import { rsvpDone } from '../sections/rsvp';

interface MenuItem { id: string; label: string; ic: IconName }

export function mountFloating(music: MusicPlayer, visibleIds: Set<string>): void {
  const root = h('div', { class: 'floating', 'aria-label': 'Tiện ích' });
  const right = h('div', { class: 'fl-right' });
  root.append(right);

  // ---- nhạc
  if (music.available && ctx.config.music.enabled) {
    const btn = h('button', { type: 'button', class: 'fl-btn fl-music', 'aria-pressed': 'false', 'aria-label': 'Bật nhạc' },
      h('span', { class: 'disc', 'aria-hidden': 'true' }, h('span', { class: 'disc-label' })), h('span', { class: 'fl-music-off', 'aria-hidden': 'true' }));
    const tip = h('span', { class: 'fl-tip', role: 'status' });
    let tipShown = false;
    const sync = (s: MusicState) => {
      btn.hidden = s === 'error';
      const playing = s === 'playing' || s === 'loading';
      btn.setAttribute('aria-pressed', String(playing));
      btn.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
      btn.dataset.state = s;
      btn.toggleAttribute('aria-busy', s === 'loading');
      if (s === 'blocked') showTip('Chạm để bật nhạc', 4000);
      if (s === 'playing' && !tipShown && ctx.config.music.title) { tipShown = true; showTip(ctx.config.music.title, 3000); }
    };
    const showTip = (t: string, ms: number) => {
      tip.textContent = t;
      tip.classList.add('is-on');
      setTimeout(() => tip.classList.remove('is-on'), ms);
    };
    btn.addEventListener('click', () => music.toggle());
    music.onChange(sync);
    sync(music.state);
    right.append(h('div', { class: 'fl-music-wrap' }, tip, btn));
  }

  // ---- scroll top
  if (ctx.config.floating.scrollTop) {
    const top = h('button', { type: 'button', class: 'fl-btn fl-top', 'aria-label': 'Lên đầu trang', hidden: true }, icon('chevU', 22));
    top.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: ctx.fx.state === 'reduced' ? 'auto' : 'smooth' });
      document.getElementById('hero-title')?.focus({ preventScroll: true });
    });
    // R12: chỉ hiện khi khách ĐANG cuộn lên và đã qua 1.5 màn; đứng yên 2s thì ẩn; ẩn khi tự cuộn đang chạy (CSS)
    let lastY = window.scrollY;
    let idleT: ReturnType<typeof setTimeout> | null = null;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const up = y < lastY - 2;
      if (Math.abs(y - lastY) > 2) lastY = y;
      if (y < window.innerHeight * 1.5) { top.hidden = true; return; }
      if (!up) return;
      top.hidden = false;
      if (idleT) clearTimeout(idleT);
      idleT = setTimeout(() => { top.hidden = true; }, 2000);
    }, { passive: true });
    right.prepend(top);
  }

  // ---- pill + menu nhanh
  if (ctx.config.floating.quickAction) {
    const items: MenuItem[] = ([
      { id: 'events', label: 'Sự kiện & chỉ đường', ic: 'pin' },
      { id: 'album', label: 'Album ảnh', ic: 'album' },
      { id: 'guestbook', label: 'Gửi lời chúc', ic: 'heart' },
      { id: 'rsvp', label: 'Xác nhận tham dự', ic: 'people' },
      { id: 'gift', label: 'Mừng cưới', ic: 'gift' },
    ] as MenuItem[]).filter((m) => visibleIds.has(m.id));
    const primary = (): MenuItem | undefined =>
      (!rsvpDone() && items.find((m) => m.id === 'rsvp')) || items.find((m) => m.id === 'guestbook') || items[0];
    const pillMain = h('a', { class: 'pill-main', href: '#' }, h('span', { class: 'pill-ic' }), h('span', { class: 'pill-l' }));
    const pillMore = h('button', { type: 'button', class: 'pill-more', 'aria-label': 'Mở menu nhanh', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, icon('chevU', 18));
    const pill = h('div', { class: 'pill' }, pillMain, pillMore);
    const setPrimary = () => {
      const m = primary();
      if (!m) { pill.hidden = true; return; }
      pillMain.setAttribute('href', `#${m.id}`);
      pillMain.dataset.target = m.id;
      pillMain.querySelector('.pill-ic')!.replaceChildren(icon(m.ic, 18));
      pillMain.querySelector('.pill-l')!.textContent = m.label;
    };
    setPrimary();
    on('rsvp-done', setPrimary);

    const fxBtn = ctx.config.effects.guestToggle && ctx.config.effects.intensity !== 'off'
      ? h('button', { type: 'button', class: 'menu-it' }, icon('wand', 18), h('span', null, '')) : null;
    const syncFx = () => { if (fxBtn) fxBtn.querySelector('span')!.textContent = fxEnabled() ? 'Tắt hiệu ứng' : 'Bật hiệu ứng'; };
    syncFx();
    // menu nhanh: "Tự cuộn: Bật/Tắt" (design-review-v1 5.2)
    const autoBtn = ctx.config.effects.autoScroll.enabled
      ? h('button', { type: 'button', class: 'menu-it', 'data-testid': 'menu-autoscroll' }, icon('playDown', 18), h('span', null, 'Tự cuộn: Bật')) : null;
    on('autoscroll-change', (running) => { if (autoBtn) autoBtn.querySelector('span')!.textContent = running ? 'Tự cuộn: Tắt' : 'Tự cuộn: Bật'; });
    const menu = h('div', { class: 'menu', role: 'menu', hidden: true },
      ...items.map((m) => h('a', { class: 'menu-it', role: 'menuitem', href: `#${m.id}` }, icon(m.ic, 18), h('span', null, m.label))),
      autoBtn, fxBtn);
    let untrap: (() => void) | null = null;
    const closeMenu = (focusBack = true) => {
      if (menu.hidden) return;
      menu.hidden = true;
      pillMore.setAttribute('aria-expanded', 'false');
      untrap?.();
      closeOverlay('menu');
      if (focusBack) pillMore.focus();
    };
    pillMore.addEventListener('click', () => {
      if (!menu.hidden) { closeMenu(); return; }
      menu.hidden = false;
      pillMore.setAttribute('aria-expanded', 'true');
      openOverlay('menu');
      untrap = trapFocus(menu);
      menu.querySelector<HTMLElement>('.menu-it')?.focus();
    });
    menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) closeMenu(false); });
    menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', (e) => { if (!menu.hidden && !root.contains(e.target as Node)) closeMenu(false); });
    fxBtn?.addEventListener('click', () => { setGuestFx(!fxEnabled()); syncFx(); closeMenu(); });
    autoBtn?.addEventListener('click', () => { closeMenu(); setTimeout(() => emit('autoscroll-toggle'), 0); });
    root.prepend(h('div', { class: 'fl-left' }, menu, pill));

    // ẩn pill khi section đích đang trong viewport; thu nhỏ khi cuộn xuống
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        for (const e of es) if (e.target.id === pillMain.dataset.target) pill.classList.toggle('is-away', e.isIntersecting);
      }, { threshold: 0.2 });
      items.forEach((m) => { const el = document.getElementById(m.id); if (el) io.observe(el); });
    }
    let lastY = window.scrollY;
    let t: ReturnType<typeof setTimeout> | null = null;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      pill.classList.toggle('is-mini', y > lastY && y > 200);
      lastY = y;
      if (t) clearTimeout(t);
      t = setTimeout(() => pill.classList.remove('is-mini'), 800);
    }, { passive: true });
  }

  document.body.appendChild(root);
  // WCAG 2.4.11: phần tử được focus nằm dưới cụm nút nổi -> cuộn vào giữa
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    if (root.contains(el) || !(el instanceof HTMLElement)) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 88) el.scrollIntoView({ block: 'center' });
  });
}
