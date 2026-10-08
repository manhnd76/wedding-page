# Frontend report - 20261007-wedding-page - giai đoạn v2.1

> Người thực hiện: frontend-developer · Ngày: 2026-10-08 · Branch: `feat/20261007-wedding-page-v2.1` (chưa commit, theo yêu cầu).
> Nguồn: `design-review-v1.md` (24 điểm, mục 3 ornament + phong bì, mục 4 mẫu phong thư, mục 5 tự cuộn) + `decisions.md` mục "Quyết định sau review visual v1 (2026-10-08)".
> Không làm: Apps Script (v3), theme/kiểu mở/hạt mới (v4). Không thêm dependency.

## 1. Kết quả chạy thật (2026-10-08)

| Lệnh | Kết quả |
|---|---|
| `npm run build` (tsc + vite build + size-limit) | **exit 0**, 0 mục vượt ngân sách |
| `npm test` | **18 file, 368 test pass** (v2: 15 file / 315) |
| `npm run test:e2e` | **19/19 pass** (v2: 16; +3 mới), ~2.1 phút; test hạt nền chạy lặp 5 lần đều pass |

### size-limit (gzip)
| Mục | v2.1 | v2 | Ngân sách |
|---|---|---|---|
| **Guest JS ban đầu** (entry + `envelope` + skin `classic` + `petal-rose`) | **30.54 kB** | 26.32 | ≤ 60 kB |
| **Guest CSS ban đầu** | **11.01 kB** | 8.82 | ≤ 25 kB |
| openStyle `envelope` (timeline + nạp skin) | 1.54 kB | 0.51 | ≤ 4 kB |
| **Mẫu phong bì** classic / kraft / song-hy / lace / minimal / velvet | 0.19 / 0.98 / 0.83 / 0.67 / 0.41 / 0.65 kB | - | **≤ 1.5 kB/mẫu** (mục mới trong `.size-limit.cjs`) |
| lazy `autoscroll` (tải sau khi mở thiệp) | 2.69 kB | - | ≤ 15 kB |
| lazy `fireworks` / `field` | 1.38 / 3.90 kB | | ≤ 15 kB |
| Admin JS ban đầu | 67.75 kB | 66.91 | ≤ 80 kB |
| Admin CSS | 5.72 kB | 5.55 | ≤ 10 kB |
| Admin lazy `effects` (gallery phong bì + khối tự cuộn) | 5.44 kB | 2.66 | ≤ 15 kB |

Sprite ornament (gzip): classic-line 1.14 kB, traditional 1.34 kB, luxe 0.88 kB (≤ 4 kB/bộ).

## 2. Bảng đối chiếu 24 điểm

