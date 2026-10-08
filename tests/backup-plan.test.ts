import { describe, expect, it } from 'vitest';
import { MANIFEST_PATH, applyChanges, parseManifest, planPublish, planRestore, type TreeMap } from '../src/shared/storage/manifest';
import { collectAssetRefs, diffAssets } from '../src/shared/storage/asset-refs';
import { mergeWithDefaults } from '../src/shared/config/merge';

const T0: TreeMap = {
  'public/content/config.json': 'cfg0',
  'public/content/images/hero/hero.11111111.webp': 'h1',
  'public/content/images/album/a.22222222.webp': 'a1',
  'public/content/images/album/b.33333333.webp': 'b1',
  'public/content/audio/song.44444444.mp3': 'm1',
  'index.html': 'idx',
};
const meta = { createdAt: '2026-10-07T03:15:00Z', fromCommit: 'c0' };

function publish(tree: TreeMap, files: { path: string; sha: string; slot?: string }[], deletes: { path: string; slot?: string }[], id: string) {
  const p = planPublish({ tree, files, deletes, publishId: id, backupPublishId: 'prev', ...meta });
  return { tree: applyChanges(tree, [...p.changes, { path: MANIFEST_PATH, sha: `man-${id}` }]), manifest: p.manifest, changes: p.changes };
}
function restore(tree: TreeMap, manifest: ReturnType<typeof publish>['manifest'], id = 'r') {
  const p = planRestore({ tree, manifest, restoredPublishId: 'old', currentPublishId: 'cur', ...meta });
  return { tree: applyChanges(tree, [...p.changes, { path: MANIFEST_PATH, sha: `man-${id}` }]), manifest: p.manifest };
}
const noMan = (t: TreeMap) => { const c = { ...t }; delete c[MANIFEST_PATH]; return c; };

describe('planPublish (solution 3.3/3.5)', () => {
  it('thay ảnh hero + xoá ảnh album + thêm ảnh mới: backup đúng, manifest đúng existed/slot/imageKey', () => {
    const r = publish(T0, [
      { path: 'public/content/config.json', sha: 'cfg1' },
      { path: 'public/content/images/hero/hero.55555555.webp', sha: 'h2', slot: 'content.hero.image' },
      { path: 'public/content/images/album/c.66666666.webp', sha: 'c1', slot: 'content.album.images[1]' },
    ], [
      { path: 'public/content/images/hero/hero.11111111.webp', slot: 'content.hero.image' },
      { path: 'public/content/images/album/b.33333333.webp', slot: 'content.album.images[1]' },
    ], 'p1');
    expect(r.tree['backup/files/public/content/config.json']).toBe('cfg0');
    expect(r.tree['backup/files/public/content/images/hero/hero.11111111.webp']).toBe('h1');
    expect(r.tree['public/content/images/hero/hero.11111111.webp']).toBeUndefined();
    expect(r.tree['public/content/images/album/a.22222222.webp']).toBe('a1'); // không đổi
    expect(r.manifest.files).toEqual(expect.arrayContaining([
      { path: 'public/content/config.json', backupPath: 'backup/files/public/content/config.json', existed: true },
      { path: 'public/content/images/hero/hero.55555555.webp', backupPath: null, existed: false, slot: 'content.hero.image' },
      { path: 'public/content/images/album/b.33333333.webp', backupPath: 'backup/files/public/content/images/album/b.33333333.webp', existed: true, slot: 'content.album.images[1]', imageKey: '33333333' },
    ]));
    expect(r.manifest).toMatchObject({ schema: 1, reason: 'publish', publishId: 'p1', restoredPublishId: null });
  });

  it('chỉ giữ 1 bản: publish lần 2 xoá backup/files cũ không còn tham chiếu', () => {
    const r1 = publish(T0, [{ path: 'public/content/config.json', sha: 'cfg1' }], [{ path: 'public/content/audio/song.44444444.mp3', slot: 'music.src' }], 'p1');
    expect(r1.tree['backup/files/public/content/audio/song.44444444.mp3']).toBe('m1');
    const r2 = publish(r1.tree, [{ path: 'public/content/config.json', sha: 'cfg2' }], [], 'p2');
    expect(r2.tree['backup/files/public/content/audio/song.44444444.mp3']).toBeUndefined();
    expect(r2.tree['backup/files/public/content/config.json']).toBe('cfg1');
    expect(Object.keys(r2.tree).filter((k) => k.startsWith('backup/files/'))).toEqual(['backup/files/public/content/config.json']);
  });

  it('file không đổi sha -> không có trong manifest/thay đổi', () => {
    const r = publish(T0, [{ path: 'public/content/config.json', sha: 'cfg0' }], [], 'p');
    expect(r.manifest.files).toEqual([]);
  });
});

