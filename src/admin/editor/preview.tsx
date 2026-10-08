/**
 * Live preview (solution 4.3, design 8.4/8.13): iframe `/?preview=1` chạy đúng code guest.
 * 2 khung luân phiên (double buffer): khung ẩn tải cấu hình mới, xong mới đổi chỗ -> không nháy, không rò rỉ.
 * Thanh công cụ: 375/414/desktop, Làm mới, Bỏ qua cover, Xem như khách, ↻ Phát lại (phím R), 0.5x, Mô phỏng.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { WeddingConfig } from '@shared/config/types';
import type { EditorStore } from '../state/store';

export interface FxReq { target: string; label: string }
export interface PreviewApi {
  /** phát lại 1 hiệu ứng: cover | burst | particles | reveal | micro:<mã> */
  replay(target: string, label: string): void;
  /** xem cover với tên khách cụ thể (link generator 👁) */
  previewGuest(name: string): void;
}

interface Payload {
  config: WeddingConfig;
  assets: Record<string, string>;
  options: Record<string, unknown>;
  fx: { target: string; speed: number; simulate: { lowEnd: boolean; reducedMotion: boolean } } | null;
}

const DEVICES = { '375': { w: 375, h: 740 }, '414': { w: 414, h: 830 }, desktop: { w: 1280, h: 800 } } as const;
type Device = keyof typeof DEVICES;
const DEBOUNCE_MS = 150;
const LOAD_TIMEOUT_MS = 8000;

/** Điều phối 2 khung (không phụ thuộc Preact để dễ đọc). */
class FrameEngine {
  frames: HTMLIFrameElement[];
  active = 0;
  loading: number | null = null;
  pending: Payload | null = null;
  payloads = new Map<number, Payload>();
  scrollY = 0;
  private seq = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(a: HTMLIFrameElement, b: HTMLIFrameElement, private on: { done: (t: string) => void; error: (m: string) => void; swap: () => void }) {
    this.frames = [a, b];
    window.addEventListener('message', this.onMsg);
  }
  dispose() { window.removeEventListener('message', this.onMsg); if (this.timer) clearTimeout(this.timer); }

  render(p: Payload) {
    if (this.loading !== null) { this.pending = p; return; }
    const first = !this.frames[this.active]!.dataset.used;
    const idx = first ? this.active : 1 - this.active;
    this.loading = idx;
    this.payloads.set(idx, p);
    const f = this.frames[idx]!;
    f.dataset.used = '1';
    f.src = `${import.meta.env.BASE_URL}?preview=1&n=${++this.seq}`;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.finish(idx), LOAD_TIMEOUT_MS);
  }

  private finish(idx: number) {
    if (this.loading !== idx) return;
    if (this.timer) clearTimeout(this.timer);
    this.loading = null;
    this.active = idx;
    this.frames.forEach((f, i) => {
      f.classList.toggle('is-active', i === idx);
      f.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      f.tabIndex = i === idx ? 0 : -1;
    });
    this.on.swap();
    const p = this.pending;
    this.pending = null;
    if (p) this.render(p);
  }

  private onMsg = (e: MessageEvent) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    const idx = this.frames.findIndex((f) => f.contentWindow === e.source);
    if (idx < 0) return;
    const d = e.data as { type?: string; phase?: string; scrollY?: number; target?: string; message?: string };
    if (d.type === 'wp:preview-ready' && d.phase === 'boot') {
      const p = this.payloads.get(idx);
      if (p) this.frames[idx]!.contentWindow?.postMessage({ type: 'wp:preview-config', ...p }, location.origin);
    } else if (d.type === 'wp:preview-ready' && d.phase === 'rendered') {
      this.finish(idx);
    } else if (d.type === 'wp:preview-scroll' && idx === this.active && typeof d.scrollY === 'number') {
      this.scrollY = d.scrollY;
    } else if (d.type === 'fx:done' && idx === this.active) {
      this.on.done(String(d.target ?? ''));
    } else if (d.type === 'wp:preview-error') {
      this.on.error(String(d.message ?? 'Lỗi xem trước'));
    }
  };
}

