/**
 * Tự động cuộn (design-review-v1 mục 5; decisions 2026-10-08): mặc định + migration kẹp 1500 + logic dừng/tiếp tục.
 * Bộ điều khiển thuần (`src/guest/autoscroll/core.ts`) chạy với môi trường cuộn giả + đồng hồ giả.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '@shared/config/defaults';
import { mergeWithDefaults } from '@shared/config/merge';
import { migrate } from '@shared/config/migrations';
import {
  AutoScroller, COUNTDOWN_DWELL_MS, RAMP_MS, RESUME_HIDDEN_MS, RESUME_RESIZE_MS, autoStartBlocker, isModifierOnly, screenFactor,
  type AutoScrollOpts, type SectionMark,
} from '@guest/autoscroll/core';

describe('effects.autoScroll - mặc định + migration', () => {
  it('mặc định v2.1: bật, 45px/s, sau 2.5s, flow, dừng 1.2s', () => {
    expect(DEFAULT_CONFIG.effects.autoScroll).toEqual({ enabled: true, speed: 45, startDelayMs: 2500, mode: 'flow', dwellMs: 1200 });
  });

  it('import config.js cũ (wedding-site: enabled true, 55px/s, 650ms): giữ enabled + speed, kẹp startDelayMs lên 1500', () => {
    const { config } = mergeWithDefaults(migrate({ effects: { autoScroll: { enabled: true, speed: 55, startDelayMs: 650 } } }).config);
    expect(config.effects.autoScroll).toEqual({ enabled: true, speed: 55, startDelayMs: 1500, mode: 'flow', dwellMs: 1200 });
  });

  it('import config v0 có enabled:false -> vẫn BẬT (decisions 2026-10-08); speed cũ giữ, startDelayMs kẹp ≥ 1500', () => {
    const { config } = mergeWithDefaults(migrate({ effects: { autoScroll: { enabled: false, speed: 30, startDelayMs: 200 } } }).config);
    expect(config.effects.autoScroll).toEqual({ enabled: true, speed: 30, startDelayMs: 1500, mode: 'flow', dwellMs: 1200 });
    // v0 không có speed/startDelayMs -> mặc định 45px/s, 2.5s
    const d = mergeWithDefaults(migrate({ effects: { autoScroll: { enabled: false } } }).config).config.effects.autoScroll;
    expect(d).toEqual({ enabled: true, speed: 45, startDelayMs: 2500, mode: 'flow', dwellMs: 1200 });
  });

  it('config mẫu public/content/config.json: tự cuộn bật 45px/s, 2.5s', () => {
    const raw = JSON.parse(readFileSync(resolve(__dirname, '../public/content/config.json'), 'utf8')) as unknown;
    const { config } = mergeWithDefaults(migrate(raw).config);
    expect(config.effects.autoScroll).toEqual({ enabled: true, speed: 45, startDelayMs: 2500, mode: 'flow', dwellMs: 1200 });
  });

  it('config v1 KHÔNG bị migration đổi enabled (chỉ v0 mới ép bật)', () => {
    const { config } = mergeWithDefaults(migrate({ schemaVersion: 1, effects: { autoScroll: { enabled: false } } }).config);
    expect(config.effects.autoScroll.enabled).toBe(false);
  });

  it('config.js cũ không có autoScroll -> mặc định mới (bật)', () => {
    const { config } = mergeWithDefaults(migrate({ site: { title: 'x' } }).config);
    expect(config.effects.autoScroll.enabled).toBe(true);
    expect(config.effects.autoScroll.speed).toBe(45);
  });

  it('config v1 thiếu mode/dwellMs -> mặc định; kẹp giới hạn; mode lạ -> flow + cảnh báo', () => {
    const r = mergeWithDefaults({ schemaVersion: 1, effects: { autoScroll: { enabled: false, speed: 500, startDelayMs: 99_999, dwellMs: -5, mode: 'zigzag' } } });
    expect(r.config.effects.autoScroll).toEqual({ enabled: false, speed: 120, startDelayMs: 8000, mode: 'flow', dwellMs: 0 });
    expect(r.warnings.some((w) => w.includes('effects.autoScroll.mode'))).toBe(true);
    const v1 = mergeWithDefaults({ schemaVersion: 1, effects: { autoScroll: { enabled: true, speed: 30, startDelayMs: 650 } } }).config.effects.autoScroll;
    expect(v1).toEqual({ enabled: true, speed: 30, startDelayMs: 1500, mode: 'flow', dwellMs: 1200 });
  });
});

/** Môi trường cuộn giả: trang cao `pageH`, viewport `vh`. scrollY làm tròn như trình duyệt. */
function setup(o: Partial<AutoScrollOpts> = {}, pageH = 6000, vh = 800) {
  let y = 0;
  const env = { getY: () => Math.round(y), setY: (v: number) => { y = v; }, maxY: () => pageH - vh, vh: () => vh, dpr: () => 2 };
  const sc = new AutoScroller(env, { speed: 45, mode: 'steady', dwellMs: 1200, ...o });
  let now = 0;
  const run = (ms: number) => { const end = now + ms; while (now < end) { now += 16; sc.tick(now); } };
  return { sc, run, y: () => env.getY(), scrollTo: (v: number) => { y = v; }, now: () => now };
}

