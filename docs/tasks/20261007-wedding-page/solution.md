# Solution - 20261007-wedding-page

> Phase: giải pháp đã qua Cổng 1 và Vòng 2, CHƯA code. **Revision 3 (2026-10-07)**: đồng bộ với [`decisions.md`](./decisions.md) (Cổng 1, Bổ sung, Vòng 2, Stack FE) và [`design.md`](./design.md) **v3** (12 theme 1.6, 17 kiểu mở 3.4/3.4b, hạt nền/burst 5.7, reveal 5.8, micro 5.9, ma trận 5.10, admin 8.2/8.2b/8.7-8.13, Phụ lục B).
> Thứ tự ưu tiên khi lệch nhau: `decisions.md` > `solution.md` (kiến trúc, schema, contract) > `design.md` (visual/UX). Điểm chưa chốt nằm ở mục **Còn mở** cuối file.
> **Stack Angular/Spring/Oracle trong CLAUDE.md global KHÔNG áp dụng** (decisions, "Quyết định stack FE"). Đây là webapp tĩnh, không backend, không DB.
> Tham khảo (chỉ đọc, không sửa): dự án cũ `E:\claudecode\wedding-site\` (`data/config.js`, `assets/js/main.js`, `assets/js/effects.js`, `assets/css/style.css`, `_redirects`, `404.html`, `docs/google-apps-script.gs`). Theme/animation cũ chỉ để tham khảo (decisions, "Bổ sung").

---

## 📋 Tóm tắt yêu cầu

Xây dựng site tĩnh `wedding-page` gồm 2 ứng dụng: (1) **Guest app** - thiệp cưới mobile-first, mở đầu bằng màn cover hiển thị tên khách lấy từ `?to=` (hoặc `/invite/<slug>`), chạm để mở (17 kiểu mở) vào landing nhiều section (bật/tắt + sắp xếp được), nhạc nền, thư viện 12 theme trọn gói, hạt nền cả trang, burst, reveal, micro-interaction theo 4 cấp cường độ; (2) **Admin app** (Preact, dùng được trên mobile) - chỉnh toàn bộ cấu hình với live preview + "Phát lại" hiệu ứng, xuất bản bằng 1 commit vào GitHub repo private (Git Data API), Cloudflare Pages tự build/deploy, giữ 1 bản backup cả trang của lần publish gần nhất và khôi phục kiểu hoán đổi.

Toàn bộ nội dung điều khiển bởi **một file `config.json`** có `schemaVersion`. Dữ liệu theme preset nằm trong code; config chỉ lưu `theme.preset` và những phần admin tự chỉnh (giá trị đặc biệt `"theme"` = theo theme). RSVP + lời chúc lưu ở Google Sheet qua Google Apps Script.

### Stack đã chốt (decisions, "Quyết định stack FE")

| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Build tool | **Vite** multi-page (`index.html` + `admin/index.html`) | Build ra static thuần; plugin inject config/theme/OG/preload; dev-save middleware |
| Ngôn ngữ | **TypeScript** (strict) | Type `WeddingConfig`, `ThemePreset`, `ResolvedTheme` dùng chung guest/admin |
| Guest app | **Vanilla TS + CSS custom properties + CSS transitions/WAAPI + 1 canvas `ParticleField`** | Không framework, không thư viện animation (không GSAP/Lottie/tsParticles) |
| Admin app | **Preact + TS**, form sinh từ schema metadata | Không Angular |
| Validate | `valibot` - chỉ trong admin | Guest chỉ migrate + merge defaults + resolve theme |
| Live preview | `<iframe src="/?preview=1">` + `postMessage` | Cùng code guest, preview giống 100% |
| Font guest | **Tự host woff2** (`@fontsource/*`, subset latin + latin-ext + vietnamese) | Mục 9.3 |
| Hosting | **Cloudflare Pages**, repo GitHub **private**, `*.pages.dev` trước | decisions |
| Lưu trữ admin | **Phương án A (GitHub)** + B (dev server local) + Download fallback | decisions |
| RSVP/Guestbook | **Google Sheet + Apps Script** | decisions |
| Test | `vitest` (unit), Playwright (smoke viewport mobile), `size-limit` (ngân sách bundle) | Bổ sung lệnh vào CLAUDE.md của dự án |

---

## 🔍 Phân tích

### Tái sử dụng từ dự án cũ (`E:\claudecode\wedding-site\`)
- `data/config.js` - nguồn cho **migrator v0 -> v1** (import file cũ).
- `assets/js/main.js` - logic `slugToName()` / `getGuestNameFromURL()`, lightbox, countdown, guestbook local + remote.
- `assets/js/effects.js` - ý tưởng petals/scrollReveal/coverUnlock/autoScroll (viết lại thành `ParticleField` + `EffectRegistry`).
- `assets/css/style.css` - token màu `tram-vang`, `hong-phan`, `xanh-ngoc` (tham khảo, preset mới theo design 1.6.2).
- `docs/google-apps-script.gs` - mở rộng thành `apps-script/Code.gs` (thêm RSVP, ping).
- `_redirects`, `404.html` - rule rewrite `/invite/*`.

### Cần tạo mới
- Dự án Vite + TS; `src/shared` (types, defaults, migrations, merge, **theme registry 12 preset + resolver + derive OKLCH sáng/tối**, font registry 28 family, guest-name, VietQR, ics, capabilities).
- Guest: section registry 14 section; cover + **17 module kiểu mở** (dynamic import); `EffectRegistry`; `ParticleField` (21 loại hạt, 6 burst); reveal engine (12 kiểu nguyên tử, 6 gói); micro-interaction (5.9); floating UI.
- Admin: Kết nối lần đầu + vault, StorageAdapter (GitHub/Dev/Download), nháp IndexedDB, form editor, gallery theme (8.12), trình chọn hiệu ứng + Phát lại (8.13), sections, preview, ImageSlot + pipeline, audio, link generator, backup/restore, export/import, checklist.
- Vite plugins: `inject-config-og` (build), `dev-admin-save` (chỉ `vite dev`), script kiểm tra ngân sách bundle.
- Asset: 11 ornament sprite SVG, sprite 21 loại hạt (SVG string), asset riêng của kiểu mở (flower-gate WebP, wax-seal SVG...).

### Rủi ro / edge case chính
- Bảo mật admin trên site tĩnh (mục 2); token fine-grained hết hạn trước ngày cưới.
- Khối lượng hiệu ứng lớn (12 theme × 17 kiểu mở × 21 hạt) dễ phình bundle -> code-split theo lựa chọn (mục 9.1).
- Hạt nền **cả trang** (mặc định) có thể che chữ/form và tốn pin -> 4 lớp bảo vệ của design 5.7.
- Theme tối `dem-nhung` có trong bản đầu -> derive phải hỗ trợ `mode: dark` ngay từ v1.
- Cache CDN/webview Zalo với ảnh ghi đè -> tên file có hash.
- OG meta tĩnh, crawler không chạy JS -> inject lúc build.
- Autoplay nhạc bị chặn (iOS, in-app browser) -> `play()` trong handler chạm.
- Unicode NFD từ macOS/iOS -> normalize NFC; `split-chars` phải tách theo grapheme.
- Safari không encode WebP qua canvas -> fallback JPEG; HEIC; EXIF orientation/GPS.
- Safari xoá IndexedDB của site không tương tác sau 7 ngày (ITP) -> nháp có thể mất (mục 3.3).
- VietQR client-side phải đúng chuẩn EMVCo/NAPAS -> test bằng app ngân hàng thật ở v1.
- Font script với dấu chồng -> chỉ font trong whitelist design 2.3 + 2.3b, test chuỗi mẫu cho từng theme.

---

## 🏗️ Giải pháp

### 1. Lưu trữ và xuất bản (đã chốt: Phương án A + B phụ)

- Admin (trình duyệt) gọi GitHub REST API (**Git Data API**) để ghi `config.json` + ảnh + nhạc + backup vào repo private trong **một commit**; Cloudflare Pages tự build (plugin inject) và deploy, trễ 30-90 giây.
- Admin UI nói chuyện qua interface `StorageAdapter` với 3 implementation:
  - `GitHubAdapter` (production, mặc định).
  - `DevServerAdapter` (chỉ khi `vite dev`: POST `/__admin/*` ghi vào `public/content/` và `backup/`) - phương án B, cùng logic manifest.
  - `DownloadAdapter` ("Chế độ không kết nối" của design 8.2b: xuất zip `config.json` + asset để tự commit).
- Chỉ báo "đã lên trang": admin ghi `publish.id` (uuid) vào config; sau commit, admin poll `https://<site>/content/config.json?ts=...` mỗi 10 giây (tối đa 5 phút) tới khi `publish.id` khớp -> "Khách đã thấy bản mới". Sau restore thì đợi `publish.id` của bản vừa khôi phục.

### 2. Bảo mật admin, Kết nối lần đầu, vault

#### 2.1 Nguyên tắc
- Mọi password hardcode trong code hoặc env build (`VITE_*`) đều **lộ công khai**. Lớp bảo mật thật là **quyền ghi vào repo** (token).
- Không bao giờ đưa token/passphrase vào code, repo, env, tài liệu, log.
- Render mọi chuỗi từ config/URL/guestbook bằng `textContent`; CSP chặt (Lưu ý kỹ thuật); link trong config chỉ nhận `https:`/`tel:`.
- Tuỳ chọn thêm: **Cloudflare Access** chặn `/admin/*` (email OTP). `X-Robots-Tag: noindex` cho `/admin/*`.

#### 2.2 Quyền tối thiểu của fine-grained PAT (README + bước ① màn 8.2b)
| Thiết lập | Giá trị |
|---|---|
| Loại | Fine-grained personal access token (tiền tố `github_pat_`) |
| Repository access | **Only select repositories** -> đúng 1 repo của thiệp |
| Repository permissions | **Contents: Read and write**; **Metadata: Read-only** (GitHub bắt buộc, tự bật). Không cấp quyền nào khác |
| Account permissions | Không |
| Expiration | Sau ngày cưới **≥ 1 tháng** (design gợi ý ví dụ 12/01/2027 cho cưới 12/12/2026) |

Token classic (`ghp_`) vẫn cho dùng nhưng hiện cảnh báo vàng (design 8.2b).

#### 2.3 Màn "Kết nối lần đầu" (design 8.2b) - kiểm tra kết nối
Nút "Kiểm tra kết nối" chạy **tuần tự**, mỗi bước cập nhật 1 dòng kết quả (◌/✓/✕) trong vùng `aria-live`. Header chung: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`. Tiền xử lý: `trim()` token; ô owner nhận link `https://github.com/<owner>/<repo>` thì tự tách.

| # | Dòng kết quả | API | Đạt khi | Lỗi -> thông điệp (design 8.2b) |
|---|---|---|---|---|
| 1 | Token hợp lệ + Tìm thấy repo | `GET /repos/{owner}/{repo}` | 200 | 401 -> "Token không đúng..." (hoặc "Token đã hết hạn ngày X" nếu vault có `expiresAt` đã qua); 404 -> "Không thấy repo..." (repo sai **hoặc** token chưa được cấp quyền repo này); 403 rate limit -> xem 2.5 |
| 2 | Có nhánh | `GET /repos/{owner}/{repo}/branches/{branch}` | 200 | 404 -> gọi `GET /repos/{owner}/{repo}/branches?per_page=20` để hiện "Các nhánh hiện có: ..." + chip chọn nhanh. Repo rỗng (0 nhánh) -> "Repo đang trống, hãy tạo commit đầu tiên (đẩy mã nguồn dự án) rồi thử lại" |
| 3 | Có quyền ghi | `POST /repos/{owner}/{repo}/git/blobs` body `{"content":"wp-connect-check","encoding":"utf-8"}` | 201 | 403/404 -> "Token chỉ có quyền đọc. Cần bật Contents: Read and write."; 409 -> repo rỗng (như dòng 2) |
| 4 | Hạn token | header `github-authentication-token-expiration` của bước 1 | có header, hạn > ngày cưới | Không có header = token không hết hạn (chỉ báo "Không có hạn"). Cảnh báo vàng, **không chặn** (2.6) |

- **Vì sao bước 3 là ghi thử blob**: với fine-grained token, `permissions.push` trong response repo phản ánh quyền của **user** trên repo, không phải quyền của **token**, nên không tin được. Blob không được ref nào trỏ tới là vô hại (GitHub tự dọn).
- Sau bước 4: nếu repo đã có `public/content/config.json` thì đọc để lấy ngày sự kiện chính (`events.mainEventId` -> `startAt`) phục vụ so sánh hạn token; chưa có config thì chỉ cảnh báo theo quy tắc < 14 ngày.
- Sửa bất kỳ ô nào ở bước ② -> xoá kết quả cũ. Nút "Lưu và vào trang quản lý" chỉ sáng khi 1-3 đều ✓.
- Owner/repo/branch (không bí mật) lưu `localStorage` `wp_admin_conn_v1` để điền sẵn.

#### 2.4 Vault: mã hoá token bằng passphrase (WebCrypto)
| Tham số | Giá trị |
|---|---|
| KDF | **PBKDF2-HMAC-SHA-256, 600.000 vòng** (khuyến nghị OWASP hiện hành), salt ngẫu nhiên 16 byte (`crypto.getRandomValues`) |
| Khoá | AES-GCM 256-bit, `extractable: false`, `usages: ['encrypt','decrypt']` |
| Mã hoá | AES-GCM, IV ngẫu nhiên 12 byte mỗi lần mã hoá, tag 128-bit, `additionalData` = UTF-8 của `"{owner}/{repo}"` (gắn ciphertext với repo) |
| Lưu ở | `localStorage` key `wp_admin_vault_v1`: `{ "v":1, "kdf":"PBKDF2-SHA256", "iter":600000, "salt":"<b64>", "iv":"<b64>", "ct":"<b64>", "owner":"...", "repo":"...", "branch":"main", "expiresAt":"2027-01-12T00:00:00+07:00" \| null, "createdAt":"ISO" }` |
| Passphrase | ≥ 8 ký tự, nhập 2 lần; chỉ báo độ mạnh dạng chữ (design 8.2b). Không lưu passphrase ở đâu |
| Thời gian | Trên điện thoại cũ 0.5-1 giây -> UI "Đang mã hoá…"/"Đang mở khoá…". Chạy trong Web Worker nếu main thread bị chặn > 300 ms (đo ở v2) |

- Giải mã thất bại (`OperationError`) = **sai passphrase**. 5 lần sai -> khoá tạm 30 giây có đếm ngược (chỉ là UX phía client, không phải bảo mật thật).
- Không tick "Ghi nhớ": token chỉ ở **bộ nhớ + `sessionStorage`** (mất khi đóng tab). Có tick: sau khi mở khoá, token giữ trong bộ nhớ + `sessionStorage` của tab đó.
- Đăng xuất: xoá token khỏi bộ nhớ/`sessionStorage` (giữ vault). "Quên passphrase? Kết nối lại": xoá vault (giữ conn + nháp) -> màn 8.2b.
- Luồng màn hình: có vault -> **Login** (8.2: 1 ô passphrase) -> giải mã -> chạy lại bước 1 + 4 của 2.3 (bỏ bước ghi thử để nhanh). 401/403 -> sang 8.2b với thông báo tương ứng, giữ sẵn owner/repo/branch. Không có vault -> thẳng 8.2b.

#### 2.5 Bảng xử lý lỗi GitHub (dùng chung cho kết nối, login, publish, restore)
| Tình huống | Nhận biết | Xử lý |
|---|---|---|
| Token sai / hết hạn | `401` | Kết nối: thông điệp 8.2b. Đang làm việc: về Login (hoặc 8.2b nếu không có vault), **giữ nháp**, toast "Phiên đã hết..." |
| Thiếu quyền ghi | `403` không kèm rate-limit header, hoặc `404` trên endpoint ghi | "Token chỉ có quyền đọc..." |
| Không thấy repo/nhánh | `404` | Thông điệp 8.2b; nhánh thì liệt kê nhánh hiện có |
| Repo rỗng | `409` từ `/git/*` ("Git Repository is empty") | "Repo đang trống..." (2.3) |
| Xung đột publish/restore | `PATCH .../git/refs` trả `422` ("not a fast forward") hoặc `409` | "Trang vừa được xuất bản từ nơi khác. Tải lại để xem bản mới nhất" + [Tải lại]. Không tự ghi đè. Nháp giữ nguyên |
| Rate limit chính | `403`/`429` + `x-ratelimit-remaining: 0` | Đọc `x-ratelimit-reset` (epoch) -> "GitHub tạm giới hạn, thử lại sau khoảng {n} phút" + nút Thử lại có đếm ngược |
| Rate limit phụ (secondary) | `403`/`429` + header `retry-after` | Chờ `retry-after` giây, tự thử lại tối đa 2 lần (backoff), sau đó báo như trên |
| Offline / mạng | `fetch` ném `TypeError` hoặc `navigator.onLine === false` | "Không kết nối được tới GitHub. Kiểm tra mạng rồi thử lại" + Thử lại; nghe sự kiện `online` để bật lại nút |
| 5xx | `500/502/503` | Thử lại 1 lần sau 2 giây, rồi báo lỗi chung kèm "Tải file cấu hình về máy" |

Mọi thông điệp dịch sang câu dễ hiểu, mã thô chỉ nằm trong "Chi tiết kỹ thuật" thu gọn (design 8.2b, 8.8).

#### 2.6 Cảnh báo token hết hạn trước ngày cưới
- Nguồn hạn: header `github-authentication-token-expiration` (định dạng `YYYY-MM-DD HH:mm:ss ±hhmm`) ở mọi response; lưu vào vault `expiresAt` và cập nhật mỗi lần mở khoá.
- Ngày cưới = `startAt` của `events.mainEventId` (fallback: `countdown.targetAt`).
- Cảnh báo vàng (không chặn) khi: hạn < ngày cưới, **hoặc** còn < 14 ngày. Hiện ở 8.2b (dòng kết quả 4), banner trên Tổng quan, và trong checklist trước xuất bản (cảnh báo nhẹ). Nút "Tạo token mới ↗" mở trang tạo token; dán token mới ở 8.2b (vault cũ bị thay).

### 3. Dữ liệu (không có DB)

#### 3.1 Vị trí lưu
| Dữ liệu | Vị trí | Deploy | Ghi bởi |
|---|---|---|---|
| Config đang chạy | `public/content/config.json` (+ inline vào `index.html` lúc build) | Có | Admin publish/restore |
| Ảnh | `public/content/images/<slot>/<name>.<hash8>.<ext>` | Có, cache immutable | Admin publish/restore |
| Nhạc | `public/content/audio/<name>.<hash8>.<mp3/m4a>` | Có | Admin publish/restore |
| Backup 1 bản (cả trang) | `backup/manifest.json` + `backup/files/...` | **Không** | Admin publish/restore |
| RSVP / Guestbook | Google Sheet (Apps Script) | - | Khách |
| **Nháp config** | **IndexedDB** `wp-admin` store `draft` | - | Admin |
| **Ảnh/nhạc nháp chưa publish, ảnh lấy từ backup** | **IndexedDB** `wp-admin` store `blobs` | - | Admin |
| Vault token | `localStorage` `wp_admin_vault_v1` (ciphertext) | - | Admin |
| Owner/repo/branch | `localStorage` `wp_admin_conn_v1` | - | Admin |
| Danh sách khách + lựa chọn "Mã hoá link" | `localStorage` `wp_admin_guests_v1` + export CSV | **Không lên repo** | Admin |

**Tên file có hash** (`hero.3f9a1c2e.webp`): "ghi đè ảnh" hiểu theo **slot** - slot nhận file mới, file cũ chuyển vào backup và xoá khỏi `public/`. Cho phép `Cache-Control: immutable`.

#### 3.2 IndexedDB `wp-admin` (version 1)
| Store | Key | Value |
|---|---|---|
| `draft` | `"current"` | `{ config: WeddingConfig, baseCommit: "<sha nhánh lúc tải>", basePublishId: "...", updatedAt: "ISO", changeCount: 3 }` |
| `blobs` | SHA-256 hex của file | `{ blob: Blob, mime, slot, origin: "upload" \| "backup", createdAt }` |
| `published` | `"current"` | Bản config đang xuất bản (snapshot lúc tải/sau publish) - nguồn cho "Hoàn tác thay đổi nháp", "Hoàn tác tất cả", diff |

- Autosave nháp debounce 800 ms (design 8.8). Undo/redo stack (nút "Hoàn tác" top bar) chỉ trong **bộ nhớ phiên**, tối đa 50 bước.
- Ảnh trong nháp trỏ `src` tới đường dẫn có hash cuối cùng (`content/images/hero/hero.<hash8>.webp`); preview map đường dẫn đó sang `blob:` URL từ store `blobs`.
- Gọi `navigator.storage.persist()` khi vào admin (giảm nguy cơ bị trình duyệt xoá). GC store `blobs`: xoá blob không còn được nháp tham chiếu sau mỗi publish thành công / Hoàn tác tất cả.
- Khi mở admin: nếu `draft.baseCommit` khác SHA nhánh hiện tại và nháp có thay đổi -> hỏi "Tiếp tục nháp / Dùng bản đang xuất bản" (design 8.8).

#### 3.3 Backup manifest
```json
{
  "schema": 1,
  "createdAt": "2026-10-07T10:15:00+07:00",
  "reason": "publish",
  "publishId": "4b1f...",
  "restoredPublishId": null,
  "fromCommit": "a1b2c3d",
  "files": [
    { "path": "public/content/config.json", "backupPath": "backup/files/public/content/config.json", "existed": true },
    { "path": "public/content/images/hero/hero.3f9a1c2e.webp", "backupPath": "backup/files/public/content/images/hero/hero.3f9a1c2e.webp", "existed": true, "slot": "content.hero.image" },
    { "path": "public/content/images/hero/hero.77ab01de.webp", "backupPath": null, "existed": false, "slot": "content.hero.image" }
  ]
}
```
- `existed: true` = file có ở trạng thái trước và đã được chép vào `backupPath`; `existed: false` = file do lần publish gần nhất tạo ra (khôi phục thì xoá).
- `slot` = đường dẫn field trong config (album: `content.album.images[<index>]` kèm `"imageKey": "<hash8>"` để không lệ thuộc thứ tự).
- Chỉ giữ **1 bản**: mỗi publish/restore ghi đè manifest và xoá các file trong `backup/files/` không còn được manifest mới tham chiếu.

#### 3.4 Bốn thao tác "quay lại" (khớp bảng design 8.7)
| Thao tác | Ở đâu | Phạm vi | Ghi lên site ngay? | Cơ chế | Đảo ngược |
|---|---|---|---|---|---|
| **Hoàn tác thay đổi nháp** | ImageSlot | 1 slot | Không | `draft.config[slot] = published.config[slot]`; blob nháp giữ tới GC | Toast [Làm lại] 5 s (khôi phục giá trị nháp trước đó từ bộ nhớ) |
| **Lấy lại ảnh trước đó** | ImageSlot; chỉ hiện khi manifest có mục `existed: true` cho slot | 1 slot | Không, có hiệu lực khi Xuất bản | Đọc `ImageRef` của slot trong `backup/files/public/content/config.json` (metadata w/h/alt/lqip) + tải blob qua `GET /git/blobs/{sha}` (sha lấy từ tree, 3.5) -> lưu `blobs` (`origin: "backup"`) -> gán vào nháp | "Hoàn tác thay đổi nháp" |
| **Hoàn tác tất cả** | Top bar (8.8) | Toàn bộ nháp | Không | `draft = published`, GC blob; dialog xác nhận (không đảo ngược) | Không |
| **Khôi phục bản xuất bản trước** | Sao lưu/Khôi phục (8.10) | Cả trang: config + mọi ảnh/nhạc | **Có**, 1 commit | **Swap** backup <-> hiện tại (3.5) | **Bấm lại = làm lại** (swap lần nữa) |

**Nháp sau khi Khôi phục** (design 8.10, đã chốt theo giả định design): nếu còn nháp chưa xuất bản, dialog bước 2 cảnh báo và có nút **[Tải nháp về máy (.json)]** (export `draft.config`; blob ảnh nháp vẫn giữ trong IndexedDB tới lần publish thành công kế tiếp, nên import lại file .json trên cùng máy sẽ có đủ ảnh). Sau khi restore commit thành công: `published = config vừa khôi phục`, `draft = published`, `baseCommit = commit mới`, xoá undo stack.

#### 3.5 Luồng Git Data API cho Publish và Restore
Mọi lần đọc đều **cố định tại 1 commit** để nhất quán:
1. `GET /repos/{o}/{r}/git/ref/heads/{branch}` -> `headSha`.
2. `GET /repos/{o}/{r}/git/commits/{headSha}` -> `treeSha`.
3. `GET /repos/{o}/{r}/git/trees/{treeSha}?recursive=1` -> bảng `path -> blob sha` (dùng cho `public/content/**` và `backup/**`).
4. Đọc `public/content/config.json` và `backup/manifest.json` bằng `GET /git/blobs/{sha}` (base64).

**Publish** (1 commit):
1. Validate + checklist + diff + dialog xác nhận (design 8.8 v3).
2. Tính tập file thay đổi: config mới; ảnh/nhạc mới (blob trong IndexedDB); ảnh/nhạc bị bỏ khỏi config.
3. `POST /git/blobs` chỉ cho **file mới thật sự** (ảnh/nhạc base64, `config.json`, `manifest.json`); ảnh lấy từ backup đã có sha trong tree -> **tái dùng sha, không upload lại**. Tiến trình "Đang tải 3/7 tệp…".
4. `POST /git/trees` với `base_tree = treeSha`, các entry:
   - `backup/files/<path>` -> sha **hiện tại** của mỗi file sắp bị thay/xoá (copy bằng sha, không tải xuống).
   - `<path>` mới -> sha blob mới; `<path>` bị bỏ -> `sha: null`.
   - `backup/manifest.json` -> manifest mới (`reason: "publish"`).
   - `backup/files/*` cũ không còn được tham chiếu -> `sha: null`.
5. `POST /git/commits` (`message: "admin: publish 2026-10-07 10:15"`, `parents: [headSha]`, `tree`).
6. `PATCH /git/refs/heads/{branch}` `{ sha, force: false }`; `422/409` -> xung đột (2.5).
7. Cập nhật `published`, `draft`, GC blobs; poll `publish.id`.

**Restore = swap** (1 commit, không upload ảnh):
1. Đọc tree + manifest như trên. Manifest rỗng -> nút disabled ("Chưa có bản sao lưu").
2. Với mỗi mục manifest:
   - `existed: true`: `<path>` <- sha của `backupPath`; nếu `<path>` hiện có thì `backupPath` <- sha hiện tại (mục mới `existed: true`), nếu hiện không có thì xoá `backupPath`, mục mới `existed: false`.
   - `existed: false`: `<path>` hiện có -> chép sha sang `backup/files/<path>` (mục mới `existed: true`), xoá `<path>`.
3. Manifest mới `reason: "restore"`, `restoredPublishId = publishId` của config vừa khôi phục; upload manifest (blob nhỏ duy nhất).
4. Tree -> commit (`admin: restore <thời điểm>`) -> PATCH ref `force: false`.
5. Áp dụng 3.4 "Nháp sau khi Khôi phục"; poll `publish.id` của config vừa khôi phục.
- Bấm lại = chạy đúng thuật toán trên với manifest mới -> về trạng thái trước khi khôi phục (redo). Unit test: restore 2 lần = tree ban đầu (bỏ qua manifest).
- `DevServerAdapter` dùng cùng thuật toán trên file system local (copy file thay vì sha).

### 4. Contract

#### 4.1 GitHub API (`GitHubAdapter`; base `https://api.github.com`)
| Method | Path | Mục đích |
|---|---|---|
| GET | `/repos/{owner}/{repo}` | Kết nối bước 1; header hạn token |
| GET | `/repos/{owner}/{repo}/branches/{branch}` · `/branches?per_page=20` | Kết nối bước 2 |
| GET | `/repos/{owner}/{repo}/git/ref/heads/{branch}` | SHA đầu nhánh (optimistic lock) |
| GET | `/repos/{owner}/{repo}/git/commits/{sha}` | Lấy tree sha |
| GET | `/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1` | Bảng path -> sha |
| GET | `/repos/{owner}/{repo}/git/blobs/{sha}` | Đọc config, manifest, ảnh backup (thumbnail 8.10, "Lấy lại ảnh") |
| POST | `/repos/{owner}/{repo}/git/blobs` | Ghi thử (kết nối bước 3); upload file mới |
| POST | `/repos/{owner}/{repo}/git/trees` | Tree mới với `base_tree` (xoá = `sha: null`) |
| POST | `/repos/{owner}/{repo}/git/commits` | Commit publish/restore |
| PATCH | `/repos/{owner}/{repo}/git/refs/heads/{branch}` | Cập nhật nhánh, `force: false` |

Lỗi: bảng 2.5.

#### 4.2 `StorageAdapter`
```ts
interface StorageAdapter {
  kind: 'github' | 'dev' | 'download';
  connect(c?: { owner: string; repo: string; branch: string; token: string }): Promise<ConnectReport>; // từng dòng kết quả 2.3
  loadSnapshot(): Promise<{ commit: string; config: unknown; manifest: BackupManifest | null; paths: Record<string, string /* sha */> }>;
  readAsset(path: string): Promise<Blob>;           // path trong public/ hoặc backup/
  publish(change: { config: WeddingConfig; uploads: PendingUpload[]; deletes: string[]; baseCommit: string },
          onProgress?: (done: number, total: number) => void): Promise<{ commit: string; publishId: string }>;
  restoreLastBackup(baseCommit: string): Promise<{ commit: string; restoredPublishId: string }>;
}
type ConnectReport = { steps: { id: 'token-repo' | 'branch' | 'write' | 'expiry'; status: 'ok' | 'warn' | 'error'; message: string; detail?: string }[]; expiresAt: string | null; branches?: string[] };
```

#### 4.3 Preview `postMessage` (admin <-> iframe guest, cùng origin)
Admin -> guest:
```json
{ "type": "wp:preview-config", "config": { "...": "WeddingConfig" },
  "assets": { "content/images/hero/hero.77ab01de.webp": "blob:https://site/abcd" },
  "options": { "skipCover": false, "replayCover": false, "muteMusic": true, "scrollTo": "events", "guestName": "Gia đình anh Mạnh", "highlight": "events" } }
