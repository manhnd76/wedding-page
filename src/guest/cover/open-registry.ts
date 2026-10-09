/**
 * Registry kiểu mở: id -> dynamic import (1 module/kiểu). `fade-zoom` và `none` nằm trong entry
 * (đích hạ cấp + fallback khi lỗi mạng) - solution 9.1 mục 2. Module v2 (solution-v4a-2bc.md bảng API):
 * `prepare(cover, info)` dựng lớp hình trước khi khách chạm (chạy cả ở fade200 để hình tĩnh đúng kiểu),
 * `play(cover, c)` trả `OpenRun`, `dispose()` dọn sau khi cover gỡ.
 */
import { runSteps, type OpenLevelCtx, type OpenRun } from './anim';

export type PlayFn = (cover: HTMLElement, c: OpenLevelCtx) => OpenRun;

export interface OpenPrepareInfo { mode: 'fade200' | 'light' | 'full' | 'full+'; lowEnd: boolean; preview: boolean }

export interface OpenModule {
  play: PlayFn;
  prepare?: (cover: HTMLElement, info: OpenPrepareInfo) => Promise<void>;
  dispose?: () => void;
}

/** 2 kiểu có từ v1 nằm ngay trong entry; 13 kiểu v4a-2b ở bảng loader lazy `open-loaders.ts` (giữ JS ban đầu của
 *  cấu hình mặc định: bảng tên file băm của 13 kiểu ~0.6 KB gz không vào entry). Module kiểu đang dùng vẫn được plugin
 *  `modulepreload`, nên bước tải bảng loader chỉ thêm 1 request nhỏ chạy song song với chờ font tên. */
export const OPEN_LOADERS: Record<string, () => Promise<OpenModule>> = {
  envelope: () => import('./styles/envelope'),
  'card-flip': () => import('./styles/card-flip'),
};

/** fade-zoom: scale(1.08) + opacity 0, 700ms (Nhẹ 500ms). */
export const fadeZoom: PlayFn = (cover, c) =>
  runSteps([{ el: cover, frames: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.08)' }], start: 0, dur: c.level === 'light' ? 500 : 700 }], c.timeScale);

/** none / Tắt / reduced-motion: fade 200ms. */
export const fade200: PlayFn = (cover) => runSteps([{ el: cover, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 200 }]);

export async function loadOpenModule(id: string): Promise<OpenModule | null> {
  if (id === 'fade-zoom') return { play: fadeZoom };
  if (id === 'none') return { play: fade200 };
  try {
    const l = OPEN_LOADERS[id] ?? (await import('./open-loaders')).NEW_LOADERS[id];
    if (!l) return null;
    return await l();
  } catch {
    return null; // lỗi mạng -> caller dùng fade-zoom
  }
}
