/**
 * ImageSlot (design 8.7 v3): 3 khối - Trong bản nháp / Đang xuất bản / Ảnh trước lần xuất bản (từ bản sao lưu).
 * Mọi nút là thao tác trên NHÁP; khôi phục cả trang chỉ ở Sao lưu/Khôi phục.
 */
import type { ComponentType } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ImageRef } from '@shared/config/types';
import type { ImageSlotKind } from '@shared/config/schema-meta';
import { sha256Hex } from '@shared/storage/bytes';
import { srcOfRepoPath } from '@shared/storage/manifest';
import type { EditorStore } from '../state/store';
import { useStore } from '../state/store';
import { getAt, sameJson } from '../draft/paths';
import { imageRefFromBackupConfig, previousImageEntry } from '../draft/ops';
import { ACCEPT_IMAGES, MAX_INPUT_BYTES, SLOT_SPECS, processImage, type ProcessedImage, type Rect } from './image-pipeline';
import { Modal, Spinner, TextField, toast } from '../ui/ui';
import { fmtTime } from '../editor/util';
import type { CropProps } from './crop';

export interface CropResult { crop: Rect; rotate: 0 | 90 | 180 | 270 }

let CropLazy: ComponentType<CropProps> | null = null;

/** Xử lý 1 file và đưa vào nháp (dùng cả cho album). */
export async function ingestImage(store: EditorStore, file: Blob, kind: ImageSlotKind, slot: string, opts: { crop?: Rect; rotate?: 0 | 90 | 180 | 270; name?: string; alt?: string; prev?: ImageRef } = {}): Promise<{ ref: NonNullable<ImageRef>; processed: ProcessedImage }> {
  const pr = await processImage(file, kind, { ...(opts.crop ? { crop: opts.crop } : {}), ...(opts.rotate ? { rotate: opts.rotate } : {}), ...(opts.name ? { name: opts.name } : {}) });
  await store.addBlob({ key: pr.sha256, blob: pr.blob, mime: pr.blob.type, src: pr.path, slot, origin: 'upload' });
  if (pr.thumb) await store.addBlob({ key: pr.thumb.sha256, blob: pr.thumb.blob, mime: pr.thumb.blob.type, src: pr.thumb.path, slot, origin: 'upload' });
  const ref: NonNullable<ImageRef> = {
    src: pr.path, w: pr.w, h: pr.h, alt: opts.alt ?? opts.prev?.alt ?? '', dominantColor: pr.dominantColor, updatedAt: new Date().toISOString(),
    ...(pr.thumb ? { thumb: pr.thumb.path } : {}), ...(pr.lqip ? { lqip: pr.lqip } : {}),
    ...(opts.prev?.focalPoint ? { focalPoint: opts.prev.focalPoint } : {}),
  };
  return { ref, processed: pr };
}

function altSuggestion(store: EditorStore): string {
  const c = store.s.draft.content.couple;
  const a = c.groom.shortName || c.groom.fullName;
  const b = c.bride.shortName || c.bride.fullName;
  return a && b ? `Ảnh cưới của ${a} và ${b}` : 'Ảnh cưới';
}