```
```json
{ "type": "fx:replay", "target": "cover", "speed": 0.5, "simulate": { "lowEnd": false, "reducedMotion": false } }
```
`target`: `cover` | `burst` | `particles` | `reveal` | `micro:<mã>` (design 8.13).

Guest -> admin: `{ "type": "wp:preview-ready" }`, `{ "type": "wp:preview-error", "message": "..." }`, `{ "type": "fx:done", "target": "cover" }`.

- Guest chỉ nghe khi URL có `?preview=1` **và** `event.origin === location.origin`. Admin debounce **150 ms**.
- `speed` -> `EffectRegistry.setTimeScale()`; `simulate.lowEnd` ép hạ cấp 1 bậc + nhánh máy yếu; `simulate.reducedMotion` ép nhánh `prefers-reduced-motion`.
- Preview chạy hiệu ứng thành công giả cho guestbook/RSVP (không gọi Apps Script).

#### 4.4 Google Apps Script - `config.integrations.appsScriptUrl`
| Method | Query/Body | Mô tả |
|---|---|---|
| GET | `?action=ping` | Admin "Kiểm tra kết nối": `{ "ok": true, "version": 1 }` |
| GET | `?action=guestbook&limit=50&before=<ISO>` | Lời chúc chưa ẩn (cột `hidden` != TRUE), mới nhất trước |
| POST | `{ "action": "guestbook", "name": "...", "message": "...", "hp": "" }` | Gửi lời chúc |
| POST | `{ "action": "rsvp", "submissionId": "uuid", "name": "...", "guestLabel": "Gia đình anh Mạnh", "attending": true, "count": 2, "eventIds": ["thanh-hon"], "note": "...", "hp": "" }` | Gửi/sửa RSVP |

- Response: `{ "ok": true }` / `{ "ok": false, "error": "VALIDATION" | "RATE_LIMIT" | "SERVER" }`; GET guestbook: `{ "ok": true, "items": [{ "name": "...", "message": "...", "createdAt": "ISO" }], "hasMore": true }`.
- POST dùng `Content-Type: text/plain` (tránh preflight CORS - Apps Script không trả lời OPTIONS).
- `submissionId` sinh ở client, lưu `localStorage` cùng trạng thái RSVP; gửi lại cùng id -> script **cập nhật dòng cũ**.
- Server: `hp` honeypot; `name` 2-60, `message` 2-300, `note` ≤ 300, `count` 1-20; rate-limit `CacheService`; `LockService` khi ghi. Guestbook hiện ngay, ẩn bằng cột `hidden`. Deploy: Web app, Execute as Me, Access: Anyone.

### 5. Config schema v1

#### 5.1 Định dạng, fallback, versioning
- **JSON** (`public/content/config.json`), không dùng `window.CONFIG = ...` (chống code-injection).
- Build inline: plugin nhúng `<script type="application/json" id="wp-config">` **và** `<script type="application/json" id="wp-resolved">` (ResolvedTheme, 5.3) vào `index.html`; thiếu thì `fetch('content/config.json', { cache: 'no-cache' })` + resolve runtime (lazy import registry).
- `effective = deepMerge(DEFAULT_CONFIG, migrate(raw))` - object merge sâu, **mảng thay thế**. Giá trị enum không hợp lệ -> về mặc định + `console.warn`. Section thiếu dữ liệu tối thiểu **tự ẩn**. JSON hỏng -> màn lỗi design 3.6.
- `schemaVersion: 1`; `src/shared/config/migrations.ts` chạy tuần tự. Không có `schemaVersion` = v0 (`config.js` cũ).
- Mọi string nhập từ admin `normalize('NFC')`.
- Ngày giờ: ISO 8601 có offset `+07:00` cho logic. Text hiển thị (`displayDate`, `lunarText`) là chuỗi tự do. **Âm lịch nhập tay**, không có nút "Tự tính".
- Asset path tương đối với gốc site, resolve qua `import.meta.env.BASE_URL`.
- **Giá trị đặc biệt `"theme"`** (hoặc vắng mặt) ở các field thành phần theme = theo gói của `theme.preset` (design 1.6.1). Với `theme.primaryColor` dùng `null`, `theme.overrides` dùng `{}`, `effects.reveal.<vai trò>` dùng `null`.

#### 5.2 ThemePreset registry (trong code, không trong config)
File: `src/shared/theme/presets.ts` (chỉ dữ liệu, ~4 KB gzip, **guest không import tĩnh**; admin và preview import). Cấu trúc theo Phụ lục B design:
```ts
type ThemeId = 'tram-vang' | 'hong-phan' | 'luc-bao' | 'son-do' | 'muc-giay' | 'hoai-co'
             | 'sen-cham' | 'mau-nuoc' | 'dat-nung' | 'pastel-han' | 'dem-nhung' | 'bien-dao';
