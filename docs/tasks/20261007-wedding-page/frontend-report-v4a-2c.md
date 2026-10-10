# Frontend report - v4a-2c (16 hạt nền + 4 burst)

> Task `20261007-wedding-page` · frontend-developer (1 FE) · 2026-10-10 · branch `feat/20261007-wedding-page-v4a-2c` (từ c5a3a48), cổng e2e mặc định 4173/5175.
> Spec: `solution-v4a-2bc.md` mục 2, 4, 5; `design-v4a-2bc.md` §4, §5 (design thắng solution khi lệch); asset `assets/v4a-2/particles/`, `assets/v4a-2/burst/`.

## Tiến độ

| Phần | Trạng thái | File | Ghi chú |
|---|---|---|---|
| Đọc spec + code | xong | - | solution 2.x/4/5, design §3.0/§3.1/§4/§5, `particles.json`, `bursts.json`, preview `particles.html` (helper `drawLayers`), engine `field.ts`/`kind.ts`, registry burst, `open-kit/sparks.ts` + 9 chỗ gọi hạt tạm của 2b |
| Engine (`kind.ts`, `sprite-kit.ts`, `field.ts`) | xong, đã test | `particles/kind.ts`, `particles/sprite-kit.ts` (mới), `particles/field.ts`, `effects/service.ts` | `ParticleKind` thêm `variants`/`back`/`sway`/`vx`/`alpha`/`depth`/`twinkle`/`naturalDark`/`tones`(`Dark`); `draw` thành tuỳ chọn (5 loại v1 giữ `draw`). `spawnBg`/`moveBg` tách thành hàm thuần (thứ tự `Math.random` của phần v1 giữ nguyên). `BurstParticle` thêm `flip`/`flipRate`/`twinkle`/`scaleIn`, mặt sau = sprite `<key>~b`. Field: `kindSprites`/`layerSprite`/`bgKey`/`kindIndex`/`mix`; `paletteOpts()` (mode tối + token). `service.ts`: dùng `paletteOpts`, hook debug `__wpBurst(id, opts)` |
| 16 module hạt | xong, đã test + đo size | `particles/types/<id>.ts` × 16, `particles/types.ts` | sinh bằng script tạm (scratchpad) từ `particles.json` - chỉ dữ liệu; màu theo token: watercolor `accent/accent-2`, bubble `accent-2/accent`, sparkle `accent` (tối `primary`) |
| 4 burst | xong, đã test | `burst/confetti.ts`, `gold.ts`, `red-paper.ts`, `heart-burst.ts`, `burst/registry.ts`, `burst/petals.ts` | `BurstModule.pieces?()` mới: hạt trên cover lấy mảnh thật nhưng giữ vật lý riêng của kiểu mở. Đợt trễ bằng `setTimeout` (confetti 3 nhịp 40 ms × 2 góc; red-paper 0/150/300 ms). `red-paper` burst import dữ liệu từ module hạt `red-paper` (1 chunk dùng chung). `petals` chọn biến thể theo trọng số (`bgKey`) |
| Thay hạt/burst tạm của v4a-2b | xong | `cover/open-kit/sparks.ts`, `styles/{curtain,wax-seal,scroll,origami,gift-box,double-door,moon-gate}.ts`, `skins/{kit,velvet,song-hy}.ts` | rèm / dấu sáp / cuộn thư (theme khác son-do) / E12 classic + velvet: mảnh burst `gold` (chấm + sao, nhấp nháy); song-hy: `red-paper` thật (lật thấy mặt sau) + 8 sao `sparkle`; cửa đôi + light-gather Nhẹ: `sparkle` thật (nhấp nháy); moon-gate: `petal-lotus` thật; gift-box: mảnh `confetti` thật; origami giữ mảnh vuông accent/accent-2 đúng design §2.3 + thêm lật. Số hạt, mốc, vật lý không đổi |
| Capability | xong | `src/shared/caps/v4a-2c.ts` | 16 hạt + `confetti`/`gold`/`red-paper` |
| Test cũ vỡ do bật capability | xong | `tests/admin-ux.test.ts` (capLabel `red-paper` hết hậu tố; hậu tố kiểm bằng `revealStyle: cinematic` - sẽ vỡ lại khi 2a bật), `tests/burst-registry.test.ts` (field giả thêm `bgKey`) | |
| Build + size (lần 1) | xanh | - | JS ban đầu 33.85 KB; hạt mới 0.22–1.23 KB; burst 0.74–1.07 KB; field 5.29 KB; open-kit 2.51 KB; admin JS 73.89 KB |
| Admin picker | xong, đã e2e | `src/admin/editor/fx/particles-block.tsx` | `chipOrder()`: gợi ý theme đứng đầu + `petal-rose, heart, snow, firefly, leaf-green, bubble`, 8 chip đầu, còn lại trong `Details` "Xem thêm (13)" (tự mở khi đang chọn loại trong đó); `data-testid` `pchip-<id>`, `pchips`, `pchips-more`; giữ tối đa 2 (bỏ loại cũ nhất), `aria-pressed`, chọn = phát lại preview (`set(..., 'particles')` như cũ). Nhãn dùng `PARTICLE_LABEL` có sẵn (không cần sửa `labels.ts`) |
| Unit test | xong, xanh | `tests/particle-kinds.test.ts` (71), `tests/bursts.test.ts` (20) | 21 loại: id/file, motion, hệ số mật độ, cỡ, vẽ mọi biến thể + mặt sau bằng context giả; **5 loại v1: `spawnBg`/`moveBg` so từng số với công thức v1 chép nguyên văn (cùng chuỗi Math.random, 300 frame, có gió + vùng loại trừ + vùng dịu)**; biến thể theo trọng số, sway/vx/alpha/depth/twinkle, vùng form = 0; màu theme/tối/token/multi/hex; burst: số hạt theo cấp, gốc (2 góc dưới / tâm / mép trên / rect nút), đợt trễ, đời ≤ thời lượng, màu theo mode, mặt sau, toBg, cộng dồn ≤ 120; thứ tự chip admin. `npm test`: 31 files / 966 passed |
| E2E `tests/e2e/v4a-2c.spec.ts` (25 test) | xong, chạy chọn lọc xanh 25/25 | `tests/e2e/v4a-2c.spec.ts` | 16 loại × Vừa trên theme gợi ý (hạt trong 3s, a ≤ 1, ≤ 40, canvas có điểm ảnh, 0 lỗi console); snow/bubble mức Nhiều: 0 hạt trong form RSVP/lời chúc; Tắt + reduced: không canvas; confetti/gold/red-paper: đỉnh ±10% `BURST_COUNTS`, tự dọn ≤ thời lượng + đợt trễ cuối + 300ms, Nhẹ = 0; chunk confetti tải SAU khi `.cover` gỡ + không có trong HTML ban đầu; `heart-burst` qua `__wpBurst` = 8/12; admin 8 chip + "Xem thêm (13)" = 21, tối đa 2, "Sau khi mở" 5 + Theo theme. Sửa trong lúc chạy: thứ tự option "Sau khi mở" theo enum (Cánh hoa trước Hoa giấy); MutationObserver gắn vào `document` |
| E2E 2b bị ảnh hưởng (chọn lọc) | xanh 19/19 | `tests/e2e/v4a-2b.spec.ts` `-g "E12\|Nhẹ ngắn hơn"` | 13 kiểu Nhẹ/Nhiều (số hạt trên cover) + 6 mẫu E12 với mảnh thật |
| Kiểm nhanh sprite (1 ảnh, script tạm) | xong | - | 16 loại × mọi biến thể + mặt sau vẽ bằng engine thật trên nền sáng/tối: đúng hình designer, không trống/lệch tâm |
| Fixture tổ hợp nặng 2c | xong | `tests/fixtures/config-heavy-2c.json` | tram-vang + high + `petal-sakura` + `petal-dried` (2 loại nặng nhất đo được, solution dự kiến watercolor + plumeria) + confetti: JS ban đầu 35.75 KB, CSS 13.14 KB |
| Full e2e 1 lần | **xanh 139/139 (12.1 phút)** | - | `npm run test:e2e`, cổng 4173/5175 |

