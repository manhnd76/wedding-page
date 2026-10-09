/**
 * Hiệu ứng (design 8.13): cường độ, gallery kiểu mở thiệp (hoạt ảnh CSS thu nhỏ khi hover/focus/chọn),
 * mẫu phong bì, sau khi mở, hạt nền (≤ 2), màu, phạm vi, gói reveal, tự động cuộn, pháo hoa.
 * Chọn = phát ngay trong preview (fx:replay); trên mobile kèm toast [Xem ↗] (A05).
 * Chỉ hiển thị lựa chọn đã có trong capabilities của bản hiện tại; mọi nhãn là tiếng Việt (A07).
 * Từ v4a (solution-v4a-2bc.md 0.5): file này chỉ còn bố cục; nội dung nằm ở các khối `../fx/*-block.tsx`.
 */
import { CAPABILITIES } from '@shared/capabilities';
import { PRESETS } from '@shared/theme/presets';
import { resolveTheme } from '@shared/theme/resolve';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import type { FxCtx } from '../fx/ctx';
import { IntensityBlock } from '../fx/intensity-block';
import { OpenBlock } from '../fx/open-block';
import { ParticlesBlock } from '../fx/particles-block';
import { RevealBlock } from '../fx/reveal-block';
import { AutoScrollBlock } from '../fx/autoscroll-block';
import { MicroBlock } from '../fx/micro-block';

export default function EffectsRoute({ store, preview, peek }: RouteProps) {
  const draft = useStore(store, (s) => s.draft);
  const fx: FxCtx = {
    draft,
    r: resolveTheme(draft),
    sug: PRESETS[draft.theme.preset].suggest,
    store,
    preview,
    peek,
    set: (path, v, target, label, notify = true) => {
      store.setPath(path, v);
      setTimeout(() => preview.replay(target, label), 0);
      if (notify) peek(`Đã chọn: ${label}`);
    },
  };

  return (
    <section>
      <h1>Hiệu ứng</h1>
      <IntensityBlock fx={fx} />
      <OpenBlock fx={fx} />
      <ParticlesBlock fx={fx} />
      <RevealBlock fx={fx} />
      <AutoScrollBlock fx={fx} />
      <MicroBlock fx={fx} />
      <p class="note">Bản hiện tại có {CAPABILITIES.openStyle.supported.length}/17 kiểu mở, {CAPABILITIES.particle.supported.length}/21 loại hạt, {CAPABILITIES.revealStyle.supported.length}/6 gói hiện nội dung; phần còn lại sẽ có ở bản sau.</p>
    </section>
  );
}
