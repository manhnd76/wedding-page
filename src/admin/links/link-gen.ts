/**
 * Công cụ tạo link khách (solution 8.2, design 8.9): giữ dấu (mặc định) / không dấu,
 * toggle "Mã hoá link" (percent-encode), `?to=` hoặc `/invite/`, CSV luôn có cột `link_ma_hoa`.
 */
import { guestNameFromUrl, nameToSlug, type GuestNameOptions } from '@shared/guest-name';

export const GUESTS_KEY = 'wp_admin_guests_v1';

export interface LinkOptions {
  /** gốc trang, vd https://ten.pages.dev/ */
  base: string;
  style: 'keep' | 'ascii';
  encode: boolean;
  mode: 'query' | 'path';
  queryParam: string;
  pathPrefix: string;
}

export interface GuestLink {
  name: string;
  /** tên khách sẽ thấy trên thiệp (chạy đúng code guest-name của trang khách) */
  display: string;
  slug: string;
  /** link dạng dễ đọc (Unicode thô) - luôn dùng để HIỂN THỊ */
  readable: string;
  /** link percent-encode */
  encoded: string;
  /** link dùng cho Chép / Chia sẻ theo lựa chọn "Mã hoá link" */
  link: string;
  duplicate: boolean;
}

/** Bỏ dấu tiếng Việt (kiểu "Không dấu"). */
export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFC');
}

export function normalizeBase(base: string): string {
  const b = base.trim() || '/';
  return b.endsWith('/') ? b : `${b}/`;
}

export function buildLink(name: string, o: LinkOptions, guestOpts: GuestNameOptions): Omit<GuestLink, 'duplicate'> {
  const clean = name.normalize('NFC').trim();
  const slug = nameToSlug(o.style === 'ascii' ? stripDiacritics(clean) : clean);
  const base = normalizeBase(o.base);
  const readable = o.mode === 'path' ? `${base}${o.pathPrefix}/${slug}` : `${base}?${o.queryParam}=${slug}`;
  const encoded = o.mode === 'path'
    ? `${base}${encodeURIComponent(o.pathPrefix)}/${encodeURIComponent(slug)}`
    : `${base}?${encodeURIComponent(o.queryParam)}=${encodeURIComponent(slug)}`;
  // tên hiển thị: chạy đúng parser của trang khách trên link mã hoá (giống link thô - 3.3)
  let display = guestOpts.fallbackName;
  try {
    display = guestNameFromUrl(new URL(encoded, 'https://x.invalid/'), { ...guestOpts, queryParam: o.queryParam, pathPrefix: o.pathPrefix }).display;
  } catch { /* base không phải URL hợp lệ */ }
  return { name: clean, display, slug, readable, encoded, link: o.encode ? encoded : readable };
}

/** Mỗi dòng 1 tên; bỏ dòng trống; đánh dấu trùng (so theo tên hiển thị, không phân biệt hoa thường). */
export function buildLinks(text: string, o: LinkOptions, guestOpts: GuestNameOptions): GuestLink[] {
  const names = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const rows = names.map((n) => buildLink(n, o, guestOpts));
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.slug.toLocaleLowerCase('vi'), (count.get(r.slug.toLocaleLowerCase('vi')) ?? 0) + 1);
  return rows.map((r) => ({ ...r, duplicate: (count.get(r.slug.toLocaleLowerCase('vi')) ?? 0) > 1 }));
}

const csvCell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** CSV (UTF-8 có BOM cho Excel): ten_khach, ten_hien_thi, link (theo lựa chọn), link_ma_hoa (luôn có). */
export function toCsv(rows: GuestLink[]): string {
  const lines = [['ten_khach', 'ten_hien_thi', 'link', 'link_ma_hoa'].join(',')];
  for (const r of rows) lines.push([r.name, r.display, r.link, r.encoded].map(csvCell).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** Tin nhắn mời mẫu (Chia sẻ). */
export function inviteMessage(r: GuestLink, template = 'Trân trọng kính mời {name} tới dự lễ cưới của chúng mình: {link}'): string {
  return template.split('{name}').join(r.name).split('{link}').join(r.link);
}
