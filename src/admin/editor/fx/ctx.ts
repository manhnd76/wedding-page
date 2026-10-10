/**
 * Ngữ cảnh chung cho các khối của trang "Hiệu ứng" (solution-v4a-2bc.md 0.5).
 * Route `routes/effects.tsx` dựng 1 lần rồi truyền `fx` cho mọi khối, để khối mới/sửa không phải đổi chữ ký props.
 */
import { CAPABILITIES, isSupported, type CapabilityKey } from '@shared/capabilities';
import type { WeddingConfig } from '@shared/config/types';
import type { ThemePreset } from '@shared/theme/presets';
import type { ResolvedTheme } from '@shared/theme/resolve';
import type { RouteProps } from '../editor';

export interface FxCtx {
  draft: WeddingConfig;
  /** theme đã resolve của nháp */
  r: ResolvedTheme;
  /** gợi ý hiệu ứng của preset đang chọn */
  sug: ThemePreset['suggest'];
  store: RouteProps['store'];
  preview: RouteProps['preview'];
  peek: RouteProps['peek'];
  /** ghi nháp + phát đúng phần đó trong preview; mobile: toast [Xem ↗] */
  set: (path: string, v: unknown, target: string, label: string, notify?: boolean) => void;
}

export interface FxBlockProps { fx: FxCtx }

/** Giá trị theme gợi ý sau khi xét capability (cái khách thực sự thấy khi chọn "Theo theme"). */
export const resolvedOf = <T extends string>(key: CapabilityKey, v: T): T => (isSupported(key, v) ? v : (CAPABILITIES[key].fallback as T));
