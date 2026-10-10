/**
 * Preview admin `fx:replay` cho reveal/micro + hook debug `?debug=fx` (chunk lười, solution-v4a-2a.md 3.5).
 * - `reveal`: tour 3 section expressive đầu (thiếu thì section kế tiếp sau hero), mỗi phần cuộn tức thì đầu section ở
 *   15% viewport, phát lại, chờ thời lượng thật + 400ms. `reveal:<id>`: 1 section.
 * - `micro:<mã>`: module micro tự đăng ký `EffectRegistry('micro:<mã>')` khi được import; preview gọi `play`.
 */
import { ctx } from '../../context';
import { EffectRegistry } from '../registry';
import { REVEAL_TIER } from '@shared/reveal-plan';
import type { SectionType } from '@shared/config/enums';
// API engine reveal truyền từ nơi gọi (import tĩnh `../reveal` từ chunk lười làm rolldown tách context/dom/intensity
// khỏi entry thành chunk riêng -> JS ban đầu tăng); chỉ dùng kiểu ở đây.
type RevealApi = typeof import('../reveal').revealApi;
let R: RevealApi;
import { pieceStagger } from './reveal-split';

/** Thời lượng micro preview (ms, trước hệ số tốc độ) + module cần nạp. */
const MICRO: Record<string, [number, (() => Promise<unknown>)?]> = {
  buttonShine: [1300, () => import('../micro/micro-attn')],
  photoTilt: [1900, () => import('../micro/photo-tilt')],
  scrollProgress: [1800, () => import('../micro/scroll-progress')],
  coupleHeartTap: [900, () => import('../micro/heart-tap')],
  countdown: [900],
};

