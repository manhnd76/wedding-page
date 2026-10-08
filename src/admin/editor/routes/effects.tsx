/**
 * Hiệu ứng (design 8.13): cường độ, gallery kiểu mở thiệp (hoạt ảnh CSS thu nhỏ khi hover/focus/chọn),
 * sau khi mở, hạt nền (≤ 2), màu, phạm vi, gói reveal, pháo hoa. Chọn = phát ngay trong preview (fx:replay).
 * Chỉ hiển thị lựa chọn đã có trong capabilities của bản hiện tại.
 */
import { CAPABILITIES } from '@shared/capabilities';
import type { OpenStyle, ParticleType } from '@shared/config/enums';
import { PRESETS } from '@shared/theme/presets';
import { resolveTheme } from '@shared/theme/resolve';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import { Details, Segmented, Select, Toggle } from '../../ui/ui';

const OPEN_LABEL: Record<string, string> = { envelope: 'Phong bì', 'card-flip': 'Lật thiệp', 'fade-zoom': 'Mờ dần', none: 'Không hiệu ứng' };
const OPEN_COST: Record<string, 'Thấp' | 'Vừa' | 'Cao'> = { envelope: 'Vừa', 'card-flip': 'Vừa', 'fade-zoom': 'Thấp', none: 'Thấp', 'light-gather': 'Cao' };
const PARTICLE_LABEL: Record<string, string> = { 'petal-rose': 'Cánh hồng', heart: 'Tim', 'petal-peach': 'Hoa đào', 'gold-dust': 'Bụi vàng', firefly: 'Đom đóm' };
const BURST_LABEL: Record<string, string> = { none: 'Không', petals: 'Cánh hoa' };
const REVEAL_LABEL: Record<string, string> = { soft: 'Mềm mại', gentle: 'Nhẹ nhàng', editorial: 'Tạp chí', letter: 'Từng chữ', playful: 'Vui tươi', cinematic: 'Điện ảnh' };
const INTENSITY_HINT: Record<string, string> = {
  off: 'Tắt: không chuyển động, chỉ mờ dần nhanh.', low: 'Nhẹ: ít hạt, chuyển động ngắn, hợp máy cũ.',
  medium: 'Vừa: đủ hiệu ứng, chạy mượt trên đa số điện thoại.', high: 'Nhiều: thêm gió, parallax, pháo hoa dày hơn.',
};

