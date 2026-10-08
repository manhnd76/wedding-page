import { describe, expect, it, beforeEach } from 'vitest';
import { GitHubAdapter, expiryWarning, weddingDateOf } from '../src/admin/storage/github';
import { StorageError } from '../src/admin/storage/adapter';
import { MSG, classify, parseExpiryHeader } from '../src/admin/storage/github-errors';
import { mergeWithDefaults } from '../src/shared/config/merge';
import { MANIFEST_PATH } from '../src/shared/storage/manifest';
import type { WeddingConfig } from '../src/shared/config/types';
import { FakeGitHub, respond } from './helpers/fake-github';

const TOKEN = 'test-token-not-real';
const cfg = (patch: (c: WeddingConfig) => void = () => {}): WeddingConfig => {
  const c = mergeWithDefaults({}).config;
  c.publish = { id: 'pub-0', at: '2026-10-01T00:00:00Z' };
  c.content.hero.image = { src: 'content/images/hero/hero.aaaaaaaa.webp', w: 10, h: 10, alt: 'a' };
  patch(c);
  return c;
};
const HERO_OLD = 'public/content/images/hero/hero.aaaaaaaa.webp';
const blob = (s: string) => new Blob([s], { type: 'image/webp' });

let gh: FakeGitHub;
let a: GitHubAdapter;
const mk = (o: Partial<ConstructorParameters<typeof GitHubAdapter>[0]> = {}) =>
  new GitHubAdapter({ owner: 'minhanh', repo: 'wedding', branch: 'main', token: TOKEN, fetch: gh.fetch, sleep: async () => {}, ...o });

beforeEach(async () => {
  gh = new FakeGitHub();
  await gh.seed({
    'index.html': '<html></html>',
    'public/content/config.json': JSON.stringify(cfg()),
    [HERO_OLD]: 'old-hero-bytes',
  });
  a = mk();
});

describe('GitHubAdapter - đọc', () => {
  it('loadSnapshot cố định tại 1 commit: config + tree (chỉ public/content, backup)', async () => {
    const s = await a.loadSnapshot();
    expect(s.commit).toBe(gh.refs.main);
    expect((s.config as WeddingConfig).publish.id).toBe('pub-0');
    expect(s.manifest).toBeNull();
    expect(Object.keys(s.paths).sort()).toEqual(['public/content/config.json', HERO_OLD]);
  });
  it('gửi header chuẩn (Bearer, Accept, API version) và đọc hạn token', async () => {
    let headers: Record<string, string> = {};
    const f = mk({ fetch: async (u, i) => { headers = i?.headers as Record<string, string>; return gh.fetch(u, i); } });
    await f.loadSnapshot();
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(headers.Accept).toBe('application/vnd.github+json');
    expect(headers['X-GitHub-Api-Version']).toBe('2022-11-28');
    expect(f.expiresAt).toBe('2027-01-11T17:00:00.000Z');
  });
});

