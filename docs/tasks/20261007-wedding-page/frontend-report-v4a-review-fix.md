# Frontend report - vòng sửa 1/3 sau designer review v4a-1 + v4a-2b

> frontend-developer · 2026-10-10 · branch `feat/20261007-wedding-page-v4a-review` · nguồn: `design-review-v4a-1-2b.md`, `decisions.md` mục "Sau designer review v4a-1 + v4a-2b".
> Phạm vi: T01, T03, T04, T05, T06, O01, O02, O03, O05, O06, O07, O08, O09, O10, O11. Không làm: T02, O04 (hoãn, chờ asset watercolor-wash).

## Tiến độ

| ID | Trạng thái | Đã sửa gì | File |
|---|---|---|---|
| T05 | xong | `.sec { overflow-x: clip; }` (trục dọc vẫn visible: divider vắt ranh giới, parallax pattern; clip không tạo vùng cuộn nên sticky `.gb-form` không đổi). E2E mới "T05" (360px, isMobile): 12 theme cuộn hết trang, `max(scrollWidth, innerWidth) === 360` + Biển Đảo/card-3d `.cv-inner` giữ nguyên `offsetWidth/offsetLeft` 60ms sau khi chạm. Đã xác nhận test ĐỎ khi bỏ fix (bien-dao 504px, `.cv-inner` 328->420, x16->42) và XANH khi có fix. Lưu ý: trên mobile `innerWidth` cũng nới thành 504 nên phải so với bề rộng viewport đặt. | `src/guest/styles/sections.css`, `tests/e2e/v4a-1.spec.ts` |
| T01 | xong | (1) `[data-texture]:not([data-texture="none"]) .div-orn { background: none }` - theme `texture: none` giữ nền đặc. (2) `.divider--dots .div-orn` 56px (desktop 72px); svg dots đặt `preserveAspectRatio="xMidYMid slice"` để 3 chấm không bị thu nhỏ theo khung hẹp (lệch nhỏ so với đề xuất: chỉ đổi width thì chấm co còn 35%). (3) `.divider + .sec > .mtf--band { top: 22px }` (desktop 28px). | `src/guest/styles/dividers.css`, `src/guest/sections/common.ts`, `src/guest/motif/motif.css` |
| T03 | xong | velvet `.sec::before`: `opacity: 1`; gradient `rgba(0,0,0,.28), transparent 14%, transparent 86%, rgba(0,0,0,.28)`; noise data-URI dòng alpha `0 0 0 .06 0` (đúng đề xuất). | `src/guest/styles/textures.css` |
| T04 | xong | `[data-script="pinyon-script"] :is(.cv-names, .hero-names) .nm-amp { font-family: var(--ff-heading); font-style: italic; font-size: .8em }` (cover + hero); `.couple-amp` dùng `font-size: calc(56px * .8)` thay `.8em` (`.couple-amp` đặt cỡ tuyệt đối 56px, `.8em` sẽ thành ~13px). Áp hoai-co (Old Standard TT italic 400 có sẵn) + luc-bao (Cormorant Garamond). `data-script` gắn ở landing trước khi mount cover nên cover nhận rule. | `src/guest/styles/cover.css`, `src/guest/styles/sections.css` |
| T06 | xong | (a) Nhãn "Theo theme · Son Đỏ: Trống đồng — Sau tiêu đề + Dải viền" (bỏ tên phụ trong ngoặc của theme, `motifSummary` dùng " — "). (b) Dòng nhắc khi đủ 2 vị trí: nếu còn vị trí loại trừ được bật (Phủ nền ⟂ Sau tiêu đề) -> `Đã chọn đủ 2 vị trí. Chọn "Phủ nền" sẽ thay cho "Sau tiêu đề".` (tổng quát cả chiều ngược lại); không có cặp -> giữ câu cũ. E2E T7 thêm 2 assert. Chunk lười `motif-panel` (không chạm admin JS ban đầu). | `src/admin/editor/motif-panel.tsx`, `tests/e2e/v4a-1.spec.ts` |
| O01 | xong | (1) `geometry.ts`: `COVER_SOFT_ALPHA = .75`, `alphaTarget(..., softA = .3)`; `field.ts`: burst sinh ra khi canvas đang "trên cover" (`setOverCover(true)` - chỉ E12/kiểu mở gọi) mang `softA .75`; hạt nền, burst sau khi mở, burst chuyển thành hạt nền vẫn .3. (2) `envelope.ts` `sparkOrigin()`: gốc = `min(tâm seal, mép trên .env-addr − 12px)` khi seal chồng ngang thẻ tên. (3) kraft: 2 quạt LÊN-ra-ngoài (canvas `[-80,-20]`, `[-160,-100]` = 20–80° từ phương ngang), `speed 160–300`, `minVx 60` (option mới `SparkReq.minVx`, hàm `sparkVelocity`), `gravity 260`, `drag 1.1` -> bay vòng cung sang 2 bên rồi rơi. (4) lace: `speed 140–220`, `gravity 100`, `drag 1.2` (60–160/drag 1.8 chỉ bay ~28px khi phát thẳng lên). Unit (envelope-e12.test.ts +4): sàn .75/.3, gốc phát, quạt kraft |vx| ≥ 40 đúng dấu + đi lên, lace ≥ 40px trong 0.8s (mô phỏng cùng công thức field). | `src/guest/effects/particles/geometry.ts`, `field.ts`, `src/guest/cover/open-kit/sparks.ts`, `src/guest/cover/styles/envelope.ts`, `src/guest/cover/skins/kraft.ts`, `lace.ts`, `tests/envelope-e12.test.ts` |
| O02 | xong | (a) Bỏ biến `--op-ink-rim` (khai báo trên `.cover` nhưng vành gắn ở `body`); `.ik-rim { background: var(--c-accent) }`, `[data-theme="muc-giay"] .ik-rim { background: var(--c-text) }`, dark giữ `--c-primary`. (b) Vành phụ (Nhiều) thành phần tử riêng `.ik-rim2` (trước dùng chung class `ik-rim` nên còn nhận cả animation vành chính trong 150ms trễ): mask `blob-core` đặc, `--c-accent`, keyframes `scale(0 → .12)` opacity .35 rồi mờ. | `src/guest/cover/styles/ink-spread.css`, `ink-spread.ts` |
| O03 | xong (cần designer xem) | Desktop ≥ 1024px: `.dd-c` `mask-size: auto 100%` + `mask-position: 100% 50%` (no-repeat sẵn): tấm chạm hiện trọn theo chiều cao màn, đặt sát khe giữa (cánh phải lật gương nên cùng phía khe); phần cánh phía ngoài trơn màu `--op-door` + khung inset có sẵn. Mobile không đổi. Không tự chụp ảnh lại - designer xác nhận bố cục 1440×900. | `src/guest/cover/styles/double-door.css` |
| O05 | xong (cần designer xem) | gift-box `.gb-card .op-greet` -> `italic 500 calc(18px*fs-k)/1.3 heading`; polaroid `.pl-cap` -> `italic 500 calc(16px*fs-k)/1.3 heading`. Hộp đủ rộng giữ script nhưng ≥ 28px: wax-seal `.ws-greet` `max(28px, 28px*fs-k)`; card-3d mặt sau `max(28px, clamp(28px, 8vw, 32px)*fs-k)` (lệch đề xuất: card-3d mặt sau rộng ~266px nên giữ script 28px thay vì heading 18px - designer xem lại; muốn heading thì 1 dòng CSS). 2 rule script chỉ áp khi KHÔNG phải script "cần cẩn trọng" (imperial/moon-dance/birthstone vẫn heading italic như cũ). | `src/guest/cover/styles/gift-box.css`, `polaroid.css`, `wax-seal.css`, `card-3d.css` |
| O06 | xong | Nguyên nhân thật (không phải font/backface): `fitEnvGuest` tính `used` từ MỌI con của hộp `.op-fit`, gồm lớp trang trí `position: absolute; inset: 0` (khung mask `.c3-frame`, `.c3-sheen`, `.pl-print`) phủ cả mặt thẻ -> `used` > `room` ở mọi bậc -> luôn rơi xuống 15px. Sửa: bỏ qua con absolute/fixed; thêm điều kiện `offsetWidth > 0`. Font: `fit()` vốn đã chạy sau `waitNameFont` + `loadingdone`. E2E mới: card-3d (bien-dao) và polaroid (pastel-han) `data-fit` ≥ 19px, 1 dòng - đã xác nhận ĐỎ khi bỏ fix (`15/1`), XANH khi có fix. | `src/guest/cover/cover.ts`, `tests/e2e/v4a-2b.spec.ts` |
| O07 | xong | `:root[data-script="imperial-script"] .cover .cv-names { font-size: max(46px, clamp(40px, 11vw, 52px)*fs-k) }` và trên biển `.cv-plaque` `max(44px, clamp(34px, 9.6vw, 44px)*fs-k)` (đặc hiệu `:root` để thắng rule họ object / card-3d / moon-gate trong CSS lười). E2E mới: dem-nhung với Theo theme (light-gather), card-3d, double-door, moon-gate ở 360px: cỡ ≥ 46/44, mỗi tên 1 dòng, hộp `.op-fit`/`.cv-plaque` không tràn. | `src/guest/styles/cover.css`, `tests/e2e/v4a-2b.spec.ts` |
| O08 | xong | `DOOR_DEG = 82` (trước ±105°); giữ `.dd scale(1→1.15)` 600–1600 + cover mờ 1200–1600. Unit test góc. | `src/guest/cover/styles/double-door.ts` |
| O09 | xong | `.cv-guestline` rút cùng nhịp: `opacity 1→0` + `translateY(8px)` 360–520ms (Vừa/Nhiều; thay fade 1250–1450 cũ); Nhẹ 0–140ms (4 cánh lật cùng lúc từ 100ms). Unit test. | `src/guest/cover/styles/origami.ts`, `tests/open-styles.test.ts` |
| O10 | xong | Cụm hoa `fg-cl`/`fg-cr` easing `--ease-inout` (giữ 150–950; Nhẹ 100–700 cũng đổi). Vòm giữ nguyên. Unit test. | `src/guest/cover/styles/flower-gate.ts`, `tests/open-styles.test.ts` |
| O11 | xong | Timeline thêm `fade('cv-inner', 0, 300, 1→0, --ease-out)` ở mọi mức (Nhẹ cũng khoét từ tâm màn = giữa khối chữ). Không dời, không clip. | `src/guest/cover/styles/ink-spread.ts` |

