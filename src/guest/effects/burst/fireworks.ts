/**
 * Pháo hoa nhẹ ở section đếm ngược (design 5.7 `fireworks-soft`). Chunk lazy (tải khi countdown sắp vào viewport).
 * - chùm cách nhau >= 600ms (< 3 lần nháy/giây, WCAG 2.3.1), không nháy sáng cả màn
 * - gốc nổ ở 2 bên / phía trên 4 ô số, không đè chữ số; hạt mờ dần trước mép section
 */
import type { FireworksSpec } from '../intensity';
import type { ParticleField } from '../particles/field';
import type { Rect } from '../particles/geometry';

export const FW_GAP_MS = 600;
export const FW_LIFE_MS = 1000;

const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });

/** Chọn gốc nổ trong section, tránh khối số (+ biên 12px). */
export function pickOrigin(section: Rect, digits: Rect | null, rnd = Math.random): { x: number; y: number } {
  for (let i = 0; i < 12; i++) {
    const x = section.left + 24 + rnd() * Math.max(1, section.right - section.left - 48);
    const y = section.top + 24 + rnd() * Math.max(1, (section.bottom - section.top) * 0.6);
    if (!digits || x < digits.left - 12 || x > digits.right + 12 || y < digits.top - 12 || y > digits.bottom + 12) return { x, y };
  }
  return { x: section.left + 32, y: section.top + 32 };
}

export function ensureSparkSprites(field: ParticleField, colors: string[]): void {
  colors.forEach((c, i) =>
    field.makeSprite(`fw${i}`, 6, (g, s) => {
      const r = s / 2;
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grd.addColorStop(0, c);
      grd.addColorStop(0.5, c);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(-r, -r, s, s);
    }),
  );
}

export function playFireworks(field: ParticleField, sectionEl: HTMLElement, digitsEl: HTMLElement | null, spec: FireworksSpec, colors: string[]): Promise<void> {
  ensureSparkSprites(field, colors);
  return new Promise((resolve) => {
    let n = 0;
    const one = () => {
      const sec = toRect(sectionEl.getBoundingClientRect());
      const dig = digitsEl ? toRect(digitsEl.getBoundingClientRect()) : null;
      const o = pickOrigin(sec, dig);
      const list = [];
      const ci = n % colors.length;
      for (let i = 0; i < spec.perBurst; i++) {
        const ang = (i / spec.perBurst) * Math.PI * 2 + Math.random() * 0.2;
        const sp = 70 + Math.random() * 70;
        list.push({ x: o.x, y: o.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, size: 4 + Math.random() * 2,
          life: FW_LIFE_MS * (0.8 + Math.random() * 0.2), gravity: 40, drag: 1.4, sprite: `fw${(ci + (i % 2)) % colors.length}`, clip: sec, spin: 0 });
      }
      field.addBurst(list);
      n++;
      if (n < spec.bursts) setTimeout(one, FW_GAP_MS);
      else setTimeout(resolve, FW_LIFE_MS);
    };
    one();
  });
}
