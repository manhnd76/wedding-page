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
