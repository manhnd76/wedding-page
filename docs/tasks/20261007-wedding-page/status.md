# Status - 20261007-wedding-page

- Giai đoạn hiện tại: **v2.3** trên `feat/20261007-wedding-page-v2.3` (tách từ v2.2 commit 55b8b69). Song song:
  - frontend-developer: cổng login mật khẩu (hash) + token GitHub chỉ hỏi khi Publish/Khôi phục + sửa E01–E11 -> frontend-report-v2.3.md
  - solution-designer: cập nhật solution.md mục đăng nhập/token theo decisions "Đổi luồng đăng nhập admin".
- Nợ tài liệu: design.md mục 8.2/8.2b (login mới) + SVG nắp 3.2 cần ui-ux-designer cập nhật ở lượt sau; icon admin thật.
- Commit: v1 3780836, v2 ce58f31, v2.1 f0a6465, v2.2 55b8b69. Chưa push.
- Cần kiểm tra tay: GitHub thật + CF Pages, Safari nén ảnh, QR thật, webview, tự cuộn trên máy thật.
- Vòng lặp sửa đã dùng: 0/3
- solution-designer XONG: solution.md Rev 4 (luồng login, vault v2, dòng v2.3). Đề xuất: "Ghi nhớ token" mặc định TẮT; khuyến nghị Cloudflare Access /admin/*. Chờ người duyệt.
- Mật khẩu rõ đã xoá khỏi decisions.md/status.md trong working tree, NHƯNG còn trong commit 55b8b69 (chưa push) -> người duyệt chọn KHÔNG sửa lịch sử. "Ghi nhớ token" mặc định BẬT.
- frontend v2.3 XONG (chưa commit). Orchestrator kiểm tra: build exit 0 (guest JS 31.22/60, admin JS 73.15/80), unit 407/407, e2e 34/34, không còn chuỗi mật khẩu rõ trong working tree/dist. "Ghi nhớ" mặc định bật (đúng quyết định). E01–E11 sửa xong, E12 -> v4.
- v2.3 commit + merge fast-forward vào main + push origin/main theo yêu cầu người duyệt (2026-10-08).
