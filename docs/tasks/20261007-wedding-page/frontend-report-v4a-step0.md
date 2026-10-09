# Frontend report - v4a Bước 0 (khung chung)

> Task `20261007-wedding-page` · frontend-developer · 2026-10-09 · branch `claude/keen-albattani-k0ds71` (làm trực tiếp, không worktree).
> Spec: `solution-v4a-2bc.md` mục 0 (0.1–0.11) + mục 3.2/3.3. Vùng đánh dấu phục vụ v4a-1 (`solution.md` Rev 5 mục 10) và v4a-2a (`design-v4a-2a.md` Phụ lục A). Không thêm logic của đợt nào. `STAGE` giữ nguyên.

## Tiến độ

| # | Việc | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 0.1 | Capability theo đợt | `src/shared/capabilities.ts`, `src/shared/caps/*` | xong | Tạo `caps/types.ts` (`CapsAddon`, vùng `[v4a-1]`/`[v4a-2a]` cho key mới) + 4 file đợt `CAPS_V4A_*: CapsAddon = {}`. `capabilities.ts`: hàm `cap(key, base, fallback)` ghép gốc + add-on (giữ thứ tự, bỏ trùng); vùng `[v4a-1] keys`, `[v4a-2a] keys` cuối object. `STAGE` giữ nguyên. Typecheck xanh. |
| 0.2 | `open-styles.ts` + test | `src/shared/open-styles.ts`, `tests/open-styles.test.ts` | xong | `OPEN_META` đủ 17 id (envelope 1950 / card-flip 1700 / fade-zoom 700 / none 200 ms theo module hiện tại; 13 id theo bảng 1.1), `effectiveOpen()` thuần (máy yếu + Cao -> `{ id: 'fade-zoom', mode: 'light' }`). `tests/open-styles.test.ts` 192 case (17 id × 5 trạng thái × lowEnd + meta). Admin `OPEN_COST` bỏ, badge 'Nặng ⚠' đọc `OPEN_META[real].cost === 'high'` (chỉ light-gather, như cũ). |
| 0.3 | Registry burst | `effects/burst/registry.ts`, `petals.ts`, `service.ts` | xong | `burst/registry.ts`: `BurstOpts`, `BurstModule`, `BURST_LOADERS = { petals }`, `playBurst` (id lạ -> petals), `scheduleOnOpenBurst` (đăng ký `EffectRegistry 'burst'`; rIC timeout 300 ms, Safari `setTimeout`; bỏ nếu module về > 1000 ms). `petals.ts` đổi sang `export function play(field, o): number` (hỗ trợ `origin`). `service.afterOpen()` gọi `scheduleOnOpenBurst` (giữ điều kiện `ctx.preview.burst`). Test mới `tests/burst-registry.test.ts` (7 case, spec 4.1 dòng Đợt 0). |
| 0.4 | Hook over-cover | `particles/field.ts`, `styles/fx.css` | xong | `field.setOverCover(on)` + `blocked()` = `overCover ? document.hidden : fxBlocked()` dùng trong `ensureRunning/syncPause`; `target()` = 0 khi `!ctx.opened`. CSS `.cover-on .fx-canvas.is-over-cover { opacity: 1; z-index: calc(var(--z-cover) + 1) }` trong `fx.css`. Chưa ai gọi `setOverCover` (2b dùng) -> không đổi hành vi. `npm test` 23 file / 606 test xanh. |
| 0.5 | Tách `effects.tsx` thành khối | `admin/editor/routes/effects.tsx`, `admin/editor/fx/*`, `admin.css` | xong | `routes/effects.tsx` chỉ còn bố cục + dòng ghi chú capability. Khối mới (fragment, không thêm DOM): `fx/intensity-block.tsx`, `fx/open-block.tsx`, `fx/particles-block.tsx` (gồm 'Sau khi mở'), `fx/reveal-block.tsx`, `fx/micro-block.tsx` (chi tiết nhỏ + nâng cao), `fx/autoscroll-block.tsx`. Thêm `fx/ctx.ts` (`FxCtx` + `resolvedOf`): mọi khối nhận `{ fx }` để đợt sau không phải đổi chữ ký props trong route. `envelope-gallery.tsx` chuyển (git mv) vào `fx/` (bảng 3.2). Rule `.omini*` + keyframes `o-*` + reduced-motion chuyển sang `fx/open-mini.css` (import từ open-block). Giữ nguyên testid/thứ tự DOM. |
| 0.6 | Chunk `open-kit` | `vite.config.ts` | chưa | |
| 0.7 | Plugin phân loại chunk + preload | `scripts/vite-plugins/inject-config-og.ts` | chưa | |
| 0.8 | size-limit nhóm mới | `.size-limit.cjs` | chưa | |
| 0.9 | `resolve.test.ts` không phụ thuộc capability | `tests/resolve.test.ts` | chưa | |
| 0.10 | Helper e2e | `tests/e2e/fx-helpers.ts` | chưa | |
| 0.11 | Vùng đánh dấu | xem mục 3.3 | chưa | |

## Kích thước (gzip)

| Mục | Trước (v2.3) | Sau |
|---|---|---|
| Guest JS ban đầu | 31.22 KB | |
| Guest CSS ban đầu | 11.36 KB | |
| Admin JS ban đầu | 73.35 KB | |

## Kiểm tra

(chưa chạy)

## Lệch spec

(chưa có)
