/**
 * Đo FPS 2s sau khi mở thiệp, sau đó theo dõi nhẹ (mỗi 10s đo 2s).
 * FPS < 45 -> hạ theo thứ tự design 5.10: gió -> giảm hạt 50% -> parallax-layers -> tắt hạt nền -> Ken Burns -> photo-tilt.
 */
export const DEGRADE_ORDER = ['wind', 'halfParticles', 'parallaxLayers', 'particles', 'kenBurns', 'photoTilt'] as const;
export type DegradeStep = (typeof DEGRADE_ORDER)[number];
export const FPS_THRESHOLD = 45;

export function measureFps(ms = 2000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let hiddenSeen = false;
    const onVis = () => { hiddenSeen = true; };
    document.addEventListener('visibilitychange', onVis);
    const t0 = performance.now();
    const tick = (t: number) => {
      frames++;
      if (t - t0 < ms) { requestAnimationFrame(tick); return; }
      document.removeEventListener('visibilitychange', onVis);
      // tab bị ẩn giữa chừng -> phép đo vô nghĩa, coi như đạt
      resolve(hiddenSeen ? 60 : (frames * 1000) / (t - t0));
    };
    requestAnimationFrame(tick);
  });
}

export function startPerfProbe(apply: (step: DegradeStep) => void, isBlocked: () => boolean): void {
  let idx = 0;
  const run = async () => {
    if (idx >= DEGRADE_ORDER.length) return;
    if (!isBlocked()) {
      const fps = await measureFps(2000);
      if (fps < FPS_THRESHOLD && !isBlocked()) apply(DEGRADE_ORDER[idx++]!);
    }
    setTimeout(run, idx === 0 ? 10_000 : 4_000);
  };
  void run();
}
