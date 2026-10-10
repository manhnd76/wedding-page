/**
 * "Các phần & thứ tự" (design 8.6): tay cầm kéo (giữ 200ms trên touch), luôn có nút ↑↓ (WCAG 2.5.7),
 * bàn phím (Space nhấc, mũi tên di chuyển, Space thả, thông báo aria-live). Hero ghim đầu, footer ghim cuối.
 */
import { useRef, useState } from 'preact/hooks';
import type { SectionItem } from '@shared/config/types';
import { SECTION_META, planSections } from '@shared/sections/meta';
import { DIVIDERS } from '@shared/config/enums';
import { DIVIDER_LABEL, REVEAL_LABEL } from '@shared/labels';
import { Icon } from '../../ui/icons';
import { CAPABILITIES } from '@shared/capabilities';
import type { EditorStore } from '../../state/store';
import { useStore } from '../../state/store';
import { groupById } from '@shared/config/schema-meta';
import { Select, Toggle } from '../../ui/ui';


/** Di chuyển phần tử giữa (không đụng hero/footer). */
export function moveItem(items: SectionItem[], from: number, to: number): SectionItem[] {
  const first = items[0]?.type === 'hero' ? 1 : 0;
  const last = items[items.length - 1]?.type === 'footer' ? items.length - 2 : items.length - 1;
  if (from < first || from > last) return items;
  const t = Math.max(first, Math.min(last, to));
  if (t === from) return items;
  const n = [...items];
  const [x] = n.splice(from, 1);
  n.splice(t, 0, x!);
  return n;
}

