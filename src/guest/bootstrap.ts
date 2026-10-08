/**
 * Khởi động guest (solution 7 "Data Flow - Guest"):
 * đọc #wp-config + #wp-resolved (inline lúc build) -> tên khách -> render landing (inert) + cover -> chạm mở -> hiệu ứng.
 * Thiếu inline -> fetch content/config.json + resolve runtime (lazy import).
 */
import type { WeddingConfig } from '@shared/config/types';
import type { SectionType } from '@shared/config/enums';
import { guestNameFromUrl } from '@shared/guest-name';
import { planSections, type PlannedSection } from '@shared/sections/meta';
import { ctx, emit, watchTyping, type Resolved } from './context';
import { h } from './dom';
import { mountCover } from './cover/cover';
import { MusicPlayer } from './music/player';
import { mountFloating } from './floating/floating';
import { afterOpen, applyFxClasses, computeFx } from './effects/service';
import { prepareReveal } from './effects/reveal';
import { announcement, couple, families, footer, hero, loveStory, thankyou, timeline } from './sections/basic';
import { events } from './sections/events';
import { countdown } from './sections/countdown';
import { album } from './sections/album';
import { gift } from './sections/gift';
import { guestbook } from './sections/guestbook';
import { rsvp } from './sections/rsvp';
import { divider } from './sections/common';
import { assetUrl } from '@shared/assets';
import { EffectRegistry } from './effects/registry';
import type { PreviewBoot } from './preview-bridge';

const SCROLL_KEY = 'wp_scroll_v1';

function readJson<T>(id: string): T | null {
  const el = document.getElementById(id);
  if (!el?.textContent) return null;
  return JSON.parse(el.textContent) as T;
}

