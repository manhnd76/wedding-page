import { describe, expect, it } from 'vitest';
import { OPEN_STYLES, type OpenStyle } from '@shared/config/enums';
import { OPEN_META, effectiveOpen, type OpenMode } from '@shared/open-styles';
import { FX_STATES, MATRIX } from '@guest/effects/intensity';
import { MAX_OPEN_MS } from '@guest/cover/anim';

/** Bảng 1.1 (solution-v4a-2bc.md): chi phí + có hạt của 13 kiểu v4a-2b; 4 kiểu cũ theo module hiện tại. */
const COST: Record<OpenStyle, 'low' | 'medium' | 'high'> = {
  envelope: 'medium', 'card-flip': 'medium', 'fade-zoom': 'low', none: 'low',
  curtain: 'low', 'wax-seal': 'medium', origami: 'medium', 'double-door': 'medium', 'flower-gate': 'medium',
  scroll: 'medium', 'card-3d': 'low', 'light-gather': 'high', 'gift-box': 'medium', 'moon-gate': 'medium',
  book: 'low', 'ink-spread': 'medium', polaroid: 'low',
};

describe('OPEN_META', () => {
  it('đủ 17 id của enum, không thừa', () => {
    expect(Object.keys(OPEN_META).sort()).toEqual([...OPEN_STYLES].sort());
  });

  it.each([...OPEN_STYLES])('%s: 0 < ms ≤ 2400, chi phí đúng bảng 1.1', (id) => {
    const m = OPEN_META[id];
    expect(m.ms).toBeGreaterThan(0);
    expect(m.ms).toBeLessThanOrEqual(MAX_OPEN_MS);
    expect(m.cost).toBe(COST[id]);
  });

  it('chỉ light-gather có chi phí Cao (khớp OPEN_COST cũ của admin)', () => {
    expect(OPEN_STYLES.filter((id) => OPEN_META[id].cost === 'high')).toEqual(['light-gather']);
  });

  it('kiểu có hạt theo bảng 1.1 + design-v4a-2bc §2 (origami/scroll có hạt ở mức Nhiều)', () => {
    expect(OPEN_STYLES.filter((id) => OPEN_META[id].usesParticles).sort()).toEqual(
      ['curtain', 'double-door', 'flower-gate', 'gift-box', 'light-gather', 'moon-gate', 'origami', 'scroll', 'wax-seal'],
    );
  });
});

describe('effectiveOpen (bảng 1.5)', () => {
  const modes = FX_STATES.map((s) => MATRIX.openStyle[s]);

  /** Kỳ vọng viết lại độc lập từ bảng 1.5. */
  function expected(id: OpenStyle, mode: OpenMode, lowEnd: boolean): { id: OpenStyle; mode: OpenMode } {
    if (mode === 'fade200') return { id, mode };
    if (!lowEnd) return { id, mode };
    if (COST[id] === 'high') return { id: 'fade-zoom', mode: 'light' };
    if (COST[id] === 'medium') return { id, mode: 'light' };
    return { id, mode };
  }

  for (const id of OPEN_STYLES) {
    for (const [i, mode] of modes.entries()) {
      for (const lowEnd of [false, true]) {
        it(`${id} · ${FX_STATES[i]} (${mode}) · lowEnd=${lowEnd}`, () => {
          expect(effectiveOpen(id, mode, lowEnd)).toEqual(expected(id, mode, lowEnd));
        });
      }
    }
  }

  it('Tắt / reduced: giữ id để prepare vẽ hình tĩnh, kể cả kiểu Cao trên máy yếu', () => {
    expect(effectiveOpen('light-gather', 'fade200', true)).toEqual({ id: 'light-gather', mode: 'fade200' });
  });

  it('máy yếu: Cao -> fade-zoom; Vừa ở Nhiều -> Nhẹ; Thấp giữ nguyên', () => {
    expect(effectiveOpen('light-gather', 'full', true).id).toBe('fade-zoom');
    expect(effectiveOpen('wax-seal', 'full+', true)).toEqual({ id: 'wax-seal', mode: 'light' });
    expect(effectiveOpen('curtain', 'full+', true)).toEqual({ id: 'curtain', mode: 'full+' });
  });
});

