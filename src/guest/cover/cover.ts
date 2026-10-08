/**
 * Màn cover / phong bì (design 3). Overlay fixed `z-cover`; landing render sẵn bên dưới (`inert`, khoá cuộn).
 * Handler chạm ĐỒNG BỘ: music.play() -> chạy kiểu mở (chạm lần 2 = tua nhanh 300ms) -> gỡ cover.
 */
import { graphemes } from '@shared/guest-name';
import { assetUrl } from '@shared/assets';
import { ctx } from '../context';
import { css, h, multiline, nonEmpty } from '../dom';
import { icon, ornament } from '../icons';
import { fx } from '../effects/intensity';
import { EffectRegistry } from '../effects/registry';
import type { MusicPlayer } from '../music/player';
import { fade200, fadeZoom, loadOpenModule, type PlayFn } from './open-registry';
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

/** Font script khó đọc ở cỡ nhỏ (design-review-v1 R06/R09): lời chào dùng heading italic thay vì script. */
export const CAUTION_SCRIPTS = new Set(['imperial-script', 'moon-dance', 'birthstone']);

function guestLines(cls: 'cv' | 'env'): HTMLElement[] {
  const g = ctx.guest.display;
  const long = graphemes(g).length > 22;
  const pre = (ctx.config.cover.guestPrefix ?? '').trim();
  const out: HTMLElement[] = [];
  // trên mặt phong bì ghi như địa chỉ: "Kính gửi" (bỏ dấu ":")
  if (nonEmpty(pre)) out.push(h('p', { class: `${cls}-prefix` }, cls === 'env' ? pre.replace(/[:：]\s*$/, '') : pre));
  out.push(h('p', { class: `${cls}-guest${long ? ' is-long' : ''}` }, g));
  return out;
}

function cardBody(): HTMLElement {
  return h('div', { class: 'cv-card-body' },
    namesBlock('cv-names'),
    ornament(ctx.resolved.ornamentUrl ?? '', 'divider', 'orn cv-orn', 160, 24),
    ...guestLines('cv'));
}

function greeting(): HTMLElement | null {
  const c = ctx.config.cover;
  if (!c.showOpenedGreeting || !nonEmpty(c.openedGreeting)) return null;
  const plain = CAUTION_SCRIPTS.has(ctx.resolved.fonts.script);
  return h('div', { class: `cv-greet${plain ? ' is-plain' : ''}`, 'aria-hidden': 'true' },
    h('p', { class: 'cv-greet-h' }, c.openedGreeting),
    nonEmpty(c.openedSubline) ? h('p', { class: 'cv-greet-s' }, ...multiline(c.openedSubline)) : null);
}

/**
 * Phong bì ngang 10:7 (design-review-v1 3.2): lớp back < card < front (túi + "Kính gửi …") < flap < seal.
 * Phần hình (SVG) do skin của mẫu đang chọn vẽ vào các lớp (lazy: `styles/envelope.ts` prepare()).
 */
function envelopeStage(): HTMLElement {
  const env = ctx.resolved.envelope;
  const mono = ctx.config.cover.monogram;
  const onFront = env?.guestOnFront !== false;
  // thẻ bên trong: ornament + monogram; khi rút ra đổi sang lời chào. Tên khách vào thẻ nếu không in trên phong bì
  const inner = h('div', { class: 'cv-card-body' },
    ornament(ctx.resolved.ornamentUrl ?? '', 'title', 'orn cv-orn-s', 80, 16),
    nonEmpty(mono) ? h('p', { class: 'cv-card-mono' }, mono) : null,
    ...(onFront ? [] : guestLines('cv')));
  return h('div', { class: 'cv-stage cv-env-wrap' },
    h('div', { class: 'cv-env' },
      h('div', { class: 'env-back' }),
      h('div', { class: 'cv-card' }, inner, greeting()),
      h('div', { class: 'env-front' }, onFront ? h('div', { class: 'env-addr' }, ...guestLines('env')) : null),
      h('div', { class: 'env-flap' }, h('div', { class: 'env-flap-f' }), h('div', { class: 'env-flap-b' })),
      h('div', { class: 'env-deco' }),
      h('div', { class: 'env-seal' })));
}