interface ThemePreset {
  id: ThemeId; name: string;                              // "Trầm Vàng"
  tags: ('co-dien' | 'truyen-thong' | 'hien-dai' | 'thien-nhien' | 'toi')[];  // chip lọc 8.12
  mode: 'light' | 'dark';
  tokens: { primary; onPrimary; accent; accent2?; bg; surface; text; muted; line };  // hex; lineStrong = muted
  fonts: { heading: FontId; script: FontId; body: FontId };
  ornamentSet: OrnamentSet; texture: Texture; photoFrame: PhotoFrame; divider: Divider;
  suggest: { openStyle: OpenStyle; burstOnOpen: BurstOnOpen; particles: { types: ParticleType[]; color: 'theme' | 'multi' | string }; revealStyle: RevealStyle };
  densityFactor?: number;                                 // vd muc-giay, sen-cham 0.5 (design 1.6.4)
  hidden?: boolean;                                       // ẩn khỏi gallery; bản đầu không theme nào ẩn
}
```
Dữ liệu 12 preset lấy **nguyên văn** bảng design 1.6.2 (token), 1.6.4 (trọn gói), 1.6.3 (tương phản dùng làm expected value trong unit test). Token trạng thái: theme sáng `success #2E6B3F`, `danger #B3261E`; theme tối `#7BC59A`, `#F2A09A`.

**Resolver** `resolveTheme(config, preset): ResolvedTheme` (`src/shared/theme/resolve.ts`) - cùng 1 hàm chạy ở plugin build, preview runtime, admin:
| Thành phần | Quy tắc (giá trị config khác `"theme"` thì thắng) |
|---|---|
| Màu | `preset.tokens` -> nếu `primaryColor` != null thì `derive(primaryColor, preset.mode)` (5.2.1) -> áp `overrides` sau cùng |
| Font | field riêng (`fonts.heading`...) != `"theme"` -> dùng; ngược lại nếu `fonts.preset` != `"theme"` -> lấy từ font preset 5.4; ngược lại -> `preset.fonts` |
| `ornamentSet`, `texture`, `photoFrame`, `sections.divider` | config hoặc preset |
| `cover.openStyle` | config hoặc `preset.suggest.openStyle` (Trầm Vàng -> `envelope`) |
| `effects.burst.onOpen` | config hoặc `preset.suggest.burstOnOpen` (Trầm Vàng -> `petals`) |
| `effects.particles.types/color` | config hoặc `preset.suggest.particles` |
| `effects.reveal.style` | config hoặc `preset.suggest.revealStyle` (Trầm Vàng -> `soft`); vai trò riêng `heading/block/image/ornament` != null thì đè gói |
| Capabilities | giá trị chưa có module trong phiên bản hiện tại (theo `src/shared/capabilities.ts`, mục Kế hoạch) -> fallback đã khai báo + `console.warn`; admin ẩn lựa chọn chưa có |

**Quy tắc đổi theme (Q17, đã chốt "chỉ thay phần Theo theme")**: đổi `theme.preset` **chỉ** ghi field `theme.preset`; mọi field đang `"theme"`/`null`/`{}` tự đổi theo qua resolver. Admin phát hiện "phần đã tự chỉnh" = nhóm có giá trị khác mặc định-theo-theme:
| Nhóm hiển thị (8.12) | Field |
|---|---|
| Màu sắc | `theme.primaryColor`, `theme.overrides` |
| Font chữ | `fonts.preset`, `fonts.heading`, `fonts.script`, `fonts.body` |
| Họa tiết / Texture / Khung ảnh / Divider | `theme.ornamentSet` / `theme.texture` / `theme.photoFrame` / `sections.divider` |
| Kiểu mở thiệp | `cover.openStyle` |
| Sau khi mở | `effects.burst.onOpen` |
| Hạt nền | `effects.particles.types`, `effects.particles.color` |
| Reveal | `effects.reveal.style` + 4 vai trò |

Có nhóm đã chỉnh -> dialog design 8.12: **[Giữ phần tôi đã chỉnh]** (mặc định: chỉ đổi `theme.preset`) / **[Dùng trọn gói]** (đặt các nhóm trên về `"theme"`/`null`/`{}`). Không có nhóm nào đã chỉnh -> đổi ngay + toast Hoàn tác. Field không thuộc theme (`intensity`, `particles.enabled/scope/wind`, `micro.*`, `fonts.scaleStep`...) không bị đụng tới.

##### 5.2.1 Suy màu từ `primaryColor` (`src/shared/theme/derive.ts`, design 1.4)
1. Không có `primaryColor` -> nguyên token preset.
2. Có P -> OKLCH (L, C, H).
   - `mode: light`: `bg = oklch(0.975, min(C*0.12, 0.012), H)`, `surface = oklch(0.995, min(C*0.06, 0.006), H)`, `text = oklch(0.24, min(C*0.35, 0.035), H)`, `muted = oklch(0.47, min(C*0.30, 0.040), H)`, `line = oklch(0.86, min(C*0.25, 0.030), H)`; accent (nếu `overrides.accent` không có) `= oklch(0.76, min(C*0.7, 0.10), H + 25°)`; primary: contrast(P, bg) < 4.5 thì **giảm** L từng bước 0.02.
   - `mode: dark` (`dem-nhung`): `bg L=0.17`, `surface L=0.21`, `text L=0.94`, `muted L=0.75`, `line L=0.32` (cùng công thức chroma); primary **tăng** L từng bước 0.02 tới ≥ 4.5.
3. P gốc giữ làm `--c-primary-decor`. `onPrimary`: light = `#FFFFFF` nếu contrast ≥ 4.5, ngược lại `text`; dark = `bg` nếu ≥ 4.5. `overlay`: light `rgba(text,.45)`, dark `rgba(bg,.55)`. Gamut-map về sRGB trước khi xuất hex.
4. `overrides` áp sau cùng. `lineStrong = muted` (viền input, WCAG 1.4.11).
5. JS thuần (không CSS relative-color). Đổi `primaryColor` không đổi `mode`.
6. Admin: badge "AA ✓ 5.2:1" / "Không đạt ✗"; cảnh báo vàng nhưng cho lưu; **text/bg < 4.5 chặn xuất bản** + nút "Tự sửa".
7. CSS variables: `--c-primary`, `--c-on-primary`, `--c-accent`, `--c-accent-2`, `--c-primary-decor`, `--c-bg`, `--c-surface`, `--c-text`, `--c-muted`, `--c-line`, `--c-line-strong`, `--c-overlay`, `--c-success`, `--c-danger`; cùng `--sp-*`, `--r-*`, `--fs-*`, `--dur-*`, `--ease-*`, `--z-*`, `--reveal-distance`, `--stagger` (design 1.5, 2.4, 5.1). `<html data-mode="dark">` cho nhánh shadow/QR/focus riêng của theme tối (design 1.6.3).

#### 5.3 ResolvedTheme (inline vào HTML)
```json
{ "preset": "tram-vang", "mode": "light",
  "tokens": { "primary": "#8A6A3B", "...": "..." },
  "fonts": { "heading": "playfair-display", "script": "great-vibes", "body": "be-vietnam-pro" },
  "ornamentSet": "classic-line", "texture": "paper", "photoFrame": "arch", "divider": "ornament",
  "openStyle": "envelope", "burstOnOpen": "petals",
  "particles": { "types": ["petal-rose"], "color": "theme", "densityFactor": 1 },
  "reveal": { "style": "soft", "heading": "fade-up", "block": "fade-up", "image": "photo-settle", "ornament": "svg-draw", "stagger": 80 } }
```
Guest runtime chỉ đọc object này (không cần registry); preview nhận config mới thì lazy-import `presets.ts` + `resolve.ts` + `derive.ts`.