## Kiểm tra (kết quả thật)
- `npm run typecheck`: sạch.
- `npm test`: **31 files / 966 tests passed** (trước 2c: 875; +71 `particle-kinds`, +20 `bursts`).
- `npm run build`: xanh (typecheck + vite build + size-limit, 0 mục vượt trần). Build lại bản thường sau khi đo fixture nặng / stash, trước e2e.
- `npm run test:e2e` (toàn bộ, 1 lần cuối): **139 passed (12.1m)** - gồm 25 test mới `v4a-2c.spec.ts`; 114 test cũ (kể cả 72 test 2b với hạt thật) không đổi.
- Không commit. Không còn tiến trình nào của tôi chạy (preview :4173 dựng tay để chụp 1 ảnh kiểm sprite đã dừng theo PID).

## Kích thước (gzip, size-limit, config mẫu `tram-vang` + `envelope`)

| Mục | Trước 2c (đo bằng `git stash`, cùng máy) | Sau 2c | Trần |
|---|---|---|---|
| JS ban đầu | 33.75 KB | 33.85 KB (+0.10: hook debug `__wpBurst` + `paletteOpts`) | 60 KB |
| CSS ban đầu | 13.14 KB | 13.14 KB | 25 KB |
| Admin JS ban đầu | 73.85 KB | 73.90 KB | 80 KB |
| admin lazy: route Hiệu ứng | 5.63 KB | 5.81 KB (picker chip + Xem thêm) | 15 KB |
| lazy: field (engine + `sprite-kit`) | 3.92 KB | 5.29 KB | 15 KB |
| open-kit | 2.38 KB | 2.51 KB | 3 KB |
| **Tổ hợp nặng 2c** `tests/fixtures/config-heavy-2c.json` (tram-vang + high + petal-sakura + petal-dried + confetti): JS / CSS ban đầu | | 35.75 KB / 13.14 KB | 60 / 25 KB |

