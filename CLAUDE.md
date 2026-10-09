# Project guide (wedding-page)

Stack của dự án này (thay cho CLAUDE.md global - decisions.md "Quyết định stack FE"): Vite multi-page + TypeScript strict; guest = vanilla TS + CSS variables (không framework); admin = Preact + TS (v2). Không backend, không DB; RSVP/lời chúc qua Google Apps Script (v3).

## Bắt đầu phiên mới
- Đọc `docs/tasks/20261007-wedding-page/status.md` (bàn giao: đang ở đâu, roadmap, việc chờ duyệt) trước khi làm gì. Định nghĩa agent: `.claude/agents/` (orchestrator là main agent).

## Lệnh
- Build: `npm run build` (typecheck + vite build + size-limit)
- Unit test: `npm test` (vitest, `tests/**/*.test.ts`)
- E2E: `npm run build && npm run test:e2e` (Playwright, Chrome đã cài trên máy; tự chạy `vite preview` :4173 + `vite dev` :5175 với `WP_DEV_SAVE_ROOT` = thư mục tạm. KHÔNG dùng cổng 5173)
- Typecheck/lint: `npm run typecheck`

## Quy ước
- `src/shared`: code dùng chung guest/admin/plugin build (schema, migrations, merge, theme, fonts, vietqr...). Import tương đối có đuôi `.ts`.
- `src/admin`: trang quản lý Preact (JSX qua Oxc của Vite, `jsxImportSource: preact`). Route nặng tải lười (`editor/editor.tsx` LAZY). Không gọi GitHub thật trong test: dùng `tests/helpers/fake-github.ts`.
- `src/shared/storage`: manifest + thuật toán publish/restore (swap) dùng chung GitHubAdapter và plugin `dev-admin-save`.
- `src/guest`: guest app. Không `innerHTML`, không thuộc tính `style` (CSP) - dùng helper `h()` / `css()` trong `src/guest/dom.ts`.
- Thêm theme/kiểu mở/hạt mới: thêm module + bật trong `src/shared/capabilities.ts`; không đổi schema.
- Tài liệu task: `docs/tasks/<task-id>/` (không sửa request/decisions/solution/design/status khi không được giao).

## Điều cấm
- Không commit/push/merge/deploy khi chưa được yêu cầu. Không đưa token/STK thật vào repo.

## Quy ước làm việc của agent (người duyệt chốt 2026-10-08)
- **Ghi tiến độ liên tục vào report**: tạo file report ngay khi bắt đầu, cập nhật sau mỗi phần việc xong (không đợi cuối). Đơn vị "một phần" vừa phải, không cần quá nhỏ — vd sửa danh sách lỗi của designer thì xong mỗi lỗi (mỗi ID) ghi 1 lần: ID, đã sửa gì, file nào, trạng thái. Nếu bị ngắt giữa chừng, agent sau đọc report là biết đã làm tới đâu và làm tiếp, không làm lại.
- **Tiết kiệm e2e và chụp màn hình** (phần tốn quota nhất):
  - ui-ux-designer khi phát hiện lỗi giao diện phải **lưu ảnh chụp làm bằng chứng** vào `docs/tasks/<task-id>/screenshots/<file-review>/<ID>.png` (vd `screenshots/design-review-envelopes/E01.png`) và ghi đường dẫn ảnh + viewport/theme/thao tác tái hiện vào cột tương ứng trong bảng review.
  - frontend-developer dùng chính ảnh đó để hiểu lỗi, **không chạy e2e/chụp lại chỉ để tái hiện**. Trong lúc sửa chỉ chạy unit test và e2e có chọn lọc (`npx playwright test <file> -g "<tên>"`) khi thật cần; chạy **toàn bộ** `npm run test:e2e` **một lần** ở cuối để xác nhận tiêu chí hoàn thành.
