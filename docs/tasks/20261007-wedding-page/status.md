# Status - 20261007-wedding-page (bản bàn giao 2026-10-09, cuối phiên cloud)

> **Phiên mới (local hoặc cloud) bắt đầu ở đây.** Orchestrator: đọc file này + `CLAUDE.md` + `decisions.md`, **review lại plan với người duyệt trước khi giao bất kỳ việc nào**. Định nghĩa agent nằm trong `.claude/agents/` (orchestrator chạy làm main agent: `claude --agent orchestrator`; trên cloud không chọn được agent thì yêu cầu Claude đóng vai theo `.claude/agents/orchestrator.md`).

## 1. Đang ở đâu
- **(2026-10-10, phiên local)** Đã pull main (3426f84) + npm install. Người duyệt đồng ý: designer review gộp v4a-1 + v4a-2b -> FE sửa -> v4a-2c -> v4a-2a. Branch làm việc local: `feat/20261007-wedding-page-v4a-review` (tách từ main). Designer review XONG: `design-review-v4a-1-2b.md` (17 lỗi: v4a-1 1 Cao/2 Vừa/3 Thấp; v4a-2b 0 Cao/5 Vừa/6 Thấp; T05 cuộn ngang Biển Đảo). Người duyệt: hoãn vẽ lại watercolor-wash (T02, O04 -> backlog B4), chấp nhận câu 2–5. FE sửa 15 lỗi XONG (vòng 1/3, chưa commit): build xanh (guest JS 34.55, admin 75.62/80), unit 875/875 (orchestrator chạy lại), full e2e 114/114 (FE chạy). Designer cần xem lại: T01, T03, T04, O01, O02/O11, O03, O05, O08–O10. Chờ người duyệt: designer xác nhận lại? commit? -> v4a-2c.
- Branch làm việc: **`claude/keen-albattani-k0ds71`** (1 branch duy nhất, đã push; `main` chưa đụng — đưa vào `main` bằng PR khi người duyệt yêu cầu). Branch phụ `wt/v4a-2b` đã push (đã merge hết vào branch phiên, có thể xoá). Worktree `/home/user/wp-v4a-1`, `/home/user/wp-v4a-2b` chỉ tồn tại trong container cloud cũ — không cần nữa.
- **Không có agent nào đang chạy. Không có việc dở trong code** (working tree sạch).
- **Từ nay chỉ chạy 1 frontend-developer tại một thời điểm** (người duyệt, 2026-10-09).
- Việc kế tiếp đề xuất (chờ người duyệt đồng ý): **ui-ux-designer review gộp v4a-1 + v4a-2b** (bước 4) -> FE sửa (≤ 3 vòng mỗi đợt) -> Cổng 3 -> rồi **v4a-2c** -> **v4a-2a**.

## 2. Roadmap
| Giai đoạn | Nội dung | Trạng thái | Commit |
|---|---|---|---|
| v1 | Khung Vite+TS, schema v1, guest 14 section, 3 theme, kiểu mở, hạt, pháo hoa, nhạc, VietQR | Xong | 3780836 |
| v2 | Admin Preact, GitHubAdapter, nháp IndexedDB, backup/restore, link khách | Xong | ce58f31 |
| v2.1 | Sửa review v1, phong bì ngang, 6 mẫu phong thư, tự cuộn | Xong | f0a6465 |
| v2.2 | Sửa UX admin A01–A24 | Xong | 55b8b69 |
| v2.3 | Cổng login mật khẩu (hash), token GitHub chỉ hỏi khi cần, sửa E01–E11 | Xong | 7c476e9 |
| (người duyệt) | `_redirects` cho Cloudflare: `/invite/*  /  200` | Xong | 60f385c |
| (hạ tầng) | E2E chạy trên cloud + cổng tham số hoá; sửa A12 tận gốc (`useStore`, focus preview) | Xong | 42c34ef, 710e778 |
| (hạ tầng) | **Bước 0** khung chung cho các đợt v4a (caps theo đợt, open-styles, burst registry, setOverCover, tách admin Hiệu ứng, plugin/size-limit, helper e2e, vùng đánh dấu) | Xong | 095684e |
| **v4a-1** | 9 theme + ornament/texture/photoFrame/divider + **B2** hoạ tiết nền + 14 font + sửa texture/divider | **Code xong** — chờ designer review | 23a5238 (merge 4156011) |
| **v4a-2b** | 13 kiểu mở + **E12** | **Code xong** — chờ designer review + kiểm tay máy thật | f4c7b3b |
| v4a-2c | 16 hạt + 4 burst | Thiết kế + sprite + kế hoạch XONG, Cổng 1 đã duyệt — **chưa code** | - |
| v4a-2a | **B1** reveal theo section + 4 gói reveal + 10 micro | Thiết kế + kế hoạch XONG, Cổng 1 đã duyệt — **chưa code** (đã mở khoá vì v4a-1 đã merge) | - |
| v3 | Apps Script RSVP/lời chúc + micro liên quan | Chưa (sau v4a; ngày cưới còn > 2 tháng) | - |
| v4b | Tối ưu bundle, a11y, ma trận thiết bị/webview, CSP cuối, README deploy | Chưa | - |
| v4a-3 | **B3** mascot theo scroll/nghiêng máy | **Dời sau v4b** | - |