## Kết quả kiểm tra (2026-10-10, máy Windows, Chrome)
- `npm run build`: typecheck sạch, vite build xanh, **size-limit xanh mọi ngân sách**.
  - JS ban đầu **34.55 KB** (trước 34.36; +0.19 do `field.ts`/`geometry.ts`/`cover.ts` trong entry) / 60 · CSS ban đầu **13.46 KB** (trước 13.32) / 25 · **Admin JS ban đầu 75.62 KB** (không đổi; T06 nằm trong chunk lười `motif-panel` 2.5 KB) / 80.
  - openStyle: ink-spread 1.03 KB, double-door 0.73, origami 1.17, flower-gate 0.61, envelope 3.06 / 4 · open-kit 2.44 / 3 · skin kraft 1.29, lace 0.88 / 1.5 · motif CSS 1.81 / 3.
- `npm test`: **875/875** (29 file; thêm 4 test O01 trong `envelope-e12.test.ts`, 5 test O02/O08/O09/O10/O11 trong `open-styles.test.ts`).
- `npm run test:e2e` (toàn bộ, chạy 1 lần cuối): **114/114 pass** (11.3 phút). Test mới: `v4a-1.spec.ts` "T05" (12 theme 360px + card-3d Biển Đảo), T7 thêm 2 assert T06; `v4a-2b.spec.ts` "O06", "O07".
- Trong lúc sửa chỉ chạy e2e chọn lọc: T05 (3 lần, gồm 2 lần xác nhận test bắt được lỗi khi gỡ fix), O06 (1 lần gỡ fix), O06/O07, T7. Không chụp ảnh.

