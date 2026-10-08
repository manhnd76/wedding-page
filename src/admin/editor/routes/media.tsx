/** Ảnh: thư viện mọi slot ảnh (design 8.3) - dùng chung ImageSlot với form. */
import { FORM_GROUPS, type FieldMeta } from '@shared/config/schema-meta';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import { getAt } from '../../draft/paths';
import { ImageSlot } from '../../media/image-slot';

interface SlotDef { path: string; label: string; kind: NonNullable<FieldMeta['slotKind']>; section: string }

export default function MediaRoute({ store, go }: RouteProps) {
  const draft = useStore(store, (s) => s.draft);
  const slots: SlotDef[] = [];
  for (const g of FORM_GROUPS) {
    for (const f of g.fields) {
      const base = g.base ? `${g.base}.` : '';
      if (f.type === 'image') slots.push({ path: `${base}${f.key}`, label: `${g.title} › ${f.label}`, kind: f.slotKind ?? 'other', section: g.section ?? '' });
      if (f.type === 'list') {
        const list = (getAt(draft, `${base}${f.key}`) as unknown[] | undefined) ?? [];
        list.forEach((_, i) => f.fields.filter((x) => x.type === 'image').forEach((x) =>
          slots.push({ path: `${base}${f.key}[${i}].${x.key}`, label: `${g.title} › ${f.itemTitle} ${i + 1} › ${x.label}`, kind: x.slotKind ?? 'other', section: g.section ?? '' })));
      }
    }
  }
  return (
    <section>
      <h1>Ảnh</h1>
      <p class="muted">Mọi ô ảnh của thiệp. Thay ảnh, hoàn tác thay đổi nháp hay lấy lại ảnh trước đó đều chỉ đổi <strong>bản nháp</strong>; khách chỉ thấy sau khi Xuất bản.</p>
      <p><button type="button" class="btn btn-secondary" onClick={() => go('album')}>Album ({draft.content.album.images.length} ảnh) ›</button></p>
      {slots.map((s) => <ImageSlot key={s.path} store={store} path={s.path} kind={s.kind} label={s.label} section={s.section} compact />)}
    </section>
  );
}
