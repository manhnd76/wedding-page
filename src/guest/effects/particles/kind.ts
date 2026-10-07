/** Mô tả 1 loại hạt (module lazy `types/<id>.ts`). */
export type Motion = 'fall' | 'float-up' | 'drift' | 'twinkle';

export interface ParticleKind {
  id: string;
  motion: Motion;
  /** hệ số mật độ loại (design 5.7) */
  density: number;
  /** cỡ hiển thị CSS px [min, max] */
  size: [number, number];
  /** tốc độ chính px/s [min, max] */
  speed: [number, number];
  /** lật giả 3D (scaleX = cos(phase)) */
  flip?: boolean;
  /** tốc độ xoay rad/s tối đa */
  spin?: number;
  /** màu khi particles.color = "theme" (null = dùng màu theme accent/primary) */
  natural?: string[] | null;
  /** vẽ sprite vào ô vuông `s` px, gốc toạ độ ở tâm */
  draw(g: CanvasRenderingContext2D, s: number, color: string, alt: string): void;
}
