/**
 * Danh sách ngân hàng phổ biến + mã BIN NAPAS (dùng cho VietQR, solution 8.6).
 * Nguồn: danh sách thành viên NAPAS công bố công khai (api.vietqr.io/v2/banks).
 * Admin (v2) chọn từ dropdown để tự điền bankBin. Cần rà lại khi có ngân hàng sáp nhập/đổi tên.
 */
export interface BankInfo { bin: string; short: string; name: string; aliases?: string[] }

export const BANKS: readonly BankInfo[] = [
  { bin: '970436', short: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', aliases: ['vcb'] },
  { bin: '970415', short: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam', aliases: ['ctg', 'icb'] },
  { bin: '970418', short: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', short: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', aliases: ['vba'] },
  { bin: '970407', short: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', aliases: ['tcb'] },
  { bin: '970422', short: 'MB', name: 'Ngân hàng TMCP Quân đội', aliases: ['mbbank', 'mb bank'] },
  { bin: '970416', short: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { bin: '970432', short: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', aliases: ['vpb'] },
  { bin: '970423', short: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong', aliases: ['tpb'] },
  { bin: '970403', short: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', aliases: ['stb'] },
  { bin: '970437', short: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM', aliases: ['hdb'] },
  { bin: '970441', short: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { bin: '970443', short: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { bin: '970431', short: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam', aliases: ['eib'] },
  { bin: '970426', short: 'MSB', name: 'Ngân hàng TMCP Hàng Hải' },
  { bin: '970448', short: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970440', short: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á', aliases: ['seab'] },
  { bin: '970449', short: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', aliases: ['lienvietpostbank', 'lpb'] },
  { bin: '970428', short: 'Nam A Bank', name: 'Ngân hàng TMCP Nam Á', aliases: ['namabank', 'nab'] },
  { bin: '970409', short: 'Bac A Bank', name: 'Ngân hàng TMCP Bắc Á', aliases: ['bacabank', 'bab'] },
  { bin: '970425', short: 'ABBANK', name: 'Ngân hàng TMCP An Bình', aliases: ['abb'] },
  { bin: '970454', short: 'BVBank', name: 'Ngân hàng TMCP Bản Việt (Timo)', aliases: ['vietcapitalbank', 'timo'] },
  { bin: '970412', short: 'PVcomBank', name: 'Ngân hàng TMCP Đại Chúng Việt Nam' },
  { bin: '970452', short: 'KienlongBank', name: 'Ngân hàng TMCP Kiên Long', aliases: ['klb'] },
  { bin: '970419', short: 'NCB', name: 'Ngân hàng TMCP Quốc Dân' },
  { bin: '970427', short: 'VietABank', name: 'Ngân hàng TMCP Việt Á', aliases: ['vab'] },
  { bin: '970438', short: 'BaoViet Bank', name: 'Ngân hàng TMCP Bảo Việt', aliases: ['bvb'] },
  { bin: '970400', short: 'SaigonBank', name: 'Ngân hàng TMCP Sài Gòn Công Thương', aliases: ['sgicb'] },
  { bin: '970433', short: 'VietBank', name: 'Ngân hàng TMCP Việt Nam Thương Tín' },
  { bin: '970430', short: 'PGBank', name: 'Ngân hàng TMCP Thịnh vượng và Phát triển' },
  { bin: '970408', short: 'GPBank', name: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu' },
  { bin: '970406', short: 'Vikki Bank', name: 'Ngân hàng TNHH MTV Số Vikki (DongA Bank cũ)', aliases: ['dongabank', 'dab'] },
  { bin: '970429', short: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
  { bin: '546034', short: 'CAKE', name: 'Ngân hàng số CAKE by VPBank', aliases: ['cake'] },
  { bin: '970424', short: 'Shinhan Bank', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam', aliases: ['shbvn', 'shinhan'] },
  { bin: '970457', short: 'Woori', name: 'Ngân hàng TNHH MTV Woori Việt Nam', aliases: ['wvn'] },
  { bin: '970458', short: 'UOB', name: 'Ngân hàng TNHH MTV United Overseas Bank (Việt Nam)' },
];

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Tìm BIN theo tên ngân hàng tự do ("Vietcombank", "MB Bank"...). Không thấy -> ''. */
export function findBankBin(name: string): string {
  const n = norm(name || '');
  if (!n) return '';
  for (const b of BANKS) {
    if (norm(b.short) === n || (b.aliases ?? []).some((a) => norm(a) === n)) return b.bin;
  }
  for (const b of BANKS) if (n.includes(norm(b.short))) return b.bin;
  return '';
}

export function bankByBin(bin: string): BankInfo | undefined {
  return BANKS.find((b) => b.bin === bin);
}
