/**
 * Panel "Hoạ tiết nền" (B2, design 1.7.9, solution Rev 5 mục 10.6) - chunk lười riêng (`import()` khi bấm [Đổi]).
 * Theo theme / Tự chọn; gallery 8 thẻ (radiogroup, ★ "Hợp theme này"); Vị trí tối đa 2 (Phủ nền ⟂ Sau tiêu đề, tự bỏ +
 * aria-live); Độ đậm; Chuyển động; cảnh báo khi `--motif-cap` < .10 mà có vị trí nằm sau chữ.
 * Thẻ = <div> tô accent của theme + mask-image medallion (style Preact = CSSOM, hợp CSP admin `style-src 'self'`).
 */
import { useState } from 'preact/hooks';
import type { MotifIntensity, MotifMotion, MotifPlacement, MotifSet } from '@shared/config/enums';
import { MOTIF_PLACEMENTS, MOTIF_SETS } from '@shared/config/enums';
import type { WeddingConfig } from '@shared/config/types';
import { MOTIF_INTENSITY_LABEL, MOTIF_MOTION_LABEL, MOTIF_PLACEMENT_LABEL, MOTIF_SET_LABEL } from '@shared/labels';
import { MOTIF_BEHIND_TEXT, sanitizeMotifPlacements } from '@shared/theme/parts';
import { PRESETS } from '@shared/theme/presets';
import type { ResolvedTheme } from '@shared/theme/resolve';
import { planMotif } from '@shared/motif/plan';
import { planSections } from '@shared/sections/meta';
import type { EditorStore } from '../state/store';
import type { PeekAction } from './editor';
import './motif-panel.css';

const MEDALLION = import.meta.glob('../../guest/theme-assets/motifs/*/medallion.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const medallionUrl = (set: MotifSet) => MEDALLION[`../../guest/theme-assets/motifs/${set}/medallion.svg`] ?? '';

/** Vị trí đi đôi không được (hai lớp chồng sau cùng một chữ, design 1.7.3). */
const CONFLICT: Partial<Record<MotifPlacement, MotifPlacement>> = { pattern: 'title', title: 'pattern' };

export interface MotifPanelProps {
  store: EditorStore;
  draft: WeddingConfig;
  resolved: ResolvedTheme;
  peek: (text: string, actions?: PeekAction[]) => void;
}

const placementsText = (pl: readonly MotifPlacement[]) => pl.map((p) => MOTIF_PLACEMENT_LABEL[p]).join(' + ');

/** T06: "Trống đồng — Sau tiêu đề + Dải viền" / "Không dùng" (nhãn "Theo theme", không lồng ngoặc). */
function motifSummary(set: MotifSet | 'none', placements: readonly MotifPlacement[]): string {
  return set === 'none' ? MOTIF_SET_LABEL.none : `${MOTIF_SET_LABEL[set]}${placements.length ? ` — ${placementsText(placements)}` : ''}`;
}
/** Tên theme bỏ tên phụ trong ngoặc: "Son Đỏ (Song Hỷ)" -> "Son Đỏ". */
const shortName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '');

