# Design review: phong bì v2.1 + 6 mẫu phong thư + tự cuộn (guest)

> Người viết: ui-ux-designer · Ngày: 2026-10-08 · Phạm vi: guest v2.1 (commit f0a6465), chỉ phần guest. Không sửa code, không sửa design.md.
> Nguồn đối chiếu: `decisions.md` (các mục 2026-10-08), `design.md` 3.2 / 3.4 / 3.4c / 5.11 / 7.1, `design-review-v1.md` (R01–R24, mục 3.2, 4, 5), `frontend-report-v2.1.md`.

**Cách review.** Dùng dev server có sẵn ở :5180 cho JS/CSS/ảnh. HTML theo từng theme/mẫu được dựng bằng một Vite in-process không mở cổng, đọc từ bản sao config trong scratchpad, rồi đưa vào trang qua Playwright route interception. Không đụng `public/content/config.json`. Trình duyệt là Chrome (channel `chrome`). Các kích thước đã chụp: 360×740, 360×640, 390×844, 1366×680, 1440×900 (DPR 1–3), ở 3 theme `tram-vang`, `son-do`, `dem-nhung` × 6 mẫu, với màu `auto`, `theme` và hex. Timeline được tua bằng `Animation.currentTime`, kiểm tra từng bước 50ms, chụp 10 khung cho mỗi mẫu. Các cấp đã chạy: Tắt / Nhẹ / Vừa / Nhiều và reduced-motion. Tự cuộn được đo `scrollY` mỗi 100ms trong 30s. Tương phản tính theo công thức WCAG trên màu đã tính của trình duyệt. Ảnh nằm trong scratchpad phiên (`…/scratchpad/envrev/shots/`, không commit). Server :5180 (PID 4012) đã dừng sau khi xong.

---

## 1. Tóm tắt

**Phong bì mới đạt mục tiêu R01.** Phong bì ngang 10:7, tên cặp đôi ở trên và ngoài phong bì, "Kính gửi + tên khách" in trên mặt phong bì. Thứ tự lớp đúng: nắp lật xong thì nằm sau thẻ, thẻ rút ra từ trong bao, bao rơi xuống và mờ dần, thẻ về giữa màn kèm lời chào. **Không khung nào ra khỏi viewport** ở 360×740, 390×844 và 1366×680. Thời lượng mức Vừa nằm trong 1.77–2.15s (giới hạn là 2.4s). 6 mẫu đều có cá tính riêng và nhận ra được ngay ở cỡ mobile. `song-hy` và `velvet` là hai mẫu đẹp nhất. Reduced-motion, cấp Tắt và cấp Nhẹ chạy đúng. Tự cuộn đúng spec: chạy khoảng 42px/s, dừng 1.2s ở đầu section, chạm là dừng hẳn, có toast, không tự chạy lại, bấm Tiếp tục thì chạy tiếp. Trong R-points, 22/23 điểm đạt, R23 để v4 theo kế hoạch.

**Một lỗi chặn phát hành (E01):** ô tên khách trên mặt phong bì dùng `-webkit-line-clamp: 2` + `overflow:hidden`. Cách này **cắt mất dấu nặng ở dòng cuối**: "Mạnh" hiện thành "Manh", "Phượng" thành "Phương". Lỗi có ở đúng cấu hình mặc định (Trầm Vàng + classic) và ở 5/6 mẫu (trừ `minimal`). Với tên tiếng Việt, mất dấu là sai tên khách. Ngoài ra `kraft` có dây gai vẽ đè lên chữ trên thẻ tên (E02), và ở `son-do` tên dài bị cắt thành "… và..".

**Các điểm vừa phải:** nếp gấp túi cắt ngang chữ địa chỉ (E03). Thẻ và nắp đè lên tên cặp đôi trong khoảng 650–1150ms (E04). Nút "Tiếp tục tự cuộn" hiện suốt tới cuối trang và che mép phải nội dung, kể cả nút "Gửi lời chúc" (E05). Các mẫu theo token (classic/minimal/lace) gần như vô hình trên theme tối (E06).

**Đếm điểm mới:** Cao 2 · Vừa 4 · Thấp 6 (tổng 12).

**Lệch "hình nắp chỉnh nhẹ": chấp nhận**, kèm 1 điều kiện liên quan E01 (mục 5).

