# Frontend report - 20261007-wedding-page - giai đoạn v2 (Admin + GitHub + kết nối + backup/restore)

> Người thực hiện: frontend-developer · Ngày: 2026-10-08 · Branch: `feat/20261007-wedding-page-v2` (chưa commit, theo yêu cầu).
> Phạm vi: solution.md "Kế hoạch triển khai" dòng **v2**. KHÔNG làm: Apps Script (v3), theme/kiểu mở/hạt mới (v4), mẫu phong thư mới + tự động cuộn (đang chờ ui-ux-designer).
> Không gọi GitHub API thật, không dùng/tạo token thật. GitHubAdapter được test bằng `fetch` giả (GitHub giả trong bộ nhớ).

## 1. Cấu trúc mới

```
src/admin/                         # trang quản lý Preact + TS
├── main.tsx, app.tsx              # luồng: phiên -> trang quản lý | vault -> Login | -> Kết nối lần đầu; chế độ Dev/Không kết nối
├── admin.css                      # trung tính #F7F6F3 / #2F4A43; ≥1200 3 cột, <768 bottom tab
├── auth/vault.ts                  # PBKDF2-SHA256 600k + AES-GCM, khoá 30s sau 5 lần sai, conn/session/vault storage
├── screens/connect.tsx, login.tsx # 8.2b (3 bước, aria-live, ✓/✕/!), 8.2
├── storage/
│   ├── adapter.ts                 # StorageAdapter + StorageError
│   ├── github.ts, github-errors.ts# GitHubAdapter (Git Data API, 1 commit, force:false), bảng lỗi 2.5, hạn token 2.6
│   ├── local-adapters.ts, zip.ts  # DevServerAdapter, DownloadAdapter (+ zip STORE tự viết)
│   └── draft-db.ts                # IndexedDB wp-admin v1: draft / blobs / published
├── draft/ ops.ts history.ts diff.ts checklist.ts paths.ts   # 4 thao tác quay lại, đổi theme Q17, undo 50, diff, checklist
├── links/link-gen.ts              # giữ dấu / không dấu, "Mã hoá link", ?to= | /invite/, CSV link_ma_hoa
├── media/ image-pipeline.ts image-slot.tsx crop.tsx          # ImageSlot 3 khối + pipeline nén/resize/hash
├── state/store.ts                 # EditorStore: nháp (autosave 800ms), publish/restore, poll publish.id
├── editor/ editor.tsx preview.tsx form.tsx publish-dialog.tsx util.ts
│   └── routes/ overview sections (eager) · theme fonts effects music media album links backup json (lazy)
└── ui/ui.tsx                      # toast, <dialog>, field, segmented…
src/shared/storage/ manifest.ts asset-refs.ts bytes.ts        # thuật toán publish/restore (swap) dùng chung GitHub + plugin dev
src/shared/config/schema-meta.ts   # metadata form + nhãn diff
src/guest/preview-bridge.ts        # (lazy, chỉ ?preview=1) postMessage wp:* / fx:*
scripts/vite-plugins/dev-admin-save.ts   # /__admin/* chỉ ở vite dev (apply:'serve')
scripts/e2e-dev-server.mjs         # e2e: vite dev :5175 ghi vào thư mục tạm
tests/ vault, github-adapter, backup-plan, draft-ops, editor-store, links-images-import (.test.ts) · helpers/fake-github.ts · e2e/admin.spec.ts
```

Sửa file v1 (ở mức cần cho preview-bridge / dev):
- `src/guest/bootstrap.ts`: nhánh `?preview=1` (chờ cấu hình qua postMessage, resolve runtime, tên khách mẫu, tự mở cover khi phát lại, báo `fx:done`). Không đổi luồng khách thường.
- `src/guest/context.ts` (+ `ctx.preview`), `effects/service.ts` (Mô phỏng máy yếu/giảm chuyển động; preview không chạy reveal/burst trừ khi được yêu cầu), `cover/cover.ts` (timeScale từ EffectRegistry -> 0.5x), `main.ts` (dev-only: nghe `wp:content-changed`).
- `scripts/vite-plugins/inject-config-og.ts`: emit font + ornament đã bật cho preview + `/preview-assets.json`; phân loại chunk admin cho size-limit; dev gửi sự kiện riêng thay `full-reload` (để trang admin không bị tải lại khi xuất bản ở chế độ dev).
- `public/_headers` (CSP admin chặt hơn), `vite.config.ts`, `vitest.config.ts`, `tsconfig.json` (jsx preact), `.size-limit.cjs`, `playwright.config.ts`, `README.md`, `CLAUDE.md` (lệnh/quy ước).
- `admin/index.html`: entry thật.

