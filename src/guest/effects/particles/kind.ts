/** Mô tả 1 loại hạt (module lazy `types/<id>.ts`). */
export type Motion = 'fall' | 'float-up' | 'drift' | 'twinkle';

/** Tên token theme dùng cho màu "theme" của loại không có màu tự nhiên (design-v4a-2bc §4.2). */
export type ToneToken = 'accent' | 'accent2' | 'primary' | 'primaryDecor';

/**
 * 1 lớp vẽ trong ô 24×24 tâm (0,0) (design-v4a-2bc §4.1, `assets/v4a-2/particles/particles.json`).
 * Màu: `c1` / `c2` / `light` (= mix(c1,#fff,.4)) / `dark` (= mix(c1,#000,.28)) / mã màu.
 * `a` nhân với alpha của hạt (không ghi đè).
 */
export interface Layer {
  d?: string;
  circle?: [number, number, number];
  /** quầng tròn [x, y, r] + `stops` [t, màu, alpha] */
  radial?: [number, number, number];
  stops?: [number, string, number][];
  fill?: string;
  stroke?: string;
  lw?: number;
  a?: number;
  /** path cắt (vd nửa tối của tim giấy) */
  clip?: string;
}

/** 1 biến thể hình (trọng số `w`); `back` = mặt sau khi lật giả. */
export interface Variant { w: number; layers: Layer[]; back?: Layer[]; offset?: [number, number] }

export interface ParticleKind {
  id: string;
  motion: Motion;
  /** hệ số mật độ loại (design 5.7) */
  density: number;
  /** cỡ hiển thị CSS px [min, max] */
  size: [number, number];
  /** tốc độ chính px/s [min, max] */
  speed: [number, number];
  /** lật giả 3D (scaleX = cos(phase)) */
  flip?: boolean;
  /** tốc độ xoay rad/s tối đa */
  spin?: number;
  /** màu khi particles.color = "theme" (null = dùng màu theme accent/primary) */
  natural?: string[] | null;
  /**
   * Vẽ sprite vào ô vuông `s` px, gốc toạ độ ở tâm (5 loại v1). Loại v4a-2c chỉ khai báo dữ liệu `variants`
   * (engine vẽ bằng `drawLayers` trong `sprite-kit.ts`, module loại chỉ còn dữ liệu ≤ 1.5 KB gz).
   */
  draw?(g: CanvasRenderingContext2D, s: number, color: string, alt: string): void;

  // ---- v4a-2c (design-v4a-2bc §4.1) - đều tuỳ chọn; thiếu = hành vi v1
  /** 2–3 hình theo trọng số; sprite `k{i}.{v}` (+ `~b` mặt sau) */
  variants?: Variant[];
  /** mặt sau chung cho mọi biến thể (vd tim giấy) */
  back?: Layer[];
  /** biên độ lắc px [min, max] (v1 cố định 10–28) */
  sway?: [number, number];
  /** trôi ngang thêm px/s [min, max] cho `fall` (hoa khô "fall + drift") */
  vx?: [number, number];
  /** alpha riêng từng hạt [min, max] (nhân vào alpha đích) */
  alpha?: [number, number];
  /** cỡ lớn = rơi nhanh + rõ hơn (tuyết nhiều lớp) */
  depth?: boolean;
  /** nhấp nháy nhẹ kèm chuyển động thường (bụi nắng): biên độ 0–1 */
  twinkle?: number;
  /** màu tự nhiên khi theme `mode = dark` */
  naturalDark?: string[];
  /** màu "theme" theo token khi không có `natural` [c1, c2] (mặc định accent + primary-decor) */
  tones?: [ToneToken, ToneToken];
  /** như `tones` nhưng cho theme tối */
  tonesDark?: [ToneToken, ToneToken];
}
