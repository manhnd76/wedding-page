/**
 * Khối "Kiểu mở thiệp" (design 8.13): gallery `role="radiogroup"` với hoạt ảnh CSS thu nhỏ khi hover/focus/chọn
 * (`open-mini.css`) + "Mẫu phong bì" khi kiểu thật là `envelope`. Chọn = phát ngay trong preview.
 */
import { CAPABILITIES } from '@shared/capabilities';
import type { OpenStyle } from '@shared/config/enums';
import { OPEN_STYLE_LABEL, followThemeLabel } from '@shared/labels';
import { OPEN_META } from '@shared/open-styles';
import { EnvelopeGallery } from './envelope-gallery';
import { resolvedOf, type FxBlockProps } from './ctx';
import './open-mini.css';

export function OpenBlock({ fx }: FxBlockProps) {
  const { draft, r, sug, store, preview, peek, set } = fx;
  const opens = ['theme', ...(CAPABILITIES.openStyle.supported as readonly OpenStyle[])] as const;
  const themeOpen = resolvedOf('openStyle', sug.openStyle);
  return (
    <>
      <h2>Kiểu mở thiệp</h2>
      <div class="ogrid" role="radiogroup" aria-label="Kiểu mở thiệp">
        {opens.map((id) => {
          const real: OpenStyle = id === 'theme' ? themeOpen : id;
          const on = draft.cover.openStyle === id;
          const label = id === 'theme' ? followThemeLabel(OPEN_STYLE_LABEL, sug.openStyle, themeOpen) : OPEN_STYLE_LABEL[id];
          return (
            <button key={id} type="button" role="radio" aria-checked={on} class={`ocard${on ? ' is-on' : ''}`} data-testid={`open-${id}`}
              onClick={() => set('cover.openStyle', id, 'cover', `Mở thiệp · ${label}`)}>
              <span class={`omini omini--${real}`} aria-hidden="true"><i /><b /></span>
              <span class="ocard-name">{label}{on ? ' ✓' : ''}</span>
              {id !== 'theme' && id === sug.openStyle && <span class="badge">Gợi ý cho theme</span>}
              {OPEN_META[real].cost === 'high' && <span class="badge badge--warn">Nặng ⚠</span>}
            </button>
          );
        })}
      </div>

      {r.openStyle === 'envelope' && (
        <EnvelopeGallery draft={draft} r={r}
          pick={(style, label, color) => {
            store.setPath('cover.envelope.style', style);
            if (color !== undefined) store.setPath('cover.envelope.color', color);
            setTimeout(() => preview.replay('cover', `Mở thiệp · ${label}`), 0);
            peek(`Đã chọn: ${label}`);
          }}
          setPath={(path, v) => set(path, v, 'cover', 'Mở thiệp', false)} />
      )}
    </>
  );
}
