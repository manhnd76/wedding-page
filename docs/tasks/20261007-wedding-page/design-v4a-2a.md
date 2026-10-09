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

## 3. Bốn gói còn lại và các kiểu nguyên tử chưa bật

Phần này bổ sung cho design 5.8 (bảng nguyên tử + bảng gói) và 5.10 (ma trận). Mục nào design 5.8 đã đủ thì không nhắc lại.

### 3.1 Bảng thông số nguyên tử (đủ để code)

`--rv-k` = hệ số thời lượng của gói (§3.7). `--fx-slow` = 2 khi preview bật 0.5x, ngược lại 1 (§5.6). Mọi thời lượng trong CSS nhân với `var(--rv-k,1) * var(--fx-slow,1)`.

| Nguyên tử | Áp cho | Trạng thái ẩn → hiện | Thời lượng / easing (Vừa) | Nhiều | Chốt chặn |
|---|---|---|---|---|---|
| `mask-up` | heading không phải script | từng **dòng** `translateY(calc(100% + .55em))`, opacity 0 → 0, 1 | transform 800ms `--ease-out`, opacity 400ms linear, stagger dòng 90ms (dòng thứ 5 trở đi dùng chung độ trễ của dòng 4) | 900ms | §3.2 |
| `wipe` (chữ) | heading script, chữ ký | `clip-path: inset(-.5em calc(100% + .25em) -.5em -.25em)` → `inset(-.5em -.25em -.5em -.25em)` → **`none`** khi xong | 900ms `cubic-bezier(.55,.1,.35,1)` | như Vừa | §3.3 |
| `wipe` (ảnh) | `<img>` **bên trong** `.frame` | `img{clip-path: inset(0 100% 0 0); transform: scale(1.06)}` → `inset(0)`, `scale(1)` → `none` | 900ms (clip), 1100ms `--ease-out` (scale) | như Vừa | Khung (viền, bóng, `deco-cut`, mask) **không** bị clip |
| `wipe` (ô album) | `<img>` trong `.al-tile` | như ảnh, không scale | **450ms**, stagger **150ms** (thay stagger gói) → tự nhiên ≤ 3 ô cùng lúc | như Vừa | `lowEnd` → `photo-settle` |
| `split-words` | heading ≤ 20 từ | từng từ `translateY(12px)`, opacity 0 → 0, 1 | 500ms `--ease-out`, stagger `min(40, 400/(n-1))` ms, tổng ≤ 900ms | 16px, `--ease-pop` | > 20 từ → `fade-up`; script → `wipe` |
| `split-chars` | heading ≤ 40 grapheme (không đếm khoảng trắng) | từng ký tự `translateY(.4em) rotate(8deg)`, opacity 0 → 0, 1; `transform-origin: 50% 100%` | transform 450ms `--ease-out`, opacity 300ms, stagger `min(28, 450/(n-1))` ms, tổng ≤ 900ms | như Vừa | > 40 → `split-words`; script → `wipe`; `lowEnd` → `split-words` |
| `blur-in` | heading, chỉ `high` + viewport ≥ 1024px, tối đa 3 phần tử/trang | `filter: blur(8px)`, opacity 0 → `blur(0)`, 1 → `filter: none` | (không có ở Vừa) | 600ms `--ease-out` | Phần tử thứ 4+ / mobile / Vừa → `mask-up` (script → `wipe`). Thay cho design 5.8 "mobile rơi về fade" (R2A-02) |
| `parallax-layers` | section có ảnh nền (hero, thankyou) | liên tục theo cuộn | (không có ở Vừa → `photo-settle`) | §3.6 | |
| `rise-tilt` | ảnh, ô album, thẻ lời chúc | `translateY(32px) rotate(-4deg)` (ô album chẵn `rotate(4deg)`), opacity 0 → `transform: none` | 700ms `--ease-pop` | như Vừa | Độ nghiêng cuối của polaroid nằm ở thuộc tính `rotate` (class `tilt-r`, v4a-1), không nằm trong `transform` nên không bị xoá |
| `zoom-in` | ảnh, khối, "&" | `scale(.94)`, opacity 0 → `none` | 600ms `--ease-out` (gói `playful`: `--ease-pop`) | như Vừa | Ảnh lồng trong khối có reveal → `photo-settle` (2.5) |
| `photo-settle` | ảnh | (đã có) | 1100ms; gói `cinematic`: 1400ms + `scale(1.15)` | | |

### 3.2 `mask-up` chi tiết (sửa R2A-01)
1. **Chuẩn bị đúng lúc.** Khi `landing-wait` gỡ xong (sau mở thiệp), một `IntersectionObserver` chuẩn bị riêng (`rootMargin: "0px 0px 100% 0px"`, tức 1 màn hình phía trước) chờ `document.fonts.ready` rồi tách dòng. Trước khi tách xong, heading `opacity: 0` (như `fade`). Nếu heading vào vùng reveal mà chưa tách xong (font chậm) thì đổi ngay `data-rva` thành `fade-up` cho phần tử đó, không bao giờ để chữ chờ.
2. **Tách dòng:** bọc từng từ (tách theo khoảng trắng trên text node; phần tử con inline như `<span lang="en">` coi là một khối) trong `span.rv-w` inline, đọc `offsetTop`, gom theo dòng. Dựng lại thành `span.rv-ln > span.rv-li` (cả hai `display:block`), mỗi dòng gán `--ln` (0, 1, 2…) bằng CSSOM. Chuỗi gốc giữ trong `<span class="sr-only">`, phần hiển thị bọc `<span class="rv-vis" aria-hidden="true">` (giống quy tắc 6 của split-chars) để trình đọc màn hình đọc liền một câu. Bỏ qua con `.sr-only`/`[aria-hidden]` khi đo.
3. **Wrapper dòng:** `.rv-ln{display:block; overflow:clip; padding-block:.3em; margin-block:-.3em}`. Trạng thái ẩn `.rv-li{transform: translateY(calc(100% + .55em)); opacity:0}`. Tính toán: dấu chồng cao khoảng .2em trên hộp dòng, đáy clip ở `100% + .3em`, nên cần dịch ≥ `100% + .5em`; chọn `.55em` cho dư, thêm opacity để chắc chắn. Ảnh: `screenshots/v4a-2a/reveal-lab.png` ô (A) lộ dấu, ô (B) sạch.
4. **Gỡ wrapper khi xong:** sau `transitionend` (transform) của dòng cuối, hoặc hẹn giờ dự phòng = độ trễ + thời lượng + 100ms, khôi phục nội dung gốc (bỏ `rv-vis`/`sr-only`) và gắn `rv-done`. Lý do: ô "trạng thái CUỐI" trong ảnh lab cho thấy dấu `Ầ` của Playfair 36px chạm sát mép clip .3em; giữ wrapper lâu dài là rủi ro với font khác và khi khách phóng chữ 200%.
5. **Resize trước khi hiện:** `ResizeObserver` trên heading, chiều rộng đổi > 1px thì tách lại (debounce 150ms). Sau khi hiện thì không cần vì nội dung đã khôi phục.
6. Không đổi bố cục: `.rv-ln` có `margin-block` âm bù đúng `padding-block`, nên chiều cao heading trước và sau khi tách bằng nhau (CLS = 0). `text-align` kế thừa (heading căn giữa).

