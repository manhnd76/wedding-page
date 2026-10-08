import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildLinks, buildLink, stripDiacritics, toCsv, type LinkOptions } from '../src/admin/links/link-gen';
import { guestNameFromUrl } from '../src/shared/guest-name';
import { DEFAULT_CONFIG } from '../src/shared/config/defaults';
import {
  SLOT_SPECS, centerCrop, checkAudio, fitWithin, hashedImagePath, outputSize, qualitySteps, safeBase,
} from '../src/admin/media/image-pipeline';
import { sha256Hex, gitBlobSha, utf8 } from '../src/shared/storage/bytes';
import { parseImport } from '../src/admin/editor/routes/backup';
import { normalizeConfig } from '../src/admin/state/store';
import { zip, unzip, crc32 } from '../src/admin/storage/zip';
import { buildPublishZip } from '../src/admin/storage/local-adapters';
import { devPublish, devRestore, scanTree, treeCommit } from '../scripts/vite-plugins/dev-admin-save';

const G = DEFAULT_CONFIG.guest;
const O: LinkOptions = { base: 'https://wedpage.com/', style: 'keep', encode: false, mode: 'query', queryParam: 'to', pathPrefix: 'invite' };

describe('link generator (design 8.9)', () => {
  it('giữ dấu: link Unicode thô dễ đọc, tên trên thiệp đúng', () => {
    const r = buildLink('Gia đình anh Mạnh', O, G);
    expect(r.readable).toBe('https://wedpage.com/?to=Gia-đình-anh-Mạnh');
    expect(r.link).toBe(r.readable);
    expect(r.display).toBe('Gia đình anh Mạnh');
  });
  it('mã hoá link: Chép dùng percent-encode; bảng vẫn hiển thị dạng dễ đọc; 2 dạng cho cùng tên', () => {
    const r = buildLink('Gia đình anh Mạnh', { ...O, encode: true }, G);
    expect(r.link).toBe('https://wedpage.com/?to=Gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh');
    expect(r.readable).toBe('https://wedpage.com/?to=Gia-đình-anh-Mạnh');
    const a = guestNameFromUrl(new URL(r.link), G).display;
    const b = guestNameFromUrl(new URL(r.readable), G).display;
    expect(a).toBe('Gia đình anh Mạnh');
    expect(b).toBe(a);
  });
  it('gạch nối thật giữ được (--), không dấu, dạng /invite/', () => {
    expect(buildLink('Lê-Nguyễn Hà', O, G).display).toBe('Lê-Nguyễn Hà');
    expect(stripDiacritics('Đặng Hữu Phước')).toBe('Dang Huu Phuoc');
    expect(buildLink('Đặng Hữu Phước', { ...O, style: 'ascii' }, G).readable).toBe('https://wedpage.com/?to=Dang-Huu-Phuoc');
    const p = buildLink('Chị Hường', { ...O, mode: 'path', encode: true }, G);
    expect(p.link).toBe('https://wedpage.com/invite/Ch%E1%BB%8B-H%C6%B0%E1%BB%9Dng');
    expect(guestNameFromUrl(new URL(p.link), G).display).toBe('Chị Hường');
  });
  it('NFD từ macOS -> NFC; cảnh báo trùng tên; CSV luôn có link_ma_hoa', () => {
    const rows = buildLinks('Thuỳ Linh\n\nThuỳ Linh'.normalize('NFD') + '\nBạn Tuấn (lớp 12A)', O, G);
    expect(rows).toHaveLength(3);
    expect(rows[0]!.slug).toBe('Thuỳ-Linh'.normalize('NFC'));
    expect(rows.filter((r) => r.duplicate)).toHaveLength(2);
    const csv = toCsv(rows);
    expect(csv.startsWith('﻿ten_khach,ten_hien_thi,link,link_ma_hoa\r\n')).toBe(true);
    expect(csv).toContain('Bạn Tuấn (lớp 12A),Bạn Tuấn (lớp 12A),https://wedpage.com/?to=Bạn-Tuấn-(lớp-12A),https://wedpage.com/?to=B%E1%BA%A1n-Tu%E1%BA%A5n-(l%E1%BB%9Bp-12A)');
  });
});

