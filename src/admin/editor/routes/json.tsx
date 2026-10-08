/** "Chỉnh JSON nâng cao" (design 8.1): sửa nháp dạng JSON; kiểm tra + chuẩn hoá trước khi áp dụng. */
import { useState } from 'preact/hooks';
import type { RouteProps } from '../editor';
import { normalizeConfig, useStore } from '../../state/store';
import { toast } from '../../ui/ui';

export default function JsonRoute({ store }: RouteProps) {
  const draft = useStore(store, (s) => s.draft);
  const [text, setText] = useState(() => JSON.stringify(draft, null, 2));
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const apply = () => {
    try {
      const n = normalizeConfig(JSON.parse(text));
      store.replaceDraft(n.config);
      setNotes(n.warnings);
      setErr(null);
      setText(JSON.stringify(n.config, null, 2));
      toast('Đã áp dụng vào bản nháp');
    } catch (e) {
      setErr(`JSON không hợp lệ: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  return (
    <section>
      <h1>Chỉnh JSON nâng cao</h1>
      <p class="muted">Dành cho người rành kỹ thuật. Giá trị sai sẽ được đưa về mặc định khi áp dụng.</p>
      <label for="json-ta" class="sr-only">Cấu hình JSON</label>
      <textarea id="json-ta" class="input json-ta" spellcheck={false} value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} />
      {err && <p class="err" role="alert">⚠ {err}</p>}
      {notes.length > 0 && <ul class="banner banner--warn">{notes.map((n) => <li key={n}>{n}</li>)}</ul>}
      <div class="btn-row">
        <button type="button" class="btn btn-primary" onClick={apply}>Áp dụng vào nháp</button>
        <button type="button" class="btn btn-ghost" onClick={() => setText(JSON.stringify(store.s.draft, null, 2))}>Tải lại từ nháp</button>
      </div>
    </section>
  );
}
