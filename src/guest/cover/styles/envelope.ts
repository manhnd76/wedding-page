/**
 * Kiểu mở `envelope` - phong bì ngang (design-review-v1 3.2 + 4). Mọi mẫu dùng chung bố cục + timeline này;
 * mẫu ("skin") chỉ vẽ SVG + pha "mở khoá" riêng (lazy, 1 module/mẫu, chỉ tải mẫu đang dùng).
 *
 * Timeline mức Vừa (~2.0s, ≤ 2.4s), mốc theo mẫu classic:
 *   0–260 seal tách đôi · 180–720 nắp lật rotateX(0→180) (z-index 4→1 ở 50%) · 650–1250 thẻ rút lên
 *   1150–1550 bao rơi xuống + mờ, thẻ về giữa màn scale 1.06, nội dung đổi sang lời chào
 *   1650–1950 thẻ scale 1.12 + cover mờ đi.
 * Nhẹ: seal mờ 120ms, nắp 320ms, thẻ rút 320ms, bỏ phần bao rơi (mờ chung) - ~1.1s.
 * Khoảng rút/đưa về giữa tính theo kích thước thật -> không khung nào bị cắt ở 360×740.
 * Chỉ transform/opacity (+ z-index rời rạc); không clip-path trên vùng chữ.
 */
import type { EnvelopeStyle } from '@shared/config/enums';
import { ctx } from '../../context';
import { EASE_INOUT, EASE_OUT, runSteps, type OpenLevelCtx, type OpenRun, type Step } from '../anim';
import type { EnvelopeSkin, EnvParts } from '../skins/kit';

export const SKIN_LOADERS: Record<EnvelopeStyle, () => Promise<{ skin: EnvelopeSkin }>> = {
  classic: () => import('../skins/classic'),
  kraft: () => import('../skins/kraft'),
  'song-hy': () => import('../skins/song-hy'),
  lace: () => import('../skins/lace'),
  minimal: () => import('../skins/minimal'),
  velvet: () => import('../skins/velvet'),
};

let current: EnvelopeSkin | null = null;

function parts(cover: HTMLElement): EnvParts | null {
  const q = (s: string) => cover.querySelector<HTMLElement>(s);
  const env = q('.cv-env');
  if (!env) return null;
  return {
    cover, env, back: q('.env-back')!, front: q('.env-front')!, flap: q('.env-flap')!, flapF: q('.env-flap-f')!,
    flapB: q('.env-flap-b')!, deco: q('.env-deco')!, seal: q('.env-seal')!, card: q('.cv-card')!,
  };
}

/** Tải skin của mẫu đang chọn và vẽ vào các lớp (trước khi khách chạm). */
export async function prepare(cover: HTMLElement): Promise<void> {
  const p = parts(cover);
  if (!p) return;
  const style = (ctx.resolved.envelope?.style ?? 'classic') as EnvelopeStyle;
  const load = SKIN_LOADERS[style] ?? SKIN_LOADERS.classic;
  const mod = await load().catch(() => SKIN_LOADERS.classic());
  current = mod.skin;
  current.build(p, { liner: ctx.resolved.envelope?.liner !== false, monogram: ctx.config.cover.monogram ?? '', uid: Math.random().toString(36).slice(2, 7) });
}

