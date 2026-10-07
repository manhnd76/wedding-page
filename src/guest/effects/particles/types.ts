import type { ParticleKind } from './kind';

/** id -> dynamic import (1 module/loại, chỉ tải loại đang dùng). */
export const PARTICLE_LOADERS: Record<string, () => Promise<{ kind: ParticleKind }>> = {
  'petal-rose': () => import('./types/petal-rose'),
  heart: () => import('./types/heart'),
  'petal-peach': () => import('./types/petal-peach'),
  'gold-dust': () => import('./types/gold-dust'),
  firefly: () => import('./types/firefly'),
};

export async function loadKinds(ids: string[]): Promise<ParticleKind[]> {
  const out: ParticleKind[] = [];
  for (const id of ids) {
    const l = PARTICLE_LOADERS[id] ?? PARTICLE_LOADERS['petal-rose']!;
    try { out.push((await l()).kind); } catch { /* mạng lỗi: bỏ loại này */ }
  }
  return out;
}
