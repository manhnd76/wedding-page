/**
 * Điều phối hiệu ứng sau khi mở thiệp: ParticleField (hạt nền + burst), burst onOpen, reveal, FPS probe,
 * Ken Burns/parallax, nút khách bật/tắt hiệu ứng.
 */
import { ctx, emit, fxBlocked } from '../context';
import { EffectRegistry } from './registry';
import { MATRIX, burstCount, computeIntensity, type FxState } from './intensity';
import { prepareReveal, revealAll, startReveal } from './reveal';
import { startPerfProbe } from './perf-probe';
import type { ParticleField } from './particles/field';

let field: ParticleField | null = null;
let fieldPromise: Promise<ParticleField | null> | null = null;
let kindCount = 0;

export const FX_PREF_KEY = 'wp_fx_v1';

export function readGuestPref(): 'on' | 'off' | null {
  try {
    const v = localStorage.getItem(FX_PREF_KEY);
    return v === 'on' || v === 'off' ? v : null;
  } catch { return null; }
}

export function deviceInfo() {
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const sim = ctx.preview?.simulate;
  if (ctx.preview) {
    // preview admin: mặc định như máy khoẻ, không giảm chuyển động (admin chủ động bấm xem); "Mô phỏng" ép nhánh tương ứng
    return { hardwareConcurrency: sim?.lowEnd ? 2 : 8, deviceMemory: sim?.lowEnd ? 1 : 8, saveData: false, reducedMotion: !!sim?.reducedMotion };
  }
  return {
    hardwareConcurrency: n.hardwareConcurrency,
    ...(n.deviceMemory !== undefined ? { deviceMemory: n.deviceMemory } : {}),
    saveData: n.connection?.saveData === true,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  };
}

export function computeFx() {
  const e = ctx.config.effects;
  return computeIntensity(
    { intensity: e.intensity, respectReducedMotion: e.respectReducedMotion, autoDowngrade: e.autoDowngrade, guestToggle: e.guestToggle, guestPref: readGuestPref() },
    deviceInfo(),
  );
}

/** Gắn class trên <html> để CSS biết cấp hiệu ứng. */
export function applyFxClasses(state: FxState): void {
  const html = document.documentElement;
  html.dataset.fx = state;
  html.classList.toggle('fx-kb', MATRIX.kenBurns[state] && ctx.config.effects.kenBurns);
  html.classList.toggle('fx-press', MATRIX.press[state] === 'anim');
  html.classList.toggle('fx-attn', MATRIX.attention[state]);
  html.classList.toggle('fx-heart', MATRIX.heartbeat[state]);
}

/** Tạo field (lazy). Không tạo canvas khi off/reduced (design 5.7 lớp 4). */
export function getField(): Promise<ParticleField | null> {
  if (fieldPromise) return fieldPromise;
  const state = ctx.fx.state;
  if (state === 'off' || state === 'reduced') return (fieldPromise = Promise.resolve(null));
  fieldPromise = (async () => {
    const [{ ParticleField, paletteOpts }, { loadKinds }] = await Promise.all([import('./particles/field'), import('./particles/types')]);
    const r = ctx.resolved;
    const kinds = await loadKinds(r.particles.types);
    kindCount = kinds.length;
    const pc = paletteOpts(r.particles.color);
    field = new ParticleField({
      state, lowEnd: ctx.fx.lowEnd, kinds, ...pc, colors: [...pc.colors],
      themeDensity: r.particles.densityFactor, scope: ctx.config.effects.particles.scope,
      wind: ctx.config.effects.particles.wind && MATRIX.wind[state], background: ctx.config.effects.particles.enabled,
    });
    EffectRegistry.register('particles', { play: () => field?.start(), setTimeScale: (x) => { if (field) field.timeScale = x; } });
    if (ctx.debug) {
      const w = window as unknown as Record<string, unknown>;
      w.__wpFx = { snapshot: () => field?.debugSnapshot(), field };
      // v4a-2c: phát thử burst bất kỳ (heart-burst / confetti RSVP chưa móc vào nút tới v3); số hạt mặc định theo cấp
      w.__wpBurst = async (id: string, o: Partial<import('./burst/registry').BurstOpts> = {}) => {
        const m = await import('./burst/registry');
        return field ? m.playBurst(id, field, { count: burstCount(id, state), kindCount, ...o }) : 0;
      };
    }
    return field;
  })().catch(() => null);
  return fieldPromise;
}

/** Sau khi mở thiệp: burst onOpen -> hạt nền -> reveal -> FPS probe. */
export async function afterOpen(): Promise<void> {
  const state = ctx.fx.state;
  if (ctx.preview && !ctx.preview.animateReveal) revealAll(document);
  else startReveal(document);
  setupParallax(state);
  if (state === 'off' || state === 'reduced') return;
  const f = await getField();
  if (!f) return;
  const burst = ctx.resolved.burstOnOpen;
  // burst "Sau khi mở": registry theo id (burst/registry.ts, chunk lười), tải lúc rảnh, bỏ nếu về trễ
  if (burst !== 'none' && (!ctx.preview || ctx.preview.burst)) {
    void import('./burst/registry').then((m) => m.scheduleOnOpenBurst(f, burst, state, kindCount)).catch(() => undefined);
  }
  f.start();
  if (ctx.config.effects.autoDowngrade) {
    startPerfProbe((step) => {
      if (step === 'wind' || step === 'halfParticles' || step === 'particles') f.degrade(step);
      if (step === 'kenBurns') document.documentElement.classList.remove('fx-kb');
      if (step === 'parallaxLayers') document.documentElement.classList.add('fx-no-parallax');
    }, fxBlocked);
  }
}

/** Parallax ảnh nền hero/thank-you 0.15 tốc độ cuộn - chỉ cấp Nhiều (design 5.3). */
function setupParallax(state: FxState) {
  if (!MATRIX.parallax[state] || !ctx.config.effects.parallax) return;
  const imgs = Array.from(document.querySelectorAll<HTMLElement>('.hero-media img, .ty-media img'));
  if (!imgs.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    if (document.documentElement.classList.contains('fx-no-parallax')) return;
    for (const im of imgs) {
      const r = im.parentElement!.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      im.style.setProperty('translate', `0 ${Math.round(-r.top * 0.15)}px`);
    }
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/** Nút khách "Bật/Tắt hiệu ứng" (design 5.4, 7.1). */
export function setGuestFx(on_: boolean): void {
  try { localStorage.setItem(FX_PREF_KEY, on_ ? 'on' : 'off'); } catch { /* ignore */ }
  ctx.fx = computeFx();
  applyFxClasses(ctx.fx.state);
  if (!on_) {
    field?.destroy();
    field = null;
    fieldPromise = null;
    revealAll(document);
  } else {
    prepareReveal(document, ctx.resolved.reveal, ctx.fx.state);
    revealAll(document);
    void afterOpen();
  }
  emit('fx-change');
}

export function fxEnabled(): boolean {
  return ctx.fx.state !== 'off' && ctx.fx.state !== 'reduced';
}

