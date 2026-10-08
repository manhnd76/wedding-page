/**
 * Preview bridge (solution 4.3, design 8.4/8.13) - chỉ tải khi URL có `?preview=1`.
 * Admin (cùng origin) gửi `wp:preview-config` / `fx:replay`; guest trả `wp:preview-ready`, `wp:preview-error`, `fx:done`.
 *
 * Mô hình: mỗi khung preview render đúng 1 cấu hình bằng chính code guest (giống trang thật 100%).
 * Cấu hình/hiệu ứng mới -> khung tự tải lại với trạng thái mới (sessionStorage) để không rò rỉ timer/observer;
 * admin dùng 2 khung luân phiên (double buffer) nên người dùng không thấy nháy.
 */
import type { WeddingConfig } from '@shared/config/types';
import type { FontId, OrnamentSet } from '@shared/config/enums';
import { FONT_REGISTRY } from '@shared/fonts/registry';

export interface PreviewOptions {
  skipCover?: boolean;
  replayCover?: boolean;
  muteMusic?: boolean;
  scrollTo?: string;
  /** vị trí cuộn cần giữ khi khung mới thay khung cũ */
  scrollY?: number;
  guestName?: string;
  highlight?: string;
}
export interface FxReplay {
  target: string;
  speed?: number;
  simulate?: { lowEnd?: boolean; reducedMotion?: boolean };
}
export interface PreviewBoot {
  config: WeddingConfig;
  assets: Record<string, string>;
  options: PreviewOptions;
  fx: FxReplay | null;
}

const STASH_KEY = 'wp_preview_boot_v1';
const BOOT_TIMEOUT_MS = 4000;

export const isPreviewUrl = (u: URL) => u.searchParams.get('preview') === '1';

export function post(msg: Record<string, unknown>): void {
  if (window.parent && window.parent !== window) window.parent.postMessage(msg, location.origin);
}

const fromAdmin = (e: MessageEvent) => e.origin === location.origin && e.source === window.parent && typeof e.data === 'object' && e.data !== null;

/** Thay mọi chuỗi trùng khoá `assets` (đường dẫn ảnh mới chưa xuất bản) bằng blob: URL. */
export function applyAssets<T>(v: T, assets: Record<string, string>): T {
  if (!assets || !Object.keys(assets).length) return v;
  const walk = (x: unknown): unknown => {
    if (typeof x === 'string') return assets[x] ?? assets[x.replace(/^\.?\/+/, '')] ?? x;
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === 'object') {
      const o: Record<string, unknown> = {};
      for (const [k, y] of Object.entries(x)) o[k] = walk(y);
      return o;
    }
    return x;
  };
  return walk(v) as T;
}

function readStash(): PreviewBoot | null {
  try {
    const raw = sessionStorage.getItem(STASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STASH_KEY);
    const v = JSON.parse(raw) as PreviewBoot & { href?: string };
    return v.href === location.href ? v : null;
  } catch { return null; }
}

/** Lưu trạng thái rồi tải lại khung (cấu hình mới / phát lại hiệu ứng). */
export function reloadWith(boot: PreviewBoot): void {
  try { sessionStorage.setItem(STASH_KEY, JSON.stringify({ ...boot, href: location.href })); } catch { /* quá lớn */ }
  location.reload();
}

/** Chờ cấu hình từ admin (hoặc trạng thái đã lưu). Không có admin trong 4s -> null (dùng config inline). */
export function waitForBoot(): Promise<PreviewBoot | null> {
  const stashed = readStash();
  if (stashed) return Promise.resolve(stashed);
  if (window.parent === window) return Promise.resolve(null);
  return new Promise((resolve) => {
    let fx: FxReplay | null = null;
    const t = setTimeout(() => { window.removeEventListener('message', on); resolve(null); }, BOOT_TIMEOUT_MS);
    function on(e: MessageEvent) {
      if (!fromAdmin(e)) return;
      const d = e.data as Record<string, unknown>;
      if (d.type === 'fx:replay') { fx = d as unknown as FxReplay; return; }
      if (d.type !== 'wp:preview-config' || !d.config) return;
      clearTimeout(t);
      window.removeEventListener('message', on);
      resolve({
        config: d.config as WeddingConfig,
        assets: (d.assets as Record<string, string>) ?? {},
        options: (d.options as PreviewOptions) ?? {},
        fx: (d.fx as FxReplay) ?? fx,
      });
    }
    window.addEventListener('message', on);
    post({ type: 'wp:preview-ready', phase: 'boot' });
  });
}

