/**
 * SVGO cho asset theme v4a-1 (solution.md Rev 5 mục 10.4). Chạy 1 lần khi chép asset, KHÔNG nằm trong build:
 *   npx svgo@3 --config scripts/svgo.theme-assets.mjs -f <thư mục>
 * Giữ: viewBox, id (symbol `#divider`, filter `#n`...), pathLength (reveal svg-draw), class="wash",
 * <defs>/<use> nội bộ của motif (ảnh mask, không đi qua <use> ngoài).
 */
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          cleanupIds: false,
          removeUselessDefs: false,
          mergePaths: false,
          convertShapeToPath: false,
          collapseGroups: false,
          removeHiddenElems: false,
          convertPathData: { floatPrecision: 2 },
          // pathLength trên circle/line/ellipse (reveal svg-draw) bị coi là thuộc tính lạ -> giữ
          removeUnknownsAndDefaults: { unknownAttrs: false },
        },
      },
    },
  ],
};
