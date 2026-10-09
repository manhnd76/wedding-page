# Design v4a-2b/2c (bổ sung) - 13 kiểu mở, E12, 16 hạt nền, 4 burst

> Bổ sung cho `design.md` (không chép lại): §3.2 (bố cục cover), §3.4/3.4b (kiểu mở), §3.4c (mẫu phong thư), §5.1 (token), §5.3–5.7 (cường độ, hạt, burst), §5.10 (ma trận). Chỗ nào file này nói khác `design.md` thì **file này thắng** cho đợt v4a-2b/2c (ghi rõ "thay").
> Asset: `assets/v4a-2/` (sinh bằng `assets/v4a-2/_generator/*.mjs`, seed cố định, đường dẫn tương đối: `node assets/v4a-2/_generator/open.mjs`...). Ảnh xem thử: `screenshots/v4a-2/` (gitignore, chụp lại bằng `node _generator/shoot.mjs <trang> <ảnh> [w h query]`).
> Ngày: 2026-10-09 · ui-ux-designer B · Tiến độ: `design-report-v4a-2bc.md`.

## 0. Tóm tắt quyết định
1. **Không cần ảnh raster nào** cho cả 2 đợt. `flower-gate` vẽ vector 4 lớp mask (tổng 24 KB thô / 6.3 KB gz cho 2 cụm, thay 2 × WebP ≤ 80 KB). `petal-watercolor` vẽ bằng 3 lớp path trong suốt (thay "sprite raster mép loang" ở §5.7).
2. **2 loại asset cho kiểu mở** (đúng CSP `img-src 'self'`, không inline style):
   - **mask**: SVG 1 màu (alpha qua `fill-opacity`), đặt ở `public/theme-assets/open/<id>/`, tô bằng `background-color: var(--token)` + `mask-image: url(...)` trong file CSS của kiểu mở. Màu theo token, 0 byte JS, chỉ tải khi kiểu đó được chọn. Không tính vào ngân sách 4 KB của module (solution §9.1 "không tính asset riêng").
   - **inline**: `open/<id>/inline.svg` là sprite symbol có `class`; FE chép `d` vào module TS và dựng bằng `svg()` (cần animate từng phần: nửa dấu sáp, nơ, cánh origami...). Phần dữ liệu path đo được ≤ 0.45 KB gz/kiểu, còn ≥ 3.5 KB cho logic.
3. **2 họ bố cục** cho 13 kiểu (§1.1): **vật thể** (đầu đề + tên cặp đôi ở trên, vật thể ở giữa, giống phong bì §3.2) và **cổng toàn màn** (khối chữ nằm trên một tấm "biển" `.cv-plaque` nổi trên các lớp cổng). Chữ **không bao giờ** nằm trên phần bị tách đôi / lật 3D / clip động.
4. **Hạt nền**: sprite là **path data cho `Path2D`** (không phải SVG string, khớp engine `ParticleField` hiện có vẽ sẵn ra canvas phụ). Mở rộng `ParticleKind` 7 trường tuỳ chọn (biến thể hình, mặt sau khi lật, lắc, trôi ngang, alpha, độ sâu, màu tự nhiên cho theme tối) - tương thích ngược 5 loại đã có (§4.1).
5. **E12** dùng chung engine burst; canvas hạt được **nâng lên trên cover** trong lúc mở thiệp (§3.0) - đây là thay đổi kiến trúc nhỏ cần thiết cho cả mức Nhiều của 13 kiểu mở.

---

## 1. Nguyên tắc chung cho 13 kiểu mở (bổ sung §3.4b)

### 1.1 Hai họ bố cục và điểm bám chữ
| Họ | Kiểu | Bố cục 360×740 | Tên cặp đôi (LCP) | "Kính gửi + tên khách" |
|---|---|---|---|---|
| **A. Vật thể** (`data-op-family="object"`) | `wax-seal`, `origami`, `scroll`, `card-3d`, `gift-box`, `book`, `polaroid` | Như §3.2: `.cv-head` (eyebrow, ngày, tên script) ở trên; vật thể `width: min(64–72vw, 250–300px)` ở giữa; CTA ở 1/3 dưới | Trong `.cv-head`, NGOÀI vật thể (đọc được trước khi module/asset tải). Riêng `card-3d`: trên mặt trước thẻ (thẻ là một mặt phẳng nguyên, không tách) | Trên **một mặt nguyên** của vật thể nếu có (mặt sau polaroid, trang trong của book, giấy của scroll, mặt trước card-3d), ngược lại ở **dưới vật thể** trên nền cover (wax-seal, origami, gift-box) |
| **B. Cổng toàn màn** (`data-op-family="gate"`) | `curtain`, `double-door`, `flower-gate`, `moon-gate`, `light-gather`, `ink-spread` | Các lớp cổng phủ `inset:0`; `.cv-inner` thành **biển chữ** `.cv-plaque` (nền `--c-surface`, viền `--c-line`, bo 14px, bóng `0 10px 28px -12px rgba(0,0,0,.45)`, padding 14px 18px, `max-width: min(84vw, 320px)`) nổi trên cổng (`z-index` cao nhất trong cover). `light-gather`/`ink-spread` không cần biển (nền phẳng) | Trong biển | Trong biển, dưới tên |

