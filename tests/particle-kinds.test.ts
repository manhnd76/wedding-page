/**
 * v4a-2c (solution-v4a-2bc.md 4.1, 5 #1–#4, #6; design-v4a-2bc §4): 21 loại hạt nền + engine mở rộng.
 * - tham số mỗi loại khớp design (motion, hệ số mật độ, cỡ), vẽ được bằng context giả (stub Path2D)
 * - 5 loại v1 giữ nguyên tham số + hành vi: `spawnBg`/`moveBg` so với công thức v1 (chép nguyên văn) cùng chuỗi Math.random
 * - tuỳ chọn mới: biến thể theo trọng số, `sway`/`vx`/`alpha`/`depth`/`twinkle`, mặt sau, màu theme/tự nhiên/tối/token
 */
import { readdirSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PARTICLE_TYPES } from '@shared/config/enums';
import { CAPABILITIES } from '@shared/capabilities';
import { PARTICLE_LOADERS, loadKinds } from '@guest/effects/particles/types';
import type { ParticleKind } from '@guest/effects/particles/kind';
import { drawLayers, hasBack, kindPalette, mix, paintKind, pickVariant, tone } from '@guest/effects/particles/sprite-kit';
import { moveBg, scaleInAt, spawnBg, type Mover } from '@guest/effects/particles/field';
import { alphaTarget, approach, type Rect } from '@guest/effects/particles/geometry';
import { targetParticleCount, type FxState } from '@guest/effects/intensity';
import { chipOrder, FIRST_CHIPS, nextTypes } from '@admin/editor/fx/particles-block';

/** Hệ số mật độ (design 5.7, nhắc lại ở design-v4a-2bc §4.2 / particles.json). */
const DENSITY: Record<string, number> = {
  'petal-rose': 1, heart: 1, 'petal-peach': 1, 'gold-dust': 1.5, firefly: 1.5,
  'petal-sakura': 1, 'petal-lotus': 0.5, 'petal-dried': 0.8, 'petal-watercolor': 0.8, plumeria: 0.6, 'paper-heart': 0.8,
  'leaf-green': 0.8, 'leaf-eucalyptus': 0.8, 'leaf-maple': 0.7, pampas: 0.6, snow: 1.5, bubble: 0.7, sparkle: 1.2,
  'ink-dot': 0.6, 'dust-mote': 1, 'red-paper': 1,
};
/** Chuyển động + cỡ design-v4a-2bc §4.2 (16 loại mới). */
const SPEC: Record<string, [ParticleKind['motion'], [number, number]]> = {
  'petal-sakura': ['fall', [12, 20]], 'petal-lotus': ['fall', [24, 36]], 'petal-dried': ['fall', [12, 20]], 'petal-watercolor': ['fall', [14, 24]],
  plumeria: ['fall', [16, 24]], 'paper-heart': ['fall', [12, 20]], 'leaf-green': ['drift', [14, 22]], 'leaf-eucalyptus': ['fall', [12, 20]],
  'leaf-maple': ['drift', [18, 28]], pampas: ['drift', [26, 40]], snow: ['fall', [2, 6]], bubble: ['float-up', [10, 22]],
  sparkle: ['twinkle', [8, 14]], 'ink-dot': ['fall', [6, 14]], 'dust-mote': ['drift', [5, 12]], 'red-paper': ['fall', [8, 14]],
};
/** Tham số 5 loại v1 (không được đổi). */
const V1: Record<string, Partial<ParticleKind>> = {
  'petal-rose': { motion: 'fall', density: 1, size: [12, 22], speed: [28, 60], flip: true, spin: 1.2, natural: null },
  heart: { motion: 'float-up', density: 1, size: [10, 18], speed: [20, 42], spin: 0.4, natural: null },
  'petal-peach': { motion: 'fall', density: 1, size: [14, 22], speed: [26, 52], flip: true, spin: 1, natural: ['#E8798F', '#F4A7B5'] },
  'gold-dust': { motion: 'twinkle', density: 1.5, size: [2, 4], speed: [6, 14], natural: ['#F3D48C', '#FFF4D6'] },
  firefly: { motion: 'twinkle', density: 1.5, size: [10, 16], speed: [5, 12], natural: ['#FFE7A8', '#FFF8E6'] },
};

