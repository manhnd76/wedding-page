/**
 * Plugin `inject-config-og` (solution 5.1, 5.3, 9.1, 9.4):
 *  - đọc public/content/config.json -> migrate -> merge -> resolveTheme (cùng code với guest)
 *  - inline vào index.html: #wp-config, #wp-resolved, <style id="wp-theme"> (CSS vars + @font-face 3 family),
 *    data-mode/data-theme, <title>, meta/OG, preload font cover + ornament sprite + ảnh hero,
 *    modulepreload cho module openStyle + loại hạt đang dùng; với kiểu mở đang dùng: + chunk `open-kit` nó import,
 *    `<link rel="stylesheet">` CSS riêng của kiểu, `<link rel="preload" as="image">` ảnh import trong module
 *  - emit font woff2 (@fontsource) + ornament sprite + divider sprite riêng (v4a-1) có hash
 *  - ghi dist/_headers (CSP style-src kèm sha256 của <style> inline)
 *  - ghi .wp-build/budget.json cho size-limit
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { mergeWithDefaults } from '../../src/shared/config/merge.ts';
import { migrate } from '../../src/shared/config/migrations.ts';
import type { WeddingConfig } from '../../src/shared/config/types.ts';
import { FONT_REGISTRY, FONT_SUBSETS, fontStack, fontsourceFile, type FontMeta } from '../../src/shared/fonts/registry.ts';
import { planSections } from '../../src/shared/sections/meta.ts';
import { resolveTheme, themeCssVars, type ResolvedTheme } from '../../src/shared/theme/resolve.ts';
import { assetUrl, safeHttpsUrl } from '../../src/shared/assets.ts';
import { CAPABILITIES } from '../../src/shared/capabilities.ts';
import type { FontId } from '../../src/shared/config/enums.ts';
import { DIVIDER_SPRITES, isDividerSprite } from '../../src/shared/theme/parts.ts';

interface FontFile { url: string; abs: string; family: string; weight: number; style: string; subset: string; range: string; role: string }
interface Asset { url: string; abs: string }

export interface State {
  config: WeddingConfig;
  resolved: ResolvedTheme & { ornamentUrl: string };
  warnings: string[];
  fonts: FontFile[];
  ornament: Asset;
  /** sprite divider riêng đang dùng (v4a-1, design 1.6.7b); url rỗng nếu divider không phải sprite */
  divider: Asset;
  styleText: string;
  styleHash: string;
}

const hash8 = (buf: Buffer | string) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const jsonForHtml = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const IMAGE_RE = /\.(webp|avif|png|jpe?g|gif|svg)$/i;

/** Chunk trong bundle (chỉ các trường plugin dùng; `viteMetadata` do Vite gắn). */
interface BundleChunk {
  type: string; fileName: string; name?: string; facadeModuleId?: string | null; isEntry?: boolean;
  imports?: string[]; moduleIds?: string[];
  viteMetadata?: { importedCss?: Set<string>; importedAssets?: Set<string> };
}
const normId = (id: string | null | undefined) => (id ?? '').replace(/\\/g, '/');
/** Chunk helper dùng chung của kiểu mở (vite.config.ts gom `src/guest/cover/open-kit/**`). */
export const isOpenKitChunk = (ch: BundleChunk) =>
  ch.name === 'open-kit' || (ch.moduleIds ?? []).some((m) => normId(m).includes('/cover/open-kit/'));


