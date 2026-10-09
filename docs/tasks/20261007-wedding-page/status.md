# Status - 20261007-wedding-page (bản bàn giao 2026-10-09)

> **Phiên mới (local hoặc cloud) bắt đầu ở đây.** Orchestrator: đọc file này + `CLAUDE.md` + `decisions.md`, **review lại plan với người duyệt trước khi giao bất kỳ việc nào**. Định nghĩa agent nằm trong `.claude/agents/` (orchestrator chạy làm main agent: `claude --agent orchestrator`; trên cloud nếu không chọn được agent thì yêu cầu Claude đóng vai theo `.claude/agents/orchestrator.md`).

## 1. Đang ở đâu
- Giai đoạn hiện tại: **v4a-1** (9 theme còn lại + asset + B2 hoạ tiết nền).
  - Bước 1 ui-ux-designer: **XONG** (asset + spec, xem mục 3).
  - Bước 2 solution-designer: **CHƯA GIAO** — chờ người duyệt trả lời 3 câu hỏi B2 (mục 4).
  - Bước 3 frontend-developer, bước 4 designer review: chưa.
- Không có agent nào đang chạy. Không có việc dở dang trong code (`src/` sạch, khớp commit trên `main`).
- Vòng lặp sửa đã dùng (v4a-1): 0/3.

## 2. Roadmap
| Giai đoạn | Nội dung | Trạng thái | Commit |
|---|---|---|---|
| v1 | Khung Vite+TS, schema v1, guest 14 section, 3 theme, kiểu mở, hạt, pháo hoa, nhạc, VietQR | Xong | 3780836 |
| v2 | Admin Preact, GitHubAdapter, nháp IndexedDB, backup/restore, link khách | Xong | ce58f31 |
| v2.1 | Sửa review v1, phong bì ngang, 6 mẫu phong thư, tự cuộn | Xong | f0a6465 |
| v2.2 | Sửa UX admin A01–A24 | Xong | 55b8b69 |
| v2.3 | Cổng login mật khẩu (hash), token GitHub chỉ hỏi khi Xuất bản/Khôi phục, sửa E01–E11 | Xong | 7c476e9 |
| (người duyệt) | `_redirects` cho Cloudflare: `/invite/*  /  200` | Xong | 60f385c |
| **v4a-1** | 9 theme + ornament/texture/photoFrame/divider + **B2** hoạ tiết nền vector | **Đang làm** (bước 1/4 xong) | - |
| v4a-2 | 13 kiểu mở, 16 hạt, 4 burst, 4 gói reveal, micro, **B1** reveal theo section, **E12** | Chưa (B1 cần thiết kế trước) | - |
| v4a-3 | **B3** mascot theo scroll/nghiêng máy | Chưa (cần làm rõ nhân vật + giấy phép page-mascot) | - |
| v3 | Apps Script RSVP/lời chúc + micro liên quan | Chưa (người duyệt chọn làm SAU v4a) | - |
| v4b | Tối ưu bundle, a11y, ma trận thiết bị/webview, CSP cuối, README deploy | Chưa | - |

Thứ tự đã chốt (decisions 2026-10-09): v4a-1 -> v4a-2 -> v4a-3 -> v3 -> v4b. Mỗi đợt: designer -> solution-designer -> frontend -> designer review -> commit.

