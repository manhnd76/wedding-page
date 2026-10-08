# Frontend report v2.3: đăng nhập mật khẩu, token chỉ hỏi khi cần, sửa phong bì E01–E11

> Branch `feat/20261007-wedding-page-v2.3`, tách từ v2.2 (55b8b69). **Chưa commit.** Nguồn chính: `decisions.md` mục "Đổi luồng đăng nhập admin" và "Bảo mật login", cùng bảng E01…E12 trong `design-review-envelopes.md`. Có đối chiếu thêm `solution.md` Rev 4 (solution-designer đang viết song song). Chỗ nào lệch Rev 4 đều ghi ở mục 6.

## 1. Kết quả (chạy thật, 2026-10-08)

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | 0 lỗi |
| `npm test` | 21 file, **407/407** pass (v2.2: 392). Thêm `tests/admin-auth.test.ts` (8 test) và `tests/connection-flow.test.ts` (7 test) |
| `npm run build` | exit 0, đạt mọi ngân sách size-limit |
| `npm run test:e2e` | **34/34** pass (2.9 phút). Thêm 9 test: login/không token/Kết nối, quét `dist/`, E01 × 6 mẫu, E05/E10/E11 |

Kích thước gzip, so với v2.2:

| Gói | Đo được / ngân sách | v2.2 |
|---|---|---|
| Guest JS ban đầu | 31.22 / 60 kB | 30.52 |
| Guest CSS | 11.36 / 25 kB | 11.01 |
| openStyle envelope | 1.58 / 4 kB | |
| Mẫu kraft | 983 B / 1.5 kB | |
| **Admin JS ban đầu** | **73.15 / 80 kB** | 73.45 (giảm nhờ màn Kết nối chuyển sang tải lười) |
| Admin CSS | 6.48 / 10 kB | |
| Route lười `connect` (mới) | 3.84 / 15 kB | |

## 2. Luồng đăng nhập và token

```
/admin ── có phiên wp_admin_auth_v1 (sessionStorage, gắn với hash hiện tại)? ──có──┐
   │ không                                                                         │
   ▼                                                                               │
[ĐĂNG NHẬP] 1 ô mật khẩu -> PBKDF2-SHA256 600k so với ADMIN_PASSWORD_HASH          │
   │ sai: "Mật khẩu chưa đúng", xoá ô, giữ focus; 5 lần -> khoá 30s (UnlockGuard)  │
   │ đúng: mật khẩu chỉ giữ trong bộ nhớ trang                                     │
   │   có token đã "Ghi nhớ"? -> mở bằng CHÍNH mật khẩu -> phiên GitHub của tab     │
   │   (mở không được: vault passphrase v2.2 / mật khẩu đã đổi -> xoá vault + toast)│
   ▼                                                                               ▼
[TRANG QUẢN LÝ] nơi lưu = GitHub (có token) | Site (chưa có token: đọc /content/config.json cùng origin)
   │ sửa / xem trước / tải ảnh-nhạc vào nháp IndexedDB: không cần token
   │ bấm Xuất bản | Khôi phục | "Kết nối GitHub" (Tổng quan) khi nơi lưu = Site
   ▼
[KẾT NỐI GITHUB] (8.2b, tải lười, phủ lên trang quản lý, trang quản lý vẫn mounted)
   │ ← Quay lại chỉnh sửa: không đổi gì
   │ Tải gói .zip để tự commit -> chế độ không kết nối (Xuất bản = tải gói)
   │ Dùng máy chủ dev (chỉ khi chạy vite dev)
   │ kiểm tra 3 bước ✓ -> [Kết nối và tiếp tục]
   │   Ghi nhớ (mặc định BẬT theo decisions): mã hoá token bằng mật khẩu đăng nhập (localStorage)
   │   Không ghi nhớ: token chỉ ở sessionStorage
   ▼
đổi sang GitHubAdapter, giữ nháp, so publish.id -> làm tiếp đúng thao tác (mở dialog Xuất bản / dialog Khôi phục)

401 giữa phiên: xoá token và vault, về Site, giữ nháp. Nếu đang Xuất bản/Khôi phục thì mở lại Kết nối kèm thông báo.
Ngắt kết nối GitHub (Tổng quan): xoá token phiên + vault, giữ owner/repo, về Site.
Đăng xuất: xoá phiên đăng nhập, token phiên, chế độ, mật khẩu trong bộ nhớ. Giữ vault, conn, nháp.
```

