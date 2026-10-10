/**
 * Registry burst (solution-v4a-2bc.md 0.3, 2.3): id -> dynamic import (1 module/burst, tải lười sau khi mở thiệp).
 * Bước 0 tạo với `petals`; v4a-2c thêm `confetti`, `gold`, `red-paper`, `heart-burst` (dữ liệu mảnh: `assets/v4a-2/burst/bursts.json`).
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

/** Sprite mảnh của 1 burst (khoá đã đăng ký trong field, lặp theo tỉ lệ biến thể) + cờ chuyển động. */
export interface BurstPieces { keys: string[]; flip?: boolean; twinkle?: boolean }

export interface BurstModule {
  /** thêm hạt vào field; trả số hạt đã thêm (gồm cả đợt trễ đã lên lịch) */
  play(field: ParticleField, o: BurstOpts): number;
  /**
   * Chỉ lấy sprite mảnh (v4a-2c): hạt trên cover (`open-kit/sparks`) giữ vật lý riêng của kiểu mở nhưng dùng mảnh thật
   * của burst (confetti, bụi vàng). `colors` ghi đè bảng màu theme.
   */
  pieces?(field: ParticleField, colors?: readonly string[]): BurstPieces;
}

/** v4a-2c (solution-v4a-2bc.md 2.3): `confetti`/`gold`/`red-paper` = "Sau khi mở"; `heart-burst` = lời chúc (v3 móc nút). */
export const BURST_LOADERS: Record<string, () => Promise<BurstModule>> = {
  petals: () => import('./petals'),
  confetti: () => import('./confetti'),
  gold: () => import('./gold'),
  'red-paper': () => import('./red-paper'),
  'heart-burst': () => import('./heart-burst'),
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