export function Preview(p: { store: EditorStore; onReady: (api: PreviewApi) => void }) {
  const { store } = p;
  const aRef = useRef<HTMLIFrameElement>(null);
  const bRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const eng = useRef<FrameEngine | null>(null);
  const [device, setDevice] = useState<Device>('375');
  const [skipCover, setSkipCover] = useState(false);
  const [slow, setSlow] = useState(false);
  const [sim, setSim] = useState({ lowEnd: false, reducedMotion: false });
  const [simOpen, setSimOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const [last, setLast] = useState<FxReq>({ target: 'cover', label: 'Mở thiệp' });
  const [scale, setScale] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const lastFocus = useRef<string>('');
  const deb = useRef<ReturnType<typeof setTimeout> | null>(null);
  const st = useRef({ skipCover, slow, sim, guestName, last });
  st.current = { skipCover, slow, sim, guestName, last };

  const payload = (fx: FxReq | null, extra: Record<string, unknown> = {}): Payload => {
    const s = store.s;
    const focus = s.focus && Date.now() - s.focus.at < 3000 ? s.focus.section : '';
    const newFocus = focus && focus !== lastFocus.current;
    if (focus) lastFocus.current = focus;
    const c = st.current;
    return {
      config: s.draft,
      assets: s.blobUrls,
      options: {
        skipCover: c.skipCover || (!!focus && focus !== 'cover'),
        muteMusic: true,
        ...(newFocus && focus !== 'cover' ? { scrollTo: focus, highlight: focus } : { scrollY: eng.current?.scrollY ?? 0 }),
        ...(c.guestName ? { guestName: c.guestName } : {}),
        ...extra,
      },
      fx: fx ? { target: fx.target, speed: c.slow ? 0.5 : 1, simulate: c.sim } : null,
    };
  };

  const replay = (target: string, label: string) => {
    // bản phát lại đã chứa nháp mới nhất -> huỷ lần làm mới đang chờ (tránh khung thường đè khung phát lại)
    if (deb.current) { clearTimeout(deb.current); deb.current = null; }
    setLast({ target, label });
    st.current.last = { target, label };
    setPlaying(label);
    eng.current?.render(payload({ target, label }));
  };

  useEffect(() => {
    const e = new FrameEngine(aRef.current!, bRef.current!, {
      done: () => setPlaying(null),
      error: (m) => setErr(m),
      swap: () => setErr(null),
    });
    eng.current = e;
    e.render(payload(null));
    p.onReady({
      replay,
      previewGuest: (name: string) => { setGuestName(name); st.current.guestName = name; replay('cover', `Thiệp gửi ${name}`); },
    });
    // cấu hình nháp đổi -> debounce 150ms -> khung mới
    let prev = store.s.draft;
    let prevAssets = store.s.blobUrls;
    const unsub = store.subscribe((s) => {
      if (s.draft === prev && s.blobUrls === prevAssets) return;
      prev = s.draft;
      prevAssets = s.blobUrls;
      if (deb.current) clearTimeout(deb.current);
      deb.current = setTimeout(() => { deb.current = null; e.render(payload(null)); }, DEBOUNCE_MS);
    });
    return () => { unsub(); if (deb.current) clearTimeout(deb.current); e.dispose(); };
  }, [store]);

  // thu nhỏ khung theo chỗ trống
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const dv = DEVICES[device];
    const fit = () => setScale(Math.min(1, (box.clientWidth - 8) / dv.w, Math.max(0.3, (box.clientHeight - 8) / dv.h)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [device]);

  // đổi tốc độ / mô phỏng -> phát lại hiệu ứng vừa xem
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    replay(st.current.last.target, st.current.last.label);
  }, [slow, sim.lowEnd, sim.reducedMotion]);

  const dv = DEVICES[device];
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div class="pv" onKeyDown={(e) => { if ((e.key === 'r' || e.key === 'R') && !(e.target as HTMLElement).closest('input')) { e.preventDefault(); replay(last.target, last.label); } }}>
      <div class="pv-bar" role="toolbar" aria-label="Công cụ xem trước">
        <div class="seg-row seg-row--sm" role="group" aria-label="Khung">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button key={d} type="button" class="seg-btn" aria-pressed={device === d} onClick={() => setDevice(d)}>{d === 'desktop' ? 'Máy tính' : `${d}px`}</button>
          ))}
        </div>
        <button type="button" class="btn btn-secondary" onClick={() => replay(last.target, last.label)} data-testid="pv-replay">↻ Phát lại</button>
        <button type="button" class="btn btn-ghost" aria-pressed={slow} onClick={() => setSlow(!slow)}>0.5x</button>
        <div class="pv-sim">
          <button type="button" class="btn btn-ghost" aria-expanded={simOpen} onClick={() => setSimOpen(!simOpen)}>⋯ Mô phỏng</button>
          {simOpen && (
            <div class="menu">
              <label class="check"><input type="checkbox" checked={sim.lowEnd} onChange={(e) => setSim({ ...sim, lowEnd: (e.currentTarget as HTMLInputElement).checked })} /> Như máy yếu</label>
              <label class="check"><input type="checkbox" checked={sim.reducedMotion} onChange={(e) => setSim({ ...sim, reducedMotion: (e.currentTarget as HTMLInputElement).checked })} /> Như người dùng tắt chuyển động</label>
              <p class="note">Khách dùng máy yếu sẽ thấy phiên bản này.</p>
            </div>
          )}
        </div>
        <button type="button" class="btn btn-ghost" onClick={() => eng.current?.render(payload(null))} aria-label="Làm mới xem trước">⟳</button>
      </div>
      <div class="pv-bar pv-bar--2">
        <label class="check"><input type="checkbox" checked={skipCover} data-testid="pv-skip-cover"
          onChange={(e) => { const v = (e.currentTarget as HTMLInputElement).checked; setSkipCover(v); st.current.skipCover = v; eng.current?.render(payload(null)); }} /> Bỏ qua màn cover khi xem</label>
        <label class="pv-guest">Xem như:
          <input class="input input--sm" value={guestName} placeholder="Gia đình anh Mạnh"
            onChange={(e) => { const v = (e.currentTarget as HTMLInputElement).value.trim(); setGuestName(v); st.current.guestName = v; replay('cover', 'Mở thiệp'); }} />
        </label>
      </div>
      <p class="pv-now" aria-live="polite">{playing ? `Đang phát: ${playing}…` : `Đang xem: ${last.label}`}{reduced ? ' · Máy bạn đang giảm chuyển động; xem trước vẫn phát khi bấm' : ''}</p>
      {err && <p class="err" role="alert">⚠ Xem trước lỗi: {err}</p>}
      <div class="pv-box" ref={boxRef}>
        <div class="pv-device" style={{ width: `${dv.w * scale}px`, height: `${dv.h * scale}px` }}>
          <div class="pv-scaler" style={{ width: `${dv.w}px`, height: `${dv.h}px`, transform: `scale(${scale})` }}>
            <iframe ref={aRef} class="pv-frame is-active" title="Xem trước trang thiệp" data-testid="pv-frame" />
            <iframe ref={bRef} class="pv-frame" title="Xem trước trang thiệp (đang tải)" aria-hidden="true" tabIndex={-1} data-testid="pv-frame" />
          </div>
        </div>
      </div>
    </div>
  );
}
