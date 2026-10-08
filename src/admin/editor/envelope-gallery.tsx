/**
 * Mẫu phong bì (design-review-v1 4.5): gallery thẻ 3 cột (2 cột mobile), poster tĩnh dựng từ chính hình học skin
 * (`@shared/envelope`), nhuộm theo theme đang chọn, có tên khách mẫu. Hover/focus phát mini-animation (CSS, 1 lần).
 * `role="radiogroup"`: mũi tên để duyệt, Space/Enter để chọn. Chọn = phát ngay trong preview.
 * Dưới gallery: màu phong bì (Theo mẫu / Theo theme / Tự chọn + badge tương phản), 2 công tắc.
 */
import { useRef } from 'preact/hooks';
import { ENVELOPE_STYLES, type EnvelopeStyle } from '@shared/config/enums';
import type { WeddingConfig } from '@shared/config/types';
import { ENVELOPE_FIXED_PALETTE, ENVELOPE_META, envelopeGeom } from '@shared/envelope';
import { contrast } from '@shared/theme/contrast';
import { PRESETS } from '@shared/theme/presets';
import { envelopeFixed, inkOn, type ResolvedTheme } from '@shared/theme/resolve';
import { Segmented, Toggle } from '../ui/ui';

interface Pal { paper: string; paper2: string; edge: string; ink: string; liner: string; seal: string; onSeal: string }

const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

/** Bảng màu poster: cùng quy tắc với guest (cover.css + resolve.envelope). */
export function posterPalette(style: EnvelopeStyle, r: ResolvedTheme, color: string): Pal {
  const t = r.tokens;
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    const ink = inkOn(color);
    return { paper: color, paper2: color, edge: ink === '#FFFFFF' ? '#ffffff73' : '#00000040', ink, liner: t.accent, seal: t.primary, onSeal: t.onPrimary };
  }
  const fixed = color === 'auto' && envelopeFixed(style, r.mode) ? ENVELOPE_FIXED_PALETTE[style] : undefined;
  if (fixed) return { ...fixed, onSeal: style === 'song-hy' ? fixed.paper : '#2A1F12' };
  const base: Pal = { paper: t.surface, paper2: mix(t.bg, t.accent, 0.1), edge: t.line, ink: t.text, liner: t.accent, seal: t.primary, onSeal: t.onPrimary };
  switch (style) {
    case 'song-hy': return { ...base, paper: t.primary, paper2: t.primary, edge: t.accent, ink: t.onPrimary, seal: t.accent, onSeal: t.primary };
    case 'kraft': return { ...base, paper: mix(t.surface, t.accent, 0.3), liner: t.primary };
    case 'lace': return { ...base, paper: mix(t.surface, t.accent2, 0.16), paper2: mix(t.bg, t.accent, 0.22) };
    case 'velvet': return { ...base, edge: t.primary, liner: t.primary, seal: '#B8925A', onSeal: '#2A1F12' };
    default: return base;
  }
}

function Seal({ style, pal, mono, tipY }: { style: EnvelopeStyle; pal: Pal; mono: string; tipY: number }) {
  const y = style === 'kraft' ? 112 : tipY;
  if (style === 'minimal') return <circle cx={170} cy={y} r={15} fill={pal.liner} />;
  if (style === 'lace') {
    return <g transform={`translate(170 ${y})`}><circle cx={-9} cy={-3} r={11} fill={pal.liner} /><circle cx={10} cy={-7} r={9} fill={pal.seal} opacity={0.75} /><circle cx={-9} cy={-3} r={3} fill={pal.seal} /></g>;
  }
  if (style === 'kraft') return <g stroke={pal.liner} stroke-width={4} fill="none"><path d="M170 112c-10-16-30-14-26-3s16 5 26 3zm0 0c10-16 30-14 26-3s-16 5-26 3z" /></g>;
  return (
    <g transform={`translate(170 ${y})`}>
      <circle r={style === 'song-hy' ? 30 : 28} fill={pal.seal} />
      <text y={6} text-anchor="middle" font-size={style === 'song-hy' ? 26 : 17} font-family="Georgia, serif" fill={pal.onSeal}>{style === 'song-hy' ? '囍' : mono}</text>
    </g>
  );
}

function Poster({ style, pal, mono, guest }: { style: EnvelopeStyle; pal: Pal; mono: string; guest: string }) {
  const g = envelopeGeom(style);
  const addrY = style === 'song-hy' ? 120 : style === 'minimal' ? 140 : style === 'kraft' ? 190 : 185;
  return (
    <svg class="eposter" viewBox="0 0 340 238" aria-hidden="true" focusable="false">
      <rect x={0.5} y={0.5} width={339} height={237} rx={6} fill={pal.paper2} stroke={pal.edge} />
      <rect x={20} y={14} width={300} height={210} rx={4} fill="#fff" class="ep-card" />
      <path d={g.pocket} fill={pal.paper} stroke={pal.edge} />
      {(style === 'song-hy' || style === 'velvet') && <rect x={8} y={8} width={324} height={222} fill="none" stroke={pal.edge} stroke-width={2} />}
      {style === 'kraft' && <path d="M0 112H340M170 0V238" stroke={pal.liner} stroke-width={4} />}
      {style === 'kraft' && <rect x={70} y={160} width={200} height={62} rx={6} fill="#FBF5E8" transform="rotate(-3 170 190)" />}
      <g class="ep-flap"><path d={g.flap} fill={pal.paper} stroke={pal.edge} /></g>
      <Seal style={style} pal={pal} mono={mono} tipY={g.tipY} />
      <text x={170} y={addrY} text-anchor="middle" font-size={26} font-style="italic" font-family="Georgia, serif" fill={style === 'kraft' ? '#3A2A20' : pal.ink}>{guest}</text>
    </svg>
  );
}

