/**
 * Bộ icon SVG nhỏ của admin (design-review-admin-v2 A16): nét 1.5px, 20px, `currentColor`, thay emoji/ký tự
 * (mỗi hệ điều hành vẽ emoji một kiểu). Luôn `aria-hidden`; nút chỉ có icon phải có `aria-label`.
 * Bản tạm do frontend vẽ - designer có thể thay path mà không đổi tên.
 */
const P = {
  overview: 'M3.5 3.5h13v13h-13zM10 3.5v13M10 10h6.5',
  gear: 'M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM10 2v2.2M10 15.8V18M2 10h2.2M15.8 10H18M4.3 4.3l1.6 1.6M14.1 14.1l1.6 1.6M4.3 15.7l1.6-1.6M14.1 5.9l1.6-1.6',
  palette: 'M10 2.5a7.5 7.5 0 1 0 0 15c1.2 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.2-2.2H15a2.5 2.5 0 0 0 2.5-2.5c0-4.7-3.4-8.5-7.5-8.5zM6.5 9.5h.01M8.5 6h.01M12.5 6.5h.01',
  font: 'M3 15.5 7 4.5l4 11M4.5 11.5h5M13 9.5c.5-.7 1.3-1 2.2-1 1.3 0 2.3.8 2.3 2.2v4.8M17.5 12.5h-2.3c-1.3 0-2.2.7-2.2 1.6 0 .9.7 1.5 1.7 1.5 1.5 0 2.8-1.2 2.8-2.6',
  sparkle: 'M10 2.5l1.7 5.8 5.8 1.7-5.8 1.7L10 17.5l-1.7-5.8L2.5 10l5.8-1.7z',
  music: 'M7.5 15V4.5l9-2v10.5M7.5 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16.5 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  list: 'M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01',
  pen: 'M13.5 3.5l3 3L7 16H4v-3zM11.5 5.5l3 3',
  image: 'M3 4h14v12H3zM3 13l4-4 3 3 2-2 5 5M12.5 7.5h.01',
  link: 'M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1',
  backup: 'M3.5 10a6.5 6.5 0 1 0 2-4.7M3.5 3v3.5H7M10 6.5V10l2.5 1.5',
  braces: 'M7 3.5c-1.5 0-2 .7-2 2v2c0 1-.7 2.5-2 2.5 1.3 0 2 1.5 2 2.5v2c0 1.3.5 2 2 2M13 3.5c1.5 0 2 .7 2 2v2c0 1 .7 2.5 2 2.5-1.3 0-2 1.5-2 2.5v2c0 1.3-.5 2-2 2',
  eye: 'M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10zM10 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  trash: 'M3.5 5.5h13M8 5.5V3.5h4v2M5 5.5l.8 11h8.4l.8-11M8.5 8.5v5M11.5 8.5v5',
  lock: 'M5 9h10v8H5zM7 9V6.5a3 3 0 0 1 6 0V9',
  refresh: 'M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3v3.5H13',
  undo: 'M7 4.5 3.5 8 7 11.5M3.5 8H12a4.5 4.5 0 0 1 0 9H8',
  redo: 'M13 4.5 16.5 8 13 11.5M16.5 8H8a4.5 4.5 0 0 0 0 9h4',
  up: 'M10 16V4M5 9l5-5 5 5',
  down: 'M10 4v12M5 11l5 5 5-5',
  left: 'M16 10H4M9 5l-5 5 5 5',
  right: 'M4 10h12M11 5l5 5-5 5',
  grip: 'M7.5 5h.01M12.5 5h.01M7.5 10h.01M12.5 10h.01M7.5 15h.01M12.5 15h.01',
  info: 'M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM10 9v5M10 6.5h.01',
  more: 'M4.5 10h.01M10 10h.01M15.5 10h.01',
} satisfies Record<string, string>;

export type IconName = keyof typeof P;

export function Icon(p: { name: IconName; size?: number }) {
  const s = p.size ?? 20;
  const dot = p.name === 'grip' || p.name === 'more';
  return (
    <svg class="ic" width={s} height={s} viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
      stroke-width={dot ? 2.6 : 1.5} stroke-linecap="round" stroke-linejoin="round">
      <path d={P[p.name]} />
    </svg>
  );
}
