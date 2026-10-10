/**
 * parallax-layers (chunk lười, design-v4a-2a 3.6): hero/thankyou có gói ảnh `cinematic` (hoặc ghi đè image), chỉ cấp Nhiều.
 * L0 = lớp nền phía sau (texture `.sec::before` qua `--plx0`, hoạ tiết B2 dạng pattern/band) hệ số -0.05;
 * L1 = ảnh nền 0.15 (parallax sẵn có trong service); L2 = hoạ tiết phía trước (B2 hero/góc, ornament hero) 0.3.
 * Ghi thuộc tính `translate` (CSSOM, không đụng `transform` của hoạ tiết xoay), kẹp ±80px. Trả hàm cập nhật để
 * service gọi trong CÙNG listener cuộn + rAF với parallax ảnh nền.
 */
const clamp = (v: number) => Math.round(Math.max(-80, Math.min(80, v)));

export function layers(secs: HTMLElement[]): () => void {
  const list = secs.map((s) => ({
    s,
    l0: [...s.querySelectorAll<HTMLElement>('.mtf--pattern, .mtf--band')],
    l2: [...s.querySelectorAll<HTMLElement>('.mtf--hero, .mtf--corner, .hero-content > .orn')],
  }));
  return () => {
    const off = document.documentElement.classList.contains('fx-no-parallax');
    for (const { s, l0, l2 } of list) {
      const r = s.getBoundingClientRect();
      if (!off && (r.bottom < 0 || r.top > innerHeight)) continue;
      const y = off ? 0 : -r.top;
      const b = `0 ${clamp(y * -0.05)}px`;
      s.style.setProperty('--plx0', `${clamp(y * -0.05)}px`);
      for (const e of l0) e.style.setProperty('translate', b);
      for (const e of l2) e.style.setProperty('translate', `0 ${clamp(y * 0.3)}px`);
    }
  };
}