Thứ tự: v4a-1 ✔code -> v4a-2b ✔code -> (designer review 2 đợt) -> v4a-2c -> v4a-2a -> v3 -> v4b -> v4a-3. Mỗi đợt: designer -> solution-designer -> frontend -> designer review -> commit.

## 3. Trạng thái từng đợt v4a

### v4a-1 — code xong
- Kiểm tra (orchestrator chạy lại): typecheck sạch · unit 802/802 · build + size-limit xanh · e2e đợt 9/9 · **full e2e 46/46**.
- Kích thước sau v4a-1 (gzip): guest JS ban đầu 32.97 KB · CSS 12.96 KB · Admin JS ban đầu 75.39 KB (vượt mục tiêu +1 KB của kế hoạch, dưới trần 80). Font cover: cả 12 theme ≤ 180 KB (Trầm Vàng sát ngưỡng ~177.8 KB vì tính thêm body 400).
- 9 lệch kế hoạch nhỏ có lý do: `frontend-report-v4a-1.md` mục "Lệch spec".
- **Còn:** bước 4 designer review — danh sách ở `frontend-report-v4a-1.md` mục "Việc cho designer" (12 theme + dấu chồng, Prata nghiêng giả ở `sen-cham`, Moon Dance/Birthstone; độ đậm texture trên build, vignette velvet; `watercolor-wash` "khối" ở 412px; nền divider/"&" trên giấy có texture; 4 theme bật motif mặc định; panel Hoạ tiết nền + thẻ texture trong admin). Vòng sửa đã dùng: 0/3.

### v4a-2b — code xong
- Kiểm tra (orchestrator chạy lại): typecheck sạch · unit 866/866 · build xanh · **full e2e 111/111** (72 test của đợt).
- Kích thước sau v4a-2b (orchestrator đo, config mẫu): guest JS ban đầu **34.36 KB** · CSS **13.32 KB** · Admin JS ban đầu **75.62 KB**; open-kit 2.31 KB; mỗi kiểu mở 0.57–2.41 KB JS, ≤ 0.94 KB CSS; skin phong bì sau E12 ≤ 1.26 KB.
- **Ghi chú phát hành:** config để "Theo theme" đổi kiểu mở sau deploy ở 11/12 theme (chỉ Trầm Vàng giữ Phong bì; vd Son Đỏ -> Cuộn thư, Đêm Nhung -> Hạt sáng tụ thành tên, Hồng Phấn -> Cổng hoa, Biển Đảo -> Thiệp 3D xoay). Muốn giữ phong bì: chọn cố định "Phong bì".
- Lệch kế hoạch (`frontend-report-v4a-2b.md`): asset mask ở `src/guest/cover/theme-assets/`; hạt/burst của 2c đang dùng loại thay thế (`gold`->`gold-dust`, `red-paper`->`petal-rose` đỏ, `confetti` vẽ tại chỗ) -> xem lại sau 2c; JS ban đầu +0.58 KB (chỉ tiêu +0.5).
- **Còn:** designer review — `scroll`/`book` hiện tên khách trước khi chạm; `ink-spread` "ăn" chữ trên cover (đúng design §2.12 nhưng khác tiêu chí không clip chữ); cánh `lace` nhạt trên theme sáng; `double-door` mở 105° (ảnh mẫu ~70°); `card-3d` nghiêng theo con trỏ desktop; hạt thay thế. Kiểm tay máy thật (mục 5). Vòng sửa đã dùng: 0/3.

### v4a-2c — chưa code
- Spec: `design-v4a-2bc.md` §4 (16 hạt, mở rộng `ParticleKind`), §5 (4 burst, cờ `twinkle`/`scaleIn`/`back`); asset `assets/v4a-2/particles/`, `assets/v4a-2/burst/`. Kế hoạch: `solution-v4a-2bc.md` mục 2, 3, 4, 5.
- Khi làm: thay các hạt/burst tạm mà v4a-2b đang dùng bằng module thật; `SOFT_SELECTOR` trong `geometry.ts` đã có thêm `.env-addr`/`.cv-plaque` (v4a-2b sửa, được phép).
- Không cần worktree (chỉ 1 FE): làm thẳng trên branch phiên, e2e cổng mặc định 4173/5175.

