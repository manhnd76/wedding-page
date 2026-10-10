/**
 * Checklist trước xuất bản (solution 8.8, design 8.8): lỗi nặng chặn, cảnh báo nhẹ chỉ nhắc.
 * Mỗi mục có `fix` = nhóm form để link "Sửa".
 */
import type { WeddingConfig } from '@shared/config/types';
import { mergeWithDefaults } from '@shared/config/merge';
import { SECTION_META, mainEvent } from '@shared/sections/meta';
import { resolveTheme } from '@shared/theme/resolve';
import { contrast, luminance } from '@shared/theme/contrast';
import { safeHttpsUrl, safeMapEmbedUrl } from '@shared/assets';
import { validateVietQr } from '@shared/vietqr/payload';
import { collectAssetRefs } from '@shared/storage/asset-refs';
import { getAt } from './paths';
import { expiryWarning, weddingDateOf } from '../storage/github';

export interface CheckItem { level: 'error' | 'warn'; message: string; fix: string }

export function runChecklist(c: WeddingConfig, opts: { tokenExpiresAt?: string | null; now?: number } = {}): CheckItem[] {
  const out: CheckItem[] = [];
  const err = (message: string, fix: string) => out.push({ level: 'error', message, fix });
  const warn = (message: string, fix: string) => out.push({ level: 'warn', message, fix });

  // schema: merge lại không được sinh cảnh báo enum
  const m = mergeWithDefaults(c);
  for (const w of m.warnings) err(`Cấu hình không hợp lệ: ${w}`, 'json');

  // ngày sự kiện chính
  const ev = mainEvent(c);
  if (!ev || !ev.startAt || Number.isNaN(new Date(ev.startAt).getTime())) err('Thiếu ngày giờ của sự kiện chính.', 'events');
  c.content.events.items.forEach((e, i) => {
    if (e.name.trim() && (!e.startAt || Number.isNaN(new Date(e.startAt).getTime()))) err(`Sự kiện ${i + 1} ("${e.name}") thiếu ngày giờ.`, 'events');
    if (e.mapUrl && !safeHttpsUrl(e.mapUrl)) err(`Sự kiện ${i + 1}: link chỉ đường phải bắt đầu bằng https://`, 'events');
    if (e.mapEmbedUrl && !safeMapEmbedUrl(e.mapEmbedUrl)) err(`Sự kiện ${i + 1}: link nhúng bản đồ phải là https://www.google.com/…`, 'events');
  });

  // tương phản
  const r = resolveTheme(c);
  const tb = contrast(r.tokens.text, r.tokens.bg);
  if (tb < 4.5) err(`Chữ trên nền chỉ đạt ${tb.toFixed(2)}:1 (cần ≥ 4.5:1).`, 'theme');
  const pb = contrast(r.tokens.primary, r.tokens.bg);
  if (pb < 4.5) warn(`Màu chủ đạo trên nền chỉ đạt ${pb.toFixed(2)}:1 (khuyên ≥ 4.5:1).`, 'theme');

  // URL
  if (c.meta.siteUrl && !safeHttpsUrl(c.meta.siteUrl)) err('Địa chỉ trang phải bắt đầu bằng https://', 'general');
  if (!c.meta.siteUrl.trim()) warn('Chưa nhập địa chỉ trang (https://…) - ảnh chia sẻ và link khách cần địa chỉ này.', 'general');
  if (c.integrations.appsScriptUrl && !safeHttpsUrl(c.integrations.appsScriptUrl)) err('Địa chỉ Apps Script phải bắt đầu bằng https://', 'general');

  // ngân hàng
  if (c.content.gift.showBankInfo) {
    c.content.gift.bankAccounts.forEach((b, i) => {
      if (!b.accountNumber.trim() && !b.qrImage) return;
      if (b.qrImage) return;
      const e = validateVietQr({ bankBin: b.bankBin, accountNumber: b.accountNumber.replace(/\s/g, '') });
      if (e) err(`Tài khoản ${i + 1}: ${e}.`, 'gift');
    });
  }

  // ảnh thiếu alt
  const missingAlt = collectAssetRefs(c).filter((a) => a.kind === 'image' && !String((getAt(c, a.slot) as { alt?: string } | null)?.alt ?? '').trim());
  if (missingAlt.length) warn(`${missingAlt.length} ảnh chưa có mô tả (alt) - người dùng trình đọc màn hình sẽ không biết ảnh có gì.`, 'media');

  // section bật nhưng rỗng
  for (const it of c.sections.items) {
    const meta = SECTION_META[it.type];
    if (it.enabled && meta?.isEmpty(c)) warn(`Section "${meta.label}" đang bật nhưng chưa có nội dung - sẽ tự ẩn.`, 'sections');
  }

  // ảnh hero quá sáng với theme tối
  if (r.mode === 'dark') {
    const dc = c.content.hero.image?.dominantColor;
    if (dc && /^#[0-9a-f]{6}$/i.test(dc) && luminance(dc) > 0.7) warn('Ảnh bìa khá sáng so với theme tối.', 'hero');
  }

  // token hết hạn
  const w = expiryWarning(opts.tokenExpiresAt ?? null, weddingDateOf(c), opts.now);
  if (w) warn(w, 'connect');

  // tổ hợp hiệu ứng nặng (design 8.13)
  // v4a-2a: "có phần nào dùng Điện ảnh" = gói chính hoặc ghim (design-v4a-2a 5.2)
  if (c.effects.intensity === 'high' && (r.reveal.style === 'cinematic' || Object.values(r.reveal.pins ?? {}).includes('cinematic')) && r.openStyle === 'light-gather') {
    warn('Tổ hợp hiệu ứng khá nặng cho điện thoại cũ; máy yếu sẽ tự giảm.', 'effects');
  }
  return out;
}

export const hasBlocking = (items: CheckItem[]) => items.some((i) => i.level === 'error');