**16 loại hạt mới** (trần 1.5 KB/loại): petal-sakura 1.23 · petal-dried 1.07 · petal-lotus 0.93 · leaf-maple 0.91 · petal-watercolor 0.90 · plumeria 0.88 · pampas 0.68 · leaf-green 0.67 · leaf-eucalyptus 0.64 · ink-dot 0.51 · sparkle 0.36 · red-paper 0.34 · paper-heart 0.32 · bubble 0.28 · dust-mote 0.23 · snow 0.22 KB. (5 loại v1 không đổi: petal-rose 0.40 · firefly 0.31 · petal-peach 0.28 · gold-dust 0.23 · heart 0.22.)

**Burst** (trần 3 KB/burst; tiêu chí task ≤ 15 KB/chunk): confetti 1.07 · red-paper 0.78 (+ dùng chung chunk hạt `red-paper` 0.34) · heart-burst 0.77 · gold 0.74 · petals 0.36 KB. Không chunk burst nào trong JS ban đầu (`budget.json` + e2e kiểm HTML ban đầu không có `confetti-*.js`).

`.size-limit.cjs`: không cần sửa - plugin (Bước 0) đã xếp chunk `particles/types/*` vào nhóm "hạt" 1.5 KB và `effects/burst/*` vào nhóm "burst" 3 KB; `sprite-kit.ts` chỉ được `field.ts` import nên nằm trong chunk field (module loại/burst chỉ chứa dữ liệu, vẽ qua `field.kindSprites`/`layerSprite`, trộn màu qua `field.mix`) - không sinh chunk dùng chung mới.

