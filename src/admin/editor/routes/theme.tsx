/**
 * Theme & Màu (design 8.12): gallery thẻ HTML/CSS thật (biến CSS scoped theo token preset, tên cặp đôi thật),
 * chip lọc, radiogroup, chạm = áp vào nháp + toast Hoàn tác; dialog "Giữ phần tôi đã chỉnh / Dùng trọn gói";
 * khối "Thành phần của theme"; màu chủ đạo + badge tương phản + "Tự sửa"; nâng cao: token, họa tiết, texture, khung, divider.
 */
import { useEffect, useState } from 'preact/hooks';
import { PRESETS, type ThemePreset } from '@shared/theme/presets';
import { THEME_TAGS, type ThemeId, type ThemeTag } from '@shared/config/enums';
import { CAPABILITIES } from '@shared/capabilities';
import { resolveTheme } from '@shared/theme/resolve';
import { contrast } from '@shared/theme/contrast';
import { deriveFromPrimary } from '@shared/theme/derive';
import { fontStack } from '@shared/fonts/registry';
import { ensureFonts } from '@guest/preview-bridge';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import { THEME_GROUP_LABEL, changeTheme, customizedGroups, resetGroup, type ThemeGroup } from '../../draft/ops';
import { Details, Modal, Select, toast } from '../../ui/ui';

const TAG_LABEL: Record<ThemeTag, string> = { 'co-dien': 'Cổ điển', 'truyen-thong': 'Truyền thống', 'hien-dai': 'Hiện đại', 'thien-nhien': 'Thiên nhiên', toi: 'Tối' };
const MOOD: Partial<Record<ThemeId, string>> = { 'tram-vang': 'cổ điển ấm áp', 'son-do': 'truyền thống Á Đông', 'dem-nhung': 'sang trọng, nền tối' };
const LABELS: Record<string, string> = {
  'classic-line': 'Nét cổ điển', traditional: 'Truyền thống (song hỷ)', luxe: 'Sang trọng', paper: 'Giấy', velvet: 'Nhung', none: 'Không',
  arch: 'Vòm', 'circle-moon': 'Trăng tròn', 'deco-cut': 'Deco', ornament: 'Hoạ tiết', wave: 'Sóng', cloud: 'Mây', 'deco-fan': 'Quạt Deco',
};
const TOKEN_LABEL: Record<string, string> = { primary: 'Màu chủ đạo (chữ/nút)', accent: 'Màu nhấn', bg: 'Nền', surface: 'Nền thẻ', text: 'Chữ', muted: 'Chữ phụ', line: 'Đường kẻ' };

const supported = () => (CAPABILITIES.theme.supported as readonly ThemeId[]).map((id) => PRESETS[id]).filter((p) => !p.hidden);

function ThemeCard(p: { preset: ThemePreset; names: [string, string]; checked: boolean; tabIndex: number; onPick: () => void; onKey: (e: KeyboardEvent) => void; badge: string }) {
  const t = p.preset.tokens;
  const vars = {
    '--tc-bg': t.bg, '--tc-surface': t.surface, '--tc-text': t.text, '--tc-primary': t.primary, '--tc-on-primary': t.onPrimary,
    '--tc-accent': t.accent, '--tc-muted': t.muted, '--tc-line': t.line,
    '--tc-script': fontStack(p.preset.fonts.script), '--tc-heading': fontStack(p.preset.fonts.heading),
  } as Record<string, string>;
  return (
    <div role="radio" aria-checked={p.checked} tabIndex={p.tabIndex} class={`tcard${p.checked ? ' is-on' : ''}`} style={vars}
      aria-label={`${p.preset.name}, ${MOOD[p.preset.id] ?? ''}, ${p.preset.mode === 'dark' ? 'nền tối' : 'nền sáng'}`}
      onClick={p.onPick} onKeyDown={p.onKey} data-testid={`theme-${p.preset.id}`}>
      <div class={`tcard-face tex-${p.preset.texture}`}>
        <p class="tcard-names"><span>{p.names[0]}</span><span class="amp">&amp;</span><span>{p.names[1]}</span></p>
        <span class={`tcard-div div-${p.preset.divider}`} aria-hidden="true" />
        <div class="tcard-sw" aria-hidden="true">
          {[t.primary, t.accent, t.bg, t.text].map((c) => <i key={c} style={{ background: c }} />)}
          <span class="tcard-btn">Nút</span>
        </div>
      </div>
      <div class="tcard-foot">
        <strong>{p.checked ? '✓ ' : ''}{p.preset.name}</strong>
        <span class="muted">{p.checked ? 'Đang dùng · ' : ''}{p.badge}{p.preset.mode === 'dark' ? ' · Nền tối' : ''}</span>
      </div>
    </div>
  );
}