/** Context canvas giả: ghi lệnh, đủ API mà drawLayers / draw() của 5 loại v1 dùng. */
function fakeCtx() {
  const calls: string[] = [];
  const alphas: number[] = [];
  const g = new Proxy({ globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: '', lineJoin: '' } as Record<string, unknown>, {
    get(t, k: string) {
      if (k in t) return t[k];
      return (...args: unknown[]) => {
        calls.push(k);
        if (k === 'fill' || k === 'stroke' || k === 'fillRect') alphas.push(t.globalAlpha as number);
        if (k === 'createRadialGradient') return { addColorStop: () => calls.push('stop') };
        void args;
        return undefined;
      };
    },
    set(t, k: string, v) { t[k] = v; return true; },
  });
  return { g: g as unknown as CanvasRenderingContext2D, calls, alphas };
}

const kinds: Record<string, ParticleKind> = {};
beforeAll(async () => {
  (globalThis as unknown as { Path2D: unknown }).Path2D ??= class { arc() { /* stub */ } };
  for (const id of PARTICLE_TYPES) kinds[id] = (await PARTICLE_LOADERS[id]!()).kind;
});

/** Math.random tất định (LCG). */
function seedRandom(seed = 12345) {
  let s = seed >>> 0;
  return vi.spyOn(Math, 'random').mockImplementation(() => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296));
}
afterEach(() => { vi.restoreAllMocks(); });

describe('21 loại hạt: module + tham số', () => {
  it('đủ 21 loader, mỗi id có file types/<id>.ts, id khớp tên file; cả 21 đã bật capability', () => {
    const files = readdirSync('src/guest/effects/particles/types').map((f) => f.replace(/\.ts$/, '')).sort();
    expect(files).toEqual([...PARTICLE_TYPES].sort());
    expect(Object.keys(PARTICLE_LOADERS).sort()).toEqual([...PARTICLE_TYPES].sort());
    for (const id of PARTICLE_TYPES) expect(kinds[id]!.id).toBe(id);
    expect([...CAPABILITIES.particle.supported].sort()).toEqual([...PARTICLE_TYPES].sort());
  });

  it.each([...PARTICLE_TYPES])('%s: motion hợp lệ, hệ số mật độ đúng design, cỡ/tốc độ hợp lệ', (id) => {
    const k = kinds[id]!;
    expect(['fall', 'float-up', 'drift', 'twinkle']).toContain(k.motion);
    expect(k.density).toBe(DENSITY[id]);
    expect(k.size[0]).toBeGreaterThan(0);
    expect(k.size[1]).toBeGreaterThanOrEqual(k.size[0]);
    expect(k.speed[1]).toBeGreaterThanOrEqual(k.speed[0]);
    if (SPEC[id]) {
      expect(k.motion).toBe(SPEC[id]![0]);
      expect(k.size).toEqual(SPEC[id]![1]);
      expect(k.draw, 'loại v4a-2c chỉ có dữ liệu').toBeUndefined();
      expect(k.variants!.length).toBeGreaterThan(0);
      expect(k.variants!.reduce((s, v) => s + v.w, 0)).toBeCloseTo(1, 5);
    } else {
      expect(k).toMatchObject(V1[id]!);
      expect(typeof k.draw).toBe('function');
      expect(k.variants).toBeUndefined();
    }
  });

  it('cỡ đặc biệt: gold-dust ≤ 4px, tuyết 2–6, cánh sen 24–36', () => {
    expect(kinds['gold-dust']!.size[1]).toBeLessThanOrEqual(4);
    expect(kinds.snow!.size).toEqual([2, 6]);
    expect(kinds['petal-lotus']!.size).toEqual([24, 36]);
  });

  it.each([...PARTICLE_TYPES])('%s: vẽ mọi biến thể (+ mặt sau) không lỗi, có lệnh tô', (id) => {
    const k = kinds[id]!;
    const n = k.variants?.length || 1;
    for (let v = 0; v < n; v++) {
      for (const back of [false, true]) {
        if (back && !hasBack(k, v)) continue;
        const { g, calls } = fakeCtx();
        expect(() => paintKind(g, 20, k, '#C9A86A', '#8A6A3B', v, back)).not.toThrow();
        expect(calls.some((c) => c === 'fill' || c === 'stroke' || c === 'fillRect'), `${id}#${v}${back ? 'b' : ''}`).toBe(true);
      }
    }
  });

  it('mặt sau khi lật: giấy đỏ (3 biến thể) và tim giấy; loại không lật thì không có', () => {
    expect([0, 1, 2].every((v) => hasBack(kinds['red-paper']!, v))).toBe(true);
    expect(hasBack(kinds['paper-heart']!, 0)).toBe(true);
    expect(hasBack(kinds.snow!, 0)).toBe(false);
    expect(hasBack(kinds['petal-rose']!, 0)).toBe(false);
  });

  it.each(['low', 'medium', 'high'] as FxState[])('số hạt mục tiêu mỗi loại ở cấp %s ≤ 40 (máy yếu ≤ 12)', (state) => {
    for (const id of PARTICLE_TYPES) {
      const d = kinds[id]!.density;
      for (const theme of [0.8, 1, 1.2]) {
        expect(targetParticleCount(state, false, d, theme, 1)).toBeLessThanOrEqual(40);
        expect(targetParticleCount(state, true, d, theme, 1)).toBeLessThanOrEqual(12);
      }
    }
    expect(targetParticleCount('high', false, kinds.snow!.density, 1, 1)).toBe(40); // 28 × 1.5 = 42 -> trần
  });

  it('loadKinds: id lạ -> petal-rose (giữ hành vi v1)', async () => {
    const ks = await loadKinds(['snow', 'khong-co']);
    expect(ks.map((k) => k.id)).toEqual(['snow', 'petal-rose']);
  });
});