## 2. Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | :5173. Admin `http://localhost:5173/admin/` -> nút "Dùng máy chủ dev" (ghi `public/content/` + `backup/`) |
| `npm run build` | typecheck + vite build + size-limit (guest + **admin**) |
| `npm test` | vitest (15 file) |
| `npm run build && npm run test:e2e` | Playwright: tự bật `vite preview` :4173 và `vite dev` :5175 (`WP_DEV_SAVE_ROOT` = thư mục tạm, cache deps riêng `node_modules/.vite-e2e`); không đụng :5173 |

## 3. Dependency thêm

| Package | Loại | Kích thước | Ghi chú |
|---|---|---|---|
| `preact@10.29.8` | runtime (admin) | preact 4.84 kB gz + hooks 1.55 kB gz | Chọn nhánh 10.x ổn định (11.0.0 mới ra 30/09/2026). |
| `fake-indexeddb@6.2.5` | dev | - | test IndexedDB |

KHÔNG thêm `@preact/preset-vite` (kéo theo `@babel/core`): Vite 8 biên dịch JSX bằng Oxc (`oxc.jsx.importSource = 'preact'`). KHÔNG thêm `idb` (wrapper ~70 dòng tự viết). Zip dùng bộ ghi STORE tự viết (~90 dòng).

## 4. Kết quả thật (chạy 2026-10-08)

- `npm run build`: **exit 0**, 0 mục vượt ngân sách (39 mục).
- `npm test`: **15 file, 315 test pass** (v1: 238; +77 mới).
- `npm run test:e2e`: **16/16 pass** (8 guest cũ + 8 admin mới), ~1.4 phút.

### size-limit (gzip)
| Mục | Kích thước | Ngân sách |
|---|---|---|
| Guest JS ban đầu | **26.32 kB** (v1: 24.09) | ≤ 60 kB |
| Guest CSS ban đầu | **8.82 kB** | ≤ 25 kB |
| lazy `preview-bridge` (chỉ khi ?preview=1) | 1.48 kB | ≤ 15 kB |
| **Admin JS ban đầu** (entry + import tĩnh) | **66.91 kB** | **đề xuất ≤ 80 kB** (solution cho ≤ 150 kB; đặt chặt để phát hiện phình sớm) |
| **Admin CSS** | 5.55 kB | **đề xuất ≤ 10 kB** |
| Admin route lazy (theme 3.59, backup 3.07, effects 2.66, links 2.51, crop 1.50, album 1.40, music 1.42, fonts 1.29, json 0.76, media 0.70) | lớn nhất 3.59 kB | **đề xuất ≤ 15 kB/route** |

Guest tăng +2.2 kB do Rolldown tách lại chunk dùng chung khi có entry admin (guest-name, capabilities) và hook preview nhỏ trong bootstrap. `dist/` 1.6 MB (v1 651 KB): +~900 KB là font woff2 của 14 family đã bật cho **khung preview admin** (`/fonts/*`, khách không tải - chỉ preview đọc `/preview-assets.json`).

## 5. Tiêu chí v2