describe('AutoScroller: chạy', () => {
  it('chờ startDelayMs rồi mới chạy; tăng tốc 800ms; tốc độ = speed × hệ số màn hình', () => {
    const t = setup();
    t.sc.schedule(0, 2500);
    t.run(2400);
    expect(t.y()).toBe(0);
    expect(t.sc.state).toBe('waiting');
    t.run(200 + RAMP_MS);
    expect(t.sc.state).toBe('running');
    const y0 = t.y();
    t.run(1000);
    expect(t.y() - y0).toBeGreaterThan(45 * screenFactor(800) - 3);
    expect(t.y() - y0).toBeLessThan(45 * screenFactor(800) + 3);
  });

  it('hệ số màn hình kẹp 0.8–1.2 (740px ≈ 42px/s)', () => {
    expect(screenFactor(740) * 45).toBeCloseTo(41.6, 1);
    expect(screenFactor(300)).toBe(0.8);
    expect(screenFactor(2000)).toBe(1.2);
  });

  it('flow: dừng dwellMs khi đầu section chạm 18% viewport; countdown dừng ≥ 2s; hero/footer không dừng', () => {
    const sections: SectionMark[] = [{ top: 0, type: 'hero' }, { top: 400, type: 'couple' }, { top: 700, type: 'countdown' }, { top: 5000, type: 'footer' }];
    const t = setup({ mode: 'flow', sections });
    t.sc.resume(0);
    const seen: { s: string; at: number }[] = [];
    t.sc.onChange = (s) => seen.push({ s, at: t.now() });
    t.run(30_000);
    const dwells = seen.filter((x) => x.s === 'dwell');
    expect(dwells).toHaveLength(2); // couple + countdown (hero/footer không)
    const back = seen.filter((x) => x.s === 'running');
    expect(back[0]!.at - dwells[0]!.at).toBeGreaterThanOrEqual(1200);
    expect(back[0]!.at - dwells[0]!.at).toBeLessThan(1250);
    expect(back[1]!.at - dwells[1]!.at).toBeGreaterThanOrEqual(COUNTDOWN_DWELL_MS);
  });

  it('steady: không dừng ở section', () => {
    const t = setup({ mode: 'steady', sections: [{ top: 400, type: 'couple' }] });
    const states: string[] = [];
    t.sc.onChange = (s) => states.push(s);
    t.sc.resume(0);
    t.run(20_000);
    expect(states).not.toContain('dwell');
  });

  it('dừng ở cuối trang (không quay về đầu)', () => {
    const t = setup({}, 1400, 800);
    t.sc.resume(0);
    t.run(60_000);
    expect(t.sc.state).toBe('done');
    expect(t.y()).toBeGreaterThanOrEqual(600 - 2);
    expect(t.sc.stopReason).toBe('end');
  });

  it('có section Cảm ơn: giảm tốc dần trong màn cuối', () => {
    const t = setup({ landing: true }, 6000, 800);
    expect(t.sc.speedAt(0)).toBeCloseTo(45, 5);
    expect(t.sc.speedAt(5200 - 400)).toBeLessThan(t.sc.speedAt(0));
    expect(t.sc.speedAt(5200 - 10)).toBeGreaterThan(0);
  });
});

