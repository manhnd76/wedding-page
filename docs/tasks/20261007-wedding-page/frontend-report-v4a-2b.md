# Frontend report - v4a-2b (13 kiểu mở + E12)

> Task `20261007-wedding-page` · FE-2 · 2026-10-09 · worktree `/home/user/wp-v4a-2b` (branch `wt/v4a-2b`), cổng e2e 4373/5375.
> Spec: `solution-v4a-2bc.md` mục 1, 3, 4, 5; `design-v4a-2bc.md` §0–§3; `decisions.md` 2026-10-09.

## Tiến độ

| Phần | Trạng thái | File | Ghi chú |
|---|---|---|---|
| Đọc spec + code | xong | - | solution-v4a-2bc §1,3,4,5; design-v4a-2bc §0–3; asset `assets/v4a-2/` + ảnh designer `open-closed.png`/`open-mid.png` |
| Lõi: `anim.ts` (OpenRun + `totalMs`/`remainingMs`, tua nhanh đồng đều), `open-registry.ts` (OpenModule v2 + 13 loader), `open-styles.ts` (thêm `family`, ms theo module) | xong | `src/guest/cover/anim.ts`, `open-registry.ts`, `src/shared/open-styles.ts` | |
| `cover.ts`: `effectiveOpen` (máy yếu), DOM 2 họ (`.op-layers`/`.op-stage`, `.cv-plaque`, `.cv-guestline`), điểm chạm, `__wpCover` (debug), sự kiện `cover-gone`, `fitEnvGuest` dùng chung `.op-fit` | xong | `src/guest/cover/cover.ts`, `src/guest/styles/cover.css` | |
| `bootstrap.ts` 1 dòng `target === 'cover'` (+1 dòng import `OPEN_META`) | xong | `src/guest/bootstrap.ts` | |
| open-kit: `layers.ts` (timeline theo tên lớp, `bind`, `waitMasks`, `greet`), `photo.ts`, `sparks.ts` (hạt trên cover) | xong | `src/guest/cover/open-kit/*` | |
| Asset mask (bỏ comment/khoảng trắng) | xong | `src/guest/cover/theme-assets/<id>/*.svg` | xem Lệch spec #1 |
| curtain | xong (chụp tay 360×740) | `styles/curtain.ts/.css` | |
| wax-seal | xong (chụp tay) | `styles/wax-seal.ts/.css` | |
| origami | xong (chụp tay) | `styles/origami.ts/.css` | confetti Nhiều = mảnh vuông vẽ bằng `shapes` (burst `confetti` khi 2c có) |
| double-door | xong (chụp tay) | `styles/double-door.ts/.css` | hạt Nhiều: `sparkle` (2c) -> `gold-dust` |
| flower-gate | xong (chụp tay) | `styles/flower-gate.ts/.css` | cánh hoa = burst `petals` (loại k0 của theme) |
| scroll | xong (chụp tay) | `styles/scroll.ts/.css` | Nhiều: 12 mảnh rơi (son-do: `red-paper` 2c -> cánh `petal-rose` nhuộm đỏ; theme khác: vàng) |
| card-3d | xong (chụp tay) | `styles/card-3d.ts/.css` | nghiêng theo con trỏ (pointer: fine) / lắc ±3° 1 lần (cảm ứng), chỉ Vừa/Nhiều |
| light-gather | xong (chụp tay, dem-nhung) | `styles/light-gather.ts/.css` | canvas riêng trong cover; đồng hồ canvas = currentTime animation WAAPI (tua nhanh tự áp); chính sách FPS `fpsPolicy` |
| gift-box | xong (chụp tay) | `styles/gift-box.ts/.css` | confetti Vừa 40 / Nhiều 80 (design §2.9), dự phòng `shapes` khi chưa có burst `confetti` |
| moon-gate | xong (chụp tay) | `styles/moon-gate.ts/.css` | Nhiều: `petal-lotus` (2c) -> loại k0 của theme |
| book | xong (chụp tay) | `styles/book.ts/.css` | `--op-cover-ink` tính lúc chạy (accent pha trắng tới ≥ 4.5:1) thay bảng 12 theme |
| ink-spread | xong (chụp tay) | `styles/ink-spread.ts/.css` | kỹ thuật A (mask-composite) chạy trên Chromium; dự phòng B (`.ik-fill`) khi `CSS.supports` không có composite |
| polaroid | xong (chụp tay) | `styles/polaroid.ts/.css` | |
| Capability: bật 13 id | xong | `src/shared/caps/v4a-2b.ts` | |
| E12 (6 mẫu phong bì) | xong (chụp tay song-hy Nhiều, lace Vừa) | `skins/kit.ts` (`rich`, `DEFAULT_RICH`), `styles/envelope.ts` (`richPlan`, import động open-kit/sparks), `skins/{kraft,song-hy,lace,minimal,velvet}.ts` | số hạt theo design §3.1 (kraft 10, minimal 10, song-hy 24 + 8 sao, lace 6/12, velvet 16, classic 12) |

