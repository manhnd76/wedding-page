# Status - 20261007-wedding-page

- Giai đoạn hiện tại: v2 (admin) code xong, CHƯA commit, trên `feat/20261007-wedding-page-v2`. 🚦 Chờ người duyệt: commit v2 + giao việc tiếp.
- Orchestrator kiểm tra v2: build exit 0 (guest JS 26.32/60 kB, CSS 8.89/25; admin JS 66.91/80, CSS 5.55/10); unit 315/315; e2e 16/16.
- design-review-v1.md xong (24 điểm: 4 Cao/11 Vừa/9 Thấp) + spec 6 phong thư + tự cuộn; người duyệt đã chốt (decisions.md "Quyết định sau review visual v1").
- Phát hiện: `public/content/config.json` mẫu đang `theme.preset = son-do` (từ v1), mặc định phải là `tram-vang` -> sửa ở lượt tiếp.
- Việc tiếp đề xuất (v2.1): frontend sửa 24 điểm review + 6 phong thư + tự cuộn + config mẫu về tram-vang; ui-ux-designer cập nhật design.md theo review + review UX admin.
- Cần kiểm tra tay: GitHub thật + CF Pages, Safari nén ảnh, QR thật, webview.
- Vòng lặp sửa đã dùng: 0/3