| ID | Trạng thái | Ghi chú (file chính) |
|---|---|---|
| R01 | ✅ Đã sửa | Phong bì **ngang 10:7**, tên cặp đôi **ngoài, phía trên** (`.cv-head`), "Kính gửi + tên khách" là **text HTML trên mặt phong bì** (`.env-addr`). Lớp back < card < front < flap < seal; nắp lật rotateX + z-index 4→1 ở 50%; thẻ rút lên, bao rơi + mờ, thẻ về giữa màn scale 1.06→1.12. Tổng **~1.95s** (Nhẹ ~1.1s). Khoảng rút/đưa về giữa **tính theo kích thước thật** (`cardTravel`) nên không khung nào bị cắt; e2e tua từng 50ms ở 360×740 xác nhận. `cover.ts`, `cover/styles/envelope.ts`, `cover/skins/*`, `styles/cover.css` |
| R02 | ✅ | Lớp `.ty-shade` riêng (overlay đều + vùng tối radial sau khối chữ), theme tối dùng overlay `rgba(bg,.55)` + radial .35; thêm text-shadow nhẹ. Cần kiểm lại với ảnh thật (mục 7) |
| R03 | ✅ | "Vùng dịu" `.hero-names, .ann-names, .ann-invite, .sec-head` (≤ 4 vùng gần giữa màn, +8px): alpha kẹp **≤ 0.3** (fade 200ms), không ẩn hẳn; vùng loại trừ (form) vẫn = 0. Áp cho cả burst. `particles/geometry.ts` (`alphaTarget`), `field.ts` |
| R04 | ✅ | (a) Gốc nổ chỉ ở 2 dải cạnh ô số (x < 18% / > 82%), dải giữa tiêu đề–ô số, dải ngay dưới ô số; luôn tránh `.sec-head` (+16px) và ô số (+12px); mobile tốc độ ≤ 80px/s → bán kính ≈ 57px. (b) Theme sáng: `accent` + `mix(accent,#fff,45%)` + `primary` (đúng 1/3 số hạt), sprite **sao 4 cánh 6px lõi trắng**; theme tối giữ chấm vàng. `burst/fireworks.ts` |
| R05 | ✅ | Chạm mở: `.cv-actions` mờ 200ms + translateY 8px ngay trong handler; khi đang mở, chạm **bất kỳ đâu trên cover** = tua nhanh |
| R06 | ✅ | `.cv-greet-h` `text-wrap: balance`, `clamp(30px, 8.6vw, 38px)`; font script nhóm cẩn trọng (Imperial Script, Moon Dance, Birthstone) -> heading italic 28px (`CAUTION_SCRIPTS`) |
| R07 | ✅ | Divider cao 0, nằm trên ranh giới; ornament absolute `translate(-50%,-50%)`, `padding-inline 12px`, nền = nền section phía sau (`--div-bg` tính lúc chèn); 140×21 mobile / 200×30 desktop |
| R08 | ✅ | `padding-inline: .18em` cho `.cv-names, .hero-names, .ty-sig, .ann-names, .h2-script, .cd-msg, .ft-mono, .cv-greet-h, .cv-card-mono`; clip-path chữ ký chừa biên ngang `-0.2em`. (designer cập nhật quy tắc 2.1 trong design.md) |
| R09 | ✅ | `html[data-script="imperial-script"]`: `--fs-names` mobile tối thiểu 46px, `.ty-sig` 44px; lời chào theo R06 |
| R10 | ✅ | `.cd-l` 12px + `letter-spacing .14em`; `.ev-badge` 12px |
| R11 | ✅ | Chip `min-height: 44px`; < 480px một hàng cuộn ngang (`scroll-snap x proximity`, mép phải mờ bằng mask), `role="group" aria-label="Gợi ý lời chúc"`. Kèm sửa `min-width:0` cho lưới sổ lưu bút (hàng chip nowrap từng làm trang rộng 799px) |
| R12 | ✅ | Scroll-top chỉ hiện khi **đang cuộn lên** và đã qua 1.5 màn, tự ẩn sau 2s đứng yên; ẩn khi tự cuộn đang chạy |
| R13 | ✅ | Cánh hồng vẽ lại theo path của designer (giọt nước ngược, khía mép trên), 2 lớp: accent + `mix(accent,#fff,35%)` ở 40% phía trên (Path2D) |
| R14 | ✅ | Thay 3 sprite bằng SVG mục 3.1 (thêm `pathLength=100` để svg-draw vẫn chạy). Dùng thêm: `amp` quanh chữ "&" ở Cô dâu & Chú rể, `monogram` làm khung chữ lồng chân trang, `songhy` (màu primary, 84×64) thay `gift` ở Mừng cưới khi bộ `traditional`. Divider symbol 160×24 |
| R15 | ✅ | `text-wrap: balance` cho `.sec-sub, .ann-*, .person-bio, .ty-msg, .gift-msg, .cd-msg, .cv-greet-*`, tiêu đề section; `p { text-wrap: pretty }`; tên khách trong lời mời in đậm (`strong.ann-guest`, 600, màu text) - tách template quanh `{guest}`, không innerHTML |
| R16 | ✅ | Seal SVG giọt sáp + vành trong (mục 3.2), 52–64px, monogram heading 15–16px; màu sáng/tối của gradient bằng `color-mix` trong CSS với fallback (không cần JS) |
| R17 | ✅ | Desktop: phong bì 560px (co lại theo chiều cao màn để không tràn), nền `radial-gradient(ellipse at 50% 45%, surface, bg 70%)` + texture, ornament góc 120px |
| R18 | ✅ | Luôn có chip tĩnh "Còn N ngày" dưới 4 ô số (mốc 100/30/7/1 -> "Chỉ còn N ngày!", nền nổi) |
| R19 | ✅ | Theme tối: nút nổi viền `--c-line-strong` + vòng `color-mix(primary 25%)`, scroll-top nền surface |
| R20 | ✅ | `.ev-actions .btn` padding 14px, icon cùng 18px; < 360px 2 nút xếp dọc |
| R21 | ✅ | `.gift-msg` `max-width: 34ch` + balance; > 3 dòng (heuristic: > 3 dòng xuống hàng hoặc > 102 ký tự) -> căn trái |
| R22 | ✅ | `.btn-sm` `min-height: 44px` |
| R23 | ⏸ Giữ nguyên | Theo đề xuất: giữ pill ở v1/v2, thanh điều hướng desktop làm ở v4 (không chặn) |
| R24 | ✅ | `gold-dust` 2–4px, màu "theme" = vàng sáng tự nhiên (không lấy accent nâu `#9C7A45`); `firefly` lõi `#FFE7A8` + quầng alpha .25, bỏ lớp nâu |

