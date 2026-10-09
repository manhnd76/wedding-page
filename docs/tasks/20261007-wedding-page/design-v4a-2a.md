# Design v4a-2a: B1 reveal theo từng section + 4 gói reveal + micro-interaction còn lại

> ui-ux-designer A · 2026-10-09 · task `20261007-wedding-page`
> Bổ sung cho `design.md` (Bản sửa 5). Tham chiếu số mục `design.md` thay vì chép lại. Chỗ nào file này **sửa** một quy định trong `design.md` thì ghi rõ "thay cho design x.y"; solution-designer chốt và cập nhật `solution.md`.
> Tiến độ: `design-report-v4a-2a.md`. Mock: `assets/v4a-2a/`. Ảnh: `screenshots/v4a-2a/` (gitignore, chỉ có trên máy đã chụp; mọi kết luận đều mô tả đủ bằng chữ ở đây).

## 0. Tóm tắt

- **B1, "xen kẽ tự động" là mặc định.** Gói reveal chọn ở trang (`effects.reveal.style`, mặc định theo theme) là **gói chính**. Hệ thống tự gán cho từng section một gói trong **bộ 3 gói hài hoà** của gói chính. Chỉ **tiêu đề và ảnh** đổi kiểu, còn chữ nội dung và hoạ tiết giữ cùng nhịp. Các phần thông tin (Sự kiện, Đếm ngược, Lịch trình, Mừng cưới, Lời chúc, Xác nhận, Chân trang) luôn dùng gói chính để dễ đọc. Kết quả tất định: preview admin và khách thấy giống nhau.
- **Chọn riêng từng phần:** admin ghim một gói cho một section. Section đã ghim dùng **trọn gói** đó (cả 4 vai trò). Không có chỉnh nguyên tử theo từng section (theo Hick's Law).
- Thứ tự ưu tiên của mỗi phần tử: ghim của section > ghi đè vai trò cấp trang (nâng cao) > xen kẽ tự động / gói chính > hạ cấp theo cường độ, máy yếu, giảm chuyển động > chốt chặn theo nội dung (font script, độ dài, ô album).
- **Admin:** đặt trong màn **"Hiệu ứng"**, khối "Hiện nội dung khi cuộn", danh sách "Từng phần" thu gọn (route này tải lười nên không tăng bundle admin ban đầu). Màn "Các phần & thứ tự" chỉ hiện nhãn nhỏ cho phần đã ghim, kèm link sang "Hiệu ứng". Mỗi dòng có nút "Xem" để phát `fx:replay` `reveal:<id>`.
- **Schema:** thêm `effects.reveal.mode: "auto" | "uniform"` (mặc định `"auto"`) và `effects.reveal.sections: { [sectionId]: RevealStyle }` (mặc định `{}`). Không bump `schemaVersion`. Xem Phụ lục A.
- **4 gói + nguyên tử chưa bật:** thông số đủ để code ở §3. Có 6 chỗ sửa hoặc làm rõ so với design 5.8/5.10, quan trọng nhất là R2A-01: `mask-up` 110% làm lộ dấu (có ảnh bằng chứng).
- **10 micro còn lại:** bổ sung phần thiếu ở §4. `slide` của đếm ngược chưa có spec. `btn-shine` và `name-sparkle` theo 5.9 kéo dài hơn 5 giây (WCAG 2.2.2) nên đã rút ngắn.

## 1. Hiện trạng code và các điểm phải sửa/làm rõ so với design.md

Hiện trạng (đọc code 2026-10-09):
- `src/guest/effects/reveal.ts`: `prepareReveal(main, pack, state)` gán `data-rva` cho **mọi** `[data-rv]` theo **một** `RevealPack` của cả trang (`ctx.resolved.reveal`). `--stagger` và `--reveal-distance` đặt trên `<html>`.
- `src/shared/theme/resolve.ts`: `REVEAL_PACKS` đủ 6 gói, nhưng `capabilities.revealStyle` chỉ có `soft`, `gentle`. `revealAtom` chưa có `mask-up`, `wipe`, `blur-in`, `split-*`, `parallax-layers`.
- `fx.css` có CSS cho `fade`, `fade-up`, `zoom-in`, `slide-side`, `rise-tilt`, `photo-settle`, `svg-draw` (và `.ty-sig` wipe riêng).
- Phần tử đã đánh dấu vai trò: `.sec-head` (eyebrow = block, h2 = heading, `.sec-orn` = ornament), ảnh `framed()` = image, `.al-tile` = image, divider ornament = ornament, hero names = heading.
- Admin `routes/effects.tsx` (tải lười): chip chọn gói. Không có điều khiển vai trò nâng cao, không có toggle micro. `routes/sections.tsx` nằm trong **bundle admin ban đầu** (73.15/80 KB, frontend-report-v2.3).

| ID | Điểm | Mức | Xử lý trong file này |
|---|---|---|---|
| R2A-01 | `mask-up` theo design 5.8 dùng `translateY(110%)` và không có opacity, nên ở trạng thái ẩn **lộ phần dấu mũ/ngã** của dòng (wrapper chừa `padding-block:.3em` ở đáy). Bằng chứng: `screenshots/v4a-2a/reveal-lab.png`, ô trái trên (Chromium, 760px, DPR 2, Playfair Display 500 36px, chuỗi "ẦẪỂỖỮ Thuỳ Ngọc"; mở `assets/v4a-2a/reveal-lab.html` để tái hiện) | Cao | §3.2: `translateY(calc(100% + .55em))` + opacity. Gỡ wrapper sau khi hiện xong |
| R2A-02 | Fallback của `blur-in` không thống nhất: bảng nguyên tử 5.8 ghi "mobile luôn rơi về `fade`", bảng gói 5.8 ghi `cinematic` = "blur-in (desktop) / mask-up (mobile)", code `atomFor` ở cấp Vừa đổi thành `fade-up` | Vừa | §3.5: thống nhất fallback = `mask-up` (font script thì `wipe`) |
| R2A-03 | `wipe` chữ dùng `clip-path: inset(-.3em -.2em …)` ở **trạng thái cuối**. Nét đuôi font script có thể vượt .2em và bị cắt vĩnh viễn | Vừa | §3.3: trạng thái cuối là `clip-path: none` |
| R2A-04 | Quy tắc 4 của `split-chars` (design 5.8) đặt `padding-block:.2em` trên span `inline-block` làm **dòng cao lên** sau khi tách (CLS). Không có `overflow` thì không có gì bị cắt, nên padding là thừa | Thấp | §3.4: bỏ padding, cấm `overflow`/`clip` ở tổ tiên trong lúc chạy |
| R2A-05 | `MATRIX.scrollProgress` ở cấp Nhiều = `true` bất kể config, trái với solution 8.4 ("boolean config chỉ tắt bớt") | Thấp | §4.5: hiện khi và chỉ khi `micro.scrollProgress = true` và cấp ∈ {Vừa, Nhiều, reduced} |
| R2A-06 | Nút 0.5x (design 8.13) không áp lên reveal vì reveal là CSS transition, không đăng ký `EffectRegistry` | Thấp | §5.6: biến `--fx-slow` |
| R2A-07 | `btn-shine` (3 lần, cách 4 giây) và `name-sparkle` (mỗi 6 giây, 3 lần) chạy quá 5 giây, vi phạm WCAG 2.2.2 với nội dung tự chuyển động | Vừa | §4.1, §4.6: mỗi đợt ≤ 5 giây, tối đa 3 đợt mỗi phiên |
| R2A-08 | Không có stagger trong `.sec-head`: eyebrow, h2 và hoạ tiết hiện cùng lúc | Thấp | §3.8 |

## 2. B1: reveal theo từng section

### 2.1 Nguyên tắc
1. **Đổi giọng ở điểm nhấn, giữ nhịp ở phần đọc.** Mắt khách dừng ở tiêu đề và ảnh (NN/g: người dùng quét tiêu đề và hình trước, đọc thân bài sau). Đổi kiểu xuất hiện ở hai chỗ này đủ tạo cảm giác "mỗi phần một kiểu". Thân bài và hoạ tiết giữ một nhịp để trang không thành bộ sưu tập hiệu ứng.
2. **Phần thông tin thì trầm.** Sự kiện, đếm ngược, lịch trình, mừng cưới, lời chúc, RSVP là nơi khách cần đọc giờ, địa chỉ, số tài khoản, nhập form. Chuyển động cầu kỳ ở đây làm chậm việc đọc và dễ gây cảm giác "trang chưa xong". Các phần này luôn dùng gói chính.
3. **Hài hoà bằng bộ 3 gói.** Xen kẽ tự động chỉ dùng gói chính và 2 "gói đồng hành" có cùng tinh thần. Ví dụ Trầm Vàng trang nhã thì không bao giờ tự nhảy sang `playful` nghiêng ảnh.
4. **Tất định, không ngẫu nhiên.** Cùng config và cùng thứ tự section luôn ra cùng kết quả: preview admin đúng như khách thấy, tải lại không đổi.
5. **Ít núm vặn.** Admin có 2 quyết định: gói chính (đã có) và cách áp (xen kẽ / giống nhau). Ghim từng phần nằm trong mục thu gọn.

### 2.2 Mô hình và thứ tự ưu tiên
Với mỗi phần tử `[data-rv=<vai trò>]` nằm trong section `s` (vai trò ∈ heading, block, image, ornament):

```
A        = gói chính đã resolve (effects.reveal.style, "theme" -> ThemePreset.suggest.revealStyle, qua capabilities)
pin(s)   = effects.reveal.sections[s.id] (đã sanitize + capabilities), có thể không có
auto(s)  = gói do thuật toán 2.4 chọn (chỉ khi mode = "auto")

1. pin(s) có                 -> nguyên tử = pin(s)[vai trò]; stagger = pin(s).stagger
2. ghi đè vai trò cấp trang  -> effects.reveal[vai trò] khác null thì dùng nó (áp mọi section chưa ghim)
3. mode = "auto"             -> heading, image: auto(s)[vai trò];  block, ornament: A[vai trò]; stagger = A.stagger
   mode = "uniform"          -> A[vai trò]; stagger = A.stagger
4. Hạ cấp theo state (MATRIX.reveal: none / gentle / pack- / pack / fade200), cờ lowEnd, bước FPS (2.7)
5. Chốt chặn nội dung (2.9 + §3): font script, độ dài, ô album, ảnh lồng trong khối, giới hạn số lượng
```

- Bước 4 và 5 áp **sau cùng** và áp cho cả phần đã ghim. Admin ghim `letter` cho một phần thì ở cấp Nhẹ phần đó vẫn chỉ fade.
- **Divider** (nằm giữa 2 section, không thuộc section nào) dùng `A.ornament`.
- **Hero** là section `opening`: thuật toán tự động luôn cho `A`; admin vẫn ghim được.
- Section lưu trên DOM thuộc tính `data-rvp="<gói hiệu lực>"` (thông tin cho CSS ở §3.7 và cho test e2e). Biến `--stagger` đặt trên **section** (CSSOM qua helper `css()`, không dùng thuộc tính `style`).

### 2.3 Phân loại section (hằng số trong code, đề xuất thêm vào `SECTION_META`)

| Section | `revealTier` | `revealAffinity` (thứ tự ưu tiên, đủ 6 gói) | Lý do |
|---|---|---|---|
| hero | `opening` | (không dùng) | Thuộc chuỗi mở thiệp, luôn theo gói chính |
| couple | `expressive` | letter, playful, editorial, soft, cinematic, gentle | Tên người: hợp hiện từng chữ |
| families | `expressive` | editorial, soft, gentle, letter, cinematic, playful | Trang trọng, nhiều dòng tên |
| announcement | `expressive` | editorial, letter, cinematic, soft, gentle, playful | Văn phong thiệp in: mask-up như dòng chữ in |
| loveStory | `expressive` | playful, letter, soft, cinematic, editorial, gentle | Kể chuyện, ảnh kỷ niệm |
| album | `expressive` | editorial, playful, cinematic, soft, letter, gentle | Ảnh là chính: wipe / rise-tilt / settle |
| thankyou | `expressive` | cinematic, letter, editorial, soft, gentle, playful | Khép lại, cảm xúc |
| events, countdown, timeline, gift, guestbook, rsvp | `functional` | (không dùng) | Thông tin, form: luôn gói chính |
| footer | `functional` | (không dùng) | |

### 2.4 Thuật toán "xen kẽ tự động"

**Bộ hài hoà `HARMONY[A]`** (gói chính + 2 gói đồng hành, hằng số trong code):

| Gói chính A | Đồng hành (thứ tự không quan trọng) | Theme dùng A làm gợi ý |
|---|---|---|
| `soft` Mềm mại | `editorial`, `letter` | tram-vang, hong-phan, son-do, mau-nuoc |
| `editorial` Tạp chí | `letter`, `soft` | luc-bao, muc-giay |
| `letter` Từng chữ | `editorial`, `soft` | hoai-co |
| `gentle` Nhẹ nhàng | `soft`, `editorial` | sen-cham |
| `playful` Vui tươi | `soft`, `letter` | dat-nung, pastel-han, bien-dao |
| `cinematic` Điện ảnh | `editorial`, `letter` | dem-nhung |

Lý do: `playful` (nghiêng ảnh, nảy) chỉ đi với gói nền vui; `cinematic` (chậm, mờ) chỉ làm gói nền cho theme tối sang trọng. `editorial` và `letter` là hai "giọng" chữ trang nhã, hợp với hầu hết gói. Gói đồng hành chưa có trong `capabilities` thì loại khỏi bộ (bản thiếu gói vẫn chạy được).

**Thủ tục** (thuần, nhận `PlannedSection[]` sau lọc của `planSections` + A + pins; đề xuất `src/shared/reveal-plan.ts`, guest và admin dùng chung):
```
H = [A, ...HARMONY[A]].filter(supported)
prevExpressive = null                     // gói của section expressive gần nhất (kể cả section đã ghim)
for s in visibleSections (theo thứ tự hiển thị):
  if pin(s):                       pack = pin(s);  src = "pinned"
  else if tier(s) != "expressive": pack = A;       src = "main"
  else:
    cands = AFFINITY[s.type].filter(p => H.includes(p))       // giữ thứ tự ưu tiên
    pack  = cands.find(p => p != prevExpressive) ?? A;  src = "auto"
  if tier(s) == "expressive": prevExpressive = pack
  out[s.id] = { pack, src }
```
- **Không bao giờ có 2 phần expressive liền nhau (bỏ qua các phần functional ở giữa) dùng cùng gói.** Phần functional coi như trung tính, không tính vào phép so sánh.
- Kết quả phụ thuộc thứ tự và bật/tắt section. Admin kéo đổi thứ tự thì nhãn "Từng phần" cập nhật ngay.
- Gói của `auto` chỉ quyết định **heading + image** (2.2 bước 3). Block/ornament theo A.

**Ví dụ (thứ tự mặc định, loveStory tắt):**

| Section | Trầm Vàng (A = soft) | Đêm Nhung (A = cinematic) | Đất Nung (A = playful) | Sen Chàm (A = gentle) |
|---|---|---|---|---|
| hero | soft | cinematic | playful | gentle |
| couple | **letter** | **letter** | **letter** | **editorial** |
| families | **editorial** | **editorial** | **soft** | **soft** |
| announcement | **letter** | **letter** | **letter** | **editorial** |
| events · countdown · timeline | soft | cinematic | playful | gentle |
| album | **editorial** | **editorial** | **playful** | **soft** |
| gift · guestbook · rsvp | soft | cinematic | playful | gentle |
| thankyou | **letter** (script → wipe) | **cinematic** | **letter** (script → wipe) | **editorial** (script → wipe) |
| footer | soft | cinematic | playful | gentle |

Ở Trầm Vàng mặc định: tiêu đề "Cô Dâu & Chú Rể" hiện từng chữ, "Hai bên gia đình" trồi lên theo dòng (mask-up), ảnh gia đình quét ngang (wipe), album quét lần lượt từng ô, lời cảm ơn viết ra (wipe). Các phần thông tin vẫn trồi nhẹ (fade-up).

### 2.5 Áp lên phần tử: quy tắc trong một section
- Hai chuyển động dịch vị trí **không lồng nhau**: ảnh (`image`) nằm trong một khối (`block`) cũng có reveal (vd `.person` chứa `.person-photo`) chỉ được dùng nguyên tử "bên trong" (`photo-settle`, `wipe`, `fade`). Nguyên tử dịch chính phần tử (`zoom-in`, `rise-tilt`, `slide-side`) ở ảnh lồng nhau thì đổi thành `photo-settle`.
- **Ô album** (`.al-tile`): `wipe` dùng bản "ô" (§3.3: 450ms, stagger 150ms, đảm bảo ≤ 3 ô cùng lúc). `rise-tilt` nghiêng xen kẽ ô lẻ/chẵn (§3.7). `blur-in`/`split-*` không áp cho ảnh.
- **Ở cấp Nhiều**, cặp cột đối xứng (`.person` ×2, `.fam-col` ×2) có block `fade`/`fade-up` thì đổi thành `slide-side` (design 5.3 "biến thể trái/phải").
- **Hero:** heading là tên cặp đôi (thường font script) nên `letter`/`editorial`/`cinematic` đều về `wipe` (2.9).

### 2.6 Mặc định
| Field | Mặc định | Lý do |
|---|---|---|
| `effects.reveal.style` | `"theme"` (giữ nguyên) | |
| `effects.reveal.mode` | **`"auto"`** | Đúng mong muốn B1 ("không đơn điệu") ngay khi tạo thiệp, không bắt cô dâu chú rể phải tìm. Bộ hài hoà giữ trang nhã |
| `effects.reveal.sections` | `{}` | |

Config cũ không có `mode` thì merge thành `"auto"`, nên config cũ sẽ đổi hành vi (không còn đồng nhất). Hiện chưa có config nào được publish (decisions 2026-10-08) nên chấp nhận được. Xem câu hỏi Q1.

### 2.7 Tương tác với cường độ, reduced-motion, máy yếu

| Tình huống | Gói chính | Xen kẽ tự động | Phần đã ghim |
|---|---|---|---|
| Tắt (`off`) | hiện ngay | không tác dụng | không tác dụng |
| Nhẹ (`low`) | mọi gói về `gentle` (5.10) | **không tác dụng** (mọi phần giống nhau) | về `gentle` |
| Vừa (`medium`) | `pack-` (bỏ `blur-in`, `parallax-layers`) | có | có (`pack-`) |
| Nhiều (`high`) | đầy đủ | có | có |
| `prefers-reduced-motion` | fade ≤ 200ms, không tách chữ, không dịch | không tác dụng | không tác dụng |
| Máy yếu (`lowEnd`: cấp hạ 1 bậc, 5.5) | theo cấp sau khi hạ | có nếu cấp sau khi hạ ≥ Vừa | như trên |
| … và thêm khi `lowEnd` | `split-chars` → `split-words`; `wipe` ô album → `photo-settle`; `wipe` khác giới hạn 2 cùng lúc | | |
| FPS < 45, bước mới **`revealLite`** (thêm **cuối** `DEGRADE_ORDER`, sau `photoTilt`) | Phần tử **chưa hiện**: `split-*`, `wipe`, `mask-up`, `blur-in` → `fade-up`. Phần tử đã hiện giữ nguyên | | |
| Khách bấm "Bật hiệu ứng" khi máy giảm chuyển động (5.4) | theo cấp đã chọn (bỏ nhánh reduced), plan không đổi | | |

Admin hiện ghi chú khi cường độ là Nhẹ/Tắt: "Ở cấp Nhẹ, mọi phần hiện bằng mờ dần; xen kẽ và chọn riêng chỉ thấy từ cấp Vừa." (§5.2).

### 2.8 Ngân sách hiệu năng và JS
| Hạng mục | Ngân sách (gzip) | Ghi chú |
|---|---|---|
| Entry guest thêm: `reveal-plan` + engine reveal mới (gán theo section, hàng đợi wipe, mask-up tách dòng, replay) | **≤ +2.5 KB** | JS ban đầu hiện 31.22/60 KB. `mask-up` nằm trong entry vì là gói của 2 theme (luc-bao, muc-giay) và xuất hiện trong xen kẽ của 9/12 theme |
| Chunk lười `reveal-split` (`split-words` + `split-chars`, Segmenter + fallback regex) | ≤ 3 KB (trần chung 15 KB) | Import ngay trong `prepareReveal` khi plan có ít nhất một heading dùng split, tức là lúc cover đang hiện, xong trước khi khách chạm mở. Chưa tải xong khi phần tử vào màn thì phần tử đó dùng `fade-up` |
| Chunk lười `parallax-layers` | ≤ 1.5 KB | Chỉ khi state = `high` và hero/thankyou có gói `cinematic` |
| CSS ban đầu thêm (reveal mới + micro §4) | ≤ +3 KB | Hiện 11.01/25 KB |
| Admin route `effects` (lười) thêm | ≤ +2.5 KB | Hiện 5.55/15 KB |
| Admin bundle ban đầu (`sections.tsx`) thêm | ≤ +0.4 KB | Chỉ nhãn ghim + link (§5.4). **Không** import `reveal-plan` vào route này |

Runtime: không thêm vòng rAF thường trực (trừ `parallax-layers` ở cấp Nhiều, gộp chung listener cuộn với parallax hiện có). `will-change` chỉ đặt trong lúc chạy (thêm khi `is-in`, gỡ ở `transitionend`) và ≤ 6 phần tử cùng lúc (5.5). Không tạo lại span khi cuộn. `IntersectionObserver` giữ `threshold .15`, `rootMargin "0px 0px -10% 0px"` (4.0).

### 2.9 Tiếng Việt: chốt chặn bắt buộc
- Không clip chữ có dấu ở **trạng thái cuối**. Mọi `overflow: clip` / `clip-path` dùng trong lúc chạy đều phải bị **gỡ** khi xong (mask-up gỡ wrapper, wipe về `clip-path: none`).
- Trong lúc chạy, vùng clip theo chiều dọc luôn chừa ≥ **.3em** trên và dưới so với hộp dòng (biên an toàn ±0.3em của backlog B1).
- Heading font script (`.h2-script`, `.hero-names`, chữ ký): `split-chars`, `split-words`, `mask-up` đều đổi thành **`wipe`**, vì tách span làm đứt nét nối và mask theo dòng cắt đuôi chữ. `blur-in` vẫn dùng được cho script.
- Tách chữ: NFC + `Intl.Segmenter('vi', {granularity:'grapheme'})`, fallback `/\P{M}\p{M}*/gu` (design 5.8 quy tắc 1–3, 6). Chuỗi kiểm thử bắt buộc: `Nguyễn Thuỳ Linh · Đặng Hữu Phước · Hường · Quỳnh · Ngọc Ẩn · ẦẪỂỖỮ` (solution 9.3).
- Đo dòng cho `mask-up` chỉ sau `document.fonts.ready` (đổi font sau khi tách dòng sẽ làm sai chỗ ngắt dòng).