#### 5.4 Font registry (design 2.3 + 2.3b)
| Vai trò | id (★ mặc định của `tram-vang`) | Tổng |
|---|---|---|
| heading | ★ `playfair-display`, `cormorant-garamond`, `lora`, `eb-garamond`, `prata`, `noto-serif-display`, `fraunces`, `newsreader`, `old-standard-tt` (400/700, heading dùng 400), `crimson-pro`, `spectral` | 11 |
| script | ★ `great-vibes`, `pinyon-script`, `alex-brush`, `dancing-script`, `allura`, `imperial-script`, `charm`, `birthstone` (≥ 40px), `moon-dance` (≥ 40px), `style-script` | 10 |
| body | ★ `be-vietnam-pro`, `mulish`, `quicksand`, `josefin-sans`, `lexend`, `manrope`, `nunito` | 7 |

| `fonts.preset` | Heading | Script | Body |
|---|---|---|---|
| `"theme"` ★ | theo cột Font của theme (design 1.6.4) | | |
| `co-dien` | playfair-display | great-vibes | be-vietnam-pro |
| `thanh-lich` | cormorant-garamond (500/600) | pinyon-script | mulish |
| `am-ap` | lora | dancing-script | quicksand |
| `bien-tap` | fraunces | alex-brush | be-vietnam-pro |
| `truyen-thong` | noto-serif-display | charm | be-vietnam-pro |

- Chọn font preset -> điền 3 field; sửa tay 1 field -> field đó khác `"theme"` (và `fonts.preset` vẫn giữ, field riêng thắng theo resolver).
- Mỗi family tối đa 2 weight: heading 500/600 + italic 400 (Old Standard TT: 400 + italic 400); body 400/600; script 400. Registry ghi `minPx` cho font cần cẩn trọng. Không cho nhập tên font tự do.
- `fonts.scaleStep`: -1 | 0 | 1 -> hệ số 0.92 / 1 / 1.08 vào `--fs-*`.
- Dropdown admin nhóm 2 tầng: "Gợi ý cho theme đang chọn" / "Tất cả" (design 2.3b).

#### 5.5 Schema v1 đầy đủ (giá trị mặc định)
Kiểu dùng chung:
```ts
type ImageRef = {
  src: string; w: number; h: number; alt: string;
  thumb?: string;                         // album: bản 600px
  focalPoint?: { x: number; y: number };  // 0..1
  dominantColor?: string;                 // "#a08870"
  lqip?: string;                          // data URI ~24px, chỉ hero/cover
  updatedAt?: string;                     // ISO
} | null;
type ThemeOr<T> = 'theme' | T;
```

```json
{
  "schemaVersion": 1,
  "publish": { "id": "", "at": "" },
  "meta": {
    "siteUrl": "https://<project>.pages.dev",
    "title": "Minh Anh & Thuỳ Linh · 12.12.2026",
    "description": "Trân trọng kính mời bạn đến chung vui...",
    "ogImage": null, "favicon": null, "locale": "vi_VN", "noindex": true
  },
  "theme": {
    "preset": "tram-vang",
    "primaryColor": null,
    "overrides": {},
    "ornamentSet": "theme",
    "texture": "theme",
    "photoFrame": "theme"
  },
  "fonts": { "preset": "theme", "heading": "theme", "script": "theme", "body": "theme", "scaleStep": 0 },
  "effects": {
    "intensity": "medium",
    "respectReducedMotion": true,
    "autoDowngrade": true,
    "guestToggle": true,
    "particles": { "enabled": true, "types": "theme", "color": "theme", "scope": "all", "wind": true },
    "burst": { "onOpen": "theme", "onRsvp": true, "countdownFireworks": "every-view" },
    "reveal": { "style": "theme", "heading": null, "block": null, "image": null, "ornament": null },
    "parallax": true,
    "kenBurns": true,
    "micro": { "buttonShine": true, "photoTilt": true, "wishFly": "paper-plane", "scrollProgress": false, "coupleHeartTap": false },
    "autoScroll": { "enabled": false, "speed": 55, "startDelayMs": 650 }
  },
  "music": { "enabled": true, "src": null, "title": "", "autoplayAfterOpen": true, "loop": true, "startAt": 0 },
  "guest": { "fromUrl": true, "queryParam": "to", "pathPrefix": "invite", "fallbackName": "Quý khách", "template": "{name}", "maxLength": 60 },
  "cover": {
    "enabled": true,
    "openStyle": "theme",
    "background": "paper",
    "backgroundImage": null,
    "eyebrow": "Thiệp mời cưới",
    "dateText": "12 · 12 · 2026",
    "monogram": "M & L",
    "guestPrefix": "Kính gửi:",
    "tapToOpenLabel": "Chạm để mở thiệp",
    "musicHint": "Thiệp có nhạc, bật loa",
    "showOpenedGreeting": true,
    "openedGreeting": "Chúng mình sắp cưới!",
    "openedSubline": ""
  },
  "sections": {
    "items": [
      { "id": "hero", "type": "hero", "enabled": true },
      { "id": "couple", "type": "couple", "enabled": true },
      { "id": "families", "type": "families", "enabled": true },
      { "id": "announcement", "type": "announcement", "enabled": true },
      { "id": "events", "type": "events", "enabled": true },
      { "id": "countdown", "type": "countdown", "enabled": true },
      { "id": "timeline", "type": "timeline", "enabled": true },
      { "id": "loveStory", "type": "loveStory", "enabled": false },
      { "id": "album", "type": "album", "enabled": true },
      { "id": "gift", "type": "gift", "enabled": true },
      { "id": "guestbook", "type": "guestbook", "enabled": true },
      { "id": "rsvp", "type": "rsvp", "enabled": true },
      { "id": "thankyou", "type": "thankyou", "enabled": true },
      { "id": "footer", "type": "footer", "enabled": true }
    ],
    "showNumbers": true,
    "divider": "theme"
  },
  "content": {
    "hero": { "eyebrow": "Save the Date", "image": null, "dateText": "12 · 12 · 2026", "lunarText": "Tức ngày 3 tháng 11 năm Bính Ngọ" },
    "couple": {
      "eyebrow": "The Bride & Groom", "heading": "Cô Dâu & Chú Rể", "order": "groom-first",
      "groom": { "labelEn": "The Groom", "label": "Chú rể", "fullName": "", "shortName": "", "photo": null, "bio": "" },
      "bride": { "labelEn": "The Bride", "label": "Cô dâu", "fullName": "", "shortName": "", "photo": null, "bio": "" }
    },
    "families": {
      "eyebrow": "Our Families", "heading": "Hai bên gia đình",
      "groom": { "title": "Nhà Trai", "parentsLabel": "Ông bà", "father": "", "mother": "", "address": "", "photo": null },
      "bride": { "title": "Nhà Gái", "parentsLabel": "Ông bà", "father": "", "mother": "", "address": "", "photo": null },
      "showPhotos": false
    },
    "announcement": { "eyebrow": "", "heading": "Trân trọng báo tin", "subheading": "Lễ Thành Hôn của con chúng tôi", "inviteLine": "Trân trọng kính mời {guest} tới dự", "inviteLine2": "bữa tiệc chung vui cùng gia đình chúng tôi" },
    "events": {
      "eyebrow": "Wedding Events", "heading": "Sự kiện cưới", "mainEventId": "thanh-hon",
      "items": [{
        "id": "thanh-hon", "name": "Lễ Thành Hôn",
        "startAt": "2026-12-12T11:30:00+07:00", "endAt": null, "welcomeTime": "11:00",
        "displayDate": "Thứ Bảy 12 Tháng 12 · 2026", "lunarText": "",
        "venueName": "", "address": "", "mapUrl": "", "mapEmbedUrl": "",
        "image": null, "rsvpEnabled": true, "addToCalendar": true
      }]
    },
    "countdown": { "eyebrow": "", "heading": "Đếm ngược", "targetAt": null, "style": "flip", "milestones": true, "todayLabel": "Hôm nay là ngày trọng đại!", "afterLabel": "Cảm ơn bạn đã đến chung vui", "hideAfter": false },
    "timeline": { "eyebrow": "Schedule", "heading": "Lịch trình", "items": [{ "date": "", "time": "", "label": "" }] },
    "loveStory": { "eyebrow": "Our Story", "heading": "Chuyện chúng mình", "items": [{ "year": "2019", "title": "", "text": "", "photo": null }] },
    "album": { "eyebrow": "Gallery", "heading": "Album cưới", "layout": "masonry", "previewCount": 9, "images": [] },
    "gift": {
      "eyebrow": "Wedding Gift", "heading": "Mừng cưới", "message": "", "showBankInfo": true, "buttonLabel": "Gửi quà mừng cưới",
      "bankAccounts": [{ "role": "Chú rể", "owner": "", "bank": "Vietcombank", "bankBin": "970436", "accountNumber": "", "qrImage": null }]
    },
    "guestbook": { "eyebrow": "Guestbook", "heading": "Sổ lưu bút", "subheading": "", "maxLength": 300, "pageSize": 6, "pollIntervalSec": 30, "suggestions": ["Trăm năm hạnh phúc", "Sớm có tin vui", "Mãi yêu thương nhau nhé", "Chúc mừng hạnh phúc"], "seedMessages": [], "showBubbles": false },
    "rsvp": { "eyebrow": "RSVP", "heading": "Xác nhận tham dự", "subheading": "", "attendingLabel": "Tôi sẽ đến", "notAttendingLabel": "Rất tiếc, tôi không thể đến", "guestCountLabel": "Bạn đi mấy người?", "maxGuests": 5, "deadline": null, "deadlineText": "", "askEvents": true, "askNote": true, "contactPhone": "" },
    "thankyou": { "heading": "Trân trọng cảm ơn", "message": "", "signature": "Minh Anh & Thuỳ Linh", "photo": null, "signatureSvg": null },
    "footer": { "monogram": "", "dateText": "", "madeWithText": "Thiệp được làm với ♡", "vendor": { "show": false, "name": "", "tagline": "", "phone": "", "logo": null } }
  },
  "floating": { "quickAction": true, "scrollTop": true },
  "integrations": { "appsScriptUrl": "" }
}
```

#### 5.6 Enum đầy đủ (gộp Phụ lục B design)
| Field | Enum | Mặc định |
|---|---|---|
| `theme.preset` | `tram-vang` · `hong-phan` · `luc-bao` · `son-do` · `muc-giay` · `hoai-co` · `sen-cham` · `mau-nuoc` · `dat-nung` · `pastel-han` · `dem-nhung` · `bien-dao` | `tram-vang` |
| `theme.primaryColor` | hex `#RRGGBB` hoặc `null` | `null` |
| `theme.overrides` | `{ primary?, onPrimary?, accent?, accent2?, bg?, surface?, text?, muted?, line? }` (hex) | `{}` |
| `theme.ornamentSet` | `"theme"` · `classic-line` · `romantic` · `traditional` · `minimal` · `deco` · `lotus` · `watercolor` · `boho` · `korean` · `luxe` · `tropical` | `"theme"` |
| `theme.texture` | `"theme"` · `paper` · `paper-aged` · `linen` · `kraft` · `rice-paper` · `watercolor-wash` · `velvet` · `grain-fine` · `sand` · `none` | `"theme"` |
| `theme.photoFrame` | `"theme"` · `arch` · `arch-double` · `rect-offset` · `soft-rect` · `circle-moon` · `oval` · `polaroid` · `stamp` · `scallop` · `wash-mask` · `deco-cut` | `"theme"` |
| `sections.divider` (13 + theme) | `"theme"` · `ornament` · `wave` · `none` · `leaf-branch` · `double-line` · `cloud` · `lotus` · `dots` · `brush-stroke` · `torn-paper` · `deco-fan` · `wave-ocean` | `"theme"` |
| `fonts.preset` | `"theme"` · `co-dien` · `thanh-lich` · `am-ap` · `bien-tap` · `truyen-thong` | `"theme"` |
| `fonts.heading/script/body` | `"theme"` hoặc id trong registry 5.4 đúng vai trò | `"theme"` |
| `cover.openStyle` (17 + theme) | `"theme"` · `envelope` · `card-flip` · `curtain` · `fade-zoom` · `none` · `wax-seal` · `origami` · `double-door` · `flower-gate` · `scroll` · `card-3d` · `light-gather` · `gift-box` · `moon-gate` · `book` · `ink-spread` · `polaroid` | `"theme"` (= `envelope` với Trầm Vàng) |
| `cover.background` | `paper` · `image` | `paper` |
| `effects.intensity` | `off` · `low` · `medium` · `high` (Tắt/Nhẹ/Vừa/Nhiều) | `medium` |
| `effects.particles.enabled` | boolean | `true` |
| `effects.particles.types` | `"theme"` hoặc mảng 1-2 phần tử: `petal-rose` · `petal-sakura` · `petal-peach` · `petal-lotus` · `petal-dried` · `petal-watercolor` · `plumeria` · `heart` · `paper-heart` · `leaf-green` · `leaf-eucalyptus` · `leaf-maple` · `pampas` · `snow` · `bubble` · `firefly` · `sparkle` · `gold-dust` · `ink-dot` · `dust-mote` · `red-paper` | `"theme"` |
| `effects.particles.color` | `"theme"` · `"multi"` · hex | `"theme"` |
| `effects.particles.scope` | `all` · `hero-thankyou` | **`all`** (Q18) |
| `effects.particles.wind` | boolean (chỉ tác dụng ở `high`) | `true` |
| `effects.burst.onOpen` | `"theme"` · `none` · `confetti` · `petals` · `gold` · `red-paper` | `"theme"` (= `petals` với Trầm Vàng) |
| `effects.burst.onRsvp` | boolean (confetti khi "Tôi sẽ đến") | `true` |
| `effects.burst.countdownFireworks` | `off` · `wedding-day` · `every-view` | **`every-view`** (Q20) |
| `effects.reveal.style` | `"theme"` · `soft` · `editorial` · `letter` · `gentle` · `playful` · `cinematic` | `"theme"` (= `soft`) |
| `effects.reveal.heading/block/image/ornament` | `null` hoặc `fade` · `fade-up` · `slide-side` · `zoom-in` · `mask-up` · `wipe` · `photo-settle` · `rise-tilt` · `blur-in` · `split-words` · `split-chars` · `svg-draw` · `parallax-layers` (chỉ `image`) | `null` |
| `effects.parallax` | boolean (chỉ ở `high`) | `true` |
| `effects.kenBurns` | boolean (từ `medium`) | `true` |
| `effects.micro.buttonShine` / `photoTilt` | boolean | `true` / `true` |
| `effects.micro.wishFly` | `paper-plane` · `bubble` · `heart` | `paper-plane` |
| `effects.micro.scrollProgress` / `coupleHeartTap` | boolean | `false` / `false` |
| `countdown.style` | `flip` · `slide` · `odometer` · `simple` | `flip` |
| `countdown.milestones` | boolean (chip 100/30/7/1 ngày) | `true` |
| `album.layout` | `masonry` · `grid` · `carousel` | `masonry` |
| `couple.order` | `groom-first` · `bride-first` | `groom-first` |

