/**
 * Registry kiểu mở: id -> dynamic import (1 module/kiểu). `fade-zoom` và `none` nằm trong entry
 * (đích hạ cấp + fallback khi lỗi mạng) - solution 9.1 mục 2.
 */
import { runSteps, type OpenLevelCtx, type OpenRun } from './anim';

export type PlayFn = (cover: HTMLElement, c: OpenLevelCtx) => OpenRun;

/** Module kiểu mở: `prepare` (tuỳ chọn) dựng phần hình trước khi khách chạm (vd skin phong bì). */
export interface OpenModule { play: PlayFn; prepare?: (cover: HTMLElement) => Promise<void> }

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
  const l = OPEN_LOADERS[id];
  if (!l) return null;
  try {
    return await l();
  } catch {
    return null; // lỗi mạng -> caller dùng fade-zoom
  }
}