### 3.3 `wipe` chi tiết (sửa R2A-03)
- **Chữ:** biên dọc `-.5em` (font script có nét lên/xuống vượt hộp dòng nhiều hơn chữ serif; vẫn ≥ .3em theo 2.9), biên ngang `-.25em`. Khi xong gắn `rv-done` → `clip-path: none; transition: none`.
- **Ảnh:** clip trên `<img>` bên trong khung, không trên `.frame`. Lý do: các khung v4a-1 dùng `box-shadow` vẽ viền ngoài (`arch-double`, `rect-offset`, `oval`), `clip-path` (`deco-cut`) hoặc `mask` (`stamp`, `scallop`, `wash-mask`). Clip trên khung sẽ đè `clip-path` của `deco-cut` và cắt mất viền. Clip trên ảnh thì khung và màu nền `--ph` hiện sẵn, ảnh "tráng" dần lên trên.
- **Giới hạn cùng lúc:** ≤ 3 (máy yếu ≤ 2). Engine giữ bộ đếm. Phần tử vượt giới hạn chờ trong hàng đợi tối đa 600ms, quá thì dùng `fade`. Với ô album (450ms / stagger 150ms) gần như không bao giờ phải chờ.
- Chữ ký `.ty-sig` hiện đang dùng `svg-draw` + clip-path (fx.css): đổi trạng thái cuối thành `clip-path: none` theo cùng quy tắc.

### 3.4 `split-words` / `split-chars` (bổ sung design 5.8, sửa R2A-04)
- Chunk lười `reveal-split` (2.8). Tách lúc `prepareReveal` (không cần đo layout nên làm được khi landing còn `display:none`).
- Cấu trúc: `<h2><span class="sr-only">Chuỗi gốc</span><span class="rv-vis" aria-hidden="true"><span class="rv-w">…</span> <span class="rv-w">…</span></span></h2>`. Khoảng trắng giữa các từ để là text node thường (để xuống dòng tự nhiên). `split-chars` có thêm `span.rv-c` trong `rv-w`.
- `.rv-w{display:inline-block; white-space:nowrap}`, `.rv-c{display:inline-block}`. **Không** `padding-block` (thay quy tắc 4 của design 5.8). Không có `overflow`/`clip-path` trên span hoặc tổ tiên gần (`.sec-head`, `.sec-in`). `.sec-hero`/`.sec-thankyou` có `overflow:hidden` nhưng heading cách mép xa hơn .4em, chấp nhận được.
- Độ trễ từng mảnh: `delay(phần tử) + k * stagger_trong` (k = chỉ số từ/ký tự, CSSOM `--k`).
- Khi xong (mảnh cuối `transitionend` hoặc hẹn giờ dự phòng) **khôi phục chuỗi gốc** như 3.2 bước 4, để trả lại kerning, cách chọn chữ và tự xuống dòng khi phóng to.
- Chuỗi rỗng hoặc chỉ có ký hiệu: không tách, dùng `fade-up`.

### 3.5 `blur-in` (sửa R2A-02)
Chỉ khi: state `high`, `matchMedia('(min-width: 1024px)')` lúc chuẩn bị, chưa vượt 3 phần tử trên trang (đếm theo thứ tự DOM, chỉ đếm phần tử thực sự nhận `blur-in`), không `lowEnd`. Mọi trường hợp khác dùng `mask-up` (heading script dùng `wipe`), kể cả ở cấp Vừa (code hiện đổi thành `fade-up`, cần sửa). Trong lúc chạy đặt `will-change: filter, opacity`. Khi xong `filter: none` và gỡ `will-change`.

### 3.6 `parallax-layers`
- Bật khi: section có ảnh nền (`hero`, `thankyou`) **và** gói hiệu lực của section có `image ∈ {cinematic→photo-settle+parallax, ghi đè image = parallax-layers}` **và** state `high` **và** `effects.parallax = true` **và** chưa có `.fx-no-parallax` (bước FPS `parallaxLayers`).
- 3 lớp: L0 = lớp nền (texture/hoạ tiết B2 phía sau, `.sec::before` / lớp motif) hệ số `-0.05`; L1 = ảnh nền, hệ số `0.15` (**dùng lại** parallax hiện có ở `setupParallax`, không viết thêm); L2 = hoạ tiết phía trước (motif `corners`/`hero` của B2, ornament trong hero) hệ số `0.3`. Lớp nào không có phần tử thì bỏ qua (có thể chỉ còn L1, giống hiện nay).
- Dịch = `-(rect.top) * hệ số`, kẹp ±80px, ghi bằng thuộc tính `translate` (CSSOM). Dùng chung một listener cuộn passive + rAF với `setupParallax`, chỉ tính section đang trong viewport.

### 3.7 Bốn gói: bảng theo cấp

| Gói (`data-rvp`, `--rv-k`) | Vai trò | Vừa ★ | Nhiều | Nhẹ | reduced |
|---|---|---|---|---|---|
| `editorial` Tạp chí (k = 1) | heading | `mask-up` (script → `wipe`) | `mask-up` 900ms | `fade` | `fade-fast` |
| | block | `fade` 600ms | `fade`; cặp cột → `slide-side` | `fade` | `fade-fast` |
| | image | `wipe` (ô album: bản ô) | như Vừa | `fade` | `fade-fast` |
| | ornament | `svg-draw` | `svg-draw` | `svg-draw` | hiện nét |
| | stagger | 90ms | 90ms | 60ms (gentle) | 0 |
| `letter` Từng chữ (k = 1) | heading | `split-chars` (script → `wipe`; > 40 → `split-words`; `lowEnd` → `split-words`) | như Vừa | `fade` | `fade-fast` |
| | block | `fade` | `fade`; cặp cột → `slide-side` | `fade` | |
| | image | `zoom-in` (lồng → `photo-settle`) | như Vừa | `fade` | |
| | ornament / stagger | `svg-draw` / 60ms | | | |
| `playful` Vui tươi (k = 1) | heading | `split-words` 12px `--ease-out` | `split-words` 16px `--ease-pop` | `fade` | |
| | block | `zoom-in` `scale(.94)` `--ease-pop` | như Vừa | `fade` | |
| | image | `rise-tilt` (ô album lẻ −4°, chẵn +4°; lồng → `photo-settle`) | như Vừa | `fade` | |
| | ornament / stagger | `svg-draw` / 100ms | | | |
| `cinematic` Điện ảnh (k = **1.25**) | heading | `mask-up` (script → `wipe`) | `blur-in` (≥ 1024px, ≤ 3/trang) còn lại `mask-up`/`wipe` | `fade` | |
| | block | `fade-up` (875ms) | `fade-up` 32px | `fade` | |
| | image | `photo-settle` 1400ms `scale(1.15)` | + `parallax-layers` ở hero/thankyou | `fade` | |
| | ornament / stagger | `svg-draw` 1800ms / 120ms | | | |

`soft` và `gentle` giữ nguyên design 5.8. Cột "Nhẹ" là `gentle` (5.10). Với `--rv-k`, `svg-draw` của cinematic = 1500ms × 1.25 ≈ 1.9s, kẹp 1800ms.

### 3.8 Nhịp trong một section (sửa R2A-08)
- `.sec-head`: eyebrow `--i:0`, h2 `--i:1`, `.sec-orn` `--i:2`. Hoạ tiết bắt đầu vẽ khi tiêu đề đã lên được một nửa. Đặt bằng CSS `:nth-child` hoặc class, không cần JS.
- Thân section giữ quy tắc `--i` hiện có trong `fx.css` (hero, timeline, events, families, album). `--i` tối đa 8 (`min(var(--i), 8)`, design 5.2 "tối đa 9 phần tử stagger").
- Độ trễ bên trong heading (dòng/từ/ký tự) cộng sau độ trễ của phần tử. Tổng thời gian một section (từ phần tử đầu tới khi phần tử cuối xong, cùng một lần vào màn) ≤ 1.8s ở Vừa, ≤ 2.2s với `cinematic`.

