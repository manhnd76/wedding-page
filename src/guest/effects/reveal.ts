/**
 * Reveal khi cuộn theo section (design 4.0, 5.8; B1 design-v4a-2a §2-3; solution-v4a-2a.md 2-3).
 * Phần tử đánh dấu `data-rv="heading|block|image|ornament"` lúc render. Engine tính gói hiệu lực từng section
 * (`revealPlan`) rồi gán `data-rva` (nguyên tử), `data-rvk` (gói nguồn), section `data-rvp`/`data-rvs` + `--stagger`.
 * mask-up/split chờ tách: `data-rva="fade-up"` tạm + `data-rvw="<nguyên tử muốn>"`; code tách nằm ở chunk lười
 * `reveal/reveal-split` (tải ngay trong prepare khi plan có heading cần tách). Chưa tải/tách kịp -> giữ fade-up.
 * Xong: `rv-done` (gỡ wrapper/clip/filter).
 */
import { REVEAL_PACKS, type RevealRole } from '@shared/reveal-packs';
import { roleAtom, sectionStagger, type PlanEntry } from '@shared/reveal-role';
import type { ResolvedReveal } from '@shared/theme/resolve';
import { ctx } from '../context';
import { css } from '../dom';
import { MATRIX, type FxState } from './intensity';
import { degrade, type AtomCtx } from './reveal/atoms';
import { graphemeCount, hasLetters, wordCount } from './reveal/text';
import type { WipeQueue } from './reveal/wipe-queue';

export { atomFor } from './reveal/atoms';

const TEXT = new Set(['mask-up', 'split-words', 'split-chars']);
/** nguyên tử cần chunk lười `reveal-split` (tách chữ/dòng, hàng đợi wipe) */
const LAZY = /^(mask|split|wipe)/;
const SCRIPT = '.h2-script, .hero-names, [data-sig]';
const NO_OV = { heading: null, block: null, image: null, ornament: null };
type SplitMod = typeof import('./reveal/reveal-split');

let io: IntersectionObserver | null = null;
let prepIo: IntersectionObserver | null = null;
let plan: Record<string, PlanEntry> = {};
let queue: WipeQueue<HTMLElement> | null = null;
let mod: SplitMod | null = null;
let modP: Promise<SplitMod | null> | null = null;
const tokens = new WeakMap<HTMLElement, number>();
/** nguyên tử tách chữ/dòng mong muốn (giữ cả khi đã hiện, để preview phát lại đúng kiểu) */
const want = new WeakMap<HTMLElement, string>();
const loadMod = (): Promise<SplitMod | null> =>
  (modP ??= import('./reveal/reveal-split').then((m) => (mod = m)).catch(() => null));

export const currentPlan = (): Record<string, PlanEntry> => plan;
/** Chunk tách chữ/dòng đã tải (null nếu plan không cần). */
export const revealReady = (): Promise<SplitMod | null> => modP ?? Promise.resolve(null);

