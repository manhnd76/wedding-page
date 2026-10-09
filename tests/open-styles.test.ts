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

  it('kiểu có hạt theo bảng 1.1', () => {
    expect(OPEN_STYLES.filter((id) => OPEN_META[id].usesParticles).sort()).toEqual(
      ['curtain', 'double-door', 'flower-gate', 'gift-box', 'light-gather', 'moon-gate', 'wax-seal'],
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