export default function ThemeRoute({ store, go }: RouteProps) {
  const draft = useStore(store, (s) => s.draft);
  const [tag, setTag] = useState<ThemeTag | 'all'>('all');
  const [ask, setAsk] = useState<ThemeId | null>(null);
  const list = supported().filter((p) => tag === 'all' || p.tags.includes(tag));
  const c = draft.content.couple;
  const names: [string, string] = [c.groom.shortName || c.groom.fullName || 'Minh Anh', c.bride.shortName || c.bride.fullName || 'Thuỳ Linh'];
  if (c.order === 'bride-first') names.reverse();
  const custom = customizedGroups(draft);
  const r = resolveTheme(draft);
  const tb = contrast(r.tokens.text, r.tokens.bg);
  const pb = contrast(r.tokens.primary, r.tokens.bg);

  useEffect(() => {
    void ensureFonts(import.meta.env.BASE_URL, supported().flatMap((p) => [p.fonts.script, p.fonts.heading]));
  }, []);

  const apply = (id: ThemeId, mode: 'keep' | 'full') => {
    const before = store.s.draft;
    store.update((x) => changeTheme(x, id, mode), '', 'hero');
    toast(`Đã đổi sang ${PRESETS[id].name}`, { action: { label: 'Hoàn tác', run: () => store.replaceDraft(before) } });
  };
  const pick = (id: ThemeId) => {
    if (id === draft.theme.preset) return;
    if (custom.length) setAsk(id); else apply(id, 'keep');
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (d) {
      e.preventDefault();
      const n = (i + d + list.length) % list.length;
      const el = (e.currentTarget as HTMLElement).parentElement?.children[n] as HTMLElement | undefined;
      el?.focus();
    } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(list[i]!.id); }
  };
  const checkedIdx = Math.max(0, list.findIndex((p) => p.id === draft.theme.preset));
  const groupValue = (g: ThemeGroup): string => {
    const v: Record<ThemeGroup, string> = {
      colors: '', fonts: '', ornament: LABELS[r.ornamentSet] ?? r.ornamentSet, texture: LABELS[r.texture] ?? r.texture,
      photoFrame: LABELS[r.photoFrame] ?? r.photoFrame, divider: LABELS[r.divider] ?? r.divider, openStyle: r.openStyle,
      burst: r.burstOnOpen, particles: r.particles.types.join(', '), reveal: r.reveal.style,
    };
    return v[g];
  };
  const setOverride = (k: string, v: string | null) => store.update((x) => {
    const o = { ...x.theme.overrides } as Record<string, string>;
    if (v) o[k] = v; else delete o[k];
    return { ...x, theme: { ...x.theme, overrides: o } };
  }, `ov-${k}`, 'hero');
  const autoFix = () => {
    // màu chủ đạo -> derive (luôn ≥ 4.5:1); bỏ override chữ/nền gây lỗi
    store.update((x) => {
      const o = { ...x.theme.overrides };
      delete o.text; delete o.bg; delete o.primary;
      const primary = x.theme.primaryColor ?? PRESETS[x.theme.preset].tokens.primary;
      return { ...x, theme: { ...x.theme, overrides: o, primaryColor: deriveFromPrimary(primary, PRESETS[x.theme.preset].mode).primary } };
    }, '', 'hero');
  };
  const sel = (label: string, path: string, key: 'ornamentSet' | 'texture' | 'photoFrame' | 'divider', value: string) => (
    <Select label={label} value={value}
      options={[{ value: 'theme', label: 'Theo theme' }, ...(CAPABILITIES[key].supported as readonly string[]).map((v) => ({ value: v, label: LABELS[v] ?? v }))]}
      onChange={(v) => store.setPath(path, v, 'hero')} />
  );

  return (
    <section>
      <h1>Theme &amp; Màu</h1>
      <p class="muted">Chọn một phong cách. Bạn vẫn đổi được màu, font, họa tiết riêng sau khi chọn.</p>
      <div class="chips" role="group" aria-label="Lọc theme">
        {(['all', ...THEME_TAGS] as const).map((t) => (
          <button key={t} type="button" class="chip" aria-pressed={tag === t} onClick={() => setTag(t)}>{t === 'all' ? 'Tất cả' : TAG_LABEL[t]}</button>
        ))}
      </div>
      <div class="tgrid" role="radiogroup" aria-label="Theme">
        {list.map((p, i) => (
          <ThemeCard key={p.id} preset={p} names={names} checked={p.id === draft.theme.preset} tabIndex={i === checkedIdx ? 0 : -1}
            onPick={() => pick(p.id)} onKey={(e) => onKey(e, i)}
            badge={p.id === draft.theme.preset && tb < 4.5 ? 'Cần kiểm tra ✗' : 'AA'} />
        ))}
        {list.length === 0 && <p class="muted">Chưa có theme nào thuộc nhóm này trong bản hiện tại.</p>}
      </div>
      <p class="note">Bản hiện tại có {supported().length}/12 theme; các theme còn lại sẽ được bật ở bản sau.</p>

      <h2>Thành phần của theme</h2>
      <table class="comp">
        <tbody>
          {(['colors', 'fonts', 'ornament', 'texture', 'photoFrame', 'divider'] as ThemeGroup[]).map((g) => {
            const own = custom.includes(g);
            return (
              <tr key={g}>
                <th scope="row">{THEME_GROUP_LABEL[g]}</th>
                <td>{own ? <span class="badge badge--warn">Đã chỉnh riêng ●</span> : 'Theo theme'}{groupValue(g) ? ` · ${groupValue(g)}` : ''}</td>
                <td>{own
                  ? <button type="button" class="btn btn-link" onClick={() => store.update((x) => resetGroup(x, g), '', 'hero')}>Đặt lại theo theme</button>
                  : g === 'fonts' ? <button type="button" class="btn btn-link" onClick={() => go('fonts')}>Đổi</button> : null}</td>
              </tr>
            );
          })}
          <tr>
            <th scope="row">Hiệu ứng gợi ý</th>
            <td>{r.openStyle} · {r.burstOnOpen}</td>
            <td><button type="button" class="btn btn-link" onClick={() => go('effects')}>Sang tab Hiệu ứng</button></td>
          </tr>
        </tbody>
      </table>

      <h2>Màu chủ đạo</h2>
      <div class="color-row">
        <input type="color" aria-label="Màu chủ đạo" value={draft.theme.primaryColor ?? PRESETS[draft.theme.preset].tokens.primary}
          onInput={(e) => store.setPath('theme.primaryColor', (e.currentTarget as HTMLInputElement).value.toUpperCase(), 'hero')} data-testid="primary-color" />
        <span>{draft.theme.primaryColor ?? 'Theo theme'}</span>
        {draft.theme.primaryColor && <button type="button" class="btn btn-link" onClick={() => store.setPath('theme.primaryColor', null, 'hero')}>Theo theme</button>}
        <span class={`badge ${pb >= 4.5 ? 'badge--ok' : 'badge--warn'}`}>{pb >= 4.5 ? `AA ✓ ${pb.toFixed(1)}:1` : `Không đạt ✗ ${pb.toFixed(1)}:1`}</span>
      </div>
      <p class="help">Các màu nền, chữ, đường kẻ tự suy ra từ màu chủ đạo để luôn dễ đọc.</p>
      {tb < 4.5 && <p class="banner banner--err" role="alert">Chữ trên nền chỉ đạt {tb.toFixed(2)}:1 (cần ≥ 4.5:1) - sẽ chặn Xuất bản. <button type="button" class="btn btn-secondary" onClick={autoFix}>Tự sửa</button></p>}

      <Details summary="Nâng cao: từng màu, họa tiết, texture, khung ảnh, divider">
        {Object.keys(TOKEN_LABEL).map((k) => {
          const ov = (draft.theme.overrides as Record<string, string | undefined>)[k];
          const cur = (r.tokens as unknown as Record<string, string>)[k]!;
          const cr = k === 'text' || k === 'muted' || k === 'primary' ? contrast(cur, r.tokens.bg) : null;
          return (
            <div class="color-row" key={k}>
              <input type="color" aria-label={TOKEN_LABEL[k]} value={cur} onInput={(e) => setOverride(k, (e.currentTarget as HTMLInputElement).value.toUpperCase())} />
              <span>{TOKEN_LABEL[k]}{ov ? ' (đã chỉnh)' : ''}</span>
              {cr !== null && <span class={`badge ${cr >= 4.5 ? 'badge--ok' : 'badge--warn'}`}>{cr >= 4.5 ? 'AA ✓' : '✗'} {cr.toFixed(1)}:1</span>}
              {ov && <button type="button" class="btn btn-link" onClick={() => setOverride(k, null)}>Theo theme</button>}
            </div>
          );
        })}
        {sel('Họa tiết', 'theme.ornamentSet', 'ornamentSet', draft.theme.ornamentSet)}
        {sel('Texture nền', 'theme.texture', 'texture', draft.theme.texture)}
        {sel('Khung ảnh', 'theme.photoFrame', 'photoFrame', draft.theme.photoFrame)}
        {sel('Divider', 'sections.divider', 'divider', draft.sections.divider)}
      </Details>

      <Modal open={ask !== null} onClose={() => setAsk(null)} title="Đổi theme"
        footer={ask && <>
          <button type="button" class="btn btn-secondary" onClick={() => { apply(ask, 'full'); setAsk(null); }}>Dùng trọn gói {PRESETS[ask].name}</button>
          <button type="button" class="btn btn-primary" autoFocus onClick={() => { apply(ask, 'keep'); setAsk(null); }} data-testid="theme-keep">Giữ phần tôi đã chỉnh</button>
        </>}>
        {ask && <p>Bạn đã tự chỉnh {custom.map((g) => THEME_GROUP_LABEL[g]).join(', ')}. Khi đổi sang {PRESETS[ask].name}:</p>}
      </Modal>
    </section>
  );
}
