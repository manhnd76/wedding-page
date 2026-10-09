/**
 * Bảng loader 13 kiểu mở v4a-2b (lazy, xem `open-registry.ts`): id -> dynamic import (1 module/kiểu + CSS riêng).
 */
import type { OpenModule } from './open-registry';

export const NEW_LOADERS: Record<string, () => Promise<OpenModule>> = {
  curtain: () => import('./styles/curtain'),
  'wax-seal': () => import('./styles/wax-seal'),
  origami: () => import('./styles/origami'),
  'double-door': () => import('./styles/double-door'),
  'flower-gate': () => import('./styles/flower-gate'),
  scroll: () => import('./styles/scroll'),
  'card-3d': () => import('./styles/card-3d'),
  'light-gather': () => import('./styles/light-gather'),
  'gift-box': () => import('./styles/gift-box'),
  'moon-gate': () => import('./styles/moon-gate'),
  book: () => import('./styles/book'),
  'ink-spread': () => import('./styles/ink-spread'),
  polaroid: () => import('./styles/polaroid'),
};