- Logic luồng nằm ở `src/admin/state/connection.ts` (`ConnectionFlow`, `initialAdapter`), không phụ thuộc UI nên unit test được. `Editor` chỉ gọi `request()`, `connected()`, `useDownload()`, `useDev()`, `disconnect()`, `authLost()`.
- `SiteAdapter` (`local-adapters.ts`, kind `site`) dùng commit giả `site`. `publish`/`restore` ném lỗi `need-connection` để phòng hờ.
- `EditorStore.setAdapter()` đổi nơi lưu giữa phiên và giữ nháp. Khi `reloadSnapshot`, chỉ hỏi "nháp cũ" khi **cả** commit **lẫn** `publish.id` đều khác, nên lần đầu chuyển từ site sang GitHub không bị hỏi nhầm. Hai chỉnh thêm: ghi autosave đang chờ trước khi đọc IndexedDB, và giữ nháp trong bộ nhớ nếu người dùng sửa tiếp trong lúc đang tải. Lỗi race này lộ ra trong e2e và đã có unit test.
- `status.ts`: thêm nhánh `site`. Dòng trạng thái vẫn đúng ("Chưa xuất bản lần nào", "Có N thay đổi chưa xuất bản", "Đã xuất bản · giờ"), kèm `hint` "Chưa kết nối GitHub…" hiện ở thẻ Tổng quan. Top bar ghi "Chưa kết nối GitHub" (`tb-mode`).
- Sao lưu/Khôi phục khi nơi lưu là Site hoặc tải gói: hiện "Bản sao lưu nằm trên GitHub…" và nút "Kết nối GitHub để khôi phục". Kết nối xong thì tự mở dialog Khôi phục bước 1 (`store.takeResume('restore')`).
- Cảnh báo token sắp hết hạn trước ngày cưới vẫn như cũ: `tokenExpiresAt` lấy từ phiên hoặc vault, truyền vào `setAdapter`.

## 3. Đổi mật khẩu (đã ghi trong README)

1. Chạy `npm run admin:hash -- "mật-khẩu-mới"`. Nếu không muốn mật khẩu nằm trong lịch sử lệnh, dùng `npm run admin:hash -- --stdin` rồi gõ mật khẩu và Enter, hoặc đặt biến `WP_ADMIN_PASSWORD`. Script in ra dòng `pbkdf2-sha256$600000$<salt>$<hash>` (salt ngẫu nhiên). Mật khẩu dưới 12 ký tự thì script cảnh báo.
2. Dán dòng đó vào `ADMIN_PASSWORD_HASH` trong `src/admin/auth/password.ts`.
3. Chạy `npm test` (có test quét mật khẩu dạng rõ), rồi build và deploy. Phiên đăng nhập cũ hết hiệu lực vì phiên gắn với hash. Token đã "Ghi nhớ" bằng mật khẩu cũ sẽ bị xoá ở lần đăng nhập tới.

Chuỗi mật khẩu rõ **không** có trong `src/`, `tests/`, `scripts/`, `public/`, `README`, `dist/`. Test đọc mật khẩu từ `WP_ADMIN_TEST_PASSWORD` hoặc ghép chuỗi lúc chạy. Unit test quét repo và `dist/`; e2e quét lại `dist/` sau khi build và kiểm có hash.

## 4. Bảng E01–E11

