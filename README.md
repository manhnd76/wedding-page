# wedding-page

Thiệp cưới online, site tĩnh (Vite multi-page + TypeScript). Guest app = vanilla TS + CSS variables. Admin (Preact) có ở giai đoạn v2.
Tài liệu thiết kế/giải pháp: `docs/tasks/20261007-wedding-page/`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm install` | Cài dependency (Node >= 20.19) |
| `npm run dev` | Dev server `http://localhost:5173` (sửa `public/content/config.json` -> trang tự tải lại) |
| `npm run build` | typecheck + `vite build` (ra `dist/`) + `size-limit` (vượt ngân sách = fail) |
| `npm run preview` | Xem bản build ở `http://localhost:4173` |
| `npm test` | Unit test (vitest) |
| `npm run test:e2e` | Playwright smoke + kiểm hạt né form (cần `npm run build` trước; dùng Chrome đã cài, `PW_CHANNEL=msedge` để dùng Edge) |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` |
| `npm run size` | Chỉ chạy size-limit trên `dist/` |
| `npm run placeholders` | Sinh lại ảnh/nhạc mẫu nhẹ trong `public/content/` |

## Sửa nội dung (v1, chưa có admin)

1. Sửa `public/content/config.json` (schema v1: `docs/tasks/20261007-wedding-page/solution.md` mục 5.5, enum 5.6).
2. `npm run build` -> plugin `scripts/vite-plugins/inject-config-og.ts` nhúng config + theme đã resolve + CSS vars + font + OG vào `dist/index.html`, ghi hash CSP vào `dist/_headers`.
3. Giá trị hợp lệ nhưng bản v1 chưa có module (theme khác 3 theme đã bật, kiểu mở khác 4 kiểu...) tự rơi về giá trị dự phòng trong `src/shared/capabilities.ts`, build in cảnh báo `[config] ...`, trang chỉ `console.warn`.

Link khách: `https://<site>/?to=gia-đình-anh-Mạnh` hoặc `https://<site>/invite/gia-đình-anh-Mạnh` (dùng `--` cho gạch nối thật).

## Deploy (Cloudflare Pages)

Build command `npm run build`, output `dist`. `_redirects` (rewrite `/invite/*`) và `_headers` (CSP + cache) nằm trong `public/` và được xử lý lúc build.
