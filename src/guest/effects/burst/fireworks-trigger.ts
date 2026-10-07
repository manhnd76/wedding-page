/**
 * Logic kích hoạt pháo hoa đếm ngược (design 5.7 "Thông số kích hoạt fireworks-soft").
 * Tách khỏi phần vẽ để test bằng fake timers.
 *
 * - Vào: section hiện >= 50% và giữ liên tục 400ms.
 * - Lên đạn lại: chỉ sau khi section < 10% (rời viewport) rồi vào lại.
 * - Cooldown: >= 15s tính từ lúc chùm cuối của lần trước tắt; vào lại trong cooldown thì bỏ (không xếp hàng).
 * - Không bắn khi bị chặn (tab ẩn, lightbox/sheet, focus ô nhập, cấp off/reduced).
 * - wedding-day: chỉ ngày cưới (hoặc khi đồng hồ về 0 lúc đang xem), 1 lần/phiên.
 */
export const FW_ENTER_RATIO = 0.5;
export const FW_REARM_RATIO = 0.1;
export const FW_HOLD_MS = 400;
export const FW_COOLDOWN_MS = 15_000;

export type FireworksMode = 'off' | 'wedding-day' | 'every-view';

export interface FireworksTriggerOptions {
  mode: FireworksMode;
  /** gọi khi bắn; trả về Promise resolve khi chùm cuối tắt */
  fire: () => Promise<void> | void;
  isBlocked?: () => boolean;
  now?: () => number;
  /** wedding-day: hôm nay có phải ngày cưới? */
  isWeddingDay?: () => boolean;
  /** wedding-day: đã bắn trong phiên? (sessionStorage) */
  sessionFired?: { get: () => boolean; set: () => void };
}

export class FireworksTrigger {
  private armed = true;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private cooldownUntil = 0;
  private visible = false;
  firedCount = 0;

  constructor(private o: FireworksTriggerOptions) {}

  private now() {
    return this.o.now ? this.o.now() : Date.now();
  }

  /** Cập nhật tỉ lệ hiện của section (IntersectionObserver). */
  update(ratio: number): void {
    if (this.o.mode === 'off') return;
    if (ratio < FW_REARM_RATIO) {
      this.armed = true;
      this.visible = false;
      this.cancelHold();
      return;
    }
    if (ratio >= FW_ENTER_RATIO) {
      if (!this.visible) {
        this.visible = true;
        this.startHold();
      }
    } else {
      // 10%..50%: rời ngưỡng vào nhưng chưa đủ để lên đạn lại
      this.visible = false;
      this.cancelHold();
    }
  }

  /** wedding-day: đồng hồ vừa về 0 trong lúc đang xem. */
  countdownReachedZero(): void {
    if (this.o.mode !== 'wedding-day' || this.o.sessionFired?.get()) return;
    if (this.visible) void this.doFire(true);
  }

  private startHold() {
    this.cancelHold();
    if (!this.armed) return;
    this.holdTimer = setTimeout(() => {
      this.holdTimer = null;
      void this.doFire(false);
    }, FW_HOLD_MS);
  }

  private cancelHold() {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = null;
  }

  private async doFire(force: boolean) {
    if (!this.visible || this.running) return;
    if (this.now() < this.cooldownUntil) return; // trong cooldown: bỏ, không xếp hàng
    if (this.o.isBlocked?.()) return;
    if (this.o.mode === 'wedding-day') {
      if (this.o.sessionFired?.get()) return;
      if (!force && !this.o.isWeddingDay?.()) return;
      this.o.sessionFired?.set();
    } else if (!this.armed) return;
    this.armed = false;
    this.running = true;
    this.firedCount++;
    try {
      await this.o.fire();
    } finally {
      this.running = false;
      this.cooldownUntil = this.now() + FW_COOLDOWN_MS;
    }
  }

  dispose() {
    this.cancelHold();
  }
}
