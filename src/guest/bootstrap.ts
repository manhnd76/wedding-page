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

const SCROLL_KEY = 'wp_scroll_v1';

function readJson<T>(id: string): T | null {
  const el = document.getElementById(id);
  if (!el?.textContent) return null;
  return JSON.parse(el.textContent) as T;
}

async function loadConfig(): Promise<{ config: WeddingConfig; resolved: Resolved }> {
  let config = readJson<WeddingConfig>('wp-config');
  let resolved = readJson<Resolved>('wp-resolved');
  if (!config) {
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
  let loaded: { config: WeddingConfig; resolved: Resolved };
  try {
    loaded = await loadConfig();
  } catch (e) {
    console.error('[wedding-page] Không tải được cấu hình', e);
    errorScreen();
    return;
  }
  const url = new URL(location.href);
  Object.assign(ctx, {
    config: loaded.config,
    resolved: loaded.resolved,
    guest: guestNameFromUrl(url, loaded.config.guest),
    base: import.meta.env.BASE_URL,
    opened: false,
    overlays: new Set<string>(),
    typing: false,
    debug: url.searchParams.get('debug') === 'fx',
  });
  ctx.fx = computeFx();
  applyFxClasses(ctx.fx.state);
  for (const w of loaded.resolved.warnings ?? []) console.warn(`[wedding-page] ${w}`);
  watchTyping();

  const withCover = ctx.config.cover.enabled && url.searchParams.get('cover') !== '0';
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
    if (p.dividerBefore && main.lastElementChild && !main.lastElementChild.classList.contains('sec-hero')) main.append(divider(ctx.resolved.divider));
    main.append(el);
    visibleIds.add(p.item.id);
  }
  const app = document.getElementById('app') ?? document.body;
  app.replaceChildren(main);
  document.documentElement.dataset.texture = ctx.resolved.texture;
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
    const saved = Number(sessionStorage.getItem(SCROLL_KEY) ?? 0);
    if (saved > 0) window.scrollTo(0, saved);
    else document.getElementById('hero-title')?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    emit('pause-change');
    void afterOpen();
    let t: ReturnType<typeof setTimeout> | null = null;
    window.addEventListener('scroll', () => {
      if (t) return;
      t = setTimeout(() => { t = null; try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY))); } catch { /* ignore */ } }, 300);
    }, { passive: true });
  };

  if (withCover) {
    main.inert = true;
    main.setAttribute('aria-hidden', 'true');
    const cover = mountCover(music);
    void cover.opened.then(onOpened);
  } else {
    onOpened();
  }
}
