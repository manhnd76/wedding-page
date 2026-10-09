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
| E2E `tests/e2e/v4a-2b.spec.ts` (72 test) | xong, chạy chọn lọc từng nhóm đều xanh: Vừa 13/13, tua nhanh 13/13, Nhẹ+Nhiều 13/13, Tắt 13/13, reduced 4/4, máy yếu 1/1, module lỗi 1/1, E12 6/6, admin 1/1 | `tests/e2e/v4a-2b.spec.ts` | sửa trong lúc chạy: bỏ CSS transition (tên hiện dần khi font về) khỏi phép đo thời lượng; light-gather Nhẹ có 12 hạt lấp lánh theo design; locator gallery chỉ lấy `.ogrid[aria-label="Kiểu mở thiệp"]` |
| Tiếp tục sau merge v4a-1: vùng dịu (`SOFT_SELECTOR`), fixture tổ hợp nặng, tách bảng loader lazy `open-loaders.ts`, chụp tay 12 kiểu với theme gợi ý (theme v4a-1 thật) | xong | `geometry.ts` (1 hunk), `open-kit/sparks.ts`, `tests/fixtures/config-heavy-2b.json`, `cover/open-loaders.ts`, `cover/open-registry.ts` | |
| Build + size-limit | xanh (lần build gần nhất, trước khi thêm CSS admin) | - | số ở mục Kích thước |
| Toàn bộ e2e 1 lần | xong: **110 passed, 1 failed (10.5m)** | - | lỗi duy nhất: `flower-gate: chạm lần 2` ngưỡng gỡ cover 458 ms > 450 ms đồng hồ thật (phần còn lại ≤ 300 ms vẫn đạt); nguyên nhân: đo bằng vòng gọi Playwright (`waitFor detached`) cộng độ trễ. Đã đổi sang đo trong trang (click capture -> MutationObserver) và chạy lại nhóm tua nhanh: **13 passed (1.6m)**. Không chạy lại toàn bộ (quy ước 1 lần). |

