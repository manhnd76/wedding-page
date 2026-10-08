/**
 * Bộ điều khiển tự cuộn - phần thuần (không DOM) để unit test (design-review-v1 mục 5).
 * Nguyên tắc: (1) mọi tác động của khách dừng ngay, (2) KHÔNG tự tiếp tục sau khi khách đã tác động,
 * (3) luôn có nút Dừng/Tiếp tục. Chỉ nguyên nhân do hệ thống (tab ẩn, resize) mới tạm dừng rồi tự chạy lại.
 */
import type { AutoScrollMode } from '@shared/config/enums';

export const RAMP_MS = 800;
export const DRIFT_PX = 3;
export const RESIZE_GRACE_MS = 300;
export const RESUME_HIDDEN_MS = 1000;
export const RESUME_RESIZE_MS = 500;
export const COUNTDOWN_DWELL_MS = 2000;
/** đầu section chạm 18% chiều cao viewport thì dừng ngắn (flow) */
export const DWELL_LINE = 0.18;
/** reduced-motion: khách bấm chạy thì steady 32px/s */
export const REDUCED_SPEED = 32;

export type UserStop = 'wheel' | 'touch' | 'pointer' | 'key' | 'drift' | 'focus' | 'overlay' | 'selection' | 'manual';
export type SystemPause = 'hidden' | 'resize';
export type AutoScrollState = 'idle' | 'waiting' | 'running' | 'dwell' | 'paused' | 'stopped' | 'done';

export interface ScrollEnv {
  getY(): number;
  setY(y: number): void;
  maxY(): number;
  vh(): number;
  /** device pixel ratio: chỉ gọi setY khi lệch ≥ 1 device pixel */
  dpr(): number;
}

export interface SectionMark { top: number; type: string }

export interface AutoScrollOpts {
  speed: number;
  mode: AutoScrollMode;
  dwellMs: number;
  /** trang có section Cảm ơn: giảm tốc dần trong 1 màn cuối */
  landing?: boolean;
  sections?: SectionMark[];
}

/** Hệ số màn hình clamp(innerHeight/800, .8, 1.2). */
export const screenFactor = (vh: number) => Math.min(1.2, Math.max(0.8, vh / 800));
const easeIn = (k: number) => k * k;

export class AutoScroller {
  state: AutoScrollState = 'idle';
  /** lý do dừng gần nhất (khách tác động) */
  stopReason: UserStop | 'end' | null = null;
  /** số lần dừng do khách (lần đầu hiện tooltip) */
  userStops = 0;
  private pos = 0;
  private applied = 0;
  private startAt = 0;
  private rampAt = 0;
  private dwellUntil = 0;
  private resumeAt = 0;
  private pauseFrom: AutoScrollState = 'running';
  private lastResize = -Infinity;
  private dwelled = new Set<number>();
  private last = 0;
  onChange: (s: AutoScrollState) => void = () => {};

  constructor(private env: ScrollEnv, public opts: AutoScrollOpts) {}

  private set(s: AutoScrollState) {
    if (this.state === s) return;
    this.state = s;
    this.onChange(s);
  }

  get active(): boolean { return this.state === 'running' || this.state === 'dwell' || this.state === 'waiting' || this.state === 'paused'; }

  /** Bắt đầu sau `delayMs` (lần đầu sau khi mở thiệp). */
  schedule(now: number, delayMs: number): void {
    this.startAt = now + delayMs;
    this.applied = this.env.getY();
    this.last = now;
    this.set('waiting');
  }

  /** Khách bấm "Tiếp tục": chạy từ vị trí hiện tại, tăng tốc 800ms, không áp startDelayMs. */
  resume(now: number): void {
    if (this.env.getY() >= this.env.maxY() - 2) { this.set('done'); return; }
    this.begin(now);
  }

  private begin(now: number) {
    this.pos = this.applied = this.env.getY();
    this.rampAt = now;
    this.last = now;
    // section đã nằm phía trên điểm hiện tại không dừng lại nữa
    const line = this.pos + this.env.vh() * DWELL_LINE;
    (this.opts.sections ?? []).forEach((s, i) => { if (s.top <= line + 1) this.dwelled.add(i); });
    this.set('running');
  }

  /** Khách tác động -> dừng hẳn (không tự tiếp tục). */
  stop(reason: UserStop): void {
    if (this.state === 'idle' || this.state === 'stopped' || this.state === 'done') return;
    this.stopReason = reason;
    this.userStops++;
    this.set('stopped');
  }

