# Frontend report - v4a-2c vòng sửa 1/3 (P01–P11)

> Task `20261007-wedding-page` · frontend-developer (1 FE) · 2026-10-10 · branch `feat/20261007-wedding-page-v4a-2c` (chưa commit), cổng e2e 4173/5175.
> Nguồn: `design-review-v4a-2c.md` (P01–P11 + ảnh `screenshots/design-review-v4a-2c/`), `decisions.md` mục "Sau designer review v4a-2c" (Q1–Q6 duyệt).

## Tiến độ

| ID | Trạng thái | Đã sửa gì | File |
|---|---|---|---|
| P07 | xong, unit + e2e chọn lọc xanh | `BurstParticle.zones?: false` -> trường `nz` của mảnh: `alphaTarget` dùng danh sách vùng loại trừ rỗng, vẫn giữ vùng dịu. `heart-burst` có `from`/`origin` và `confetti` có `from`/`origin` (RSVP) đặt `zones: false`; burst "Sau khi mở" (không nguồn), `gold`, `red-paper`, `petals` giữ vùng loại trừ. Tách nhánh burst của `field.step` thành hàm thuần `moveBurst` / `stepBursts` để test. Unit: mảnh `nz` trong form a=1, mảnh thường a=0, vùng dịu vẫn .3; heart-burst từ nút giữa form chạy cả đời: đối chứng 0 khung hiện, bản sửa > 240. E2E mới: heart-burst + confetti từ nút "Gửi lời chúc" thật -> có mảnh a > .05 nằm trong `.gb-form`, hạt nền `snow` vẫn 0 trong form | `src/guest/effects/particles/field.ts`, `src/guest/effects/burst/heart-burst.ts`, `src/guest/effects/burst/confetti.ts`, `tests/bursts.test.ts`, `tests/e2e/v4a-2c.spec.ts` |
| P08 | xong, unit xanh | `stepBursts`: mảnh `toBg` giữ chỗ khi `k ≥ 0.7` nếu `bg + đã giữ < target` (`keep`), mảnh `keep` không mờ cuối đời; lúc chuyển giữ `p.a` hiện tại (bỏ gán `maxA`), `moveBg` đưa về alpha nền (approach 200 ms). Mảnh giữ chỗ luôn được chuyển (kể cả target vừa giảm - thừa thì tự rời màn như hạt nền khác). Không giữ được chỗ -> mờ như cũ. Unit: 3 mảnh / target 2 -> 2 mảnh alpha luôn 1 suốt đời + lúc chuyển, mảnh 3 mờ < .1 | `src/guest/effects/particles/field.ts`, `tests/bursts.test.ts` |
| P06 | xong, unit xanh | `confetti`: cỡ ô `SIZE = [16, 24]` (thay [7, 12]) cho cả "Sau khi mở" và RSVP (`from`/`origin`); sprite vẽ ở 24 px (thay 12). `gift-box` lấy mảnh qua `pieces()` nhưng cỡ do lời gọi `coverSparks` của gift-box quyết định (`[6, 10]`, không đổi - Q5). Unit: mọi mảnh sau khi mở + RSVP trong [16, 24] | `src/guest/effects/burst/confetti.ts`, `tests/bursts.test.ts` |
| P09 | xong, unit xanh | `double-door` Nhiều: `DOOR_SPARKS = { size: [7, 13], colors: ['#F3D48C', '#FFF8E6'] }` (cố định mọi theme, Q3; bỏ `gold()`); `light-gather` Nhẹ: `LIGHT_SPARK_SIZE = [6, 11]` (giữ màu `gold()`). Unit kiểm hằng số + quy tắc ≥ 6 px | `src/guest/cover/styles/double-door.ts`, `src/guest/cover/styles/light-gather.ts`, `tests/open-styles.test.ts` |
| P10 | xong, unit + e2e chọn lọc xanh | "Xem thêm" thành `<details>` có trạng thái riêng `moreOpen` (khởi tạo = đang chọn loại trong panel; `useEffect` chỉ đặt `true` khi có loại trong panel được chọn; `onToggle` theo thao tác người dùng) -> không bao giờ tự đóng. Hàm thuần `nextTypes()` trả loại bị bỏ do giới hạn 2 -> dòng `<p class="help pdrop" aria-live="polite">Đã bỏ "…" - chọn tối đa 2 loại.</p>` hiện 4 s hoặc tới lần bấm sau (dòng giữ sẵn chỗ `min-height` để "Màu hạt" không nhảy). Không sửa `Details` dùng chung trong `ui.tsx` (chunk admin ban đầu) - dùng `<details>` trực tiếp trong khối (chunk lười route Hiệu ứng). Unit `nextTypes` + e2e: bỏ chọn trong panel / bị đẩy ra -> `details[open]` còn, có dòng báo | `src/admin/editor/fx/particles-block.tsx`, `src/admin/editor/fx/particles-block.css` (mới), `tests/particle-kinds.test.ts`, `tests/e2e/v4a-2c.spec.ts` |
| P11 | xong, unit + e2e chọn lọc xanh | Chip "Theo theme" (`data-testid="ptheme"`, không có tiền tố `pchip-`) luôn hiện, đứng đầu hàng, `aria-pressed` = đang theo theme, `margin-right: .5rem` + viền đứt khi tắt. Đang theo theme: chip loại gợi ý có class `chip--theme` (viền 2px `--a-primary` + nền `--a-primary-soft`, admin không có `--a-accent`) + chữ phụ "· theme", không `aria-pressed`. Bỏ hậu tố "· đang theo theme: …" khỏi legend. Thêm: đang theo theme mà bấm loại gợi ý -> giữ đúng loại gợi ý thành lựa chọn riêng (trước đây là no-op với theme 1 gợi ý) | `src/admin/editor/fx/particles-block.tsx`, `src/admin/editor/fx/particles-block.css`, `tests/particle-kinds.test.ts`, `tests/e2e/v4a-2c.spec.ts` |
| Q2 | xong, unit xanh | Script `scripts/gen-particles.mjs` (đường dẫn tính theo vị trí script) sinh 16 module từ `particles.json` + ghi đè `scripts/particles-overrides.mjs`; trước khi thêm ghi đè đã chạy `--check` với ghi đè rỗng: **16/16 module 2c khớp từng byte** (script tái lập đúng bản đã sinh ở 2c). Test `tests/particle-modules.test.ts` sinh lại trong bộ nhớ và so từng file (lệch = đỏ). `.d.mts` cho 2 file script để test TS import. Cách chạy: mục "Cách sinh lại module hạt" bên dưới | `scripts/gen-particles.mjs`, `scripts/gen-particles.d.mts`, `scripts/particles-overrides.mjs`, `scripts/particles-overrides.d.mts`, `tests/particle-modules.test.ts` |
| P01 | xong, unit xanh | `dust-mote`: `size [5, 12]`, `alpha [.45, .8]`, `natural ['#B8925A', '#FFF1CC']`, stops `[[0,'c2',1],[.35,'c2',.85],[.6,'c1',.45],[1,'c1',0]]`; `naturalDark` giữ. Qua ghi đè -> sinh lại module (0.23 -> xem bảng size) | `scripts/particles-overrides.mjs`, `src/guest/effects/particles/types/dust-mote.ts` (sinh), `tests/particle-kinds.test.ts` (SPEC cỡ + alpha), `tests/particle-modules.test.ts` |
| P02 | xong, unit xanh | `snow`: `natural ['#EEF3F8', '#9FB3C8']`, stops `[[0,'c1',1],[.6,'c1',.95],[.8,'c2',.45],[1,'c2',0]]`; `naturalDark` giữ (stops dùng chung 2 mode - ở tối c2 trong suốt nên chỉ lòng rộng hơn .55 -> .6) | `scripts/particles-overrides.mjs`, `types/snow.ts` (sinh), `tests/particle-modules.test.ts` |
| P03 | xong, unit xanh | `paper-heart` lớp 4 (nét sáng): `d = 'M-5.8 -0.4C-6.3 -2 -5.6 -3.6 -4.2 -4C-3.3 -4.3 -2.5 -4 -2 -3.4'` (giữ `stroke:'light', lw:1, a:.55`); ghi đè báo lỗi nếu lớp 4 không còn là nét sáng. Unit: mọi điểm của path nằm trong thuỳ trái (path cũ trượt) | `scripts/particles-overrides.mjs`, `types/paper-heart.ts` (sinh), `tests/particle-modules.test.ts` |
| P04 | xong, unit xanh | `paper-heart` mặt sau: `[{ d: <tim>, fill: 'c2', a: .9 }, { d: 'M0-3.7V8.9', stroke: 'light', lw: .6, a: .6 }]` (c2 = primary-decor ở theme sáng; tối theo `kindPalette`) | như P03 |
| P05 | xong, unit xanh | `leaf-maple`: `size [18, 28]` (Q4) | `scripts/particles-overrides.mjs`, `types/leaf-maple.ts` (sinh), `tests/particle-kinds.test.ts` (SPEC), `tests/particle-modules.test.ts` |
| Unit toàn bộ | xanh | `npm test`: 32 files / 999 passed | - |
| Build | xanh | `npm run build` (typecheck + vite build + size-limit, 0 mục vượt trần) | - |
| E2E chọn lọc | xanh 4/4 | `npx playwright test tests/e2e/v4a-2c.spec.ts -g "P07\|8 chip\|heart-burst qua"` | - |
| Full e2e (1 lần) | **xanh 141/141 (12.5 phút)** | `npm run test:e2e` (139 cũ + 2 test P07 mới; test admin chip đã mở rộng cho P10/P11) | - |

