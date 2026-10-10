import { afterEach, describe, expect, it, vi } from 'vitest';
import { BURST_LOADERS, LATE_DROP_MS, playBurst, scheduleOnOpenBurst, type BurstModule } from '@guest/effects/burst/registry';
import { EffectRegistry } from '@guest/effects/registry';
import type { ParticleField } from '@guest/effects/particles/field';

/** ParticleField giả (môi trường node, không DOM): đếm hạt được thêm. */
function fakeField() {
  const added: unknown[] = [];
  const f = {
    size: { w: 360, h: 740 },
    get burstActive() { return added.length; },
    addBurst(list: unknown[]) { added.push(...list); },
    bgKey: (i: number) => `k${i}`,
  };
  return { field: f as unknown as ParticleField, added };
}

const TEST_IDS = ['t-late', 't-ok'];
afterEach(() => {
  for (const id of TEST_IDS) delete BURST_LOADERS[id];
  vi.useRealTimers();
});

describe('burst registry (solution-v4a-2bc.md 0.3)', () => {
  it('petals đã đăng ký; play trả số hạt đã thêm', async () => {
    expect(Object.keys(BURST_LOADERS)).toContain('petals');
    const { field, added } = fakeField();
    expect(await playBurst('petals', field, { count: 30, kindCount: 2 })).toBe(30);
    expect(added).toHaveLength(30);
  });

  it('id chưa có loader -> petals', async () => {
    const { field, added } = fakeField();
    expect(await playBurst('confetti-chua-co', field, { count: 12, kindCount: 1 })).toBe(12);
    expect(added).toHaveLength(12);
  });

  it('count 0 hoặc chưa có loại hạt -> 0 hạt', async () => {
    const { field } = fakeField();
    expect(await playBurst('petals', field, { count: 0, kindCount: 2 })).toBe(0);
    expect(await playBurst('petals', field, { count: 10, kindCount: 0 })).toBe(0);
  });

  it('scheduleOnOpenBurst: module về kịp -> phát 1 lần với số hạt theo cấp; đăng ký EffectRegistry "burst"', async () => {
    vi.useFakeTimers();
    const play = vi.fn<BurstModule['play']>(() => 1);
    BURST_LOADERS['t-ok'] = () => new Promise((res) => setTimeout(() => res({ play }), 200));
    const { field } = fakeField();
    scheduleOnOpenBurst(field, 't-ok', 'medium', 2);
    expect(EffectRegistry.ids()).toContain('burst');
    await vi.advanceTimersByTimeAsync(LATE_DROP_MS + 500);
    expect(play).toHaveBeenCalledTimes(1);
    expect(play.mock.calls[0]![1]).toMatchObject({ kindCount: 2 });
  });

  it('scheduleOnOpenBurst: module về trễ > 1000 ms -> bỏ (không bắn burst trễ)', async () => {
    vi.useFakeTimers();
    const play = vi.fn<BurstModule['play']>(() => 1);
    BURST_LOADERS['t-late'] = () => new Promise((res) => setTimeout(() => res({ play }), LATE_DROP_MS + 200));
    const { field } = fakeField();
    scheduleOnOpenBurst(field, 't-late', 'high', 1);
    await vi.advanceTimersByTimeAsync(LATE_DROP_MS + 1000);
    expect(play).not.toHaveBeenCalled();
  });

  it('scheduleOnOpenBurst: "none" -> không làm gì', async () => {
    vi.useFakeTimers();
    const { field, added } = fakeField();
    scheduleOnOpenBurst(field, 'none', 'high', 1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(added).toHaveLength(0);
  });

  it('petals: số hạt theo cấp (Nhẹ 0 / Vừa / Nhiều) qua burstCount', async () => {
    await import('@guest/effects/burst/petals'); // nạp sẵn để import() trong registry về ngay
    vi.useFakeTimers();
    const counts: number[] = [];
    for (const state of ['low', 'medium', 'high'] as const) {
      const { field, added } = fakeField();
      scheduleOnOpenBurst(field, 'petals', state, 1);
      await vi.advanceTimersByTimeAsync(400);
      counts.push(added.length);
    }
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBeGreaterThan(0);
    expect(counts[2]).toBeGreaterThan(counts[1]!);
  });
});
