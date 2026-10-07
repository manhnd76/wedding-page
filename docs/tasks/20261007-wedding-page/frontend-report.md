# Frontend report - 20261007-wedding-page - giai đoạn v1

> Người thực hiện: frontend-developer · Ngày: 2026-10-07 · Branch: `feat/20261007-wedding-page-v1` (chưa commit, theo yêu cầu).
> Phạm vi: solution.md "Kế hoạch triển khai" dòng **v1** (khung + schema + guest app lõi). Admin (v2) và Apps Script server (v3) KHÔNG làm.

## 1. Cấu trúc thư mục thực tế

```
wedding-page/
├── package.json, package-lock.json, tsconfig.json, vite.config.ts, vitest.config.ts, playwright.config.ts, .size-limit.cjs
├── index.html                    # entry guest (plugin inject config/resolved/CSS vars/@font-face/OG/preload)
├── admin/index.html              # entry admin: trang giữ chỗ tĩnh (admin là v2)
├── README.md, CLAUDE.md          # lệnh + quy ước của dự án (CLAUDE.md global Angular không áp dụng)
├── scripts/
│   ├── vite-plugins/inject-config-og.ts   # plugin build (+ middleware dev phục vụ font/ornament, tự reload khi sửa config.json)
│   └── gen-placeholders.mjs               # sinh ảnh SVG + nhạc WAV mẫu (không tải internet)
├── public/
│   ├── _headers (CSP + cache; hash style-src điền lúc build), _redirects (/invite/*), favicon.svg
│   └── content/ config.json (mẫu tiếng Việt) · images/{hero,couple,album,thankyou}/*.<hash8>.svg · audio/sample-chime.<hash8>.wav
├── src/shared/                   # dùng chung guest / plugin build / admin (v2)
│   ├── config/ enums.ts types.ts defaults.ts migrations.ts merge.ts
│   ├── theme/ presets.ts (12 preset) oklch.ts derive.ts contrast.ts resolve.ts
│   ├── fonts/registry.ts (28 family + 5 font preset)
│   ├── sections/meta.ts (meta 14 section + planSections)
│   ├── vietqr/ payload.ts banks.ts
│   └── capabilities.ts guest-name.ts ics.ts assets.ts
├── src/guest/
│   ├── main.ts bootstrap.ts context.ts dom.ts icons.ts
│   ├── cover/ cover.ts anim.ts open-registry.ts (fade-zoom + none trong entry) styles/{envelope,card-flip}.ts (lazy)
│   ├── sections/ basic.ts (hero, couple, families, announcement, timeline, loveStory, thankyou, footer)
│   │            events.ts countdown.ts album.ts lightbox.ts(lazy) gift.ts gift-sheet.ts(lazy) guestbook.ts rsvp.ts common.ts
│   ├── effects/ intensity.ts (MATRIX) service.ts reveal.ts registry.ts perf-probe.ts
│   │            particles/ field.ts geometry.ts kind.ts types.ts types/{petal-rose,heart,petal-peach,gold-dust,firefly}.ts (lazy)
│   │            burst/ petals.ts (lazy) fireworks.ts (lazy) fireworks-trigger.ts
│   ├── floating/floating.ts  music/player.ts  integrations/apps-script.ts (lazy)
│   ├── theme-assets/ornaments/{classic-line,traditional,luxe}.svg   # sprite placeholder, emit có hash
│   └── styles/ tokens.css base.css cover.css sections.css fx.css
└── tests/  *.test.ts (vitest, 9 file) · e2e/guest.spec.ts (Playwright) · fixtures/wedding-site-config.js (bản sao đọc-only)
```

## 2. Lệnh chạy

| Lệnh | Việc |
|---|---|
| `npm install` | cài dependency (Node 20.19 OK) |
| `npm run dev` | dev server :5173; sửa `public/content/config.json` -> trang tự reload với theme/font mới |
| `npm run build` | `tsc --noEmit` + `vite build` + `size-limit` (vượt ngân sách -> exit ≠ 0) |
| `npm run preview` | xem `dist/` ở :4173 |
| `npm test` | vitest (unit) |
| `npm run test:e2e` | Playwright (cần build trước; dùng Chrome đã cài, `PW_CHANNEL=msedge` nếu muốn Edge) |
| `npm run typecheck` / `npm run lint` | tsc (chưa có ESLint - không nằm trong danh sách dependency được phép) |
| `npm run size` | chỉ size-limit |
| `npm run placeholders` | sinh lại ảnh/nhạc mẫu |