export default function EffectsRoute({ store, preview }: RouteProps) {
  const draft = useStore(store, (s) => s.draft);
  const e = draft.effects;
  const r = resolveTheme(draft);
  const preset = PRESETS[draft.theme.preset];
  const set = (path: string, v: unknown, target: string, label: string) => {
    store.setPath(path, v);
    setTimeout(() => preview.replay(target, label), 0);
  };
  const types: ParticleType[] = e.particles.types === 'theme' ? [] : e.particles.types;
  const toggleType = (t: ParticleType) => {
    const cur = e.particles.types === 'theme' ? [...preset.suggest.particles.types] : [...types];
    const n = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t].slice(-2);
    set('effects.particles.types', n.length ? n : 'theme', 'particles', 'Hạt nền');
  };
  const opens = ['theme', ...(CAPABILITIES.openStyle.supported as readonly OpenStyle[])];
  const colorMode = e.particles.color === 'theme' || e.particles.color === 'multi' ? e.particles.color : 'custom';

  return (
    <section>
      <h1>Hiệu ứng</h1>
      <Segmented legend="Cường độ" name="intensity" value={e.intensity} help={INTENSITY_HINT[e.intensity]}
        options={[{ value: 'off', label: 'Tắt' }, { value: 'low', label: 'Nhẹ' }, { value: 'medium', label: 'Vừa' }, { value: 'high', label: 'Nhiều' }]}
        onChange={(v) => { store.setPath('effects.intensity', v); setTimeout(() => preview.replay('cover', 'Mở thiệp'), 0); }} />

      <h2>Kiểu mở thiệp</h2>
      <div class="ogrid" role="radiogroup" aria-label="Kiểu mở thiệp">
        {opens.map((id) => {
          const real = id === 'theme' ? preset.suggest.openStyle : id;
          const on = draft.cover.openStyle === id;
          const label = id === 'theme' ? `Theo theme (${OPEN_LABEL[real] ?? real})` : OPEN_LABEL[id] ?? id;
          return (
            <button key={id} type="button" role="radio" aria-checked={on} class={`ocard${on ? ' is-on' : ''}`} data-testid={`open-${id}`}
              onClick={() => set('cover.openStyle', id, 'cover', `Mở thiệp · ${label}`)}>
              <span class={`omini omini--${real}`} aria-hidden="true"><i /><b /></span>
              <span class="ocard-name">{label}{on ? ' ✓' : ''}</span>
              {id !== 'theme' && real === preset.suggest.openStyle && <span class="badge">Gợi ý cho theme</span>}
              {OPEN_COST[real] === 'Cao' && <span class="badge badge--warn">Nặng ⚠</span>}
            </button>
          );
        })}
      </div>

      <Select label="Sau khi mở" value={e.burst.onOpen}
        options={[{ value: 'theme', label: `Theo theme (${BURST_LABEL[r.burstOnOpen] ?? r.burstOnOpen})` }, ...(CAPABILITIES.burstOnOpen.supported as readonly string[]).map((v) => ({ value: v, label: BURST_LABEL[v] ?? v }))]}
        onChange={(v) => set('effects.burst.onOpen', v, 'cover', 'Mở thiệp + hiệu ứng sau khi mở')} />

      <h2>Hạt nền</h2>
      <Toggle label="Hiện hạt nền" checked={e.particles.enabled} onChange={(v) => set('effects.particles.enabled', v, 'particles', 'Hạt nền')} />
      <fieldset class="field">
        <legend>Loại (tối đa 2){e.particles.types === 'theme' ? ` · đang theo theme: ${preset.suggest.particles.types.map((t) => PARTICLE_LABEL[t] ?? t).join(', ')}` : ''}</legend>
        <div class="chips">
          {(CAPABILITIES.particle.supported as readonly ParticleType[]).map((t) => (
            <button key={t} type="button" class="chip" aria-pressed={types.includes(t)} onClick={() => toggleType(t)}>{types.includes(t) ? '✓ ' : ''}{PARTICLE_LABEL[t] ?? t}</button>
          ))}
          {e.particles.types !== 'theme' && <button type="button" class="chip" onClick={() => set('effects.particles.types', 'theme', 'particles', 'Hạt nền')}>Theo theme</button>}
        </div>
      </fieldset>
      <Segmented legend="Màu hạt" name="pcolor" value={colorMode}
        options={[{ value: 'theme', label: 'Theo theme' }, { value: 'multi', label: 'Nhiều màu' }, { value: 'custom', label: 'Tự chọn' }]}
        onChange={(v) => set('effects.particles.color', v === 'custom' ? r.tokens.accent : v, 'particles', 'Hạt nền')} />
      {colorMode === 'custom' && <input type="color" aria-label="Màu hạt" value={e.particles.color} onInput={(ev) => set('effects.particles.color', (ev.currentTarget as HTMLInputElement).value.toUpperCase(), 'particles', 'Hạt nền')} />}
      <Segmented legend="Hiện ở" name="pscope" value={e.particles.scope}
        help="Cả trang: hạt thưa dần ở phần nhiều chữ và tránh ô nhập, tự dừng khi khách đang gõ."
        options={[{ value: 'all', label: 'Cả trang' }, { value: 'hero-thankyou', label: 'Chỉ Hero & Cảm ơn' }]}
        onChange={(v) => set('effects.particles.scope', v, 'particles', 'Hạt nền')} />

      <h2>Hiện nội dung khi cuộn</h2>
      <div class="chips" role="radiogroup" aria-label="Gói hiện nội dung">
        {['theme', ...CAPABILITIES.revealStyle.supported].map((v) => (
          <button key={v} type="button" role="radio" aria-checked={e.reveal.style === v} class="chip"
            onClick={() => set('effects.reveal.style', v, 'reveal', `Hiện nội dung · ${REVEAL_LABEL[v] ?? 'Theo theme'}`)}>
            {v === 'theme' ? `Theo theme (${REVEAL_LABEL[r.reveal.style]})` : REVEAL_LABEL[v] ?? v}{e.reveal.style === v ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <h2>Chi tiết nhỏ</h2>
      <Select label="Kiểu số đếm ngược" value={draft.content.countdown.style}
        options={(CAPABILITIES.countdownStyle.supported as readonly string[]).map((v) => ({ value: v, label: v === 'flip' ? 'Lật số' : 'Đơn giản' }))}
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
      <p class="note">Bản hiện tại có {CAPABILITIES.openStyle.supported.length}/17 kiểu mở, {CAPABILITIES.particle.supported.length}/21 loại hạt, {CAPABILITIES.revealStyle.supported.length}/6 gói hiện nội dung; phần còn lại sẽ có ở bản sau.</p>
    </section>
  );
}