export interface EnvelopeGalleryProps {
  draft: WeddingConfig;
  r: ResolvedTheme;
  /** chọn mẫu (+ màu): ghi nháp + phát lại kiểu mở trong preview */
  pick: (style: string, label: string, color?: string) => void;
  setPath: (path: string, v: unknown) => void;
}

export function EnvelopeGallery({ draft, r, pick, setPath }: EnvelopeGalleryProps) {
  const env = draft.cover.envelope;
  const preset = PRESETS[draft.theme.preset];
  const suggested = preset.suggest.envelopeStyle;
  const ids = ['theme', ...ENVELOPE_STYLES] as const;
  const box = useRef<HTMLDivElement>(null);
  const mono = draft.cover.monogram || 'M & L';
  const guest = 'Gia đình anh Mạnh';
  const colorMode = env.color === 'auto' || env.color === 'theme' ? env.color : 'custom';
  const onKey = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const d = keys[e.key];
    if (!d) return;
    e.preventDefault();
    const btns = Array.from(box.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    btns[(i + d + btns.length) % btns.length]?.focus();
  };
  const paper = colorMode === 'custom' ? env.color : null;
  const ratio = paper ? contrast(inkOn(paper), paper) : 0;
  return (
    <section class="egal" aria-labelledby="h-env">
      <h2 id="h-env">Mẫu phong bì</h2>
      <div class="ogrid egrid" role="radiogroup" aria-label="Mẫu phong bì" ref={box} onKeyDown={onKey}>
        {ids.map((id) => {
          const real: EnvelopeStyle = id === 'theme' ? suggested : id;
          const on = env.style === id;
          const meta = ENVELOPE_META[real];
          const fixed = meta.fixed && envelopeFixed(real, r.mode);
          const isSuggest = id !== 'theme' && real === suggested;
          const name = id === 'theme' ? `Theo theme (${meta.name.split(' · ')[0]})` : meta.name;
          const aria = [name, fixed && env.color === 'auto' ? 'màu cố định' : '', isSuggest ? `gợi ý cho ${preset.name}` : '', on ? 'đang dùng' : ''].filter(Boolean).join(', ');
          return (
            <button key={id} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} aria-label={aria}
              class={`ocard ecard${on ? ' is-on' : ''}`} data-testid={`env-${id}`} onClick={() => pick(id, name)}>
              <Poster style={real} pal={posterPalette(real, r, env.color)} mono={mono} guest={guest} />
              <span class="ocard-name">{name}</span>
              <span class="ecard-badges">
                {on && <span class="badge badge--ok">Đang dùng ✓</span>}
                {isSuggest && <span class="badge">Gợi ý cho theme</span>}
                {fixed && <span class="badge badge--warn">Màu cố định</span>}
              </span>
            </button>
          );
        })}
      </div>
      <Segmented legend="Màu phong bì" name="envcolor" value={colorMode}
        help="Theo mẫu: Kraft, Song Hỷ, Nhung đêm giữ màu riêng; các mẫu khác theo theme."
        options={[{ value: 'auto', label: 'Theo mẫu' }, { value: 'theme', label: 'Theo theme' }, { value: 'custom', label: 'Tự chọn' }]}
        onChange={(v) => pick(env.style, 'Màu phong bì', v === 'custom' ? r.tokens.surface.toUpperCase() : v)} />
      {paper && (
        <div class="color-row">
          <input type="color" aria-label="Màu giấy phong bì" value={paper} onInput={(ev) => setPath('cover.envelope.color', (ev.currentTarget as HTMLInputElement).value.toUpperCase())} />
          <span class={`badge ${ratio >= 4.5 ? 'badge--ok' : 'badge--warn'}`}>Chữ trên giấy {ratio.toFixed(1)}:1 {ratio >= 4.5 ? '✓' : '(cần ≥ 4.5)'}</span>
        </div>
      )}
      <Toggle label="Ghi tên khách trên phong bì" checked={env.guestOnFront} testId="env-guest-front" onChange={(v) => setPath('cover.envelope.guestOnFront', v)} />
      <Toggle label="Lót hoa văn trong nắp" checked={env.liner} onChange={(v) => setPath('cover.envelope.liner', v)} />
    </section>
  );
}