describe('pipeline ảnh (kích thước, hash tên)', () => {
  it('cạnh dài theo slot: hero/cover 2000, album 1600 + thumb 600, chân dung 1200, OG 1200×630 JPEG', () => {
    expect(SLOT_SPECS.hero.maxEdge).toBe(2000);
    expect(SLOT_SPECS.cover.maxEdge).toBe(2000);
    expect(SLOT_SPECS.album).toMatchObject({ maxEdge: 1600, thumbEdge: 600 });
    expect(SLOT_SPECS.portrait.maxEdge).toBe(1200);
    expect(SLOT_SPECS.og).toMatchObject({ format: 'jpeg', exact: { w: 1200, h: 630 } });
    expect(fitWithin(4000, 3000, 1600)).toEqual({ w: 1600, h: 1200 });
    expect(fitWithin(3000, 4500, 2000)).toEqual({ w: 1333, h: 2000 });
    expect(fitWithin(800, 600, 1600)).toEqual({ w: 800, h: 600 }); // không phóng to
    expect(outputSize({ x: 0, y: 0, w: 3000, h: 1575 }, SLOT_SPECS.og)).toEqual({ w: 1200, h: 630 });
  });
  it('crop căn giữa theo tỉ lệ slot', () => {
    expect(centerCrop(4000, 3000, 9 / 16)).toEqual({ x: 1156, y: 0, w: 1688, h: 3000 });
    expect(centerCrop(3000, 4000, 3 / 2)).toEqual({ x: 0, y: 1000, w: 3000, h: 2000 });
    expect(centerCrop(10, 20, null)).toEqual({ x: 0, y: 0, w: 10, h: 20 });
  });
  it('tên file có hash8 = SHA-256 của bytes; đổi nội dung -> đổi tên', async () => {
    const b1 = utf8('ảnh 1');
    const r = await hashedImagePath(b1, 'hero', safeBase('Ảnh Cưới Đẹp.JPG'), 'webp');
    expect(r.path).toBe(`content/images/hero/anh-cuoi-dep.${(await sha256Hex(b1)).slice(0, 8)}.webp`);
    expect(r.path).toMatch(/^content\/images\/hero\/anh-cuoi-dep\.[0-9a-f]{8}\.webp$/);
    expect((await hashedImagePath(utf8('ảnh 2'), 'hero', 'x', 'webp')).hash).not.toBe(r.hash);
    expect(qualitySteps('webp')).toEqual([0.82, 0.74, 0.66, 0.58]); // q0.82, giảm tối đa 3 lần
    expect(qualitySteps('jpeg')[0]).toBe(0.85);
  });
  it('git blob sha khớp git (để không upload lại blob đã có)', async () => {
    expect(await gitBlobSha(utf8('hello\n'))).toBe('ce013625030ba8dba906f756967f9e9ca394464a');
  });
  it('nhạc: mp3/m4a ≤ 8MB, cảnh báo > 5MB', () => {
    expect(checkAudio({ name: 'a.mp3', type: 'audio/mpeg', size: 3e6 })).toEqual({ ok: true, ext: 'mp3' });
    expect(checkAudio({ name: 'a.m4a', type: '', size: 6e6 }).warning).toMatch(/khá nặng/);
    expect(checkAudio({ name: 'a.mp3', type: 'audio/mpeg', size: 9 * 1024 * 1024 }).ok).toBe(false);
    expect(checkAudio({ name: 'a.wav', type: 'audio/wav', size: 1 }).ok).toBe(false);
  });
});

