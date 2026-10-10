/**
 * scroll-progress (chunk lười, design-v4a-2a §4.5, R2A-05): thanh tiến độ đọc 2px ở mép trên (chỉ báo vị trí,
 * `aria-hidden`). `animation-timeline: scroll()` khi có (CSS thuần), ngược lại / giảm chuyển động: listener cuộn
 * passive + rAF ghi `--p`. Ẩn khi cover/lightbox mở (CSS); hiện mờ 300ms sau khi mở thiệp.
 */
import { h } from '../../dom';
import { EffectRegistry } from '../registry';

let bar: HTMLElement | null = null;

export function mount(): HTMLElement {
  if (bar) return bar;
  const el = (bar = h('div', { class: 'scroll-prog', 'aria-hidden': 'true' }));
  document.body.append(el);
  const css = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!css) {
    let ticking = false;
    const upd = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      el.style.setProperty('--p', String(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
  requestAnimationFrame(() => el.classList.add('is-on'));
  return el;
}

EffectRegistry.register('micro:scrollProgress', {
  /** preview: về đầu landing rồi cuộn mượt 1.5 màn để thấy thanh chạy */
  play() {
    mount();
    scrollTo(0, 0);
    setTimeout(() => scrollTo({ top: innerHeight * 1.5, behavior: 'smooth' }), 120);
  },
});