describe('drawLayers (design §4.1)', () => {
  it('alpha lớp NHÂN với alpha hạt (không ghi đè): chấm mực .2 × lớp 1 = .2', () => {
    const { g, alphas } = fakeCtx();
    (g as unknown as { globalAlpha: number }).globalAlpha = 0.2;
    drawLayers(g, 12, [{ d: 'M0 0', fill: 'c1' }, { d: 'M0 0', fill: 'c1', a: 0.5 }], '#000000', '#000000');
    expect(alphas).toEqual([0.2, 0.1]);
  });
  it('tone: c1 / c2 / light = pha trắng .4 / dark = pha đen .28 / mã màu', () => {
    expect(tone('c1', '#102030', '#FFFFFF')).toBe('#102030');
    expect(tone('c2', '#102030', '#FFFFFF')).toBe('#FFFFFF');
    expect(tone('light', '#000000', '')).toBe(mix('#000000', '#ffffff', 0.4));
    expect(tone('light', '#000000', '')).toBe('#666666');
    expect(tone('dark', '#ffffff', '')).toBe('#b8b8b8');
    expect(tone('#E8B04A', '#000000', '')).toBe('#E8B04A');
  });
});

describe('5 loại v1: hành vi KHÔNG đổi (so với công thức v1 chép nguyên văn)', () => {
  const W = 360;
  const H = 740;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  /** `spawnBg()` của field.ts v2.3/v4a-2b (trước v4a-2c), bỏ phần sprite. */
  function spawnV1(k: ParticleKind, seed: boolean) {
    const s = rand(k.size[0], k.size[1]);
    const sp = rand(k.speed[0], k.speed[1]);
    const p = {
      x: rand(0, W), y: 0, vx: 0, vy: 0, s, rot: rand(0, Math.PI * 2), vr: rand(-1, 1) * (k.spin ?? 0),
      ph: rand(0, Math.PI * 2), phs: rand(0.8, 1.8), sway: rand(10, 28), a: 0, motion: k.motion, flip: !!k.flip,
    };
    switch (k.motion) {
      case 'fall': p.vy = sp; p.y = seed ? rand(0, H) : -s; break;
      case 'float-up': p.vy = -sp; p.y = seed ? rand(0, H) : H + s; break;
      case 'drift': p.vx = sp; p.vy = sp * 0.25; p.x = seed ? rand(0, W) : -s; p.y = rand(0, H * 0.8); break;
      case 'twinkle': p.vy = sp; p.vx = rand(-6, 6); p.y = rand(0, H); break;
    }
    return p;
  }
  /** Vòng lặp hạt nền trong `step()` v1. */
  function moveV1(p: ReturnType<typeof spawnV1>, dtMs: number, wind: number, maxA: number, zones: Rect[], soft: Rect[]) {
    const dt = dtMs / 1000;
    p.ph += p.phs * dt;
    p.rot += p.vr * dt;
    p.x += (p.vx + Math.sin(p.ph) * p.sway + wind) * dt;
    p.y += p.vy * dt;
    let tA = alphaTarget(p.x, p.y, maxA, zones, soft);
    if (p.motion === 'twinkle') tA *= 0.55 + 0.45 * Math.sin(p.ph * 2.2);
    p.a = approach(p.a, tA, dtMs, 200);
    return p.y > H + p.s * 2 || p.y < -p.s * 3 || p.x > W + p.s * 3 || p.x < -p.s * 3;
  }
  const zones = [{ left: 40, top: 300, right: 320, bottom: 420 }];
  const soft = [{ left: 30, top: 100, right: 330, bottom: 180 }];

  it.each(Object.keys(V1))('%s: sinh + 300 frame di chuyển trùng khớp từng số', (id) => {
    const k = kinds[id]!;
    for (const seed of [true, false]) {
      seedRandom(7 + id.length);
      const a = Array.from({ length: 30 }, () => spawnV1(k, seed));
      vi.restoreAllMocks();
      seedRandom(7 + id.length);
      const b = Array.from({ length: 30 }, () => spawnBg(k, W, H, seed));
      vi.restoreAllMocks();
      b.forEach((m, i) => {
        expect(m).toMatchObject(a[i]!);
        expect(m.am).toBe(1);
        expect(m.tw).toBe(0);
        expect(m.v).toBe(0);
      });
      for (let f = 0; f < 300; f++) {
        const wind = f % 50 < 10 ? 30 : 0;
        a.forEach((p, i) => {
          const offA = moveV1(p, 16.7, wind, 0.8, zones, soft);
          const offB = moveBg(b[i]!, 16.7, wind, 0.8, zones, soft, W, H);
          expect(offB).toBe(offA);
        });
      }
      b.forEach((m, i) => expect(m).toMatchObject(a[i]!));
    }
  });
});

