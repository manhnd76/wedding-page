/**
 * Registry burst (solution-v4a-2bc.md 0.3, 2.3): id -> dynamic import (1 module/burst, tải lười sau khi mở thiệp).
 * Bước 0 tạo với `petals`; v4a-2c sở hữu sau đó (thêm `confetti`, `gold`, `red-paper`, `heart-burst`).
 */
import { EffectRegistry } from '../registry';
import { burstCount, type FxState } from '../intensity';
import type { ParticleField } from '../particles/field';

export interface BurstOpts {
  /** số hạt (đã tính theo cấp, vd `burstCount`) */
  count: number;
  /** điểm bung (px, toạ độ viewport); không có = mặc định của module */
  origin?: { x: number; y: number };
  /** hộp nguồn (vd rect nút gửi) cho burst bung từ phần tử */
  from?: { left: number; top: number; right: number; bottom: number };
  /** số loại hạt nền đã nạp (sprite `k0..k{n-1}`) */
  kindCount: number;
}

export interface BurstModule {
  /** thêm hạt vào field; trả số hạt đã thêm */
  play(field: ParticleField, o: BurstOpts): number;
}

export const BURST_LOADERS: Record<string, () => Promise<BurstModule>> = {
  petals: () => import('./petals'),
};

/** Module về muộn hơn mốc này (tính từ lúc mở thiệp) thì bỏ, không bắn burst trễ. */
export const LATE_DROP_MS = 1000;
/** `requestIdleCallback` timeout khi lên lịch burst sau khi mở. */
export const IDLE_TIMEOUT_MS = 300;

/** Phát burst `id` (chưa có loader -> `petals`). */
export async function playBurst(id: string, field: ParticleField, o: BurstOpts): Promise<number> {
  const load = BURST_LOADERS[id] ?? BURST_LOADERS.petals!;
  const m = await load();
  return m.play(field, o);
}

const idle = (fn: () => void) => {
  const w = globalThis as typeof globalThis & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(fn, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(fn, 1); // Safari: chưa có rIC
};

/**
 * Burst "Sau khi mở" (Data Flow 2c): đăng ký `EffectRegistry 'burst'` (phát lại trong preview), rồi lúc rảnh
 * (rIC, timeout 300 ms) tải module và phát 1 lần; module về trễ > 1000 ms kể từ lúc gọi thì bỏ.
 */
export function scheduleOnOpenBurst(field: ParticleField, id: string, state: FxState, kindCount: number): void {
  if (!id || id === 'none') return;
  const o: BurstOpts = { count: burstCount(id, state), kindCount };
  EffectRegistry.register('burst', { play: () => { void playBurst(id, field, o); } });
  const t0 = Date.now();
  idle(() => {
    const load = BURST_LOADERS[id] ?? BURST_LOADERS.petals!;
    load().then((m) => {
      if (Date.now() - t0 > LATE_DROP_MS) return;
      m.play(field, o);
    }).catch(() => undefined);
  });
}
