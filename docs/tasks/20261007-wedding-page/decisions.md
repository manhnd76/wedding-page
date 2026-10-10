# Decisions - Cổng 1 (2026-10-07)

## Người duyệt chọn trực tiếp
1. Lưu trữ + hosting: **Phương án A - GitHub (repo private) + Cloudflare Pages**, kèm chế độ local (B) làm phụ.
2. RSVP + Guestbook: **Google Sheet + Apps Script**.
3. Phong cách mặc định: **Trầm Vàng + phong bì mở nắp**; font mặc định Playfair Display + Great Vibes + Be Vietnam Pro.
4. Mức animation mặc định: **Vừa**.

## Giả định mặc định (đã trình bày, người duyệt không yêu cầu đổi)
- Dùng cá nhân, 1 cặp đôi/site, chỉ tiếng Việt.
- Login admin: GitHub fine-grained token, tuỳ chọn lưu mã hoá bằng passphrase.
- Domain: `*.pages.dev` trước, domain riêng sau.
- Link khách: `?to=` chính, `/invite/<slug>` phụ; giữ dấu tiếng Việt.
- Không lưu danh sách khách lên server (local + CSV).
- Không theme tối ở bản đầu.
- Màn phong bì hiện mỗi lần mở link.
- QR mừng cưới: có (VietQR), chỉ hiện khi bấm; có thêm vào lịch, chỉ đường.
- Love story: có, mặc định tắt.
- Tự cuộn / lời chúc bay / footer vendor: tắt.
- Hero ghim đầu, footer ghim cuối.
- Bản đồ: bấm mới tải.
- Nhạc: 1 bài, lặp; upload qua admin ≤ 8MB.
- Âm lịch: nhập tay.
- Admin: dùng được trên mobile, framework Preact.
- Restore: cả config + ảnh của lần publish gần nhất (swap, bấm lại = redo).
- Guestbook: hiện ngay, ẩn bằng Sheet.

## Đồng bộ cần làm
- 4 theme preset theo design.md: Trầm Vàng, Hồng Phấn, Lục Bảo, Son Đỏ.
- Gộp phụ lục field schema của design.md vào schema trong solution.md.

## Bổ sung từ người duyệt (2026-10-07, sau Cổng 1)
- Theme/animation trong config.js cũ CHỈ để tham khảo. ui-ux-designer phải tự thiết kế THÊM theme và animation mới (không giới hạn ở 4 preset / các hiệu ứng cũ).
- Trầm Vàng + phong bì + mức "Vừa" vẫn là mặc định.

## Quyết định vòng 2 (2026-10-07)
- Q16: Có theme tối `dem-nhung` trong bản đầu, không mặc định (thay giả định "không theme tối").
- Q18: Hạt nền mặc định hiện **cả trang** (không chỉ Hero/Cảm ơn).
- Q20: Pháo hoa ở countdown chạy **mỗi lần cuộn tới countdown**.
- Link khách: giữ dấu mặc định + tuỳ chọn mã hoá.
- Giả định chấp nhận (người duyệt không phản đối): Q17 đổi theme chỉ thay phần "Theo theme"; Q19 giữ `light-gather`, máy yếu hạ xuống fade; VietQR sinh client-side, test bằng 1 tài khoản thật ở v1.

## Quyết định stack FE (2026-10-07)
- Người duyệt xác nhận: Vite + TypeScript; trang thiệp = vanilla TS + CSS variables; admin = Preact + TS. Không dùng Angular (CLAUDE.md global không áp dụng cho dự án này).

## Restore khi còn nháp (2026-10-07)
- Người duyệt đồng ý: "Khôi phục bản publish trước" sẽ reset nháp theo bản vừa khôi phục; có nút tải nháp về máy trước khi khôi phục.

## Đặt tên giai đoạn (2026-10-07)
- Người duyệt yêu cầu đổi tên giai đoạn M1..M4 thành **v1..v4** (v4a/v4b). Branch code: `feat/20261007-wedding-page-v1`.