/** preview "Kiểu số đếm ngược": 4 ô chạy 1 nhịp giả (giá trị +1 -> hiện tại, cả giây) theo kiểu đang chọn. */
async function countdownDemo(): Promise<void> {
  const grid = document.querySelector<HTMLElement>('.cd-grid:not([hidden])');
  if (!grid) return;
  grid.scrollIntoView({ block: 'center' });
  const style = /cd--(\w+)/.exec(grid.className)?.[1] ?? 'flip';
  if (ctx.fx.state === 'off' || ctx.fx.state === 'reduced' || style === 'simple') return;
  const m = style === 'flip' ? null : await import('../micro/odometer');
  const k = 1 / Math.min(1, EffectRegistry.timeScale);
  for (const v of grid.querySelectorAll<HTMLElement>('.cd-v')) {
    const to = v.textContent ?? '00';
    const from = String(+to + 1).padStart(to.length, '0');
    if (!m) { v.animate([{ transform: 'rotateX(-90deg)', opacity: 0.4 }, { transform: 'rotateX(0)', opacity: 1 }], { duration: 300 * k }); continue; }
    if (style === 'odometer' && !v.querySelector('.od-win')) m.build(v, from);
    m.run(style, v, from, to, 450, k);
  }
}
/** micro khác (wishFly, rsvp, fireworks…): chỉ cuộn tới section liên quan */
const MICRO_SECTION: Record<string, string> = {
  wishFly: 'guestbook', 'wish-fly': 'guestbook', rsvp: 'rsvp', 'rsvp-success': 'rsvp', countdown: 'countdown', fireworks: 'countdown',
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const secs = () => Array.from(document.querySelectorAll<HTMLElement>('main .sec'));
const els = (sec: Element) => Array.from(sec.querySelectorAll<HTMLElement>('[data-rva]'));

/** Đưa section về trạng thái ẩn đã chuẩn bị (đã tách chữ/dòng, chưa `is-in`), tắt transition. */
function hide(sec: HTMLElement): void {
  sec.classList.add('rv-replay');
  for (const el of els(sec)) { el.classList.remove('is-in', 'rv-done'); R.rearm(el); }
  void sec.offsetWidth;
}

/** Phát lại reveal của 1 section (bỏ qua hàng đợi wipe). */
export function replaySection(sec: HTMLElement): void {
  hide(sec);
  sec.classList.remove('rv-replay');
  requestAnimationFrame(() => els(sec).forEach(R.show));
}

/** Thời lượng thật của section (đọc transition đã tính, gồm `--fx-slow`), kẹp ≤ 2200ms × hệ số chậm. */
function sectionMs(sec: HTMLElement): number {
  const slow = Number(getComputedStyle(document.documentElement).getPropertyValue('--fx-slow')) || 1;
  return Math.min(2200 * slow, Math.max(0, ...els(sec).map(R.doneMs)));
}

const scrollToSec = (sec: HTMLElement) => window.scrollTo(0, Math.max(0, sec.offsetTop - innerHeight * 0.15));

export async function runFxPreview(api: RevealApi, target: string, o: { speed: number; done: () => void }): Promise<void> {
  R = api;
  const k = Math.max(1, 1 / (o.speed || 1));
  const done = () => {
    if (ctx.debug) ((window as unknown as { __wpFxDone?: unknown[] }).__wpFxDone ??= []).push({ target, at: performance.now() });
    o.done();
  };
  if (target.startsWith('micro:')) {
    const id = target.slice(6);
    const m = MICRO[id];
    if (m) {
      await m[1]?.().catch(() => undefined);
      void (id === 'countdown' ? countdownDemo() : EffectRegistry.play(`micro:${id}`));
      setTimeout(done, m[0] * k);
    } else {
      const sec = MICRO_SECTION[id];
      if (sec) document.getElementById(sec)?.scrollIntoView({ block: 'start' });
      setTimeout(done, 900 * k);
    }
    return;
  }
  R.revealAll(document); // ngắt IO
  await R.revealReady();
  if (target === 'reveal') {
    const all = secs();
    const expr = all.filter((s) => REVEAL_TIER[s.dataset.type as SectionType] === 'expressive');
    const tour = (expr.length >= 3 ? expr : [...expr, ...all.slice(1).filter((s) => !expr.includes(s))]).slice(0, 3);
    tour.sort((a, b) => all.indexOf(a) - all.indexOf(b));
    for (const sec of tour) {
      scrollToSec(sec);
      replaySection(sec);
      await wait(sectionMs(sec) + 400 * k);
    }
    done();
    return;
  }
  const sec = document.getElementById(target.slice(7));
  if (!sec?.classList.contains('sec')) { done(); return; }
  scrollToSec(sec);
  replaySection(sec);
  setTimeout(done, sectionMs(sec) + 400 * k);
}

/** `?debug=fx`: hook cho e2e / designer chụp ảnh. */
export function installDebug(api: RevealApi): void {
  R = api;
  const w = window as unknown as Record<string, unknown>;
  w.__wpFxDone ??= [];
  w.__wpReveal = {
    get plan() { return R.currentPlan(); },
    /** section về trạng thái ẩn đã chuẩn bị (đã tách, chưa hiện) - giữ nguyên để chụp */
    async hold(id: string) {
      R.revealAll(document);
      await Promise.all([R.revealReady(), document.fonts?.ready]);
      const sec = document.getElementById(id);
      if (sec) hide(sec);
    },
    play(id: string) { const sec = document.getElementById(id); if (sec) replaySection(sec); },
    /** mọi section về ẩn + bật lại IO (đo CLS khi cuộn) */
    async rearmAll() {
      R.revealAll(document);
      await Promise.all([R.revealReady(), document.fonts?.ready]);
      const main = document.getElementById('main');
      if (!main) return;
      main.classList.add('rv-replay');
      for (const el of els(main)) { el.classList.remove('is-in', 'rv-done'); R.rearm(el); }
      void main.offsetWidth;
      main.classList.remove('rv-replay');
      R.startReveal(main);
    },
  };
}

/** Bảng thời lượng nguyên tử (design-v4a-2a 3.1, khớp fx.css) ở Vừa/Nhiều. */
const DUR: Record<string, number> = {
  fade: 600, 'fade-up': 700, 'zoom-in': 600, 'slide-side': 700, 'rise-tilt': 700, 'fade-fast': 200, 'blur-in': 600,
};
export interface EstItem { atom: string; i?: number; tile?: boolean; n?: number }

/**
 * Ước lượng tổng thời gian 1 section (thuần, test): max(độ trễ + thời lượng) theo bảng nguyên tử + hệ số gói
 * (cinematic 1.25, svg-draw kẹp 1800, photo-settle 1400). `n` = số dòng (mask-up) / số mảnh (split).
 */
export function estimateSectionMs(items: EstItem[], stagger: number, pack: string, high = false): number {
  const cine = pack === 'cinematic';
  const kk = cine ? 1.25 : 1;
  return Math.max(0, ...items.map((it) => {
    const n = it.n ?? 1;
    const delay = Math.min(it.i ?? 0, 8) * (it.tile ? (it.atom === 'wipe' ? 150 : Math.min(stagger, 100)) : stagger);
    let d: number;
    switch (it.atom) {
      case 'mask-up': d = (high ? 900 : 800) * kk + Math.min(n - 1, 3) * 90; break;
      case 'split-words': d = 500 + (n - 1) * pieceStagger('words', n); break;
      case 'split-chars': d = 450 + (n - 1) * pieceStagger('chars', n); break;
      case 'photo-settle': d = cine ? 1400 : 1100; break;
      case 'svg-draw': d = 1500 * (cine ? 1.2 : 1); break;
      case 'wipe': d = it.tile ? 450 : 900 * kk; break;
      case 'none': d = 0; break;
      default: d = (DUR[it.atom] ?? 700) * (it.atom === 'fade-fast' ? 1 : kk);
    }
    return delay + d;
  }));
}
