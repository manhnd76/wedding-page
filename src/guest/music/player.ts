/**
 * Nhạc nền (design 6, solution 8.1):
 * - <audio preload="none">; cover hiện + không saveData -> preload="auto"
 * - play() gọi ĐỒNG BỘ trong handler chạm (iOS); reject -> trạng thái "blocked" (nút "Chạm để bật nhạc")
 * - fade-in 1.5s bằng GainNode (không có Web Audio -> phát thẳng)
 * - visibilitychange/pagehide -> pause, nhớ wasPlaying; khách tự tắt -> tôn trọng cả phiên (sessionStorage)
 * - file lỗi/không có -> trạng thái "error" (ẩn nút)
 */
export type MusicState = 'idle' | 'loading' | 'playing' | 'paused' | 'blocked' | 'error';

const MUTED_KEY = 'wp_music_muted_v1';

export class MusicPlayer {
  readonly audio: HTMLAudioElement | null;
  state: MusicState = 'idle';
  private listeners = new Set<(s: MusicState) => void>();
  private ac: AudioContext | null = null;
  private gain: GainNode | null = null;
  private wasPlaying = false;
  private started = false;

  constructor(src: string | null, private opts: { loop: boolean; startAt: number; title: string; artwork?: string }) {
    if (!src) { this.audio = null; this.state = 'error'; return; }
    const a = new Audio();
    a.preload = 'none';
    a.loop = opts.loop;
    a.src = src;
    a.addEventListener('error', () => this.set('error'));
    a.addEventListener('loadedmetadata', () => {
      if (opts.startAt > 0 && a.currentTime < opts.startAt) { try { a.currentTime = opts.startAt; } catch { /* ignore */ } }
    }, { once: true });
    a.addEventListener('waiting', () => { if (this.state === 'playing') this.set('loading'); });
    a.addEventListener('playing', () => this.set('playing'));
    a.addEventListener('pause', () => { if (this.state === 'playing' || this.state === 'loading') this.set('paused'); });
    this.audio = a;
    document.addEventListener('visibilitychange', () => (document.hidden ? this.autoPause() : this.autoResume()));
    window.addEventListener('pagehide', () => this.autoPause());
  }

  get available(): boolean { return !!this.audio && this.state !== 'error'; }
  get userMuted(): boolean {
    try { return sessionStorage.getItem(MUTED_KEY) === '1'; } catch { return false; }
  }

  onChange(fn: (s: MusicState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private set(s: MusicState) {
    if (this.state === 'error') return;
    this.state = s;
    this.listeners.forEach((fn) => fn(s));
  }

  /** Cover đang hiện: cho tải trước (trừ khi tiết kiệm dữ liệu). */
  preload(): void {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (this.audio && !conn?.saveData) this.audio.preload = 'auto';
  }

  /**
   * GỌI ĐỒNG BỘ trong handler click/tap (không await trước đó).
   * Trả về Promise để biết kết quả nhưng play() đã được gọi trong cử chỉ.
   */
  playFromGesture(fade = 1500): Promise<boolean> {
    const a = this.audio;
    if (!a || this.state === 'error') return Promise.resolve(false);
    this.setupGain();
    if (!this.started && this.opts.startAt > 0) {
      try { a.currentTime = this.opts.startAt; } catch { /* chưa có metadata */ }
    }
    this.started = true;
    this.set('loading');
    let p: Promise<void> | undefined;
    try {
      p = a.play();
    } catch {
      this.set('blocked');
      return Promise.resolve(false);
    }
    void this.ac?.resume?.();
    this.fadeIn(fade);
    this.mediaSession();
    try { sessionStorage.removeItem(MUTED_KEY); } catch { /* ignore */ }
    return (p ?? Promise.resolve())
      .then(() => { this.set('playing'); return true; })
      .catch((e: unknown) => {
        if ((e as Error)?.name === 'NotAllowedError') this.set('blocked');
        else if (this.state !== 'error') this.set('blocked');
        return false;
      });
  }

  /** Khách bấm nút nhạc. */
  toggle(): void {
    if (!this.audio) return;
    if (this.state === 'playing' || this.state === 'loading') {
      this.audio.pause();
      this.set('paused');
      try { sessionStorage.setItem(MUTED_KEY, '1'); } catch { /* ignore */ }
    } else {
      void this.playFromGesture(600);
    }
  }

  private setupGain() {
    if (this.ac || !this.audio) return;
    // iOS: đi qua Web Audio có thể bị nút gạt im lặng tắt tiếng -> xin phiên "playback" nếu trình duyệt hỗ trợ
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) { try { session.type = 'playback'; } catch { /* ignore */ } }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ac = new AC();
      const srcNode = this.ac.createMediaElementSource(this.audio);
      this.gain = this.ac.createGain();
      srcNode.connect(this.gain).connect(this.ac.destination);
    } catch {
      this.ac = null;
      this.gain = null;
    }
  }

  private fadeIn(ms: number) {
    if (!this.gain || !this.ac) return;
    const t = this.ac.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(0.0001, t);
    this.gain.gain.exponentialRampToValueAtTime(1, t + ms / 1000);
  }

  private autoPause() {
    if (!this.audio) return;
    this.wasPlaying = this.state === 'playing' || this.state === 'loading';
    if (this.wasPlaying) this.audio.pause();
  }

  private autoResume() {
    if (!this.audio || !this.wasPlaying || this.userMuted) return;
    this.wasPlaying = false;
    this.audio.play().then(() => this.fadeIn(600)).catch(() => this.set('blocked'));
  }

  private mediaSession() {
    const ms = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession;
    if (!ms || typeof MediaMetadata === 'undefined') return;
    try {
      ms.metadata = new MediaMetadata({ title: this.opts.title || 'Nhạc thiệp cưới', artist: document.title, ...(this.opts.artwork ? { artwork: [{ src: this.opts.artwork }] } : {}) });
      ms.setActionHandler('play', () => this.toggle());
      ms.setActionHandler('pause', () => this.toggle());
    } catch { /* ignore */ }
  }
}
