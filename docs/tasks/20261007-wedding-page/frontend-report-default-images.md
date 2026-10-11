# Frontend report: ảnh + bộ hiệu ứng mặc định từ `img/` (task 20261007-wedding-page)

Người làm: frontend-developer. Ngày: 2026-10-11. Branch `feat/20261007-wedding-page-default-images`.
Nguồn: decisions.md "Ảnh mặc định từ /img (2026-10-11)", design-default-images.md §1–5.

## Tiến độ

| Phần | Trạng thái | File | Ghi chú |
|---|---|---|---|
| 0. Đọc tài liệu, tạo report | xong | report này | |
| 1. Tối ưu ảnh | xong | `public/content/images/{hero,couple,thankyou,og,album}/*` (21 file) | Chạy chính `processImage` của admin trong Chrome (xem "Lệnh nén"). Kích thước khớp số designer đo ở §4 |
| 2. Cập nhật config.json + xoá ảnh cũ | xong | `public/content/config.json`; xoá 12 SVG placeholder | Merge patch §5 (RFC 7396). Xem "Xoá ảnh cũ" |
| 3. CSS scrim hero | xong | `src/guest/styles/sections.css` (`.hero-shade`) | Đúng gradient §3.3 (`color-mix(--c-text 85/72/30%)`, trong suốt từ 72%) trong `@supports (color: color-mix(...))` như các chỗ khác của dự án; ngoài `@supports` là fallback rgba đen .8/.68/.28 cho Safari < 16.2 / Chrome < 111 (target build có safari14/chrome87). Luật `[data-mode="dark"] .hero-shade` giữ nguyên (đặc hiệu cao hơn). Desktop ≥1024px vẫn `display:none`. Không inline style (CSP) |
| 4. S4: e2e không phụ thuộc config mẫu | xong (chờ e2e xác nhận) | `tests/e2e/fx-helpers.ts`, `tests/e2e/helpers.ts`, `tests/e2e/guest.spec.ts`, `tests/sections-plugin.test.ts` | Xem mục "S4 / B5" |
| 5. Build / unit / e2e | chưa | | |

## Bảng ảnh

Tất cả trong `public/content/images/`. Crop là pixel trên PNG gốc (§3.1). KB = byte/1024.

| Slot | File nguồn (`img/`) | File đích | Kích thước px | KB | Định dạng · q |
|---|---|---|---|---|---|
| `content.hero.image` (+ lqip, focal .5/.12) | Watercolor Anime Wedding Portrait.png, crop `[80,0,864,1536]` | `hero/le-cuoi-chan-dung.62a019ea.webp` | 864×1536 | 84.0 | WebP .82 |
| `content.couple.groom.photo` | Elegant Groom in a Charcoal Suit.png, crop `[130,40,720,900]` | `couple/chu-re.ce8c566a.webp` | 720×900 | 25.2 | WebP .82 |
| `content.couple.bride.photo` | Serene Anime Bride with Lily Bouquet.png, crop `[150,80,720,900]` | `couple/co-dau.d92a5db7.webp` | 720×900 | 33.7 | WebP .82 |
| `content.thankyou.photo` (focal .36/.2) | Sunlit Park Couple in Anime Style.png, toàn ảnh | `thankyou/cam-on-cong-vien.6ee09bb1.webp` | 1200×1061 | 147.9 | WebP .74 |
| `meta.ogImage` | Anime Vietnamese Wedding Under Red Ribbons.png, crop `[110,70,1300,682]` | `og/og-ruoc-dau.ed1a35af.jpg` | 1200×630 | 143.4 | JPEG .85 |
| album 1 | Red Ribbons | `album/01-ruoc-dau.dba43915.webp` + `-thumb.ffe451dd` | 1536×1024 (thumb 600×400) | 179.5 (46.8) | WebP .82 |
| album 2 | Serene Bride (toàn thân) | `album/02-co-dau.6ee4ab4f.webp` + `-thumb.fc0d2d9e` | 1024×1536 (400×600) | 52.7 (12.3) | WebP .82 |
| album 3 | Joyful Park Piggyback | `album/03-cong-ken.3a4ea6c8.webp` + `-thumb.dc1d55eb` | 1149×1369 (504×600) | 257.7 (72.6) | WebP .82 |
| album 4 | Ghibli Flower Field | `album/04-canh-dong-hoa.9cad470c.webp` + `-thumb.85579919` | 1254×1254 (600×600) | 217.9 (70.2) | WebP .82 |
| album 5 | Elegant Groom (toàn thân) | `album/05-chu-re.87706068.webp` + `-thumb.96372850` | 1024×1536 (400×600) | 39.6 (9.4) | WebP .82 |
| album 6 | Sunlit Park Couple | `album/06-cong-vien.18b56a8b.webp` + `-thumb.803b2347` | 1334×1179 (600×530) | 247.0 (76.4) | WebP .82 |
| album 7 | Watercolor Wedding Portrait (toàn thân) | `album/07-anh-cuoi.ce2e3b0f.webp` + `-thumb.bb99dcb5` | 1024×1536 (400×600) | 90.9 (17.0) | WebP .82 |
| album 8 | Cozy Bunny-Eared Selfie (cuối album) | `album/08-tai-tho.a8132e16.webp` + `-thumb.77166dae` | 1448×1086 (600×450) | 113.2 (31.7) | WebP .82 |

