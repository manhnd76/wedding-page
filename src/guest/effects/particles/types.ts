import type { ParticleKind } from './kind';

/** id -> dynamic import (1 module/loại, chỉ tải loại đang dùng). */
export const PARTICLE_LOADERS: Record<string, () => Promise<{ kind: ParticleKind }>> = {
  'petal-rose': () => import('./types/petal-rose'),
  heart: () => import('./types/heart'),
  'petal-peach': () => import('./types/petal-peach'),
  'gold-dust': () => import('./types/gold-dust'),
  firefly: () => import('./types/firefly'),
  // v4a-2c (design-v4a-2bc §4.2): 16 loại, module chỉ dữ liệu (≤ 1.5 KB gz/loại)
  'petal-sakura': () => import('./types/petal-sakura'),
  'petal-lotus': () => import('./types/petal-lotus'),
  'petal-dried': () => import('./types/petal-dried'),
  'petal-watercolor': () => import('./types/petal-watercolor'),
  plumeria: () => import('./types/plumeria'),
  'paper-heart': () => import('./types/paper-heart'),
  'leaf-green': () => import('./types/leaf-green'),
  'leaf-eucalyptus': () => import('./types/leaf-eucalyptus'),
  'leaf-maple': () => import('./types/leaf-maple'),
  pampas: () => import('./types/pampas'),
  snow: () => import('./types/snow'),
  bubble: () => import('./types/bubble'),
  sparkle: () => import('./types/sparkle'),
  'ink-dot': () => import('./types/ink-dot'),
  'dust-mote': () => import('./types/dust-mote'),
  'red-paper': () => import('./types/red-paper'),
};

export async function loadKinds(ids: string[]): Promise<ParticleKind[]> {
  const out: ParticleKind[] = [];
  for (const id of ids) {
    const l = PARTICLE_LOADERS[id] ?? PARTICLE_LOADERS['petal-rose']!;
    try { out.push((await l()).kind); } catch { /* mạng lỗi: bỏ loại này */ }
  }
  return out;
}
