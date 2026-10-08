# Decisions - Cổng 1 (2026-10-07)

## Người duyệt chọn trực tiếp
1. Lưu trữ + hosting: **Phương án A - GitHub (repo private) + Cloudflare Pages**, kèm chế độ local (B) làm phụ.
2. RSVP + Guestbook: **Google Sheet + Apps Script**.
3. Phong cách mặc định: **Trầm Vàng + phong bì mở nắp**; font mặc định Playfair Display + Great Vibes + Be Vietnam Pro.
4. Mức animation mặc định: **Vừa**.

## Giả định mặc định (đã trình bày, người duyệt không yêu cầu đổi)
- Dùng cá nhân, 1 cặp đôi/site, chỉ tiếng Việt.
- Login admin: GitHub fine-grained token, tuỳ chọn lưu mã hoá bằng passphrase.
- Domain: `*.pages.dev` trước, domain riêng sau.
- Link khách: `?to=` chính, `/invite/<slug>` phụ; giữ dấu tiếng Việt.
- Không lưu danh sách khách lên server (local + CSV).
- Không theme tối ở bản đầu.
- Màn phong bì hiện mỗi lần mở link.
- QR mừng cưới: có (VietQR), chỉ hiện khi bấm; có thêm vào lịch, chỉ đường.
- Love story: có, mặc định tắt.
- Tự cuộn / lời chúc bay / footer vendor: tắt.
- Hero ghim đầu, footer ghim cuối.
- Bản đồ: bấm mới tải.
- Nhạc: 1 bài, lặp; upload qua admin ≤ 8MB.
- Âm lịch: nhập tay.
- Admin: dùng được trên mobile, framework Preact.
- Restore: cả config + ảnh của lần publish gần nhất (swap, bấm lại = redo).
- Guestbook: hiện ngay, ẩn bằng Sheet.

## Đồng bộ cần làm
- 4 theme preset theo design.md: Trầm Vàng, Hồng Phấn, Lục Bảo, Son Đỏ.
- Gộp phụ lục field schema của design.md vào schema trong solution.md.

## Bổ sung từ người duyệt (2026-10-07, sau Cổng 1)
- Theme/animation trong config.js cũ CHỈ để tham khảo. ui-ux-designer phải tự thiết kế THÊM theme và animation mới (không giới hạn ở 4 preset / các hiệu ứng cũ).
- Trầm Vàng + phong bì + mức "Vừa" vẫn là mặc định.

## Quyết định vòng 2 (2026-10-07)
- Q16: Có theme tối `dem-nhung` trong bản đầu, không mặc định (thay giả định "không theme tối").
- Q18: Hạt nền mặc định hiện **cả trang** (không chỉ Hero/Cảm ơn).
- Q20: Pháo hoa ở countdown chạy **mỗi lần cuộn tới countdown**.
- Link khách: giữ dấu mặc định + tuỳ chọn mã hoá.
- Giả định chấp nhận (người duyệt không phản đối): Q17 đổi theme chỉ thay phần "Theo theme"; Q19 giữ `light-gather`, máy yếu hạ xuống fade; VietQR sinh client-side, test bằng 1 tài khoản thật ở v1.

## Quyết định stack FE (2026-10-07)
- Người duyệt xác nhận: Vite + TypeScript; trang thiệp = vanilla TS + CSS variables; admin = Preact + TS. Không dùng Angular (CLAUDE.md global không áp dụng cho dự án này).

## Restore khi còn nháp (2026-10-07)
- Người duyệt đồng ý: "Khôi phục bản publish trước" sẽ reset nháp theo bản vừa khôi phục; có nút tải nháp về máy trước khi khôi phục.

## Đặt tên giai đoạn (2026-10-07)
- Người duyệt yêu cầu đổi tên giai đoạn M1..M4 thành **v1..v4** (v4a/v4b). Branch code: `feat/20261007-wedding-page-v1`.

## Nhận xét sau khi xem v1 local (2026-10-07)
- Thêm **nhiều mẫu phong thư** cho màn mở đầu (kiểu `envelope`), admin cấu hình chọn được. (ui-ux-designer đề xuất mẫu + field schema; triển khai sau khi người duyệt xem xét.)
- **Tự động cuộn sau khi mở thiệp**: BẬT mặc định (thay giả định cũ "Tự cuộn: tắt"); dừng ngay khi khách tác động cuộn/chạm/phím. (ui-ux-designer spec chi tiết: tốc độ, tiếp tục lại hay không, reduced-motion.)
- v1 đã commit trên `feat/20261007-wedding-page-v1` (3780836). v2 làm trên `feat/20261007-wedding-page-v2` (tách từ v1).

## Quyết định sau review visual v1 (2026-10-08)
- Phong bì: "Kính gửi + tên khách" in trên mặt phong bì; tên cặp đôi đặt phía trên, ngoài phong bì.
- Làm đủ 6 mẫu phong thư (`classic` ★, `kraft`, `song-hy`, `lace`, `minimal`, `velvet`); `song-hy`/`kraft`/`velvet` giữ màu cố định (vẫn chọn được "Theo theme").
- Tự cuộn: bật mặc định, 45px/s, bắt đầu sau 2.5s, `flow` dừng 1.2s đầu mỗi section; khách tác động -> dừng hẳn, có nút Tiếp tục (không tự tiếp tục). Reduced-motion: không tự chạy, khách tự bấm được. Import config cũ: kẹp `startDelayMs` tối thiểu 1500.
- Hạt nền bay qua chữ quan trọng (tên khách, tên cặp đôi, lời mời): mờ xuống 0.3 (không ẩn hẳn).
- Áp dụng toàn bộ 24 điểm trong design-review-v1.md theo đề xuất của designer (trừ khi người duyệt nói khác).