| Admin: gallery 17 thẻ (đọc CAPABILITIES), badge "Nặng ⚠", dòng ghi chú `open-heavy-note` khi kiểu thật có chi phí Cao, hoạt ảnh thu nhỏ 13 kiểu | xong (chưa chạy e2e admin) | `src/admin/editor/fx/open-block.tsx`, `fx/open-mini.css` | |
| Sửa test cũ vỡ do bật capability | xong | `tests/e2e/admin-v22.spec.ts` (dòng 62–68: "Theo theme (Cuộn thư)"), `tests/sections-plugin.test.ts` (origami không còn fallback: openStyle `origami`, 3 cảnh báo) | `sections-plugin.test.ts` không có trong bảng 3.2 nhưng vỡ do 2b bật capability (nguyên tắc 3.1-5) |
| Unit test | xong, xanh | `tests/open-styles.test.ts` (thêm: 13 timeline × tổng ≤ 2400 / Nhẹ < Vừa / Nhiều − Vừa ≤ 50 / `OPEN_META.ms` = tổng Vừa / thuộc tính cho phép / clip-path chữ biên −.3em), `tests/open-kit.test.ts` (16), `tests/envelope-e12.test.ts` (8) | |
| E2E `tests/e2e/v4a-2b.spec.ts` | **đang dở**: đã viết xong file; mới chạy chọn lọc nhóm "Vừa ≤ 2.4s" -> **13/13 passed (1.8m)**. CHƯA chạy: tua nhanh, Nhẹ/Nhiều, Tắt, reduced, máy yếu, module lỗi, E12, admin | `tests/e2e/v4a-2b.spec.ts` | |
| Build + size-limit | xanh (lần build gần nhất, trước khi thêm CSS admin) | - | số ở mục Kích thước |
| Toàn bộ e2e 1 lần | **chưa chạy** | - | |

## Trạng thái khi tạm dừng (orchestrator yêu cầu, 2026-10-09)

- Code ở trạng thái hoàn chỉnh (không có file sửa dở). `npm run typecheck`: **sạch (exit 0)**. `npm test` lần gần nhất: **25 files / 670 tests passed**.
- Đã dừng dev server :5381 và preview/e2e. Chưa commit.