export default function MotifPanel({ store, draft, resolved, peek }: MotifPanelProps) {
  const [live, setLive] = useState('');
  const preset = PRESETS[resolved.preset];
  const mo = draft.theme.motif;
  const custom = mo.set !== 'theme' || mo.placements !== 'theme' || mo.intensity !== 'theme';
  const r = resolved.motif;
  // giá trị đang hiển thị: nháp "Tự chọn" hoặc kết quả resolve (Theo theme)
  const curSet: MotifSet | 'none' = r.set;
  const curPl: MotifPlacement[] = r.placements.length ? r.placements : sanitizeMotifPlacements(mo.placements === 'theme' ? preset.motif.placements : mo.placements);
  const starred = (s: MotifSet) => preset.motif.set === s || preset.motifSuggest.includes(s);

  /** Ghi nháp + toast [Hoàn tác]; preview cuộn tới section đầu tiên có hoạ tiết. */
  const commit = (fn: (m: WeddingConfig['theme']['motif']) => WeddingConfig['theme']['motif'], text: string) => {
    const before = store.s.draft;
    const next: WeddingConfig = { ...before, theme: { ...before.theme, motif: fn({ ...before.theme.motif }) } };
    const pl = sanitizeMotifPlacements(next.theme.motif.placements === 'theme' ? PRESETS[next.theme.preset].motif.placements : next.theme.motif.placements);
    const focus = planMotif(planSections(next, resolved.divider), next, pl)[0]?.sectionId;
    store.update(() => next, '', focus);
    peek(text, [{ label: 'Hoàn tác', run: () => store.replaceDraft(before) }]);
  };
  /** "Tự chọn": bắt đầu từ cái đang thấy. */
  const startCustom = (patch: Partial<WeddingConfig['theme']['motif']> = {}) =>
    commit((m) => ({ ...m, set: curSet, placements: [...curPl], intensity: r.intensity, ...patch }), 'Hoạ tiết nền: tự chọn');
  const followTheme = () => commit((m) => ({ ...m, set: 'theme', placements: 'theme', intensity: 'theme' }), 'Hoạ tiết nền: theo theme');

  const pickSet = (s: MotifSet | 'none') => {
    if (custom) commit((m) => ({ ...m, set: s, placements: m.placements === 'theme' ? [...curPl] : m.placements, intensity: m.intensity === 'theme' ? r.intensity : m.intensity }), `Hoạ tiết nền: ${MOTIF_SET_LABEL[s]}`);
    else startCustom({ set: s });
  };
  const togglePlacement = (p: MotifPlacement, on: boolean) => {
    let next = curPl.filter((x) => x !== p);
    if (on) {
      const partner = CONFLICT[p];
      if (partner && next.includes(partner)) {
        next = next.filter((x) => x !== partner);
        setLive(`Đã bỏ "${MOTIF_PLACEMENT_LABEL[partner]}" vì không dùng cùng "${MOTIF_PLACEMENT_LABEL[p]}"`);
      } else setLive('');
      next = [...next, p];
    } else setLive('');
    if (!next.length) { setLive('Cần ít nhất 1 vị trí'); return; }
    commit((m) => ({ ...m, placements: next.slice(0, 2) }), `Vị trí hoạ tiết: ${placementsText(next.slice(0, 2))}`);
  };
  const setIntensity = (v: MotifIntensity) => commit((m) => ({ ...m, intensity: v }), `Độ đậm hoạ tiết: ${MOTIF_INTENSITY_LABEL[v]}`);
  const setMotion = (v: MotifMotion) => commit((m) => ({ ...m, motion: v }), `Chuyển động hoạ tiết: ${MOTIF_MOTION_LABEL[v]}`);

  const cards: (MotifSet | 'none')[] = ['none', ...MOTIF_SETS];
  const checkedIdx = Math.max(0, cards.indexOf(curSet));
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (d) {
      e.preventDefault();
      const el = (e.currentTarget as HTMLElement).parentElement?.children[(i + d + cards.length) % cards.length] as HTMLElement | undefined;
      el?.focus();
    } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pickSet(cards[i]!); }
  };
  const full = curPl.length >= 2;
  // T06: đủ 2 vị trí nhưng còn cặp loại trừ (Phủ nền ⟂ Sau tiêu đề) vẫn bật -> nói rõ nó sẽ thay vị trí nào
  const swapFrom = curPl.find((p) => { const q = CONFLICT[p]; return q !== undefined && !curPl.includes(q); });
  const swapTo = swapFrom ? CONFLICT[swapFrom] : undefined;
  const lowCap = r.cap < 0.1 && curPl.some((p) => MOTIF_BEHIND_TEXT.includes(p)) && curSet !== 'none';
  const t = resolved.tokens;

  return (
    <div class="mpanel" data-testid="motif-panel">
      <fieldset class="field">
        <legend>Hoạ tiết nền</legend>
        <label class="check"><input type="radio" name="mtf-mode" checked={!custom} onChange={followTheme} data-testid="motif-follow" />
          Theo theme · {shortName(preset.name)}: {motifSummary(preset.motif.set, preset.motif.set === 'none' ? [] : preset.motif.placements)}</label>
        <label class="check"><input type="radio" name="mtf-mode" checked={custom} onChange={() => startCustom()} data-testid="motif-custom" /> Tự chọn</label>
      </fieldset>

      <div class="mgrid" role="radiogroup" aria-label="Bộ hoạ tiết">
        {cards.map((s, i) => {
          const star = s !== 'none' && starred(s);
          const label = s === 'none' ? MOTIF_SET_LABEL.none : `${MOTIF_SET_LABEL[s]}${star ? `, hợp theme ${preset.name}` : ''}`;
          return (
            <div key={s} role="radio" aria-checked={curSet === s} tabIndex={i === checkedIdx ? 0 : -1} aria-label={label}
              class={`mcard${curSet === s ? ' is-on' : ''}`} style={{ '--mc-bg': t.bg, '--mc-accent': t.accent, '--mc-text': t.text } as Record<string, string>}
              onClick={() => pickSet(s)} onKeyDown={(e) => onKey(e, i)} data-testid={`motif-${s}`}>
              {s === 'none'
                ? <span class="mcard-none" aria-hidden="true">⊘</span>
                : <i class="mcard-img" aria-hidden="true" style={{ maskImage: `url(${medallionUrl(s)})`, WebkitMaskImage: `url(${medallionUrl(s)})` } as Record<string, string>} />}
              <span class="mcard-name">{MOTIF_SET_LABEL[s]}{star ? ' ★' : ''}</span>
            </div>
          );
        })}
      </div>

      <fieldset class="field" disabled={!custom || curSet === 'none'}>
        <legend>Vị trí (tối đa 2)</legend>
        <div class="mchecks">
          {MOTIF_PLACEMENTS.map((p) => {
            const on = curPl.includes(p);
            const partner = CONFLICT[p];
            const dis = !on && full && !(partner && curPl.includes(partner));
            return (
              <label key={p} class="check"><input type="checkbox" checked={on} disabled={dis}
                onChange={(e) => togglePlacement(p, (e.currentTarget as HTMLInputElement).checked)} data-testid={`motif-pl-${p}`} /> {MOTIF_PLACEMENT_LABEL[p]}</label>
            );
          })}
        </div>
        <p class="help">"Phủ nền" không dùng cùng "Sau tiêu đề" (hai lớp chồng nhau).</p>
        {full && custom && <p class="help" data-testid="motif-full">{swapFrom && swapTo
          ? `Đã chọn đủ 2 vị trí. Chọn "${MOTIF_PLACEMENT_LABEL[swapTo]}" sẽ thay cho "${MOTIF_PLACEMENT_LABEL[swapFrom]}".`
          : 'Đã chọn đủ 2 vị trí: bỏ chọn một vị trí để chọn vị trí khác.'}</p>}
        <p class="sr-only" aria-live="polite" data-testid="motif-live">{live}</p>
      </fieldset>

      <fieldset class="field seg" disabled={!custom || curSet === 'none'}>
        <legend>Độ đậm</legend>
        <div class="seg-row">
          {(['light', 'medium', 'strong'] as const).map((v) => (
            <label key={v} class={`seg-opt${r.intensity === v ? ' is-on' : ''}`}>
              <input type="radio" name="mtf-int" checked={r.intensity === v} onChange={() => setIntensity(v)} /><span>{MOTIF_INTENSITY_LABEL[v]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset class="field seg">
        <legend>Chuyển động</legend>
        <div class="seg-row">
          {(['auto', 'off'] as const).map((v) => (
            <label key={v} class={`seg-opt${mo.motion === v ? ' is-on' : ''}`}>
              <input type="radio" name="mtf-motion" checked={mo.motion === v} onChange={() => setMotion(v)} /><span>{MOTIF_MOTION_LABEL[v]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {lowCap && <p class="banner banner--warn" role="status" data-testid="motif-lowcap">⚠ Màu theme này sát ngưỡng tương phản: hoạ tiết sau chữ sẽ rất mờ. Nên dùng "Dải viền".</p>}
    </div>
  );
}
