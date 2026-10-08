/**
 * Tổng quan: trạng thái xuất bản, banner token sắp hết hạn (solution 2.6), checklist thiếu thông tin,
 * thẻ "Kết nối GitHub" (v2.3: kết nối khi cần / ngắt kết nối).
 */
import { useMemo } from 'preact/hooks';
import { loadVault } from '../../auth/vault';
import type { EditorStore } from '../../state/store';
import { useStore } from '../../state/store';
import { runChecklist } from '../../draft/checklist';
import { expiryWarning, weddingDateOf } from '../../storage/github';
import { fmtTime } from '../util';
import { publishLabel, statusOf } from '../status';

export function Overview(p: { store: EditorStore; go: (r: string) => void; openPublish: () => void; connect: () => void; disconnect: () => void }) {
  const s = useStore(p.store, (x) => x);
  const checks = useMemo(() => runChecklist(s.draft, { tokenExpiresAt: s.tokenExpiresAt }), [s.draft]);
  const n = useMemo(() => p.store.changes().length, [s.draft, s.published]);
  const st = statusOf(s, n);
  const zip = s.adapter.kind === 'download';
  const exp = expiryWarning(s.tokenExpiresAt, weddingDateOf(s.draft));
  const c = s.draft.content.couple;
  return (
    <section>
      <h1>Tổng quan</h1>
      {exp && (
        <p class="banner banner--warn" role="alert">
          {exp} <a class="btn btn-link" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Tạo token mới ↗</a>
        </p>
      )}
      {s.adapter.kind === 'download' && <p class="banner banner--info">Chế độ không kết nối: thay đổi được lưu trên máy này; nút Xuất bản tải về gói .zip để bạn tự commit lên repo.</p>}
      {s.adapter.kind === 'dev' && <p class="banner banner--info">Máy chủ dev: Xuất bản ghi thẳng vào <code>public/content/</code> và <code>backup/</code> của dự án.</p>}
      <div class="ov-cards">
        <div class="ov-card">
          <h2>{c.groom.shortName || c.groom.fullName || 'Chú rể'} &amp; {c.bride.shortName || c.bride.fullName || 'Cô dâu'}</h2>
          <p class="muted">{s.draft.meta.title}</p>
        </div>
        <div class="ov-card">
          <h2>Trạng thái</h2>
          <p class={`ov-status tb-status--${st.tone}`} data-testid="ov-status"><span class="dot" aria-hidden="true" />{st.text}</p>
          {!zip && s.published.publish.at && <p class="muted">Xuất bản gần nhất: {fmtTime(s.published.publish.at)}</p>}
          {zip && <p class="muted">Chế độ này không xuất bản trực tiếp: tải gói .zip rồi commit lên repo.</p>}
          {s.live?.state === 'waiting' && <p>◌ Đang chờ trang cập nhật (Cloudflare Pages build 30-90 giây)…</p>}
          {s.live?.state === 'live' && <p class="ok-text">✓ Khách đã thấy bản mới</p>}
          {s.live?.state === 'timeout' && <p class="err">Sau 5 phút trang vẫn chưa đổi. Kiểm tra trạng thái build trên Cloudflare Pages.</p>}
          {st.hint && <p class="muted" data-testid="ov-hint">{st.hint}</p>}
          <button type="button" class="btn btn-primary" disabled={(n === 0 && !zip) || !!s.busy} onClick={p.openPublish} data-testid="ov-publish">{publishLabel(s.adapter.kind)}</button>
        </div>
        <div class="ov-card" data-testid="gh-card">
          <h2>Kết nối GitHub</h2>
          {s.adapter.kind === 'github' ? (
            <>
              <p class="ok-text">✓ Đã kết nối {s.adapter.label}</p>
              <p class="muted">{loadVault(localStorage) ? 'Token được ghi nhớ trên máy này (mã hoá bằng mật khẩu đăng nhập).' : 'Token chỉ giữ tới khi đóng tab.'}</p>
              <button type="button" class="btn btn-secondary" disabled={!!s.busy} onClick={p.disconnect} data-testid="gh-disconnect">Ngắt kết nối GitHub</button>
            </>
          ) : (
            <>
              <p class="muted">
                {s.adapter.kind === 'site' ? 'Chưa kết nối. Bạn vẫn sửa, xem trước và tải ảnh/nhạc vào nháp bình thường; chỉ Xuất bản và Khôi phục cần token.'
                  : `Đang dùng ${zip ? 'chế độ không kết nối (tải gói .zip)' : 'máy chủ dev'}. Kết nối GitHub để xuất bản thẳng lên trang.`}
              </p>
              <button type="button" class="btn btn-secondary" disabled={!!s.busy} onClick={p.connect} data-testid="gh-connect">Kết nối GitHub</button>
            </>
          )}
        </div>
      </div>
      <h2>Việc cần làm</h2>
      {checks.length === 0 ? <p class="ok-text">✓ Không thấy thông tin nào còn thiếu.</p> : (
        <ul class="checklist">
          {checks.map((ch, i) => (
            <li key={i} class={`chk chk--${ch.level}`}>
              <span aria-hidden="true">{ch.level === 'error' ? '✕' : '!'}</span>
              <span>{ch.message}</span>
              {ch.fix !== 'connect' && <button type="button" class="btn btn-link" onClick={() => p.go(ch.fix)}>Sửa</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
