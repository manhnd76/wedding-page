# Frontend report - v4a-1 (FE-1)

Worktree: `/home/user/wp-v4a-1` (branch `wt/v4a-1`). Spec: `solution.md` Rev 5 mục 10, `design.md` Bản sửa 5 (§1.6.7, §1.7, §8.12, Phụ lục C), `design-report-v4a-1.md`.

## Tiến độ
| # | Phần việc | Trạng thái | File | Ghi chú |
|---|---|---|---|---|
| 1 | Font: 14 gói @fontsource + kiểm subset vietnamese | xong | `package.json`, `package-lock.json` | 14 gói `^5.3.0` (5.3.0). Cả 14 có key `vietnamese` trong `unicode.json`, đủ file face theo registry (không sửa registry). Font cover (heading 500+400i, script 400, body 600; latin+vietnamese): tram-vang 145.1 KB (lớn nhất), luc-bao 128.6, hoai-co 132.5, mau-nuoc 129.1, dat-nung 131.1, dem-nhung 121.4, muc-giay 120.1, pastel-han 119.3, bien-dao 112.6, hong-phan 105.6, son-do 102.1, sen-cham 78.3 -> cả 12 ≤ 180 KB. |
| 2 | Capabilities (`caps/v4a-1.ts`) + presets motif | xong | `src/shared/caps/v4a-1.ts`, `caps/types.ts` (vùng), `capabilities.ts` (vùng `[v4a-1] keys`: `motifSet` gốc `['none']`), `theme/presets.ts` | 9 theme, 8 ornament, 7 texture, 8 khung, 7 divider, 14 font, 7 bộ motif. Preset: `motif` + `motifSuggest` theo bảng 10.1 (8 theme tắt = `none`/`band`/`medium`). Test cũ vỡ do bật capability: `tests/sections-plugin.test.ts` case 'giá trị chưa hỗ trợ' (dùng `bien-dao`/`moon-dance`) -> viết lại tự chọn giá trị chưa có (3.1#5). |
| 3 | Asset: chép + SVGO (ornament/divider/frame/texture/motif) | xong | `scripts/svgo.theme-assets.mjs` (mới), `src/guest/theme-assets/{ornaments,dividers,frames,textures,motifs}/**` (52 file) | SVGO 3.3.5 chạy 1 lần (`preset-default` + giữ viewBox/id/defs/use, `mergePaths`/`convertShapeToPath`/`collapseGroups`/`removeHiddenElems` tắt, `convertPathData.floatPrecision: 2`, `removeUnknownsAndDefaults.unknownAttrs: false` để giữ `pathLength` trên circle/line). Đã kiểm số lượng `pathLength`/`id`/`class="wash"`/`<use`/`viewBox`/`<symbol`/`<defs` trước = sau. `watercolor.svg`: 10 path `.wash` đổi `fill-opacity` -> `opacity`. 15 file SVGO giảm < 10% (hoặc tăng) -> chép nguyên bản (motif la-canh/may-cat-tuong/song-nuoc, art-deco+chu-hy medallion, hoa-sen band, ornament korean). |
| 4 | Divider tách file (plugin + preview-bridge + bootstrap) | xong | `src/shared/theme/parts.ts` (`DIVIDER_SPRITES`), `sections/common.ts` `divider()`, `scripts/vite-plugins/inject-config-og.ts`, `preview-bridge.ts` (`dividerUrlFor`), `bootstrap.ts` (1 dòng nhánh preview - hunk được phép #18), `styles/dividers.css` | Plugin: `State.divider`, `resolved.dividerUrl`, emit `/ornaments/divider-<id>.<hash8>.svg` (đang dùng + 8 file cho preview), `preview-assets.json` thêm `dividers`, middleware dev phục vụ. `torn-paper` mask CSS. |
| 5 | Texture `.sec::before` + xoá `body::before/::after` | xong (đã xác nhận trên build) | `styles/textures.css` (mới), `styles/base.css` (xoá khối texture - hunk được phép #18; vùng v4a-1: `font-synthesis-weight: none`), `styles/sections.css` (vùng: `--sec-bg` theo tone) | data-URI paper/velvet chuyển sang `textures.css`; velvet vignette thành gradient 2 mép trong `.sec::before`; cover (Còn mở #12): 6 texture tile qua `.cover::before` trong `textures.css`, không sửa `cover.css`. |
| 6 | Ornament watercolor `.wash` + khung ảnh (stamp/polaroid) | xong | `styles/ornaments.css`, `styles/frames.css` (mới), `sections/common.ts` `framed()`, `bootstrap.ts` vùng v4a-1 (`html[data-orn]`, `tilt-r`) | stamp bọc `.frame-wrap--stamp`; polaroid: thay bộ đếm trong module bằng gắn `tilt-r` cho ảnh polaroid thứ chẵn theo thứ tự DOM ngay sau render trong vùng v4a-1 của bootstrap (cùng kết quả, không phải export/reset bộ đếm ngoài vùng). `circle-moon` vành nền theo `--sec-bg`. |
| 7 | B2 schema + merge + resolve + motifCap | xong | `config/enums.ts`, `types.ts`, `defaults.ts`, `merge.ts` (vùng + vùng import), `schema-meta.ts`, `labels.ts`, `theme/parts.ts` (mới), `theme/motif-cap.ts` (mới), `theme/resolve.ts` | `motifCap()` khớp bảng 1.7.5 đúng 12/12 giá trị. `ResolvedTheme.motif`, `dividerUrl?`, `--motif-cap` trong `themeCssVars`. Diff 'Xem thay đổi': mảng `placements` bị tách theo phần tử -> thêm nhãn `theme.motif.placements[0]/[1]` trong vùng (không sửa `diff.ts`). |
| 8 | Guest motif module (lazy) | xong | `src/shared/motif/plan.ts` (mới), `src/guest/motif/motif.ts` + `motif.css` (mới), `bootstrap.ts` vùng v4a-1, plugin phân loại `motif`/`motifCss` | rIC timeout 1.5 s -> `import('./motif/motif')`. Lệch nhỏ (lý do ở mục Lệch spec): `.mtf--title` dùng `z-index:-1` thay vì cho các con của `.sec-head` `z-index:1`; bỏ `--motif-cap` mặc định ở `:root` của motif.css; góc `dong-son` xoay thay vì lật; `--band-period` 144/192px. |
| 9 | Admin: gallery 12 theme, MOOD, motif panel lazy, ops nhóm motif, labels | xong | `src/admin/draft/ops.ts` (nhóm `motif`), `src/admin/editor/routes/theme.tsx`, `routes/theme.css` (mới), `src/admin/editor/motif-panel.tsx` + `.css` (mới, chunk lười) | Dòng "Hoạ tiết nền" + [Đổi] (`import()` panel), MOOD 12 theme, bỏ dòng "n/12" khi đủ 12; thẻ `tex-*` cho 7 texture mới dùng chính tile SVG của guest. Panel: Theo theme / Tự chọn, 8 thẻ radiogroup (★ preset + gợi ý, phím mũi tên), Vị trí tối đa 2 (ô thứ 3 vô hiệu + dòng giải thích; Phủ nền ⟂ Sau tiêu đề tự bỏ + `aria-live`), Độ đậm, Chuyển động, cảnh báo cap < .10. Mỗi thay đổi = `store.update` + toast [Hoàn tác], preview cuộn tới section đầu tiên có hoạ tiết (`planMotif`). |
| 10 | Unit test v4a1-* | xong | `tests/v4a1-schema.test.ts`, `v4a1-theme.test.ts`, `v4a1-assets.test.ts`, `v4a1-fonts.test.ts` (mới); `tests/sections-plugin.test.ts` (+1 describe 4 case, sửa 1 case cũ - xem mục 2); `tests/resolve.test.ts` (+1 describe motif, +1 dòng import) | `npm test`: 27 files / 802 tests passed (trước: 23 / 606). Ngân sách font tính cả body 400 (xem Lệch spec). |
| 11 | Build + size-limit (trước/sau) | xong | | `npm run build` xanh; số đo ở mục dưới. |
| 12 | E2E `tests/e2e/v4a-1.spec.ts` + full e2e 1 lần | xong | `tests/e2e/v4a-1.spec.ts` (9 test) | Full e2e (cổng 4273/5275) 1 lần: **45 passed, 1 failed** (A07 `admin-v22`: chữ "boho" viết thường trong `MOOD` của tôi ở aria-label thẻ Đất Nung). Sửa thành "phong cách Boho, mộc mạc", build lại, chạy lại riêng A07: passed. Spec v4a-1: 9/9 passed. |

## Số đo kích thước (gzip, size-limit)
| Mục | Giới hạn | Trước (sau Bước 0) | Sau v4a-1 |
|---|---|---|---|
| Guest JS ban đầu | 60 KB | 31.31 KB | 32.97 KB (+1.66; dự kiến < 1 KB: thêm add-on capability ~60 id, enum motif, vùng bootstrap, rolldown tách chunk dùng chung) |
| Guest CSS ban đầu | 25 KB | 11.39 KB | 12.96 KB (+1.57; 4 file CSS lõi mới) |
| motif JS (`motif-*.js`) | 1.5 KB | - | 737 B (+ chunk dùng chung `plan-*.js` 528 B, tính ở "lazy"; tổng 1.27 KB) |
| motif CSS | 3 KB | - | 1.78 KB |
| Admin JS ban đầu | 80 KB | 73.46 KB | 75.39 KB (+1.93; mục tiêu ≤ +1 KB **không đạt**: capability add-on, `motifCap`/`parts` trong chunk `resolve`, preset motif, nhãn, sanitize; panel đã lười) |
| admin lazy: theme | 15 KB | 3.66 KB | 4.32 KB |
| admin lazy: motif-panel | 15 KB | - | 2.39 KB |
| Font cover thực đo (e2e T6, trước khi chạm) | 180 KB | tram-vang (v1) 162.4 KB | tram-vang 166 280 B / 8 file; mau-nuoc 138 876 B / 8 file |

## Lệch spec (lý do)
1. **Ngân sách font (10.3)**: tập face cover thêm **body 400** (spec chỉ ghi body 600). Đo thật trên build: cover tải body 400 (8 file, khớp "162.4 KB / 8 file" của v1). Cận trên mới (latin+vietnamese mọi face): tram-vang 177.8 KB (sát ngưỡng, theme cũ), mau-nuoc 151.6, dat-nung 150.8, hoai-co 149.1, luc-bao 147.0, pastel-han 140.3, dem-nhung 139.7, muc-giay 138.7, bien-dao 135.0, son-do 134.8, hong-phan 126.6, sen-cham 96.7 -> cả 12 ≤ 180 000 B, không cần bỏ face (Còn mở #14 không phát sinh). 2 theme nặng nhất cho T6 = tram-vang + mau-nuoc (không phải hoai-co).
2. **T6 trên preview**: `index.html` build cho Trầm Vàng vẫn preload Great Vibes (54 KB) khi chạy `bootPreview` theme khác -> T6 chỉ cộng file thuộc 3 font của theme đó (bản build thật của theme đó không có preload thừa).
3. **Polaroid `tilt-r`**: không dùng bộ đếm trong `framed()` mà gắn trong vùng `[v4a-1]` của `bootstrap.ts` ngay sau render, theo thứ tự DOM (cùng kết quả; tránh phải sửa dòng import ngoài vùng để reset bộ đếm).
4. **`.mtf--title`**: `z-index: -1` (trong ngữ cảnh xếp lớp của `.sec-in` z 1) thay vì cho các con của `.sec-head` `z-index: 1`: medallion 200–300px tràn xuống nội dung dưới tiêu đề; với cách cũ nó sẽ vẽ ĐÈ lên chữ không định vị phía dưới. Nay luôn nằm dưới mọi nội dung, trên nền + texture.
5. **motif.css**: bỏ `:root { --motif-cap: .3 }` của bản designer (stylesheet lười nạp sau `<style id="wp-theme">` sẽ đè cap thật của theme) -> dùng `var(--motif-cap, 0)`. `--band-period` = 144px (24px cao) / 192px desktop cho khớp chu kỳ tile 240×40 (180px mặc định làm dải trôi bị giật mỗi vòng).
6. **Góc `dong-son`**: góc trên-phải / dưới-trái **xoay** ±90° thay vì lật gương (lật làm chim Lạc bay ngược chiều - design 1.7.1 "dùng nguyên vẹn").
7. **Chuyển sang Tự chọn khi chạm thẻ** ở chế độ "Theo theme": chép vị trí/độ đậm đang resolve + bộ vừa chọn (giao diện bắt đầu từ cái đang thấy).
8. **`.couple-amp`**: nền đặc hình chữ nhật sau "&" lộ thành mảng phẳng khi texture đã thấy được -> đổi thành `radial-gradient` mép mềm trong vùng `[v4a-1]` của `sections.css` (designer xem lại).
9. **Diff "Xem thay đổi"**: `diff.ts` tách mảng `placements` theo phần tử -> thêm nhãn `theme.motif.placements[0]/[1]` trong vùng của `schema-meta.ts`/`labels.ts` thay vì sửa `diff.ts` (không thuộc v4a-1).
10. **Không `git merge` branch phiên** trước full e2e: branch phiên chỉ có thêm commit tài liệu 424cdcf (`status.md`), merge cần tạo commit (orchestrator làm).

## Hunk ngoài vùng đã dùng (Còn mở #18, được phép)
- `src/guest/styles/base.css`: xoá khối texture `body::before` / `body::after` (paper, velvet, vignette).
- `src/guest/bootstrap.ts`: 1 dòng `resolved.dividerUrl = await bridge.dividerUrlFor(...)` ở nhánh preview.
- Ngoài ra thêm cặp vùng `// [v4a-1] imports >>>/<<<` ở đầu `merge.ts`, `labels.ts`, `config/types.ts`, `caps/types.ts` (cần import kiểu/enum motif; 2a tách nhánh sau v4a-1 nên không đụng).

## Việc cần designer review (bước 4)
- 12 theme + chuỗi dấu chồng (design 2.1), đặc biệt Prata (sen-cham) nghiêng giả ở tên khách trên cover; Moon Dance/Birthstone cỡ nhỏ.
- Texture đã thấy được trên build: độ đậm 7 texture mới + velvet (vignette 2 mép trong `.sec::before` ở opacity .06 gần như không thấy) + texture trên cover (#12).
- `watercolor-wash` (mau-nuoc): vệt góc nhìn khá "khối" ở 412px.
- Nền "viên thuốc" của divider (`.div-orn`, R07) và nền mép mềm của "&" nay lộ trên giấy có texture.
- 4 theme có hoạ tiết mặc định (son-do, sen-cham, dem-nhung, bien-dao): độ đậm, góc 86px ở 360px, dải viền trôi.
- Panel "Hoạ tiết nền" + thẻ texture mới trong gallery admin.

## Kiểm tra (kết quả thật)
- `npm run typecheck`: sạch.
- `npm test`: 27 files / 802 tests passed.
- `npm run build`: xanh, size-limit đạt.
- `tests/e2e/v4a-1.spec.ts`: 9 passed (T1–T7 + texture trên build + mở cover Pastel Hàn).
- Full `npm run test:e2e` (1 lần, cổng 4273/5275): 45 passed / 1 failed (A07, đã sửa) -> chạy lại riêng A07: passed.

## Tạm dừng theo yêu cầu orchestrator (2026-10-09)
- **Trạng thái**: TẤT CẢ 12 phần việc ở bảng tiến độ đã XONG trước khi nhận lệnh dừng; không có file nào đang sửa dở, không có phần nào chưa làm.
- Không có dev server / e2e nào của FE-1 đang chạy (cổng 4273/5275/5281 trống; tiến trình vite/playwright còn thấy trên máy thuộc worktree `wp-v4a-2b` của FE-2, không đụng).
- `npm run typecheck` lúc dừng: **sạch** (exit 0). Kết quả trước đó: `npm test` 27 files / 802 passed; `npm run build` xanh; full e2e 45 passed / 1 failed (A07 - đã sửa, chạy lại riêng A07 passed).
- Chưa commit (orchestrator commit trên `wt/v4a-1`).
- **Bước tiếp theo cho agent sau / orchestrator**:
  1. Commit worktree `wt/v4a-1` (gồm file mới chưa track: `src/guest/theme-assets/**`, `src/guest/motif/`, `src/shared/motif/`, `src/shared/theme/{parts,motif-cap}.ts`, `src/guest/styles/{dividers,frames,textures,ornaments}.css`, `src/admin/editor/motif-panel.{tsx,css}`, `src/admin/editor/routes/theme.css`, `scripts/svgo.theme-assets.mjs`, `tests/v4a1-*.test.ts`, `tests/e2e/v4a-1.spec.ts`, report này).
  2. (Tuỳ chọn, nếu cần chắc chắn) chạy lại toàn bộ `npm run test:e2e` 1 lần sau khi sửa A07 - lần trước chỉ chạy lại riêng A07.
  3. Merge branch phiên (chỉ thêm commit docs 424cdcf) vào `wt/v4a-1` rồi giao ui-ux-designer bước 4 theo mục "Việc cần designer review" ở trên.
