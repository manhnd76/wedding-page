/**
 * VietQR (EMVCo Merchant-Presented QR, chuẩn NAPAS 247) sinh phía client - solution 8.6.
 * Cấu trúc: ID(2) + LEN(2) + VALUE. CRC16-CCITT-FALSE (poly 0x1021, init 0xFFFF) trên toàn chuỗi kể cả "6304".
 */

export const NAPAS_GUID = 'A000000727';
export const SERVICE_TO_ACCOUNT = 'QRIBFTTA';
export const SERVICE_TO_CARD = 'QRIBFTTC';

export function tlv(id: string, value: string): string {
  if (!/^\d{2}$/.test(id)) throw new Error(`ID không hợp lệ: ${id}`);
  const len = value.length;
  if (len > 99) throw new Error(`Giá trị trường ${id} dài quá 99 ký tự`);
  return id + String(len).padStart(2, '0') + value;
}

/** CRC-16/CCITT-FALSE. Giá trị kiểm chuẩn: crc16("123456789") = 0x29B1. */
export function crc16(input: string): string {
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(input);
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface VietQrInput {
  bankBin: string;
  accountNumber: string;
  /** số tiền VND (số nguyên). Không có -> QR tĩnh, khách tự nhập tiền. */
  amount?: number;
  /** nội dung chuyển khoản (chỉ ASCII không dấu để mọi app đọc được). */
  message?: string;
  service?: typeof SERVICE_TO_ACCOUNT | typeof SERVICE_TO_CARD;
}

/** Bỏ dấu tiếng Việt + ký tự ngoài ASCII in được (nội dung CK). */
export function toAsciiMessage(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

export function validateVietQr(i: VietQrInput): string | null {
  if (!/^\d{6}$/.test(i.bankBin)) return 'Mã BIN ngân hàng phải gồm 6 chữ số';
  if (!/^[0-9A-Za-z]{4,19}$/.test(i.accountNumber)) return 'Số tài khoản không hợp lệ';
  if (i.amount !== undefined && (!Number.isInteger(i.amount) || i.amount <= 0 || i.amount > 9_999_999_999)) return 'Số tiền không hợp lệ';
  return null;
}

export function buildVietQrPayload(i: VietQrInput): string {
  const err = validateVietQr(i);
  if (err) throw new Error(err);
  const beneficiary = tlv('00', i.bankBin) + tlv('01', i.accountNumber);
  const merchantInfo = tlv('00', NAPAS_GUID) + tlv('01', beneficiary) + tlv('02', i.service ?? SERVICE_TO_ACCOUNT);
  let s = tlv('00', '01') + tlv('01', i.amount ? '12' : '11') + tlv('38', merchantInfo) + tlv('53', '704');
  if (i.amount) s += tlv('54', String(i.amount));
  s += tlv('58', 'VN');
  const msg = i.message ? toAsciiMessage(i.message) : '';
  if (msg) s += tlv('62', tlv('08', msg));
  s += '6304';
  return s + crc16(s);
}

/** Kiểm CRC của payload bất kỳ (dùng cho test/admin). */
export function verifyCrc(payload: string): boolean {
  if (payload.length < 8 || payload.slice(-8, -4) !== '6304') return false;
  return crc16(payload.slice(0, -4)) === payload.slice(-4).toUpperCase();
}

/** Nhóm số tài khoản 3 chữ số cho dễ đọc. */
export function groupAccount(acc: string): string {
  return acc.replace(/\s+/g, '').replace(/(.{3})(?=.)/g, '$1 ');
}
