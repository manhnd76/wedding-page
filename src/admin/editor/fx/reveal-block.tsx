/** Khối "Hiện nội dung khi cuộn" (gói reveal) của trang Hiệu ứng (design 8.13). */
import { CAPABILITIES } from '@shared/capabilities';
import type { RevealStyle } from '@shared/config/enums';
import { REVEAL_LABEL, followThemeLabel } from '@shared/labels';
import { resolvedOf, type FxBlockProps } from './ctx';

export function RevealBlock({ fx }: FxBlockProps) {
  const { sug, set } = fx;
  const e = fx.draft.effects;
  const themeReveal = resolvedOf('revealStyle', sug.revealStyle);
  return (
    <>
      <h2>Hiện nội dung khi cuộn</h2>
      <div class="chips" role="radiogroup" aria-label="Gói hiện nội dung">
        {(['theme', ...CAPABILITIES.revealStyle.supported] as ('theme' | RevealStyle)[]).map((v) => {
          const label = v === 'theme' ? followThemeLabel(REVEAL_LABEL, sug.revealStyle, themeReveal) : REVEAL_LABEL[v];
          return (
            <button key={v} type="button" role="radio" aria-checked={e.reveal.style === v} class="chip"
              onClick={() => set('effects.reveal.style', v, 'reveal', `Hiện nội dung · ${label}`)}>
              {label}{e.reveal.style === v ? ' ✓' : ''}
            </button>
          );
        })}
      </div>
    </>
  );
}