| Tiêu chí | Trạng thái | Bằng chứng |
|---|---|---|
| `npm run build` pass, guest trong ngân sách, ngân sách admin trong size-limit | ✅ | mục 4 |
| Admin Preact responsive (≥1200 3 cột; 768-1199 preview ẩn/hiện; <768 bottom tab, input 48px) | ✅ | e2e "mobile", ảnh chụp kiểm tay |
| Kết nối lần đầu 3 bước + Login passphrase + vault | ✅ (logic + UI) / ⏳ thật | unit vault + github-adapter (connect), e2e màn kết nối |
| Vault: sai passphrase bị từ chối; 5 lần -> khoá 30s; ciphertext không chứa token rõ | ✅ | `vault.test.ts` (kiểm cả localStorage, base64, salt/IV ngẫu nhiên, AAD theo repo, tham số 600k) |
| Bảng lỗi 401/403/404/nhánh/repo rỗng/rate limit chính+phụ/offline/5xx -> đúng thông điệp | ✅ (mock) | `github-adapter.test.ts` 15 ca |
| GitHubAdapter: publish 1 commit, `force:false`, không upload lại blob đã có, 409/422 không ghi đè | ✅ (mock) | đếm request trên GitHub giả; sha git blob tính cục bộ |
| **Restore 2 lần liên tiếp = tree ban đầu** | ✅ | `backup-plan.test.ts` (3 kịch bản + lần 3), `github-adapter.test.ts`, dev FS (`links-images-import.test.ts`), e2e dev |
| 4 thao tác quay lại | ✅ | `draft-ops.test.ts`, `editor-store.test.ts` |
| Restore khi còn nháp -> nháp reset; có nút tải nháp .json | ✅ | `editor-store.test.ts`, UI dialog bước 2 |
| 401 giữa phiên -> về Login, giữ nháp | ✅ | `editor-store.test.ts` (store mới đọc lại nháp) |
| Xung đột ref (2 tab) báo đúng, không ghi đè | ✅ (mock) | publish + store tests |
| DevServerAdapter + `dev-admin-save` (chỉ vite dev) | ✅ | unit FS + e2e :5175 (publish/khôi phục/làm lại) |
| DownloadAdapter (.zip) | ✅ | unit zip + e2e tải gói |
| Nháp IndexedDB + autosave 800ms + undo/redo 50 | ✅ | unit + e2e (tải lại trang vẫn còn nháp) |
| Form sinh từ schema-meta | ✅ | 16 nhóm form |
| Gallery theme (theme đã bật) + dialog Giữ/Trọn gói | ✅ | unit changeTheme; e2e đổi theme -> preview `data-theme` đổi |
| Font, upload nhạc ≤ 8MB | ✅ | unit checkAudio |
| Trình chọn hiệu ứng + `fx:replay`/`fx:done` + Phát lại / 0.5x / Mô phỏng | ✅ | e2e chọn kiểu mở -> cover phát -> "Đang xem" sau `fx:done` |
| Sections bật/tắt + kéo thả (+ ↑↓ + bàn phím) | ✅ | e2e tắt/bật Album, ↑ Đếm ngược -> preview đúng thứ tự |
| Live preview iframe `/?preview=1` + postMessage | ✅ | e2e sửa tên -> preview đổi; e2e chạy dưới CSP production |
| ImageSlot 3 khối + pipeline (webp/jpg; hero/cover 2000, album 1600 + thumb 600, khác 1200, OG 1200×630 JPEG), tên có hash | ✅ logic / ⏳ trình duyệt thật | unit kích thước + hash; nén canvas cần thử tay (mục 7) |
| Link generator + "Mã hoá link" + CSV `link_ma_hoa` | ✅ | unit (round-trip qua parser khách) + e2e |
| Checklist + diff trước publish | ✅ | unit + e2e |
| Publish + poll publish.id | ✅ logic / ⏳ thật | poll same-origin `/content/config.json?ts=` 10s, tối đa 5 phút |
| Export/import config (.json, config.js cũ) | ✅ | unit import v0/v1/JSON hỏng |
| Cảnh báo token hết hạn trước ngày cưới ở 3 nơi | ✅ | dòng kết quả 4 (connect), banner Tổng quan, checklist |
| Kết nối thật từ điện thoại ≤ 5 phút; publish thật, site cập nhật ≤ 2 phút; thử máy thật | ⏳ **Cần kiểm tra tay** | mục 7 |
| ui-ux-designer duyệt UX admin | ⏳ cần người | |

## 6. Lệch so với solution / design (kèm lý do)

