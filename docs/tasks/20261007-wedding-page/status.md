# Status - 20261007-wedding-page

- Giai đoạn hiện tại: **v4a-1** (9 theme + asset + B2 hoạ tiết nền). Bước 1: ui-ux-designer thiết kế + asset (đang chạy) -> solution-designer schema -> FE code.
- Nợ tài liệu: design.md mục 8.2/8.2b (login mới) + SVG nắp 3.2 cần ui-ux-designer cập nhật ở lượt sau; icon admin thật.
- Commit: v1 3780836, v2 ce58f31, v2.1 f0a6465, v2.2 55b8b69, v2.3 7c476e9 (main, đã push).
- Cần kiểm tra tay: GitHub thật + CF Pages, Safari nén ảnh, QR thật, webview, tự cuộn trên máy thật.
- Vòng lặp sửa đã dùng: 0/3
- solution-designer XONG: solution.md Rev 4 (luồng login, vault v2, dòng v2.3). Đề xuất: "Ghi nhớ token" mặc định TẮT; khuyến nghị Cloudflare Access /admin/*. Chờ người duyệt.
- Mật khẩu rõ đã xoá khỏi decisions.md/status.md trong working tree, NHƯNG còn trong commit 55b8b69 (chưa push) -> người duyệt chọn KHÔNG sửa lịch sử. "Ghi nhớ token" mặc định BẬT.
- frontend v2.3 XONG (chưa commit). Orchestrator kiểm tra: build exit 0 (guest JS 31.22/60, admin JS 73.15/80), unit 407/407, e2e 34/34, không còn chuỗi mật khẩu rõ trong working tree/dist. "Ghi nhớ" mặc định bật (đúng quyết định). E01–E11 sửa xong, E12 -> v4.
- v2.3 commit + merge fast-forward vào main + push origin/main theo yêu cầu người duyệt (2026-10-08).
- Backlog lần tới: docs/tasks/20261007-wedding-page/backlog.md (B1 animation đa dạng theo section, B2 hoạ tiết nền vector như trống đồng, B3 mascot nhìn theo scroll/nghiêng máy).

## Roadmap (cập nhật 2026-10-08)
| Giai đoạn | Trạng thái | Commit |
|---|---|---|
| v1 khung + schema + guest lõi | Xong | 3780836 |
| v2 admin + GitHub + backup/restore | Xong | ce58f31 |
| v2.1 sửa review v1 + 6 phong thư + tự cuộn | Xong | f0a6465 |
| v2.2 sửa UX admin (A01–A24) | Xong | 55b8b69 |
| v2.3 login mật khẩu + token khi cần + sửa E01–E11 | Xong, đã push main | 7c476e9 |
| Nợ tài liệu: design.md (login mới, SVG nắp) + icon admin thật | Chưa giao | - |
| v3 Apps Script RSVP/lời chúc | Chưa làm | - |
| v4a thư viện mở rộng + E12 + B1/B2/B3 | Chưa làm (B1–B3 cần thiết kế trước) | - |
| v4b polish/perf/a11y/QA/README deploy | Chưa làm | - |

## Chạy song song nhiều FE (chưa kích hoạt — chờ người duyệt yêu cầu)
- Cấu hình đã chọn khi cần: **2 FE + 1 designer**, mỗi FE một git worktree/branch riêng. FE#1 v3 Apps Script; FE#2 v4a phần đã thiết kế (theme -> kiểu mở -> hiệu ứng); designer thiết kế B1/B2/B3 + trả nợ design.md/icon admin.
- Việc phải làm trước khi chạy song song: `playwright.config.ts` đang cố định cổng 4173 (`reuseExistingServer: true`) và 5175 -> 2 worktree chạy e2e cùng lúc sẽ đụng/dùng nhầm server của nhau. Cần tham số hoá cổng qua biến môi trường (vd `E2E_PREVIEW_PORT`, `E2E_DEV_PORT`) và gán cổng khác nhau cho mỗi FE.
- Tài liệu chưa commit (decisions/solution/backlog/status) — worktree tạo từ HEAD sẽ không có; cần commit docs trước hoặc trỏ agent tới đường dẫn tuyệt đối trong cây chính.

## Trạng thái khi dừng (2026-10-08)
- Code: `main` = v2.3 (7c476e9), đã push origin/main. Branch feature v1..v2.3 chỉ ở local.
- Chưa commit (người duyệt chọn chưa commit): CLAUDE.md (quy ước agent), .gitignore (screenshots), decisions.md, solution.md (v4a + B1/B2/B3), backlog.md, status.md.
- Không có agent nào đang chạy. Dev server 5173 có thể còn chạy nền từ phiên này.
- Việc chờ người duyệt chọn thứ tự: nợ tài liệu (design.md login/SVG nắp + icon admin) -> v3 Apps Script -> v4a (nên chia nhỏ; B1–B3 cần thiết kế trước) -> v4b.
