/**
 * Kiểu mở `card-flip` - Thiệp lật (design 3.4): lật rotateY(180) lộ mặt trong "Chúng mình sắp cưới!",
 * giữ 600ms rồi zoom-fade. Nhẹ: lật nhanh, không giữ.
 */
import { EASE_INOUT, runSteps, type OpenLevelCtx, type OpenRun, type Step } from '../anim';

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const flip = cover.querySelector<HTMLElement>('.cv-flip-inner');
  const stage = cover.querySelector<HTMLElement>('.cv-stage');
  const light = c.level === 'light';
  const flipDur = light ? 420 : 700;
  const hold = light || !c.greeting ? 150 : 600;
  const end = light ? 300 : 400;
  const steps: Step[] = [
    { el: flip, frames: [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }], start: 0, dur: flipDur, easing: EASE_INOUT },
    { el: stage, frames: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.35)', opacity: 0 }], start: flipDur + hold, dur: end },
    { el: cover, frames: [{ opacity: 1 }, { opacity: 0 }], start: flipDur + hold + end * 0.3, dur: end * 0.7 },
  ];
  return runSteps(steps, c.timeScale);
}
