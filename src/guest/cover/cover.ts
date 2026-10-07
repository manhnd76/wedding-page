/**
 * Màn cover / phong bì (design 3). Overlay fixed `z-cover`; landing render sẵn bên dưới (`inert`, khoá cuộn).
 * Handler chạm ĐỒNG BỘ: music.play() -> chạy kiểu mở (chạm lần 2 = tua nhanh 300ms) -> gỡ cover.
 */
import { graphemes } from '@shared/guest-name';
import { assetUrl } from '@shared/assets';
import { ctx } from '../context';
import { h, multiline, nonEmpty } from '../dom';
import { icon, ornament } from '../icons';
import { fx } from '../effects/intensity';
import type { MusicPlayer } from '../music/player';
import { fade200, fadeZoom, loadOpenStyle, type PlayFn } from './open-registry';
import type { OpenRun } from './anim';

const PREP_DELAY_MS = 300;
const PREP_MAX_MS = 4000;
const NAME_FONT_WAIT_MS = 1500;

function coupleNames() {
  const { groom, bride, order } = ctx.config.content.couple;
  const g = groom.shortName || groom.fullName;
  const b = bride.shortName || bride.fullName;
  return order === 'bride-first' ? [b, g] : [g, b];
}

/** Khối tên cặp đôi: "Minh Anh / & / Thuỳ Linh" (font script). */
export function namesBlock(cls: string, tag: 'p' | 'h1' = 'p'): HTMLElement {
  const [a, b] = coupleNames();
  return h(tag, { class: cls },
    h('span', { class: 'nm-a' }, a ?? ''),
    h('span', { class: 'nm-amp', 'aria-hidden': 'true' }, '&'),
    h('span', { class: 'sr-only' }, ' và '),
    h('span', { class: 'nm-b' }, b ?? ''));
}

function cardBody(): HTMLElement {
  const c = ctx.config.cover;
  const g = ctx.guest.display;
  const long = graphemes(g).length > 22;
  return h('div', { class: 'cv-card-body' },
    namesBlock('cv-names'),
    ornament(ctx.resolved.ornamentUrl ?? '', 'divider', 'orn cv-orn'),
    nonEmpty(c.guestPrefix) ? h('p', { class: 'cv-prefix' }, c.guestPrefix) : null,
    h('p', { class: `cv-guest${long ? ' is-long' : ''}` }, g));
}

function greeting(): HTMLElement | null {
  const c = ctx.config.cover;
  if (!c.showOpenedGreeting || !nonEmpty(c.openedGreeting)) return null;
  return h('div', { class: 'cv-greet', 'aria-hidden': 'true' },
    h('p', { class: 'cv-greet-h' }, c.openedGreeting),
    nonEmpty(c.openedSubline) ? h('p', { class: 'cv-greet-s' }, ...multiline(c.openedSubline)) : null);
}

function stage(style: string): HTMLElement {
  const mono = ctx.config.cover.monogram;
  if (style === 'envelope') {
    return h('div', { class: 'cv-stage cv-env-wrap' },
      h('div', { class: 'cv-env' },
        h('div', { class: 'cv-env-back' }),
        h('div', { class: 'cv-card' }, cardBody(), greeting()),
        h('div', { class: 'cv-env-pocket' }),
        h('div', { class: 'cv-flap' }, h('div', { class: 'cv-flap-face' })),
        h('div', { class: 'cv-seal' }, h('span', null, mono || '♡'))));
  }
  if (style === 'card-flip') {
    return h('div', { class: 'cv-stage cv-flip' },
      h('div', { class: 'cv-flip-inner' },
        h('div', { class: 'cv-face cv-front cv-card' }, cardBody()),
        h('div', { class: 'cv-face cv-back cv-card', 'aria-hidden': 'true' },
          greeting() ?? h('div', { class: 'cv-greet' }, h('p', { class: 'cv-greet-h' }, mono)))));
  }
  return h('div', { class: 'cv-stage cv-plain' }, h('div', { class: 'cv-card' }, cardBody()));
}

export interface CoverHandle { el: HTMLElement; opened: Promise<void> }