---

## 2. Xác minh R01–R24 (trừ R23)

| ID | Kết quả | Bằng chứng (đã kiểm) | Ghi chú |
|---|---|---|---|
| R01 | ✅ Đạt (còn E01–E04) | Phong bì ngang 317×222 (360px), 380 max, 560 desktop (co còn 400 ở 1366×680). Tên cặp đôi ở trên. "Kính gửi" + tên khách là text HTML trên `.env-front`. Tua 50ms: 0 khung ra ngoài viewport ở cả 6 mẫu (360×740), velvet/classic 390×844, song-hy 1366×680. Vừa: classic 1950, kraft 2070, song-hy 1970, lace 1970, minimal 1770, velvet 2150ms | Thiếu chỗ cho tên khách → E01. Thẻ đè tên cặp đôi giữa lúc mở → E04 |
| R02 | ✅ (ảnh mẫu) | Section Cảm ơn ở 3 theme: chữ trắng đọc rõ trên lớp phủ đều + vùng tối sau khối chữ | Vẫn phải kiểm lại bằng ảnh thật, vùng sáng nhất (như frontend đã ghi) |
| R03 | ✅ (code + unit test) | `SOFT_SELECTOR` = `.hero-names, .ann-names, .ann-invite, .sec-head`, alpha 0.3, +8px, ≤ 4 vùng | Chưa đo alpha bằng pixel. Ảnh hero không thấy hạt nào đậm đè lên tên |
| R04 | ✅ | Khung +1000ms ở countdown (3 theme): chùm nổ nằm dưới/cạnh ô số, không đè tiêu đề. Theme sáng là sao nhỏ màu vàng/accent, không còn "bụi nâu" | |
| R05 | ✅ | Khung 120ms: `.cv-actions` đã mờ + trượt xuống ở mọi mẫu | |
| R06 | ✅ | Trầm Vàng: "Chúng mình sắp cưới!" 1 dòng ở 360. Đêm Nhung (Imperial Script): lời chào chuyển sang heading italic, 2 dòng cân | |
| R07 | ✅ | `.divider` cao 0px. Ornament "khâu" lên ranh giới, nền = nền section phía sau, không còn dải sọc thứ ba | |
| R08 | ✅ | `.hero-names` padding-inline .18em (9.36px ở 52px) | |
| R09 | ✅ | Đêm Nhung: `.hero-names` 48.6px (≥ 46), `.ty-sig` 44px | |
| R10 | ✅ | `.cd-l` 12px, `.ev-badge` 12px. Quét toàn trang: 0 chữ < 12px | |
| R11 | ✅ | Chip 44px, 1 hàng cuộn ngang có mép mờ ở 360 | |
| R12 | ✅ | Cuộn xuống: ẩn. Cuộn lên: hiện. Đứng yên 2.6s: ẩn. Tự cuộn chạy: ẩn | Nút tự cuộn (đã dừng) lại gây chồng lấn mới → E05 |
| R13 | ✅ | Cánh hồng hình giọt ngược 2 lớp (DPR 3). Ở Trầm Vàng ra màu vàng/accent, đúng spec | |
| R14 | ✅ | Divider/title mới ở 3 bộ. Song hỷ hình học thay hộp quà ở Son Đỏ | |
| R15 | ✅ | Lời mời không còn chữ mồ côi; tên khách đậm (`.ann-guest`) | |
| R16 | ✅ | Dấu sáp giọt + vành trong, 57.6px ở 360, monogram ≥ 4.99:1 (classic) | Desktop: seal nhỏ so với phong bì 560px → E09 |
| R17 | ✅ | 1440×900: phong bì 560, nền radial, ornament góc 120px | |
| R18 | ✅ | Chip tĩnh "Còn 64 ngày" ở 3 theme | |
| R19 | ✅ | Đêm Nhung: nút tròn có viền + vòng vàng, thấy rõ ranh giới | |
| R20 | ✅ | 360: "Chỉ đường" / "Thêm vào lịch" không sát viền | |
| R21 | ✅ | Lời nhắn Mừng cưới 4 dòng → căn trái, 34ch | |
| R22 | ✅ | `.btn-sm { min-height:44px }`. Quét trang: 0 vùng chạm < 44px | |
| R24 | ✅ | Hero Đêm Nhung: chấm vàng nhỏ, có quầng, không còn hạt nâu đục | |

