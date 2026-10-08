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

## Quyết định sau v2.1 + review admin (2026-10-08)
- Tự cuộn với config cũ: chuyển sang BẬT 45px/s. Thực tế chưa có config nào được publish, nên chỉ cần: defaults + config mẫu + import config v0 đều ra `enabled: true` (v0 có `speed` thì giữ, `startDelayMs` kẹp ≥ 1500). Không thêm migration cho config v1.
- Giả định admin được chấp nhận: Undo mobile đặt ở top bar; mini preview sticky mobile để v4 (v2.x dùng toast "[Xem ↗]"); admin dùng font hệ thống; đổi tên "Sections" -> "Các phần & thứ tự".
- v2.1 commit trên `feat/20261007-wedding-page-v2.1`; v2.2 (sửa 23 điểm admin còn lại) trên `feat/20261007-wedding-page-v2.2`.

## Đổi luồng đăng nhập admin (2026-10-08)
- Người duyệt hỏi có thể sửa cấu hình "không cần deploy" không; sau khi biết site tĩnh thì mọi thay đổi (kể cả text) đều phải publish -> **giữ nguyên luồng publish qua GitHub**, không thêm nơi lưu runtime.
- **Cổng login** khi vào `/admin`: mật khẩu do người duyệt cung cấp (không ghi dạng rõ trong repo), lưu **dạng hash** trong code (không có chuỗi rõ trong repo/bundle). Sau login được sửa/xem trước/upload vào nháp thoải mái.
- **Token GitHub chỉ hỏi khi cần**: lần đầu bấm Publish/Khôi phục (hoặc thao tác bắt buộc gọi GitHub) mới mở màn Kết nối GitHub — không bắt kết nối ngay khi vào admin.
- Giả định mặc định (orchestrator): token "ghi nhớ" được mã hoá bằng chính mật khẩu login (bỏ passphrase riêng); bản xuất bản hiện tại đọc từ chính site (`/content/config.json` cùng origin) khi chưa có token.
- Phạm vi: v2.2 commit; **v2.3** = login mới + sửa E01–E11 (design-review-envelopes.md) theo giả định designer: tên khách dài tự giảm cỡ, tối đa 3 dòng (≥15px), không mất dấu; nút "Tiếp tục tự cuộn" ẩn khi khách cuộn, hiện lại sau 1.2s đứng yên; kraft dây dừng ở mép thẻ; theme tối pha 14% accent cho classic/minimal/lace; chấp nhận hình nắp mới. E12 (hiệu ứng "Nhiều" riêng từng mẫu) để v4.

## Bảo mật login (2026-10-08)
- "Ghi nhớ token trên máy này": **mặc định BẬT** (người duyệt chọn, chấp nhận rủi ro token mã hoá bằng mật khẩu ngắn có thể bị giải nếu lộ localStorage).
- Không sửa lịch sử commit 55b8b69 (có mật khẩu rõ trong decisions.md, chưa push) — người duyệt chấp nhận.