- Bỏ "Watercolor Anime Couple by Lotus Wall" (không xuất file nào). `img/` không bị sửa.
- Tổng `public/content/images/` ≈ 2.0MB (21 file; designer ước ~1.6MB, chênh do album 06 ra 247KB thay vì 202KB ở q .82 - vẫn dưới target 300KB).
- **Ảnh tải lúc đầu** (trang guest): hero 84.0KB (preload `fetchpriority=high`) + lqip inline trong config (1.2KB data URL). Ảnh khác lazy.
- `dominantColor` lấy đúng từ `dominant()` của pipeline (vẽ 1×1 px), nên giống hệt ảnh upload qua admin; một số màu "lạ" (thankyou `#028ebc`, album 1 `#d8292b`) là hành vi sẵn có của pipeline, không chỉnh tay.

## Lệnh nén đã dùng

Không cài thêm gì; dùng Vite + Playwright + Chrome có sẵn, chạy **chính `processImage`** (`src/admin/media/image-pipeline.ts`) nên bậc chất lượng, tên hash, lqip, thumb y hệt admin.

1. Bundle pipeline thành IIFE (config tạm ngoài repo, chỉ `root`, `resolve.alias` `@shared/@guest/@admin`, `build.lib = { entry: src/admin/media/image-pipeline.ts, name: 'Pipe', formats: ['iife'] }`):
   `npx vite build --config <scratch>/vite.pipe.config.mjs` -> `pipe.js` 9.6KB.
2. Script Node (scratch) `run.mjs`: `chromium.launch({ channel: 'chrome' })` (playwright-core của dự án), `page.route('https://pipe.local/**')` phục vụ HTML trống + `img/<file>.png` (origin https để có `crypto.subtle`), `addScriptTag(pipe.js)`, rồi với mỗi job gọi `Pipe.processImage(blob, kind, { crop, name })` và ghi `bytes` (+ `thumb.bytes`) ra `public/<path>`. Job: hero(`hero`), couple(`portrait`), thankyou(`other`, đổi thư mục sang `thankyou/`), og(`og`), album ×8(`album`, không crop).
   `node <scratch>/run.mjs` -> in bảng trên; chạy 2 lần cho cùng hash (encoder Chrome tất định).
3. Merge patch config: script Node `patch.mjs` áp khối §5 với path/w/h/dominantColor/lqip thật.

## Xoá ảnh cũ