## Kiểm tra (kết quả thật)
- `npm run typecheck`: sạch.
- `npm test`: **32 files / 999 passed** (trước vòng sửa: 31 / 966; mới: `tests/particle-modules.test.ts` 22 test, +P07/P08 trong `bursts.test.ts`, +P09 trong `open-styles.test.ts`, +`nextTypes` trong `particle-kinds.test.ts`).
- `npm run build`: xanh, 0 mục vượt trần.
- `npm run test:e2e` (toàn bộ, chạy 1 lần ở cuối): **141 passed (12.5m)**. Trong lúc sửa chỉ chạy e2e chọn lọc 1 lần (4 test). Không chạy lại e2e hay chụp ảnh để tái hiện lỗi (dùng ảnh của designer).
- Không commit. Không còn tiến trình nào của tôi chạy (cổng 4173/5175 đã trống).

## Kích thước (gzip, size-limit, config mẫu)
| Mục | Sau 2c (orchestrator đo) | Sau vòng sửa | Trần |
|---|---|---|---|
| JS ban đầu | 34.67 KB | 34.68 KB | 60 KB |
| CSS ban đầu | - | 13.46 KB | 25 KB |
| Admin JS ban đầu | 75.67 KB | **75.67 KB (không đổi)** - UI mới chỉ nằm trong `particles-block.tsx/.css` (chunk lười) | 80 KB |
| Admin CSS ban đầu | - | 6.20 KB | 10 KB |
| admin lazy: effects | - | 6.25 KB | 15 KB |
| lazy: field | - | 5.54 KB | 15 KB |
| open-kit | - | 2.58 KB | 3 KB |
| burst confetti / heart-burst | 1.07 / 0.77 (FE đo) | 1.14 / 0.82 KB | 3 KB |
| hạt dust-mote / snow / paper-heart / leaf-maple | 0.23 / 0.22 / 0.32 / 0.91 (FE đo) | 0.24 / 0.23 / 0.33 / 0.93 KB | 1.5 KB |
| kiểu mở double-door / light-gather | - | 0.77 / 2.49 KB | - |