Build thử một config khác mà không đụng file thật: `WP_CONFIG_PATH=đường/dẫn/config.json npx vite build --outDir <thư-mục>`.

## 3. Dependency đã thêm

| Package | Loại | Kích thước | Ghi chú |
|---|---|---|---|
| `uqr@0.1.3` | runtime (duy nhất) | 7.8 KB gz cả gói; chunk lazy thực tế **3.81 kB gz** (tên chunk `dist-*.js`) | Sinh ma trận QR, chỉ tải khi mở sheet mừng cưới. MIT, unjs |
| `vite@8.3.3` | dev | - | |
| `typescript@5.9.3` | dev | - | không dùng TS 7 (bản native mới) cho an toàn |
| `vitest@4.1.11` | dev | - | vitest 5 yêu cầu Node 22 |
| `size-limit@12.1.0`, `@size-limit/file@12.1.0` | dev | - | size-limit 14 yêu cầu Node 22 |
| `@playwright/test@1.63.0` | dev | ~14 MB (playwright-core) | KHÔNG tải browser: chạy bằng Chrome/Edge đã cài (`channel`) |
| `@types/node@20` | dev | - | |
| `@fontsource/*` × 14 | dev (asset build) | 22 MB trong node_modules; chỉ file woff2 của 3 family đang dùng được emit | playfair-display, great-vibes, be-vietnam-pro, noto-serif-display, charm, imperial-script, mulish, cormorant-garamond, pinyon-script, lora, dancing-script, quicksand, fraunces, alex-brush (= font của 3 theme v1 + 5 font preset). 14 family còn lại của registry chưa cài -> capability fallback |

Không thêm jsdom/happy-dom: mọi unit test chạy được ở môi trường `node` (logic DOM được tách thành hàm thuần; phần DOM kiểm bằng Playwright).

## 4. Kết quả thật

### Build (`npm run build`, exit 0)
```
dist/index.html                  17.00 kB │ gzip:  5.38 kB
dist/assets/main-*.css           36.64 kB │ gzip:  8.89 kB
dist/assets/main-*.js            66.89 kB │ gzip: 23.49 kB
✓ built in ~0.7s
```

### size-limit (0 FAIL / 24 mục, đơn vị kB = 1000 byte, gzip)
| Mục | Kích thước | Ngân sách |
|---|---|---|
| **JS ban đầu** (entry + `envelope` + `petal-rose`) | **24.09 kB** | ≤ 60 kB |
| **CSS ban đầu** | **8.82 kB** | ≤ 25 kB |
| openStyle `envelope` / `card-flip` | 0.51 / 0.32 kB | ≤ 4 kB |
| 5 module hạt | 0.21 - 0.29 kB | ≤ 1.5 kB |
| lazy lớn nhất: `resolve` 4.83, `merge` 4.47, `migrations` 3.83, QR (`dist`) 3.81, `field` (ParticleField) 3.73, `gift-sheet` 2.91 kB | | ≤ 15 kB |

### Trọng lượng trang đo bằng Chrome (390×844, config mẫu, không nén)
- Màn cover (trước khi chạm): tổng 392.6 KB, **font 162.4 KB / 8 file** (ngân sách font ban đầu ≤ 180 KB), nhạc mẫu preload 107.7 KB (không tính).
- Sau khi mở: font 201.8 KB / 12 file (3 family × đủ weight × latin + vietnamese). `dist/` tổng 651 KB.