### v4a-2a — chưa code
- Spec: `design-v4a-2a.md` (B1 xen kẽ tự động, 4 gói, kiểu nguyên tử, 10 micro, 8 lỗi spec R2A-01..08). Kế hoạch: `solution-v4a-2a.md` (schema `effects.reveal.mode` + `effects.reveal.sections`, `reveal-plan.ts`, ngân sách JS +2.5 KB reveal + ≤ 0.6 KB micro).
- Được sửa thêm 1 hunk mỗi file: `checklist.ts`, `icons.ts`, `.size-limit.cjs`, `diff.ts`; `ops.ts` sửa được vì v4a-1 đã merge.
- Admin JS ban đầu đang 75.62/80 KB -> UI mới đặt trong `fx/reveal-block.tsx` (route lazy), "Các phần & thứ tự" chỉ thêm nhãn.

## 4. Chờ người duyệt
- Đồng ý bước kế tiếp: designer review gộp v4a-1 + v4a-2b (mục 1).
- (Sau review) xác nhận các điểm designer nêu cho `scroll`/`book`/`ink-spread`/`double-door`.

## 5. Cần kiểm tra tay (người duyệt)
- Kết nối + Xuất bản GitHub thật, site Cloudflare Pages cập nhật sau publish.
- QR VietQR quét bằng ≥ 2 app ngân hàng với tài khoản thật (không commit STK thật).
- Điện thoại thật: Safari iOS (nhạc + nút gạt im lặng, nén ảnh admin), Android tầm thấp, webview Zalo/Facebook/Messenger; tự cuộn; tương phản theme tối; seal phong bì trên desktop.
- **(v4a-2b)** `light-gather` ≥ 45 fps ở mức Vừa trên Android tầm trung; Safari iOS: 3D backface (origami, double-door, card-3d, book, polaroid, wax-seal), `clip-path` WAAPI (scroll, moon-gate, polaroid), `-webkit-mask-composite` (ink-spread).
- **(v4a-1)** 12 theme trên máy thật: font tiếng Việt, texture, hoạ tiết nền 4 theme.
- Lighthouse mobile trên Cloudflare Pages.

