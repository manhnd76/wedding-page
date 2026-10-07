/**
 * EffectRegistry (solution 8.4): mọi hiệu ứng đăng ký play/reset/setTimeScale
 * - phục vụ "Phát lại", 0.5x, mô phỏng trong admin (v2 qua fx:replay).
 */
export interface RegisteredEffect {
  play(): void | Promise<void>;
  reset?(): void;
  setTimeScale?(x: number): void;
}

const effects = new Map<string, RegisteredEffect>();
let timeScale = 1;

export const EffectRegistry = {
  register(id: string, e: RegisteredEffect): void {
    effects.set(id, e);
    e.setTimeScale?.(timeScale);
  },
  async play(id: string): Promise<void> {
    await effects.get(id)?.play();
  },
  reset(id: string): void {
    effects.get(id)?.reset?.();
  },
  setTimeScale(x: number): void {
    timeScale = x;
    effects.forEach((e) => e.setTimeScale?.(x));
  },
  get timeScale() { return timeScale; },
  ids: () => [...effects.keys()],
};