### Unit test (`npm test`): **9 file, 238 test pass** (~1 s)
| File | Nội dung |
|---|---|
| `guest-name.test.ts` (16) | ví dụ chuẩn solution 8.2, `%XX` = Unicode thô, `--`, chặn `<script>`, NFD->NFC, zero-width, cắt 60 grapheme không tách dấu, `/invite/` ưu tiên, path decode lỗi, template |
| `migrations.test.ts` (9) | đọc **`E:\claudecode\wedding-site\data\config.js` (bản gốc)** không eval; **không mất dữ liệu**: duyệt >100 giá trị lá, mọi giá trị có trong config mới (hoặc biến đổi được kiểm riêng, hoặc thuộc `V0_DROPPED_FIELDS` có lý do); map theme cũ, petals, coverUnlock |
| `merge.test.ts` (10) | merge sâu/mảng thay thế, enum sai -> mặc định + warning, bù field phần tử mảng, kẹp số, NFC toàn config |
| `resolve.test.ts` (22) | quy tắc `"theme"` cho **mọi nhóm** ở cả 12 preset; giá trị riêng thắng; font field > preset > theme; đổi theme giữ phần đã chỉnh; capabilities v1 (fallback + 7 warning) |
| `derive.test.ts` (19) | **12 preset khớp bảng 1.6.3 ±0.05 (8 cột)**; **500 primary ngẫu nhiên × sáng/tối đều ≥ 4.5:1** (primary/bg, primary/surface, onPrimary/primary, text, muted trên bg + surface); OKLCH khứ hồi |
| `intensity.test.ts` (118) | **từng ô MATRIX (21 hiệu ứng × 5 cột off/low/medium/high/reduced)** đối chiếu design 5.3 + 5.10; hạ cấp máy yếu; reduced-motion; nút khách; trần hạt 40/12; burst; reveal theo cấp |
| `vietqr.test.ts` (10) | CRC16 `"123456789"=29B1`; cấu trúc EMVCo/NAPAS (00/01/38{A000000727, BIN+STK, QRIBFTTA}/53/58/63) khớp chuỗi tính tay; QR động + nội dung ASCII; bảng BIN |
| `fireworks.test.ts` (12, **fake timers**) | ngưỡng ≥50% + giữ 400ms; lướt nhanh không bắn; **re-arm chỉ khi < 10%**; đứng yên không lặp; **cooldown 15s tính từ lúc chùm cuối tắt, không xếp hàng**; chặn khi tab ẩn/overlay/gõ; wedding-day 1 lần/phiên; gốc nổ không đè 4 ô số |
| `sections-plugin.test.ts` (22) | đánh số/nền xen kẽ/divider/tự ẩn section rỗng/sắp xếp; **plugin build: 3 theme + 5 font preset sinh đúng CSS vars + @font-face**; giá trị chưa hỗ trợ -> fallback + warning; ics; hình học ParticleField (vùng loại trừ, mật độ có trọng số, 2 hạt/giây, fade 200ms) |

### E2E (`npm run test:e2e`, Chrome 154 đã cài): **8/8 pass**
1. Cover hiện "Gia đình anh Mạnh" từ `?to=`, chạm mở, đúng thứ tự + số thứ tự section, **0 lỗi console**.
2. `/invite/<slug>`, link có ký tự HTML, `?to=` rỗng.
3. **Hạt nền cả trang: 0 hạt có alpha > 0.01 nằm trong form lời chúc / danh sách lời chúc / khối RSVP / thẻ sự kiện** (đọc vị trí qua hook debug `?debug=fx`, 75 mẫu/lần, chạy lặp 3 lần đều pass) + **canvas dừng rAF khi focus ô nhập, chạy lại sau blur + 1.5s**.
4. Sheet mừng cưới: VietQR vẽ bằng canvas, đổi tab, Esc đóng, hạt dừng khi sheet mở.
5. Lightbox mở/đổi/đóng. 6. reduced-motion: không tạo canvas. 7. Sổ lưu bút local: validate, chip gợi ý, gửi, chèn đầu, toast.
8. **CSP production** (đọc từ `dist/_headers`, gắn vào response HTML): 0 vi phạm, theme inline áp dụng nhờ sha256.

### Sửa `config.json` tay -> build lại (đã chạy thật)
| Biến thể | Kết quả |
|---|---|
| `dem-nhung` + `card-flip` + `high` | `data-mode="dark"`, Playfair/Imperial Script/Mulish, khung deco-cut, hạt gold-dust + firefly, card-flip chạy; 0 lỗi console |
| `son-do` + `fade-zoom` + bỏ families + đưa countdown lên đầu + scaleStep 1 + album grid | ornament truyền thống, hoa đào, thứ tự/số section đúng; 0 lỗi console |
| giá trị chưa có (`bien-dao`, `origami`, hạt `snow/sparkle`, `moon-dance`, `cinematic`, `confetti`, `odometer`, section `vendor`) | build OK, 8 cảnh báo `[config]` lúc build; trang chỉ có `console.warn` tương ứng, **0 error** |
| Dev server | sửa `preset` trong `config.json` -> HTML dev đổi `data-theme` ngay (full reload) |

## 5. CSP `style-src` - đã chốt

