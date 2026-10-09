/**
 * Helper e2e dùng chung cho các đợt hiệu ứng v4a (solution-v4a-2bc.md 0.10, 4.2).
 * Chỉ THÊM ở Bước 0; sau đó không đợt nào sửa file này (bản đồ sở hữu 3.2) - cần thêm thì viết helper riêng trong spec của đợt.
 *
 * - `bootPreview`: mở guest ở chế độ preview bằng "stash" sessionStorage (đúng cơ chế `readStash()` của
 *   `src/guest/preview-bridge.ts`), không cần khung admin. Preview tự coi là máy khoẻ; `fx.simulate` ép máy yếu/giảm chuyển động.
 * - `strongDevice`: ép `hardwareConcurrency`/`deviceMemory` = 8 cho test chạy bản build thường (máy cloud 4 nhân bị tự hạ cấp).
 * - `coverTiming` / `remainingAfterFastForward`: đo bằng thời gian animation (WAAPI), không đo đồng hồ treo tường.
 */
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

/** Khoá stash của preview (khớp `STASH_KEY` trong `src/guest/preview-bridge.ts`). */
export const PREVIEW_STASH_KEY = 'wp_preview_boot_v1';
export const PREVIEW_PATH = '/?preview=1&debug=fx';

export interface FxReplayOpts {
  /** 'cover' | 'burst' | 'particles' | 'reveal' | 'autoscroll' | 'micro:<id>' ... (`fx:replay` của preview) */
  target: string;
  speed?: number;
  simulate?: { lowEnd?: boolean; reducedMotion?: boolean };
}

export interface PreviewOptionsLite {
  skipCover?: boolean;
  guestName?: string;
  scrollTo?: string;
  scrollY?: number;
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Gộp sâu: object gộp theo khoá, mảng/giá trị nguyên thuỷ thay thế. Không sửa đối số. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : patch) as T;
  const out: Json = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  return out as T;
}

/** Config mẫu `public/content/config.json` (đọc mới mỗi lần). */
export function sampleConfig(): Json {
  return JSON.parse(readFileSync('public/content/config.json', 'utf8')) as Json;
}

/**
 * Mở guest preview với config = config mẫu ⊕ `patch`.
 * `fx = null` (mặc định): cover hiện và chờ khách chạm (nếu `cover.enabled`); `fx.target = 'cover'`: cover tự mở.
 * Stash chỉ ghi cho đúng URL preview (guest so `href`), ghi lại ở mỗi lần tải trang.
 */
export async function bootPreview(page: Page, patch: unknown = {}, fx: FxReplayOpts | null = null, options: PreviewOptionsLite = {}): Promise<Json> {
  const config = deepMerge(sampleConfig(), patch);
  await page.addInitScript(({ key, path, boot }) => {
    if (location.pathname + location.search !== path) return;
    try { sessionStorage.setItem(key, JSON.stringify({ ...boot, href: location.href })); } catch { /* ignore */ }
  }, { key: PREVIEW_STASH_KEY, path: PREVIEW_PATH, boot: { config, assets: {}, options, fx } });
  await page.goto(PREVIEW_PATH);
  return config;
}

/** Máy khoẻ (8 nhân, 8 GB) - gọi TRƯỚC `goto` cho test chạy bản build thường. */
export async function strongDevice(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 8, configurable: true });
    Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 8, configurable: true });
  });
}

/** Chờ nút "Chạm để mở" bật rồi bấm. */
export async function tapOpen(page: Page, timeout = 6000): Promise<void> {
  const cta = page.locator('.cv-cta');
  await cta.waitFor({ state: 'visible', timeout });
  await page.waitForFunction(() => !(document.querySelector('.cv-cta') as HTMLButtonElement | null)?.disabled, null, { timeout });
  await cta.click();
}

/**
 * Bấm mở thiệp, `pause()` mọi animation trong `.cover`, trả thời lượng dự kiến (ms, thời gian animation):
 * `endTime` lớn nhất (chia `playbackRate`); không có animation WAAPI (canvas) -> `__wpCover.totalMs` (nếu có), ngược lại 0.
 * Cover bị dừng giữa chừng: dùng ở test riêng, không mở tiếp trong cùng trang.
 */
export async function coverTiming(page: Page): Promise<number> {
  await tapOpen(page);
  return page.evaluate(() => {
    const cover = document.querySelector('.cover');
    const anims = cover ? cover.getAnimations({ subtree: true }) : [];
    let max = 0;
    for (const a of anims) {
      a.pause();
      const end = Number(a.effect?.getComputedTiming().endTime ?? 0);
      max = Math.max(max, end / Math.abs(a.playbackRate || 1));
    }
    const dbg = (window as unknown as { __wpCover?: { totalMs?: number } }).__wpCover;
    return max || dbg?.totalMs || 0;
  });
}

/**
 * Bấm mở, chờ `atMs` (đồng hồ thật), chạm lần 2 (tua nhanh) rồi trả phần còn lại (ms):
 * max `(endTime − currentTime) / playbackRate` của mọi animation trong `.cover`, hoặc `__wpCover.remainingMs()` nếu lớn hơn.
 * Cover đã gỡ trước khi chạm lần 2 -> 0.
 */
export async function remainingAfterFastForward(page: Page, atMs: number): Promise<number> {
  await tapOpen(page);
  await page.waitForTimeout(atMs);
  return page.evaluate(async () => {
    const cover = document.querySelector<HTMLElement>('.cover');
    if (!cover) return 0;
    cover.click(); // chạm lần 2 = tua nhanh (cover.ts: click khi đang chạy -> run.fastForward())
    const anims = cover.getAnimations({ subtree: true });
    // updatePlaybackRate() chỉ có hiệu lực sau khi `ready` (tốc độ đang chờ áp dụng)
    await Promise.all(anims.map((a) => a.ready.catch(() => undefined)));
    let max = 0;
    for (const a of anims) {
      if (a.playState === 'finished') continue;
      const end = Number(a.effect?.getComputedTiming().endTime ?? 0);
      const cur = Number(a.currentTime ?? 0);
      max = Math.max(max, (end - cur) / Math.abs(a.playbackRate || 1));
    }
    const dbg = (window as unknown as { __wpCover?: { remainingMs?: () => number } }).__wpCover;
    return Math.max(max, dbg?.remainingMs?.() ?? 0);
  });
}

export interface FxSnapshot {
  bg: { x: number; y: number; a: number }[];
  bursts: { x: number; y: number; a: number }[];
  zones: { left: number; top: number; right: number; bottom: number }[];
  soft?: { left: number; top: number; right: number; bottom: number }[];
  target: number;
  running: boolean;
  frames: number;
}

/** `__wpFx.snapshot()` (cần `?debug=fx`); null khi chưa có ParticleField. */
export function fxSnap(page: Page): Promise<FxSnapshot | null> {
  return page.evaluate(() => (window as unknown as { __wpFx?: { snapshot: () => unknown } }).__wpFx?.snapshot() as never ?? null);
}

/** Thu thập lỗi console + pageerror (cho phép warn). */
export function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}
