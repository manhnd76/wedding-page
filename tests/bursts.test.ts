/**
 * v4a-2c burst (solution-v4a-2bc.md 2.3, 4.1, 5 #2 #5 #6; design-v4a-2bc §5): confetti / gold / red-paper / heart-burst.
 * Field giả (môi trường node): ghi hạt được thêm + sprite đăng ký, áp trần 120 như ParticleField.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ctx } from '@guest/context';
import { BURST_LOADERS, playBurst, type BurstModule } from '@guest/effects/burst/registry';
import type { BurstMover, BurstParticle, ParticleField } from '@guest/effects/particles/field';
import { BURST_HARD_CAP, moveBurst, stepBursts } from '@guest/effects/particles/field';
import type { ParticleKind } from '@guest/effects/particles/kind';
import { mix } from '@guest/effects/particles/sprite-kit';
import { BURST_COUNTS, burstCount, type FxState } from '@guest/effects/intensity';
import { BURSTS_ON_OPEN } from '@shared/config/enums';
import { CAPABILITIES } from '@shared/capabilities';

const W = 360;
const H = 740;
const LIGHT = { primary: '#8A6A3B', accent: '#C9A86A', accent2: '#E9C2B8', primaryDecor: '#8A6A3B' };
const DARK = { primary: '#D9B77E', accent: '#9C7A45', accent2: '#9C7A45', primaryDecor: '#D9B77E' };

function fakeField(kinds: string[] = []) {
  const added: BurstParticle[] = [];
  const sprites = new Map<string, { c1: string; c2: string; back: boolean }>();
  const f = {
    size: { w: W, h: H },
    get burstActive() { return added.length; },
    addBurst(list: BurstParticle[]) { for (const b of list) { if (added.length >= BURST_HARD_CAP) break; added.push(b); } },
    layerSprite(key: string, _s: number, _l: unknown, c1: string, c2: string, back?: unknown) {
      sprites.set(key, { c1, c2, back: false });
      if (back) sprites.set(`${key}~b`, { c1, c2, back: true });
      return key;
    },
    kindSprites(prefix: string, k: { variants?: { back?: unknown }[]; back?: unknown }, c1: string, c2: string) {
      return (k.variants ?? [{}]).map((v, i) => {
        const key = i ? `${prefix}.${i}` : prefix;
        sprites.set(key, { c1, c2, back: false });
        if (v.back ?? k.back) sprites.set(`${key}~b`, { c1, c2, back: true });
        return key;
      });
    },
    kindIndex: (id: string) => kinds.indexOf(id),
    bgKey: (i: number) => `k${i}`,
    mix,
  };
  return { field: f as unknown as ParticleField, added, sprites };
}

const load = async (id: string) => BURST_LOADERS[id]!();
const setTheme = (mode: 'light' | 'dark') => {
  (ctx as unknown as { resolved: unknown }).resolved = { mode, tokens: mode === 'dark' ? DARK : LIGHT };
};
beforeEach(() => setTheme('light'));
afterEach(() => { vi.useRealTimers(); });

describe('registry + capability', () => {
  it('4 burst có module; confetti/gold/red-paper bật ở "Sau khi mở"; heart-burst không thuộc enum', async () => {
    for (const id of ['confetti', 'gold', 'red-paper', 'heart-burst']) {
      expect(BURST_LOADERS[id], id).toBeTypeOf('function');
      expect(typeof (await load(id)).play).toBe('function');
    }
    expect([...CAPABILITIES.burstOnOpen.supported].sort()).toEqual([...BURSTS_ON_OPEN].sort());
    expect(BURSTS_ON_OPEN).not.toContain('heart-burst');
  });
  it('số hạt theo cấp (BURST_COUNTS): Nhẹ 0, mọi mức ≤ 120', () => {
    for (const id of Object.keys(BURST_COUNTS)) {
      expect(burstCount(id, 'low')).toBe(0);
      for (const s of ['medium', 'high'] as FxState[]) expect(burstCount(id, s)).toBeLessThanOrEqual(BURST_HARD_CAP);
    }
    expect([burstCount('heart-burst', 'medium'), burstCount('heart-burst', 'high')]).toEqual([8, 12]);
  });
});

describe('confetti (sau khi mở)', () => {
  it.each([['medium', 80], ['high', 120]] as [FxState, number][])('%s: %i mảnh, 3 nhịp 40ms, 2 góc dưới bắn lên, lật, đời ≤ 1800', async (state, n) => {
    vi.useFakeTimers();
    const m = await load('confetti');
    const { field, added } = fakeField();
    expect(m.play(field, { count: burstCount('confetti', state), kindCount: 1 })).toBe(n);
    const first = added.length;
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(n);
    await vi.advanceTimersByTimeAsync(100);
    expect(added).toHaveLength(n);
    for (const p of added) {
      const left = p.x < W * 0.15;
      expect(left || p.x > W * 0.85, `x=${p.x}`).toBe(true);
      expect(p.y).toBeGreaterThan(H);
      expect(p.vy).toBeLessThan(0);
      expect(left ? p.vx > 0 : p.vx < 0).toBe(true);
      expect(p.life).toBeLessThanOrEqual(1800);
      expect(p.flip).toBe(true);
      // P06: cỡ ô 16–24 px
      expect(p.size).toBeGreaterThanOrEqual(16);
      expect(p.size).toBeLessThanOrEqual(24);
    }
    // cả 2 bên đều có
    expect(added.filter((p) => p.x < W / 2).length).toBeGreaterThan(n * 0.4);
  });
  it('Nhẹ / count 0 -> 0 mảnh', async () => {
    const { field, added } = fakeField();
    expect((await load('confetti')).play(field, { count: burstCount('confetti', 'low'), kindCount: 1 })).toBe(0);
    expect(added).toHaveLength(0);
  });
  it('RSVP (from = rect nút): từ mép trên nút, bắn lên, đời ≤ 1400', async () => {
    const { field, added } = fakeField();
    const from = { left: 100, top: 500, right: 260, bottom: 548 };
    (await load('confetti')).play(field, { count: 40, kindCount: 1, from });
    expect(added).toHaveLength(40);
    for (const p of added) {
      expect(Math.abs(p.x - 180)).toBeLessThanOrEqual(8);
      expect(p.y).toBe(500);
      expect(p.vy).toBeLessThan(0);
      expect(p.life).toBeLessThanOrEqual(1400);
      expect(p.size).toBeGreaterThanOrEqual(16);
      expect(p.size).toBeLessThanOrEqual(24);
    }
  });
  it('màu theo mode: sáng [accent, accent-2, primary, accent pha trắng]; tối [primary, accent, #F2E9E1, …]; hình chữ nhật/vuông có mặt sau', async () => {
    const m = await load('confetti');
    const light = fakeField();
    m.play(light.field, { count: 10, kindCount: 1, origin: { x: 10, y: 10 } });
    const lc = new Set([...light.sprites.values()].map((s) => s.c1));
    expect([...lc].sort()).toEqual([LIGHT.accent, LIGHT.accent2, LIGHT.primary, mix(LIGHT.accent, '#ffffff', 0.45)].sort());
    expect(light.sprites.size).toBe(16 + 8); // 4 hình × 4 màu + mặt sau của 2 hình × 4 màu
    setTheme('dark');
    const dark = fakeField();
    m.play(dark.field, { count: 10, kindCount: 1, origin: { x: 10, y: 10 } });
    expect([...new Set([...dark.sprites.values()].map((s) => s.c1))]).toContain('#F2E9E1');
    expect([...new Set([...dark.sprites.values()].map((s) => s.c1))]).toContain(DARK.primary);
  });
  it('pieces (gift-box trên cover): 10 khoá đã đăng ký, lật', async () => {
    const { field, sprites } = fakeField();
    const p = (await load('confetti')).pieces!(field);
    expect(p.keys).toHaveLength(10);
    expect(p.flip).toBe(true);
    for (const k of p.keys) expect(sprites.has(k)).toBe(true);
  });
});

describe('gold', () => {
  it.each([['medium', 60], ['high', 100]] as [FxState, number][])('%s: %i hạt toả 360° từ (50%, 42%), nhấp nháy, đời ≤ 1400', async (state, n) => {
    const { field, added } = fakeField();
    expect((await load('gold')).play(field, { count: burstCount('gold', state), kindCount: 1 })).toBe(n);
    expect(added).toHaveLength(n);
    for (const p of added) {
      expect(Math.abs(p.x - W / 2)).toBeLessThanOrEqual(6);
      expect(Math.abs(p.y - H * 0.42)).toBeLessThanOrEqual(6);
      expect(p.twinkle).toBe(true);
      expect(p.life).toBeLessThanOrEqual(1400);
      expect(p.size).toBeLessThanOrEqual(10);
    }
    // có cả hướng lên và xuống, trái và phải
    expect(added.some((p) => p.vy < 0) && added.some((p) => p.vy > 0) && added.some((p) => p.vx < 0) && added.some((p) => p.vx > 0)).toBe(true);
  });
  it('màu theo mode (không theo accent): sáng #C9A24A/#B8862F, tối #F3D48C/#D9B77E', async () => {
    const m = await load('gold');
    const a = fakeField();
    m.play(a.field, { count: 5, kindCount: 1 });
    expect([...new Set([...a.sprites.values()].map((s) => s.c1))].sort()).toEqual(['#B8862F', '#C9A24A']);
    setTheme('dark');
    const b = fakeField();
    m.play(b.field, { count: 5, kindCount: 1 });
    expect([...new Set([...b.sprites.values()].map((s) => s.c1))].sort()).toEqual(['#D9B77E', '#F3D48C']);
  });
  it('pieces: chấm : sao = 7 : 3, nhấp nháy, màu ghi đè được (E12)', async () => {
    const { field, sprites } = fakeField();
    const p = (await load('gold')).pieces!(field, ['#F3D48C', '#FFF8E6']);
    expect(p.twinkle).toBe(true);
    expect(p.keys).toHaveLength(10);
    expect(new Set(p.keys).size).toBe(2);
    expect([...sprites.values()].every((s) => s.c1 === '#F3D48C' && s.c2 === '#FFF8E6')).toBe(true);
  });
});

describe('red-paper', () => {
  it.each([['medium', 80], ['high', 120]] as [FxState, number][])('%s: %i mảnh 3 đợt (0 / 150 / 300 ms) - quạt từ (50%, 12%) rồi mưa từ mép trên', async (state, n) => {
    vi.useFakeTimers();
    const { field, added } = fakeField();
    expect((await load('red-paper')).play(field, { count: burstCount('red-paper', state), kindCount: 1 })).toBe(n);
    expect(added).toHaveLength(Math.round(n * 0.4));
    for (const p of added) { expect(Math.abs(p.y - H * 0.12)).toBeLessThan(1); expect(p.vy).toBeGreaterThan(0); }
    await vi.advanceTimersByTimeAsync(160);
    const wave2 = added.length;
    expect(wave2).toBeGreaterThan(Math.round(n * 0.4));
    expect(wave2).toBeLessThan(n);
    await vi.advanceTimersByTimeAsync(200);
    expect(added).toHaveLength(n);
    for (const p of added.slice(Math.round(n * 0.4))) {
      expect(p.y).toBe(-12);
      expect(p.x).toBeGreaterThanOrEqual(W * 0.12);
      expect(p.x).toBeLessThanOrEqual(W * 0.88);
    }
    for (const p of added) { expect(p.flip).toBe(true); expect(p.life).toBeLessThanOrEqual(1800); expect(p.toBg).toBeUndefined(); }
  });
  it('mặt sau #F2B8A2 (sprite ~b); toBg khi hạt nền có red-paper', async () => {
    const { field, added, sprites } = fakeField(['petal-peach', 'red-paper']);
    (await load('red-paper')).play(field, { count: 10, kindCount: 2, origin: { x: 100, y: 100 } });
    expect([...sprites.keys()].filter((k) => k.endsWith('~b'))).toHaveLength(3);
    expect(added.every((p) => p.toBg === true && p.kindIdx === 1)).toBe(true);
  });
  it('màu tự nhiên theo mode', async () => {
    const a = fakeField();
    (await load('red-paper')).play(a.field, { count: 3, kindCount: 1, origin: { x: 1, y: 1 } });
    expect([...a.sprites.values()][0]!.c1).toBe('#C8231F');
    setTheme('dark');
    const b = fakeField();
    (await load('red-paper')).play(b.field, { count: 3, kindCount: 1, origin: { x: 1, y: 1 } });
    expect([...b.sprites.values()][0]!.c1).toBe('#D93A2E');
  });
});

describe('heart-burst (lời chúc - v3 móc nút)', () => {
  it.each([['medium', 8], ['high', 12]] as [FxState, number][])('%s: %i tim từ giữa mép trên nút, toả −150…−30°, phóng vào .4 -> 1 / 150ms, đời ≤ 1200', async (state, n) => {
    const { field, added } = fakeField();
    const from = { left: 40, top: 600, right: 320, bottom: 648 };
    expect((await load('heart-burst')).play(field, { count: burstCount('heart-burst', state), kindCount: 1, from })).toBe(n);
    for (const p of added) {
      expect(p.x).toBeGreaterThanOrEqual(from.left);
      expect(p.x).toBeLessThanOrEqual(from.right);
      expect(p.y).toBe(from.top);
      expect(p.vy).toBeLessThan(0);
      expect(p.scaleIn).toEqual([0.4, 150]);
      expect(p.life).toBeLessThanOrEqual(1200);
    }
  });
  it('màu: sáng [primary, accent, primary pha trắng .35]; tối có #F2E9E1', async () => {
    const m = await load('heart-burst');
    const a = fakeField();
    m.play(a.field, { count: 3, kindCount: 1 });
    expect([...new Set([...a.sprites.values()].map((s) => s.c1))].sort()).toEqual([LIGHT.primary, LIGHT.accent, mix(LIGHT.primary, '#ffffff', 0.35)].sort());
    setTheme('dark');
    const b = fakeField();
    m.play(b.field, { count: 3, kindCount: 1 });
    expect([...new Set([...b.sprites.values()].map((s) => s.c1))]).toContain('#F2E9E1');
  });
});

describe('cộng dồn ≤ 120', () => {
  it('confetti 120 + gold 100 cùng lúc: field giữ ≤ 120', async () => {
    vi.useFakeTimers();
    const { field, added } = fakeField();
    const mods: BurstModule[] = [await load('confetti'), await load('gold')];
    mods[0]!.play(field, { count: 120, kindCount: 1 });
    mods[1]!.play(field, { count: 100, kindCount: 1 });
    await vi.advanceTimersByTimeAsync(400);
    expect(added.length).toBeLessThanOrEqual(BURST_HARD_CAP);
    expect(await playBurst('gold', field, { count: 10, kindCount: 1 })).toBe(0);
  });
});

describe('field: vùng loại trừ cho burst từ nút (P07) + chuyển hạt nền không nháy (P08)', () => {
  const mover = (o: Partial<BurstMover> = {}): BurstMover => ({
    x: 180, y: 400, vx: 0, vy: 0, s: 10, rot: 0, vr: 0, ph: 0, phs: 1, sway: 0, a: 1, motion: 'burst', flip: false, am: 1, tw: 0, v: 0,
    age: 0, life: 1000, gravity: 0, drag: 0, toBg: false, clip: null, kindIdx: 0, twk: false, sc: 1, si: null, nz: false, keep: false, ...o,
  });
  const FORM = { left: 20, top: 200, right: 340, bottom: 640 };
  const kind = { id: 'red-paper', motion: 'fall', size: [8, 12], speed: [20, 40], density: 1 } as unknown as ParticleKind;

  it('mảnh thường trong form: a = 0; mảnh `zones: false` (nz) trong form vẫn hiện; vùng dịu vẫn áp', () => {
    const a = mover();
    const b = mover({ nz: true });
    moveBurst(a, 16, [FORM], []);
    moveBurst(b, 16, [FORM], []);
    expect(a.a).toBe(0);
    expect(b.a).toBe(1);
    const c = mover({ nz: true, softA: 0.3 });
    moveBurst(c, 16, [FORM], [FORM]);
    expect(c.a).toBeCloseTo(0.3);
  });
  it.each(['heart-burst', 'confetti'])('%s có `from` -> mọi mảnh zones:false; không from/origin (sau khi mở) -> giữ vùng loại trừ', async (id) => {
    vi.useFakeTimers();
    const m = await load(id);
    const a = fakeField();
    m.play(a.field, { count: 12, kindCount: 1, from: { left: 40, top: 600, right: 320, bottom: 648 } });
    expect(a.added.length).toBeGreaterThan(0);
    expect(a.added.every((p) => p.zones === false)).toBe(true);
    const b = fakeField();
    m.play(b.field, { count: 12, kindCount: 1 });
    await vi.advanceTimersByTimeAsync(200);
    expect(b.added.length).toBeGreaterThan(0);
    expect(b.added.every((p) => p.zones === undefined)).toBe(true);
  });
  it('gold / red-paper không bỏ vùng loại trừ', async () => {
    vi.useFakeTimers();
    for (const id of ['gold', 'red-paper']) {
      const a = fakeField(['red-paper']);
      (await load(id)).play(a.field, { count: 10, kindCount: 1, origin: { x: 100, y: 100 } });
      expect(a.added.every((p) => p.zones === undefined), id).toBe(true);
    }
  });
  it('heart-burst từ nút giữa form: chạy cả đời bằng stepBursts -> tim có a > .05 (trước P07: 0)', async () => {
    const { field, added } = fakeField();
    (await load('heart-burst')).play(field, { count: 12, kindCount: 1, from: { left: 60, top: 560, right: 300, bottom: 608 } });
    const list = added.map((b) => mover({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, life: b.life, gravity: b.gravity ?? 0, drag: b.drag ?? 0, nz: b.zones === false }));
    const ctrl = list.map((p) => ({ ...p, nz: false }));
    let seen = 0;
    let seenCtrl = 0;
    let cur = list;
    let cc = ctrl;
    for (let t = 0; t < 1300; t += 16) {
      cur = stepBursts(cur, [], [], 0, 16, [FORM], []);
      cc = stepBursts(cc, [], [], 0, 16, [FORM], []);
      seen += cur.filter((p) => p.a > 0.05).length;
      seenCtrl += cc.filter((p) => p.a > 0.05).length;
    }
    expect(seenCtrl).toBe(0);
    expect(seen).toBeGreaterThan(12 * 20);
  });
  it('toBg: giữ chỗ khi k ≥ 0.7 -> không mờ cuối đời, lúc chuyển giữ alpha (không nháy lên maxA); hết chỗ thì mờ như cũ', () => {
    const list = [mover({ toBg: true }), mover({ toBg: true }), mover({ toBg: true })];
    const bg: BurstMover[] = [];
    let cur = list;
    const trace: number[] = [];
    for (let t = 0; t < 1100; t += 16) {
      cur = stepBursts(cur, bg, [kind], 2, 16, [], []);
      trace.push(list[0]!.a);
    }
    expect(list.filter((p) => p.keep || bg.includes(p))).toHaveLength(2);
    expect(bg).toHaveLength(2);
    expect(cur).toHaveLength(0);
    // 2 mảnh chuyển: alpha luôn 1 (không mờ rồi nháy)
    expect(trace.every((a) => a === 1)).toBe(true);
    for (const p of bg) { expect(p.motion).toBe('fall'); expect(p.a).toBe(1); expect(p.keep).toBe(false); }
    // mảnh thứ 3 không giữ được chỗ: đã mờ về ~0 trước khi hết đời
    expect(list[2]!.a).toBeLessThan(0.1);
    expect(bg.includes(list[2]!)).toBe(false);
  });
});