**Chọn: `style-src 'self' 'sha256-<hash>'`** (giả định mặc định của solution "Còn mở" 1).
- Plugin tính SHA-256 của đúng `<style id="wp-theme">` (CSS vars theme + `@font-face` 3 family) và thay `__WP_STYLE_HASHES__` trong `dist/_headers` lúc build. Bản build hiện tại: `'sha256-rQfnNZhNkrinN5Vza3+GqDckJ9zSUETz0DAZd5PFjDQ='`.
- Không có `'unsafe-inline'`. JS chỉ đổi style qua CSSOM (`style.setProperty`) và WAAPI - không bị CSP chặn; helper `h()` chặn hẳn thuộc tính `style` trong markup.
- Đã kiểm thật bằng e2e số 8. Webview cũ không hiểu hash: thẻ style bị chặn nhưng `tokens.css` (file ngoài) vẫn có bảng màu Trầm Vàng dự phòng -> trang vẫn đọc được, chỉ mất màu/font theme riêng. Chưa thấy cần lùi về `'unsafe-inline'`.
- `/admin/*` dùng `! Content-Security-Policy` để thay (không cộng dồn) CSP guest.

## 6. Tiêu chí v1

| Tiêu chí (solution dòng v1 + yêu cầu giao việc) | Trạng thái |
|---|---|
| `npm install`, `npm run build`, `npm test` chạy được và pass | ✅ |
| size-limit: JS ban đầu ≤ 60 kB, CSS ≤ 25 kB (vượt -> build fail) | ✅ 24.09 / 8.82 kB |
| Scaffold Vite multi-page + TS strict (`strict`, `noUncheckedIndexedAccess`) | ✅ |
| `src/shared` đủ: types, enums 5.6, defaults 5.5, migrations v0->v1, merge, registry 12 preset, resolver, derive OKLCH sáng+tối, contrast, font registry 28 family, guest-name, section meta, ics, vietqr, capabilities | ✅ (`schema-meta.ts`, `validate-rules.ts` thuộc admin -> v2) |
| Guest: cover/phong bì + tên khách `?to=` và `/invite/` | ✅ |
| 14 section | ✅ (RSVP: xem lệch #8) |
| Floating UI (nút nhạc, pill hành động nhanh + menu, scroll-top, toast) | ✅ (desktop chưa đổi thành thanh điều hướng - lệch #9) |
| Lightbox, countdown `flip` + `simple` + milestones, map bấm mới tải, gift sheet + VietQR, music player (play() trong cử chỉ) | ✅ |
| Theme `tram-vang` ★ / `son-do` / `dem-nhung`; kiểu mở `envelope` ★ / `card-flip` / `fade-zoom` / `none` | ✅ |
| `ParticleField` scope=all + 5 loại + 4 lớp bảo vệ; burst `petals` + `fireworks-soft` every-view | ✅ |
| Reveal `soft` + `gentle`; micro `btn-press`, `cta-breathe`, `copy-morph`, `segmented-slide` | ✅ |
| Ma trận 4 cấp + tự hạ cấp (máy yếu + FPS < 45) + reduced-motion + nút khách | ✅ |
| Plugin `inject-config-og` (config + resolved + CSS vars + OG + modulepreload/preload) | ✅ |
| `_redirects`, `_headers` (CSP chốt), `size-limit` | ✅ |
| Unit test: guest-name, migrations (wedding-site/config.js không mất dữ liệu), merge, resolve, derive (±0.05 + 500 mẫu), intensity, vietqr CRC, pháo hoa fake timers | ✅ |
| Sửa config.json -> build lại -> đổi đúng theme/font/section; giá trị chưa hỗ trợ -> fallback, không lỗi console | ✅ (mục 4) |
| Playwright: 0 hạt trong vùng form, canvas dừng khi focus input | ✅ |
| Dữ liệu mẫu tiếng Việt + ảnh/nhạc placeholder tự sinh | ✅ |
| QR quét được bằng ≥ 2 app ngân hàng với tài khoản thật | ⏳ cần kiểm tra tay |
| Lighthouse mobile (LCP < 2.5 s, CLS < 0.05) trên CF Pages | ⏳ cần kiểm tra tay |
| ui-ux-designer duyệt visual 3 theme (+ asset ornament thật) | ⏳ cần người |
| `npm run build` ra static chạy trên **CF Pages** | ⏳ chưa deploy (không được phép); `vite preview` chạy đúng |

## 7. Lệch so với solution.md / design.md (kèm lý do)

1. **Phiên bản tool**: Vite 8, vitest 4, size-limit 12, TS 5.9 - do Node 20.19 (vitest 5, size-limit 14, jsdom 30 yêu cầu Node 22).
2. **Font: bỏ subset `latin-ext`** (solution 9.3 ghi latin + latin-ext + vietnamese). Lý do: `unicode-range` của latin-ext chồng lên vietnamese (ă đ ơ ư, ỳ ỵ ỷ ỹ) nên Chrome tải thêm 6 file ~115 KB mà tiếng Việt đã phủ đủ bằng latin + vietnamese. Đo thật: 318 KB -> 202 KB.
3. **Landing `display:none` tới lúc chạm mở** (solution 7 bước 2 ghi landing render sẵn dưới cover với `inert`). DOM vẫn dựng sẵn và `inert`, chỉ chưa layout; bỏ ngay trong handler chạm (animation mở chạy trên compositor). Lý do: nếu layout sẵn, trình duyệt tải luôn font của mọi section -> 202 KB > ngân sách 180 KB; nay màn cover chỉ tải 162 KB. `content-visibility:hidden` đã thử nhưng Chrome vẫn tải font.
4. **CSS khung ảnh/divider/texture/kiểu mở của v1 gộp vào CSS chính** thay vì file riêng import động theo giá trị (9.1 mục 1). Lý do: chỉ có 3 khung, 5 divider, 2 texture, 2 kiểu mở, tổng CSS mới 8.8 kB; tách file sẽ thêm request mà không lợi. Nên tách khi v4 thêm 9 theme.
5. **Guest không chạy lại migrate/merge khi có config inline** (plugin đã inline config đã merge); chỉ lazy import khi phải fetch `config.json`. Tiết kiệm ~8 kB JS ban đầu. Cảnh báo merge (vd section type lạ) in lúc build và vẫn hiện ở console guest.
6. **Ornament sprite** 3 bộ (`classic-line`, `traditional`, `luxe`) là **placeholder do frontend vẽ** (chờ ui-ux-designer). Không `preload` sprite (Chrome cảnh báo "preloaded but not used" với `<use href>`).
7. **Pháo hoa**: design ghi thời lượng ≤ 2.4 s nhưng 5 chùm cách nhau ≥ 600 ms. Hiểu "≤ 2.4 s" là khung bắn (chùm cuối bắn ở 2.4 s), mỗi chùm sống ~1 s -> show kết thúc ~3.4 s ở cấp Nhiều; cooldown 15 s tính từ lúc đó.
8. **RSVP**: không có `appsScriptUrl` -> khối liên hệ "Gọi <SĐT>" (đúng solution 8.7). Có URL -> form đầy đủ + client Apps Script tối giản (lazy) để form dùng được; micro `rsvp-success`, `choice-card`, `stepper-bump`, confetti `onRsvp`, `wish-fly` là **v3**, chưa làm. Sổ lưu bút: local (localStorage) hoặc Apps Script; poll khi section trong viewport.
9. **Chưa làm ở v1** (đúng phân kỳ hoặc ghi rõ): preview-bridge `?preview=1` (v2); `autoScroll` (field giữ trong config, mặc định tắt, chưa có runtime); `parallax-layers`, `photo-tilt`, `btn-shine`, `name-sparkle`, `scroll-progress` (v4; dòng ma trận có sẵn); thanh điều hướng ngang trên desktop (design 7.1) - desktop vẫn dùng pill; phần "Nhiều" (lấp lánh) của `envelope`; kiểu mở `full+` hiện chạy như `full`. Parallax ảnh hero/thank-you 0.15 ở cấp Nhiều đã có.
10. **`suggest.burstOnOpen`** của 11 preset ngoài Trầm Vàng: design 1.6.4 không có cột này -> frontend tự chọn theo mood (son-do `red-paper`, dem-nhung/luc-bao `gold`, muc-giay `none`...). Cần ui-ux xác nhận ở v4. Ở v1 giá trị chưa có module rơi về `petals` (im lặng vì đến từ preset).
11. **Màu hạt `"theme"`**: `petal-peach` và `firefly` dùng màu tự nhiên (hồng đào, vàng đom đóm) thay vì accent - theo mô tả design 5.7.
12. **Migrator v0**: ảnh cũ là chuỗi -> `ImageRef` với `w/h = 0` (chưa biết kích thước; admin v2 đo lại). Danh sách field cố ý bỏ + lý do nằm ở `V0_DROPPED_FIELDS` (`album.folder`, `*.storageKey`, `guestbook.mode`, `petals.density`, `petals.colors[1..]`, `scrollReveal.*`, `coverUnlock.enabled`, `music.volume`, `invitation.weekday`). `coverUnlock.unlockAnimation: "fade-zoom"` của config cũ được giữ (đúng quy tắc migrator), nên import file cũ sẽ ra kiểu mở `fade-zoom` chứ không phải phong bì.
13. **Nhạc mẫu** là WAV tự sinh (arpeggio 10 s, 108 KB), không phải mp3/m4a; ảnh mẫu là SVG. `meta.ogImage` mẫu = null (OG cần ảnh JPEG thật + `meta.siteUrl`).
14. **`prefers-reduced-motion`**: khi khách bấm "Bật hiệu ứng", hiệu ứng JS (hạt, pháo hoa, reveal) bật lại, nhưng media query CSS vẫn rút ngắn transition/animation CSS.
15. **Trần hạt**: hiểu "Nhẹ 8, Vừa 16, Nhiều 28 (trước hệ số), trần cứng 40" -> số hạt = cấp × hệ số loại × hệ số theme × hệ số section, kẹp ≤ 40 (máy yếu ≤ 12).
16. Vùng loại trừ được làm mới cả theo chu kỳ 250 ms (ngoài scroll/ResizeObserver) vì reveal dịch phần tử bằng transform mà không phát sự kiện - lỗi này do e2e phát hiện và đã sửa. Khi đang gõ, canvas được ẩn hẳn (opacity 0) chứ không chỉ dừng, để canvas đứng yên không đè ô nhập khi bàn phím đẩy trang.
17. iOS: nhạc đi qua GainNode để fade; đặt `navigator.audioSession.type = 'playback'` nếu có (tránh nút gạt im lặng tắt tiếng Web Audio).

## 8. Cần kiểm tra tay (không tự khẳng định)

- **VietQR**: quét QR trong sheet bằng ≥ 2 app ngân hàng với **1 tài khoản thật** (sửa `bankBin` + `accountNumber` trong config cục bộ, không commit). Unit test chỉ chứng minh cấu trúc + CRC.
- **Lighthouse mobile** trên Cloudflare Pages (throttle 4G, Moto G Power): LCP < 2.5 s, CLS < 0.05.
- **Deploy CF Pages**: `_redirects` `/invite/*`, `_headers` (cú pháp `!` cho admin, hash CSP), cache immutable.
- **ui-ux-designer**: duyệt visual 3 theme (cover phong bì, card-flip, nền tối), thay 3 sprite ornament placeholder, chuỗi dấu chồng `Nguyễn Thuỳ Linh · Đặng Hữu Phước · Hường · Quỳnh · Ngọc Ẩn · ẦẪỂỖỮ` với Great Vibes / Charm / Imperial Script.
- **Webview Zalo / Facebook / Messenger, Safari iOS, Chrome Android tầm thấp**: nhạc phát sau chạm (kể cả nút gạt im lặng iOS), cover, link có dấu và link mã hoá, tải `.ics`, QR, bản đồ, FPS + tự hạ cấp trên máy thật.
- Thay nhạc mẫu + ảnh mẫu + số tài khoản mẫu (`0123456789`, `9876543210` - dữ liệu giả lấy từ wedding-site) trước khi gửi link.

## 9. Rủi ro còn lại

- **Hash CSP**: mọi chỉnh sửa tay `dist/index.html` sau build sẽ làm lệch hash -> mất màu theme (vẫn đọc được nhờ tokens.css). Luôn build qua `npm run build`.
- **Font**: sau khi mở thiệp tải thêm ~40 KB font (tổng 202 KB). Nếu muốn ≤ 180 KB cả trang: bỏ weight 600 của heading hoặc body (cần ui-ux đồng ý).
- **Web Audio trên iOS / webview**: chưa thử máy thật; nếu có vấn đề, phương án là bỏ GainNode trên iOS (phát thẳng, không fade).
- **`hardwareConcurrency <= 4`** coi là máy yếu: nhiều iPhone báo 4-6 nhân -> có thể bị hạ 1 bậc dù máy mạnh. Ngưỡng theo solution/design; cần xem lại khi thử máy thật.
- **Bảng BIN ngân hàng** (37 ngân hàng) cần rà lại khi có ngân hàng sáp nhập/đổi tên.
- 14 family font còn lại của registry chưa cài `@fontsource` -> chọn chúng sẽ fallback về font Trầm Vàng (có cảnh báo). Cài thêm khi bật theme v4.
- Ornament placeholder và hình phong bì là bản kỹ thuật, chưa phải thiết kế cuối.
