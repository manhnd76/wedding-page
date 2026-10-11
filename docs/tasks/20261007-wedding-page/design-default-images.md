# Design: Ảnh mặc định + bộ hiệu ứng trọn gói (task 20261007-wedding-page)

Người viết: ui-ux-designer. Ngày: 2026-10-11. Phạm vi: chỉ đề xuất (không sửa code, `public/`, `img/`). Áp dụng theo decisions "Ảnh mặc định từ /img (2026-10-11)".

## Tiến độ
- [x] 1. Mô tả 9 ảnh
- [x] 2. Chọn bộ hiệu ứng (+ dự phòng)
- [x] 3. Gán ảnh vào slot + focal point + kiểm tra tương phản
- [x] 4. Ghi chú tối ưu ảnh cho FE + alt text
- [x] 5. Khối JSON đề xuất + câu hỏi cho người duyệt
- Render thử: dev server 5181 đã dừng (PID của mình). Script và ảnh tạm nằm trong scratchpad của phiên; ảnh bằng chứng ở `screenshots/default-images/`.

## 1. Mô tả 9 ảnh (PNG gốc trong `img/`, kích thước đo từ header PNG)

Đặc điểm chung: minh hoạ anime kiểu Ghibli, nét mảnh, tô màu phẳng có vân giấy/màu nước. Hai nhóm rõ ràng:
- **Nhóm "ảnh cưới" (trang trọng):** #3, #6, #9 (studio nền trơn), #1 (lễ rước dâu áo dài đỏ).
- **Nhóm "chuyện tình" (đời thường, ngoài trời):** #4, #5, #7 (xanh lá, trời xanh, nắng), #8 (phố, tường đá), #2 (selfie trong nhà).

