/**
 * Sao lưu / Khôi phục (design 8.10, solution 3.4/3.5): bản sao lưu duy nhất = trạng thái TRƯỚC lần ghi gần nhất.
 * Khôi phục = swap (1 commit, ghi ngay lên trang), bấm lại = làm lại. Dialog 2 bước; còn nháp -> cảnh báo + tải nháp .json.
 * Tệp cấu hình: tải bản hiện tại / tải nháp / tải gói .zip / nhập từ file (vào NHÁP, xem diff trước).
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { WeddingConfig } from '@shared/config/types';
import { parseLegacyConfigJs } from '@shared/config/migrations';
import { collectAssetRefs } from '@shared/storage/asset-refs';
import { repoPathOfSrc, srcOfRepoPath, type ManifestFile } from '@shared/storage/manifest';
import type { RouteProps } from '../editor';
import { normalizeConfig, useStore } from '../../state/store';
import { diffConfigs } from '../../draft/diff';
import { buildPublishZip, saveFile } from '../../storage/local-adapters';
import { Details, Modal, Spinner, toast } from '../../ui/ui';
import { downloadJson, fmtTime, today } from '../util';

function Thumb(p: { load: () => Promise<Blob> }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    let alive = true;
    p.load().then((b) => { if (alive) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { alive = false; if (u) URL.revokeObjectURL(u); };
  }, []);
  return url ? <img class="slot-thumb slot-thumb--sm" src={url} alt="" /> : <span class="slot-thumb slot-thumb--sm slot-empty" aria-hidden="true" />;
}

/** Đọc file nhập: .json (config v1/v0) hoặc config.js cũ. */
export function parseImport(name: string, text: string): unknown {
  if (/\.js$/i.test(name) || /window\.CONFIG|const\s+CONFIG/.test(text)) return parseLegacyConfigJs(text);
  return JSON.parse(text);
}