Quy tắc bắt buộc (cả 2 họ):
1. **Chữ không nằm trên phần chuyển động bị tách/lật/clip.** Phần tử chứa chữ chỉ được `opacity` + `translate`/`scale` nguyên khối. Ngoại lệ có chủ đích: giấy `scroll` (clip-path trải dần, trạng thái cuối `inset(-0.3em)`), chú thích `polaroid` (clip-wipe, biên `-0.3em`), mặt thẻ `card-3d`/bìa `book` (lật cả mặt, `backface-visibility:hidden`).
2. **Họ A - đầu đề rút trước khi có phần bay lên đè** (như E04 của phong bì): `.cv-head` `opacity 0 + translateY(-8px)` tại mốc `headAt` ghi trong từng kiểu. Phát hiện từ ảnh khung giữa: cánh trên `origami` lật 180° và nắp `gift-box` bay lên **đè đúng tên cặp đôi** nếu đầu đề không rút trước (`screenshots/v4a-2/open-mid.png`, bản đầu).
3. **Họ B - biển chữ rút đầu tiên**: 0–200ms `opacity 0, translateY(-8px), scale(.98)`, `--ease-out`. Cổng chỉ bắt đầu chuyển động từ ≥ 150ms.
4. **Họ B lộ landing thật**: ngay trong handler chạm (cùng lúc gỡ `landing-wait`), `.cover` chuyển `background: transparent` và ẩn `::before` texture/ornament góc; hình nền cổng do các lớp của kiểu tự vẽ. Như vậy khi cánh rèm/cửa tách ra, khách thấy hero thật phía sau (không phải nền giả). Landing phải ở `scrollY=0` (đã có, §3.5).
5. **Tên khách**: dùng lại thuật toán bậc cỡ của `fitEnvGuest` (22 → 19 → 17 → 15px, ≤ 2 dòng, 3 dòng ở 15px, không clamp/cắt) cho mọi hộp chứa tên khách có kích thước cố định (mặt sau polaroid, trang book, giấy scroll, mặt card-3d, biển). Gợi ý tách thành `fitGuest(box, guestEl)` dùng chung (đổi tên, không đổi logic).
6. **Biên an toàn dấu**: mọi `clip-path`/`overflow` quanh chữ có biên `-0.3em` trên dưới; chữ script có `padding-inline:.18em` (R08).

### 1.2 Cấu trúc DOM chung (gợi ý cho solution/FE)
```
.cover.cover--op[data-open=<id>][data-op-family=object|gate]
  .op-layers            (họ B: lớp cổng full màn, module dựng trong prepare())
  .cv-corner × 2        (chỉ họ A)
  .cv-inner             (họ B: thêm class .cv-plaque)
    .cv-head            (entry dựng sẵn: eyebrow, ngày, .cv-names)  <- LCP
    .cv-stage.op-stage  (họ A: module dựng vật thể vào đây)
    .cv-guestline       (entry dựng sẵn: .cv-prefix + .cv-guest; module có thể appendChild vào 1 mặt của vật thể)
    .cv-actions
```
- Entry (`cover.ts`) dựng phần chữ cho mọi kiểu → chữ hiện ngay cả khi module/asset tải chậm hoặc lỗi (rơi về `fade-zoom`). Module dựng phần hình trong `prepare()` (đã có hook `OpenModule.prepare`).
- `prepare()` **chờ decode các file mask** của kiểu đó (`new Image(); img.src=url; await img.decode()`, timeout 1500ms) trước khi resolve, để không "nháy" hình rỗng; nằm trong cổng "Đang chuẩn bị thiệp…" (§3.6, vẫn cho mở sau 4s).
- CSS của kiểu (`open-<id>.css`, ≤ 2 KB gz) chứa luật mask + biến `--op-*`; plugin chèn `<link>` cho kiểu đã resolve (solution §9.1 mục 1–2). File mask ở `public/theme-assets/open/<id>/*.svg` (immutable).
- `will-change` chỉ gắn trong lúc chạy cho ≤ 6 phần tử, gỡ khi xong (§5.5).
- Tua nhanh: dùng `runSteps()` có sẵn (WAAPI); `light-gather` (canvas) nhân `timeScale = remaining/300`.

### 1.3 Biến màu `--op-*` (mặc định theo token; theme tối ghi riêng)
| Biến | Sáng | Tối (`[data-mode=dark]`) | Dùng ở |
|---|---|---|---|
| `--op-fabric` / `--op-fabric-deep` | `color-mix(primary 88%, #000)` / `color-mix(primary 62%, #000)` | `color-mix(#5A1E2A 80%, bg)` / `color-mix(#5A1E2A 55%, #000)` | curtain |
| `--op-wax` | `primary` | `primary` (vàng), lõi ép sáng lên 10% | wax-seal |
| `--op-paper` / `--op-paper-2` | `surface` / `color-mix(accent 26%, surface)` | `surface` / `color-mix(accent 30%, surface)` | origami, wax-seal (mặt trong cánh) |
| `--op-door` | `color-mix(primary 80%, #1A120C)` | `color-mix(surface 85%, primary 15%)` | double-door |
| `--op-leaf` / `--op-bloom` / `--op-bloom-deep` | `color-mix(#7E9B76 85%, primary)` / `accent-2` / `color-mix(accent-2 60%, primary)` | `color-mix(#7E9B76 60%, bg)` / `primary` / `color-mix(primary 60%, #000)` | flower-gate |
| `--op-wood` / `--op-wood-line` | `color-mix(primary 55–78%, #2A1608)` / `color-mix(accent 55%, --op-wood)` | `color-mix(surface 80%, primary 20%)` / `primary` | scroll (trục), moon-gate |
| `--op-ribbon` | `primary` | `primary` | scroll, gift-box |
| `--op-box` / `--op-box-deep` | `color-mix(accent 40%, surface)` / `color-mix(accent 70%, primary 10%)` | `color-mix(accent 35%, surface)` / `accent` | gift-box |
| `--op-cover` / `--op-cover-ink` | `color-mix(primary 92%, #000)` / bảng §2.11 | `color-mix(surface 85%, primary 15%)` / `primary` | book |
| `--op-ink-rim` | `accent` (opacity .55); `muc-giay`: `text` (.35) | `primary` (.45) | ink-spread |