describe('AutoScroller: dừng khi khách tác động - KHÔNG tự tiếp tục', () => {
  for (const reason of ['wheel', 'touch', 'pointer', 'key', 'focus', 'overlay', 'selection'] as const) {
    it(`${reason} -> dừng hẳn, không tự chạy lại (kể cả sau tab ẩn/hiện, resize)`, () => {
      const t = setup();
      t.sc.resume(0);
      t.run(2000);
      t.sc.stop(reason);
      const y = t.y();
      t.run(5000);
      t.sc.pause('hidden', t.now());
      t.sc.visible(t.now());
      t.sc.pause('resize', t.now());
      t.run(10_000);
      expect(t.sc.state).toBe('stopped');
      expect(t.y()).toBe(y);
      expect(t.sc.stopReason).toBe(reason);
    });
  }

  it('kéo thanh cuộn / tìm trong trang (scrollY lệch > 3px) -> dừng', () => {
    const t = setup();
    t.sc.resume(0);
    t.run(2000);
    t.scrollTo(t.y() + 200);
    t.run(32);
    expect(t.sc.state).toBe('stopped');
    expect(t.sc.stopReason).toBe('drift');
  });

  it('khách cuộn trong lúc chờ bắt đầu -> không bắt đầu', () => {
    const t = setup();
    t.sc.schedule(0, 2500);
    t.run(500);
    t.scrollTo(300);
    t.run(5000);
    expect(t.sc.state).toBe('stopped');
    expect(t.y()).toBe(300);
  });

  it('bấm "Tiếp tục": chạy từ vị trí hiện tại, không áp startDelayMs', () => {
    const t = setup();
    t.sc.resume(0);
    t.run(1500);
    t.sc.stop('touch');
    t.scrollTo(900);
    t.run(1000);
    t.sc.resume(t.now());
    expect(t.sc.state).toBe('running');
    t.run(RAMP_MS + 500);
    expect(t.y()).toBeGreaterThan(900);
    expect(t.sc.userStops).toBe(1);
  });
});

describe('AutoScroller: tạm dừng do hệ thống thì tự chạy lại', () => {
  it('tab ẩn: dừng; hiện lại -> chạy lại sau 1s', () => {
    const t = setup();
    t.sc.resume(0);
    t.run(1500);
    t.sc.pause('hidden', t.now());
    const y = t.y();
    t.run(5000);
    expect(t.y()).toBe(y);
    t.sc.visible(t.now());
    t.run(RESUME_HIDDEN_MS - 50);
    expect(t.sc.state).toBe('paused');
    t.run(100);
    expect(t.sc.state).toBe('running');
  });

  it('resize (thanh địa chỉ co giãn): không tính là khách cuộn, chạy lại sau 500ms', () => {
    const t = setup();
    t.sc.resume(0);
    t.run(1500);
    t.sc.pause('resize', t.now());
    t.scrollTo(t.y() + 40); // trình duyệt tự đổi scrollY khi resize
    t.run(RESUME_RESIZE_MS + 50);
    expect(t.sc.state).toBe('running');
    t.run(500);
    expect(t.sc.state).toBe('running');
  });
});

describe('autoStartBlocker + phím bổ trợ', () => {
  const base = { enabled: true, fxState: 'medium', reducedMotion: false, restoredScroll: false, hasHash: false, pageH: 6000, vh: 800 };
  it('tự chạy khi đủ điều kiện', () => expect(autoStartBlocker(base)).toBeNull());
  it.each([
    [{ enabled: false }, 'disabled'], [{ fxState: 'off' }, 'off'], [{ reducedMotion: true }, 'reduced-motion'], [{ fxState: 'reduced' }, 'reduced-motion'],
    [{ restoredScroll: true }, 'restored'], [{ hasHash: true }, 'hash'], [{ pageH: 1100 }, 'short'],
  ])('%o -> %s', (patch, why) => expect(autoStartBlocker({ ...base, ...patch })).toBe(why));
  it('Shift/Ctrl/Alt/Meta không dừng; phím khác thì dừng', () => {
    for (const k of ['Shift', 'Control', 'Alt', 'Meta']) expect(isModifierOnly(k)).toBe(true);
    for (const k of ['ArrowDown', ' ', 'a', 'Tab', 'End']) expect(isModifierOnly(k)).toBe(false);
  });
});
