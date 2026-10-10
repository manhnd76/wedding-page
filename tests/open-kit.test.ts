/**
 * v4a-2b (solution-v4a-2bc.md 4.1): tua nhanh WAAPI, open-kit (photo, clip), light-gather (lấy mẫu điểm + chính sách FPS),
 * ink-spread (cỡ vệt), book (màu chữ bìa đạt AA).
 */
import { describe, expect, it } from 'vitest';
import { FAST_FORWARD_MS, animsRemaining, fastForwardAnims, runSteps } from '@guest/cover/anim';
import { SAFE, tl } from '@guest/cover/open-kit/layers';
import { pickPhoto } from '@guest/cover/open-kit/photo';
import { fpsPolicy, samplePoints } from '@guest/cover/styles/light-gather';
import { blobSize } from '@guest/cover/styles/ink-spread';
import { coverInk, mix } from '@guest/cover/styles/book';
import { contrast } from '@shared/theme/contrast';
import type { WeddingConfig } from '@shared/config/types';

/** Animation giả: đủ API mà anim.ts dùng (endTime, currentTime, playbackRate, updatePlaybackRate). */
function fakeAnim(delay: number, dur: number, cur: number) {
  const a = {
    playbackRate: 1, currentTime: cur, playState: 'running',
    effect: { getComputedTiming: () => ({ endTime: delay + dur }) },
    updatePlaybackRate(r: number) { a.playbackRate = r; },
    finished: Promise.resolve(),
  };
  return a as unknown as Animation;
}

describe('tua nhanh (chạm lần 2) - phần còn lại ≤ 300ms ở mọi mốc', () => {
  const plan: [number, number][] = [[0, 200], [150, 900], [800, 300], [1300, 500], [1500, 300]]; // ~ wax-seal/curtain
  for (const at of [0, 100, 400, 700, 1000, 1500, 1750]) {
    it(`chạm lần 2 tại ${at}ms`, () => {
      const anims = plan.map(([d, dur]) => fakeAnim(d, dur, at));
      const before = animsRemaining(anims);
      fastForwardAnims(anims);
      const after = animsRemaining(anims);
      expect(after).toBeLessThanOrEqual(FAST_FORWARD_MS + 0.01);
      if (before <= FAST_FORWARD_MS) expect(after).toBe(before);
      // tốc độ đồng đều -> các bước "đồng bộ" (vd trục + giấy scroll) vẫn khớp nhau
      expect(new Set(anims.map((a) => a.playbackRate)).size).toBe(1);
    });
  }

  it('runSteps: totalMs = mốc kết thúc lớn nhất (≤ 2400), không có phần tử -> xong ngay', async () => {
    const r = runSteps([{ el: null, frames: [], start: 300, dur: 900 }]);
    expect(r.totalMs).toBe(1200);
    expect(r.remainingMs()).toBe(0);
    await r.finished;
    expect(runSteps([{ el: null, frames: [], start: 2000, dur: 900 }]).totalMs).toBe(2400);
  });

  it('timeline theo tên lớp: totalMs = max(s + d)', () => {
    expect(tl([{ k: 'a', f: [], s: 100, d: 200 }, { k: 'b', f: [], s: 0, d: 250 }]).totalMs).toBe(300);
  });
});

describe('open-kit', () => {
  it('biên an toàn dấu tiếng Việt = -.3em', () => expect(SAFE).toBe('-.3em'));

  const cfg = (bg: 'image' | 'paper', bgSrc: string | null, hero: string | null) => ({
    cover: { background: bg, backgroundImage: bgSrc ? { src: bgSrc } : null },
    content: { hero: { image: hero ? { src: hero } : null } },
  }) as unknown as Pick<WeddingConfig, 'cover' | 'content'>;

  it('coverPhoto: ảnh nền cover -> ảnh hero -> không có (nền + monogram)', () => {
    expect(pickPhoto(cfg('image', 'content/images/cover.jpg', 'content/images/hero.jpg'))).toBe('content/images/cover.jpg');
    expect(pickPhoto(cfg('paper', 'content/images/cover.jpg', 'content/images/hero.jpg'))).toBe('content/images/hero.jpg');
    expect(pickPhoto(cfg('image', null, 'content/images/hero.jpg'))).toBe('content/images/hero.jpg');
    expect(pickPhoto(cfg('paper', null, null))).toBeNull();
  });
});

describe('light-gather', () => {
  /** "chữ" giả: khối 60×40 alpha 255 trong khung 100×100 */
  const W = 100, H = 100;
  const alpha = new Uint8ClampedArray(W * H);
  for (let y = 30; y < 70; y++) for (let x = 20; x < 80; x++) alpha[y * W + x] = 255;

  it('bước 2px: lấy đủ 400 điểm KHÁC nhau, đều nằm trên chữ', () => {
    const pts = samplePoints(alpha, W, H, 2, 400);
    expect(pts).toHaveLength(400);
    expect(new Set(pts.map((p) => p.join())).size).toBe(400);
    for (const [x, y] of pts) { expect(alpha[y * W + x]).toBe(255); expect(x % 2).toBe(0); }
  });

  it('bước 3px: ít điểm hơn; không đủ 700 thì lấy hết (không lặp)', () => {
    const p3 = samplePoints(alpha, W, H, 3, 700);
    expect(p3.length).toBe(20 * 14);
    expect(new Set(p3.map((p) => p.join())).size).toBe(p3.length);
    expect(samplePoints(alpha, W, H, 2, 700)).toHaveLength(600);
  });

  it('chính sách FPS: ≥45 giữ; <45 giảm 250 rồi đo lại; <30 hoặc lần 2 vẫn <45 -> nhánh Nhẹ', () => {
    expect(fpsPolicy(60)).toBe('keep');
    expect(fpsPolicy(45)).toBe('keep');
    expect(fpsPolicy(40)).toBe('reduce');
    expect(fpsPolicy(40, 50)).toBe('keep');
    expect(fpsPolicy(40, 44)).toBe('fallback');
    expect(fpsPolicy(29)).toBe('fallback');
  });
});

describe('ink-spread + book', () => {
  it('vệt mực đủ phủ góc xa nhất (vòng nội tiếp r ≈ 36% cạnh file)', () => {
    for (const [x, y] of [[180, 370], [0, 0], [360, 740], [10, 700]]) {
      const s = blobSize(x!, y!, 360, 740);
      const far = Math.hypot(Math.max(x!, 360 - x!), Math.max(y!, 740 - y!));
      expect(s * 0.36).toBeGreaterThanOrEqual(far);
    }
  });

  it('chữ trên bìa sách đạt ≥ 4.5:1 trên --op-cover (12 theme tiêu biểu)', () => {
    const pairs: [string, string][] = [['#8a6a3b', '#c9a86a'], ['#A3201D', '#D4A23C'], ['#262624', '#C2703D'], ['#1F5A4A', '#C2A26A'], ['#A4495A', '#E3BDB5'], ['#2D3E5E', '#E7A9B6']];
    for (const [primary, accent] of pairs) {
      const bg = mix(primary, '#000000', 0.08);
      expect(contrast(coverInk(bg, accent, primary, false), bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