### 1.4 Hạt trong lúc mở thiệp (mức Nhiều của 13 kiểu + E12)
Dùng chung `ParticleField` (không tạo canvas thứ 2, trừ `light-gather` §2.8). Xem §3.0 cho cách nâng canvas lên trên cover.

---

## 2. Từng kiểu mở (asset · lớp · chữ · timeline Vừa / Nhẹ / Nhiều)
Ký hiệu: `t` tính từ lúc chạm (ms); `.cv-actions` luôn rút 0–120ms (§3.4, R05) nên không ghi lại. Tắt / reduced-motion = fade 200ms (§3.4b) với hình tĩnh. "Nhẹ" cũng là bản chạy khi máy yếu (kiểu chi phí Vừa).
Ảnh: `screenshots/v4a-2/open-closed.png` (trạng thái đóng, 13 kiểu với theme gợi ý) và `open-mid.png` (khung ~45–60% timeline Vừa).

### 2.1 `curtain` - Rèm kéo (họ B, ~1.25s, chi phí Thấp)
- **Asset (mask)**: `open/curtain/valance-fill.svg` (diềm võng, tile 160×64, `repeat-x`, `mask-size: auto 100%`, cao 64px mobile / 88px desktop, tô `--op-fabric-deep`), `valance-trim.svg` (chỉ viền + tua, tô `accent`), `trim.svg` (dải thoi dọc mép giữa mỗi cánh, tile 16×40 `repeat-y`, rộng 12px, tô `accent`). Nếp vải = CSS `linear-gradient` tĩnh (5 điểm sáng/tối, tile 34–48px) trên `--op-fabric` - không cần file.
- **Lớp** (dưới→trên): `.ct-l`, `.ct-r` (mỗi cánh `width: 51%`, chồng 2% ở giữa) → `.ct-valance` → `.cv-plaque`.
- **Vừa**: 0–200 biển rút · 150–1050 `.ct-l` `translateX(0→-100%) scaleX(1→.82)` (`transform-origin: 0 50%`, rèm "dồn" về mép), `.ct-r` đối xứng, `--ease-inout` · 800–1100 diềm `translateY(-100%)` `cubic-bezier(.4,0,1,1)` · 950–1250 cover fade.
- **Nhẹ**: biển 0–150 · cánh chỉ `translateX` 100–700 · diềm mờ cùng cover 550–750 (~0.75s).
- **Nhiều**: + 16 hạt `gold` (§5.2) dọc đường giữa (x = 50%, y 20–80%) tại t=200, `vx ±60–160`, sống 900ms; + tua diềm lắc `rotate ±6°` 2 nhịp.

### 2.2 `wax-seal` - Dấu sáp vỡ (họ A, ~1.7s, Vừa)
- **Asset (inline)**: `open/wax-seal/inline.svg`: `wx-body` (khối sáp 22 điểm có 5 giọt chảy), `wx-press` (lõi ép r29 + 2 vành), `wx-crack` (vệt nứt zíc-zắc, `pathLength=100`), `crack-l`/`crack-r` (2 clipPath tĩnh, đường nứt lệch trục 2–5 đơn vị để không cắt đôi đúng giữa monogram), `wx-shard-1..6` (mảnh vụn). Gradient 3 điểm như seal phong bì (`wx-hi/mid/lo` từ `--op-wax`). Cỡ seal `clamp(80px, 24vw, 104px)`.
- **Lớp**: thẻ gập cổng (gate-fold) `width: min(64vw, 260px); aspect-ratio: 4/5`: `.ws-inner` (trang trong: lời chào) → 2 cánh `.ws-wing` (mỗi cánh **2 mặt**: mặt ngoài giấy + khung accent thụt 8px; mặt trong `--op-paper-2`; `backface-visibility:hidden`) → seal (2 nửa = cùng hình + clipPath, monogram text HTML trên `.wx-press`).
- **Chữ**: monogram 18–20px heading màu `--c-on-primary` nằm trên lõi ép (tương phản ≥ 5.9:1 cả 12 theme; KHÔNG đặt trên vùng sáng `wx-hi`, chỉ 2.6:1). Tên khách **dưới thẻ** (thẻ tách đôi ở giữa nên không in tên lên cánh).
- **Vừa**: 0–240 seal rung `rotate 0/-4/4/-4/0°` (2×120ms) · 240–360 vệt nứt vẽ (`stroke-dashoffset 100→0`) · 360–700 2 nửa rơi **ra ngoài mép thẻ**: trái `translate(-(W/2+24)px, 40px) rotate(-38°)`, phải đối xứng, `cubic-bezier(.4,0,1,1)`, mờ từ 50% hành trình (ảnh khung giữa cho thấy nửa seal rơi tại chỗ sẽ đè lên lời chào) · 360–760 6 mảnh vụn bay toả 30–70px + mờ · 420–1020 cánh `rotateY(0→∓160°)` quanh mép ngoài, `perspective(1200px)`, `--ease-inout` · 700–1000 lời chào hiện (crossfade) · 900–1100 `.cv-head` rút (`headAt=900`, trước khi thẻ phóng to) · 1300–1700 thẻ `scale(1→1.15)` + cover fade từ 1400.
- **Nhẹ**: seal fade 0–150 · cánh 100–600 · cover fade 600–900 (~0.9s), không rung/nứt/mảnh vụn.
- **Nhiều**: + 14 hạt `gold` lóe tại tâm vết nứt lúc t=360 (toả 360°, `v 60–160`, sống 600–800ms).