## Nhận xét sau khi xem v1 local (2026-10-07)
- Thêm **nhiều mẫu phong thư** cho màn mở đầu (kiểu `envelope`), admin cấu hình chọn được. (ui-ux-designer đề xuất mẫu + field schema; triển khai sau khi người duyệt xem xét.)
- **Tự động cuộn sau khi mở thiệp**: BẬT mặc định (thay giả định cũ "Tự cuộn: tắt"); dừng ngay khi khách tác động cuộn/chạm/phím. (ui-ux-designer spec chi tiết: tốc độ, tiếp tục lại hay không, reduced-motion.)
- v1 đã commit trên `feat/20261007-wedding-page-v1` (3780836). v2 làm trên `feat/20261007-wedding-page-v2` (tách từ v1).

## Quyết định sau review visual v1 (2026-10-08)
- Phong bì: "Kính gửi + tên khách" in trên mặt phong bì; tên cặp đôi đặt phía trên, ngoài phong bì.
- Làm đủ 6 mẫu phong thư (`classic` ★, `kraft`, `song-hy`, `lace`, `minimal`, `velvet`); `song-hy`/`kraft`/`velvet` giữ màu cố định (vẫn chọn được "Theo theme").
- Tự cuộn: bật mặc định, 45px/s, bắt đầu sau 2.5s, `flow` dừng 1.2s đầu mỗi section; khách tác động -> dừng hẳn, có nút Tiếp tục (không tự tiếp tục). Reduced-motion: không tự chạy, khách tự bấm được. Import config cũ: kẹp `startDelayMs` tối thiểu 1500.
- Hạt nền bay qua chữ quan trọng (tên khách, tên cặp đôi, lời mời): mờ xuống 0.3 (không ẩn hẳn).
- Áp dụng toàn bộ 24 điểm trong design-review-v1.md theo đề xuất của designer (trừ khi người duyệt nói khác).

## Quyết định sau v2.1 + review admin (2026-10-08)
- Tự cuộn với config cũ: chuyển sang BẬT 45px/s. Thực tế chưa có config nào được publish, nên chỉ cần: defaults + config mẫu + import config v0 đều ra `enabled: true` (v0 có `speed` thì giữ, `startDelayMs` kẹp ≥ 1500). Không thêm migration cho config v1.
- Giả định admin được chấp nhận: Undo mobile đặt ở top bar; mini preview sticky mobile để v4 (v2.x dùng toast "[Xem ↗]"); admin dùng font hệ thống; đổi tên "Sections" -> "Các phần & thứ tự".
- v2.1 commit trên `feat/20261007-wedding-page-v2.1`; v2.2 (sửa 23 điểm admin còn lại) trên `feat/20261007-wedding-page-v2.2`.

## Đổi luồng đăng nhập admin (2026-10-08)
- Người duyệt hỏi có thể sửa cấu hình "không cần deploy" không; sau khi biết site tĩnh thì mọi thay đổi (kể cả text) đều phải publish -> **giữ nguyên luồng publish qua GitHub**, không thêm nơi lưu runtime.
- **Cổng login** khi vào `/admin`: mật khẩu do người duyệt cung cấp (không ghi dạng rõ trong repo), lưu **dạng hash** trong code (không có chuỗi rõ trong repo/bundle). Sau login được sửa/xem trước/upload vào nháp thoải mái.
- **Token GitHub chỉ hỏi khi cần**: lần đầu bấm Publish/Khôi phục (hoặc thao tác bắt buộc gọi GitHub) mới mở màn Kết nối GitHub — không bắt kết nối ngay khi vào admin.
- Giả định mặc định (orchestrator): token "ghi nhớ" được mã hoá bằng chính mật khẩu login (bỏ passphrase riêng); bản xuất bản hiện tại đọc từ chính site (`/content/config.json` cùng origin) khi chưa có token.
- Phạm vi: v2.2 commit; **v2.3** = login mới + sửa E01–E11 (design-review-envelopes.md) theo giả định designer: tên khách dài tự giảm cỡ, tối đa 3 dòng (≥15px), không mất dấu; nút "Tiếp tục tự cuộn" ẩn khi khách cuộn, hiện lại sau 1.2s đứng yên; kraft dây dừng ở mép thẻ; theme tối pha 14% accent cho classic/minimal/lace; chấp nhận hình nắp mới. E12 (hiệu ứng "Nhiều" riêng từng mẫu) để v4.