/** File woff2 (vietnamese + latin) của 1 family; null nếu thiếu package. */
export function fontFiles(root: string, id: FontId, role: string): FontFile[] | null {
  const meta: FontMeta = FONT_REGISTRY[id];
  const pkgDir = path.join(root, 'node_modules', '@fontsource', meta.pkg);
  let ranges: Record<string, string> = {};
  try {
    ranges = JSON.parse(readFileSync(path.join(pkgDir, 'unicode.json'), 'utf8')) as Record<string, string>;
  } catch {
    return null;
  }
  const out: FontFile[] = [];
  for (const face of meta.faces) {
    for (const subset of FONT_SUBSETS) {
      const file = fontsourceFile(meta.pkg, subset, face);
      const abs = path.join(pkgDir, 'files', file);
      if (!existsSync(abs) || !ranges[subset]) continue;
      const name = file.replace(/\.woff2$/, `.${hash8(readFileSync(abs))}.woff2`);
      out.push({ url: `/fonts/${name}`, abs, family: meta.family, weight: face.weight, style: face.style, subset, range: ranges[subset]!, role });
    }
  }
  return out;
}

export interface PreviewAssets {
  fonts: Record<string, FontFile[]>;
  ornaments: Record<string, Asset>;
  dividers: Record<string, Asset>;
}

/** Sprite divider riêng `/ornaments/divider-<id>.<hash8>.svg` (chung tiền tố /ornaments/ -> _headers + middleware dev không đổi). */
export function dividerAsset(root: string, id: string): Asset {
  const abs = path.join(root, 'src', 'guest', 'theme-assets', 'dividers', `${id}.svg`);
  return { abs, url: isDividerSprite(id) && existsSync(abs) ? `/ornaments/divider-${id}.${hash8(readFileSync(abs))}.svg` : '' };
}

/**
 * Asset cho khung preview của admin (solution 9.1 mục 5: "mọi module vẫn được build ra"):
 * mọi font + ornament đã bật trong capabilities, để đổi theme/font trong admin xem được ngay.
 * Khách KHÔNG tải các file này (chỉ khung preview đọc /preview-assets.json).
 */
export function previewAssets(root: string): PreviewAssets {
  const fonts: Record<string, FontFile[]> = {};
  for (const id of CAPABILITIES.font.supported) {
    const f = fontFiles(root, id, FONT_REGISTRY[id].role);
    if (f) fonts[id] = f;
  }
  const ornaments: Record<string, Asset> = {};
  for (const set of CAPABILITIES.ornamentSet.supported) {
    const abs = path.join(root, 'src', 'guest', 'theme-assets', 'ornaments', `${set}.svg`);
    if (existsSync(abs)) ornaments[set] = { abs, url: `/ornaments/${set}.${hash8(readFileSync(abs))}.svg` };
  }
  const dividers: Record<string, Asset> = {};
  for (const id of DIVIDER_SPRITES) {
    const a = dividerAsset(root, id);
    if (a.url) dividers[id] = a;
  }
  return { fonts, ornaments, dividers };
}

export function previewAssetsJson(p: PreviewAssets): string {
  const fonts: Record<string, { family: string; weight: number; style: string; url: string; range: string }[]> = {};
  for (const [id, list] of Object.entries(p.fonts)) fonts[id] = list.map((f) => ({ family: f.family, weight: f.weight, style: f.style, url: f.url, range: f.range }));
  const ornaments: Record<string, string> = {};
  for (const [k, a] of Object.entries(p.ornaments)) ornaments[k] = a.url;
  const dividers: Record<string, string> = {};
  for (const [k, a] of Object.entries(p.dividers)) dividers[k] = a.url;
  return JSON.stringify({ fonts, ornaments, dividers });
}