### Bước tiếp theo cho agent sau
1. `npm run build` (xác nhận size-limit sau khi thêm `open-mini.css`, ghi số vào mục Kích thước).
2. Chạy chọn lọc từng nhóm của `tests/e2e/v4a-2b.spec.ts` với cổng FE-2 (`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium PW_PREVIEW_PORT=4373 PW_DEV_PORT=5375 npx playwright test tests/e2e/v4a-2b.spec.ts -g "<nhóm>"`): `chạm lần 2`, `Nhẹ ngắn hơn`, `Tắt ->`, `reduced`, `máy yếu`, `lỗi tải`, `E12`, `admin`. Điểm dễ cần chỉnh: ngưỡng gỡ cover ≤ 450 ms đồng hồ thật khi tua nhanh (máy cloud chậm); số hạt E12/Nhiều đếm bằng đỉnh `__wpFx.snapshot().bursts.length` (lấy mẫu 100 ms - mẫu `minimal` đời hạt 500–650 ms); test module lỗi lọc thông báo lỗi mạng của trình duyệt.
3. Chạy **toàn bộ** e2e 1 lần (cổng FE-2), ghi dòng tổng kết thật vào mục Kiểm tra.
4. Viết ghi chú phát hành (decisions 2026-10-09): config "Theo theme" đổi kiểu mở sau deploy - `son-do` -> Cuộn thư, `dem-nhung` -> Hạt sáng tụ thành tên, `hong-phan` -> Cổng hoa (khi v4a-1 bật theme), và mọi theme khác có `suggest.openStyle` thuộc 13 kiểu mới.
5. Báo cáo cuối: việc cần designer review (ảnh khung giữa 13 kiểu với "Nguyễn Thuỳ Linh"; độ đậm cánh hoa lace trên theme sáng; lệch spec #2 scroll/book) + kiểm tay máy thật (`light-gather` ≥ 45 fps ở Vừa trên Android tầm trung; Safari iOS: 3D backface, clip-path WAAPI scroll/moon-gate/polaroid, mask-composite ink-spread).

## Lệch spec

1. **Vị trí asset mask**: `src/guest/cover/theme-assets/<id>/` (Vite băm tên file, CSS tham chiếu tương đối) thay cho `public/theme-assets/open/<id>/` (design §0.2). Lý do: file trong `public/` không băm tên mà `_headers` để `immutable` 1 năm -> designer sửa SVG thì khách giữ bản cũ; thư mục có `theme-assets` trong đường dẫn để `assetsInlineLimit` (Bước 0) không inline data URI vào CSS (ngân sách CSS kiểu mở 1.5 KB).
2. **scroll, book: "Kính gửi + khách" đọc được TRƯỚC khi chạm** (solution 1.2 "Tên luôn đọc được trước khi chạm"); ảnh designer `open-closed.png` của 2 kiểu này không có tên khách (tên nằm trên giấy cuộn / trang trong bị bìa che). scroll: node `.cv-guestline` đặt trong vùng giấy nhưng ở lớp trên giấy (không bị clip), giấy trải ra phía sau chữ. book: tên khách thật ở dưới sách, trang trong lặp lại câu mời (trang trí, aria-hidden). Cần designer xác nhận.
3. **Số hạt E12 theo design §3.1** (design thắng solution 1.8): kraft 10 (solution 12), minimal 10 (solution 12), song-hy 24 + 8 sao.
4. **Hạt/burst của v4a-2c chưa có -> dùng loại đã có** (không tạo module mới): `gold` -> `gold-dust` (màu vàng theo mode), `sparkle` -> `gold-dust`, `red-paper` -> `petal-rose` nhuộm `#C8231F/#E0392B`, `petal-lotus` -> loại k0 của theme, burst `confetti` -> mảnh giấy vẽ tại chỗ (`shapes` trong open-kit/sparks; tự chuyển sang burst `confetti` khi 2c có module). Sprite oải hương / cánh hoa ép / chấm sticker của E12 vẽ từ path designer (`envelope-e12/e12.json`) qua `shapes`.
5. **Vùng dịu `.env-addr` / `.cv-plaque` cho hạt trên cover (design §3.0)**: CHƯA làm - cần thêm 2 selector vào `SOFT_SELECTOR` trong `effects/particles/geometry.ts` (file của 2c). Hiện hướng phát hạt đã né (quạt lên / toả ngắn). **Yêu cầu orchestrator/2c**: thêm `.env-addr, .cv-plaque` vào `SOFT_SELECTOR` + gọi `refreshZones()` khi `setOverCover(true)`.
6. **ink-spread**: chữ trên cover bị lỗ khoét "ăn" dần (design §2.12: hành vi mong muốn, chữ không chuyển động) - khác tiêu chí "không clip chữ" của kiểu khác; test e2e chỉ kiểm hộp chữ nằm trong viewport.
7. **JS ban đầu cấu hình mặc định +0.88 KB** (31.31 -> 32.19, solution tiêu chí #3 cho phép +0.5): phần lớn là bảng `__vite__mapDeps` của 13 loader mới (tên file băm JS + CSS của mỗi kiểu, không nén tốt) + `OPEN_META`/`effectiveOpen` + khung DOM 2 họ trong `cover.ts`. Vẫn dưới trần 60 KB.
8. **`bootstrap.ts`**: ngoài dòng `target === 'cover'` thêm 1 dòng import `OPEN_META` (cạnh import `mountCover`).

## Kích thước (gzip, size-limit, build gần nhất - trước khi thêm CSS mini admin)

| Mục | Trước (Bước 0) | Sau | Trần |
|---|---|---|---|
| JS ban đầu (cấu hình mặc định: tram-vang + envelope) | 31.31 KB | 32.19 KB | 60 KB |
| CSS ban đầu | 11.39 KB | 11.47 KB | 25 KB |
| Admin JS ban đầu | 73.46 KB | 71.98 KB | 80 KB |
| open-kit | - | 2.25 KB | 3 KB |
| openStyle JS: curtain 0.68 · wax-seal 1.79 · origami 1.10 · double-door 0.69 · flower-gate 0.57 · scroll 1.30 · card-3d 0.92 · light-gather 2.41 · gift-box 1.15 · moon-gate 0.78 · book 0.90 · ink-spread 0.98 · polaroid 0.95 · envelope 1.57 | | | 4 KB/kiểu |
| openStyle CSS: curtain 0.60 · wax-seal 0.92 · origami 0.94 · double-door 0.54 · flower-gate 0.57 · scroll 0.76 · card-3d 0.69 · light-gather 0.10 · gift-box 0.62 · moon-gate 0.87 · book 0.75 · ink-spread 0.49 · polaroid 0.85 | | | 1.5 KB/kiểu |
| Skin phong bì (trước E12): classic 0.18 · kraft 0.96 · lace 0.65 · minimal 0.40 · song-hy 0.81 · velvet 0.63 | | **chưa đo lại sau E12** | 1.5 KB |
| Tổ hợp nặng (`config-heavy-2b.json`) | | **chưa làm fixture/đo** | 60 KB |

## Kiểm tra

- `npm run typecheck`: sạch (2026-10-09, lúc tạm dừng).
- `npm test`: 25 files / 670 tests passed.
- `npm run build`: xanh (size-limit đạt) - trước khi thêm `open-mini.css` admin + skin E12; cần build lại.
- E2E chọn lọc: `v4a-2b.spec.ts -g "Vừa ≤ 2.4s"` 13 passed (1.8m). Các nhóm khác + toàn bộ e2e: chưa chạy.
- Chụp tay (script tạm, không lưu vào repo) 360×740 cả 13 kiểu + E12 song-hy/lace: không thấy chữ bị cắt; đã sửa trong lúc chụp: tâm seal wax-seal, chiều cửa double-door, `rotateY(0)` không đơn vị làm card-3d không xoay (đổi `0deg` mọi nơi, kể cả song-hy), lỗ ink-spread nở quá nhanh, chú thích polaroid.
