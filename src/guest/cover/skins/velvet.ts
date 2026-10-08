/**
 * Mẫu `velvet`: nền nhung đen ánh đỏ (radial-gradient tĩnh), viền chỉ vàng art-deco kép, nắp nhọn viền vàng,
 * dấu sáp vàng đồng ánh kim, lót nắp quạt deco. Pha mở: vệt sáng chéo lướt qua viền (0–350ms) rồi seal tách đôi.
 */
import { envelopeGeom } from '@shared/envelope';
import { svg } from '../../dom';
import { path, sealSplit, sheen, shell, waxSeal, type EnvelopeSkin } from './kit';

export const skin: EnvelopeSkin = {
  build(p, o) {
    const cid = `vv-${o.uid}`;
    const gid = `vg-${o.uid}`;
    const g = envelopeGeom('velvet');
    const clip = { 'clip-path': `url(#${cid})` };
    shell(p, 'velvet', o, {
      front: [
        svg('defs', {}, svg('clipPath', { id: cid }, path(g.pocket, '')),
          svg('radialGradient', { id: gid, cx: '50%', cy: '70%', r: '75%' }, svg('stop', { offset: 0, class: 'vv-glow' }), svg('stop', { offset: 1, class: 'vv-glow0' }))),
        path(g.pocket, '', { fill: `url(#${gid})` }),
        svg('rect', { x: 7, y: 7, width: 326, height: 224, class: 'sh-b', ...clip }),
        svg('rect', { x: 11.5, y: 11.5, width: 317, height: 215, class: 'sh-b sh-b2', ...clip }),
      ],
      flap: [path('M8 .5 170 121 332 .5', 'el-l'), path('M18 .5 170 113 322 .5', 'el-l el-l2')],
    });
    // lót nắp: quạt deco thay sọc chéo
    const pat = p.flapB.querySelector('pattern');
    if (pat) {
      pat.setAttribute('width', '16');
      pat.removeAttribute('patternTransform');
      pat.replaceChildren(path('M0 10a8 8 0 0 1 16 0M4 10a4 4 0 0 1 8 0M8 10V2', 'el-s'));
    }
    waxSeal(p, o);
  },
  unlock(p, light) {
    if (light) return { steps: sealSplit(p, true), flapAt: 0 };
    const split = sealSplit(p, false).map((s) => ({ ...s, start: s.start + 200 }));
    return { steps: [sheen(p, 0, 350), ...split], flapAt: 380 };
  },
};
