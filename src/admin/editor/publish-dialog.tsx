/**
 * Xuất bản (design 8.8 v3): checklist (lỗi nặng chặn) -> xem thay đổi -> xác nhận (câu về bản sao lưu) -> tiến trình.
 */
import { useMemo, useState } from 'preact/hooks';
import type { EditorStore } from '../state/store';
import { useStore } from '../state/store';
import { hasBlocking, runChecklist } from '../draft/checklist';
import { Details, Modal, Spinner, toast } from '../ui/ui';
import { downloadJson, fmtTime, today } from './util';

export function PublishDialog(p: { store: EditorStore; onClose: () => void; go: (r: string) => void }) {
  const { store } = p;
  const s = useStore(store, (x) => x);
  const [done, setDone] = useState(false);
  const checks = useMemo(() => runChecklist(s.draft, { tokenExpiresAt: s.tokenExpiresAt }), [s.draft]);
  const changes = useMemo(() => store.changes(), [s.draft, s.published]);
  const blocking = hasBlocking(checks);
  const isZip = s.adapter.kind === 'download';

  const go = async () => {
    const r = await store.publish();
    if (r) {
      setDone(true);
      toast(isZip ? 'Đã tải gói xuất bản. Giải nén vào dự án rồi commit.' : 'Đã xuất bản! Khách sẽ thấy sau khoảng 1 phút', { tone: 'ok' });
    }
  };

  const footer = done ? (
    <button type="button" class="btn btn-primary" onClick={p.onClose}>Đóng</button>
  ) : s.error ? (
    <>
      <button type="button" class="btn btn-ghost" onClick={() => downloadJson(s.draft, `cau-hinh-nhap-${today()}.json`)}>Tải file cấu hình về máy</button>
      <button type="button" class="btn btn-primary" onClick={() => { store.clearError(); void go(); }}>Thử lại</button>
    </>
  ) : (
    <>
      <button type="button" class="btn btn-ghost" onClick={p.onClose} disabled={!!s.busy}>Huỷ</button>
      <button type="button" class="btn btn-primary" disabled={blocking || !!s.busy} onClick={() => void go()} data-testid="publish-confirm">
        {s.busy ? <><Spinner /> Đang xuất bản…</> : isZip ? 'Tải gói (.zip)' : 'Xuất bản'}
      </button>
    </>
  );

  return (
    <Modal open onClose={() => { if (!s.busy) p.onClose(); }} title={isZip ? 'Tải gói xuất bản' : 'Xuất bản'} wide footer={footer}>
      {done ? (
        <div role="status">
          <p class="ok-text">✓ {isZip ? 'Đã tạo gói xuất bản.' : 'Đã xuất bản! Khách sẽ thấy sau khoảng 1 phút.'}</p>
          {!isZip && <p><a href={import.meta.env.BASE_URL} target="_blank" rel="noopener">Xem trang ↗</a></p>}
        </div>
      ) : (
        <>
          {s.error && (
            <div class="banner banner--err" role="alert">
              <p>✕ Xuất bản thất bại: {s.error.message}</p>
              {s.error.code === 'conflict' && <button type="button" class="btn btn-secondary" onClick={() => { store.clearError(); void store.reloadSnapshot({ keepDraft: true }); p.onClose(); }}>Tải lại</button>}
              {s.error.detail && <Details summary="Chi tiết kỹ thuật"><code>{s.error.detail}</code></Details>}
            </div>
          )}
          <h3>Kiểm tra trước khi xuất bản</h3>
          {checks.length === 0 ? <p class="ok-text">✓ Không thấy vấn đề nào.</p> : (
            <ul class="checklist" data-testid="checklist">
              {checks.map((c, i) => (
                <li key={i} class={`chk chk--${c.level}`}>
                  <span aria-hidden="true">{c.level === 'error' ? '✕' : '!'}</span>
                  <span>{c.level === 'error' ? 'Cần sửa: ' : 'Lưu ý: '}{c.message}</span>
                  <button type="button" class="btn btn-link" onClick={() => p.go(c.fix === 'connect' ? 'overview' : c.fix)}>Sửa</button>
                </li>
              ))}
            </ul>
          )}
          <Details summary={`Xem thay đổi (${changes.length})`} open={changes.length <= 6}>
            <ul class="diff" data-testid="diff">{changes.map((c) => <li key={c.path}>{c.text}</li>)}</ul>
          </Details>
          {!isZip && (
            <p class="note">
              Trạng thái trang hiện tại sẽ được lưu làm bản sao lưu{s.manifest?.createdAt ? ` (thay bản sao lưu cũ ngày ${fmtTime(s.manifest.createdAt)})` : ''}.
              Nếu cần, bạn có thể khôi phục lại ở mục Sao lưu/Khôi phục.
            </p>
          )}
          {s.busy && <p role="status"><Spinner /> {s.busy.total > 1 ? `Đang tải ${s.busy.done}/${s.busy.total} tệp…` : 'Đang xuất bản…'}</p>}
        </>
      )}
    </Modal>
  );
}
