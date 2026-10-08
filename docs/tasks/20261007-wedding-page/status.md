# Status - 20261007-wedding-page

- Giai đoạn hiện tại: **v2.2** trên `feat/20261007-wedding-page-v2.2` (tách từ v2.1 f0a6465). Song song:
  - frontend-developer: sửa các điểm còn lại trong design-review-admin-v2.md (A01 đã sửa ở v2.1) + kiểm tra autoScroll defaults theo decisions -> frontend-report-v2.2.md
  - ui-ux-designer: duyệt visual phong bì mới + 6 mẫu phong thư + tự cuộn (chỉ đọc) -> design-review-envelopes.md
- Commit: v1 3780836, v2 ce58f31, v2.1 f0a6465. Chưa push.
- Cần kiểm tra tay: GitHub thật + CF Pages, Safari nén ảnh, QR thật, webview, tự cuộn trên máy thật.
- Vòng lặp sửa đã dùng: 0/3

## Sự cố
- 2026-10-08: cả 2 agent v2.2 dừng giữa chừng do giới hạn phiên API (429). Frontend đã sửa dở nhiều file trong src/admin, src/shared, tests (chưa có report). Designer chưa ghi gì; còn để lại vite server cổng 5180 (PID 4012). Đã giao lại cả hai, tiếp tục từ trạng thái hiện tại (không làm lại từ đầu).
- frontend v2.2 XONG (chưa commit). Orchestrator kiểm tra: build exit 0 (guest JS 30.52/60, admin JS 73.45/80), unit 392/392, e2e 26/26. A01–A24 đã sửa (A23 giữ font hệ thống theo quyết định).
- ui-ux-designer (duyệt phong bì + tự cuộn): đang chạy.
- ui-ux-designer XONG: design-review-envelopes.md. 22/23 R-points đạt. 12 điểm mới (2 Cao/4 Vừa/6 Thấp). BLOCKER E01: tên khách trên phong bì mất dấu nặng ("Mạnh" -> "Manh") do -webkit-line-clamp:2 + overflow:hidden, ở 5/6 mẫu. Server 5180 đã dừng.
- 🚦 Chờ người duyệt: commit v2.2, 6 câu hỏi phong bì, bước tiếp (v2.3 sửa E01–E11).
