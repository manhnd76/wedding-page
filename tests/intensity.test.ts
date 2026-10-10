import { describe, expect, it } from 'vitest';
import {
  FX_STATES, MATRIX, burstCount, computeIntensity, downgrade, fireworksSpec, fx, isLowEnd, particleCap, targetParticleCount,
  type FxState, type IntensityInput,
} from '@guest/effects/intensity';
import { atomFor } from '@guest/effects/reveal';
import { REVEAL_PACKS } from '@shared/theme/resolve';
import { DEGRADE_ORDER } from '@guest/effects/perf-probe';

/**
 * Bảng kỳ vọng chép tay từ design 5.3 + 5.10 (mỗi dòng = 1 hiệu ứng; cột off/low/medium/high/reduced).
 * Mọi ô của MATRIX phải khớp - nếu ai sửa MATRIX lệch design thì test đỏ.
 */
const EXPECTED: Record<keyof typeof MATRIX, unknown[]> = {
  openStyle: ['fade200', 'light', 'full', 'full+', 'fade200'],
  burstOnOpen: [0, 0, 1, 2, 0],
  particles: [0, 8, 16, 28, 0],
  wind: [false, false, false, true, false],
  fireworks: [null, { bursts: 1, perBurst: 24 }, { bursts: 3, perBurst: 40 }, { bursts: 5, perBurst: 40 }, null],
  reveal: ['none', 'gentle', 'pack-', 'pack', 'fade200'],
  revealDistance: [0, 0, 24, 32, 0],
  split: [false, false, true, true, false],
  svgDraw: ['static', 'draw', 'draw', 'draw', 'static'],
  parallaxLayers: [false, false, false, true, false],
  parallax: [false, false, false, true, false],
  kenBurns: [false, false, true, true, false],
  photoTilt: [false, false, true, true, false],
  attention: [false, false, true, true, false],
  press: ['instant', 'anim', 'anim', 'anim', 'color'],
  wishFly: ['insert', 'heart4', 'variant', 'variant', 'insert-fade'],
  rsvpSuccess: ['static', 'draw', 'draw+confetti-small', 'draw+confetti', 'static'],
  countdown: ['instant', 'fade', 'full', 'full', 'instant'],
  // R2A-05: chỉ hiện khi admin bật, ở Vừa/Nhiều/reduced
  scrollProgress: [false, false, 'config', 'config', 'config'],
  signature: ['instant', 'anim', 'anim', 'anim', 'instant'],
  heartbeat: [false, false, true, true, false],
};

describe('MATRIX khớp design 5.3 + 5.10 (từng ô)', () => {
  it('đủ dòng', () => expect(Object.keys(MATRIX).sort()).toEqual(Object.keys(EXPECTED).sort()));
  for (const [effect, row] of Object.entries(EXPECTED)) {
    FX_STATES.forEach((s, i) => {
      it(`${effect} @ ${s}`, () => expect(fx(effect as keyof typeof MATRIX, s)).toEqual(row[i]));
    });
  }
});

const base: IntensityInput = { intensity: 'medium', respectReducedMotion: true, autoDowngrade: true, guestToggle: true, guestPref: null };
const strong = { hardwareConcurrency: 8, deviceMemory: 8, saveData: false, reducedMotion: false };