describe('GitHubAdapter - publish (solution 3.5)', () => {
  it('đúng 1 commit, ảnh cũ vào backup, tên mới có hash, file bị bỏ -> xoá + backup', async () => {
    const s = await a.loadSnapshot();
    const commitsBefore = gh.commits.size;
    const next = cfg((c) => { c.publish.id = 'pub-1'; c.content.hero.image = { src: 'content/images/hero/hero.bbbbbbbb.webp', w: 10, h: 10, alt: 'b' }; });
    const r = await a.publish({
      config: next, baseCommit: s.commit,
      uploads: [{ path: 'public/content/images/hero/hero.bbbbbbbb.webp', blob: blob('new-hero-bytes'), slot: 'content.hero.image' }],
      deletes: [{ path: HERO_OLD, slot: 'content.hero.image' }],
    });
    expect(gh.commits.size).toBe(commitsBefore + 1);
    expect(gh.count('POST', /\/git\/commits$/)).toBe(1);
    expect(gh.count('PATCH', /\/git\/refs\/heads\/main$/)).toBe(1);
    const patch = gh.calls.find((c) => c.method === 'PATCH')!;
    expect((patch.body as { force: boolean }).force).toBe(false);
    expect(r.publishId).toBe('pub-1');
    const t = gh.headTree();
    expect(t[HERO_OLD]).toBeUndefined();
    expect(t[`backup/files/${HERO_OLD}`]).toBeDefined();
    expect(t['public/content/images/hero/hero.bbbbbbbb.webp']).toBeDefined();
    expect(t['backup/files/public/content/config.json']).toBeDefined();
    const man = JSON.parse(gh.text(MANIFEST_PATH)!);
    expect(man.reason).toBe('publish');
    expect(man.publishId).toBe('pub-1');
    expect(man.backupPublishId).toBe('pub-0');
    expect(man.files.find((f: { path: string }) => f.path === HERO_OLD)).toMatchObject({ existed: true, slot: 'content.hero.image' });
    expect(man.files.find((f: { path: string }) => f.path.endsWith('bbbbbbbb.webp'))).toMatchObject({ existed: false, backupPath: null });
    expect(JSON.parse(gh.text('public/content/config.json')!).publish.id).toBe('pub-1');
  });

  it('không upload lại blob đã có trong repo (ảnh lấy lại từ backup, ảnh trùng nội dung)', async () => {
    // lần 1: thay ảnh -> ảnh cũ vào backup
    let s = await a.loadSnapshot();
    await a.publish({
      config: cfg((c) => { c.publish.id = 'pub-1'; c.content.hero.image = { src: 'content/images/hero/hero.bbbbbbbb.webp', w: 1, h: 1, alt: '' }; }),
      baseCommit: s.commit, uploads: [{ path: 'public/content/images/hero/hero.bbbbbbbb.webp', blob: blob('new-hero-bytes') }], deletes: [{ path: HERO_OLD }],
    });
    // lần 2: "Lấy lại ảnh trước đó" -> blob có nội dung trùng file trong backup
    s = await a.loadSnapshot();
    gh.calls = [];
    await a.publish({
      config: cfg((c) => { c.publish.id = 'pub-2'; }),
      baseCommit: s.commit,
      uploads: [{ path: HERO_OLD, blob: blob('old-hero-bytes'), slot: 'content.hero.image' }],
      deletes: [{ path: 'public/content/images/hero/hero.bbbbbbbb.webp' }],
    });
    // chỉ config.json + manifest.json được upload; ảnh tái dùng sha có sẵn
    const posted = gh.calls.filter((c) => c.method === 'POST' && /\/git\/blobs$/.test(c.path));
    expect(posted).toHaveLength(2);
    expect(posted.some((c) => (c.body as { content: string }).content === btoa('old-hero-bytes'))).toBe(false);
    expect(gh.headTree()[HERO_OLD]).toBeDefined();
  });

  it('upload blob=null dùng sha có sẵn trong backup, không gửi nội dung', async () => {
    let s = await a.loadSnapshot();
    await a.publish({ config: cfg((c) => { c.publish.id = 'p1'; c.content.hero.image = null; }), baseCommit: s.commit, uploads: [], deletes: [{ path: HERO_OLD }] });
    s = await a.loadSnapshot();
    gh.calls = [];
    await a.publish({ config: cfg((c) => { c.publish.id = 'p2'; }), baseCommit: s.commit, uploads: [{ path: HERO_OLD, blob: null }], deletes: [] });
    expect(gh.count('POST', /\/git\/blobs$/)).toBe(2);
    expect(gh.headTree()[HERO_OLD]).toBeDefined();
  });

  it('xung đột: nhánh đã đổi từ nơi khác -> không ghi gì, báo thông điệp xung đột', async () => {
    const s = await a.loadSnapshot();
    await gh.seed({ 'public/content/config.json': '{"other":1}' }); // tab khác xuất bản
    gh.calls = [];
    const err = await a.publish({ config: cfg(), baseCommit: s.commit, uploads: [], deletes: [] }).catch((e) => e);
    expect(err).toBeInstanceOf(StorageError);
    expect(err.code).toBe('conflict');
    expect(err.message).toBe(MSG.conflict);
    expect(gh.calls.filter((c) => c.method !== 'GET')).toHaveLength(0);
  });

  it.each([422, 409])('xung đột ở PATCH ref (%i) -> không ghi đè, ref giữ nguyên', async (status) => {
    const s = await a.loadSnapshot();
    const before = gh.refs.main;
    gh.overrides.push({ method: 'PATCH', re: /\/git\/refs\/heads\/main$/, res: respond(status, { message: 'Update is not a fast forward' }) });
    const err = await a.publish({ config: cfg((c) => { c.publish.id = 'x'; }), baseCommit: s.commit, uploads: [], deletes: [] }).catch((e) => e);
    expect(err.code).toBe('conflict');
    expect(gh.refs.main).toBe(before);
    expect(gh.calls.filter((c) => c.method === 'PATCH').every((c) => (c.body as { force: boolean }).force === false)).toBe(true);
  });
});