| ID | Trạng thái | Cách làm | Kiểm |
|---|---|---|---|
| E01 | Đã sửa | Bỏ `-webkit-line-clamp` và `overflow:hidden`, đặt `line-height:1.3` và `padding-block:.08em`. `fitEnvGuest()` (cover.ts) đo layout thật, giảm theo bậc 22→19→17→15px (không lớn hơn cỡ CSS ban đầu): tối đa 2 dòng, riêng 15px cho 3 dòng. Đo lại khi resize và khi font về muộn. `.env-addr` bắt đầu từ `tip + seal × .42` | e2e 360×740 × 6 mẫu × 4 tên ("Gia đình anh chị Nguyễn Văn Mạnh và các cháu", "Phượng", "Quỳnh", "Ngọc Ẩn"). Kiểm: không clamp, overflow visible, `scrollHeight ≤ clientHeight`, mọi rect dòng chữ nằm trong `.env-addr` và phong bì, không đè dấu, ≤ 3 dòng, ≥ 15px. Tên dài ra 17px/2 dòng ở mọi mẫu (minimal 18px). Đã xem ảnh classic, kraft (Son Đỏ), minimal, velvet, classic và lace (Đêm Nhung) |
| E02 | Đã sửa | Kraft: đoạn dây dọc phía dưới nút chỉ vẽ tới mép trên thẻ (`V129`), nên thẻ "treo" từ nơ. Thẻ 72% × 40%, `bottom:6%`, có auto-fit như E01 | e2e: đáy đường dây ≤ mép trên thẻ + 3px. Ảnh Son Đỏ: tên dài 2 dòng, không còn "và.." |
| E03 | Đã sửa | `.env-addr::before` là "vùng nhãn" radial theo `--env-label` (mặc định = màu giấy), `isolation:isolate`. Kraft tắt. Velvet pha màu quầng để không thành mảng tối | Xem ảnh: nếp gấp mờ dần dưới chữ |
| E04 | Đã sửa | `.cv-head` mờ, `translateY(-8px)` trong `[flapAt+200, pullAt+250]` (classic Vừa khoảng 380–900ms, Nhẹ khoảng 200–500ms). Bỏ bước mờ ở `dropAt`. Tổng thời lượng không đổi | e2e cũ "không khung nào bị cắt / ≤ 2.4s" vẫn pass |
| E05 | Đã sửa | Ở trạng thái stopped hoặc idle: khi khách cuộn thì thêm `.is-hiding` (opacity 0, `pointer-events:none`, 160ms), đứng yên 1.2s thì hiện lại. Đang chạy thì giữ nguyên. Focus vào ô nhập thì cả cụm nút đã ẩn sẵn (`.is-typing`) | e2e: dừng bằng wheel, cuộn tiếp thì nút ẩn và không nhận chạm; vẫn ẩn khi còn cuộn; hiện lại trong 2.5s; bấm được "Tiếp tục" |
| E06 | Đã sửa | Theme tối với classic/minimal/lace: `--env-paper` = surface 86% + accent 14%, `--env-edge` = accent 55%, `.env-back` có viền sáng 1px accent 30%. Lace: `.lc-h` dùng màu liner, opacity .55. Mép ren (light) = accent 70% + text | Xem ảnh Đêm Nhung: classic/lace đã thấy hình phong bì. **Chưa đo tương phản bằng pixel** |
| E07 | Đã sửa | Velvet "Theo theme" trên theme sáng: `.vv-glow` = `--c-primary`, opacity .10 | Chưa chụp |
| E08 | Đã sửa | Minimal: chỉ thêm "·" khi `:not(.is-multi)`. Khi tên xuống dòng hoặc tách khỏi dòng prefix thì có `.is-multi`, chuyển thành cột căn giữa | Ảnh minimal: "KÍNH GỬI" thành dòng riêng, không có dấu treo |
| E09 | Đã sửa | `--seal: clamp(52px, env-w × .165, 92px)` khai 1 lần trên `.cv-env`. Monogram `max(15px, seal × .26)` | Mobile khoảng 52px. **Desktop chưa chụp** |
| E10 | Đã sửa | Tooltip nhạc nằm bên trái nút nhạc (`right:60px; bottom:7px`), có mũi tên chỉ sang phải (`:has(.fl-tip.is-on)`) và cắt "…" khi dài | e2e: tooltip không chồng nút tự cuộn |
| E11 | Đã sửa | Khi `html.is-autoscroll`: pill giữ `is-mini`, bỏ timer 800ms. Hết tự cuộn thì quay lại luật cũ | e2e: lấy mẫu 3s lúc tự cuộn, pill luôn mini |
| E12 | Để v4 | Theo decisions | |

## 5. Tệp

- **Mới:** `src/admin/auth/password.ts`, `src/admin/state/connection.ts`, `scripts/admin-hash.mjs`, `tests/admin-auth.test.ts`, `tests/connection-flow.test.ts`, `tests/e2e/helpers.ts`.
- **Sửa (admin):** `app.tsx`, `auth/vault.ts`, `screens/{login,connect}.tsx`, `editor/{editor.tsx,status.ts,routes/overview.tsx,routes/backup.tsx}`, `state/store.ts`, `storage/{adapter,local-adapters}.ts`, `admin.css`.
- **Sửa (guest):** `cover/cover.ts`, `cover/styles/envelope.ts`, `cover/skins/kraft.ts`, `autoscroll/autoscroll.ts`, `floating/floating.ts`, `styles/{cover,base}.css`.
- **Sửa (khác):** `package.json` (script `admin:hash`), `README.md`, `tests/{vault,editor-store}.test.ts`, `tests/e2e/{admin,admin-v22,guest}.spec.ts`.
- Không thêm dependency.

## 6. Lệch so với spec, kèm lý do