describe('tuỳ chọn mới của ParticleKind (design §4.1)', () => {
  const W = 360;
  const H = 740;
  const many = (id: string, n = 400) => { seedRandom(99); const out = Array.from({ length: n }, () => spawnBg(kinds[id]!, W, H, true)); vi.restoreAllMocks(); return out; };

  it('biến thể theo trọng số (anh đào .55/.30/.15)', () => {
    const ps = many('petal-sakura', 3000);
    const share = [0, 1, 2].map((v) => ps.filter((p) => p.v === v).length / ps.length);
    expect(share[0]).toBeCloseTo(0.55, 1);
    expect(share[1]).toBeCloseTo(0.3, 1);
    expect(share[2]).toBeCloseTo(0.15, 1);
    expect(pickVariant(kinds['petal-sakura']!.variants, 0.999)).toBe(2);
    expect(pickVariant(undefined, 0.7)).toBe(0);
  });

  it('sway riêng: anh đào 22–40, cỏ lau 4–10 (v1 cố định 10–28)', () => {
    for (const p of many('petal-sakura')) { expect(p.sway).toBeGreaterThanOrEqual(22); expect(p.sway).toBeLessThanOrEqual(40); }
    for (const p of many('pampas')) { expect(p.sway).toBeGreaterThanOrEqual(4); expect(p.sway).toBeLessThanOrEqual(10); }
  });

  it('hoa khô: fall + trôi ngang vx 6–18', () => {
    for (const p of many('petal-dried')) { expect(p.vx).toBeGreaterThanOrEqual(6); expect(p.vx).toBeLessThanOrEqual(18); expect(p.vy).toBeGreaterThan(0); }
  });

  it('alpha riêng: chấm mực .12–.22, bụi nắng .45–.8 (P01); alpha đích nhân hệ số', () => {
    for (const p of many('ink-dot')) { expect(p.am).toBeGreaterThanOrEqual(0.12); expect(p.am).toBeLessThanOrEqual(0.22); }
    for (const p of many('dust-mote')) { expect(p.am).toBeGreaterThanOrEqual(0.45); expect(p.am).toBeLessThanOrEqual(0.8); }
    const p: Mover = { ...many('ink-dot', 1)[0]!, a: 0, x: 100, y: 100, vx: 0, vy: 0, sway: 0 };
    for (let i = 0; i < 40; i++) moveBg(p, 16, 0, 1, [], [], W, H);
    expect(p.a).toBeCloseTo(p.am, 5);
    expect(p.a).toBeLessThanOrEqual(0.22);
  });

  it('tuyết depth: cỡ lớn rơi nhanh + rõ hơn cỡ nhỏ', () => {
    const ps = many('snow', 600);
    const small = ps.filter((p) => p.s < 3);
    const big = ps.filter((p) => p.s > 5);
    const avg = (xs: Mover[], f: (p: Mover) => number) => xs.reduce((s, p) => s + f(p), 0) / xs.length;
    expect(avg(big, (p) => p.vy)).toBeGreaterThan(avg(small, (p) => p.vy) * 1.6);
    expect(avg(big, (p) => p.am)).toBeGreaterThan(0.85);
    expect(avg(small, (p) => p.am)).toBeLessThan(0.65);
    for (const p of ps) { expect(p.am).toBeGreaterThanOrEqual(0.45); expect(p.am).toBeLessThanOrEqual(1); }
  });

  it('bong bóng float-up (vy < 0, sinh dưới đáy khi không seed); lá xanh drift + rơi', () => {
    seedRandom(3);
    const b = spawnBg(kinds.bubble!, W, H, false);
    const l = spawnBg(kinds['leaf-green']!, W, H, false);
    expect(b.vy).toBeLessThan(0);
    expect(b.y).toBeGreaterThan(H);
    expect(l.vx).toBeGreaterThan(0);
    expect(l.vy).toBeGreaterThan(0);
  });

  it('bụi nắng nhấp nháy 25%: alpha dao động trong [.75, 1] × alpha', () => {
    const p: Mover = { ...many('dust-mote', 1)[0]!, am: 1, a: 1, x: 100, y: 100, vx: 0, vy: 0, sway: 0 };
    let lo = 1;
    let hi = 0;
    for (let i = 0; i < 400; i++) { moveBg(p, 16, 0, 1, [], [], W, H); if (i > 30) { lo = Math.min(lo, p.a); hi = Math.max(hi, p.a); } }
    expect(lo).toBeGreaterThanOrEqual(0.74);
    expect(hi).toBeGreaterThan(0.95);
  });

  it('vùng loại trừ form vẫn thắng mọi loại mới: alpha về 0 trong vùng', () => {
    for (const id of Object.keys(SPEC)) {
      const p: Mover = { ...many(id, 1)[0]!, a: 1, x: 100, y: 100, vx: 0, vy: 0, sway: 0, am: 1 };
      for (let i = 0; i < 20; i++) moveBg(p, 16, 0, 1, [{ left: 0, top: 0, right: 300, bottom: 300 }], [], W, H);
      expect(p.a, id).toBe(0);
    }
  });

  it('scaleIn: bắt đầu ở cỡ × from, về 1 sau `ms`', () => {
    expect(scaleInAt(0, 0.4, 150)).toBeCloseTo(0.4, 5);
    expect(scaleInAt(150, 0.4, 150)).toBe(1);
    expect(scaleInAt(400, 0.4, 150)).toBe(1);
    expect(scaleInAt(75, 0.4, 150)).toBeGreaterThan(0.4);
  });
});

