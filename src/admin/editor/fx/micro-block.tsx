/** Khối "Chi tiết nhỏ" (đếm ngược, pháo hoa) + "Tuỳ chỉnh nâng cao" của trang Hiệu ứng (design 8.13). */
import { CAPABILITIES } from '@shared/capabilities';
import { COUNTDOWN_STYLE_LABEL } from '@shared/labels';
import { Details, Select, Toggle } from '../../ui/ui';
import type { FxBlockProps } from './ctx';

export function MicroBlock({ fx }: FxBlockProps) {
  const { draft, store, set } = fx;
  const e = draft.effects;
  return (
    <>
      <h2>Chi tiết nhỏ</h2>
      <Select label="Kiểu số đếm ngược" value={draft.content.countdown.style}
        options={(CAPABILITIES.countdownStyle.supported as readonly (keyof typeof COUNTDOWN_STYLE_LABEL)[]).map((v) => ({ value: v, label: COUNTDOWN_STYLE_LABEL[v] }))}
        onChange={(v) => set('content.countdown.style', v, 'micro:countdown', 'Đếm ngược')} />
      <Select label="Pháo hoa đếm ngược" value={e.burst.countdownFireworks}
        options={[{ value: 'every-view', label: 'Mỗi lần cuộn tới (cách nhau ít nhất 15 giây)' }, { value: 'wedding-day', label: 'Chỉ ngày cưới' }, { value: 'off', label: 'Tắt' }]}
        onChange={(v) => set('effects.burst.countdownFireworks', v, 'micro:fireworks', 'Pháo hoa đếm ngược')} />
      <Details summary="Tuỳ chỉnh nâng cao">
        <Toggle label="Ảnh nền chuyển động chậm (Ken Burns)" checked={e.kenBurns} onChange={(v) => set('effects.kenBurns', v, 'particles', 'Ảnh bìa')} />
        <Toggle label="Parallax ảnh nền (chỉ ở cấp Nhiều)" checked={e.parallax} onChange={(v) => store.setPath('effects.parallax', v)} />
        <Toggle label="Gió theo cuộn (chỉ ở cấp Nhiều)" checked={e.particles.wind} onChange={(v) => store.setPath('effects.particles.wind', v)} />
        <Toggle label="Tự giảm hiệu ứng trên máy yếu" checked={e.autoDowngrade} onChange={(v) => store.setPath('effects.autoDowngrade', v)} />
        <Toggle label="Tôn trọng cài đặt giảm chuyển động của khách" checked={e.respectReducedMotion} onChange={(v) => store.setPath('effects.respectReducedMotion', v)} />
        <Toggle label="Cho khách nút Bật/Tắt hiệu ứng" checked={e.guestToggle} onChange={(v) => store.setPath('effects.guestToggle', v)} />
      </Details>
    </>
  );
}
