/** Khối "Tự động cuộn" của trang Hiệu ứng (design 8.13 v4, design-review-v1 5.4). */
import { AUTO_SCROLL_LIMITS } from '@shared/config/merge';
import { Icon } from '../../ui/icons';
import { Details, NumberField, Segmented, Toggle } from '../../ui/ui';
import type { FxBlockProps } from './ctx';

const SPEEDS = [{ value: '32', label: 'Chậm' }, { value: '45', label: 'Vừa' }, { value: '64', label: 'Nhanh' }, { value: 'custom', label: 'Tuỳ chỉnh' }];

export function AutoScrollBlock({ fx }: FxBlockProps) {
  const a = fx.draft.effects.autoScroll;
  const intensityOff = fx.draft.effects.intensity === 'off';
  const set = (path: string, v: unknown) => fx.store.setPath(path, v);
  const replay = () => { fx.preview.replay('autoscroll', 'Tự cuộn'); fx.peek('Đang phát: Tự cuộn'); };
  const speedMode = ['32', '45', '64'].includes(String(a.speed)) ? String(a.speed) : 'custom';
  const [lo, hi] = AUTO_SCROLL_LIMITS.startDelayMs;
  const [dlo, dhi] = AUTO_SCROLL_LIMITS.dwellMs;
  const sec = (ms: number) => (ms / 1000).toLocaleString('vi-VN');
  return (
    <section class="ablock" aria-labelledby="h-autoscroll">
      <h2 id="h-autoscroll">Tự động cuộn</h2>
      <Toggle label="Tự cuộn sau khi mở thiệp" checked={a.enabled} testId="as-enabled"
        help="Khách chạm, cuộn hoặc bấm phím là dừng ngay; khách bấm ▶ để tiếp tục." onChange={(v) => set('effects.autoScroll.enabled', v)} />
      {a.enabled && intensityOff && <p class="note">Cường độ Tắt: tự cuộn không tự chạy, khách vẫn bật được trong menu.</p>}
      {a.enabled && (
        <>
          <Segmented legend="Tốc độ" name="asspeed" value={speedMode} options={SPEEDS}
            onChange={(v) => { if (v !== 'custom') set('effects.autoScroll.speed', Number(v)); else set('effects.autoScroll.speed', a.speed === 45 ? 50 : a.speed); }} />
          {speedMode === 'custom' && (
            <NumberField label="Tốc độ (px/giây)" value={a.speed} min={AUTO_SCROLL_LIMITS.speed[0]} max={AUTO_SCROLL_LIMITS.speed[1]}
              onChange={(v) => set('effects.autoScroll.speed', Math.min(AUTO_SCROLL_LIMITS.speed[1], Math.max(AUTO_SCROLL_LIMITS.speed[0], Math.round(v))))} />
          )}
          <Toggle label="Dừng ngắn ở mỗi phần" checked={a.mode === 'flow'} help={`Dừng khoảng ${sec(a.dwellMs)} giây ở đầu mỗi phần như ngắt chương (đếm ngược dừng ít nhất 2 giây).`}
            onChange={(v) => set('effects.autoScroll.mode', v ? 'flow' : 'steady')} />
          <div class="field">
            <label for="as-delay">Bắt đầu sau: {sec(a.startDelayMs)} giây</label>
            <input id="as-delay" class="range" type="range" min={lo} max={hi} step={500} value={a.startDelayMs}
              onInput={(ev) => set('effects.autoScroll.startDelayMs', Number((ev.currentTarget as HTMLInputElement).value))} />
          </div>
          {a.mode === 'flow' && (
            <Details summary="Nâng cao: thời gian dừng mỗi phần">
              <div class="field">
                <label for="as-dwell">Dừng ở mỗi phần: {sec(a.dwellMs)} giây</label>
                <input id="as-dwell" class="range" type="range" min={dlo} max={dhi} step={200} value={a.dwellMs}
                  onInput={(ev) => set('effects.autoScroll.dwellMs', Number((ev.currentTarget as HTMLInputElement).value))} />
              </div>
            </Details>
          )}
          <button type="button" class="btn btn-secondary" data-testid="as-replay" onClick={replay}><Icon name="refresh" /> Phát lại tự cuộn</button>
        </>
      )}
    </section>
  );
}