Đếm: 23 đã sửa, 1 giữ nguyên theo đề xuất (R23).

## 3. Mẫu phong thư (design-review-v1 mục 4)

- **Kiến trúc:** `cover.ts` (entry) dựng các lớp HTML trống + tên/địa chỉ (text HTML). Module `cover/styles/envelope.ts` có `prepare()` tải **skin của mẫu đang dùng** (`cover/skins/<id>.ts`, import động) và vẽ SVG vào các lớp; `play()` là timeline chung. Skin chỉ khai: SVG + pha "mở khoá" riêng (`unlock()` trả các bước + mốc lật nắp). Bộ dựng chung `cover/skins/kit.ts` (shell/túi/nắp/lót, dấu sáp 2 nửa, vệt sáng). Hình học chung guest + admin ở `src/shared/envelope.ts`.
- Phong bì mờ tới khi skin vẽ xong (`.is-skin`, ≤ 4s vẫn cho mở bằng hình CSS); tên cặp đôi (LCP) không phụ thuộc skin. Reduced-motion/Tắt vẫn vẽ skin (hình tĩnh) và mở bằng fade 200ms.
- Plugin build: skin đang dùng được **modulepreload** và tính vào "JS ban đầu"; mỗi skin có mục size-limit riêng ≤ 1.5 kB.
- 6 mẫu: `classic` (giấy ngà, lót sọc chéo, dấu sáp tách đôi) · `kraft` (thớ giấy feTurbulence tĩnh, dây gai chữ thập + nơ + oải hương, thẻ tên giấy ngà; nơ tuột bằng stroke-dashoffset, dây trượt 2 bên, thẻ lắc) · `song-hy` (đỏ son, viền vàng kép, mây chìm .12, nắp vát tù, huy hiệu vàng chữ 囍 hình học; huy hiệu xoay rotateY + vệt sáng) · `lace` (mép nắp lượn ren + lỗ đục, cụm hoa ép; cụm hoa nhấc lên) · `minimal` (nắp chữ nhật 38%, sticker chữ cái đầu, địa chỉ kiểu tem nhãn; sticker bóc, nắp 380ms) · `velvet` (nhung + glow đỏ tĩnh, viền vàng kép, seal vàng đồng, lót quạt deco; vệt sáng 0–350ms rồi seal tách).
- **Màu:** `color: "auto"` -> kraft/song-hy/velvet(theme sáng) dùng bảng màu cố định (mực ≥ 4.5:1, unit test); các mẫu khác theo token theme. `"theme"` ép nhuộm theo theme. Hex -> giấy tự chọn, mực đen/trắng chọn theo tương phản (`inkOn`), admin hiện badge tỉ lệ.
- **Admin** (tab Hiệu ứng, ngay dưới thẻ kiểu mở, chỉ hiện khi kiểu mở resolve ra `envelope`): gallery 7 thẻ (thẻ đầu "Theo theme (Cổ điển…)"), 3 cột desktop / 2 cột mobile, poster SVG dựng từ hình học thật nhuộm theo theme + tên khách mẫu, badge "Đang dùng ✓" / "Gợi ý cho theme" / "Màu cố định", `role="radiogroup"` + mũi tên duyệt + Enter/Space chọn, nhãn đọc đầy đủ. **Chọn = phát cover ngay trong preview** (dùng chung "↻ Phát lại", "0.5x"). Bên dưới: "Màu phong bì" (Theo mẫu / Theo theme / Tự chọn + badge tương phản), công tắc "Ghi tên khách trên phong bì", "Lót hoa văn trong nắp". "Trọn gói" khi đổi theme đặt cả mẫu phong bì về "Theo theme".

## 4. Tự động cuộn (design-review-v1 mục 5)

