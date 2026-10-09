# Design report v4a-2b/2c (ui-ux-designer B) - tiến độ

> Đợt v4a-2b (13 kiểu mở + E12) và v4a-2c (16 hạt + 4 burst): asset + spec bổ sung. Bắt đầu 2026-10-09.
> Quy ước: cập nhật sau mỗi nhóm xong. Agent sau đọc bảng này để làm tiếp, không làm lại.
> Asset: `assets/v4a-2/` · Spec: `design-v4a-2bc.md` · Ảnh xem thử: `screenshots/v4a-2/` (gitignore).

## Bảng tiến độ
| # | Phần | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 0 | Đọc tài liệu + code (cover/, skins/, particles/, burst/, capabilities, enums) + tạo report | design-report-v4a-2bc.md | Xong | Enum PARTICLE_TYPES khớp 16 loại được giao (21 - 5 đã có). BURSTS_ON_OPEN thiếu `heart-burst` (đúng: heart-burst không phải burst sau mở, dùng cho lời chúc) |
| 1 | 13 kiểu mở: asset + spec | assets/v4a-2/open/<id>/ (25 file), _generator/{lib,open,shoot}.mjs, preview/open.html; design-v4a-2bc.md §0–§2 | Xong | Không raster: flower-gate vẽ vector 4 lớp mask (6.3KB gz). 2 loại asset: mask (tô token) + inline (path nhúng TS ≤0.45KB gz). 2 họ bố cục (vật thể / cổng toàn màn + biển chữ). Phát hiện từ khung giữa: cánh origami + nắp gift-box đè tên cặp đôi -> headAt; hạt light-gather bết khối -> lấy mẫu không lặp + 120 hạt chờ né tên; ink-spread lõi màu bg không thấy -> khoét lỗ thật bằng mask-composite; wax-seal nửa seal rơi đè lời chào -> rơi ra ngoài mép thẻ; card-3d thiếu mặt sau. Bẫy: XML comment có `--` làm SVG hỏng (mask không tải) -> lib.cmt(). Ảnh: screenshots/v4a-2/open-closed.png, open-mid.png |
| 2 | E12: Nhiều riêng 6 mẫu phong thư | assets/v4a-2/envelope-e12/ (e12.json + 3 svg), design-v4a-2bc.md §3 | Xong | Phát hiện lý do E12 bị hoãn: fxBlocked() chặn khi !ctx.opened + `.cover-on .fx-canvas{opacity:0}` + z-petals < z-cover -> đề xuất raiseOverCover + ctx.coverFx + cờ bgStarted (§3.0). Bảng 6 mẫu: classic 12 gold, kraft 10 oải hương, song-hy 24 red-paper + 8 sao, lace Vừa 6/Nhiều 12 cánh, minimal 10 chấm dừng nhanh, velvet 16 gold. Ảnh: screenshots/v4a-2/burst-e12.png (hàng dưới) |
| 3 | 16 hạt nền | assets/v4a-2/particles/ (particles.json + 16 svg), _generator/particles.mjs, preview/particles.html; §4 | Xong | Danh sách khớp enum (21 - 5 đã có). Sprite = path data cho Path2D (engine vẽ canvas, không dùng SVG string). Mọi module ước lượng ≤1.4KB gz. 7 trường tuỳ chọn mới cho ParticleKind. Sửa trong lúc làm: ửng hồng cánh sen (hình nấm -> 2 lớp chồng), alpha lớp phải NHÂN alpha hạt. Ảnh: screenshots/v4a-2/particles-sheet.png |
| 4 | 4 burst | assets/v4a-2/burst/ (bursts.json + 4 svg), _generator/burst.mjs, preview/burst.html; §5 | Xong | Tham số mô phỏng đúng công thức engine; confetti chỉnh từ (1.4vh, drag 1.4) đỉnh chỉ 67–83% màn -> (2.0–2.8vh, g .6vh, drag 2.2) đỉnh 26–41%, rơi ~200px/s. gold đổi màu theo mode. Ảnh: screenshots/v4a-2/burst-e12.png |
| 5 | Ảnh xem thử | screenshots/v4a-2/ open-closed.png, open-mid.png, particles-sheet.png, burst-e12.png | Xong | Chụp bằng `node _generator/shoot.mjs` (server tĩnh cổng ngẫu nhiên + /opt/pw-browsers/chromium); không dùng vite/dist |

## Trạng thái: XONG cả 5 phần (2026-10-09)
Spec: `design-v4a-2bc.md` §0–§6. Câu hỏi người duyệt: §6 (6 câu, có giả định).

## Bàn giao cho solution-designer / frontend-developer
- Kiến trúc cần chốt: (1) `fxBlocked` + `raiseOverCover` + `bgStarted` (§3.0) - chặn E12 và mọi burst trong cover; (2) DOM chung cover họ vật thể/cổng (§1.2), entry dựng chữ, module dựng hình trong `prepare()`; (3) `drawLayers()` dùng chung + 7 trường `ParticleKind` (§4.1); (4) 3 cờ `BurstParticle` (§5).
- Asset: SVGO giữ `viewBox`, `id`, `pathLength`, `fill-opacity`, `fill-rule`, `clip-path`; mask -> `public/theme-assets/open/<id>/`; inline -> chép `d` vào TS. JSON hạt/burst/e12 -> sinh module dữ liệu (không cần chạy lại generator nếu không đổi hình).
- Không cần ảnh raster nào.