// ---------------------------------------------------------------- v4a-2b: timeline thuần của 13 module (solution 4.1)
import * as curtain from '@guest/cover/styles/curtain';
import * as waxSeal from '@guest/cover/styles/wax-seal';
import * as origami from '@guest/cover/styles/origami';
import * as doubleDoor from '@guest/cover/styles/double-door';
import * as flowerGate from '@guest/cover/styles/flower-gate';
import * as scroll from '@guest/cover/styles/scroll';
import * as card3d from '@guest/cover/styles/card-3d';
import * as lightGather from '@guest/cover/styles/light-gather';
import * as giftBox from '@guest/cover/styles/gift-box';
import * as moonGate from '@guest/cover/styles/moon-gate';
import * as book from '@guest/cover/styles/book';
import * as inkSpread from '@guest/cover/styles/ink-spread';
import * as polaroid from '@guest/cover/styles/polaroid';
import type { Timeline } from '@guest/cover/open-kit/layers';

type Level = 'light' | 'full' | 'full+';
const MODS: Record<string, { timeline: (l: Level) => Timeline }> = {
  curtain, 'wax-seal': waxSeal, origami, 'double-door': doubleDoor, 'flower-gate': flowerGate, scroll, 'card-3d': card3d,
  'light-gather': lightGather, 'gift-box': giftBox, 'moon-gate': moonGate, book, 'ink-spread': inkSpread, polaroid,
};
/** Thuộc tính được animate: transform/opacity (+ clip-path có biên, z-index rời rạc) và ngoại lệ ghi trong design-v4a-2bc:
 *  stroke-dashoffset (nơ gift-box, vệt nứt wax-seal - SVG nhỏ), mask-size/position (lỗ khoét ink-spread §2.12). */
const ALLOWED = new Set(['transform', 'opacity', 'clipPath', 'zIndex', 'translate', 'scale', 'rotate', 'offset', 'easing',
  'strokeDashoffset', 'maskSize', 'webkitMaskSize', 'maskPosition', 'webkitMaskPosition']);
/** Lớp chứa chữ có animate clip-path (design §1.1 ngoại lệ có chủ đích): giấy scroll, chú thích polaroid. */
const TEXT_CLIP = new Set(['sc-paper', 'pl-cap']);

describe('13 kiểu mở v4a-2b - timeline(level)', () => {
  it('đủ 13 module, đã bật trong capability', async () => {
    const { CAPABILITIES } = await import('@shared/capabilities');
    for (const id of Object.keys(MODS)) expect(CAPABILITIES.openStyle.supported).toContain(id);
    expect(Object.keys(MODS)).toHaveLength(13);
  });

  for (const [id, m] of Object.entries(MODS)) {
    describe(id, () => {
      const t = { light: m.timeline('light'), full: m.timeline('full'), 'full+': m.timeline('full+') };

      it('tổng ≤ 2400ms ở mọi cấp; Nhẹ ngắn hơn Vừa; Nhiều không kéo dài quá 50ms', () => {
        for (const l of ['light', 'full', 'full+'] as const) expect(t[l].totalMs).toBeLessThanOrEqual(MAX_OPEN_MS);
        expect(t.light.totalMs).toBeLessThan(t.full.totalMs);
        expect(t['full+'].totalMs - t.full.totalMs).toBeLessThanOrEqual(50);
      });

      it('OPEN_META.ms = tổng mức Vừa của module', () => {
        expect(OPEN_META[id as OpenStyle].ms).toBe(t.full.totalMs);
      });

      it('chỉ animate thuộc tính cho phép; clip-path quanh chữ có biên ≥ 0.3em', () => {
        for (const tlx of Object.values(t)) {
          for (const s of tlx.steps) {
            for (const f of s.f) for (const k of Object.keys(f)) expect(ALLOWED, `${id}.${s.k}.${k}`).toContain(k);
            if (TEXT_CLIP.has(s.k)) {
              const last = String(s.f[s.f.length - 1]!.clipPath);
              expect(last).toMatch(/^inset\(-\.3em\)$/);
            }
          }
        }
      });
    });
  }
});