**Hằng số trong code (không nằm trong config, design Phụ lục B)**: hệ số mật độ hạt theo nhóm section + opacity tối đa (5.7), vùng loại trừ (tối đa 6), trần 40 hạt nền / 120 hạt burst, ngưỡng pháo hoa (`threshold 0.5`, giữ 400 ms, rời < 10% mới lên đạn, cooldown 15 s), số hạt theo cấp 8/16/28, thứ tự tự hạ cấp (5.10).

**Validation cross-field (admin)**: `particles.types` tối đa 2 và loại trùng; `reveal.heading = split-chars` với heading font script -> runtime tự rơi về `wipe` (không lỗi); `blur-in` chỉ desktop + `high`; chọn openStyle chi phí Cao (`light-gather`) -> cảnh báo; tổ hợp Cao + `high` + `cinematic` -> ghi chú vàng (8.13).

#### 5.7 Field MỚI / ĐỔI / BỎ so với dự án cũ và revision 2
| Field | Trạng thái | Ghi chú |
|---|---|---|
| `publish.{id, at}` | MỚI | Admin tự ghi; poll "đã lên trang" |
| `theme.preset` | ĐỔI | 12 id (rev 2: 4 id) |
| `theme.primaryColor` | MỚI | `null` = theo theme; derive OKLCH sáng/tối |
| `theme.accentColor` | **BỎ** (rev 2) | Gộp vào `theme.overrides.accent` (Phụ lục B) |
| `theme.overrides` | ĐỔI | Thêm `accent2` |
| `theme.ornamentSet` | ĐỔI | 11 bộ + `"theme"`; rev 2 `classic`->`classic-line` |
| `theme.texture` | ĐỔI | 10 giá trị + `"theme"` (rev 2 mặc định `paper`) |
| `theme.photoFrame` | MỚI | 11 khung + `"theme"` |
| bỏ `theme.radius` | BỎ | Radius cố định trong token |
| `fonts.preset`, `fonts.scaleStep` | MỚI | thay `fonts.scale`; `fonts.*` nhận `"theme"` |
| `animation` -> **`effects`** | ĐỔI TÊN | |
| `effects.intensity` | ĐỔI | Enum `off/low/medium/high` (rev 2 dùng `light/strong`) |
| `effects.autoDowngrade`, `effects.guestToggle`, `effects.respectReducedMotion` | MỚI | |
| `effects.petals` | **BỎ** | Thay bằng `effects.particles.*` |
| `effects.particles.{enabled,types,color,scope,wind}` | MỚI | `scope` mặc định `all` |
| `effects.burst.{onOpen,onRsvp,countdownFireworks}` | MỚI | fireworks mặc định `every-view` |
| `effects.reveal.style` | ĐỔI | Từ kiểu nguyên tử (`fade-up`) sang 6 gói + `"theme"`; thêm 4 vai trò nâng cao |
| `effects.parallax`, `effects.kenBurns` | MỚI | boolean, vẫn bị cấp cường độ giới hạn |
| `effects.micro.*` | MỚI | 5 field |
| bỏ `animation.speed/parallax/scrollReveal.*/coverOpen` | BỎ | |
| `cover.openStyle` | ĐỔI | 17 giá trị + `"theme"` (rev 2: 5) |
| `cover.enabled/background/backgroundImage/guestPrefix/musicHint/showOpenedGreeting/openedGreeting/openedSubline` | MỚI | |
| bỏ `cover.image`, `cover.inviteLabel` | BỎ | Dùng `content.hero.image`, `announcement.inviteLine` |
| `music.startAtSec` -> `music.startAt`; bỏ `music.volume` | ĐỔI | Fade bằng GainNode |
| `sections` -> `{ items[], showNumbers, divider }` | ĐỔI | `divider` 13 giá trị + `"theme"` |
| section `loveStory`, `footer`; bỏ section `vendor` | MỚI/BỎ | vendor -> `footer.vendor` |
| `content.*.eyebrow` | MỚI | |
| `countdown.style` thêm `odometer`; `countdown.milestones` | ĐỔI/MỚI | |
| `countdown.afterLabel/hideAfter`; `targetAt=null` | MỚI | `null` = `startAt` của `mainEventId` |
| `events.mainEventId`, `events.items[].mapEmbedUrl/image/endAt` | MỚI | Bản đồ bấm mới tải |
| `album.images[]` = `ImageRef`; `album.previewCount` | ĐỔI/MỚI | |
| `gift.bankAccounts[{role, owner, bank, bankBin, accountNumber, qrImage}]`, `showBankInfo` | ĐỔI | |
| `guestbook.maxLength/pageSize/suggestions/showBubbles` | MỚI | |
| `rsvp.maxGuests` 10 -> **5**; `deadline/askEvents/askNote/contactPhone` | ĐỔI/MỚI | |
| `thankyou.photo/signatureSvg`, `floating.*` | MỚI | |
| `integrations` còn `appsScriptUrl` | ĐỔI | |
| `ImageRef.{focalPoint, dominantColor, lqip, updatedAt}` | MỚI | "Bản trước" của ảnh lấy từ backup manifest, **không** lưu trong config |

**Migrator v0 -> v1 (theme/hiệu ứng)**: theme `tram-vang`/`hong-phan` giữ; `xanh-ngoc` -> `luc-bao`; `xanh-navy` -> `luc-bao`; id lạ -> `tram-vang`. `effects.petals.enabled=false` -> `particles.enabled=false`; `petals.type(s)` `petal|heart|leaf|snow-dot` -> `petal-rose|heart|leaf-green|snow`. `coverOpen`/kiểu mở cũ -> `cover.openStyle` tương ứng nếu có, ngược lại `"theme"`. `scrollReveal`/`speed` bỏ. Màu/font cũ khác preset -> ghi vào `primaryColor`/`fonts.*` (giữ ý chủ nhà). Mọi field theme khác để `"theme"`.

**Ánh xạ tên field design -> schema**: `invitation.eyebrow` -> `cover.eyebrow`; `invitation.guestPrefix` -> `cover.guestPrefix`; `invitation.guestName` -> `guest.fallbackName`; `guestUrlParam` -> `guest.queryParam`; `invitation.kicker` -> `content.hero.eyebrow`; `countdown.targetDate` -> `content.countdown.targetAt`; `events[].date/startTime` -> `startAt` (ghép từ `input type=date` + `type=time`, +07:00); `lunarDate` -> `lunarText`; `families.groomFamily/brideFamily` -> `families.groom/bride`; `thankYou` -> `content.thankyou`; `vendor.show` -> `content.footer.vendor.show`; `timeline.mode: story` -> section `loveStory`; `effects.particles.type` (5.7) -> `effects.particles.types`; `effects.petals.*` (5.3) -> `effects.particles.*`; `effects.intensity` Tắt/Nhẹ/Vừa/Nhiều -> `off/low/medium/high`; `theme.mode` -> thuộc `ThemePreset.mode` (không trong config); "accent nếu admin tự chọn" (1.4) -> `theme.overrides.accent`; `countdown.*`, `album.*`... trong design -> `content.<section>.*`.

#### 5.8 Section rules (design 4.0)
- Registry meta (trong code): `numbered` (false cho hero, countdown, thankyou, footer), `pinned` (`first`: hero, `last`: footer), `hasBgImage` (hero, thankyou), `isEmpty(config)`, `particleGroup` (hệ số mật độ 5.7: hero/thankyou 1.0; couple/families/announcement/album/countdown 0.6; events/timeline/loveStory 0.35; rsvp/guestbook/gift/footer 0.25), `exclusionSelectors` (form RSVP, form + danh sách lời chúc, thẻ sự kiện).
- Guest: lọc `enabled` **và** `!isEmpty` -> đánh số theo chỉ số sau lọc, nền xen kẽ `bg`/`surface` (bỏ qua `hasBgImage`), chèn divider đã resolve giữa 2 section (không kề `hasBgImage`; `none` thì không chèn). `type` lạ -> bỏ qua + `console.warn`.
- Migrator/validator ép hero đầu, footer cuối. Mỗi section có `id` cố định làm anchor.

### 6. Cấu trúc thư mục dự án

```
wedding-page/
├── package.json, vite.config.ts, tsconfig.json, .size-limit.json
├── index.html                      # entry Guest (placeholder inject config/resolved/OG/theme CSS/preload)
├── admin/index.html                # entry Admin
├── src/
│   ├── shared/
│   │   ├── config/ (types.ts, defaults.ts, migrations.ts, merge.ts, schema-meta.ts, enums.ts, validate-rules.ts)
│   │   ├── capabilities.ts           # giá trị enum đã có module + fallback (theo giai đoạn)
│   │   ├── theme/ (presets.ts, resolve.ts, oklch.ts, derive.ts, contrast.ts, tokens.ts, font-presets.ts)
│   │   ├── fonts/ (registry.ts, loader.ts)
│   │   ├── sections/meta.ts
│   │   ├── guest-name.ts, ics.ts, assets.ts
│   │   └── vietqr/ (payload.ts, banks.ts)
│   ├── guest/
│   │   ├── main.ts, bootstrap.ts, preview-bridge.ts
│   │   ├── cover/ (cover.ts, open-registry.ts, styles/<openStyle>.ts + .css)   # 1 module/kiểu, dynamic import
│   │   ├── sections/ (registry.ts, hero, couple, families, announcement, events, map-lazy, countdown, countdown-odometer, timeline, love-story, album, lightbox, gift, gift-sheet, guestbook, rsvp, thankyou, footer)
│   │   ├── floating/ (quick-action.ts, scroll-top.ts, toast.ts)
│   │   ├── effects/
│   │   │   ├── registry.ts           # EffectRegistry: play/reset/setTimeScale
│   │   │   ├── intensity.ts, perf-probe.ts, downgrade.ts
│   │   │   ├── particles/ (field.ts, density.ts, exclusion.ts, types/<particle>.ts)   # sprite SVG + motion, lazy theo loại
│   │   │   ├── burst/ (confetti.ts, petals.ts, gold.ts, red-paper.ts, fireworks.ts, heart-burst.ts)
│   │   │   ├── reveal/ (engine.ts, packs.ts, split.ts, mask-up.ts, parallax-layers.ts)
│   │   │   └── micro/ (wish-fly.ts, photo-tilt.ts, rsvp-success.ts, ...)
│   │   ├── theme-assets/ (texture.ts, frames/<frame>.css, dividers/<divider>.css)
│   │   ├── music/player.ts
│   │   ├── integrations/apps-script.ts
│   │   └── styles/ (tokens.css, base.css, reveal.css, micro.css, sections/*.css)
│   └── admin/
│       ├── main.tsx, app.tsx, routes/ (login, connect, overview, general, theme-gallery, fonts, effects, music, sections, content/*, media, guest-links, backup)
│       ├── form/, preview/ (iframe, fx-toolbar)
│       ├── storage/ (adapter.ts, github.ts, github-errors.ts, dev-server.ts, download.ts, backup-plan.ts, draft-db.ts)
│       ├── media/ (image-pipeline.ts, crop.tsx, image-slot.tsx, audio.ts)
│       └── auth/ (token-vault.ts, connect-check.ts)
├── public/
│   ├── content/ (config.json, images/<slot>/, audio/)
│   ├── ornaments/<set>.svg            # 11 sprite, chỉ tải bộ đang dùng
│   ├── theme-assets/ (watercolor-*.webp, flower-gate-*.webp, ...)   # tải lười
│   ├── _redirects, _headers
├── backup/ (manifest.json, files/...) # KHÔNG deploy
├── scripts/ (vite-plugins/inject-config-og.ts, vite-plugins/dev-admin-save.ts, check-budget.ts)
├── apps-script/ (Code.gs, README.md)
└── docs/
```

### 7. Data Flow

**Guest:**
1. `https://<site>/?to=gia-đình-anh-Mạnh` -> CDN trả `index.html` đã inline: `#wp-config`, `#wp-resolved`, `<style>:root{--c-*}</style>` (+ `data-mode`), OG, `modulepreload` cho module openStyle đang dùng + module loại hạt đang dùng, `preload` ảnh hero/cover, font cover (script + heading), ornament sprite đang dùng.
2. `bootstrap.ts`: đọc config + resolved -> migrate/merge -> nạp `@font-face` 3 family -> parse tên khách -> render cover (overlay fixed) **và** landing bên dưới (`inert`, khoá cuộn) -> dynamic import module openStyle (đã preload) -> tính `effectiveIntensity` (8.4).
3. Khách chạm -> **cùng handler đồng bộ**: `audio.play()` -> chạy openStyle (chạm lần 2 = tua nhanh 300 ms) -> gỡ cover, bỏ `inert`, focus hero -> burst `onOpen` -> khởi động `ParticleField` (scope/density/exclusion), reveal, micro; đo FPS 2 giây.
4. Section render theo `sections.items`; ảnh lazy; bản đồ bấm mới tải; QR, lightbox, map, fireworks, wish-fly... là chunk lazy; RSVP/guestbook gọi Apps Script.

**Admin - kết nối & mở khoá:** 8.2/8.2b -> 2.3/2.4 -> `loadSnapshot()` -> so nháp IndexedDB với commit hiện tại.

**Admin - sửa & xem trước:** form/gallery -> state -> autosave IndexedDB (800 ms) -> `wp:preview-config` (150 ms, ảnh mới qua `blob:`) -> chọn hiệu ứng thì gửi `fx:replay`.

**Admin - publish/restore:** mục 3.5 -> CF Pages build -> poll `publish.id` -> "Đã lên trang".

### 8. Business Logic

