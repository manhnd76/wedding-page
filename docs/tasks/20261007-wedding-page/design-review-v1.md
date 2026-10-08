# Design review v1 (guest) + spec cho 2 yêu cầu mới

> Người viết: ui-ux-designer · Ngày: 2026-10-08 · Phạm vi: guest app v1 (commit 3780836), chỉ phần guest. Không sửa code, không sửa design.md.
> Cách review: dựng 3 bản build tạm từ bản sao config (`WP_CONFIG_PATH`, không đụng `public/content/config.json`) cho `tram-vang`, `son-do`, `dem-nhung`, cộng 2 bản `card-flip` và `fade-zoom`. Chụp bằng Playwright + Chrome ở 360×740, 430×932 (DPR 2) và 1440×900, chụp từng khung giữa lúc đang mở thiệp, thêm chế độ reduced-motion. Kèm kiểm tra bằng script: vùng chạm < 44px, chữ < 13px, cuộn ngang, lỗi console. Chuỗi dấu chồng được dựng bằng đúng font đã nạp của từng theme. Ảnh chụp nằm ở scratchpad của phiên (không commit).
> Ghi chú: lúc review, `public/content/config.json` trên dev server đang để `son-do` (có thể do người khác đổi). Mình không động vào file này.

---

## 1. Tóm tắt đánh giá

**Tổng thể: nền tốt, đúng hướng "thiệp giấy biên tập".** Ba theme ra đúng bảng màu và đúng font. Cả 3 kích thước đều không có cuộn ngang và không có lỗi console. Chuỗi dấu chồng hiển thị đúng ở Great Vibes, Charm và Imperial Script: không có "chữ lai" (một từ hai font), không mất dấu. Cỡ chữ nhảy bậc mạnh, khung vòm ảnh lệch viền đẹp, số đếm ngược rõ. Pill nổi tự ẩn khi đang ở section RSVP, CTA cover nằm đúng vùng ngón cái. Hero desktop chia 7/5 đúng thiết kế. Ở cỡ chữ heading, Charm (Son Đỏ) có dấu rõ nhất trong 3 font script.

**Ba vấn đề lớn cần sửa trước khi gửi khách:**
1. **Phong bì chưa "đọc" thành phong bì.** Phong bì đang dựng dọc, bản thân thẻ là mặt trước, nắp trắng đặt trên thẻ trắng nên gần như không thấy, túi chỉ là dải 52px. Khi mở, thẻ không rút ra từ trong bao mà chỉ trượt lên và bị cắt ở mép trên màn 360×740. Đây là khoảnh khắc đầu tiên khách thấy (Lindgaard 2006: người xem đánh giá độ tin cậy trong khoảng 50ms), nên cần dựng lại. Thiết kế thật ở mục 3.
2. **Chữ trắng ở section Cảm ơn đặt trên vùng ảnh sáng.** Section này dùng lại lớp phủ của hero (gradient đậm ở đáy, trong suốt từ 75% trở lên), trong khi khối chữ lại nằm giữa/trên, nên không đạt 4.5:1 (WCAG 1.4.3).
3. **Hạt nền và pháo hoa vẽ đè lên chữ quan trọng.** Hạt rơi đè lên tên khách trong lời mời, tên cô dâu chú rể ở lời mời/hero, và pháo hoa nổ ngay trên tiêu đề "Đếm ngược ngày cưới". Ở theme sáng, pháo hoa màu primary nâu trông giống bụi bẩn.

Các điểm còn lại nhỏ hơn: vài chữ 11px, chip 37px, dải divider thành "sọc thứ ba", chữ mồ côi ở khối căn giữa, nét swash của chữ script tràn ra ngoài hộp chữ, nút scroll-top che chữ.

**Đếm theo mức:** Cao 4 · Vừa 11 · Thấp 9 (tổng 24).

---

## 2. Danh sách điểm cần sửa

