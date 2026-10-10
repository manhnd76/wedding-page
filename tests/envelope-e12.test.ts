/**
 * E12 (design-v4a-2bc §3.1, solution-v4a-2bc.md 1.8): mức "Nhiều" riêng cho 6 mẫu phong thư.
 * Số hạt mỗi mẫu, mốc `at` nằm trong pha mở khoá (trước khi nắp lật), lace có 6 cánh ở mức Vừa, Nhẹ/Vừa (trừ lace) không có hạt.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { EnvelopeSkin, EnvParts } from '@guest/cover/skins/kit';
import { richPlan } from '@guest/cover/styles/envelope';

/** Phần tử giả đủ cho unlock() (sealSplit/sheen) trong môi trường node. */
const fake = (): HTMLElement => ({
  querySelector: () => null, querySelectorAll: () => [], append() {}, appendChild() {}, setAttribute() {},
}) as unknown as HTMLElement;

beforeAll(() => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => fake(), createTextNode: () => ({}) };
});

const parts = (): EnvParts => ({ cover: fake(), env: fake(), back: fake(), front: fake(), flap: fake(), flapF: fake(), flapB: fake(), deco: fake(), seal: fake(), card: fake() });
const load = async (id: string): Promise<EnvelopeSkin> => (await import(`@guest/cover/skins/${id}.ts`)).skin as EnvelopeSkin;
const total = (plan: { count: number }[]) => plan.reduce((s, x) => s + x.count, 0);

/** Số hạt mức Nhiều theo design §3.1 (song-hy = 24 xác pháo + 8 sao). */
const RICH: Record<string, number> = { classic: 12, kraft: 10, 'song-hy': 32, lace: 12, minimal: 10, velvet: 16 };

describe('E12 - richPlan', () => {
  for (const [id, n] of Object.entries(RICH)) {
    it(`${id}: Nhiều ${n} hạt, phát trong pha mở khoá; Nhẹ không có`, async () => {
      const skin = await load(id);
      const plan = richPlan(skin, id, 'full+');
      expect(total(plan)).toBe(n);
      const { flapAt } = skin.unlock(parts(), false);
      for (const x of plan) {
        expect(x.at).toBeGreaterThanOrEqual(0);
        expect(x.at).toBeLessThan(flapAt);
        expect(x.life?.[1] ?? 800).toBeLessThanOrEqual(1800);
      }
      expect(richPlan(skin, id, 'light')).toEqual([]);
    });
  }

  it('lace mức Vừa: 6 cánh hoa (§3.4c); mẫu khác mức Vừa: không có hạt', async () => {
    expect(total(richPlan(await load('lace'), 'lace', 'full'))).toBe(6);
    for (const id of ['classic', 'kraft', 'song-hy', 'minimal', 'velvet']) expect(richPlan(await load(id), id, 'full')).toEqual([]);
  });

  it('skin không khai báo rich -> mặc định 12 bụi vàng ở seal', () => {
    const plan = richPlan(null, 'classic', 'full+');
    expect(total(plan)).toBe(12);
    expect(plan[0]!.kind).toEqual(['gold-dust']);
  });
});

describe('O01 (review v4a-1-2b) - E12 thấy được quanh tên khách', () => {
  it('vùng dịu: hạt nền / burst sau mở ≤ .3; burst trên cover sàn .75', async () => {
    const { alphaTarget, COVER_SOFT_ALPHA, SOFT_ALPHA } = await import('@guest/effects/particles/geometry');
    const soft = [{ left: 0, right: 100, top: 0, bottom: 100 }];
    expect(alphaTarget(50, 50, 1, [], soft)).toBe(SOFT_ALPHA);
    expect(COVER_SOFT_ALPHA).toBe(0.75);
    expect(alphaTarget(50, 50, 1, [], soft, COVER_SOFT_ALPHA)).toBe(0.75);
    expect(alphaTarget(500, 500, 1, [], soft, COVER_SOFT_ALPHA)).toBe(1);
    // vùng loại trừ vẫn 0
    expect(alphaTarget(50, 50, 1, soft, [], COVER_SOFT_ALPHA)).toBe(0);
  });

  it('gốc phát = mép trên thẻ tên − 12px khi seal chồng thẻ tên; không có thẻ tên -> tâm seal', async () => {
    const { sparkOrigin } = await import('@guest/cover/styles/envelope');
    const seal = { left: 150, right: 210, top: 380, bottom: 440 }; // tâm (180, 410)
    expect(sparkOrigin(seal, { left: 40, right: 320, top: 400, bottom: 560 })).toEqual({ x: 180, y: 388 });
    // thẻ tên ở xa phía dưới: giữ tâm seal (không kéo gốc xuống)
    expect(sparkOrigin(seal, { left: 40, right: 320, top: 520, bottom: 600 })).toEqual({ x: 180, y: 410 });
    expect(sparkOrigin(seal, null)).toEqual({ x: 180, y: 410 });
    expect(sparkOrigin(seal, { left: 300, right: 340, top: 400, bottom: 560 })).toEqual({ x: 180, y: 410 });
  });

  it('kraft: 2 quạt chéo lên-ra-ngoài, |vx| ≥ 40 px/s theo dấu quạt', async () => {
    const { sparkVelocity } = await import('@guest/cover/open-kit/sparks');
    const plan = richPlan(await load('kraft'), 'kraft', 'full+');
    expect(plan.length).toBe(2);
    const signs = new Set<number>();
    for (const x of plan) {
      const [a0, a1] = x.angle!;
      const [v0, v1] = x.speed!;
      const sign = Math.sign(Math.cos(((a0 + a1) / 2) * Math.PI / 180));
      signs.add(sign);
      for (const a of [a0, (a0 + a1) / 2, a1]) for (const v of [v0, v1]) {
        const { vx, vy } = sparkVelocity(a, v, x.minVx);
        expect(Math.sign(vx), `${a}° ${v}`).toBe(sign);
        expect(Math.abs(vx)).toBeGreaterThanOrEqual(40);
        expect(vy).toBeLessThan(0);
      }
    }
    expect([...signs].sort()).toEqual([-1, 1]);
  });

  it('lace: cánh hoa chậm nhất vẫn bay ≥ 40px khỏi gốc trong 0.8s đầu (mô phỏng như ParticleField)', async () => {
    const { sparkVelocity } = await import('@guest/cover/open-kit/sparks');
    const [x] = richPlan(await load('lace'), 'lace', 'full');
    for (const a of [x!.angle![0], -90, x!.angle![1]]) {
      let { vx, vy } = sparkVelocity(a, x!.speed![0]);
      let px = 0; let py = 0; let far = 0;
      const dt = 1 / 60;
      for (let t = 0; t < 0.8; t += dt) {
        const d = Math.exp(-x!.drag! * dt);
        vx *= d; vy = vy * d + x!.gravity! * dt;
        px += vx * dt; py += vy * dt;
        far = Math.max(far, Math.hypot(px, py));
      }
      expect(far, `${a}°`).toBeGreaterThanOrEqual(40);
    }
  });
});
