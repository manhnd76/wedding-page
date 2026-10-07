import { describe, expect, it } from 'vitest';
import { extractGuestSlug, fillGuest, graphemes, guestNameFromUrl, nameToSlug, slugToName } from '@shared/guest-name';
import { DEFAULT_CONFIG } from '@shared/config/defaults';

const opts = DEFAULT_CONFIG.guest;
const fromQuery = (q: string) => guestNameFromUrl(new URL(`https://x.pages.dev/?to=${q}`), opts).display;

describe('guest-name (solution 8.2)', () => {
  it('ví dụ chuẩn: ?to=gia-đình-anh-Mạnh -> "Gia đình anh Mạnh"', () => {
    expect(fromQuery('gia-đình-anh-Mạnh')).toBe('Gia đình anh Mạnh');
  });
  it('link percent-encode cho kết quả giống link Unicode thô', () => {
    expect(fromQuery(encodeURIComponent('gia-đình-anh-Mạnh'))).toBe('Gia đình anh Mạnh');
  });
  it('"--" giữ gạch thật', () => {
    expect(fromQuery('Lê--Nguyễn-Hà')).toBe('Lê-Nguyễn Hà');
  });
  it('chặn ký tự HTML: ?to=<script> -> "Script"', () => {
    expect(fromQuery('<script>')).toBe('Script');
    expect(fromQuery(encodeURIComponent('<img src=x onerror=alert(1)>'))).toBe('Img srcx onerroralert(1)');
  });
  it('rỗng -> fallback "Quý khách"', () => {
    expect(fromQuery('')).toBe('Quý khách');
    expect(guestNameFromUrl(new URL('https://x/'), opts).display).toBe('Quý khách');
    expect(fromQuery('---')).toBe('Quý khách');
  });
  it('dấu + và _ thành khoảng trắng, gộp khoảng trắng', () => {
    expect(fromQuery('anh+chị__Lan')).toBe('Anh chị Lan');
    expect(slugToName('  bạn   Hùng  ')).toBe('Bạn Hùng');
  });
  it('NFD (macOS/iOS) được chuẩn hoá NFC', () => {
    const nfd = 'Nguyễn Thuỳ Linh'.normalize('NFD');
    const out = slugToName(nfd);
    expect(out).toBe('Nguyễn Thuỳ Linh'.normalize('NFC'));
    expect(out.normalize('NFC')).toBe(out);
  });
  it('loại zero-width và ký tự điều khiển', () => {
    expect(slugToName('Lan​‍Anh\u0007')).toBe('LanAnh');
  });
  it('chỉ viết hoa ký tự đầu (kể cả chữ có dấu)', () => {
    expect(slugToName('đặng hữu phước')).toBe('Đặng hữu phước');
    expect(slugToName('ầẫ')).toBe('Ầẫ');
  });
  it('cắt tối đa 60 grapheme + "…", không tách dấu', () => {
    const long = 'Ngọc '.repeat(20);
    const out = slugToName(long, 60);
    expect(out.endsWith('…')).toBe(true);
    expect(graphemes(out.slice(0, -1)).length).toBeLessThanOrEqual(60);
    const nfdLong = 'ệ'.normalize('NFD').repeat(70);
    const o2 = slugToName(nfdLong, 10);
    expect(o2).toBe('Ệ' + 'ệ'.repeat(9) + '…');
  });
  it('path /invite/<slug> ưu tiên hơn query', () => {
    const u = new URL('https://x/invite/c%C3%B4-Hoa?to=anh-Nam');
    expect(extractGuestSlug(u, opts)).toBe('cô-Hoa');
    expect(guestNameFromUrl(u, opts).display).toBe('Cô Hoa');
  });
  it('path decode lỗi -> không crash', () => {
    const u = new URL('https://x/invite/%E0%A4%A?to=anh-Nam');
    expect(() => guestNameFromUrl(u, opts)).not.toThrow();
  });
  it('fromUrl=false -> luôn fallback', () => {
    expect(guestNameFromUrl(new URL('https://x/?to=anh-Nam'), { ...opts, fromUrl: false }).display).toBe('Quý khách');
  });
  it('template + {guest} thay chuỗi thuần', () => {
    const r = guestNameFromUrl(new URL('https://x/?to=anh-Nam'), { ...opts, template: 'Thân gửi {name}' });
    expect(r.display).toBe('Thân gửi Anh Nam');
    expect(fillGuest('Trân trọng kính mời {guest} tới dự', '$& {guest}')).toBe('Trân trọng kính mời $& {guest} tới dự');
  });
  it('queryParam tuỳ chỉnh', () => {
    expect(guestNameFromUrl(new URL('https://x/?khach=chi-Mai'), { ...opts, queryParam: 'khach' }).display).toBe('Chi Mai');
  });
  it('nameToSlug -> slugToName khứ hồi', () => {
    for (const n of ['Gia đình anh Mạnh', 'Lê-Nguyễn Hà', 'Cô chú Tư']) {
      expect(slugToName(nameToSlug(n))).toBe(n.charAt(0).toUpperCase() + n.slice(1));
    }
  });
});