- `src/guest/autoscroll/core.ts` (thuần, unit test) + `autoscroll.ts` (DOM, chunk lazy tải sau khi cover gỡ xong).
- Bắt đầu sau `startDelayMs` (2.5s), tăng tốc 800ms (ease-in), tốc độ × `clamp(innerHeight/800, .8, 1.2)`; rAF + `dt`, cộng dồn số thực, chỉ `scrollTo` khi lệch ≥ 1 device pixel; `html.is-autoscroll { scroll-behavior: auto }`.
- `flow`: dừng `dwellMs` (1.2s) khi đầu section chạm 18% viewport; countdown `max(dwellMs, 2000)`; hero/footer không dừng. `steady`: không dừng. Hạ cánh êm ở màn cuối khi có section Cảm ơn; dừng hẳn ở cuối trang, ẩn nút.
- **Dừng hẳn, không tự tiếp tục:** wheel, touchstart, pointerdown chuột, keydown (trừ phím bổ trợ), scrollY lệch > 3px không do resize (kéo thanh cuộn/tìm trong trang), focusin vào input/textarea/select/button/a, mở lightbox/sheet/menu (`has-overlay`), chọn văn bản. Thao tác trên chính nút tự cuộn được bỏ qua. Khách cuộn trong lúc chờ -> không bắt đầu.
- **Tạm dừng rồi tự chạy lại** chỉ khi do hệ thống: tab ẩn (chạy lại sau 1s), resize/thanh địa chỉ (sau 500ms).
- Không tự bắt đầu khi: khôi phục vị trí cuộn cũ, URL có hash, trang < 1.5 màn, reduced-motion, cấp Tắt, `enabled=false`.
- Nút tròn 44px ở cột phải, **trên nút nhạc** (CSS `order`), thứ tự Tab sau nút nhạc; ‖ "Dừng tự cuộn" `aria-pressed=true` / ▶↓ "Tiếp tục tự cuộn"; lần dừng đầu: toast 3s "Đã dừng tự cuộn · bấm ▶ để tiếp tục". Menu nhanh có "Tự cuộn: Bật/Tắt". Cấp Tắt: chỉ có trong menu. Reduced-motion: nút ở trạng thái dừng, khách bấm thì chạy `steady` 32px/s.
- Tương tác hiệu ứng: gió theo cuộn bỏ qua cuộn tự động; scroll-top ẩn, pill thu nhỏ khi đang chạy; ảnh lazy trong 1.5 màn phía trước được tải sớm.
- Admin (tab Hiệu ứng, khối "Tự động cuộn"): bật/tắt, Tốc độ Chậm 32 · Vừa 45 · Nhanh 64 · Tuỳ chỉnh (20–120), "Dừng ngắn ở mỗi phần" (flow/steady), thanh "Bắt đầu sau" 1.5–8s, nút "↻ Phát lại tự cuộn" (preview `fx:replay target:"autoscroll"` chạy 8s rồi báo `fx:done`). Preview thường không tự cuộn.

## 5. Thay đổi schema (KHÔNG bump `schemaVersion`, vẫn = 1)

Chỉ **thêm field có mặc định**; config cũ thiếu field được `mergeWithDefaults` bù, không cảnh báo.

| Field | Kiểu | Mặc định | Kiểm tra (merge) |
|---|---|---|---|
| `cover.envelope.style` | `"theme"` · `classic` · `kraft` · `song-hy` · `lace` · `minimal` · `velvet` | `"theme"` | enum, sai -> `"theme"` + cảnh báo |
| `cover.envelope.color` | `"auto"` · `"theme"` · hex | `"auto"` | sai -> `"auto"` + cảnh báo |
| `cover.envelope.guestOnFront` | boolean | `true` | `false`: "Kính gửi …" vào thẻ bên trong |
| `cover.envelope.liner` | boolean | `true` | |
| `effects.autoScroll.enabled` | boolean | **`true`** (cũ `false`) | |
| `effects.autoScroll.speed` | px/s | **45** (cũ 55) | kẹp 20–120 |
| `effects.autoScroll.startDelayMs` | ms | **2500** (cũ 650) | **kẹp 1500–8000** (650 của wedding-site -> 1500) |
| `effects.autoScroll.mode` (mới) | `flow` · `steady` | `flow` | enum, sai -> `flow` + cảnh báo |
| `effects.autoScroll.dwellMs` (mới) | ms | 1200 | kẹp 0–4000 |
| (code) `ThemePreset.suggest.envelopeStyle` | id mẫu | map 12 theme (4.4) | không nằm trong config |

