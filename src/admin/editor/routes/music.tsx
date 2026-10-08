/** Nhạc (design 8.3, solution 8.8): upload mp3/m4a ≤ 8MB (cảnh báo > 5MB), tên bài, điểm bắt đầu, nghe thử. */
import { useRef, useState } from 'preact/hooks';
import { sha256Hex } from '@shared/storage/bytes';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import { checkAudio, hashedAudioPath, safeBase } from '../../media/image-pipeline';
import { NumberField, TextField, Toggle, toast } from '../../ui/ui';

export default function MusicRoute({ store }: RouteProps) {
  const m = useStore(store, (s) => s.draft.music);
  useStore(store, (s) => s.blobUrls);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setWarn(null);
    const c = checkAudio(f);
    if (!c.ok) { setErr(c.error!); return; }
    if (c.warning) setWarn(c.warning);
    const bytes = new Uint8Array(await f.arrayBuffer());
    const named = await hashedAudioPath(bytes, safeBase(f.name, 'nhac'), c.ext!);
    await store.addBlob({ key: await sha256Hex(bytes), blob: f, mime: f.type || (c.ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4'), src: named.path, slot: 'music.src', origin: 'upload' });
    const before = store.s.draft.music;
    store.update((x) => ({ ...x, music: { ...x.music, src: named.path, title: x.music.title || f.name.replace(/\.[^.]+$/, ''), enabled: true } }));
    toast('Đã thay nhạc trong bản nháp', { action: { label: 'Hoàn tác', run: () => store.setPath('music', before) } });
  };

  return (
    <section>
      <h1>Nhạc</h1>
      <Toggle label="Có nhạc nền" checked={m.enabled} onChange={(v) => store.setPath('music.enabled', v)} />
      <div class="field">
        <p class="slot-label">Bài nhạc</p>
        {m.src ? <audio ref={audioRef} controls preload="metadata" src={store.urlOf(m.src)} class="audio" /> : <p class="muted">Chưa có nhạc.</p>}
        <div class="btn-row">
          <button type="button" class="btn btn-secondary" onClick={() => fileRef.current?.click()}>{m.src ? 'Thay nhạc' : 'Chọn file nhạc'}</button>
          {m.src && <button type="button" class="btn btn-ghost" onClick={() => store.setPath('music.src', null)}>Bỏ nhạc</button>}
          {m.src && <button type="button" class="btn btn-ghost" onClick={() => { const a = audioRef.current; if (a) { a.currentTime = m.startAt; void a.play(); } }}>Nghe thử từ điểm bắt đầu</button>}
        </div>
        <p class="help">mp3 hoặc m4a, tối đa 8MB; khuyên 96-128 kbps (≤ 5MB) để khách tải nhanh.</p>
        {err && <p class="err" role="alert">⚠ {err}</p>}
        {warn && <p class="banner banner--warn">{warn}</p>}
        <input ref={fileRef} type="file" accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a" class="sr-only" tabIndex={-1} aria-hidden="true"
          onChange={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = ''; void onFile(f); }} />
      </div>
      <TextField label="Tên bài" value={m.title} onInput={(v) => store.setPath('music.title', v)} />
      <NumberField label="Bắt đầu phát từ giây" value={m.startAt} min={0} max={600} onChange={(v) => store.setPath('music.startAt', Math.max(0, v))} />
      <Toggle label="Tự phát sau khi khách mở thiệp" checked={m.autoplayAfterOpen} onChange={(v) => store.setPath('music.autoplayAfterOpen', v)} />
      <Toggle label="Lặp lại" checked={m.loop} onChange={(v) => store.setPath('music.loop', v)} />
      <TextField label="Gợi ý bật loa trên màn thiệp mời" value={store.s.draft.cover.musicHint} onInput={(v) => store.setPath('cover.musicHint', v, 'cover')} />
    </section>
  );
}