describe('GitHubAdapter - restore = swap (solution 3.5)', () => {
  it('restore 2 lần liên tiếp = tree ban đầu (bỏ qua manifest)', async () => {
    let s = await a.loadSnapshot();
    await a.publish({
      config: cfg((c) => { c.publish.id = 'pub-1'; c.content.hero.image = { src: 'content/images/hero/hero.bbbbbbbb.webp', w: 1, h: 1, alt: '' }; c.content.album.images = [{ src: 'content/images/album/a.cccccccc.webp', w: 1, h: 1, alt: '' }]; }),
      baseCommit: s.commit,
      uploads: [
        { path: 'public/content/images/hero/hero.bbbbbbbb.webp', blob: blob('new-hero'), slot: 'content.hero.image' },
        { path: 'public/content/images/album/a.cccccccc.webp', blob: blob('album-1'), slot: 'content.album.images[0]' },
      ],
      deletes: [{ path: HERO_OLD, slot: 'content.hero.image' }],
    });
    const published = gh.headTree();
    const strip = (t: Record<string, string>) => { const c = { ...t }; delete c[MANIFEST_PATH]; return c; };

    s = await a.loadSnapshot();
    const r1 = await a.restoreLastBackup(s.commit);
    expect(r1.restoredPublishId).toBe('pub-0');
    const t1 = gh.headTree();
    expect(t1[HERO_OLD]).toBeDefined();
    expect(t1['public/content/images/hero/hero.bbbbbbbb.webp']).toBeUndefined();
    expect(t1['public/content/images/album/a.cccccccc.webp']).toBeUndefined();
    expect(JSON.parse(gh.text('public/content/config.json')!).publish.id).toBe('pub-0');
    const m1 = JSON.parse(gh.text(MANIFEST_PATH)!);
    expect(m1).toMatchObject({ reason: 'restore', restoredPublishId: 'pub-0' });
    expect(gh.count('POST', /\/git\/blobs$/)).toBeGreaterThan(0);

    s = await a.loadSnapshot();
    gh.calls = [];
    const r2 = await a.restoreLastBackup(s.commit);
    expect(r2.restoredPublishId).toBe('pub-1');
    expect(strip(gh.headTree())).toEqual(strip(published));
    // restore chỉ upload manifest (không upload ảnh)
    expect(gh.count('POST', /\/git\/blobs$/)).toBe(1);
    expect(gh.count('POST', /\/git\/commits$/)).toBe(1);
  });

  it('chưa có bản sao lưu -> no-backup, không commit', async () => {
    const s = await a.loadSnapshot();
    const err = await a.restoreLastBackup(s.commit).catch((e) => e);
    expect(err.code).toBe('no-backup');
    expect(gh.count('POST', /\/git\/commits$/)).toBe(0);
  });
});