#### 8.1 Cover, kiểu mở, nhạc
- Cover hiện **mỗi lần mở link**. Reload giữa trang: sau khi mở thì cuộn về vị trí cũ (`sessionStorage`).
- `cover.enabled = false` -> vào thẳng landing; nhạc chỉ phát khi khách bấm nút nhạc.
- **Module kiểu mở**: interface chung `OpenStyleModule { preload(ctx): Promise<void>; play(ctx, level: 'low'|'medium'|'high'): Animation-like; fastForward(): void }`; ≤ 4 KB gzip/module (chưa tính asset); tổng ≤ 2.4 s; chỉ `transform`/`opacity` (ngoại lệ `clip-path` có biên an toàn ±0.3em, canvas cho `light-gather`). `level` theo bảng design 3.4b (cột Nhẹ/Nhiều).
- **Hạ cấp**: `off` hoặc reduced-motion -> fade 200 ms; máy yếu -> `light-gather` (chi phí Cao) về `fade-zoom`, kiểu chi phí Vừa chạy bản Nhẹ. Module lỗi tải (mạng) -> `fade-zoom` (đóng gói sẵn trong entry vì là đích hạ cấp).
- `light-gather`: lấy mẫu điểm từ tên cặp đôi sau `document.fonts.load()`, bước 3 px (2 px với font script), 400 hạt (700 ở `high`); dùng canvas của `ParticleField`.
- Trạng thái cover (design 3.6): chuẩn bị > 300 ms -> nút disabled "Đang chuẩn bị thiệp…", quá 4 s vẫn cho mở (kể cả module openStyle chưa tải xong -> dùng `fade-zoom`).
- Font tên trên cover chờ `document.fonts.load()` tối đa 1.5 s; font khác `swap`.
- Nhạc: `<audio preload="none">`; cover hiện và không `saveData` -> `preload="auto"`. `play()` đồng bộ trong handler; reject -> nút nhạc "Chạm để bật nhạc". Fade-in 1.5 s bằng `GainNode`. `loop`, `currentTime = startAt`. `visibilitychange`/`pagehide` -> pause, nhớ `wasPlaying`. Media Session API. File lỗi -> ẩn nút.
- Preview: không autoplay; hỗ trợ `skipCover`, `replayCover`, `fx:replay`.

#### 8.2 Tên khách từ URL (`src/shared/guest-name.ts`)
Ưu tiên: path `/{pathPrefix}/<slug>` -> query `?{queryParam}=` -> `guest.fallbackName`.
1. `URLSearchParams` (đã decode `%XX`, `+`); path: `decodeURIComponent` trong try/catch. Link Unicode thô và link percent-encode cho kết quả giống nhau.
2. `normalize('NFC')`.
3. `--` -> dấu gạch thật; `-`, `_` -> khoảng trắng; gộp khoảng trắng; `trim`.
4. Loại ký tự điều khiển, zero-width, `<>"'\``, ký tự ngoài whitelist (`\p{L}`, `\p{M}`, số, khoảng trắng, `. , & ( ) / -`).
5. Cắt tối đa `maxLength` (60) theo grapheme (`Intl.Segmenter`, fallback `/\P{M}\p{M}*/gu`), thêm "…".
6. Viết hoa **chỉ ký tự đầu** (`toLocaleUpperCase('vi-VN')`).
7. Rỗng -> `fallbackName`; dòng "Kính gửi:" giữ.
8. Áp `template`, `{guest}` trong `announcement.inviteLine` - thay chuỗi thuần.
9. Chỉ `textContent`. Auto-fit (> ~22 ký tự: 24 -> 19 px, tối đa 2 dòng); không dùng font script.
10. Điền sẵn ô tên RSVP và Lời chúc.

Ví dụ: `?to=gia-đình-anh-Mạnh` -> "Gia đình anh Mạnh"; `?to=Lê--Nguyễn-Hà` -> "Lê-Nguyễn Hà"; `?to=<script>` -> "Script"; `?to=` -> "Quý khách".

**Link generator (design 8.9)**: mỗi dòng 1 tên -> {tên hiển thị (chạy `guest-name.ts`), link, Chép, Chia sẻ, 👁}. Slug: NFC, khoảng trắng -> `-`, `-` thật -> `--`, bỏ ký tự cấm URL, giữ hoa/thường. Kiểu: **Giữ dấu** ★ / Không dấu (cảnh báo). Toggle **"Mã hoá link"** (mặc định tắt, nhớ trong `localStorage`): bật thì [Chép]/[Chia sẻ]/CSV dùng `encodeURIComponent` cho giá trị; bảng luôn hiển thị dạng dễ đọc; CSV luôn có thêm cột `link_ma_hoa`. Mặc định `?to=`; tuỳ chọn `/invite/`. Cảnh báo trùng tên. Danh sách chỉ local + CSV.

#### 8.3 Sections bật/tắt + sắp xếp
Theo 5.8 + design 8.6: kéo bằng tay cầm (giữ 200 ms trên touch) + nút ↑↓ + bàn phím; hero/footer khoá; số thứ tự cập nhật ngay; ⚠ "sẽ tự ẩn".

#### 8.4 Effects engine (design 5.3-5.10)
- **Cường độ hiệu lực**: `effectiveIntensity = intensity`; `autoDowngrade` và (`hardwareConcurrency <= 4` hoặc `deviceMemory <= 2` hoặc `saveData`) -> giảm 1 bậc + cờ `lowEnd` (trần 12 hạt, DPR 1, tắt gió, pháo hoa bản Nhẹ). `prefers-reduced-motion` + `respectReducedMotion` -> `off` (fade ≤ 200 ms). Nút khách "Bật/Tắt hiệu ứng" (`guestToggle`, `localStorage`).
- **Ma trận**: triển khai đúng bảng design 5.3 + 5.10 thành 1 bảng tra `MATRIX[effect][level]` trong `intensity.ts` (unit test đối chiếu từng ô). Boolean config (`parallax`, `kenBurns`, `micro.*`, `particles.wind`) chỉ **tắt bớt**, không bật vượt cấp.
- **FPS < 45** (đo 2 s sau mở, sau đó theo dõi nhẹ): hạ theo thứ tự tắt gió -> giảm hạt 50% -> tắt `parallax-layers` -> tắt hạt nền -> Ken Burns -> `photo-tilt`. Burst và kiểu mở không tắt giữa chừng.
- **EffectRegistry**: mọi hiệu ứng đăng ký `play()`, `reset()`, `setTimeScale(x)` (WAAPI `playbackRate`, canvas nhân `dt`) - phục vụ "Phát lại", 0.5x, mô phỏng.
- **ParticleField** (1 canvas fixed, `z-petals`, `aria-hidden`, `pointer-events:none`): sprite vẽ sẵn từ SVG ra canvas phụ 2 cỡ; 4 mô hình chuyển động `fall/float-up/drift/twinkle`; trần 40 hạt nền + 120 burst; DPR ≤ 2; frame > 2 ms ba lần liên tiếp -> giảm 25% hạt. Số hạt = `8/16/28 × hệ số loại × densityFactor theme`, ≤ 40. Không tạo canvas khi `off`/reduced-motion.
- **Hạt nền `scope: all`** - 4 lớp bảo vệ (design 5.7): (1) mật độ theo trung bình có trọng số diện tích section đang hiện (IntersectionObserver `[0,.25,.5,.75,1]`), hạt thừa rơi hết rồi không sinh lại, sinh mới ≤ 2 hạt/giây; (2) vùng loại trừ (≤ 6, ResizeObserver + scroll, chỉ vùng trong viewport) + biên 16 px -> hạt fade về 0 trong 200 ms; (3) tạm dừng rAF khi tab ẩn/`pagehide`, lightbox/sheet/menu mở, focus trong input/textarea/select (+1.5 s sau blur), cover chưa mở; tiếp tục fade-in 300 ms; (4) trần theo cấp/máy. `scope: hero-thankyou` -> chỉ sinh khi hero hoặc thankyou trong viewport.
- **Burst**: `onOpen` theo bảng 5.7 (số hạt Nhẹ/Vừa/Nhiều); `onRsvp` confetti 0/40/60 khi "Tôi sẽ đến"; `heart-burst` khi gửi lời chúc (nếu `wishFly = heart`).
- **Pháo hoa đếm ngược `every-view`**: bắn khi section ≥ 50% viewport liên tục 400 ms; lên đạn lại chỉ khi section < 10% rồi vào lại; cooldown ≥ 15 s tính từ lúc chùm cuối tắt (không xếp hàng); số chùm 1×24 / 3×40 / 5×40 (máy yếu luôn 1×24, DPR 1); không bắn khi `off`/reduced-motion (chỉ chip chữ tĩnh)/tab ẩn/lightbox-sheet mở/focus trong ô nhập; gốc nổ không đè 4 ô số; < 3 lần nháy/giây. `wedding-day`: chỉ ngày cưới hoặc khi đồng hồ về 0 trong lúc xem, 1 lần/phiên (`sessionStorage`).
- **Reveal**: IntersectionObserver một lần, class `is-in`; gói -> 4 vai trò theo bảng design 5.8; `low` -> mọi gói rơi về `gentle`; `medium` bỏ `blur-in` và `parallax-layers`. `split-chars` theo 7 quy tắc an toàn tiếng Việt của design (NFC, `Intl.Segmenter` grapheme, bọc theo từ, `padding-block:.2em`, không áp font script -> `wipe`, `sr-only` + `aria-hidden`). `wipe` tối đa 3 phần tử cùng lúc. `blur-in` chỉ ≥ 1024 px + `high`, tối đa 3 phần tử.
- **Micro** (design 5.9): CSS là chính; `wish-fly`, `photo-tilt` (chỉ `pointer: fine`), `rsvp-success`, `countdown-odometer`, `fireworks` là chunk lazy. `cta-breathe`, `btn-shine`, `heartbeat` dừng sau ≤ 5 s / 3 lần (WCAG 2.2.2).
- Chỉ animate `transform`/`opacity` (ngoại lệ có ghi chi phí: `clip-path`, `blur-in`, canvas). `will-change` ≤ 6 phần tử. Texture không bao giờ animate. `autoScroll` mặc định tắt.

#### 8.5 Events, bản đồ, lịch
- "Chỉ đường": `mapUrl` tab mới; trống thì `https://www.google.com/maps/search/?api=1&query=<address>`.
- "Xem bản đồ" **bấm mới tải**: iframe `mapEmbedUrl` (chỉ host `www.google.com`), trống thì `https://www.google.com/maps?q=<address>&output=embed`; lỗi -> link "Mở Google Maps".
- "Thêm vào lịch": `.ics` client, `DTEND = endAt ?? startAt + 3h`, VALARM trước 1 ngày; fallback Google Calendar link.
- Sự kiện đã qua (`now > endAt ?? startAt + 6h`) -> mờ 70%, "Đã diễn ra", ẩn nút RSVP.

#### 8.6 Mừng cưới + VietQR (đã chốt)
- `showBankInfo = true`: lời nhắn + nút -> bottom sheet/dialog (design 4.9); không hiện STK trần.
- Nguồn QR: (1) `qrImage` upload; (2) **VietQR sinh client-side** (EMVCo NAPAS: `bankBin` + `accountNumber`, service `QRIBFTTA`, CRC16-CCITT) trong `src/shared/vietqr/payload.ts`, vẽ bằng thư viện QR nhỏ (≤ 15 KB gzip) **lazy khi mở sheet**. Không dùng `img.vietqr.io`.
- Admin chọn ngân hàng từ dropdown (`banks.ts`) -> tự điền `bankBin`; preview QR trong form để quét thử. Test bằng 1 tài khoản thật ở v1 (không ghi STK vào tài liệu/repo).
- Nền QR luôn trắng (kể cả `dem-nhung`); "Sao chép" + toast; "Tải ảnh QR" PNG.

#### 8.7 Guestbook / RSVP (Apps Script)
- `appsScriptUrl` rỗng -> guestbook local, RSVP thay bằng thông tin liên hệ.
- Guestbook: `pageSize` 6 + "Xem thêm", không cuộn lồng; poll khi section trong viewport và tab hiện; chips; validate; optimistic insert + `wish-fly` theo `effects.micro.wishFly`.
- RSVP: stepper 1-`maxGuests`; checkbox sự kiện khi `askEvents` và > 1 sự kiện; quá `deadline` vẫn gửi; `submissionId` + "Sửa phản hồi"; `rsvp-success` + confetti nếu `onRsvp`.
- Timeout 15 s; lỗi giữ nội dung + "Thử lại".

#### 8.8 Admin
- **Thẩm mỹ & IA**: design 8.1, 8.3 (nền `#F7F6F3`, primary admin `#2F4A43`). "Chỉnh JSON nâng cao" cuối trang.
- **Responsive**: ≥ 1200 px 3 cột; 1024-1199 px preview ẩn/hiện; < 768 px bottom tab `Chỉnh sửa · Xem trước · Thêm`, input 48 px.
- **Gallery theme (8.12)**: 12 thẻ HTML/CSS thật (biến CSS scoped theo token preset), tên cặp đôi thật; chip lọc theo `tags`; `role="radiogroup"`; chạm = áp vào nháp + toast Hoàn tác; dialog "Giữ phần tôi đã chỉnh / Dùng trọn gói" (5.2); khối "Thành phần của theme" hiển thị nhóm đang "Theo theme" hay "Đã chỉnh riêng". Mobile: 2 cột + mini preview dính 38vh. Font thẻ tải kiểu `&text=` (9.3).
- **Trình chọn hiệu ứng (8.13)**: cường độ, gallery 17 kiểu mở (poster tĩnh, hoạt ảnh CSS thu nhỏ khi hover/focus/chọn; badge "Gợi ý cho theme", "Nặng ⚠"), "Sau khi mở", hạt nền (tối đa 2), màu, phạm vi, gói reveal, chi tiết nhỏ, pháo hoa. Chọn = gửi `fx:replay` tương ứng; nút "↻ Phát lại" (phím `R`), 0.5x, "Mô phỏng" (máy yếu / giảm chuyển động). Chỉ hiển thị lựa chọn có trong `capabilities.ts` của bản hiện tại.
- **Preview**: khung 375/414/desktop, làm mới, "Bỏ qua cover", "Phát lại hiệu ứng mở thiệp", "Xem như khách"; sửa field -> cuộn tới + highlight.
- **Nháp & trạng thái**: top bar theo design 8.8; "Hoàn tác" (undo phiên) + "Hoàn tác tất cả"; `beforeunload` khi còn thay đổi; banner token sắp hết hạn (2.6).
- **Checklist trước xuất bản**: lỗi nặng chặn (schema không hợp lệ, thiếu ngày sự kiện chính, text/bg < 4.5:1, URL không `https:`, `bankBin`/STK sai định dạng khi `showBankInfo`); cảnh báo nhẹ (ảnh thiếu alt, section bật nhưng rỗng, primary không đạt AA trước auto-fix, `meta.siteUrl` trống, token hết hạn trước ngày cưới, ảnh hero quá sáng với theme tối - độ sáng trung bình > 70%, tổ hợp hiệu ứng nặng). Bước xác nhận ghi câu "Trạng thái trang hiện tại sẽ được lưu làm bản sao lưu (thay bản sao lưu cũ ngày …)".
- **ImageSlot + pipeline** (design 8.7 v3): 3 khối (Trong bản nháp / Đang xuất bản / Ảnh trước lần xuất bản ... từ bản sao lưu) + nút theo bảng 3.4; link "Khôi phục cả trang? Xem Sao lưu/Khôi phục".
  - Nhận JPG/PNG/WEBP ≤ 20 MB; HEIC thử `createImageBitmap`, thất bại -> "Hãy chọn ảnh JPG/PNG".
  - Crop theo tỉ lệ slot (hero 9:16 + focal point, chân dung 4:5, gia đình 3:2, OG 1.91:1, album tự do); xoay 90°, slider zoom.
  - `createImageBitmap(file, { imageOrientation: 'from-image' })` -> canvas -> bỏ EXIF/GPS.
  - Cạnh dài: **hero/cover 2000 px** (≤ 250-300 KB), **album full 1600 px + thumb 600 px** (≤ 80 KB), chân dung/gia đình/sự kiện/love story 1200 px, OG 1200×630 **JPEG**.
  - WebP q 0.82; Safari ra PNG -> JPEG q 0.85; vượt mục tiêu giảm chất lượng tối đa 3 lần.
  - Sinh `w`, `h`, `dominantColor`, `lqip`, ảnh blur tĩnh cho `cover.background = image`; tên `<slot>.<hash8>.<ext>` (SHA-256).
  - "4.2MB thành 236KB, WebP 1600px"; vào nháp (IndexedDB) + preview ngay.
  - Album: hàng đợi tuần tự, kéo thả + ←→, xoá có Hoàn tác 5 s; ảnh album đã xoá ở lần publish gần nhất chỉ lấy lại bằng Khôi phục cả trang.