1. **Preview = 2 khung iframe luân phiên (double buffer)**, mỗi cấu hình/lần phát lại là 1 lần tải khung mới chạy đúng code guest; khung ẩn tải xong mới đổi chỗ (không nháy). Lý do: guest v1 có timer/observer/canvas toàn cục, render lại tại chỗ sẽ rò rỉ; cách này giống trang thật 100%. Guest vẫn xử lý `wp:preview-config`/`fx:replay` gửi tới khung đang chạy (tự tải lại với trạng thái lưu sessionStorage). **Bổ sung contract** (không phá cái cũ): `wp:preview-ready` có `phase: 'boot' | 'rendered'`; message `wp:preview-scroll {scrollY}`; payload `wp:preview-config` có thêm `fx` (phát lại khi khởi động) và `options.scrollY`.
2. **Font admin tự host thay Google Fonts `&text=`** (Còn mở #2): gallery/dropdown/preview dùng FontFace từ `/preview-assets.json` (cùng file woff2 của khách). Không phụ thuộc bên thứ 3, chạy offline -> CSP admin bỏ `fonts.googleapis.com`/`fonts.gstatic.com`, thêm `Referrer-Policy: no-referrer`. Đổi lại `dist/` +~900 KB (khách không tải).
3. Không dùng `@preact/preset-vite`, `idb` (mục 3). Không có HMR Prefresh cho admin (chỉ full reload khi dev).
4. **Manifest thêm `backupPublishId`** (publish.id của config nằm trong bản sao lưu) để hiển thị; `publishId` = publish.id đang chạy ngay sau commit. Publish/restore **kiểm head == baseCommit trước khi ghi** (xung đột phát hiện sớm, không tạo blob/tree thừa), ngoài optimistic lock `force:false`.
5. PBKDF2 chạy bằng WebCrypto (bất đồng bộ, trình duyệt không chặn main thread); **chưa làm Web Worker** - chưa đo trên điện thoại cũ (solution: "đo ở v2") -> cần đo tay.
6. **Crop chỉ cho slot có tỉ lệ** (hero/cover 9:16, chân dung 4:5, gia đình/sự kiện 3:2, OG, QR 1:1); album/love story/khác chỉ resize. Pinch thay bằng thanh trượt zoom + kéo + phím mũi tên (design cho phép). Điểm lấy nét: chạm trên thumbnail (hero/cover).
7. **Album sắp xếp bằng nút ←→** (chưa có kéo thả trong lưới album); Sections có kéo thả đầy đủ (giữ 200ms trên touch).
8. Theme gallery: thẻ dùng token/font thật nhưng texture/divider giản lược (CSS), chưa có ornament góc. **Mini preview dính 38vh trên mobile chưa làm** - dùng tab "Xem trước".
9. Trình chọn hiệu ứng **ẩn micro chưa có module** (buttonShine, photoTilt, wishFly, scrollProgress, coupleHeartTap - v3/v4), chỉ 4 kiểu mở/5 hạt/2 gói reveal của capabilities. Hoạt ảnh thẻ kiểu mở là CSS minh hoạ (chưa có poster của designer). Cảnh báo tổ hợp nặng chỉ nằm trong checklist (v2 chưa có kiểu "Cao").
10. 0.5x áp dụng cho kiểu mở + hạt + burst (WAAPI/canvas); transition CSS của reveal chưa bị làm chậm.
11. Checklist "ảnh hero quá sáng với theme tối" dùng độ sáng của `dominantColor` thay vì độ sáng trung bình.
12. Poll "đã lên trang" đọc `/content/config.json` cùng origin với admin (admin nằm cùng site), không dùng `meta.siteUrl` (tránh CSP connect-src và lệch domain).
13. Chế độ không kết nối: "Xuất bản" chỉ tải .zip, không đổi trạng thái "đã xuất bản"; Khôi phục không khả dụng.
14. Nút "Kiểm tra kết nối Apps Script" (ping) chưa làm - thuộc v3.
15. **2 test v1 sửa cho bền** (lỗi có sẵn ở commit 3780836): `public/content/config.json` đã commit với `preset: "son-do"` nhưng `sections-plugin.test.ts` và 2 e2e guest ghim cứng Trầm Vàng. Unit test nay ghim preset trong patch; e2e đọc theme từ `#wp-resolved` của `dist/index.html`. Không sửa config mẫu.

## 7. Cần kiểm tra tay với GitHub thật (repo test private)

Chuẩn bị (người duyệt tự làm, không đưa token vào tài liệu/chat):
1. Tạo repo **private** mới (vd `wedding-test`), đẩy mã nguồn dự án (nhánh `main`). Tạo project Cloudflare Pages trỏ repo này: build `npm run build`, output `dist`.
2. Tạo **fine-grained token**: github.com/settings/personal-access-tokens/new · Token name "Thiệp cưới test" · Expiration: ngày sau ngày cưới ≥ 1 tháng · Repository access: **Only select repositories** -> `wedding-test` · Repository permissions: **Contents: Read and write** (Metadata: Read-only tự bật) · không cấp gì khác.
3. Thêm token thứ 2 **chỉ Contents: Read-only** (để thử lỗi thiếu quyền) và token thứ 3 hạn ngắn (vd 7 ngày - thử cảnh báo vàng).

Các bước kiểm (mở `https://<project>.pages.dev/admin/` trên **điện thoại**, bấm giờ):
1. Kết nối lần đầu: dán link repo vào ô owner (tự tách) -> dán token -> Kiểm tra kết nối: 4 dòng ✓ -> đặt passphrase -> vào trang quản lý. Mục tiêu ≤ 5 phút.
2. Lỗi bảng 2.5: token sai 1 ký tự (401) · token Read-only (dòng "Có quyền ghi" ✕) · repo sai tên (404) · nhánh `mian` (liệt kê nhánh + chip) · repo trống (tạo repo rỗng khác) · bật chế độ máy bay (offline) · token hạn ngắn (dòng 4 vàng + banner Tổng quan + checklist).
3. Vault: đóng tab, mở lại -> Login; nhập sai 5 lần -> đếm ngược 30s; DevTools > Application > Local Storage `wp_admin_vault_v1` không chứa chuỗi token.
4. Thay ảnh bìa (ảnh điện thoại 3-5 MB) -> kiểm "x MB thành y KB, WebP 2000px" (Safari iOS: JPEG) -> Xuất bản -> trên GitHub: 1 commit `admin: publish …`, ảnh cũ nằm `backup/files/public/content/images/hero/…`, ảnh mới tên `hero.<8 ký tự>.webp`. Thanh trạng thái tới "Khách đã thấy bản mới" - mục tiêu ≤ 2 phút.
5. "Lấy lại ảnh trước đó" ở ô ảnh bìa -> chỉ đổi nháp; Xuất bản -> Network chỉ có 2 lần POST `git/blobs` (config + manifest), ảnh không upload lại.
6. Sao lưu/Khôi phục -> Khôi phục (khi đang có 1 thay đổi nháp: dialog có "Tải nháp về máy") -> trang quay về bản trước, nháp được đặt lại; bấm "Làm lại" -> quay về bản vừa thay. So sánh tree 2 commit với commit trước khôi phục.
7. Xung đột: mở 2 tab admin, xuất bản ở tab 1 rồi tab 2 -> "Trang vừa được xuất bản từ nơi khác…", không ghi đè.
8. Hết phiên: thu hồi token trên GitHub khi đang mở admin -> Xuất bản -> về Login/Kết nối, toast "Phiên đã hết…", nháp còn.
9. Đổi theme khi đã chỉnh font -> dialog "Giữ phần tôi đã chỉnh" giữ font.
10. Đo thời gian "Đang mã hoá…/Đang mở khoá…" trên điện thoại cũ (nếu > 1 s thì cân nhắc Web Worker).

## 8. Rủi ro

- **Token trong sessionStorage/bộ nhớ** dễ bị lộ nếu có XSS; giảm thiểu: CSP admin `script-src 'self'` (e2e xác nhận 0 vi phạm), không `innerHTML`, `textContent`/Preact escape.
- **Safari ITP xoá IndexedDB sau 7 ngày** không tương tác -> mất nháp; đã gọi `navigator.storage.persist()`, có nút tải nháp. Ảnh nháp chỉ ở máy đó.
- Repo lớn dần theo số lần thay ảnh; tree `recursive` bị cắt (>100k mục) -> admin báo lỗi (không xảy ra với 1 thiệp).
- Rate limit GitHub (5000 req/giờ cho token) đủ dùng; mỗi publish ~8 + số ảnh mới request.
- Preview tải lại khung cho mỗi thay đổi (debounce 150ms, gộp khi đang tải): trên máy yếu/dev server chậm có thể trễ ~0.3-1 s.
- `dist/` +900 KB font cho preview (không ảnh hưởng khách, tăng dung lượng deploy).
- File > 200 dòng cần người review kỹ: `src/admin/editor/editor.tsx`, `state/store.ts`, `storage/github.ts`, `media/image-slot.tsx`, `editor/preview.tsx`, `editor/routes/theme.tsx`, `editor/routes/backup.tsx`, `admin.css`, `tests/github-adapter.test.ts`.
- ui-ux-designer chưa duyệt UX admin; poster kiểu mở + ảnh minh hoạ các bước tạo token (8.2b) chưa có.
