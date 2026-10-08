# Design - 20261007-wedding-page (Thiệp cưới online + Admin)

> Tác giả: ui-ux-designer · Ngày: 2026-10-07 · Trạng thái: BẢN NHÁP chờ duyệt
> Phạm vi: chỉ thiết kế UI/UX. Kiến trúc, lưu trữ, schema config, cơ chế publish/backup/login là phần của `solution.md`. Chỗ nào design phụ thuộc vào đó được ghi **Giả định**.
> **Bản sửa 2 (2026-10-07, sau Cổng 1):** theo mục "Bổ sung từ người duyệt" trong `decisions.md`, mình mở rộng thư viện lên **12 theme** (mục 1.6), thêm **12 kiểu mở thiệp** (3.4b), danh mục hạt, reveal và micro-interaction (5.6 đến 5.10), admin gallery theme và trình chọn hiệu ứng (8.12, 8.13), phụ lục schema (cuối file). Các phần mới được đánh dấu **(mới)**. Mặc định không đổi: Trầm Vàng, phong bì, cường độ "Vừa".
> **Bản sửa 3 (2026-10-07, sau "Quyết định vòng 2" trong `decisions.md` và mục "Còn mở" của `solution.md`):** `dem-nhung` có trong bản đầu (không mặc định); hạt nền mặc định **cả trang** với cơ chế giảm mật độ/né form (5.7); pháo hoa đếm ngược chạy **mỗi lần cuộn tới** có cooldown (5.7); link khách thêm toggle "Mã hoá link" (8.9); vẽ màn **Kết nối lần đầu** (8.2b); sửa luồng ảnh và câu chữ khôi phục cho khớp cơ chế "restore cả lần xuất bản gần nhất" (8.7, 8.10); album full thống nhất **1600px**; bỏ nút "Tự tính" âm lịch (8.11); mục 10 chuyển thành danh sách quyết định đã chốt. Các phần sửa được đánh dấu **(v3)**.
> **Bản sửa 4 (2026-10-08, sau "Quyết định sau review visual v1" trong `decisions.md`):** đưa vào design các nội dung người duyệt đã chốt từ `design-review-v1.md`: **bố cục phong bì mới** (tên cặp đôi ở trên, NGOÀI phong bì; "Kính gửi + tên khách" in trên mặt phong bì) và timeline mở mới (3.2, 3.4); **6 mẫu phong thư** + field `cover.envelope.*` + map gợi ý theo 12 theme (3.4c, 8.13); **tự động cuộn BẬT mặc định** (5.11, thay câu "Tự cuộn: tắt" cũ); **vùng dịu** hạt nền mờ 0.3 ở chữ quan trọng (5.7); **pháo hoa không đè tiêu đề** + màu theo sáng/tối (5.7); và các quyết định visual khác trong 24 điểm R01 đến R24 (2.1, 2.4, 4.x, 7.1). Phần sửa đánh dấu **(v4)**. SVG đầy đủ của ornament, phong bì và seal nằm ở `design-review-v1.md` mục 3 (là một phần của spec này, không chép lại để file gọn).
> Nguồn tham khảo: `request.md`, `wedding-site/data/config.js`, dự án cũ `wedding-site/` (style.css có 4 theme: tram-vang, xanh-ngoc, hong-phan, xanh-navy), trang mẫu thiepmoicuoi.vn (đã tải HTML và phân tích cấu trúc, font).

---

## 0. Học được gì từ trang tham khảo (thiepmoicuoi.vn)

Phân tích HTML thật của trang mẫu: font dùng Playfair Display, Cormorant Garamond/Upright, Great Vibes, Imperial Script, Dancing Script, Be Vietnam Pro; luồng: phong bì, rút thẻ ra khỏi bao ("Kính mời Gđ ac Mạnh Hường", "Chạm để mở thiệp"), sau đó tới các section đánh số 01 đến 08 (Cô dâu chú rể, Gia đình, Báo tin, Album, Tiệc cưới, Lịch trình, Sổ lưu bút, Mừng cưới, Đếm ngược, Cảm ơn, RSVP), cuối cùng là footer của đơn vị làm thiệp.

**Nên học lại:**
- Màn phong bì có tên khách riêng, nên khách thấy "thiệp này gửi cho mình". Đây là khoảnh khắc cảm xúc mạnh nhất.
- Mỗi section có tiêu đề hai tầng: eyebrow tiếng Anh nhỏ ("The Bride & Groom") và tiêu đề tiếng Việt lớn. Đọc lướt rất dễ (F-pattern) mà vẫn sang.
- Có ngày âm lịch, giờ đón khách và giờ khai tiệc tách riêng, có nút "Chỉ đường" theo từng sự kiện. Đúng thứ khách Việt cần.
- Mừng cưới mở dạng hộp thoại có QR, nút "Sao chép STK" và báo "Đã copy". Lời chúc thật hiển thị công khai nên tạo cảm giác đông vui.

**Nên làm tốt hơn:**
1. Số thứ tự section bị cố định trong HTML. Ở bản của mình, số được **tính tự động theo các section đang bật**, nên tắt hay đổi thứ tự cũng không bị nhảy số.
2. Icon dùng ký tự (♪ ♫ ✦ × ‹ ›) và emoji, hiển thị khác nhau tùy máy, screen reader đọc sai. Đổi sang **bộ icon SVG thống nhất** có `aria-label`.
3. Sổ lưu bút là một danh sách rất dài, cuộn lồng bên trong và phải "cuộn lên để xem cũ hơn" (scroll trap trên mobile). Đổi sang hiện 6 lời chúc kèm nút "Xem thêm", không cuộn lồng.
4. Hộp thoại mừng cưới bắt "bấm vào nền để đóng". Thêm nút Đóng 44px rõ ràng, vuốt xuống để đóng, phím Esc.
5. Đếm ngược hiện "D- 0 00 00" khi đã qua ngày. Cần thiết kế đủ 3 trạng thái: trước, trong ngày, sau ngày.
6. RSVP chỉ nằm ở cuối trang. Thêm nút "Xác nhận tham dự" ngay trong từng thẻ sự kiện và trong menu nổi. Điền sẵn tên khách lấy từ link.
7. Thêm "Thêm vào lịch" (.ics) cho từng sự kiện; bản đồ chỉ tải khi bấm (click-to-load) để nhẹ trang.
8. Tôn trọng `prefers-reduced-motion`, có mức cường độ animation, cẩn thận ngân sách hiệu năng cho Android tầm thấp.

---

## 1. Định hướng thẩm mỹ và Theme preset

### 1.1 Định hướng: "Thiệp giấy biên tập" (editorial paper)
Không đi theo kiểu template SaaS (gradient tím, card ở khắp nơi). Hình mẫu là **thiệp in cao cấp chuyển lên màn hình**:
- Nền giấy ngà có **texture giấy nhẹ** (SVG noise, opacity 0.04 đến 0.06), không dùng màu phẳng trắng tinh.
- Chữ là nhân vật chính: tên cô dâu chú rể dùng font script cỡ rất lớn, tiêu đề serif tương phản cao, nhảy cỡ chữ mạnh (tên 64px so với body 16px là khoảng 4 lần).
- Ảnh dùng **khung vòm (arch)** và khung bo nhẹ, có viền mảnh màu accent lệch 6px (kiểu passe-partout), không dùng card đổ bóng dày.
- Họa tiết dùng ít mà chắc: một bộ ornament SVG line-art (cành lá, đường kẻ có hình thoi ở giữa) tô theo `--accent`.
- Bố cục mobile căn giữa ở **các khối mang tính nghi lễ** (tên, ngày, lời mời), vì thiệp giấy truyền thống cũng căn giữa và khối chữ ở đây ngắn. **Đoạn văn dài, form, danh sách sự kiện thì căn trái** (đúng nghiên cứu left-side bias và F-pattern của NN/g). Không căn giữa đoạn văn quá 3 dòng.

### 1.2 Token màu (CSS variables)
Mọi màu trong UI chỉ được lấy từ token, không hardcode hex trong component.

| Token | Vai trò |
|---|---|
| `--c-primary` | Nút chính, link, số đếm ngược, tiêu đề phụ. **Bắt buộc ≥ 4.5:1 so với `--c-bg`** |
| `--c-on-primary` | Chữ trên nền primary |
| `--c-accent` | Chỉ để trang trí: ornament, viền ảnh, cánh hoa, gạch chân. **Không dùng cho chữ** (thường < 3:1) |
| `--c-bg` | Nền trang (giấy) |
| `--c-surface` | Nền section xen kẽ, sheet, card form |
| `--c-text` | Chữ chính |
| `--c-muted` | Chữ phụ (âm lịch, địa chỉ, nhãn). Bắt buộc ≥ 4.5:1 |
| `--c-line` | Đường kẻ, viền input (≥ 3:1 với nền cho viền input) |
| `--c-overlay` | Lớp phủ lên ảnh để chữ trắng đọc được |
| `--c-success` / `--c-danger` | Trạng thái form (luôn kèm icon + chữ, không chỉ dùng màu) |

### 1.3 Bốn preset (đã đo tương phản WCAG 2.1)

Tỉ lệ dưới đây do mình tính bằng công thức relative luminance của WCAG.

**A. "Trầm Vàng": Ngà & Vàng đồng (MẶC ĐỊNH)**
Mood: cổ điển, ấm, sang trọng nhẹ. Hợp ảnh cưới tông ấm và tiệc nhà hàng.
| Token | Hex | Kiểm tra |
|---|---|---|
| primary | `#8A6A3B` | trên bg 4.68:1 (AA), chữ trắng trên primary 4.99:1 (AA) |
| accent | `#C9A86A` | 2.12:1, chỉ trang trí |
| bg | `#FBF7F0` | |
| surface | `#FFFFFF` | |
| text | `#2B2320` | trên bg 14.42:1 (AAA) |
| muted | `#6B5E55` | trên bg 5.86:1 (AA) |
| line | `#D9CDBE` | |

**B. "Hồng Phấn": Blush & Hồng đất**
Mood: lãng mạn, mềm, trẻ. Hợp cưới ngoài trời, ảnh tông pastel.
| primary `#A4495A` (5.22:1 trên bg, chữ trắng 5.71:1) | accent `#E3BDB5` (trang trí) | bg `#FBF3F1` | surface `#FFFFFF` | text `#3A2428` (13.12:1) | muted `#75585D` (5.80:1) | line `#E6D3CF` |

**C. "Lục Bảo": Xanh ngọc đậm & Champagne**
Mood: thanh lịch, sang, khác biệt so với đa số thiệp hồng/vàng. Hợp tiệc tối, khách sạn.
| primary `#1F5A4A` (7.04:1, chữ trắng 8.02:1, AAA) | accent `#C2A26A` | bg `#F3F0E8` | surface `#FFFDF8` | text `#1E2A25` (13.05:1) | muted `#56645D` (5.46:1) | line `#D5D2C6` |

**D. "Son Đỏ": Đỏ son & Vàng kim (truyền thống Việt)**
Mood: lễ ăn hỏi, vu quy, họa tiết song hỷ, mây. Hợp gia đình thích truyền thống.
| primary `#A3201D` (7.16:1, chữ trắng 7.55:1) | accent `#D4A23C` | bg `#FFF8EE` | surface `#FFFFFF` | text `#3B1A14` (14.82:1) | muted `#6E4A40` (7.33:1) | line `#EBD6B8` |
Preset D đổi luôn bộ ornament sang "song hỷ / mây cát tường" (`ornamentSet: "traditional"`).

*(**(v3)** Theme tối "Đêm Nhung" (`dem-nhung`: nền `#1C1517`, text `#F2E9E1` 14.99:1, primary `#D9B77E` 9.43:1) **có trong bản đầu** theo quyết định vòng 2, nhưng không phải mặc định. Xem 1.6.)*

Mapping với 4 theme cũ: `tram-vang` thành A, `hong-phan` thành B, `xanh-ngoc` thành C, `xanh-navy` bỏ (thay bằng D, vì navy trùng mood với C). **Giả định:** solution giữ khóa `theme` cũ để tương thích ngược.

> **(mới)** Bốn preset A đến D ở trên được giữ nguyên và trở thành 4 theme đầu của thư viện 12 theme ở **mục 1.6**. "Đêm Nhung" ở chú thích trên đã được nâng thành theme chính thức `dem-nhung`, có trong bản đầu, không mặc định (đã chốt vòng 2).

### 1.4 Admin chỉnh "màu chủ đạo": suy ra token
Admin chọn preset (nạp cả bộ token) **rồi** có thể đổi `primaryColor`. Khi đổi primary, các token khác **suy ra tự động** trong JS lúc tải trang (không dùng CSS relative-color syntax vì Android WebView cũ chưa hỗ trợ). Tính trong không gian **OKLCH** để giữ sắc độ đồng đều:

```
Đầu vào: P = primaryColor (admin chọn) -> (L, C, H) theo OKLCH
bg       = oklch(0.975, min(C*0.12, 0.012), H)      // giấy ngả nhẹ theo màu chủ đạo
surface  = oklch(0.995, min(C*0.06, 0.006), H)
text     = oklch(0.24,  min(C*0.35, 0.035), H)
muted    = oklch(0.47,  min(C*0.30, 0.040), H)
line     = oklch(0.86,  min(C*0.25, 0.030), H)
accent   = (nếu admin không tự chọn) oklch(0.76, min(C*0.7, 0.10), H + 25°)
primary  = P; NẾU contrast(P, bg) < 4.5 thì giảm L từng bước 0.02 tới khi đạt >= 4.5
           (giữ màu gốc P làm --c-primary-decor cho ornament/cánh hoa)
onPrimary= trắng #FFFFFF nếu contrast >= 4.5, ngược lại dùng text
overlay  = rgba(text, 0.45)
```
- Có **"chế độ nâng cao"** để admin ghi đè từng token, mỗi ô màu có **badge tương phản** ("AA ✓ 5.2:1" / "Không đạt ✗ 3.1:1"). Khi không đạt thì hiện cảnh báo vàng nhưng vẫn cho lưu (tôn trọng quyền quyết định), riêng `text/bg < 4.5` thì chặn publish và đề nghị "Tự sửa".
- Color picker có sẵn 12 swatch tuyển chọn hợp thiệp cưới (vàng đồng, hồng đất, đỏ son, lục bảo, xanh than, tím khói, nâu cà phê, xanh rêu...) kèm ô nhập hex.
- **(mới) Suy ra token cho theme tối** (`theme.mode = "dark"`, ví dụ `dem-nhung`): đảo trục sáng: `bg L=0.17`, `surface L=0.21`, `text L=0.94`, `muted L=0.75`, `line L=0.32` (cùng công thức chroma ở trên); primary thì **tăng** L từng bước 0.02 tới khi contrast với bg ≥ 4.5; `onPrimary` = bg nếu đạt ≥ 4.5. Đổi `primaryColor` không đổi chế độ sáng/tối; chế độ do theme quyết định.

### 1.5 Token khác
```css
:root{
  /* spacing (4px base) */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px; --sp-6:32px; --sp-7:48px; --sp-8:64px; --sp-9:96px;
  --section-py: clamp(64px, 12vw, 112px);
  --gutter: clamp(20px, 5.5vw, 40px);       /* 360px -> 20px lề */
  --container: 1080px; --measure: 62ch;      /* độ dài dòng tối đa */
  /* radius */
  --r-sm:8px; --r-md:14px; --r-lg:24px; --r-pill:999px;
  --arch: 999px 999px var(--r-md) var(--r-md); /* khung vòm ảnh */
  /* shadow có màu, không dùng đen */
  --shadow-1: 0 1px 2px color-mix(in srgb, var(--c-text) 8%, transparent),
              0 8px 24px -8px color-mix(in srgb, var(--c-primary) 22%, transparent);
  /* z-index scale */
  --z-content:1; --z-petals:20; --z-float:40; --z-toast:50; --z-sheet:60; --z-lightbox:70; --z-cover:80;
}
```
(`color-mix` có fallback rgba khi không hỗ trợ.)

### 1.6 Thư viện 12 theme (mới)

#### 1.6.1 Theme là "trọn gói", admin override từng phần
Mỗi theme là một gói gồm: **bảng màu + bộ 3 font + bộ họa tiết (ornament) + texture nền + kiểu khung ảnh + divider + hạt nền gợi ý + kiểu mở thiệp gợi ý + phong cách reveal gợi ý**. Dữ liệu theme nằm trong code (file định nghĩa preset), config chỉ lưu `theme.preset` và các phần admin tự đổi.

Quy tắc kế thừa: mỗi thành phần trong config có giá trị đặc biệt **`"theme"`** (hoặc để trống) nghĩa là *theo theme*. **(v3, đã chốt)** Khi đổi theme, chỉ những phần đang "Theo theme" mới đổi theo (kể cả kiểu mở thiệp, hạt nền, gói reveal, burst); phần admin đã tự chỉnh thì giữ nguyên (admin được hỏi, xem 8.12). Ví dụ `cover.openStyle: "theme"` + `theme.preset: "sen-cham"` cho ra kiểu mở `moon-gate`.

Config mặc định: `theme.preset = "tram-vang"`, mọi thành phần `"theme"`. Vì gói Trầm Vàng gợi ý `envelope`, kết quả vẫn đúng mặc định đã chốt (Trầm Vàng + phong bì + "Vừa").

#### 1.6.2 Bảng token (12 theme)
| # | id | Tên hiển thị | Chế độ | primary | onPrimary | accent (trang trí) | bg | surface | text | muted | line |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 ★ | `tram-vang` | Trầm Vàng | sáng | `#8A6A3B` | `#FFFFFF` | `#C9A86A` | `#FBF7F0` | `#FFFFFF` | `#2B2320` | `#6B5E55` | `#D9CDBE` |
| 2 | `hong-phan` | Hồng Phấn | sáng | `#A4495A` | `#FFFFFF` | `#E3BDB5` | `#FBF3F1` | `#FFFFFF` | `#3A2428` | `#75585D` | `#E6D3CF` |
| 3 | `luc-bao` | Lục Bảo | sáng | `#1F5A4A` | `#FFFFFF` | `#C2A26A` | `#F3F0E8` | `#FFFDF8` | `#1E2A25` | `#56645D` | `#D5D2C6` |
| 4 | `son-do` | Son Đỏ (Song Hỷ) | sáng | `#A3201D` | `#FFFFFF` | `#D4A23C` | `#FFF8EE` | `#FFFFFF` | `#3B1A14` | `#6E4A40` | `#EBD6B8` |
| 5 (mới) | `muc-giay` | Mực & Giấy | sáng | `#262624` | `#FFFFFF` | `#C2703D` | `#FAF9F6` | `#FFFFFF` | `#1C1C1A` | `#5F5E58` | `#E2E0DA` |
| 6 (mới) | `hoai-co` | Hoài Cổ | sáng | `#6B3E26` | `#FFFFFF` | `#C99A8B` | `#F4ECDD` | `#FBF6EC` | `#2E241C` | `#6A5848` | `#D8C8AE` |
| 7 (mới) | `sen-cham` | Sen Chàm | sáng | `#2D3E5E` | `#FFFFFF` | `#E7A9B6` | `#F5F3EC` | `#FCFBF7` | `#1F2533` | `#545C6B` | `#D9D6CC` |
| 8 (mới) | `mau-nuoc` | Hoa Lá Màu Nước | sáng | `#4E6B4A` | `#FFFFFF` | `#A9C3A0` (+ phụ `#E9C2B8`) | `#F7F8F3` | `#FFFFFF` | `#243024` | `#5A665A` | `#DCE2D6` |
| 9 (mới) | `dat-nung` | Đất Nung (Boho & Đồng nội) | sáng | `#9A4A2C` | `#FFFFFF` | `#D9A47E` | `#F6EEE4` | `#FCF8F2` | `#3A2A20` | `#6E5A4C` | `#E3D3C1` |
| 10 (mới) | `pastel-han` | Pastel Hàn | sáng | `#6A5A8C` | `#FFFFFF` | `#F3C6B8` (+ phụ `#CFC6E8`) | `#FBF8F6` | `#FFFFFF` | `#2E2A36` | `#67606F` | `#E8E2EA` |
| 11 (mới) | `dem-nhung` | Đêm Nhung (Đen & Vàng) | **tối** | `#D9B77E` | `#1C1517` | `#9C7A45` | `#1C1517` | `#261D20` | `#F2E9E1` | `#B5A79C` | `#3D3134` |
| 12 (mới) | `bien-dao` | Biển Đảo | sáng | `#1D5C7A` | `#FFFFFF` | `#F2A38A` (+ phụ `#8FD0CF`) | `#FAF6EE` | `#FFFFFF` | `#1B2B33` | `#4F6370` | `#D8E0E2` |

Token trạng thái dùng chung: theme sáng `--c-success #2E6B3F`, `--c-danger #B3261E` (≥ 5.4:1 ngay cả trên nền tối nhất là `#F4ECDD`); theme tối `--c-success #7BC59A`, `--c-danger #F2A09A` (≈ 8.8:1 trên `#1C1517`).

#### 1.6.3 Kiểm tra tương phản WCAG 2.1 (tính bằng công thức relative luminance, script chạy ngày 2026-10-07)
| id | primary/bg | primary/surface | onPrimary/primary | text/bg | text/surface | muted/bg | muted/surface | accent/bg (chỉ trang trí) |
|---|---|---|---|---|---|---|---|---|
| `tram-vang` | 4.68 | 4.99 | 4.99 | 14.42 | 15.40 | 5.86 | 6.25 | 2.12 |
| `hong-phan` | 5.22 | 5.71 | 5.71 | 13.12 | 14.36 | 5.80 | 6.34 | 1.57 |
| `luc-bao` | 7.04 | 7.89 | 8.02 | 13.05 | 14.62 | 5.46 | 6.12 | 2.13 |
| `son-do` | 7.16 | 7.55 | 7.55 | 14.82 | 15.63 | 7.33 | 7.73 | 2.20 |
| `muc-giay` | 14.40 | 15.16 | 15.16 | 16.21 | 17.07 | 6.18 | 6.50 | 3.51 |
| `hoai-co` | 7.64 | 8.32 | 8.97 | 12.91 | 14.07 | 5.77 | 6.28 | 2.11 |
| `sen-cham` | 9.64 | 10.34 | 10.70 | 13.80 | 14.80 | 6.06 | 6.50 | 1.76 |
| `mau-nuoc` | 5.58 | 5.96 | 5.96 | 12.92 | 13.79 | 5.65 | 6.03 | 1.79 |
| `dat-nung` | 5.39 | 5.86 | 6.19 | 11.93 | 12.96 | 5.66 | 6.15 | 1.91 |
| `pastel-han` | 5.75 | 6.08 | 6.08 | 13.23 | 13.99 | 5.71 | 6.04 | 1.46 |
| `dem-nhung` | 9.43 | 8.62 | 9.43 | 14.99 | 13.70 | 7.68 | 7.01 | 4.52 |
| `bien-dao` | 6.80 | 7.33 | 7.33 | 13.53 | 14.58 | 5.81 | 6.27 | 1.88 |

Kết luận: **cả 12 theme đạt AA** cho text, muted và primary (chữ/nút) trên cả bg lẫn surface. Accent luôn dưới 4.5:1 (trừ `dem-nhung`) nên **chỉ dùng trang trí**, đúng quy tắc 1.2.

**Sửa một lỗ hổng của bản trước (mới):** `--c-line` của mọi theme chỉ đạt 1.2 đến 1.5:1, **không đủ 3:1** cho viền input theo WCAG 1.4.11 (bảng 1.2 ghi "≥ 3:1" nhưng giá trị không đạt). Bổ sung token `--c-line-strong` = `--c-muted` (≥ 5.4:1) dùng cho **viền input, checkbox, radio, stepper**. `--c-line` chỉ còn dùng cho đường kẻ trang trí và viền thẻ.

Lưu ý riêng:
- `muc-giay`: primary gần trùng màu text (chủ ý tối giản), nên **link trong đoạn văn bắt buộc gạch chân** (không thể phân biệt bằng màu, WCAG 1.4.1). Nên áp gạch chân cho mọi theme, theme này thì không được tắt.
- `dem-nhung`: theme tối đầu tiên. Không dùng trắng tinh (`#F2E9E1`), không đen tuyệt đối (`#1C1517` ngả đỏ nâu). Shadow đổi sang `0 8px 24px -8px rgba(0,0,0,.5)` + viền sáng 1px `color-mix(primary 18%)`. **Sheet QR mừng cưới vẫn có ô nền trắng quanh QR** (máy quét cần tương phản). Overlay ảnh dùng `rgba(bg, .55)`. Vòng focus là primary vàng (8.62:1 trên surface).