/** Khoảng rút thẻ (px) và độ dời để thẻ về giữa màn, kẹp để thẻ luôn nằm trọn trong viewport. */
export function cardTravel(card: { top: number; height: number }, vh: number, scale = 1.12, margin = 8): { pull: number; center: number } {
  const pull = Math.max(0, Math.min(card.height * 0.62, card.top - margin));
  // tâm thẻ sau khi đưa về giữa = vh/2; kiểm cả khi đã phóng `scale`
  const half = (card.height * scale) / 2;
  const target = Math.min(Math.max(vh / 2, half + margin), vh - half - margin);
  return { pull, center: target - (card.top + card.height / 2) };
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  const p = parts(cover);
  if (!p) return runSteps([{ el: cover, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 300 }], c.timeScale);
  const light = c.level === 'light';
  const head = cover.querySelector<HTMLElement>('.cv-head');
  const body = p.card.querySelector<HTMLElement>('.cv-card-body');
  const greet = p.card.querySelector<HTMLElement>('.cv-greet');
  const r = p.card.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const { pull, center } = cardTravel({ top: r.top, height: r.height }, vh);
  const unlock = current?.unlock(p, light) ?? { steps: [{ el: p.seal, frames: [{ opacity: 1 }, { opacity: 0 }], start: 0, dur: 160 }], flapAt: light ? 0 : 180 };
  const steps: Step[] = [...unlock.steps];
  const flapAt = unlock.flapAt;
  const flapDur = light ? 320 : unlock.flapDur ?? 540;
  const flipT = 'perspective(1200px) rotateX(0deg)';
  steps.push(
    { el: p.flap, frames: [{ transform: flipT }, { transform: 'perspective(1200px) rotateX(180deg)' }], start: flapAt, dur: flapDur, easing: EASE_INOUT },
    // z-index rời rạc: nắp lật quá nửa thì nằm sau thẻ
    { el: p.flap, frames: [{ zIndex: 4 }, { zIndex: 1 }], start: flapAt, dur: flapDur, easing: 'linear' },
  );
  const pullAt = flapAt + flapDur - 70;
  const pullDur = light ? 320 : 600;
  const ty = (y: number, s = 1) => `translateY(${Math.round(y)}px) scale(${s})`;
  steps.push({ el: p.card, frames: [{ transform: ty(0) }, { transform: ty(-pull) }], start: pullAt, dur: pullDur, easing: EASE_OUT });

  if (light) {
    const endAt = pullAt + pullDur;
    steps.push(
      { el: p.card, frames: [{ transform: ty(-pull) }, { transform: ty(-pull, 1.06) }], start: endAt, dur: 300 },
      { el: cover, frames: [{ opacity: 1 }, { opacity: 0 }], start: endAt, dur: 300 },
    );
    return runSteps(steps, c.timeScale);
  }

  const dropAt = pullAt + 500;
  const dropDur = 400;
  const drop = [{ translate: '0 0', opacity: 1 }, { opacity: 0.35, offset: 0.4 }, { translate: '0 30%', opacity: 0 }];
  for (const el of [p.back, p.front, p.flap, p.deco]) steps.push({ el, frames: drop, start: dropAt, dur: dropDur, easing: 'cubic-bezier(.4,0,1,1)' });
  steps.push({ el: head, frames: [{ opacity: 1 }, { opacity: 0 }], start: dropAt, dur: 300 });
  // thẻ lên trước túi khi túi đã mờ ~60% (tránh thẻ bị túi che lúc về giữa màn)
  steps.push({ el: p.card, frames: [{ zIndex: 2 }, { zIndex: 7 }], start: dropAt + 80, dur: 2, easing: 'linear' });
  steps.push({ el: p.card, frames: [{ transform: ty(-pull) }, { transform: ty(center, 1.06) }], start: dropAt + 60, dur: dropDur, easing: EASE_OUT });
  let endAt = dropAt + 500;
  if (c.greeting && greet) {
    steps.push({ el: body, frames: [{ opacity: 1 }, { opacity: 0 }], start: dropAt, dur: 200 });
    steps.push({ el: greet, frames: [{ opacity: 0 }, { opacity: 1 }], start: dropAt + 100, dur: 200 });
  } else endAt = dropAt + 420;
  steps.push(
    { el: p.card, frames: [{ transform: ty(center, 1.06) }, { transform: ty(center, 1.12) }], start: endAt, dur: 300 },
    { el: cover, frames: [{ opacity: 1 }, { opacity: 0 }], start: endAt + 50, dur: 250 },
  );
  return runSteps(steps, c.timeScale);
}
