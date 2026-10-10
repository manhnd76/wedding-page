/**
 * Kiểu mở `light-gather` - Hạt sáng tụ thành tên (design-v4a-2bc §2.8, họ toàn màn, chi phí CAO).
 * Canvas riêng TRONG `.cover` (gỡ cùng cover; ngoại lệ "1 canvas" đã duyệt) vì cần 400–700 điểm có đích (trần burst 120).
 * Tên cặp đôi vẫn là chữ HTML (LCP, trình đọc màn hình); hạt tụ đúng vào vị trí chữ (lấy mẫu từ từng span theo font thật).
 * Chờ: 120 hạt trôi chậm né khối tên, DỪNG sau 5s (WCAG 2.2.2). Đo FPS 1s (chính sách "Còn mở #4"): ≥ 45 giữ;
 * < 45 -> 250 hạt + đo lại 1s; vẫn < 45 hoặc lần đầu < 30 -> nhánh Nhẹ (fade-zoom + 12 hạt lấp lánh).
 * Vừa 2.4s: tụ 0–1100 · giữ 1100–1700 (nhịp sáng) · tản 1700–2400; chữ HTML 1→.18 (0–300) ->0 (1700–1900); nền mờ 1800–2400.
 * Đồng hồ canvas = currentTime của 1 animation WAAPI "đồng hồ" -> tua nhanh (playbackRate) tự áp cho canvas.
 */
import './light-gather.css';
import { ctx } from '../../context';
import { measureFps } from '../../effects/perf-probe';
import { type OpenLevelCtx, type OpenRun } from '../anim';
import { fadeZoom, type OpenPrepareInfo } from '../open-registry';
import { bind, center, fade, tl, type Timeline } from '../open-kit/layers';
import { coverSparks, gold, prepareSparks } from '../open-kit/sparks';

const IDLE = 120;
const IDLE_MAX_MS = 5000;

/** Lấy mẫu điểm: lưới `step` px, alpha > 128, xáo trộn (Fisher-Yates) rồi lấy tối đa `n` điểm KHÁC nhau. */
export function samplePoints(alpha: ArrayLike<number>, w: number, h: number, step: number, n: number, rnd = Math.random): [number, number][] {
  const pts: [number, number][] = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if ((alpha[y * w + x] ?? 0) > 128) pts.push([x, y]);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pts[i], pts[j]] = [pts[j]!, pts[i]!]; }
  return pts.slice(0, n);
}

/** Chính sách FPS: lần đo 1 (+ lần 2 nếu đã giảm hạt) -> giữ / giảm còn 250 / nhánh Nhẹ. */
export function fpsPolicy(fps1: number, fps2?: number): 'keep' | 'reduce' | 'fallback' {
  if (fps1 < 30) return 'fallback';
  if (fps1 >= 45) return 'keep';
  if (fps2 === undefined) return 'reduce';
  return fps2 >= 45 ? 'keep' : 'fallback';
}

export function timeline(level: OpenLevelCtx['level']): Timeline {
  if (level === 'light') return tl([]);
  return tl([
    { k: 'lg-cv', f: [{ opacity: 1 }, { opacity: 1 }], s: 0, d: 2400, e: 'linear' }, // đồng hồ canvas
    { k: 'cv-names', f: [{ opacity: 1 }, { opacity: 0.18 }], s: 0, d: 300 },
    { k: 'cv-names', f: [{ opacity: 0.18 }, { opacity: 0 }], s: 1700, d: 200 },
    fade('cv-head', 0, 300), fade('cv-guestline', 0, 300),
    fade('cover', 1800, 600),
  ]);
}

interface P { x: number; y: number; vx: number; vy: number; tx: number; ty: number; d: number; a: number; s: number; sx: number; sy: number }

