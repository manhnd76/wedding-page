import { svgDoc } from './lib.mjs';
// wash-mask: mép ảnh loang màu nước. Dùng làm mask-image, kéo giãn theo khung (preserveAspectRatio none).
svgDoc('frames/wash-mask.svg', 'Frame wash-mask: mask alpha cho ảnh, mép loang (displacement + blur). Dùng mask-size 100% 100%. Tự vẽ (ui-ux-designer v4a-1).', '0 0 400 500',
  '<filter id="w" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="4" result="t"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="t" scale="46" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="4"/>' +
  '<feComponentTransfer><feFuncA type="table" tableValues="0 .35 .8 1 1"/></feComponentTransfer></filter>' +
  '<rect x="34" y="34" width="332" height="432" rx="18" filter="url(#w)"/>', 4096, ' preserveAspectRatio="none"');