/** Gán kiểu cho mọi phần tử [data-rv] (gọi trước khi mở cover để tránh nháy). */
export function prepareReveal(root: ParentNode, rv: ResolvedReveal, state: FxState): void {
  const A = rv.style;
  css(document.documentElement, { '--stagger': `${REVEAL_PACKS[A].stagger}ms`, '--reveal-distance': `${MATRIX.revealDistance[state]}px` });
  // plan tính sẵn từ config (`planOf`); thiếu (config cũ) -> mọi phần dùng gói chính
  plan = rv.plan ?? {};
  const secs = [...root.querySelectorAll<HTMLElement>('.sec')];
  for (const s of secs) {
    const e = (plan[s.id] ??= { pack: A, src: 'main' });
    s.dataset.rvp = e.pack;
    s.dataset.rvs = e.src;
    css(s, { '--stagger': `${sectionStagger(e, A)}ms` });
  }
  const base: Partial<AtomCtx> = { lowEnd: !!ctx.fx?.lowEnd, wide: matchMedia('(min-width: 1024px)').matches };
  let blurUsed = 0;
  let need = false;
  root.querySelectorAll<HTMLElement>('[data-rv]').forEach((el) => {
    const role = el.dataset.rv as RevealRole;
    mod?.restore(el); // chuẩn bị lại (khách bật lại hiệu ứng): về chuỗi gốc trước khi đo
    const sec = el.closest<HTMLElement>('.sec');
    const { atom, from } = roleAtom(sec ? plan[sec.id] : undefined, role, A, rv.overrides ?? NO_OV);
    const txt = role === 'heading' ? el.textContent ?? '' : '';
    const a = degrade(role, atom, state, {
      ...base, blurUsed, script: el.matches(SCRIPT), nested: role === 'image' && !!el.parentElement?.closest('[data-rv]'),
      tile: el.matches('.al-tile'), pairCol: el.matches('.person, .fam-col'), emptyFrame: el.matches('.frame.is-empty'),
      graphemes: graphemeCount(txt), words: wordCount(txt), letters: role !== 'heading' || hasLetters(txt),
    });
    if (a === 'blur-in') blurUsed++;
    if (from === 'override') delete el.dataset.rvk; else el.dataset.rvk = from;
    delete el.dataset.rvw;
    if (a === 'none') { el.removeAttribute('data-rva'); return; }
    // tách chữ/dòng chưa sẵn sàng: tạm fade-up (không bao giờ để chữ chờ)
    el.dataset.rva = TEXT.has(a) ? 'fade-up' : a;
    if (TEXT.has(a)) { want.set(el, a); if (!el.classList.contains('is-in')) el.dataset.rvw = a; } else want.delete(el);
    need ||= LAZY.test(a);
  });
  // tải chunk tách ngay (lúc cover đang hiện); split-* tách luôn (không cần layout), mask-up chờ layout + font
  if (need) void loadMod().then(() => root.querySelectorAll<HTMLElement>('[data-rvw^="split"]').forEach(ready));
}

/** Tách theo `data-rvw` (nếu chưa hiện) rồi đổi sang nguyên tử thật, tắt transition 1 nhịp. */
function ready(el: HTMLElement): void {
  const w = el.dataset.rvw;
  if (!w || !mod || el.classList.contains('is-in')) return;
  if (w === 'mask-up') { mod.splitLines(el); mod.watch(el); } else mod.split(el, w === 'split-chars' ? 'chars' : 'words');
  el.classList.add('rv-swap');
  el.dataset.rva = w;
  delete el.dataset.rvw;
  void el.offsetWidth;
  el.classList.remove('rv-swap');
}

/** Preview phát lại: phần tử (đã bỏ `is-in`) về đúng nguyên tử tách chữ/dòng mong muốn, tách lại. */
export function rearm(el: HTMLElement): void {
  const w = want.get(el);
  if (!w || !mod) return;
  mod.restore(el);
  if (w === 'mask-up') mod.splitLines(el); else mod.split(el, w === 'split-chars' ? 'chars' : 'words');
  el.dataset.rva = w;
  delete el.dataset.rvw;
}

const fontsReady = (): Promise<unknown> => (document.fonts?.ready ?? Promise.resolve()).catch(() => undefined);

/** Bắt đầu quan sát (sau khi mở thiệp). */
export function startReveal(root: ParentNode): void {
  const els = [...root.querySelectorAll<HTMLElement>('[data-rva]:not(.is-in)')];
  io?.disconnect();
  prepIo?.disconnect();
  queue = null;
  if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
  // IO của Chromium tính cả clip-path của chính phần tử: chữ đang bị wipe che hết không bao giờ "giao" -> quan sát
  // phần tử cha thay (map cha -> các phần tử cần hiện)
  const proxy = new Map<Element, HTMLElement[]>();
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io!.unobserve(e.target); proxy.get(e.target)?.forEach(enter); proxy.delete(e.target); }
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  const masks = els.filter((el) => el.dataset.rvw === 'mask-up');
  if (masks.length) {
    // heading đã trong màn đầu + font xong: tách ngay để kịp hiện bằng mask-up
    if (document.fonts?.status === 'loaded') masks.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) ready(el); });
    prepIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { prepIo!.unobserve(e.target); void Promise.all([fontsReady(), loadMod()]).then(() => ready(e.target as HTMLElement)); }
      }
    }, { rootMargin: '0px 0px 100% 0px' });
    masks.forEach((el) => prepIo!.observe(el));
  }
  for (const el of els) {
    const t = el.matches('[data-rva="wipe"]:not([data-rv="image"]), .ty-sig') ? el.parentElement ?? el : el;
    proxy.set(t, [...(proxy.get(t) ?? []), el]);
    io.observe(t);
  }
}

