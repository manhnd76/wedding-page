# Design report v4a-2b/2c (ui-ux-designer B) - tiến độ

> Đợt v4a-2b (13 kiểu mở + E12) và v4a-2c (16 hạt + 4 burst): asset + spec bổ sung. Bắt đầu 2026-10-09.
> Quy ước: cập nhật sau mỗi nhóm xong. Agent sau đọc bảng này để làm tiếp, không làm lại.
> Asset: `assets/v4a-2/` · Spec: `design-v4a-2bc.md` · Ảnh xem thử: `screenshots/v4a-2/` (gitignore).

## Bảng tiến độ
| # | Phần | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 0 | Đọc tài liệu + code (cover/, skins/, particles/, burst/, capabilities, enums) + tạo report | design-report-v4a-2bc.md | Xong | Enum PARTICLE_TYPES khớp 16 loại được giao (21 - 5 đã có). BURSTS_ON_OPEN thiếu `heart-burst` (đúng: heart-burst không phải burst sau mở, dùng cho lời chúc) |
| 1 | 13 kiểu mở: asset + spec | assets/v4a-2/open/<id>/ (25 file), _generator/{lib,open,shoot}.mjs, preview/open.html; design-v4a-2bc.md §0–§2 | Xong | Không raster: flower-gate vẽ vector 4 lớp mask (6.3KB gz). 2 loại asset: mask (tô token) + inline (path nhúng TS ≤0.45KB gz). 2 họ bố cục (vật thể / cổng toàn màn + biển chữ). Phát hiện từ khung giữa: cánh origami + nắp gift-box đè tên cặp đôi -> headAt; hạt light-gather bết khối -> lấy mẫu không lặp + 120 hạt chờ né tên; ink-spread lõi màu bg không thấy -> khoét lỗ thật bằng mask-composite; wax-seal nửa seal rơi đè lời chào -> rơi ra ngoài mép thẻ; card-3d thiếu mặt sau. Bẫy: XML comment có `--` làm SVG hỏng (mask không tải) -> lib.cmt(). Ảnh: screenshots/v4a-2/open-closed.png, open-mid.png |
| 2 | E12: Nhiều riêng 6 mẫu phong thư | assets/v4a-2/envelope-e12/ | Đang làm | |
| 3 | 16 hạt nền | assets/v4a-2/particles/ | Chưa | |
| 4 | 4 burst | assets/v4a-2/burst/ | Chưa | |
| 5 | Ảnh xem thử | screenshots/v4a-2/ | Chưa | |