Đã xoá 12 file SVG placeholder (do `scripts/gen-placeholders.mjs` sinh): `hero/hero.6c286d3b.svg`, `couple/groom.0b6e8b4a.svg`, `couple/bride.bd35268c.svg`, `thankyou/thankyou.17db1789.svg`, `album/album-0[1-8].*.svg`.
Kiểm trước khi xoá: ngoài config mẫu cũ, chỉ `tests/fixtures/config-heavy-2b.json` / `config-heavy-2c.json` nhắc tới các SVG này; hai fixture đó chỉ dùng để đo ngân sách JS/CSS (`WP_CONFIG_PATH=… vite build && size-limit`), không tải ảnh, nên không ảnh hưởng (không sửa fixture). Unit test chỉ dùng đường dẫn giả (`hero.11111111.webp`...). Các file webp mà designer liệt kê (`cover/serene-anime-bride…`, `couple/elegant-groom…`) **không tồn tại trên nhánh này** (thuộc `cloudflare-feat-v1`).

## S4 / B5: e2e không phụ thuộc kiểu dáng của config mẫu

Vấn đề rộng hơn S4: config mẫu cũ là Trầm Vàng + mọi thành phần "Theo theme" (resolve ra `envelope`/`classic`, không hoạ tiết). Nhiều test ngầm dựa vào đó:
- `guest.spec` "phong bì ngang 360×740" tự skip khi kiểu mở ≠ `envelope` (S4).
- `bootPreview(page, { theme: { preset: X } })` (v4a-1/2a/2b/2c, fx-helpers.spec) gộp lên config mẫu -> giờ kéo theo `texture: paper`, `motif: la-canh` góc, `openStyle: flower-gate` của mẫu (vd v4a-1 T4 "Trầm Vàng mặc định - 0 phần tử .mtf" sẽ fail).
- Test admin chế độ không kết nối đọc `/content/config.json` của bản build làm "bản đang xuất bản": v4a-1 T7 (`motif-follow` checked, "Theo theme · Không dùng", Trầm Vàng Dải viền), v4a-2c P11 (`petal-rose` "· theme"), admin-v22 A07 / admin "mọi mục..." (bấm thẻ theme khi mẫu có phần chỉnh riêng -> hỏi "Giữ / Trọn gói").
- Unit `sections-plugin.test.ts` "son-do -> motif dong-son" (mẫu ghim `la-canh`).

Cách sửa (một nguồn chung, không sửa từng assert):
- `tests/e2e/fx-helpers.ts`: thêm `E2E_STYLE_BASE` (Trầm Vàng, theme/fonts/particles/burst/reveal/cover đều "Theo theme" = kiểu dáng hiệu lực của mẫu cũ) + `e2eBaseConfig()` = mẫu ⊕ base. `bootPreview` dùng `e2eBaseConfig()` thay `sampleConfig()`. (Header file ghi "chỉ thêm ở Bước 0" là quy ước sở hữu khi nhiều FE chạy song song; đợt này 1 FE và được giao sửa e2e.)
- `tests/e2e/helpers.ts`: `useE2eBaseConfig(page)` route `/content/config.json` -> `e2eBaseConfig()`; `fresh()` gọi khi chạy trên bản build (`base` rỗng). Máy chủ dev (:5175) không chặn để test xuất bản/khôi phục đọc lại đúng file đã ghi.
- `tests/e2e/guest.spec.ts`: `useEnvelope` dựng từ `e2eBaseConfig()`; test 360×740 bỏ `test.skip`, gọi `useEnvelope(page, 'classic')` (đúng đường mặc định cũ: Trầm Vàng + phong bì classic), assert `data-env="classic"`.
- `tests/sections-plugin.test.ts`: test son-do đặt rõ `motif` = "theme".
- Các test guest chạy bản build thật (cover, hạt, CSP, album, tự cuộn, E05/E10/E11...) vẫn chạy trên **config mẫu mới** (mau-nuoc + flower-gate) -> đường mặc định mới có độ phủ; các test này vốn không ghim theme (`builtTheme()`, `GUEST = '.env-guest, .cv-guest'`).
