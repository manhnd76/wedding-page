/**
 * Helper WAAPI cho kiểu mở thiệp: mọi bước tạo cùng lúc với `delay`, nên tua nhanh = tăng playbackRate
 * để phần còn lại xong trong 300ms (design 3.4b).
 */
export interface OpenLevelCtx {
  /** light = bản Nhẹ; full = Vừa; full+ = Nhiều */
  level: 'light' | 'full' | 'full+';
  greeting: boolean;
  timeScale: number;
}

export interface OpenRun { finished: Promise<void>; fastForward(): void }

export interface Step {
  el: Element | null | undefined;
  frames: Keyframe[];
  start: number;
  dur: number;
  easing?: string;
}

export const EASE_OUT = 'cubic-bezier(.22,1,.36,1)';
export const EASE_INOUT = 'cubic-bezier(.65,0,.35,1)';
export const FAST_FORWARD_MS = 300;
export const MAX_OPEN_MS = 2400;

export function runSteps(steps: Step[], timeScale = 1): OpenRun {
  const valid = steps.filter((s) => s.el && typeof (s.el as HTMLElement).animate === 'function');
  const total = Math.min(MAX_OPEN_MS, Math.max(0, ...steps.map((s) => s.start + s.dur)));
  if (!valid.length) return { finished: Promise.resolve(), fastForward: () => {} };
  const t0 = performance.now();
  const anims = valid.map((s) => {
    const a = (s.el as HTMLElement).animate(s.frames, { delay: s.start, duration: s.dur, easing: s.easing ?? EASE_OUT, fill: 'forwards' });
    a.playbackRate = Math.max(0.1, timeScale);
    return a;
  });
  const finished = Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => undefined);
  return {
    finished,
    fastForward() {
      const elapsed = (performance.now() - t0) * Math.max(0.1, timeScale);
      const remaining = total - elapsed;
      if (remaining <= FAST_FORWARD_MS) return;
      const rate = remaining / FAST_FORWARD_MS;
      anims.forEach((a) => (a.updatePlaybackRate ? a.updatePlaybackRate(rate) : (a.playbackRate = rate)));
    },
  };
}
