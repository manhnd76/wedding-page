/**
 * Trạng thái lưu/xuất bản (design 8.8; design-review-admin-v2 A02). Dùng chung cho top bar và thẻ Tổng quan
 * để 2 chỗ không bao giờ lệch nhau. Không bao giờ ghi "Đã xuất bản" khi chưa từng xuất bản
 * (`published.publish.at` rỗng) hoặc khi đang ở chế độ không kết nối (chế độ này không xuất bản, chỉ tải gói).
 */
import type { EditorState } from '../state/store';
import { fmtTime } from './util';

export type StatusTone = 'err' | 'busy' | 'dirty' | 'ok' | 'clean';
export interface StatusView { text: string; tone: StatusTone }

type S = Pick<EditorState, 'busy' | 'error' | 'save' | 'adapter' | 'published' | 'draft' | 'live' | 'lastPublishAt' | 'exported'>;

/** `n` = số thay đổi nháp so với bản đang xuất bản. */
export function statusOf(s: S, n: number): StatusView {
  const zip = s.adapter.kind === 'download';
  if (s.busy?.kind === 'publish') {
    const files = s.busy.total > 1 ? ` (${s.busy.done}/${s.busy.total} tệp)` : '';
    return { text: zip ? `Đang tạo gói…${files}` : `Đang xuất bản…${files}`, tone: 'busy' };
  }
  if (s.busy?.kind === 'restore') return { text: 'Đang khôi phục…', tone: 'busy' };
  if (s.error) return { text: `Lỗi: ${s.error.message}`, tone: 'err' };
  if (s.save === 'saving') return { text: 'Đang lưu nháp…', tone: n > 0 ? 'dirty' : 'clean' };
  if (zip) {
    if (s.exported && s.exported.draft === s.draft) return { text: `Đã tải gói xuất bản · ${fmtTime(s.exported.at)}`, tone: 'ok' };
    if (n > 0) return { text: `Có ${n} thay đổi chưa tải gói`, tone: 'dirty' };
    return { text: 'Nháp trên máy này', tone: 'clean' };
  }
  if (!s.published.publish.at) {
    if (n > 0) return { text: `Chưa xuất bản lần nào · ${n} thay đổi trong nháp`, tone: 'dirty' };
    return { text: 'Chưa xuất bản lần nào', tone: 'clean' };
  }
  if (n > 0) return { text: `Có ${n} thay đổi chưa xuất bản`, tone: 'dirty' };
  if (s.live?.state === 'waiting') return { text: 'Đã xuất bản! Khách sẽ thấy sau khoảng 1 phút', tone: 'ok' };
  if (s.live?.state === 'live') return { text: `Khách đã thấy bản mới${s.lastPublishAt ? ` · ${fmtTime(s.lastPublishAt)}` : ''}`, tone: 'ok' };
  return { text: `Đã xuất bản · ${fmtTime(s.published.publish.at)}`, tone: 'clean' };
}

/** Nhãn nút xuất bản: top bar và Tổng quan dùng chung (A19). */
export const publishLabel = (kind: string): string => (kind === 'download' ? 'Tải gói xuất bản (.zip)' : 'Xuất bản');