- **Upload nhạc**: mp3/m4a ≤ 8 MB, khuyến nghị ≤ 96-128 kbps, cảnh báo > 5 MB; nghe thử, chọn `startAt`.
- **Sao lưu/Khôi phục (8.10)**: hiển thị manifest (thời điểm, thumb cũ -> mới qua `readAsset`, số thay đổi nội dung) + dialog 2 bước + trạng thái đang khôi phục / "Làm lại (quay về bản vừa thay)" / rỗng / lỗi xung đột; "Nhập từ file" nạp vào **nháp** (diff trước).
- **Export/Import**: export `config.json` hoặc zip kèm asset; import `.json` / `config.js` cũ -> migrate -> validate -> diff -> nháp.
- **Kiểm tra kết nối Apps Script**: `?action=ping` ở trang Chung.

### 9. Hiệu năng, font, OG

#### 9.1 Ngân sách bundle guest (bắt buộc, kiểm bằng `size-limit` trong `npm run build`, vượt là build fail)
| Hạng mục (gzip) | Ngân sách | Ghi chú |
|---|---|---|
| **JS ban đầu** (entry + module openStyle đang dùng + module loại hạt đang dùng, tức mọi thứ tải trước khi khách chạm mở) | **≤ 60 KB** | entry ≤ 50 KB (bootstrap, sections, music, `fade-zoom`, EffectRegistry, ParticleField ~3 KB, reveal engine, intensity) + openStyle ≤ 4 KB + hạt ≤ 2 × 1.5 KB |
| Mỗi module kiểu mở (17 module) | ≤ 4 KB | Không tính asset riêng (ảnh WebP tải song song) |
| Mỗi module loại hạt (21) | ≤ 1.5 KB | Sprite SVG string + tham số chuyển động |
| Mỗi chunk lazy khác (QR, lightbox, map, fireworks, wish-fly, photo-tilt, split-chars, odometer, apps-script, ics) | ≤ 15 KB | Tải khi cần |
| Preview runtime (presets + resolve + derive + preview-bridge) | ≤ 15 KB | Chỉ khi `?preview=1` |
| **CSS ban đầu** | **≤ 25 KB** | core (tokens, base, sections, reveal, micro) ≤ 20 KB + CSS của photoFrame/divider/openStyle đang dùng ≤ 5 KB |
| Ornament sprite đang dùng | ≤ 12 KB | `public/ornaments/<set>.svg`, preload, immutable |
| Texture | ≤ 2 KB | CSS/SVG data-URI sinh lúc build; riêng `watercolor-wash` WebP ≤ 60 KB (chỉ theme dùng nó) |
| Asset riêng openStyle/ornament raster | ≤ 80 KB/ảnh | flower-gate, watercolor; chỉ tải khi được chọn |
| Font ban đầu | ≤ 180 KB woff2 | 3 family đang chọn, subset vietnamese + latin; preload ≤ 2 file (font cover) |
| **Trang ban đầu tổng** | **≤ 900 KB** | Không tính nhạc, album ngoài màn |
| Admin JS ban đầu | ≤ 150 KB | Không ảnh hưởng khách; route gallery/hiệu ứng/crop lazy |

**Chiến lược code-split / lazy-load:**
1. **Theo theme**: guest không import registry 12 preset; plugin build resolve sẵn (`#wp-resolved` + CSS vars inline). CSS của từng `photoFrame`, `divider`, `texture` là file riêng import động theo giá trị đã resolve; plugin thêm `<link rel="stylesheet">`/`preload` cho đúng giá trị đang dùng (tránh FOUC).
2. **Theo openStyle**: `open-registry.ts` map id -> `() => import('./styles/<id>.ts')`; plugin chèn `modulepreload` cho module đang dùng; `fade-zoom`/`none` nằm trong entry (đích hạ cấp, fallback khi lỗi mạng).
3. **Theo loại hạt/burst**: chỉ import 1-2 module loại hạt đã resolve + module burst `onOpen` (sau khi mở thiệp, trong `requestIdleCallback`); fireworks import khi countdown sắp vào viewport (`rootMargin: 600px`).
4. **Theo tính năng**: QR, lightbox, map, `.ics`, Apps Script client, wish-fly, odometer, split-chars, photo-tilt (chỉ `pointer: fine`) đều dynamic import.
5. **Preview mode**: mọi module vẫn được build ra (admin đổi gì cũng import được), nhưng khách chỉ tải phần đang dùng.
6. Rollup `manualChunks` gom phần dùng chung giữa các module openStyle (helpers WAAPI, 3D) thành 1 chunk ≤ 3 KB để tránh lặp.

**Chỉ số Web Vitals**: LCP < 2.5 s (4G), **CLS < 0.05**, INP < 200 ms trên Android tầm thấp. Ảnh: `loading="lazy"` + `decoding="async"` ngoài màn đầu; hero `fetchpriority="high"` + preload; album dùng `thumb`; placeholder `dominantColor`.

#### 9.2 Hiệu năng runtime
Theo 8.4: chỉ `transform`/`opacity`; canvas ≤ 2 ms/frame; dừng khi tab ẩn; `will-change` ≤ 6; không thư viện animation > 15 KB (chỉ cân nhắc `canvas-confetti` ~5 KB nếu tự viết burst trễ tiến độ).

#### 9.3 Font
- **Guest: tự host** (`@fontsource/*` cho 28 family whitelist, chỉ weight ở 5.4, `unicode-range` latin + latin-ext + vietnamese). Lý do: CSP đơn giản, không phụ thuộc mạng bên thứ 3 trong webview Zalo/Facebook, kiểm soát subset.
- Guest chỉ sinh `@font-face` cho **3 family đã resolve** (theo theme hoặc admin chỉnh); preload woff2 (vietnamese + latin) của font **script và heading dùng trên cover**; `font-display: swap`, riêng tên cover chờ tối đa 1.5 s.
- **Admin gallery theme / dropdown font**: tải font xem trước bằng Google Fonts CSS2 `&text=<glyph của tên cặp đôi + "&">` (design 2.3b) - vài KB mỗi font, 12 thẻ không nặng. Chỉ admin; CSP admin mở `fonts.googleapis.com` + `fonts.gstatic.com`. Mất mạng tới Google -> fallback font serif hệ thống (không chặn tương tác).
- QA: chuỗi `Nguyễn Thuỳ Linh · Đặng Hữu Phước · Hường · Quỳnh · Ngọc Ẩn · ẦẪỂỖỮ` cho từng theme trước khi bật theme đó (capabilities); script line-height ≥ 1.35; không `overflow:hidden`/`clip-path` sát chữ có dấu.

#### 9.4 Cache, OG
- `_headers`: `/content/images/*`, `/content/audio/*`, `/assets/*`, `/fonts/*`, `/ornaments/*`, `/theme-assets/*` -> `public, max-age=31536000, immutable` (ornament/theme-assets tên có hash do Vite emit hoặc đổi tên khi sửa); `/index.html`, `/content/config.json` -> `no-cache`; `/admin/*` -> `X-Robots-Tag: noindex` + `no-cache`.
- OG: plugin ghi `<title>`, `description`, `og:*` (URL tuyệt đối từ `meta.siteUrl`), `twitter:card`. Không cá nhân hoá theo tên khách. Chốt OG trước khi gửi link.
- Kiểm thử bắt buộc: webview **Zalo, Facebook, Messenger**, Safari iOS, Chrome Android tầm thấp.

---

## 👥 Phân công

- **Backend (backend-developer)**: **Không cần** - không có backend server. Phần "server" duy nhất là Google Apps Script (`apps-script/Code.gs`, ~200 dòng JS). **Đề xuất frontend-developer viết** (cùng ngôn ngữ, cùng nắm contract 4.4).
- **Frontend (frontend-developer)**: guest app (vanilla TS), admin app (Preact), shared, Vite plugins, ngân sách bundle, `_headers`/`_redirects`, Apps Script, README (tạo PAT theo 2.2, Cloudflare Pages, Sheet + Apps Script). Theo Kế hoạch.
- **Cần ui-ux-designer: Có** - cung cấp asset theo giai đoạn: 11 ornament sprite (mỗi bộ 6 phần, ≤ 12 KB gz), sprite 21 loại hạt (SVG), asset kiểu mở (phong bì, dấu sáp, cổng hoa WebP, cửa trăng, hộp quà...), poster tĩnh 17 kiểu mở cho gallery admin, ảnh minh hoạ các bước tạo token (8.2b); review visual cuối mỗi giai đoạn; duyệt chuỗi dấu tiếng Việt cho từng theme.
- **Có thể làm song song BE và FE: Có** - schema, enum, contract (StorageAdapter, postMessage + `fx:*`, Apps Script, manifest) đã đủ rõ; Apps Script (v3) làm song song v2; asset của designer làm song song code engine.

---

## 🗓️ Kế hoạch triển khai

Nguyên tắc: **schema v1 đầy đủ từ v1** (mọi enum hợp lệ, migrate/validate đủ). Giá trị chưa có module ở giai đoạn hiện tại được khai báo trong `src/shared/capabilities.ts` kèm fallback (vd openStyle chưa có -> `envelope`; theme chưa có -> `tram-vang`; loại hạt chưa có -> `petal-rose`; gói reveal chưa có -> `soft`); admin chỉ hiển thị lựa chọn đã có. Nhờ vậy thêm theme/hiệu ứng ở giai đoạn sau **không đổi schema, không cần migration**.