1. **Nơi lưu hash và script khác `solution.md` Rev 4 2.7.** Rev 4 đề xuất `auth/admin-password.ts` dạng object, sinh bằng `set-admin-password.mjs` hỏi qua TTY. Mình làm theo brief của task: hằng số chuỗi `ADMIN_PASSWORD_HASH` trong `src/admin/auth/password.ts` và `npm run admin:hash -- <mật khẩu>` để in hash. Để tránh lộ qua lịch sử lệnh, script nhận thêm `--stdin` hoặc biến môi trường. Thuật toán giống Rev 4: PBKDF2-SHA256 600k, salt 16 byte, so hết 32 byte, NFC, không trim.
2. **Vault giữ định dạng `wp_admin_vault_v1`**, không làm `v2` + `pwTag` như Rev 4 2.4. Vault không mở được bằng mật khẩu đăng nhập (vault passphrase của v2.2, hoặc đã đổi mật khẩu) thì bị xoá khi đăng nhập và có toast. Hệ quả: nếu đã đổi mật khẩu thì tốn thêm 1 lần PBKDF2 thử mở.
3. **"Ghi nhớ" mặc định BẬT** theo decisions "Bảo mật login", khác Rev 4 (đề xuất tắt). Khi bật có hiện cảnh báo theo Rev 4 2.9.
4. **Mở vault ngay trong lúc đăng nhập**, không chạy nền sau login như Rev 4. Lý do: tránh trường hợp bấm Xuất bản trước khi token mở xong mà bị hỏi token nhầm. Chỉ tốn thêm khoảng 0.5–1s trên máy cũ, và chỉ khi có token đã ghi nhớ.
5. **E2E dùng hash thật**, mật khẩu lấy từ env hoặc ghép chuỗi lúc chạy, thay cho plugin `WP_ADMIN_PASSWORD_FILE` + `addInitScript` của Rev 4. Cách này đơn giản hơn và vẫn không có chuỗi rõ trong repo.
6. **Chưa làm** điều kiện cho Cloudflare Access ở Rev 4 2.9 mục 4 (đưa mọi chunk chỉ admin dùng vào `dist/admin/`). Hash hiện nằm trong `dist/assets/admin-*.js`, nên rule `/admin/*` không che được file này. Brief không giao việc này; nó đụng cấu hình output của Vite và đường dẫn ngân sách size-limit.
7. **"Lấy lại ảnh trước đó" (ImageSlot) khi chưa kết nối:** chưa có dòng "Kết nối GitHub để xem ảnh trước đó". Lúc chưa kết nối không có manifest nên khối này tự ẩn. Kết nối xong thì hiện như cũ.
8. **Phiên đăng nhập** lưu `{v, k: 16 ký tự cuối của chuỗi hash, at}`, không phải `h` = 8 ký tự đầu như Rev 4. Ý nghĩa giống nhau: đổi hash thì phiên cũ hết hiệu lực.
9. **Đối chiếu `publish.id` khi kết nối** dùng lại dialog "nháp cũ" (8.8). Chưa có toast "Đã cập nhật theo bản mới nhất trên GitHub" cho trường hợp nháp không có thay đổi: khi đó store thay bản xuất bản luôn, không thông báo.

## 7. Bảo mật (để người duyệt biết)

Như solution 2.9: hash nằm trong bundle công khai, mà mật khẩu ngắn (7 ký tự) thì dò offline được. Ai lấy được `localStorage` của máy đã bật "Ghi nhớ" sẽ giải được token. Cổng đăng nhập chỉ là lớp che mắt; lớp bảo mật thật vẫn là token fine-grained. README đã ghi rõ điều này và khuyên dùng mật khẩu dài hơn.

## 8. Cần kiểm tra tay

- Điện thoại thật (iOS Safari, Android Chrome):
  - đo thời gian đăng nhập (PBKDF2 600k), cộng thêm 1 lần nữa nếu có token ghi nhớ;
  - màn Kết nối mở từ nút Xuất bản ở mobile; "← Quay lại chỉnh sửa" giữ đúng tab và vị trí.
- Kết nối GitHub thật (token test của người duyệt): kết nối xong thì dialog Xuất bản tự mở; "Ghi nhớ" hoạt động (đóng tab, đăng nhập lại là xuất bản được ngay); "Ngắt kết nối"; token hết hạn giữa phiên.
- Trình duyệt đang giữ vault của v2.2 (passphrase riêng): đăng nhập phải thấy toast "không mở được…", sau đó Xuất bản hỏi lại token.
- Phong bì:
  - E06: đo tương phản viền và giấy trên nền tối (mục tiêu ≥ 1.5:1, mép ren ≥ 2:1);
  - E07: velvet "Theo theme" trên Trầm Vàng / Son Đỏ;
  - E09: seal ở desktop 1440×900;
  - E01: kiểm kraft với font thật của Son Đỏ (ảnh mình chụp dùng runtime-resolve nên font có thể là font dự phòng);
  - E04: xem tốc độ thật ở cấp Nhẹ.
- E10: tooltip tên bài dài, có lúc đè lên pill bên trái trong 3s đầu (pill nằm dưới, tooltip `pointer-events:none`).
- Screen reader: lỗi đăng nhập (`aria-live`), màn Kết nối phủ lên trang (trang quản lý đang `display:none`).
