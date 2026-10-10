/**
 * Ghi đè dữ liệu `particles.json` theo vòng sửa sau designer review (`design-review-v4a-2c.md`), áp khi sinh module
 * (`scripts/gen-particles.mjs`). Giữ riêng để `particles.json` (tài liệu designer) không bị FE sửa; khi designer chép
 * các thay đổi này vào `particles.json` thì xoá mục tương ứng ở đây (sinh lại phải ra cùng nội dung - `--check`).
 * Mỗi mục: `{ id: <ID review>, note: <ghi chú in vào JSDoc module>, apply(item) }` - sửa tại chỗ bản sao của item.
 */
const HEART = 'M0 8.9C-11.5 0.5 -7.9 -10 0 -3.7C7.9 -10 11.6 0.5 0 8.9Z';

/** @type {Record<string, { id: string; note: string; apply: (it: any) => void }[]>} */
export const OVERRIDES = {
  'dust-mote': [{
    id: 'P01',
    note: 'cỡ [5, 12], vành ấm đậm #B8925A + lõi #FFF1CC, stops đặc hơn, alpha [.45, .8] (giấy sáng gần như vô hình); naturalDark giữ',
    apply(it) {
      it.size = [5, 12];
      it.alpha = [0.45, 0.8];
      it.natural = ['#B8925A', '#FFF1CC'];
      it.variants[0].layers[0].stops = [[0, 'c2', 1], [0.35, 'c2', 0.85], [0.6, 'c1', 0.45], [1, 'c1', 0]];
    },
  }],
  snow: [{
    id: 'P02',
    note: 'theme sáng: lòng tuyết hơi lạnh #EEF3F8 + stops đặc hơn để đọc như khối (không thành vòng rỗng); naturalDark giữ',
    apply(it) {
      it.natural = ['#EEF3F8', '#9FB3C8'];
      it.variants[0].layers[0].stops = [[0, 'c1', 1], [0.6, 'c1', 0.95], [0.8, 'c2', 0.45], [1, 'c2', 0]];
    },
  }],
  'paper-heart': [{
    id: 'P03',
    note: 'nét sáng nằm trong thuỳ trái (path cũ nằm hẳn ngoài tim)',
    apply(it) {
      const l = it.variants[0].layers[3];
      if (l.stroke !== 'light') throw new Error('paper-heart: lớp 4 không còn là nét sáng - kiểm lại P03');
      l.d = 'M-5.8 -0.4C-6.3 -2 -5.6 -3.6 -4.2 -4C-3.3 -4.3 -2.5 -4 -2 -3.4';
    },
  }, {
    id: 'P04',
    note: 'mặt sau = tim màu c2 (theme: primary-decor) .9 + gân giữa sáng (dark của accent nhạt ra nâu xám)',
    apply(it) {
      it.back = [{ d: HEART, fill: 'c2', a: 0.9 }, { d: 'M0-3.7V8.9', stroke: 'light', lw: 0.6, a: 0.6 }];
    },
  }],
  'leaf-maple': [{
    id: 'P05',
    note: 'cỡ [18, 28] (Q4) - hình lá chỉ chiếm ~70% ô, cỡ cũ đọc như dấu sao',
    apply(it) {
      it.size = [18, 28];
    },
  }],
};