#### 1.6.4 Trọn gói từng theme
| id | Font (heading / script / body) | Họa tiết (`ornamentSet`) | Texture nền | Khung ảnh (`photoFrame`) | Divider | Hạt nền gợi ý | Mở thiệp gợi ý | Reveal gợi ý |
|---|---|---|---|---|---|---|---|---|
| `tram-vang` ★ | Playfair Display / Great Vibes / Be Vietnam Pro | `classic-line` (cành lá line-art, hình thoi) | `paper` | `arch` | `ornament` | `petal-rose` màu accent | `envelope` ★ | `soft` |
| `hong-phan` | Lora / Dancing Script / Quicksand | `romantic` (hoa hồng line-art, nơ) | `paper` | `arch-double` | `leaf-branch` | `petal-rose` + `heart` | `flower-gate` | `soft` |
| `luc-bao` | Cormorant Garamond / Pinyon Script / Mulish | `classic-line` | `linen` | `rect-offset` | `double-line` | `leaf-eucalyptus` + `sparkle` | `double-door` | `editorial` |
| `son-do` | Noto Serif Display / Charm / Be Vietnam Pro | `traditional` (song hỷ, mây cát tường) | `paper` ấm | `circle-moon` | `cloud` | `petal-peach` (hoa đào) + `red-paper` (xác pháo) | `scroll` | `soft` |
| `muc-giay` | Newsreader / Birthstone / Manrope | `minimal` (đường kẻ mảnh, chấm, số La Mã) | `grain-fine` | `soft-rect` | `dots` | `ink-dot` (mật độ ×0.5) | `book` | `editorial` |
| `hoai-co` | Old Standard TT / Pinyon Script / Josefin Sans | `deco` (khung cắt góc art-deco, tem bưu chính, dấu bưu điện) | `paper-aged` (ố vàng + viền tối mép) | `stamp` (răng cưa tem thư) / `polaroid` | `double-line` | `petal-dried` + `dust-mote` | `wax-seal` | `letter` |
| `sen-cham` | Prata / Allura / Mulish | `lotus` (hoa sen, lá sen, sóng nước Á Đông) | `rice-paper` (giấy dó, sợi dài) | `circle-moon` (cửa trăng) | `lotus` | `petal-lotus` (mật độ ×0.5) | `moon-gate` | `gentle` |
| `mau-nuoc` | EB Garamond / Alex Brush / Nunito | `watercolor` (cành lá + vệt màu nước WebP) | `watercolor-wash` | `wash-mask` (mép ảnh loang màu nước) | `brush-stroke` | `leaf-green` + `petal-watercolor` | `ink-spread` | `soft` |
| `dat-nung` | Fraunces / Style Script / Lexend | `boho` (cầu vồng boho, cỏ lau, nắng) | `kraft` | `arch` (viền dày 2px) | `torn-paper` | `pampas` (bay ngang) + `petal-dried` | `origami` | `playful` |
| `pastel-han` | Crimson Pro / Moon Dance / Quicksand | `korean` (hoa nhỏ, nơ, sticker line mảnh, khung bo tròn lớn) | `grain-fine` | `polaroid` / `oval` | `dots` | `petal-sakura` + `bubble` | `polaroid` | `playful` |
| `dem-nhung` | Playfair Display / Imperial Script / Mulish | `luxe` (khung đường kép mạ vàng, quạt art-deco) | `velvet` (noise tối + vignette) | `deco-cut` | `deco-fan` | `gold-dust` + `firefly` | `light-gather` | `cinematic` |
| `bien-dao` | Spectral / Dancing Script / Nunito | `tropical` (lá cọ, vỏ sò, sóng) | `sand` | `scallop` (viền vỏ sò lượn) | `wave-ocean` | `plumeria` (hoa sứ) + `bubble` | `card-3d` | `playful` |

Mọi font trong bảng thuộc danh sách **đã kiểm chứng có subset vietnamese** ở 2.2. Các font mới đưa vào danh sách admin (Newsreader, Old Standard TT, Crimson Pro, Spectral, Birthstone, Moon Dance, Style Script, Manrope, Nunito) xem 2.3b. Mỗi theme vẫn **phải test chuỗi dấu chồng** của 2.1 trước khi phát hành.

#### 1.6.5 Mood và gợi ý dùng (theme mới)
- **Mực & Giấy (`muc-giay`)**: tối giản hiện đại, kiểu tạp chí. Nhiều khoảng trắng, chữ serif lớn, một nét terracotta duy nhất làm điểm nhấn. Hợp cặp đôi thích ảnh đen trắng/film, tiệc nhỏ, tiệc ở studio.
- **Hoài Cổ (`hoai-co`)**: thư tay thập niên 60 đến 70, tem thư, dấu bưu điện, giấy ố. Nâu sô-cô-la + hồng đất. Hợp ảnh film, áo dài cách tân, quán cà phê cũ.
- **Sen Chàm (`sen-cham`)**: Á Đông thanh lịch. Chàm mực + hồng sen, giấy dó, cửa trăng (nguyệt môn). Trang trọng nhưng không đỏ rực như Son Đỏ. Hợp lễ gia tiên, áo dài, nhà vườn Huế.
- **Hoa Lá Màu Nước (`mau-nuoc`)**: xanh xô thơm + hồng phấn, vệt màu nước. Tươi, nhẹ. Hợp cưới ngoài trời, garden party.
- **Đất Nung (`dat-nung`)**: boho và rustic: kraft, cỏ lau, đất nung, nắng chiều. Hợp cưới ở farm, Đà Lạt, glamping.
- **Pastel Hàn (`pastel-han`)**: tím khói + đào, bo tròn, polaroid, sticker mảnh. Trẻ, dễ thương, kiểu studio Hàn Quốc.
- **Đêm Nhung (`dem-nhung`)**: sang trọng đen và vàng, tiệc tối khách sạn. Ảnh cưới nên tông ấm/tối; admin được cảnh báo nếu ảnh hero quá sáng (độ sáng trung bình > 70%) vì sẽ "chói" trên nền tối.
- **Biển Đảo (`bien-dao`)**: xanh đại dương + san hô, cát, hoa sứ. Hợp cưới ở biển (Phú Quốc, Nha Trang), tiệc chiều.

#### 1.6.6 Thư viện thành phần dùng chung giữa các theme (mới)
Theme chỉ là cách *kết hợp* các thành phần dưới đây, nên admin có thể trộn (ví dụ màu Lục Bảo + khung tem thư).

**Bộ họa tiết `ornamentSet`** (mỗi bộ là 1 SVG sprite ≤ 12KB gz, tô bằng `currentColor` = accent): `classic-line` · `romantic` · `traditional` · `minimal` · `deco` · `lotus` · `watercolor` (SVG line + 2 vệt màu nước WebP ≤ 40KB mỗi ảnh, tải lười) · `boho` · `korean` · `luxe` · `tropical`. Mỗi bộ gồm đủ 6 phần: góc trang, divider, khung tiêu đề nhỏ, biểu tượng "&", monogram frame (dấu sáp/khung tên), icon hộp quà.

**(v4) Quy ước sprite và 3 bộ đầu đã vẽ thật (R14):** mỗi bộ có đủ 6 symbol `divider` (160×24) · `title` (80×16) · `corner` (96×96) · `amp` (120×24, khung hai bên; chữ "&" vẫn là text font script) · `monogram` (120×120) · `gift` (64×64); riêng `traditional` thêm `songhy` (84×64, song hỷ dựng bằng nét vuông, không cần font CJK, dùng màu `--c-primary`, cỡ ≥ 40px) và `cloud` (40×20). Nét 1px ở kích thước chuẩn, không có `<use>` lồng nhau (an toàn Safari với sprite ngoài), ≤ 4KB gz mỗi bộ. Hiển thị: divider 140×21 (mobile) / 200×30 (desktop); ornament góc cover 96px / 120px, `opacity .7`. SVG thật của `classic-line` (cành lá + hình thoi), `traditional` (mây cát tường, hồi văn, song hỷ) và `luxe` (art-deco, quạt nan) nằm ở `design-review-v1.md` mục 3.1; 8 bộ còn lại làm ở v4 theo cùng quy ước.

**Texture `theme.texture`** (đều làm bằng CSS/SVG inline, trừ khi ghi chú):
| id | Cách làm | Opacity |
|---|---|---|
| `paper` | SVG `feTurbulence` baseFrequency .9, render 1 lần thành data-URI | .05 |
| `paper-aged` | `paper` + `radial-gradient` tối ở 4 mép (vignette) | .06 + .08 |
| `linen` | 2 lớp `repeating-linear-gradient` 0deg/90deg 1px, bước 3px | .035 |
| `kraft` | noise thô (baseFrequency .6) + sợi ngắn, nền ngả `bg` | .08 |
| `rice-paper` | noise mịn + SVG 30 sợi dài cong (giấy dó), một tile 400px | .06 |
| `watercolor-wash` | 1 ảnh WebP vệt màu ở góc trên phải và góc dưới trái (≤ 60KB), `mix-blend-mode: multiply` | .5 |
| `velvet` | noise tối + `radial-gradient` sáng nhẹ ở giữa | .06 |
| `grain-fine` | noise rất mịn | .03 |
| `sand` | noise thô + chấm thưa | .05 |
| `none` | nền phẳng | |
Texture là lớp `body::before` `position:fixed` và **không bao giờ animate** (chi phí repaint).

**Khung ảnh `theme.photoFrame`**: `arch` (vòm, mặc định cũ) · `arch-double` (vòm có viền đôi lệch 6px) · `rect-offset` (passe-partout lệch) · `soft-rect` (bo 14px, viền 1px) · `circle-moon` (tròn có vành 8px như cửa trăng) · `oval` · `polaroid` (viền trắng 10/10/36px, xoay ±2°, có dòng chữ viết tay dưới) · `stamp` (mép răng cưa bằng `mask` SVG radial) · `scallop` (mép lượn vỏ sò, `mask` SVG) · `wash-mask` (mép loang, `mask-image` WebP) · `deco-cut` (cắt 4 góc 12px bằng `clip-path: polygon`). Mọi khung giữ `aspect-ratio` cố định để không CLS; `mask`/`clip-path` chỉ áp cho **ảnh**, không áp lên khối chữ (để không cắt dấu tiếng Việt).

**Divider `sections.divider`** (mở rộng từ 3 lên 13 giá trị): `ornament` · `wave` · `none` (cũ) + `leaf-branch` · `double-line` (2 đường mảnh, thoi ở giữa) · `cloud` (mây cát tường) · `lotus` · `dots` (3 chấm) · `brush-stroke` (vệt cọ) · `torn-paper` (mép giấy xé, SVG path) · `deco-fan` (quạt art-deco) · `wave-ocean` (sóng 2 lớp) · `"theme"` (theo theme, mặc định).

---

## 2. Typography

### 2.1 Nguyên tắc tiếng Việt (bắt buộc)
- **Chỉ dùng font có subset `vietnamese` trên Google Fonts.** Font không có subset này thì trình duyệt sẽ mượn font dự phòng để vẽ riêng các chữ có dấu (ầ, ữ, ợ, đ). Kết quả là "chữ lai": một từ có hai font, nhìn rất rẻ tiền. Lỗi này hay gặp nhất ở thiệp Việt.
- Có subset rồi **vẫn phải test chuỗi dấu chồng**: `Nguyễn Thuỳ Linh · Đặng Hữu Phước · Hường · Quỳnh · Ngọc Ẩn · ẦẪỂỖỮ`. Ở font script, dấu mũ cộng dấu thanh (ầ, ễ, ở) dễ đè lên nét nối hoặc bị cắt.
- Font script **chỉ dùng cho tên và cụm ngắn ≥ 28px** (tên, "&", chữ ký, "Save the date"). Không dùng cho địa chỉ, giờ, đoạn văn.
- `line-height` cho script ≥ 1.35 và heading viết HOA ≥ 1.3, vì dấu tiếng Việt trên chữ hoa (Ầ, Ễ) cao hơn chữ Latin. **Không đặt `overflow:hidden` hay `clip-path` sát khung chữ có dấu.** Hiệu ứng reveal phải chừa `padding-block: 0.2em`.
- Chuẩn hóa Unicode **NFC** cho mọi text (tên khách từ URL, nhập từ admin), vì bàn phím Telex kiểu tổ hợp (NFD) hiển thị dấu lệch ở nhiều font.
- **(v4, R08) Swash tràn ngang:** nét swash của Great Vibes, Imperial Script… (chữ "L", "T", "N" hoa) tràn ra ngoài hộp chữ 0.12 đến 0.15em về bên trái. Mọi khối chữ script (`.cv-names`, `.hero-names`, `.ann-names`, `.ty-sig`, tiêu đề script) có `padding-inline: .18em`. Mọi `clip-path: inset()` hoặc `overflow:clip` trên chữ script phải chừa biên **cả ngang** `-0.2em` lẫn dọc `-0.3em`.
- **(v4, R15) Chữ mồ côi ở khối căn giữa:** `text-wrap: balance` cho `.sec-sub`, `.ann-*`, `.person-bio`, `.cv-greet-*`, `.ty-msg`, lời nhắn Mừng cưới; `text-wrap: pretty` cho đoạn văn. Trình duyệt chưa hỗ trợ thì giữ nguyên (không polyfill).

### 2.2 Kết quả kiểm chứng subset `vietnamese` (gọi thật Google Fonts CSS2 API ngày 2026-10-07)

**Có subset vietnamese (dùng được):**
- Serif tiêu đề: Playfair Display, Playfair, Cormorant Garamond, Cormorant, Cormorant Upright, Cormorant Infant, Lora, EB Garamond, Prata, Noto Serif, Noto Serif Display, Fraunces, Newsreader, Spectral, Crimson Pro, Literata, Old Standard TT, Yrsa.
- Script: Great Vibes, Imperial Script, Dancing Script, Allura, Alex Brush, Pinyon Script, Charm, Mea Culpa, Ephesis, Corinthia, Bonheur Royale, Meow Script, Ballet, Italianno, WindSong, Birthstone, Moon Dance, Style Script, Lavishly Yours, Send Flowers, Ms Madi, Licorice, Charmonman, Hurricane, Inspiration, Explora, Fleur De Leah, Waterfall, Island Moments, Carattere, Pacifico.
- Sans/body: Be Vietnam Pro, Lexend, Quicksand, Nunito, Mulish, Josefin Sans, Plus Jakarta Sans, Manrope, Raleway, Montserrat, Noto Sans, Andika, Philosopher.

**KHÔNG có subset vietnamese, cấm đưa vào danh sách (đẹp nhưng lỗi dấu):**
Parisienne, Sacramento, Tangerine, Rouge Script, Petit Formal Script, Monsieur La Doulaise, Mrs Saint Delafield, Herr Von Muellerhoff (các script rất "thiệp cưới" nhưng lỗi dấu); Cinzel, Marcellus, Gilda Display, Bodoni Moda, Libre Baskerville, Aboreto, Bellefair (serif sang nhưng lỗi dấu).

**Có subset nhưng cần cẩn trọng:** Italianno, Corinthia, Ephesis, Waterfall, **(v4, R09) Imperial Script** (nét quá mảnh nên dấu nhỏ li ti trên mobile, chỉ dùng ≥ 44px; với `dem-nhung`: `--fs-names` mobile tối thiểu 46px, chữ ký Cảm ơn 44px, lời chào sau mở dùng heading italic thay script, xem 3.4); Pacifico (quá tròn, kiểu quán cà phê, không hợp thiệp cưới); Meow Script, Hurricane, Explora (độc đáo nhưng khó đọc tên người Việt dài).

