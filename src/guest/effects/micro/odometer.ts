/**
 * Chunk lười hoạt ảnh đếm ngược: `slide` "Trượt số" (design-v4a-2a §4.4) + `odometer` "Đồng hồ cơ" (§4.3).
 * Odometer: mỗi chữ số là 1 cửa sổ `.od-win` (1em, chỉ chữ số
 * nên clip an toàn) chứa dải `.od-strip` 11 ô `9* 0..9`; hiện d = `translateY(-(d+1)em)`. Đếm lùi d -> d−1: dải trượt
 * xuống; quay vòng 0 -> 9 qua ô `9*` rồi nhảy tức thì về ô 9 thật. Hàng chục trễ 60ms. Số chữ số giảm (100 -> 99):
 * cửa sổ đầu mờ 300ms rồi bỏ.
 */
import { h } from '../../dom';

export interface OdStep { i: number; from: number; to: number; wrap: boolean; delay: number }

/** Bước chuyển giữa 2 giá trị (thuần): `drop` = số cửa sổ bỏ ở đầu; `i` = chỉ số cửa sổ trong giá trị mới. */
export function odometerSteps(from: string | number, to: string | number): { drop: number; steps: OdStep[] } {
  const a = String(from).padStart(2, '0');
  const b = String(to).padStart(2, '0');
  const drop = Math.max(0, a.length - b.length);
  const a2 = a.slice(drop).padStart(b.length, '0');
  const steps: OdStep[] = [];
  for (let i = 0; i < b.length; i++) {
    const f = +a2[i]!;
    const t = +b[i]!;
    if (f !== t) steps.push({ i, from: f, to: t, wrap: f === 0 && t === 9, delay: (b.length - 1 - i) * 60 });
  }
  return { drop, steps };
}

const y = (d: number) => `translateY(${-(d + 1)}em)`;

function win(d: number): HTMLElement {
  const strip = h('span', { class: 'od-strip' }, ...['9', ...'0123456789'].map((c) => h('span', null, c)));
  strip.style.setProperty('transform', y(d));
  return h('span', { class: 'od-win' }, strip);
}

/** Dựng cửa sổ cho giá trị hiện tại (thay chữ trong `.cd-v`). */
export function build(v: HTMLElement, val: string): void {
  v.replaceChildren(...[...val].map((c) => win(+c)));
}

/** Đổi giá trị: `ms` > 0 quay dải (thời lượng mỗi chữ số), 0 = đặt ngay (bên gọi tự mờ dần). */
export function set(v: HTMLElement, from: string, to: string, ms: number, slow = 1): void {
  const wins = Array.from(v.querySelectorAll<HTMLElement>(':scope > .od-win'));
  if (!ms || wins.length !== from.length || to.length > from.length) { build(v, to); return; }
  const { drop, steps } = odometerSteps(from, to);
  wins.slice(0, drop).forEach((w) => { w.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 * slow }).onfinish = () => w.remove(); });
  const keep = wins.slice(drop);
  for (const s of steps) {
    const strip = keep[s.i]?.firstElementChild as HTMLElement | null;
    if (!strip) continue;
    const end = s.wrap ? 'translateY(0em)' : y(s.to);
    strip.style.setProperty('transform', y(s.to));
    strip.animate([{ transform: y(s.from) }, { transform: end }], { duration: ms * slow, delay: s.delay * slow, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
  }
}

/** Đổi giá trị theo kiểu: `slide` trượt cả giá trị ô (bản cũ xuống + mờ, bản mới từ trên vào, 320ms); `odometer` quay dải. */
export function run(style: string, v: HTMLElement, from: string, to: string, ms: number, slow = 1): void {
  if (style === 'odometer') { set(v, from, to, ms, slow); return; }
  const old = h('span', { class: 'cd-old' }, from);
  const nu = h('span', null, to);
  v.replaceChildren(nu, old);
  const o = { duration: 320 * slow, easing: 'cubic-bezier(.22,1,.36,1)' };
  nu.animate([{ transform: 'translateY(-100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], o);
  old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(100%)', opacity: 0 }], o).onfinish = () => old.remove();
}
