/**
 * photo-tilt (chunk lười, design-v4a-2a §4.2): ảnh nghiêng theo con trỏ, chỉ `(hover:hover) and (pointer:fine)`.
 * `.person-photo`, `.frame--polaroid` ≤ 6°, `.al-tile` ≤ 4°; chỉ khi reveal của ảnh đã xong (`rv-done`).
 * `transform: perspective(800px) rotateX() rotateY()` (độ nghiêng polaroid ở thuộc tính `rotate`, không mất);
 * lớp bóng `span.tilt-glare`; lerp .12/frame; rời chuột về 0 trong 400ms; bấm ô album reset; bàn phím không nghiêng.
 * Bước FPS `photoTilt` -> `html.fx-no-tilt` + `EffectRegistry.reset('micro:photoTilt')`.
 */
import { h } from '../../dom';
import { EffectRegistry } from '../registry';

const SEL = '.person-photo, .frame--polaroid, .al-tile';
const tf = (x: number, y: number) => `perspective(800px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;

let cur: HTMLElement | null = null;
let raf = 0;
let tx = 0; let ty = 0; let x = 0; let y = 0;
let off: (() => void) | null = null;

function glare(el: HTMLElement): HTMLElement {
  return el.querySelector<HTMLElement>(':scope > .tilt-glare') ?? el.appendChild(h('span', { class: 'tilt-glare', 'aria-hidden': 'true' }));
}

function frame(): void {
  if (!cur) return;
  x += (tx - x) * 0.12;
  y += (ty - y) * 0.12;
  cur.style.setProperty('transform', tf(x, y));
  raf = requestAnimationFrame(frame);
}

function leave(): void {
  cancelAnimationFrame(raf);
  const el = cur;
  cur = null;
  if (!el) return;
  el.classList.remove('is-tilt');
  el.classList.add('tilt-out');
  el.style.setProperty('transform', tf(0, 0));
  setTimeout(() => { if (cur !== el) { el.classList.remove('tilt-out'); el.style.removeProperty('transform'); } }, 420);
}

function reset(): void {
  cancelAnimationFrame(raf);
  document.querySelectorAll<HTMLElement>('.is-tilt, .tilt-out').forEach((el) => {
    el.classList.remove('is-tilt', 'tilt-out');
    el.style.removeProperty('transform');
  });
  cur = null;
}

export function mount(): void {
  if (off) return;
  const main = document.getElementById('main');
  if (!main) return;
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || document.documentElement.classList.contains('fx-no-tilt')) return;
    const el = (e.target as Element).closest<HTMLElement>(SEL);
    if (el !== cur) { leave(); if (!el || (el.dataset.rva && !el.classList.contains('rv-done'))) return; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const max = el.matches('.al-tile') ? 4 : 6;
    tx = (0.5 - py) * 2 * max;
    ty = (px - 0.5) * 2 * max;
    glare(el);
    el.style.setProperty('--gx', `${Math.round(px * 100)}%`);
    el.style.setProperty('--gy', `${Math.round(py * 100)}%`);
    if (!cur) {
      cur = el;
      x = y = 0;
      el.classList.remove('tilt-out');
      el.classList.add('is-tilt');
      raf = requestAnimationFrame(frame);
    }
  };
  const out = (e: PointerEvent) => { if (cur && !cur.contains(e.relatedTarget as Node | null)) leave(); };
  main.addEventListener('pointermove', move, { passive: true });
  main.addEventListener('pointerout', out);
  main.addEventListener('click', reset);
  off = () => {
    main.removeEventListener('pointermove', move);
    main.removeEventListener('pointerout', out);
    main.removeEventListener('click', reset);
  };
}

EffectRegistry.register('micro:photoTilt', {
  /** preview: kịch bản (4°, −6°) 500ms -> giữ 300ms -> (−4°, 6°) 500ms -> về 0 400ms trên ảnh cô dâu/chú rể đầu */
  play() {
    document.getElementById('couple')?.scrollIntoView({ block: 'start' });
    const el = document.querySelector<HTMLElement>('.person-photo');
    if (!el?.animate) return;
    glare(el);
    el.classList.add('is-tilt');
    const a = el.animate([
      { transform: tf(0, 0) }, { transform: tf(4, -6), offset: 0.29 }, { transform: tf(4, -6), offset: 0.47 },
      { transform: tf(-4, 6), offset: 0.76 }, { transform: tf(0, 0) },
    ], { duration: 1700 / Math.min(1, EffectRegistry.timeScale), easing: 'ease-in-out' });
    a.onfinish = () => el.classList.remove('is-tilt');
  },
  reset() { off?.(); off = null; reset(); },
});
