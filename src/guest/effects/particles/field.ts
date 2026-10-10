/**
 * ParticleField: 1 canvas fixed duy nhất cho hạt nền + burst (design 5.6, 5.7; solution 8.4).
 * - sprite vẽ sẵn ra canvas phụ 2 cỡ, mỗi frame chỉ drawImage
 * - 4 mô hình chuyển động: fall / float-up / drift / twinkle; lật giả bằng scaleX = cos(phase)
 * - trần 40 hạt nền + 120 hạt burst; DPR <= 2 (máy yếu = 1); frame > 2ms 3 lần liên tiếp -> giảm 25% hạt
 * - 4 lớp bảo vệ: mật độ theo section / vùng loại trừ / tạm dừng / trần theo cấp-máy
 */
import { ctx, fxBlocked, on } from '../../context';
import { targetParticleCount, type FxState } from '../intensity';
import { COVER_SOFT_ALPHA, MAX_SOFT_ZONES, SOFT_ALPHA, SOFT_SELECTOR, SpawnLimiter, alphaTarget, approach, visibleZones, weightedDensity, type Rect, type SectionVis } from './geometry';
import type { Motion, ParticleKind } from './kind';

export const BG_HARD_CAP = 40;
export const BURST_HARD_CAP = 120;

interface P {
  x: number; y: number; vx: number; vy: number; s: number;
  rot: number; vr: number; ph: number; phs: number; sway: number;
  a: number; motion: Motion | 'burst'; flip: boolean; spr: HTMLCanvasElement; sprSmall: HTMLCanvasElement;
  // burst
  age: number; life: number; gravity: number; drag: number; toBg: boolean; clip: Rect | null; kindIdx: number;
  /** trần alpha trong vùng dịu (burst trên cover: .75; còn lại .3) */
  softA?: number;
}

export interface BurstParticle {
  x: number; y: number; vx: number; vy: number; size: number; life: number;
  gravity?: number; drag?: number; sprite: string; toBg?: boolean; clip?: Rect | null; spin?: number; kindIdx?: number;
}

export interface FieldOptions {
  state: FxState;
  lowEnd: boolean;
  kinds: ParticleKind[];
  colors: string[];
  themeDensity: number;
  scope: 'all' | 'hero-thankyou';
  wind: boolean;
  background: boolean;
  /** màu "theme": loại có màu tự nhiên (hoa đào, đom đóm) dùng màu riêng */
  themeColors: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class ParticleField {
  readonly canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private bg: P[] = [];
  private bursts: P[] = [];
  private sprites = new Map<string, [HTMLCanvasElement, HTMLCanvasElement]>();
  private raf = 0;
  private last = 0;
  private running = false;
  private ramp = 1;
  private overCount = 0;
  private multiplier = 1;
  private bgOff = false;
  private windOn: boolean;
  private windVx = 0;
  private lastScrollY = 0;
  private lastScrollT = 0;
  private limiter = new SpawnLimiter(2, 0);
  private sections = new Map<Element, SectionVis>();
  private density = { density: 1, maxOpacity: 1 };
  private zoneEls: Element[] = [];
  private zones: Rect[] = [];
  /** vùng dịu (R03): chữ trọng tâm, hạt mờ xuống ≤ 0.3 */
  private softEls: Element[] = [];
  private soft: Rect[] = [];
  private zonesDirty = true;
  private io: IntersectionObserver | null = null;
  private ro: ResizeObserver | null = null;
  /** hạt chạy TRÊN cover (kiểu mở có hạt, E12): bỏ điều kiện `!ctx.opened`, chỉ dừng khi tab ẩn */
  private overCover = false;
  timeScale = 1;
  /** số frame đã vẽ (debug/test) */
  frames = 0;

  constructor(private o: FieldOptions) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fx-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.g = this.canvas.getContext('2d')!;
    this.windOn = o.wind && !o.lowEnd;
    document.body.appendChild(this.canvas);
    this.resize();
    window.addEventListener('resize', () => { this.resize(); this.zonesDirty = true; }, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    on('pause-change', () => this.syncPause());
    this.prepareSprites();
    if (o.background) this.observeSections();
    this.observeZones();
  }

  // ---------- sprites
  private prepareSprites() {
    const { kinds, colors } = this.o;
    kinds.forEach((k, i) => {
      const pal = this.o.themeColors && k.natural ? k.natural : colors;
      const c1 = pal[0] ?? '#C9A86A';
      const c2 = pal[1] ?? c1;
      this.makeSprite(`k${i}`, k.size[1], (g, s) => k.draw(g, s, c1, c2));
    });
  }

  /** Vẽ sprite ra canvas phụ ở 2 cỡ (lớn = cỡ tối đa × DPR, nhỏ = nửa). */
  makeSprite(key: string, cssSize: number, draw: (g: CanvasRenderingContext2D, s: number) => void): void {
    if (this.sprites.has(key)) return;
    const mk = (px: number) => {
      const c = document.createElement('canvas');
      const size = Math.max(4, Math.ceil(px));
      c.width = c.height = size;
      const g = c.getContext('2d');
      if (g) { g.translate(size / 2, size / 2); draw(g, size * 0.92); }
      return c;
    };
    const big = cssSize * this.dpr;
    this.sprites.set(key, [mk(big), mk(big / 2)]);
  }

  // ---------- lớp 1: mật độ theo section đang hiện
  private observeSections() {
    if (!('IntersectionObserver' in window)) return;
    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        this.sections.set(el, {
          visible: e.isIntersecting ? e.intersectionRect.height : 0,
          density: Number(el.dataset.pd ?? 0.5),
          maxOpacity: Number(el.dataset.po ?? 0.8),
          group: el.dataset.type === 'hero' || el.dataset.type === 'thankyou' ? 'hero-thankyou' : 'other',
        });
      }
      this.density = weightedDensity([...this.sections.values()], this.o.scope);
      this.ensureRunning();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    document.querySelectorAll('[data-pd]').forEach((el) => this.io!.observe(el));
  }