let st: { cv: HTMLCanvasElement; g: CanvasRenderingContext2D; spr: HTMLCanvasElement; ps: P[]; pts: [number, number][]; raf: number; dpr: number; box: DOMRect } | null = null;
let degraded = false;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function sprite(c1: string, c2: string, dpr: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const s = (c.width = c.height = Math.ceil(8 * dpr));
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, c2); grd.addColorStop(0.3, c1); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  return c;
}

function draw(): void {
  const { g, cv, spr, ps, dpr } = st!;
  g.clearRect(0, 0, cv.width, cv.height);
  for (const p of ps) {
    if (p.a <= 0.01) continue;
    g.globalAlpha = Math.min(1, p.a);
    const s = p.s * dpr;
    g.drawImage(spr, p.x * dpr - s / 2, p.y * dpr - s / 2, s, s);
  }
}

/** Vẽ từng span tên lên canvas phụ ở đúng vị trí DOM, lấy mẫu điểm (bước 2px - font script). */
function namePoints(cover: HTMLElement, n: number): [number, number][] {
  const w = innerWidth, h = innerHeight;
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const o = off.getContext('2d', { willReadFrequently: true })!;
  cover.querySelectorAll<HTMLElement>('.cv-names > span:not(.sr-only)').forEach((sp) => {
    const r = sp.getBoundingClientRect();
    const cs = getComputedStyle(sp);
    o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = o.measureText(sp.textContent ?? '');
    const asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
    o.fillText(sp.textContent ?? '', r.left + (r.width - m.width) / 2, r.top + asc + (r.height - asc - desc) / 2);
  });
  const data = o.getImageData(0, 0, w, h).data;
  const alpha = new Uint8ClampedArray(w * h);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3]!;
  return samplePoints(alpha, w, h, 2, n);
}

export async function prepare(cover: HTMLElement, info: OpenPrepareInfo): Promise<void> {
  degraded = false;
  if (info.mode === 'light') { void prepareSparks(); return; }
  if (info.mode === 'fade200') return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cv = document.createElement('canvas');
  cv.className = 'lg-cv';
  cv.setAttribute('aria-hidden', 'true');
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  cover.querySelector('.op-layers')!.append(cv);
  const dark = document.documentElement.dataset.mode === 'dark';
  const t = ctx.resolved.tokens;
  const [c1, c2] = dark ? ['#F3D48C', '#FFF4D6'] : [t.primaryDecor, t.accent];
  const g = cv.getContext('2d')!;
  // theme tối: cộng sáng; theme sáng: source-over (với 'lighter' trên nền giấy hạt biến mất)
  if (dark) g.globalCompositeOperation = 'lighter';
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts?.ready) await Promise.race([fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  const box = cover.querySelector('.cv-names')!.getBoundingClientRect();
  st = { cv, g, spr: sprite(c1!, c2!, dpr), ps: [], pts: namePoints(cover, info.mode === 'full+' ? 700 : 400), raf: 0, dpr, box };
  const ps = st.ps;
  for (let i = 0; i < IDLE; i++) {
    const a = rnd(0, Math.PI * 2);
    const v = rnd(8, 16);
    ps.push({ x: rnd(0, innerWidth), y: rnd(0, innerHeight), vx: Math.cos(a) * v, vy: Math.sin(a) * v, tx: 0, ty: 0, d: 0, a: rnd(0.35, 0.7), s: rnd(3, 5), sx: 0, sy: 0 });
  }
  // chờ: trôi chậm, né khối tên +12px (alpha ≤ .25 trong vùng), dừng sau 5s
  const t0 = performance.now();
  let last = t0;
  const idle = (now: number) => {
    if (!st) return;
    const dt = Math.min(50, now - last) / 1000;
    last = now;
    for (const p of ps) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      const inBox = p.x > box.left - 12 && p.x < box.right + 12 && p.y > box.top - 12 && p.y < box.bottom + 12;
      if (inBox) p.a = Math.min(p.a, 0.25);
      else if (p.a < 0.35) p.a += dt;
    }
    draw();
    st.raf = now - t0 < IDLE_MAX_MS ? requestAnimationFrame(idle) : 0;
  };
  st.raf = requestAnimationFrame(idle);
  // FPS 1s (+1s khi đã giảm hạt) - quyết định xong trước khi nút "Chạm để mở" bật
  const f1 = await measureFps(1000);
  let pol = fpsPolicy(f1);
  if (pol === 'reduce' && st) { st.pts = st.pts.slice(0, 250); pol = fpsPolicy(f1, await measureFps(1000)); }
  if (pol === 'fallback' && st) {
    degraded = true;
    cover.dataset.effective = 'fade-zoom';
    cancelAnimationFrame(st.raf);
    cv.remove();
    st = null;
    void prepareSparks();
  }
}

