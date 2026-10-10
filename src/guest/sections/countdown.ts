/**
 * Đếm ngược (design 4.6, 5.9): style flip + simple (v1), slide + odometer (v4a-2a §4.3-4.4), milestones,
 * 3 trạng thái (trước / trong ngày / sau), aria-live chỉ trên dòng ẩn cập nhật mỗi phút; pháo hoa every-view (chunk lazy).
 * Ô giây: Vừa chỉ mờ dần, Nhiều mới quay/trượt (flip giữ như cũ: không lật giây).
 */
import type { PlannedSection } from '@shared/sections/meta';
import { countdownTarget } from '@shared/sections/meta';
import { capOr } from '@shared/capabilities';
import { ctx, fxBlocked } from '../context';
import { h, nonEmpty } from '../dom';
import { fireworksSpec, fx } from '../effects/intensity';
import { getField } from '../effects/service';
import { EffectRegistry } from '../effects/registry';
import { FireworksTrigger } from '../effects/burst/fireworks-trigger';
import { shell, vnDayKey } from './common';

const MILESTONES = [100, 30, 7, 1];
const UNITS = [['d', 'Ngày'], ['h', 'Giờ'], ['m', 'Phút'], ['s', 'Giây']] as const;

export function remaining(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  return { d: Math.floor(ms / 86_400_000), h: Math.floor(ms / 3_600_000) % 24, m: Math.floor(ms / 60_000) % 60, s: Math.floor(ms / 1000) % 60, ms };
}

export type CountdownPhase = 'before' | 'today' | 'after';
export function phase(target: Date, now: Date): CountdownPhase {
  if (vnDayKey(now) === vnDayKey(target)) return 'today';
  return now < target ? 'before' : 'after';
}