export function ImageSlot(p: { store: EditorStore; path: string; kind: ImageSlotKind; label: string; section?: string; compact?: boolean; onRemove?: () => void }) {
  const { store, path, kind } = p;
  const draft = useStore(store, (s) => (getAt(s.draft, path) as ImageRef | undefined) ?? null);
  const pub = useStore(store, (s) => (getAt(s.published, path) as ImageRef | undefined) ?? null);
  const manifest = useStore(store, (s) => s.manifest);
  useStore(store, (s) => s.blobUrls);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [focalMode, setFocalMode] = useState(false);
  const [takeOpen, setTakeOpen] = useState(false);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [taking, setTaking] = useState<string | null>(null);
  const changed = !sameJson(draft, pub);
  const prev = previousImageEntry(manifest, path, pub?.src ?? null);
  const spec = SLOT_SPECS[kind];
  const section = p.section || undefined;

  // thumbnail ảnh trong bản sao lưu (tải khi slot có mục backup)
  useEffect(() => {
    if (!prev?.backupPath) { setPrevUrl(null); return; }
    let url: string | null = null;
    let alive = true;
    void store.s.adapter.readAsset(prev.backupPath).then((b) => { if (alive) { url = URL.createObjectURL(b); setPrevUrl(url); } }).catch(() => setPrevUrl(null));
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [prev?.backupPath]);

  const run = async (file: File, crop?: CropResult) => {
    setBusy('Đang nén ảnh…');
    setErr(null);
    try {
      const before = draft;
      const { ref, processed } = await ingestImage(store, file, kind, path, { ...(crop ?? {}), name: file.name, prev: draft, alt: draft?.alt || altSuggestion(store) });
      store.setPath(path, ref, section);
      setSummary(processed.summary);
      toast('Đã thay ảnh trong bản nháp. Khách chỉ thấy sau khi Xuất bản', { action: { label: 'Hoàn tác', run: () => store.setPath(path, before, section) } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Không xử lý được ảnh này');
    } finally {
      setBusy(null);
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_INPUT_BYTES) { setErr('Ảnh lớn hơn 20MB. Hãy chọn ảnh nhỏ hơn.'); return; }
    if (spec.aspect) {
      if (!CropLazy) CropLazy = (await import('./crop')).CropDialog;
      setCropFile(f);
    } else void run(f);
  };

  const revert = () => {
    const redo = store.revertSlot(path);
    toast('Đã quay về ảnh đang xuất bản', { action: { label: 'Làm lại', run: redo } });
  };

  const takePrevious = async () => {
    if (!prev?.backupPath) return;
    setTaking('Đang lấy ảnh…');
    try {
      const blob = await store.s.adapter.readAsset(prev.backupPath);
      const key = await sha256Hex(new Uint8Array(await blob.arrayBuffer()));
      const src = srcOfRepoPath(prev.path);
      await store.addBlob({ key, blob, mime: blob.type, src, slot: path, origin: 'backup' });
      const ref = imageRefFromBackupConfig(await store.readBackupConfig(), prev);
      store.setPath(path, ref, section);
      setTakeOpen(false);
      toast('Đã đưa ảnh trước đó vào bản nháp. Khách chỉ thấy sau khi Xuất bản.');
    } catch {
      setTaking('Chưa lấy được ảnh, thử lại');
      return;
    }
    setTaking(null);
  };

  const onFocal = (e: MouseEvent) => {
    if (!focalMode || !draft) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const fp = { x: Math.round(((e.clientX - r.left) / r.width) * 100) / 100, y: Math.round(((e.clientY - r.top) / r.height) * 100) / 100 };
    store.setPath(`${path}.focalPoint`, fp, section);
  };

  const thumb = (ref: ImageRef, cls = 'slot-thumb') => ref?.src
    ? <img class={cls} src={store.urlOf(ref.thumb ?? ref.src)} alt="" width={ref.w || undefined} height={ref.h || undefined} loading="lazy" />
    : <span class={`${cls} slot-empty`} aria-hidden="true">Chưa có ảnh</span>;

  return (
    <div class={`slot${p.compact ? ' slot--compact' : ''}`} data-testid={`slot-${path}`}>
      <p class="slot-label">{p.label}</p>
      <div class="slot-row">
        <div class={`slot-media${focalMode ? ' is-focal' : ''}`} onClick={onFocal} role={focalMode ? 'button' : undefined} aria-label={focalMode ? 'Chạm vào điểm cần lấy nét' : undefined}>
          {thumb(draft)}
          {focalMode && draft?.focalPoint && <span class="focal-dot" style={{ left: `${draft.focalPoint.x * 100}%`, top: `${draft.focalPoint.y * 100}%` }} aria-hidden="true" />}
        </div>
        <div class="slot-info">
          <p class="slot-meta">
            {draft?.src ? <>Trong bản nháp{draft.w ? ` · ${draft.w}×${draft.h}` : ''}{summary ? ` · ${summary}` : ''}</> : 'Chưa có ảnh'}
            {changed && <span class="badge badge--warn"> ● Chưa xuất bản</span>}
            {draft?.updatedAt && changed && <span class="muted"> · Đổi lúc {fmtTime(draft.updatedAt)}</span>}
          </p>
          {busy && <p class="muted"><Spinner /> {busy} <span class="muted">(xử lý trên máy, lưu vào nháp)</span></p>}
          {err && <p class="err" role="alert">⚠ {err} <button type="button" class="btn btn-link" onClick={() => fileRef.current?.click()}>Chọn ảnh khác</button></p>}
          <div class="btn-row">
            <button type="button" class="btn btn-secondary" disabled={!!busy} onClick={() => fileRef.current?.click()}>{draft?.src ? 'Thay ảnh' : 'Chọn ảnh'}</button>
            {draft?.src && (kind === 'hero' || kind === 'cover') && (
              <button type="button" class="btn btn-ghost" aria-pressed={focalMode} onClick={() => setFocalMode(!focalMode)}>{focalMode ? 'Xong' : 'Chỉnh điểm lấy nét'}</button>
            )}
            {draft?.src && <button type="button" class="btn btn-ghost" onClick={() => {
              const before = draft;
              if (p.onRemove) p.onRemove(); else store.setPath(path, null, section);
              toast('Đã bỏ ảnh khỏi bản nháp', { action: { label: 'Hoàn tác', run: () => { if (!p.onRemove) store.setPath(path, before, section); } } });
            }}>Bỏ ảnh</button>}
            {changed && <button type="button" class="btn btn-ghost" onClick={revert} data-testid="slot-revert">↶ Hoàn tác thay đổi nháp</button>}
          </div>
          <input ref={fileRef} type="file" accept={ACCEPT_IMAGES} class="sr-only" tabIndex={-1} aria-hidden="true"
            onChange={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = ''; void onFile(f); }} />
          {draft?.src && (
            <TextField label="Mô tả ảnh (alt)" value={draft.alt ?? ''} onInput={(v) => store.setPath(`${path}.alt`, v, section)}
              help={draft.alt ? undefined : `Gợi ý: "${altSuggestion(store)}"`} />
          )}
        </div>
      </div>

      {changed && pub?.src && (
        <div class="slot-sub">
          <p class="slot-sub-h">Đang xuất bản (khách đang thấy){store.s.published.publish.at ? ` · xuất bản ${fmtTime(store.s.published.publish.at)}` : ''}</p>
          {thumb(pub, 'slot-thumb slot-thumb--sm')}
        </div>
      )}

      {prev && (
        <div class="slot-sub">
          <p class="slot-sub-h">Ảnh trước lần xuất bản {manifest?.createdAt ? fmtTime(manifest.createdAt) : ''} (từ bản sao lưu)</p>
          <div class="slot-row">
            {prevUrl ? <img class="slot-thumb slot-thumb--sm" src={prevUrl} alt="" /> : <span class="slot-thumb slot-thumb--sm slot-empty"><Spinner /></span>}
            <div>
              <button type="button" class="btn btn-secondary" onClick={() => { setTaking(null); setTakeOpen(true); }}>Lấy lại ảnh này vào nháp</button>
              <p class="note">ⓘ Bản sao lưu chỉ giữ trạng thái trước lần xuất bản gần nhất. <a href="#/backup">Khôi phục cả trang? Xem Sao lưu/Khôi phục</a></p>
            </div>
          </div>
        </div>
      )}

      {cropFile && CropLazy && (
        <CropLazy file={cropFile} aspect={spec.aspect ?? 1} title={`Cắt ảnh: ${p.label}`}
          onCancel={() => setCropFile(null)} onConfirm={(r) => { const f = cropFile; setCropFile(null); void run(f, r); }} />
      )}

      <Modal open={takeOpen} onClose={() => setTakeOpen(false)} title="Lấy lại ảnh trước đó"
        footer={<>
          <button type="button" class="btn btn-ghost" onClick={() => setTakeOpen(false)}>Huỷ</button>
          <button type="button" class="btn btn-primary" disabled={taking === 'Đang lấy ảnh…'} onClick={() => void takePrevious()}>{taking === 'Đang lấy ảnh…' ? <><Spinner /> Đang lấy ảnh…</> : 'Đưa vào nháp'}</button>
        </>}>
        <div class="compare">
          <figure>{thumb(pub, 'slot-thumb')}<figcaption>Đang xuất bản</figcaption></figure>
          <span aria-hidden="true">→</span>
          <figure>{prevUrl ? <img class="slot-thumb" src={prevUrl} alt="" /> : <Spinner />}<figcaption>Ảnh trước lần xuất bản {manifest?.createdAt ? fmtTime(manifest.createdAt) : ''}</figcaption></figure>
        </div>
        <p>Ảnh này sẽ được đưa vào <strong>bản nháp</strong>; khách chỉ thấy sau khi bạn bấm Xuất bản. Lưu ý: hệ thống chỉ giữ bản sao lưu của <strong>lần xuất bản gần nhất</strong>; lần Xuất bản tới sẽ thay toàn bộ bản sao lưu bằng trạng thái trang hiện tại.</p>
        {taking && taking !== 'Đang lấy ảnh…' && <p class="err" role="alert">⚠ {taking} <button type="button" class="btn btn-link" onClick={() => void takePrevious()}>Thử lại</button></p>}
      </Modal>
    </div>
  );
}