### 2.3 `origami` - Gấp giấy (họ A, ~1.8s, Vừa)
- **Asset**: inline `open/origami/inline.svg` (4 cánh tam giác hệ 100×100, mũi chồm qua tâm 2 đơn vị để không hở khe; mỗi cánh có nếp `og-crease`; sticker tim 24×24); mask `flap-pattern.svg` (tile 24×24 hoa 4 cánh + chấm) tô `accent` .55 trên nền `--op-paper-2` cho **mặt sau** cánh.
- **Lớp**: tờ vuông `width: min(72vw, 300px)` → trang trong (lời chào / "Trân trọng kính mời {khách}") → cánh trái, phải, dưới, trên (z tăng dần) → sticker. Mỗi cánh `transform-style: preserve-3d`, 2 mặt `backface-visibility:hidden`, `transform-origin` ở cạnh đáy của cánh.
- **Chữ**: tên khách dưới tờ giấy (4 cánh chụm giữa, không có mặt nguyên). Sau khi mở, trang trong lặp lại tên khách trong câu mời.
- **Vừa**: 0–240 `.cv-head` rút (`headAt=0`: cánh trên lật lên **đè đầu đề**) · 0–160 sticker `scale(1→1.15→0)` + fade (`--ease-pop`) · cánh trên 160–540, phải 280–660, dưới 400–780, trái 520–900: mỗi cánh `rotateX/Y(0→±180°)` 380ms `--ease-inout`, `perspective(900px)` · 1300–1800 cả tờ `scale(1→2.4)` + cover fade từ 1500. Cánh trái/phải mở ra tràn mép màn 360px là chủ ý (tờ giấy "trải rộng" hơn màn).
- **Nhẹ**: sticker 0–120 · 4 cánh cùng lúc 100–480 · fade 480–800.
- **Nhiều**: + bóng nếp: mỗi cánh có lớp `.og-shade` (gradient đen→trong) `opacity 0→.35→0` trong lúc lật; + 24 mảnh `confetti` hình vuông nhỏ màu `accent/accent-2` bung từ tâm lúc t=900.

### 2.4 `double-door` - Cửa đôi (họ B, ~1.6s, Vừa)
- **Asset (mask)**: `open/double-door/door-carve.svg` (1 cánh trái 200×520: khung kép, ô trên vòm + song chéo + hoa chạm 8 cánh, thanh hồi văn, ô dưới thoi; cánh phải = `scaleX(-1)`), tô `color-mix(accent 90%, transparent)`, `mask-size: 100% auto; mask-position: 50% 50%` (phần trên/dưới dư ra là nền cửa trơn + khung CSS `inset` 2 đường); `ring.svg` (vòng nắm 32×48, đặt sát mép giữa ở 52% chiều cao, rộng 24px). Nền cánh = `--op-door` + gradient bóng 2 mép (CSS).
- **Lớp**: `.dd` (`perspective: 900px`) → ánh sáng `.dd-light` (`linear-gradient(90deg, transparent 38%, rgba(255,244,214,.9) 50%, transparent 62%)`) → 2 cánh → `.cv-plaque`.
- **Vừa**: 0–200 biển rút · 150–1050 cánh `rotateY(0→±105°)` quanh bản lề ngoài `--ease-inout` · 250–750 ánh sáng `opacity 0→.8`, 750–1150 `.8→0` · 600–1600 `.dd` `scale(1→1.15)` ("camera" tiến vào) · 1200–1600 cover fade.
- **Nhẹ**: biển 0–150 · cánh trượt `translateX(∓100%)` 100–700 · fade 500–800.
- **Nhiều**: + 20 hạt `firefly`/`gold` bay ra từ khe giữa lúc t=250 (`vx` hướng ra ngoài 40–120, `vy -20..20`, sống 900ms).