## 6. Rủi ro / ghi chú
- **Admin JS ban đầu 75.62/80 KB** — mọi UI admin mới (2c, 2a) phải vào chunk lazy.
- Commit 55b8b69 chứa mật khẩu admin dạng rõ trong `decisions.md` và đã push — người duyệt chấp nhận. Nên để repo private hoặc đổi mật khẩu bằng `npm run admin:hash`.
- Hash mật khẩu nằm trong bundle admin (dò offline được); lớp bảo mật thật là GitHub fine-grained token. "Ghi nhớ token" mặc định BẬT. Khuyến nghị Cloudflare Access cho `/admin/*`.
- **E2E trên cloud**: không có Chrome -> `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Máy 4 nhân bị tự hạ cấp hiệu ứng -> test đo thời lượng mức "Vừa" phải giả lập máy khoẻ (`strongDevice()` trong `tests/e2e/fx-helpers.ts`). Full e2e hiện ~10 phút.
- Quy ước agent (CLAUDE.md): ghi tiến độ report liên tục; designer lưu ảnh bằng chứng (`screenshots/` bị gitignore — chỉ còn trong container đã tạo ra); FE chỉ chạy full e2e 1 lần cuối.
- Không đổi branch khi dev server đang chạy.
- Generator `assets/v4a-1/_generator/*.mjs` dùng đường dẫn tuyệt đối Windows; generator `assets/v4a-2/_generator/*.mjs` dùng đường dẫn tương đối.
- Song song (đã dừng): nếu bật lại thì theo bản đồ sở hữu file `solution-v4a-2bc.md` mục 3 + bảng cổng: orchestrator 4173/5175, FE-1 4273/5275, FE-2 4373/5375, FE-3 4473/5475; designer chụp ảnh 5181/5182.

## 7. Tài liệu
- Nguồn sự thật: `decisions.md` · `request.md` · `backlog.md`.
- Giải pháp: `solution.md` (Rev 5; mục 10 = v4a-1) · `solution-v4a-2bc.md` (Bước 0, v4a-2b, v4a-2c, bản đồ sở hữu file) · `solution-v4a-2a.md`.
- Thiết kế: `design.md` (Bản sửa 5) · `design-v4a-2a.md` · `design-v4a-2bc.md` · asset `assets/v4a-1/`, `assets/v4a-2/`, `assets/v4a-2a/`.
- Report: `frontend-report-v4a-step0.md`, `frontend-report-v4a-1.md`, `frontend-report-v4a-2b.md`, `design-report-v4a-1.md`, `design-report-v4a-2a.md`, `design-report-v4a-2bc.md`, các `frontend-report*.md` cũ.
- Review: `design-review-v1.md`, `design-review-admin-v2.md`, `design-review-envelopes.md`.

## Cập nhật 2026-10-10 (phiên local)
- Vòng sửa 1/3 (15 lỗi) XONG, chưa commit. Người duyệt chọn: **designer xác nhận lại** đúng các ID T01, T03, T04, O01, O02/O11, O03, O05, O08, O09, O10 -> đạt thì commit, còn lỗi thì vòng 2/3 -> rồi v4a-2c.
- Đang chạy: ui-ux-designer xác nhận lại -> ghi thêm mục "Xác nhận vòng 1" vào `design-review-v4a-1-2b.md`.
- Designer xác nhận vòng 1: 11/11 qua (8 Đạt, 2 Đạt + chấp nhận lệch O01/O05, 1 chấp nhận lệch O03). Không cần vòng 2. Đã commit đợt sửa.
- Ghi chú không chặn — xem lại khi review v4a-2c: cánh `lace` mức Vừa tụm hẹp (~40px); vệt bắn phụ `ink-spread` mức Nhiều ~90px hơi to.
- Tiếp: **v4a-2c** trên branch `feat/20261007-wedding-page-v4a-2c` (tách từ branch review). frontend-developer -> `frontend-report-v4a-2c.md`.
- **v4a-2c code XONG** (chưa commit), branch `feat/20261007-wedding-page-v4a-2c`. Orchestrator chạy lại: build xanh (guest JS ban đầu 34.67/60 KB, admin 75.67/80 KB — FE báo 33.85/73.90, lệch đo nhưng đều trong ngân sách), unit 966/966. Full e2e 139/139 (FE chạy). Đang chạy: ui-ux-designer review 6 mục trong `frontend-report-v4a-2c.md` -> `design-review-v4a-2c.md` (kèm 2 ghi chú lace/ink-spread từ vòng trước).
- 2026-10-10: designer review v4a-2c bị ngắt (429) sau mục 1–4 (P01–P08). Đã giao tiếp tục mục 5, 6, lệch FE.
- Lần Xuất bản chế độ máy chủ dev lúc 13:23 là người duyệt test admin -> người duyệt yêu cầu rollback: đã khôi phục `public/content/config.json` + 2 ảnh SVG mẫu từ HEAD, xoá 2 ảnh webp và thư mục `backup/`.
- Designer review v4a-2c XONG: 11 lỗi (Cao 1: P07 burst từ nút bị vùng loại trừ form ẩn 100% — chặn v3; Vừa 5: P01, P04, P06, P09, P10; Thấp 5). `lace` cũ đóng (đo 140–210px). Đã dừng server :5181. Người duyệt đồng ý Q1–Q6. Đang chạy: FE sửa P01–P11 (vòng 1/3) -> `frontend-report-v4a-2c-fix.md`.
- FE sửa P01–P11 + Q2 XONG (vòng 1/3, chưa commit). Orchestrator chạy lại: build xanh (guest 34.68/60, admin 75.67/80), unit 999/999. Full e2e 141/141 (FE chạy). Đang chạy: designer xác nhận P01–P06, P09, P11 (+ P08, gợi ý P10 tuỳ chọn) và chép số từ `scripts/particles-overrides.mjs` vào `assets/v4a-2/particles/particles.json`, confetti [16, 24] vào `bursts.json`.
- Designer xác nhận vòng 1 v4a-2c: 8/8 ID bắt buộc qua (7 Đạt + P11 chấp nhận lệch); P08, câu chữ P10 Đạt. Asset `particles.json`/`bursts.json` đã đồng bộ (sinh lại từ `assets/v4a-2/_generator/`), `gen-particles.mjs --check` OK. **Đã commit v4a-2c.**
- **Việc nhỏ còn lại (Thấp, gộp vào FE đợt v4a-2a):** (1) dòng "Đã bỏ…" của P10 bị thanh tab dưới che ở 390×844 -> đặt `p.pdrop` ngay dưới `[data-testid=pchips]` (trước `<details>`), cần thì `scrollIntoView({block:'nearest'})`; (2) toast "Đã chọn: Hạt nền" chồng nhiều lớp mỗi lần bấm chip -> thay toast cùng nội dung thay vì chồng; (3) xoá các mục thừa trong `scripts/particles-overrides.mjs` rồi chạy `node scripts/gen-particles.mjs`; (4) sửa `colorNote` của `paper-heart` (còn ghi "mặt sau tự đậm hơn").
- Sự cố: designer từng làm `design-review-v4a-2c.md` về 0 byte rồi dựng lại từ bản đọc trước (orchestrator kiểm: đủ 11 dòng P01–P11 + các mục).
