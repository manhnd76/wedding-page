/**
 * Kiểu mở `book` - Thiệp gấp đôi / lật trang (design-v4a-2bc §2.11, họ vật thể, chi phí Thấp).
 * Bìa (khung mask `cover-frame.svg`, monogram + "Thiệp mời" màu --op-cover-ink đạt ≥ 4.5:1 trên bìa, tính lúc chạy)
 * lật quanh gáy lộ trang trong "Trân trọng kính mời / {khách} / tới dự lễ thành hôn" (trang trí, aria-hidden).
 * "Kính gửi + khách" thật (node của entry) nằm DƯỚI sách để đọc được trước khi chạm (lệch nhỏ - xem report).
 * Vừa ~1.8s: bìa lật 0–700 · giữ 700–1400 · phóng 1400–1800 + cover mờ. Nhẹ ~0.7s: lật 0–400, mờ 400–700.
 * Nhiều: + trang giấy lót mờ (vellum) lật theo, trễ 120ms.
 */
import './book.css';
import { contrast } from '@shared/theme/contrast';
import { ctx } from '../../context';
import { css, h } from '../../dom';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { bind, div, fade, mk, tl, zoomOut, type StepSpec, type Timeline } from '../open-kit/layers';

export function timeline(level: OpenLevelCtx['level']): Timeline {
  const flip = (k: string, s: number, d: number): StepSpec => ({ k, f: [{ transform: 'perspective(1400px) rotateY(0deg)' }, { transform: 'perspective(1400px) rotateY(-180deg)' }], s, d, e: EASE_INOUT });
  if (level === 'light') return tl([flip('bk-cover', 0, 400), fade('cover', 400, 300)]);
  const steps = [flip('bk-cover', 0, 700), fade('cv-head', 1400, 200), fade('cv-guestline', 1400, 200), zoomOut('bk', 1400, 400, 1.12), fade('cover', 1450, 350)];
  if (level === 'full+') steps.push(flip('bk-vel', 120, 700));
  return tl(steps);
}

/** Pha 2 màu hex (sRGB). */
export function mix(a: string, b: string, t: number): string {
  const p = (x: string, i: number) => parseInt(x.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(p(a, i) * (1 - t) + p(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Màu chữ trên bìa: accent pha trắng ít nhất để đạt ≥ 4.5:1 (design §2.11); theme tối: primary. */
export function coverInk(bg: string, accent: string, primary: string, dark: boolean): string {
  if (dark) return primary;
  for (let t = 0; t <= 1; t += 0.05) { const c = mix(accent, '#ffffff', t); if (contrast(c, bg) >= 4.5) return c; }
  return '#ffffff';
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const t = ctx.resolved.tokens;
  const dark = document.documentElement.dataset.mode === 'dark';
  const bg = dark ? mix(t.surface, t.primary, 0.15) : mix(t.primary, '#000000', 0.08);
  css(cover, { '--op-cover': bg, '--op-cover-ink': coverInk(bg, t.accent, t.primary, dark) });
  const mono = ctx.config.cover.monogram || '♡';
  cover.querySelector('.op-stage')!.append(div('bk',
    div('bk-page', h('p', { class: 'bk-s' }, 'Trân trọng kính mời'), h('p', { class: 'bk-g' }, ctx.guest.display), h('p', { class: 'bk-s' }, 'tới dự lễ thành hôn')),
    info.mode === 'full+' ? div('bk-vel') : null,
    div('bk-cover', div('bk-front', mk('bk-frame'), h('span', { class: 'bk-mono' }, mono), h('span', { class: 'bk-title' }, 'Thiệp mời')), div('bk-back', mk('bk-end')))));
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  return bind(cover, timeline(c.level), c);
}
