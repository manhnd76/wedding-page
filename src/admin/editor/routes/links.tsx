/**
 * Tạo link khách mời (design 8.9): mỗi dòng 1 tên; Giữ dấu ★ / Không dấu; toggle "Mã hoá link" (nhớ trong máy);
 * ?to= hoặc /invite/; bảng luôn hiển thị dạng dễ đọc; Chép/Chia sẻ/CSV dùng dạng đang chọn; CSV có cột link_ma_hoa.
 */
import { useMemo, useState } from 'preact/hooks';
import type { RouteProps } from '../editor';
import { useStore } from '../../state/store';
import { GUESTS_KEY, buildLinks, inviteMessage, toCsv, type LinkOptions } from '../../links/link-gen';
import { saveFile } from '../../storage/local-adapters';
import { Segmented, TextArea, TextField, Toggle, copyText, toast } from '../../ui/ui';
import { Icon } from '../../ui/icons';

interface Saved { text: string; base: string; style: LinkOptions['style']; encode: boolean; mode: LinkOptions['mode']; template: string }

function load(def: Saved): Saved {
  try { return { ...def, ...(JSON.parse(localStorage.getItem(GUESTS_KEY) ?? '{}') as Partial<Saved>) }; } catch { return def; }
}

export default function LinksRoute({ store, preview, peek }: RouteProps) {
  const guest = useStore(store, (s) => s.draft.guest);
  const siteUrl = useStore(store, (s) => s.draft.meta.siteUrl);
  const [st, setSt] = useState<Saved>(() => load({
    text: '', base: siteUrl || `${location.origin}${import.meta.env.BASE_URL}`, style: 'keep', encode: false, mode: 'query',
    template: 'Trân trọng kính mời {name} tới dự lễ cưới của chúng mình: {link}',
  }));
  const [made, setMade] = useState(st.text.trim() !== '');
  const upd = (p: Partial<Saved>) => { const n = { ...st, ...p }; setSt(n); try { localStorage.setItem(GUESTS_KEY, JSON.stringify(n)); } catch { /* đầy */ } };
  const rows = useMemo(() => (made ? buildLinks(st.text, { base: st.base, style: st.style, encode: st.encode, mode: st.mode, queryParam: guest.queryParam || 'to', pathPrefix: guest.pathPrefix || 'invite' }, guest) : []),
    [made, st, guest]);
  const dup = rows.filter((r) => r.duplicate).length;

  const share = async (i: number) => {
    const r = rows[i]!;
    const text = inviteMessage(r, st.template);
    if (navigator.share) {
      try { await navigator.share({ title: 'Thiệp cưới', text, url: r.link }); return; } catch { /* huỷ */ }
    }
    if (await copyText(text)) toast('Đã sao chép tin nhắn mời');
  };

  return (
    <section>
      <h1>Tạo link khách mời</h1>
      <TextArea label="Nhập mỗi dòng một tên khách" rows={6} value={st.text} onInput={(v) => { upd({ text: v }); setMade(false); }}
        placeholder={'Gia đình anh Mạnh\nChị Hường và gia đình\nBạn Tuấn (lớp 12A)'} testId="links-names" />
      <TextField label="Tên miền" value={st.base} onInput={(v) => upd({ base: v })} type="url" />
      <Segmented legend="Kiểu link" name="lstyle" value={st.style} onChange={(v) => upd({ style: v })}
        options={[{ value: 'keep', label: 'Giữ dấu ★' }, { value: 'ascii', label: 'Không dấu' }]} />
      {st.style === 'ascii' && <p class="banner banner--warn">Tên khách sẽ hiện không dấu.</p>}
      <Toggle label="Mã hoá link (khi app chat cắt link)" checked={st.encode} onChange={(v) => upd({ encode: v })} testId="links-encode"
        help="Bật nếu khách bấm link mà tên hiện sai hoặc bị cắt. Tên khách vẫn hiện đúng dấu." />
      <Segmented legend="Dạng link" name="lmode" value={st.mode} onChange={(v) => upd({ mode: v })}
        options={[{ value: 'query', label: `?${guest.queryParam || 'to'}=` }, { value: 'path', label: `/${guest.pathPrefix || 'invite'}/` }]} />
      <button type="button" class="btn btn-primary" onClick={() => setMade(true)} data-testid="links-make">Tạo link</button>

      {rows.length > 0 && (
        <>
          <p class="links-sum">
            {rows.length} link{dup ? ` · ⚠ ${dup} tên trùng` : ''} ·
            <button type="button" class="btn btn-link" onClick={() => void copyText(rows.map((r) => `${r.name}\t${r.link}`).join('\n')).then(() => toast('Đã sao chép tất cả'))}>Sao chép tất cả</button>
            <button type="button" class="btn btn-link" onClick={() => saveFile(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }), 'link-khach-moi.csv')}>Tải CSV</button>
          </p>
          <TextField label="Tin nhắn mẫu khi Chia sẻ ({name}, {link})" value={st.template} onInput={(v) => upd({ template: v })} />
          <div class="table-wrap">
            <table class="links" data-testid="links-table">
              <thead><tr><th scope="col">Khách</th><th scope="col">Tên trên thiệp</th><th scope="col">Link</th><th scope="col"><span class="sr-only">Thao tác</span></th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} class={r.duplicate ? 'is-dup' : ''}>
                    <td class="lk-name">{r.name}{r.duplicate && <span class="badge badge--warn"> trùng</span>}</td>
                    <td class="lk-display"><span class="lk-k">Trên thiệp: </span>{r.display}</td>
                    <td class="link-cell"><code>{r.readable}</code></td>
                    <td class="btn-row lk-actions">
                      <button type="button" class="btn btn-secondary btn-sm" onClick={() => void copyText(r.link).then(() => toast('Đã sao chép link'))} data-link={r.link}
                        aria-label={`Sao chép link của ${r.name}`}>Sao chép</button>
                      <button type="button" class="btn btn-ghost btn-sm" onClick={() => void share(i)} aria-label={`Chia sẻ thiệp cho ${r.name}`}>Chia sẻ</button>
                      <button type="button" class="btn btn-ghost btn-sm" aria-label={`Xem trước thiệp gửi ${r.name}`}
                        onClick={() => { preview.previewGuest(r.name); peek(`Thiệp gửi ${r.name}`); }}><Icon name="eye" /> Xem</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p class="note">Danh sách khách chỉ lưu trên máy này (và file CSV bạn tải), không đưa lên repo.</p>
    </section>
  );
}