### 2.5 `flower-gate` - Cổng hoa (họ B, ~1.8s, Vừa) - **vector, không WebP**
- **Asset (mask, 4 lớp cho cụm trái; cụm phải = `scaleX(-1)`)**: `open/flower-gate/cluster-leaf.svg` (26 lá dọc dây leo, `--op-leaf`) · `cluster-bloom.svg` (3 bông mẫu đơn nhiều thuỳ + 5 hoa 5 cánh + 4 nụ, `--op-bloom`) · `cluster-deep.svg` (3 vòng cánh trong hình lưỡi liềm alpha .55/.75/.95 + nhuỵ + chấm hoa li ti, `--op-bloom-deep`) · `cluster-line.svg` (dây leo + mép cánh + gân lá, `primary-decor` opacity .5) · `arch.svg` (vòm 2 cung mảnh + 5 nụ, nửa trái 200×560, `accent`). Tổng 24.4 KB thô / 6.3 KB gz cho cả cổng (WebP cũ 2 × ≤ 80 KB). Màu theo token nên đổi theme vẫn khớp.
- **Lớp**: vòm (2 nửa) → cụm trái/phải (`width: 64vw; max-width: 420px`, dạt ra ngoài 12%, `mask-size: 100% auto`, đặt từ `top: -10px`) → `.cv-plaque`. Thứ tự 4 lớp trong cụm: leaf → bloom → deep → line.
- **Vừa**: 0–200 biển rút · 150–950 cụm trái `translate(-55%, -18%) rotate(-8°)`, cụm phải đối xứng, `--ease-out` · 300 burst 24 cánh hoa (kiểu hạt nền của theme, như burst `petals`) từ tâm · 400–1000 vòm `scale(1→1.25)` + mờ · 1100–1800 cover fade.
- **Nhẹ**: không burst; cụm trượt 100–700; fade 500–900.
- **Nhiều**: burst 40 cánh, `toBg: true` (cánh hoa chuyển thành hạt nền và rơi tiếp ~2s rồi theo mật độ nền) - đúng ý "lá rơi tiếp 2s" ở §3.4b mà không cần module lá riêng.

### 2.6 `scroll` - Cuộn thư (họ A, ~2.1s, Vừa - repaint vì clip-path)
- **Asset (inline)**: `open/scroll/inline.svg`: `sc-rod` (trục 320×24: thân `--op-wood`, 2 núm + chóp `accent`, vệt sáng trắng .35) và `sc-ribbon` (ruy băng 60×72: dải dọc + 2 vòng nơ `pathLength=100` + 2 đuôi, `--op-ribbon` và bản đậm 70%). Giấy = CSS (`surface` + bóng trong 2 mép trên/dưới + khung đôi `accent` thụt 6/8px).
- **Lớp**: trục trên → giấy `.sc-paper` (`height: min(46svh, 340px)` **giữ chỗ từ đầu**, không CLS; `clip-path: inset(0 0 100% 0)`) → trục dưới (`position:absolute`, ban đầu nằm sát trục trên) → ruy băng (giữa 2 trục).
- **Chữ**: "Kính gửi / {khách}" + "tới dự lễ thành hôn" trên giấy (đây là nội dung cần đọc trong pha giữ). Tên cặp đôi ở `.cv-head`.
- **Vừa**: 0–300 ruy băng: 2 vòng nơ `stroke-dashoffset 0→100` + dải `translateY(16px)` + fade · 250–1150 trục dưới `translateY(0→H)` **đồng bộ** với giấy `clip-path: inset(0 0 100% 0) → inset(-0.3em)` (cùng easing `--ease-inout`, cùng thời lượng) · 1150–1650 giữ · 1650–2100 sân khấu `scale(1→1.08)` + cover fade.
- **Nhẹ**: ruy băng fade 0–150 · trải 100–600 · không giữ · fade 600–900.
- **Nhiều**: + "trục xoay": trục có 3 vân gỗ mảnh `.sc-grain` chạy `translateY` lặp 3 vòng trong lúc lăn (thấy trục quay quanh trục ngang) - chỉ transform; + 12 mảnh `red-paper` rơi từ trên khi giấy trải xong (theme `son-do`), các theme khác dùng `gold`.

### 2.7 `card-3d` - Thiệp 3D xoay (họ A, ~1.4s, Thấp)
- **Asset (mask)**: `open/card-3d/card-frame.svg` (khung mặt thẻ 300×420: viền bo 6px + đường chấm thụt + 4 góc chữ L có chấm, tô `accent`). Mặt sau: nền `primary` + monogram script `on-primary` (hoặc lời chào). Bóng đổ = phần tử riêng `radial-gradient` (không `box-shadow` động).
- **Lớp**: `.c3` (`perspective: 1000px`) → bóng → `.c3-rot` (`preserve-3d`) chứa mặt trước (chữ: eyebrow, ngày, tên, divider, Kính gửi + khách) và mặt sau (`rotateY(180deg)`), cả 2 `backface-visibility:hidden` (ảnh khung giữa bản đầu thiếu mặt sau → thấy chữ bị lật ngược).
- **Trước khi chạm**: desktop `pointer: fine` nghiêng theo con trỏ ±10° (lerp .12/frame, như `photo-tilt`); mobile tự lắc `rotateY ±3°` 1 chu kỳ 3s rồi dừng (CSS, 1 lần); reduced-motion: đứng yên.
- **Vừa**: 0–900 `rotateY(0→360°)` `--ease-inout`; bóng `scaleX` theo `|cos|` (keyframe 0/25/50/75/100% = 1/.35/1/.35/1, opacity .35→.2) · 900–1300 thẻ `scale(1→1.6)` + mờ từ 1000 · 1000–1400 cover fade.
- **Nhẹ**: lật 180° (0–400) dừng ở mặt sau, fade 400–700; không nghiêng/lắc.
- **Nhiều**: + vệt sáng chéo lướt mặt trước 0–400 và mặt sau 500–900 (`.c3-sheen` gradient `translateX`, opacity).