## Lệch spec (kèm lý do)

1. **Trường `ParticleKind` theo design §4.1, không theo bảng API của solution**: `alpha: [min,max]` (solution `alpha?: number`), `vx: [min,max]` (solution `drift`), `twinkle` là biên độ số (bụi nắng .25; solution `boolean`), thêm `variants`/`back`/`naturalDark` (design) và `tones`/`tonesDark` (mới - màu "theme" theo token cho màu nước `accent/accent-2`, bong bóng `accent-2/accent`, lấp lánh `accent`, theme tối `primary`). `draw()` thành tuỳ chọn: 16 loại mới chỉ có dữ liệu, engine vẽ bằng `drawLayers` (design đề xuất).
2. **`BurstModule.pieces?()` (mới)**: hạt trên cover của 2b (`coverSparks`) lấy mảnh thật của burst (`confetti`/`gold`/`red-paper`) nhưng giữ nguyên vật lý/mốc/số hạt đã được designer duyệt ở 2b, thay vì phát nguyên burst (vật lý "sau khi mở" khác hẳn). `petals` không có `pieces` -> phát nguyên burst như cũ (flower-gate).
3. **origami giữ mảnh vuông accent/accent-2** (design §2.3) + thêm lật, không chuyển sang 4 hình của burst `confetti` như report 2b dự kiến. gift-box dùng mảnh `confetti` thật.
4. **Màu burst theo design §5, không theo solution 2.3**: `gold` cố định theo mode (`#C9A24A/#B8862F` sáng, `#F3D48C/#D9B77E` tối) thay vì accent; `red-paper` không có 1/5 mảnh vàng `#D4A23C`.
5. **Hook `__wpBurst` đặt ở `service.ts`** (solution ghi `burst/registry.ts`): registry là chunk lười chỉ tải khi "Sau khi mở" ≠ none, nên đặt ở registry thì hook không có với config `none` (trường hợp lời chúc). Chỉ có khi `?debug=fx`.
6. **Burst `confetti` có `origin` (không `from`)** dùng tham số RSVP (mép trên, −140…−40°); `gold`/`red-paper` có `origin` thì phát 1 đợt tại điểm đó. `play()` trả số hạt gồm cả đợt trễ đã lên lịch.
7. **Nhấp nháy `gold`**: `alpha × (0.6 + 0.4·sin(2·ph))` với pha lật 3–6 rad/s -> ~1–1.9 Hz (design ghi `sin(ph·9)` ~1.4 Hz, công thức pha khác engine).
8. **Hạt loại `twinkle` (sparkle, gold-dust) trên cover giờ nhấp nháy** (light-gather Nhẹ "12 hạt sparkle nhấp nháy" §2.8; double-door; song-hy 8 sao). Trước 2c không nhấp nháy.
9. **Mặt sau khi lật**: sprite `<khoá>~b` vẽ khi `cos(pha) < 0` (scaleX âm nên mặt sau bị lật gương - các hình mặt sau đều đối xứng/đơn sắc nên không thấy khác).
10. **`tests/admin-ux.test.ts`**: hậu tố "(sẽ có ở bản sau)" giờ kiểm bằng `revealStyle: cinematic` vì 21 loại hạt đã đủ - **sẽ vỡ lại khi 2a bật `cinematic`** (2a sửa đúng dòng này).
11. **Fixture tổ hợp nặng 2c** dùng `petal-sakura` + `petal-dried` (2 loại nặng nhất đo thật) thay `petal-watercolor` + `plumeria` (solution dự kiến).
12. **Script sinh 16 module từ `particles.json` không nằm trong repo** (không được giao sửa `scripts/`; đặt ở scratchpad). Module có ghi nguồn; designer sửa `particles.json` thì FE sinh lại (script ~60 dòng, dễ viết lại) hoặc sửa tay dữ liệu.
13. Nhãn: dùng `PARTICLE_LABEL`/`BURST_LABEL` đã có trong `labels.ts` (đủ 21 + 5), không cần sửa; chuỗi "Xem thêm (n)" nằm trong component như các khối admin khác.