| Giai đoạn | Phạm vi | Tiêu chí hoàn thành (đo được) | Phụ trách |
|---|---|---|---|
| **v1 - Khung + schema + guest app lõi** | Scaffold Vite multi-page + TS strict; `src/shared` đầy đủ (types, enums 5.6, defaults, migrations v0->v1, merge, **registry đủ 12 preset dạng dữ liệu**, resolver, derive OKLCH **sáng + tối**, contrast, font registry 28 family, guest-name, section meta, ics, vietqr, capabilities); guest: 14 section, floating UI, lightbox, countdown `flip` + `simple` + milestones, map lazy, gift sheet + VietQR, music player; plugin `inject-config-og` (config + resolved + CSS vars + OG + modulepreload/preload); `_redirects`, `_headers`, `size-limit`. **Theme bật: 3** - `tram-vang` ★, `son-do` (ornament truyền thống), `dem-nhung` (kiểm chứng nhánh tối). **Kiểu mở: 3** - `envelope` ★, `card-flip`, `fade-zoom` (+ `none` = nhánh reduced-motion). **Hạt: engine `ParticleField` đủ 4 lớp bảo vệ, `scope: all`** + 5 loại (`petal-rose`, `heart`, `petal-peach`, `gold-dust`, `firefly`); burst `petals` + `fireworks-soft` (`every-view`); reveal gói `soft` + `gentle`; micro `btn-press`, `cta-breathe`, `copy-morph`, `segmented-slide`; ma trận cường độ 4 cấp + tự hạ cấp + reduced-motion + nút khách | `npm run build` ra static chạy trên CF Pages; sửa `config.json` tay -> site đổi đúng (3 theme, 5 font preset, bật/tắt/sắp xếp section, số thứ tự + nền xen kẽ đúng; giá trị chưa có -> fallback, không lỗi console ngoài `warn`); unit test xanh: `guest-name`, `migrations` (import `wedding-site/data/config.js` không mất dữ liệu), `merge`, `resolve` (quy tắc "theme" cho mọi nhóm 5.2), `derive` (12 preset khớp tương phản bảng 1.6.3 ±0.05; primary ngẫu nhiên 500 mẫu luôn ≥ 4.5:1 cả sáng/tối), `intensity` (mọi ô ma trận 5.3/5.10 đã triển khai), `vietqr/payload` (CRC đúng mẫu chuẩn), pháo hoa (ngưỡng 400 ms, cooldown 15 s, re-arm < 10% bằng fake timers); QR quét được bằng ≥ 2 app ngân hàng với 1 tài khoản thật; `size-limit`: JS ban đầu ≤ 60 KB, CSS ≤ 25 KB; Lighthouse mobile (throttle 4G, Moto G Power): LCP < 2.5 s, CLS < 0.05; hạt nền cả trang: 0 hạt vẽ trong vùng form RSVP/lời chúc (test Playwright đọc vị trí hạt qua hook debug), canvas dừng khi focus input; CSP `style-src` chốt; ui-ux-designer duyệt visual 3 theme | frontend-developer; ui-ux-designer (asset 3 theme + review) |
| **v2 - Admin + GitHub + kết nối + backup/restore** | Admin Preact responsive; **Kết nối lần đầu 3 bước** + Login passphrase + vault (2.3-2.6); `GitHubAdapter` (Git Data API 3.5), `DevServerAdapter` (+ `dev-admin-save`), `DownloadAdapter`; nháp IndexedDB (3.2) + undo; form từ schema-meta; **gallery theme 8.12** (cho theme đã bật) + dialog giữ/trọn gói; font, nhạc upload; **trình chọn hiệu ứng 8.13** + `fx:replay`/`fx:done` + Phát lại/0.5x/Mô phỏng (cho hiệu ứng đã bật); sections; preview; ImageSlot 3 khối + pipeline; link generator + toggle "Mã hoá link" + CSV `link_ma_hoa`; checklist + diff; publish 1 commit + poll; restore swap + 4 thao tác quay lại (3.4); export/import | Trên repo test private + CF Pages: kết nối lần đầu từ **điện thoại** ≤ 5 phút theo hướng dẫn; mỗi lỗi bảng 2.5 tái hiện được (token sai, token chỉ đọc, repo sai, nhánh sai, repo rỗng, offline, rate limit mock) và hiện đúng thông điệp; token hết hạn trước ngày cưới -> cảnh báo vàng ở 3 nơi; vault: sai passphrase bị từ chối, 5 lần -> khoá 30 s, ciphertext không chứa token dạng rõ (kiểm `localStorage`/IndexedDB/bundle/repo); publish từ điện thoại, site cập nhật ≤ 2 phút; thay ảnh hero -> file cũ vào `backup/`, tên mới có hash, publish không upload lại blob đã có (đếm request); **Restore 2 lần liên tiếp = tree ban đầu** (unit test mock + test thật); "Lấy lại ảnh trước đó" chỉ đổi nháp; "Hoàn tác tất cả" về đúng bản xuất bản; restore khi còn nháp -> nháp reset, file .json tải được và import lại đủ ảnh; xung đột ref (2 tab) báo đúng, không ghi đè; 401 giữa phiên về login vẫn giữ nháp; đổi theme khi đã chỉnh font -> dialog, "Giữ" giữ font; ui-ux-designer duyệt UX admin | frontend-developer; ui-ux-designer review |
| **v3 - Apps Script RSVP/guestbook + micro liên quan** | `apps-script/Code.gs` (ping, guestbook GET/POST, rsvp upsert theo `submissionId`, honeypot, validate, rate-limit, `LockService`); client `integrations/apps-script.ts`; trạng thái form design 4.10/4.11; fallback khi URL rỗng; nút ping trong admin; micro `wish-fly` (3 biến thể), `rsvp-success`, `choice-card`, `stepper-bump`, burst `onRsvp`; README | Gửi lời chúc/RSVP từ webview Zalo + Safari iOS ghi đúng Sheet; `hidden = TRUE` -> biến mất sau lần poll kế; "Sửa phản hồi" cập nhật dòng cũ; honeypot + gửi dồn bị chặn; tắt mạng -> giữ nội dung + "Thử lại"; "Không thể đến" không có confetti; chunk lazy mỗi cái ≤ 15 KB | frontend-developer; bắt đầu song song v2 sau v1 |
| **v4 - Thư viện mở rộng + polish/perf/QA** | **v4a**: 9 theme còn lại (`hong-phan`, `luc-bao`, `muc-giay`, `hoai-co`, `sen-cham`, `mau-nuoc`, `dat-nung`, `pastel-han`, `bien-dao`) + ornament/texture/photoFrame/divider tương ứng; 13 kiểu mở còn lại (`curtain`, `wax-seal`, `origami`, `double-door`, `flower-gate`, `scroll`, `card-3d`, `light-gather`, `gift-box`, `moon-gate`, `book`, `ink-spread`, `polaroid`); 16 loại hạt còn lại; burst `confetti`, `gold`, `red-paper`, `heart-burst`; reveal 4 gói còn lại (`editorial`, `letter`, `playful`, `cinematic`) gồm `mask-up`, `split-*`, `blur-in`, `parallax-layers`; micro còn lại (`btn-shine`, `photo-tilt`, `countdown-odometer`, `slide`, `scroll-progress`, `name-sparkle`, `music-ripple`, `gift-shake`, `calendar-flip`, `couple-heart-tap`); mỗi mục bật trong `capabilities.ts` khi đạt tiêu chí. **v4b**: tối ưu bundle, a11y WCAG 2.2 AA (design 9), ma trận thiết bị/webview, CSP cuối, Playwright smoke, README deploy + PAT + Cloudflare Access | Cả 12 theme: test tương phản tự động khớp 1.6.3, chuỗi dấu chồng duyệt bằng ảnh chụp từng theme; cả 17 kiểu mở: ≤ 2.4 s, chạm lần 2 tua nhanh ≤ 300 ms, bản Nhẹ/Nhiều đúng bảng 3.4b, module ≤ 4 KB, không clip chữ có dấu (ảnh chụp tên "Nguyễn Thuỳ Linh" giữa animation); `light-gather` ≥ 45 fps ở `medium` trên máy tầm trung và tự về `fade-zoom` khi mô phỏng máy yếu; với **tổ hợp nặng nhất** (`dem-nhung` + `light-gather` + `high` + `cinematic`) JS ban đầu vẫn ≤ 60 KB, trang đầu ≤ 900 KB; LCP < 2.5 s / CLS < 0.05 / INP < 200 ms trên Android tầm thấp 4G; axe 0 lỗi serious/critical; pháo hoa < 3 lần nháy/giây; checklist Zalo/Facebook/Messenger/Safari iOS/Chrome Android pass (nhạc, cover, link có dấu và link mã hoá, .ics, QR, bản đồ); người duyệt nghiệm thu | frontend-developer; ui-ux-designer (asset 9 theme + 13 kiểu mở, visual cuối) |

---

## ⚠️ Lưu ý kỹ thuật

- **Security**: không đưa PAT/passphrase vào repo, env build, tài liệu, log. `textContent` cho mọi chuỗi động. Kiểm tra quyền ghi bằng blob thử (2.3) thay vì tin `permissions.push`. CSP trong `_headers`:
  - Guest: `default-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self'; connect-src 'self' https://script.google.com https://script.googleusercontent.com; frame-src https://www.google.com; frame-ancestors 'self'; script-src 'self'; style-src 'self' <chốt ở v1>`.
  - Admin: thêm `connect-src https://api.github.com`, `frame-src 'self'`, `style-src https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`.
  - `mapUrl` chỉ `https:`, `mapEmbedUrl` chỉ host `www.google.com`, `phone` chỉ `tel:`.
- **Repo private**; dung lượng repo tăng theo số lần thay ảnh - chấp nhận. Backup không deploy.
- **Build quota**: mỗi Xuất bản/Khôi phục = 1 build; CF Pages 500 build/tháng là dư.
- **Xung đột**: optimistic lock bằng SHA nhánh (`force: false`).
- **Breaking change so với dự án cũ**: `config.js` -> `config.json`; `sections` thành object; theme `xanh-ngoc`/`xanh-navy` -> `luc-bao`; `vendor` gộp vào `footer`; `petals` -> `particles`. **So với revision 2**: `effects.intensity` đổi `light/strong` -> `low/high`; `theme.accentColor` -> `overrides.accent`; `effects.petals` -> `effects.particles`; `reveal.style` thành gói; `ornamentSet` `classic` -> `classic-line`. Chưa có code nên không cần migration cho rev 2.
- `file://` không hỗ trợ (dùng `npm run dev` / `npm run preview`).
- **Data/ETL**: không liên quan.

### Rủi ro & giới hạn

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Lộ PAT qua XSS / máy dùng chung | Cao | Fine-grained 1 repo + hạn; sessionStorage mặc định; vault AES-GCM + PBKDF2 600k; CSP; textContent |
| PAT hết hạn sát/trước ngày cưới | Trung bình | Hướng dẫn hạn ≥ 1 tháng sau cưới; cảnh báo 3 nơi (2.6) |
| Publish config hỏng | Trung bình | Validate + checklist; merge defaults + fallback capabilities; Khôi phục 1 click |
| Bundle phình do thư viện hiệu ứng | Trung bình | Code-split theo lựa chọn; `size-limit` fail build (9.1) |
| Hạt cả trang che chữ / tốn pin | Trung bình | 4 lớp bảo vệ 5.7; tự hạ cấp; nút tắt cho khách |
| Animation giật trên Android yếu | Trung bình | Tự hạ cấp phần cứng + FPS; `light-gather` -> fade; chỉ transform/opacity |
| VietQR sinh sai | Trung bình | Unit test payload; quét thử trong admin; ưu tiên `qrImage` upload |
| Nhạc không phát trong webview | Trung bình | `play()` trong user gesture; nút "Chạm để bật nhạc" |
| Cache ảnh/OG cũ (Zalo) | Trung bình | Tên file hash, immutable; chốt OG trước khi gửi link |
| Guestbook spam | Trung bình | Honeypot, rate-limit, cột `hidden` |
| Nháp mất do trình duyệt dọn IndexedDB (Safari 7 ngày) | Thấp | `navigator.storage.persist()`; cảnh báo "chưa xuất bản"; nút tải nháp; xuất bản sớm |
| Safari không encode WebP, HEIC | Thấp | Fallback JPEG; báo chọn JPG/PNG |
| Asset của 9 theme / 13 kiểu mở trễ | Thấp | Capabilities: chưa xong thì không bật, schema không đổi |

---

## ❓ Quyết định đã chốt

Nguồn: [`decisions.md`](./decisions.md). Áp dụng trong file này:
1. Lưu trữ **A - GitHub repo private + Cloudflare Pages**, B (dev server) phụ; `*.pages.dev` trước.
2. RSVP + Guestbook: **Google Sheet + Apps Script**; guestbook hiện ngay, ẩn bằng `hidden`.
3. Mặc định: `tram-vang` + `envelope` (qua `"theme"`) + font Cổ điển + `effects.intensity = medium`.
4. Thư viện **12 theme**, **17 kiểu mở**; theme tối **`dem-nhung` có trong bản đầu, không mặc định** (Q16).
5. Đổi theme **chỉ thay phần "Theo theme"** (Q17).
6. Hạt nền mặc định **cả trang** (Q18); `light-gather` giữ, máy yếu hạ về fade (Q19).
7. Pháo hoa đếm ngược **mỗi lần cuộn tới** + cooldown (Q20).
8. Login: fine-grained PAT + tuỳ chọn vault passphrase; màn Kết nối lần đầu (design 8.2b).
9. Link khách: `?to=` chính, `/invite/<slug>` phụ, **giữ dấu mặc định + toggle "Mã hoá link"**; danh sách khách chỉ local + CSV.
10. Cover mỗi lần mở link; hero ghim đầu, footer ghim cuối.
11. QR VietQR **sinh client-side**, chỉ hiện khi bấm, test 1 tài khoản thật ở v1; có thêm vào lịch, chỉ đường; bản đồ bấm mới tải.
12. Love story có, mặc định tắt; tự cuộn / lời chúc bay / vendor: tắt.
13. Nhạc 1 bài lặp, ≤ 8 MB; **âm lịch nhập tay** (không nút "Tự tính").
14. Ảnh: hero/cover 2000 px, **album full 1600 px** + thumb 600 px, khác 1200 px.
15. Restore: **chỉ cả trang** (config + ảnh) của lần publish gần nhất, swap, bấm lại = redo; nút ở ImageSlot là thao tác nháp; khôi phục khi còn nháp -> nháp đặt lại theo trang vừa khôi phục (có nút tải nháp).
16. **Stack FE: Vite + TypeScript; guest vanilla TS + CSS variables; admin Preact + TS**; không Angular.

---

## ✅ Checklist trước khi implement

- [x] Confirm phương án lưu trữ, hosting, đăng nhập, RSVP/guestbook (decisions.md)
- [x] Chốt stack FE (decisions.md)
- [ ] Review schema v1 + enum (5.5, 5.6, 5.7) + migrator v0 -> v1
- [ ] Xác nhận contract: StorageAdapter, postMessage (`wp:*`, `fx:*`), Apps Script, backup manifest
- [ ] Xác nhận ngân sách bundle (9.1) và phạm vi v1 (3 theme, 3 kiểu mở, 5 loại hạt)
- [ ] Chốt các điểm Còn mở
- [ ] Chuẩn bị: repo GitHub private, project Cloudflare Pages, Google Sheet + Apps Script, 1 tài khoản ngân hàng thật để quét thử QR (người duyệt tự làm, không đưa secret/STK vào tài liệu)
- [ ] Bổ sung lệnh build/test vào CLAUDE.md của dự án (`npm run build` gồm `size-limit`, `npx vitest run`, `npx playwright test`)

---

## Còn mở

1. **CSP `style-src` cho guest**: CSS vars theme được inline `<style>` và một số hiệu ứng set `style` qua JS (CSSOM không bị CSP chặn, nhưng `<style>` inline thì có). Giả định mặc định: plugin build tính **hash SHA-256** của `<style>` inline và ghi vào `_headers` (`style-src 'self' 'sha256-...'`); preview mode (admin, cùng origin) dùng `adoptedStyleSheets`/CSSOM nên không cần `unsafe-inline`. Chốt ở v1; nếu hash phức tạp với webview cũ thì lùi về `'unsafe-inline'` chỉ cho `style-src`.
2. **Admin dùng Google Fonts `&text=` cho gallery/dropdown font** (design 2.3b) trong khi guest tự host. Giả định mặc định: chấp nhận cho admin (chỉ chủ nhà dùng, không ảnh hưởng khách; CSP admin mở 2 domain Google). Phương án thay: tự host toàn bộ whitelist cho admin (nặng hơn ~1 MB khi mở gallery trên mobile).
3. **Theme thứ 3 của v1 là `dem-nhung`** (để kiểm chứng sớm nhánh tối) thay vì một theme sáng phổ biến như `hong-phan`. Giả định mặc định: giữ `dem-nhung`; người duyệt có thể đổi, chi phí như nhau.
4. **Ngưỡng hiệu năng `light-gather`** (≥ 45 fps ở `medium` trên máy tầm trung): nếu không đạt ở v4, giả định mặc định là giảm còn 250 hạt ở `medium` (giữ 700 ở `high`) thay vì bỏ kiểu này; cần ui-ux-designer đồng ý về độ "đầy" của tên.