describe('GitHubAdapter - kết nối 3 bước + bảng lỗi (solution 2.3, 2.5)', () => {
  it('đủ ✓: token-repo, branch, write (ghi thử blob), expiry', async () => {
    const r = await a.connect();
    expect(r.steps.map((x) => [x.id, x.status])).toEqual([['token-repo', 'ok'], ['branch', 'ok'], ['write', 'ok'], ['expiry', 'ok']]);
    expect(gh.calls.some((c) => c.method === 'POST' && (c.body as { content: string }).content === 'wp-connect-check')).toBe(true);
  });
  it('Login (full=false) bỏ bước ghi thử', async () => {
    const r = await a.connect({ full: false });
    expect(r.steps.map((x) => x.id)).toEqual(['token-repo', 'branch', 'expiry']);
    expect(gh.count('POST', /\/git\/blobs$/)).toBe(0);
  });
  it('401 -> "Token không đúng…"', async () => {
    gh.overrides.push({ re: /^\/repos\/minhanh\/wedding$/, res: respond(401, { message: 'Bad credentials' }) });
    const r = await a.connect();
    expect(r.steps[0]).toMatchObject({ id: 'token-repo', status: 'error', message: MSG.unauthorized });
    expect(r.errorCode).toBe('unauthorized');
    expect(r.steps[0]!.detail).toContain('401');
  });
  it('401 khi vault biết token đã hết hạn -> "Token đã hết hạn ngày …"', async () => {
    gh.overrides.push({ re: /./, res: respond(401, {}) });
    const r = await mk({ knownExpiresAt: '2026-10-05T00:00:00+07:00', now: () => Date.parse('2026-10-07T00:00:00Z') }).connect();
    expect(r.errorCode).toBe('expired');
    expect(r.steps[0]!.message).toBe('Token đã hết hạn ngày 05/10/2026. Hãy tạo token mới.');
  });
  it('404 repo -> "Không thấy repo …"', async () => {
    const r = await mk({ repo: 'sai-ten' }).connect();
    expect(r.steps[0]!.message).toBe(MSG.notFound('minhanh', 'sai-ten'));
  });
  it('nhánh sai -> liệt kê nhánh hiện có', async () => {
    gh.branches = ['main', 'dev'];
    await gh.seed({ a: 'x' }, 'dev');
    const r = await mk({ branch: 'mian' }).connect();
    expect(r.steps[1]).toMatchObject({ id: 'branch', status: 'error', message: "Repo không có nhánh 'mian'. Các nhánh hiện có: main, dev." });
    expect(r.branches).toEqual(['main', 'dev']);
  });
  it('repo rỗng (0 nhánh) -> "Repo đang trống…"', async () => {
    gh.refs = {};
    const r = await a.connect();
    expect(r.steps[1]!.message).toBe(MSG.empty);
  });
  it('token chỉ đọc: ghi thử blob 403 / 404 -> "Token chỉ có quyền đọc…"', async () => {
    for (const status of [403, 404]) {
      gh.overrides = [{ method: 'POST', re: /\/git\/blobs$/, res: respond(status, { message: 'Resource not accessible by personal access token' }) }];
      const r = await a.connect();
      expect(r.steps[2]).toMatchObject({ id: 'write', status: 'error', message: MSG.readonly });
    }
  });
  it('409 "Git Repository is empty" khi ghi thử -> repo rỗng', async () => {
    gh.overrides.push({ method: 'POST', re: /\/git\/blobs$/, res: respond(409, { message: 'Git Repository is empty.' }) });
    const r = await a.connect();
    expect(r.steps[2]!.message).toBe(MSG.empty);
  });
  it('rate limit chính (403 + remaining 0) -> "thử lại sau khoảng n phút"', async () => {
    const now = Date.parse('2026-10-07T00:00:00Z');
    gh.overrides.push({ re: /./, res: respond(403, { message: 'API rate limit exceeded' }, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(now / 1000 + 7 * 60) }) });
    const r = await mk({ now: () => now }).connect();
    expect(r.errorCode).toBe('rate-limit');
    expect(r.steps[0]!.message).toBe('GitHub tạm giới hạn, thử lại sau khoảng 7 phút.');
  });
  it('rate limit phụ (retry-after) -> tự thử lại rồi thành công', async () => {
    gh.overrides.push({ re: /^\/repos\/minhanh\/wedding$/, once: true, res: respond(403, { message: 'secondary rate limit' }, { 'retry-after': '1' }) });
    const r = await a.connect();
    expect(r.steps[0]!.status).toBe('ok');
  });
  it('offline: fetch ném TypeError -> "Không kết nối được tới GitHub…"', async () => {
    const r = await mk({ fetch: async () => { throw new TypeError('Failed to fetch'); } }).connect();
    expect(r.errorCode).toBe('offline');
    expect(r.steps[0]!.message).toBe(MSG.offline);
  });
  it('navigator.onLine = false -> offline, không gửi request', async () => {
    const r = await mk({ isOnline: () => false }).connect();
    expect(r.errorCode).toBe('offline');
    expect(gh.calls).toHaveLength(0);
  });
  it('5xx: thử lại 1 lần rồi báo lỗi chung', async () => {
    gh.overrides.push({ re: /^\/repos\/minhanh\/wedding$/, res: respond(502, {}) });
    const r = await a.connect();
    expect(r.errorCode).toBe('server');
    expect(gh.calls.filter((c) => c.path === '/repos/minhanh/wedding')).toHaveLength(2);
  });
  it('401 giữa phiên (publish) -> StorageError unauthorized', async () => {
    const s = await a.loadSnapshot();
    gh.overrides.push({ re: /./, res: respond(401, {}) });
    const err = await a.publish({ config: cfg(), baseCommit: s.commit, uploads: [], deletes: [] }).catch((e) => e);
    expect(err.code).toBe('unauthorized');
  });
});

