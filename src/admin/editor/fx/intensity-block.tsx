/** Khối "Cường độ" của trang Hiệu ứng (design 8.13). */
import { INTENSITY_LABEL } from '@shared/labels';
import { Segmented } from '../../ui/ui';
import type { FxBlockProps } from './ctx';

const INTENSITY_HINT: Record<string, string> = {
  off: 'Tắt: không chuyển động, chỉ mờ dần nhanh.', low: 'Nhẹ: ít hạt, chuyển động ngắn, hợp máy cũ.',
  medium: 'Vừa: đủ hiệu ứng, chạy mượt trên đa số điện thoại.', high: 'Nhiều: thêm gió, parallax, pháo hoa dày hơn.',
};

export function IntensityBlock({ fx }: FxBlockProps) {
  const e = fx.draft.effects;
  return (
    <Segmented legend="Cường độ" name="intensity" value={e.intensity} help={INTENSITY_HINT[e.intensity]}
      options={(['off', 'low', 'medium', 'high'] as const).map((v) => ({ value: v, label: INTENSITY_LABEL[v] }))}
      onChange={(v) => fx.set('effects.intensity', v, 'cover', 'Mở thiệp')} />
  );
}