  // ---------- lớp 2: vùng loại trừ (form, thẻ sự kiện)
  private observeZones() {
    this.zoneEls = Array.from(document.querySelectorAll('[data-fx-exclude]'));
    this.softEls = Array.from(document.querySelectorAll(SOFT_SELECTOR));
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => { this.zonesDirty = true; });
      this.zoneEls.forEach((el) => this.ro!.observe(el));
    }
  }
  refreshZones(): void {
    this.zoneEls = Array.from(document.querySelectorAll('[data-fx-exclude]'));
    this.softEls = Array.from(document.querySelectorAll(SOFT_SELECTOR));
    this.zonesDirty = true;
  }
  private zonesAt = 0;
  private updateZones() {
    // làm mới định kỳ 250ms: reveal (transform) dịch phần tử mà không phát sự kiện scroll/resize
    const now = performance.now();
    if (!this.zonesDirty && now - this.zonesAt < 250) return;
    this.zonesDirty = false;
    this.zonesAt = now;
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    this.zones = visibleZones(this.zoneEls.map(rect), this.w, this.h);
    // ≤ 4 vùng dịu gần giữa màn (chi phí: ≤ 4 hình chữ nhật mỗi frame)
    this.soft = visibleZones(this.softEls.map(rect), this.w, this.h, MAX_SOFT_ZONES);
  }

  private onScroll = () => {
    this.zonesDirty = true;
    if (!this.windOn) return;
    const now = performance.now();
    const y = window.scrollY;
    if (document.documentElement.classList.contains('is-autoscroll')) { this.lastScrollY = y; this.lastScrollT = now; return; }
    const dt = Math.max(16, now - this.lastScrollT);
    const v = ((y - this.lastScrollY) / dt) * 1000; // px/s
    this.lastScrollY = y;
    this.lastScrollT = now;
    this.windVx = Math.max(-120, Math.min(120, -v * 0.2 * 0.3));
  };

  // ---------- kích thước
  private resize() {
    this.dpr = this.o.lowEnd ? 1 : Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  // ---------- mục tiêu số hạt
  target(): number {
    // hạt nền không chạy khi cover còn hiện (kể cả chế độ over-cover: chỉ burst)
    if (!ctx.opened) return 0;
    if (!this.o.background || this.bgOff || !this.o.kinds.length) return 0;
    const typeFactor = this.o.kinds.reduce((s, k) => s + k.density, 0) / this.o.kinds.length;
    const t = targetParticleCount(this.o.state, this.o.lowEnd, typeFactor, this.o.themeDensity, this.density.density);
    return Math.min(BG_HARD_CAP, Math.round(t * this.multiplier));
  }

  private spawnBg(seed: boolean): void {
    const ki = Math.floor(Math.random() * this.o.kinds.length);
    const k = this.o.kinds[ki]!;
    const [spr, small] = this.sprites.get(`k${ki}`)!;
    const s = rand(k.size[0], k.size[1]);
    const sp = rand(k.speed[0], k.speed[1]);
    const p: P = {
      x: rand(0, this.w), y: 0, vx: 0, vy: 0, s, rot: rand(0, Math.PI * 2), vr: rand(-1, 1) * (k.spin ?? 0),
      ph: rand(0, Math.PI * 2), phs: rand(0.8, 1.8), sway: rand(10, 28), a: 0, motion: k.motion, flip: !!k.flip,
      spr, sprSmall: small, age: 0, life: 0, gravity: 0, drag: 0, toBg: false, clip: null, kindIdx: ki,
    };
    switch (k.motion) {
      case 'fall': p.vy = sp; p.y = seed ? rand(0, this.h) : -s; break;
      case 'float-up': p.vy = -sp; p.y = seed ? rand(0, this.h) : this.h + s; break;
      case 'drift': p.vx = sp; p.vy = sp * 0.25; p.x = seed ? rand(0, this.w) : -s; p.y = rand(0, this.h * 0.8); break;
      case 'twinkle': p.vy = sp; p.vx = rand(-6, 6); p.y = rand(0, this.h); break;
    }
    this.bg.push(p);
  }

  // ---------- burst
  addBurst(list: BurstParticle[]): void {
    for (const b of list) {
      if (this.bursts.length >= BURST_HARD_CAP) break;
      const sp = this.sprites.get(b.sprite);
      if (!sp) continue;
      this.bursts.push({
        x: b.x, y: b.y, vx: b.vx, vy: b.vy, s: b.size, rot: rand(0, Math.PI * 2), vr: rand(-1, 1) * (b.spin ?? 2),
        ph: rand(0, Math.PI * 2), phs: rand(1, 2), sway: 0, a: 1, motion: 'burst', flip: b.sprite.startsWith('k'),
        spr: sp[0], sprSmall: sp[1], age: 0, life: b.life, gravity: b.gravity ?? 0, drag: b.drag ?? 0,
        toBg: !!b.toBg, clip: b.clip ?? null, kindIdx: b.kindIdx ?? 0,
        softA: this.overCover ? COVER_SOFT_ALPHA : SOFT_ALPHA,
      });
    }
    this.ensureRunning();
  }

  get burstActive(): number { return this.bursts.length; }
  get size() { return { w: this.w, h: this.h }; }

  // ---------- hạ cấp (FPS < 45, design 5.10)
  degrade(step: 'wind' | 'halfParticles' | 'particles'): void {
    if (step === 'wind') this.windOn = false;
    if (step === 'halfParticles') this.multiplier *= 0.5;
    if (step === 'particles') this.bgOff = true;
  }

  // ---------- vòng lặp
  start(): void {
    if (this.o.background && this.bg.length === 0) {
      const n = Math.ceil(this.target() / 2);
      for (let i = 0; i < n; i++) this.spawnBg(true);
      this.ramp = 0;
    }
    this.ensureRunning();
  }

  /**
   * Bật/tắt chế độ hạt TRÊN cover (solution-v4a-2bc.md 0.4): canvas thêm class `is-over-cover`
   * (CSS đưa lên trên `--z-cover`), vòng lặp chỉ dừng khi tab ẩn. Tắt khi cover đã gỡ.
   */
  setOverCover(on: boolean): void {
    if (this.overCover === on) return;
    this.overCover = on;
    this.canvas.classList.toggle('is-over-cover', on);
    if (this.blocked()) this.stop();
    else this.ensureRunning();
  }

  private blocked(): boolean {
    return this.overCover ? document.hidden : fxBlocked();
  }

  private syncPause() {
    if (this.blocked()) this.stop();
    else { this.ramp = 0; this.ensureRunning(); }
  }

  private ensureRunning() {
    if (this.running || this.blocked()) return;
    if (!this.bursts.length && this.target() === 0 && !this.bg.length) return;
    this.running = true;
    this.canvas.classList.remove('is-paused');
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.canvas.classList.add('is-paused');
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const t0 = performance.now();
    const dtMs = Math.min(50, now - this.last) * this.timeScale;
    this.last = now;
    this.step(dtMs);
    this.draw();
    this.frames++;
    // ngân sách 2ms/frame
    if (performance.now() - t0 > 2) {
      if (++this.overCount >= 3) { this.multiplier = Math.max(0.25, this.multiplier * 0.75); this.overCount = 0; }
    } else this.overCount = 0;
    if (!this.bursts.length && !this.bg.length && this.target() === 0) { this.running = false; this.g.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Cập nhật vị trí (tách riêng để test). */
  step(dtMs: number): void {
    const dt = dtMs / 1000;
    this.updateZones();
    this.ramp = Math.min(1, this.ramp + dtMs / 300);
    this.windVx *= Math.exp(-dtMs / 600);
    const target = this.target();
    this.limiter.tick(dtMs);
    if (this.bg.length < target && this.limiter.take()) this.spawnBg(false);
    const maxA = this.density.maxOpacity;
    const w = this.w;
    const h = this.h;
    const alive: P[] = [];
    const gone: P[] = [];
    for (const p of this.bg) {
      p.ph += p.phs * dt;
      p.rot += p.vr * dt;
      p.x += (p.vx + Math.sin(p.ph) * p.sway + this.windVx) * dt;
      p.y += p.vy * dt;
      let tA = alphaTarget(p.x, p.y, maxA, this.zones, this.soft);
      if (p.motion === 'twinkle') tA *= 0.55 + 0.45 * Math.sin(p.ph * 2.2);
      p.a = approach(p.a, tA, dtMs, 200);
      const off = p.y > h + p.s * 2 || p.y < -p.s * 3 || p.x > w + p.s * 3 || p.x < -p.s * 3;
      (off ? gone : alive).push(p);
    }
    // hạt rơi khỏi màn: tái sinh ở mép vào nếu còn thiếu so với mục tiêu, thừa thì bỏ (không xoá đột ngột hạt đang hiện)
    for (const p of gone) {
      if (alive.length >= target) break;
      if (p.motion === 'float-up') { p.y = h + p.s; p.x = rand(0, w); }
      else if (p.motion === 'drift') { p.x = -p.s; p.y = rand(0, h * 0.8); }
      else { p.y = -p.s; p.x = rand(0, w); }
      p.a = 0;
      alive.push(p);
    }
    const out = alive;
    this.bg = out;
    const bOut: P[] = [];
    for (const p of this.bursts) {
      p.age += dtMs;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d;
      p.vy = p.vy * d + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.ph += p.phs * dt * 3;
      const k = p.age / p.life;
      let a = k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3);
      if (p.clip) {
        const edge = Math.min(p.x - p.clip.left, p.clip.right - p.x, p.y - p.clip.top, p.clip.bottom - p.y);
        a *= Math.max(0, Math.min(1, edge / 24));
      }
      p.a = Math.min(a, alphaTarget(p.x, p.y, 1, this.zones, this.soft, p.softA));
      if (p.age >= p.life) {
        if (p.toBg && this.bg.length < target && this.o.kinds[p.kindIdx]) {
          const k2 = this.o.kinds[p.kindIdx]!;
          p.motion = k2.motion; p.vy = rand(k2.speed[0], k2.speed[1]) * (k2.motion === 'float-up' ? -1 : 1);
          p.vx = 0; p.sway = rand(10, 28); p.a = maxA; p.vr = rand(-1, 1) * (k2.spin ?? 0); p.softA = SOFT_ALPHA;
          this.bg.push(p);
        }
        continue;
      }
      bOut.push(p);
    }
    this.bursts = bOut;
  }

  private draw() {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const dpr = this.dpr;
    const draw = (p: P) => {
      if (p.a <= 0.01) return;
      const sx = p.flip ? Math.cos(p.ph) : 1;
      const c = Math.cos(p.rot) * dpr;
      const s = Math.sin(p.rot) * dpr;
      g.globalAlpha = p.a * this.ramp;
      g.setTransform(c * sx, s * sx, -s, c, p.x * dpr, p.y * dpr);
      const img = p.s * dpr > p.sprSmall.width ? p.spr : p.sprSmall;
      g.drawImage(img, -p.s / 2, -p.s / 2, p.s, p.s);
    };
    this.bg.forEach(draw);
    this.bursts.forEach(draw);
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Hook debug (?debug=fx): vị trí + alpha hạt đang vẽ, vùng loại trừ hiện tại. */
  debugSnapshot() {
    return {
      bg: this.bg.map((p) => ({ x: p.x, y: p.y, a: p.a * this.ramp })),
      bursts: this.bursts.map((p) => ({ x: p.x, y: p.y, a: p.a })),
      zones: this.zones,
      soft: this.soft,
      target: this.target(),
      running: this.running,
      frames: this.frames,
    };
  }

  destroy(): void {
    this.stop();
    this.io?.disconnect();
    this.ro?.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    this.canvas.remove();
  }
}

/** Màu hạt theo config (design 5.7): theme = accent/primary-decor; multi = accent + accent-2; hex. */
export function particleColors(color: string): { colors: string[]; theme: boolean } {
  const t = ctx.resolved.tokens;
  if (color === 'multi') return { colors: [t.accent, t.accent2], theme: false };
  if (/^#[0-9a-f]{6}$/i.test(color)) return { colors: [color, color], theme: false };
  return { colors: [t.accent, t.primaryDecor], theme: true };
}
