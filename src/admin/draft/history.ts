/** Undo/redo trong bộ nhớ phiên, tối đa 50 bước (solution 3.2). Lưu chuỗi JSON để bất biến. */
export class History<T> {
  private past: string[] = [];
  private future: string[] = [];
  constructor(private limit = 50) {}

  /** Ghi trạng thái TRƯỚC khi đổi. Gộp các thay đổi liên tiếp cùng `group` trong `mergeMs`. */
  private lastGroup = '';
  private lastAt = 0;
  push(before: T, group = '', now = Date.now(), mergeMs = 1000): void {
    if (group && group === this.lastGroup && now - this.lastAt < mergeMs && this.past.length) {
      this.lastAt = now;
      this.future = [];
      return;
    }
    this.past.push(JSON.stringify(before));
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
    this.lastGroup = group;
    this.lastAt = now;
  }
  undo(current: T): T | null {
    const s = this.past.pop();
    if (s === undefined) return null;
    this.future.push(JSON.stringify(current));
    this.lastGroup = '';
    return JSON.parse(s) as T;
  }
  redo(current: T): T | null {
    const s = this.future.pop();
    if (s === undefined) return null;
    this.past.push(JSON.stringify(current));
    this.lastGroup = '';
    return JSON.parse(s) as T;
  }
  clear(): void { this.past = []; this.future = []; this.lastGroup = ''; }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  get size() { return this.past.length; }
}
