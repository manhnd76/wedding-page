/**
 * open-kit/layers (solution-v4a-2bc.md 1.3): dựng lớp hình + timeline khoá theo TÊN LỚP (hàm thuần, unit test trong
 * môi trường node) -> ánh xạ sang phần tử khi phát. Chỉ module kiểu mở mới import (chunk `open-kit`, ≤ 3 KB).
 */
import { ctx } from '../../context';
import { h, nonEmpty, svg } from '../../dom';
import { runSteps, type OpenLevelCtx, type OpenRun, type Step } from '../anim';

/** Bước timeline theo tên lớp: `k` = class (hoặc 'cover'), `f` keyframes, `s` mốc bắt đầu, `d` thời lượng, `e` easing. */
export interface StepSpec { k: string; f: Keyframe[]; s: number; d: number; e?: string }
export interface Timeline { steps: StepSpec[]; totalMs: number }

export const tl = (steps: StepSpec[]): Timeline => ({ steps, totalMs: Math.max(0, ...steps.map((x) => x.s + x.d)) });

/** Biên an toàn dấu tiếng Việt cho clip-path quanh chữ (design §1.1-6). */
export const SAFE = '-.3em';

export const fade = (k: string, s: number, d: number, from = 1, to = 0, e?: string): StepSpec =>
  ({ k, f: [{ opacity: from }, { opacity: to }], s, d, ...(e ? { e } : {}) });

/** Đầu đề rút (họ vật thể: trước khi có phần bay lên đè - §1.1-2; họ cổng: biển chữ rút đầu tiên - §1.1-3). */
export const rise = (k: string, s: number, d = 200, extra = ''): StepSpec =>
  ({ k, f: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(-8px)${extra}` }], s, d });

/** Phóng to + mờ (kết của đa số kiểu). */
export const zoomOut = (k: string, s: number, d: number, to = 1.15): StepSpec =>
  ({ k, f: [{ transform: 'scale(1)' }, { transform: `scale(${to})` }], s, d });

export function bind(cover: HTMLElement, t: Timeline, c: OpenLevelCtx): OpenRun {
  const steps: Step[] = [];
  for (const x of t.steps) {
    const els = x.k === 'cover' ? [cover] : Array.from(cover.querySelectorAll(`.${x.k}`));
    for (const el of els) steps.push({ el, frames: x.f, start: x.s, dur: x.d, ...(x.e ? { easing: x.e } : {}) });
  }
  return runSteps(steps, c.timeScale);
}

type Kid = Node | string | null | false | undefined;
/** Lớp trang trí (aria-hidden). */
export const div = (cls: string, ...kids: Kid[]): HTMLElement => h('div', { class: cls, 'aria-hidden': 'true' }, ...kids);
/** Lớp tô bằng mask (CSS: `background-color` + `mask-image`). */
export const mk = (cls: string): HTMLElement => h('i', { class: `mk ${cls}`, 'aria-hidden': 'true' });

/** SVG từ path data đã chép từ asset `inline.svg` (designer B): [d, class, thuộc tính thêm]. */
export function paths(viewBox: string, cls: string, list: [string, string, Record<string, string | number>?][]): SVGElement {
  return svg('svg', { viewBox, class: cls, 'aria-hidden': 'true', focusable: 'false' },
    ...list.map(([d, c, x]) => svg('path', { d, class: c, ...(x ?? {}) })));
}

/** Đưa node chữ (giữ nguyên node, không chép chuỗi) vào hộp mới. */
export function move(cover: HTMLElement, sel: string, to: Element): HTMLElement | null {
  const el = cover.querySelector<HTMLElement>(sel);
  if (el) to.appendChild(el);
  return el;
}

/** Chờ decode file mask của kiểu (≤ 1500 ms) để không "nháy" hình rỗng (design §1.2). */
export async function waitMasks(root: ParentNode, ms = 1500): Promise<void> {
  const urls = new Set<string>();
  root.querySelectorAll('.mk').forEach((el) => {
    const cs = getComputedStyle(el);
    const v = cs.getPropertyValue('mask-image') || cs.getPropertyValue('-webkit-mask-image');
    for (const m of v.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(m[1]!);
  });
  const all = Promise.all([...urls].map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => undefined); }));
  await Promise.race([all, new Promise((r) => setTimeout(r, ms))]);
}

/** Toạ độ tâm phần tử (viewport). */
export function center(el: Element | null): { x: number; y: number } {
  const r = el?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 };
}

/** Lời chào trong vật thể (hiện sau khi mở): `openedGreeting` hoặc monogram. Trang trí (aria-hidden). */
export function greet(cls = ''): HTMLElement {
  const c = ctx.config.cover;
  const t = c.showOpenedGreeting && nonEmpty(c.openedGreeting) ? c.openedGreeting : c.monogram || '♡';
  return h('p', { class: `op-greet ${cls}`, 'aria-hidden': 'true' }, t);
}