### 3.9 Khung CSS tham khảo (FE điều chỉnh; không dùng thuộc tính `style`, biến đặt bằng CSSOM)
```css
[data-rva] {
  --rv-t: calc(var(--rv-d, 700ms) * var(--rv-k, 1) * var(--fx-slow, 1));
  transition: opacity var(--rv-t) var(--ease-out), transform var(--rv-t) var(--ease-out);
  transition-delay: calc(min(var(--i, 0), 8) * var(--stagger) * var(--fx-slow, 1));
}
.sec[data-rvp="cinematic"] { --rv-k: 1.25; }
.sec[data-rvp="playful"] [data-rva="zoom-in"] { transition-timing-function: var(--ease-pop); }

/* mask-up */
[data-rva="mask-up"] { transition: opacity 0s; }
[data-rva="mask-up"]:not(.rv-ready):not(.is-in) { opacity: 0; }
.rv-ln { display: block; overflow: clip; padding-block: .3em; margin-block: -.3em; }
.rv-li { display: block;
  transition: transform calc(800ms * var(--rv-k, 1) * var(--fx-slow, 1)) var(--ease-out),
              opacity calc(400ms * var(--fx-slow, 1)) linear;
  transition-delay: calc((min(var(--i, 0), 8) * var(--stagger) + min(var(--ln, 0), 3) * 90ms) * var(--fx-slow, 1)); }
[data-rva="mask-up"]:not(.is-in) .rv-li { transform: translateY(calc(100% + .55em)); opacity: 0; }
[data-fx="high"] .rv-li { transition-duration: calc(900ms * var(--rv-k, 1) * var(--fx-slow, 1)), calc(400ms * var(--fx-slow, 1)); }

/* wipe: chữ */
[data-rva="wipe"] { clip-path: inset(-.5em -.25em -.5em -.25em);
  transition: clip-path calc(900ms * var(--rv-k, 1) * var(--fx-slow, 1)) cubic-bezier(.55, .1, .35, 1); }
[data-rva="wipe"]:not(.is-in) { clip-path: inset(-.5em calc(100% + .25em) -.5em -.25em); }
/* wipe: ảnh trong khung / ô album (clip trên img, khung giữ nguyên) */
/* chỉ tắt transition-property (giữ transition-delay để img kế thừa độ trễ stagger) */
.frame[data-rva="wipe"], .al-tile[data-rva="wipe"] { clip-path: none; transition-property: none; }
.frame[data-rva="wipe"] img, .al-tile[data-rva="wipe"] img { clip-path: inset(0);
  transition: clip-path calc(900ms * var(--fx-slow, 1)) cubic-bezier(.55, .1, .35, 1), transform calc(1100ms * var(--fx-slow, 1)) var(--ease-out);
  transition-delay: inherit; }
.frame[data-rva="wipe"]:not(.is-in) img { clip-path: inset(0 100% 0 0); transform: scale(1.06); }
.al-tile[data-rva="wipe"] img { transition-duration: calc(450ms * var(--fx-slow, 1)); }
.al-tile[data-rva="wipe"] { transition-delay: calc(min(var(--i, 0), 8) * 150ms * var(--fx-slow, 1)); }
.al-tile[data-rva="wipe"]:not(.is-in) img { clip-path: inset(0 100% 0 0); }
[data-rva="wipe"].rv-done, [data-rva="wipe"].rv-done img { clip-path: none; transition: none; }

/* split */
.rv-w { display: inline-block; white-space: nowrap; }
.rv-c { display: inline-block; transform-origin: 50% 100%; }
[data-rva="split-words"], [data-rva="split-chars"] { transition: none; }
[data-rva="split-words"] .rv-w, [data-rva="split-chars"] .rv-c {
  transition: transform calc(var(--rv-pd) * var(--fx-slow, 1)) var(--ease-out), opacity calc(300ms * var(--fx-slow, 1)) linear;
  transition-delay: calc((min(var(--i, 0), 8) * var(--stagger) + var(--k, 0) * var(--rv-ps)) * var(--fx-slow, 1)); }
[data-rva="split-words"] { --rv-pd: 500ms; }  /* --rv-ps (stagger trong) đặt bằng CSSOM theo công thức 3.1 */
[data-rva="split-chars"] { --rv-pd: 450ms; }
[data-rva="split-words"]:not(.is-in) .rv-w { transform: translateY(12px); opacity: 0; }
[data-fx="high"] [data-rva="split-words"] .rv-w { transition-timing-function: var(--ease-pop), linear; }
[data-fx="high"] [data-rva="split-words"]:not(.is-in) .rv-w { transform: translateY(16px); }
[data-rva="split-chars"]:not(.is-in) .rv-c { transform: translateY(.4em) rotate(8deg); opacity: 0; }

/* blur-in */
[data-rva="blur-in"] { transition: filter calc(600ms * var(--fx-slow, 1)) var(--ease-out), opacity calc(600ms * var(--fx-slow, 1)) var(--ease-out); }
[data-rva="blur-in"]:not(.is-in) { filter: blur(8px); opacity: 0; }
[data-rva="blur-in"].rv-done { filter: none; }

/* rise-tilt ô album xen kẽ */
.al-tile:nth-child(even)[data-rva="rise-tilt"]:not(.is-in) { transform: translateY(32px) rotate(4deg); }

/* replay (5.6): tắt transition để về trạng thái ẩn tức thì */
.rv-replay [data-rva], .rv-replay [data-rva] * { transition: none !important; }
```
Reduced-motion giữ khối `@media (prefers-reduced-motion: reduce)` của design 5.4. Engine cũng không tách chữ (MATRIX.split = false) và không tách dòng ở state `reduced`.

## 4. Micro-interaction còn lại (bổ sung design 5.9 / 5.10)

Quy tắc chung cho mọi hiệu ứng **tự chạy** (không do khách bấm) thuộc nhóm `attention` (`MATRIX.attention`: chỉ Vừa/Nhiều): **mỗi đợt ≤ 5 giây** (WCAG 2.2.2), **tối đa 3 đợt mỗi phiên** cho mỗi phần tử. Đợt mới chỉ được chạy khi phần tử rời viewport rồi vào lại sau ≥ 20 giây. Không chạy khi `fxBlocked()` (tab ẩn, sheet/lightbox mở, đang gõ). Hiệu ứng **do khách bấm** đi theo dòng `press` (Nhẹ trở lên; reduced chỉ đổi màu/opacity). Mọi phần tử trang trí thêm vào DOM đều `aria-hidden="true"` và `pointer-events:none`.

| Mã | Spec trong 5.9 | Phần thiếu / sửa | Config | Dòng MATRIX |
|---|---|---|---|---|
| `btn-shine` | thiếu | §4.1 (sửa R2A-07) | `micro.buttonShine` | `attention` |
| `photo-tilt` | gần đủ | §4.2 (xung đột `::after` của khung, reveal) | `micro.photoTilt` | `photoTilt` |
| `countdown-odometer` | thiếu cấu trúc | §4.3 | `countdown.style = odometer` | `countdown` |
| `slide` (đếm ngược) | **chưa có** | §4.4 | `countdown.style = slide` | `countdown` |
| `scroll-progress` | gần đủ | §4.5 (sửa R2A-05) | `micro.scrollProgress` | `scrollProgress` |
| `name-sparkle` | thiếu | §4.6 (sửa R2A-07) | không (theo cấp) | `attention` |
| `music-ripple` | thiếu | §4.7 | không | `attention` |
| `gift-shake` | thiếu | §4.8 | không | `attention` |
| `calendar-flip` | sai kỹ thuật | §4.9 (SVG không làm 3D ổn định → lật giả bằng `scaleY`) | không | `press` |
| `couple-heart-tap` | thiếu | §4.10 | `micro.coupleHeartTap` | `press` |

