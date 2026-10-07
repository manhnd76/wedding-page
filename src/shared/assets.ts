/** Đường dẫn asset tương đối gốc site -> URL tuyệt đối theo BASE_URL (solution 5.1). */
export function assetUrl(src: string, base = '/'): string {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  const b = base.endsWith('/') ? base : `${base}/`;
  return b + src.replace(/^\.?\/+/, '');
}

/** Chỉ nhận link https: (mapUrl, siteUrl...) - solution "Lưu ý kỹ thuật". */
export function safeHttpsUrl(u: string): string | null {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** iframe bản đồ chỉ host www.google.com. */
export function safeMapEmbedUrl(u: string): string | null {
  const s = safeHttpsUrl(u);
  if (!s) return null;
  return new URL(s).hostname === 'www.google.com' ? s : null;
}

/** Số điện thoại -> tel: (chỉ giữ số và +). */
export function telHref(phone: string): string | null {
  const d = (phone || '').replace(/[^\d+]/g, '');
  return d.length >= 6 ? `tel:${d}` : null;
}