/** Phần tử vào vùng reveal. */
function enter(el: HTMLElement): void {
  delete el.dataset.rvw; // chưa tách kịp -> giữ fade-up
  mod?.unwatch(el);
  // wipe ≤ 3 cùng lúc (máy yếu 2); ô album tự giãn bằng stagger 150ms. Chunk chưa tải -> không giới hạn
  if (el.dataset.rva === 'wipe' && mod && !el.matches('.al-tile') && (queue ??= new mod.WipeQueue<HTMLElement>(ctx.fx?.lowEnd ? 2 : 3)).request(el) === 'wait') {
    setTimeout(() => queue?.expired().forEach((x) => { x.dataset.rva = 'fade'; show(x); }), 650);
    return;
  }
  show(el);
}

/** Tổng (độ trễ + thời lượng) lớn nhất của các transition trên phần tử (ms). */
function span(x: Element): number {
  const s = getComputedStyle(x);
  const d = s.transitionDuration.split(',');
  const l = s.transitionDelay.split(',');
  return Math.max(0, ...d.map((v, i) => (parseFloat(v) + parseFloat(l[i % l.length] ?? '0')) * 1000));
}

/** Thời điểm phần tử xong hẳn (kể cả dòng/từ/ký tự cuối, ảnh bên trong). */
export function doneMs(el: HTMLElement): number {
  const p = el.querySelectorAll('.rv-li, .rv-w, .rv-c, img');
  return Math.min(6000, Math.max(span(el), p.length ? span(p[p.length - 1]!) : 0));
}

/** Hiện phần tử: `is-in`, hẹn giờ `rv-done` theo thời lượng thật (đã gồm `--fx-slow`). */
export function show(el: HTMLElement): void {
  el.classList.remove('rv-done');
  el.classList.add('is-in');
  if (el.dataset.rva === 'blur-in') el.style.setProperty('will-change', 'filter, opacity');
  const tok = (tokens.get(el) ?? 0) + 1;
  tokens.set(el, tok);
  setTimeout(() => { if (tokens.get(el) === tok && el.classList.contains('is-in')) done(el); }, doneMs(el) + 100);
}

function done(el: HTMLElement): void {
  el.classList.add('rv-done');
  el.style.removeProperty('will-change');
  mod?.restore(el);
  if (el.dataset.rva === 'wipe') queue?.release(el).forEach(show);
}

/** Hiện tất cả ngay (khách tắt hiệu ứng, preview không phát reveal). */
export function revealAll(root: ParentNode): void {
  io?.disconnect();
  prepIo?.disconnect();
  root.querySelectorAll<HTMLElement>('[data-rva]').forEach((e) => {
    delete e.dataset.rvw;
    if (!e.classList.contains('is-in')) show(e);
  });
}

/** Bước FPS `revealLite`: phần tử chưa hiện dùng fade-up thay tách chữ/clip/blur; phần tử đã hiện giữ nguyên. */
export function revealLite(root: ParentNode = document): void {
  document.documentElement.classList.add('fx-rv-lite');
  root.querySelectorAll<HTMLElement>('[data-rva]:not(.is-in)').forEach((el) => {
    if (el.dataset.rvw || /^(split|wipe|mask|blur)/.test(el.dataset.rva ?? '')) {
      mod?.restore(el);
      want.delete(el);
      delete el.dataset.rvw;
      el.dataset.rva = 'fade-up';
    }
  });
}

/** API cho chunk lười preview/debug (`reveal/fx-preview.ts`) - truyền vào thay vì import tĩnh (xem ghi chú ở đó). */
export const revealApi = { currentPlan, doneMs, rearm, revealAll, revealReady, show, startReveal };