describe('màu theme / multi / hex (solution 2.4, design §4.2)', () => {
  const tokens = { accent: '#A9C3A0', accent2: '#E9C2B8', primary: '#4E6B4A', primaryDecor: '#4E6B4A' };
  const theme = { colors: [tokens.accent, tokens.primaryDecor], themeColors: true, dark: false, tokens };
  const darkTk = { accent: '#9C7A45', accent2: '#9C7A45', primary: '#D9B77E', primaryDecor: '#D9B77E' };

  it('theme: loại có màu tự nhiên dùng màu riêng (5 loại v1 giữ quy tắc cũ)', () => {
    expect(kindPalette(kinds['petal-sakura']!, theme)).toEqual(['#F4B6C2', '#FBE3E8']);
    expect(kindPalette(kinds['petal-peach']!, theme)).toEqual(['#E8798F', '#F4A7B5']);
    expect(kindPalette(kinds['petal-rose']!, theme)).toEqual([tokens.accent, tokens.primaryDecor]);
    expect(kindPalette(kinds['paper-heart']!, theme)).toEqual([tokens.accent, tokens.primaryDecor]);
  });
  it('theme tối: naturalDark (chấm mực sáng, tuyết bỏ vành)', () => {
    expect(kindPalette(kinds['ink-dot']!, { ...theme, dark: true, tokens: darkTk })).toEqual(['#F2E9E1', '#CFC4BA']);
    expect(kindPalette(kinds['ink-dot']!, theme)).toEqual(['#1C1C1A', '#3A3A36']);
    expect(kindPalette(kinds.snow!, { ...theme, dark: true })[1]).toBe('rgba(255,255,255,0)');
    // loại v1 không có naturalDark: giữ natural ở theme tối
    expect(kindPalette(kinds['gold-dust']!, { ...theme, dark: true })).toEqual(['#F3D48C', '#FFF4D6']);
  });
  it('theme: loại theo token - màu nước accent/accent-2, bong bóng accent-2/accent, lấp lánh accent (tối: primary)', () => {
    expect(kindPalette(kinds['petal-watercolor']!, theme)).toEqual([tokens.accent, tokens.accent2]);
    expect(kindPalette(kinds.bubble!, theme)).toEqual([tokens.accent2, tokens.accent]);
    expect(kindPalette(kinds.sparkle!, theme)[0]).toBe(tokens.accent);
    expect(kindPalette(kinds.sparkle!, { ...theme, dark: true, tokens: darkTk })[0]).toBe('#D9B77E');
  });
  it('multi / hex: theo cấu hình cho MỌI loại (kể cả loại có màu tự nhiên)', () => {
    const multi = { colors: [tokens.accent, tokens.accent2], themeColors: false, tokens };
    const hex = { colors: ['#112233', '#112233'], themeColors: false };
    for (const id of PARTICLE_TYPES) {
      expect(kindPalette(kinds[id]!, multi)).toEqual([tokens.accent, tokens.accent2]);
      expect(kindPalette(kinds[id]!, hex)).toEqual(['#112233', '#112233']);
    }
  });
});

