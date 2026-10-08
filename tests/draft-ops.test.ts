import { describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { mergeWithDefaults } from '../src/shared/config/merge';
import type { WeddingConfig } from '../src/shared/config/types';
import {
  afterRestore, changeTheme, customizedGroups, imageRefFromBackupConfig, previousImageEntry, redoSlot, revertAll, revertSlot,
  slotChanged, takePreviousIntoDraft,
} from '../src/admin/draft/ops';
import { History } from '../src/admin/draft/history';
import { diffConfigs } from '../src/admin/draft/diff';
import { getAt, parsePath, setAt } from '../src/admin/draft/paths';
import { hasBlocking, runChecklist } from '../src/admin/draft/checklist';
import { DraftDb } from '../src/admin/storage/draft-db';
import type { BackupManifest } from '../src/shared/storage/manifest';

const base = (): WeddingConfig => {
  const c = mergeWithDefaults({}).config;
  c.content.couple.groom.shortName = 'Minh Anh';
  c.content.couple.bride.shortName = 'Thuỳ Linh';
  c.content.hero.image = { src: 'content/images/hero/hero.11111111.webp', w: 1600, h: 2400, alt: 'Ảnh cưới' };
  c.content.album.images = [
    { src: 'content/images/album/a.22222222.webp', w: 1, h: 1, alt: 'a' },
    { src: 'content/images/album/b.33333333.webp', w: 1, h: 1, alt: 'b' },
  ];
  return c;
};
const MAN: BackupManifest = {
  schema: 1, createdAt: '2026-10-05T02:10:00Z', reason: 'publish', publishId: 'p1', restoredPublishId: null, fromCommit: 'c',
  files: [
    { path: 'public/content/config.json', backupPath: 'backup/files/public/content/config.json', existed: true },
    { path: 'public/content/images/hero/hero.00000000.webp', backupPath: 'backup/files/public/content/images/hero/hero.00000000.webp', existed: true, slot: 'content.hero.image' },
    { path: 'public/content/images/hero/hero.11111111.webp', backupPath: null, existed: false, slot: 'content.hero.image' },
    { path: 'public/content/images/album/old.44444444.webp', backupPath: 'backup/files/public/content/images/album/old.44444444.webp', existed: true, slot: 'content.album.images[0]', imageKey: '44444444' },
    { path: 'public/content/images/album/b.33333333.webp', backupPath: null, existed: false, slot: 'content.album.images[0]', imageKey: '33333333' },
  ],
};

describe('đường dẫn field', () => {
  it('parse/get/set bất biến', () => {
    expect(parsePath('content.album.images[3].alt')).toEqual(['content', 'album', 'images', 3, 'alt']);
    const c = base();
    const n = setAt(c, 'content.album.images[1].alt', 'mới');
    expect(getAt(n, 'content.album.images[1].alt')).toBe('mới');
    expect(getAt(c, 'content.album.images[1].alt')).toBe('b');
    expect(n.content.hero).toBe(c.content.hero); // nhánh không đổi giữ nguyên tham chiếu
  });
});

describe('4 thao tác quay lại (solution 3.4)', () => {
  it('1. Hoàn tác thay đổi nháp (1 slot) + [Làm lại]', () => {
    const published = base();
    let draft = setAt(published, 'content.hero.image', { src: 'content/images/hero/hero.99999999.webp', w: 1, h: 1, alt: '' });
    draft = setAt(draft, 'content.thankyou.heading', 'Cảm ơn nhiều');
    expect(slotChanged(draft, published, 'content.hero.image')).toBe(true);
    const r = revertSlot(draft, published, 'content.hero.image');
    expect(r.draft.content.hero.image).toEqual(published.content.hero.image);
    expect(r.draft.content.thankyou.heading).toBe('Cảm ơn nhiều'); // chỉ 1 slot
    const redo = redoSlot(r.draft, 'content.hero.image', r.previous);
    expect(redo.content.hero.image?.src).toBe('content/images/hero/hero.99999999.webp');
  });

  it('2. Lấy lại ảnh trước đó: chỉ khi manifest có mục existed cho slot; chỉ đổi NHÁP', () => {
    const published = base();
    const e = previousImageEntry(MAN, 'content.hero.image', published.content.hero.image!.src);
    expect(e?.path).toBe('public/content/images/hero/hero.00000000.webp');
    expect(previousImageEntry(MAN, 'content.couple.groom.photo', null)).toBeNull();
    expect(previousImageEntry(null, 'content.hero.image', null)).toBeNull();
    // album: tìm theo ảnh đang xuất bản dù thứ tự đã đổi (b đang ở index 1)
    expect(previousImageEntry(MAN, 'content.album.images[1]', 'content/images/album/b.33333333.webp')?.imageKey).toBe('44444444');
    expect(previousImageEntry(MAN, 'content.album.images[0]', 'content/images/album/a.22222222.webp')?.imageKey).toBe('44444444');
    // metadata ImageRef lấy từ config trong backup
    const backupCfg = setAt(base(), 'content.hero.image', { src: 'content/images/hero/hero.00000000.webp', w: 2000, h: 3000, alt: 'cũ', lqip: 'data:x' });
    const ref = imageRefFromBackupConfig(backupCfg, e!);
    expect(ref).toMatchObject({ src: 'content/images/hero/hero.00000000.webp', w: 2000, alt: 'cũ', lqip: 'data:x' });
    const t = takePreviousIntoDraft(published, 'content.hero.image', ref);
    expect(t.draft.content.hero.image?.src).toBe('content/images/hero/hero.00000000.webp');
    expect(published.content.hero.image?.src).toBe('content/images/hero/hero.11111111.webp'); // bản xuất bản không đổi
    // đảo ngược bằng Hoàn tác thay đổi nháp
    expect(revertSlot(t.draft, published, 'content.hero.image').draft).toEqual(published);
  });

  it('3. Hoàn tác tất cả = đúng bản đang xuất bản', () => {
    const published = base();
    let d = setAt(published, 'meta.title', 'X');
    d = changeTheme(d, 'son-do');
    expect(diffConfigs(published, d).length).toBeGreaterThan(0);
    const r = revertAll(published);
    expect(r).toEqual(published);
    expect(r).not.toBe(published);
  });

  it('4. Khôi phục: nháp đặt lại theo bản vừa khôi phục', () => {
    const restored = setAt(base(), 'meta.title', 'Bản trước');
    const r = afterRestore(restored);
    expect(r.published).toEqual(restored);
    expect(r.draft).toEqual(restored);
    expect(r.draft).not.toBe(r.published);
  });
});

describe('đổi theme (Q17)', () => {
  it('chưa chỉnh gì -> chỉ đổi preset', () => {
    const c = base();
    expect(customizedGroups(c)).toEqual([]);
    const n = changeTheme(c, 'son-do');
    expect(diffConfigs(c, n).map((x) => x.path)).toEqual(['theme.preset']);
  });
  it('đã chỉnh font: "Giữ" giữ font; "Trọn gói" về theo theme, không đụng intensity/scaleStep', () => {
    const c = base();
    c.fonts.heading = 'lora';
    c.effects.intensity = 'high';
    c.fonts.scaleStep = 1;
    expect(customizedGroups(c)).toEqual(['fonts']);
    const keep = changeTheme(c, 'dem-nhung', 'keep');
    expect(keep.fonts.heading).toBe('lora');
    const full = changeTheme(c, 'dem-nhung', 'full');
    expect(full.fonts).toMatchObject({ preset: 'theme', heading: 'theme', scaleStep: 1 });
    expect(full.effects.intensity).toBe('high');
    expect(full.theme.preset).toBe('dem-nhung');
  });
});

describe('undo/redo (50 bước, gộp gõ liên tiếp)', () => {
  it('undo/redo + giới hạn 50 + gộp cùng ô', () => {
    const h = new History<number>(50);
    for (let i = 0; i < 60; i++) h.push(i, '', i * 2000);
    expect(h.size).toBe(50);
    expect(h.undo(60)).toBe(59);
    expect(h.redo(59)).toBe(60);
    const g = new History<string>();
    g.push('a', 'title', 0); g.push('ab', 'title', 300); g.push('abc', 'title', 600);
    expect(g.size).toBe(1);
    expect(g.undo('abcd')).toBe('a');
  });
});

describe('diff dễ đọc + checklist', () => {
  it('diff có nhãn tiếng Việt', () => {
    const a = base();
    const b = setAt(a, 'content.thankyou.heading', 'Cảm ơn bạn');
    const d = diffConfigs(a, b);
    expect(d[0]!.text).toBe('Lời cảm ơn › Tiêu đề: "Trân trọng cảm ơn" thành "Cảm ơn bạn"');
    expect(diffConfigs(a, setAt(a, 'content.events.items[0].name', 'Tiệc'))[0]!.text).toMatch(/^Sự kiện › Sự kiện 1 › Tên sự kiện/);
    expect(diffConfigs(a, setAt(a, 'publish.id', 'x'))).toEqual([]);
  });
  it('lỗi nặng chặn: thiếu ngày sự kiện, chữ/nền < 4.5, URL không https, STK sai; cảnh báo nhẹ không chặn', () => {
    const ok = base();
    ok.meta.siteUrl = 'https://abc.pages.dev';
    expect(hasBlocking(runChecklist(ok))).toBe(false);
    const bad = base();
    bad.content.events.items[0]!.startAt = '';
    bad.theme.overrides = { text: '#FBF7F0' };
    bad.content.events.items[0]!.mapUrl = 'http://maps.example.com';
    bad.content.gift.bankAccounts[0]!.accountNumber = '12';
    bad.content.gift.bankAccounts[0]!.bankBin = '970436';
    const items = runChecklist(bad);
    expect(hasBlocking(items)).toBe(true);
    const errs = items.filter((i) => i.level === 'error').map((i) => i.message).join('\n');
    expect(errs).toMatch(/sự kiện chính/);
    expect(errs).toMatch(/Chữ trên nền/);
    expect(errs).toMatch(/https/);
    expect(errs).toMatch(/Số tài khoản/);
    const warn = runChecklist(setAt(ok, 'content.hero.image.alt', ''), { tokenExpiresAt: '2026-11-01T00:00:00Z', now: Date.parse('2026-10-07T00:00:00Z') });
    expect(warn.every((i) => i.level === 'warn')).toBe(true);
    expect(warn.map((i) => i.message).join('\n')).toMatch(/alt/);
    expect(warn.map((i) => i.message).join('\n')).toMatch(/trước ngày cưới/);
  });
});

describe('IndexedDB wp-admin (fake-indexeddb)', () => {
  it('draft / published / blobs + GC', async () => {
    const db = await DraftDb.open(indexedDB, `wp-admin-test-${Math.random()}`);
    const c = base();
    await db.putDraft({ config: c, baseCommit: 'abc', basePublishId: 'p', updatedAt: 'x', changeCount: 2 });
    expect((await db.getDraft())?.baseCommit).toBe('abc');
    await db.putPublished({ config: c, commit: 'abc', at: 'x' });
    expect((await db.getPublished())?.commit).toBe('abc');
    const mk = (key: string, src: string) => ({ key, blob: new Blob([key]), mime: 'image/webp', src, slot: 's', origin: 'upload' as const, createdAt: 'x' });
    await db.putBlob(mk('k1', 'content/images/a.webp'));
    await db.putBlob(mk('k2', 'content/images/b.webp'));
    expect((await db.blobBySrc('content/images/b.webp'))?.key).toBe('k2');
    expect(await db.gcBlobs(new Set(['content/images/a.webp']))).toBe(1);
    expect((await db.allBlobs()).map((b) => b.key)).toEqual(['k1']);
    await db.clearDraft();
    expect(await db.getDraft()).toBeUndefined();
    db.close();
  });
});
