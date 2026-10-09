/**
 * Helper WAAPI cho kiểu mở thiệp: mọi bước tạo cùng lúc với `delay`, nên tua nhanh = tăng playbackRate
 * (đồng đều cho mọi animation để các bước "đồng bộ" vẫn khớp nhau) để phần còn lại xong trong 300ms (design 3.4b).
 */
export interface OpenLevelCtx {
  /** light = bản Nhẹ; full = Vừa; full+ = Nhiều */
  level: 'light' | 'full' | 'full+';
  greeting: boolean;
  timeScale: number;
  /** điểm chạm (px, viewport); mở bằng bàn phím -> không có */
  tap?: { x: number; y: number };
  lowEnd?: boolean;
}

export interface OpenRun {
  finished: Promise<void>;
  fastForward(): void;
  /** tổng thời lượng dự kiến (ms, thời gian animation) */
  totalMs: number;
  /** phần còn lại (ms đồng hồ thật theo tốc độ hiện tại) */
  remainingMs(): number;
}

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

/** Phần còn lại (ms thật) của 1 nhóm animation: max (endTime − currentTime) / playbackRate. */
export function animsRemaining(anims: readonly Animation[]): number {
  let max = 0;
  for (const a of anims) {
    if (a.playState === 'finished') continue;
    const end = Number(a.effect?.getComputedTiming().endTime ?? 0);
    const cur = Number(a.currentTime ?? 0);
    max = Math.max(max, (end - cur) / Math.max(0.01, Math.abs(a.playbackRate || 1)));
  }
  return max;
}

/** Tua nhanh: nhân tốc độ mọi animation cùng 1 hệ số để phần còn lại ≤ 300ms. */
export function fastForwardAnims(anims: readonly Animation[]): void {
  const rem = animsRemaining(anims);
  if (rem <= FAST_FORWARD_MS) return;
  const k = rem / FAST_FORWARD_MS;
  for (const a of anims) {
    const r = (a.playbackRate || 1) * k;
    if (a.updatePlaybackRate) a.updatePlaybackRate(r);
    else a.playbackRate = r;
  }
}

export function runSteps(steps: Step[], timeScale = 1): OpenRun {
  const valid = steps.filter((s) => s.el && typeof (s.el as HTMLElement).animate === 'function');
  const totalMs = Math.min(MAX_OPEN_MS, Math.max(0, ...steps.map((s) => s.start + s.dur)));
  if (!valid.length) return { finished: Promise.resolve(), fastForward: () => {}, totalMs, remainingMs: () => 0 };
  const anims = valid.map((s) => {
    const a = (s.el as HTMLElement).animate(s.frames, { delay: s.start, duration: s.dur, easing: s.easing ?? EASE_OUT, fill: 'forwards' });
    a.playbackRate = Math.max(0.1, timeScale);
    return a;
  });
  const finished = Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => undefined);
  return { finished, fastForward: () => fastForwardAnims(anims), totalMs, remainingMs: () => animsRemaining(anims) };
}
