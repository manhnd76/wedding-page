/**
 * Kiểu mở `double-door` - Cửa đôi (design-v4a-2bc §2.4, họ cổng, chi phí Vừa).
 * 2 cánh cửa chạm khắc (mask `door-carve.svg`, cánh phải = lật gương) + vòng nắm + dải sáng khe giữa; chữ trên biển nổi.
 * Vừa ~1.6s: biển rút 0–200 · cánh xoay quanh bản lề ngoài 150–1050 tới ±82° (O08: qua 90° mặt sau ẩn -> cửa "bốc hơi") · sáng .8 ở 250–750 rồi tắt tới 1150
 *   · "camera" tiến vào 600–1600 · cover mờ 1200–1600. Nhẹ ~0.8s: cánh trượt ngang 100–700, mờ 500–800.
 * Nhiều: + 20 hạt sáng bay ra từ khe giữa (t=250) - hạt `sparkle` (v4a-2c), dự phòng `gold-dust`.
 */
import './double-door.css';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, mk, rise, tl, waitMasks, zoomOut, type StepSpec, type Timeline } from '../open-kit/layers';
import { coverSparks, prepareSparks } from '../open-kit/sparks';

/** O08: góc mở tối đa của cánh (< 90° để cánh vẫn thấy; "camera" zoom đưa cánh ra khỏi khung). */
export const DOOR_DEG = 82;

export function timeline(level: OpenLevelCtx['level']): Timeline {
  if (level === 'light') {
    const sl = (k: string, x: string): StepSpec => ({ k, f: [{ transform: 'translateX(0)' }, { transform: `translateX(${x})` }], s: 100, d: 600, e: EASE_INOUT });
    return tl([rise('cv-plaque', 0, 150), sl('dd-l', '-100%'), sl('dd-r', '100%'), fade('cover', 500, 300)]);
  }
  const sw = (k: string, deg: number): StepSpec =>
    ({ k, f: [{ transform: 'perspective(900px) rotateY(0deg)' }, { transform: `perspective(900px) rotateY(${deg}deg)` }], s: 150, d: 900, e: EASE_INOUT });
  return tl([
    rise('cv-plaque', 0, 200, ' scale(.98)'),
    sw('dd-l', -DOOR_DEG), sw('dd-r', DOOR_DEG),
    { k: 'dd-light', f: [{ opacity: 0 }, { opacity: 0.8, offset: 0.55 }, { opacity: 0 }], s: 250, d: 900 },
    zoomOut('dd', 600, 1000),
    fade('cover', 1200, 400),
  ]);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const door = (s: string) => div(`dd-d dd-${s}`, mk('dd-c'), mk('dd-ring'));
  const layers = cover.querySelector('.op-layers')!;
  layers.append(div('dd', div('dd-light'), door('l'), door('r')));
  if (info.mode === 'full+') void prepareSparks();
  await waitMasks(layers);
}

/**
 * Hạt sao bay ra từ khe cửa (P09, Q3): sao 4 cánh cần ≈1.8× cỡ chấm tròn -> [7, 13]; màu vàng nhạt cố định
 * (cặp vàng sáng của theme tối) ở mọi theme vì hạt bay trên cánh cửa sẫm - `gold()` theme sáng (`#B8862F`) chìm.
 */
export const DOOR_SPARKS = { size: [7, 13] as [number, number], colors: ['#F3D48C', '#FFF8E6'] };

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  if (c.level === 'full+') {
    const o = { x: innerWidth / 2, y: innerHeight / 2 };
    for (const angle of [[-12, 12], [168, 192]] as [number, number][]) {
      void coverSparks({ count: 10, kind: ['sparkle', 'gold-dust'], colors: DOOR_SPARKS.colors, size: DOOR_SPARKS.size, origin: o, spread: [3, innerHeight * 0.35], angle, speed: [40, 120], life: [800, 1000], gravity: 0, drag: 0.6, at: 250 / c.timeScale });
    }
  }
  return bind(cover, timeline(c.level), c);
}
