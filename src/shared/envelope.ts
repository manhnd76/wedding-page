/**
 * Mẫu phong bì (design-review-v1 mục 3.2 + 4): hình học SVG dùng chung cho skin guest (`src/guest/cover/skins/*`)
 * và poster thu nhỏ trong admin. Hệ toạ độ chung viewBox 0 0 340 238 (tỉ lệ 10:7).
 * Chỉ dữ liệu + hàm thuần (không DOM).
 */
import type { EnvelopeStyle } from './config/enums.ts';

export const ENV_W = 340;
export const ENV_H = 238;

export interface EnvelopeMeta {
  id: EnvelopeStyle;
  /** tên trong admin */
  name: string;
  /** màu cố định khi color = "auto" (velvet: chỉ khi theme sáng) */
  fixed: boolean;
}

export const ENVELOPE_META: Record<EnvelopeStyle, EnvelopeMeta> = {
  classic: { id: 'classic', name: 'Cổ điển · dấu sáp', fixed: false },
  kraft: { id: 'kraft', name: 'Giấy kraft · dây gai', fixed: true },
  'song-hy': { id: 'song-hy', name: 'Phong bì đỏ Song Hỷ', fixed: true },
  lace: { id: 'lace', name: 'Ren & hoa', fixed: false },
  minimal: { id: 'minimal', name: 'Tối giản', fixed: false },
  velvet: { id: 'velvet', name: 'Nhung đêm', fixed: true },
};

/** Bảng màu cố định (design-review-v1 4.2). ink luôn ≥ 4.5:1 trên paper. */
export const ENVELOPE_FIXED_PALETTE: Partial<Record<EnvelopeStyle, { paper: string; paper2: string; edge: string; ink: string; liner: string; seal: string }>> = {
  kraft: { paper: '#D8B98F', paper2: '#C9A47A', edge: '#A88760', ink: '#3A2A20', liner: '#8B6B4A', seal: '#8B6B4A' },
  'song-hy': { paper: '#A3201D', paper2: '#8E1B18', edge: '#D4A23C', ink: '#FFF4DC', liner: '#D4A23C', seal: '#D4A23C' },
  velvet: { paper: '#1C1517', paper2: '#2A1F22', edge: '#D9B77E', ink: '#F2E9E1', liner: '#D9B77E', seal: '#B8925A' },
};

/** Đường cong mép nắp (flap) theo mẫu. Mũi nắp nằm ở (170, tipY). */
export interface EnvelopeGeom {
  /** túi phong bì (2 cánh bên + cánh đáy), che thẻ */
  pocket: string;
  /** nếp gấp trên túi */
  seams: string;
  /** mặt trước nắp */
  flap: string;
  /** vùng lót (mặt sau nắp) */
  liner: string;
  /** toạ độ y mũi nắp (đặt seal) */
  tipY: number;
}

// Lệch so với bản vẽ 3.2: túi bắt đầu từ góc (y=.5) và nắp dốc hơn túi một chút -> nắp luôn phủ mép túi,
// không còn khe hở hình nêm lộ thẻ bên trong khi phong bì đang đóng.
const POCKET_V = 'M.5 .5 162 128Q170 134 178 128L339.5 .5V231.5Q339.5 237.5 333.5 237.5H6.5Q.5 237.5 .5 231.5Z';
const SEAMS_V = 'M.5 237 150 118M339.5 237 190 118';
const FLAP_POINT = 'M.5 .5H339.5L178 131Q170 137 162 131Z';
const LINER_POINT = 'M14 .5 166 124Q170 127 174 124L326 .5Z';

/** Mép ren lượn sóng dọc 2 cạnh nắp nhọn (scallop) - sinh 1 lần, đứng yên. */
export function scallopFlap(n = 9): string {
  const edge = (x0: number, y0: number, x1: number, y1: number, sweep: 0 | 1) => {
    let d = '';
    const r = Math.hypot(x1 - x0, y1 - y0) / n / 2;
    for (let i = 1; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      d += `A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };
  return `M.5 .5H339.5${edge(339.5, 0.5, 170, 136, 1)}${edge(170, 136, 0.5, 0.5, 1)}Z`;
}

export function envelopeGeom(style: EnvelopeStyle): EnvelopeGeom {
  switch (style) {
    case 'song-hy':
      // nắp vát tù (góc ~150°), túi vát nông tương ứng để phong bì đóng kín
      return {
        pocket: 'M.5 .5 164 44Q170 46 176 44L339.5 .5V231.5Q339.5 237.5 333.5 237.5H6.5Q.5 237.5 .5 231.5Z',
        seams: 'M.5 237 120 60M339.5 237 220 60',
        flap: 'M.5 .5H339.5L178 47Q170 50 162 47Z',
        liner: 'M16 .5 166 42Q170 44 174 42L324 .5Z',
        tipY: 47,
      };
    case 'minimal':
      // nắp chữ nhật thấp (38%)
      return {
        pocket: 'M.5 82H339.5V231.5Q339.5 237.5 333.5 237.5H6.5Q.5 237.5 .5 231.5Z',
        seams: 'M.5 82H339.5',
        flap: 'M.5 .5H339.5V90H.5Z',
        liner: 'M10 .5H330V82H10Z',
        tipY: 90,
      };
    case 'lace':
      return { pocket: POCKET_V, seams: SEAMS_V, flap: scallopFlap(), liner: LINER_POINT, tipY: 132 };
    default:
      return { pocket: POCKET_V, seams: SEAMS_V, flap: FLAP_POINT, liner: LINER_POINT, tipY: 132 };
  }
}