Tông màu tổng của bộ: **xanh lá cây + xanh trời** (4/9 ảnh), **kem/đào ấm** (#9, #2), **ghi than** (#3, #6), **đỏ + hồng** (#1). Không có tím, không có vàng kim.

| # | File (tên ngắn) | Kích thước · tỉ lệ | Tông màu / mood | Bố cục, chỗ trống cho chữ | Hợp slot |
|---|---|---|---|---|---|
| 1 | Anime Vietnamese Wedding Under Red Ribbons (`ribbons`) | 1536×1024 · 3:2 ngang | Đỏ son (áo dài cô dâu chú rể) + hồng phấn (áo dài bạn bè) + hoa xanh lam/hồng, cỏ xanh; nắng gắt, bão hoà cao. Vui, náo nhiệt, rất "đám cưới Việt" (cổng hoa, bạn bè giăng dây đỏ chặn cửa) | Cặp đôi ở giữa (x 34–71%), mặt ở y 30–45%. Khung dày đặc chi tiết, không có vùng trơn cho chữ. Bạn bè hai bên bị cắt mép | **og** (ảnh ngang duy nhất đủ rộng 1536 ≥ 1200, không phải phóng to), **album** (ảnh ngang mở đầu). Không hợp hero dọc (cắt 9:16 chỉ còn 576 px ngang) |
| 2 | Cozy Bunny-Eared Anime Selfie (`bunny`) | 1448×1086 · 4:3 ngang | Vàng cam ấm, ánh đèn trong nhà, chăn hoa đỏ; áo khoác xanh rêu + áo xám. Dễ thương, đùa nghịch, rất riêng tư | Hai khuôn mặt chiếm gần hết khung, cận mặt, không chỗ cho chữ | Chỉ hợp **album** ở cuối (ảnh "hậu trường"). Xem 3.6 |
| 3 | Elegant Groom in a Charcoal Suit (`groom`) | 1024×1536 · 2:3 dọc | Nền ghi than loang vệt chéo, vest đen hai hàng khuy, cài hoa vàng. Lịch lãm, tĩnh | Toàn thân, mặt ở y 14–20%, x 40–58%. Nền trơn tối | **couple.groom** (cặp với #6, cùng nền ghi) |
| 4 | Ghibli-Style Couple in a Flower Field (`flower-field`) | 1254×1254 · 1:1 | Trời xanh lam + mây trắng, cánh đồng cúc trắng-vàng, cây xanh; áo khoác nâu/kem. Tươi sáng, trong trẻo, đúng chất Ghibli | Cặp đôi giữa-phải, mặt y 18–38%. Vùng trời trên-phải trống nhưng **rất sáng** (chữ trắng không đọc được) | **album** (ảnh vuông), **ảnh trong cửa/polaroid cover** (vuông, cắt giữa vẫn giữ mặt) |
| 5 | Joyful Anime Park Piggyback Moment (`piggyback`) | 1149×1369 · ~5:6 dọc | Xanh lá đậm (tán cây), áo polo xanh ngọc, nắng. Hồn nhiên, vui nhộn | Cặp đôi góc dưới-trái, mặt y 44–58%; nửa trên là tán cây | **album** |
| 6 | Serene Anime Bride with Lily Bouquet (`bride`) | 1024×1536 · 2:3 dọc | Nền ghi than, váy cưới trắng trễ vai, bó hoa ly trắng. Dịu dàng, thanh lịch | Mặt y 13–22%, x 38–56%. Nửa dưới là chân váy trắng rất sáng | **couple.bride** (cặp với #3) |
| 7 | Sunlit Park Couple in Anime Style (`park`) | 1334×1179 · ~9:8 | Xanh lá + xanh ngọc (áo polo đôi), trời xanh góc phải; nắng. Ấm áp, gần gũi, nắm tay | Hai mặt nhìn nhau ở y 24–40%; giữa ảnh là áo + tay nắm tay (vùng màu trung bình-tối, đều màu) | **thank-you** (vùng giữa đủ tối cho chữ trắng, xem 3.4), **album** |
| 8 | Watercolor Anime Couple by Lotus Wall (`lotus-wall`) | 1024×1536 · 2:3 dọc | Tường đá xanh xám, hoạ tiết hoa sen đỏ đất; áo măng tô kem + vest đen. Trầm, kiểu "pre-wedding phố" | Toàn thân giữa khung. **Tường có chữ khắc tiếng Việt bị AI vẽ méo** ("ân dân", "ân loại", "Chủ … Ch…uh", "TRUYỀN THỐNG TR…", "…NG VĂN TẢI DO G…") ngay sau đầu cặp đôi và giữa ảnh, không cắt bỏ được | Chỉ **album** (có điều kiện, xem 3.6). Không dùng hero/og/cover |
| 9 | Watercolor Anime Wedding Portrait (`portrait`) | 1024×1536 · 2:3 dọc | Nền giấy màu nước **đào/kem ấm**, váy ren trắng có voan, vest đen, hoa tulip trắng. Trang trọng, ấm, "ảnh cưới chính thức" | Đôi đứng giữa, mặt y 15–25%; khoảng trống nền ở đỉnh và hai bên; **nửa dưới là váy trắng rất sáng** | **hero** (ảnh cưới đẹp nhất, dọc, đủ phân giải). Cảnh báo tương phản chữ trắng trên mobile, xem 3.3 |

## 2. Bộ hiệu ứng đề xuất

### 2.1 Chính: **Hoa Lá Màu Nước (`mau-nuoc`) + 2 thay thế để né lỗi B4**

| Thành phần | Giá trị | Theo theme? | Lý do |
|---|---|---|---|
| Theme preset | `mau-nuoc` | | Bộ ảnh là **minh hoạ màu nước kiểu Ghibli**: 2/9 file có chữ "Watercolor" trong tên, 4/9 ảnh ngoài trời nền xanh lá. Xanh xô thơm `#4E6B4A` + hồng phấn `#E9C2B8` là hai màu nhạt của chính bộ ảnh (lá cây, má hồng, nền đào ảnh #9). Theme sáng nên không "chói" như Đêm Nhung với ảnh sáng |
| Màu chủ đạo | **không override** (`primaryColor: null`) | ✓ | Xanh xô thơm trầm hơn xanh lá trong ảnh nên làm nền cho ảnh, không tranh màu. primary/bg 5.58:1, text/bg 12.92:1 (design 1.6.3) |
| Font | `preset: "theme"` = EB Garamond / Alex Brush / Nunito | ✓ | Nunito bo tròn hợp nét anime mềm; Alex Brush cho tên cặp đôi giữ chất "thiệp cưới". Đều có subset vietnamese (design 2.2) |
| Texture | **`paper`** (thay `watercolor-wash`) | ✗ override | **Né lỗi B4/T02**: `watercolor-wash` đang là "khối mây dán" phẳng (design-review-v4a-1-2b T02). Bản thân ảnh đã có vân giấy màu nước, `paper` (noise .05) đủ cảm giác giấy vẽ. Hệ quả: mất vệt màu loang ở góc section, bù bằng hoạ tiết `la-canh` ở góc (dưới) |
| Khung ảnh | `wash-mask` (mép loang) | ✓ | Mép loang biến 2 chân dung nền ghi than (#3, #6) thành "bức màu nước trên giấy", nối với phong cách ảnh. Không dính lỗi B4 (dùng `frames/wash-mask.svg` riêng) |
| Divider | `brush-stroke` | ✓ | |
| Bộ ornament | `watercolor` | ✓ | Vệt màu của ornament là path tô token (design 1.6.7a), không dùng asset lỗi |
| Kiểu mở thiệp | **`flower-gate`** (thay `ink-spread`) | ✗ override | **Né lỗi B4/O04**: cover `ink-spread` của Màu Nước là cover "trơn nhất trong 12 theme". `flower-gate` là cổng hoa vector tô theo token (lá `--op-leaf` xanh, hoa `accent-2` hồng phấn): đúng chất "vườn hoa" của ảnh #4, #5, #7. Họ "cổng" lộ **landing thật** khi cánh hoa dạt ra, nên khách thấy ngay ảnh cưới hero phía sau cổng hoa. Chi phí Vừa, ~1.8s |
| Mẫu phong bì | không áp dụng (chỉ dùng khi kiểu mở = `envelope`) | | Nếu người duyệt muốn giữ phong bì: `lace` (gợi ý của theme) |
| Nền cover | `paper` (không ảnh mờ) | | Cổng hoa đã nhiều chi tiết; ảnh mờ .35 phía sau làm rối biển chữ |
| Hạt nền (≤ 2) | `leaf-green` + `petal-watercolor`, màu `multi` | ✓ | Lá xanh khớp tán cây ảnh #5, #7; cánh màu nước tô accent/accent-2. Mật độ theo cường độ Vừa |
| Burst sau mở | `petals` | ✓ | Nối tiếp 24 cánh hoa mà `flower-gate` đã bắn ở t=300ms: cánh hoa từ cổng "rơi tiếp" vào hero, không đổi giọng (confetti sẽ lạc tông vườn hoa) |
| Gói reveal / B1 | `style: "theme"` = `soft`; `mode: "auto"` (xen kẽ soft + editorial + letter) | ✓ | Soft (fade-up + photo-settle) hợp ảnh minh hoạ tĩnh; xen kẽ tự động tránh đơn điệu ở 13 section |
| Hoạ tiết nền B2 | **`la-canh` (Cành lá) · `corners` · `light` (Nhạt) · motion `auto`** | ✗ (theme mặc định tắt; `la-canh` là gợi ý ★ của theme) | Thay phần "trang trí góc" mà `watercolor-wash` lẽ ra mang lại. Góc: opacity = min(.10×3, cap .39, .8) = **.30** màu accent `#A9C3A0`; cap .39 bảo đảm chữ vẫn ≥ 4.5:1 (design 1.7.5). Chỉ 1 kiểu đặt, không `pattern`/`title` (không chồng sau chữ) |
| Cường độ | `medium` (Vừa) | | Giữ mặc định đã duyệt; máy yếu tự hạ cấp |
| Micro, parallax, Ken Burns, auto-scroll | giữ như config hiện tại | | Ken Burns trên hero dọc chỉ zoom 1.08, không cắt mặt (đã tính focal ở 3.1) |

**Hệ quả của việc chọn `mau-nuoc` (theo yêu cầu nêu rõ):**
1. Phải ghi đè 2 thành phần (`theme.texture: "paper"`, `cover.openStyle: "flower-gate"`). Hai lỗi T02/O04 **không xuất hiện** với cấu hình này vì cả hai chỉ xảy ra khi texture = `watercolor-wash` hoặc kiểu mở = `ink-spread`.
2. Nếu admin bấm "Theo theme" cho texture hoặc kiểu mở, lỗi B4 sẽ quay lại. Khi B4 được sửa, có thể trả cả hai về `"theme"`.
3. Không cần sửa code để dùng bộ này (trừ đề xuất scrim hero ở 3.3, áp cho mọi theme).

### 2.2 Dự phòng: **Hồng Phấn (`hong-phan`) trọn gói, không override**

`hong-phan`: Lora / Dancing Script / Quicksand · ornament `romantic` · texture `paper` · khung `arch-double` · divider `leaf-branch` · mở thiệp `flower-gate` · hạt `petal-rose` + `heart` · burst `petals` · reveal `soft` (B1 auto) · hoạ tiết nền: tắt (hoặc `la-canh` corners Nhạt như bản chính, cap .34 → opacity .30).
- Lý do: hồng phấn `#A4495A` lấy từ áo dài hồng của bạn bè và dây đỏ ở ảnh #1, má hồng của mọi nhân vật; hồng + xanh lá là cặp bổ sung tự nhiên (hoa + lá) nên các ảnh công viên vẫn hợp. **Không có lỗi asset nào đang hoãn**, không cần ghi đè.
- Kém hơn bản chính ở chỗ: nghiêng "lãng mạn cổ điển", không bắt được chất màu nước/Ghibli; khung vòm `arch-double` cắt mất 2 góc trên của chân dung (đầu vẫn còn vì đã crop chừa khoảng trên).
- Đã loại: `pastel-han` (tím khói không có trong ảnh; kiểu mở `polaroid` cắt ảnh hero ở giữa khung 0.84 mà không theo focalPoint nên mất đầu chú rể), `son-do` (chỉ hợp 1/9 ảnh), `dem-nhung` (ảnh sáng + nền tối gây chói, design 1.6.5), `tram-vang` (vàng kim không có trong ảnh, hoạ tiết bị cap .05).

## 3. Gán ảnh vào slot

Toạ độ crop là **pixel trên ảnh PNG gốc** `[x, y, w, h]`; focalPoint theo schema (0–1, guest áp thành `object-position`). Tỉ lệ slot lấy từ `SLOT_SPECS` (`src/admin/media/image-pipeline.ts`). Không phóng to: mọi nguồn đều nhỏ hơn maxEdge nên giữ đúng kích thước vùng crop.

### 3.1 Bảng gán

| Slot (đường dẫn config) | Ảnh | Crop `[x,y,w,h]` → đầu ra | focalPoint | Ghi chú |
|---|---|---|---|---|
| `content.hero.image` (hero, 9:16) | #9 portrait | `[80,0,864,1536]` → **864×1536** | `{x:.5, y:.12}` | Mobile: ảnh cao đúng màn, chỉ cắt 2 mép ngang. Desktop (cột ảnh 58% ≈ 835×900): y .12 giữ trọn đầu chú rể cả khi Ken Burns zoom 1.08 (ảnh `04`). **Cần scrim mới, xem 3.3** |
| `cover.backgroundImage` | không dùng (`null`), `cover.background: "paper"` | | | `flower-gate` thuộc họ cổng: khi mở, cổng dạt ra để lộ hero thật nên không cần ảnh cover riêng. Bỏ ảnh cover cũ (`serene-anime-bride-with-lily-bou.98cf0d8d.webp`) |
| `content.couple.groom.photo` (4:5) | #3 groom | `[130,40,720,900]` → **720×900** | không cần | Từ đầu tới hông, mặt ≈ 22% chiều cao khung (≈ 53px ở khung 240px) |
| `content.couple.bride.photo` (4:5) | #6 bride | `[150,80,720,900]` → **720×900** | không cần | Cùng cỡ mặt với chú rể, giữ bó hoa ly. Hai ảnh cùng nền ghi than nên đứng cạnh nhau rất đồng bộ |
| `content.families.*.photo` | không dùng, giữ `showPhotos: false` | | | Bộ ảnh không có ảnh bố mẹ; dùng ảnh cặp đôi cho "Nhà trai/Nhà gái" là sai nghĩa |
| `content.thankyou.photo` (slot `other`, 1200) | #7 park | toàn ảnh → **1200×1061** | `{x:.36, y:.2}` | x .36 giữ mặt cô dâu trên mobile (khung 0.58); y .2 giữ hai khuôn mặt trên desktop 2:1. Chữ nằm trên vùng áo và hai bàn tay nắm nhau |
| `meta.ogImage` (og, 1200×630 JPEG) | #1 ribbons | `[110,70,1300,682]` → **1200×630** | | Ảnh ngang duy nhất đủ rộng (không phải phóng to). Áo dài đỏ nổi bật ở thumbnail Zalo/Messenger; cắt vuông ở giữa (kiểu Zalo hay cắt) vẫn còn trọn cặp đôi (đã thử) |
| `content.album.images` (album, ≤1600, thumb 600) | 8 ảnh, xem 3.2 | toàn ảnh, không crop | | |

### 3.2 Album: thứ tự và lý do (`layout: masonry`, `previewCount: 6`)

Masonry dùng CSS `columns` (ảnh xếp theo cột: mobile 2 cột, từ 768px là 3 cột). Thứ tự trong mảng được chọn để **chiều cao các cột cân nhau** ở 6 ảnh đầu (đơn vị = cao/rộng): mobile cột 1 = .67+1.5+1.19 = 3.36, cột 2 = 1.0+1.5+.88 = 3.38; desktop 3 cột = 2.17 / 2.19 / 2.38.

| # | Ảnh | Tỉ lệ | Vì sao ở vị trí này |
|---|---|---|---|
| 1 | #1 ribbons | 3:2 | Mở đầu bằng khoảnh khắc ngày cưới kiểu Việt (rước dâu) |
| 2 | #6 bride (toàn thân 1024×1536) | 2:3 | Trên mobile đứng ngang hàng chú rể (#5): cặp chân dung đối xứng (ảnh `06`) |
| 3 | #5 piggyback | ~5:6 | |
| 4 | #4 flower-field | 1:1 | |
| 5 | #3 groom (toàn thân) | 2:3 | |
| 6 | #7 park | ~9:8 | |
| 7 | #9 portrait (toàn thân, không crop) | 2:3 | Ẩn sau nút "Xem tất cả" vì đã là hero |
| 8 | #2 bunny | 4:3 | Ảnh "hậu trường" cuối album, ẩn sau nút "Xem tất cả" |

Album dùng bản **không crop** của #3, #6, #9 (file khác với couple/hero) để lightbox xem được toàn thân.

### 3.3 Hero: độ tương phản chữ trắng trên ảnh (mobile), **cần sửa scrim**

Đo trên pixel thật (script canvas chạy trong Chrome, mô phỏng `object-fit: cover` + `.hero-shade` hiện tại, vùng chữ 330×330px phía dưới màn 390×844, theme `mau-nuoc`):

| Phương án | Tương phản chữ trắng: trung vị | Pixel sáng p90 | p98 | Kết luận |
|---|---|---|---|---|
| #9 portrait + scrim hiện tại (`--c-overlay` .45 ở đáy → đen .25 ở 45% → trong suốt ở 75%) | **2.62:1** | 2.18:1 | 2.05:1 | **Không đạt** cả ngưỡng 3:1 cho chữ lớn (tên) lẫn 4.5:1 cho chữ thường (ngày, âm lịch). Ảnh `02-hero-mobile-390-scrim-hien-tai.png`: "&" và dòng âm lịch gần như mất trên nền váy trắng |
| #9 portrait + **scrim đề xuất** (dưới) | **7.24:1** | **5.17:1** | 3.90:1 | Đạt: 90% pixel sau chữ ≥ 4.5:1, mọi pixel sau tên ≥ 3:1. Ảnh `03-hero-mobile-390-scrim-de-xuat.png` |
| (không cần sửa code) #1 ribbons cắt 9:16 `[505,0,576,1024]` | 8.31:1 | 3.24:1 | 2.28:1 | Đạt cho tên, sát ngưỡng cho chữ nhỏ. Nhưng nguồn chỉ rộng 576px nên bị phóng ~1.6× trên màn DPR 2, nét anime bị mềm; sau tên lại rất nhiều chi tiết |
| #8 lotus-wall cắt 9:16 | 9.18:1 | 3.12:1 | 2.33:1 | Không dùng (chữ AI vẽ méo, xem 3.6) |

Đây là **lỗi chung, không riêng bộ ảnh này**: ảnh cưới thật đa số có váy trắng ở 1/3 dưới, đúng chỗ đặt tên trên mobile. Đề xuất FE sửa 1 luật trong `src/guest/styles/sections.css`, dòng `.hero-shade`, chỉ cho theme sáng (luật `[data-mode="dark"] .hero-shade` giữ nguyên):

```css
.hero-shade {
  background: linear-gradient(to top,
    color-mix(in srgb, var(--c-text) 85%, transparent) 0%,
    color-mix(in srgb, var(--c-text) 72%, transparent) 36%,
    color-mix(in srgb, var(--c-text) 30%, transparent) 55%,
    transparent 72%);
}
```
- Dùng `--c-text` của theme (Màu Nước: xanh rêu đậm `#243024`) thay cho màu đen, nên phần chân váy ngả sang tông lá cây chứ không xám bẩn; 45% phía trên ảnh (mặt, bó hoa) không bị phủ.
- Desktop ≥1024px không bị ảnh hưởng (`.hero-shade` đã `display:none`, chữ nằm ở cột nền).
- Cần người duyệt đồng ý vì thay đổi giao diện hero của mọi theme sáng. Nếu không đồng ý: dùng phương án #1 ribbons ở bảng trên.

### 3.4 Lời cảm ơn: độ tương phản

`.ty-shade` = `--c-overlay` (.45) phủ đều + vignette đen .28 ở giữa. Đo vùng chữ giữa section:

| Ảnh | Mobile 390×675 (trung vị / p90) | Desktop 1440×720 (trung vị / p90) |
|---|---|---|
| **#7 park (chọn)**, focal `.36/.2` | **7.95 / 4.32** | **8.08 / 5.16** |
| #5 piggyback | 9.43 / 5.06 | 6.35 / 5.12 |
| #4 flower-field | 7.44 / 4.47 | 6.91 / 5.30 |
| #1 ribbons | 9.87 / 3.80 | 10.9 / 5.19 |

Cả 4 ảnh đều dùng được (còn có thêm `text-shadow 0 1px 14px rgba(0,0,0,.45)`). Chọn #7 vì chữ nằm trên vùng áo polo và tay nắm tay (màu đều), không đè lên mặt như #5 (mặt nằm giữa ảnh), và hình ảnh "nắm tay" hợp ý "cảm ơn". Ảnh `07-thankyou-mobile-390.png`, `08-thankyou-desktop-1440.png`.

### 3.5 Kết quả render thử (bằng chứng)
Render trên dev server 5181 với config đề xuất, nạp qua preview stash + route interception (không sửa `public/`). Ảnh nằm trong `screenshots/default-images/`:
| File | Nội dung | Nhận xét |
|---|---|---|
| `01-cover-mobile-390.png` | Cover `flower-gate` Màu Nước, trạng thái đóng | Cổng hoa hồng phấn + lá xô thơm, biển chữ đọc rõ; không còn cover "trơn" của lỗi O04 |
| `02-…scrim-hien-tai.png` / `03-…scrim-de-xuat.png` | Hero mobile trước/sau khi sửa scrim | Xem 3.3 |
| `04-hero-desktop-1440.png` | Hero desktop | Ảnh tông đào ấm cạnh nền xô thơm nhạt, tên bằng Alex Brush màu primary: hài hoà |
| `05-couple-mobile-390.png` | Couple, khung `wash-mask`, hoạ tiết góc `la-canh` | Mép loang biến chân dung nền ghi thành "tranh màu nước"; cành lá ở góc phải trên nhạt vừa đủ |
| `06-album-mobile-390.png` | Album, 6 ảnh đầu | 2 cột cân nhau; cặp chân dung cô dâu/chú rể đứng cạnh nhau |
| `07`, `08` | Lời cảm ơn mobile/desktop | Đọc rõ. Có phát hiện phụ S2 (dưới) |
| `10-du-phong-hong-phan-couple-390.png` | Dự phòng Hồng Phấn, khung `arch-double` | Vòm không cắt đầu chú rể (crop đã chừa khoảng phía trên) |

### 3.6 Ảnh không dùng / dùng hạn chế
- **#8 Lotus Wall: KHÔNG dùng làm mặc định.** (1) Trên tường có chữ tiếng Việt do AI vẽ **méo, vô nghĩa** ("ân dân", "ân loại…", "Chủ … Ch…uh", "TRUYỀN THỐNG TR…", "…NG VĂN TẢI DO G…") nằm ngay sau đầu cặp đôi và giữa ảnh, không crop bỏ được. Người Việt nhìn là đọc ra ngay, làm mẫu mặc định mất uy tín (người dùng đánh giá độ tin cậy của giao diện trong ~50ms, Lindgaard et al. 2006). (2) Bức tường giống bia khẩu hiệu ngành giao thông có kèm tên lãnh tụ: ngữ cảnh không hợp thiệp cưới. Vẫn giữ PNG trong `img/` nếu người duyệt muốn dùng sau (vd sửa tay vùng chữ).
- **#2 Bunny selfie: chỉ dùng ở cuối album** (ẩn sau nút "Xem tất cả"). Không hợp hero/cover/og/lời cảm ơn/couple: ảnh cận mặt trong nhà, đồ mặc nhà, không có chỗ trống cho chữ, giọng đùa nghịch lệch với phần trang trọng. Trong album đây là ảnh "hậu trường" thân mật (cả hai đều đeo nhẫn) nên vẫn có giá trị kể chuyện.
- **Chân dung #3/#6 không dùng cho `families`** (sai nghĩa "Nhà trai/Nhà gái").
- **#1 ribbons**: có biển chữ nhỏ bị méo ở cổng hoa ("Đ…"), chỉ thấy rõ khi phóng to trong lightbox. Chấp nhận được (xem câu hỏi 6).

### 3.7 Phát hiện phụ (ngoài phạm vi, ghi lại để orchestrator xếp vào backlog)
| ID | Mức | Vấn đề | Bằng chứng | Gợi ý |
|---|---|---|---|---|
| S1 | Vừa | `.hero-shade` không đủ che khi nửa dưới ảnh sáng (mọi theme sáng) | 3.3, ảnh `02` | Scrim ở 3.3 |
| S2 | Thấp | Lời cảm ơn trên desktop: tiêu đề script bị ngắt "Trân trọng cảm / ơn", rớt 1 chữ xuống dòng (Alex Brush rộng, khung 32ch) | `08-thankyou-desktop-1440.png` | `text-wrap: balance` cho `.h2-script` hoặc nới `.ty-content` lên 36ch ở desktop |
| S3 | Thấp | `polaroid` / `moon-gate` (`open-kit/photo.ts`, `.pl-img`, `.mg-img`) không áp `focalPoint` của ảnh hero: ảnh 9:16 vào khung polaroid ~0.84 bị cắt giữa → với #9 mất đỉnh đầu chú rể | Tính từ crop: khung giữ y 254–1283/1536, tóc chú rể bắt đầu ở y≈150 | Gắn `object-position` theo `focalPoint` giống `img()` trong `sections/common.ts`. Không ảnh hưởng bộ chính (dùng `flower-gate`) |
| S4 | Thấp | `tests/e2e/guest.spec.ts:208` tự skip test phong bì khi config mẫu không dùng `envelope` → đổi mẫu sang `flower-gate` làm mất độ phủ e2e của đường mặc định cũ | Đọc code | FE/QA quyết: giữ skip, hoặc ép `envelope` trong test như test E01 ở dòng 297 |

## 4. Ghi chú cho FE khi tối ưu ảnh

**Nguyên tắc: làm giống hệt pipeline admin** (`processImage` trong `image-pipeline.ts`) để ảnh mặc định không khác ảnh người dùng tự tải lên: encoder WebP của Chrome canvas, bậc chất lượng `[.82, .74, .66, .58]` dừng ở bậc đầu tiên ≤ `targetBytes`; OG là JPEG `[.85, .77, .69, .61]`; tên file `content/images/<dir>/<base>.<hash8>.<ext>` (hash8 = 8 ký tự đầu SHA-256 của bytes, `safeBase` ≤ 32 ký tự ASCII); `dominantColor` = `dominant()`; hero có `lqip` (JPEG 24px, q .5); album có thumb cạnh dài 600px (`<base>-thumb.<hash8>.webp`, target 80KB). Cách nhanh nhất: chạy chính `processImage` trong Playwright/Chrome với `crop` ở bảng 3.1 rồi ghi file ra.

Dung lượng **đo thật** bằng encoder Chrome (cùng bậc chất lượng như trên):

| File (dir / base) | Nguồn → kích thước | Định dạng · q | Đo được | Target slot |
|---|---|---|---|---|
| `hero/le-cuoi-chan-dung` + lqip | #9 crop → 864×1536 | WebP .82 | **84KB** | 300KB |
| `couple/chu-re` | #3 crop → 720×900 | WebP .82 | 25KB | 200KB |
| `couple/co-dau` | #6 crop → 720×900 | WebP .82 | 34KB | 200KB |
| `thankyou/cam-on-cong-vien` | #7 → 1200×1061 | WebP .74 (q .82 = 197KB > 200 000 byte) | 148KB | 200KB |
| `og/og-ruoc-dau` | #1 crop → 1200×630 | **JPEG** .85 | 143KB | 250KB |
| `album/01-ruoc-dau` | #1 → 1536×1024 | WebP .82 | 180KB | 300KB |
| `album/02-co-dau` | #6 → 1024×1536 | WebP .82 | 53KB | 300KB |
| `album/03-cong-ken` | #5 → 1149×1369 | WebP .82 | 258KB | 300KB |
| `album/04-canh-dong-hoa` | #4 → 1254×1254 | WebP .82 | 218KB | 300KB |
| `album/05-chu-re` | #3 → 1024×1536 | WebP .82 | 40KB | 300KB |
| `album/06-cong-vien` | #7 → 1334×1179 | WebP .82 | 202KB | 300KB |
| `album/07-anh-cuoi` | #9 → 1024×1536 | WebP .82 | 91KB | 300KB |
| `album/08-tai-tho` | #2 → 1448×1086 | WebP .82 | 113KB | 300KB |
| `album/*-thumb` (8 file) | cạnh dài 600 | WebP .82 | 17–47KB/ảnh | 80KB |

- **Trang đầu chỉ tải ~84KB ảnh** (hero, LCP, `fetchpriority=high`); các ảnh còn lại lazy. Tổng repo ~1.6MB thay cho 21MB PNG.
- **Không phóng to** ảnh nào (mọi nguồn ≤ maxEdge). Không dùng AVIF (pipeline admin không có, Safari cũ không hỗ trợ).
- **Xoá file cũ không còn được tham chiếu**: `cover/serene-anime-bride-with-lily-bou.98cf0d8d.webp`, `couple/elegant-groom-in-a-charcoal-suit.a3f3d115.webp`, `couple/serene-anime-bride-with-lily-bou.df43f61c.webp`, `hero/hero.6c286d3b.svg`, `thankyou/thankyou.17db1789.svg`, `album/album-0[1-8].*.svg`. Trước khi xoá SVG placeholder, grep `tests/` và `scripts/gen-placeholders.mjs` (một số unit test/fixture có nhắc `content/images`).
- Ảnh là minh hoạ phẳng, nhiều mảng màu đều nên nén rất tốt (hero chỉ 84KB ở q .82). Lưu ý: ảnh render ở 3.5 dùng PNG đã crop, chưa phải WebP đã nén. FE nhìn lại hero và couple ở tỉ lệ 1:1 sau khi nén để chắc nét line-art không bị viền nhoè; nếu có thì giữ q .82 cho hero (vẫn dư nhiều so với target).

**Alt text tiếng Việt** (mô tả nội dung, không lặp chữ "ảnh của"; tên lấy từ config mẫu, nếu người dùng đổi tên thì admin sửa alt):

| Ảnh / slot | `alt` |
|---|---|
| hero (#9) | `Minh Anh và Thuỳ Linh trong trang phục cưới, cô dâu ôm bó tulip trắng` |
| couple.groom (#3) | `Chú rể Nguyễn Minh Anh mặc vest đen hai hàng khuy` |
| couple.bride (#6) | `Cô dâu Trần Thuỳ Linh trong váy cưới trắng trễ vai, cầm bó hoa ly` |
| thankyou (#7) | `Minh Anh và Thuỳ Linh ngồi trên cỏ, nắm tay nhau trong công viên` |
| og (#1) | `Minh Anh và Thuỳ Linh mặc áo dài đỏ trong lễ rước dâu` |
| album 01 (#1) | `Lễ rước dâu: cô dâu chú rể mặc áo dài đỏ đi qua hàng dây đỏ bạn bè giăng` |
| album 02 (#6) | `Cô dâu Thuỳ Linh trong váy cưới trắng trễ vai` |
| album 03 (#5) | `Minh Anh cõng Thuỳ Linh dạo công viên` |
| album 04 (#4) | `Hai bạn tựa vai nhau giữa cánh đồng hoa cúc dưới trời xanh` |
| album 05 (#3) | `Chú rể Minh Anh trong bộ vest đen` |
| album 06 (#7) | `Hai bạn ngồi trên cỏ, nắm tay và nhìn nhau cười` |
| album 07 (#9) | `Ảnh cưới chân dung: cô dâu váy ren trắng, chú rể vest đen` |
| album 08 (#2) | `Hai bạn đeo băng đô tai thỏ, chống cằm cười` |

## 5. Khối JSON đề xuất (cho FE áp dụng)

Dạng **merge patch** (RFC 7396) lên `public/content/config.json` hiện tại: chỉ ghi trường thay đổi, mảng thì thay nguyên. `<h8>` = hash8 do FE tính, `"<dom>"` = `dominantColor` từ `dominant()`, `"<lqip>"` = data URL do pipeline sinh. Hai trường `fonts`/`effects.particles` đã là `"theme"`, ghi lại cho rõ ý định. Áp xong chạy `migrate` + `mergeWithDefaults` (unit test `autoscroll.test.ts` đọc config mẫu: không đổi `autoScroll`).

```json
{
  "meta": {
    "ogImage": { "src": "content/images/og/og-ruoc-dau.<h8>.jpg", "w": 1200, "h": 630,
      "alt": "Minh Anh và Thuỳ Linh mặc áo dài đỏ trong lễ rước dâu", "dominantColor": "<dom>" }
  },
  "theme": {
    "preset": "mau-nuoc",
    "primaryColor": null,
    "overrides": {},
    "ornamentSet": "theme",
    "texture": "paper",
    "photoFrame": "theme",
    "motif": { "set": "la-canh", "placements": ["corners"], "intensity": "light", "motion": "auto" }
  },
  "fonts": { "preset": "theme", "heading": "theme", "script": "theme", "body": "theme", "scaleStep": 0 },
  "effects": {
    "intensity": "medium",
    "particles": { "enabled": true, "types": "theme", "color": "theme" },
    "burst": { "onOpen": "theme" },
    "reveal": { "style": "theme", "heading": null, "block": null, "image": null, "ornament": null, "mode": "auto", "sections": {} }
  },
  "cover": {
    "openStyle": "flower-gate",
    "background": "paper",
    "backgroundImage": null
  },
  "content": {
    "hero": {
      "image": { "src": "content/images/hero/le-cuoi-chan-dung.<h8>.webp", "w": 864, "h": 1536,
        "alt": "Minh Anh và Thuỳ Linh trong trang phục cưới, cô dâu ôm bó tulip trắng",
        "dominantColor": "<dom>", "lqip": "<lqip>", "focalPoint": { "x": 0.5, "y": 0.12 } }
    },
    "couple": {
      "groom": { "photo": { "src": "content/images/couple/chu-re.<h8>.webp", "w": 720, "h": 900,
        "alt": "Chú rể Nguyễn Minh Anh mặc vest đen hai hàng khuy", "dominantColor": "<dom>" } },
      "bride": { "photo": { "src": "content/images/couple/co-dau.<h8>.webp", "w": 720, "h": 900,
        "alt": "Cô dâu Trần Thuỳ Linh trong váy cưới trắng trễ vai, cầm bó hoa ly", "dominantColor": "<dom>" } }
    },
    "families": { "showPhotos": false },
    "thankyou": {
      "photo": { "src": "content/images/thankyou/cam-on-cong-vien.<h8>.webp", "w": 1200, "h": 1061,
        "alt": "Minh Anh và Thuỳ Linh ngồi trên cỏ, nắm tay nhau trong công viên",
        "dominantColor": "<dom>", "focalPoint": { "x": 0.36, "y": 0.2 } }
    },
    "album": {
      "layout": "masonry",
      "previewCount": 6,
      "images": [
        { "src": "content/images/album/01-ruoc-dau.<h8>.webp", "thumb": "content/images/album/01-ruoc-dau-thumb.<h8>.webp", "w": 1536, "h": 1024, "alt": "Lễ rước dâu: cô dâu chú rể mặc áo dài đỏ đi qua hàng dây đỏ bạn bè giăng", "dominantColor": "<dom>" },
        { "src": "content/images/album/02-co-dau.<h8>.webp", "thumb": "content/images/album/02-co-dau-thumb.<h8>.webp", "w": 1024, "h": 1536, "alt": "Cô dâu Thuỳ Linh trong váy cưới trắng trễ vai", "dominantColor": "<dom>" },
        { "src": "content/images/album/03-cong-ken.<h8>.webp", "thumb": "content/images/album/03-cong-ken-thumb.<h8>.webp", "w": 1149, "h": 1369, "alt": "Minh Anh cõng Thuỳ Linh dạo công viên", "dominantColor": "<dom>" },
        { "src": "content/images/album/04-canh-dong-hoa.<h8>.webp", "thumb": "content/images/album/04-canh-dong-hoa-thumb.<h8>.webp", "w": 1254, "h": 1254, "alt": "Hai bạn tựa vai nhau giữa cánh đồng hoa cúc dưới trời xanh", "dominantColor": "<dom>" },
        { "src": "content/images/album/05-chu-re.<h8>.webp", "thumb": "content/images/album/05-chu-re-thumb.<h8>.webp", "w": 1024, "h": 1536, "alt": "Chú rể Minh Anh trong bộ vest đen", "dominantColor": "<dom>" },
        { "src": "content/images/album/06-cong-vien.<h8>.webp", "thumb": "content/images/album/06-cong-vien-thumb.<h8>.webp", "w": 1334, "h": 1179, "alt": "Hai bạn ngồi trên cỏ, nắm tay và nhìn nhau cười", "dominantColor": "<dom>" },
        { "src": "content/images/album/07-anh-cuoi.<h8>.webp", "thumb": "content/images/album/07-anh-cuoi-thumb.<h8>.webp", "w": 1024, "h": 1536, "alt": "Ảnh cưới chân dung: cô dâu váy ren trắng, chú rể vest đen", "dominantColor": "<dom>" },
        { "src": "content/images/album/08-tai-tho.<h8>.webp", "thumb": "content/images/album/08-tai-tho-thumb.<h8>.webp", "w": 1448, "h": 1086, "alt": "Hai bạn đeo băng đô tai thỏ, chống cằm cười", "dominantColor": "<dom>" }
      ]
    }
  }
}
```

Kèm theo (không nằm trong config): **CSS scrim hero ở 3.3** (`src/guest/styles/sections.css`), chờ người duyệt đồng ý.

Bộ dự phòng `hong-phan`: thay khối `theme` bằng `{ "preset": "hong-phan", "primaryColor": null, "overrides": {}, "ornamentSet": "theme", "texture": "theme", "photoFrame": "theme", "motif": { "set": "theme", "placements": "theme", "intensity": "theme", "motion": "auto" } }` và `cover.openStyle: "theme"` (= `flower-gate`); phần ảnh giữ nguyên.

## 6. Câu hỏi cho người duyệt (giả định đang dùng ghi trong ngoặc)
1. Đồng ý cho FE sửa scrim hero (3.3), áp cho mọi theme sáng? (Giả định: **đồng ý**. Nếu không: hero dùng #1 ribbons cắt 9:16, chấp nhận ảnh hơi mềm.)
2. Chọn `mau-nuoc` có 2 ghi đè (texture `paper`, mở thiệp `flower-gate`) hay `hong-phan` không ghi đè? (Giả định: **`mau-nuoc`**; khi B4 sửa xong có thể trả 2 trường về "Theo theme".)
3. Loại #8 Lotus Wall khỏi nội dung mặc định? (Giả định: **loại**, giữ PNG trong `img/`.)
4. Dùng #2 Bunny selfie ở cuối album (ẩn sau "Xem tất cả")? (Giả định: **có**.)
5. Ảnh chia sẻ OG dùng #1 rước dâu (đỏ, rất "đám cưới Việt") thay vì ảnh cưới #9? (Giả định: **#1**.)
6. Chấp nhận biển chữ nhỏ bị méo trên cổng hoa ở #1 (chỉ thấy rõ khi phóng to)? (Giả định: **chấp nhận**.)
7. Bật thêm hoạ tiết nền `la-canh` ở góc (Nhạt) để bù cho texture màu nước bị tắt? (Giả định: **bật**; muốn giữ đúng "theo theme" thì đặt `motif.set: "theme"` = tắt.)
8. Phần "Chuyện chúng mình" (`loveStory`, đang tắt) có thể dùng #4/#5 làm ảnh minh hoạ. Có bật không? (Giả định: **không**, ngoài phạm vi lần này.)
