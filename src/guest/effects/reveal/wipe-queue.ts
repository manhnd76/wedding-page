/**
 * Giới hạn số `wipe` chạy cùng lúc (design-v4a-2a 3.3): ≤ 3 (máy yếu 2); chờ quá 600ms thì engine dùng `fade`.
 * Thuần, đồng hồ tiêm vào để test.
 */
export class WipeQueue<T = string> {
  private run = new Set<T>();
  private wait: [T, number][] = [];

  constructor(private cap: number, private maxWaitMs = 600, private now: () => number = () => performance.now()) {}

  request(id: T): 'run' | 'wait' {
    if (this.run.size < this.cap) { this.run.add(id); return 'run'; }
    this.wait.push([id, this.now()]);
    return 'wait';
  }

  /** Phần tử xong -> trả các id được chạy tiếp (bỏ qua id đã chờ quá hạn, để `expired()` trả). */
  release(id: T): T[] {
    this.run.delete(id);
    const out: T[] = [];
    const t = this.now();
    for (let i = 0; i < this.wait.length && this.run.size < this.cap;) {
      const [w, at] = this.wait[i]!;
      if (t - at > this.maxWaitMs) { i++; continue; }
      this.wait.splice(i, 1);
      this.run.add(w);
      out.push(w);
    }
    return out;
  }

  /** Id chờ > maxWaitMs (bỏ khỏi hàng đợi). */
  expired(): T[] {
    const t = this.now();
    const out = this.wait.filter(([, at]) => t - at > this.maxWaitMs).map(([w]) => w);
    this.wait = this.wait.filter(([, at]) => t - at <= this.maxWaitMs);
    return out;
  }
}
