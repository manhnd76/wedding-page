/** Font (design 2.3b, solution 5.4): bộ font, 3 dropdown nhóm "Gợi ý cho theme" / "Tất cả", xem trước tên thật, cỡ chữ ±1. */
import { useEffect } from 'preact/hooks';
import { CAPABILITIES } from '@shared/capabilities';
import { FONT_PRESET_MAP, FONT_REGISTRY, fontStack } from '@shared/fonts/registry';
import type { FontId, FontRole } from '@shared/config/enums';
import { PRESETS } from '@shared/theme/presets';
import { resolveTheme } from '@shared/theme/resolve';
import { ensureFonts } from '@guest/preview-bridge';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import { Segmented, Select } from '../../ui/ui';

const PRESET_LABEL: Record<string, string> = { theme: 'Theo theme', 'co-dien': 'Cổ điển', 'thanh-lich': 'Thanh lịch', 'am-ap': 'Ấm áp', 'bien-tap': 'Biên tập', 'truyen-thong': 'Truyền thống' };
const ROLE_LABEL: Record<FontRole, string> = { heading: 'Font tiêu đề', script: 'Font chữ ký (tên cặp đôi)', body: 'Font nội dung' };
const supportedFonts = () => CAPABILITIES.font.supported as readonly FontId[];

export default function FontsRoute({ store }: RouteProps) {
  const draft = useStore(store, (s) => s.draft);
  const r = resolveTheme(draft);
  const preset = PRESETS[draft.theme.preset];
  const c = draft.content.couple;
  const sample = `${c.groom.shortName || 'Minh Anh'} & ${c.bride.shortName || 'Thuỳ Linh'}`;

  useEffect(() => { void ensureFonts(import.meta.env.BASE_URL, [...supportedFonts()]); }, []);

  const roleSelect = (role: FontRole) => {
    const ids = supportedFonts().filter((id) => FONT_REGISTRY[id].role === role);
    const suggested = new Set<FontId>([preset.fonts[role], ...Object.values(FONT_PRESET_MAP).map((m) => m[role])]);
    const opts = [
      { value: 'theme', label: `Theo theme / bộ font (${FONT_REGISTRY[r.fonts[role]].family})`, group: 'Gợi ý cho theme đang chọn' },
      ...ids.filter((id) => suggested.has(id)).map((id) => ({ value: id, label: FONT_REGISTRY[id].family, group: 'Gợi ý cho theme đang chọn' })),
      ...ids.filter((id) => !suggested.has(id)).map((id) => ({ value: id, label: FONT_REGISTRY[id].family, group: 'Tất cả' })),
    ];
    return (
      <div class="font-row" key={role}>
        <Select label={ROLE_LABEL[role]} value={draft.fonts[role]} options={opts} onChange={(v) => store.setPath(`fonts.${role}`, v, 'hero')} />
        <p class={`font-sample font-sample--${role}`} style={{ fontFamily: fontStack(r.fonts[role]) }}>
          {role === 'body' ? 'Trân trọng kính mời Quý khách tới dự Lễ Thành Hôn · Nguyễn Thuỳ Linh' : sample}
        </p>
      </div>
    );
  };

  return (
    <section>
      <h1>Font</h1>
      <Select label="Bộ font" value={draft.fonts.preset}
        options={Object.keys(PRESET_LABEL).map((k) => ({ value: k, label: PRESET_LABEL[k]! }))}
        help="Chọn bộ font điền sẵn 3 font; sửa riêng 1 font thì font đó được ưu tiên."
        onChange={(v) => store.update((x) => ({ ...x, fonts: { ...x.fonts, preset: v as typeof x.fonts.preset, heading: 'theme', script: 'theme', body: 'theme' } }), '', 'hero')} />
      {(['script', 'heading', 'body'] as FontRole[]).map(roleSelect)}
      <Segmented legend="Cỡ chữ" name="scale" value={String(draft.fonts.scaleStep) as '-1' | '0' | '1'}
        options={[{ value: '-1', label: 'Nhỏ hơn' }, { value: '0', label: 'Vừa' }, { value: '1', label: 'Lớn hơn' }]}
        onChange={(v) => store.setPath('fonts.scaleStep', Number(v), 'hero')} />
      <p class="note">Bản hiện tại có {supportedFonts().length}/28 font; font còn lại sẽ được bật cùng các theme mới.</p>
    </section>
  );
}