describe('computeIntensity (solution 8.4)', () => {
  it('mặc định Vừa trên máy mạnh', () => {
    expect(computeIntensity(base, strong)).toEqual({ level: 'medium', state: 'medium', reduced: false, lowEnd: false });
  });
  it('máy yếu (<=4 nhân | RAM <=2GB | saveData) -> hạ 1 bậc + cờ lowEnd', () => {
    for (const d of [{ ...strong, hardwareConcurrency: 4 }, { ...strong, deviceMemory: 2 }, { ...strong, saveData: true }]) {
      expect(isLowEnd(d)).toBe(true);
      expect(computeIntensity({ ...base, intensity: 'high' }, d)).toMatchObject({ level: 'medium', lowEnd: true });
      expect(computeIntensity(base, d)).toMatchObject({ level: 'low', lowEnd: true });
    }
  });
  it('autoDowngrade=false -> không hạ', () => {
    expect(computeIntensity({ ...base, autoDowngrade: false }, { ...strong, hardwareConcurrency: 2 })).toMatchObject({ level: 'medium', lowEnd: false });
  });
  it('prefers-reduced-motion -> cột reduced; respectReducedMotion=false thì bỏ qua', () => {
    expect(computeIntensity(base, { ...strong, reducedMotion: true })).toMatchObject({ state: 'reduced', reduced: true });
    expect(computeIntensity({ ...base, respectReducedMotion: false }, { ...strong, reducedMotion: true })).toMatchObject({ state: 'medium' });
  });
  it('nút khách: off -> Tắt; on -> bỏ qua reduced-motion', () => {
    expect(computeIntensity({ ...base, guestPref: 'off' }, strong).state).toBe('off');
    expect(computeIntensity({ ...base, guestPref: 'on' }, { ...strong, reducedMotion: true }).state).toBe('medium');
    expect(computeIntensity({ ...base, guestToggle: false, guestPref: 'off' }, strong).state).toBe('medium');
  });
  it('downgrade: high->medium->low, low giữ, off giữ', () => {
    expect(['high', 'medium', 'low', 'off'].map((x) => downgrade(x as never))).toEqual(['medium', 'low', 'low', 'off']);
  });
});

describe('số hạt + trần', () => {
  it('trần cứng 40, máy yếu 12', () => {
    expect(particleCap('high', false)).toBe(40);
    expect(particleCap('off', false)).toBe(0);
    expect(particleCap('high', true)).toBe(12);
    expect(targetParticleCount('high', false, 1.5, 1, 1)).toBe(40);
    expect(targetParticleCount('medium', false, 1, 1, 0.25)).toBe(4);
    expect(targetParticleCount('medium', false, 1.5, 0.5, 1)).toBe(12);
    expect(targetParticleCount('off', false, 1, 1, 1)).toBe(0);
    expect(targetParticleCount('high', true, 1, 1, 1)).toBe(12);
    expect(targetParticleCount('low', false, 1, 1, 1)).toBe(8);
    expect(targetParticleCount('reduced', false, 1, 1, 1)).toBe(0);
  });
  it('burst petals 0/30/50, confetti 0/80/120', () => {
    expect((['off', 'low', 'medium', 'high', 'reduced'] as FxState[]).map((s) => burstCount('petals', s))).toEqual([0, 0, 30, 50, 0]);
    expect(burstCount('confetti', 'high')).toBe(120);
  });
  it('pháo hoa: máy yếu luôn 1x24', () => {
    expect(fireworksSpec('high', true)).toEqual({ bursts: 1, perBurst: 24 });
    expect(fireworksSpec('high', false)).toEqual({ bursts: 5, perBurst: 40 });
    expect(fireworksSpec('reduced', false)).toBeNull();
  });
});

describe('reveal theo cấp (design 5.10)', () => {
  const soft = REVEAL_PACKS.soft;
  it('off -> hiện ngay; low -> gentle; reduced -> fade nhanh', () => {
    expect(atomFor('heading', soft, 'off')).toBe('none');
    expect(atomFor('heading', soft, 'low')).toBe('fade');
    expect(atomFor('ornament', soft, 'low')).toBe('none');
    expect(atomFor('image', soft, 'reduced')).toBe('fade-fast');
  });
  it('medium bỏ blur-in (-> mask-up, R2A-02) và parallax-layers; high đầy đủ', () => {
    const cine = REVEAL_PACKS.cinematic;
    expect(atomFor('heading', cine, 'medium')).toBe('mask-up');
    expect(atomFor('heading', cine, 'high')).toBe('blur-in');
    expect(atomFor('image', { ...cine, image: 'parallax-layers' }, 'medium')).toBe('photo-settle');
  });
  it('gói soft ở medium', () => {
    expect(['heading', 'block', 'image', 'ornament'].map((r) => atomFor(r as never, soft, 'medium'))).toEqual(['fade-up', 'fade-up', 'photo-settle', 'svg-draw']);
  });
});

describe('perf-probe (v4a-2a)', () => {
  it('DEGRADE_ORDER kết thúc bằng revealLite, sau photoTilt', () => {
    expect(DEGRADE_ORDER.at(-1)).toBe('revealLite');
    expect(DEGRADE_ORDER.at(-2)).toBe('photoTilt');
  });
});
