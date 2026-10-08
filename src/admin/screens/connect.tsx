/**
 * Màn "Kết nối lần đầu" 3 bước (design 8.2b, solution 2.3): Tạo token · Kết nối · Bảo vệ trên máy này.
 * Mobile: 3 màn có nút "Tiếp"; desktop: 1 trang cuộn.
 */
import { useEffect, useState } from 'preact/hooks';
import type { ConnectReport, ConnectStep } from '../storage/adapter';
import { GitHubAdapter } from '../storage/github';
import {
  MIN_PASSPHRASE, createVault, loadConn, parseRepoInput, passphraseStrength, saveConn, saveSession, saveVault, tokenKind,
  type Session,
} from '../auth/vault';
import { Details, Spinner, TextField, Toggle } from '../ui/ui';

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

export interface ConnectProps {
  /** thông báo khi bị đẩy về đây (token hết hạn, thiếu quyền…) */
  notice?: string | null;
  onDone: (s: Session) => void;
  onOffline: () => void;
  /** chỉ có khi `vite dev` */
  onDevServer?: (() => void) | null;
}

const stepIcon = (s: ConnectStep['status'] | 'pending') => (s === 'ok' ? '✓' : s === 'warn' ? '!' : s === 'error' ? '✕' : '◌');

export function ConnectScreen(p: ConnectProps) {
  const saved = loadConn(localStorage);
  const [owner, setOwner] = useState(saved?.owner ?? '');
  const [repo, setRepo] = useState(saved?.repo ?? '');
  const [branch, setBranch] = useState(saved?.branch ?? 'main');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [report, setReport] = useState<ConnectReport | null>(null);
  const [steps, setSteps] = useState<ConnectStep[]>([]);
  const [checking, setChecking] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [passTouched, setPassTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileStep, setMobileStep] = useState(saved ? 2 : 1);
  const [guideOpen, setGuideOpen] = useState(!saved);

  // sửa bất kỳ ô nào ở bước ② -> xoá kết quả cũ
  useEffect(() => { setReport(null); setSteps([]); }, [owner, repo, branch, token]);

  const kind = tokenKind(token);
  const okAll = !!report && ['token-repo', 'branch', 'write'].every((id) => report.steps.find((s) => s.id === id)?.status === 'ok');
  const passErr = passTouched && pass.length < MIN_PASSPHRASE ? `Cần ít nhất ${MIN_PASSPHRASE} ký tự.` : null;
  const pass2Err = passTouched && pass2 && pass2 !== pass ? 'Hai lần nhập chưa khớp.' : null;
  const canSave = okAll && !saving && (!remember || (pass.length >= MIN_PASSPHRASE && pass === pass2));

  const onOwnerInput = (v: string) => {
    const r = parseRepoInput(v, repo);
    if (r.owner !== v.trim() && r.repo) { setOwner(r.owner); setRepo(r.repo); } else setOwner(v);
  };

  const check = async () => {
    setChecking(true);
    setReport(null);
    setSteps([]);
    const c = parseRepoInput(owner, repo);
    const gh = new GitHubAdapter({ ...c, branch: branch.trim() || 'main', token: token.trim() });
    const r = await gh.connect({ full: true, onStep: setSteps });
    setReport(r);
    setChecking(false);
  };

  const save = async () => {
    const c = parseRepoInput(owner, repo);
    const conn = { ...c, branch: branch.trim() || 'main' };
    const sess: Session = { ...conn, token: token.trim(), expiresAt: report?.expiresAt ?? null };
    setSaving(true);
    saveConn(localStorage, conn);
    if (remember) {
      // PBKDF2 600k vòng: 0.5-1s trên điện thoại cũ -> "Đang mã hoá…"
      const v = await createVault(sess.token, pass, conn, sess.expiresAt);
      saveVault(localStorage, v);
    }
    saveSession(sessionStorage, sess);
    setSaving(false);
    p.onDone(sess);
  };

  const lines: (ConnectStep | { id: string; status: 'pending'; message: string })[] = checking
    ? [...steps, { id: 'pending', status: 'pending', message: 'Đang kiểm tra…' }]
    : steps;

  return (
    <main class="connect" data-step={mobileStep}>
      <h1>Kết nối trang quản lý với GitHub</h1>
      <ol class="stepper" aria-label="Các bước">
        {['Tạo token', 'Kết nối', 'Bảo vệ trên máy này'].map((t, i) => (
          <li key={t} aria-current={mobileStep === i + 1 ? 'step' : undefined} class={mobileStep > i + 1 ? 'is-done' : ''}>
            <span class="stepper-n">{i + 1}</span> {t}
          </li>
        ))}
      </ol>
      {p.notice && <p class="banner banner--warn" role="alert">{p.notice}</p>}

      <section class="cstep cstep-1" aria-labelledby="cs1">
        <h2 id="cs1"><span class="stepper-n">1</span> Tạo token <small>(làm 1 lần, khoảng 3 phút)</small></h2>
        <details class="details" open={guideOpen} onToggle={(e) => setGuideOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary>{guideOpen ? 'Thu gọn hướng dẫn' : 'Xem hướng dẫn tạo token'}</summary>
          <ol class="guide">
            <li>Mở trang tạo token của GitHub <a class="btn btn-secondary" href={TOKEN_URL} target="_blank" rel="noopener noreferrer">Mở GitHub ↗</a></li>
            <li>Token name: "Thiệp cưới" · Expiration: chọn ngày <strong>sau ngày cưới ít nhất 1 tháng</strong>.</li>
            <li>Repository access: <strong>Only select repositories</strong> → chọn repo của thiệp.</li>
            <li>Permissions → Repository permissions: <strong>Contents: Read and write</strong> · Metadata: Read-only. Không cấp quyền nào khác.</li>
            <li>Bấm "Generate token", rồi bấm biểu tượng sao chép.</li>
          </ol>
          <p class="note">ⓘ Token giống chìa khoá ghi vào repo. Đừng gửi cho ai, đừng dán vào tin nhắn.</p>
        </details>
        <div class="cstep-nav mobile-only">
          <button type="button" class="btn btn-primary btn-block" onClick={() => setMobileStep(2)}>Tiếp</button>
          <button type="button" class="btn btn-link" onClick={() => setMobileStep(2)}>Tôi đã có token</button>
        </div>
      </section>

      <section class="cstep cstep-2" aria-labelledby="cs2">
        <h2 id="cs2"><span class="stepper-n">2</span> Kết nối</h2>
        <TextField label="Chủ repo (owner)" value={owner} onInput={onOwnerInput} autoComplete="off" spellcheck={false}
          help="Mẹo: dán nguyên link repo (https://github.com/…/…) vào ô này để tự tách owner/repo." testId="conn-owner" />
        <TextField label="Tên repo" value={repo} onInput={setRepo} autoComplete="off" spellcheck={false} testId="conn-repo" />
        <TextField label="Nhánh (branch)" value={branch} onInput={setBranch} autoComplete="off" spellcheck={false} help="Mặc định main" />
        <div class="field">
          <label for="conn-token">Token GitHub</label>
          <div class="input-row">
            <input id="conn-token" class="input" type={showToken ? 'text' : 'password'} value={token} autoComplete="off" spellcheck={false}
              data-testid="conn-token" onInput={(e) => setToken((e.currentTarget as HTMLInputElement).value.trim())} />
            <button type="button" class="icon-btn" aria-pressed={showToken} aria-label={showToken ? 'Ẩn token' : 'Hiện token'} onClick={() => setShowToken(!showToken)}>👁</button>
          </div>
          {kind === 'classic' && <p class="banner banner--warn">Đây là token kiểu cũ có quyền rộng. Nên tạo token fine-grained chỉ cho repo này.</p>}
        </div>
        <button type="button" class="btn btn-primary" disabled={checking || !owner || !repo || !token} onClick={() => void check()} data-testid="conn-check">
          {checking ? <><Spinner /> Đang kiểm tra…</> : 'Kiểm tra kết nối'}
        </button>
        <div class="results" aria-live="polite">
          {lines.length > 0 && (
            <ul class="result-list">
              {lines.map((s) => (
                <li key={s.id} class={`res res--${s.status}`} role={s.status === 'error' ? 'alert' : undefined}>
                  <span class="res-ic" aria-hidden="true">{stepIcon(s.status)}</span>
                  <span>{s.message}</span>
                  {'detail' in s && s.detail && <Details summary="Chi tiết kỹ thuật"><code>{s.detail}</code></Details>}
                </li>
              ))}
            </ul>
          )}
          {report?.branches && report.branches.length > 0 && (
            <div class="chips" aria-label="Chọn nhanh nhánh">
              {report.branches.map((b) => <button key={b} type="button" class="chip" onClick={() => setBranch(b)}>{b}</button>)}
            </div>
          )}
          {report?.errorCode === 'expired' && <a class="btn btn-secondary" href={TOKEN_URL} target="_blank" rel="noopener noreferrer">Tạo token mới ↗</a>}
        </div>
        <div class="cstep-nav mobile-only">
          <button type="button" class="btn btn-primary btn-block" disabled={!okAll} onClick={() => setMobileStep(3)}>Tiếp</button>
        </div>
      </section>

      <section class="cstep cstep-3" aria-labelledby="cs3">
        <h2 id="cs3"><span class="stepper-n">3</span> Bảo vệ trên máy này</h2>
        <Toggle label="Ghi nhớ trên máy này (token được mã hoá bằng passphrase)" checked={remember} onChange={setRemember} />
        {remember ? (
          <>
            <TextField label="Passphrase" type="password" value={pass} onInput={setPass} onBlur={() => setPassTouched(true)} autoComplete="new-password"
              help={`≥ ${MIN_PASSPHRASE} ký tự${pass ? ` · Độ mạnh: ${passphraseStrength(pass)}` : ''}`} error={passErr} testId="conn-pass" />
            <TextField label="Nhập lại passphrase" type="password" value={pass2} onInput={setPass2} onBlur={() => setPassTouched(true)} autoComplete="new-password" error={pass2Err} testId="conn-pass2" />
            <p class="note">ⓘ Lần sau chỉ cần nhập passphrase. Quên passphrase thì dán lại token là xong, không mất dữ liệu.</p>
          </>
        ) : <p class="note">Token chỉ giữ tới khi đóng tab, lần sau phải dán lại.</p>}
        <button type="button" class="btn btn-primary btn-block" disabled={!canSave} onClick={() => void save()} data-testid="conn-save">
          {saving ? <><Spinner /> Đang mã hoá…</> : 'Lưu và vào trang quản lý'}
        </button>
      </section>

      <footer class="connect-alt">
        <p>Không có token?</p>
        <button type="button" class="btn btn-secondary" onClick={p.onOffline} data-testid="mode-download">Dùng chế độ xem thử và xuất file</button>
        {p.onDevServer && <button type="button" class="btn btn-secondary" onClick={p.onDevServer} data-testid="mode-dev">Dùng máy chủ dev (npm run dev)</button>}
      </footer>
    </main>
  );
}