export default function BackupRoute({ store }: RouteProps) {
  const s = useStore(store, (x) => x);
  const [backupCfg, setBackupCfg] = useState<WeddingConfig | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [imp, setImp] = useState<{ config: WeddingConfig; warnings: string[]; name: string } | null>(null);
  const [impErr, setImpErr] = useState<string | null>(null);
  const changes = useMemo(() => store.changes(), [s.draft, s.published]);
  const m = s.manifest;
  const hasBackup = !!m && m.files.length > 0;
  const isRedo = m?.reason === 'restore';

  useEffect(() => { void store.readBackupConfig().then(setBackupCfg); }, [m?.createdAt]);
  const contentDiff = useMemo(() => (backupCfg ? diffConfigs(backupCfg, s.published) : []), [backupCfg, s.published]);
  const assetFiles = (m?.files ?? []).filter((f) => !f.path.endsWith('/config.json'));
  const replaced = assetFiles.filter((f) => f.existed);
  const created = assetFiles.filter((f) => !f.existed);

  const rows = useMemo(() => {
    // ghép cũ -> mới theo slot
    const out: { slot: string; old: ManifestFile | null; cur: ManifestFile | null }[] = [];
    for (const f of replaced) out.push({ slot: f.slot ?? f.path, old: f, cur: created.find((c) => c.slot && c.slot === f.slot) ?? null });
    for (const c of created) if (!out.some((r) => r.cur === c)) out.push({ slot: c.slot ?? c.path, old: null, cur: c });
    return out;
  }, [m]);

  const doRestore = async () => {
    setStep(0);
    const r = await store.restore();
    if (r) toast('Đã khôi phục. Khách sẽ thấy sau khoảng 1 phút', { tone: 'ok' });
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    setImpErr(null);
    try {
      const raw = parseImport(f.name, await f.text());
      const n = normalizeConfig(raw);
      setImp({ ...n, name: f.name });
    } catch (e) {
      setImpErr(`Không đọc được file: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const fullZip = async () => {
    const uploads = [];
    for (const r of collectAssetRefs(s.draft)) {
      const b = await store.db?.blobBySrc(r.src);
      let blob: Blob | null = b?.blob ?? null;
      if (!blob) { try { blob = await (await fetch(store.urlOf(r.src))).blob(); } catch { blob = null; } }
      if (blob) uploads.push({ path: repoPathOfSrc(r.src), blob, slot: r.slot });
    }
    const data = await buildPublishZip({ config: s.draft, uploads, deletes: [], baseCommit: s.commit });
    saveFile(new Blob([data as BlobPart], { type: 'application/zip' }), `thiep-cuoi-day-du-${today()}.zip`);
  };

  return (
    <section>
      <h1>Sao lưu / Khôi phục</h1>
      <div class="ov-card" data-testid="backup-card">
        <h2>Bản sao lưu hiện có</h2>
        {s.adapter.kind === 'download' ? <p class="muted">Chế độ không kết nối không có bản sao lưu trên repo.</p>
          : !hasBackup ? <p class="muted">Chưa có bản sao lưu. Bản sao lưu được tạo tự động mỗi lần Xuất bản.</p> : (
          <>
            <p>Trạng thái trang <strong>{isRedo ? 'TRƯỚC khi khôi phục' : 'TRƯỚC lần xuất bản'}</strong> lúc {fmtTime(m!.createdAt)}</p>
            <p class="muted">Gồm: nội dung thiệp{replaced.length ? ` + ${replaced.filter((r) => created.some((c) => c.slot === r.slot)).length} ảnh/nhạc đã thay` : ''}{replaced.length - replaced.filter((r) => created.some((c) => c.slot === r.slot)).length > 0 ? ` + ${replaced.length - replaced.filter((r) => created.some((c) => c.slot === r.slot)).length} tệp đã xoá` : ''}{created.filter((c) => !replaced.some((r) => r.slot === c.slot)).length ? ` + ${created.filter((c) => !replaced.some((r) => r.slot === c.slot)).length} tệp mới thêm` : ''}</p>
            <ul class="bk-rows">
              {rows.map((r) => (
                <li key={r.slot}>
                  {r.old?.backupPath ? <Thumb load={() => store.s.adapter.readAsset(r.old!.backupPath!)} /> : <span class="slot-thumb slot-thumb--sm slot-empty">(chưa có)</span>}
                  <span aria-hidden="true">→</span>
                  {r.cur ? <img class="slot-thumb slot-thumb--sm" src={store.urlOf(srcOfRepoPath(r.cur.path))} alt="" /> : <span class="slot-thumb slot-thumb--sm slot-empty">(đã xoá)</span>}
                  <span>{r.slot}</span>
                </li>
              ))}
            </ul>
            <Details summary={`Nội dung: ${contentDiff.length} thay đổi`}>
              <ul class="diff">{contentDiff.map((d) => <li key={d.path}>{d.text}</li>)}</ul>
            </Details>
          </>
        )}
        <button type="button" class={`btn ${isRedo ? 'btn-secondary' : 'btn-warn'}`} disabled={!hasBackup || !!s.busy || s.adapter.kind === 'download'} onClick={() => setStep(1)} data-testid="restore-btn">
          {s.busy?.kind === 'restore' ? <><Spinner /> Đang khôi phục…</> : isRedo ? 'Làm lại (quay về bản vừa thay)' : 'Khôi phục bản xuất bản trước'}
        </button>
        {s.error && (s.error.code === 'conflict' || s.error.code === 'no-backup') && (
          <p class="err" role="alert">⚠ {s.error.message} {s.error.code === 'conflict' && <button type="button" class="btn btn-link" onClick={() => { store.clearError(); void store.reloadSnapshot({ keepDraft: true }); }}>Tải lại</button>}</p>
        )}
      </div>
      <p class="note">ⓘ Hệ thống chỉ giữ 1 bản sao lưu: trạng thái ngay trước lần xuất bản gần nhất. Mỗi lần Xuất bản sẽ thay bản sao lưu này.</p>

      <h2>Tệp cấu hình</h2>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" onClick={() => downloadJson(s.published, `cau-hinh-${today()}.json`)}>Tải bản cấu hình hiện tại (.json)</button>
        <button type="button" class="btn btn-secondary" onClick={() => downloadJson(s.draft, `cau-hinh-nhap-${today()}.json`)}>Tải nháp (.json)</button>
        <button type="button" class="btn btn-ghost" onClick={() => void fullZip()}>Tải gói đầy đủ kèm ảnh (.zip)</button>
        <label class="btn btn-secondary">Nhập từ file…
          <input type="file" accept=".json,.js,application/json,text/javascript" class="sr-only" data-testid="import-file"
            onChange={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = ''; void onImport(f); }} />
        </label>
      </div>
      {impErr && <p class="err" role="alert">⚠ {impErr}</p>}

      <Modal open={step === 1} onClose={() => setStep(0)} title={isRedo ? 'Làm lại' : 'Khôi phục bản xuất bản trước'}
        footer={<><button type="button" class="btn btn-ghost" onClick={() => setStep(0)}>Huỷ</button><button type="button" class="btn btn-primary" onClick={() => setStep(2)}>Tiếp tục</button></>}>
        <p>Trang của khách sẽ quay về như <strong>{isRedo ? 'trước khi khôi phục' : 'trước lần xuất bản'} lúc {m ? fmtTime(m.createdAt) : ''}</strong> (cả nội dung và ảnh).</p>
        <p class="muted">{contentDiff.length} thay đổi nội dung · {assetFiles.length} tệp ảnh/nhạc</p>
      </Modal>
      <Modal open={step === 2} onClose={() => setStep(0)} title="Xác nhận khôi phục" alert
        footer={<><button type="button" class="btn btn-ghost" onClick={() => setStep(1)}>Quay lại</button><button type="button" class="btn btn-warn" onClick={() => void doRestore()} data-testid="restore-confirm">Khôi phục ngay</button></>}>
        <p>Trạng thái hiện tại sẽ được giữ làm bản sao lưu, nên bạn có thể <strong>bấm lại để làm lại</strong>.</p>
        {changes.length > 0 && (
          <div class="banner banner--warn">
            <p>Bạn có {changes.length} thay đổi nháp chưa xuất bản. Sau khi khôi phục, bản nháp sẽ được đặt lại theo trang vừa khôi phục.</p>
            <button type="button" class="btn btn-secondary" onClick={() => downloadJson(s.draft, `cau-hinh-nhap-${today()}.json`)} data-testid="download-draft">Tải nháp về máy (.json)</button>
          </div>
        )}
      </Modal>
      <Modal open={!!imp} onClose={() => setImp(null)} title={`Nhập ${imp?.name ?? ''} vào bản nháp`} wide
        footer={<><button type="button" class="btn btn-ghost" onClick={() => setImp(null)}>Huỷ</button>
          <button type="button" class="btn btn-primary" data-testid="import-apply" onClick={() => { store.replaceDraft(imp!.config); setImp(null); toast('Đã nạp file vào bản nháp. Khách chỉ thấy sau khi Xuất bản.'); }}>Đưa vào nháp</button></>}>
        {imp && <>
          <p>File sẽ được nạp vào <strong>bản nháp</strong> (không ghi thẳng lên trang). Thay đổi so với nháp hiện tại:</p>
          <ul class="diff">{diffConfigs(s.draft, imp.config).slice(0, 200).map((d) => <li key={d.path}>{d.text}</li>)}</ul>
          {imp.warnings.length > 0 && <Details summary={`${imp.warnings.length} ghi chú khi chuyển đổi`}><ul>{imp.warnings.map((w) => <li key={w}>{w}</li>)}</ul></Details>}
        </>}
      </Modal>
    </section>
  );
}