- Enum `ENVELOPE_STYLES`, `AUTO_SCROLL_MODES` (`enums.ts`); `AUTO_SCROLL_LIMITS` (`merge.ts`, admin dùng chung); capability `envelopeStyle` (đủ 6, fallback `classic`), `STAGE = 'v2.1'`; `ResolvedTheme.envelope = { style, themed, paper, ink, guestOnFront, liner }`; nhãn diff trong `schema-meta.ts`.
- Migrator v0: `autoScroll` chỉ mang field có trong file cũ (thiếu -> mặc định mới, tức **bật**); wedding-site (`enabled:true, speed:55, startDelayMs:650`) -> giữ `enabled`, `speed`, `startDelayMs` kẹp 1500. Test "không mất dữ liệu" cập nhật cho phép biến đổi này.
- `public/content/config.json`: `theme.preset` về **`tram-vang`**; `autoScroll` theo mặc định mới; thêm `cover.envelope`. Không test nào ghim theme của config mẫu (e2e đọc theme đã build; test phong bì 360×740 tự bỏ qua nếu config mẫu không resolve ra phong bì).

## 6. Test thêm / sửa

- Unit mới: `tests/envelope-schema.test.ts` (mặc định, enum, merge config cũ, map 12 theme, resolve màu cố định/theo theme/hex + tương phản ≥ 4.5, `cardTravel` 360×740), `tests/autoscroll.test.ts` (mặc định, migration kẹp 1500, chờ/tăng tốc/tốc độ, flow dwell + countdown 2s, steady, cuối trang, hạ cánh, 7 lý do dừng **không tự tiếp tục**, drift, khách cuộn lúc chờ, Tiếp tục không delay, tab ẩn/resize tự chạy lại, blocker, phím bổ trợ), `tests/particles-soft-fireworks.test.ts` (vùng dịu 0.3/+8px/≤ 4 vùng, loại trừ vẫn thắng; pháo hoa không đè tiêu đề/ô số qua 500 mẫu, dải 18%/82%, bán kính mobile, bảng màu sáng/tối).
- Sửa: `migrations.test.ts` (startDelayMs kẹp 1500).
- E2E mới: guest "phong bì ngang 360×740" (tên cặp đôi ở trên, "Kính gửi" + tên khách trên mặt phong bì, tỉ lệ ngang, tổng 1.6–2.4s, **tua từng 50ms: thẻ không ra ngoài 360×740**, kết thúc ở giữa màn), guest "tự cuộn" (chạy sau khi mở → wheel dừng + toast + không tự tiếp tục → nút Tiếp tục chạy lại → chạm dừng), admin "mẫu phong thư" (chọn Song Hỷ → preview `.cover[data-env="song-hy"]`, mũi tên + Enter chọn Ren & hoa, Phát lại, Phát lại tự cuộn → khung preview cuộn). Reduced-motion: thêm kiểm tự cuộn không tự chạy.
- Sửa e2e cũ: selector tên khách `.env-guest, .cv-guest`; test hạt nền đo vị trí hạt + vùng form **trong cùng 1 lần evaluate** và chờ cuộn đứng yên (trước đây 2 lần evaluate riêng nên lệch khi trang còn cuộn mượt - flaky 2/3 khi tự cuộn vừa dừng).

## 7. Lệch so với spec (kèm lý do)

