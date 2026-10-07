import { describe, expect, it } from 'vitest';
import { buildVietQrPayload, crc16, groupAccount, tlv, toAsciiMessage, validateVietQr, verifyCrc } from '@shared/vietqr/payload';
import { BANKS, findBankBin } from '@shared/vietqr/banks';

/** Tách TLV một tầng. */
function parse(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < s.length) {
    const id = s.slice(i, i + 2);
    const len = Number(s.slice(i + 2, i + 4));
    out[id] = s.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

describe('CRC16-CCITT-FALSE', () => {
  it('giá trị kiểm chuẩn "123456789" = 29B1', () => expect(crc16('123456789')).toBe('29B1'));
  it('chuỗi rỗng = FFFF', () => expect(crc16('')).toBe('FFFF'));
  it('mẫu EMVCo: payload có CRC hợp lệ được verify', () => {
    const body = '00020101021138570010A000000727012700069704360113012345678900208QRIBFTTA53037045802VN6304';
    expect(verifyCrc(body + crc16(body))).toBe(true);
    expect(verifyCrc(body + '0000')).toBe(crc16(body) === '0000');
  });
});

describe('VietQR payload (NAPAS QRIBFTTA)', () => {
  const p = buildVietQrPayload({ bankBin: '970436', accountNumber: '0123456789' });
  it('đúng cấu trúc', () => {
    const top = parse(p);
    expect(top['00']).toBe('01');
    expect(top['01']).toBe('11'); // QR tĩnh
    expect(top['53']).toBe('704');
    expect(top['58']).toBe('VN');
    const mai = parse(top['38']!);
    expect(mai['00']).toBe('A000000727');
    expect(mai['02']).toBe('QRIBFTTA');
    expect(parse(mai['01']!)).toEqual({ '00': '970436', '01': '0123456789' });
    expect(p.slice(-8, -4)).toBe('6304');
  });
  it('chuỗi khớp mẫu tham chiếu tính tay (thứ tự trường + độ dài)', () => {
    expect(p.slice(0, -4)).toBe('00020101021138540010A00000072701240006970436011001234567890208QRIBFTTA53037045802VN6304');
    expect(verifyCrc(p)).toBe(true);
  });
  it('có số tiền -> QR động (12) + trường 54; có nội dung -> 62/08 ASCII', () => {
    const q = buildVietQrPayload({ bankBin: '970407', accountNumber: '9876543210', amount: 500000, message: 'Mừng cưới Minh Anh & Thuỳ Linh' });
    const top = parse(q);
    expect(top['01']).toBe('12');
    expect(top['54']).toBe('500000');
    expect(parse(top['62']!)['08']).toBe('Mung cuoi Minh Anh & Thuy Linh');
    expect(verifyCrc(q)).toBe(true);
  });
  it('validate', () => {
    expect(validateVietQr({ bankBin: '97043', accountNumber: '123456' })).toMatch(/BIN/);
    expect(validateVietQr({ bankBin: '970436', accountNumber: '12' })).toMatch(/tài khoản/);
    expect(validateVietQr({ bankBin: '970436', accountNumber: '0123456789', amount: -1 })).toMatch(/tiền/);
    expect(() => buildVietQrPayload({ bankBin: 'x', accountNumber: '1' })).toThrow();
  });
  it('tlv kiểm độ dài', () => {
    expect(tlv('59', 'ABC')).toBe('5903ABC');
    expect(() => tlv('59', 'x'.repeat(100))).toThrow();
  });
  it('ascii + nhóm số', () => {
    expect(toAsciiMessage('Đặng Hữu Phước')).toBe('Dang Huu Phuoc');
    expect(groupAccount('0123456789')).toBe('012 345 678 9');
  });
  it('bảng ngân hàng: BIN 6 số, không trùng; tìm theo tên tự do', () => {
    expect(BANKS.every((b) => /^\d{6}$/.test(b.bin))).toBe(true);
    expect(new Set(BANKS.map((b) => b.bin)).size).toBe(BANKS.length);
    expect(findBankBin('Vietcombank')).toBe('970436');
    expect(findBankBin('MB Bank')).toBe('970422');
    expect(findBankBin('techcombank')).toBe('970407');
    expect(findBankBin('Ngân hàng lạ')).toBe('');
  });
});