export function mountCover(music: MusicPlayer): CoverHandle {
  const c = ctx.config.cover;
  const r = ctx.resolved;
  const state = ctx.fx.state;
  const mode = fx('openStyle', state);
  // reduced/off -> fade 200ms; cấu trúc DOM vẫn theo kiểu đã chọn (tĩnh)
  const styleId = r.openStyle;
  const domStyle = styleId === 'envelope' || styleId === 'card-flip' ? styleId : 'plain';

  const bgImg = c.background === 'image' && c.backgroundImage?.src
    ? h('img', { class: 'cv-bg-img', src: assetUrl(c.backgroundImage.src, ctx.base), alt: '', 'aria-hidden': 'true', decoding: 'async' })
    : null;
  const cta = h('button', { class: 'btn btn-primary cv-cta', type: 'button', disabled: true },
    icon('heart', 18), h('span', { class: 'cv-cta-label' }, 'Đang chuẩn bị thiệp…'));
  const hint = music.available && ctx.config.music.enabled && nonEmpty(c.musicHint)
    ? h('p', { class: 'cv-hint' }, icon('music', 14), c.musicHint) : null;
  const st = stage(domStyle);
  st.setAttribute('role', 'button');
  st.setAttribute('tabindex', '0');
  st.setAttribute('aria-label', c.tapToOpenLabel || 'Mở thiệp');
  const el = h('div', { class: `cover cover--${domStyle}`, 'data-open': styleId, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Thiệp mời' },
    bgImg ? h('div', { class: 'cv-bg' }, bgImg) : null,
    ornament(r.ornamentUrl ?? '', 'corner', 'orn cv-corner cv-corner--tl', 80, 80),
    ornament(r.ornamentUrl ?? '', 'corner', 'orn cv-corner cv-corner--br', 80, 80),
    h('div', { class: 'cv-inner' },
      nonEmpty(c.eyebrow) ? h('p', { class: 'cv-eyebrow' }, c.eyebrow) : null,
      nonEmpty(c.dateText) ? h('p', { class: 'cv-date' }, c.dateText) : null,
      st,
      h('div', { class: 'cv-actions' }, cta, hint)));
  document.body.appendChild(el);
  document.documentElement.classList.add('cover-on');
  if (music.available && ctx.config.music.enabled) music.preload();

  // ---- chuẩn bị: font tên (≤1.5s) + module kiểu mở; >300ms hiện "Đang chuẩn bị…", >4s vẫn cho mở
  let play: PlayFn | null = mode === 'fade200' ? fade200 : null;
  const fontsReady = waitNameFont().then(() => el.classList.add('is-fonts'));
  const modReady = play ? Promise.resolve() : loadOpenStyle(styleId).then((p) => { play = p ?? fadeZoom; });
  let ready = false;
  const setReady = () => {
    if (ready) return;
    ready = true;
    cta.disabled = false;
    cta.querySelector('.cv-cta-label')!.textContent = c.tapToOpenLabel || 'Chạm để mở thiệp';
    el.classList.add('is-ready');
    if (fx('attention', state)) cta.classList.add('is-breathe');
    cta.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  };
  const prepTimer = setTimeout(() => el.classList.add('is-preparing'), PREP_DELAY_MS);
  void Promise.all([fontsReady, modReady]).then(() => { clearTimeout(prepTimer); setReady(); });
  setTimeout(setReady, PREP_MAX_MS);

  let run: OpenRun | null = null;
  let resolveOpened!: () => void;
  const opened = new Promise<void>((res) => (resolveOpened = res));

  const open = (e?: Event) => {
    e?.preventDefault();
    if (!ready) return;
    if (run) { run.fastForward(); return; } // chạm lần 2 = tua nhanh
    // 1) nhạc: gọi play() đồng bộ trong cử chỉ
    if (ctx.config.music.enabled && ctx.config.music.autoplayAfterOpen && music.available) void music.playFromGesture();
    // 2) hiện landing bên dưới (đang display:none để chỉ tải font cover) rồi chạy kiểu mở
    document.documentElement.classList.remove('landing-wait');
    el.setAttribute('aria-busy', 'true');
    cta.classList.remove('is-breathe');
    const fn = play ?? fadeZoom;
    run = fn(el, { level: mode === 'full+' ? 'full+' : mode === 'light' ? 'light' : 'full', greeting: c.showOpenedGreeting, timeScale: 1 });
    void run.finished.then(() => {
      el.remove();
      document.documentElement.classList.remove('cover-on');
      resolveOpened();
    });
  };
  cta.addEventListener('click', open);
  st.addEventListener('click', open);
  st.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(e); });
  return { el, opened };
}

function waitNameFont(): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.load) return Promise.resolve();
  const [a, b] = coupleNames();
  const sample = `${a ?? ''}&${b ?? ''}`;
  const fam = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const timeout = new Promise<void>((r) => setTimeout(r, NAME_FONT_WAIT_MS));
  const load = Promise.all([
    fonts.load(`400 48px ${fam('--ff-script')}`, sample),
    fonts.load(`italic 400 24px ${fam('--ff-heading')}`, ctx.guest.display),
  ]).then(() => undefined).catch(() => undefined);
  return Promise.race([load, timeout]);
}