async function loadConfig(boot: PreviewBoot | null): Promise<{ config: WeddingConfig; resolved: Resolved }> {
  let config = boot ? null : readJson<WeddingConfig>('wp-config');
  let resolved = boot ? null : readJson<Resolved>('wp-resolved');
  if (boot) {
    // preview (admin): cấu hình nháp + ảnh mới qua blob: URL; luôn resolve lúc chạy
    const [{ migrate }, { mergeWithDefaults }, bridge] = await Promise.all([import('@shared/config/migrations'), import('@shared/config/merge'), import('./preview-bridge')]);
    config = mergeWithDefaults(migrate(bridge.applyAssets(boot.config, boot.assets)).config).config;
    if (boot.options.muteMusic !== false) config.music.autoplayAfterOpen = false;
  } else if (!config) {
    const res = await fetch(`${import.meta.env.BASE_URL}content/config.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: unknown = await res.json();
    const [{ migrate }, { mergeWithDefaults }] = await Promise.all([import('@shared/config/migrations'), import('@shared/config/merge')]);
    const m = mergeWithDefaults(migrate(raw).config);
    config = m.config;
    m.warnings.forEach((w) => console.warn(`[wedding-page] ${w}`));
    resolved = null;
  }
  if (!resolved) {
    const { resolveTheme, themeCssVars } = await import('@shared/theme/resolve');
    const { fontStack } = await import('@shared/fonts/registry');
    resolved = resolveTheme(config);
    if (boot) {
      const bridge = await import('./preview-bridge');
      resolved.ornamentUrl = await bridge.ornamentUrlFor(import.meta.env.BASE_URL, resolved.ornamentSet);
      await bridge.ensureFonts(import.meta.env.BASE_URL, [resolved.fonts.heading, resolved.fonts.script, resolved.fonts.body]);
    }
    const vars = themeCssVars(resolved, { heading: fontStack(resolved.fonts.heading), script: fontStack(resolved.fonts.script), body: fontStack(resolved.fonts.body) });
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
    document.documentElement.dataset.mode = resolved.mode;
    document.documentElement.dataset.theme = resolved.preset;
  }
  return { config, resolved };
}

function errorScreen(): void {
  document.body.replaceChildren(h('main', { class: 'err-screen' },
    h('h1', { class: 'h2' }, document.title || 'Thiệp cưới'),
    h('p', null, 'Không tải được thiệp, vui lòng thử lại'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => location.reload() }, 'Tải lại')));
}

function renderSection(p: PlannedSection, visible: Set<SectionType>): HTMLElement | null {
  switch (p.item.type) {
    case 'hero': return hero(p);
    case 'couple': return couple(p);
    case 'families': return families(p);
    case 'announcement': return announcement(p);
    case 'events': return events(p, visible.has('rsvp'));
    case 'countdown': return countdown(p);
    case 'timeline': return timeline(p);
    case 'loveStory': return loveStory(p);
    case 'album': return album(p);
    case 'gift': return gift(p);
    case 'guestbook': return guestbook(p);
    case 'rsvp': return rsvp(p);
    case 'thankyou': return thankyou(p);
    case 'footer': return footer(p);
    default: return null;
  }
}

export async function bootstrap(): Promise<void> {
  const url = new URL(location.href);
  // preview trong admin (?preview=1): chờ cấu hình nháp qua postMessage (solution 4.3)
  const bridge = url.searchParams.get('preview') === '1' ? await import('./preview-bridge') : null;
  const boot = bridge ? await bridge.waitForBoot() : null;
  let loaded: { config: WeddingConfig; resolved: Resolved };
  try {
    loaded = await loadConfig(boot);
  } catch (e) {
    console.error('[wedding-page] Không tải được cấu hình', e);
    bridge?.post({ type: 'wp:preview-error', message: String(e) });
    errorScreen();
    return;
  }
  const fxTarget = boot?.fx?.target ?? null;
  if (boot?.fx?.speed) EffectRegistry.setTimeScale(boot.fx.speed);
  const guestUrl = boot?.options.guestName ? new URL(`/?to=${encodeURIComponent(boot.options.guestName)}`, location.origin) : url;
  Object.assign(ctx, {
    config: loaded.config,
    resolved: loaded.resolved,
    guest: guestNameFromUrl(guestUrl, boot?.options.guestName ? { ...loaded.config.guest, queryParam: 'to' } : loaded.config.guest),
    base: import.meta.env.BASE_URL,
    opened: false,
    overlays: new Set<string>(),
    typing: false,
    debug: url.searchParams.get('debug') === 'fx',
    preview: boot ? {
      simulate: boot.fx?.simulate ?? {},
      animateReveal: fxTarget === 'reveal' || fxTarget === 'cover',
      burst: fxTarget === 'cover' || fxTarget === 'burst',
    } : undefined,
  });
  ctx.fx = computeFx();
  applyFxClasses(ctx.fx.state);
  for (const w of loaded.resolved.warnings ?? []) console.warn(`[wedding-page] ${w}`);
  watchTyping();

  const withCover = boot
    ? fxTarget === 'cover' || (!fxTarget && ctx.config.cover.enabled && !boot.options.skipCover)
    : ctx.config.cover.enabled && url.searchParams.get('cover') !== '0';
  // bật trước khi render landing: landing dưới cover không được layout -> chỉ tải font cover lúc đầu
  if (withCover) document.documentElement.classList.add('cover-on', 'landing-wait');

  // ---- landing
  const plan = planSections(ctx.config, ctx.resolved.divider, (w) => console.warn(`[wedding-page] ${w}`));
  const visible = new Set(plan.map((p) => p.item.type));
  const main = h('main', { id: 'main', class: `landing frame-${ctx.resolved.photoFrame}` });
  const visibleIds = new Set<string>();
  for (const p of plan) {
    const el = renderSection(p, visible);
    if (!el) continue;
    if (p.dividerBefore && main.lastElementChild && !main.lastElementChild.classList.contains('sec-hero')) main.append(divider(ctx.resolved.divider, el, main.lastElementChild));
    main.append(el);
    visibleIds.add(p.item.id);
  }
  const app = document.getElementById('app') ?? document.body;
  app.replaceChildren(main);
  document.documentElement.dataset.texture = ctx.resolved.texture;
  document.documentElement.dataset.script = ctx.resolved.fonts.script;
  // nút cuộn ở hero -> section kế tiếp
  const cue = main.querySelector<HTMLAnchorElement>('.hero-cue');
  const nextSec = main.querySelectorAll<HTMLElement>('.sec')[1];
  if (cue) { if (nextSec?.id) cue.href = `#${nextSec.id}`; else cue.remove(); }

  prepareReveal(main, ctx.resolved.reveal, ctx.fx.state);

  const cfgMusic = ctx.config.music;
  const music = new MusicPlayer(cfgMusic.enabled && cfgMusic.src ? assetUrl(cfgMusic.src, ctx.base) : null, {
    loop: cfgMusic.loop, startAt: cfgMusic.startAt, title: cfgMusic.title,
  });
  mountFloating(music, visibleIds);

  const onOpened = () => {
    ctx.opened = true;
    main.inert = false;
    main.removeAttribute('aria-hidden');
    document.documentElement.classList.add('is-opened');
    const saved = boot ? 0 : Number(sessionStorage.getItem(SCROLL_KEY) ?? 0);
    if (boot) previewAfterOpen(boot, fxTarget, bridge!);
    else if (saved > 0) window.scrollTo(0, saved);
    else document.getElementById('hero-title')?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    emit('pause-change');
    void afterOpen();
    // tự cuộn (design-review-v1 mục 5): không chạy trong preview admin trừ khi phát lại "autoscroll"
    if (ctx.config.effects.autoScroll.enabled && !boot) {
      void import('./autoscroll/autoscroll').then((m) => m.mountAutoScroll({ restored: saved > 0, hasHash: location.hash.length > 1 }));
    }
    let t: ReturnType<typeof setTimeout> | null = null;
    if (!boot) window.addEventListener('scroll', () => {
      if (t) return;
      t = setTimeout(() => { t = null; try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY))); } catch { /* ignore */ } }, 300);
    }, { passive: true });
  };

  if (withCover) {
    main.inert = true;
    main.setAttribute('aria-hidden', 'true');
    const cover = mountCover(music);
    void cover.opened.then(onOpened);
    if (fxTarget === 'cover') autoOpen(cover.el);
  } else {
    onOpened();
  }
  if (boot && bridge) {
    bridge.listenAfterRender(boot);
    bridge.post({ type: 'wp:preview-ready', phase: 'rendered' });
  }
}

