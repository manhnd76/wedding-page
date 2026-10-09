/**
 * Kiểu mở `gift-box` - Mở hộp quà (design-v4a-2bc §2.9, họ vật thể, chi phí Vừa).
 * Hộp line-art (path asset `open/gift-box/inline.svg`): thiệp (lời chào) nằm SAU thân hộp -> rút lên là "nhô ra khỏi miệng hộp".
 * Tên khách DƯỚI hộp (dải ruy băng cắt ngang mặt hộp). Đầu đề rút ngay (nắp bay lên đè tên cặp đôi).
 * Vừa ~1.9s: nơ tuột 0–400 · nắp bật 350–850 · thiệp nhô 600–1100 · confetti 40 mảnh t=900 · giữ · phóng 1500–1900 + cover mờ.
 * Nhẹ ~0.85s: nơ + nắp mờ, thiệp rút 150–550, không confetti. Nhiều: confetti 80.
 * Confetti = burst `confetti` của v4a-2c khi có; hiện dự phòng bằng mảnh giấy vẽ tại chỗ (`shapes`).
 */
import './gift-box.css';
import { type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, greet, paths, rise, tl, zoomOut, type StepSpec, type Timeline } from '../open-kit/layers';
import { coverSparks, prepareSparks } from '../open-kit/sparks';

const VB = '0 0 240 240';
const BOX = 'M42 116H198V214Q198 220 192 220H48Q42 220 42 214Z';
const LID = 'M32 84H208Q212 84 212 88V112Q212 116 208 116H32Q28 116 28 112V88Q28 84 32 84Z';

/** `h` = cạnh hộp (px). */
export function timeline(level: OpenLevelCtx['level'], g = { h: 200 }): Timeline {
  const card = (s: number, d: number): StepSpec => ({ k: 'gb-card', f: [{ transform: 'translateY(0)' }, { transform: `translateY(${-Math.round(g.h * 0.9)}px)` }], s, d });
  if (level === 'light') return tl([rise('cv-head', 0, 150), fade('gb-bow', 0, 200), fade('gb-lid', 0, 200), card(150, 400), fade('cover', 550, 300)]);
  const dash = (k: string, s: number, d: number): StepSpec => ({ k, f: [{ strokeDashoffset: 0 }, { strokeDashoffset: 100 }], s, d, e: 'linear' });
  return tl([
    rise('cv-head', 0),
    dash('gb-bowl', 0, 300), dash('gb-tail', 100, 300), fade('gb-knot', 200, 200),
    { k: 'gb-lid', f: [{ transform: 'none' }, { transform: `translate(40px,${-Math.round(g.h * 0.55)}px) rotate(15deg)` }], s: 350, d: 500, e: 'cubic-bezier(.34,1.56,.64,1)' },
    fade('gb-lid', 650, 200),
    card(600, 500),
    fade('cv-guestline', 1400, 200),
    zoomOut('gb', 1500, 400, 1.2),
    fade('cover', 1550, 350),
  ]);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  cover.querySelector('.op-stage')!.append(div('gb',
    div('gb-card', greet()),
    paths(VB, 'gb-s gb-body', [[BOX, 'gb-box'], ['M42 116H198V128H42Z', 'gb-side'], ['M108 116H132V220H108Z', 'gb-rib'], [BOX, 'gb-line']]),
    paths(VB, 'gb-s gb-lid', [[LID, 'gb-box'], ['M106 84H134V116H106Z', 'gb-rib'], ['M28 108H212V112Q212 116 208 116H32Q28 116 28 112Z', 'gb-side'], [LID, 'gb-line']]),
    paths(VB, 'gb-s gb-bow', [
      ['M120 82C98 52 66 50 70 70S104 88 120 82Z', 'gb-bowl', { pathLength: 100 }],
      ['M120 82C142 52 174 50 170 70S136 88 120 82Z', 'gb-bowl', { pathLength: 100 }],
      ['M120 82C112 94 104 104 92 110M120 82C128 94 136 104 148 110', 'gb-tail', { pathLength: 100 }],
      ['M120 75a7 7 0 1 0 .01 0Z', 'gb-knot'],
    ])));
  if (info.mode === 'full' || info.mode === 'full+') void prepareSparks();
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const gb = cover.querySelector('.gb');
  const r = gb?.getBoundingClientRect();
  if (c.level !== 'light' && r) {
    const sq = (fill: string, d = 'M-7-4H7V4H-7Z') => [{ d, fill }];
    void coverSparks({
      count: c.level === 'full+' ? 80 : 40, burst: 'confetti', shapes: [sq('c1'), sq('c2'), sq('c1', 'M-5-5H5V5H-5Z'), sq('c2', 'M-12-3H12V3H-12Z')],
      size: [6, 10], origin: { x: r.left + r.width / 2, y: r.top + r.height * 0.48 }, spread: [r.width * 0.25, 4],
      angle: [-125, -55], speed: [260, 520], life: [1100, 1500], gravity: 520, drag: 1.4, spin: 6, at: 900 / c.timeScale,
    });
  }
  return bind(cover, timeline(c.level, { h: r?.height || 200 }), c);
}