## Bảo mật login (2026-10-08)
- "Ghi nhớ token trên máy này": **mặc định BẬT** (người duyệt chọn, chấp nhận rủi ro token mã hoá bằng mật khẩu ngắn có thể bị giải nếu lộ localStorage).
- Không sửa lịch sử commit 55b8b69 (có mật khẩu rõ trong decisions.md, chưa push) — người duyệt chấp nhận.

## Kế hoạch (2026-10-08)
- Đưa backlog **B1 "mỗi section một kiểu reveal"** vào **v4a** (cùng 4 gói reveal còn lại). Trước khi code cần: ui-ux-designer thiết kế (gán theo section, chế độ tự động xen kẽ, UX admin), solution-designer bổ sung schema.
- Cập nhật: đưa luôn **B2** (hoạ tiết nền vector) và **B3** (mascot theo scroll/nghiêng máy) vào **v4a**. Cả B1–B3 cần thiết kế (ui-ux) + schema (solution) trước khi code.

## Quy ước làm việc của agent (2026-10-08)
- Ghi tiến độ liên tục vào report theo từng phần (vd mỗi bug/ID xong ghi 1 lần) để agent sau tiếp tục được khi bị ngắt.
- Hạn chế e2e/chụp màn hình lặp: designer lưu ảnh bằng chứng cho từng lỗi (`docs/tasks/<task-id>/screenshots/...`), FE dùng ảnh đó thay vì chạy lại e2e để tái hiện; full e2e chỉ chạy 1 lần cuối. Đã ghi vào `CLAUDE.md` dự án (mục "Quy ước làm việc của agent"). Thư mục screenshots được gitignore.

## Review plan đầu phiên (2026-10-09)
- Thứ tự: **v4a trước v3** (RSVP/lời chúc để sau).
- Chia v4a thành 3 đợt, mỗi đợt kiểm tra/duyệt/commit riêng:
  - **v4a-1**: 9 theme còn lại + asset (ornament/texture/photoFrame/divider) + **B2** hoạ tiết nền vector.
  - **v4a-2**: animation — 13 kiểu mở, 16 hạt, 4 burst, 4 gói reveal, micro, **B1** reveal theo section, **E12**.
  - **v4a-3**: **B3** mascot theo scroll/nghiêng máy.
- Quy trình mỗi đợt: ui-ux-designer thiết kế + asset -> solution-designer bổ sung schema/kế hoạch -> frontend-developer code -> designer review.
- Ghi nhận: người duyệt đã sửa `public/_redirects` thành `/invite/*  /  200` cho Cloudflare Pages (commit 60f385c).