## Cần designer review (đúng các mục cần mắt người)

Cách tái hiện nhanh: preview stash (`bootPreview` trong `tests/e2e/fx-helpers.ts`) với `effects.particles.types: [<id>]`, `fx: { target: 'particles' }` (hạt nền) hoặc `effects.burst.onOpen: <id>`, `fx: { target: 'burst' }`; `heart-burst`: mở `/?preview=1&debug=fx` rồi gọi `__wpBurst('heart-burst', { from: {left, top, right, bottom} })`. Viewport 360×740, mức Vừa và Nhiều.

1. **16 loại hạt trên theme gợi ý** (Vừa + Nhiều, có chữ tên cặp đôi/khách): mật độ, độ lấn át chữ, hướng rơi/lắc. Cặp loại-theme dùng trong e2e: sakura·pastel-han, lotus·sen-cham, dried + dust-mote·hoai-co, watercolor + leaf-green·mau-nuoc (màu `multi`), plumeria + bubble·bien-dao, paper-heart·hong-phan, eucalyptus + sparkle·luc-bao, maple + pampas·dat-nung, snow·tram-vang, sparkle·dem-nhung, ink-dot·muc-giay, red-paper·son-do.
2. **Loại sáng/trắng trên nền sáng**: `snow` (vành `#9FB3C8`), `plumeria` (viền nâu .35), `bubble` (viền accent-2 .75), `dust-mote` (vành ấm) - có đủ thấy không; `ink-dot` alpha .12–.22 có quá mờ trên `muc-giay` không.
3. **`paper-heart`**: nét sáng góc trên trái (dữ liệu `particles.json`) thò ra ngoài viền tim một chút ở cỡ lớn - xem có cần sửa path không.
4. **4 burst**: `confetti` (theme sáng + `dem-nhung` tối: bảng màu), `gold` (sáng `#C9A24A/#B8862F` vs tối), `red-paper` trên `son-do` (mảnh chuyển thành hạt nền `red-paper` sau khi rơi - `toBg`), `heart-burst` (cỡ 10–20 px, phóng vào .4 -> 1).
5. **Hạt trên cover của v4a-2b nay dùng module thật** (thay hạt tạm): rèm / dấu sáp / cuộn thư (theme khác son-do) / E12 classic + velvet = chấm + sao vàng nhấp nháy; cuộn thư son-do + E12 song-hy = xác pháo thật lật thấy mặt sau hồng; song-hy 8 sao = `sparkle`; cửa đôi + light-gather Nhẹ = `sparkle`; cửa trăng = cánh sen thật; hộp quà = confetti 4 hình; origami = giữ mảnh vuông + lật. Kèm 2 ghi chú không chặn từ đợt trước: cánh `lace` mức Vừa tụm hẹp, vệt bắn phụ `ink-spread` mức Nhiều hơi to.
6. **Admin "Hạt nền"**: 8 chip đầu (gợi ý theme đứng đầu) + "Xem thêm (13)", chip đã chọn ở nhóm ẩn thì nhóm tự mở.

## Cần kiểm tay máy thật
- ≤ 2 ms/frame với 40 hạt ở Nhiều trên Android tầm thấp (DevTools Performance), nhất là loại nhiều lớp/quầng (`snow` 1.5×, `petal-sakura`, `pampas` cỡ 26–40 px) và burst 120 mảnh + hạt nền cùng lúc.
- Loại trắng/sáng (`snow`, `plumeria`, `bubble`, `dust-mote`) thấy rõ trên theme sáng ở màn hình thật (độ sáng cao ngoài trời).
- Safari iOS 14+: `Path2D` + `createRadialGradient` trong canvas phụ (sprite vẽ 1 lần), lật mặt sau (`red-paper`, `paper-heart`, confetti).
