/**
 * Tên khách từ URL (solution 8.2, design 3.3).
 * Ưu tiên: path /{pathPrefix}/<slug> -> query ?{queryParam}= -> fallbackName.
 */
export interface GuestNameOptions {
  fromUrl: boolean;
  queryParam: string;
  pathPrefix: string;
  fallbackName: string;
  template: string;
  maxLength: number;
}

export interface GuestNameResult {
  /** tên đã xử lý (chưa áp template), rỗng nếu không có trong URL */
  raw: string;
  /** chuỗi hiển thị cuối cùng (template hoặc fallback) */
  display: string;
  fromUrl: boolean;
}

const ZERO_WIDTH = /[​-‏‪-‮⁠-⁤﻿­]/gu;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/gu;
/** whitelist: chữ, dấu tổ hợp, số, khoảng trắng, . , & ( ) / - */
const NOT_ALLOWED = /[^\p{L}\p{M}\p{N}\s.,&()/-]/gu;

/** Tách grapheme an toàn tiếng Việt. */
export function graphemes(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg) return Array.from(new Seg('vi', { granularity: 'grapheme' }).segment(s), (x) => x.segment);
  return s.match(/\P{M}\p{M}*/gu) ?? [];
}

/** Xử lý một slug thô (đã decode) thành tên hiển thị. Trả '' nếu rỗng sau khi làm sạch. */
export function slugToName(input: string, maxLength = 60): string {
  let s = (input ?? '').normalize('NFC');
  s = s.replace(ZERO_WIDTH, '').replace(CONTROL, ' ');
  // "--" -> gạch thật (giữ chỗ bằng ký tự riêng), "-" và "_" -> khoảng trắng
  const HY = '';
  s = s.replace(/--/g, HY).replace(/[-_+]/g, ' ').replace(new RegExp(HY, 'g'), '-');
  s = s.replace(NOT_ALLOWED, '');
  s = s.replace(/\s+/g, ' ').trim();
  // gạch ở đầu/cuối vô nghĩa
  s = s.replace(/^[-\s]+|[-\s]+$/g, '').trim();
  if (!s) return '';
  const g = graphemes(s);
  if (g.length > maxLength) s = g.slice(0, maxLength).join('').trimEnd() + '…';
  const first = graphemes(s)[0] ?? '';
  return first.toLocaleUpperCase('vi-VN') + s.slice(first.length);
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Lấy slug thô từ URL (path ưu tiên hơn query). */
export function extractGuestSlug(url: URL, opts: Pick<GuestNameOptions, 'queryParam' | 'pathPrefix'>): string {
  const prefix = (opts.pathPrefix || 'invite').toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex((p) => safeDecode(p).toLowerCase() === prefix);
  if (idx !== -1 && parts[idx + 1]) {
    const v = safeDecode(parts[idx + 1]!);
    if (slugToName(v)) return v;
  }
  return url.searchParams.get(opts.queryParam || 'to') ?? '';
}

export function guestNameFromUrl(url: URL, opts: GuestNameOptions): GuestNameResult {
  const raw = opts.fromUrl ? slugToName(extractGuestSlug(url, opts), opts.maxLength) : '';
  if (!raw) return { raw: '', display: opts.fallbackName, fromUrl: false };
  const tpl = opts.template && opts.template.includes('{name}') ? opts.template : '{name}';
  return { raw, display: tpl.split('{name}').join(raw), fromUrl: true };
}

/** Thay {guest} trong câu mời - thay chuỗi thuần, không HTML. */
export function fillGuest(line: string, guest: string): string {
  return line.split('{guest}').join(guest);
}

/** Slug cho link generator (solution 8.2): NFC, khoảng trắng -> '-', '-' thật -> '--'. */
export function nameToSlug(name: string): string {
  return name
    .normalize('NFC')
    .trim()
    .replace(/-/g, '--')
    .replace(/\s+/g, '-')
    .replace(/[?#&%/\\<>"'`]/g, '');
}