/** Cỡ 12 sao `sparkle` mức Nhẹ (P09: sao 4 cánh trên cover tối thiểu 6 px). */
export const LIGHT_SPARK_SIZE: [number, number] = [6, 11];

function lightBranch(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  void coverSparks({ count: 12, kind: ['sparkle', 'gold-dust'], colors: gold(), size: LIGHT_SPARK_SIZE, origin: center(cover.querySelector('.cv-names')), spread: [90, 50], speed: [10, 40], gravity: 0, drag: 1, life: [700, 1000] });
  return fadeZoom(cover, { ...c, level: 'light' });
}

export function play(cover: HTMLElement, c: OpenLevelCtx): OpenRun {
  if (c.level === 'light' || degraded || !st) return lightBranch(cover, c);
  const s = st;
  cancelAnimationFrame(s.raf);
  const { pts, box } = s;
  // 120 hạt đang trôi + hạt mới sinh ở mép màn; mỗi hạt 1 đích khác nhau
  while (s.ps.length < pts.length) {
    const e = Math.floor(rnd(0, 4));
    s.ps.push({ x: e === 0 ? -6 : e === 1 ? innerWidth + 6 : rnd(0, innerWidth), y: e === 2 ? -6 : e === 3 ? innerHeight + 6 : rnd(0, innerHeight), vx: 0, vy: 0, tx: 0, ty: 0, d: 0, a: 0, s: 0, sx: 0, sy: 0 });
  }
  s.ps.length = pts.length;
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  s.ps.forEach((p, i) => {
    [p.tx, p.ty] = pts[i]!;
    p.sx = p.x; p.sy = p.y; p.d = rnd(0, 200); p.s = rnd(2.4, 4.4);
    const a = Math.atan2(p.ty - cy, p.tx - cx) + rnd(-0.4, 0.4);
    const v = rnd(40, 160);
    p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v;
  });
  const run = bind(cover, timeline(c.level), c);
  const clock = s.cv.getAnimations()[0];
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const frame = () => {
    const t = Number(clock?.currentTime ?? 2400);
    for (const p of s.ps) {
      if (t < 1100) {
        const k = ease(Math.max(0, Math.min(1, (t - p.d) / (1100 - p.d))));
        p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k;
        p.a = 0.4 + 0.5 * k;
      } else if (t < 1700) {
        p.x = p.tx + rnd(-0.3, 0.3); p.y = p.ty + rnd(-0.3, 0.3);
        p.a = 0.8 + 0.2 * Math.sin(((t - 1100) / 600) * Math.PI);
      } else {
        const u = (t - 1700) / 1000;
        p.x = p.tx + p.vx * u; p.y = p.ty + p.vy * u + 15 * u * u;
        p.a = Math.max(0, 0.8 * (1 - (t - 1700) / 700));
      }
    }
    draw();
    if (t < 2400 && cover.isConnected) s.raf = requestAnimationFrame(frame);
  };
  s.raf = requestAnimationFrame(frame);
  return run;
}

export function dispose(): void {
  if (st) cancelAnimationFrame(st.raf);
  st = null;
}
