# Frontend report v2.2 - sửa UX admin (design-review-admin-v2)

> Branch `feat/20261007-wedding-page-v2.2` (từ v2.1 f0a6465). Chưa commit. Phiên đầu bị dừng do 429; phiên này tiếp tục từ trạng thái dở dang (không làm lại, không revert), kiểm tra lại toàn bộ và chạy đủ build/test/e2e.

## 1. Kết quả (chạy thật, 2026-10-08)

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | 0 lỗi |
| `npm test` | 19 file, **392/392** pass (v2.1: 368) |
| `npm run build` | exit 0, mọi ngân sách size-limit đạt |
| `npm run test:e2e` | **26/26** pass (2.3 phút; 7 test mới trong `tests/e2e/admin-v22.spec.ts`) |

Kích thước (gzip): guest JS ban đầu 30.52/60 kB · guest CSS 11.01/25 kB · **admin JS ban đầu 73.45/80 kB** (v2.1: 67.75, +5.7 kB vì bảng nhãn `@shared/labels` nằm trong bundle đầu qua `diff.ts`, cộng bộ icon SVG và `status.ts`) · admin CSS 6.43/10 kB · route lười lớn nhất là effects 5.55/15 kB.

## 2. Bảng A01-A24

| ID | Trạng thái | Ghi chú |
|---|---|---|
| A01 | Đã sửa (v2.1), xác nhận | e2e đo `.toggle-track` rộng 44px. Thêm chữ "Bật/Tắt" (`.toggle-state`) cạnh mọi công tắc để trạng thái không chỉ dựa vào màu |
| A02 | Đã sửa | `editor/status.ts` `statusOf()` dùng chung cho top bar và thẻ Tổng quan. Chưa có `publish.at` -> "Chưa xuất bản lần nào" (kèm "· N thay đổi trong nháp"). Chế độ Download -> "Nháp trên máy này" / "Có N thay đổi chưa tải gói" / "Đã tải gói xuất bản · giờ" (sau khi tải .zip). Unit + e2e |
| A03 | Đã sửa | Top bar mobile: nút icon ↶ 44×44 `aria-label="Hoàn tác"` (`data-testid=undo-btn`) bên trái nút xuất bản, tắt khi `!canUndo`. Tab Thêm có "Làm lại" và vẫn giữ "Hoàn tác tất cả". Nút xuất bản mobile rút gọn thành "Tải gói" / "Xuất bản". e2e 390×844 |
| A04 | Đã sửa | < 768: không khung điện thoại, không nút 375/414/Máy tính; iframe phủ hết chỗ trống. Toolbar 1 hàng `[↻ Phát lại] [Bỏ qua cover] [⋯]`; menu ⋯ chứa 0.5x, Mô phỏng, Xem như khách, Làm mới. Bỏ `.back-to-edit`. `top` của preview lấy từ chiều cao thật của top bar (ResizeObserver -> `--a-tbh`). e2e kiểm vị trí/kích thước ở 390×844 |
| A05 | Đã sửa (tối thiểu) | `RouteProps.peek()`: trên mobile, mỗi lựa chọn "chọn = phát" (theme, kiểu mở, mẫu phong bì, hạt, reveal, tự cuộn, xem thiệp theo khách) hiện toast có nút **[Xem ↗]** để chuyển sang tab Xem trước. Preview đang ẩn vẫn nhớ hiệu ứng và phát khi hiện lại. Mini preview dính để v4 |
| A06 | Đã sửa | `summary::before` vẽ mũi tên xoay 45°, cao ≥ 44px, tắt transition khi giảm chuyển động. Accordion danh sách (A12) dùng cùng mũi tên |
| A07 | Đã sửa | `src/shared/labels.ts`: nhãn tiếng Việt cho mọi enum, dùng ở Hiệu ứng, Theme, Các phần, diff "Xem thay đổi" và dialog xuất bản. `followThemeLabel()` ra "Theo theme (Phong bì · Cuộn thư sẽ có ở bản sau)" khi theme gợi ý giá trị chưa hỗ trợ. Unit test phủ đủ mọi enum; e2e quét chữ của 26 mục và dialog xuất bản để tìm mã thô |
| A08 | Đã sửa | Kết nối mobile có nút "← Bước trước" ở bước ② và ③. Bước đã qua trong stepper là `<button>` quay về được. Dữ liệu đã nhập được giữ (e2e) |
| A09 | Đã sửa | Dòng lý do ngay trên nút Lưu khi nút đang tắt (`aria-describedby`). Desktop: bước hiện tại là 1, 2 hoặc 3 theo token/okAll |
| A10 | Đã sửa | `save()` có try/catch: hiện lỗi `role="alert"`, nút trở về bình thường |
| A11 | Đã sửa | `@media (pointer:coarse)`: btn-link, seg-btn, btn-sm, chip, nav-a, toggle--sm, input--sm, check, stepper-btn ≥ 44px. Checkbox 20px, cả label là vùng chạm |
| A12 | Đã sửa | `ListField` thành accordion tự làm: nút tiêu đề `aria-expanded`, các nút ↑ ↓ Xoá nằm ngoài. Key ổn định (`item.id` hoặc key sinh khi thêm). Dời/xoá xong focus về đúng chỗ (e2e) |
| A13 | Đã sửa | Mobile ẩn `.nav-sub`, các mục "Thêm" và nút Đăng xuất trong danh sách nhóm, còn 8 dòng (e2e) |
| A14 | Đã sửa (v2.1) | Khối "Mẫu phong bì" và "Tự động cuộn" đã có từ v2.1. v2.2 thêm phần "Nâng cao: thời gian dừng mỗi phần" (dwellMs) và ghi chú khi Cường độ = Tắt |
| A15 | Đã sửa | Preview đo kích thước `.pv` (ResizeObserver). Khi đang ẩn: chỉ đánh dấu "bẩn", không nạp iframe; hiện lại thì render 1 lần với nháp mới nhất. Ô textarea debounce 400ms (điều kiện b của lệch #1). e2e đếm `data-loads` |
| A16 | Đã sửa (bản tạm) | `src/admin/ui/icons.tsx`: 25 icon SVG nét 1.5px, `currentColor`, `aria-hidden`, thay toàn bộ emoji/ký tự icon. Frontend tự vẽ; designer có thể thay path mà không phải đổi tên |
| A17 | Đã sửa | Lưu `cover.monogram` (không bí mật, key `wp_admin_mono_v1`) khi vào admin; Login hiện chữ lồng này, chưa có thì hiện icon ổ khoá |
| A18 | Đã sửa | Toolbar desktop 3 hàng: thiết bị + ⟳ · Phát lại/0.5x/Mô phỏng · checkbox và "Xem như khách" (gap 1rem) |
| A19 | Đã sửa | Tổng quan dùng `publishLabel()` chung với top bar |
| A20 | Đã sửa | < 768: mỗi khách là 1 thẻ (tên · "Trên thiệp" · link rút gọn · hàng nút 44px Sao chép / Chia sẻ / Xem). Không cuộn ngang (e2e) |
| A21 | Đã sửa | `prefers-reduced-motion`: `.tcard` không transition, không nâng khi hover. Ornament góc để v4 |
| A22 | Đã sửa | "Sections" đổi thành "Các phần & thứ tự" (nav, tiêu đề, diff, gợi ý trong form). Tên phần dùng chung với nav ("Ảnh bìa (Hero)"). Thống nhất "Sao chép", "Tuỳ", "Hoạ tiết", "Đường phân cách" |
| A23 | Giữ nguyên (đã chấp nhận) | Admin dùng font hệ thống (`--a-font`). Câu trong design 8.1 do designer sửa |
| A24 | Đã sửa | Lỗi hiện thành banner `role="alert"` dưới top bar (Tải lại / Đóng / Chi tiết kỹ thuật). Top bar chỉ còn "✕ Lỗi · Xem"; bấm Xem sẽ focus vào banner |

Ngoài bảng: album dời ảnh bằng nút ←→ có nhãn "Dời ảnh n lên trước / ra sau", focus giữ ở ảnh vừa dời và có `aria-live` (lệch #4).

## 3. Tự cuộn (decisions 2026-10-08)
- `defaults.ts` và `public/content/config.json`: `enabled: true, speed 45, startDelayMs 2500` (đã đúng từ v2.1, nay có unit test kiểm config mẫu).
- Import config v0 (`migrateV0toV1`): **luôn** `enabled: true`, bỏ qua `enabled` cũ; giữ `speed` nếu có; `startDelayMs` kẹp ≥ 1500 ở merge.
- Config v1: không có migration; `enabled:false` được giữ nguyên (có test).

## 4. Lệch so với review, kèm lý do
1. A15 dùng ResizeObserver trên `.pv` (kích thước 0 = ẩn) thay cho IntersectionObserver: bắt được cả `display:none` ở tab mobile lẫn nút tắt "Xem trước" ở tablet.
2. A05: desktop không hiện toast "[Xem ↗]" vì preview đã hiện sẵn; riêng đổi theme vẫn có toast [Hoàn tác] như cũ.
3. A02: trạng thái "Đã tải gói xuất bản" chỉ nằm trong bộ nhớ của phiên (`store.s.exported`). Tải lại trang thì về "Có N thay đổi chưa tải gói", vì chế độ Download không có nguồn sự thật nào để biết gói đã được commit hay chưa.
4. A16: dùng component SVG inline (`<Icon name>`) thay cho file sprite, vì CSP không cần `<use href>` ngoài và tree-shake theo icon. Nét vẽ là bản tạm của frontend.
5. Admin JS ban đầu tăng 5.7 kB gzip (73.45/80). Còn 6.5 kB trước ngưỡng. Nếu v4 cần thêm chỗ, có thể tải lười `labels` cùng dialog xuất bản.

## 5. Tệp
- Mới: `src/shared/labels.ts`, `src/admin/editor/status.ts`, `src/admin/ui/icons.tsx`, `tests/admin-ux.test.ts`, `tests/e2e/admin-v22.spec.ts`.
- Sửa: `src/admin/{admin.css, auth/vault.ts, draft/diff.ts, draft/ops.ts, editor/editor.tsx, editor/form.tsx, editor/preview.tsx, editor/routes/{album,effects,links,overview,sections,theme}.tsx, screens/{connect,login}.tsx, state/store.ts, ui/ui.tsx}`, `src/shared/config/{migrations,schema-meta}.ts`, `tests/{autoscroll.test.ts, migrations.test.ts, e2e/admin.spec.ts}`.
- Không sửa `src/guest`.

## 6. Cần kiểm tra tay
- iPhone Safari và Android thật: nút ↶ trong top bar, tab Xem trước (iframe phủ màn, thanh địa chỉ co giãn làm đổi chiều cao), toast [Xem ↗] che nội dung đáy trong 4-5 giây.
- Kết nối GitHub thật: lần đầu thấy "Chưa xuất bản lần nào", sau khi xuất bản đổi sang "Đã xuất bản · giờ" và "Khách đã thấy bản mới".
- Screen reader (VoiceOver/TalkBack): accordion danh sách lặp, stepper quay về, banner lỗi `role=alert`, thông báo dời ảnh album.
- Màn Login sau khi đã vào admin một lần: hiện đúng chữ lồng.
