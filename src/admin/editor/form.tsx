/**
 * Form sinh từ schema-meta (solution 6 "form/", design 8.11).
 * Mỗi field ghi thẳng vào nháp (store.setPath) -> autosave + preview cuộn tới section.
 */
import type { ComponentChildren } from 'preact';
import type { AnyField, FieldMeta, FormGroup, ListMeta } from '@shared/config/schema-meta';
import { BANKS } from '@shared/vietqr/banks';
import type { EditorStore } from '../state/store';
import { useStore } from '../state/store';
import { getAt, setAt } from '../draft/paths';
import { DateTimeField, NumberField, Select, TextArea, TextField, Toggle, toast } from '../ui/ui';
import { ImageSlot } from '../media/image-slot';

const join = (base: string, key: string) => (base ? `${base}.${key}` : key);

export function GroupForm(p: { store: EditorStore; group: FormGroup; go: (r: string) => void; children?: ComponentChildren }) {
  const g = p.group;
  return (
    <section class="form" aria-labelledby={`g-${g.id}`}>
      <h1 id={`g-${g.id}`}>{g.title}</h1>
      {g.intro && <p class="muted">{g.intro}</p>}
      {g.section && g.section !== 'cover' && <SectionHint store={p.store} type={g.section} go={p.go} />}
      {g.fields.map((f) => <Field key={f.key} store={p.store} f={f} path={join(g.base, f.key)} section={g.section ?? ''} />)}
      {p.children}
    </section>
  );
}

function SectionHint(p: { store: EditorStore; type: string; go: (r: string) => void }) {
  const item = useStore(p.store, (s) => s.draft.sections.items.find((x) => x.type === p.type));
  if (!item || item.enabled) return null;
  return <p class="banner banner--info">Section này đang tắt nên khách không thấy. <button type="button" class="btn btn-link" onClick={() => p.go('sections')}>Bật trong Sections</button></p>;
}