### 4.1 `btn-shine`: vệt sáng lướt trên CTA
- **Nút áp:** `.gift-btn` ("Gửi quà mừng cưới"), nút gửi RSVP (`.rsvp-card [type=submit]`), nút gửi lời chúc (`.gb-form [type=submit]`), và `.cv-cta` (cover, xem dưới). Không áp cho `.btn-outline`.
- **Hình:** `::after` của `.btn` (nút đã có `overflow:hidden; position:relative`). `inset:0; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.42) 50%, transparent 70%)`. Ẩn bằng `transform: translateX(-110%)`, chạy tới `translateX(110%)`. Keyframe 900ms `--ease-inout`. Theme tối hoặc nút sáng màu (`pastel-han`): độ mờ .55.
- **Lịch chạy (thay design 5.9 "3 lần cách 4s"):** khi nút hiện ≥ 60% trong viewport (IO `threshold .6`) được 400ms thì chạy 2 lần: t = 0.4s và t = 2.9s, xong ở 3.8s (≤ 5s). Tối đa 3 đợt mỗi phiên (quy tắc chung). Desktop: hover/focus-visible chạy 1 lần ngay, cách nhau ≥ 2s.
- **Cover CTA:** đã có `cta-breathe` (2 chu kỳ 2s). Chỉ thêm **1** vệt sáng ở t = 1.2s, cùng nằm trong 5 giây đầu. Không chạy lặp ở cover.
- Không chạy khi nút `disabled` hoặc `aria-busy`.

### 4.2 `photo-tilt`: ảnh nghiêng theo con trỏ (chỉ `(hover:hover) and (pointer:fine)`)
- **Phần tử:** `.person-photo`, `.frame--polaroid`, `.al-tile`. Tối đa 6° với ảnh đơn, **4°** với ô album (lưới nhiều ô, nghiêng mạnh sẽ rối).
- **Tải lười:** chunk `photo-tilt` (≤ 2 KB) import ở `pointerenter` đầu tiên lên một phần tử ứng viên. Chưa tải xong thì bỏ qua lần hover đó.
- **Không tranh chấp với reveal:** chỉ gắn khi phần tử đã `is-in` và đã chạy xong (`rv-done` hoặc sau `transitionend`). Tilt ghi `transform: perspective(800px) rotateX(..) rotateY(..)` bằng CSSOM. Độ nghiêng cố định của polaroid nằm ở thuộc tính `rotate` nên cộng dồn đúng, không mất.
- **Lớp bóng loáng:** thêm `span.tilt-glare` (không dùng `::after` vì `.frame--arch-double::after` đã dùng để vẽ viền trong). `radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,.22), transparent 55%)`, `mix-blend-mode: soft-light`, opacity 0 → 1 trong 160ms khi vào.
- **Chuyển động:** lerp .12 mỗi frame (design 5.9). Rời chuột thì về 0 trong 400ms `--ease-out` (transition, dừng rAF). Bấm vào ô album (mở lightbox) thì reset ngay. `focus-visible` bằng bàn phím: không nghiêng.
- Bước FPS `photoTilt` (5.10) gỡ listener và reset.

### 4.3 `countdown-odometer`: "Đồng hồ cơ"
- **Cấu trúc mỗi ô số:** `.cd-v` chứa N cửa sổ chữ số `.od-win` (N = số chữ số của giá trị: ngày có thể 3 chữ số, giờ/phút/giây 2). `.od-win{display:inline-block; height:1em; overflow:hidden; line-height:1}`. Trong mỗi cửa sổ có một dải `.od-strip` gồm 11 ô theo thứ tự trên → dưới `9* 0 1 2 3 4 5 6 7 8 9`. Ô `9*` là bản sao để quay vòng. Chỉ có chữ số (không có dấu) nên clip ở đây an toàn. Giá trị đọc cho trình đọc màn hình giữ như hiện tại (lưới `aria-hidden`, dòng `aria-live` cập nhật mỗi phút).
- **Hiện chữ số d:** `translateY(calc(-1em * (d + 1)))`.
- **Đếm lùi (chiều chính):** d → d−1: dải trượt **xuống**, chữ số mới vào từ trên như công-tơ quay ngược. Dịch từ `-(d+1)em` về `-d em`, 450ms `--ease-inout` (5.9). Quay vòng 0 → 9: dịch từ `-1em` về `0` (ô `9*`), xong thì gán tức thì `-10em` (ô 9 thật, `transition:none` trong 1 frame).
- **Chữ số nào đổi thì chỉ cửa sổ đó chạy.** Hàng chục và đơn vị cùng đổi (10 → 09) thì chạy cùng lúc, hàng chục trễ 60ms cho có cảm giác cơ khí.
- **Giây:** ở Vừa, cột giây chỉ crossfade 200ms (đồng bộ với `flip` hiện tại đang loại trừ giây, tránh chuyển động liên tục). Ở Nhiều thì cột giây cũng quay, 300ms.
- Số chữ số giảm (100 → 99 ngày): cửa sổ đầu mờ dần 300ms rồi bỏ, lưới không giật vì ô có kích thước cố định. Nhẹ: crossfade 200ms. Tắt/reduced: đổi tức thì.
- Chunk lười `odometer` (≤ 2 KB, solution 9.1 đã liệt kê). `tabular-nums` giữ nguyên.

### 4.4 `slide`: "Trượt số" (chưa có spec)
- Khác odometer: trượt **cả giá trị của ô** (vd "07" → "06") thay vì từng chữ số. Kỹ thuật nhẹ, không cần chunk riêng (nằm trong `countdown.ts`).
- `.cd-v` thành cửa sổ `overflow:hidden; height:1em` (chỉ chứa chữ số). Khi đổi: tạo bản sao giá trị cũ đặt tuyệt đối. Bản cũ `translateY(0 → 100%)` + opacity 1 → 0. Bản mới `translateY(-100% → 0)` + opacity 0 → 1. Cùng chiều "lùi" với odometer. 320ms `--ease-out`, xong thì xoá bản sao. WAAPI (`animate()`, đăng ký timeScale qua `EffectRegistry`).
- Giây: Vừa crossfade, Nhiều trượt (như 4.3). Nhẹ: crossfade. Tắt/reduced: tức thì.

### 4.5 `scroll-progress`: thanh tiến độ đọc (sửa R2A-05)
- **Hiện khi và chỉ khi** `micro.scrollProgress = true` **và** state ∈ {`medium`, `high`, `reduced`} (là chỉ báo vị trí, không phải trang trí, nên vẫn hiện khi giảm chuyển động; design 5.10). Ở Tắt/Nhẹ thì không hiện. Sửa `MATRIX.scrollProgress` thành `(false, false, 'config', 'config', 'config')`.
- **Hình:** `div.scroll-prog` `position:fixed; top: env(safe-area-inset-top, 0px); left:0; right:0; height:2px; transform-origin:0 50%; transform: scaleX(var(--p, 0))`, màu `--c-accent`. Theme `son-do`: màu `--c-primary` ("sợi chỉ đỏ"). Theme tối: `--c-accent`. `z-index: calc(var(--z-petals) + 1)` (trên canvas hạt, dưới nút nổi/sheet/lightbox/cover). `aria-hidden="true"` (không phải progressbar cho trình đọc màn hình).
- **Kỹ thuật:** `@supports (animation-timeline: scroll())`: `animation: sp-grow linear both; animation-timeline: scroll(root)` (keyframe `scaleX(0 → 1)`). Ngược lại: listener cuộn passive + rAF ghi `--p`.
- Ẩn khi `cover-on` hoặc `lb-on`. Hiện ra bằng opacity 300ms sau khi mở thiệp.
- Tiến độ tính theo cả trang (0 ở đầu, 1 ở `maxScroll`). Tự cuộn (5.11) cũng làm thanh chạy, đó là điều mong muốn.