## Cách sinh lại module hạt (Q2)
- `node scripts/gen-particles.mjs`: sinh lại 16 file `src/guest/effects/particles/types/<id>.ts` từ `docs/tasks/20261007-wedding-page/assets/v4a-2/particles/particles.json` + `scripts/particles-overrides.mjs`. Chỉ ghi file có thay đổi.
- `node scripts/gen-particles.mjs --check`: không ghi; exit 1 nếu module lệch dữ liệu. `npm test` cũng kiểm việc này (`tests/particle-modules.test.ts`).
- `--json <path>`: dùng một file json khác.
- Màu theo token (`tones`/`tonesDark` của watercolor/bubble/sparkle) nằm trong bảng `TONES` của script (json không có).
- Không thêm lệnh npm (ngoài phạm vi: không sửa `package.json`).

## Lệch so với đề xuất (kèm lý do)
1. **P01–P05: không sửa `particles.json`**. Số liệu của designer nằm trong `scripts/particles-overrides.mjs` (mỗi mục có ID review + ghi chú, ghi chú này cũng được in vào JSDoc của module). Lý do: json là tài liệu của designer, nằm ngoài phạm vi được sửa (`src/`, `tests/`, `scripts/`). Khi designer chép các thay đổi vào json thì xoá mục tương ứng trong file ghi đè; `--check` phải vẫn xanh. Các file svg preview của designer chưa được cập nhật.
2. **P02**: stops của `snow` dùng chung cho cả 2 mode. Ở mode tối c2 trong suốt nên chỉ có phần lòng rộng ra (.55 thành .6), màu tối giữ nguyên.
3. **P08**: mảnh đã giữ chỗ thì luôn được chuyển thành hạt nền, kể cả khi `target` vừa giảm (thừa thì hạt tự rời màn như các hạt nền khác) để tránh tắt đột ngột ở alpha 1.
4. **P10**: không sửa `Details` dùng chung trong `ui/ui.tsx` (thuộc chunk admin ban đầu). Khối dùng `<details>` có `onToggle` ngay trong chunk lười, nên Admin JS ban đầu giữ nguyên 75.67 KB. Dòng báo luôn giữ sẵn chỗ (`min-height`) để "Màu hạt" không bị đẩy xuống khi dòng báo hiện.
5. **P11**: admin không có `--a-accent`, nên viền nhấn dùng `--a-primary` (2px) + nền `--a-primary-soft`. Thêm hành vi: khi đang theo theme mà bấm chip gợi ý thì các loại gợi ý thành lựa chọn riêng. Trước đây đây là thao tác không có tác dụng với theme chỉ có 1 gợi ý.
6. **P06**: cỡ được hard-code trong `confetti.ts` (`SIZE = [16, 24]`) vì module burst viết tay, không sinh từ `bursts.json`. `bursts.json` vẫn ghi `[7, 12]`, cần designer cập nhật.
7. Q6 (`ink-spread`): không sửa, đúng như đã duyệt.