/** Tính toàn bộ dữ liệu inject từ config thô (tách riêng để unit test). */
export function buildState(root: string, raw: unknown, fail: (m: string) => never | void = () => {}): State {
  const m = migrate(raw);
  const merged = mergeWithDefaults(m.config);
  const config = merged.config;
  const r = resolveTheme(config);
  const warnings = [...m.warnings, ...merged.warnings, ...r.warnings];
  planSections(config, r.divider, (w) => warnings.push(w));

  // fonts: 3 family đã resolve
  const fonts: FontFile[] = [];
  for (const role of ['heading', 'script', 'body'] as const) {
    const files = fontFiles(root, r.fonts[role], role);
    if (!files) { fail(`[inject-config-og] Thiếu @fontsource/${FONT_REGISTRY[r.fonts[role]].pkg} (font "${FONT_REGISTRY[r.fonts[role]].family}"). Chạy npm install.`); continue; }
    fonts.push(...files);
  }

  const ornAbs = path.join(root, 'src', 'guest', 'theme-assets', 'ornaments', `${r.ornamentSet}.svg`);
  const ornament: Asset = { abs: ornAbs, url: existsSync(ornAbs) ? `/ornaments/${r.ornamentSet}.${hash8(readFileSync(ornAbs))}.svg` : '' };
  const divider = dividerAsset(root, r.divider);

  const stacks = { heading: fontStack(r.fonts.heading), script: fontStack(r.fonts.script), body: fontStack(r.fonts.body) };
  const vars = themeCssVars(r, stacks);
  const faces = fonts
    .map((f) => `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${f.url}) format('woff2');unicode-range:${f.range}}`)
    .join('');
  const styleText = `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}${faces}`;
  const styleHash = createHash('sha256').update(styleText, 'utf8').digest('base64');
  const resolved = { ...r, warnings, ornamentUrl: ornament.url, ...(divider.url ? { dividerUrl: divider.url } : {}) };
  return { config, resolved, warnings, fonts, ornament, divider, styleText, styleHash };
}