### 4.6 `name-sparkle`: lấp lánh quanh "&" ở hero (sửa R2A-07)
- **Phần tử:** `.hero-names .nm-amp`. Thêm 3 `span.spk` (SVG `sparkle` của `icons.ts`), `position:absolute` quanh "&" (`.nm-amp` đặt `position:relative; display:inline-block`). Vị trí theo em của "&": (−.55em, −.25em) cỡ 12px; (+.85em, −.45em) cỡ 16px; (+.7em, +.55em) cỡ 9px.
- **Màu:** hero có ảnh (chữ trắng) thì lõi `#fff` + viền `--c-accent`. Hero không ảnh thì `--c-accent`.
- **Một đợt:** mỗi đốm `scale(0) rotate(0) → scale(1) rotate(45deg) → scale(0) rotate(90deg)`, opacity 0 → 1 → 0, 600ms `--ease-pop`, 3 đốm lệch nhau 120ms. Tổng một đợt khoảng 0.85s.
- **Lịch (thay "mỗi 6s × 3 lần"):** đợt 1 chạy 0.8s sau khi tên ở hero hiện xong (`is-in` + transitionend), đợt 2 sau đó 3s, kết thúc ≈ 4.7s ≤ 5s. Đợt 3 chỉ khi khách cuộn lên hero lần nữa sau ≥ 20s.
- Không chạy khi font script chưa tải (`document.fonts.check`), để đốm không lệch chỗ.

### 4.7 `music-ripple`: sóng lan ở nút nhạc
- **Kích hoạt:** `.fl-music[data-state]` chuyển sang `playing` từ trạng thái khác (lần đầu phát hoặc phát lại sau khi tạm dừng), tối đa 1 lần mỗi 10s.
- **Hình:** 2 `span.fl-ripple` chèn vào `.fl-music-wrap` (không dùng `::after` của `.fl-music` vì đã dùng cho `loading`/`blocked`, cũng không dùng `::after` của wrap vì là mũi tên tooltip). Vòng tròn đúng kích thước nút, `border: 2px solid var(--c-primary-decor)`. `scale(1 → 1.9)`, opacity .55 → 0, 1200ms `--ease-out`, vòng 2 trễ 300ms. Xoá ở `animationend`. Không chặn bấm (`pointer-events:none`).
- Theo dòng `attention` (Vừa/Nhiều). Nhẹ/reduced: không có (đĩa nhạc quay đã đủ báo trạng thái, design 9).

### 4.8 `gift-shake`: lắc hộp quà
- **Phần tử:** hình hộp quà `.gift-art` (ornament `gift`). Không áp cho `gift-songhy` (chữ Hỷ không lắc, cùng tinh thần quyết định B2 "chữ Hỷ không bao giờ xoay").
- **Keyframe** 500ms `--ease-inout`, `transform-origin: 50% 90%`: `rotate(0) → -6° → 6° → -4° → 4° → 0` (2 nhịp).
- **Khi:** 1 lần, 200ms sau khi hình hộp quà reveal xong. Desktop: hover/focus-visible nút `.gift-btn` thì lắc hộp, cách nhau ≥ 2s. Ngoài ra không tự lắc lại.

### 4.9 `calendar-flip`: lịch lật tờ khi bấm "Thêm vào lịch"
- Design 5.9 ghi "CSS 3D", nhưng transform 3D trên phần tử con của `<svg>` bị làm phẳng ở Safari/Chrome. Dùng **lật giả 2D**.
- **Icon:** thay icon `calendar` của nút này bằng SVG 2 phần: `g.cal-body` (khung + 2 khoen: `M4 6h16v14H4zM8 3v4M16 3v4`) và `g.cal-page` (tờ lịch `M4 10h16v10H4z`, tô `currentColor` opacity .15 + đường kẻ `M4 10h16`). `transform-box: fill-box; transform-origin: 50% 0`.
- **Khi bấm:** `.cal-page` `scaleY(1 → 0)` 150ms `cubic-bezier(.55,0,1,.45)` (chưa có token ease-in), rồi `scaleY(0 → 1)` 150ms `--ease-out` (tờ mới), tổng 300ms. Chạy ngay khi bấm, không chờ tạo `.ics`. Nhẹ trở lên. Reduced: không lật, chỉ đổi opacity của tờ .15 → .35 → .15.

### 4.10 `couple-heart-tap`: chạm đúp ảnh cô dâu/chú rể thả tim (mặc định tắt)
- **Phần tử:** `.person-photo` (không áp album, vì chạm đúp ở album dùng để phóng to, design 5.9).
- **Nhận diện:** 2 lần `pointerup` cách nhau ≤ 300ms và lệch ≤ 24px (chuột: `dblclick`). Đặt `touch-action: manipulation` trên `.person-photo` để tắt phóng to bằng chạm đúp của trình duyệt **chỉ trên ảnh này**, vẫn chụm 2 ngón để phóng to được (WCAG 1.4.4 không bị ảnh hưởng).
- **Hình:** tim SVG 56px (icon `heart`), fill `--c-primary`, viền 2px `#fff`, tại điểm chạm (tọa độ trong khung). `scale(0) → 1.2 → 1` 300ms `--ease-pop`, rồi `translateY(-24px)` + opacity → 0 trong 400ms (tổng 700ms), xoá khi xong. Tối đa 3 tim cùng lúc.
- **Cấp:** do khách chủ động nên chạy từ Nhẹ. Reduced: tim hiện tĩnh rồi mờ 200ms. Tắt: không có.
- Chunk lười ≤ 1 KB, chỉ import khi `micro.coupleHeartTap = true` (gắn listener sau khi mở thiệp).

## 5. UX admin

### 5.1 Đặt ở đâu: màn "Hiệu ứng", không phải "Các phần & thứ tự"
| Tiêu chí | "Hiệu ứng" ★ | "Các phần & thứ tự" |
|---|---|---|
| Mô hình của người dùng | "Chỉnh chuyển động" nằm cùng một chỗ với gói chính, cường độ, nút Phát lại/0.5x/Mô phỏng (8.13) | Màn này để quản lý cấu trúc (bật/tắt, thứ tự). Thêm một dropdown mỗi dòng làm dòng vốn đã chật (tay cầm, số, tên, ↑↓, công tắc, "Sửa nội dung") vỡ trên mobile 360px |
| Bundle | route `effects` tải lười (5.55/15 KB) | `sections.tsx` nằm trong bundle admin **ban đầu** (73.15/80 KB) |
| Xem trước | đã nối `preview.replay` | phải nối thêm |

