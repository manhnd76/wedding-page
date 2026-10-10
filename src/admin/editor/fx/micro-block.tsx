/**
 * Khối "Chi tiết nhỏ" (4 công tắc micro, kiểu số đếm ngược, pháo hoa) + "Tuỳ chỉnh nâng cao" của trang Hiệu ứng
 * (design 8.13, design-v4a-2a 5.3). name-sparkle, music-ripple, gift-shake, calendar-flip đi theo cường độ (không công tắc).
 */
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
      <Toggle label="Nút chính có vệt sáng lướt" checked={e.micro.buttonShine} testId="mc-shine"
        onChange={(v) => set('effects.micro.buttonShine', v, 'micro:buttonShine', 'Vệt sáng trên nút')} />
      <Toggle label="Ảnh nghiêng theo chuột" help="Chỉ trên máy tính có chuột; điện thoại không nghiêng." checked={e.micro.photoTilt}
        onChange={(v) => set('effects.micro.photoTilt', v, 'micro:photoTilt', 'Ảnh nghiêng')} />
      <Toggle label="Thanh tiến độ đọc ở mép trên" help="Hiện ở cấp Vừa và Nhiều (và khi khách giảm chuyển động)." checked={e.micro.scrollProgress}
        onChange={(v) => set('effects.micro.scrollProgress', v, 'micro:scrollProgress', 'Thanh tiến độ')} />
      <Toggle label="Chạm đúp ảnh cô dâu, chú rể để thả tim" help="Bất ngờ nhỏ, khách không được báo trước." checked={e.micro.coupleHeartTap}
        onChange={(v) => set('effects.micro.coupleHeartTap', v, 'micro:coupleHeartTap', 'Chạm đúp thả tim')} />
      <Select label="Kiểu số đếm ngược" value={draft.content.countdown.style}
        options={(CAPABILITIES.countdownStyle.supported as readonly (keyof typeof COUNTDOWN_STYLE_LABEL)[]).map((v) => ({ value: v, label: COUNTDOWN_STYLE_LABEL[v] }))}
        onChange={(v) => set('content.countdown.style', v, 'micro:countdown', `Đếm ngược · ${COUNTDOWN_STYLE_LABEL[v as keyof typeof COUNTDOWN_STYLE_LABEL]}`)} />
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
