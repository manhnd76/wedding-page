# Design report v4a-1 (ui-ux-designer) - tiến độ

> Đợt v4a-1: asset 9 theme còn lại + B2 hoạ tiết nền. Bắt đầu 2026-10-09.
> Quy ước: cập nhật sau mỗi phần xong. Agent sau đọc bảng này để làm tiếp, không làm lại.
> Thư mục asset: `docs/tasks/20261007-wedding-page/assets/v4a-1/`. Ảnh xem thử: `screenshots/v4a-1/`.

## Bảng tiến độ
| # | Phần | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 0 | Đọc tài liệu + tạo report | design-report-v4a-1.md | Xong | CSP: style-src 'self' + hash, img-src 'self' data: blob: |
| 1 | 8 ornament sprite (romantic, minimal, deco, lotus, watercolor, boho, korean, tropical) | assets/v4a-1/ornaments/*.svg | Xong | 2.4–11.5KB/bộ (≤12KB), đủ 6 symbol, currentColor, pathLength=100. watercolor: vệt màu = path `class="wash"` fill-opacity (không WebP). Ảnh: screenshots/v4a-1/ornaments.png (tô màu primary để soi nét; thực tế tô accent) |
| 2 | 10 divider: leaf-branch, double-line, lotus, dots, brush-stroke, wave-ocean (mới) + cloud, deco-fan (tách độc lập khỏi bộ ornament) + torn-paper (mask lặp ngang) + dividers.css | assets/v4a-1/dividers/ | Xong | Mỗi file 1 symbol `#divider` 160x24 (≤2.2KB) -> dùng lại helper ornament(). `wave`/`ornament`/`none` đã có. Phát hiện: v2.3 'cloud'/'deco-fan' lấy divider của bộ ornament đang chọn -> sai khi trộn |
| 3 | 9 khung ảnh mới + frames.css + wash-mask.svg | assets/v4a-1/frames/ | Xong | arch-double, rect-offset, soft-rect, oval, polaroid, stamp, scallop (mask radial 5 lớp, repeat round), wash-mask (SVG mask), deco-cut/arch/circle-moon đã có (xác nhận) |
| 4 | 7 texture + textures.css | assets/v4a-1/textures/ | Xong | paper-aged, linen, kraft, rice-paper, grain-fine, sand (SVG tile noise), watercolor-wash (mask + background-color accent/accent-2). Phát hiện: texture `body::before` bị nền đặc của section che -> đề xuất chuyển sang `.sec::before` + `.sec{isolation:isolate}`. Ảnh: screenshots/v4a-1/dividers-frames-textures.png |
| 5 | B2: 7 bộ hoạ tiết nền (SVG) | assets/v4a-1/motifs/<bộ>/{medallion,corner,band,tile}.svg | Xong (asset) | dong-son (trống đồng: sao 14 cánh, vòng tròn tiếp tuyến, răng cưa, 8 chim Lạc bay ngược chiều kim đồng hồ; corner = medallion đặt lệch tâm, không file riêng), may-cat-tuong, song-nuoc, hoa-sen, chu-hy (song hỷ nét vuông + hồi văn + kim tiền), art-deco, la-canh. Mỗi bộ ≤ 15KB (7.2–14.3KB). Dùng <defs>/<use> nội bộ (an toàn vì là ảnh mask, không qua <use> ngoài). Ảnh: screenshots/v4a-1/motifs-all.png, motif-dong-son-medallion.png |
| 6 | B2: motifs.css (render mask-image + accent, 5 kiểu đặt, 3 mức, cap tương phản, chuyển động) + mock mobile 3 theme | assets/v4a-1/motifs/motifs.css | Xong | Cap opacity theo theme tính bằng script (accent, giữ text/muted/primary ≥4.5 trên bg+surface): tram-vang .05, hong-phan .34, luc-bao .27, son-do .60, muc-giay .28, hoai-co .35, sen-cham .54, mau-nuoc .39, dat-nung .29, pastel-han .63, dem-nhung .33, bien-dao .41. Góc 56px quá nhỏ (ảnh motif-mock-mobile-v1-corners-small.png) -> đổi clamp(72px,24vw,180px) + chịu cap. Ảnh: screenshots/v4a-1/motif-mock-mobile.png |
| 7 | Spec design.md (v5): header "Bản sửa 5", 1.6.7 asset 9 theme, 1.7 B2 (1.7.1–1.7.10), bullet 8.12, Phụ lục C schema | design.md | Xong | +205 dòng; file giữ CRLF |
| 8 | Việc 3a: design.md 8.2 (viết lại: cổng mật khẩu, phiên tab, tự mở token ghi nhớ, 401, Tổng quan) + 8.2b (khi nào mở, bước ③ Ghi nhớ mặc định bật + cảnh báo, quay lại thao tác, .zip) + bảng mục 10 | design.md | Xong | Khớp code v2.3 (login.tsx, connect.tsx, connection.ts, app.tsx). Không ghi mật khẩu rõ |
| 9 | Việc 3b: design.md 3.2 thêm "(v5) SVG phong bì khớp code v2.3" (viewBox 340×238, túi/nếp/nắp/lót, bảng hình học 6 mẫu: nhọn, ren lượn, vát tù song-hy, chữ nhật minimal; tipY, --env-tip, pha unlock theo skin) | design.md | Xong | Nguồn: src/shared/envelope.ts, cover/skins/kit.ts + 6 skin |
| 10 | Chép generator (node, seed cố định) để sinh lại asset | assets/v4a-1/_generator/*.mjs | Xong | `node motifs.mjs` … ghi thẳng vào assets/v4a-1 (đường dẫn OUT trong lib.mjs). Chỉ là công cụ tài liệu, không phải code ứng dụng |

## Trạng thái: XONG cả 3 việc (2026-10-09)
Tổng asset: 8 ornament sprite · 9 file divider (+ dividers.css) · 1 mask khung + frames.css (9 khung) · 7 texture + textures.css · 7 bộ motif (27 SVG) + motifs.css. Spec: design.md 1.6.7, 1.7, 3.2 (v5), 8.2, 8.2b, 8.12, Phụ lục C.

## Bàn giao cho solution-designer (bước 2)
- Chốt schema Phụ lục C: `theme.motif.{set, placements, intensity, motion}` + `ThemePreset.motif/motifSuggest` + `Resolved.motifCap` (tính trong derive, công thức 1.7.5) + enum mới + `capabilities.motifSet`.
- Quyết định kiến trúc nhỏ (không đổi schema): divider thành file riêng (1.6.7b); texture chuyển từ `body::before` sang `.sec::before` + `.sec{isolation:isolate}` (1.6.7d); `--sec-bg` theo tone; module lười `motif.ts`/`motif.css` (1.7.8).

## Ghi chú cho frontend-developer (bước 3)
- SVGO giữ: `viewBox`, `id`, `pathLength`, `class="wash"`, `<defs>/<use>` trong motif. Không gộp motif vào sprite `<use>` (render bằng mask-image).
- `watercolor` `.wash` fade-in thay vì svg-draw. Polaroid nghiêng bằng class `tilt-r` (JS gắn theo chỉ số), không inline style.
- Lỗi texture bị che: kết luận từ đọc CSS (`.tone-bg/.tone-surface` nền đặc che `body::before`), CHƯA chụp xác nhận trên build thật - kiểm tra 1 lần khi làm.
- Ảnh tham chiếu: screenshots/v4a-1/{ornaments, dividers-frames-textures, motifs-all, motif-dong-son-medallion, motif-mock-mobile}.png.

## Câu hỏi cho người duyệt (kèm giả định đang dùng)
1. Hoạ tiết nền mặc định BẬT ở 4 theme (son-do: trống đồng; sen-cham: sen; dem-nhung: art-deco; bien-dao: sóng), 8 theme còn lại TẮT (kể cả Trầm Vàng mặc định). Giả định: đồng ý.
2. `son-do` dùng trống đồng (theo ví dụ backlog) thay vì mây/song hỷ (đã có ở ornament + phong bì song-hy). Giả định: đồng ý.
3. Trống đồng xoay rất chậm (1 vòng/240s ở mức Vừa) khi đặt sau tiêu đề/Hero; chữ Hỷ không bao giờ xoay. Giả định: đồng ý.
4. Hoạ tiết chưa áp cho màn cover/phong bì ở đợt này. Giả định: để sau.