export function countdown(p: PlannedSection): HTMLElement | null {
  const c = ctx.config.content.countdown;
  const target = countdownTarget(ctx.config);
  if (!target) return null;
  if (c.hideAfter && phase(target, new Date()) === 'after') return null;
  const capWarn: string[] = [];
  const style = capOr('countdownStyle', c.style, capWarn);
  capWarn.forEach((w) => console.warn(`[wedding-page] ${w}`));
  const anim = style === 'simple' ? 'instant' : fx('countdown', ctx.fx.state);

  const cells = UNITS.map(([k, label]) => {
    const v = h('span', { class: 'cd-v' }, '00');
    return { k, v, el: h('div', { class: 'cd-cell' }, v, h('span', { class: 'cd-l eyebrow' }, label)) };
  });
  const grid = h('div', { class: `cd-grid cd--${style}`, 'aria-hidden': 'true' }, ...cells.map((x) => x.el));
  const msg = h('p', { class: 'cd-msg' });
  const chip = h('p', { class: 'cd-chip', hidden: true });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const sec = shell(p, { eyebrow: c.eyebrow, heading: c.heading, cls: 'sec-cd' }, h('div', { class: 'cd-wrap', 'data-rv': 'block' }, grid, msg, chip, live));

  const prev: Record<string, string> = {};
  let lastMinute = -1;
  // slide / odometer: chunk lười `odometer` khi section sắp vào màn (600px); chưa tải -> mờ dần
  let fxm: typeof import('../effects/micro/odometer') | null = null;
  const lazy = style === 'slide' || style === 'odometer';
  const loadFx = () => import('../effects/micro/odometer').then((m) => { if (!fxm && style === 'odometer') cells.forEach((x) => m.build(x.v, prev[x.k] ?? '00')); fxm = m; });
  if (lazy && anim !== 'instant' && 'IntersectionObserver' in window) {
    const pre = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { pre.disconnect(); void loadFx(); } }, { rootMargin: '600px' });
    pre.observe(sec);
  }
  const slow = () => 1 / Math.min(1, EffectRegistry.timeScale);
  /** Đổi giá trị 1 ô: full = hoạt ảnh của kiểu (lật/trượt/quay), ngược lại mờ dần. */
  const tick = (v: HTMLElement, from: string, to: string, full: boolean, s: boolean) => {
    const roll = full && lazy;
    if (fxm && (roll || style === 'odometer')) fxm.run(style, v, from, to, roll ? (s ? 300 : 450) : 0, slow());
    else v.textContent = to;
    if (anim === 'instant' || !v.animate || (roll && fxm)) return;
    const flip = full && style === 'flip';
    v.animate(flip ? [{ transform: 'rotateX(-90deg)', opacity: 0.4 }, { transform: 'rotateX(0)', opacity: 1 }] : [{ opacity: 0.35 }, { opacity: 1 }],
      { duration: flip ? 300 : 200 * slow(), easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  let timer: ReturnType<typeof setInterval> | null = null;
  let trigger: FireworksTrigger | null = null;

  const render = () => {
    const now = new Date();
    const ph = phase(target, now);
    sec.dataset.phase = ph;
    if (ph !== 'before') {
      grid.hidden = true;
      msg.textContent = ph === 'today' ? c.todayLabel : c.afterLabel;
      msg.className = `cd-msg ${ph === 'today' ? 'is-today' : 'is-after'}`;
      chip.hidden = true;
      live.textContent = msg.textContent ?? '';
      if (ph === 'today') trigger?.countdownReachedZero();
      return;
    }
    const r = remaining(target, now);
    for (const cell of cells) {
      const val = String(r[cell.k]).padStart(2, '0');
      if (prev[cell.k] === val) continue;
      const old = prev[cell.k];
      prev[cell.k] = val;
      if (old === undefined) { if (fxm && style === 'odometer') fxm.build(cell.v, val); else cell.v.textContent = val; continue; }
      const s = cell.k === 's';
      tick(cell.v, old, val, anim === 'full' && (!s || (style !== 'flip' && ctx.fx.state === 'high')), s);
    }
    if (now.getMinutes() !== lastMinute) {
      lastMinute = now.getMinutes();
      live.textContent = `Còn ${r.d} ngày đến ngày cưới`;
      const ms = c.milestones ? MILESTONES.find((m) => r.d === m) : undefined;
      // R18: luôn có chip tĩnh (không để khoảng trống dưới 4 ô số); mốc milestone -> nhấn mạnh
      chip.hidden = r.d <= 0;
      chip.textContent = ms !== undefined ? `Chỉ còn ${ms} ngày!` : `Còn ${r.d} ngày`;
      chip.classList.toggle('is-ms', ms !== undefined);
    }
  };
  const start = () => { if (!timer) { render(); timer = setInterval(render, 1000); } };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
  if (nonEmpty(c.todayLabel) && phase(target, new Date()) === 'today') msg.classList.add('is-today');

  // ---- pháo hoa (every-view / wedding-day)
  const mode = ctx.config.effects.burst.countdownFireworks;
  const spec = fireworksSpec(ctx.fx.state, ctx.fx.lowEnd);
  if (mode !== 'off' && spec && 'IntersectionObserver' in window) {
    let mod: typeof import('../effects/burst/fireworks') | null = null;
    const pre = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        pre.disconnect();
        void import('../effects/burst/fireworks').then((m) => (mod = m));
      }
    }, { rootMargin: '600px' });
    pre.observe(sec);
    trigger = new FireworksTrigger({
      mode,
      isBlocked: fxBlocked,
      isWeddingDay: () => phase(target, new Date()) === 'today',
      sessionFired: {
        get: () => { try { return sessionStorage.getItem('wp_fw_v1') === '1'; } catch { return false; } },
        set: () => { try { sessionStorage.setItem('wp_fw_v1', '1'); } catch { /* ignore */ } },
      },
      fire: async () => {
        const f = await getField();
        const m = mod ?? (await import('../effects/burst/fireworks'));
        if (!f) return;
        await m.playFireworks(f, sec, grid.hidden ? msg : grid, spec, m.fireworksPalette(ctx.resolved.tokens, ctx.resolved.mode), sec.querySelector<HTMLElement>('.sec-head'));
      },
    });
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        const vh = e.rootBounds?.height || window.innerHeight;
        // section cao hơn viewport: tính theo phần viewport bị chiếm
        const ratio = Math.max(e.intersectionRatio, e.intersectionRect.height / vh);
        trigger!.update(e.isIntersecting ? ratio : 0);
      }
    }, { threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1] });
    io.observe(sec);
    if (ctx.debug) (window as unknown as Record<string, unknown>).__wpFw = trigger;
  }
  return sec;
}