Kiểm tra chung: không cuộn ngang ở 360, không có lỗi console của app (chỉ có lỗi websocket HMR do cách chụp, không liên quan). Reduced-motion: cover mờ ~200ms (gỡ sau ~320ms), không tạo canvas, nút tự cuộn ở trạng thái "Tiếp tục tự cuộn", không tự chạy.

---

## 3. Điểm cần sửa mới

| ID | Mức | Vị trí | Hiện trạng | Đề xuất | Ai làm |
|---|---|---|---|---|---|
| E01 | **Cao** (chặn phát hành) | `styles/cover.css` `.env-guest` (line-clamp 2 + overflow hidden). Hộp `.env-addr` (top = mũi nắp + seal/2) | Đo ở 360×740: vùng chữ chỉ còn ~57px cho prefix + 2 dòng (≈ 57.4px), nên dòng cuối tràn 1–3px và **dấu nặng bị cắt**. "Gia đình anh chị Nguyễn **Văn Manh** và các cháu" (Trầm Vàng + classic, mặc định), "Phương" thay "Phượng". Có ở classic, kraft, song-hy, lace, velvet × 3 theme (so ảnh bị clamp với ảnh không clamp). `minimal` không bị. Kraft ở son-do (Noto Serif Display rộng hơn): 3 dòng, cắt thành "và.." | (1) **Bỏ `-webkit-line-clamp` và `overflow:hidden`** trên `.env-guest`. (2) Auto-fit theo bậc bằng đo layout: 22 → 19 → 17 → 15px; ≤ 2 dòng ở 3 bậc đầu, cho phép **3 dòng ở 15px**. Giới hạn 60 ký tự + "…" (3.3) vẫn giữ, nên không bao giờ quá 3 dòng. (3) `line-height:1.3` + `padding-block:.08em` để dấu chồng (ễ, ỗ) và dấu nặng (ạ, ợ) có chỗ. (4) Cho `.env-addr` thêm chỗ: `top: calc(var(--env-tip) + var(--seal) * .42)` thay cho `/2 + 2px` (seal là hình tròn nên dưới mũi nắp còn khoảng trống hai bên). (5) Test e2e: chụp `.env-guest` khi bật và tắt `overflow:visible`, 2 ảnh phải giống hệt, với 3 tên mẫu có dấu nặng ở dòng cuối | frontend |
| E02 | **Cao** | `cover/skins/kraft.ts` (dây trên `.env-deco` z5) + `.cover[data-env="kraft"] .env-addr` | Dây gai dọc vẽ **đè lên thẻ tên**, gạch ngang qua chữ ("an\|h", "\|à các cháu") ở mọi theme. Thẻ tên cao 33%, nên tên dài bị cắt (E01) | (1) Thẻ tên nằm **trên** dây: đưa `.env-addr` của kraft lên `z-index: 6`, hoặc vẽ đoạn dây dọc phía dưới nút chỉ tới mép trên thẻ (thẻ "treo" từ nút nơ, đúng ý tưởng 4.2). (2) Thẻ rộng 72% (đang 64%), cao 40% (đang 33%), `bottom: 6%`. (3) Auto-fit như E01. Pha mở khoá giữ nguyên (dây trượt ra 2 bên) | frontend |
| E03 | Vừa | Nếp gấp túi `SEAMS_V` / song-hy `seams` + `.env-addr` | Hai đường chéo từ góc đáy tới (150,118)/(190,118) **cắt ngang chữ địa chỉ** ở classic, lace, velvet (viền vàng kép, rõ nhất), song-hy, và ở desktop (1 dòng chạm 2 đầu chữ). Giảm khả năng đọc tên khách, cũng là chữ quan trọng nhất trên phong bì | Thêm "vùng nhãn" tĩnh sau chữ, không animate: `.env-addr::before { content:""; position:absolute; inset:-6% -8%; background: radial-gradient(closest-side, var(--env-paper) 62%, transparent); z-index:-1 }` (`.env-addr` cần `isolation:isolate`). Nếp gấp mờ dần dưới chữ như mực in đè lên giấy. Kraft không cần vì đã có thẻ | frontend |
| E04 | Vừa | `cover/styles/envelope.ts` `play()`: `head` mờ tại `dropAt` (~1150ms) | 650–1150ms: mũi nắp đã mở và thẻ đang rút lên **đè lên giữa tên cặp đôi** (khung 700/950/1200: "Mi‿Anh", nắp song-hy cắt qua "Thuỳ Linh"). Ở cấp Nhẹ, thẻ dừng ở vị trí rút, đè tên rồi cả cover mờ | Mờ `.cv-head` sớm: `opacity 1→0` + `translateY(-8px)` trong `[flapAt + 200, pullAt + 250]` (~380–900ms ở Vừa, ~120–450ms ở Nhẹ), `--ease-out`. Thẻ rút lên vào vùng đã trống, tên không bị "cắt" giữa chừng. Không đổi tổng thời lượng | frontend |
| E05 | Vừa | `autoscroll.ts` nút `.fl-auto` (`order:-1`, trên nút nhạc) | Sau khi khách dừng, nút "▶↓ Tiếp tục tự cuộn" **hiện suốt tới cuối trang**, ở mép phải x 298–342. Ở 360 nó che chữ căn giữa và nút: ")" cuối dòng "(Tức ngày … Bính Ngọ)", mép phải nút **"Gửi lời chúc"** (vùng chạm chồng nhau), sát "Thêm vào lịch". Đúng loại lỗi R12 vừa sửa, nay do nút khác gây ra | Khi `state=stopped`: **ẩn trong lúc khách đang tự cuộn** (opacity 0 + `pointer-events:none`, 160ms), hiện lại sau khi đứng yên 1.2s. Ẩn hẳn khi focus ở trong form (như quy tắc ẩn pill khi bàn phím mở, 7.1). Khi đang chạy thì giữ như hiện tại (khách cần nút Dừng). Vẫn đáp ứng WCAG 2.2.2 vì chuyển động đã dừng | frontend (designer cập nhật 5.11/7.1 sau) |
| E06 | Vừa | Biến `--env-*` mặc định (classic/minimal/lace "Theo theme") khi `data-mode="dark"`; lace trên theme sáng | Đêm Nhung + classic/minimal: giấy = `--c-surface` = đúng màu giữa nền cover (**1.00:1**), viền 1.32:1, nên **không đọc ra phong bì**, chỉ thấy seal và chữ trôi nổi. Lace tối: giấy/nền 1.22:1, mép ren 1.08:1 (vô hình). Lace sáng: mép ren 1.25–1.39:1, khó thấy. (Mặc định Đêm Nhung là `velvet` nên ổn; lỗi chỉ xảy ra khi admin chọn mẫu khác) | Dark: `--env-paper: color-mix(in srgb, var(--c-surface) 86%, var(--c-accent) 14%)`, `--env-edge: color-mix(in srgb, var(--c-accent) 55%, transparent)`, `.env-back` thêm viền sáng `0 0 0 1px color-mix(in srgb, var(--c-accent) 30%, transparent)`. Lace: `.lc-h` stroke = `--env-liner` opacity .55 (mép ren ≥ 2:1 với giấy). Mục tiêu: ranh giới phong bì ≥ 1.5:1 với nền, mép nắp/ren ≥ 2:1 | frontend |
| E07 | Thấp | `.vv-glow` (velvet) khi `data-env-themed` + theme sáng | Quầng đỏ `#7A1E2C` cố định trên giấy trắng thành vệt hồng loang, trông như vết bẩn (tram-vang/son-do "Theo theme") | Khi themed + mode light: `.vv-glow { stop-color: var(--c-primary); stop-opacity:.10 }` hoặc bỏ quầng | frontend |
| E08 | Thấp | `minimal` `.env-prefix::after { content:" ·" }` | Tên khách xuống dòng thì "KÍNH GỬI ·" còn dấu chấm treo ở cuối dòng | Chỉ thêm "·" khi tên vừa 1 dòng (`.env-addr:not(.is-multi) .env-prefix::after`). Nhiều dòng thì prefix thành dòng riêng, căn giữa | frontend |
| E09 | Thấp | `.env-seal --seal: clamp(52px,16vw,64px)` | Desktop: seal 64px trên phong bì 560px (11% bề rộng) trông nhỏ, monogram 16px khó thấy ở khoảng cách màn lớn | `--seal: clamp(52px, calc(var(--env-w) * .165), 92px)` (mobile vẫn ~52–58px). Monogram `calc(var(--seal) * .26)` | frontend |
| E10 | Thấp | `.fl-tip` (tooltip nhạc, bottom 58px, ~240px) | Hình chữ nhật của tooltip (y 633–666) trùng nút tự cuộn (y 620–664) khi tooltip hiện (tên bài 3s đầu, "Bấm để bật nhạc"), nên che nút Dừng đúng lúc tự cuộn sắp chạy | Tooltip đặt **bên trái** nút nhạc: `right: 60px; bottom: 6px` (mũi tên chỉ sang phải) | frontend |
| E11 | Thấp | `floating.ts` `is-mini` theo hướng cuộn + timer 800ms | Lúc tự cuộn `flow` dừng 1.2s ở mỗi section, pill giãn ra sau 800ms rồi thu lại, nên nháy ở mỗi section. Spec 5.11: giữ mini suốt lúc tự cuộn | Khi `autoscroll-change(true)`: giữ `is-mini`, bỏ qua timer. `false`: theo luật cũ | frontend |
| E12 | Thấp | Cấp Nhiều (lệch #4 của frontend) | Cả 6 mẫu ở cấp Nhiều chạy giống Vừa (thời lượng y hệt) | Chấp nhận để v4 (cần module `red-paper` và hạt trên cover). Tới lúc đó, admin vẫn được chọn Nhiều cho phần landing; không cần ghi chú riêng cho phong bì | frontend (v4) |

---

## 4. Đánh giá từng mẫu phong thư

Bảng tương phản đo trên màu đã tính của trình duyệt (chữ trên giấy hoặc trên thẻ tên):

| Mẫu | Trầm Vàng | Son Đỏ | Đêm Nhung | Màu "Theo theme" | Nhận xét |
|---|---|---|---|---|---|
| `classic` ★ | Chữ 15.4:1 · prefix 6.3:1 · seal 4.99:1 | 15.6 · 7.7 | 13.7 · 7.0 · seal vàng 9.4 | (mặc định theo theme) | **Tốt trên theme sáng**: giấy trắng có bóng đổ, lót sọc, dấu sáp sang. Timeline mượt và đúng 3.2. Trên theme tối gần như vô hình (E06). Chịu E01, E03 |
| `kraft` | Thẻ tên 12.6:1 · 8.4 | 12.6 (tên bị cắt "và..") | 12.6 | Sáng: giấy be + dây primary (son-do dây đỏ rất đẹp). Tối: giấy nâu + dây vàng, ổn | Ý tưởng mộc, thẻ nghiêng −3° rất có hồn. Nơ tuột + dây trượt ra 2 bên đọc rõ ở khung 120–260ms. **Dây đè chữ (E02)** là lỗi lớn nhất của mẫu này |
| `song-hy` | 6.9:1 · 5.7 (cố định) | 6.9 · 5.7 | 6.9 · 5.7 | Sáng: giấy primary nâu + vàng, 4.99:1, đạt sát ngưỡng. Tối: giấy vàng + mực tối 9.4:1 | **Đẹp nhất trên Son Đỏ**: đỏ son, viền kép, mây chìm vừa đủ, huy hiệu 囍 rõ. Nắp vát tù ~148° (spec 150°). Huy hiệu xoay + vệt sáng nhanh, gọn. Thẻ trong màu ngà viền đỏ. Chịu E01, E03 (nếp gấp dốc hơn nên cắt qua chữ nhiều hơn) |
| `lace` | 13.7:1 · 5.6 | 13.8 · 6.8 | 11.2 · 5.7 | (theo theme) | Mép ren và cụm hoa ép tinh tế nhưng **quá nhạt**: ren 1.25–1.39:1 trên theme sáng, vô hình trên theme tối (E06). Cụm hoa ~28px hơi nhỏ so với seal của mẫu khác (gợi ý 40px). Nên đánh giá lại trên `hong-phan` (theme gợi ý) khi có dịp |
| `minimal` | 15.4:1 · sticker 6.8 | 15.6 · 6.7 | 13.7 · sticker 3.3 | (theo theme) | Dòng "KÍNH GỬI · Gia đình anh Mạnh" kiểu tem nhãn đẹp, **là mẫu duy nhất không bị cắt dấu**. Nắp chữ nhật thấp + sticker bóc: tổng 1.77s, ngắn nhất, đúng tinh thần. Giấy trắng và thẻ trắng không tách nhau khi thẻ rút ra (chấp nhận được với phong cách tối giản). Dấu "·" treo (E08). Tối: vô hình (E06). Chữ sticker 3.3:1 ở Đêm Nhung là chữ trang trí 14px, nên đẩy lên ≥ 4.5 bằng `--c-on-accent` |
| `velvet` | 15.0:1 · 9.4 (cố định) | 15.0 · 9.4 | 13.7 · 7.0 (theo theme) | Sáng: giấy trắng + quầng hồng (E07) | **Đẹp nhất trên Đêm Nhung**: viền vàng kép art-deco, quầng đỏ, seal vàng đồng có chiều sâu. Trên theme sáng (màu cố định) cũng nổi bật như một "phong bì dạ tiệc". Dài nhất (2.15s, vẫn ≤ 2.4). Chịu E01 rõ nhất ("Văn Manh"), E03 (viền vàng cắt chữ) |

**Theo cấp / reduced-motion (cả 6 mẫu):** Tắt = fade 200ms. Nhẹ = 870ms (spec ~1.1s, ngắn hơn chấp nhận được), không có lời chào và thẻ không về giữa. Vừa = 1.77–2.15s. Nhiều = như Vừa (E12). Reduced-motion = fade, vẫn vẽ skin tĩnh. Không có khung nào cắt thẻ ở cấp nào.

**Bố cục theo kích thước:** 360×740 và 390×844: toàn bộ cover nằm gọn trong `100svh`, CTA ở 1/3 dưới (đáy 601/668px), không cuộn. 360×640: vừa, không tràn. 1366×680: phong bì co còn 400px theo chiều cao, đúng ý R17. 1440×900: 560px, cân đối; seal nhỏ (E09).

---

## 5. Lệch "hình nắp phong bì chỉnh nhẹ" (frontend-report 7.1): **chấp nhận, có điều kiện**

- **Đã thay đổi gì:** túi bắt đầu từ góc (y=.5, spec là 6.5). Mũi nắp từ y≈124 (52%) xuống 131–137 (`tipY` 132, 55.5%). Nắp dốc hơn túi. Song-hy: túi vát nông `164,44`, nắp `tipY 47`.
- **Đánh giá thị giác:** khi đóng, nắp phủ kín mép túi ở cả 6 mẫu, không còn khe nêm lộ thẻ trắng. Đây là lỗi thật trong bản vẽ 3.2 của mình (2 cạnh nắp và túi song song nên để hở khe), sửa như vậy là đúng. Mũi 55.5% vẫn khớp mô tả "nắp chạm ~55%" của 3.2. Khi lật, nắp quay quanh mép trên gọn, z-index đổi ở 50% không thấy giật. Góc nắp song-hy ~148° đúng ý "vát tù". **Thẻ 92%×90%** (thay vì "cao 128%") cũng chấp nhận: con số 128% trong spec mâu thuẫn với "nằm hẳn trong bao", và `cardTravel` tính theo kích thước thật đã giữ thẻ trong viewport.
- **Hệ quả cần xử lý:** mũi nắp hạ ~7.5px (ở 360px) làm vùng địa chỉ dưới seal chỉ còn ~57px. Đây là một phần nguyên nhân của E01. **Điều kiện chấp nhận:** sửa E01 (bỏ clamp + auto-fit + `.env-addr` bắt đầu từ `tip + seal × .42`). Không cần kéo nắp lên lại.
- Các lệch khác trong báo cáo (bước z-index thẻ 2→7, bao mờ nhanh, R18 chip tĩnh, R21 heuristic, bỏ dấu ":" sau "Kính gửi", poster admin giản lược) đều hợp lý, không cần sửa.

---

## 6. Tự cuộn: kết quả đo (360×740, Trầm Vàng, mặc định 45px/s, flow)

| Hạng mục | Spec 5.11 | Đo được | Kết quả |
|---|---|---|---|
| Bắt đầu | cover gỡ + 2.5s, tăng tốc 800ms | Bắt đầu di chuyển ~4.5s sau khi chạm (cover 1.95s + 2.5s), tăng dần mượt | ✅ |
| Tốc độ | 45 × clamp(740/800) ≈ 41.6px/s | 43–45px/s theo cửa sổ ~1s (lấy mẫu bằng setTimeout nên lệch vài %; code có áp `screenFactor`) | ✅ Dễ đọc lướt |
| Dwell | 1.2s khi đầu section chạm 18% | Dừng 1.47s tại y=607 (= couple top 740 − 133) | ✅ (thêm 0.27s do tăng tốc lại) |
| Dừng khi chạm | dừng hẳn + toast lần đầu, không tự tiếp tục | Chạm → `stopped`, toast "Đã dừng tự cuộn · bấm ▶ để tiếp tục" hiện phía trên cụm nút, 3s sau y không đổi | ✅ |
| Tiếp tục | không áp startDelay | Bấm nút → `running` ngay, +40px sau 1.5s (đang tăng tốc) | ✅ |
| Nút | 44px, trên nút nhạc, safe-area, Tab sau nút nhạc | 44×44 ở (298,620), cách nút nhạc 48px đúng 12px, `bottom: 16px + safe-area`. DOM sau nút nhạc. Nhãn "Dừng tự cuộn"/"Tiếp tục tự cuộn", `aria-pressed` | ✅ (E05, E10 về chồng lấn) |
| Pill | thu nhỏ suốt lúc tự cuộn | Thu nhỏ khi đang chạy, giãn ra ở mỗi lần dwell | ⚠️ E11 |
| Scroll-top | ẩn khi tự cuộn | ẩn | ✅ |
| Reduced-motion | không tự chạy, nút ở trạng thái dừng | `scrollY` 0 sau 4s, nút "Tiếp tục tự cuộn" | ✅ |
| Hạt / pháo hoa / reveal | gió bỏ qua tự cuộn; countdown dừng 2s | Theo code + unit test. Pháo hoa nổ ngoài vùng tiêu đề/ô số. Reveal chạy kịp trong lúc dwell | ✅ |

---

## 7. Câu hỏi cho người duyệt (kèm giả định mặc định)

1. **E01, tên khách dài trên phong bì:** bỏ giới hạn 2 dòng, tự giảm cỡ chữ và cho tối đa **3 dòng** ở cỡ nhỏ nhất (15px), để không bao giờ mất dấu hay mất chữ. *Giả định: đồng ý.* (Phương án khác: giữ 2 dòng và cắt bằng "…" ở cuối, nhưng vẫn phải chừa chỗ cho dấu nặng. Mình không khuyên vì "Gia đình anh chị Nguyễn Văn Mạnh và các…" làm mất phần cuối của lời gửi.)
2. **E05, nút "Tiếp tục tự cuộn" sau khi khách đã dừng:** ẩn trong lúc khách tự cuộn và hiện lại khi khách đứng yên 1.2s. *Giả định: đồng ý.* (Phương án khác: luôn hiện như hiện tại, chấp nhận nút che mép phải nội dung.)
3. **E02, mẫu kraft:** dây gai dừng ở mép trên thẻ tên ("thẻ treo trên dây"), không chạy xuyên qua thẻ. *Giả định: đồng ý.*
4. **E06, theme tối với mẫu classic/minimal/lace:** pha thêm 14% màu accent vào giấy và làm viền sáng hơn, nên phong bì "Theo theme" trên theme tối sẽ hơi ánh vàng thay vì cùng màu nền. *Giả định: đồng ý.*
5. **E12, cấp Nhiều của phong bì** (bụi vàng ở seal, xác pháo đỏ cho song-hy, cánh hoa cho lace, gold-dust cho velvet) để tới v4, trong lúc đó Nhiều chạy như Vừa. *Giả định: đồng ý.*
6. **Lệch hình nắp:** chấp nhận hình học mới (mũi nắp 55.5%, túi từ góc), với điều kiện sửa E01. *Giả định: đồng ý, mình sẽ cập nhật SVG trong design.md 3.2 cho khớp code khi được giao.*
