/**
 * Kiểu mở `card-3d` - Thiệp 3D xoay (design-v4a-2bc §2.7, họ vật thể, chi phí Thấp).
 * Thẻ 2 mặt (backface hidden): mặt trước chứa đầu đề + tên cặp đôi + "Kính gửi" (node chữ của entry, di chuyển vào),
 * mặt sau nền primary + lời chào. Trước khi chạm (chỉ Vừa/Nhiều): con trỏ (pointer: fine) nghiêng ±10°; cảm ứng lắc ±3° 1 lần.
 * Vừa ~1.4s: xoay 360° 0–900 + bóng co giãn · phóng 900–1300 + mờ · cover mờ 1000–1400.
 * Nhẹ ~0.7s: lật 180° 0–400, mờ 400–700. Nhiều: + vệt sáng lướt mặt trước 0–400 và mặt sau 500–900.
 */
import './card-3d.css';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, greet, mk, move, tl, type StepSpec, type Timeline } from '../open-kit/layers';

let stopTilt: (() => void) | null = null;

export function timeline(level: OpenLevelCtx['level']): Timeline {
  const rot = (deg: number, d: number): StepSpec => ({ k: 'c3-rot', f: [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${deg}deg)` }], s: 0, d, e: EASE_INOUT });
  if (level === 'light') return tl([rot(180, 400), fade('cover', 400, 300)]);
  const steps: StepSpec[] = [
    rot(360, 900),
    { k: 'c3-sh', f: [1, 0.35, 1, 0.35, 1].map((x, i) => ({ transform: `scaleX(${x})`, opacity: i % 2 ? 0.2 : 0.35 })), s: 0, d: 900, e: EASE_INOUT },
    { k: 'c3', f: [{ transform: 'scale(1)', opacity: 1 }, { opacity: 1, offset: 0.25 }, { transform: 'scale(1.6)', opacity: 0 }], s: 900, d: 400 },
    fade('cv-guestline', 900, 150),
    fade('cover', 1000, 400),
  ];
  if (level === 'full+') {
    const sheen = (k: string, s: number): StepSpec => ({ k, f: [{ transform: 'translateX(-120%)', opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: 'translateX(120%)', opacity: 0 }], s, d: 400 });
    steps.push(sheen('c3-sf', 0), sheen('c3-sb', 500));
  }
  return tl(steps);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const front = div('c3-face c3-front op-fit', mk('c3-frame'));
  front.removeAttribute('aria-hidden');
  const tilt = div('c3-tilt', div('c3-rot', front, div('c3-face c3-back', greet(), div('c3-sheen c3-sb'))));
  tilt.removeAttribute('aria-hidden');
  const c3 = div('c3', div('c3-sh'), tilt);
  c3.removeAttribute('aria-hidden');
  cover.querySelector('.op-stage')!.append(c3);
  move(cover, '.cv-head', front);
  front.append(div('c3-div'));
  move(cover, '.cv-guestline', front);
  front.append(div('c3-sheen c3-sf'));
  if (info.mode !== 'full' && info.mode !== 'full+') return;
  if (matchMedia('(pointer: fine)').matches) {
    let tx = 0; let ty = 0; let x = 0; let y = 0; let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      tilt.style.setProperty('transform', `rotateY(${x.toFixed(2)}deg) rotateX(${y.toFixed(2)}deg)`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = ((e.clientX / innerWidth) - 0.5) * 20; ty = -((e.clientY / innerHeight) - 0.5) * 20;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    cover.addEventListener('pointermove', onMove);
    stopTilt = () => { cover.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  } else tilt.classList.add('c3-sway');
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  stopTilt?.();
  return bind(cover, timeline(c.level), c);
}

export function dispose(): void { stopTilt?.(); stopTilt = null; }
