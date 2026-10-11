# Backlog - 20261007-wedding-page

> Ý tưởng người duyệt yêu cầu đưa vào kế hoạch lần tới (ghi 2026-10-08). Chưa phân tích, chưa giao việc.
> Lần tới: giao solution-designer + ui-ux-designer phân tích/thiết kế, rồi chốt giai đoạn (gộp vào v4a hoặc tách riêng).

## B1. Animation đa dạng khi cuộn tới từng section — ĐÃ XẾP VÀO v4a (2026-10-08)
- Hiện tại: gần như chỉ một kiểu fade-up (gói reveal `soft`/`gentle` đã bật ở v1).
- Mong muốn: mỗi section/nhóm nội dung có kiểu xuất hiện riêng, không đơn điệu.
- Liên quan sẵn có trong design.md 5.8: 13 kiểu reveal / 6 gói (`editorial`, `letter`, `playful`, `cinematic` chưa bật: `mask-up`, `split-*`, `blur-in`, `parallax-layers`...) -> có thể kéo lên sớm từ v4a + thêm cơ chế gán kiểu reveal theo section (admin chọn hoặc "tự động xen kẽ").
- **Phần CHƯA có thiết kế**: hiện 1 gói reveal áp cho CẢ TRANG (chỉ khác theo vai trò heading/khối/ảnh/ornament). B1 cần thêm: gán gói/kiểu reveal **theo từng section** + chế độ "tự động xen kẽ".
- Ràng buộc: giữ ngân sách JS, tôn trọng 4 cấp cường độ + reduced-motion, không clip dấu tiếng Việt.

## B2. Hoạ tiết trang trí nền (vector, không dùng ảnh thô) — ĐÃ XẾP VÀO v4a (2026-10-08)
- Ví dụ: hoa văn trống đồng Đông Sơn, hoa văn truyền thống tương tự (mây, sóng, hoa sen, chữ Hỷ...).
- Dạng SVG/vector nhẹ, phủ nền mờ hoặc làm điểm nhấn góc/giữa section; màu theo theme token; có thể chuyển động nhẹ (xoay chậm, parallax).
- Admin: chọn bộ hoạ tiết, độ đậm, vị trí; gắn gợi ý theo theme (vd `son-do`/`sen-cham` -> trống đồng/sen).
- Lưu ý: hoạ tiết tự vẽ hoặc nguồn có giấy phép rõ ràng.

## B3. Mascot/nhân vật "nhìn theo" hướng cuộn hoặc nghiêng máy (tính năng nâng cao) — ĐÃ XẾP VÀO v4a (2026-10-08)
- Tham khảo: https://github.com/nilbuild/page-mascot (mascot đổi ô/khung hình theo hướng con trỏ).
- Mong muốn: trên mobile không có con trỏ -> dùng **vị trí/hướng scroll** hoặc **cảm biến định hướng (DeviceOrientation)** để chọn ô (frame) thay cho con trỏ.
- Cần làm rõ lần tới: nhân vật là gì (chibi cô dâu chú rể? sprite tự vẽ?), đặt ở đâu, bật/tắt trong admin; giấy phép của page-mascot (dùng lại code hay tự làm); iOS cần xin quyền cảm biến bằng thao tác người dùng (có thể xin lúc chạm "mở thiệp"); fallback khi từ chối quyền -> dùng scroll; reduced-motion -> đứng yên; hiệu năng (throttle theo rAF).

## B4. Vẽ lại asset `watercolor-wash` (hoãn 2026-10-10)
- Từ design-review-v4a-1-2b.md: **T02** (vệt màu nước thành "khối" phẳng, theme Màu Nước) và **O04** (cover Màu Nước + `ink-spread` trơn nhất trong 12 theme). Lỗi gốc ở spec/asset của designer.
- Việc: ui-ux-designer vẽ lại `assets/v4a-1/textures/watercolor-wash.svg` (+ spec) -> FE áp dụng. Chưa xếp giai đoạn.

## B5. Lỗi nhỏ designer phát hiện khi chọn ảnh mặc định (2026-10-11, design-default-images.md §3.7)
- S2: tiêu đề thank-you trên desktop rớt 1 chữ xuống dòng riêng.
- S3: kiểu mở `polaroid`, `moon-gate` bỏ qua focal point của ảnh.
- S4: e2e phong bì tự skip khi config mẫu không dùng kiểu mở envelope (config mẫu mới dùng `flower-gate`) -> cần ép config trong test.