| ID | Mức | Vị trí (section/file) | Hiện trạng | Đề xuất sửa | Ai làm |
|---|---|---|---|---|---|
| R01 | **Cao** | Cover `envelope` · `cover/cover.ts` `stage()`, `styles/cover.css`, `cover/styles/envelope.ts` | Phong bì dọc (~360×470); thẻ chính là mặt trước. Nắp `surface` trên thẻ `surface` gần vô hình (chỉ có 1 vệt gradient). Túi phong bì là dải 52px không che gì. Lúc mở, thẻ trượt `-34%` rồi phóng `1.5×` và **bị cắt mép trên ở 360×740** (khung 750–1200ms). Lời chào chỉ chiếm nửa trên thẻ, nửa dưới trống | Dựng lại theo **mục 3.2**: phong bì **ngang** tỉ lệ 10:7. Tên cặp đôi đặt **trên** phong bì, "Kính gửi + tên khách" in trên mặt phong bì. Thẻ nằm **trong** bao (thứ tự lớp back < card < pocket < flap). Nắp lật xong thì đổi z-index xuống sau thẻ, rồi thẻ rút lên, bao trượt xuống và mờ đi, thẻ về giữa màn. Toàn bộ đặt trong `100svh`, không có khung nào bị cắt | designer (SVG + timeline, mục 3) → frontend |
| R02 | **Cao** | Thank you · `sections/basic.ts` dòng 116, `sections.css` `.sec-thankyou` | Dùng `.hero-shade` (gradient từ đáy, trong suốt từ 75%) trong khi `.ty-content` nằm ở giữa. Heading script trắng và đoạn lời cảm ơn trắng nằm trên phần ảnh sáng, ước lượng < 3:1 | Thêm lớp riêng `.ty-shade { background: linear-gradient(var(--c-overlay), var(--c-overlay)), radial-gradient(60% 45% at 50% 50%, rgba(0,0,0,.28), transparent 70%); }`, tức là phủ đều cộng thêm vùng tối nhẹ ngay sau khối chữ. Với theme tối thì dùng `rgba(bg,.55)` theo 1.6.3. Phải kiểm tra lại trên vùng sáng nhất của ảnh thật | frontend |
| R03 | **Cao** | Hạt nền · `effects/particles/field.ts` (vùng loại trừ) | Hạt đè lên chữ trọng tâm: tên khách trong dòng "Trân trọng kính mời …", tên cặp đôi ở lời mời, tên ở hero (mật độ 1.0). Vùng loại trừ hiện chỉ có form và thẻ sự kiện | Thêm **"vùng dịu"** (khác vùng loại trừ): `.hero-names`, `.ann-names`, `.ann-invite`, `.sec-head` của section đang hiện, tối đa 4 vùng. Hạt đi vào vùng + 8px thì opacity kẹp về **≤ 0.3** (fade 200ms), không ẩn hẳn, để vẫn giữ cảm giác "hoa bay qua". Chi phí: thêm ≤ 4 hình chữ nhật mỗi frame | frontend |
| R04 | **Cao** | Pháo hoa đếm ngược · `effects/burst/fireworks.ts` | (a) Gốc nổ đặt **trên tiêu đề** "COUNTDOWN / Đếm ngược ngày cưới" (thấy rõ ở cả tram-vang và dem-nhung). (b) Ở theme sáng, màu `primary` nâu `#8A6A3B` thành một vòng chấm nâu trông như bụi | (a) Loại vùng `.sec-head` khỏi gốc nổ. Gốc nổ đặt ở 2 dải bên cạnh 4 ô số (x < 18% hoặc > 82% bề rộng section) hoặc dải giữa tiêu đề và ô số; bán kính chùm ≤ 60px ở mobile. (b) Màu theo `mode`: **theme sáng** dùng `accent` + `mix(accent, #fff, 45%)` + `primary` (chỉ 1/3 số hạt), sprite **sao 4 cánh 6px có lõi sáng**, không dùng chấm tròn; **theme tối** giữ màu vàng như hiện tại (đẹp) | frontend |
| R05 | Vừa | Cover, mọi kiểu mở · `cover.ts` `open()` | Nút "Chạm để mở thiệp" và dòng "Thiệp có nhạc" vẫn hiện suốt lúc animation chạy. Mắt khách bị chia đôi và khách tưởng phải bấm lại | Ngay trong handler: `.cv-actions` fade-out 200ms + `translateY(8px)`. Vùng tua nhanh khi chạm lần 2 là **toàn bộ cover**, không chỉ nút | frontend |
| R06 | Vừa | Lời chào sau mở (`.cv-greet-h`) | "Chúng mình sắp cưới!" xuống dòng mồ côi "cưới!" ở 360px; ở `dem-nhung`, Imperial Script cỡ 38px khó đọc | `text-wrap: balance`; cỡ `clamp(30px, 8.6vw, 38px)`. Nếu font script là nhóm "cần cẩn trọng" (Imperial Script, Moon Dance, Birthstone…) thì lời chào dùng **heading italic** 28px thay cho script | frontend |
| R07 | Vừa | Divider · `sections.css` `.divider { background: inherit }` | `inherit` lấy nền của `main`/`body`, nên divider tạo thành một **dải sọc thứ ba** khác màu cả hai section kề bên (rõ nhất ở `dem-nhung` có texture velvet và ở tram-vang giữa surface/bg) | Divider **cao 0 và nằm trên đường ranh giới**: `.divider{height:0;position:relative;z-index:2}`; ornament `position:absolute; top:0; translate:-50% -50%`, có `padding-inline:12px` và nền = nền của section **phía sau** (truyền `--div-bg` từ container). Nhìn sẽ thành ornament "khâu" hai section vào nhau thay vì một dải riêng | frontend |
| R08 | Vừa | Typography script · `.cv-names`, `.hero-names`, `.ty-sig`, `.ann-names` | Nét swash của Great Vibes và Imperial Script (chữ "L" của Linh, "T" của Thuỳ, "N") **tràn ra ngoài hộp chữ** khoảng 0.12–0.15em về bên trái. Khi reveal `wipe`/`mask-up` dùng `overflow:clip` thì sẽ bị cắt | Mọi khối chữ script thêm `padding-inline:.18em`. Mọi `clip-path: inset()` trên chữ script phải chừa biên **ngang** `-0.2em` (hiện mới chừa biên dọc -0.3em). Bổ sung vào quy tắc 2.1 | frontend (+ designer cập nhật design.md sau) |
| R09 | Vừa | Imperial Script (`dem-nhung`) | Ở 28px dấu rất nhỏ, chữ hoa "N" nhiều vòng nên "Nguyễn" khó đọc. Ở 40px vẫn ổn | Đưa Imperial Script vào nhóm "chỉ dùng ≥ 44px" như 2.2. Với `dem-nhung`, `--fs-names` mobile tối thiểu 46px; `.ty-sig` 44px; lời chào xử lý theo R06 | frontend |
| R10 | Vừa | Chữ dưới 13px · `.cd-l` 11px, `.ev-badge` 11px | Thấp hơn mức tối thiểu 13px của design 2.4 (eyebrow 12px là ngoại lệ có chủ đích) | `.cd-l` 12px + `letter-spacing:.14em` (cùng hệ eyebrow); `.ev-badge` 12px | frontend |
| R11 | Vừa | Guestbook · chip gợi ý `.chip` (base.css 78) | Cao 36–39px (< 44). Ở 360px mỗi chip chiếm một dòng nên 4 chip tốn ~370px chiều cao trước khi tới nút Gửi | `min-height:44px`. Gói chip vào **một hàng cuộn ngang** (`overflow-x:auto; scroll-snap-type:x proximity`, mép phải có gradient mờ báo còn chip) ở < 480px, desktop vẫn xuống dòng. Có `aria-label="Gợi ý lời chúc"` cho nhóm | frontend |
| R12 | Vừa | Scroll-top · `floating.ts` | Nút trắng 44px ở mép phải **che chữ căn giữa** (thấy ở son-do: chữ "chúng" trong lời mời) và hiện suốt từ khi đã cuộn 1.5 màn | Chỉ hiện khi **đang cuộn lên** (hướng cuộn = lên, > 1.5 màn), tự ẩn sau 2s đứng yên; ẩn luôn khi tự cuộn đang chạy (mục 5) | frontend |
| R13 | Vừa | Hạt `petal-rose` (sprite) · `effects/particles/types/petal-rose.ts` | Sprite trông như hạt hạnh nhân hoặc lá vàng (đối xứng, mũi nhọn hai đầu), không ra cánh hồng | Vẽ lại: cánh hồng hình **giọt nước ngược, đầu tròn rộng, gốc nhọn hẹp, mép trên có 1 khía nhẹ**, tô 2 lớp (accent 100% + lớp sáng `mix(accent,#fff,35%)` ở 40% diện tích phía trên). Path gợi ý (viewBox 0 0 20 24): `M10 23C4 18 1 12 2 7 3 2.5 7 1 10 3.5 13 1 17 2.5 18 7 19 12 16 18 10 23Z` | designer (path) → frontend |
| R14 | Vừa | Ornament 3 bộ · `theme-assets/ornaments/*.svg` | Là placeholder: nét đơn giản, thiếu biểu tượng "&" (design 1.6.6 yêu cầu đủ 6 phần), `classic-line` không có lá thật, `traditional` chưa có song hỷ | Thay bằng bộ SVG ở **mục 3.1** (đã dựng thử và chụp kiểm tra). Thêm symbol `amp` và `songhy` (traditional) | designer (đã đưa SVG) → frontend |
| R15 | Vừa | Khối căn giữa · `sections.css` | Chữ mồ côi: "rể" (phụ đề sổ lưu bút), "tôi" (lời mời), "Thị Hoa" (bio couple), "tới dự" bị tách dòng | `text-wrap: balance` cho `.sec-sub, .ann-*, .person-bio, .cv-greet-*, .ty-msg`; `text-wrap: pretty` cho đoạn văn. Dòng lời mời: tên khách in đậm (`font-weight:600; color:var(--c-text)`) đúng 4.4 | frontend |
| R16 | Thấp | Seal dấu sáp (cover) | Hình tròn phẳng, monogram "M & L" 13px nhìn như một nút bấm | Dùng seal SVG ở mục 3.2 (hình giọt sáp + vành trong), 64px, monogram 15–16px heading | frontend |
| R17 | Thấp | Cover desktop | Phong bì 460px nằm giữa nền trống, chưa có "nền bàn/vải" như 3.2 | Theo mục 3.2: phong bì 560px, nền `radial-gradient` sáng ở giữa + texture, ornament góc 120px | frontend |
| R18 | Thấp | Countdown | Khoảng trống lớn dưới 4 ô số (chừa cho chip milestone) khi không có milestone | Bỏ chỗ trống khi không có chip, hoặc luôn hiện chip tĩnh "Còn 65 ngày" (nội dung chip đổi theo milestone) | frontend |
| R19 | Thấp | `dem-nhung` · nút scroll-top, nút nhạc | Viền `--c-line` chỉ ~1.3:1 trên nền tối nên khó thấy biên nút (WCAG 1.4.11 cho ranh giới thành phần) | Viền `--c-line-strong` + nền `--c-surface`, thêm `box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-primary) 25%, transparent)` | frontend |
| R20 | Thấp | Thẻ sự kiện · 2 nút outline | Ở 360px chữ "Thêm vào lịch" sát viền pill; icon lịch nhỏ hơn icon chỉ đường | Giảm `padding-inline` xuống 14px cho `.ev-actions .btn`, icon cùng 18px; dưới 360px thì 2 nút xếp dọc | frontend |
| R21 | Thấp | Gift | Lời nhắn 4 dòng căn giữa (quy tắc 1.1: không căn giữa quá 3 dòng) | `max-width: 34ch` + balance; nếu > 3 dòng thì căn trái | frontend |
| R22 | Thấp | `btn-sm` (nút sao chép STK) | 40px < 44px | `min-height:44px` | frontend |
| R23 | Thấp | Desktop ≥ 1024 | Chưa có thanh điều hướng ngang (lệch #9 đã biết) | Giữ pill ở v1. Làm thanh điều hướng ở v2/v4 như 7.1; không chặn | frontend |
| R24 | Thấp | Hạt `gold-dust`/`firefly` trên hero `dem-nhung` | Có hạt màu nâu đục, to (~10px) lẫn với chấm sáng nên nhìn bẩn | Đặt `gold-dust` ≤ 4px; firefly lõi `#FFE7A8` + quầng alpha .25, không có lớp nâu đục | frontend |

**Đã kiểm, đạt:** không cuộn ngang ở 360/430/1440; 0 lỗi console; vùng chạm của các nút chính ≥ 44px (trừ R11, R22); focus ring 2px primary + offset 3px, có biến thể trắng trên ảnh; reduced-motion không tạo canvas, cover mở bằng fade; `safe-area` có trong `.floating` và `.cover`; `.floating` có `pointer-events:none` nên không chặn chạm vào nội dung; pill tự ẩn khi đang ở section đích; dấu tiếng Việt đủ ở cả 3 font script (không mất dấu, không có chữ lai).

---

## 3. Ornament và phong bì: thiết kế thật

Quy ước chung cho sprite:
- Tô bằng `currentColor` (= `--c-accent`). Nét 1px ở kích thước chuẩn (divider 140×21, corner 96, monogram 120). Không có `<use>` lồng nhau (an toàn cho Safari khi sprite là file ngoài). Kích thước mỗi bộ ≤ 4KB gzip.
- Mỗi bộ có đủ 6 symbol: `divider` (160×24), `title` (80×16), `corner` (96×96), `amp` (120×24, khung hai bên chữ "&"; chữ "&" vẫn là text font script), `monogram` (120×120), `gift` (64×64). Riêng `traditional` có thêm `songhy` và `cloud`.
- Divider hiển thị 140×21 ở mobile, 200×30 ở desktop. Ornament góc ở cover 96px (mobile) / 120px (desktop), `opacity .7`.
- Mọi phần dưới đây đã được dựng thử và chụp kiểm tra bằng Chrome (ảnh `shots/orn.png` trong scratchpad).

### 3.1 Ba bộ ornament

**`classic-line` (Trầm Vàng): cành lá thanh mảnh hai bên hình thoi.** Lá dùng chung một dạng "hạnh nhân cong", xoay theo nhánh.
```svg
<svg xmlns="http://www.w3.org/2000/svg">
<symbol id="divider" viewBox="0 0 160 24"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
<path d="M4 12H53M107 12h49"/><path d="M80 4.5 87.5 12 80 19.5 72.5 12Z"/>
<path d="M53 12C59 12 64 10.8 69.5 7.6"/>
<path transform="translate(57 11.9) rotate(-42)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(60.5 11.4) rotate(22)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(65 9.6) rotate(-62)" d="M0 0C2.4-2.4 5.6-2.7 8-1.3C5.6 1.1 2.4 1.6 0 0Z"/>
<g transform="matrix(-1 0 0 1 160 0)"><path d="M53 12C59 12 64 10.8 69.5 7.6"/>
<path transform="translate(57 11.9) rotate(-42)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(60.5 11.4) rotate(22)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(65 9.6) rotate(-62)" d="M0 0C2.4-2.4 5.6-2.7 8-1.3C5.6 1.1 2.4 1.6 0 0Z"/></g>
</g><g fill="currentColor"><circle cx="80" cy="12" r="1.5"/><circle cx="4" cy="12" r="1.1"/><circle cx="156" cy="12" r="1.1"/></g></symbol>
<symbol id="title" viewBox="0 0 80 16"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M4 8h28M48 8h28"/><path d="M40 3.5 44.5 8 40 12.5 35.5 8Z"/></g><circle cx="40" cy="8" r="1.1" fill="currentColor"/></symbol>
<symbol id="corner" viewBox="0 0 96 96"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
<path d="M5 91V21Q5 5 21 5h70"/><path d="M11 91V25Q11 11 25 11h66" opacity=".45"/><path d="M20 14 26 20 20 26 14 20Z"/>
<path d="M22 80C23 58 35 40 64 27"/>
<path transform="translate(22.5 70) rotate(-120)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(23.5 64) rotate(-15)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(27.5 53) rotate(-110)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(30 48) rotate(-5)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(37 40) rotate(-95)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(41 36.5) rotate(8)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(50 31.5) rotate(-75)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(54 30) rotate(15)" d="M0 0C2.4-2.4 5.6-2.7 8-1.3C5.6 1.1 2.4 1.6 0 0Z"/>
</g><g fill="currentColor"><circle cx="66.5" cy="25.8" r="1.3"/><circle cx="70" cy="22" r="1"/><circle cx="16" cy="88" r="1"/></g></symbol>
<symbol id="amp" viewBox="0 0 120 24"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
<path d="M6 12H38"/><path transform="translate(30 12) rotate(-30)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/><path transform="translate(26 12) rotate(30)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<g transform="matrix(-1 0 0 1 120 0)"><path d="M6 12H38"/><path transform="translate(30 12) rotate(-30)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/><path transform="translate(26 12) rotate(30)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/></g></g></symbol>
<symbol id="gift" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
<rect x="12" y="30" width="40" height="26" rx="1.5"/><rect x="8" y="22" width="48" height="8" rx="1.5"/><path d="M29 22v34M35 22v34"/>
<path d="M32 22C27 12 17 10 17.5 16S27 21 32 22Z"/><path d="M32 22C37 12 47 10 46.5 16S37 21 32 22Z"/><path d="M30 23 25 31M34 23 39 31"/></g></symbol>
<symbol id="monogram" viewBox="0 0 120 120"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
<circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="47" opacity=".45"/>
<path d="M60 113C40 113 22 100 16 80"/><path d="M60 113C80 113 98 100 104 80"/>
<path transform="translate(22 92) rotate(-150)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(30 101) rotate(-170)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(41 108) rotate(170)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<g transform="matrix(-1 0 0 1 120 0)"><path transform="translate(22 92) rotate(-150)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(30 101) rotate(-170)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/>
<path transform="translate(41 108) rotate(170)" d="M0 0C3-3 7-3.4 10-1.6C7 1.4 3 2 0 0Z"/></g>
<path d="M60 3.5 64 8 60 12.5 56 8Z"/></g></symbol>
</svg>
```

**`traditional` (Son Đỏ): mây cát tường (mây có xoắn), hồi văn ở góc, song hỷ hình học.** Song hỷ dựng bằng nét vuông nên không cần font CJK. Dùng nó cho dấu trên phong bì, monogram và trang trí section Mừng cưới.
```svg
<svg xmlns="http://www.w3.org/2000/svg">
<symbol id="divider" viewBox="0 0 160 24"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
<path d="M10 15H56M104 15h46"/><path d="M4 15h4v-5h-5v3h2"/><path d="M156 15h-4v-5h5v3h-2"/>
<path d="M58 19H102C106 19 106 13 101.5 13C102.5 7 95 5 92 9.5C91 2.5 80 1.5 78.5 8.5C75 5 68 6.5 69 12.5C64 11 60.5 15 62.5 17.5"/>
<path d="M78.5 8.5C82 9 82.5 13.5 79 14C76.7 14.4 76 11.8 77.8 11.2"/><path d="M92 9.5C95 10.5 94.6 14.6 91.6 14.6C89.8 14.6 89.4 12.4 90.8 11.9"/></g></symbol>
<symbol id="title" viewBox="0 0 80 16"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h22M54 10h22"/>
<path d="M29 13H51C53.5 13 53.5 9 50.5 9C51 5 46 4 44.5 7C43.5 2.5 36.5 2.5 36 7.5C33.5 5.5 29.5 7 30.5 10C28.5 10 28 12 29 13Z"/></g></symbol>
<symbol id="corner" viewBox="0 0 96 96"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="square">
<path d="M5 91V5h86"/><path d="M11 91V11h80" opacity=".5"/><path d="M17 46V17h29v22H24V24h15v8h-7"/></g>
<g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
<path d="M54 22H86C89 22 89 17 85.5 17C86 12.5 80.5 11 78 14.5C77 9 69 8.5 68 14C65.5 11.5 60.5 13 61.5 17C58 16.5 55.5 19.5 57 21"/>
<path d="M68 14C71 14.5 71.5 18.5 68.5 19C66.6 19.3 66 17 67.5 16.5"/>
<path d="M22 54V86C22 89 17 89 17 85.5C12.5 86 11 80.5 14.5 78C9 77 8.5 69 14 68C11.5 65.5 13 60.5 17 61.5C16.5 58 19.5 55.5 21 57"/>
<path d="M14 68C14.5 71 18.5 71.5 19 68.5C19.3 66.6 17 66 16.5 67.5"/></g></symbol>
<symbol id="songhy" viewBox="0 0 84 64"><g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="square">
<path d="M6 7h72M21 2v13M63 2v13M11 15h20M53 15h20"/><path d="M12 20h18v9H12zM54 20h18v9H54z"/>
<path d="M14 34l2.5 4M28 34l-2.5 4M56 34l2.5 4M70 34l-2.5 4"/><path d="M3 42h78"/><path d="M12 47h18v13H12zM54 47h18v13H54z"/></g></symbol>
<symbol id="cloud" viewBox="0 0 40 20"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
<path d="M3 17H37C40 17 40 12 36.5 12C37 7 31 5.5 28.5 9C27.5 3 19 2 17.5 8C15 5 9.5 6.5 10.5 11C6.5 10 3.5 13 5 15.5"/>
<path d="M17.5 8C20.5 8.5 21 12.5 18 13C16 13.3 15.5 11 17 10.5"/><path d="M28.5 9C31 10 30.5 13.5 28 13.5C26.5 13.5 26.2 11.6 27.4 11.2"/></g></symbol>
<symbol id="amp" viewBox="0 0 120 24"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M6 12H40M80 12h34"/><path d="M40 12h-4v-4h5v3M80 12h4v-4h-5v3"/></g></symbol>
<symbol id="gift" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
<rect x="12" y="30" width="40" height="26" rx="1"/><rect x="8" y="22" width="48" height="8" rx="1"/><path d="M32 22v34"/>
<path d="M32 22C29 15 23 13 21.5 17S27 21.5 32 22ZM32 22C35 15 41 13 42.5 17S37 21.5 32 22Z"/><path d="M18 40H26V48H18ZM38 40H46V48H38Z" stroke-width="1"/></g></symbol>
<symbol id="monogram" viewBox="0 0 120 120"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="square">
<circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="44" opacity=".5"/><path d="M56 6h8v6h-8zM56 108h8v6h-8zM6 56v8h6v-8zM108 56v8h6v-8z"/></g></symbol>
</svg>
```
Song hỷ dùng màu `--c-primary` (đỏ son), không dùng accent, khi đặt trên nền sáng. Dùng ở cỡ ≥ 40px.

**`luxe` (Đêm Nhung): art-deco, đường kép, quạt nan, góc nan toả.**
```svg
<svg xmlns="http://www.w3.org/2000/svg">
<symbol id="divider" viewBox="0 0 160 24"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square">
<path d="M4 15H58M10 18H58M102 15h54M102 18h48"/><path d="M64 18a16 16 0 0 1 32 0Z"/><path d="M71 18a9 9 0 0 1 18 0"/>
<path d="M80 18V2M80 18 66.1 10M80 18 72 4.1M80 18 88 4.1M80 18 93.9 10"/>
<path d="M60.5 13.5 62.5 15.5 60.5 17.5 58.5 15.5ZM99.5 13.5 101.5 15.5 99.5 17.5 97.5 15.5Z"/></g></symbol>
<symbol id="title" viewBox="0 0 80 16"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square"><path d="M4 9h26M6 12h24M50 9h26M50 12h24"/><path d="M33 13a7 7 0 0 1 14 0ZM40 13V6M40 13 35 8M40 13 45 8"/></g></symbol>
<symbol id="corner" viewBox="0 0 96 96"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square">
<path d="M5 91V5h86"/><path d="M11 91V11h80"/><path d="M17 91V36h-6M17 36V17h19V11M36 17h55"/>
<path d="M17 47A30 30 0 0 0 47 17"/><path d="M17 57A40 40 0 0 0 57 17" opacity=".5"/>
<path d="M17 17 38.2 38.2M17 17 44.7 28.5M17 17 28.5 44.7"/><path d="M88 2 91 5 88 8 85 5ZM2 88 5 91 8 88 5 85Z" fill="currentColor"/></g></symbol>
<symbol id="amp" viewBox="0 0 120 24"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M6 11h34M10 14h30M80 11h34M80 14h30"/><path d="M43 10.5l2 2-2 2-2-2zM77 10.5l2 2-2 2-2-2z" fill="currentColor"/></g></symbol>
<symbol id="gift" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square">
<path d="M12 30h40v26H12zM8 22h48v8H8zM32 22v34"/><path d="M22 22a10 10 0 0 1 20 0"/><path d="M27 22a5 5 0 0 1 10 0"/><path d="M12 40l6 6-6 6M52 40l-6 6 6 6" opacity=".6"/></g></symbol>
<symbol id="monogram" viewBox="0 0 120 120"><g fill="none" stroke="currentColor" stroke-width="1">
<path d="M42 6h36l36 36v36l-36 36H42L6 78V42z"/><path d="M45 13h30l32 32v30l-32 32H45L13 75V45z" opacity=".55"/>
<path d="M60 1 64 5 60 9 56 5ZM60 111 64 115 60 119 56 115Z" fill="currentColor"/></g></symbol>
</svg>
```

### 3.2 Phong bì (mẫu `classic`, mặc định Trầm Vàng): bố cục, SVG, timeline

**Bố cục mobile 360–430 (trong `100svh`, nếu thiếu chỗ thì phần trên co lại trước):**
```
 THIỆP MỜI CƯỚI                  eyebrow (muted)
 12 · 12 · 2026                  heading, primary
   Minh Anh                      tên cặp đôi, script clamp(40px,11vw,52px), NGOÀI phong bì
      &                          (đây là LCP, đọc được ngay cả khi phong bì chưa tải)
   Thuỳ Linh
 ┌─────────── 10:7 ───────────┐  phong bì ngang, rộng min(88vw,380px)
 │╲         ( seal )         ╱│  nắp tam giác chạm ~55% chiều cao, seal 64px ở mũi nắp
 │  ╲______________________╱  │
 │         Kính gửi            │  in trên mặt phong bì như ghi địa chỉ
 │     Gia đình anh Mạnh       │  heading italic 20–22px, tối đa 2 dòng
 └────────────────────────────┘
 ( ♡  Chạm để mở thiệp )         pill 52px
 ♪ Thiệp có nhạc, bật loa
```
- Màn ≤ 640px cao: tên cặp đôi chỉ còn 1 dòng ("Minh Anh & Thuỳ Linh", 34px).
- Desktop: phong bì 560px. Nền là `radial-gradient(ellipse at 50% 45%, var(--c-surface), var(--c-bg) 70%)` + texture, ornament góc 120px.
- Lớp (từ dưới lên): `env-back` (lòng phong bì, lót hoa văn) → `env-card` (thẻ thiệp, rộng 92%, cao 128% so với phong bì, ban đầu nằm hẳn trong bao) → `env-front` (túi: 2 cánh bên + cánh đáy, **đục**) → `env-flap` (nắp, mặt trước = giấy, mặt sau = lót hoa văn, `backface-visibility:hidden` 2 mặt) → `seal`.
- Tên khách là **text HTML** đặt trên `env-front` (không vẽ trong SVG), để screen reader đọc được và auto-fit hoạt động. SVG phong bì có `aria-hidden`.
- Màu theo token: `--env-paper: var(--c-surface)`, `--env-paper-2: color-mix(in srgb, var(--c-accent) 10%, var(--c-bg))`, `--env-edge: var(--c-line)`, `--env-liner: var(--c-accent)`, `--env-seal: var(--c-primary)`.

**SVG mặt trước và nắp (viewBox 340×238, cùng toạ độ với phong bì):**
```svg
<!-- env-back: lòng phong bì -->
<rect x=".5" y=".5" width="339" height="237" rx="6" fill="var(--env-paper-2)" stroke="var(--env-edge)"/>
<!-- env-front: túi (2 cánh bên + cánh đáy), che thẻ -->
<path d="M.5 6.5 162 128Q170 134 178 128L339.5 6.5V231.5Q339.5 237.5 333.5 237.5H6.5Q.5 237.5 .5 231.5Z" fill="var(--env-paper)" stroke="var(--env-edge)"/>
<path d="M.5 237 150 118M339.5 237 190 118" fill="none" stroke="var(--env-edge)"/>
<!-- env-flap mặt trước (transform-origin: 50% 0) -->
<path d="M.5 .5H339.5L182 124Q170 133 158 124Z" fill="var(--env-paper)" stroke="var(--env-edge)"/>
<path d="M12 .5 170 117 328 .5" fill="none" stroke="var(--env-liner)" stroke-width=".8" opacity=".6"/>
<!-- env-flap mặt sau (rotateX(180deg) sẵn): lót sọc chéo -->
<pattern id="liner" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 5h10" stroke="var(--env-liner)" stroke-width="1.2" opacity=".5"/></pattern>
<path d="M14 .5 166 124Q170 127 174 124L326 .5Z" fill="url(#liner)"/>
```
**Seal dấu sáp (64×64, đặt tại mũi nắp):**
```svg
<svg viewBox="-32 -32 64 64" aria-hidden="true">
 <radialGradient id="wax" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="color-mix(in srgb,var(--env-seal) 70%,#fff)"/><stop offset=".55" stop-color="var(--env-seal)"/><stop offset="1" stop-color="color-mix(in srgb,var(--env-seal) 70%,#000)"/></radialGradient>
 <g fill="url(#wax)"><circle r="24"/><circle cy="-21" r="8"/><circle cx="15" cy="-15" r="7.5"/><circle cx="21" r="8.5"/><circle cx="15" cy="15" r="7"/><circle cy="21" r="8"/><circle cx="-15" cy="15" r="7.5"/><circle cx="-21" r="7"/><circle cx="-15" cy="-15" r="8"/></g>
 <circle r="17" fill="none" stroke="#fff" stroke-opacity=".35"/><circle r="14.5" fill="none" stroke="#000" stroke-opacity=".25"/>
</svg>
```
(Monogram là text HTML 15–16px heading, màu `--c-on-primary`, đặt chồng lên. `color-mix` trong `stop-color` cần fallback: frontend tính sẵn 2 màu sáng/tối bằng `derive.ts`.) So với bản dựng thử: các bướu sáp được tăng bán kính và kéo gần tâm hơn để thành một khối sáp liền, không bị "chuỗi hạt".

**Timeline mở (mức Vừa, tổng ~2.0s, ≤ 2.4s):**
| t (ms) | Phần tử | Chuyển động | Easing |
|---|---|---|---|
| 0–120 | `.cv-actions` | opacity 0 + translateY 8px (R05) | out |
| 0–260 | seal | nhấn `scale .92` (0–90ms), rồi tách đôi: 2 nửa (clip ở tầng DOM, không animate clip) `translateX ±10px rotate ±16deg` + fade | `--ease-out` |
| 180–720 | flap | `rotateX(0→180deg)` quanh mép trên, `perspective:1200px`; `z-index` 4→1 ở mốc 50% (WAAPI animate z-index rời rạc) | `--ease-inout` |
| 650–1250 | card | `translateY(0 → -62%)` rút lên khỏi túi | `--ease-out` |
| 1150–1550 | back+front+flap | `translateY(0 → 30%)` + opacity → 0 (bao "rơi" xuống) | `--ease-in` nhẹ |
| 1150–1550 | card | về giữa màn `translateY(-62% → -20%)`, `scale(1 → 1.06)`; nội dung đổi sang lời chào (crossfade 200ms) | `--ease-out` |
| 1550–1950 | cover | giữ lời chào 300ms rồi `scale 1.06→1.12` + fade cover | `--ease-out` |
- **Nhẹ:** seal fade 120ms, flap 320ms, card rút 320ms, bỏ phần bao rơi (fade chung), tổng ~1.1s. **Nhiều:** thêm 12 hạt bụi vàng lóe ở chỗ seal tách (dùng engine burst sẵn có). Không bao giờ dùng `clip-path` trên vùng chữ.
- `will-change` chỉ gắn cho 4 phần tử (seal, flap, card, env) trong lúc chạy, xong thì gỡ.

---

## 4. Spec mẫu phong thư (Việc 2a)

### 4.1 Nguyên tắc
- Áp dụng khi kiểu mở đã resolve ra `envelope`. Mọi mẫu dùng **chung bố cục và timeline 3.2** (cùng module `envelope.ts`). Mỗi mẫu chỉ là một **"skin"**: SVG + biến CSS + tối đa 1 bước animation riêng (≤ 1.5KB gz mỗi skin, import động theo mẫu đang chọn). Nhờ vậy chi phí bảo trì thấp và tổng thời gian vẫn ≤ 2.4s.
- 6 mẫu (đúng Hick's Law: ≤ 7 lựa chọn, có ảnh xem trước). Chữ trên phong bì luôn đạt ≥ 4.5:1 với nền phong bì (mỗi skin khai báo `--env-ink`).

### 4.2 Danh mục 6 mẫu
| id | Tên trong admin | Visual | Màu | Animation riêng (thêm vào timeline chung) | Chi phí | Theme gợi ý |
|---|---|---|---|---|---|---|
| `classic` ★ | Cổ điển · dấu sáp | Giấy ngà, nắp tam giác nhọn, lót sọc chéo accent, dấu sáp monogram (mục 3.2) | **Theo theme** (surface/accent/primary) | Dấu sáp tách đôi | Thấp | tram-vang, luc-bao, sen-cham |
| `kraft` | Giấy kraft · dây gai | Giấy kraft có thớ (noise thô, đứng yên), dây gai buộc chữ thập + nơ, thẻ tên bằng giấy ngà treo dây ghi "Kính gửi …", nhánh oải hương/cỏ lau khô kẹp dưới nút dây | **Cố định**: kraft `#C9A47A`, mặt `#D8B98F`, mực `#3A2A20` (9.1:1 trên `#D8B98F`), dây `#8B6B4A` | Thay pha seal (0–380ms): nơ tuột bằng `stroke-dashoffset` vòng nơ 260ms, dây trượt `translateX(±120%)` sang hai bên + fade; thẻ tên lắc nhẹ ±4° rồi rơi theo bao | Thấp–Vừa (dashoffset SVG) | dat-nung, hoai-co |
| `song-hy` | Phong bì đỏ Song Hỷ | Đỏ son, viền chỉ vàng kép, mây cát tường chìm (opacity .12), nắp vát tù (góc 150°); thay seal bằng **huy hiệu tròn vàng có chữ 囍** (symbol `songhy`); thẻ bên trong màu ngà viền đỏ | **Cố định**: đỏ `#A3201D`, vàng `#D4A23C`, chữ trên đỏ dùng `#FFF4DC` (7.3:1) | Huy hiệu xoay `rotateY(0→90°)` rồi biến mất (200ms) kèm vệt sáng quét qua viền vàng (gradient opacity translate 300ms). Mức Nhiều: burst `red-paper` 24 mảnh | Vừa | son-do |
| `lace` | Ren & hoa | Phong bì màu nền theme pha hồng, **mép nắp lượn ren** (scallop + lỗ đục tròn, SVG tĩnh), giữ nắp bằng **cụm hoa ép** (2 bông + 3 lá, tô accent/accent2) thay seal | **Theo theme** (bg/accent/accent2) | Cụm hoa nhấc lên `translateY(-12px) rotate(-10deg)` + fade 260ms; mức Vừa/Nhiều rơi 6/12 cánh hoa qua engine hạt sẵn có | Vừa (mép ren là SVG tĩnh, không animate mask) | hong-phan, mau-nuoc, pastel-han |
| `minimal` | Tối giản | Giấy phẳng, **nắp chữ nhật thấp** (cao 38%), một đường kẻ mảnh, sticker tròn 28px màu accent có chữ cái đầu thay seal; dòng "GỬI · Gia đình anh Mạnh" kiểu tem nhãn, chữ sans uppercase 12px + tên 18px | **Theo theme** | Sticker bóc từ góc: `rotate(-25deg) translate(8px,-6px)` + fade 220ms; nắp mở 380ms; tổng ~1.5s | Thấp nhất | muc-giay, bien-dao |
| `velvet` | Nhung đêm | Nền nhung đen ánh đỏ (radial-gradient + noise tĩnh), viền chỉ vàng art-deco kép, nắp nhọn có viền vàng, dấu sáp màu **vàng đồng ánh kim** (gradient 3 điểm), lót nắp họa tiết quạt deco | **Cố định khi theme sáng**: `#1C1517`/`#D9B77E`; **theo theme** khi `mode=dark` | Trước khi mở (0–350ms): vệt sáng chéo lướt qua viền vàng (lớp gradient `translateX`, opacity). Mức Nhiều: 16 hạt `gold-dust` từ chỗ seal | Vừa | dem-nhung |

Ghi chú: mẫu "Thư hàng không" (viền sọc đỏ-xanh, tem + dấu bưu điện ngày cưới) rất hợp `hoai-co`, nhưng để dành cho v4, không đưa vào 6 mẫu đầu để danh sách gọn.

### 4.3 Field schema
| Field | Kiểu / enum | Mặc định | Ghi chú |
|---|---|---|---|
| `cover.envelope.style` | `"theme"` · `classic` · `kraft` · `song-hy` · `lace` · `minimal` · `velvet` | `"theme"` | `"theme"` → `ThemePreset.suggest.envelopeStyle` |
| `cover.envelope.color` | `"auto"` · `"theme"` · hex | `"auto"` | `auto` = theo mặc định của mẫu (cố định với kraft/song-hy/velvet, theo theme với các mẫu còn lại); `theme` = ép nhuộm theo token theme; hex = màu giấy tuỳ chọn (ink tự chọn trắng/đen theo tương phản, bắt buộc ≥ 4.5:1) |
| `cover.envelope.guestOnFront` | boolean | `true` | `false` thì "Kính gửi …" chuyển vào thẻ bên trong như v1 |
| `cover.envelope.liner` | boolean | `true` | Lót hoa văn mặt trong nắp |
| (code) `ThemePreset.suggest.envelopeStyle` | id mẫu | xem 4.4 | Thêm vào preset, không nằm trong config |

Chữ trong seal dùng lại `cover.monogram` (không thêm field). Migrator: config cũ không có `cover.envelope` thì merge mặc định, nên không phải bump version (nếu solution muốn bump thì để v2).

### 4.4 Map gợi ý theo 12 theme
| Theme | `envelopeStyle` | | Theme | `envelopeStyle` |
|---|---|---|---|---|
| tram-vang ★ | `classic` | | sen-cham | `classic` (giấy dó, seal chàm) |
| hong-phan | `lace` | | mau-nuoc | `lace` |
| luc-bao | `classic` (lót xanh lục) | | dat-nung | `kraft` |
| son-do | `song-hy` | | pastel-han | `lace` |
| muc-giay | `minimal` | | dem-nhung | `velvet` |
| hoai-co | `kraft` | | bien-dao | `minimal` |
(Map này chỉ có tác dụng khi kiểu mở resolve ra `envelope`. Ví dụ son-do gợi ý kiểu mở `scroll`, nên chỉ khi admin chọn kiểu mở "Phong bì" thì mẫu `song-hy` mới hiện.)

### 4.5 UX trong admin (tab Hiệu ứng, ngay dưới thẻ kiểu mở)
- Chỉ hiện khi kiểu mở là "Phong bì" (progressive disclosure). Tiêu đề: "Mẫu phong bì".
- **Gallery thẻ** 3 cột ở desktop, 2 cột ở mobile. Mỗi thẻ 120×150 là **poster tĩnh dựng bằng chính SVG skin, thu nhỏ**, nhuộm theo theme đang chọn và có tên khách mẫu. Hover/focus thì phát mini-animation của skin (CSS, 1.2s, chạy 1 lần). Thẻ đầu là "Theo theme (Cổ điển)".
- Badge trên thẻ: "Đang dùng ✓", "Gợi ý cho theme", "Màu cố định" (kraft/song-hy/velvet). Không chỉ dùng màu để báo trạng thái.
- **Chọn = phát ngay** trong preview (`postMessage({type:"fx:replay", target:"cover", envelopeStyle})`); dùng chung nút "↻ Phát lại" và "0.5x" của 8.13.
- Dưới gallery: "Màu phong bì: (● Theo mẫu) ( Theo theme ) ( Tự chọn ▢ )". Khi chọn "Tự chọn" thì có badge tương phản của mực trên giấy. Thêm 2 công tắc: "Ghi tên khách trên phong bì" và "Lót hoa văn trong nắp".
- `role="radiogroup"`, phím mũi tên để duyệt, Space/Enter để chọn. Nhãn đọc: "Phong bì đỏ Song Hỷ, màu cố định, gợi ý cho Son Đỏ".

---

## 5. Spec tự động cuộn (Việc 2b)

### 5.1 Lập trường
Tự cuộn giành quyền điều khiển của người dùng (heuristic "User control and freedom" của NN/g). Vì người duyệt đã chọn BẬT mặc định, spec giữ **3 nguyên tắc** để không gây khó chịu: (1) **mọi tác động của khách dừng ngay**, (2) **không tự tiếp tục sau khi khách đã chạm**, (3) **luôn có nút Dừng/Tiếp tục hiện rõ**. Nút này cũng là cơ chế "Pause, Stop, Hide" mà WCAG 2.2.2 bắt buộc cho chuyển động tự chạy dài hơn 5s.

### 5.2 Hành vi
| Hạng mục | Spec |
|---|---|
| Khi nào bắt đầu | Sau khi cover gỡ xong (`opened` resolve) + `startDelayMs` (mặc định **2500ms**, để chuỗi vào của hero 1.2s và burst sau mở chạy xong). Tốc độ tăng dần từ 0 tới tốc độ đích trong **800ms** (ease-in), không giật |
| Không bắt đầu nếu | khách đã cuộn/chạm/bấm phím trong lúc chờ · đang khôi phục vị trí cuộn cũ (reload giữa trang, 3.5 bước 4) · URL có hash (`#rsvp`…) · trang cao < 1.5 màn hình · `prefers-reduced-motion` · cấp "Tắt" · `enabled=false` |
| Tốc độ | `speed` px/s (CSS px), mặc định **45**. Nhân hệ số màn hình `clamp(innerHeight/800, .8, 1.2)`: màn 740px chạy ~42px/s (khoảng 1 dòng body mỗi 0.65s, dễ đọc lướt). 3 mức trong admin: Chậm 32 · Vừa 45 · Nhanh 64 |
| Kiểu chạy (`mode`) | `flow` ★: chạy đều, **dừng ngắn `dwellMs` (1200ms) mỗi khi đầu một section chạm 18% chiều cao viewport**, như ngắt chương; reveal chạy trọn trong lúc dừng. Section đếm ngược dừng `max(dwellMs, 2000)` để pháo hoa đủ điều kiện (≥ 50% + giữ 400ms). Hero và footer không dừng. `steady`: chạy đều, không dừng |
| Dừng ngay (stop) khi | `wheel` · `touchstart` (bất kỳ đâu, kể cả nút nổi) · `pointerdown` chuột · `keydown` bất kỳ (trừ khi chỉ bấm phím bổ trợ Shift/Ctrl/Alt/Meta) · **kéo thanh cuộn hoặc tìm trong trang**: mỗi frame so `scrollY` thực với vị trí đã đặt, lệch > 3px mà không có resize trong 300ms trước đó thì dừng · `focusin` vào input/textarea/select/button/a · mở lightbox / sheet / menu nhanh (`.has-overlay`) · chọn văn bản (`selectionchange` không rỗng) |
| Tạm dừng rồi tự chạy lại (pause) | Chỉ với nguyên nhân **do hệ thống**: tab ẩn (`visibilitychange`), chạy lại sau khi hiện lại 1s · xoay màn/resize (kể cả thanh địa chỉ iOS co giãn), chạy lại sau 500ms. Những nguyên nhân này không tính là "khách tác động" |
| Có tự tiếp tục sau khi khách tác động không | **Không** (mặc định). Khách đã chạm nghĩa là khách đang tự đọc hoặc tự tương tác. Nút chuyển sang "Tiếp tục tự cuộn" để khách tự bật lại |
| Nút điều khiển | Nút tròn 44px ở **cột phải, trên nút nhạc** (thứ tự từ trên xuống: tự cuộn, nhạc; scroll-top bị ẩn khi đang tự cuộn). Đang chạy: icon ‖ + `aria-label="Dừng tự cuộn"` `aria-pressed="true"`, có vòng tiến độ mảnh quanh nút (scaleX/stroke-dashoffset, không bắt buộc). Đã dừng: icon ▶↓ + `aria-label="Tiếp tục tự cuộn"`. **Lần dừng đầu tiên** hiện tooltip 3s "Đã dừng tự cuộn · bấm ▶ để tiếp tục" (toast `role="status"`). Tới cuối trang thì ẩn nút. Menu nhanh của pill có thêm mục "Tự cuộn: Bật/Tắt" |
| Khi bấm "Tiếp tục" | Chạy lại từ vị trí hiện tại, tăng tốc 800ms, **không** áp `startDelayMs` |
| Dừng ở cuối | Khi `scrollY ≥ maxScroll − 2`: dừng hẳn, không quay về đầu. Nếu trang có section Cảm ơn thì giảm tốc dần trong 1 màn cuối (ease-out) để "hạ cánh" êm vào chữ ký |
| Tương tác với hiệu ứng | **Reveal**: chạy bình thường nhờ IntersectionObserver. Tăng `rootMargin` đáy lên `0px 0px -10%` và **prefetch ảnh lazy trong 1.5 màn phía trước** để không cuộn vào ô trống. **Hạt nền**: tốc độ tự cuộn **không** tính vào "gió theo cuộn" (chỉ tính cuộn của khách), nếu không hạt sẽ trôi lệch liên tục. **Pháo hoa**: đã có điều kiện (dừng 2s ở countdown). **Pill**: giữ dạng thu nhỏ (`is-mini`) suốt lúc tự cuộn để che ít nội dung, giãn ra khi dừng. **Nhạc**: không liên quan |
| Kỹ thuật | Vòng rAF với `dt`. Cộng dồn vị trí dạng số thực, chỉ gọi `window.scrollTo(0, y)` khi lệch ≥ 1 device pixel. Trong lúc chạy đặt `html{scroll-behavior:auto}`. Không dùng CSS smooth-scroll, không dùng `scrollBy` có `behavior:smooth`. Dừng rAF khi stop/pause. Chi phí < 0.3ms/frame |
| Screen reader / bàn phím | Bất kỳ phím nào cũng dừng, nên người dùng bàn phím không bị kéo đi. Tự cuộn không di chuyển focus. Nút có nhãn rõ và nằm trong thứ tự Tab sau nút nhạc |

### 5.3 Theo cấp cường độ và reduced-motion
| | Tắt | Nhẹ | Vừa ★ | Nhiều | Máy yếu | `prefers-reduced-motion` |
|---|---|---|---|---|---|---|
| Tự chạy | không (nút vẫn có trong menu nhanh) | có | có | có | có (rẻ) | **không tự chạy**; nút "Tự cuộn" vẫn hiện ở trạng thái dừng, khách bấm thì chạy (khách chủ động đồng ý), chế độ `steady`, tốc độ cố định 32px/s |
| Dừng ở section | theo `mode` | theo `mode` | theo `mode` | theo `mode` | theo `mode` | không |
Lý do không tắt ở cấp Nhẹ: tự cuộn là hỗ trợ đọc, không phải hiệu ứng trang trí. Cấp "Tắt" tôn trọng ý định "đừng có gì tự chuyển động".

### 5.4 Field schema (`effects.autoScroll`)
| Field | Kiểu | Mặc định mới | Ghi chú |
|---|---|---|---|
| `enabled` | boolean | **`true`** (đổi từ `false`) | |
| `speed` | number px/s, kẹp 20–120 | **45** (cũ 55) | Admin hiện 3 chip 32/45/64 + "Tuỳ chỉnh" trong phần nâng cao. Config cũ có 55 thì giữ nguyên |
| `startDelayMs` | number, kẹp **1500**–8000 | **2500** (cũ 650) | Tính từ lúc cover gỡ xong. Giá trị cũ 650 của wedding-site khi import sẽ được kẹp lên 1500 |
| `mode` (mới) | `"flow"` · `"steady"` | `"flow"` | |
| `dwellMs` (mới) | number, 0–4000 | `1200` | Mức dừng ở countdown (2000) là hằng số trong code |
Hằng số trong code (không đưa vào config): ramp 800ms, ngưỡng lệch 3px, resume sau tab ẩn 1s, prefetch 1.5 màn, không tự tiếp tục sau khi khách tác động.

**Admin (tab Hiệu ứng, khối "Tự động cuộn"):** công tắc "Tự cuộn sau khi mở thiệp" (bật); "Tốc độ" ( Chậm )(● Vừa )( Nhanh ); công tắc "Dừng ngắn ở mỗi phần"; thanh "Bắt đầu sau" 1.5–8s. Trợ giúp: "Khách chạm, cuộn hoặc bấm phím là dừng ngay; khách bấm ▶ để tiếp tục." Nút "↻ Phát lại" phát 8 giây tự cuộn trong preview (`target:"autoscroll"`).

---

## 6. Câu hỏi cho người duyệt (kèm giả định mặc định)

1. **Bố cục phong bì mới:** tên cặp đôi đặt **ngoài** phong bì (phía trên), "Kính gửi + tên khách" in **trên mặt** phong bì. *Giả định: đồng ý.* Nếu muốn giữ tên cặp đôi trên mặt phong bì như v1 thì tên khách chuyển vào trong thẻ.
2. **6 mẫu phong thư** (`classic`, `kraft`, `song-hy`, `lace`, `minimal`, `velvet`); mẫu "Thư hàng không" để v4. *Giả định: duyệt cả 6, làm `classic` trước (sửa R01), 5 mẫu còn lại làm cùng v2 admin.*
3. **Song Hỷ, Kraft, Nhung đêm giữ màu cố định** dù theme khác (admin vẫn chọn được "Theo theme"). *Giả định: đồng ý.*
4. **Tự cuộn có tự tiếp tục không:** *Giả định: không tự tiếp tục*, chỉ có nút "Tiếp tục tự cuộn". (Phương án khác: tự tiếp tục sau 8s không tác động. Mình không khuyên vì khách đang đọc lời mời hoặc xem ảnh sẽ bị kéo đi.)
5. **Thông số tự cuộn mặc định:** 45px/s, bắt đầu sau 2.5s, chế độ `flow` dừng 1.2s ở đầu mỗi phần. *Giả định: đồng ý.*
6. **Import config cũ** (`wedding-site`: `enabled:true, speed:55, startDelayMs:650`): *Giả định:* giữ `enabled` và `speed`, kẹp `startDelayMs` lên 1500.
7. **Reduced-motion:** không tự cuộn nhưng vẫn cho khách tự bấm bật. *Giả định: đồng ý.*
8. **R03 "vùng dịu":** hạt bay qua tên/lời mời thì mờ xuống 0.3 thay vì ẩn hẳn. *Giả định: đồng ý.* Nếu muốn sạch hơn thì đổi thành loại trừ hoàn toàn như form.
