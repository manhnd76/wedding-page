/**
 * Kiểu mở `envelope` - Phong bì mở nắp (design 3.4, mặc định Trầm Vàng).
 * Vừa: dấu sáp mờ 200ms -> nắp lật rotateX(180) 500ms -> thẻ trượt lên 500ms -> lời chào 600ms -> thẻ phóng + fade 400ms.
 * Nhẹ: bỏ dấu sáp/lời chào, nhịp ngắn hơn. Chỉ transform/opacity.
 */
import { EASE_INOUT, EASE_OUT, runSteps, type OpenLevelCtx, type OpenRun, type Step } from '../anim';

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const q = (s: string) => cover.querySelector<HTMLElement>(s);
  const seal = q('.cv-seal');
  const flap = q('.cv-flap');
  const card = q('.cv-card');
  const env = q('.cv-env');
  const greet = q('.cv-greet');
  const content = q('.cv-card-body');
  const light = c.level === 'light';
  const steps: Step[] = [];
  let t = 0;
  if (!light) {
    steps.push({ el: seal, frames: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.6) rotate(-8deg)' }], start: 0, dur: 200 });
    t = 150;
  } else {
    steps.push({ el: seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 120 });
  }
  const flapDur = light ? 320 : 500;
  steps.push({ el: flap, frames: [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(180deg)' }], start: t, dur: flapDur, easing: EASE_INOUT });
  t += flapDur - 50;
  const slideDur = light ? 320 : 500;
  steps.push({ el: card, frames: [{ transform: 'translateY(0)' }, { transform: 'translateY(-34%)' }], start: t, dur: slideDur });
  steps.push({ el: flap, frames: [{ opacity: 1 }, { opacity: 0 }], start: t + slideDur * 0.5, dur: 200 });
  t += slideDur;
  if (c.greeting && !light && greet) {
    steps.push({ el: content, frames: [{ opacity: 1 }, { opacity: 0 }], start: t - 100, dur: 200 });
    steps.push({ el: greet, frames: [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], start: t, dur: 300 });
    t += 600;
  }
  const endDur = light ? 300 : 400;
  steps.push({ el: card, frames: [{ transform: 'translateY(-34%) scale(1)' }, { transform: 'translateY(-20%) scale(1.5)' }], start: t, dur: endDur, easing: EASE_OUT });
  steps.push({ el: env, frames: [{ opacity: 1 }, { opacity: 0.0 }], start: t, dur: endDur });
  steps.push({ el: cover, frames: [{ opacity: 1 }, { opacity: 0 }], start: t + endDur * 0.3, dur: endDur * 0.7 });
  return runSteps(steps, c.timeScale);
}