  /** Nguyên nhân hệ thống: tạm dừng, tự chạy lại sau 1s (tab hiện lại) / 500ms (resize). */
  pause(reason: SystemPause, now: number): void {
    if (reason === 'resize') this.lastResize = now;
    if (this.state === 'running' || this.state === 'dwell') {
      this.pauseFrom = this.state;
      this.set('paused');
    }
    if (this.state === 'paused') this.resumeAt = reason === 'hidden' ? Infinity : now + RESUME_RESIZE_MS;
  }

  /** Tab hiện lại. */
  visible(now: number): void {
    if (this.state === 'paused' && this.resumeAt === Infinity) this.resumeAt = now + RESUME_HIDDEN_MS;
  }

  /** Tốc độ đích (px/s) có hệ số màn hình + hạ cánh ở màn cuối. */
  speedAt(y: number): number {
    const vh = this.env.vh();
    let v = this.opts.speed * screenFactor(vh);
    const left = this.env.maxY() - y;
    if (this.opts.landing && left < vh) v *= Math.max(0.25, Math.sin((Math.max(0, left) / vh) * (Math.PI / 2)));
    return v;
  }

  /** 1 frame rAF. Trả về true nếu cần frame tiếp theo. */
  tick(now: number): boolean {
    const dt = Math.min(64, Math.max(0, now - this.last));
    this.last = now;
    switch (this.state) {
      case 'waiting':
        // khách tự cuộn trong lúc chờ (kể cả kéo thanh cuộn) -> không bắt đầu
        if (this.driftCheck(now)) return false;
        if (now >= this.startAt) this.begin(now);
        return true;
      case 'paused':
        if (now >= this.resumeAt) {
          this.pos = this.applied = this.env.getY();
          this.rampAt = now;
          this.set(this.pauseFrom === 'dwell' && now < this.dwellUntil ? 'dwell' : 'running');
        }
        return true;
      case 'dwell':
        if (this.driftCheck(now)) return false;
        if (now >= this.dwellUntil) { this.rampAt = now; this.set('running'); }
        return true;
      case 'running':
        break;
      default:
        return false;
    }
    if (this.driftCheck(now)) return false;
    const maxY = this.env.maxY();
    if (this.pos >= maxY - 2) { this.stopReason = 'end'; this.set('done'); return false; }
    // dừng ngắn đầu mỗi section (flow); hero + footer không dừng; countdown ≥ 2s để pháo hoa đủ điều kiện
    if (this.opts.mode === 'flow' && this.opts.dwellMs > 0) {
      const line = this.pos + this.env.vh() * DWELL_LINE;
      const list = this.opts.sections ?? [];
      for (let i = 0; i < list.length; i++) {
        const s = list[i]!;
        if (this.dwelled.has(i) || s.type === 'hero' || s.type === 'footer' || s.top > line) continue;
        this.dwelled.add(i);
        this.dwellUntil = now + (s.type === 'countdown' ? Math.max(this.opts.dwellMs, COUNTDOWN_DWELL_MS) : this.opts.dwellMs);
        this.set('dwell');
        return true;
      }
    }
    const k = Math.min(1, (now - this.rampAt) / RAMP_MS);
    this.pos = Math.min(maxY, this.pos + (this.speedAt(this.pos) * easeIn(k) * dt) / 1000);
    if (Math.abs(this.pos - this.applied) >= 1 / Math.max(1, this.env.dpr()) || this.pos >= maxY - 2) {
      this.env.setY(this.pos);
      this.applied = this.env.getY();
    }
    return true;
  }

  /** Kéo thanh cuộn / tìm trong trang: scrollY thực lệch > 3px so với vị trí đã đặt (không có resize 300ms trước) -> dừng. */
  private driftCheck(now: number): boolean {
    const y = this.env.getY();
    if (Math.abs(y - this.applied) <= DRIFT_PX) return false;
    if (now - this.lastResize < RESIZE_GRACE_MS) { this.pos = this.applied = y; return false; }
    this.stop('drift');
    return true;
  }
}

/** Không tự bắt đầu nếu… (design-review-v1 5.2). Trả về lý do hoặc null = được tự chạy. */
export function autoStartBlocker(o: {
  enabled: boolean; fxState: string; reducedMotion: boolean; restoredScroll: boolean; hasHash: boolean; pageH: number; vh: number;
}): string | null {
  if (!o.enabled) return 'disabled';
  if (o.fxState === 'off') return 'off';
  if (o.reducedMotion || o.fxState === 'reduced') return 'reduced-motion';
  if (o.restoredScroll) return 'restored';
  if (o.hasHash) return 'hash';
  if (o.pageH < o.vh * 1.5) return 'short';
  return null;
}

/** Phím chỉ là phím bổ trợ (Shift/Ctrl/Alt/Meta) thì không tính là tác động. */
export const isModifierOnly = (key: string) => key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta' || key === 'AltGraph' || key === 'CapsLock';