## 3. Kết quả bước 1 v4a-1 (ui-ux-designer)
- Asset: `assets/v4a-1/` — 8 ornament sprite, 9 divider + `dividers.css`, 9 photo frame (`frames.css` + `wash-mask.svg`), 7 texture + `textures.css`, B2: 7 bộ motif (trống đồng Đông Sơn, mây cát tường, sóng nước, sen, song hỷ, art-deco, cành lá) + `motifs.css`, generator `_generator/*.mjs`.
- Spec: `design.md` "Bản sửa 5": §1.6.7 (asset 9 theme), §1.7 (B2), Phụ lục C (schema đề xuất `theme.motif.{set, placements, intensity, motion}`), §8.2/8.2b (login mới), §3.2 (SVG phong bì khớp code).
- Tiến độ chi tiết + bàn giao cho bước 2/3: `design-report-v4a-1.md`.
- **2 lỗi designer phát hiện khi đọc code v2.3 (chưa xác minh bằng build) -> đưa vào phạm vi FE v4a-1:**
  1. Texture `body::before` bị nền section đục che -> chuyển sang `.sec::before` + `.sec{isolation:isolate}`.
  2. Divider `cloud`/`deco-fan` vẽ theo ornament set hiện tại -> trộn với set khác thì sai hình; tách divider thành file riêng.
- Ảnh xem thử ở `screenshots/v4a-1/` (thư mục gitignore — chỉ có trên máy local).

## 4. Chờ người duyệt
- Câu hỏi B2 (giả định của designer trong ngoặc):
  1. Motif mặc định BẬT chỉ cho `son-do` (trống đồng), `sen-cham` (sen), `dem-nhung` (art-deco), `bien-dao` (sóng); TẮT cho 8 theme còn lại kể cả Trầm Vàng? (đồng ý)
  2. Trống đồng xoay rất chậm (1 vòng/240s ở mức Vừa), chữ Hỷ không bao giờ xoay? (đồng ý)
  3. Chưa áp motif cho màn cover/phong bì ở đợt này? (để sau)
- Sau khi trả lời: giao solution-designer chốt schema Phụ lục C + cập nhật dòng v4a-1 trong `solution.md`.

## 5. Cần kiểm tra tay (người duyệt)
- Kết nối + Xuất bản GitHub thật, site Cloudflare Pages cập nhật sau publish.
- QR VietQR quét bằng ≥ 2 app ngân hàng với tài khoản thật (không commit STK thật).
- Điện thoại thật: Safari iOS (nhạc + nút gạt im lặng, nén ảnh admin), Android tầm thấp, webview Zalo/Facebook/Messenger; tự cuộn; tương phản theme tối; seal phong bì trên desktop.
- Lighthouse mobile trên Cloudflare Pages.

## 6. Rủi ro / ghi chú
- Commit 55b8b69 chứa mật khẩu admin dạng rõ trong `decisions.md` và đã push — người duyệt chấp nhận, không sửa lịch sử. Nên để repo private hoặc đổi mật khẩu bằng `npm run admin:hash`.
- Hash mật khẩu nằm trong bundle admin (dò offline được); lớp bảo mật thật là GitHub fine-grained token. "Ghi nhớ token" mặc định BẬT (người duyệt chọn). Khuyến nghị Cloudflare Access cho `/admin/*` (chunk admin chưa gom vào `dist/admin/`).
- E2E dùng Chrome cài sẵn (`channel: 'chrome'`); môi trường cloud có thể không có Chrome -> e2e có thể không chạy được, cần `npx playwright install chromium` + `PW_CHANNEL` phù hợp.
- Chạy nhiều FE song song (khi người duyệt yêu cầu): 2 FE + 1 designer, mỗi FE một worktree; phải tham số hoá cổng e2e 4173/5175 trước (`playwright.config.ts` đang cố định cổng, `reuseExistingServer: true`).
- Quy ước agent (CLAUDE.md): ghi tiến độ report liên tục; designer lưu ảnh bằng chứng; FE chỉ chạy full e2e 1 lần cuối.
- Không đổi branch khi dev server đang chạy (lần trước làm dev server lỗi resolve import).

## 7. Tài liệu
`request.md` · `decisions.md` (nguồn sự thật) · `solution.md` (Rev 4 + v4a/B1–B3) · `design.md` (Bản sửa 5) · `backlog.md` · review: `design-review-v1.md`, `design-review-admin-v2.md`, `design-review-envelopes.md` · report: `frontend-report*.md`, `design-report-v4a-1.md`.
