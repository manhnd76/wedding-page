/**
 * Khối "Hiện nội dung khi cuộn" của trang Hiệu ứng (design 8.13; v4a-2a B1: design-v4a-2a §5.2, solution-v4a-2a.md 4.1).
 * Gói chính (chip) + "Cách áp dụng" (xen kẽ tự động / giống nhau) + "Từng phần" (ghim gói cho từng section, nút Xem).
 * Route `effects` tải lười -> không tăng bundle admin ban đầu. Không lộ mã thô (A07): mọi chữ qua nhãn tiếng Việt.
 * Deep link từ "Các phần & thứ tự": `sessionStorage['wp_fx_focus_v1'] = 'reveal:<id>' | 'reveal-sections'`.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { CAPABILITIES } from '@shared/capabilities';
import type { RevealMode, RevealStyle } from '@shared/config/enums';
import { REVEAL_LABEL, REVEAL_MODE_LABEL, followThemeLabel } from '@shared/labels';
import { REVEAL_TIER, planOf } from '@shared/reveal-plan';
import { SECTION_META, planSections } from '@shared/sections/meta';
import { groupById } from '@shared/config/schema-meta';
import { Segmented, toast } from '../../ui/ui';
import { resolvedOf, type FxBlockProps } from './ctx';
import './reveal-block.css';

export const FX_FOCUS_KEY = 'wp_fx_focus_v1';

export function RevealBlock({ fx }: FxBlockProps) {
  const { sug, set, store, preview, peek, draft, r } = fx;
  const e = draft.effects;
  const rv = r.reveal;
  const A = rv.style;
  const themeReveal = resolvedOf('revealStyle', sug.revealStyle);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDetailsElement>(null);

  // deep link: mở "Từng phần", cuộn + focus đúng select
  useEffect(() => {
    let k: string | null = null;
    try { k = sessionStorage.getItem(FX_FOCUS_KEY); sessionStorage.removeItem(FX_FOCUS_KEY); } catch { /* ignore */ }
    if (!k?.startsWith('reveal')) return;
    setOpen(true);
    requestAnimationFrame(() => {
      const el = k!.startsWith('reveal:') ? document.getElementById(`rv-sec-${k!.slice(7)}`) : box.current;
      el?.scrollIntoView({ block: 'center' });
      if (el instanceof HTMLSelectElement) el.focus();
    });
  }, []);

  const plan = planOf(draft, rv);
  const list = planSections(draft, 'none');
  const nameOf = (type: string) => groupById(type)?.title ?? SECTION_META[type as keyof typeof SECTION_META]?.label ?? type;
  const pins = e.reveal.sections ?? {};
  const pinned = list.filter((p) => pins[p.item.id]).length;
  const other = list.filter((p) => plan[p.item.id] && plan[p.item.id]!.pack !== A).length;
  const harmony = rv.harmony.map((p) => REVEAL_LABEL[p]).join(' · ');
  const mode: RevealMode = e.reveal.mode === 'uniform' ? 'uniform' : 'auto';

  const replay = (id: string, name: string, pack: RevealStyle) => {
    setTimeout(() => preview.replay(`reveal:${id}`, `Hiện nội dung · ${name} (${REVEAL_LABEL[pack]})`), 0);
    peek(`Đã chọn: ${name} · ${REVEAL_LABEL[pack]}`);
  };
  const setPins = (next: Record<string, RevealStyle>) =>
    store.update((c) => ({ ...c, effects: { ...c.effects, reveal: { ...c.effects.reveal, sections: next } } }));
  const pick = (id: string, name: string, v: string) => {
    const { [id]: _, ...rest } = pins;
    setPins(v ? { ...rest, [id]: v as RevealStyle } : rest);
    // gói phần đó sẽ dùng sau khi đổi (tự động/gói chính khi bỏ chọn riêng)
    replay(id, name, v ? (v as RevealStyle) : planOf(draft, { ...rv, pins: rest })[id]?.pack ?? A);
  };
  const clearAll = () => {
    const prev = pins;
    setPins({});
    toast(`Đã bỏ chọn riêng ở ${pinned} phần`, { action: { label: 'Hoàn tác', run: () => setPins(prev) } });
  };

  return (
    <>
      <h2>Hiện nội dung khi cuộn</h2>
      <fieldset class="field">
        <legend>Gói chính</legend>
        <div class="chips" role="radiogroup" aria-label="Gói hiện nội dung">
          {(['theme', ...CAPABILITIES.revealStyle.supported] as ('theme' | RevealStyle)[]).map((v) => {
            const label = v === 'theme' ? followThemeLabel(REVEAL_LABEL, sug.revealStyle, themeReveal) : REVEAL_LABEL[v];
            return (
              <button key={v} type="button" role="radio" aria-checked={e.reveal.style === v} class="chip"
                onClick={() => set('effects.reveal.style', v, 'reveal', 'Hiện nội dung · 3 phần')}>
                {label}{e.reveal.style === v ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Segmented legend="Cách áp dụng" name="rvmode" value={mode}
        options={(['auto', 'uniform'] as const).map((v) => ({ value: v, label: REVEAL_MODE_LABEL[v] }))}
        onChange={(v) => set('effects.reveal.mode', v, 'reveal', 'Hiện nội dung · 3 phần')} />
      <p class="help" data-testid="rv-mode-help">
        {mode === 'auto'
          ? `Tiêu đề và ảnh ở các phần nổi bật đổi kiểu trong bộ ${harmony}. Phần thông tin (Sự kiện, Mừng cưới, Xác nhận…) giữ ${REVEAL_LABEL[A]} cho dễ đọc.`
          : `Mọi phần dùng ${REVEAL_LABEL[A]}. Có thể chọn riêng vài phần bên dưới.`}
      </p>
      {e.intensity === 'low' && <p class="help rv-level">Ở cấp Nhẹ, mọi phần chỉ mờ dần; xen kẽ và chọn riêng chỉ thấy từ cấp Vừa.</p>}
      {e.intensity === 'off' && <p class="help rv-level">Cấp Tắt: nội dung hiện ngay, không có hiệu ứng.</p>}
      <button type="button" class="btn btn-secondary" onClick={() => preview.replay('reveal', 'Hiện nội dung · 3 phần')}>↻ Xem thử 3 phần</button>
      <details id="reveal-sections" class="rv-secs" ref={box} open={open} onToggle={(ev) => setOpen((ev.currentTarget as HTMLDetailsElement).open)}>
        <summary data-testid="rv-summary">Từng phần · {other} phần khác gói chính · {pinned} phần chọn riêng</summary>
        <ol class="rv-list">
          {list.map((p) => {
            const id = p.item.id;
            const name = nameOf(p.item.type);
            const pin = pins[id];
            const auto = planOf(draft, { ...rv, pins: Object.fromEntries(Object.entries(rv.pins).filter(([k]) => k !== id)) })[id]?.pack ?? A;
            const info = !pin && mode === 'auto' && REVEAL_TIER[p.item.type] === 'functional';
            return (
              <li key={id} class="rv-row" data-testid={`rv-row-${id}`}>
                <p class="rv-name">
                  {p.number && <span class="rv-num">{p.number}</span>}{name}
                  {pin && <span class="badge">Chọn riêng</span>}
                  {info && <span class="badge badge--muted" title="giữ gói chính cho dễ đọc">Phần thông tin</span>}
                </p>
                <div class="rv-ctl">
                  <select id={`rv-sec-${id}`} class="input" aria-label={`Kiểu hiện của phần ${name}`} value={pin ?? ''}
                    onChange={(ev) => pick(id, name, (ev.currentTarget as HTMLSelectElement).value)}>
                    <option value="">{mode === 'auto' ? `Tự động · ${REVEAL_LABEL[auto]}` : `Theo gói chính · ${REVEAL_LABEL[A]}`}</option>
                    {(CAPABILITIES.revealStyle.supported as readonly RevealStyle[]).map((v) => <option key={v} value={v}>{REVEAL_LABEL[v]}</option>)}
                  </select>
                  <button type="button" class="btn btn-secondary rv-see" aria-label={`Xem thử kiểu hiện phần ${name}`}
                    onClick={() => replay(id, name, plan[id]?.pack ?? A)}>▶ Xem</button>
                </div>
              </li>
            );
          })}
        </ol>
        {pinned > 0 && <button type="button" class="btn btn-link" onClick={clearAll}>Bỏ chọn riêng ở mọi phần ({pinned})</button>}
        {draft.sections.items.length > list.length && (
          <p class="help">{draft.sections.items.length - list.length} phần đang tắt hoặc chưa có nội dung không có trong danh sách.</p>
        )}
      </details>
    </>
  );
}
