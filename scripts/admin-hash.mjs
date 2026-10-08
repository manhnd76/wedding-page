/**
 * In ra hash mật khẩu trang quản lý (PBKDF2-HMAC-SHA-256, salt ngẫu nhiên 16 byte) để dán vào
 * `ADMIN_PASSWORD_HASH` trong `src/admin/auth/password.ts`. Mật khẩu dạng rõ KHÔNG được ghi vào repo.
 *
 *   npm run admin:hash -- "<mật khẩu mới>"
 *   (không muốn lưu vào lịch sử lệnh: đặt biến môi trường WP_ADMIN_PASSWORD, hoặc `npm run admin:hash -- --stdin`
 *    rồi gõ mật khẩu + Enter)
 *
 * Định dạng: pbkdf2-sha256$<vòng lặp>$<salt base64>$<hash base64 32 byte>
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const ITER = 600_000;

export function hashPassword(password, salt = randomBytes(16), iter = ITER) {
  const dk = pbkdf2Sync(Buffer.from(password.normalize('NFC'), 'utf8'), salt, iter, 32, 'sha256');
  return `pbkdf2-sha256$${iter}$${Buffer.from(salt).toString('base64')}$${dk.toString('base64')}`;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const arg = process.argv[2];
  const pw = arg === '--stdin' ? readFileSync(0, 'utf8').split(/\r?\n/)[0] ?? '' : arg ?? process.env.WP_ADMIN_PASSWORD ?? '';
  if (!pw) {
    console.error('Cách dùng: npm run admin:hash -- "<mật khẩu mới>"');
    process.exit(1);
  }
  if ([...pw].length < 12) console.error('Cảnh báo: mật khẩu ngắn (< 12 ký tự). Hash nằm công khai trong bundle nên có thể bị dò; token "Ghi nhớ" yếu theo.');
  console.log(hashPassword(pw));
}