1. **Hình học phong bì chỉnh nhẹ** so với SVG 3.2: túi bắt đầu từ góc (y=.5) và nắp dốc hơn túi (mũi nắp y≈134) để nắp luôn phủ mép túi. Bản gốc có khe hình nêm dọc 2 cạnh nắp làm lộ thẻ bên trong (thấy rõ dải trắng ở song-hy/kraft). Song Hỷ: túi vát nông đổi tương ứng. Cần designer duyệt.
2. **Thẻ bên trong** rộng 92% × cao 90% phong bì (spec ghi "cao 128%, nằm hẳn trong bao" - không thể đồng thời). Khoảng rút = `min(62% chiều cao thẻ, mép trên - 8px)`, điểm về giữa màn tính theo viewport.
3. **Timeline:** thêm bước z-index thẻ 2→7 tại mốc "bao rơi" + 80ms và bao mờ nhanh hơn (35% ở 40% thời lượng) - nếu không thẻ bị túi đang mờ che khi về giữa màn.
4. **Phần "Nhiều" của các mẫu chưa làm:** 12 hạt bụi vàng ở seal (classic), burst `red-paper` (song-hy), 6/12 cánh hoa rơi (lace), 16 hạt gold-dust (velvet). Lý do: canvas hạt được tạo sau khi mở và ẩn khi cover đang hiện; `red-paper` chưa có module (v4). Ở cấp Nhiều các mẫu chạy như Vừa.
5. **Poster admin** là SVG giản lược dựng từ cùng hình học (không chạy code skin của guest); mini-animation khi hover/focus là lật nắp chung cho mọi mẫu, không phải hoạt ảnh riêng từng skin.
6. Màu **"Theo theme"** của kraft/song-hy/velvet không có trong spec - frontend chọn: kraft = `mix(accent 30%, surface)` + dây màu primary; song-hy = giấy primary, viền accent, mực on-primary; velvet = giấy surface, viền/lót primary. Lace "nền theme pha hồng" = `mix(accent-2 16%, surface)`.
7. Tự cuộn: không làm vòng tiến độ quanh nút (spec ghi "không bắt buộc"); trạng thái "đang chờ bắt đầu" hiển thị như đang chạy (khách bấm Dừng được trước khi bắt đầu).
8. R18 chọn phương án "luôn hiện chip tĩnh"; R21 dùng heuristic số dòng/ký tự thay vì đo layout.
9. Guest: `cover.guestPrefix` mặc định "Kính gửi:" hiện trên phong bì **bỏ dấu ":"** (ghi như địa chỉ).
10. Sửa kèm (lỗi có sẵn ở v2): mọi công tắc trong admin bị mất rãnh (`.field > label { display:block }` đè `.toggle { display:inline-flex }`) - sửa bằng selector cụ thể hơn trong `admin.css`.

## 8. Cần kiểm tra tay

- **Designer duyệt visual 6 mẫu** (đóng + giữa lúc mở) và chỉnh hình học ở mục 7.1; ảnh chụp tạm ở scratchpad phiên (không commit). Nếu muốn xem: đổi `cover.envelope.style` trong `public/content/config.json` (hoặc chọn trong admin) rồi `npm run dev`.
- **iOS Safari / webview Zalo, Facebook, Messenger:** nắp lật 3D (`rotateX` + `backface-visibility`), animate `translate` riêng (Safari ≥ 14.1; cũ hơn thì bao chỉ mờ không rơi), animate `z-index`; feTurbulence của kraft khi animate.
- **Tự cuộn trên máy thật:** chạm dừng ngay, quán tính cuộn iOS sau khi dừng, thanh địa chỉ co giãn (pause/resume 500ms không bị tính là khách cuộn), tab ẩn/hiện, máy yếu (Android tầm thấp), tốc độ 45px/s có dễ đọc không.
- **R02** tương phản section Cảm ơn trên vùng **sáng nhất của ảnh thật** (ảnh mẫu là SVG tối).
- Pháo hoa ở theme sáng (sao 4 cánh) và Son Đỏ; hạt mờ 0.3 khi bay qua tên ở hero có ảnh thật.
- Desktop 1366×680 / 1440×900: phong bì 560px co theo chiều cao.

## 9. File

- Mới: `src/shared/envelope.ts`, `src/guest/cover/skins/{kit,classic,kraft,song-hy,lace,minimal,velvet}.ts`, `src/guest/autoscroll/{core,autoscroll}.ts`, `src/admin/editor/envelope-gallery.tsx`, `tests/{envelope-schema,autoscroll,particles-soft-fireworks}.test.ts`.
- Sửa: schema (`enums`, `types`, `defaults`, `merge`, `migrations`, `schema-meta`, `capabilities`, `theme/presets`, `theme/resolve`), guest (`cover.ts`, `open-registry.ts`, `styles/envelope.ts`, `bootstrap.ts`, `context.ts`, `icons.ts`, `floating.ts`, `sections/{basic,common,countdown,gift,guestbook}.ts`, `effects/particles/{field,geometry}.ts`, 3 loại hạt, `burst/fireworks.ts`, 4 file CSS, 3 sprite ornament), admin (`routes/effects.tsx`, `draft/ops.ts`, `admin.css`), build (`inject-config-og.ts`, `.size-limit.cjs`), `public/content/config.json`, 3 file test cũ.
- File > 200 dòng cần review kỹ: `src/guest/cover/cover.ts` (229), `src/guest/autoscroll/core.ts` (206), `tests/autoscroll.test.ts` (205).
- Không sửa `request/decisions/solution/design/status/design-review-v1.md` (thay đổi đang có ở `design.md`, `status.md` và file `design-review-admin-v2.md` là của người khác).
