/**
 * Album (design 8.7): thêm nhiều ảnh (hàng đợi tuần tự có tiến trình), sắp xếp kéo/nút ←→, xoá có Hoàn tác 5s,
 * mỗi ảnh dùng ImageSlot. Ảnh đã xoá ở lần xuất bản gần nhất chỉ lấy lại bằng Khôi phục cả trang.
 */
import { useRef, useState } from 'preact/hooks';
import { groupById } from '@shared/config/schema-meta';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import { GroupForm } from '../form';
import { ImageSlot, ingestImage } from '../../media/image-slot';
import { ACCEPT_IMAGES } from '../../media/image-pipeline';
import { Spinner, toast } from '../../ui/ui';

export default function AlbumRoute({ store, go }: RouteProps) {
  const images = useStore(store, (s) => s.draft.content.album.images);
  useStore(store, (s) => s.blobUrls);
  const fileRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<{ name: string; state: 'wait' | 'run' | 'ok' | 'err'; msg?: string }[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const setImages = (n: typeof images) => store.update((c) => ({ ...c, content: { ...c.content, album: { ...c.content.album, images: n } } }), '', 'album');

  const addFiles = async (files: File[]) => {
    const q = files.map((f) => ({ name: f.name, state: 'wait' as const }));
    setQueue(q);
    for (let i = 0; i < files.length; i++) {
      setQueue((cur) => cur.map((x, k) => (k === i ? { ...x, state: 'run' } : x)));
      try {
        const idx = store.s.draft.content.album.images.length;
        const { ref } = await ingestImage(store, files[i]!, 'album', `content.album.images[${idx}]`, { name: files[i]!.name, alt: '' });
        store.update((c) => ({ ...c, content: { ...c.content, album: { ...c.content.album, images: [...c.content.album.images, ref] } } }), '', 'album');
        setQueue((cur) => cur.map((x, k) => (k === i ? { ...x, state: 'ok' } : x)));
      } catch (e) {
        setQueue((cur) => cur.map((x, k) => (k === i ? { ...x, state: 'err', msg: e instanceof Error ? e.message : 'Lỗi' } : x)));
      }
    }
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const n = [...images];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setImages(n);
  };
  const remove = (i: number) => {
    const removed = images[i]!;
    setImages(images.filter((_, k) => k !== i));
    toast(`Đã xoá ảnh ${i + 1} khỏi album (bản nháp)`, { ms: 5000, action: { label: 'Hoàn tác', run: () => { const cur = [...store.s.draft.content.album.images]; cur.splice(i, 0, removed); setImages(cur); } } });
  };

  return (
    <GroupForm store={store} group={groupById('album')!} go={go}>
      <h2>Ảnh album ({images.length})</h2>
      <button type="button" class="btn btn-primary" onClick={() => fileRef.current?.click()}>+ Thêm ảnh</button>
      <input ref={fileRef} type="file" multiple accept={ACCEPT_IMAGES} class="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={(e) => { const fs = Array.from((e.currentTarget as HTMLInputElement).files ?? []); (e.currentTarget as HTMLInputElement).value = ''; void addFiles(fs); }} />
      {queue.length > 0 && (
        <ul class="queue" aria-live="polite">
          {queue.map((q, i) => <li key={i}>{q.state === 'run' ? <Spinner /> : q.state === 'ok' ? '✓' : q.state === 'err' ? '✕' : '◌'} {q.name}{q.msg ? ` - ${q.msg}` : ''}</li>)}
        </ul>
      )}
      <ul class="album-grid">
        {images.map((im, i) => (
          <li key={`${im.src}-${i}`} class="album-item">
            <button type="button" class="album-thumb" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <img src={store.urlOf(im.thumb ?? im.src)} alt={im.alt || `Ảnh ${i + 1}`} loading="lazy" width={im.w || undefined} height={im.h || undefined} />
            </button>
            <div class="btn-row">
              <button type="button" class="icon-btn" aria-label={`Dời ảnh ${i + 1} sang trái`} disabled={i === 0} onClick={() => move(i, -1)}>←</button>
              <button type="button" class="icon-btn" aria-label={`Dời ảnh ${i + 1} sang phải`} disabled={i === images.length - 1} onClick={() => move(i, 1)}>→</button>
              <button type="button" class="icon-btn" aria-label={`Xoá ảnh ${i + 1}`} onClick={() => remove(i)}>🗑</button>
            </div>
          </li>
        ))}
      </ul>
      {open !== null && images[open] && (
        <ImageSlot store={store} path={`content.album.images[${open}]`} kind="album" label={`Ảnh ${open + 1}`} section="album" onRemove={() => { remove(open); setOpen(null); }} />
      )}
    </GroupForm>
  );
}