Màn "Các phần & thứ tự" chỉ thêm (≤ 0.4 KB):
- Dòng của section **đã chọn riêng** có nhãn nhỏ `Hiện: Tạp chí` (badge chữ, không chỉ màu). Bấm vào thì mở "Hiệu ứng" và cuộn tới dòng của section đó trong "Từng phần" (mở sẵn `<details>`, focus vào select).
- Dưới danh sách có link "Kiểu hiện khi cuộn của từng phần ›" sang "Hiệu ứng" (`#reveal-sections`).
- Không import `reveal-plan` vào route này, nên không hiện nhãn "tự động".

### 5.2 Khối "Hiện nội dung khi cuộn" (thay khối cùng tên ở design 8.13)
Desktop (cột form 640px):
```
─ Hiện nội dung khi cuộn ─────────────────────────────────────────
Gói chính
[Theo theme (Mềm mại) ✓][Mềm mại][Tạp chí][Từng chữ][Nhẹ nhàng][Vui tươi][Điện ảnh]
Cách áp dụng
 ( ● Xen kẽ tự động )( Giống nhau mọi phần )
 Tiêu đề và ảnh ở các phần nổi bật đổi kiểu trong bộ Mềm mại · Tạp chí · Từng chữ.
 Phần thông tin (Sự kiện, Mừng cưới, Xác nhận…) giữ Mềm mại cho dễ đọc.
[↻ Xem thử 3 phần]
▸ Từng phần · 5 phần khác gói chính · 1 phần chọn riêng
```
Mở "Từng phần":
```
  Phần                       Kiểu hiện                         
  Ảnh bìa                    [Tự động · Mềm mại        ▾] [▶ Xem]
  01 Cô dâu & Chú rể         [Tự động · Từng chữ       ▾] [▶ Xem]
  02 Hai bên gia đình        [Tạp chí                  ▾] [▶ Xem]  ● Chọn riêng
  03 Lời mời                 [Tự động · Từng chữ       ▾] [▶ Xem]
  04 Sự kiện                 [Tự động · Mềm mại        ▾] [▶ Xem]  Phần thông tin
  Đếm ngược                  [Tự động · Mềm mại        ▾] [▶ Xem]  Phần thông tin
  …
  [Bỏ chọn riêng ở mọi phần (1)]
  2 phần đang tắt hoặc chưa có nội dung không có trong danh sách.
```
Mobile (< 768px, 360px): mỗi phần là 1 khối 2 dòng. Dòng 1: số + tên (+ badge "Chọn riêng" / "Phần thông tin"). Dòng 2: `select` cao 48px chiếm phần còn lại + nút "▶ Xem" 44×44 có chữ. Các khối cách nhau 8px. Chip gói chính cuộn ngang được (`chips--scroll` như guest) hoặc xuống dòng. Mock: `assets/v4a-2a/admin-reveal-mock.html`, ảnh `screenshots/v4a-2a/admin-reveal-mobile.png` (360×740, phần đầu), `admin-reveal-mobile-full.png`, `admin-reveal-desktop.png` (700px). Khi chụp thấy cột form 640px quá hẹp cho bố cục một hàng (tên 220px + select + Xem làm select chỉ còn khoảng 300px), nên **desktop cũng dùng bố cục 2 dòng như mobile** (select rộng hết khối). Sơ đồ một hàng ở trên chỉ minh hoạ nội dung. `summary` không dùng `display:flex` (bản đầu của mock bị tách "Từng / phần" thành 2 dòng ở 360px).

**Chi tiết:**
- "Cách áp dụng": `Segmented` (radiogroup), ghi `effects.reveal.mode`. Đổi thì gửi `fx:replay` `reveal` (xem thử 3 phần). Câu trợ giúp đổi theo mode và theo gói chính (liệt kê đúng bộ hài hoà sau khi lọc capabilities). Mode `uniform`: "Mọi phần dùng Mềm mại. Có thể chọn riêng vài phần bên dưới."
- "Từng phần" dùng `<details>` (`Details` hiện có), mặc định **đóng**. `summary` luôn nói kết quả: "Từng phần · 5 phần khác gói chính · 1 phần chọn riêng". Danh sách chỉ gồm các section **đang hiển thị** (theo `planSections(draft)`), đúng thứ tự, đúng số thứ tự như khách thấy.
- **Select mỗi dòng** (native `<select>`: trên mobile mở bộ chọn của hệ điều hành, dễ thao tác một tay). Option đầu (giá trị rỗng = không ghim): "Tự động · <gói>" khi mode auto, "Theo gói chính · <gói>" khi mode uniform. Tiếp theo là các gói có trong `capabilities.revealStyle`. Chọn một gói thì ghi `effects.reveal.sections[id]`. Chọn option đầu thì xoá khoá. Đổi xong gửi `reveal:<id>` và toast mobile "[Xem ↗]" (A05).
- Badge: "Chọn riêng" (khi có ghim), "Phần thông tin" (functional, mode auto, chưa ghim; tooltip/trợ giúp: "giữ gói chính cho dễ đọc"). Badge luôn có chữ.
- "Bỏ chọn riêng ở mọi phần (n)": chỉ hiện khi n ≥ 1. Xoá `sections` về `{}`, có toast Hoàn tác (như 8.12).
- **Ghi chú theo cấp:** cường độ Nhẹ: "Ở cấp Nhẹ, mọi phần chỉ mờ dần; xen kẽ và chọn riêng chỉ thấy từ cấp Vừa." Cường độ Tắt: "Cấp Tắt: nội dung hiện ngay, không có hiệu ứng." Hiện ngay dưới "Cách áp dụng". Không khoá điều khiển, admin vẫn chỉnh trước được.
- **"Tuỳ chỉnh nâng cao"** (đã có trong 8.13, code chưa có): thêm 4 select "Ghi đè cho cả trang: Tiêu đề / Khối chữ / Ảnh / Hoạ tiết" (`null` = "Theo gói"), kèm ghi chú: "Ghi đè áp cho mọi phần, kể cả xen kẽ tự động, trừ phần đã chọn riêng." Ưu tiên thấp, có thể để đợt sau (Q4).
- Cảnh báo tổ hợp nặng (8.13, checklist): xét thêm "có phần nào dùng Điện ảnh" (gói chính **hoặc** ghim) + kiểu mở Cao + cấp Nhiều.
- Dialog đổi theme "Giữ phần tôi đã chỉnh / Dùng trọn gói" (8.12, `ops.ts` nhóm `reveal`): nhóm reveal coi là "đã chỉnh" khi `style ≠ theme` **hoặc** `mode ≠ auto` **hoặc** `sections` khác rỗng **hoặc** có ghi đè vai trò. "Dùng trọn gói" đặt lại cả 4 (`style:"theme"`, `mode:"auto"`, `sections:{}`, vai trò `null`).

### 5.3 "Chi tiết nhỏ" (micro) trong màn Hiệu ứng (bổ sung code hiện tại, khớp 8.13)
```
─ Chi tiết nhỏ ──────────────────────────────────
[●] Nút chính có vệt sáng lướt                         -> micro:buttonShine
[●] Ảnh nghiêng theo chuột                             -> micro:photoTilt
    Chỉ trên máy tính có chuột; điện thoại không nghiêng.
[ ] Thanh tiến độ đọc ở mép trên                       -> micro:scrollProgress
    Hiện ở cấp Vừa và Nhiều (và khi khách giảm chuyển động).
[ ] Chạm đúp ảnh cô dâu, chú rể để thả tim             -> micro:coupleHeartTap
    Bất ngờ nhỏ, khách không được báo trước.
Kiểu số đếm ngược: [Lật số ▾]  (Lật số · Trượt số · Đồng hồ cơ · Đơn giản)  -> micro:countdown
Pháo hoa đếm ngược: [Mỗi lần cuộn tới … ▾]                                 (giữ nguyên)
```
`name-sparkle`, `music-ripple`, `gift-shake`, `calendar-flip` không có công tắc (đi theo cường độ). Thêm công tắc không đáng so với chi phí lựa chọn (Hick). `wishFly` thuộc v3.

