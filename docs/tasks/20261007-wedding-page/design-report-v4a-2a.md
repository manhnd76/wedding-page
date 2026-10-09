# Design report v4a-2a (ui-ux-designer A) - tiến độ

> Đợt v4a-2a: B1 reveal theo từng section + 4 gói reveal còn lại (`editorial`, `letter`, `playful`, `cinematic`) + micro-interaction còn lại. Bắt đầu 2026-10-09.
> Quy ước: cập nhật sau mỗi phần xong. Agent sau đọc bảng này để làm tiếp, không làm lại.
> Spec: `design-v4a-2a.md`. Ảnh/mock: `screenshots/v4a-2a/` (gitignore), `assets/v4a-2a/` (mock HTML tĩnh, nếu có).
> Chỉ ghi vào 2 file trên + thư mục riêng (đang có agent khác chạy song song).

## Bảng tiến độ
| # | Phần | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 0 | Đọc tài liệu + code, tạo report | design-report-v4a-2a.md | Xong | Đã đọc backlog B1, design §4.0/5/8.6/8.13/Phụ lục B, solution §4.3/5.5/5.6/8.4/9.1, decisions, status; code `reveal.ts`, `intensity.ts`, `capabilities.ts`, `resolve.ts` (REVEAL_PACKS), `enums.ts`, `types.ts`, `sections/meta.ts`, `sections/common.ts`, `fx.css`, admin `routes/effects.tsx`, `routes/sections.tsx`, `bootstrap.ts` (fx:replay reveal) |
| 0b | Reveal lab (mock tĩnh) soi biên an toàn dấu | assets/v4a-2a/reveal-lab.html | Xong | Ảnh `screenshots/v4a-2a/reveal-lab.png` (Chromium, 760px, DPR2). **Phát hiện R2A-01**: `mask-up` theo design 5.8 (`translateY(110%)`, không opacity) để lộ dấu mũ/ngã của dòng dưới ở trạng thái ẩn (ô trái trên). Sửa: `translateY(calc(100% + .55em))` + `opacity 0` (ô phải trên sạch). Trạng thái cuối còn wrapper thì dấu `Ầ` sát mép clip .3em -> gỡ wrapper sau khi hiện |
| 1 | B1: mô hình reveal theo section + "tự động xen kẽ" | design-v4a-2a.md §0–§2 | Xong | Gói chính + mode `auto`/`uniform` + ghim từng phần; xen kẽ chỉ đổi heading+image; tier opening/expressive/functional + affinity (SECTION_META); HARMONY 6 gói; thuật toán tất định không lặp gói giữa 2 phần expressive kề nhau; ví dụ 4 theme đã kiểm tay; bảng cường độ/reduced/lowEnd + bước FPS `revealLite`; ngân sách JS; 8 điểm R2A-01..08 so với design.md |
| 2 | Đặc tả 4 gói + kiểu nguyên tử chưa bật | design-v4a-2a.md §3 | Xong | Bảng thông số 11 nguyên tử; mask-up JIT + tách dòng + gỡ wrapper (R2A-01); wipe chữ/ảnh/ô album, clip trên `<img>` để không phá khung v4a-1 (`deco-cut` clip-path, viền box-shadow, mask); split-* bỏ padding + khôi phục chuỗi gốc; blur-in fallback mask-up (R2A-02); parallax-layers 3 lớp dùng lại parallax hiện có; bảng 4 gói × cấp; nhịp `.sec-head`; khung CSS tham khảo |
| 3 | Micro-interaction còn lại | design-v4a-2a.md §4 | Xong | 10 mã: quy tắc chung ≤5s/đợt, ≤3 đợt/phiên (R2A-07 btn-shine, name-sparkle); photo-tilt dùng `span.tilt-glare` (vì `.frame--arch-double::after` đã dùng); odometer dải 11 ô quay lùi + quay vòng; **slide** (chưa có spec) trượt cả giá trị; scroll-progress chỉ theo config (R2A-05); music-ripple dùng span (2 `::after` đã bận); gift-shake bỏ qua chữ Hỷ; calendar-flip lật giả `scaleY` (SVG không 3D); couple-heart-tap `touch-action: manipulation` chỉ trên ảnh |
| 4 | UX admin + fx:replay | design-v4a-2a.md §5 | Xong (spec) | Đặt ở "Hiệu ứng" (route lười; sections.tsx thuộc bundle ban đầu 73.15/80 KB); "Các phần & thứ tự" chỉ badge cho phần ghim + link; Segmented "Cách áp dụng", details "Từng phần" với native select + nút Xem; micro toggles; bảng fx:replay (`reveal` tour 3 phần, `reveal:<id>`, micro:*), `replaySection`, 0.5x qua `--fx-slow` (R2A-06). Mock HTML: đang làm (dòng 4b) |
| 4b | Mock admin mobile/desktop + ảnh | assets/v4a-2a/admin-reveal-mock.html | Chưa | |
| 5 | Phụ lục schema đề xuất | design-v4a-2a.md Phụ lục A | Chưa | |
| 6 | Câu hỏi người duyệt | design-v4a-2a.md §8 | Chưa | |