### 2.3 Danh sách tuyển chọn cho Admin
Admin chọn **1 font cho mỗi vai trò** từ danh sách giới hạn (đúng Hick's Law: ít lựa chọn, tất cả đều đã test tiếng Việt). Mỗi option có preview trực tiếp bằng tên cặp đôi thật của config.

| Vai trò | Danh sách (★ = mặc định) |
|---|---|
| Heading (serif), 7 font | ★ Playfair Display · Cormorant Garamond · Lora · EB Garamond · Prata · Noto Serif Display · Fraunces |
| Script (thư pháp), 7 font | ★ Great Vibes · Pinyon Script · Alex Brush · Dancing Script · Allura · Imperial Script · Charm |
| Body (sans), 5 font | ★ Be Vietnam Pro · Mulish · Quicksand · Josefin Sans · Lexend |

**5 cặp phối sẵn ("Font preset")** để admin không phải tự phối:
| Preset | Heading | Script | Body | Hợp theme |
|---|---|---|---|---|
| Cổ điển ★ | Playfair Display | Great Vibes | Be Vietnam Pro | A, B |
| Thanh lịch | Cormorant Garamond (500/600) | Pinyon Script | Mulish | C |
| Ấm áp | Lora | Dancing Script | Quicksand | B |
| Biên tập | Fraunces (opsz cao) | Alex Brush | Be Vietnam Pro | A, C |
| Truyền thống | Noto Serif Display | Charm | Be Vietnam Pro | D |

Lưu ý Be Vietnam Pro do người Việt thiết kế, dấu cân đối nhất ở cỡ nhỏ, nên chọn làm body mặc định.

### 2.3b Mở rộng danh sách font để phục vụ 12 theme (mới)
Thêm vào danh sách tuyển chọn (đều nằm trong danh sách đã kiểm chứng subset vietnamese ở 2.2):
| Vai trò | Thêm | Tổng |
|---|---|---|
| Heading | Newsreader · Old Standard TT · Crimson Pro · Spectral | 11 |
| Script | Birthstone · Moon Dance · Style Script | 10 |
| Body | Manrope · Nunito | 7 |

- Để không vi phạm Hick's Law khi danh sách dài hơn, dropdown font trong admin **nhóm 2 tầng**: "Gợi ý cho theme đang chọn" (3 font của theme, ở trên cùng) và "Tất cả" (phần còn lại, theo ABC).
- Font preset 2.3 giữ 5 cặp cũ; **mỗi theme tự là một cặp phối** (cột Font ở 1.6.4), dropdown "Font preset" thêm lựa chọn đầu tiên "Theo theme" (mặc định).
- Moon Dance và Birthstone có nét mảnh hơn Great Vibes: áp quy tắc "chỉ dùng ≥ 40px" như nhóm cần cẩn trọng ở 2.2. Old Standard TT chỉ có weight 400/700 nên heading dùng 400.
- Gallery theme (8.12) tải font xem trước bằng tham số `&text=` của Google Fonts (chỉ các glyph trong tên cặp đôi + "&"), mỗi file vài KB, nên 12 thẻ không làm nặng admin.

**Tải font (hiệu năng):** chỉ tải 3 family đang chọn, mỗi family tối đa 2 weight (heading 500/600 + italic 400; body 400/600; script 400), `display=swap`, `preconnect` tới fonts.gstatic. Tên trên màn cover dùng `font-display: block` tối đa 1.5s để không bị nhảy font ngay khoảnh khắc đầu. (**Giả định:** solution chọn Google Fonts CDN hoặc tự host woff2 subset latin+vietnamese; design dùng được cả hai.) Admin chỉ tải toàn bộ font tuyển chọn ở tab Font, theo kiểu lazy.

### 2.4 Thang cỡ chữ
Dùng `clamp()`. Mobile tính theo 375px, desktop theo 1280px.

| Token | Dùng cho | Mobile | Desktop | Font / weight / line-height |
|---|---|---|---|---|
| `--fs-names` | Tên cặp đôi ở hero/cover | 52px | 96px | script 400 / 1.35 |
| `--fs-display` | Ngày lớn "12" | 64px | 112px | heading 500 / 1.0 (số không có dấu) |
| `--fs-h2` | Tiêu đề section | 32px | 48px | heading 500 / 1.25 |
| `--fs-h2-script` | Tiêu đề kiểu script (tuỳ chọn) | 40px | 60px | script / 1.35 |
| `--fs-h3` | Tên sự kiện, tên người | 22px | 28px | heading 600 / 1.3 |
| `--fs-eyebrow` | "THE BRIDE & GROOM", "01" | 12px | 13px | body 600 UPPERCASE, letter-spacing .22em / 1.4 |
| `--fs-body` | Đoạn văn | 16px | 18px | body 400 / 1.65 |
| `--fs-small` | Âm lịch, địa chỉ, meta | 14px | 15px | body 400 / 1.55 |
| `--fs-caption` | Ghi chú phụ (tối thiểu) | 13px | 13px | không nhỏ hơn 13px |

**(v4, R10)** Ngoại lệ dưới 13px chỉ có nhóm **nhãn viết HOA kiểu eyebrow** (12px, body 600, `letter-spacing` ≥ .14em): eyebrow, nhãn ô đếm ngược `.cd-l`, badge thẻ sự kiện `.ev-badge`. Không có chữ nào 11px.

```css
--fs-names:   clamp(52px, 13.5vw, 96px);
--fs-display: clamp(64px, 17vw, 112px);
--fs-h2:      clamp(32px, 8.5vw, 48px);
--fs-h3:      clamp(22px, 5.8vw, 28px);
--fs-body:    clamp(16px, 4.2vw, 18px);
```
Input form luôn ≥ 16px, để iOS Safari không tự zoom khi focus.

---

## 3. Màn hình thiệp mời (Cover) trước khi mở

### 3.1 Mục tiêu
Tạo khoảnh khắc "nhận thiệp", cá nhân hóa bằng tên khách, và lấy **cử chỉ chạm đầu tiên** để được phép phát nhạc (chính sách autoplay của trình duyệt).

### 3.2 Bố cục mobile (360 đến 430px, chiều cao 100svh) (v4)
**(v4, đã chốt 2026-10-08, R01)** Bản v1 dựng phong bì dọc, tên cặp đôi và tên khách đều nằm trên thẻ, nắp trắng trên thẻ trắng gần như vô hình, và lúc mở thì thẻ bị cắt mép trên ở 360×740. Bố cục mới dưới đây thay hoàn toàn bản cũ. Bố cục này áp dụng cho mọi kiểu mở có "phong bì" (`envelope` và 6 mẫu phong thư ở 3.4c). Các kiểu mở khác (3.4b) vẫn giữ khối tên cặp đôi + "Kính gửi" theo bố cục riêng của từng kiểu.
```
┌──────────────────────────────┐  nền: texture giấy + ornament góc 96px, opacity .7
│      THIỆP MỜI CƯỚI          │  eyebrow (muted)
│        12 · 12 · 2026        │  heading, primary
│          Minh Anh            │  tên cặp đôi: script clamp(40px,11vw,52px),
│             &                │  NGOÀI phong bì, phía trên. Đây là LCP: đọc
│          Thuỳ Linh           │  được ngay cả khi SVG phong bì chưa tải
│ ┌─────────── 10:7 ─────────┐ │  phong bì NGANG, rộng min(88vw, 380px)
│ │╲         (seal)         ╱│ │  nắp tam giác chạm ~55% chiều cao,
│ │  ╲____________________╱  │ │  seal 64px ở mũi nắp
│ │         Kính gửi          │ │  "ghi địa chỉ" trên MẶT phong bì:
│ │     Gia đình anh Mạnh     │ │  muted 14px + heading italic 20–22px, ≤ 2 dòng
│ └──────────────────────────┘ │
│   ( ♡  Chạm để mở thiệp )    │  pill primary 52px, rộng ≥ 220px, 1/3 dưới
│   ♪ Thiệp có nhạc, bật loa   │  caption 13px muted (tuỳ chọn)
└──────────────────────────────┘
```
- Mọi thứ nằm gọn trong `100svh`. Thiếu chỗ thì co phần trên trước. Màn cao ≤ 640px: tên cặp đôi gộp 1 dòng ("Minh Anh & Thuỳ Linh", 34px).
- Toàn bộ phong bì là vùng chạm (`role="button"`); nút "Chạm để mở thiệp" là target chính, có focus rõ. Phím Enter/Space mở thiệp.
- **Lớp (từ dưới lên):** `env-back` (lòng phong bì, lót hoa văn) → `env-card` (thẻ thiệp, rộng 92%, cao 128% phong bì, ban đầu nằm hẳn trong bao) → `env-front` (túi: 2 cánh bên + cánh đáy, **đục**, che thẻ) → `env-flap` (nắp, mặt trước là giấy, mặt sau là lót hoa văn, `backface-visibility:hidden` cả 2 mặt) → `seal`.
- Tên khách là **text HTML** đặt trên `env-front` (không vẽ trong SVG), để screen reader đọc được và auto-fit chạy được (3.3). SVG phong bì có `aria-hidden`. Thẻ bên trong in lời chào sau mở ("Chúng mình sắp cưới!").
- Màu theo token (mẫu `classic`): `--env-paper: var(--c-surface)`, `--env-paper-2: color-mix(in srgb, var(--c-accent) 10%, var(--c-bg))`, `--env-edge: var(--c-line)`, `--env-liner: var(--c-accent)`, `--env-seal: var(--c-primary)`, `--env-ink` (chữ trên mặt phong bì, bắt buộc ≥ 4.5:1 với `--env-paper`). Mẫu khác tự khai báo bộ biến riêng (3.4c).
- **Seal (R16):** hình giọt sáp (9 bướu dính liền quanh lõi tròn) + 2 vành trong sáng/tối, 64px, gradient 3 điểm; monogram (`cover.monogram`) là text HTML 15–16px heading màu `--c-on-primary` đặt chồng lên. `color-mix` trong `stop-color` cần fallback: tính sẵn 2 màu sáng/tối bằng `derive.ts`. SVG ở `design-review-v1.md` 3.2.
- **Desktop ≥ 1024px (R17):** phong bì 560px. Nền `radial-gradient(ellipse at 50% 45%, var(--c-surface), var(--c-bg) 70%)` + texture, ornament góc 120px.
- Nền phía sau dùng ảnh cover mờ (blur tĩnh dựng sẵn, **không animate filter**) hoặc texture giấy, admin chọn.
- `cover.envelope.guestOnFront = false` thì "Kính gửi …" quay về thẻ bên trong như v1, mặt phong bì chỉ còn seal và ornament.

### 3.3 Tên khách từ URL
- `?to=gia-đình-anh-Mạnh` (tên tham số lấy từ config `guestUrlParam`) xử lý thành `decodeURIComponent`, rồi NFC, rồi đổi `-`/`_`/`+` thành khoảng trắng, gộp khoảng trắng thừa, **viết hoa chữ cái đầu tiên của chuỗi**, giữ nguyên phần còn lại. Kết quả: "Gia đình anh Mạnh".
- Cần giữ dấu gạch thật (tên ghép) thì dùng `--` trong link (Giả định, báo solution).
- Giới hạn 60 ký tự hiển thị; dài hơn thì cắt và thêm "…". **Luôn render bằng `textContent`** (không innerHTML) để chống XSS từ link.
- Không có hoặc rỗng: dùng `invitation.guestName` ("Quý khách"). Dòng "Kính gửi:" vẫn giữ.
- Auto-fit: tên dài hơn khoảng 22 ký tự thì giảm cỡ và cho xuống 2 dòng; không bao giờ dùng font script cho tên khách (tên khách dài, nhiều dấu). **(v4)** Trên mặt phong bì (3.2): heading italic 22px, giảm tối thiểu 18px, tối đa 2 dòng; các kiểu mở khác giữ 24px → 19px.
- Tên khách tái sử dụng ở: lời mời ("Trân trọng kính mời **Gia đình anh Mạnh**"), ô "Họ tên" của RSVP và Lời chúc (điền sẵn, sửa được).

### 3.4 Kiểu animation mở thiệp (admin chọn `cover.openStyle`)
| Mã | Tên hiển thị trong admin | Diễn biến | Thời lượng |
|---|---|---|---|
| `envelope` ★ | Phong bì mở nắp | **(v4)** Seal tách đôi, nắp lật, thẻ rút lên khỏi túi, bao rơi xuống và mờ, thẻ về giữa màn với lời chào, rồi fade sang landing (timeline chi tiết ngay dưới bảng). Skin theo mẫu phong thư (3.4c) | khoảng 2.0s (≤ 2.4s) |
| `card-flip` | Thiệp lật | Thẻ lật `rotateY(180deg)` lộ mặt trong có "Chúng mình sắp cưới!", giữ 600ms rồi zoom-fade | khoảng 1.4s |
| `curtain` | Rèm kéo | Hai nửa màn (rèm vải/giấy có ornament) trượt `translateX(±100%)` ra hai bên, nội dung hero lộ ra từ giữa | khoảng 1.2s |
| `fade-zoom` | Mờ dần | Cover `scale(1.08)` + `opacity 0` | 0.7s |
| `none` | Không hiệu ứng | Chuyển ngay (cũng là hành vi khi `prefers-reduced-motion`) | 0.2s fade |

- Easing: `cubic-bezier(.22,1,.36,1)` (ease-out mượt) cho chuyển động; nắp phong bì dùng `cubic-bezier(.65,0,.35,1)`.
- Chỉ animate `transform`/`opacity`; bật `perspective: 1200px` ở container; `will-change` thêm lúc bắt đầu và gỡ khi xong.
- Trong lúc mở: khóa nút (không bấm 2 lần), `aria-busy`.
- **(v4, R05) Mọi kiểu mở:** ngay trong handler chạm, `.cv-actions` (nút mở + dòng "Thiệp có nhạc") fade-out 120–200ms + `translateY(8px)`, để mắt khách không bị chia đôi và khách không tưởng phải bấm lại. Vùng chạm lần 2 để tua nhanh là **toàn bộ cover**, không chỉ nút.
- Có `openedGreeting`/`openedSubline` ("Chúng mình sắp cưới!") hiện ở bước cuối của `envelope` và `card-flip`. Admin có thể tắt. **(v4, R06)** Lời chào: `text-wrap: balance`, cỡ `clamp(30px, 8.6vw, 38px)`; nếu font script thuộc nhóm "cần cẩn trọng" (2.2: Imperial Script, Moon Dance, Birthstone…) thì lời chào dùng **heading italic 28px** thay cho script.

**(v4) Timeline `envelope` (mức Vừa, tổng ~2.0s, ≤ 2.4s), dùng chung cho mọi mẫu phong thư 3.4c:**
| t (ms) | Phần tử | Chuyển động | Easing |
|---|---|---|---|
| 0–120 | `.cv-actions` | opacity 0 + translateY 8px | out |
| 0–260 | seal | nhấn `scale .92` (0–90ms) rồi tách đôi: 2 nửa (clip ở tầng DOM, không animate clip) `translateX ±10px rotate ±16deg` + fade | `--ease-out` |
| 180–720 | flap | `rotateX(0→180deg)` quanh mép trên, `perspective:1200px`; `z-index` 4→1 ở mốc 50% (WAAPI animate z-index rời rạc) để nắp lật xong nằm SAU thẻ | `--ease-inout` |
| 650–1250 | card | `translateY(0 → -62%)` rút lên khỏi túi | `--ease-out` |
| 1150–1550 | back + front + flap | `translateY(0 → 30%)` + opacity → 0 (bao "rơi" xuống) | `--ease-in` nhẹ |
| 1150–1550 | card | về giữa màn `translateY(-62% → -20%)`, `scale(1 → 1.06)`; nội dung đổi sang lời chào (crossfade 200ms) | `--ease-out` |
| 1550–1950 | cover | giữ lời chào 300ms rồi `scale 1.06→1.12` + fade | `--ease-out` |
- Không khung nào bị cắt ở 360×740 (kiểm tra bằng chụp từng khung 0/250/500/750/1000/1250/1500ms).
- **Nhẹ:** seal fade 120ms, flap 320ms, card rút 320ms, bỏ bước bao rơi (fade chung), tổng ~1.1s. **Nhiều:** + 12 hạt bụi vàng lóe ở chỗ seal tách (engine burst sẵn có). Không bao giờ dùng `clip-path` trên vùng chữ.
- `will-change` chỉ gắn cho 4 phần tử (seal, flap, card, env) trong lúc chạy, xong thì gỡ.

### 3.4b 12 kiểu mở thiệp bổ sung (mới)
Nguyên tắc chung cho mọi kiểu (cũ và mới):
- Tổng thời lượng **≤ 2.4s**. Sau 2.4s khách phải thấy landing; khách chạm lần 2 trong lúc đang chạy thì **tua nhanh** tới cuối (300ms), không bắt chờ.
- Mỗi kiểu là **1 module JS riêng (≤ 4KB gz)**, chỉ tải module đang được chọn (dynamic import ngay khi cover hiện). Ảnh/sprite riêng của kiểu đó tải song song với ảnh cover.
- Chỉ animate `transform`/`opacity`; ngoại lệ được phép là `clip-path` (ghi rõ chi phí "vừa", vì repaint) và canvas.
- Phần chứa **tên khách và tên cặp đôi không bao giờ bị clip sát chữ**; mọi `clip-path` có biên an toàn `±0.3em`.
- Cột "Nhẹ" là phiên bản rút gọn khi cường độ = Nhẹ hoặc máy bị tự hạ cấp. **Tắt** và **`prefers-reduced-motion`** luôn là fade 200ms (như `none`), không ghi lại ở từng dòng.
- Easing dùng token ở 5.1: `--ease-out` cho trượt/mở, `--ease-inout` cho lật, `--ease-pop` cho bật nảy.

| Mã | Tên trong admin | Diễn biến (mức Vừa) | Thời lượng | Kỹ thuật gợi ý | Chi phí | Mức Nhẹ | Nhiều | Hợp theme |
|---|---|---|---|---|---|---|---|---|
| `wax-seal` | Dấu sáp vỡ | Thiệp gập đôi khoá bằng dấu sáp monogram 96px. Chạm: dấu rung 2 nhịp (rotate ±4°, 2×120ms), nứt theo đường zíc-zắc thành 2 nửa (SVG 2 path) rơi xoay ra hai bên + 6 mảnh vụn; 2 cánh thiệp mở `rotateY(±160deg)` quanh mép ngoài (600ms `--ease-inout`), zoom-fade 400ms | 1.7s | WAAPI + SVG, `perspective:1200px` | Vừa | dấu fade-out, cánh mở, không mảnh vụn | + bụi vàng lóe ở chỗ nứt | `hoai-co`, `tram-vang` |
| `origami` | Gấp giấy origami | Tờ giấy vuông gấp 4 cánh tam giác chụm giữa. 4 cánh lật mở lần lượt (mỗi cánh `rotateX/Y 180deg` 380ms, stagger 120ms) lộ tên cặp đôi ở giữa; mặt sau cánh in họa tiết theme; tờ giấy scale lấp màn rồi fade | 1.8s | CSS 3D, `backface-visibility:hidden`, mỗi cánh 2 mặt | Vừa | 4 cánh mở cùng lúc, không bóng | + bóng gấp nếp (gradient opacity) | `dat-nung`, `pastel-han` |
| `double-door` | Cửa đôi | Hai cánh cửa (gỗ chạm, giấy hoa văn hoặc kính màu theo theme) mở vào trong `rotateY(±105deg)` quanh bản lề hai bên (900ms), dải sáng tràn từ khe giữa (lớp gradient opacity 0 lên .8 rồi về 0), "camera" tiến vào `scale 1 lên 1.15` | 1.6s | CSS 3D + 1 lớp ánh sáng | Vừa | cánh trượt `translateX` như rèm | + hạt bụi sáng bay ra từ khe | `luc-bao`, `dem-nhung` |
| `flower-gate` | Cổng hoa | Cổng vòm phủ 2 cụm hoa (2 lớp ảnh WebP ≤ 80KB). Chạm: hai cụm trượt chéo ra ngoài và xoay ±8° (800ms), cánh hoa bung 24 hạt từ giữa, cổng `scale` vượt màn | 1.8s | DOM transform + burst trên canvas chung | Vừa | không burst, chỉ trượt | 40 hạt + lá rơi tiếp 2s | `hong-phan`, `mau-nuoc` |
| `scroll` | Cuộn thư | Cuộn giấy có trục và ruy băng. Ruy băng tuột (translate + fade 300ms), trục dưới lăn xuống `translateY` đồng bộ với nội dung lộ dần `clip-path: inset(0 0 100% 0)` sang `inset(0)` (900ms); giữ 500ms để đọc dòng "Kính gửi …", rồi fade sang landing | 2.1s | `clip-path` + transform | Vừa (repaint) | trải nhanh 500ms, không giữ | + trục xoay (rotate theo quãng lăn) | `son-do`, `sen-cham`, `hoai-co` |
| `card-3d` | Thiệp 3D xoay | Trước khi chạm: thẻ nghiêng theo con trỏ (desktop) ±10°, trên mobile tự lắc rất nhẹ ±3° 3s rồi dừng. Chạm: xoay 360° quanh trục Y (900ms `--ease-inout`), bóng đổ là phần tử riêng co/giãn theo góc, dừng mặt trước rồi lao tới người xem (`scale 1 lên 1.6` + fade, 400ms) | 1.4s | CSS 3D, pointer events | Thấp | lật 180°, không nghiêng | + vệt sáng lướt trên mặt thẻ | `bien-dao`, `muc-giay` |
| `light-gather` | Hạt sáng tụ thành tên | Nền tối/giấy có khoảng 400 hạt sáng trôi lững lờ. Chạm: hạt bay tụ về đúng hình **tên cặp đôi** (1.1s `--ease-out`), giữ 600ms phát sáng nhẹ, rồi tản ra như bụi vàng và lộ landing | 2.4s | Canvas 2D; lấy mẫu điểm ảnh từ tên vẽ trên canvas phụ sau `document.fonts.load()`, bước mẫu 3px (2px với font script để dấu không bị thưa) | **Cao** | thay bằng `fade-zoom` + 12 hạt lấp lánh | 700 hạt | `dem-nhung` |
| `gift-box` | Mở hộp quà | Hộp quà (line-art theo theme). Nơ tuột (SVG `stroke-dashoffset` chạy ngược 400ms), nắp bật lên xoay 15° bay khỏi khung (500ms `--ease-pop`), thiệp nhô lên khỏi hộp (500ms), confetti nhỏ, zoom-fade | 1.9s | WAAPI + SVG + burst canvas | Vừa | không confetti, nắp chỉ fade | confetti 80 mảnh | `pastel-han`, `dat-nung` |
| `moon-gate` | Cửa trăng | Vách gỗ có cửa tròn (nguyệt môn) với song cửa/hoa sen. Hai nửa vách trượt sang hai bên (700ms), ảnh cưới trong khung tròn nở ra `clip-path: circle(30%)` sang `circle(150%)` phủ màn (700ms) | 1.6s | transform + `clip-path` | Vừa | bỏ bước nở tròn, fade | + cánh sen rơi 1.5s | `sen-cham`, `son-do` |
| `book` | Thiệp gấp đôi (lật trang) | Thiệp đóng như cuốn sách. Bìa lật sang trái `rotateY(-180deg)` quanh gáy (700ms `--ease-inout`) lộ trang trong "Trân trọng kính mời {khách}", giữ 700ms, rồi cả thiệp zoom-fade | 1.8s | CSS 3D | Thấp | lật nhanh 400ms, không giữ | + trang thứ 2 lật theo (giấy lót) | `muc-giay`, `hoai-co` |
| `ink-spread` | Mực loang | Chạm vào đâu thì vệt mực/màu nước loang ra từ đúng điểm đó: lớp cover bị "khoét" bằng `clip-path: circle()` từ 0 tới 150% tại toạ độ chạm, mép loang là 1 SVG vệt màu `scale` theo cùng nhịp | 1.2s | `clip-path` + transform | Vừa | loang từ giữa màn, 600ms | + 2 vệt phụ trễ 150ms | `mau-nuoc`, `sen-cham`, `muc-giay` |
| `polaroid` | Ảnh polaroid | Tấm polaroid úp trên bàn. Chạm: lật ngửa (`rotateY` 500ms), ảnh "hiện hình" như rửa ảnh: lớp trắng đục và lớp màu sepia phủ trên ảnh giảm opacity (1.2s, **không animate filter**), tên cặp đôi viết tay hiện bằng clip-wipe ở mép dưới, rồi tấm ảnh bay lên ra khỏi màn | 2.2s | transform + opacity nhiều lớp | Thấp | bỏ bước rửa ảnh | + 2 tấm polaroid phụ trượt ra lệch góc | `pastel-han`, `hoai-co`, `bien-dao` |

Tổng cộng **17 kiểu** (5 cũ + 12 mới) và giá trị `"theme"` (theo theme, mặc định).

**Tự hạ cấp theo chi phí:** **(v3, đã chốt: giữ `light-gather`)** máy bị đánh giá yếu (5.5) thì kiểu chi phí **Cao** (`light-gather`) hạ về fade (`fade-zoom` 0.7s); kiểu **Vừa** chạy bản "Nhẹ". Admin thấy cảnh báo khi chọn kiểu Cao: "Hiệu ứng này đẹp nhưng nặng; máy yếu sẽ tự dùng kiểu đơn giản".

**Hiệu ứng nối tiếp sau khi mở (mới, `effects.burst.onOpen`):** `none` · `confetti` (giấy màu theo theme) · `petals` (cánh hoa theo hạt của theme) · `gold` (bụi vàng) · `red-paper` (xác pháo giấy đỏ, hợp `son-do`). Mặc định `"theme"`: Trầm Vàng dùng `petals`. Chi tiết ở 5.7.

### 3.4c Mẫu phong thư (v4)
**Đã chốt 2026-10-08:** làm đủ 6 mẫu; `song-hy`, `kraft`, `velvet` giữ màu cố định (admin vẫn chọn được "Theo theme"); mẫu "Thư hàng không" để dành v4 sau.

**Nguyên tắc:**
- Chỉ áp dụng khi kiểu mở resolve ra `envelope`. Mọi mẫu dùng **chung bố cục 3.2 và timeline 3.4** (cùng module `envelope.ts`). Mỗi mẫu là một **skin**: SVG + biến CSS + tối đa 1 bước animation riêng thay cho pha seal. Mỗi skin ≤ 1.5KB gz, import động theo mẫu đang chọn. Tổng thời lượng vẫn ≤ 2.4s.
- 6 mẫu (Hick's Law: ≤ 7 lựa chọn, có ảnh xem trước). Chữ trên mặt phong bì luôn ≥ 4.5:1 với giấy (mỗi skin khai báo `--env-ink`).
- Reduced-motion và cấp Tắt: mọi mẫu đều mở bằng fade 200ms (như 3.4b). Bản Nhẹ: bỏ bước animation riêng của skin, chỉ giữ timeline Nhẹ chung.

| id | Tên trong admin | Visual | Màu | Animation riêng (thay pha seal 0–380ms) | Chi phí | Theme gợi ý |
|---|---|---|---|---|---|---|
| `classic` ★ | Cổ điển · dấu sáp | Giấy ngà, nắp tam giác nhọn, lót sọc chéo accent, dấu sáp monogram (3.2) | **Theo theme** (surface/accent/primary) | Dấu sáp tách đôi | Thấp | tram-vang, luc-bao, sen-cham |
| `kraft` | Giấy kraft · dây gai | Giấy kraft có thớ (noise thô, tĩnh), dây gai buộc chữ thập + nơ, thẻ tên giấy ngà treo dây ghi "Kính gửi …", nhánh oải hương/cỏ lau khô kẹp dưới nút | **Cố định**: kraft `#C9A47A`, mặt `#D8B98F`, mực `#3A2A20` (9.1:1 trên `#D8B98F`), dây `#8B6B4A` | Nơ tuột bằng `stroke-dashoffset` vòng nơ 260ms, dây trượt `translateX(±120%)` sang hai bên + fade; thẻ tên lắc ±4° rồi rơi theo bao | Thấp–Vừa | dat-nung, hoai-co |
| `song-hy` | Phong bì đỏ Song Hỷ | Đỏ son, viền chỉ vàng kép, mây cát tường chìm (opacity .12), nắp vát tù (góc 150°); thay seal bằng **huy hiệu tròn vàng có chữ 囍** (symbol `songhy`); thẻ bên trong màu ngà viền đỏ | **Cố định**: đỏ `#A3201D`, vàng `#D4A23C`, chữ trên đỏ `#FFF4DC` (7.3:1) | Huy hiệu `rotateY(0→90°)` rồi biến mất (200ms) + vệt sáng quét qua viền vàng (gradient translate 300ms). Mức Nhiều: burst `red-paper` 24 mảnh | Vừa | son-do |
| `lace` | Ren & hoa | Màu nền theme pha hồng, **mép nắp lượn ren** (scallop + lỗ đục tròn, SVG tĩnh), giữ nắp bằng **cụm hoa ép** (2 bông + 3 lá, accent/accent2) thay seal | **Theo theme** (bg/accent/accent2) | Cụm hoa nhấc `translateY(-12px) rotate(-10deg)` + fade 260ms; mức Vừa/Nhiều rơi 6/12 cánh hoa qua engine hạt | Vừa (ren là SVG tĩnh, không animate mask) | hong-phan, mau-nuoc, pastel-han |
| `minimal` | Tối giản | Giấy phẳng, **nắp chữ nhật thấp** (cao 38%), một đường kẻ mảnh, sticker tròn 28px màu accent có chữ cái đầu thay seal; dòng "GỬI · Gia đình anh Mạnh" kiểu tem nhãn (sans uppercase 12px + tên 18px) | **Theo theme** | Sticker bóc từ góc `rotate(-25deg) translate(8px,-6px)` + fade 220ms; nắp mở 380ms; tổng ~1.5s | Thấp nhất | muc-giay, bien-dao |
| `velvet` | Nhung đêm | Nhung đen ánh đỏ (radial-gradient + noise tĩnh), viền chỉ vàng art-deco kép, nắp nhọn viền vàng, dấu sáp **vàng đồng ánh kim** (gradient 3 điểm), lót nắp hoạ tiết quạt deco | **Cố định khi theme sáng**: `#1C1517`/`#D9B77E`; **theo theme** khi `mode=dark` | Trước khi mở (0–350ms) vệt sáng chéo lướt qua viền vàng (gradient `translateX`, opacity). Mức Nhiều: 16 hạt `gold-dust` từ chỗ seal | Vừa | dem-nhung |

**Map gợi ý theo 12 theme (`ThemePreset.suggest.envelopeStyle`, trong code):**
| Theme | Mẫu | Theme | Mẫu |
|---|---|---|---|
| tram-vang ★ | `classic` | sen-cham | `classic` (giấy dó, seal chàm) |
| hong-phan | `lace` | mau-nuoc | `lace` |
| luc-bao | `classic` (lót xanh lục) | dat-nung | `kraft` |
| son-do | `song-hy` | pastel-han | `lace` |
| muc-giay | `minimal` | dem-nhung | `velvet` |
| hoai-co | `kraft` | bien-dao | `minimal` |
Map chỉ có tác dụng khi kiểu mở resolve ra `envelope`. Ví dụ `son-do` gợi ý kiểu mở `scroll`, nên mẫu `song-hy` chỉ hiện khi admin chọn kiểu mở "Phong bì".

**Màu (`cover.envelope.color`):** `auto` = theo mặc định của mẫu (cố định với kraft/song-hy/velvet, theo theme với 3 mẫu còn lại) · `theme` = ép nhuộm theo token theme · hex = màu giấy tuỳ chọn (mực tự chọn trắng hoặc đen theo tương phản, bắt buộc ≥ 4.5:1; không đạt thì admin hiện badge ✗ và dùng mực tối đa tương phản). Chữ trong seal dùng lại `cover.monogram`. Admin: xem 8.13 "Mẫu phong bì". Field: Phụ lục B.

### 3.5 Chuyển tiếp sang landing và bắt đầu nhạc
1. Ở **đúng handler click/tap** (đồng bộ, không await trước đó) gọi `audio.play()`. iOS chỉ cho phát khi gọi trực tiếp trong cử chỉ người dùng. Nếu promise bị reject thì nút nhạc chuyển trạng thái "Bấm để bật nhạc" (xem mục 6).
2. Landing đã render sẵn bên dưới (cover là overlay `position:fixed`, `z-cover`) nên khi mở không phải chờ tải. Trong lúc cover hiện: `body` khóa cuộn, landing có `inert`.
3. Kết thúc animation: gỡ cover khỏi DOM (hoặc `hidden`), bỏ `inert`, focus chuyển tới tiêu đề hero (`tabindex="-1"`), bắt đầu chuỗi animation vào của hero (stagger) và hiệu ứng hoa rơi.
4. Mỗi lần tải trang đều hiện cover (đã chốt trong `decisions.md`). Reload khi đang ở giữa trang thì vẫn hiện cover, nhưng sau khi mở sẽ cuộn về vị trí cũ (lưu `sessionStorage`).
5. **(v4) Tự động cuộn sau khi mở thiệp: BẬT mặc định** (thay quyết định cũ "tắt", theo `decisions.md` 2026-10-07/08). Bắt đầu sau `startDelayMs` 2.5s tính từ lúc cover gỡ xong, 45px/s, chế độ `flow`. Khách chạm, cuộn hay bấm phím là **dừng hẳn**, có nút "Tiếp tục tự cuộn", không tự chạy lại. Spec đầy đủ ở **5.11**.

### 3.6 Trạng thái cover
- **Đang tải** (font/ảnh cover chưa xong, > 300ms): hiện phong bì dạng nền giấy và monogram, nút ở trạng thái disabled với chữ "Đang chuẩn bị thiệp…"; quá 4s thì vẫn cho mở (không bao giờ chặn khách).
- **Lỗi tải config**: màn đơn giản với tên trang, "Không tải được thiệp, vui lòng thử lại" và nút "Tải lại".
- **Link khách sai** (to rỗng hoặc ký tự lạ): rơi về "Quý khách", không báo lỗi với khách.

---

## 4. Landing page: từng section

### 4.0 Quy tắc chung cho mọi section (để on/off và đổi thứ tự không vỡ layout)
- Container `<main>` render danh sách `sections.order` **sau khi lọc** các section bị tắt **và** các section rỗng dữ liệu (ví dụ album 0 ảnh hoặc events rỗng thì tự ẩn, không hiện khung rỗng cho khách).
- **Số thứ tự** ("01", "02"…) = chỉ số trong danh sách đã lọc, chỉ đánh cho section có `numbered: true` (hero, countdown, thank-you, footer không đánh số). Admin có thể tắt toàn bộ số (`sections.showNumbers`).
- **Nền xen kẽ** `bg`/`surface` tính theo chỉ số sau lọc, nên không bao giờ có 2 section cùng nền dính nhau. Section ảnh nền (hero, thank-you) bỏ qua quy tắc xen kẽ.
- **Dải phân cách** do container chèn giữa 2 section, section không tự vẽ. Admin chọn `sections.divider`: `ornament` ★ (đường mảnh, hình thoi hoặc cành lá SVG 120px), `wave` (đường sóng giấy xé), `none`. Không chèn divider trước/sau section có ảnh nền. **(v4, R07)** Divider **cao 0 và nằm trên đường ranh giới** giữa 2 section, không phải một dải riêng (bản v1 dùng `background: inherit` nên thành "sọc thứ ba" khác màu cả hai section): `.divider{height:0; position:relative; z-index:2}`, ornament `position:absolute; top:0; translate:-50% -50%`, `padding-inline:12px`, nền ornament = nền section **phía sau** (container truyền `--div-bg`). Nhìn như ornament "khâu" hai section vào nhau.
- Mỗi section tự có `padding-block: var(--section-py)`, `max-width` riêng, không giả định section trước/sau là gì. Mỗi section có `id` cố định (`#events`, `#rsvp`…) cho menu nổi, anchor có `scroll-margin-top: 16px`.
- Header section thống nhất:
```
      01 · THE BRIDE & GROOM          <- eyebrow: số + nhãn EN (sửa được, cho phép rỗng)
       Cô Dâu & Chú Rể                <- h2 heading
        ───── ◇ ─────                 <- ornament nhỏ màu accent
```
- Nội dung text của mọi section lấy từ config. Trường rỗng thì ẩn phần tử đó, không để khoảng trống.
- Reveal mặc định: `fade-up` (translateY 24px, opacity 0 thành 1, 700ms, stagger 80ms giữa các con), kích hoạt bằng IntersectionObserver `threshold 0.15`, `rootMargin "0px 0px -10% 0px"`, chạy **một lần**.

### 4.1 Hero
- **Mục đích:** ấn tượng thị giác đầu tiên, khẳng định ai cưới và khi nào.
- **Config:** `cover.image` (+ `focalPoint`), `couple.groom.shortName`, `couple.bride.shortName`, `invitation.kicker` ("Save the Date"), ngày (`invitation.day/month/year/weekday`), `lunarDate`.
- **Mobile:** ảnh full-bleed `100svh` (có `min-height: 560px`), `object-position` theo focal point admin chọn. Gradient phủ từ dưới lên (`--c-overlay` 0% đến 55%) để chữ trắng đọc được (đạt ≥ 4.5:1, kiểm tra trên vùng sáng nhất). Nội dung ở **1/3 dưới**:
```
┌────────────────────┐
│   [ảnh cưới]       │
│                    │
│   SAVE THE DATE    │ eyebrow trắng
│   Minh Anh         │ script --fs-names
│        &           │
│     Thuỳ Linh      │
│ 12 · 12 · 2026     │ heading, letter-spacing .15em
│ Tức ngày 3/11 Bính Ngọ
│        ⌄           │ scroll cue (nhún 1.6s lặp, dừng sau 3 lần)
└────────────────────┘
```
- **Desktop:** bố cục lệch 7/5: ảnh chiếm 58% bên trái cao 100vh, khối chữ trên nền giấy bên phải, căn trái theo trục chung. Không làm "hero chữ giữa đè lên ảnh" kiểu template.
- **Animation:** ảnh Ken Burns (scale 1 lên 1.08, 20s, alternate) từ mức "vừa" trở lên; tên hiện lần lượt groom, "&", bride (stagger 180ms, fade-up + `letter-spacing` từ .1em về 0); parallax ảnh 0.15 lần tốc độ cuộn ở mức "nhiều".
- **Trạng thái:** ảnh chưa tải thì hiện nền màu chủ đạo của ảnh (`dominantColor` admin sinh khi upload) + LQIP blur 24px; ảnh lỗi thì dùng nền gradient primary sang text, chữ vẫn trắng. Hero không có ảnh thì có biến thể "chữ trên nền giấy" (không overlay, chữ màu text).

### 4.2 Couple (Cô dâu & Chú rể)
- **Config:** `couple.groom/bride`: `label`, `labelVi`, `fullName`, `photo`, `bio`; `couple.order` ("groom-first" ★ | "bride-first", có nơi theo phong tục nhà gái để cô dâu trước).
- **Mobile:** xếp dọc. Ảnh khung vòm 240×300 (tỉ lệ 4:5), viền accent lệch 6px; dưới ảnh là eyebrow "CHÚ RỂ", tên đầy đủ (h3) và bio (muted, tối đa 3 dòng). Giữa hai người có chữ "&" script 56px màu accent-decor.
- **Desktop:** 2 cột đối xứng, "&" lớn ở giữa trục; ảnh 320×400.
- **Animation:** ảnh trái trượt từ trái, ảnh phải trượt từ phải (`translateX ±32px`), "&" scale 0.6 lên 1.
- **Trạng thái:** thiếu ảnh thì hiện khung vòm nền surface với monogram chữ cái đầu (không để ảnh vỡ); thiếu bio thì ẩn.

### 4.3 Families (Hai bên gia đình)
- **Config:** `families.groomFamily/brideFamily`: `title`, `parentsLabel`, `father`, `mother`, `address`, `photo` (tùy chọn, mặc định không hiện ảnh).
- **Mobile:** 2 cột (mỗi cột khoảng 150px ở 360px), ngăn giữa bởi đường dọc mảnh. Chữ căn giữa từng cột, tên cha mẹ 16px heading, xuống dòng tự nhiên. **Dưới 340px** chuyển sang xếp dọc.
```
   NHÀ TRAI     │     NHÀ GÁI
   Ông bà       │     Ông bà
 Nguyễn Văn Bình│  Trần Văn Long
  Lê Thị Hoa    │  Phạm Thị Mai
 Số 12 Ngõ 88,  │  Số 45 Đường Láng,
 Ba Đình, HN    │  Đống Đa, HN
```
- **Desktop:** 2 cột rộng, ảnh gia đình (nếu bật) khung chữ nhật bo 14px phía trên.
- **Animation:** 2 cột fade-up stagger 120ms; đường dọc giữa "vẽ" từ trên xuống (`scaleY 0 lên 1`, 600ms).

### 4.4 Announcement / Lời mời (Trân trọng báo tin)
- **Config:** `announcement.heading`, `subheading`, tên đầy đủ hai bên, sự kiện chính (`events[mainEventId]`), `inviteLine` ("Trân trọng kính mời {guest} tới dự"), ngày dương + âm.
- **Bố cục (mobile và desktop, cột hẹp 36ch):** đây là "trang thiệp in", căn giữa toàn bộ.
```
       Trân trọng báo tin
   Lễ Thành Hôn của con chúng tôi
        Nguyễn Minh Anh
              &
         Trần Thuỳ Linh
  Trân trọng kính mời Gia đình anh Mạnh
     tới dự bữa tiệc chung vui cùng
          gia đình chúng tôi
  ┌─────────┬──────┬─────────┐
  │ THỨ BẢY │  12  │ THÁNG 12│   khối ngày: 2 cột nhỏ hai bên số lớn,
  │         │      │  2026   │   phân cách bằng đường dọc accent
  └─────────┴──────┴─────────┘
   (Tức ngày 3 tháng 11 năm Bính Ngọ)
          Vào lúc 11:30
```
- **Animation:** từng dòng fade-in tuần tự (stagger 90ms), số "12" scale 0.85 lên 1.
- **(v4, R15)** Tên khách trong dòng mời in đậm (`font-weight:600; color:var(--c-text)`); mọi dòng `text-wrap: balance` để không có chữ mồ côi ("tôi", "tới dự"). Tên khách, tên cặp đôi và dòng mời là **vùng dịu** của hạt nền (5.7).

### 4.5 Events + Map
- **Config:** `events[]`: `name`, `date`, `displayDate`, `lunarDate`, `welcomeTime`, `startTime`, `venueName`, `address`, `mapUrl`, `mapEmbedUrl` (tùy chọn), `rsvpEnabled`, `image` (tùy chọn).
- **Mobile:** danh sách thẻ dọc, **căn trái** (đây là thông tin tra cứu, cần quét nhanh). Mỗi thẻ có viền mảnh `--c-line`, radius 14, nền surface:
```
┌──────────────────────────────┐
│ LỄ THÀNH HÔN            [ảnh]│  h3
│ Thứ Bảy 12 Tháng 12 · 2026   │
│ (Tức ngày 3/11 Bính Ngọ)     │  muted
│ ┌──────────┬──────────┐      │
│ │ ĐÓN KHÁCH│ KHAI TIỆC│      │  2 ô giờ, số lớn 24px heading
│ │  11:00   │  11:30   │      │
│ └──────────┴──────────┘      │
│ ◉ Trung Tâm Tiệc Cưới Hoa Cưới│
│   Số 200 Trần Duy Hưng, ...  │
│ [Chỉ đường] [Thêm vào lịch]  │  2 nút outline cao 44px
│ [   Xác nhận tham dự      ]  │  nút primary full width (nếu rsvpEnabled)
│ ▸ Xem bản đồ                 │  click-to-load iframe 16:10
└──────────────────────────────┘
```
- **Desktop:** ≤ 2 sự kiện thì 2 cột; ≥ 3 thì lưới 2 cột. Sự kiện chính (`mainEventId`) có viền primary và nhãn "Sự kiện chính".
- **Chỉ đường:** mở `mapUrl` tab mới (trên mobile sẽ mở app Google Maps). **Thêm vào lịch:** tạo file `.ics` phía client (tên, giờ, địa chỉ, nhắc trước 1 ngày). **Xem bản đồ:** chỉ tải iframe khi bấm (tiết kiệm khoảng 500KB+ JS của Google Maps), có `title` cho iframe.
- **Xác nhận tham dự:** cuộn tới `#rsvp` và tick sẵn sự kiện đó.
- **Animation:** thẻ fade-up stagger 120ms; icon ghim bản đồ nhún 1 lần khi vào màn.
- **Trạng thái:** sự kiện đã qua thì thẻ mờ 70% với nhãn "Đã diễn ra" và ẩn nút RSVP; iframe lỗi thì hiện link "Mở Google Maps".
- **(v4, R20)** 2 nút outline: `padding-inline:14px`, icon cùng 18px; dưới 360px thì xếp dọc full-width. Badge "Sự kiện chính" 12px (2.4).

### 4.6 Countdown (Đếm ngược)
- **Config:** `countdown.targetDate`, `heading`, `todayLabel`, `afterLabel` (mới: "Cảm ơn bạn đã đến chung vui"), `style` ("flip" ★ | "simple").
- **Bố cục:** 4 ô vuông (Ngày, Giờ, Phút, Giây) ngang hàng; ở 360px mỗi ô 72×80, số 32px heading, nhãn 12px eyebrow (`letter-spacing:.14em`, R10). **(v4, R18)** Không chừa khoảng trống dưới 4 ô cho chip milestone: luôn hiện một chip tĩnh "Còn 65 ngày" (nội dung đổi khi tới mốc 100/30/7/1 ngày), hoặc không có chip thì không có khoảng trống. Desktop: ô 120×132, số 56px. Nền section có thể là ảnh mờ + overlay (tùy chọn).
- **Animation:** số đổi theo kiểu "flip" (nửa trên lật `rotateX(-90deg)` 300ms, nửa dưới 300ms) hoặc "slide" (số cũ trượt lên, số mới trượt từ dưới, 350ms). Chỉ ô thay đổi mới animate; ô "Giây" ở mức nhẹ thì dùng fade đơn giản. Khi tab ẩn thì dừng `setInterval`, khi quay lại thì tính lại ngay (không chạy bù).
- **Trạng thái:**
  - Trước ngày: 4 ô.
  - Trong ngày cưới (cùng ngày lịch, giờ VN): ẩn ô, hiện `todayLabel` script 36px với tim đập nhẹ.
  - Sau ngày: hiện `afterLabel`; admin có tùy chọn tự ẩn section sau ngày.
  - `aria-live` **không** đặt trên ô giây (tránh screen reader đọc liên tục); có văn bản ẩn "Còn 66 ngày đến ngày cưới" cập nhật mỗi phút.

### 4.7 Timeline / Love story
- **Config:** `timeline.mode`: `schedule` ★ (lịch trình ngày cưới: `label`, `time`, `date`) | `story` (chuyện tình: `year`, `title`, `text`, `photo`). Có thể bật cả hai thành 2 section riêng (`timeline` và `loveStory`). **Giả định:** solution bổ sung `loveStory` vào schema; nếu không có thì chỉ làm `schedule`.
- **Mobile:** trục dọc ở **lề trái** (x = 20px), chấm tròn 12px viền primary, nội dung bên phải căn trái. Story có ảnh 16:10 bo 14px.
- **Desktop:** trục ở giữa, các mục so le trái/phải (chỉ với `story`; `schedule` vẫn để trục trái cho dễ đọc).
- **Animation:** đường trục "vẽ" theo tiến độ cuộn (`scaleY` theo scroll, chỉ ở mức vừa/nhiều); chấm tròn pop `scale 0 lên 1` (cubic-bezier(.34,1.56,.64,1)); nội dung fade-left.

### 4.8 Album + Lightbox
- **Config:** `album.images[]` gồm {`src`, `thumb`, `alt`, `w`, `h`}, `album.layout` ("masonry" ★ | "grid" | "carousel"), `album.previewCount` (mặc định 9).
- **Mobile:** masonry 2 cột, gap 8px; ảnh thứ 1 (và thứ 6) chiếm full 2 cột để tạo nhịp. Hiện `previewCount` ảnh, sau đó nút "Xem tất cả 24 ảnh". Desktop: 3 cột, gap 12px.
- **Ảnh:** luôn có `width/height` (hoặc `aspect-ratio`) để không nhảy layout (CLS), `loading="lazy"`, `decoding="async"`, thumb ≤ 600px rộng; placeholder là màu `dominantColor`.
- **Lightbox:**
  - Mở bằng animation phóng ảnh từ vị trí thumb (FLIP technique, 320ms). Nền đen 92%.
  - **Vuốt ngang** đổi ảnh (theo ngón tay, ngưỡng 20% chiều rộng hoặc vận tốc > 0.3px/ms, snap 250ms); **vuốt xuống** để đóng (ảnh co lại theo kéo); double-tap hoặc pinch để zoom 2x (mức tối thiểu là double-tap).
  - Nút **‹ ›** 48px (thay thế cho thao tác kéo, đáp ứng WCAG 2.5.7), nút **Đóng** 48px góc trên phải trong safe-area, bộ đếm "3 / 24", phím ← → Esc, focus trap, khóa cuộn nền, preload ảnh kề.
  - **(v3)** Ảnh full album: **cạnh dài 1600px**, WebP (fallback JPEG); thumb 600px. Chỉ tải ảnh full khi mở lightbox.
- **Animation vào màn:** ảnh fade + scale 0.96 lên 1, stagger 60ms theo thứ tự hiển thị (tối đa 9 ảnh đầu, phần còn lại không stagger).
- **Trạng thái:** đang tải thì ô màu dominant + shimmer nhẹ (tắt shimmer ở reduced-motion); ảnh lỗi thì ẩn ô đó (không để icon vỡ); 0 ảnh thì section tự ẩn.

### 4.9 Gift / Mừng cưới (QR ngân hàng)
- **Config:** `gift.heading`, `message`, `showBankInfo`, `bankAccounts[]`: {`role` ("Chú rể"/"Cô dâu"/"Bố mẹ"...), `owner`, `bank`, `bankBin`, `accountNumber`, `qrImage` (tùy chọn)}.
- **Bố cục section:** hộp quà line-art SVG (nắp hộp nhún nhẹ khi vào màn), `message`, nút "Gửi quà mừng cưới". **Không** hiện số tài khoản trần trên trang (tế nhị), chỉ hiện khi khách chủ động bấm.
- **Bottom sheet (mobile) / dialog (desktop):**
```
┌──────────────────────────────┐
│ ▬▬  (kéo để đóng)        [✕] │
│        Mừng cưới             │
│ [ Chú rể ] [ Cô dâu ]        │ segmented tab
│   ┌──────────────┐           │
│   │   QR 220px   │           │ nền trắng bắt buộc (máy quét cần tương phản)
│   └──────────────┘           │
│ NGUYEN MINH ANH              │
│ Vietcombank                  │
│ 0123 456 789      [Sao chép] │ số nhóm 3 chữ số, font tabular
│ [ Tải ảnh QR ]               │
│ Quét bằng app ngân hàng bất kỳ│
└──────────────────────────────┘
```
- QR: ưu tiên ảnh QR admin upload; nếu không có thì sinh **VietQR client-side** từ `bankBin + accountNumber` (đã chốt vòng 2; test bằng 1 tài khoản thật ở v1). Design chỉ cần một ảnh vuông.
- Sao chép: `navigator.clipboard`, đổi nút thành "✓ Đã chép" 2s kèm toast `role="status"`; fallback chọn text.
- `showBankInfo=false` thì section chỉ có lời nhắn, không có nút.
- **(v4, R21, R22)** Lời nhắn: `max-width: 34ch` + balance; dài hơn 3 dòng thì căn trái (quy tắc 1.1). Nút "Sao chép" tối thiểu 44px.
- **Animation:** sheet trượt lên 280ms `cubic-bezier(.22,1,.36,1)`, nền mờ fade 200ms.

### 4.10 Guestbook (Sổ lưu bút)
- **Config:** `guestbook.heading`, `subheading`, `seedMessages[]`, `maxLength` (300), `showBubbles` (lời chúc bay nổi, mặc định TẮT). Chế độ lưu: **Giả định theo solution** (local / Google Apps Script / dịch vụ khác).
- **Bố cục mobile:**
  - Form ở trên: "Tên của bạn" (điền sẵn tên khách), "Lời chúc" (textarea tự giãn 3 đến 6 dòng, bộ đếm "120/300"), 4 chip gợi ý chạm-để-chèn ("Trăm năm hạnh phúc", "Sớm có tin vui"... giảm nỗi sợ trang trắng), nút "Gửi lời chúc" full-width. **(v4, R11)** Chip `min-height:44px`; dưới 480px gói chip thành **một hàng cuộn ngang** (`overflow-x:auto; scroll-snap-type:x proximity`, mép phải có gradient mờ báo còn chip), desktop vẫn xuống dòng; nhóm chip có `aria-label="Gợi ý lời chúc"`.
  - Danh sách bên dưới: thẻ trích dẫn (dấu ngoặc kép lớn màu accent, nội dung, "— Tên · 2 tuần trước"), mới nhất ở trên, hiện 6, "Xem thêm lời chúc (24)". **Không cuộn lồng.**
- **Desktop:** 2 cột 5/7, form trái (sticky), danh sách phải.
- **Trạng thái:**
  - Đang tải danh sách: 3 skeleton thẻ.
  - Rỗng: "Hãy là người đầu tiên gửi lời chúc" + minh họa nhỏ.
  - Đang gửi: nút disabled, chữ "Đang gửi…" + spinner nhỏ.
  - Thành công: lời chúc mới chèn đầu danh sách (highlight nền accent 15% mờ dần 1.5s), hiệu ứng vài trái tim bay lên từ nút (ở mức ≥ nhẹ), form reset, toast "Cảm ơn lời chúc của bạn!".
  - Lỗi: giữ nguyên nội dung đã gõ, thông báo đỏ có icon ngay dưới nút "Chưa gửi được, kiểm tra mạng và thử lại" + nút "Thử lại".
  - Validate: tên ≥ 2 ký tự, lời chúc ≥ 2 ký tự; lỗi hiện dưới đúng ô, `aria-describedby`.
- `showBubbles`: mỗi 6s một bong bóng lời chúc trượt lên ở góc trái-dưới (trên menu nổi), tự tắt khi người dùng đang ở section guestbook/RSVP hoặc đang gõ.

### 4.11 RSVP (Xác nhận tham dự)
- **Config:** `rsvp.heading`, `subheading`, `attendingLabel`, `notAttendingLabel`, `guestCountLabel`, `maxGuests` (5), `deadline` (tùy chọn: "Vui lòng phản hồi trước 30/11"), `askEvents` (true khi có > 1 sự kiện), `askNote` (true). Chế độ lưu: **Giả định theo solution**.
- **Form (mobile, một cột, căn trái):**
  1. Họ và tên (điền sẵn tên khách).
  2. "Bạn có tham dự không?": **2 thẻ chọn lớn** (radio stylized, cao 64px, icon + chữ): "Tôi sẽ đến" / "Rất tiếc, tôi không thể đến". Không dùng radio nhỏ mặc định.
  3. (chỉ khi "sẽ đến") "Bạn đi mấy người?": stepper [−] 1 [+] (nút 44px, `input type=number` cho screen reader).
  4. (chỉ khi "sẽ đến" và có > 1 sự kiện) checkbox các sự kiện: "Lễ Ăn Hỏi (10/12)", "Lễ Thành Hôn (12/12)".
  5. Lời nhắn (tùy chọn).
  6. Nút "Gửi xác nhận".
  Phần 3 và 4 mở/đóng bằng animation chiều cao (dùng `grid-template-rows 0fr sang 1fr`, 250ms).
- **Trạng thái:**
  - Thành công: thay form bằng thẻ xác nhận ("Cảm ơn Gia đình anh Mạnh! Chúng mình đã ghi nhận: 2 người · Lễ Thành Hôn" + nút "Sửa phản hồi"); lưu localStorage để lần sau mở lại vẫn thấy trạng thái đã gửi.
  - Khi chọn "không thể đến", thông điệp cảm ơn nhẹ nhàng + gợi ý "Gửi lời chúc" / "Mừng cưới".
  - Lỗi, validate, đang gửi: giống Guestbook.
  - Quá `deadline`: form vẫn mở nhưng có ghi chú "Đã quá hạn xác nhận, chúng mình vẫn rất vui nếu bạn báo lại".

### 4.12 Thank you
- **Config:** `thankYou.heading`, `message`, `signature`, `photo` (tùy chọn).
- **Bố cục:** ảnh nền (hoặc nền giấy) + overlay, chữ căn giữa cột 32ch: heading script, message, chữ ký "Minh Anh & Thuỳ Linh" script 40px (44px với Imperial Script, 2.2).
- **(v4, R02) Lớp phủ riêng, không dùng lại `.hero-shade`:** hero tối ở đáy còn khối chữ Cảm ơn nằm giữa, nên dùng chung lớp phủ làm chữ trắng nằm trên vùng ảnh sáng (< 3:1). Dùng `.ty-shade { background: linear-gradient(var(--c-overlay), var(--c-overlay)), radial-gradient(60% 45% at 50% 50%, rgba(0,0,0,.28), transparent 70%); }`, tức là phủ đều cộng vùng tối nhẹ ngay sau khối chữ; theme tối dùng `rgba(bg,.55)` (1.6.3). Đo ≥ 4.5:1 trên vùng sáng nhất của ảnh thật.
- **Animation chữ ký "viết tay":** mặc định dùng **clip-path wipe** trái sang phải trên text script (`clip-path: inset(-0.3em 100% -0.3em 0)` chuyển thành `inset(-0.3em 0 -0.3em 0)`, 1.8s, `steps` không dùng mà dùng `cubic-bezier(.55,.1,.35,1)`). Chừa ±0.3em để không cắt dấu tiếng Việt. Nếu admin upload **SVG chữ ký nét đơn** thì dùng `stroke-dasharray/dashoffset` vẽ nét thật (2.2s).
- Hoa rơi đậm hơn một chút ở section này (mức ≥ vừa), kiểu "đoạn kết".

### 4.13 Footer
- Monogram, "12 · 12 · 2026", dòng nhỏ "Thiệp được làm với ♡" (icon SVG), vendor (nếu `vendor.show`: logo 32px, tên, tagline, số điện thoại là link `tel:`). Muted 13 đến 14px. Có `padding-bottom` đủ chỗ cho cụm nút nổi (khoảng 88px + safe-area) để nút nổi không che chữ cuối.

---

## 5. Hệ thống animation

### 5.1 Token
```css
--dur-micro: 160ms;   /* hover, nhấn nút, toggle */
--dur-ui:    260ms;   /* sheet, toast, accordion */
--dur-reveal:700ms;   /* scroll reveal */
--dur-hero:  1200ms;  /* chuỗi vào hero */
--ease-out:  cubic-bezier(.22,1,.36,1);
--ease-inout:cubic-bezier(.65,0,.35,1);
--ease-pop:  cubic-bezier(.34,1.56,.64,1);   /* chấm, tim, scale nhỏ */
--reveal-distance: 24px;
--stagger: 80ms;
```

### 5.2 Danh mục hiệu ứng
| Mã | Mô tả | Kỹ thuật | Ghi chú hiệu năng |
|---|---|---|---|
| `petals` | Cánh hoa/tim/lá rơi, lắc nhẹ | **1 canvas** fixed `pointer-events:none`, sprite PNG/SVG raster sẵn, rAF | Giới hạn số hạt theo cấp; DPR tối đa 2; dừng khi tab ẩn |
| `reveal` | fade-up / fade-left / fade-right / zoom-in / blur-in* | IntersectionObserver + class, CSS transition | *blur-in chỉ ở desktop |
| `stagger` | Con xuất hiện tuần tự | `--i` index × `--stagger` | Tối đa 9 phần tử stagger |
| `kenburns` | Ảnh phóng chậm | CSS keyframes transform | Chỉ hero và thank-you |
| `parallax` | Ảnh nền trôi chậm hơn | rAF + transform translate3d, chỉ khi section trong viewport | Không dùng `background-attachment: fixed` (lỗi trên iOS) |
| `countdown-flip` | Số lật/trượt | CSS transform 3D | Chỉ ô thay đổi |
| `signature` | Chữ ký viết tay | clip-path hoặc stroke-dashoffset | Một lần |
| `line-draw` | Ornament/trục timeline vẽ ra | stroke-dashoffset / scaleY | |
| `heartbeat` | Tim đập (nút lời chúc, "Hôm nay") | keyframes scale 1 / 1.12 / 1, 1.4s | Dừng sau 3 chu kỳ, trừ ngày cưới |
| `float-hearts` | Tim bay khi gửi thành công | 6 đến 10 phần tử DOM, 1.2s rồi xóa | |
| `shimmer` | Skeleton | gradient translateX | Tắt ở reduced-motion |
| `cover-open` | 5 kiểu ở mục 3.4 + 12 kiểu mới ở 3.4b | | Chỉ tải module của kiểu đang chọn |
| *(mới)* | Hạt nền, burst, reveal, micro-interaction mở rộng | | Xem 5.6 đến 5.10 |

### 5.3 Cấp độ cường độ (`effects.intensity`, admin chọn)
| | **Tắt** | **Nhẹ** | **Vừa ★** | **Nhiều** |
|---|---|---|---|---|
| Mở thiệp | fade 200ms | kiểu đã chọn | kiểu đã chọn | kiểu đã chọn + lấp lánh nhỏ |
| Reveal | không | fade (không dịch chuyển) | fade-up 24px | fade-up 32px + biến thể trái/phải/zoom |
| Hạt rơi (petals) | 0 | 8 hạt | 16 hạt | 28 hạt |
| Ken Burns | không | không | có | có |
| Parallax | không | không | không | có (hero, thank-you) |
| Countdown | đổi số tức thì | fade | flip/slide | flip/slide |
| Chữ ký / line-draw | hiện ngay | có | có | có |
| Tim bay, heartbeat | không | không | có | có |

Admin còn có toggle riêng cho từng hiệu ứng (petals: loại hạt `petal|heart|leaf|snow-dot`, màu hạt mặc định lấy theo accent; reveal: kiểu mặc định) **bên dưới** thanh cường độ, đặt trong "Tùy chỉnh nâng cao" (progressive disclosure).

### 5.4 `prefers-reduced-motion: reduce`
- Ép mức "Tắt" cho mọi thứ **chuyển động**; vẫn giữ fade opacity ≤ 200ms (fade không gây say chuyển động). Không có hạt rơi, Ken Burns, parallax, flip.
- Cover: mở bằng fade 200ms.
- Khách vẫn có nút "Bật hiệu ứng" trong menu nổi (lưu localStorage), vì người dùng có quyền chọn lại.
```css
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.01ms!important; animation-iteration-count:1!important;
    transition-duration:.01ms!important; scroll-behavior:auto!important; }
  .reveal{ opacity:1; transform:none; }
}
```

### 5.5 Ngân sách hiệu năng (mục tiêu máy Android tầm thấp: 4 nhân, RAM 2 đến 3GB, Chrome, 4G)
- **Tự hạ cấp:** nếu `navigator.hardwareConcurrency <= 4` **hoặc** `navigator.deviceMemory <= 2` **hoặc** `saveData` thì cường độ tự giảm 1 bậc (Nhiều thành Vừa, Vừa thành Nhẹ). Đo FPS 2s đầu sau khi mở thiệp: trung bình < 45fps thì giảm tiếp 1 bậc (tắt petals trước, sau đó tới Ken Burns).
- Chỉ animate `transform` và `opacity`. **Cấm** animate `filter: blur`, `box-shadow`, `width/height/top/left`, `backdrop-filter` (backdrop-filter chỉ dùng tĩnh và chỉ ≥ 768px).
- Canvas petals: ≤ 2ms/frame; tạm dừng khi `document.hidden`, khi mở lightbox/sheet, và khi người dùng đang gõ form (chi tiết hạt cả trang ở 5.7, v3).
- Số phần tử có `will-change` cùng lúc ≤ 6.
- Không thư viện animation nặng. Nếu cần thì chỉ dùng thư viện nhẹ < 15KB gz. Khuyến nghị CSS + IntersectionObserver thuần.
- **Mục tiêu đo:** LCP < 2.5s (4G), CLS < 0.05, INP < 200ms. Trang ban đầu (không tính nhạc, album ngoài màn) ≤ 900KB. Ảnh hero ≤ 250KB (WebP), thumb album ≤ 80KB, nhạc `preload="none"` cho tới khi người dùng chạm mở thiệp (có thể bắt đầu `preload="auto"` ngay khi cover hiện để mở là có nhạc; MP3 128kbps khoảng 3 đến 4MB, khuyên admin dùng ≤ 96kbps).

### 5.6 Kiến trúc chung cho hiệu ứng mở rộng (mới)
- **Một engine hạt duy nhất** (`ParticleField`): 1 canvas fixed `pointer-events:none`, `aria-hidden`, `z-petals`. Mọi loại hạt nền và burst dùng chung engine này (không tạo canvas thứ 2). Sprite của từng loại vẽ sẵn 1 lần từ SVG ra canvas phụ ở 2 cỡ, sau đó chỉ `drawImage` (nhanh hơn vẽ path mỗi frame). Engine tự viết khoảng 3KB gz.
- **Mô hình chuyển động** của hạt: `fall` (rơi + lắc ngang hình sin), `float-up` (nổi lên: bong bóng, tim), `drift` (trôi ngang: cỏ lau, lá), `twinkle` (đứng gần yên, nhấp nháy opacity: đom đóm, lấp lánh). Hiệu ứng "lật 3D giả" cho cánh hoa: `scaleX = cos(phase)` thay vì 3D thật.
- **Trần cứng:** tối đa 40 hạt nền cùng lúc + 120 hạt burst; burst tự xoá sau khi xong; DPR tối đa 2; mỗi frame ≤ 2ms (đo bằng `performance.now()`, vượt 3 frame liên tiếp thì giảm 25% số hạt).
- **Thư viện:** không bắt buộc thư viện nào. Nếu muốn rút ngắn thời gian làm: `canvas-confetti` (khoảng 4 đến 6KB gz) cho burst; **không** dùng Lottie (lottie-web khoảng 60KB gz), GSAP (core khoảng 25KB gz) hay particles.js/tsParticles (≥ 30KB gz). Animation DOM dùng CSS + Web Animations API thuần.
- **Phát lại được** (phục vụ nút "Phát lại" trong admin): mọi hiệu ứng đăng ký vào một `EffectRegistry` có `play()`, `reset()` và `setTimeScale(x)`; WAAPI dùng `animation.playbackRate`, canvas nhân `dt` với `timeScale`.

### 5.7 Hạt nền và burst (mới)

**Hạt nền (`effects.particles.type`, chọn tối đa 2 loại trộn nhau):**
| Mã | Tên trong admin | Mô tả | Chuyển động | Hệ số mật độ | Ghi chú |
|---|---|---|---|---|---|
| `petal-rose` | Cánh hồng | **(v4, R13)** Cánh hồng hình **giọt nước ngược**: đầu tròn rộng, gốc nhọn hẹp, mép trên có 1 khía nhẹ (không đối xứng hai đầu như hạt hạnh nhân). Tô 2 lớp: accent 100% + lớp sáng `mix(accent,#fff,35%)` ở 40% diện tích phía trên. Path (viewBox 0 0 20 24): `M10 23C4 18 1 12 2 7 3 2.5 7 1 10 3.5 13 1 17 2.5 18 7 19 12 16 18 10 23Z` | fall, lật giả | 1.0 | mặc định Trầm Vàng |
| `petal-sakura` | Hoa anh đào | Cánh 5 thuỳ có khía nhỏ, hồng nhạt | fall chậm, lắc rộng | 1.0 | |
| `petal-peach` | Hoa đào Tết | Cánh đào hồng đậm + nhụy | fall | 1.0 | hợp `son-do`, cưới gần Tết |
| `petal-lotus` | Cánh sen | Cánh sen lớn (24 đến 36px), rơi rất chậm, xoay chậm | fall chậm | 0.5 | |
| `petal-dried` | Hoa khô | Cánh hoa sepia/đất nung, mép nhăn | fall + drift | 0.8 | |
| `petal-watercolor` | Cánh màu nước | Sprite raster mép loang, opacity .8 | fall | 0.8 | |
| `plumeria` | Hoa sứ | Hoa 5 cánh trắng nhụy vàng, xoay tròn | fall | 0.6 | |
| `heart` | Tim | Tim phẳng màu primary/accent | float-up hoặc fall | 1.0 | |
| `paper-heart` | Tim giấy | Tim gấp giấy, lật giả 2 mặt | fall | 0.8 | |
| `leaf-green` | Lá xanh | Lá bầu dục xanh xô thơm | drift + fall | 0.8 | |
| `leaf-eucalyptus` | Lá bạch đàn | Lá tròn xanh xám | fall, xoay nhanh | 0.8 | |
| `leaf-maple` | Lá phong thu | Lá cam đỏ | drift | 0.7 | cưới mùa thu |
| `pampas` | Cỏ lau | Sợi lông nhẹ bay ngang | drift chậm | 0.6 | |
| `snow` | Tuyết | Chấm tròn mờ 2 đến 6px, nhiều lớp độ sâu | fall chậm | 1.5 | cưới tháng 12 |
| `bubble` | Bong bóng | Vòng tròn viền mảnh + điểm sáng | float-up, lắc | 0.7 | |
| `firefly` | Đom đóm | Chấm sáng vàng có quầng (sprite đã vẽ glow sẵn, không dùng `shadowBlur` mỗi frame). **(v4, R24)** Lõi `#FFE7A8` + quầng alpha .25, không có lớp nâu đục | twinkle + trôi chậm | 1.5 | hợp theme tối |
| `sparkle` | Lấp lánh | Ngôi sao 4 cánh nhỏ | twinkle | 1.2 | |
| `gold-dust` | Bụi vàng | Hạt 1 đến 3px màu primary/accent (**(v4, R24)** trần cứng ≤ 4px, không có hạt nâu đục to) | fall rất chậm + twinkle | 1.5 | |
| `ink-dot` | Chấm mực | Chấm tròn đen mờ .15 | fall rất chậm | 0.6 | `muc-giay` |
| `dust-mote` | Bụi nắng | Hạt sáng mờ trôi lờ đờ | drift | 1.0 | `hoai-co` |
| `red-paper` | Xác pháo giấy | Mảnh giấy đỏ nhỏ chữ nhật, lật giả | fall nhanh | 1.0 | `son-do` |

Số hạt = `số theo cấp (8/16/28) × hệ số mật độ`, làm tròn, không quá 40. Màu hạt: `"theme"` (accent/primary của theme) · `"multi"` (accent + accent phụ) · hoặc hex tuỳ chọn.

**(v3) Phạm vi `effects.particles.scope`: mặc định `all` (cả trang)**, theo quyết định vòng 2. `hero-thankyou` (chỉ khi hero hoặc thank-you trong viewport) vẫn là lựa chọn cho admin muốn trang "sạch". Để hạt cả trang không hại đọc chữ và hiệu năng, engine áp 5 lớp bảo vệ (lớp 5 thêm ở v4):

1. **Mật độ theo section đang chiếm viewport.** Mỗi section có hệ số mật độ; engine lấy trung bình có trọng số theo phần diện tích section đang hiện (IntersectionObserver, `threshold [0, .25, .5, .75, 1]`) rồi nhân với số hạt mục tiêu. Hạt thừa không bị xoá đột ngột: cho rơi hết khỏi màn rồi không sinh lại; hạt mới sinh dần (tối đa 2 hạt/giây) để không "bùng" khi cuộn.
   | Nhóm section | Hệ số mật độ | Opacity hạt tối đa |
   |---|---|---|
   | Hero, Cảm ơn | 1.0 | 1.0 |
   | Cô dâu chú rể, Gia đình, Lời mời, Album, Đếm ngược | 0.6 | 0.85 |
   | Sự kiện, Lịch trình/Love story | 0.35 | 0.7 |
   | RSVP, Sổ lưu bút, Mừng cưới, Footer | 0.25 | 0.6 |
2. **Né vùng form và khối chữ dày.** Canvas vẫn ở `z-petals` (trên nội dung, dưới thành phần nổi; không đặt dưới nội dung vì nền section xen kẽ là nền đặc sẽ che mất hạt), nên các **vùng loại trừ** gồm: thẻ form RSVP, form lời chúc, danh sách lời chúc, thẻ sự kiện (khối giờ + địa chỉ). Engine lấy `getBoundingClientRect()` của các vùng này (cập nhật bằng ResizeObserver và khi cuộn, tối đa 6 vùng, chỉ vùng đang trong viewport). Hạt đi vào vùng loại trừ + biên 16px thì **mờ dần về opacity 0 trong 200ms** và hiện lại khi ra khỏi vùng; hạt không bao giờ vẽ đè lên ô nhập, nút hay chữ địa chỉ. Chi phí: ≤ 40 hạt × ≤ 6 hình chữ nhật mỗi frame, không đáng kể.
3. **Tạm dừng** (dừng rAF, giữ nguyên vị trí hạt, không xoá canvas) khi: tab ẩn (`visibilitychange`) hoặc `pagehide`; lightbox, sheet mừng cưới hoặc menu nhanh đang mở; **focus đang ở input/textarea/select** (đang nhập form) và thêm 1.5s sau khi rời focus; cover chưa mở. Tiếp tục bằng fade-in 300ms.
4. **Trần theo cấp và máy:** Nhẹ 8, Vừa 16, Nhiều 28 (trước khi nhân hệ số loại hạt và hệ số section; trần cứng 40). Máy bị đánh giá yếu (5.5) thì hạ 1 bậc **và** trần cứng 12 hạt, DPR canvas = 1, tắt gió theo cuộn. FPS < 45 thì giảm theo thứ tự ở 5.10. `prefers-reduced-motion` hoặc cấp "Tắt" thì **không tạo canvas**.

5. **(v4, R03, đã chốt) Vùng dịu ở chữ quan trọng.** Khác vùng loại trừ ở lớp 2: hạt **vẫn bay qua** nhưng mờ đi, để giữ cảm giác "hoa bay qua" mà không che chữ. Vùng dịu gồm `.hero-names`, `.ann-names`, `.ann-invite` (dòng "Trân trọng kính mời {khách}") và `.sec-head` của section đang hiện, tối đa 4 vùng trong viewport. Hạt đi vào vùng + biên 8px thì opacity kẹp về **≤ 0.3** (fade 200ms), ra khỏi vùng thì trở lại opacity theo section. Tên khách trên mặt phong bì không cần vì canvas chưa chạy khi cover hiện. Chi phí: thêm ≤ 4 hình chữ nhật mỗi frame.

Hạt nền luôn `aria-hidden`, `pointer-events:none`, không bao giờ nhận click (không chặn nút).

**Gió theo cuộn (mức Nhiều):** khi người dùng cuộn, hạt bị đẩy nhẹ theo hướng cuộn (vận tốc cuộn × 0.2, giảm dần 600ms). Tạo cảm giác "thật" mà không tốn thêm hạt.

**Burst (hiệu ứng một lần):**
| Mã | Khi nào | Mô tả | Thời lượng | Số hạt (Nhẹ / Vừa / Nhiều) | Chi phí |
|---|---|---|---|---|---|
| `confetti` | Sau khi mở thiệp; RSVP "Tôi sẽ đến" | Giấy chữ nhật/tròn màu theme, bắn từ 2 góc dưới lên theo đường parabol, rơi lật | 1.8s | 0 / 80 / 120 (RSVP: 0 / 40 / 60) | Vừa |
| `petals` | Sau khi mở thiệp | Cánh hoa của theme bung từ giữa rồi chuyển thành hạt nền | 1.6s | 0 / 30 / 50 | Vừa |
| `gold` | Sau khi mở thiệp | Bụi vàng toả tròn, tắt dần | 1.4s | 0 / 60 / 100 | Vừa |
| `red-paper` | Sau khi mở thiệp | Xác pháo giấy đỏ bung từ trên xuống | 1.8s | 0 / 80 / 120 | Vừa |
| `fireworks-soft` | **(v3)** **Mỗi lần khách cuộn tới section đếm ngược** (điều kiện ở dưới) | Chùm pháo hoa nhỏ màu primary/accent, nổ trong khung section đếm ngược, cách nhau ≥ 600ms, **không nháy sáng cả màn** (WCAG 2.3.1, < 3 lần/giây) | ≤ 2.4s | 1 chùm × 24 hạt / 3 chùm × 40 / 5 chùm × 40 | Vừa |
| `heart-burst` | Gửi lời chúc thành công (thay `float-hearts` cũ khi bật) | 8 đến 12 tim bung từ nút | 1.2s | 0 / 8 / 12 | Thấp |

**(v3) Thông số kích hoạt `fireworks-soft` (mặc định `effects.burst.countdownFireworks = "every-view"`, đã chốt vòng 2):**
| Thông số | Giá trị |
|---|---|
| Điều kiện vào | Section đếm ngược hiện **≥ 50%** chiều cao trong viewport (IntersectionObserver `threshold: 0.5`) và giữ liên tục **400ms** (lướt nhanh qua thì không bắn) |
| "Lên đạn" lại | Chỉ bắn lần kế khi section đã **rời viewport** (hiện < 10%) rồi vào lại; đứng yên trong section không bắn lặp |
| Cooldown | **≥ 15s** tính từ lúc chùm cuối của lần trước tắt. Vào lại trong thời gian cooldown thì không bắn (không xếp hàng chờ) |
| Số chùm | Nhẹ: 1 chùm × 24 hạt · Vừa: 3 chùm × 40 · Nhiều: 5 chùm × 40. Cộng dồn với hạt nền vẫn trong trần burst 120 hạt (5.6) |
| Máy yếu (5.5) | Luôn dùng bản Nhẹ (1 chùm × 24 hạt), DPR 1 |
| Không bắn khi | cấp "Tắt" · `prefers-reduced-motion` (chỉ hiện chip chữ tĩnh, ví dụ "Chỉ còn 66 ngày!" hoặc "Hôm nay là ngày cưới!") · tab ẩn · lightbox/sheet đang mở · focus đang trong ô nhập |
| Vị trí **(v4, R04)** | **Không bao giờ nổ trên tiêu đề**: loại vùng `.sec-head` ("COUNTDOWN / Đếm ngược ngày cưới") khỏi vùng đặt gốc nổ. Gốc nổ nằm ở 2 dải bên cạnh 4 ô số (x < 18% hoặc > 82% bề rộng section) hoặc ở dải giữa tiêu đề và ô số; không đè lên chữ số; bán kính chùm ≤ 60px ở mobile; hạt mờ dần trước khi chạm mép section |
| Màu **(v4, R04)** | Theo `mode` của theme. **Theme sáng:** `accent` + `mix(accent, #fff, 45%)` + `primary` (primary chỉ chiếm 1/3 số hạt), sprite **sao 4 cánh 6px có lõi sáng** (không dùng chấm tròn, vì chấm primary nâu trên nền sáng trông như bụi bẩn). **Theme tối:** giữ bụi vàng như v1 |
Lựa chọn khác cho admin: `wedding-day` (chỉ bắn vào ngày cưới hoặc khi đồng hồ về 0 trong lúc xem, một lần mỗi phiên) và `off`.

### 5.8 Reveal khi cuộn (mới)

**Kỹ thuật nền:** IntersectionObserver (như 4.0), một lần, gắn class `is-in`. Mọi reveal là CSS transition/keyframes trên `transform`/`opacity`, trừ các ngoại lệ có ghi chi phí.

**Danh mục kiểu reveal nguyên tử:**
| Mã | Áp cho | Mô tả | Thời lượng / easing | Kỹ thuật | Chi phí |
|---|---|---|---|---|---|
| `fade` | mọi thứ | opacity 0 lên 1 | 600ms `--ease-out` | CSS | Thấp |
| `fade-up` | khối, thẻ | + `translateY(var(--reveal-distance))` | 700ms `--ease-out` | CSS | Thấp |
| `slide-side` | 2 cột đối xứng | trái vào từ trái, phải vào từ phải ±32px | 700ms | CSS | Thấp |
| `zoom-in` | ảnh, icon, "&" | `scale(.94)` lên 1 + fade | 600ms `--ease-out` | CSS | Thấp |
| `mask-up` | heading (serif/sans) | Mỗi **dòng** nằm trong wrapper `overflow:clip` có `padding-block:.3em; margin-block:-.3em` (chừa chỗ dấu), chữ trượt từ `translateY(110%)` lên 0. Kiểu "tạp chí" | 800ms `--ease-out`, stagger dòng 90ms | CSS; chia dòng sau khi font tải xong, chia lại khi resize | Thấp |
| `wipe` | ảnh, ornament, chữ ký script | `clip-path: inset(0 100% 0 0)` sang `inset(0)`; với chữ, inset có biên `-0.3em` trên dưới | 900ms `cubic-bezier(.55,.1,.35,1)` | clip-path | Vừa (repaint, giới hạn 3 phần tử cùng lúc) |
| `photo-settle` | ảnh trong khung | ảnh bên trong khung `scale(1.12)` về 1 + fade, khung đứng yên | 1100ms `--ease-out` | CSS transform | Thấp |
| `rise-tilt` | polaroid, thẻ lời chúc | `translateY(32px) rotate(-4deg)` về `rotate(var(--tilt, -1.5deg))` | 700ms `--ease-pop` | CSS | Thấp |
| `blur-in` | **chỉ heading**, chỉ desktop ≥ 1024px, chỉ mức Nhiều | `filter: blur(8px)` về 0 + fade, tối đa 3 phần tử trên trang | 600ms | CSS filter | Cao (ngoại lệ duy nhất được animate `filter`, thay cho câu "cấm" ở 5.5; mobile luôn rơi về `fade`) |
| `split-words` | heading, câu ngắn ≤ 20 từ | Từng **từ** hiện fade-up 12px | 500ms mỗi từ, stagger 40ms, tổng ≤ 900ms | DOM span | Thấp |
| `split-chars` | heading serif/sans ≤ 40 grapheme | Từng **ký tự** hiện fade-up 0.4em + xoay nhẹ | 450ms mỗi ký tự, stagger 28ms, tổng ≤ 900ms (dài hơn thì giảm stagger) | DOM span, **an toàn tiếng Việt, xem dưới** | Vừa |
| `svg-draw` | ornament, line-art minh hoạ, trục timeline, khung | Nét vẽ dần bằng `stroke-dasharray/dashoffset` | 1200 đến 1800ms `--ease-inout` | SVG | Thấp |
| `parallax-layers` | hero, thank-you, ornament góc | 3 lớp trôi khác tốc độ khi cuộn: texture/ornament nền `-0.05`, ảnh `0.15`, ornament trước `0.3` | theo cuộn | rAF + `translate3d`, chỉ khi section trong viewport | Vừa |

**Quy tắc `split-chars` an toàn với dấu tiếng Việt (bắt buộc):**
1. Chuẩn hoá **NFC** trước khi tách.
2. Tách bằng `Intl.Segmenter('vi', {granularity: 'grapheme'})`; trình duyệt chưa có thì fallback regex `/\P{M}\p{M}*/gu` (ký tự gốc + mọi dấu tổ hợp đi kèm). **Không bao giờ** dùng `str.split('')` hay vòng lặp theo code unit: chuỗi NFD như "e + ̂ + ̣" sẽ bị tách rời dấu.
3. Bọc từng **từ** trong `span` `display:inline-block; white-space:nowrap`, ký tự nằm trong từ, nên chỉ xuống dòng giữa các từ.
4. Mỗi span ký tự có `padding-block:.2em` (dấu chồng như "Ầ", "Ễ" không bị cắt), không đặt `overflow` trên span.
5. **Không áp cho font script** (Great Vibes, Pinyon...): tách span làm đứt nét nối giữa các chữ và mất kerning/ligature. Heading script tự rơi về `wipe`.
6. Accessibility: chuỗi gốc đặt trong `<span class="sr-only">`, khối span tách có `aria-hidden="true"`, để screen reader đọc nguyên từ chứ không đọc từng chữ.
7. Kerning giữa các span inline-block có thể lệch nhẹ ở một số cặp chữ; chấp nhận được ở cỡ ≥ 32px, nên chỉ dùng cho heading.

**Phong cách reveal (`effects.reveal.style`): admin chọn 1 trong 6 gói thay vì chỉnh từng kiểu (Hick's Law):**
| Mã | Tên trong admin | Heading | Khối/thẻ | Ảnh | Ornament | Stagger |
|---|---|---|---|---|---|---|
| `soft` ★ | Mềm mại | fade-up | fade-up | photo-settle | svg-draw | 80ms |
| `editorial` | Tạp chí | mask-up | fade | wipe | svg-draw | 90ms |
| `letter` | Từng chữ | split-chars (script: wipe) | fade | zoom-in | svg-draw | 60ms |
| `gentle` | Nhẹ nhàng | fade | fade | fade | hiện ngay | 60ms |
| `playful` | Vui tươi | split-words | zoom-in | rise-tilt | svg-draw | 100ms |
| `cinematic` | Điện ảnh | blur-in (desktop) / mask-up (mobile) | fade-up | photo-settle + parallax-layers | svg-draw | 120ms |
Trong "Tuỳ chỉnh nâng cao", admin có thể ghi đè từng vai trò: `effects.reveal.heading`, `.block`, `.image`, `.ornament`.

### 5.9 Micro-interaction (mới)
| Mã | Ở đâu | Mô tả | Thời lượng / easing | Kỹ thuật | Chi phí |
|---|---|---|---|---|---|
| `btn-press` | mọi nút | Nhấn: `scale(.97)` + bóng thu lại; desktop hover: nâng `translateY(-1px)` | 120ms nhấn, 160ms hover, `--ease-out` | CSS `:active`/`:hover` | Thấp |
| `btn-shine` | CTA chính: "Chạm để mở thiệp", "Gửi quà mừng cưới", "Gửi xác nhận" | Vệt sáng chéo lướt qua nút (pseudo-element gradient `translateX(-120%)` sang `120%`), tối đa 3 lần, cách 4s | 900ms | CSS keyframes | Thấp |
| `cta-breathe` | Nút mở thiệp | Thở `scale 1 lên 1.04` + quầng `opacity`, dừng sau 5s (WCAG 2.2.2) | 2s/chu kỳ | CSS | Thấp |
| `countdown-odometer` | Đếm ngược (thêm `countdown.style: "odometer"`) | Mỗi chữ số là một dải 0 đến 9 cuộn dọc như đồng hồ công-tơ | 450ms `--ease-inout` | CSS `translateY` trên dải số | Thấp |
| `countdown-milestone` | Đếm ngược | Khi còn 100/30/7/1 ngày: chip "Chỉ còn 7 ngày!" pop-in dưới đồng hồ | 300ms `--ease-pop` | CSS | Thấp |
| `photo-tilt` | Ảnh couple, polaroid, album (desktop, `pointer: fine`) | Ảnh nghiêng theo con trỏ tối đa 6°, lớp bóng loáng di chuyển theo, nội suy mượt (lerp .12/frame), rời chuột trả về 400ms. Mobile **không** dùng con quay (iOS phải xin quyền, hao pin) | liên tục | rAF + transform | Thấp đến vừa |
| `wish-fly` | Gửi lời chúc thành công | Biến thể (`effects.micro.wishFly`): `paper-plane` ★ thẻ thu nhỏ, hoá máy bay giấy SVG, bay theo đường cong lên danh sách (900ms), lời chúc mới "đáp" vào đầu danh sách (FLIP 320ms) + highlight; `bubble`: lời chúc nổi trong bong bóng rồi vỡ vào danh sách; `heart`: tim bay (như cũ) | 900 đến 1200ms | WAAPI keyframes translate + rotate (không cần `offset-path`) | Vừa |
| `rsvp-success` | RSVP gửi xong | Vòng tròn pop (`--ease-pop` 300ms) + dấu tick vẽ bằng `stroke-dashoffset` (500ms). "Tôi sẽ đến" kèm `confetti` nhỏ; "Không thể đến" **không** confetti, thay bằng phong bì nhỏ khép nắp + 1 tim (tôn trọng cảm xúc) | 800ms | SVG + burst | Thấp |
| `choice-card` | Thẻ chọn RSVP | Chọn: viền vẽ quanh thẻ (SVG rect dashoffset 300ms), icon pop | 300ms | SVG | Thấp |
| `stepper-bump` | Số khách | Số cũ trượt ra, số mới trượt vào theo hướng +/− | 180ms | CSS | Thấp |
| `segmented-slide` | Tab Chú rể/Cô dâu ở sheet mừng cưới | Thanh chọn trượt bằng `transform` | 220ms `--ease-out` | CSS | Thấp |
| `copy-morph` | Nút sao chép STK | Icon sao chép chuyển thành tick (crossfade + scale), nền success 2s | 200ms | CSS | Thấp |
| `gift-shake` | Hộp quà ở section Mừng cưới | Lắc ±6° 2 nhịp khi vào màn và khi hover nút | 500ms | CSS | Thấp |
| `calendar-flip` | Nút "Thêm vào lịch" | Icon lịch lật tờ khi bấm | 300ms | CSS 3D | Thấp |
| `scroll-progress` | Mép trên màn hình | Dải 2px màu accent chạy theo tiến độ cuộn (`scaleX`); ở `son-do` là "sợi chỉ đỏ" | theo cuộn | CSS scroll-driven animation, fallback rAF | Thấp |
| `name-sparkle` | Chữ "&" ở hero | 3 đốm lấp lánh mỗi 6s, tối đa 3 lần | 600ms | CSS | Thấp |
| `music-ripple` | Nút nhạc khi bắt đầu phát | 2 vòng sóng lan ra | 1.2s | CSS | Thấp |
| `couple-heart-tap` | Ảnh cô dâu/chú rể (không áp album vì double-tap đã dùng để zoom) | Chạm đúp: tim nở tại điểm chạm. Mặc định tắt (easter egg) | 700ms `--ease-pop` | DOM | Thấp |

### 5.10 Ma trận cường độ cho hiệu ứng mới (mới)
| Hiệu ứng | **Tắt** | **Nhẹ** | **Vừa ★** | **Nhiều** | `prefers-reduced-motion` |
|---|---|---|---|---|---|
| Kiểu mở thiệp (3.4b) | fade 200ms | bản "Nhẹ" | đầy đủ | đầy đủ + phần "Nhiều" | fade 200ms |
| Burst sau mở thiệp | không | không | có | có, nhiều hạt hơn | không |
| Hạt nền | 0 | 8 × hệ số | 16 × hệ số | 28 × hệ số + gió theo cuộn | 0 |
| Pháo hoa đếm ngược (mỗi lần cuộn tới, cooldown 15s) | không | 1 chùm × 24 hạt | 3 chùm | 5 chùm | không (chỉ chip chữ tĩnh) |
| Reveal (gói) | hiện ngay | mọi gói rơi về `gentle` | gói đã chọn, bỏ `blur-in` và `parallax-layers` | gói đầy đủ | fade ≤ 200ms, không dịch chuyển |
| `split-chars` / `split-words` | không tách | không tách (fade cả khối) | có | có | không tách |
| `svg-draw` | hiện nét hoàn chỉnh | có | có | có | hiện nét hoàn chỉnh |
| `parallax-layers` | không | không | không | có | không |
| `photo-tilt` | không | không | có (desktop) | có (desktop) | không |
| `btn-shine`, `cta-breathe`, `name-sparkle` | không | không | có | có | không |
| `btn-press`, `copy-morph`, `stepper-bump`, `segmented-slide` | đổi màu tức thì | có | có | có | chỉ đổi màu/opacity |
| `wish-fly` | chèn lời chúc + highlight | `heart` 4 tim | biến thể đã chọn | biến thể đã chọn | chèn + highlight (fade) |
| `rsvp-success` | tick tĩnh | tick vẽ | tick + confetti nhỏ | tick + confetti | tick tĩnh |
| `countdown-odometer`/`flip` | đổi số tức thì | fade | đầy đủ | đầy đủ | đổi số tức thì |
| `scroll-progress` | không | không | không (admin bật được) | có | có (không phải chuyển động trang trí, chỉ là chỉ báo) |
| **(v4)** Tự động cuộn (5.11) | không tự chạy (khách bật được trong menu nhanh) | tự chạy | tự chạy | tự chạy | không tự chạy; khách bấm nút thì chạy `steady` 32px/s |

Thứ tự **tự hạ cấp** khi FPS < 45 (bổ sung cho 5.5): tắt gió theo cuộn, rồi giảm hạt nền 50%, rồi tắt `parallax-layers`, rồi tắt hạt nền, rồi Ken Burns, rồi `photo-tilt`. Burst và kiểu mở thiệp không bị tắt giữa chừng (chỉ dùng bản Nhẹ ở lần sau). Tự động cuộn không bị hạ cấp (chi phí < 0.3ms/frame).

### 5.11 Tự động cuộn sau khi mở thiệp (v4)
**Đã chốt 2026-10-08:** bật mặc định, 45px/s, bắt đầu sau 2.5s, `flow` dừng 1.2s ở đầu mỗi section (countdown 2s); khách tác động thì **dừng hẳn** và có nút Tiếp tục (không tự tiếp tục); reduced-motion không tự chạy nhưng khách tự bấm được; import config cũ thì kẹp `startDelayMs` tối thiểu 1500.

**Lập trường.** Tự cuộn giành quyền điều khiển của người dùng (heuristic "User control and freedom" của NN/g). Vì tính năng bật mặc định, spec giữ 3 nguyên tắc: (1) **mọi tác động của khách dừng ngay**, (2) **không tự tiếp tục sau khi khách đã chạm**, (3) **luôn có nút Dừng/Tiếp tục hiện rõ**. Nút này cũng đáp ứng WCAG 2.2.2 (Pause, Stop, Hide) cho chuyển động tự chạy dài hơn 5s.

| Hạng mục | Spec |
|---|---|
| Khi nào bắt đầu | Sau khi cover gỡ xong (`opened` resolve) + `startDelayMs` (mặc định **2500ms**, để chuỗi vào của hero 1.2s và burst sau mở chạy xong). Tăng tốc từ 0 tới tốc độ đích trong **800ms** (ease-in), không giật |
| Không bắt đầu nếu | khách đã cuộn/chạm/bấm phím trong lúc chờ · đang khôi phục vị trí cuộn cũ (reload giữa trang, 3.5 bước 4) · URL có hash (`#rsvp`…) · trang cao < 1.5 màn hình · `prefers-reduced-motion` · cấp "Tắt" · `enabled=false` · đang ở preview admin mà không bấm "Phát lại" |
| Tốc độ | `speed` px/s (CSS px), mặc định **45**, nhân hệ số màn hình `clamp(innerHeight/800, .8, 1.2)` (màn 740px chạy ~42px/s, khoảng 1 dòng body mỗi 0.65s). Admin: Chậm 32 · Vừa 45 · Nhanh 64, "Tuỳ chỉnh" 20–120 trong phần nâng cao |
| Kiểu chạy (`mode`) | `flow` ★: chạy đều, **dừng `dwellMs` (1200ms) mỗi khi đầu một section chạm 18% chiều cao viewport**, như ngắt chương; reveal chạy trọn trong lúc dừng. Section đếm ngược dừng `max(dwellMs, 2000)` để pháo hoa đủ điều kiện (≥ 50% + giữ 400ms, 5.7). Hero và footer không dừng. `steady`: chạy đều, không dừng |
| Dừng hẳn (stop) khi | `wheel` · `touchstart` (bất kỳ đâu, kể cả nút nổi) · `pointerdown` chuột · `keydown` bất kỳ (trừ chỉ bấm phím bổ trợ Shift/Ctrl/Alt/Meta) · **kéo thanh cuộn hoặc tìm trong trang**: mỗi frame so `scrollY` thực với vị trí đã đặt, lệch > 3px mà không có resize trong 300ms trước đó thì dừng · `focusin` vào input/textarea/select/button/a · mở lightbox / sheet / menu nhanh (`.has-overlay`) · chọn văn bản (`selectionchange` không rỗng) |
| Tạm dừng rồi tự chạy lại (pause) | Chỉ với nguyên nhân **do hệ thống**: tab ẩn (`visibilitychange`), chạy lại 1s sau khi hiện lại · xoay màn/resize (kể cả thanh địa chỉ iOS co giãn), chạy lại sau 500ms. Không tính là "khách tác động" |
| Tự tiếp tục sau khi khách tác động | **Không.** Khách đã chạm nghĩa là đang tự đọc hoặc tự tương tác. Nút chuyển sang "Tiếp tục tự cuộn" để khách tự bật lại |
| Nút điều khiển | Nút tròn 44px ở **cột phải, trên nút nhạc** (7.1). Đang chạy: icon ‖ + `aria-label="Dừng tự cuộn"` `aria-pressed="true"`, có thể có vòng tiến độ mảnh quanh nút (stroke-dashoffset). Đã dừng: icon ▶ có mũi tên xuống + `aria-label="Tiếp tục tự cuộn"`. **Lần dừng đầu tiên** hiện toast 3s "Đã dừng tự cuộn · bấm ▶ để tiếp tục" (`role="status"`). Tới cuối trang thì ẩn nút. Menu nhanh của pill có mục "Tự cuộn: Bật/Tắt". Nút nằm trong thứ tự Tab sau nút nhạc |
| Khi bấm "Tiếp tục" | Chạy lại từ vị trí hiện tại, tăng tốc 800ms, **không** áp `startDelayMs` |
| Cuối trang | `scrollY ≥ maxScroll − 2`: dừng hẳn, không quay về đầu. Có section Cảm ơn thì giảm tốc dần trong 1 màn cuối (ease-out) để "hạ cánh" êm vào chữ ký |
| Tương tác với hiệu ứng | **Reveal**: chạy bình thường (IntersectionObserver), `rootMargin` đáy `0px 0px -10%`, **prefetch ảnh lazy trong 1.5 màn phía trước** để không cuộn vào ô trống. **Hạt nền**: tốc độ tự cuộn **không** tính vào "gió theo cuộn" (chỉ tính cuộn của khách). **Pháo hoa**: đủ điều kiện nhờ dừng 2s ở countdown. **Pill**: giữ dạng thu nhỏ (`is-mini`) suốt lúc tự cuộn, giãn ra khi dừng. **Scroll-top**: ẩn khi đang tự cuộn. **Nhạc**: không liên quan |
| Kỹ thuật | Vòng rAF với `dt`. Cộng dồn vị trí dạng số thực, chỉ gọi `window.scrollTo(0, y)` khi lệch ≥ 1 device pixel. Trong lúc chạy đặt `html{scroll-behavior:auto}`. Không dùng CSS smooth-scroll hay `scrollBy({behavior:'smooth'})`. Dừng rAF khi stop/pause. Chi phí < 0.3ms/frame |
| Screen reader / bàn phím | Bất kỳ phím nào cũng dừng, nên người dùng bàn phím không bị kéo đi. Tự cuộn không di chuyển focus |
| `prefers-reduced-motion` | **Không tự chạy.** Nút "Tự cuộn" vẫn hiện ở trạng thái dừng; khách bấm (chủ động đồng ý) thì chạy chế độ `steady`, tốc độ cố định 32px/s, không dừng ở section |
| Cấp cường độ | Tắt: không tự chạy (khách bật được trong menu nhanh). Nhẹ/Vừa/Nhiều/máy yếu: tự chạy (tự cuộn là hỗ trợ đọc, không phải hiệu ứng trang trí) |

Hằng số trong code (không đưa vào config): ramp 800ms, ngưỡng lệch 3px, chạy lại sau tab ẩn 1s / resize 500ms, prefetch 1.5 màn, dừng countdown 2000ms, không tự tiếp tục sau khi khách tác động. Field: Phụ lục B (`effects.autoScroll.*`). Admin: 8.13 khối "Tự động cuộn".

---

## 6. Âm nhạc

### 6.1 Nút nhạc nổi
- Vị trí: **góc dưới phải**, `right: 16px; bottom: calc(16px + env(safe-area-inset-bottom))`, kích thước 48×48 (vùng chạm 48).
- Hình: **đĩa than** tròn (nền text, rãnh vân, nhãn giữa màu primary) có nốt nhạc SVG nhỏ.
- Trạng thái:
| Trạng thái | Hiển thị | aria |
|---|---|---|
| Đang phát | Đĩa xoay 6s/vòng (linear, infinite; ở reduced-motion thì không xoay mà hiện 3 vạch equalizer tĩnh) | `aria-label="Tắt nhạc"`, `aria-pressed="true"` |
| Tạm dừng | Đĩa đứng yên + gạch chéo mảnh | `aria-label="Bật nhạc"`, `aria-pressed="false"` |
| Bị chặn autoplay | Đĩa + vòng sóng pulse 2 lần + tooltip "Chạm để bật nhạc" 4s | |
| Đang tải (buffering) | Viền vòng tròn chạy tiến trình | `aria-busy="true"` |
| Lỗi file | Ẩn nút (không làm khách bối rối) | |
- Lần đầu phát: tooltip nhỏ bên trái nút "♪ Beautiful In White" (`music.title`) 3s rồi tự ẩn.
- Âm lượng: fade-in 1.5s bằng Web Audio `GainNode` (iOS Safari bỏ qua `audio.volume`; không có Web Audio thì phát thẳng không fade).

### 6.2 Hành vi
- **Không bao giờ tự phát trước tương tác.** Chỉ phát trong handler "Mở thiệp" nếu `music.autoplayAfterOpen=true`.
- Lặp (`loop`), có thể chọn điểm bắt đầu `music.startAt` (giây) để bỏ đoạn intro dài.
- **Chuyển tab / khóa màn hình:** `visibilitychange` sang `hidden` thì **tạm dừng** và nhớ `wasPlaying`; quay lại `visible` thì **tự phát lại** chỉ khi `wasPlaying` và người dùng không tự tắt trước đó (fade-in 600ms). Thêm `pagehide` cũng tạm dừng (iOS khi khóa màn hình).
- Người dùng tự tắt thì tôn trọng suốt phiên (lưu `sessionStorage`), không tự bật lại.
- Mở link ngoài (Google Maps) thì nhạc tự dừng qua `visibilitychange`.
- Media Session API: tiêu đề bài hát, artwork là monogram, để màn hình khóa Android hiện đúng thông tin.

---

## 7. Thành phần nổi (floating)

### 7.1 Bố cục
```
                                   ┌──┐
                                   │ ↑│  scroll-to-top 44px (v4: chỉ khi ĐANG cuộn lên, xem dưới)
                                   └──┘
                                   ┌──┐
                                   │‖ │  (v4) nút tự cuộn 44px: ‖ đang chạy / ▶ đã dừng (5.11)
                                   └──┘
┌───────────────────────┐          ┌──┐
│ ♡ Gửi lời chúc   ▴    │          │◎ │  nút nhạc 48px
└───────────────────────┘          └──┘
 bottom-left: Quick-action pill     bottom-right: cột nút tròn
 ─────────── safe-area-inset-bottom ───────────
```
- **(v4)** Thứ tự cột phải từ dưới lên: nhạc, tự cuộn, scroll-top. Khi tự cuộn đang chạy thì ẩn scroll-top; tới cuối trang thì ẩn nút tự cuộn.
- **(v4, R12)** Scroll-top chỉ hiện khi **đang cuộn lên** và đã qua 1.5 màn, tự ẩn sau 2s đứng yên (bản v1 hiện suốt và che chữ căn giữa ở mép phải).
- **(v4, R19)** Ở theme tối, nút tròn nổi dùng viền `--c-line-strong` + nền `--c-surface` + `box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-primary) 25%, transparent)` để ranh giới nút đạt ≥ 3:1 (WCAG 1.4.11).
- **Quick-action pill** (trái dưới, cao 44px, nền primary, chữ on-primary): mặc định hiển thị hành động hữu ích nhất theo ngữ cảnh: trước khi khách RSVP là "Xác nhận tham dự"; sau khi RSVP xong là "Gửi lời chúc". Chạm mũi tên ▴ (hoặc nhấn giữ) mở **menu nhanh** dạng sheet nhỏ: Sự kiện & chỉ đường · Album · Gửi lời chúc · Xác nhận tham dự · Mừng cưới · (Bật/Tắt hiệu ứng) · **(v4)** Tự cuộn: Bật/Tắt. Mục nào trỏ tới section đang tắt thì không hiện.
- Ẩn pill khi section mà nó trỏ tới đang trong viewport (tránh thừa), khi cover hiện, khi lightbox/sheet mở, khi bàn phím đang mở (focus trong input/textarea, vì Android đẩy fixed element lên che form).
- Pill **thu nhỏ thành nút tròn 48px** (chỉ còn icon) khi đang cuộn xuống, và giãn lại khi cuộn lên hoặc dừng 800ms, để không che nội dung khi đọc.
- Desktop (≥ 1024px): pill thành thanh điều hướng ngang nhỏ ở trên, căn trái (logo monogram + 5 link anchor), sticky sau khi qua hero; nút nhạc, tự cuộn và scroll-top vẫn ở góc dưới phải. **(v4, R23)** Bản v1/v2 tạm giữ pill trên desktop; thanh điều hướng ngang làm ở v4, không chặn phát hành.

### 7.2 Safe-area và chồng lấn
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Mọi phần tử nổi: `bottom: calc(16px + env(safe-area-inset-bottom))`, `left/right: calc(16px + env(safe-area-inset-left/right))`.
- Cột phải: khoảng cách giữa nút ≥ 12px. Pill trái và cột phải luôn cách nhau ≥ 16px; ở 360px pill rộng tối đa `calc(100vw - 48px - 16px*3)`.
- Footer chừa `padding-bottom: calc(88px + env(safe-area-inset-bottom))`.
- Toast hiện **phía trên** cụm nút nổi (bottom 80px + safe-area), căn giữa, tự ẩn 2.5s, `role="status"`.
- WCAG 2.4.11: mục đang focus không được bị nút nổi che. Khi focus một phần tử nằm trong 88px dưới cùng thì `scrollIntoView({block:'center'})`.

---

## 8. Trang Admin

### 8.1 Nguyên tắc
- Người dùng admin là **cô dâu/chú rể không chuyên kỹ thuật**, nên ngôn ngữ đời thường, không lộ khóa JSON. Có ô "Chỉnh JSON nâng cao" ở cuối cho người rành.
- Thẩm mỹ admin: **trung tính, gọn**, dùng cùng body font, nền `#F7F6F3`, primary admin cố định `#2F4A43`, để không lẫn với theme đang chỉnh trong preview.
- Mọi thay đổi **hiện ngay** trong preview (debounce 150ms), nhưng chỉ ra trang thật khi bấm **Xuất bản**.

### 8.2 Màn Login (mở khoá bằng passphrase) (v3)
Chỉ hiện khi máy này **đã có token lưu mã hoá** (vault, xem solution mục 2). Ô duy nhất là **passphrase** đã đặt ở màn Kết nối lần đầu (8.2b), không phải mật khẩu GitHub.
```
┌──────────────────────────────┐
│        [monogram M&L]        │
│   Quản lý thiệp cưới         │
│   Kết nối: minhanh/wedding   │  muted 14px: owner/repo đã lưu
│  Passphrase của máy này      │
│  [••••••••••••       👁]     │  input 48px, nút hiện/ẩn
│  [        Mở khoá          ] │
│  ⚠ Passphrase chưa đúng      │  lỗi dưới ô, giữ nội dung ô
│  Quên passphrase? Kết nối lại│  link -> 8.2b (cần dán lại token)
└──────────────────────────────┘
```
- Cho phép paste và trình quản lý mật khẩu (`autocomplete="current-password"`, đáp ứng WCAG 3.3.8). Không CAPTCHA.
- Trạng thái: **Đang kiểm tra** (nút spinner "Đang mở khoá…": giải mã + kiểm tra quyền repo) · **Sai passphrase** · **Khoá tạm 30s** sau 5 lần sai, có đếm ngược hiển thị · **Token không còn dùng được** (giải mã được nhưng GitHub trả 401/403: chuyển sang 8.2b với thông báo tương ứng, giữ sẵn owner/repo/branch) · **Phiên hết hạn** khi đang làm việc (401): quay về màn này, **giữ bản nháp**, toast "Phiên đã hết, mở khoá lại để tiếp tục. Bản nháp vẫn còn".
- "Quên passphrase? Kết nối lại": dialog "Token đã lưu trên máy này sẽ bị xoá. Bạn cần dán lại token GitHub. Bản nháp và trang đang xuất bản không bị ảnh hưởng." [Huỷ] [Kết nối lại].
- Không có vault (lần đầu, hoặc lần trước không tick "Ghi nhớ") thì vào thẳng 8.2b.

### 8.2b Màn "Kết nối lần đầu" (v3)
**Mục tiêu:** cô dâu/chú rể không rành kỹ thuật vẫn tự kết nối được trong khoảng 5 phút. Chia **3 bước** có thanh tiến trình (đọc lướt được, Hick's Law), mỗi bước một màn trên mobile, cùng một trang cuộn trên desktop (cột 640px, căn trái).

```
┌ Kết nối trang quản lý với GitHub ───────────────────────────────┐
│ ①──────②──────③   Tạo token · Kết nối · Bảo vệ trên máy này      │
│                                                                  │
│ ① TẠO TOKEN (làm 1 lần, khoảng 3 phút)            [▾ Thu gọn]     │
│  1. Mở trang tạo token của GitHub  [Mở GitHub ↗]                 │
│     (github.com/settings/personal-access-tokens/new)             │
│  2. Token name: "Thiệp cưới" · Expiration: chọn ngày SAU ngày     │
│     cưới ít nhất 1 tháng (gợi ý: 12/01/2027)                     │
│  3. Repository access: "Only select repositories" → chọn repo     │
│     của thiệp (vd minhanh/wedding)                               │
│  4. Permissions → Repository permissions:                        │
│       Contents: Read and write   ·   Metadata: Read-only          │
│  5. Bấm "Generate token", rồi bấm biểu tượng sao chép             │
│  [ảnh minh hoạ nhỏ từng bước, bấm để phóng to]                   │
│  ⓘ Token giống chìa khoá ghi vào repo. Đừng gửi cho ai,           │
│    đừng dán vào tin nhắn.                                        │
│                                                                  │
│ ② KẾT NỐI                                                        │
│  Chủ repo (owner)      [minhanh            ]                     │
│  Tên repo              [wedding            ]                     │
│  Nhánh (branch)        [main               ]  mặc định main      │
│  Token GitHub          [github_pat_••••••••  👁]                 │
│  Mẹo: dán nguyên link repo vào ô "Chủ repo" để tự tách owner/repo │
│  [   Kiểm tra kết nối   ]                                        │
│  ┌ Kết quả ───────────────────────────────────────────┐          │
│  │ ✓ Token hợp lệ                                      │          │
│  │ ✓ Tìm thấy repo minhanh/wedding                     │          │
│  │ ✓ Có quyền ghi (Contents: Read and write)           │          │
│  │ ✓ Có nhánh main                                     │          │
│  │ ✓ Token hết hạn 12/01/2027 (sau ngày cưới 12/12)    │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                  │
│ ③ BẢO VỆ TRÊN MÁY NÀY                                            │
│  ☑ Ghi nhớ trên máy này (token được mã hoá bằng passphrase)      │
│  Passphrase            [••••••••••   👁]  ≥ 8 ký tự              │
│  Nhập lại passphrase   [••••••••••   👁]                         │
│  ⓘ Lần sau chỉ cần nhập passphrase. Quên passphrase thì dán lại  │
│    token là xong, không mất dữ liệu.                             │
│  Bỏ tick: token chỉ giữ tới khi đóng tab, lần sau phải dán lại.  │
│  [   Lưu và vào trang quản lý   ]   (sáng khi bước ② đạt hết ✓)  │
│                                                                  │
│  Không có token? [Dùng chế độ xem thử và xuất file]              │
└──────────────────────────────────────────────────────────────────┘
```
**Hành vi và trạng thái:**
- Ô token: `type="password"` + nút hiện/ẩn 44px, `autocomplete="off"`, `spellcheck="false"`, cho paste; tự `trim()` khoảng trắng/xuống dòng khi dán. Nhận diện tiền tố: `github_pat_` là fine-grained (đúng); `ghp_` (token classic) thì cảnh báo vàng "Đây là token kiểu cũ có quyền rộng. Nên tạo token fine-grained chỉ cho repo này" (vẫn cho dùng).
- Ô owner: dán `https://github.com/minhanh/wedding` thì tự tách sang owner + repo. Owner, repo, branch được nhớ (không bí mật) để điền sẵn lần sau.
- **Kiểm tra kết nối** chạy tuần tự, mỗi dòng kết quả có 3 trạng thái: ◌ đang kiểm tra · ✓ đạt (xanh + chữ) · ✕ lỗi (đỏ + icon + câu hướng dẫn sửa). Vùng kết quả là `aria-live="polite"`; nút có trạng thái "Đang kiểm tra…". Sửa bất kỳ ô nào ở bước ② thì kết quả cũ bị xoá (tránh hiểu nhầm là vẫn đạt).
- **Thông điệp lỗi** (dịch từ mã lỗi, không hiện mã thô; có "Chi tiết kỹ thuật" thu gọn cho người rành):
  | Tình huống | Thông điệp | Gợi ý kèm theo |
  |---|---|---|
  | Token sai / gõ thiếu (401) | "Token không đúng. Hãy sao chép lại toàn bộ token từ GitHub." | Link mở lại bước ①.5 |
  | Token hết hạn (401, kèm hạn đã qua) | "Token đã hết hạn ngày 05/10/2026. Hãy tạo token mới." | Nút "Tạo token mới ↗" |
  | Thiếu quyền ghi (`permissions.push = false` hoặc 403) | "Token chỉ có quyền đọc. Cần bật Contents: Read and write." | Ảnh minh hoạ bước ①.4 |
  | Repo không thấy (404) | "Không thấy repo minhanh/wedding. Kiểm tra lại tên, hoặc token chưa được cấp quyền cho repo này." | Gợi ý bước ①.3 |
  | Nhánh không có | "Repo không có nhánh 'mian'. Các nhánh hiện có: main, dev." | Chip chọn nhanh tên nhánh |
  | Giới hạn tần suất (403 rate limit) | "GitHub tạm giới hạn, thử lại sau khoảng {n} phút." | Nút "Thử lại" có đếm ngược |
  | Mất mạng | "Không kết nối được tới GitHub. Kiểm tra mạng rồi thử lại." | Nút "Thử lại" |
  | Token sắp hết hạn (< 14 ngày) hoặc hết hạn **trước ngày cưới** | Cảnh báo vàng (không chặn): "Token hết hạn 01/12, trước ngày cưới. Nên tạo token có hạn dài hơn." | |
- Passphrase: validate khi rời ô; ≥ 8 ký tự; 2 ô phải khớp (lỗi dưới ô thứ 2). Chỉ báo độ mạnh dạng chữ ("Yếu / Được / Tốt"), không chặn ngoài quy tắc ≥ 8. Bước ③ khi bấm lưu hiện "Đang mã hoá…" (PBKDF2 có thể mất 0.5 đến 1s trên điện thoại cũ).
- Thành công: vào Tổng quan, toast "Đã kết nối với minhanh/wedding". Nếu repo đã có config: tải về như luồng bình thường.
- "Dùng chế độ xem thử và xuất file": vào admin không có quyền ghi; top bar hiện nhãn "Chế độ không kết nối" và nút Xuất bản đổi thành "Tải gói xuất bản (.zip)".
- Mobile: 3 bước là 3 màn có nút "Tiếp" ở dưới (vùng ngón cái); nút "Mở GitHub ↗" mở tab mới để quay lại không mất dữ liệu đã nhập. Bước ① có thể bỏ qua bằng link "Tôi đã có token".
- Accessibility: tiến trình 3 bước là `<ol>` có `aria-current="step"`; lỗi dùng `role="alert"`; không có giới hạn thời gian trên màn này.

### 8.3 Kiến trúc thông tin (IA)
Thanh bên trái gồm các nhóm có icon, nhóm "Nội dung" mở ra danh sách section theo **đúng thứ tự hiện tại**:
```
◧ Tổng quan          (trạng thái publish, link xem thử, checklist thiếu thông tin)
⚙ Chung              (tiêu đề trang, mô tả SEO, ảnh chia sẻ OG, favicon, ngày cưới chính, tên tham số link khách)
🎨 Theme & Màu        ((mới) gallery 12 theme, xem 8.12; màu chủ đạo; nâng cao: từng token + badge tương phản, họa tiết, texture, khung ảnh, divider)
Aa Font               (font preset; 3 dropdown heading/script/body có preview bằng tên thật; cỡ chữ ±1 bậc)
✦ Hiệu ứng           ((mới) xem 8.13: cường độ, gallery 17 kiểu mở thiệp, (v4) mẫu phong bì, hạt nền, burst, gói reveal, (v4) tự động cuộn, micro-interaction; preview + "Phát lại")
♪ Nhạc                (upload mp3, tên bài, điểm bắt đầu, tự phát sau mở thiệp, nghe thử)
☰ Sections           (bật/tắt + sắp xếp, hiện số thứ tự, divider)
✎ Nội dung           ▸ Thiệp mời (cover) ▸ Hero ▸ Cô dâu chú rể ▸ Gia đình ▸ Lời mời ▸ Sự kiện
                      ▸ Đếm ngược ▸ Lịch trình ▸ Album ▸ Mừng cưới ▸ Sổ lưu bút ▸ RSVP ▸ Cảm ơn ▸ Footer
🖼 Ảnh                (thư viện mọi slot ảnh; thao tác nháp: thay ảnh, hoàn tác thay đổi nháp, lấy lại ảnh trước đó)
🔗 Link khách mời     (tạo link hàng loạt)
⟲ Sao lưu/Khôi phục  (tải file cấu hình, nhập file, "Khôi phục bản xuất bản trước" cho cả trang: config + ảnh)
```
(Trong code dùng icon SVG thống nhất. Ký tự trên chỉ để minh họa.)

### 8.4 Bố cục desktop (≥ 1200px)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ M&L Quản lý thiệp  │ ● Có thay đổi chưa xuất bản  [Hoàn tác] [Xem trang ↗] [Xuất bản] │  top bar 56px
├────────────┬──────────────────────────────────┬─────────────────────────────┤
│ Sidebar    │ FORM (max 640px, căn trái)        │   LIVE PREVIEW             │
│ 240px      │ ┌ Sự kiện ─────────────────────┐ │  [📱375][📱414][🖥]  [↻]     │
│ (IA 8.3)   │ │ Thẻ "Lễ Thành Hôn"  [▾][⋮]  │ │  Xem như: [Gia đình anh Mạnh]│
│            │ │  Tên sự kiện [___________]  │ │  ┌─────────┐                 │
│            │ │  Ngày [__] Giờ đón [__]...  │ │  │ khung   │ iframe trang    │
│            │ │ + Thêm sự kiện              │ │  │ điện    │ thiệp thật,     │
│            │ └─────────────────────────────┘ │  │ thoại   │ nhận config     │
│            │                                  │  │         │ qua postMessage │
│            │                                  │  └─────────┘                 │
│            │                                  │  ☐ Bỏ qua màn cover khi xem  │
└────────────┴──────────────────────────────────┴─────────────────────────────┘
```
- Sửa trường nào thì preview **tự cuộn tới section đó** và viền nhấp nháy 1s (liên kết form với kết quả).
- Preview có toggle "Bỏ qua cover", nút "Phát lại hiệu ứng mở thiệp", và ô "Xem như khách" để thử tên dài.
- 1024 đến 1199px: preview thu thành panel có thể ẩn/hiện (nút "Xem trước" ở top bar).

### 8.5 Admin trên mobile (< 768px)
- Top bar rút gọn: trạng thái lưu (chấm màu + chữ) và nút "Xuất bản".
- **Bottom tab 3 mục:** `Chỉnh sửa` · `Xem trước` · `Thêm` (Ảnh, Link khách, Sao lưu, Đăng xuất).
- "Chỉnh sửa" là danh sách nhóm (IA 8.3) dạng list lớn 56px/dòng; chạm vào thì mở trang con có nút ← quay lại; form 1 cột, input 48px.
- "Xem trước" là iframe toàn màn hình, có nút nổi "← Quay lại chỉnh sửa".

### 8.6 Sections: bật/tắt và sắp xếp
```
 Kéo để sắp xếp. Section đang tắt sẽ không hiển thị với khách.
 ┌──────────────────────────────────────────────────────────┐
 │ 🔒 Hero (luôn ở đầu)                          [● Bật]     │
 │ ⋮⋮ 01 Cô dâu & Chú rể      [↑][↓]  [● Bật]  [Sửa nội dung]│
 │ ⋮⋮ 02 Hai bên gia đình     [↑][↓]  [● Bật]  [Sửa nội dung]│
 │ ⋮⋮ -- Lịch trình           [↑][↓]  [○ Tắt]  [Sửa nội dung]│  mờ 60% khi tắt
 │ ⋮⋮ 03 Album (0 ảnh ⚠ sẽ tự ẩn) ...                         │
 │ 🔒 Footer (luôn ở cuối)                        [● Bật]    │
 └──────────────────────────────────────────────────────────┘
```
- Kéo thả bằng tay cầm ⋮⋮ (pointer + touch, giữ 200ms trên mobile để tránh nhầm với cuộn); **luôn có nút ↑ ↓** thay thế (WCAG 2.5.7) và hỗ trợ bàn phím (Space nhấc lên, mũi tên di chuyển, Space thả, có thông báo `aria-live`).
- Số thứ tự hiển thị ngay theo logic mục 4.0. Cảnh báo ⚠ cho section bật nhưng rỗng dữ liệu.
- Hero ghim đầu, footer ghim cuối (đã chốt).

### 8.7 Luồng thay ảnh (nháp) và quan hệ với sao lưu (v3)
**Mô hình đúng theo solution (đã chốt):** hệ thống chỉ giữ **1 bản sao lưu duy nhất cho cả trang** = trạng thái trang (config + mọi ảnh) **ngay trước lần xuất bản gần nhất**. Không có backup riêng từng ảnh qua nhiều lần xuất bản. Vì vậy mọi nút trong ImageSlot đều là **thao tác trên bản nháp**, chỉ ra trang thật khi bấm Xuất bản; thao tác khôi phục thật sự (ghi ngay lên trang) chỉ có một chỗ là **"Khôi phục bản xuất bản trước"** ở 8.10.

Hai khái niệm phải luôn tách bạch về chữ và vị trí:
| Thao tác | Ở đâu | Phạm vi | Có ghi lên trang ngay? | Đảo ngược |
|---|---|---|---|---|
| **Hoàn tác thay đổi nháp** (ở slot) | ImageSlot | 1 ảnh: bỏ ảnh mới chưa xuất bản, quay về **ảnh đang xuất bản** | Không (nháp) | Toast [Làm lại] 5s |
| **Lấy lại ảnh trước đó** (ở slot) | ImageSlot, chỉ hiện nếu slot đổi ảnh trong lần xuất bản gần nhất | 1 ảnh: đưa ảnh trong bản sao lưu vào **nháp** | Không, có hiệu lực khi Xuất bản | Hoàn tác thay đổi nháp |
| **Hoàn tác tất cả** | Top bar (8.8) | Toàn bộ nháp: về đúng bản đang xuất bản | Không | Không (có cảnh báo) |
| **Khôi phục bản xuất bản trước** | Sao lưu/Khôi phục (8.10) | Cả trang (config + ảnh) về trạng thái trước lần xuất bản gần nhất | **Có**, 1 commit | Bấm lại = làm lại (hoán đổi) |

Mỗi ô ảnh (slot) trong form và trong tab Ảnh dùng chung component **ImageSlot**:
```
┌ Ảnh bìa (Hero) ─────────────────────────────────────────────┐
│ ┌──────────┐  Trong bản nháp · 1600×2400 · 238KB  ● Chưa xuất bản│
│ │  [thumb] │  Đổi lúc 07/10 14:32                            │
│ └──────────┘  [Thay ảnh] [Chỉnh điểm lấy nét] [Mô tả ảnh]     │
│               [↶ Hoàn tác thay đổi nháp]                     │  chỉ hiện khi slot có thay đổi nháp
│ ─ Đang xuất bản (khách đang thấy) ──────────────────────────│
│ ┌──────┐ xuất bản 05/10 09:10                                │  chỉ hiện khi khác ảnh nháp
│ │ thumb│                                                     │
│ └──────┘                                                     │
│ ─ Ảnh trước lần xuất bản 05/10 09:10 (từ bản sao lưu) ──────│  chỉ hiện nếu manifest có slot này
│ ┌──────┐ [Lấy lại ảnh này vào nháp]                          │
│ │ thumb│ ⓘ Bản sao lưu chỉ giữ trạng thái trước lần xuất bản │
│ └──────┘   gần nhất.                                         │
└──────────────────────────────────────────────────────────────┘
```
Slot không có thay đổi nháp và không có mục trong bản sao lưu thì chỉ hiện khối đầu (gọn, đúng Hick's Law). Nhãn trạng thái luôn có chữ, không chỉ chấm màu.

**Các bước "Thay ảnh":**
1. **Chọn:** nút chọn file hoặc kéo thả vào slot (desktop); nhận JPG/PNG/WEBP (HEIC: thử giải mã, thất bại thì báo "Hãy chọn ảnh JPG/PNG"); tối đa 20MB đầu vào.
2. **Crop:** dialog toàn màn hình (mobile) có khung theo **tỉ lệ của slot** (Hero 9:16 + điểm lấy nét cho desktop; chân dung 4:5; gia đình 3:2; OG 1.91:1; album: tự do hoặc giữ nguyên). Kéo/pinch để chỉnh, nút xoay 90°, "Đặt lại". Tay cầm và nút đều ≥ 44px; có thanh trượt zoom để thay pinch.
3. **Xem trước:** so sánh "Đang xuất bản" và "Mới" cạnh nhau (mobile thì xếp trên/dưới), và **xem ngay trong live preview**. Hiện dung lượng sau nén ("4.2MB thành 236KB, WebP 1600px").
4. **Dùng ảnh:** nút "Dùng ảnh này". **Không cần dialog xác nhận** vì chỉ đổi bản nháp và hoàn tác được. Toast: "Đã thay ảnh trong bản nháp. Khách chỉ thấy sau khi Xuất bản · [Hoàn tác]".
5. **Đang xử lý:** thanh tiến trình trong slot ("Đang nén ảnh…", xử lý trên máy, lưu vào nháp), không chặn cả trang; lỗi thì "Không xử lý được ảnh này" + [Thử lại] [Chọn ảnh khác], giữ vùng crop đã chọn. (Tải ảnh lên repo chỉ xảy ra lúc Xuất bản, tiến trình hiện ở 8.8.)
6. **Xong:** slot hiện nhãn "● Chưa xuất bản"; bộ đếm thay đổi ở top bar tăng.
- **Hoàn tác thay đổi nháp:** không dialog; slot về ảnh đang xuất bản, toast "Đã quay về ảnh đang xuất bản · [Làm lại]".
- **Lấy lại ảnh trước đó vào nháp:** dialog nhỏ có 2 thumbnail ("Đang xuất bản" → "Ảnh trước lần xuất bản 05/10"). Câu chữ: "Ảnh này sẽ được đưa vào **bản nháp**; khách chỉ thấy sau khi bạn bấm Xuất bản. Lưu ý: hệ thống chỉ giữ bản sao lưu của **lần xuất bản gần nhất**; lần Xuất bản tới sẽ thay toàn bộ bản sao lưu bằng trạng thái trang hiện tại." [Huỷ] [Đưa vào nháp]. Đang tải ảnh từ bản sao lưu: spinner trong dialog "Đang lấy ảnh…"; lỗi mạng: "Chưa lấy được ảnh, thử lại" + [Thử lại].
- Muốn quay **cả trang** về trước lần xuất bản (khẩn cấp, không qua nháp) thì dùng 8.10; ImageSlot có link nhỏ "Khôi phục cả trang? Xem Sao lưu/Khôi phục".
- **(v3) Client tự nén (thống nhất với solution):** cạnh dài **hero/cover 2000px**; **album full 1600px** + thumbnail 600px; chân dung, gia đình, sự kiện, love story 1200px; OG 1200×630 JPEG. WebP q=0.82 (fallback JPEG 0.85); sinh `dominantColor` và LQIP 24px; xóa EXIF GPS.
- **Mô tả ảnh (alt):** ô bắt buộc nhẹ (nhắc chứ không chặn), gợi ý sẵn ("Ảnh cưới của Minh Anh và Thuỳ Linh").
- **Album:** lưới thumbnail; thêm nhiều ảnh cùng lúc (hàng đợi tải lên có tiến trình từng ảnh); sắp xếp kéo thả + nút ←→; xóa (có Hoàn tác 5s qua toast thay cho hộp xác nhận); mỗi ảnh dùng ImageSlot ở trên (hoàn tác nháp; "Lấy lại ảnh trước đó" chỉ khi ảnh đó đổi trong lần xuất bản gần nhất). Ảnh album đã xoá ở lần xuất bản gần nhất chỉ lấy lại được bằng "Khôi phục bản xuất bản trước" (8.10).

### 8.8 Trạng thái lưu và xuất bản
Chỉ báo ở top bar (chấm + chữ, không chỉ dùng màu):
| Trạng thái | Hiển thị | Hành động |
|---|---|---|
| Đã xuất bản, không có thay đổi | ● xám "Đã xuất bản · 14:32" | Nút Xuất bản disabled |
| Có thay đổi chưa xuất bản | ● vàng "Có 3 thay đổi chưa xuất bản" | Xuất bản sáng; [Hoàn tác tất cả] (= bỏ toàn bộ nháp, về bản đang xuất bản; dialog xác nhận vì không đảo ngược được) |
| Đang lưu nháp | ◌ "Đang lưu nháp…" | Tự lưu nháp cục bộ mỗi thay đổi (debounce 800ms) |
| Đang xuất bản | spinner "Đang xuất bản…" | Khóa nút Xuất bản; form vẫn sửa được |
| Xuất bản thành công | ✓ xanh "Đã xuất bản! Khách sẽ thấy sau khoảng 1 phút" + [Xem trang ↗] | Toast 4s |
| Lỗi | ✕ đỏ "Xuất bản thất bại: {lý do dễ hiểu}" + [Thử lại] [Tải file cấu hình về máy] | Không mất thay đổi |
- Trước khi xuất bản: **checklist validate** (thiếu ngày cưới, sự kiện thiếu giờ, text/bg không đạt tương phản, ảnh thiếu alt) hiện thành danh sách có link "Sửa". Lỗi nặng chặn xuất bản, cảnh báo nhẹ chỉ nhắc.
- **(v3)** Bước xác nhận xuất bản ghi rõ: "Trạng thái trang hiện tại sẽ được lưu làm bản sao lưu (thay bản sao lưu cũ ngày 05/10). Nếu cần, bạn có thể khôi phục lại ở mục Sao lưu/Khôi phục." Trong lúc xuất bản hiện tiến trình tải ảnh/nhạc ("Đang tải 3/7 tệp…").
- Rời trang khi còn thay đổi chưa xuất bản: `beforeunload` cảnh báo (bản nháp vẫn còn trong máy).
- Nút **"Xem thay đổi"**: diff dễ đọc ("Tiêu đề Cảm ơn: 'A' thành 'B'").
- (**Giả định:** "đã xuất bản sau khoảng 1 phút" phụ thuộc cách deploy của solution.)

### 8.9 Công cụ tạo link khách mời
```
┌ Tạo link khách mời ─────────────────────────────────────────────┐
│ Nhập mỗi dòng một tên khách:                                    │
│ ┌──────────────────────────────┐                                │
│ │Gia đình anh Mạnh             │  Tên miền: [https://wedpage.com/]│
│ │Chị Hường và gia đình         │  Kiểu link: (●) Giữ dấu  ( ) Không dấu│
│ │Bạn Tuấn (lớp 12A)            │  ☐ Mã hoá link (khi app chat cắt link)│
│ └──────────────────────────────┘  [Tạo link]                    │
│ 3 link · [Sao chép tất cả] [Tải CSV]                            │
│ ┌──────────────────┬──────────────────────────────┬───────────┐ │
│ │ Gia đình anh Mạnh│ wedpage.com/?to=gia-đình-anh-Mạnh │[Chép][Chia sẻ][👁]│
│ │ ...              │                              │           │ │
└─────────────────────────────────────────────────────────────────┘
```
- Sinh slug: NFC, khoảng trắng thành `-`, dấu `-` thật thành `--`, bỏ ký tự cấm URL, giữ hoa/thường.
- **(v3, đã chốt) Định dạng link:** mặc định **giữ dấu, Unicode thô** (`?to=gia-đình-anh-Mạnh`), dễ đọc khi gửi qua Zalo/Messenger. Toggle **"Mã hoá link"** (mặc định tắt, nhớ lựa chọn trong máy) xuất link percent-encode (`?to=gia-%C4%91%C3%ACnh-anh-M%E1%BA%A1nh`) cho trường hợp ứng dụng chat cắt link ở ký tự có dấu. Trợ giúp ngay dưới toggle: "Bật nếu khách bấm link mà tên hiện sai hoặc bị cắt. Tên khách vẫn hiện đúng dấu." Trang khách giải mã cả hai dạng giống nhau (3.3). Bảng kết quả luôn hiển thị link ở dạng dễ đọc; nút [Chép]/[Chia sẻ] và file CSV dùng đúng dạng đang chọn (CSV có thêm cột `link_ma_hoa` để dự phòng). Kiểu "Không dấu" vẫn có nhưng cảnh báo "Tên khách sẽ hiện không dấu".
- Cột **Xem trước (👁)**: mở preview cover với tên đó, để kiểm tra tên dài hoặc xuống dòng.
- **Chia sẻ:** `navigator.share({title, text: "Trân trọng kính mời Gia đình anh Mạnh…", url})` trên mobile; desktop thì copy đoạn tin nhắn mẫu (link + lời mời, sửa được ở trên bảng).
- Cảnh báo trùng tên; danh sách được lưu lại (localStorage) để lần sau không phải nhập lại (**Giả định:** không cần đồng bộ lên server).

### 8.10 Sao lưu / Khôi phục (v3)
```
┌ Sao lưu / Khôi phục ─────────────────────────────────────────────┐
│ ┌ Bản sao lưu hiện có ───────────────────────────────────────┐   │
│ │ Trạng thái trang TRƯỚC lần xuất bản lúc 14:32, 07/10/2026   │   │
│ │ Gồm: nội dung thiệp + 3 ảnh đã thay + 1 ảnh đã xoá          │   │
│ │ [thumb cũ → thumb mới] Ảnh bìa                              │   │
│ │ [thumb cũ → thumb mới] Album #4                             │   │
│ │ [thumb cũ → (đã xoá)]  Album #9                             │   │
│ │ Nội dung: 5 thay đổi  [Xem chi tiết]                        │   │
│ │ [   Khôi phục bản xuất bản trước   ]                        │   │
│ └─────────────────────────────────────────────────────────────┘   │
│ ⓘ Hệ thống chỉ giữ 1 bản sao lưu: trạng thái ngay trước lần xuất   │
│   bản gần nhất. Mỗi lần Xuất bản sẽ thay bản sao lưu này.          │
│ ─ Tệp cấu hình ────────────────────────────────────────────────   │
│ [Tải bản cấu hình hiện tại (.json)]  [Nhập từ file…]              │
└───────────────────────────────────────────────────────────────────┘
```
- **Khôi phục bản xuất bản trước** đưa **cả trang** (config + mọi ảnh/nhạc) về trạng thái trước lần xuất bản gần nhất, ghi **ngay** lên trang (1 commit), không đi qua nháp. Đây là nút "cứu hộ" khi lỡ xuất bản sai.
- **Dialog 2 bước:**
  1. *Xem trước:* "Trang của khách sẽ quay về như **trước lần xuất bản lúc 14:32 ngày 07/10/2026** (cả nội dung và ảnh)." + danh sách thay đổi như khung trên. [Huỷ] [Tiếp tục].
  2. *Xác nhận:* "Trạng thái hiện tại sẽ được giữ làm bản sao lưu, nên bạn có thể **bấm lại để làm lại**." Nếu đang có nháp chưa xuất bản: cảnh báo vàng "Bạn có 3 thay đổi nháp chưa xuất bản. Sau khi khôi phục, bản nháp sẽ được đặt lại theo trang vừa khôi phục." + [Tải nháp về máy (.json)] trước khi tiếp tục. [Quay lại] [Khôi phục ngay] (nút màu cảnh báo, không phải primary thường).
- **Đang khôi phục:** spinner "Đang khôi phục…", khoá nút Xuất bản; xong thì "Đã khôi phục. Khách sẽ thấy sau khoảng 1 phút" và khung bản sao lưu đổi thành "Trạng thái TRƯỚC khi khôi phục lúc 15:05" với nút **"Làm lại (quay về bản vừa thay)"**.
- **Rỗng:** chưa xuất bản lần nào thì "Chưa có bản sao lưu. Bản sao lưu được tạo tự động mỗi lần Xuất bản", nút disabled.
- **Lỗi:** xung đột (có người/thiết bị khác vừa xuất bản) thì "Trang vừa được xuất bản từ nơi khác. Tải lại để xem bản mới nhất" + [Tải lại]; lỗi mạng/quyền dùng câu ở 8.8.
- **Nhập từ file:** nạp vào **nháp** (xem diff trước khi áp dụng), không ghi thẳng lên trang.

### 8.11 Form pattern chung trong admin
- Label luôn ở trên input (không chỉ dùng placeholder); trợ giúp nhỏ dưới label; lỗi đỏ có icon dưới ô.
- Trường ngày/giờ dùng `input type=date/time` gốc (tốt nhất trên mobile). **(v3) Ngày âm lịch nhập tay** (ô text tự do `lunarText`, không có nút "Tự tính"); placeholder mẫu "Tức ngày 3 tháng 11 năm Bính Ngọ" và trợ giúp "Tra lịch âm rồi gõ vào; để trống thì không hiện".
- Danh sách lặp (sự kiện, tài khoản, lời chúc mẫu, timeline): thẻ thu gọn được, thêm/xóa (Hoàn tác), sắp xếp bằng ↑↓.
- Textarea có xuống dòng giữ nguyên `\n` (ví dụ `openedSubline`).

### 8.12 Chọn theme: gallery thẻ xem trước (mới)

**Bố cục desktop** (cột form 640px, preview điện thoại bên phải như 8.4):
```
┌ Theme & Màu ───────────────────────────────────────────────┐
│ Chọn một phong cách. Bạn vẫn đổi được màu, font, họa tiết   │
│ riêng sau khi chọn.                                         │
│ [Tất cả] [Cổ điển] [Truyền thống] [Hiện đại] [Thiên nhiên] [Tối] │  chip lọc
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ ░ giấy ░     │ │              │ │              │          │
│ │  Minh Anh    │ │  Minh Anh    │ │  Minh Anh    │  tên thật, font script
│ │     &        │ │     &        │ │     &        │  của theme
│ │  Thuỳ Linh   │ │  Thuỳ Linh   │ │  Thuỳ Linh   │
│ │  ── ◇ ──     │ │  ── ☁ ──     │ │  ── ✿ ──     │  divider của theme
│ │ ■■■■ [Nút]   │ │ ■■■■ [Nút]   │ │ ■■■■ [Nút]   │  4 swatch + nút primary mẫu
│ ├──────────────┤ ├──────────────┤ ├──────────────┤
│ │✓ Trầm Vàng   │ │ Son Đỏ       │ │ Sen Chàm     │  tên + badge
│ │ Đang dùng·AA │ │ AA           │ │ AA           │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
│  ... (12 thẻ, 3 cột)                                       │
│ ┌ Thành phần của theme ─────────────────────────────────┐   │
│ │ Màu sắc        Theo theme          [Tuỳ chỉnh]         │   │
│ │ Font chữ       Đã chỉnh riêng ●    [Đặt lại theo theme]│   │
│ │ Họa tiết       Theo theme · Song hỷ [Đổi]              │   │
│ │ Texture nền    Theo theme · Giấy    [Đổi]              │   │
│ │ Khung ảnh      Theo theme · Vòm     [Đổi]              │   │
│ │ Divider        Theo theme           [Đổi]              │   │
│ │ Hiệu ứng gợi ý Phong bì · Cánh hồng [Sang tab Hiệu ứng]│   │
│ └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```
- **Thẻ xem trước** là HTML/CSS thật (không phải ảnh chụp), nhận token của theme qua biến CSS scoped trên thẻ, nên luôn khớp với trang thật và hiển thị **tên cặp đôi thật** của config. Thẻ có texture, ornament góc và divider thu nhỏ. Tỉ lệ 3:4, cao khoảng 220px.
- Font trong thẻ tải bằng `&text=` (chỉ glyph cần thiết, xem 2.3b); trong lúc chờ font thì hiện tên bằng font serif hệ thống, không chặn tương tác.
- **Chạm một thẻ = áp dụng ngay vào preview** (vẫn là bản nháp) + toast "Đã đổi sang Sen Chàm · [Hoàn tác]" 5s. Không cần nút "Áp dụng" riêng, vì mọi thứ chỉ ra trang thật khi Xuất bản.
- **Khi admin đã tự chỉnh** một phần (màu, font…) và chọn theme khác: dialog nhỏ "Bạn đã tự chỉnh Font chữ. Khi đổi sang Sen Chàm:" [Giữ phần tôi đã chỉnh] (mặc định, focus sẵn) / [Dùng trọn gói Sen Chàm]. Không hỏi nếu chưa chỉnh gì.
- Thẻ có trạng thái: thường, hover (nâng 2px + viền `--c-line-strong`), focus-visible (vòng 2px admin primary), **đang dùng** (viền 2px admin primary + dấu ✓ + chữ "Đang dùng", không chỉ dùng màu), theme tối có nhãn "Nền tối".
- Badge "AA" trên mỗi thẻ: đều đạt theo 1.6.3; nếu admin override màu khiến không đạt, badge thẻ đang dùng đổi thành "Cần kiểm tra ✗" và link tới token lỗi.
- Ngữ nghĩa: nhóm thẻ là `role="radiogroup"` với mỗi thẻ `role="radio"` + `aria-checked`; phím mũi tên di chuyển giữa thẻ, Space/Enter chọn. Nhãn đọc: "Sen Chàm, Á Đông thanh lịch, nền sáng".
- Chip lọc (một lựa chọn, có "Tất cả"): Cổ điển (tram-vang, hong-phan, luc-bao), Truyền thống (son-do, sen-cham), Hiện đại (muc-giay, pastel-han, hoai-co), Thiên nhiên (mau-nuoc, dat-nung, bien-dao), Tối (dem-nhung). Một theme có thể thuộc 2 nhóm.
- **Mobile (< 768px):** thẻ 2 cột (khoảng 160px rộng); phía trên gallery có **mini preview dính** (khung điện thoại thu 0.45, cao tối đa 38vh) để thấy ngay theme trên trang thật mà không phải sang tab "Xem trước"; nút "Xem toàn màn hình" mở tab Xem trước.
- Thành phần "Đổi" mở danh sách lựa chọn dạng thẻ nhỏ có hình (họa tiết, khung ảnh, divider, texture), mỗi danh sách có mục đầu "Theo theme".

### 8.13 Chọn hiệu ứng: xem trước trong khung điện thoại + "Phát lại" (mới)

```
┌ Hiệu ứng ───────────────────────────────┐   ┌ Preview ─────────────────────────┐
│ Cường độ                                 │   │ [↻ Phát lại] [0.5x] [⋯ Mô phỏng]  │
│ ( Tắt )( Nhẹ )(● Vừa )( Nhiều )          │   │  ┌───────────┐                   │
│ Vừa: đủ hiệu ứng, chạy mượt trên đa số   │   │  │ (khung    │                   │
│ điện thoại.                              │   │  │ điện thoại│                   │
│ ─ Kiểu mở thiệp ─────────────────────── │   │  │  đang phát│                   │
│ ┌──────┐┌──────┐┌──────┐┌──────┐         │   │  │  cover)   │                   │
│ │ ▶anim││ ▶anim││ ▶anim││ ▶anim│         │   │  └───────────┘                   │
│ │Phong ││Dấu sáp││Cửa  ││Hạt   │         │   │ Đang xem: Mở thiệp · Dấu sáp vỡ │
│ │bì ✓  ││vỡ    ││trăng ││sáng ⚠│         │   └──────────────────────────────────┘
│ │Gợi ý ││      ││      ││Nặng  │         │
│ └──────┘└──────┘└──────┘└──────┘         │
│ ─ Sau khi mở ── [Theo theme ▾] Cánh hoa  │
│ ─ Hạt nền ─────────────────────────────  │
│ Loại (tối đa 2): [✓Cánh hồng][Tim][Tuyết]│
│   [Đom đóm][Lá][Bong bóng] … [Xem thêm]  │
│ Màu: (●Theo theme)( Nhiều màu )( Tự chọn)│
│ Hiện ở: (●Cả trang)( Chỉ Hero & Cảm ơn ) │
│ ─ Hiện nội dung khi cuộn ──────────────  │
│ [Mềm mại ✓][Tạp chí][Từng chữ][Nhẹ nhàng]│
│ [Vui tươi][Điện ảnh]                     │
│ ─ Chi tiết nhỏ ───────────────────────── │
│ ☑ Nút có ánh sáng lướt  ☑ Ảnh nghiêng    │
│ Gửi lời chúc: [Máy bay giấy ▾]           │
│ Đếm ngược: [Lật số ▾]  ☐ Thanh tiến độ   │
│ Pháo hoa đếm ngược: [Mỗi lần cuộn tới ▾] │
│ ▸ Tuỳ chỉnh nâng cao (từng vai trò reveal,│
│   pháo hoa đếm ngược, gió theo cuộn…)    │
└──────────────────────────────────────────┘
```
- **Thẻ kiểu mở thiệp:** mỗi thẻ có hoạt ảnh thu nhỏ (CSS thuần, khoảng 120×160) **chỉ chạy khi hover/focus** hoặc khi thẻ vừa được chọn; còn lại hiện khung tĩnh (poster). Có badge: "Đang dùng ✓", "Gợi ý cho theme", chi phí "Nặng ⚠" (kiểu Cao). Nhóm `role="radiogroup"` như 8.12. Mục đầu tiên là "Theo theme (Phong bì)".
- **Chọn = phát ngay:** chọn một kiểu mở thiệp thì preview **tự hiện lại cover với tên khách mẫu** và phát animation đó (bỏ qua toggle "Bỏ qua cover"), xong thì dừng ở landing. Chọn loại hạt, burst, gói reveal hay micro-interaction cũng tự phát đúng phần đó:
  | Thay đổi | Preview làm gì |
  |---|---|
  | Kiểu mở thiệp, "Sau khi mở" | hiện cover, phát mở thiệp + burst |
  | Hạt nền (loại/màu/phạm vi) | cuộn tới hero, đổi hạt ngay không tải lại |
  | Gói reveal | cuộn tới section đầu tiên có ảnh, reset class `is-in` của 2 section kế tiếp rồi cho cuộn mượt qua để thấy reveal |
  | Lời chúc / RSVP / đếm ngược | cuộn tới section tương ứng và chạy hiệu ứng thành công giả (không gửi dữ liệu thật) |
  | Cường độ | phát lại hiệu ứng vừa xem gần nhất ở cấp mới |
- **Nút "↻ Phát lại"** (44px, có chữ, không chỉ icon) trên thanh công cụ preview: phát lại **hiệu ứng vừa xem gần nhất** (nhãn "Đang xem: …" cho biết là hiệu ứng nào). Phím tắt `R` khi focus ở vùng preview. Trên mobile có thêm nút nổi "↻ Phát lại" trong mini preview dính (như 8.12).
- **0.5x**: toggle phát chậm (dùng `setTimeScale(0.5)` của registry 5.6) để cô dâu chú rể xem kỹ chi tiết.
- **⋯ Mô phỏng**: menu 2 công tắc "Như máy yếu" (ép tự hạ cấp 1 bậc) và "Như người dùng tắt chuyển động" (ép nhánh `prefers-reduced-motion`), để admin thấy khách sẽ thấy gì trong các trường hợp đó. Có ghi chú "Khách dùng máy yếu sẽ thấy phiên bản này".
- Giao tiếp admin và iframe: `postMessage({type: "fx:replay", target: "cover" | "burst" | "particles" | "reveal" | "micro:<mã>", speed, simulate: {lowEnd, reducedMotion}})`; iframe trả `{type: "fx:done", target}` để thanh công cụ bỏ trạng thái "Đang phát".
- Khi admin bản thân bật `prefers-reduced-motion` trên máy: preview vẫn phát (vì admin chủ động bấm), nhưng thẻ hoạt ảnh thu nhỏ không tự chạy và có ghi chú "Máy bạn đang giảm chuyển động; xem trước vẫn phát khi bấm".
- Dưới lựa chọn "Hiện ở" có trợ giúp: "Cả trang: hạt thưa dần ở phần nhiều chữ và tránh ô nhập, tự dừng khi khách đang gõ" (5.7). Dropdown pháo hoa: "Mỗi lần cuộn tới (cách nhau ít nhất 15 giây)" ★ · "Chỉ ngày cưới" · "Tắt".
- Cảnh báo kết hợp: chọn đồng thời kiểu mở Cao + cường độ "Nhiều" + gói "Điện ảnh" thì hiện ghi chú vàng "Khá nặng cho điện thoại cũ; máy yếu sẽ tự giảm". Không chặn.
- **(v4) Nhãn "Theo theme (…)" phải là tên tiếng Việt** của giá trị đã resolve, không lộ mã (`scroll`, `red-paper`, `envelope`). Nếu theme gợi ý một kiểu chưa có trong bản hiện tại (capability fallback), nhãn ghi đúng cái khách sẽ thấy: "Theo theme (Phong bì · Cuộn thư sẽ có ở bản sau)".

**(v4) Khối "Mẫu phong bì"** (ngay dưới gallery kiểu mở, chỉ hiện khi kiểu mở resolve ra "Phong bì", progressive disclosure):
```
─ Mẫu phong bì ─────────────────────────────
┌────────┐┌────────┐┌────────┐
│ poster ││ poster ││ poster │   3 cột desktop / 2 cột mobile, thẻ 120×150
│Theo    ││Giấy    ││Song Hỷ │
│theme ✓ ││kraft   ││Màu cố  │   badge: Đang dùng ✓ · Gợi ý cho theme · Màu cố định
│(Cổ điển)│        ││định    │
└────────┘└────────┘└────────┘ … (Ren & hoa, Tối giản, Nhung đêm)
Màu phong bì: (● Theo mẫu)( Theo theme )( Tự chọn ▢ ) [AA ✓ 7.1:1]
[●] Ghi tên khách trên phong bì     [●] Lót hoa văn trong nắp
```
- Poster là SVG skin thu nhỏ (tĩnh), nhuộm theo theme đang chọn, có tên khách mẫu. Hover/focus thì phát mini-animation của skin (CSS, 1.2s, 1 lần; tắt khi máy admin giảm chuyển động). Thẻ đầu là "Theo theme (Cổ điển)".
- **Chọn = phát ngay** trong preview: `fx:replay` với `target:"cover"`, `envelopeStyle`; dùng chung "↻ Phát lại" và "0.5x".
- `role="radiogroup"`, phím mũi tên để duyệt, Space/Enter để chọn. Nhãn đọc ví dụ: "Phong bì đỏ Song Hỷ, màu cố định, gợi ý cho Son Đỏ". Badge luôn có chữ, không chỉ dùng màu.
- "Tự chọn" mở ô màu + badge tương phản của mực trên giấy (4.5:1).

**(v4) Khối "Tự động cuộn"** (sau "Hiện nội dung khi cuộn"):
```
─ Tự động cuộn ────────────────────────────
[●] Tự cuộn sau khi mở thiệp
Tốc độ: ( Chậm )(● Vừa )( Nhanh )
[●] Dừng ngắn ở mỗi phần            (bật = flow, tắt = steady)
Bắt đầu sau: [━━━●━━━━━] 2.5 giây   (1.5–8s)
ⓘ Khách chạm, cuộn hoặc bấm phím là dừng ngay; khách bấm ▶ để tiếp tục.
▸ Nâng cao: tốc độ tuỳ chỉnh (20–120 px/giây), thời gian dừng mỗi phần (0–4 giây)
```
- Nút "↻ Phát lại" phát 8 giây tự cuộn trong preview (`target:"autoscroll"`), bỏ qua `startDelayMs`.
- Tắt công tắc chính thì ẩn các điều khiển con (giữ giá trị). Cường độ "Tắt" thì hiện ghi chú "Cường độ Tắt: tự cuộn không tự chạy, khách vẫn bật được trong menu".

---

## 9. Accessibility (WCAG 2.2 AA)
- **(mới)** 12 theme đều đạt AA (bảng 1.6.3); viền input dùng `--c-line-strong` (≥ 3:1, WCAG 1.4.11); `split-chars` có bản `sr-only` (5.8); pháo hoa không nháy sáng cả màn (WCAG 2.3.1).
- **Tương phản:** text/bg ≥ 4.5:1 (cả 4 preset đều đạt ≥ 13:1), muted ≥ 4.5:1, primary (chữ, nút) ≥ 4.5:1, viền input và icon chức năng ≥ 3:1. Accent chỉ dùng trang trí. Chữ trên ảnh luôn có overlay. Admin có badge tương phản và chặn publish khi text/bg không đạt.
- **Vùng chạm:** ≥ 44×44px cho mọi nút (nút nhạc, đóng, mũi tên lightbox 48px); các nút cách nhau ≥ 8px. Link trong đoạn văn có padding dọc tăng vùng chạm.
- **Ảnh:** mọi ảnh nội dung có `alt` lấy từ config (admin nhập); ảnh trang trí, ornament, cánh hoa thì `alt=""`/`aria-hidden="true"`. Canvas petals `aria-hidden`.
- **Focus:** `:focus-visible` vòng 2px `--c-primary` + offset 3px (trên ảnh/nền tối thì dùng vòng trắng + bóng tối). Không xóa outline. Thứ tự Tab theo thứ tự trực quan. Cover thì focus vào nút mở; sheet, lightbox, dialog có focus trap, Esc đóng và trả focus về nút đã mở.
- **Semantic:** `<main>`, mỗi section là `<section aria-labelledby>`, đúng 1 `<h1>` (tên cặp đôi ở hero), h2 cho tiêu đề section. Ngày giờ dùng `<time datetime>`. Form có `<label for>`, nhóm radio dùng `<fieldset><legend>`.
- **Nhạc:** không tự phát trước tương tác; nút nhạc có `aria-pressed` + label; có thể dừng bất cứ lúc nào (WCAG 1.4.2).
- **(v4) Tự động cuộn (5.11):** có nút Dừng/Tiếp tục 44px luôn hiện khi đang chạy (WCAG 2.2.2), mọi phím/chạm dừng ngay, không di chuyển focus, không tự chạy khi reduced-motion.
- **Chuyển động:** tôn trọng `prefers-reduced-motion`; có nút tắt hiệu ứng cho khách; không nhấp nháy > 3 lần/giây; hiệu ứng lặp vô hạn (scroll cue, heartbeat) dừng sau tối đa 5s trừ đĩa nhạc (đĩa nhạc là chỉ báo trạng thái, dừng khi tắt nhạc).
- **Kéo thả:** luôn có nút thay thế (lightbox ‹ ›, sắp xếp ↑↓, crop có slider).
- **Ngôn ngữ:** `<html lang="vi">`; eyebrow tiếng Anh bọc `<span lang="en">` để screen reader đọc đúng.
- **Thông báo động:** toast, kết quả gửi form dùng `role="status"`/`aria-live="polite"`; lỗi dùng `role="alert"`.
- **Zoom:** không chặn zoom (`user-scalable` không bị tắt); layout chịu được chữ phóng 200%.
- **Redundant entry (3.3.7):** tên khách điền sẵn ở RSVP và Lời chúc; tên đã nhập ở form này tự điền sang form kia.

---

## 10. Quyết định đã chốt và câu hỏi còn mở (v3)

Toàn bộ câu hỏi Q1 đến Q20 của các bản trước **đã chốt** (Cổng 1 và "Quyết định vòng 2" trong `decisions.md`), nên được gỡ khỏi danh sách hỏi. Tóm tắt để tra cứu:

| Chủ đề | Đã chốt | Mục liên quan |
|---|---|---|
| Phong cách mặc định | Trầm Vàng + font Cổ điển (Playfair Display + Great Vibes + Be Vietnam Pro), mở thiệp phong bì, cường độ "Vừa" | 1.6, 3.4, 5.3 |
| Theme tối | `dem-nhung` **có trong bản đầu**, không mặc định | 1.6 |
| Đổi theme | Chỉ thay các phần đang "Theo theme"; phần đã tự chỉnh thì giữ (có hỏi) | 1.6.1, 8.12 |
| `light-gather` | Giữ; máy yếu hạ về fade (`fade-zoom`) | 3.4b |
| Hạt nền | Mặc định **cả trang**, thưa ở section nhiều chữ, né form, tạm dừng khi gõ/lightbox/tab ẩn | 5.7 |
| Pháo hoa đếm ngược | **Mỗi lần cuộn tới** (≥ 50% viewport, giữ 400ms, cooldown ≥ 15s, phải rời rồi vào lại) | 5.7 |
| Link khách | `?to=` giữ dấu mặc định + toggle "Mã hoá link" | 3.3, 8.9 |
| Cover | Hiện mỗi lần mở link | 3.5 |
| Mừng cưới | Có QR VietQR sinh client-side, chỉ hiện khi bấm | 4.9 |
| Love story | Có, mặc định tắt | 4.7 |
| **(v4)** Tự động cuộn | **Bật** mặc định, 45px/s, bắt đầu sau 2.5s, `flow` dừng 1.2s (countdown 2s); khách tác động thì dừng hẳn + nút Tiếp tục, không tự tiếp tục; reduced-motion không tự chạy; import cũ kẹp `startDelayMs` ≥ 1500 | 3.5, 5.11 |
| Lời chúc bay / vendor | Tắt | 4.10, 4.13 |
| **(v4)** Phong bì | Tên cặp đôi trên, ngoài phong bì; "Kính gửi + tên khách" trên mặt phong bì; phong bì ngang 10:7 | 3.2, 3.4 |
| **(v4)** Mẫu phong thư | 6 mẫu `classic` ★ · `kraft` · `song-hy` · `lace` · `minimal` · `velvet`; kraft/song-hy/velvet màu cố định (vẫn chọn được "Theo theme") | 3.4c, 8.13 |
| **(v4)** Hạt nền ở chữ quan trọng | Mờ xuống 0.3 (vùng dịu), không ẩn hẳn | 5.7 |
| **(v4)** 24 điểm `design-review-v1.md` | Áp dụng toàn bộ theo đề xuất | 2.1, 2.4, 3.x, 4.x, 5.7, 7.1 |
| Hero/footer | Ghim đầu/cuối | 8.6 |
| Bản đồ | Bấm mới tải | 4.5 |
| Nhạc | 1 bài, lặp, upload ≤ 8MB | 6 |
| Âm lịch | Nhập tay, không có nút "Tự tính" | 8.11 |
| Login | GitHub fine-grained token + passphrase; màn Kết nối lần đầu | 8.2, 8.2b |
| Khôi phục | Chỉ cả trang (config + ảnh) về trước lần xuất bản gần nhất, hoán đổi, bấm lại = làm lại; nút ở ImageSlot chỉ là thao tác nháp | 8.7, 8.10 |
| Ảnh | Hero/cover 2000px, album full 1600px + thumb 600px, chân dung/khác 1200px | 4.8, 8.7 |

**Câu hỏi còn mở:** không có câu nào chặn việc làm. Một điểm design tự quyết, người duyệt có thể đổi khi review:
- Khi "Khôi phục bản xuất bản trước" mà còn nháp chưa xuất bản, design **đặt lại nháp theo trang vừa khôi phục** (có nút tải nháp về máy trước). Giả định này tránh trộn nháp cũ với trang đã quay về; nếu solution muốn giữ nháp thì chỉ cần đổi câu chữ ở bước 2 của dialog 8.10.

---

### Phụ lục: các điểm design cần solution-designer xác nhận/hỗ trợ trong schema
- Trường mới đề xuất: `cover.openStyle`, `cover.guestPrefix`, `cover.background`, `effects.intensity`, `sections.items[{id, enabled}]` (thay cho chỉ `order`), `sections.showNumbers`, `sections.divider`, `theme.preset`, `theme.primaryColor`, `theme.overrides{}`, `theme.ornamentSet`, `fonts.{heading, script, body, preset}`, `couple.order`, `events[].mapEmbedUrl/image`, `mainEventId`, `countdown.afterLabel/style`, `album.images[]` thành object {src, thumb, alt, w, h, dominantColor}, `gift.bankAccounts[].role/bankBin/qrImage`, `guestbook.maxLength/showBubbles`, `rsvp.maxGuests/deadline/askEvents/askNote`, `thankYou.photo/signatureSvg`, `music.startAt`, `loveStory[]`, metadata ảnh {focalPoint, dominantColor, lqip, updatedAt}. **(v3)** "Bản trước" của ảnh **không** lưu trong config, lấy từ `backup/manifest.json` (field `slot`) theo solution.
- Cơ chế: lưu nháp, xuất bản, sao lưu 1 bản cho cả trang + khôi phục (hoán đổi), login token + passphrase, nơi lưu RSVP/lời chúc. Design đã chừa đủ trạng thái loading/lỗi cho các thao tác này.

### Phụ lục B (mới): field schema cho theme và hiệu ứng mở rộng
Quy ước: giá trị `"theme"` (hoặc vắng mặt) = theo gói của theme đang chọn (1.6.1). Enum dưới đây là danh sách đầy đủ để solution-designer đồng bộ.

**Dữ liệu preset theme (nằm trong code, không nằm trong config):**
```
ThemePreset {
  id, name, tags[]           // tags: "co-dien" | "truyen-thong" | "hien-dai" | "thien-nhien" | "toi"
  mode: "light" | "dark"
  tokens { primary, onPrimary, accent, accent2?, bg, surface, text, muted, line }   // lineStrong = muted
  fonts { heading, script, body }
  ornamentSet, texture, photoFrame, divider
  suggest { openStyle, burstOnOpen, particles: { types[], color }, revealStyle, envelopeStyle }   // envelopeStyle (v4): map ở 3.4c
  hidden?: boolean           // ẩn khỏi gallery mà không sửa schema (bản đầu: không theme nào ẩn, kể cả dem-nhung)
}
```

**Field trong config:**
| Field | Kiểu / enum | Mặc định |
|---|---|---|
| `theme.preset` | `tram-vang` · `hong-phan` · `luc-bao` · `son-do` · `muc-giay` · `hoai-co` · `sen-cham` · `mau-nuoc` · `dat-nung` · `pastel-han` · `dem-nhung` · `bien-dao` | `tram-vang` |
| `theme.primaryColor` | hex hoặc `null` (theo theme) | `null` |
| `theme.overrides` | `{primary?, onPrimary?, accent?, accent2?, bg?, surface?, text?, muted?, line?}` | `{}` |
| `theme.ornamentSet` | `"theme"` · `classic-line` · `romantic` · `traditional` · `minimal` · `deco` · `lotus` · `watercolor` · `boho` · `korean` · `luxe` · `tropical` | `"theme"` |
| `theme.texture` (mới) | `"theme"` · `paper` · `paper-aged` · `linen` · `kraft` · `rice-paper` · `watercolor-wash` · `velvet` · `grain-fine` · `sand` · `none` | `"theme"` |
| `theme.photoFrame` (mới) | `"theme"` · `arch` · `arch-double` · `rect-offset` · `soft-rect` · `circle-moon` · `oval` · `polaroid` · `stamp` · `scallop` · `wash-mask` · `deco-cut` | `"theme"` |
| `sections.divider` | `"theme"` · `ornament` · `wave` · `none` · `leaf-branch` · `double-line` · `cloud` · `lotus` · `dots` · `brush-stroke` · `torn-paper` · `deco-fan` · `wave-ocean` | `"theme"` |
| `fonts.preset` | `"theme"` · `co-dien` · `thanh-lich` · `am-ap` · `bien-tap` · `truyen-thong` | `"theme"` |
| `fonts.heading/script/body` | tên font trong danh sách 2.3 + 2.3b, hoặc `"theme"` | `"theme"` |
| `cover.openStyle` | `"theme"` · `envelope` · `card-flip` · `curtain` · `fade-zoom` · `none` · `wax-seal` · `origami` · `double-door` · `flower-gate` · `scroll` · `card-3d` · `light-gather` · `gift-box` · `moon-gate` · `book` · `ink-spread` · `polaroid` | `"theme"` (= `envelope` với Trầm Vàng) |
| `cover.showOpenedGreeting` | boolean | `true` |
| `cover.envelope.style` **(v4)** | `"theme"` · `classic` · `kraft` · `song-hy` · `lace` · `minimal` · `velvet` | `"theme"` (→ `ThemePreset.suggest.envelopeStyle`; Trầm Vàng = `classic`) |
| `cover.envelope.color` **(v4)** | `"auto"` · `"theme"` · hex | `"auto"` (theo mẫu: cố định với kraft/song-hy/velvet, theo theme với 3 mẫu còn lại) |
| `cover.envelope.guestOnFront` **(v4)** | boolean | `true` (`false`: "Kính gửi …" vào thẻ bên trong như v1) |
| `cover.envelope.liner` **(v4)** | boolean | `true` (lót hoa văn mặt trong nắp) |
| `effects.autoScroll.enabled` **(v4)** | boolean | **`true`** (đổi từ `false`) |
| `effects.autoScroll.speed` **(v4)** | number px/s, kẹp 20–120 | **45** (cũ 55; config cũ có 55 thì giữ nguyên) |
| `effects.autoScroll.startDelayMs` **(v4)** | number, kẹp **1500**–8000 | **2500** (cũ 650; tính từ lúc cover gỡ xong; giá trị import < 1500 bị kẹp lên 1500) |
| `effects.autoScroll.mode` **(v4, mới)** | `"flow"` · `"steady"` | `"flow"` |
| `effects.autoScroll.dwellMs` **(v4, mới)** | number, 0–4000 | `1200` (dừng ở countdown = `max(dwellMs, 2000)`, hằng số trong code) |
| `effects.intensity` | `off` · `low` · `medium` · `high` | `medium` |
| `effects.burst.onOpen` (mới) | `"theme"` · `none` · `confetti` · `petals` · `gold` · `red-paper` | `"theme"` |
| `effects.burst.onRsvp` (mới) | boolean (confetti khi "Tôi sẽ đến") | `true` |
| `effects.burst.countdownFireworks` (mới) | `off` · `wedding-day` · `every-view` (cooldown 15s, ngưỡng 50%, giữ 400ms là hằng số trong code, không nằm trong config) | **(v3)** `every-view` |
| `effects.particles.enabled` (mới) | boolean | `true` |
| `effects.particles.types` (mới) | mảng tối đa 2 phần tử, hoặc `"theme"`: `petal-rose` · `petal-sakura` · `petal-peach` · `petal-lotus` · `petal-dried` · `petal-watercolor` · `plumeria` · `heart` · `paper-heart` · `leaf-green` · `leaf-eucalyptus` · `leaf-maple` · `pampas` · `snow` · `bubble` · `firefly` · `sparkle` · `gold-dust` · `ink-dot` · `dust-mote` · `red-paper` | `"theme"` |
| `effects.particles.color` (mới) | `"theme"` · `"multi"` · hex | `"theme"` |
| `effects.particles.scope` (mới) | `all` · `hero-thankyou` | **(v3)** `all` (hệ số mật độ theo section và vùng loại trừ là hằng số trong code, 5.7) |
| `effects.particles.wind` (mới) | boolean (chỉ có tác dụng ở mức `high`) | `true` |
| `effects.reveal.style` (mới) | `"theme"` · `soft` · `editorial` · `letter` · `gentle` · `playful` · `cinematic` | `"theme"` (= `soft` với Trầm Vàng) |
| `effects.reveal.heading/block/image/ornament` (mới, nâng cao) | `null` (theo gói) hoặc mã reveal nguyên tử ở 5.8: `fade` · `fade-up` · `slide-side` · `zoom-in` · `mask-up` · `wipe` · `photo-settle` · `rise-tilt` · `blur-in` · `split-words` · `split-chars` · `svg-draw` | `null` |
| `effects.parallax` (mới) | boolean (chỉ ở `high`) | `true` |
| `effects.kenBurns` (mới) | boolean | `true` |
| `effects.micro.buttonShine` (mới) | boolean | `true` |
| `effects.micro.photoTilt` (mới) | boolean | `true` |
| `effects.micro.wishFly` (mới) | `paper-plane` · `bubble` · `heart` | `paper-plane` |
| `effects.micro.scrollProgress` (mới) | boolean | `false` |
| `effects.micro.coupleHeartTap` (mới) | boolean | `false` |
| `countdown.style` | `flip` · `slide` · `odometer` · `simple` | `flip` |
| `countdown.milestones` (mới) | boolean | `true` |

Tương thích ngược: config cũ có `theme: "xanh-navy"` thì map sang `luc-bao` (như 1.3); `effects.petals.type` cũ (`petal|heart|leaf|snow-dot`) map sang `particles.types` = `petal-rose` · `heart` · `leaf-green` · `snow`. **(v4)** Config không có `cover.envelope` thì merge mặc định (không cần bump version; nếu solution muốn bump thì để v2). `effects.autoScroll` từ `wedding-site` (`enabled:true, speed:55, startDelayMs:650`): giữ `enabled` và `speed`, kẹp `startDelayMs` lên 1500, thêm `mode:"flow"`, `dwellMs:1200`. Config mới tạo (không import) lấy mặc định mới ở bảng trên; config v1 đã lưu với mặc định cũ `enabled:false` (do v1 sinh, không phải do người dùng chọn) thì solution quyết định có chuyển sang `true` hay không (design khuyên: chuyển, vì người dùng chưa từng có công tắc này trong admin).