## Cần designer xác nhận bằng mắt
| ID | Cần xem | Đã có test tự động |
|---|---|---|
| P01 | dust-mote trên `hoai-co` (giấy sáng) + `dem-nhung` | có (số liệu + module khớp), chưa có test thị giác |
| P02 | snow trên `tram-vang`: đọc thành khối, không còn vòng rỗng | có (số liệu) |
| P03 | nét sáng tim giấy ở cỡ lớn | có (hình học: mọi điểm nằm trong thuỳ trái) |
| P04 | mặt sau tim trên `hong-phan` + `dem-nhung` | có (số liệu) |
| P05 | lá phong [18, 28] trên `dat-nung` | có (số liệu) |
| P06 | confetti sau khi mở + RSVP trên `pastel-han` / `dem-nhung`; gift-box không đổi | có (cỡ [16, 24], gift-box giữ [6, 10] trong code) |
| P07 | tim / confetti bay qua form "Gửi lời chúc" có đẹp không | **có e2e**: mảnh a > .05 trong `.gb-form`, hạt nền vẫn 0 trong form |
| P08 | xác pháo `son-do` lúc chuyển thành hạt nền: không còn chớp | có (unit: alpha luôn 1 tới lúc chuyển) - tuỳ chọn xem mắt |
| P09 | sao cửa đôi Nhiều trên `tram-vang` + light-gather Nhẹ | có (hằng số) |
| P10 | câu chữ dòng "Đã bỏ …" trên 390 px | **có e2e** (panel không đóng, có dòng báo) |
| P11 | chip "Theo theme" viền đứt + chip gợi ý "· theme" trên 390 / 1360 px | **có e2e** (thứ tự, aria-pressed, hậu tố, legend) |
