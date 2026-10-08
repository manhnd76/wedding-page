/**
 * Live preview (solution 4.3, design 8.4/8.13): iframe `/?preview=1` chạy đúng code guest.
 * 2 khung luân phiên (double buffer): khung ẩn tải cấu hình mới, xong mới đổi chỗ -> không nháy, không rò rỉ.
 * Desktop: khung điện thoại 375/414/máy tính + 3 hàng công cụ (A18). Mobile (< 768px): không khung, iframe phủ
 * hết chỗ còn lại, 1 hàng công cụ [↻ Phát lại] [Bỏ qua cover] [⋯] (A04).
 * Khi khung preview đang ẩn (tab Chỉnh sửa trên mobile, tắt "Xem trước" ở tablet) KHÔNG tải lại iframe: chỉ đánh dấu
 * "bẩn" (và giữ hiệu ứng cần phát), hiện lại thì render 1 lần với nháp mới nhất (A15).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { WeddingConfig } from '@shared/config/types';
import type { EditorStore } from '../state/store';
import { Icon } from '../ui/icons';

export interface FxReq { target: string; label: string }
export interface PreviewApi {
  /** phát lại 1 hiệu ứng: cover | burst | particles | reveal | autoscroll | micro:<mã> */
  replay(target: string, label: string): void;
  /** xem cover với tên khách cụ thể (nút Xem ở Link khách mời) */
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
/** trường văn bản dài: gõ liên tục -> đợi lâu hơn rồi mới nạp lại khung (đánh giá lệch #1 điều kiện b) */
const DEBOUNCE_LONG_MS = 400;
const LOAD_TIMEOUT_MS = 8000;
const COMPACT_MQ = '(max-width: 767px)';