describe('import / migrate config', () => {
  it('nhập config.js cũ (wedding-site v0) -> migrate + merge, schema v1', () => {
    const text = readFileSync(path.join(__dirname, 'fixtures', 'wedding-site-config.js'), 'utf8');
    const raw = parseImport('config.js', text);
    const n = normalizeConfig(raw);
    expect(n.config.schemaVersion).toBe(1);
    expect(n.config.content.couple.groom.fullName.length).toBeGreaterThan(0);
  });
  it('nhập .json v1 giữ dữ liệu; giá trị sai -> mặc định + ghi chú', () => {
    const raw = parseImport('cfg.json', JSON.stringify({ schemaVersion: 1, meta: { title: 'Tiêu đề' }, effects: { intensity: 'cực mạnh' } }));
    const n = normalizeConfig(raw);
    expect(n.config.meta.title).toBe('Tiêu đề');
    expect(n.config.effects.intensity).toBe('medium');
    expect(n.warnings.join('\n')).toMatch(/intensity/);
  });
  it('JSON hỏng -> ném lỗi (UI báo "Không đọc được file")', () => {
    expect(() => parseImport('x.json', '{hỏng')).toThrow();
  });
});

describe('zip + DownloadAdapter + dev-admin-save', () => {
  it('zip STORE đọc lại được, CRC đúng', async () => {
    expect(crc32(utf8('123456789')).toString(16)).toBe('cbf43926');
    const z = zip([{ path: 'public/content/config.json', data: utf8('{"a":1}') }, { path: 'thư mục/ảnh.webp', data: new Uint8Array([1, 2, 3]) }]);
    const back = unzip(z);
    expect(back.map((e) => e.path)).toEqual(['public/content/config.json', 'thư mục/ảnh.webp']);
    expect([...back[1]!.data]).toEqual([1, 2, 3]);
    const c = { ...DEFAULT_CONFIG, publish: { id: 'p', at: '' } };
    const pz = unzip(await buildPublishZip({ config: c, uploads: [{ path: 'public/content/images/a.webp', blob: new Blob([new Uint8Array([9])]) }], deletes: [{ path: 'public/content/images/old.webp' }], baseCommit: 'local' }));
    expect(pz.map((e) => e.path)).toEqual(['public/content/config.json', 'public/content/images/a.webp', 'HUONG-DAN.txt']);
    expect(new TextDecoder().decode(pz[2]!.data)).toContain('public/content/images/old.webp');
  });

  it('dev-admin-save: publish ghi file + backup; restore 2 lần = ban đầu; base cũ -> 409', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'wp-dev-'));
    try {
      mkdirSync(path.join(root, 'public/content/images/hero'), { recursive: true });
      writeFileSync(path.join(root, 'public/content/config.json'), JSON.stringify({ publish: { id: 'p0' } }));
      writeFileSync(path.join(root, 'public/content/images/hero/h.11111111.webp'), 'old');
      const t0 = scanTree(root);
      const r = devPublish(root, {
        baseCommit: treeCommit(t0), config: { publish: { id: 'p1' } },
        uploads: [{ path: 'public/content/images/hero/h.22222222.webp', base64: Buffer.from('new').toString('base64'), slot: 'content.hero.image' }],
        deletes: [{ path: 'public/content/images/hero/h.11111111.webp', slot: 'content.hero.image' }],
      });
      expect(existsSync(path.join(root, 'backup/files/public/content/images/hero/h.11111111.webp'))).toBe(true);
      expect(existsSync(path.join(root, 'public/content/images/hero/h.11111111.webp'))).toBe(false);
      expect(r.publishId).toBe('p1');
      const t1 = scanTree(root);
      expect(() => devPublish(root, { baseCommit: treeCommit(t0), config: { publish: { id: 'x' } }, uploads: [], deletes: [] })).toThrow(/xuất bản từ nơi khác/);
      expect(() => devPublish(root, { baseCommit: '', config: { publish: { id: 'x' } }, uploads: [{ path: '../../etc/passwd', base64: 'AA==' }], deletes: [] })).toThrow(/không hợp lệ/);
      const r1 = devRestore(root, treeCommit(scanTree(root)));
      expect(r1.restoredPublishId).toBe('p0');
      expect(readFileSync(path.join(root, 'public/content/images/hero/h.11111111.webp'), 'utf8')).toBe('old');
      devRestore(root, treeCommit(scanTree(root)));
      const strip = (t: Record<string, string>) => { const c = { ...t }; delete c['backup/manifest.json']; return c; };
      expect(strip(scanTree(root))).toEqual(strip(t1));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
