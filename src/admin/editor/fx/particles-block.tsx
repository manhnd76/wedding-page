/**
 * Khối "Sau khi mở" + "Hạt nền" (≤ 2 loại, màu, phạm vi) của trang Hiệu ứng (design 8.13).
 * v4a-2c (solution-v4a-2bc.md 2.5): 21 loại -> 8 chip đầu (gợi ý của theme đứng đầu + loại phổ biến), phần còn lại trong
 * "Xem thêm (n)" (tự mở khi đang chọn loại nằm trong đó). Chọn = phát lại hạt trong preview.
 * Vòng sửa 2c: "Xem thêm" chỉ tự MỞ, không bao giờ tự đóng (P10) + dòng báo loại bị bỏ do giới hạn 2; chip "Theo theme"
 * luôn hiện, đứng đầu; ở chế độ theo theme, chip loại gợi ý có viền nhấn + "· theme" (P11).
 */
const COMMON: readonly ParticleType[] = ['petal-rose', 'heart', 'snow', 'firefly', 'leaf-green', 'bubble'];
export const FIRST_CHIPS = 8;

/** Thứ tự chip: gợi ý theme -> loại phổ biến -> phần còn lại theo enum (chỉ loại đã có module). */
export function chipOrder(suggested: readonly ParticleType[], supported: readonly ParticleType[]): ParticleType[] {
  return [...new Set([...suggested, ...COMMON, ...supported])].filter((t) => supported.includes(t));
}
import { CAPABILITIES } from '@shared/capabilities';
import type { BurstOnOpen, ParticleType } from '@shared/config/enums';
import { BURST_LABEL, PARTICLE_LABEL, followThemeLabel } from '@shared/labels';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Segmented, Select, Toggle } from '../../ui/ui';
import { resolvedOf, type FxBlockProps } from './ctx';
import './particles-block.css';

/** Thời gian hiện dòng "Đã bỏ …" (ms). */
export const DROP_HINT_MS = 4000;

/**
 * Bấm chip `t` (thuần): trả danh sách mới (`'theme'` khi rỗng) + loại bị bỏ do giới hạn 2 (chỉ khi người dùng đã tự chọn).
 * Đang theo theme: bấm loại gợi ý = giữ đúng các loại gợi ý thành lựa chọn riêng; bấm loại khác = gợi ý + loại đó (tối đa 2).
 */
export function nextTypes(cur: readonly ParticleType[] | 'theme', sug: readonly ParticleType[], t: ParticleType): { types: ParticleType[] | 'theme'; dropped: ParticleType | null } {
  if (cur === 'theme') {
    const n = sug.includes(t) ? [...sug] : [...sug, t].slice(-2);
    return { types: n.length ? n : 'theme', dropped: null };
  }
  if (cur.includes(t)) {
    const n = cur.filter((x) => x !== t);
    return { types: n.length ? n : 'theme', dropped: null };
  }
  const all = [...cur, t];
  return { types: all.slice(-2), dropped: all.length > 2 ? all[0]! : null };
}

export function ParticlesBlock({ fx }: FxBlockProps) {
  const { r, sug, set } = fx;
  const e = fx.draft.effects;
  const byTheme = e.particles.types === 'theme';
  const types: ParticleType[] = byTheme ? [] : e.particles.types as ParticleType[];
  const [dropped, setDropped] = useState<ParticleType | null>(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const toggleType = (t: ParticleType) => {
    const r2 = nextTypes(e.particles.types, sug.particles.types, t);
    clearTimeout(timer.current);
    setDropped(r2.dropped);
    if (r2.dropped) timer.current = window.setTimeout(() => setDropped(null), DROP_HINT_MS);
    if (more.includes(t)) setMoreOpen(true);
    set('effects.particles.types', r2.types, 'particles', 'Hạt nền');
  };
  const setTheme = () => { clearTimeout(timer.current); setDropped(null); set('effects.particles.types', 'theme', 'particles', 'Hạt nền'); };
  const themeBurst = resolvedOf('burstOnOpen', sug.burstOnOpen);
  const colorMode = e.particles.color === 'theme' || e.particles.color === 'multi' ? e.particles.color : 'custom';
  const order = chipOrder(sug.particles.types, CAPABILITIES.particle.supported as readonly ParticleType[]);
  const first = order.slice(0, FIRST_CHIPS);
  const more = order.slice(FIRST_CHIPS);
  const moreSel = more.some((t) => types.includes(t) || (byTheme && sug.particles.types.includes(t)));
  // P10: chỉ tự mở (lúc đầu / khi loại trong panel được chọn), không bao giờ tự đóng; người dùng tự đóng bằng summary
  const [moreOpen, setMoreOpen] = useState(moreSel);
  useEffect(() => { if (moreSel) setMoreOpen(true); }, [moreSel]);
  const chip = (t: ParticleType) => {
    const on = types.includes(t);
    const viaTheme = byTheme && sug.particles.types.includes(t);
    return (
      <button key={t} type="button" class={viaTheme ? 'chip chip--theme' : 'chip'} data-testid={`pchip-${t}`} aria-pressed={on} onClick={() => toggleType(t)}>
        {on ? '✓ ' : ''}{PARTICLE_LABEL[t]}{viaTheme && <span class="chip-sub"> · theme</span>}
      </button>
    );
  };
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
        <legend>Loại (tối đa 2)</legend>
        <div class="chips" data-testid="pchips">
          <button type="button" class="chip chip--follow" data-testid="ptheme" aria-pressed={byTheme} onClick={setTheme}>{byTheme ? '✓ ' : ''}Theo theme</button>
          {first.map(chip)}
        </div>
        {more.length > 0 && (
          <details class="details" open={moreOpen} data-testid="pmore" onToggle={(ev) => setMoreOpen((ev.currentTarget as HTMLDetailsElement).open)}>
            <summary>{`Xem thêm (${more.length})`}</summary>
            <div class="details-in"><div class="chips" data-testid="pchips-more">{more.map(chip)}</div></div>
          </details>
        )}
        <p class="help pdrop" aria-live="polite" data-testid="pdrop">{dropped ? `Đã bỏ "${PARTICLE_LABEL[dropped]}" - chọn tối đa 2 loại.` : ''}</p>
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