export function Field(p: { store: EditorStore; f: AnyField; path: string; section: string }) {
  const { store, f, path } = p;
  const v = useStore(store, (s) => getAt(s.draft, path));
  const set = (x: unknown) => store.setPath(path, x, p.section || undefined);
  if (f.type === 'list') return <ListField store={store} f={f} path={path} section={p.section} />;
  const m = f as FieldMeta;
  const common = { label: m.label, help: m.help };
  switch (m.type) {
    case 'text': case 'url': case 'tel':
      return <TextField {...common} value={String(v ?? '')} onInput={set} placeholder={m.placeholder} lang={m.en ? 'en' : undefined}
        type={m.type === 'text' ? 'text' : m.type} inputMode={m.type === 'tel' ? 'tel' : m.type === 'url' ? 'url' : undefined}
        error={m.type === 'url' && v && !/^https:\/\//.test(String(v)) ? 'Cần bắt đầu bằng https://' : null} testId={`f-${path}`} />;
    case 'textarea':
      return <TextArea {...common} value={String(v ?? '')} onInput={set} placeholder={m.placeholder} testId={`f-${path}`} />;
    case 'toggle':
      return <Toggle {...common} checked={!!v} onChange={set} testId={`f-${path}`} />;
    case 'select':
      return <Select {...common} value={String(v ?? '')} onChange={set} options={m.options ?? []} />;
    case 'number':
      return <NumberField {...common} value={Number(v ?? 0)} onChange={set} min={m.min} max={m.max} />;
    case 'datetime':
      return <DateTimeField {...common} value={(v as string | null) ?? null} onChange={set} allowEmpty={path.endsWith('targetAt')} />;
    case 'date': case 'time':
      return <TextField {...common} type={m.type} value={String(v ?? '')} onInput={set} />;
    case 'image':
      return <ImageSlot store={store} path={path} kind={m.slotKind ?? 'other'} label={m.label} section={p.section} />;
    case 'strings':
      return <StringsField store={store} label={m.label} path={path} />;
    case 'bank': {
      const binPath = path.replace(/\.bank$/, '.bankBin');
      const bin = String(getAt(store.s.draft, binPath) ?? '');
      return <Select label={m.label} value={bin} options={[{ value: '', label: '- Chọn ngân hàng -' }, ...BANKS.map((b) => ({ value: b.bin, label: `${b.short} - ${b.name}` }))]}
        onChange={(nb) => { const b = BANKS.find((x) => x.bin === nb); store.update((c) => setTwo(c, path, b?.short ?? '', binPath, nb), path, p.section || undefined); }} />;
    }
    default:
      return null;
  }
}

function setTwo<T>(c: T, p1: string, v1: unknown, p2: string, v2: unknown): T {
  return setAt(setAt(c, p1, v1), p2, v2);
}

function ListField(p: { store: EditorStore; f: ListMeta; path: string; section: string }) {
  const { store, f, path } = p;
  const list = useStore(store, (s) => (getAt(s.draft, path) as Record<string, unknown>[] | undefined) ?? []);
  const setList = (next: unknown[]) => store.update((c) => setAt(c, path, next), '', p.section || undefined);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setList(n);
  };
  const remove = (i: number) => {
    const removed = list[i];
    setList(list.filter((_, k) => k !== i));
    toast(`Đã xoá ${f.itemTitle.toLowerCase()} ${i + 1}`, { action: { label: 'Hoàn tác', run: () => { const cur = (getAt(store.s.draft, path) as unknown[]) ?? []; const n = [...cur]; n.splice(i, 0, removed); store.update((c) => setAt(c, path, n)); } } });
  };
  const add = () => {
    const t = JSON.parse(JSON.stringify(f.template)) as Record<string, unknown>;
    if ('id' in t) t.id = `${f.itemTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
    setList([...list, t]);
  };
  return (
    <fieldset class="list-field">
      <legend>{f.label}</legend>
      {list.map((item, i) => {
        const title = String(item[f.titleKey] ?? '').trim() || `${f.itemTitle} ${i + 1}`;
        return (
          <details key={i} class="card" open={list.length <= 2}>
            <summary class="card-head">
              <span class="card-title">{title}</span>
              <span class="card-actions">
                <button type="button" class="icon-btn" aria-label={`Đưa ${title} lên`} disabled={i === 0} onClick={(e) => { e.preventDefault(); move(i, -1); }}>↑</button>
                <button type="button" class="icon-btn" aria-label={`Đưa ${title} xuống`} disabled={i === list.length - 1} onClick={(e) => { e.preventDefault(); move(i, 1); }}>↓</button>
                <button type="button" class="icon-btn" aria-label={`Xoá ${title}`} onClick={(e) => { e.preventDefault(); remove(i); }}>🗑</button>
              </span>
            </summary>
            <div class="card-body">
              {f.fields.map((sf) => <Field key={sf.key} store={store} f={sf} path={`${path}[${i}].${sf.key}`} section={p.section} />)}
            </div>
          </details>
        );
      })}
      {(!f.max || list.length < f.max) && <button type="button" class="btn btn-secondary" onClick={add}>+ Thêm {f.itemTitle.toLowerCase()}</button>}
    </fieldset>
  );
}

function StringsField(p: { store: EditorStore; label: string; path: string }) {
  const list = useStore(p.store, (s) => (getAt(s.draft, p.path) as string[] | undefined) ?? []);
  const set = (n: string[]) => p.store.setPath(p.path, n);
  return (
    <fieldset class="list-field">
      <legend>{p.label}</legend>
      {list.map((x, i) => (
        <div key={i} class="input-row">
          <input class="input" value={x} aria-label={`${p.label} ${i + 1}`} onInput={(e) => { const n = [...list]; n[i] = (e.currentTarget as HTMLInputElement).value; set(n); }} />
          <button type="button" class="icon-btn" aria-label={`Xoá ${p.label} ${i + 1}`} onClick={() => set(list.filter((_, k) => k !== i))}>🗑</button>
        </div>
      ))}
      <button type="button" class="btn btn-secondary" onClick={() => set([...list, ''])}>+ Thêm</button>
    </fieldset>
  );
}
