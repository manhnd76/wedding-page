/**
 * Q2 (design-review-v4a-2c, lệch #12): 16 module hạt sinh bằng `scripts/gen-particles.mjs` từ `particles.json` + ghi đè
 * vòng sửa (`scripts/particles-overrides.mjs`) - module trong repo phải khớp đúng từng byte (sửa json/ghi đè mà quên sinh lại -> đỏ).
 * Kèm kiểm số liệu P01–P05.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OUT_DIR, renderAll } from '../scripts/gen-particles.mjs';
import { OVERRIDES } from '../scripts/particles-overrides.mjs';
import { PARTICLE_LOADERS } from '@guest/effects/particles/types';

const files = renderAll();
const load = async (id: string) => (await PARTICLE_LOADERS[id]!()).kind;

describe('module hạt khớp particles.json + ghi đè (Q2)', () => {
  it('đủ 16 loại', () => expect(Object.keys(files)).toHaveLength(16));
  it.each(Object.keys(files))('%s: module = sinh lại từ dữ liệu (chạy `node scripts/gen-particles.mjs` nếu đỏ)', (id) => {
    const cur = readFileSync(path.join(OUT_DIR, `${id}.ts`), 'utf8').replace(/\r\n/g, '\n');
    expect(cur).toBe(files[id]);
  });
  it('ghi đè trống: P01–P05 đã chép vào particles.json (v4a-2a xoá mục thừa); số liệu vẫn kiểm ở dưới', () => {
    expect(Object.values(OVERRIDES).flat()).toEqual([]);
  });
});

describe('số liệu vòng sửa P01–P05', () => {
  it('P01 dust-mote: cỡ [5, 12], alpha [.45, .8], vành #B8925A + lõi #FFF1CC, naturalDark giữ', async () => {
    const k = await load('dust-mote');
    expect(k.size).toEqual([5, 12]);
    expect(k.alpha).toEqual([0.45, 0.8]);
    expect(k.natural).toEqual(['#B8925A', '#FFF1CC']);
    expect(k.naturalDark).toEqual(['#FFE7B0', '#FFF6E0']);
  });
  it('P02 snow: lòng #EEF3F8 (sáng), tối giữ trắng + bỏ vành', async () => {
    const k = await load('snow');
    expect(k.natural).toEqual(['#EEF3F8', '#9FB3C8']);
    expect(k.naturalDark).toEqual(['#FFFFFF', 'rgba(255,255,255,0)']);
  });
  it('P03 paper-heart: mọi điểm của nét sáng nằm trong thuỳ trái (tim ≈ 2 hình tròn thuỳ + tam giác dưới)', async () => {
    const k = await load('paper-heart');
    const l = k.variants![0]!.layers[3]!;
    expect(l.stroke).toBe('light');
    const nums = l.d!.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const pts: [number, number][] = [];
    for (let i = 0; i < nums.length; i += 2) pts.push([nums[i]!, nums[i + 1]!]);
    // tâm thuỳ trái ≈ (-4.3, -3.4), bán kính ≈ 5 (đỉnh thuỳ y ≈ -5.6 theo review); mọi điểm điều khiển nằm trong thuỳ
    for (const [x, y] of pts) expect(Math.hypot(x + 4.3, y + 2.4), `(${x},${y})`).toBeLessThan(4.6);
  });
  it('P04 paper-heart: mặt sau = tim c2 .9 + gân giữa sáng', async () => {
    const k = await load('paper-heart');
    expect(k.back![0]).toMatchObject({ fill: 'c2', a: 0.9 });
    expect(k.back![1]).toMatchObject({ stroke: 'light', lw: 0.6, a: 0.6 });
  });
  it('P05 leaf-maple: cỡ [18, 28]', async () => {
    expect((await load('leaf-maple')).size).toEqual([18, 28]);
  });
});
