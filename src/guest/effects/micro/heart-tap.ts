/**
 * couple-heart-tap (chunk lười, design-v4a-2a §4.10): chạm đúp ảnh cô dâu/chú rể (`.person-photo`) thả 1 tim tại điểm chạm.
 * 2 `pointerup` ≤ 300ms, lệch ≤ 24px (chuột: `dblclick`); ≤ 3 tim cùng lúc; `touch-action: manipulation` chỉ trên ảnh
 * (CSS `.fx-hearttap`, vẫn chụm 2 ngón phóng to được). Hoạt ảnh trong fx.css (reduced: tim tĩnh rồi mờ).
 */
import { css, h } from '../../dom';
import { icon } from '../../icons';
import { EffectRegistry } from '../registry';

export interface Tap { t: number; x: number; y: number }

/** Hai lần chạm thành chạm đúp? (≤ 300ms, ≤ 24px) */
export const isDoubleTap = (a: Tap | null, b: Tap): boolean => !!a && b.t - a.t <= 300 && Math.hypot(b.x - a.x, b.y - a.y) <= 24;

/** Thả tim tại (x, y) theo toạ độ trong khung ảnh. */
export function drop(frame: HTMLElement, x: number, y: number): void {
  const old = frame.querySelectorAll('.ht-heart');
  if (old.length >= 3) old[0]!.remove();
  const el = h('span', { class: 'ht-heart', 'aria-hidden': 'true' }, icon('heart', 56));
  css(el, { left: `${Math.round(x)}px`, top: `${Math.round(y)}px` });
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 1500);
  frame.append(el);
}

let mounted = false;

export function mount(): void {
  if (mounted) return;
  const main = document.getElementById('main');
  if (!main) return;
  mounted = true;
  let last: Tap | null = null;
  const at = (e: MouseEvent) => {
    const f = (e.target as Element).closest<HTMLElement>('.person-photo');
    if (f) { const r = f.getBoundingClientRect(); drop(f, e.clientX - r.left, e.clientY - r.top); }
    return f;
  };
  main.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse' || !(e.target as Element).closest('.person-photo')) return;
    const tap = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    if (isDoubleTap(last, tap)) { at(e); last = null; } else last = tap;
  });
  main.addEventListener('dblclick', (e) => { at(e); });
}

EffectRegistry.register('micro:coupleHeartTap', {
  play() {
    document.getElementById('couple')?.scrollIntoView({ block: 'start' });
    const f = document.querySelector<HTMLElement>('.person-photo');
    if (f) drop(f, f.clientWidth / 2, f.clientHeight / 2);
  },
});
