# Project guide (wedding-page)

Stack của dự án này (thay cho CLAUDE.md global - decisions.md "Quyết định stack FE"): Vite multi-page + TypeScript strict; guest = vanilla TS + CSS variables (không framework); admin = Preact + TS (v2). Không backend, không DB; RSVP/lời chúc qua Google Apps Script (v3).

## Lệnh
- Build: `npm run build` (typecheck + vite build + size-limit)
- Unit test: `npm test` (vitest, `tests/**/*.test.ts`)
- E2E: `npm run build && npm run test:e2e` (Playwright, Chrome đã cài trên máy)
- Typecheck/lint: `npm run typecheck`

## Quy ước
- `src/shared`: code dùng chung guest/admin/plugin build (schema, migrations, merge, theme, fonts, vietqr...). Import tương đối có đuôi `.ts`.
- `src/guest`: guest app. Không `innerHTML`, không thuộc tính `style` (CSP) - dùng helper `h()` / `css()` trong `src/guest/dom.ts`.
- Thêm theme/kiểu mở/hạt mới: thêm module + bật trong `src/shared/capabilities.ts`; không đổi schema.
- Tài liệu task: `docs/tasks/<task-id>/` (không sửa request/decisions/solution/design/status khi không được giao).

## Điều cấm
- Không commit/push/merge/deploy khi chưa được yêu cầu. Không đưa token/STK thật vào repo.