### 5.4 `fx:replay` và "Phát lại"
| `target` | Admin gửi khi | Iframe guest làm gì | Nhãn "Đang xem" |
|---|---|---|---|
| `reveal` | đổi gói chính, đổi "Cách áp dụng", bấm "Xem thử 3 phần", đổi cường độ khi hiệu ứng gần nhất là reveal | **Tour:** 3 section expressive hiển thị đầu tiên (thiếu thì lấy thêm section kế tiếp sau hero). Với mỗi phần: cuộn tức thì để đầu section ở 15% chiều cao viewport, `replaySection`, chờ hết thời lượng ước tính (độ trễ lớn nhất + thời lượng, ≤ 2.2s) + 400ms, rồi sang phần sau. Tổng ≤ 8s, xong gửi `fx:done` | "Hiện nội dung · 3 phần" |
| `reveal:<sectionId>` | đổi select của dòng, bấm "▶ Xem" | Cuộn tới section đó (đầu ở 15% viewport), `replaySection` 1 lần. Section không hiển thị thì `fx:done` ngay | "Hiện nội dung · Hai bên gia đình (Tạp chí)" |
| `micro:buttonShine` | bật/tắt công tắc | Cuộn tới nút CTA hiển thị đầu tiên (`.gift-btn` → nút gửi lời chúc → nút RSVP), chạy 1 vệt sáng (bỏ giới hạn đợt/phiên trong preview) | "Vệt sáng trên nút" |
| `micro:photoTilt` | bật/tắt | Cuộn tới `couple` (thay ánh xạ cũ `album`), chạy nghiêng theo kịch bản trên `.person-photo` đầu tiên: (4°, −6°) 500ms → giữ 300ms → (−4°, 6°) 500ms → về 0 400ms. Chạy được cả khi khung preview là mobile | "Ảnh nghiêng" |
| `micro:scrollProgress` | bật/tắt | Cuộn về đầu landing rồi cuộn mượt 1.5 màn để thấy thanh chạy | "Thanh tiến độ" |
| `micro:coupleHeartTap` | bật/tắt | Cuộn tới `couple`, thả 1 tim ở giữa ảnh đầu tiên | "Chạm đúp thả tim" |
| `micro:countdown` | đổi kiểu số | Cuộn tới countdown, cả 4 ô chạy 1 nhịp đổi số giả theo kiểu đã chọn (giây cũng chạy để thấy) | "Đếm ngược · Đồng hồ cơ" |

**`replaySection(sec)`** (guest): gắn `.rv-replay` lên section (tắt transition), bỏ `is-in`/`rv-done` của mọi `[data-rva]` trong section. Phần tử đã khôi phục chuỗi gốc (mask-up/split) thì tách lại. Đọc `sec.offsetWidth` để ép reflow, gỡ `.rv-replay`, sang frame kế tiếp gắn lại `is-in`. Không đụng `IntersectionObserver` (phần tử đã `unobserve`). `simulate.lowEnd`/`reducedMotion` và cường độ lấy theo config preview hiện tại, nên phát lại đúng như khách.

**0.5x (sửa R2A-06):** khi `speed = 0.5`, guest đặt `--fx-slow: 2` trên `<html>` (CSSOM), ngoài `EffectRegistry.setTimeScale(0.5)`. Mọi thời lượng/độ trễ reveal và micro CSS nhân với biến này (§3.9). `speed = 1` thì gỡ biến.

### 5.5 Accessibility (admin)
- "Cách áp dụng" là radiogroup có `legend`. Select từng dòng có nhãn đầy đủ (`aria-label="Kiểu hiện của phần Hai bên gia đình"`). Nút Xem có `aria-label="Xem thử kiểu hiện phần Hai bên gia đình"` và chữ "Xem" hiển thị (không chỉ icon). Vùng chạm ≥ 44px (select 48px).
- `summary` của "Từng phần" có số liệu, cập nhật khi đổi. Khi bấm badge `Hiện: …` ở "Các phần & thứ tự" thì focus đúng select đích.
- Admin đang bật giảm chuyển động: giữ quy tắc 8.13 (preview vẫn phát khi bấm, có ghi chú).

## 6. Tiêu chí chấp nhận (cho FE và designer review)

**Unit (vitest)**
1. `revealPlan` ra **đúng** bảng ví dụ ở 2.4 cho Trầm Vàng, Đêm Nhung, Đất Nung, Sen Chàm (thứ tự mặc định, loveStory tắt). Thêm ca loveStory bật với Đất Nung: couple letter, families soft, announcement letter, loveStory playful, album soft, thankyou letter.
2. Không có 2 section expressive liền kề (bỏ qua functional) cùng gói trong mọi hoán vị thứ tự (property test với 200 thứ tự ngẫu nhiên, seed cố định) × 6 gói chính.
3. Ghim thắng auto. Mode `uniform` → mọi phần chưa ghim = A. Gói đồng hành không có trong capabilities thì bị loại khỏi bộ, không lỗi. Khoá `sections` lạ hoặc giá trị lạ bị sanitize bỏ.
4. Bảng nguyên tử theo cấp: thêm các ca vào `atomFor` (script → wipe; > 40 grapheme → split-words; > 20 từ → fade-up; `lowEnd` split-chars → split-words; ảnh lồng trong khối → photo-settle; `blur-in` ở Vừa/mobile/phần tử thứ 4 → mask-up; reduced → fade-fast; Nhẹ → gentle).
5. `MATRIX.scrollProgress` mới, `DEGRADE_ORDER` kết thúc bằng `revealLite`.

**E2E chọn lọc (1 file `reveal-b1.spec.ts`, không chụp lại những gì unit đã phủ)**
1. Trầm Vàng mặc định: thuộc tính `data-rvp` của các section khớp cột Trầm Vàng ở 2.4.
2. **Không lộ dấu ở trạng thái ẩn:** heading `mask-up` với chuỗi `ẦẪỂỖỮ Thuỳ Ngọc` (theme luc-bao, cấp Vừa), chụp vùng heading trước khi `is-in` → không có pixel mực (so với nền, ngưỡng 2%).
3. **Không clip ở trạng thái cuối:** sau khi mọi section đã hiện thì không còn `.rv-ln`/`.rv-vis` trong DOM, và mọi `[data-rva=wipe]` có `clip-path` computed = `none`.
4. Reduced-motion (emulate): không có `.rv-w`/`.rv-c`/`.rv-ln`, không có `filter` nào trên heading.
5. `fx:replay` `reveal:families` → nhận `fx:done`; `reveal` (tour) → `fx:done` trong ≤ 9s.
6. CLS < 0.05 khi cuộn hết trang ở cấp Nhiều với gói `letter` và `editorial` (PerformanceObserver `layout-shift`).

**Ngân sách** (size-limit): theo bảng 2.8.

**Designer review (bước 4)** chụp: 4 theme ở 2.4 × khung 375px × lúc giữa reveal của couple/announcement/album/thankyou; heading tiếng Việt có dấu chồng ở 4 gói mới; admin "Từng phần" ở 360px. Lưu ảnh lỗi (nếu có) vào `screenshots/design-review-v4a-2a/<ID>.png` theo CLAUDE.md.

## 7. Bàn giao

