/**
 * Kiểu mở `polaroid` - Ảnh polaroid (design-v4a-2bc §2.13, họ vật thể, chi phí Thấp).
 * Tấm ảnh úp: mặt sau (đang hướng ra) in "Kính gửi + khách" (node chữ của entry, như ghi tay sau ảnh); mặt trước:
 * ảnh (open-kit/photo: ảnh nền cover -> hero -> nền + monogram) + 2 lớp "rửa ảnh" (chỉ opacity, KHÔNG animate filter)
 * + chú thích tên cặp đôi hiện bằng clip-wipe (biên ±0.3em). Băng dính washi ở mép trên.
 * Vừa ~2.2s: bóc băng dính 0–200 · lật 0–500 · rửa ảnh 500–1700 · chú thích 1100–1700 · đầu đề rút 1600–1800
 *   · tấm ảnh bay lên 1700–2200 + cover mờ từ 1900. Nhẹ ~0.9s: lật 0–400, ảnh hiện sẵn. Nhiều: + 2 tấm phụ trượt ra 600–1100.
 */
import './polaroid.css';
import { assetUrl } from '@shared/assets';
import { ctx } from '../../context';
import { h } from '../../dom';
import { EASE_INOUT, type OpenLevelCtx, type OpenRun } from '../anim';
import type { OpenPrepareInfo } from '../open-registry';
import { SAFE, bind, div, fade, mk, move, rise, tl, type StepSpec, type Timeline } from '../open-kit/layers';
import { photoEl } from '../open-kit/photo';

export function timeline(level: OpenLevelCtx['level']): Timeline {
  const flip = (d: number): StepSpec => ({ k: 'pl-rot', f: [{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(0deg)' }], s: 0, d, e: EASE_INOUT });
  if (level === 'light') return tl([fade('pl-dev', 0, 1, 0, 0), { k: 'pl-cap', f: [{ clipPath: `inset(${SAFE})` }, { clipPath: `inset(${SAFE})` }], s: 0, d: 1 }, flip(400), fade('cover', 600, 300)]);
  const steps: StepSpec[] = [
    { k: 'pl-tape', f: [{ transform: 'rotate(-4deg)', opacity: 0.8 }, { transform: 'translateY(-10px) rotate(-12deg)', opacity: 0 }], s: 0, d: 200 },
    flip(500),
    fade('pl-d1', 500, 1200),
    { k: 'pl-d2', f: [{ opacity: 0.9 }, { opacity: 0 }], s: 800, d: 900 },
    { k: 'pl-cap', f: [{ clipPath: `inset(${SAFE} 100% ${SAFE} ${SAFE})` }, { clipPath: `inset(${SAFE})` }], s: 1100, d: 600, e: 'cubic-bezier(.55,.1,.35,1)' },
    rise('cv-head', 1600),
    { k: 'pl', f: [{ transform: 'translateY(0) rotate(-3deg)' }, { transform: 'translateY(-120vh) rotate(-12deg)' }], s: 1700, d: 500, e: 'cubic-bezier(.4,0,1,1)' },
    fade('cover', 1900, 300),
  ];
  if (level === 'full+') {
    for (const [k, sx] of [['pl-x1', -1], ['pl-x2', 1]] as const) {
      steps.push({ k, f: [{ transform: 'translate(0,0) rotate(0deg)', opacity: 0 }, { transform: `translate(${sx * 70}px,20px) rotate(${sx * 10}deg)`, opacity: 1 }], s: 600, d: 500 });
    }
  }
  return tl(steps);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  const nm = (k: string) => cover.querySelector(`.cv-head .${k}`)?.textContent ?? '';
  const [a, b] = [nm('nm-a'), nm('nm-b')];
  const back = div('pl-face pl-back op-fit', mk('pl-print'));
  back.removeAttribute('aria-hidden');
  const extra = (i: number) => {
    const src = ctx.config.content.album.images[i]?.src;
    return div(`pl-x pl-x${i + 1}`, src ? h('img', { class: 'pl-xi', src: assetUrl(src, ctx.base), alt: '', decoding: 'async' }) : div('pl-xi'));
  };
  const rot = div('pl-rot',
    div('pl-face pl-front', div('pl-photo', photoEl('pl-img'), div('pl-dev pl-d1'), div('pl-dev pl-d2')), h('p', { class: 'pl-cap' }, `${a} & ${b}`)),
    back);
  rot.removeAttribute('aria-hidden');
  const pl = div('pl', rot, mk('pl-tape'));
  pl.removeAttribute('aria-hidden');
  cover.querySelector('.op-stage')!.append(...(info.mode === 'full+' ? [extra(0), extra(1)] : []), pl);
  move(cover, '.cv-guestline', back);
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  return bind(cover, timeline(c.level), c);
}
