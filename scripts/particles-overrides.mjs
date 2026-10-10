/**
 * Ghi đè dữ liệu `particles.json` theo vòng sửa sau designer review (`design-review-v4a-2c.md`), áp khi sinh module
 * (`scripts/gen-particles.mjs`). Giữ riêng để `particles.json` (tài liệu designer) không bị FE sửa; khi designer chép
 * các thay đổi này vào `particles.json` thì xoá mục tương ứng ở đây (sinh lại phải ra cùng nội dung - `--check`).
 * Mỗi mục: `{ id: <ID review>, note: <ghi chú in vào JSDoc module>, apply(item) }` - sửa tại chỗ bản sao của item.
 */
/**
 * Trống: các vòng sửa P01-P05 (dust-mote, snow, paper-heart, leaf-maple) designer đã chép vào `particles.json`
 * (sinh lại từ `assets/v4a-2/_generator/`) - v4a-2a xoá các mục thừa. Thêm mục mới khi có vòng sửa sau.
 * @type {Record<string, { id: string; note: string; apply: (it: any) => void }[]>}
 */
export const OVERRIDES = {};