/** Preview "Phát lại kiểu mở thiệp": tự chạm mở khi cover sẵn sàng. */
function autoOpen(cover: HTMLElement): void {
  const tryOpen = () => {
    const cta = cover.querySelector<HTMLButtonElement>('.cv-cta');
    if (cta && !cta.disabled) { setTimeout(() => cta.click(), 450); return; }
    setTimeout(tryOpen, 60);
  };
  tryOpen();
}

/** Preview: giữ vị trí cuộn / cuộn tới phần đang xem, chạy hiệu ứng được yêu cầu, báo fx:done. */
function previewAfterOpen(boot: PreviewBoot, target: string | null, bridge: typeof import('./preview-bridge')): void {
  const o = boot.options;
  const done = (ms: number) => { if (target) setTimeout(() => bridge.post({ type: 'fx:done', target }), ms * Math.max(1, 1 / (boot.fx?.speed ?? 1))); };
  if (!target) {
    if (o.scrollY) window.scrollTo(0, o.scrollY);
    bridge.applyOptions(o);
    return;
  }
  if (target === 'cover') { done(1600); return; }
  if (target === 'autoscroll') {
    window.scrollTo(0, 0);
    void import('./autoscroll/autoscroll').then((m) => {
      if (!m.mountAutoScroll({ restored: false, hasHash: false, previewMs: 8000, onPreviewDone: () => bridge.post({ type: 'fx:done', target }) })) done(300);
    });
    return;
  }
  if (target === 'burst' || target === 'particles') { window.scrollTo(0, 0); done(target === 'burst' ? 2600 : 1200); return; }
  if (target === 'reveal') {
    const secs = Array.from(document.querySelectorAll<HTMLElement>('main .sec'));
    const first = secs.find((s, i) => i > 0 && s.querySelector('img')) ?? secs[1];
    if (first) {
      window.scrollTo(0, Math.max(0, first.offsetTop - window.innerHeight * 0.6));
      setTimeout(() => window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' }), 250);
    }
    done(2200);
    return;
  }
  // micro:<mã> hoặc tên section -> cuộn tới section liên quan
  const sec = target.startsWith('micro:') ? MICRO_SECTION[target.slice(6)] ?? '' : target;
  if (sec) document.getElementById(sec)?.scrollIntoView({ block: 'start' });
  else if (o.scrollY) window.scrollTo(0, o.scrollY);
  done(900);
}

const MICRO_SECTION: Record<string, string> = {
  wishFly: 'guestbook', 'wish-fly': 'guestbook', rsvp: 'rsvp', 'rsvp-success': 'rsvp', countdown: 'countdown',
  fireworks: 'countdown', photoTilt: 'album', 'photo-tilt': 'album', buttonShine: 'hero',
};
