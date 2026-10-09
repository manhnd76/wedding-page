# Frontend report - v4a Bước 0 (khung chung)

> Task `20261007-wedding-page` · frontend-developer · 2026-10-09 · branch `claude/keen-albattani-k0ds71` (làm trực tiếp, không worktree).
> Spec: `solution-v4a-2bc.md` mục 0 (0.1–0.11) + mục 3.2/3.3. Vùng đánh dấu phục vụ v4a-1 (`solution.md` Rev 5 mục 10) và v4a-2a (`design-v4a-2a.md` Phụ lục A). Không thêm logic của đợt nào. `STAGE` giữ nguyên.

## Tiến độ

| # | Việc | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 0.1 | Capability theo đợt | `src/shared/capabilities.ts`, `src/shared/caps/*` | xong | Tạo `caps/types.ts` (`CapsAddon`, vùng `[v4a-1]`/`[v4a-2a]` cho key mới) + 4 file đợt `CAPS_V4A_*: CapsAddon = {}`. `capabilities.ts`: hàm `cap(key, base, fallback)` ghép gốc + add-on (giữ thứ tự, bỏ trùng); vùng `[v4a-1] keys`, `[v4a-2a] keys` cuối object. `STAGE` giữ nguyên. Typecheck xanh. |
| 0.2 | `open-styles.ts` + test | `src/shared/open-styles.ts`, `tests/open-styles.test.ts` | chưa | |
| 0.3 | Registry burst | `effects/burst/registry.ts`, `petals.ts`, `service.ts` | chưa | |
| 0.4 | Hook over-cover | `particles/field.ts`, `styles/fx.css` | chưa | |
| 0.5 | Tách `effects.tsx` thành khối | `admin/editor/routes/effects.tsx`, `admin/editor/fx/*`, `admin.css` | chưa | |
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