### 2.8 `light-gather` - Hạt sáng tụ thành tên (họ B, ~2.4s, **Cao**, canvas riêng)
- **Asset**: không có file; sprite quầng sáng vẽ 1 lần lúc `prepare()` (radial gradient 8px, lõi 1.2px). **Ngoại lệ "1 canvas"** (§5.6): canvas riêng nằm TRONG `.cover` (gỡ cùng cover) vì cần 400–700 điểm có đích, vượt trần burst 120 của `ParticleField`.
- **Chữ**: tên cặp đôi là **text HTML** (LCP, screen reader) ở giữa màn, đầu đề + tên khách ở trên/dưới (không có biển). Hạt tụ **đúng vào vị trí chữ HTML**.
- **Lấy mẫu (bắt buộc khớp DOM)**: sau `document.fonts.load()` của font script, vẽ từng span `.nm-a`, `.nm-amp`, `.nm-b` lên canvas phụ ở đúng `getBoundingClientRect()` của span (font lấy từ `getComputedStyle`, căn baseline bằng `measureText().actualBoundingBoxAscent`); bước mẫu 3px (font script: 2px, §3.4b); ngưỡng alpha 128; **xáo trộn rồi lấy N điểm khác nhau** (không bốc ngẫu nhiên có lặp - bản thử đầu bốc lặp + quầng 3× làm hạt bết thành một khối sáng, `open-mid.png` bản đầu). N = min(400, số điểm) (Nhiều: 700).
- **Chờ (trước khi chạm)**: chỉ **120 hạt** trôi chậm 8–16px/s, alpha .35–.7, **né khối tên** + 12px (alpha ≤ .25 trong vùng - như vùng dịu R03) để không làm bẩn chữ LCP.
- **Vừa**: 0–300 chữ tên HTML `opacity 1→.18` (giữ bóng mờ để vẫn đọc được tên khi hạt chưa phủ kín), đầu đề + tên khách → 0 · 0–1100 hạt bay về đích (120 hạt đang có + 280 hạt sinh ở mép màn), mỗi hạt trễ ngẫu nhiên 0–200ms, `--ease-out` · 1100–1700 giữ, alpha nhịp .8→1→.8, rung 0.3px · 1700–2400 tản: vận tốc toả từ tâm tên 40–160px/s + rơi 30px/s², alpha → 0; chữ HTML .18→0 ở 1700–1900; cover nền fade 1800–2400.
- **Vẽ**: theme tối: `globalCompositeOperation='lighter'`, màu `#F3D48C`/`#FFF4D6`; theme sáng: `source-over`, màu `primary-decor` + `accent` (với 'lighter' trên nền giấy thì hạt biến mất), quầng ≤ 2.4× lõi. DPR ≤ 2, ≤ 3ms/frame (400 `drawImage`).
- **Nhẹ / máy yếu**: `fade-zoom` + 12 hạt `sparkle` nhấp nháy quanh tên (§3.4b) - chạy trên `ParticleField` nâng lên cover (§3.0).
- **Nhiều**: N = 700.

### 2.9 `gift-box` - Mở hộp quà (họ A, ~1.9s, Vừa)
- **Asset (inline)**: `open/gift-box/inline.svg`: `gb-body` (thân hộp + dải ruy băng dọc + nét), `gb-lid` (nắp chờm 4 đơn vị + dải ngang), `gb-bow` (2 vòng nơ + 2 đuôi, `pathLength=100`, nút thắt), `gb-tag` (thẻ treo tuỳ chọn: chỉ in monogram, không in tên khách). Màu `--op-box`, `--op-box-deep`, `--op-ribbon`, nét `primary-decor` 1.4.
- **Lớp**: hộp `width: min(56vw, 220px)` vuông: thiệp `.gb-card` (lời chào) → thân hộp → nắp → nơ. Thiệp nằm **sau thân hộp** nên khi rút lên là "nhô ra khỏi miệng hộp".
- **Chữ**: tên khách dưới hộp (dải ruy băng dọc cắt ngang mặt hộp → không in chữ lên mặt hộp).
- **Vừa**: 0–200 `.cv-head` rút (`headAt=0`: nắp bay lên **đè tên cặp đôi**) · 0–400 nơ tuột (vòng 0–300, đuôi 100–400 `stroke-dashoffset 0→100`), nút mờ 200–400 · 350–850 nắp `translate(40px, -120%) rotate(15°)` `--ease-pop`, mờ 650–850 · 600–1100 thiệp `translateY(0 → -0.9×chiều cao hộp)` `--ease-out` · t=900 `confetti` 40 mảnh từ miệng hộp, nón ±35° hướng lên · 1100–1500 giữ lời chào · 1500–1900 `scale(1→1.2)` + cover fade.
- **Nhẹ**: nơ + nắp fade 0–200 · thiệp rút 150–550 · fade 550–850, không confetti.
- **Nhiều**: confetti 80 mảnh (§3.4b).