## Review toàn bộ plan + chạy song song (2026-10-09, phiên cloud)
- Phiên cloud: Claude đóng vai orchestrator theo `.claude/agents/orchestrator.md`.
- E2E chạy được trên cloud: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`; cổng e2e tham số hoá `PW_PREVIEW_PORT`/`PW_DEV_PORT` để nhiều worktree chạy song song.
- **Tách v4a-2 thành 3 đợt** (người duyệt đồng ý):
  - **v4a-2a**: B1 reveal theo section + 4 gói reveal (`editorial`, `letter`, `playful`, `cinematic`) + micro còn lại.
  - **v4a-2b**: 13 kiểu mở còn lại + E12 ("Nhiều" riêng từng mẫu phong thư).
  - **v4a-2c**: 16 loại hạt còn lại + 4 burst (`confetti`, `gold`, `red-paper`, `heart-burst`).
- **Chạy song song nhiều agent** (người duyệt yêu cầu): các đợt độc lập làm đồng thời, mỗi FE một git worktree + cặp cổng e2e riêng; tối đa 2 FE cùng lúc (máy 4 nhân, test hiệu năng dễ nhiễu); designer/solution viết vào file riêng theo đợt, không 2 agent cùng sửa một file. Orchestrator merge lần lượt sau mỗi cổng duyệt.
- **B2** (người duyệt đồng ý cả 4 giả định designer): motif mặc định BẬT chỉ ở `son-do` (trống đồng), `sen-cham` (sen), `dem-nhung` (art-deco), `bien-dao` (sóng), TẮT ở 8 theme còn lại kể cả Trầm Vàng; trống đồng xoay 1 vòng/240s ở mức Vừa, chữ Hỷ không bao giờ xoay; chưa áp motif cho cover/phong bì ở v4a-1.
- **Font v4a-1**: thêm đủ 14 gói `@fontsource` cho 6 theme mới (newsreader, birthstone, manrope, old-standard-tt, josefin-sans, prata, allura, eb-garamond, nunito, style-script, lexend, crimson-pro, moon-dance, spectral); kiểm subset tiếng Việt + font ban đầu ≤ 180 KB.
- **Ngày cưới còn > 2 tháng** -> giữ thứ tự v4a -> v3 -> v4b.
- **B3 (mascot) dời sau v4b**; chốt nhân vật + giấy phép khi tới lượt.
- **Git**: giữ **1 nhánh** `claude/keen-albattani-k0ds71` cho phiên cloud. Agent con không commit/push; chỉ orchestrator commit + push sau khi kiểm tra/duyệt. FE song song dùng worktree + nhánh cục bộ `wt/<đợt>` (không push), orchestrator merge lần lượt vào nhánh phiên. Không đụng `main`; đưa vào `main` bằng PR khi người duyệt yêu cầu.

## Cổng 1 v4a-2b/2c + duyệt thiết kế v4a-2a (2026-10-09)
- `solution-v4a-2bc.md`: người duyệt đồng ý cả 14 giả định. Riêng thứ tự: **Bước 0 làm trước MỌI đợt song song (kể cả v4a-1)**, trên branch phiên; sau đó FE-1 (v4a-1) + FE-2 (v4a-2b) song song, FE-3 (v4a-2c) khi có slot.
- Chấp nhận config "Theo theme" đổi kiểu mở/burst sau deploy (ghi chú phát hành); `light-gather` canvas riêng + chính sách FPS (≥ 45 fps kiểm tay máy thật).
- `design-v4a-2a.md` (B1): đồng ý cả 7 giả định — "Xen kẽ tự động" mặc định cả config cũ; Ảnh bìa + phần thông tin giữ gói chính; ghim theo section chỉ chọn cả gói; UI ghi đè vai trò cấp trang để v4b; rút ngắn `btn-shine`/`name-sparkle` (WCAG 2.2.2); thanh tiến độ đọc chỉ khi admin bật; ô giây đồng hồ chỉ quay ở mức Nhiều. Sửa 8 lỗi spec R2A-01..08 theo designer.
- `design-v4a-2bc.md` (asset 2b/2c, ui-ux-designer B): người duyệt đồng ý — `flower-gate` vẽ vector minh hoạ phẳng (không WebP); `ink-spread` khoét lỗ hình vệt mực bằng mask (`mask-composite`), thay `clip-path: circle` (giữ phương án dự phòng); họ "cổng toàn màn" (rèm, cửa đôi, cổng hoa, cửa trăng) gom chữ vào biển nổi `.cv-plaque`. Không kiểu/hạt nào cần raster. Kiến trúc hạt trên cover theo `solution-v4a-2bc.md` (`setOverCover`, Bước 0.4); tải sẵn canvas trong `prepare()` + vùng dịu `.env-addr`/`.cv-plaque` thuộc FE-2.
- **Orchestrator chốt Còn mở #18 (solution.md Rev 5)**: (1) `vite.config.ts` `assetsInlineLimit` loại trừ `theme-assets` + (2) 2 nhóm size-limit motif -> gộp vào Bước 0 (đã gửi FE Bước 0); (3) xoá khối texture `body::before/::after` trong `base.css` + (4) 1 dòng gán `dividerUrl` ở nhánh preview `bootstrap.ts` -> FE-1 (v4a-1) được sửa đúng 2 hunk này.

## Cổng 1 v4a-1 (2026-10-09)
- `solution.md` Rev 5 mục 10: người duyệt đồng ý. Còn mở #11–#17 theo giả định: (#11) theme tắt motif mà admin chọn bộ -> `band` + `medium`; (#12) 7 texture mới lên cover qua `textures.css`, không sửa `cover.css`; (#13) Texture/Khung/Divider giữ Select, thẻ hình để v4b (riêng Hoạ tiết nền có thẻ hình); (#14) theme vượt 180 KB font -> FE báo số đo, designer chọn face bỏ, không nới ngân sách; (#15) `font-synthesis-weight: none` toàn cục, Prata nghiêng giả chấp nhận; (#16) polaroid chưa có chú thích; (#17) orchestrator đặt `STAGE` khi merge.
- FE-1 (v4a-1) bắt đầu sau khi Bước 0 merge, song song FE-2 (v4a-2b).

## Cổng 1 v4a-2a (2026-10-09)
- `solution-v4a-2a.md`: người duyệt đồng ý cả 4 giả định — ghim gói chưa bật -> bỏ ghim + cảnh báo (theo tự động); hoạ tiết ở cấp Nhẹ giữ như hiện nay (hiện ngay, không vẽ nét); cho sửa 1 hunk `diff.ts` bỏ dòng "xoá {}"; micro thêm ≤ +0.6 KB JS ban đầu (ngoài +2.5 KB reveal).
- Orchestrator: cho 2a sửa 1 hunk mỗi file `checklist.ts`, `icons.ts`, `.size-limit.cjs`; **2a tách nhánh SAU khi v4a-1 merge** (chung `resolve.ts`, `merge.ts`, `labels.ts`, `schema-meta.ts`, `ops.ts`).
- Thứ tự: Bước 0 -> FE-1 v4a-1 ‖ FE-2 v4a-2b -> slot trống: v4a-2c, rồi v4a-2a (sau merge v4a-1).

## Sau tạm dừng (2026-10-09)
- v4a-1 code xong (merge vào branch phiên, full e2e 46/46); chờ designer review.
- Người duyệt cho phép **push branch `wt/v4a-2b`** lên GitHub (giữ WIP v4a-2b).
- **Từ nay chỉ chạy 1 frontend-developer, không song song.** Thứ tự: hoàn tất v4a-2b -> (designer review v4a-1, v4a-2b) -> v4a-2c -> v4a-2a.
- Vì không còn song song: FE v4a-2b được sửa 1 hunk `SOFT_SELECTOR` trong `geometry.ts` (thuộc 2c) cho vùng dịu `.env-addr`/`.cv-plaque`.

## Sau designer review v4a-1 + v4a-2b (2026-10-10)
- Câu 1 (designer vẽ lại asset `watercolor-wash` trước vòng sửa FE): **HOÃN** — ghi backlog, sửa sau. Kéo theo **T02** và **O04** (phụ thuộc asset màu nước) hoãn cùng.
- Câu 2–5 chấp nhận giả định designer: bỏ nền "pill" của divider trên mọi theme có texture; lời chào trong vật nhỏ + caption polaroid dùng heading italic thay script (< 28px); hạt E12 giữ alpha .75 trong vùng dịu quanh tên khách; "&" của Pinyon Script vẽ bằng heading italic (áp cả `luc-bao`).
- FE sửa 15 lỗi còn lại: T01, T03, T04, T05, T06, O01, O02, O03, O05–O11 (≤ 3 vòng).
