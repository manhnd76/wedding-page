/** Thành phần UI dùng chung của admin (design 8.11: label trên input, trợ giúp dưới label, lỗi có icon). */
import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';

// ------------------------------------------------------------------ toast (role=status)

interface ToastAction { label: string; run: () => void }
interface ToastItem { id: number; text: string; actions: ToastAction[]; tone?: 'ok' | 'err' }
let toasts: ToastItem[] = [];
const toastSubs = new Set<(t: ToastItem[]) => void>();
let tid = 0;
export function toast(text: string, opts: { action?: ToastAction; actions?: ToastAction[]; ms?: number; tone?: ToastItem['tone'] } = {}): void {
  const actions = [...(opts.action ? [opts.action] : []), ...(opts.actions ?? [])];
  const t: ToastItem = { id: ++tid, text, actions, ...(opts.tone ? { tone: opts.tone } : {}) };
  // cùng nội dung -> thay toast cũ, không chồng (vd bấm chip liên tục: "Đã chọn: Hạt nền")
  toasts = [...toasts.filter((x) => x.text !== text).slice(-2), t];
  toastSubs.forEach((f) => f(toasts));
  setTimeout(() => dropToast(t.id), opts.ms ?? (actions.length ? 5000 : 4000));
}
function dropToast(id: number) { toasts = toasts.filter((x) => x.id !== id); toastSubs.forEach((f) => f(toasts)); }
export function Toasts() {
  const [list, setList] = useState(toasts);
  useEffect(() => { toastSubs.add(setList); return () => { toastSubs.delete(setList); }; }, []);
  return (
    <div class="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} class={`toast${t.tone ? ` toast--${t.tone}` : ''}`}>
          <span>{t.text}</span>
          {t.actions.length > 0 && (
            <span class="toast-actions">
              {t.actions.map((a) => <button key={a.label} type="button" class="btn btn-link" onClick={() => { a.run(); dropToast(t.id); }}>{a.label}</button>)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ dialog (native <dialog>: focus trap + Esc)

export function Modal(p: { open: boolean; onClose: () => void; title: string; children: ComponentChildren; wide?: boolean; footer?: ComponentChildren; alert?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const tid = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p.open && !d.open) { try { d.showModal(); } catch { d.setAttribute('open', ''); } }
    if (!p.open && d.open) d.close();
  }, [p.open]);
  return (
    <dialog ref={ref} class={`modal${p.wide ? ' modal--wide' : ''}`} aria-labelledby={tid} role={p.alert ? 'alertdialog' : 'dialog'}
      onCancel={(e) => { e.preventDefault(); p.onClose(); }}>
      {p.open && (
        <div class="modal-in">
          <header class="modal-head">
            <h2 id={tid}>{p.title}</h2>
            <button type="button" class="icon-btn" aria-label="Đóng" onClick={p.onClose}>×</button>
          </header>
          <div class="modal-body">{p.children}</div>
          {p.footer && <footer class="modal-foot">{p.footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

// ------------------------------------------------------------------ fields

interface Base { label: string; help?: string | undefined; error?: string | null | undefined; id?: string }

function Wrap(p: Base & { id: string; children: ComponentChildren; inline?: boolean }) {
  return (
    <div class={`field${p.inline ? ' field--inline' : ''}${p.error ? ' has-error' : ''}`}>
      {!p.inline && <label for={p.id}>{p.label}</label>}
      {p.help && !p.inline && <p class="help" id={`${p.id}-h`}>{p.help}</p>}
      {p.children}
      {p.error && <p class="err" role="alert" id={`${p.id}-e`}><span aria-hidden="true">⚠ </span>{p.error}</p>}
    </div>
  );
}

const describedBy = (id: string, p: Base) => [p.help ? `${id}-h` : '', p.error ? `${id}-e` : ''].filter(Boolean).join(' ') || undefined;

export function TextField(p: Base & {
  value: string; onInput: (v: string) => void; type?: string; placeholder?: string | undefined; autoComplete?: string;
  onBlur?: () => void; inputMode?: JSX.HTMLAttributes['inputMode']; lang?: string | undefined; testId?: string; spellcheck?: boolean;
}) {
  const auto = useId();
  const id = p.id ?? auto;
  return (
    <Wrap {...p} id={id}>
      <input id={id} class="input" type={p.type ?? 'text'} value={p.value} placeholder={p.placeholder}
        autoComplete={p.autoComplete} inputMode={p.inputMode} lang={p.lang} spellcheck={p.spellcheck}
        aria-describedby={describedBy(id, p)} aria-invalid={p.error ? true : undefined} data-testid={p.testId}
        onInput={(e) => p.onInput((e.currentTarget as HTMLInputElement).value)} onBlur={p.onBlur} />
    </Wrap>
  );
}

export function TextArea(p: Base & { value: string; onInput: (v: string) => void; rows?: number; placeholder?: string | undefined; testId?: string }) {
  const auto = useId();
  const id = p.id ?? auto;
  return (
    <Wrap {...p} id={id}>
      <textarea id={id} class="input" rows={p.rows ?? 3} value={p.value} placeholder={p.placeholder} data-testid={p.testId}
        aria-describedby={describedBy(id, p)} onInput={(e) => p.onInput((e.currentTarget as HTMLTextAreaElement).value)} />
    </Wrap>
  );
}

export function Toggle(p: Base & { checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  const auto = useId();
  const id = p.id ?? auto;
  return (
    <div class="field field--toggle">
      <label class="toggle" for={id}>
        <input id={id} type="checkbox" role="switch" checked={p.checked} data-testid={p.testId}
          onChange={(e) => p.onChange((e.currentTarget as HTMLInputElement).checked)} />
        <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb" /></span>
        <span class="toggle-label">{p.label}</span>
        <span class="toggle-state" aria-hidden="true">{p.checked ? 'Bật' : 'Tắt'}</span>
      </label>
      {p.help && <p class="help">{p.help}</p>}
    </div>
  );
}

export function Select(p: Base & { value: string; onChange: (v: string) => void; options: { value: string; label: string; group?: string }[]; testId?: string }) {
  const auto = useId();
  const id = p.id ?? auto;
  const groups = [...new Set(p.options.map((o) => o.group ?? ''))];
  return (
    <Wrap {...p} id={id}>
      <select id={id} class="input" value={p.value} data-testid={p.testId} aria-describedby={describedBy(id, p)}
        onChange={(e) => p.onChange((e.currentTarget as HTMLSelectElement).value)}>
        {groups.length > 1
          ? groups.map((g) => <optgroup key={g} label={g}>{p.options.filter((o) => (o.group ?? '') === g).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)
          : p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Wrap>
  );
}

export function NumberField(p: Base & { value: number; onChange: (v: number) => void; min?: number | undefined; max?: number | undefined; step?: number }) {
  const auto = useId();
  const id = p.id ?? auto;
  return (
    <Wrap {...p} id={id}>
      <input id={id} class="input input--num" type="number" inputMode="numeric" value={String(p.value)} min={p.min} max={p.max} step={p.step ?? 1}
        onInput={(e) => { const n = Number((e.currentTarget as HTMLInputElement).value); if (Number.isFinite(n)) p.onChange(n); }} />
    </Wrap>
  );
}

/** Radio dạng nút phân đoạn (fieldset + legend). */
export function Segmented<T extends string>(p: { legend: string; value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void; name: string; help?: string }) {
  return (
    <fieldset class="field seg">
      <legend>{p.legend}</legend>
      {p.help && <p class="help">{p.help}</p>}
      <div class="seg-row">
        {p.options.map((o) => (
          <label key={o.value} class={`seg-opt${p.value === o.value ? ' is-on' : ''}`}>
            <input type="radio" name={p.name} value={o.value} checked={p.value === o.value} onChange={() => p.onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** ISO "+07:00" <-> input date + time (design 8.11). */
export function DateTimeField(p: Base & { value: string | null; onChange: (v: string | null) => void; allowEmpty?: boolean }) {
  const auto = useId();
  const id = p.id ?? auto;
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(p.value ?? '');
  const [d, setD] = useState(m?.[1] ?? '');
  const [t, setT] = useState(m?.[2] ?? '');
  useEffect(() => { setD(m?.[1] ?? ''); setT(m?.[2] ?? ''); }, [p.value]);
  const emit = (nd: string, nt: string) => {
    if (!nd) { if (p.allowEmpty) p.onChange(null); return; }
    p.onChange(`${nd}T${nt || '00:00'}:00+07:00`);
  };
  return (
    <Wrap {...p} id={id}>
      <div class="dt-row">
        <input id={id} class="input" type="date" value={d} aria-label={`${p.label} - ngày`} onInput={(e) => { const v = (e.currentTarget as HTMLInputElement).value; setD(v); emit(v, t); }} />
        <input class="input" type="time" value={t} aria-label={`${p.label} - giờ`} onInput={(e) => { const v = (e.currentTarget as HTMLInputElement).value; setT(v); emit(d, v); }} />
        {p.allowEmpty && p.value && <button type="button" class="btn btn-ghost" onClick={() => p.onChange(null)}>Xoá</button>}
      </div>
    </Wrap>
  );
}

export function Details(p: { summary: string; children: ComponentChildren; open?: boolean }) {
  return (
    <details class="details" open={p.open}>
      <summary>{p.summary}</summary>
      <div class="details-in">{p.children}</div>
    </details>
  );
}

export function Spinner(p: { label?: string }) {
  return <span class="spinner" role="progressbar" aria-label={p.label ?? 'Đang xử lý'} />;
}

/** Sao chép vào clipboard (fallback textarea). */
export async function copyText(s: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(s); return true; } catch {
    const ta = document.createElement('textarea');
    ta.value = s;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