export function injectConfigOg(): Plugin {
  let cfg: ResolvedConfig;
  let root = process.cwd();
  let state: State | null = null;
  let isBuild = false;
  let budget: Record<string, string[]> = {};

  /** WP_CONFIG_PATH: build thử với file config khác (test e2e), mặc định public/content/config.json */
  const configPath = () => (process.env.WP_CONFIG_PATH ? path.resolve(process.env.WP_CONFIG_PATH) : path.join(root, 'public', 'content', 'config.json'));

  function load(fail: (m: string) => never | void): State {
    let raw: unknown;
    const p = configPath();
    try {
      raw = JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      const msg = `[inject-config-og] Không đọc được ${path.relative(root, p)}: ${(e as Error).message}`;
      fail(msg);
      raw = {};
    }
    return buildState(root, raw, fail);
  }

  function headTags(s: State, bundle?: Record<string, BundleChunk>): string {
    const c = s.config;
    const r = s.resolved;
    const out: string[] = [];
    const title = c.meta.title || 'Thiệp cưới';
    out.push(`<title>${escText(title)}</title>`);
    out.push(`<meta name="description" content="${escAttr(c.meta.description)}">`);
    out.push(`<meta name="theme-color" content="${r.tokens.bg}">`);
    if (c.meta.noindex) out.push('<meta name="robots" content="noindex, nofollow">');
    const site = safeHttpsUrl(c.meta.siteUrl)?.replace(/\/$/, '') ?? '';
    out.push(`<meta property="og:type" content="website">`, `<meta property="og:locale" content="${escAttr(c.meta.locale)}">`);
    out.push(`<meta property="og:title" content="${escAttr(title)}">`, `<meta property="og:description" content="${escAttr(c.meta.description)}">`);
    if (site) out.push(`<meta property="og:url" content="${escAttr(site + '/')}">`);
    const og = c.meta.ogImage;
    if (og?.src) {
      const u = /^https?:/.test(og.src) ? og.src : site ? `${site}${assetUrl(og.src)}` : assetUrl(og.src);
      out.push(`<meta property="og:image" content="${escAttr(u)}">`);
      if (og.w && og.h) out.push(`<meta property="og:image:width" content="${og.w}">`, `<meta property="og:image:height" content="${og.h}">`);
      if (og.alt) out.push(`<meta property="og:image:alt" content="${escAttr(og.alt)}">`);
      out.push('<meta name="twitter:card" content="summary_large_image">');
    } else out.push('<meta name="twitter:card" content="summary">');
    out.push(`<link rel="icon" href="${escAttr(c.meta.favicon?.src ? assetUrl(c.meta.favicon.src) : '/favicon.svg')}">`);
    // preload: font script + heading italic (latin + vietnamese của script - tên trên cover), tối đa 2
    const pre = s.fonts.filter((f) => f.role === 'script' && (f.subset === 'latin' || f.subset === 'vietnamese')).slice(0, 2);
    for (const f of pre) out.push(`<link rel="preload" href="${f.url}" as="font" type="font/woff2" crossorigin>`);
    const hero = c.content.hero.image;
    if (hero?.src) out.push(`<link rel="preload" href="${escAttr(assetUrl(hero.src))}" as="image" fetchpriority="high">`);
    // modulepreload: openStyle + loại hạt đang dùng (chỉ khi build, có bundle)
    if (bundle) {
      const want = [
        `/cover/styles/${r.openStyle}.ts`,
        ...(r.openStyle === 'envelope' ? [`/cover/skins/${r.envelope.style}.ts`] : []),
        ...r.particles.types.map((t) => `/particles/types/${t}.ts`),
      ];
      const extra: string[] = [];
      for (const ch of Object.values(bundle)) {
        const id = normId(ch.facadeModuleId);
        if (ch.type !== 'chunk' || !want.some((w) => id.endsWith(w))) continue;
        out.push(`<link rel="modulepreload" href="/${ch.fileName}">`);
        if (!id.includes('/cover/styles/')) continue;
        // kiểu mở đang dùng: chunk open-kit nó import, CSS riêng, ảnh import trong module (solution-v4a-2bc.md 0.7b)
        for (const imp of ch.imports ?? []) {
          const c = bundle[imp];
          if (c?.type === 'chunk' && isOpenKitChunk(c)) extra.push(`<link rel="modulepreload" href="/${c.fileName}">`);
        }
        ch.viteMetadata?.importedCss?.forEach((css) => extra.push(`<link rel="stylesheet" href="/${css}">`));
        ch.viteMetadata?.importedAssets?.forEach((a) => { if (IMAGE_RE.test(a)) extra.push(`<link rel="preload" href="/${a}" as="image">`); });
      }
      out.push(...new Set(extra));
    }
    out.push(`<style id="wp-theme">${s.styleText}</style>`);
    out.push(`<script type="application/json" id="wp-config">${jsonForHtml(c)}</script>`);
    out.push(`<script type="application/json" id="wp-resolved">${jsonForHtml(r)}</script>`);
    return out.join('\n    ');
  }

  return {
    name: 'wp:inject-config-og',
    configResolved(c) {
      cfg = c;
      root = c.root;
      isBuild = c.command === 'build';
    },
    buildStart() {
      state = load((m) => (isBuild ? this.error(m) : this.warn(m)));
      for (const w of state.warnings) this.warn(`[config] ${w}`);
      if (isBuild) this.addWatchFile(configPath());
    },
    configureServer(server) {
      server.watcher.add(configPath());
      server.watcher.on('change', (f) => {
        if (path.resolve(f) === path.resolve(configPath())) {
          state = load((m) => cfg.logger.error(m));
          // sự kiện riêng: trang khách tự tải lại (main.ts); trang admin KHÔNG bị tải lại (giữ phiên chỉnh sửa)
          server.ws.send({ type: 'custom', event: 'wp:content-changed', data: {} });
        }
      });
      let pa: PreviewAssets | null = null;
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]!;
        if (url === '/preview-assets.json') {
          pa ??= previewAssets(root);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          return res.end(previewAssetsJson(pa));
        }
        if (!state || !(url.startsWith('/fonts/') || url.startsWith('/ornaments/'))) return next();
        pa ??= previewAssets(root);
        const all = [...state.fonts, state.ornament, state.divider, ...Object.values(pa.fonts).flat(), ...Object.values(pa.ornaments), ...Object.values(pa.dividers)];
        const hit = all.find((a) => a.url === url);
        if (!hit) return next();
        res.setHeader('Content-Type', url.endsWith('.svg') ? 'image/svg+xml' : 'font/woff2');
        res.end(readFileSync(hit.abs));
      });
    },
    generateBundle(_o, bundle) {
      if (!state) return;
      const emitted = new Set<string>();
      const emit = (a: Asset) => {
        if (!a.url || emitted.has(a.url)) return;
        emitted.add(a.url);
        this.emitFile({ type: 'asset', fileName: a.url.slice(1), source: readFileSync(a.abs) });
      };
      state.fonts.forEach(emit);
      emit(state.ornament);
      emit(state.divider);
      // asset cho khung preview admin (không nằm trong trang đầu của khách)
      const pa = previewAssets(root);
      Object.values(pa.fonts).flat().forEach(emit);
      Object.values(pa.ornaments).forEach(emit);
      Object.values(pa.dividers).forEach(emit);
      this.emitFile({ type: 'asset', fileName: 'preview-assets.json', source: previewAssetsJson(pa) });

      // phân loại chunk cho size-limit
      const initialJs = new Set<string>();
      const initialCss = new Set<string>();
      const open: string[] = [];
      const skins: string[] = [];
      const particle: string[] = [];
      const lazy: string[] = [];
      const openKit: string[] = [];
      const openCss: string[] = [];
      const burst: string[] = [];
      const motif: string[] = [];
      const motifCss: string[] = [];
      const chunks = Object.values(bundle).filter((c) => c.type === 'chunk');
      const byName = new Map(chunks.map((c) => [c.fileName, c]));
      const visit = (name: string) => {
        if (initialJs.has(name)) return;
        const ch = byName.get(name);
        if (!ch || ch.type !== 'chunk') return;
        initialJs.add(name);
        const meta = (ch as unknown as { viteMetadata?: { importedCss?: Set<string> } }).viteMetadata;
        meta?.importedCss?.forEach((css) => initialCss.add(css));
        ch.imports.forEach(visit);
      };
      /** mọi chunk tới được từ 1 entry (tĩnh + động) */
      const reach = (entryName: string, dynamic: boolean) => {
        const seen = new Set<string>();
        const go = (n: string) => {
          if (seen.has(n)) return;
          const ch = byName.get(n);
          if (!ch || ch.type !== 'chunk') return;
          seen.add(n);
          ch.imports.forEach(go);
          if (dynamic) ch.dynamicImports.forEach(go);
        };
        go(entryName);
        return seen;
      };
      let guestEntry = '';
      let adminEntry = '';
      for (const ch of chunks) {
        if (ch.type !== 'chunk' || !ch.isEntry) continue;
        const id = (ch.facadeModuleId ?? '').replace(/\\/g, '/');
        // facade = file HTML (nhiều entry) hoặc file TS
        if (id.endsWith('/admin/index.html') || id.endsWith('/src/admin/main.tsx')) adminEntry = ch.fileName;
        else if (id.endsWith('/index.html') || id.endsWith('/src/guest/main.ts')) guestEntry = ch.fileName;
      }
      if (guestEntry) visit(guestEntry);
      const guestAll = guestEntry ? reach(guestEntry, true) : new Set<string>();
      const r = state.resolved;
      for (const ch of chunks) {
        if (ch.type !== 'chunk' || ch.isEntry || !guestAll.has(ch.fileName)) continue;
        const id = normId(ch.facadeModuleId);
        if (isOpenKitChunk(ch as BundleChunk)) {
          // helper kiểu mở dùng chung: ≤ 3 KB; vào JS ban đầu qua `visit` khi kiểu đang dùng import nó
          openKit.push(ch.fileName);
        } else if (id.includes('/cover/skins/') && !id.endsWith('/kit.ts')) {
          // mẫu phong bì (skin): ≤ 1.5 KB/mẫu; mẫu đang dùng nằm trong JS ban đầu (vẽ trước khi khách chạm)
          skins.push(ch.fileName);
          if (r.openStyle === 'envelope' && id.endsWith(`/cover/skins/${r.envelope.style}.ts`)) visit(ch.fileName);
        } else if (id.includes('/cover/styles/')) {
          open.push(ch.fileName);
          (ch as BundleChunk).viteMetadata?.importedCss?.forEach((css) => openCss.push(css));
          if (id.endsWith(`/cover/styles/${r.openStyle}.ts`)) visit(ch.fileName);
        } else if (id.includes('/particles/types/')) {
          particle.push(ch.fileName);
          if (r.particles.types.some((t) => id.endsWith(`/particles/types/${t}.ts`))) visit(ch.fileName);
        } else if (id.includes('/effects/burst/') && !/\/burst\/(fireworks[^/]*|registry)\.ts$/.test(id)) {
          burst.push(ch.fileName);
        } else if (id.endsWith('/guest/motif/motif.ts')) {
          // hoạ tiết nền B2 (v4a-1): chunk lười riêng, ngân sách JS ≤ 1.5 KB + CSS ≤ 3 KB (không tính vào lazy chung)
          motif.push(ch.fileName);
          (ch as BundleChunk).viteMetadata?.importedCss?.forEach((css) => motifCss.push(css));
        } else if (!initialJs.has(ch.fileName)) lazy.push(ch.fileName);
      }
      // admin (solution 9.1: "Admin JS ban đầu ≤ 150 KB"; route nặng lazy)
      const adminInitial = adminEntry ? reach(adminEntry, false) : new Set<string>();
      const adminAll = adminEntry ? reach(adminEntry, true) : new Set<string>();
      const adminCss = new Set<string>();
      for (const n of adminInitial) {
        const meta = (byName.get(n) as unknown as { viteMetadata?: { importedCss?: Set<string> } } | undefined)?.viteMetadata;
        meta?.importedCss?.forEach((css) => adminCss.add(css));
      }
      budget = {
        initialJs: [...initialJs], initialCss: [...initialCss], openStyle: open, envelopeSkin: skins, particle, lazy: lazy.filter((x) => !initialJs.has(x)),
        openKit, openStyleCss: [...new Set(openCss)], burst,
        // chunk hoạ tiết nền B2 (v4a-1, solution.md Rev 5 mục 10.7): JS + CSS chunk `/guest/motif/motif.ts`
        motif, motifCss: [...new Set(motifCss)],
        adminInitialJs: [...adminInitial], adminInitialCss: [...adminCss],
        adminLazy: [...adminAll].filter((x) => !adminInitial.has(x) && !guestAll.has(x)),
      };
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.path.endsWith('/index.html') || ctx.path.includes('/admin/')) return html;
        if (!state) state = load((m) => cfg.logger.error(m));
        const r = state.resolved;
        html = html.replace(/<html([^>]*)>/, `<html$1 data-theme="${r.preset}" data-mode="${r.mode}">`);
        html = html.replace(/<title>[^<]*<\/title>\s*/, '');
        return html.replace('</head>', `    ${headTags(state, ctx.bundle as never)}\n  </head>`);
      },
    },
    closeBundle() {
      if (!isBuild || !state) return;
      const out = path.resolve(root, cfg.build.outDir);
      const hp = path.join(out, '_headers');
      if (existsSync(hp)) {
        const txt = readFileSync(hp, 'utf8').replace(/__WP_STYLE_HASHES__/g, `'sha256-${state.styleHash}'`);
        writeFileSync(hp, txt);
      }
      const dir = path.join(root, '.wp-build');
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'budget.json'), JSON.stringify({ outDir: path.relative(root, out), ...budget, styleHash: state.styleHash }, null, 2));
    },
  };
}
