/**
 * Pháo hoa nhẹ ở section đếm ngược (design 5.7 `fireworks-soft`). Chunk lazy (tải khi countdown sắp vào viewport).
 * - chùm cách nhau >= 600ms (< 3 lần nháy/giây, WCAG 2.3.1), không nháy sáng cả màn
 * - R04 (design-review-v1): gốc nổ KHÔNG đặt trên tiêu đề; chỉ ở 2 dải bên cạnh 4 ô số (x < 18% / > 82%),
 *   dải giữa tiêu đề và ô số, hoặc dải ngay dưới ô số. Bán kính chùm ≤ 60px ở mobile.
 * - màu theo mode: theme sáng = accent + accent sáng + primary (1/3 số hạt), sprite sao 4 cánh có lõi sáng;
 *   theme tối giữ chấm vàng như cũ.
 */
import type { FireworksSpec } from '../intensity';
import type { ParticleField } from '../particles/field';
import type { Rect } from '../particles/geometry';

export const FW_GAP_MS = 600;
export const FW_LIFE_MS = 1000;
export const FW_DRAG = 1.4;
/** tốc độ ban đầu tối đa ở mobile: quãng bay ≈ v / drag ≤ 60px */
export const FW_MOBILE_MAX_SPEED = 80;

const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });

/** Các dải được phép đặt gốc nổ (thuần, để test). */
export function originBands(section: Rect, digits: Rect | null, head: Rect | null): Rect[] {
  const w = section.right - section.left;
  const bands: Rect[] = [];
  if (digits) {
    bands.push(
      { left: section.left + 12, right: Math.min(section.left + w * 0.18, digits.left - 12), top: digits.top, bottom: digits.bottom },
      { left: Math.max(section.right - w * 0.18, digits.right + 12), right: section.right - 12, top: digits.top, bottom: digits.bottom },
      { left: section.left + w * 0.15, right: section.right - w * 0.15, top: digits.bottom + 16, bottom: Math.min(section.bottom - 32, digits.bottom + 140) },
    );
    if (head) bands.push({ left: section.left + w * 0.2, right: section.right - w * 0.2, top: head.bottom + 16, bottom: digits.top - 16 });
  } else {
    const top = head ? head.bottom + 16 : section.top + 24;
    bands.push({ left: section.left + 24, right: section.right - 24, top, bottom: Math.max(top + 1, section.bottom - 32) });
  }
  return bands.filter((b) => b.right - b.left >= 4 && b.bottom - b.top >= 4);
}

const inside = (x: number, y: number, r: Rect | null, m: number) => !!r && x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;

/** Chọn gốc nổ trong các dải cho phép, tránh khối số (+12px) và tiêu đề (+16px). */
export function pickOrigin(section: Rect, digits: Rect | null, rnd = Math.random, head: Rect | null = null): { x: number; y: number } {
  const bands = originBands(section, digits, head);
  const total = bands.reduce((s, b) => s + (b.right - b.left) * (b.bottom - b.top), 0);
  for (let i = 0; i < 12 && total > 0; i++) {
    let k = rnd() * total;
    const b = bands.find((x) => (k -= (x.right - x.left) * (x.bottom - x.top)) <= 0) ?? bands[bands.length - 1]!;
    const x = b.left + rnd() * (b.right - b.left);
    const y = b.top + rnd() * (b.bottom - b.top);
    if (!inside(x, y, digits, 12) && !inside(x, y, head, 16)) return { x, y };
  }
  // dự phòng: ngay dưới khối số, giữa section
  const cx = (section.left + section.right) / 2;
  return { x: cx, y: digits ? Math.min(section.bottom - 24, digits.bottom + 40) : (section.top + section.bottom) / 2 };
}

/** Trộn 2 màu hex (t = tỉ lệ màu b). */
export function mixHex(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

export interface FireworksPalette { colors: string[]; star: boolean }

/** Bảng màu pháo hoa theo mode (R04b). Theme sáng: [accent, accent sáng, primary] -> primary đúng 1/3 số hạt. */
export function fireworksPalette(t: { accent: string; primary: string; primaryDecor: string }, mode: 'light' | 'dark'): FireworksPalette {
  if (mode === 'dark') return { colors: [t.primaryDecor, t.accent], star: false };
  return { colors: [t.accent, mixHex(t.accent, '#ffffff', 0.45), t.primary], star: true };
}

export function ensureSparkSprites(field: ParticleField, pal: FireworksPalette): void {
  pal.colors.forEach((c, i) =>
    field.makeSprite(`fw${pal.star ? 's' : ''}${i}`, 6, (g, s) => {
      const r = s / 2;
      if (pal.star) {
        // sao 4 cánh + lõi sáng (không dùng chấm tròn - tránh "bụi nâu" trên nền sáng)
        g.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4 - Math.PI / 2;
          const rr = k % 2 ? r * 0.28 : r;
          g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.closePath();
        g.fillStyle = c;
        g.fill();
        g.beginPath();
        g.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        g.fillStyle = '#fff';
        g.fill();
        return;
      }
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grd.addColorStop(0, c);
      grd.addColorStop(0.5, c);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(-r, -r, s, s);
    }),
  );
}

export function playFireworks(field: ParticleField, sectionEl: HTMLElement, digitsEl: HTMLElement | null, spec: FireworksSpec, pal: FireworksPalette, headEl: HTMLElement | null = null): Promise<void> {
  ensureSparkSprites(field, pal);
  const n0 = pal.colors.length;
  return new Promise((resolve) => {
    let n = 0;
    const one = () => {
      const sec = toRect(sectionEl.getBoundingClientRect());
      const dig = digitsEl ? toRect(digitsEl.getBoundingClientRect()) : null;
      const head = headEl ? toRect(headEl.getBoundingClientRect()) : null;
      const o = pickOrigin(sec, dig, Math.random, head);
      const mobile = window.innerWidth < 768;
      const list = [];
      for (let i = 0; i < spec.perBurst; i++) {
        const ang = (i / spec.perBurst) * Math.PI * 2 + Math.random() * 0.2;
        const sp = (70 + Math.random() * 70) * (mobile ? FW_MOBILE_MAX_SPEED / 140 : 1);
        list.push({ x: o.x, y: o.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, size: pal.star ? 6 : 4 + Math.random() * 2,
          life: FW_LIFE_MS * (0.8 + Math.random() * 0.2), gravity: 40, drag: FW_DRAG,
          sprite: `fw${pal.star ? 's' : ''}${pal.star ? i % n0 : (n + i) % n0}`, clip: sec, spin: pal.star ? 1.5 : 0 });
      }
      field.addBurst(list);
      n++;
      if (n < spec.bursts) setTimeout(one, FW_GAP_MS);
      else setTimeout(resolve, FW_LIFE_MS);
    };
    one();
  });
}