function stage(style: string): HTMLElement {
  const mono = ctx.config.cover.monogram;
  if (style === 'envelope') return envelopeStage();
  if (style === 'card-flip') {
    return h('div', { class: 'cv-stage cv-flip' },
      h('div', { class: 'cv-flip-inner' },
        h('div', { class: 'cv-face cv-front cv-card' }, cardBody()),
        h('div', { class: 'cv-face cv-back cv-card', 'aria-hidden': 'true' },
          greeting() ?? h('div', { class: 'cv-greet' }, h('p', { class: 'cv-greet-h' }, mono)))));
  }
  return h('div', { class: 'cv-stage cv-plain' }, h('div', { class: 'cv-card' }, cardBody()));
}

/** Mẫu + màu phong bì -> data-* (CSS chọn bảng màu); màu tự chọn (hex) -> biến CSS qua CSSOM (CSP). */
function applyEnvelopeColors(el: HTMLElement): void {
  const env = ctx.resolved.envelope;
  if (!env) return;
  el.dataset.env = env.style;
  if (env.themed) el.dataset.envThemed = '';
  if (!env.liner) el.dataset.envNoLiner = '';
  if (env.paper && env.ink) {
    const light = env.ink === '#FFFFFF';
    css(el, {
      '--env-paper': env.paper, '--env-paper-2': env.paper, '--env-ink': env.ink, '--env-ink-2': env.ink,
      '--env-edge': light ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.25)',
    });
  }
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
  const isEnv = domStyle === 'envelope';
  const actions = h('div', { class: 'cv-actions' }, cta, hint);
  // phong bì: tên cặp đôi NGOÀI phong bì, phía trên (LCP, đọc được trước khi skin tải xong)
  const el = h('div', { class: `cover cover--${domStyle}`, 'data-open': styleId, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Thiệp mời' },
    bgImg ? h('div', { class: 'cv-bg' }, bgImg) : null,
    ornament(r.ornamentUrl ?? '', 'corner', 'orn cv-corner cv-corner--tl', 96, 96),
    ornament(r.ornamentUrl ?? '', 'corner', 'orn cv-corner cv-corner--br', 96, 96),
    h('div', { class: 'cv-inner' },
      h('div', { class: 'cv-head' },
        nonEmpty(c.eyebrow) ? h('p', { class: 'cv-eyebrow' }, c.eyebrow) : null,
        nonEmpty(c.dateText) ? h('p', { class: 'cv-date' }, c.dateText) : null,
        isEnv ? namesBlock('cv-names') : null),
      st,
      actions));
  if (isEnv) applyEnvelopeColors(el);
  document.body.appendChild(el);
  document.documentElement.classList.add('cover-on');
  if (music.available && ctx.config.music.enabled) music.preload();

  // ---- chuẩn bị: font tên (≤1.5s) + module kiểu mở (+ skin phong bì); >300ms hiện "Đang chuẩn bị…", >4s vẫn cho mở
  let play: PlayFn | null = mode === 'fade200' ? fade200 : null;
  const fontsReady = waitNameFont().then(() => el.classList.add('is-fonts'));
  // phong bì cần skin cả khi reduced/Tắt (hình tĩnh) -> luôn tải module envelope
  const modReady = loadOpenModule(isEnv ? 'envelope' : styleId).then(async (m) => {
    if (m?.prepare) { try { await m.prepare(el); } catch { /* skin lỗi: vẫn mở được bằng hình CSS */ } }
    if (!play) play = m?.play ?? fadeZoom;
  }).finally(() => el.classList.add('is-skin'));
  let ready = false;
  const setReady = () => {
    if (ready) return;
    ready = true;
    el.classList.add('is-skin');
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
    el.classList.add('is-opening');
    cta.classList.remove('is-breathe');
    // R05: nút + dòng nhạc rút đi ngay để mắt khách theo phong bì
    if (typeof actions.animate === 'function') {
      actions.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }],
        { duration: mode === 'fade200' ? 1 : 200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    }
    const fn = play ?? fadeZoom;
    run = fn(el, { level: mode === 'full+' ? 'full+' : mode === 'light' ? 'light' : 'full', greeting: c.showOpenedGreeting, timeScale: EffectRegistry.timeScale });
    void run.finished.then(() => {
      el.remove();
      document.documentElement.classList.remove('cover-on');
      resolveOpened();
    });
  };
  // R05: chạm vào nút/phong bì = mở; khi đang mở, chạm BẤT KỲ đâu trên cover = tua nhanh
  el.addEventListener('click', (e) => { if (run || cta.contains(e.target as Node) || st.contains(e.target as Node)) open(e); });
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