**Cho solution-designer (bước 2):**
- Chốt Phụ lục A (schema `mode`, `sections`; hằng số `revealTier`/`revealAffinity`/`HARMONY`; enum; capabilities; MATRIX; `DEGRADE_ORDER`; postMessage `reveal:<id>`).
- Quyết định nơi đặt `revealPlan` (đề xuất `src/shared/reveal-plan.ts`, thuần, guest + admin dùng chung, không đưa vào `ResolvedTheme`).
- Ghi 8 điểm R2A-01..08 vào `solution.md` / chỉ định FE sửa (R2A-01, 02, 03, 05 làm thay đổi hành vi).
- Bản đồ file sở hữu khi chạy song song với v4a-2b/2c: các file dùng chung (`capabilities.ts`, `routes/effects.tsx`, `fx.css`, `labels.ts`, `bootstrap.ts`) chỉ **thêm dòng**, theo `solution-v4a-2bc.md`.

**Cho frontend-developer (bước 3), file dự kiến đụng:** `src/shared/{reveal-plan.ts (mới), sections/meta.ts, config/{enums,types,defaults,merge}.ts, capabilities.ts, labels.ts}`; `src/guest/effects/{reveal.ts, reveal-split.ts (mới, lười), intensity.ts, perf-probe.ts, service.ts}`; `src/guest/{bootstrap.ts (replay), styles/fx.css, styles/sections.css, sections/countdown.ts (+ odometer lười), sections/events.ts (icon lịch), sections/gift.ts, sections/basic.ts (sparkle), floating/floating.ts (ripple), icons.ts}`; micro lười `photo-tilt.ts`, `heart-tap.ts`; admin `routes/effects.tsx`, `routes/sections.tsx` (badge + link), `draft/ops.ts`, `draft/checklist.ts`, `editor/preview.tsx`. Ảnh tham chiếu: `screenshots/v4a-2a/*.png` (không cần chụp lại để tái hiện R2A-01: mở `assets/v4a-2a/reveal-lab.html`).

## 8. Câu hỏi cho người duyệt (giả định mặc định trong ngoặc)

1. **Mặc định "Xen kẽ tự động"** cho thiệp mới **và** config đã lưu trước đó (không có `mode`): trang sẽ tự đổi từ một kiểu sang xen kẽ sau khi nâng cấp. *(Giả định: đồng ý, vì chưa có config nào được publish.)*
2. Ở chế độ tự động, **các phần thông tin** (Sự kiện, Đếm ngược, Lịch trình, Mừng cưới, Lời chúc, Xác nhận, Chân trang) và **Ảnh bìa** luôn giữ gói chính, chỉ các phần nổi bật mới đổi kiểu. *(Giả định: đồng ý.)*
3. "Chọn riêng" chỉ chọn **cả gói** cho một phần, không chỉnh từng vai trò (tiêu đề/khối/ảnh) trong một phần. *(Giả định: chỉ gói, cho đơn giản.)*
4. Ô "Ghi đè cho cả trang theo vai trò" (nâng cao, đã có trong schema nhưng admin chưa có UI): làm ở đợt này hay để v4b? *(Giả định: để v4b; schema giữ nguyên, runtime vẫn tôn trọng nếu config có giá trị.)*
5. Rút ngắn **vệt sáng trên nút** (2 lần trong 4 giây thay vì 3 lần cách 4 giây) và **lấp lánh quanh "&"** (2 đợt trong 5 giây thay vì mỗi 6 giây × 3) để đạt WCAG 2.2.2. *(Giả định: đồng ý.)*
6. **Thanh tiến độ đọc** chỉ hiện khi admin bật (mặc định tắt), kể cả ở cấp Nhiều, thay vì cấp Nhiều tự bật. *(Giả định: đồng ý.)*
7. Kiểu đếm ngược **"Đồng hồ cơ"** và **"Trượt số"**: ô giây ở cấp Vừa chỉ mờ dần (như "Lật số" hiện tại), cấp Nhiều mới quay/trượt. *(Giả định: đồng ý.)*

---

## Phụ lục A: schema đề xuất (để solution-designer chốt)

**Config (thêm vào `effects.reveal`):**
| Field | Kiểu / enum | Mặc định | Ghi chú |
|---|---|---|---|
| `effects.reveal.mode` **(mới)** | `"auto"` · `"uniform"` | `"auto"` | Nhãn: "Xen kẽ tự động" / "Giống nhau mọi phần" |
| `effects.reveal.sections` **(mới)** | `{ [sectionId: string]: RevealStyle }` | `{}` | Khoá = `sections.items[].id`. Không có khoá = theo mode. Ghim **bằng** gói chính vẫn có nghĩa (khoá section đó ở A trong chế độ auto) |
| `effects.reveal.style` | giữ | `"theme"` | là "gói chính" A |
| `effects.reveal.heading/block/image/ornament` | giữ | `null` | Ưu tiên: dưới ghim, trên auto/uniform (2.2) |

**Sanitize (`merge.ts`):** `mode` lạ → `"auto"`. `sections` không phải object → `{}`. Bỏ khoá không có trong `sections.items`, bỏ giá trị ngoài `REVEAL_STYLES`. Giữ ghim của section đang tắt (bật lại thì vẫn còn). Runtime: giá trị ngoài `capabilities.revealStyle` → `capOr` fallback + cảnh báo (như `style`).

**Tương thích / migration:** không bump `schemaVersion`. Config thiếu field thì merge mặc định (`mode:"auto"`, `sections:{}`), xem Q1. Import v0 (`effects.scrollReveal.*`) vẫn bỏ qua như hiện tại.

**Hằng số trong code (không nằm trong config):**
- `SECTION_META[type].revealTier: "opening" | "expressive" | "functional"` và `revealAffinity: RevealStyle[]` (bảng 2.3).
- `REVEAL_HARMONY: Record<RevealStyle, [RevealStyle, RevealStyle]>` (bảng 2.4).
- Hệ số thời lượng gói (`cinematic` 1.25) nằm trong CSS `[data-rvp]`.
- Giới hạn: `blur-in` ≤ 3/trang, `wipe` ≤ 3 cùng lúc (máy yếu 2, chờ ≤ 600ms), `split-chars` ≤ 40 grapheme, `split-words` ≤ 20 từ, stagger `--i` ≤ 8, mask-up stagger dòng 90ms (≤ 4 dòng).

**enums.ts:** `REVEAL_MODES = ['auto', 'uniform']`.
**capabilities.ts** (chỉ thêm dòng): `revealStyle` += `editorial`, `letter`, `playful`, `cinematic`. `revealAtom` += `mask-up`, `wipe`, `blur-in`, `split-words`, `split-chars`, `parallax-layers`. `countdownStyle` += `slide`, `odometer`.
**intensity.ts:** `MATRIX.scrollProgress = row(false, false, 'config', 'config', 'config')` (R2A-05). **perf-probe.ts:** `DEGRADE_ORDER` thêm `'revealLite'` ở cuối.
**labels.ts:** `REVEAL_MODE_LABEL`. Nhãn diff `effects.reveal.sections.<id>` → "Kiểu hiện · <tên phần>". `effects.reveal.mode` → "Cách áp dụng hiện nội dung".
**postMessage (solution 4.3):** `target` thêm `reveal:<sectionId>`. Ánh xạ `micro:*` theo §5.4 (`photoTilt` → `couple`, `buttonShine` → nút CTA đầu tiên).
**ops.ts / checklist.ts:** nhóm `reveal` gồm cả `mode` + `sections` (§5.2). Cảnh báo tổ hợp nặng xét "có phần nào dùng `cinematic`".