## Trạng thái khi tạm dừng (orchestrator yêu cầu, 2026-10-09) - ĐÃ LÀM TIẾP: mọi bước dưới đây đã xong, xem các mục sau

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
5. **Vùng dịu `.env-addr` / `.cv-plaque` (design §3.0)**: đã làm - orchestrator cho phép 1 hunk trong file của 2c: thêm 2 selector vào `SOFT_SELECTOR` (`src/guest/effects/particles/geometry.ts`, dòng 21–22). `open-kit/sparks.ts` gọi `field.refreshZones()` mỗi lần bật `setOverCover(true)` (không sửa `field.ts`).
6. **ink-spread**: chữ trên cover bị lỗ khoét "ăn" dần (design §2.12: hành vi mong muốn, chữ không chuyển động) - khác tiêu chí "không clip chữ" của kiểu khác; test e2e chỉ kiểm hộp chữ nằm trong viewport.
7. **JS ban đầu cấu hình mặc định +0.58 KB so với mốc v4a-1** (32.97 -> 33.55; solution tiêu chí #3 cho phép +0.5): đã tách bảng loader 13 kiểu ra chunk lazy `src/guest/cover/open-loaders.ts` (bảng tên file băm JS + CSS không nén tốt, từ +1.11 xuống +0.58). Phần còn lại: `OPEN_META`/`effectiveOpen` (chunk dùng chung với admin, 0.4 KB) + khung DOM 2 họ trong `cover.ts`. Đánh đổi: kiểu mở mới tải thêm 1 chunk nhỏ (0.82 KB, chưa modulepreload - plugin thuộc v4a-1) song song với chờ font tên.
8. **`bootstrap.ts`**: ngoài dòng `target === 'cover'` thêm 1 dòng import `OPEN_META` (cạnh import `mountCover`).

## Ghi chú phát hành (decisions 2026-10-09: config "Theo theme" đổi kiểu mở sau deploy)

Bản này bật 13 kiểu mở thiệp mới. Thiệp đang để **Kiểu mở thiệp = "Theo theme"** sẽ tự đổi sang kiểu gợi ý của theme ngay sau khi deploy (trước đó các theme này rơi về Phong bì):

| Theme | Trước | Sau |
|---|---|---|
| Trầm Vàng (`tram-vang`) | Phong bì | Phong bì (không đổi) |
| Hồng Phấn (`hong-phan`) | Phong bì | Cổng hoa |
| Lục Bảo (`luc-bao`) | Phong bì | Cửa đôi |
| Son Đỏ (`son-do`) | Phong bì | Cuộn thư |
| Mực Giấy (`muc-giay`) | Phong bì | Thiệp gấp đôi (lật trang) |
| Hoài Cổ (`hoai-co`) | Phong bì | Dấu sáp vỡ |
| Sen Chàm (`sen-cham`) | Phong bì | Cửa trăng |
| Màu Nước (`mau-nuoc`) | Phong bì | Mực loang |
| Đất Nung (`dat-nung`) | Phong bì | Gấp giấy |
| Pastel Hàn (`pastel-han`) | Phong bì | Ảnh polaroid |
| Đêm Nhung (`dem-nhung`) | Phong bì | Hạt sáng tụ thành tên (chi phí Cao: máy yếu tự dùng fade-zoom) |
| Biển Đảo (`bien-dao`) | Phong bì | Thiệp 3D xoay |

Muốn giữ phong bì: vào Hiệu ứng -> Kiểu mở thiệp -> chọn "Phong bì" (ghi cố định, không theo theme). Không có migration ghim giá trị cũ. Mức "Nhiều" của 6 mẫu phong bì có thêm hạt lấp lánh khi mở (E12); lace có 6 cánh hoa ở mức Vừa.

## Kích thước (gzip, size-limit) - đo lại sau khi merge v4a-1 (2026-10-09, tiếp tục)

Mốc sau v4a-1 (chưa có 2b, orchestrator đo): guest JS ban đầu 32.97 KB · CSS ban đầu 12.96 KB · Admin JS 75.39 KB.

| Mục | Mốc v4a-1 | Sau 2b | Trần |
|---|---|---|---|
| JS ban đầu, cấu hình mặc định (tram-vang + envelope) | 32.97 KB | 33.55 KB (+0.58; trước khi tách bảng loader: 34.08) | 60 KB |
| Bảng loader 13 kiểu `open-loaders` (lazy) | - | 0.82 KB | 15 KB |
| CSS ban đầu, cấu hình mặc định | 12.96 KB | 13.01 KB (+0.05) | 25 KB |
| Admin JS ban đầu | 75.39 KB | 73.85 KB | 80 KB |
| **Tổ hợp nặng** `tests/fixtures/config-heavy-2b.json` (dem-nhung + light-gather + high + reveal cinematic [vẫn fallback `soft` tới 2a] + gold-dust + firefly): JS ban đầu / CSS ban đầu | | 35.04 KB / 13.11 KB | 60 / 25 KB |
| open-kit | - | 2.31 KB | 3 KB |
| Skin phong bì sau E12: classic 0.19 · kraft 1.26 · lace 0.86 · minimal 0.51 · song-hy 0.98 · velvet 0.73 | | | 1.5 KB |
| openStyle JS: curtain 0.68 · wax-seal 1.79 · origami 1.10 · double-door 0.69 · flower-gate 0.57 · scroll 1.30 · card-3d 0.92 · light-gather 2.41 · gift-box 1.15 · moon-gate 0.78 · book 0.90 · ink-spread 0.98 · polaroid 0.95 · envelope 1.57 | | | 4 KB/kiểu |
| openStyle CSS: curtain 0.60 · wax-seal 0.92 · origami 0.94 · double-door 0.54 · flower-gate 0.57 · scroll 0.76 · card-3d 0.69 · light-gather 0.10 · gift-box 0.62 · moon-gate 0.87 · book 0.75 · ink-spread 0.49 · polaroid 0.85 | | | 1.5 KB/kiểu |

Admin JS giảm vì Bước 0 đã tách khối `fx/*` (route Hiệu ứng lazy); phần admin mới của 2b (`open-block.tsx`, `open-mini.css`) nằm trong chunk lazy của route -> không cần tách thêm.

## Kiểm tra

- `npm run typecheck`: sạch (exit 0).
- `npm test`: **29 files / 866 tests passed** (sau merge v4a-1).
- `npm run build`: xanh, size-limit đạt (số ở mục Kích thước). Tổ hợp nặng: `WP_CONFIG_PATH=tests/fixtures/config-heavy-2b.json npx vite build && npx size-limit` -> JS ban đầu 35.04 KB, CSS 13.11 KB; đã build lại bản thường trước e2e.
- E2E toàn bộ 1 lần (`PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium PW_PREVIEW_PORT=4373 PW_DEV_PORT=5375 npm run test:e2e`): **110 passed, 1 failed (10.5m)** - lỗi ngưỡng đồng hồ thật của `flower-gate` tua nhanh (458 > 450 ms); đã sửa cách đo, chạy lại nhóm "chạm lần 2": 13 passed.
- Chụp tay 360×740 (script tạm, không lưu repo): 13 kiểu (đóng + khung giữa), E12 song-hy Nhiều / lace Vừa, và 12 kiểu với theme gợi ý thật của v4a-1 (trạng thái đóng): không thấy chữ bị cắt.

## Cần designer review
1. Ảnh khung giữa 13 kiểu với khách "Nguyễn Thuỳ Linh" ở theme gợi ý (designer chụp + lưu bằng chứng theo quy ước).
2. Lệch #2 (scroll/book: tên khách hiện trước khi chạm).
3. Cánh hoa lace (E12) khá nhạt trên theme sáng; hạt thay thế khi 2c chưa merge (`gold-dust`, `petal-rose` đỏ, loại k0) - xem lại sau khi 2c merge.
4. double-door: cánh xoay tới 105° nên giữa timeline gần như vuông góc (mảnh), khác ảnh mid của designer (~70°).
5. ink-spread: chữ trên cover bị lỗ mực "ăn" (đúng §2.12, cần xác nhận cảm nhận).
6. card-3d: desktop nghiêng theo con trỏ, mobile lắc 1 lần.

## Cần kiểm tay máy thật
- `light-gather` ≥ 45 fps ở Vừa trên Android tầm trung (chính sách FPS: < 45 -> 250 hạt; vẫn < 45 hoặc < 30 -> fade-zoom + 12 hạt).
- Safari iOS: 3D backface (origami, double-door, card-3d, book, polaroid, wax-seal); `clip-path` WAAPI (scroll, moon-gate, polaroid); `-webkit-mask-composite: xor` + animate `mask-size` (ink-spread; dự phòng B nếu không hỗ trợ).
- Android tầm thấp (kiểu chi phí Vừa tự chạy bản Nhẹ); webview Zalo/Facebook/Messenger.

## Orchestrator kiểm tra lại (2026-10-09)
- `npm run typecheck` sạch · `npm test` 29 files / 866 passed · `npm run build` xanh.
- size-limit (config mẫu, orchestrator đo): JS ban đầu **34.36 KB**, CSS ban đầu **13.32 KB**, Admin JS ban đầu **75.62 KB** gzip (khác số FE báo 33.55 / 13.01 / 73.85 — có thể đo trước sửa cuối; vẫn dưới trần 60 / 25 / 80).
- E2E toàn bộ (cổng 4373/5375, `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`): **111 passed (10.3m)** — sau sửa cách đo "chạm lần 2" của `flower-gate`.