/** Điều phối 2 khung (không phụ thuộc Preact để dễ đọc). */
class FrameEngine {
  frames: HTMLIFrameElement[];
  active = 0;
  loading: number | null = null;
  pending: Payload | null = null;
  payloads = new Map<number, Payload>();
  scrollY = 0;
  /** số lần nạp khung (e2e kiểm tra không nạp khi ẩn) */
  loads = 0;
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
    this.loads++;
    f.closest<HTMLElement>('.pv')?.setAttribute('data-loads', String(this.loads));
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

const matchCompact = () => typeof matchMedia !== 'undefined' && matchMedia(COMPACT_MQ).matches;

export function Preview(p: { store: EditorStore; onReady: (api: PreviewApi) => void }) {
  const { store } = p;
  const rootRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLIFrameElement>(null);
  const bRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const eng = useRef<FrameEngine | null>(null);
  const [compact, setCompact] = useState(matchCompact);
  const [device, setDevice] = useState<Device>('375');
  const [skipCover, setSkipCover] = useState(false);
  const [slow, setSlow] = useState(false);
  const [sim, setSim] = useState({ lowEnd: false, reducedMotion: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const [last, setLast] = useState<FxReq>({ target: 'cover', label: 'Mở thiệp' });
  const [scale, setScale] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const lastFocus = useRef<string>('');
  const deb = useRef<ReturnType<typeof setTimeout> | null>(null);
  const st = useRef({ skipCover, slow, sim, guestName, last });
  st.current = { skipCover, slow, sim, guestName, last };
  /** khung đang hiện? / có thay đổi chưa render? / hiệu ứng cần phát khi hiện lại */
  const vis = useRef({ visible: false, dirty: true, fx: null as FxReq | null });

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

  /** Render ngay nếu khung đang hiện; đang ẩn -> chỉ ghi nhớ (không nạp iframe). */
  const show = (fx: FxReq | null) => {
    const v = vis.current;
    if (!v.visible) { v.dirty = true; if (fx) v.fx = fx; return; }
    v.dirty = false;
    v.fx = null;
    eng.current?.render(payload(fx));
  };

  const replay = (target: string, label: string) => {
    // bản phát lại đã chứa nháp mới nhất -> huỷ lần làm mới đang chờ (tránh khung thường đè khung phát lại)
    if (deb.current) { clearTimeout(deb.current); deb.current = null; }
    setLast({ target, label });
    st.current.last = { target, label };
    setPlaying(label);
    show({ target, label });
  };

  useEffect(() => {
    const e = new FrameEngine(aRef.current!, bRef.current!, {
      done: () => setPlaying(null),
      error: (m) => setErr(m),
      swap: () => setErr(null),
    });
    eng.current = e;
    p.onReady({
      replay,
      previewGuest: (name: string) => { setGuestName(name); st.current.guestName = name; replay('cover', `Thiệp gửi ${name}`); },
    });

    // hiện/ẩn: khung display:none có kích thước 0
    const root = rootRef.current!;
    const onVis = () => {
      const now = root.clientWidth > 0 && root.clientHeight > 0;
      const v = vis.current;
      if (now === v.visible) return;
      v.visible = now;
      if (now && v.dirty) show(v.fx);
    };
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver === 'undefined') { vis.current.visible = true; show(null); } else { ro = new ResizeObserver(onVis); ro.observe(root); }

    // cấu hình nháp đổi -> debounce -> khung mới (đang ẩn: chỉ đánh dấu bẩn)
    let prev = store.s.draft;
    let prevAssets = store.s.blobUrls;
    const unsub = store.subscribe((s) => {
      if (s.draft === prev && s.blobUrls === prevAssets) return;
      prev = s.draft;
      prevAssets = s.blobUrls;
      if (deb.current) clearTimeout(deb.current);
      if (!vis.current.visible) { vis.current.dirty = true; return; }
      const long = document.activeElement?.tagName === 'TEXTAREA';
      deb.current = setTimeout(() => { deb.current = null; show(null); }, long ? DEBOUNCE_LONG_MS : DEBOUNCE_MS);
    });

    const mq = typeof matchMedia !== 'undefined' ? matchMedia(COMPACT_MQ) : null;
    const onMq = () => setCompact(!!mq?.matches);
    mq?.addEventListener?.('change', onMq);
    return () => { unsub(); ro?.disconnect(); mq?.removeEventListener?.('change', onMq); if (deb.current) clearTimeout(deb.current); e.dispose(); };
  }, [store]);

  // thu nhỏ khung theo chỗ trống (desktop). Mobile: không khung, iframe = đúng kích thước chỗ trống.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || compact || typeof ResizeObserver === 'undefined') return;
    const dv = DEVICES[device];
    const fit = () => {
      if (!box.clientWidth) return;
      setScale(Math.min(1, (box.clientWidth - 20) / dv.w, Math.max(0.3, (box.clientHeight - 20) / dv.h)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [device, compact]);

  // đổi tốc độ / mô phỏng -> phát lại hiệu ứng vừa xem
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    replay(st.current.last.target, st.current.last.label);
  }, [slow, sim.lowEnd, sim.reducedMotion]);

  // menu ⋯: Esc đóng, trả focus về nút
  const menuBtn = useRef<HTMLButtonElement>(null);
  const onMenuKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); menuBtn.current?.focus(); } };

  const dv = DEVICES[device];
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const refresh = () => show(null);
  const onSkip = (e: Event) => { const v = (e.currentTarget as HTMLInputElement).checked; setSkipCover(v); st.current.skipCover = v; show(null); };
  const onGuest = (e: Event) => { const v = (e.currentTarget as HTMLInputElement).value.trim(); setGuestName(v); st.current.guestName = v; replay('cover', 'Mở thiệp'); };
  const replayBtn = <button type="button" class="btn btn-secondary" onClick={() => replay(last.target, last.label)} data-testid="pv-replay"><Icon name="refresh" /> Phát lại</button>;
  const skip = (
    <label class="check">
      <input type="checkbox" checked={skipCover} data-testid="pv-skip-cover" onChange={onSkip} /> {compact ? 'Bỏ qua cover' : 'Bỏ qua màn cover khi xem'}
    </label>
  );
  const simChecks = <>
    <label class="check"><input type="checkbox" checked={sim.lowEnd} onChange={(e) => setSim({ ...sim, lowEnd: (e.currentTarget as HTMLInputElement).checked })} /> Như máy yếu</label>
    <label class="check"><input type="checkbox" checked={sim.reducedMotion} onChange={(e) => setSim({ ...sim, reducedMotion: (e.currentTarget as HTMLInputElement).checked })} /> Như người dùng tắt chuyển động</label>
    <p class="note">Khách dùng máy yếu sẽ thấy phiên bản này.</p>
  </>;
  const guestField = (
    <label class="pv-guest">Xem như khách:
      <input class="input input--sm" value={guestName} placeholder="Gia đình anh Mạnh" onChange={onGuest} />
    </label>
  );

  return (
    <div class={`pv${compact ? ' pv--compact' : ''}`} ref={rootRef} data-testid="pv"
      onKeyDown={(e) => { if ((e.key === 'r' || e.key === 'R') && !(e.target as HTMLElement).closest('input')) { e.preventDefault(); replay(last.target, last.label); } }}>
      {compact ? (
        <div class="pv-bar" role="toolbar" aria-label="Công cụ xem trước" data-testid="pv-toolbar">
          {replayBtn}
          {skip}
          <div class="pv-sim">
            <button type="button" class="btn btn-ghost icon-only" ref={menuBtn} aria-expanded={menuOpen} aria-label="Tuỳ chọn xem trước" onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name="more" />
            </button>
            {menuOpen && (
              <div class="menu" onKeyDown={onMenuKey}>
                <label class="check"><input type="checkbox" checked={slow} onChange={(e) => setSlow((e.currentTarget as HTMLInputElement).checked)} /> Phát chậm 0.5x</label>
                {simChecks}
                {guestField}
                <button type="button" class="btn btn-ghost" onClick={() => { refresh(); setMenuOpen(false); }}><Icon name="refresh" /> Làm mới xem trước</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div class="pv-tools" role="toolbar" aria-label="Công cụ xem trước" data-testid="pv-toolbar">
          <div class="pv-bar">
            <div class="seg-row seg-row--sm" role="group" aria-label="Khung">
              {(Object.keys(DEVICES) as Device[]).map((d) => (
                <button key={d} type="button" class="seg-btn" aria-pressed={device === d} onClick={() => setDevice(d)}>{d === 'desktop' ? 'Máy tính' : `${d}px`}</button>
              ))}
            </div>
            <button type="button" class="btn btn-ghost icon-only" onClick={refresh} aria-label="Làm mới xem trước" title="Làm mới xem trước"><Icon name="refresh" /></button>
          </div>
          <div class="pv-bar">
            {replayBtn}
            <button type="button" class="btn btn-ghost" aria-pressed={slow} onClick={() => setSlow(!slow)}>0.5x</button>
            <div class="pv-sim">
              <button type="button" class="btn btn-ghost" ref={menuBtn} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="more" /> Mô phỏng</button>
              {menuOpen && <div class="menu" onKeyDown={onMenuKey}>{simChecks}</div>}
            </div>
          </div>
          <div class="pv-bar pv-bar--3">{skip}{guestField}</div>
        </div>
      )}
      <p class="pv-now" aria-live="polite">{playing ? `Đang phát: ${playing}…` : `Đang xem: ${last.label}`}{reduced && !compact ? ' · Máy bạn đang giảm chuyển động; xem trước vẫn phát khi bấm' : ''}</p>
      {err && <p class="err" role="alert">⚠ Xem trước lỗi: {err}</p>}
      <div class="pv-box" ref={boxRef}>
        <div class={`pv-device${compact ? ' pv-device--fill' : ''}`} style={compact ? {} : { width: `${dv.w * scale}px`, height: `${dv.h * scale}px` }}>
          <div class="pv-scaler" style={compact ? {} : { width: `${dv.w}px`, height: `${dv.h}px`, transform: `scale(${scale})` }}>
            <iframe ref={aRef} class="pv-frame is-active" title="Xem trước trang thiệp" data-testid="pv-frame" />
            <iframe ref={bRef} class="pv-frame" title="Xem trước trang thiệp (đang tải)" aria-hidden="true" tabIndex={-1} data-testid="pv-frame" />
          </div>
        </div>
      </div>
    </div>
  );
}