describe('planRestore = swap: restore 2 lần liên tiếp = tree ban đầu', () => {
  const cases: [string, () => ReturnType<typeof publish>][] = [
    ['thay + xoá + thêm', () => publish(T0, [
      { path: 'public/content/config.json', sha: 'cfg1' },
      { path: 'public/content/images/hero/hero.55555555.webp', sha: 'h2', slot: 'content.hero.image' },
      { path: 'public/content/images/album/c.66666666.webp', sha: 'c1', slot: 'content.album.images[2]' },
    ], [{ path: 'public/content/images/hero/hero.11111111.webp', slot: 'content.hero.image' }, { path: 'public/content/audio/song.44444444.mp3' }], 'p1')],
    ['chỉ config', () => publish(T0, [{ path: 'public/content/config.json', sha: 'cfg1' }], [], 'p1')],
    ['ghi đè cùng đường dẫn', () => publish(T0, [{ path: 'public/content/images/album/a.22222222.webp', sha: 'a-new' }, { path: 'public/content/config.json', sha: 'cfg1' }], [], 'p1')],
  ];
  for (const [name, mk] of cases) {
    it(name, () => {
      const pub = mk();
      const r1 = restore(pub.tree, pub.manifest, 'r1');
      // sau restore 1: nội dung public/ = trạng thái trước publish
      for (const [k, v] of Object.entries(T0)) expect(r1.tree[k]).toBe(v);
      for (const k of Object.keys(r1.tree)) if (k.startsWith('public/')) expect(T0[k]).toBe(r1.tree[k]);
      const r2 = restore(r1.tree, r1.manifest, 'r2');
      expect(noMan(r2.tree)).toEqual(noMan(pub.tree));
      // restore lần 3 = như sau restore 1 (redo/undo luân phiên)
      expect(noMan(restore(r2.tree, r2.manifest).tree)).toEqual(noMan(r1.tree));
    });
  }
  it('manifest restore: reason, restoredPublishId, slot giữ nguyên', () => {
    const pub = cases[0]![1]();
    const r1 = restore(pub.tree, pub.manifest);
    expect(r1.manifest).toMatchObject({ reason: 'restore', publishId: 'old', restoredPublishId: 'old', backupPublishId: 'cur' });
    expect(r1.manifest.files.find((f) => f.path.endsWith('hero.55555555.webp'))).toMatchObject({ existed: true, slot: 'content.hero.image' });
    expect(r1.manifest.files.find((f) => f.path.endsWith('hero.11111111.webp'))).toMatchObject({ existed: false, backupPath: null });
  });
  it('parseManifest bỏ dữ liệu hỏng', () => {
    expect(parseManifest(null)).toBeNull();
    expect(parseManifest({ schema: 2, files: [] })).toBeNull();
    expect(parseManifest({ schema: 1, files: [{ path: 'x', existed: true }, { bad: 1 }] })?.files).toHaveLength(1);
  });
});

describe('asset refs trong config', () => {
  it('thu ImageRef (src + thumb) + nhạc kèm slot; chỉ file trong content/', () => {
    const c = mergeWithDefaults({}).config;
    c.content.hero.image = { src: 'content/images/hero/h.11111111.webp', w: 1, h: 1, alt: '' };
    c.content.album.images = [{ src: 'content/images/album/a.22222222.webp', thumb: 'content/images/album/a-thumb.33333333.webp', w: 1, h: 1, alt: '' }];
    c.music.src = 'content/audio/s.44444444.mp3';
    c.meta.ogImage = { src: 'https://cdn.example.com/og.jpg', w: 1, h: 1, alt: '' };
    const refs = collectAssetRefs(c);
    expect(refs).toEqual(expect.arrayContaining([
      { src: 'content/images/hero/h.11111111.webp', slot: 'content.hero.image', kind: 'image' },
      { src: 'content/images/album/a-thumb.33333333.webp', slot: 'content.album.images[0]', kind: 'thumb' },
      { src: 'content/audio/s.44444444.mp3', slot: 'music.src', kind: 'audio' },
    ]));
    expect(refs.some((r) => r.src.startsWith('https'))).toBe(false);
    const d = mergeWithDefaults({}).config;
    d.content.hero.image = { src: 'content/images/hero/h.99999999.webp', w: 1, h: 1, alt: '' };
    d.music.src = c.music.src;
    const diff = diffAssets(c, d);
    expect(diff.added.map((x) => x.src)).toEqual(['content/images/hero/h.99999999.webp']);
    expect(diff.removed.map((x) => x.src).sort()).toEqual(['content/images/album/a-thumb.33333333.webp', 'content/images/album/a.22222222.webp', 'content/images/hero/h.11111111.webp']);
  });
});