## Lệch so với đề xuất (kèm lý do)
1. **T01 dots**: ngoài `width: 56px/72px` còn đặt `preserveAspectRatio="xMidYMid slice"` cho svg dots - symbol 160×24, chỉ đổi width thì 3 chấm co còn ~35%.
2. **T04 `.couple-amp`**: `font-size: calc(56px * .8)` thay `.8em` (phần tử đặt cỡ tuyệt đối 56px; `.8em` theo cha sẽ ra ~13px).
3. **O01 kraft**: chọn 2 quạt hướng **lên**-ra-ngoài (đề xuất không nói rõ lên/xuống; quạt xuống vẫn đi qua thẻ tên vì thẻ chiếm ~72% bề ngang phong bì). `minVx 60` (≥ 40 yêu cầu). lace đổi cả `speed 140–220 / gravity 100 / drag 1.2` vì `60–160 / drag 1.8` không đạt "bay ≥ 40px" (mô phỏng: ~28px khi phát thẳng lên).
4. **O01 sàn .75**: áp theo trạng thái canvas "trên cover" lúc phát hạt (mọi burst E12 + kiểu mở Nhiều), không theo từng lời gọi.
5. **O05 card-3d mặt sau**: giữ script ≥ 28px (hộp ~266px đủ chỗ) thay vì heading italic 18px. wax-seal giữ script 28px đúng đề xuất.
6. **O03**: làm theo phương án "đơn giản nhất", tấm chạm đặt sát **khe giữa** (`mask-position: 100% 50%`, cánh phải lật gương) thay vì sát bản lề ngoài, để 2 tấm chạm nằm liền nhau giữa màn như một cửa đôi, phần ngoài là mảng trơn.
7. **O09 / O10**: áp cả mức Nhẹ (origami Nhẹ: tên khách rút 0–140ms vì 4 cánh lật cùng lúc từ 100ms; flower-gate Nhẹ cũng `--ease-inout`).
8. **O02b**: vành phụ đổi sang class riêng `.ik-rim2` (trước có cả class `ik-rim` nên trong 150ms trễ còn chạy animation vành chính - một phần nguyên nhân "đường lượn to").