export function SectionsRoute(p: { store: EditorStore; go: (r: string) => void }) {
  const { store } = p;
  const draft = useStore(store, (s) => s.draft);
  const items = draft.sections.items;
  const [lifted, setLifted] = useState<number | null>(null);
  const [live, setLive] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const plan = planSections(draft, 'none');
  // v4a-2a: ghim kiểu hiện theo phần -> nhãn + deep link sang "Hiệu ứng" (khối reveal đọc khoá rồi xoá)
  const pins = draft.effects.reveal.sections ?? {};
  const toFx = (k: string) => { try { sessionStorage.setItem('wp_fx_focus_v1', k); } catch { /* ignore */ } p.go('effects'); };
  const numberOf = new Map(plan.map((x) => [x.item.id, x.number]));
  /** cùng tên với mục ở thanh bên (vd "Ảnh bìa (Hero)") - A22 */
  const label = (it: SectionItem) => groupById(it.type)?.title ?? SECTION_META[it.type]?.label ?? it.type;

  const setItems = (n: SectionItem[]) => store.update((c) => ({ ...c, sections: { ...c.sections, items: n } }), '', 'sections');
  const move = (i: number, to: number, announce = true) => {
    const n = moveItem(items, i, to);
    if (n === items) return i;
    setItems(n);
    const ni = n.indexOf(items[i]!);
    if (announce) setLive(`${label(items[i]!)}: vị trí ${ni + 1} trên ${n.length}`);
    return ni;
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (lifted === null) { setLifted(i); setLive(`Đã nhấc ${label(items[i]!)}. Dùng mũi tên lên xuống để di chuyển, Space để thả.`); }
      else { setLifted(null); setLive(`Đã thả ${label(items[i]!)} ở vị trí ${i + 1}.`); }
    } else if (lifted !== null && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const ni = move(i, i + (e.key === 'ArrowUp' ? -1 : 1));
      setLifted(ni);
      requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('.sec-handle')[ni]?.focus());
    } else if (e.key === 'Escape' && lifted !== null) { setLifted(null); setLive('Đã huỷ di chuyển.'); }
  };

  // kéo thả bằng pointer (chuột: ngay; chạm: giữ 200ms để tránh nhầm với cuộn)
  const onPointerDown = (e: PointerEvent, i: number) => {
    const el = e.currentTarget as HTMLElement;
    const start = () => { setDragIdx(i); el.setPointerCapture(e.pointerId); };
    if (e.pointerType === 'mouse') start();
    else holdTimer.current = setTimeout(start, 200);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragIdx === null) { if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; } return; }
    e.preventDefault();
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('.sec-row') ?? []);
    const over = rows.findIndex((r) => { const b = r.getBoundingClientRect(); return e.clientY >= b.top && e.clientY <= b.bottom; });
    if (over >= 0 && over !== dragIdx) setDragIdx(move(dragIdx, over, false));
  };
  const onPointerUp = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (dragIdx !== null) setLive(`Đã thả ${label(items[dragIdx]!)} ở vị trí ${dragIdx + 1}.`);
    setDragIdx(null);
  };

  return (
    <section>
      <h1>Các phần &amp; thứ tự</h1>
      <p class="muted">Kéo để sắp xếp. Phần đang tắt sẽ không hiển thị với khách.</p>
      <ol class="sec-list" ref={listRef} data-testid="sections-list">
        {items.map((it, i) => {
          const meta = SECTION_META[it.type];
          const pinned = it.type === 'hero' || it.type === 'footer';
          const empty = it.enabled && meta?.isEmpty(draft);
          const num = numberOf.get(it.id);
          return (
            <li key={it.id} class={`sec-row${it.enabled ? '' : ' is-off'}${lifted === i || dragIdx === i ? ' is-lifted' : ''}`} data-testid={`sec-${it.id}`}>
              {pinned ? <span class="sec-lock" aria-hidden="true"><Icon name="lock" /></span> : (
                <button type="button" class="sec-handle" aria-label={`Sắp xếp ${label(it)}`} aria-pressed={lifted === i}
                  onKeyDown={(e) => onKey(e, i)} onPointerDown={(e) => onPointerDown(e, i)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}><Icon name="grip" /></button>
              )}
              <span class="sec-num">{num ?? '--'}</span>
              <span class="sec-name">
                {label(it)}{pinned ? <span class="muted"> · luôn ở {it.type === 'hero' ? 'đầu' : 'cuối'}</span> : ''}
                {empty && <span class="badge badge--warn"> ⚠ chưa có nội dung, sẽ tự ẩn</span>}
                {pins[it.id] && <> <button type="button" class="btn btn-link sec-pin" onClick={() => toFx(`reveal:${it.id}`)}>Hiện: {REVEAL_LABEL[pins[it.id]!]}</button></>}
              </span>
              {!pinned && <>
                <button type="button" class="icon-btn" aria-label={`Đưa ${label(it)} lên`} disabled={i <= 1} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
                <button type="button" class="icon-btn" aria-label={`Đưa ${label(it)} xuống`} disabled={i >= items.length - 2} onClick={() => move(i, i + 1)}><Icon name="down" /></button>
              </>}
              <label class="toggle toggle--sm">
                <input type="checkbox" role="switch" checked={it.enabled} aria-label={`Hiện ${label(it)}`} data-testid={`sec-toggle-${it.id}`}
                  onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, enabled: (e.currentTarget as HTMLInputElement).checked } : x)))} />
                <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb" /></span>
                <span class="toggle-label">{it.enabled ? 'Bật' : 'Tắt'}</span>
              </label>
              {groupById(it.type) && <button type="button" class="btn btn-link" onClick={() => p.go(it.type)}>Sửa nội dung</button>}
            </li>
          );
        })}
      </ol>
      <p class="sr-only" aria-live="assertive">{live}</p>
      <button type="button" class="btn btn-link" onClick={() => toFx('reveal-sections')}>Kiểu hiện khi cuộn của từng phần ›</button>
      <Toggle label="Hiện số thứ tự (01, 02…)" checked={draft.sections.showNumbers} onChange={(v) => store.setPath('sections.showNumbers', v)} />
      <Select label="Đường phân cách giữa các phần" value={draft.sections.divider}
        options={[{ value: 'theme', label: 'Theo theme' }, ...DIVIDERS.filter((d) => (CAPABILITIES.divider.supported as readonly string[]).includes(d)).map((d) => ({ value: d, label: DIVIDER_LABEL[d] }))]}
        onChange={(v) => store.setPath('sections.divider', v)} />
    </section>
  );
}