### 2.10 `moon-gate` - Cửa trăng (họ B, ~1.6s, Vừa)
- **Asset (mask)**: `open/moon-gate/lattice-tile.svg` (song cửa ô vuông lồng + chấm, tile 48×48, hiển thị 36–44px, tô `--op-wood-line` .8), `lotus-fill.svg` (hoa sen 7 cánh + nụ + 2 lá, 220×150, tô `accent` - hồng sen ở `sen-cham`), `lotus-line.svg` (gân + cuống, `primary` .55). **Lỗ cửa trăng = CSS** (`mask: radial-gradient(circle at 100% var(--cy), transparent var(--r), #000 calc(var(--r) + 1px))` cho nửa trái, `0 var(--cy)` cho nửa phải) → tròn tuyệt đối ở mọi tỉ lệ màn, không méo như khi kéo giãn SVG. Lớp song cửa ghép với cùng radial bằng `mask-composite: intersect` (`-webkit-mask-composite: source-in`). Vành trăng = `border: 7px double accent` trên phần tử tròn nằm trong mỗi nửa (bị nửa cắt đôi tự nhiên).
- **Kích thước**: `--r: min(36vw, 22svh, 170px)`, `--cy: 36%`; biển chữ đặt dưới cửa (`top ≥ cy + r − 16px`, chồng ≤ 16px lên vành là chấp nhận được, ảnh `open-closed.png`).
- **Ảnh trong cửa**: `cover.backgroundImage` → ảnh hero → không có ảnh thì nền `surface` + monogram script + sen (vẫn đọc được bước "nở tròn").
- **Vừa**: 0–200 biển rút · 0–250 sen mờ + `translateY(10px)` · 150–850 2 nửa vách `translateX(∓100%)` `--ease-inout` · 700–1400 ảnh `clip-path: circle(var(--r) at 50% var(--cy)) → circle(150% at 50% var(--cy))` `--ease-out` (ảnh không có chữ nên clip được) · 1200–1600 ảnh fade (lộ landing thật).
- **Nhẹ**: bỏ bước nở tròn (§3.4b): biển 0–150, vách 100–600, fade 500–800.
- **Nhiều**: + 12 cánh `petal-lotus` rơi từ mép trên lúc t=700, sống 1500ms (tải module hạt `petal-lotus` chỉ khi Nhiều).

### 2.11 `book` - Thiệp gấp đôi (lật trang) (họ A, ~1.8s, Thấp)
- **Asset (mask)**: `open/book/cover-frame.svg` (khung bìa 300×420: viền dày + đường mảnh thụt, 4 hoa góc, vòng monogram cx150 cy190 r41–44 với 2 nhánh lá, 2 vạch dòng tiêu đề y 324/360), `endpaper.svg` (giấy lót tile 40×40 thoi + chấm, `accent` .22, mặt trong bìa).
- **Lớp**: sách `width: min(62vw, 250px); aspect-ratio: 5/7` → trang trong (chữ) → bìa `.bk-cover` (`preserve-3d`, `transform-origin: 0 50%` = gáy) có mặt trước (nền `--op-cover` + gáy tối 7% + khung) và mặt sau (giấy lót).
- **Chữ trên bìa**: monogram (heading 22–26px, tâm vòng = 45.2% chiều cao) và nhãn "Thiệp mời" (heading italic 12–14px, 79.5%) màu **`--op-cover-ink`** (cả monogram, vì accent trên bìa tối chỉ 2.5–4.4:1). Tính trong derive: `color-mix(accent, #fff, t)` với t nhỏ nhất đạt ≥ 4.5:1 trên `--op-cover`; kết quả đo: tram-vang `#EFE5D2` (+70%) · hong-phan `#EDD4CF` (+35%) · luc-bao `#D1B98F` (+25%) · son-do `#DFB96D` (+25%) · muc-giay `#C57747` (+5%) · hoai-co `#D1A99C` (+15%) · sen-cham accent (5.93) · mau-nuoc `#C7D8C1` (+35%) · dat-nung `#EACDB8` (+45%) · pastel-han `#F4C9BC` (+5%) · dem-nhung primary trên bìa sáng hơn nền (6.28) · bien-dao `#F4B19C` (+15%).
- **Chữ trang trong**: "Trân trọng kính mời / {khách} / tới dự lễ thành hôn" (heading italic, fit §1.1-5).
- **Vừa**: 0–700 bìa `rotateY(0→-180°)` `perspective(1400px)` `--ease-inout` (trang bìa mở ra trái, tràn mép màn 360px là chủ ý; không dời sách để trang trong đứng yên đọc được) · 700–1400 giữ · 1400–1800 `scale(1→1.12)` + cover fade.
- **Nhẹ**: lật 0–400, không giữ, fade 400–700.
- **Nhiều**: + trang giấy lót mờ (vellum: `surface` .55 + góc hoa) lật theo, trễ 120ms, 700ms.

