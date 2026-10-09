/** Khối "Sau khi mở" + "Hạt nền" (≤ 2 loại, màu, phạm vi) của trang Hiệu ứng (design 8.13). */
import { CAPABILITIES } from '@shared/capabilities';
import type { BurstOnOpen, ParticleType } from '@shared/config/enums';
import { BURST_LABEL, PARTICLE_LABEL, capLabel, followThemeLabel } from '@shared/labels';
import { Segmented, Select, Toggle } from '../../ui/ui';
import { resolvedOf, type FxBlockProps } from './ctx';

export function ParticlesBlock({ fx }: FxBlockProps) {
  const { r, sug, set } = fx;
  const e = fx.draft.effects;
  const types: ParticleType[] = e.particles.types === 'theme' ? [] : e.particles.types;
  const toggleType = (t: ParticleType) => {
    const cur = e.particles.types === 'theme' ? [...sug.particles.types] : [...types];
    const n = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t].slice(-2);
    set('effects.particles.types', n.length ? n : 'theme', 'particles', 'Hạt nền');
  };
  const themeBurst = resolvedOf('burstOnOpen', sug.burstOnOpen);
  const colorMode = e.particles.color === 'theme' || e.particles.color === 'multi' ? e.particles.color : 'custom';
  return (
    <>
      <Select label="Sau khi mở" value={e.burst.onOpen}
        options={[
          { value: 'theme', label: followThemeLabel(BURST_LABEL, sug.burstOnOpen, themeBurst) },
          ...(CAPABILITIES.burstOnOpen.supported as readonly BurstOnOpen[]).map((v) => ({ value: v, label: BURST_LABEL[v] })),
        ]}
        onChange={(v) => set('effects.burst.onOpen', v, 'cover', 'Mở thiệp + hiệu ứng sau khi mở')} />

      <h2>Hạt nền</h2>
      <Toggle label="Hiện hạt nền" checked={e.particles.enabled} onChange={(v) => set('effects.particles.enabled', v, 'particles', 'Hạt nền')} />
      <fieldset class="field">
        <legend>Loại (tối đa 2){e.particles.types === 'theme' ? ` · đang theo theme: ${sug.particles.types.map((t) => capLabel('particle', PARTICLE_LABEL, t)).join(', ')}` : ''}</legend>
        <div class="chips">
          {(CAPABILITIES.particle.supported as readonly ParticleType[]).map((t) => (
            <button key={t} type="button" class="chip" aria-pressed={types.includes(t)} onClick={() => toggleType(t)}>{types.includes(t) ? '✓ ' : ''}{PARTICLE_LABEL[t]}</button>
          ))}
          {e.particles.types !== 'theme' && <button type="button" class="chip" onClick={() => set('effects.particles.types', 'theme', 'particles', 'Hạt nền')}>Theo theme</button>}
        </div>
      </fieldset>
      <Segmented legend="Màu hạt" name="pcolor" value={colorMode}
        options={[{ value: 'theme', label: 'Theo theme' }, { value: 'multi', label: 'Nhiều màu' }, { value: 'custom', label: 'Tự chọn' }]}
        onChange={(v) => set('effects.particles.color', v === 'custom' ? r.tokens.accent : v, 'particles', 'Hạt nền')} />
      {colorMode === 'custom' && <input type="color" aria-label="Màu hạt" value={e.particles.color} onInput={(ev) => set('effects.particles.color', (ev.currentTarget as HTMLInputElement).value.toUpperCase(), 'particles', 'Hạt nền', false)} />}
      <Segmented legend="Hiện ở" name="pscope" value={e.particles.scope}
        help="Cả trang: hạt thưa dần ở phần nhiều chữ và tránh ô nhập, tự dừng khi khách đang gõ."
        options={[{ value: 'all', label: 'Cả trang' }, { value: 'hero-thankyou', label: 'Chỉ Hero & Cảm ơn' }]}
        onChange={(v) => set('effects.particles.scope', v, 'particles', 'Hạt nền')} />
    </>
  );
}