## Việc cần designer xác nhận lại (chỉ các ID này)
- **T01**: 6 ô divider (son-do, bien-dao, dem-nhung, hoai-co, muc-giay, sen-cham) 390×844 - bỏ nền viên thuốc, dải band hạ xuống 22px, dots 56px.
- **T03**: dem-nhung, section Gia đình - vignette 2 mép .28 có vừa không.
- **T04**: "&" heading italic ở hoai-co + luc-bao (cover 360×740, hero, section Cô dâu & Chú rể).
- **O01**: E12 kraft (Nhiều) và lace (Vừa/Nhiều) - hướng bay oải hương lên-ra-ngoài, độ thấy của hạt quanh tên khách (alpha .75).
- **O02 / O11**: ink-spread mau-nuoc Nhiều - màu vành, vệt bắn phụ nhỏ, chữ cover mờ trước khi lỗ đi qua.
- **O03**: double-door 1440×900 luc-bao, trạng thái đóng (bố cục tấm chạm sát khe giữa).
- **O05**: gift-box 1300ms, polaroid 1750ms, wax-seal 950ms (360×740) + **card-3d mặt sau** (lệch #5).
- **O08 / O09 / O10**: double-door 82° (650/850ms), origami 400–800ms, flower-gate 250ms.
- Không cần xem lại: T05, T06, O06, O07 (đã có e2e tự động kiểm).

## Ghi chú
- Không sửa tài liệu nào trong `docs/` ngoài file này; không commit.
- Cảnh báo `[WebServer] Failed to run dependency scan ... react/jsx-dev-runtime (motif-panel.tsx)` của `vite dev` khi chạy e2e có từ trước, không ảnh hưởng kết quả.