### 2.12 `ink-spread` - Mực loang (họ B, ~1.2s, Vừa - repaint vì mask)
- **Asset (mask)**: `open/ink-spread/blob-core.svg` (vệt 28 thuỳ không đều + 11 giọt bắn, 400×400, tâm 200,200) và `blob-rim.svg` (vành sắc tố đọng mép = viền evenodd 7% + 70 hạt lắng + giọt). Hệ số nội tiếp: vệt phủ kín hình tròn bán kính ≈ 36% cạnh file.
- **Kỹ thuật (thay "clip-path circle" ở §3.4b - để mép loang đúng hình vệt mực)**: **khoét lỗ thật** trên `.cover`: `mask: url(blob-core.svg) X Y / S S no-repeat, linear-gradient(#000 0 0)` + `mask-composite: exclude` (`-webkit-mask-composite: xor`); WAAPI animate `mask-size` (và `mask-position` để tâm luôn ở điểm chạm) từ 0 tới `S1 = 2.8 × khoảng cách từ điểm chạm tới góc xa nhất`. Lỗ lộ **landing thật** (ảnh `open-mid.png`). Vành: phần tử `.ik-rim` (mask `blob-rim.svg`, màu `--op-ink-rim`) cỡ S1 đặt tại điểm chạm, `transform: scale(0→1)` cùng easing/thời lượng (chỉ transform).
- **Dự phòng** (không có `mask-composite` hoặc lỗi decode): lớp `.ik-fill` (mask `blob-core`, màu `color-mix(accent 30%, bg)`) phóng `scale(0→1)` phủ cover rồi cover fade. **Không** dùng màu lõi = `--c-bg`: trên cover nền `surface` gần trùng màu thì gần như không thấy vệt (thử nghiệm bản đầu).
- **Điểm chạm**: `clientX/Y` của sự kiện chạm/click; mở bằng bàn phím (`event.detail === 0`) hoặc Nhẹ: tâm màn.
- **Vừa**: 0–1000 lỗ + vành nở `--ease-out` · 700–1000 vành mờ · 1000–1200 gỡ cover. Chữ không cần biển (không có lớp cổng che chữ); chữ bị khoét theo lỗ là hành vi mong muốn, không phải clip sát chữ (chữ không chuyển động).
- **Nhẹ**: từ tâm màn, 600ms, không vành.
- **Nhiều**: + 2 vệt **vành** phụ (chỉ trang trí, không khoét thêm - nhiều lỗ `exclude` chồng nhau sẽ bù trừ nhau) tại `(±30% w, ±20% h)` so với điểm chạm, trễ 150ms, `scale(0→.35)`, mờ cùng vành chính.

### 2.13 `polaroid` - Ảnh polaroid (họ A, ~2.2s, Thấp)
- **Asset (mask)**: `open/polaroid/back-print.svg` (mặt sau giấy ảnh 200×240: dòng kẻ chấm + ô tem, `muted` .18) và `tape.svg` (băng dính washi 84×30 mép xé + sọc chéo, `accent-2` .8). Khung polaroid dùng lại `frames.css` `polaroid` (v4a-1: giấy `#FFFDF9`, padding 10/10/36px).
- **Lớp**: tấm ảnh `width: min(62vw, 250px)`, tỉ lệ ~0.84, `rotate(-3deg)` → 2 mặt (`preserve-3d`): mặt sau (ban đầu hướng ra người xem) in **"Kính gửi / {khách}"** (heading italic màu mực `#3A332E` 12.2:1 trên giấy, fit §1.1-5) - như ghi tay sau tấm ảnh; mặt trước: ảnh + 2 lớp "rửa ảnh" (`.dev1` trắng đục `#F4F1EA`, `.dev2` sepia `#704214` `mix-blend-mode: color` tĩnh) + chú thích tên cặp đôi script ở dải dưới. Băng dính ở mép trên.
- **Ảnh**: `cover.backgroundImage` → hero → gradient `accent-2 → primary` + monogram.
- **Vừa**: 0–200 băng dính bóc `translateY(-10px) rotate(-12°)` + mờ · 0–500 lật `rotateY(180→0°)` `--ease-inout` · 500–1700 rửa ảnh: `.dev1` opacity 1→0 (1200ms `--ease-out`), `.dev2` .9→0 (800–1700) - chỉ opacity, không animate `filter` · 1100–1700 chú thích `clip-path: inset(-.3em 100% -.3em -.3em) → inset(-.3em)` `cubic-bezier(.55,.1,.35,1)` · 1600–1800 `.cv-head` rút (`headAt=1600`, tấm ảnh sắp bay lên qua đầu đề) · 1700–2200 tấm ảnh `translateY(-120vh) rotate(-3→-12°)` `cubic-bezier(.4,0,1,1)` + cover fade từ 1900.
- **Nhẹ**: lật 0–400, ảnh và chú thích hiện sẵn (bỏ rửa ảnh), fade 600–900.
- **Nhiều**: + 2 tấm polaroid phụ (ảnh album[0], album[1] dạng thumb; không có thì giấy tô `accent-2` 30%) trượt ra từ phía sau 600–1100: `translate(±70px, 20px) rotate(±10°)`, mờ cùng cover.

### 2.14 Ngân sách đo được (asset kiểu mở)
| Kiểu | File | Thô | gz | Path nhúng TS (gz) | Ghi chú |
|---|---|---|---|---|---|
| curtain | 3 mask | 1.4 KB | 1.0 KB | - | nếp vải = CSS |
| wax-seal | inline | 2.4 KB | 0.9 KB | 0.43 KB | |
| origami | inline + 1 mask | 2.1 KB | 0.85 KB | 0.14 KB | |
| double-door | 2 mask | 2.5 KB | 1.2 KB | - | |
| flower-gate | 5 mask | 24.4 KB | 6.3 KB | - | thay 2 × WebP ≤ 80 KB |
| scroll | inline | 1.0 KB | 0.55 KB | 0.23 KB | |
| card-3d | 1 mask | 1.1 KB | 0.43 KB | - | |
| light-gather | - | - | - | - | canvas |
| gift-box | inline | 1.5 KB | 0.62 KB | 0.21 KB | |
| moon-gate | 3 mask | 4.4 KB | 1.5 KB | - | lỗ cửa = CSS radial |
| book | 2 mask | 3.3 KB | 0.93 KB | - | |
| ink-spread | 2 mask | 8.1 KB | 2.8 KB | - | |
| polaroid | 2 mask | 2.4 KB | 0.86 KB | - | |
FE chạy SVGO (giữ `viewBox`, `id`, `pathLength`, `fill-opacity`, `fill-rule`, `clip-path`) trước khi đưa vào `public/`.