/** Sau khi render: nghe cấu hình/hiệu ứng mới. */
export function listenAfterRender(current: PreviewBoot): void {
  window.addEventListener('message', (e) => {
    if (!fromAdmin(e)) return;
    const d = e.data as Record<string, unknown>;
    if (d.type === 'wp:preview-config' && d.config) {
      const next: PreviewBoot = {
        config: d.config as WeddingConfig, assets: (d.assets as Record<string, string>) ?? {},
        options: (d.options as PreviewOptions) ?? {}, fx: (d.fx as FxReplay) ?? null,
      };
      if (JSON.stringify(next.config) === JSON.stringify(current.config) && !next.fx) { applyOptions(next.options); return; }
      reloadWith({ ...next, options: { ...next.options, scrollY: next.options.scrollY ?? window.scrollY } });
    } else if (d.type === 'fx:replay') {
      reloadWith({ ...current, fx: d as unknown as FxReplay, options: { ...current.options, scrollY: window.scrollY } });
    } else if (d.type === 'wp:preview-scroll') {
      post({ type: 'wp:preview-scroll', scrollY: window.scrollY });
    }
  });
  // báo vị trí cuộn để khung kế tiếp giữ nguyên chỗ đang xem
  let t: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener('scroll', () => {
    if (t) return;
    t = setTimeout(() => { t = null; post({ type: 'wp:preview-scroll', scrollY: Math.round(window.scrollY) }); }, 150);
  }, { passive: true });
  window.addEventListener('error', (e) => post({ type: 'wp:preview-error', message: String(e.message ?? e) }));
}

/** Cuộn tới + viền nhấp nháy 1s (WAAPI - không vướng CSP style-src). */
export function applyOptions(o: PreviewOptions): void {
  if (o.scrollTo) {
    const el = o.scrollTo === 'cover' ? null : document.getElementById(o.scrollTo);
    el?.scrollIntoView({ block: 'start' });
  }
  if (o.highlight) {
    const el = document.getElementById(o.highlight);
    el?.animate(
      [{ boxShadow: 'inset 0 0 0 0 rgba(47,74,67,0)' }, { boxShadow: 'inset 0 0 0 3px rgba(47,74,67,.9)' }, { boxShadow: 'inset 0 0 0 0 rgba(47,74,67,0)' }],
      { duration: 1000, easing: 'ease-in-out' },
    );
  }
}

// ------------------------------------------------------------------ font + ornament cho cấu hình khác bản build

interface AssetManifest {
  fonts: Record<string, { family: string; weight: number; style: string; url: string; range: string }[]>;
  ornaments: Record<string, string>;
}
let manifestP: Promise<AssetManifest | null> | null = null;
function assetManifest(base: string): Promise<AssetManifest | null> {
  return (manifestP ??= fetch(`${base}preview-assets.json`, { cache: 'no-cache' }).then((r) => (r.ok ? (r.json() as Promise<AssetManifest>) : null)).catch(() => null));
}

/** Nạp @font-face (FontFace API) cho 3 family đã resolve nếu khác bản build. */
export async function ensureFonts(base: string, fonts: FontId[]): Promise<void> {
  const fs = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fs || typeof FontFace === 'undefined') return;
  const m = await assetManifest(base);
  if (!m) return;
  for (const id of fonts) {
    const fam = FONT_REGISTRY[id]?.family;
    if (!fam || [...fs].some((f) => f.family.replace(/["']/g, '') === fam)) continue;
    for (const f of m.fonts[id] ?? []) {
      try {
        const face = new FontFace(f.family, `url(${f.url}) format('woff2')`, { weight: String(f.weight), style: f.style, unicodeRange: f.range, display: 'swap' });
        fs.add(face);
      } catch { /* bỏ qua */ }
    }
  }
}

export async function ornamentUrlFor(base: string, set: OrnamentSet): Promise<string> {
  return (await assetManifest(base))?.ornaments[set] ?? '';
}