describe('hạn token (solution 2.6)', () => {
  it('parse header github-authentication-token-expiration', () => {
    expect(parseExpiryHeader('2027-01-12 00:00:00 +0700')).toBe('2027-01-11T17:00:00.000Z');
    expect(parseExpiryHeader('2027-01-12 00:00:00 UTC')).toBe('2027-01-12T00:00:00.000Z');
    expect(parseExpiryHeader(null)).toBeNull();
    expect(parseExpiryHeader('rác')).toBeNull();
  });
  it('cảnh báo khi hết hạn trước ngày cưới hoặc còn < 14 ngày; không cảnh báo khi ổn', () => {
    const now = Date.parse('2026-10-07T00:00:00Z');
    expect(expiryWarning('2026-12-01T00:00:00Z', '2026-12-12T11:30:00+07:00', now)).toMatch(/trước ngày cưới/);
    expect(expiryWarning('2026-10-15T00:00:00Z', null, now)).toMatch(/sắp hết hạn/);
    expect(expiryWarning('2027-01-12T00:00:00Z', '2026-12-12T11:30:00+07:00', now)).toBeNull();
    expect(expiryWarning(null, '2026-12-12', now)).toBeNull();
  });
  it('connect: hạn trước ngày cưới -> dòng expiry vàng (không chặn)', async () => {
    gh.expiration = '2026-12-01 00:00:00 +0700';
    const r = await mk({ now: () => Date.parse('2026-10-07T00:00:00Z') }).connect();
    expect(r.steps.at(-1)).toMatchObject({ id: 'expiry', status: 'warn' });
    expect(r.steps.slice(0, 3).every((x) => x.status === 'ok')).toBe(true);
  });
  it('ngày cưới = startAt sự kiện chính', () => {
    expect(weddingDateOf(cfg())).toBe('2026-12-12T11:30:00+07:00');
  });
  it('classify 404 trên thao tác ghi = thiếu quyền ghi', () => {
    const r = { status: 404, headers: new Headers() };
    expect(classify(r, '', { write: true }).code).toBe('readonly');
  });
});
