# wedding-page

Thiệp cưới online, site tĩnh (Vite multi-page + TypeScript). Guest app = vanilla TS + CSS variables. Trang quản lý `/admin/` = Preact + TS (v2).
Tài liệu thiết kế/giải pháp: `docs/tasks/20261007-wedding-page/`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm install` | Cài dependency (Node >= 20.19) |
| `npm run dev` | Dev server `http://localhost:5173` (sửa `public/content/config.json` -> trang tự tải lại) |
| `npm run build` | typecheck + `vite build` (ra `dist/`) + `size-limit` (vượt ngân sách = fail) |
| `npm run preview` | Xem bản build ở `http://localhost:4173` |
| `npm test` | Unit test (vitest) |
| `npm run test:e2e` | Playwright guest + admin (cần `npm run build` trước; tự chạy `vite preview` :4173 và `vite dev` :5175 ghi vào thư mục tạm; dùng Chrome đã cài, `PW_CHANNEL=msedge` để dùng Edge) |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` |
| `npm run size` | Chỉ chạy size-limit trên `dist/` |
| `npm run placeholders` | Sinh lại ảnh/nhạc mẫu nhẹ trong `public/content/` |
| `npm run admin:hash -- "<mật khẩu>"` | In hash mật khẩu đăng nhập trang quản lý (xem "Đổi mật khẩu") |

## Trang quản lý (v2)

Mở `https://<site>/admin/` -> **đăng nhập bằng mật khẩu** (phiên chỉ trong tab: đóng tab là phải đăng nhập lại; sai 5 lần khoá 30 giây). Sau khi đăng nhập là vào thẳng trang quản lý: sửa, xem trước, tải ảnh/nhạc vào **nháp** không cần token; bản đang xuất bản đọc từ `/content/config.json` của chính site.

**Token GitHub chỉ hỏi khi cần**: lần đầu bấm Xuất bản / Khôi phục (hoặc "Kết nối GitHub" ở Tổng quan) mới mở màn Kết nối GitHub; kết nối xong quay lại đúng thao tác đang làm. "Ghi nhớ token trên máy này" mã hoá token bằng chính mật khẩu đăng nhập (PBKDF2-SHA256 600k + AES-GCM, localStorage); không ghi nhớ thì token chỉ ở sessionStorage. "Ngắt kết nối GitHub" ở Tổng quan xoá token khỏi máy.

### Đổi mật khẩu đăng nhập

Mật khẩu **không** nằm trong mã nguồn, chỉ có hash PBKDF2-SHA256 (600.000 vòng, salt 16 byte).
1. `npm run admin:hash -- "mật-khẩu-mới"` (không muốn lưu vào lịch sử lệnh: `npm run admin:hash -- --stdin` rồi gõ mật khẩu + Enter, hoặc biến môi trường `WP_ADMIN_PASSWORD`). Nên dùng ≥ 12 ký tự.
2. Dán dòng `pbkdf2-sha256$...` vừa in vào hằng số `ADMIN_PASSWORD_HASH` trong `src/admin/auth/password.ts`.
3. `npm test` (test quét để chắc không có mật khẩu dạng rõ trong `src/`, `tests/`, `dist/`…) rồi build/deploy. Phiên đăng nhập cũ hết hiệu lực; token đã "Ghi nhớ" bằng mật khẩu cũ sẽ bị bỏ, lần Xuất bản tới sẽ hỏi lại token.

Lưu ý: site tĩnh nên ai cũng tải được bundle; cổng mật khẩu chỉ chặn người lạ mở `/admin`. Lớp bảo mật thật là token GitHub (không bao giờ nằm trong repo). Nên dùng mật khẩu dài, khó đoán.

Ba chế độ lưu:
- **GitHub** (chính): màn "Kết nối GitHub" hướng dẫn tạo fine-grained token (chỉ 1 repo; Repository permissions: **Contents: Read and write**, Metadata: Read-only; hạn sau ngày cưới ≥ 1 tháng). Mỗi lần Xuất bản = 1 commit; giữ 1 bản sao lưu (`backup/`, không deploy), Khôi phục = hoán đổi.
- **Máy chủ dev** (`npm run dev`, mở `http://localhost:5173/admin/`): Xuất bản ghi thẳng vào `public/content/` + `backup/` (middleware `dev-admin-save`, chỉ có ở `vite dev`).
- **Không kết nối**: chọn ở màn Kết nối GitHub ("Tải gói .zip để tự commit"); "Tải gói xuất bản (.zip)" rồi tự commit.

Nháp lưu IndexedDB trên máy (`wp-admin`); danh sách khách chỉ lưu trên máy + CSV.

## Sửa nội dung bằng tay

1. Sửa `public/content/config.json` (schema v1: `docs/tasks/20261007-wedding-page/solution.md` mục 5.5, enum 5.6).
2. `npm run build` -> plugin `scripts/vite-plugins/inject-config-og.ts` nhúng config + theme đã resolve + CSS vars + font + OG vào `dist/index.html`, ghi hash CSP vào `dist/_headers`.
3. Giá trị hợp lệ nhưng bản v1 chưa có module (theme khác 3 theme đã bật, kiểu mở khác 4 kiểu...) tự rơi về giá trị dự phòng trong `src/shared/capabilities.ts`, build in cảnh báo `[config] ...`, trang chỉ `console.warn`.

Link khách: `https://<site>/?to=gia-đình-anh-Mạnh` hoặc `https://<site>/invite/gia-đình-anh-Mạnh` (dùng `--` cho gạch nối thật).

## Deploy (Cloudflare Pages)

Build command `npm run build`, output `dist`. `_redirects` (rewrite `/invite/*`) và `_headers` (CSP + cache) nằm trong `public/` và được xử lý lúc build.
