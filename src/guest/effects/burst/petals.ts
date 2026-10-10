/**
 * Burst `petals` sau khi mở thiệp (design 5.7): cánh hoa của theme bung từ giữa rồi chuyển thành hạt nền.
 * Số hạt Nhẹ/Vừa/Nhiều = 0/30/50. v4a-2c: mỗi cánh lấy biến thể hình của loại hạt nền theo trọng số (`bgKey`).
 */
import type { ParticleField } from '../particles/field';
import type { BurstOpts } from './registry';

export function play(field: ParticleField, o: BurstOpts): number {
  const { count, kindCount } = o;
  if (count <= 0 || kindCount <= 0) return 0;
  const { w, h } = field.size;
  const cx = o.origin?.x ?? w / 2;
  const cy = o.origin?.y ?? h * 0.42;
  const list = [];
  for (let i = 0; i < count; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
    const sp = 220 + Math.random() * 320;
    list.push({
      x: cx + (Math.random() - 0.5) * 40, y: cy + (Math.random() - 0.5) * 30,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      size: 12 + Math.random() * 10, life: 1200 + Math.random() * 400,
      gravity: 140, drag: 2.2, sprite: field.bgKey(i % kindCount), kindIdx: i % kindCount, toBg: true, spin: 3,
    });
  }
  const before = field.burstActive;
  field.addBurst(list);
  return field.burstActive - before;
}