describe('admin: thứ tự chip loại hạt (solution 2.5)', () => {
  const all = CAPABILITIES.particle.supported as readonly (typeof PARTICLE_TYPES)[number][];
  it('8 chip đầu: gợi ý theme đứng đầu, rồi loại phổ biến; đủ 21, không trùng', () => {
    const o = chipOrder(['petal-sakura', 'bubble'], all);
    expect(o).toHaveLength(21);
    expect(new Set(o).size).toBe(21);
    expect(o.slice(0, 2)).toEqual(['petal-sakura', 'bubble']);
    // gợi ý (bong bóng trùng loại phổ biến -> không lặp) + 5 loại phổ biến còn lại + loại đầu tiên theo capability
    expect(o.slice(0, FIRST_CHIPS)).toEqual(['petal-sakura', 'bubble', 'petal-rose', 'heart', 'snow', 'firefly', 'leaf-green', 'petal-peach']);
    expect(o.slice(FIRST_CHIPS)).toHaveLength(13);
  });
  it('chỉ hiện loại đã có module', () => {
    expect(chipOrder(['ink-dot'], ['petal-rose', 'heart'])).toEqual(['petal-rose', 'heart']);
  });
});

describe('admin: bấm chip loại hạt (P10 báo loại bị bỏ, P11 theo theme)', () => {
  it('tối đa 2: thêm loại thứ 3 -> bỏ loại cũ nhất và báo loại đó', () => {
    expect(nextTypes(['petal-sakura', 'heart'], ['petal-rose'], 'snow')).toEqual({ types: ['heart', 'snow'], dropped: 'petal-sakura' });
    expect(nextTypes(['heart'], ['petal-rose'], 'snow')).toEqual({ types: ['heart', 'snow'], dropped: null });
  });
  it('bỏ chọn: không báo; bỏ hết -> về theo theme', () => {
    expect(nextTypes(['heart', 'snow'], [], 'heart')).toEqual({ types: ['snow'], dropped: null });
    expect(nextTypes(['heart'], [], 'heart')).toEqual({ types: 'theme', dropped: null });
  });
  it('đang theo theme: bấm loại gợi ý = giữ gợi ý thành lựa chọn riêng (không còn no-op); loại khác = gợi ý + loại đó; không báo bỏ', () => {
    expect(nextTypes('theme', ['petal-rose'], 'petal-rose')).toEqual({ types: ['petal-rose'], dropped: null });
    expect(nextTypes('theme', ['petal-rose'], 'snow')).toEqual({ types: ['petal-rose', 'snow'], dropped: null });
    expect(nextTypes('theme', ['petal-sakura', 'bubble'], 'snow')).toEqual({ types: ['bubble', 'snow'], dropped: null });
  });
});
