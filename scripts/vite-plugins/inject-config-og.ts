/**
 * Plugin `inject-config-og` (solution 5.1, 5.3, 9.1, 9.4):
 *  - đọc public/content/config.json -> migrate -> merge -> resolveTheme (cùng code với guest)
 *  - inline vào index.html: #wp-config, #wp-resolved, <style id="wp-theme"> (CSS vars + @font-face 3 family),
 *    data-mode/data-theme, <title>, meta/OG, preload font cover + ornament sprite + ảnh hero,
 *    modulepreload cho module openStyle + loại hạt đang dùng
 *  - emit font woff2 (@fontsource) + ornament sprite có hash
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

interface FontFile { url: string; abs: string; family: string; weight: number; style: string; subset: string; range: string; role: string }
interface Asset { url: string; abs: string }

export interface State {
  config: WeddingConfig;
  resolved: ResolvedTheme & { ornamentUrl: string };
  warnings: string[];
  fonts: FontFile[];
  ornament: Asset;
  styleText: string;
  styleHash: string;
}

const hash8 = (buf: Buffer | string) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const jsonForHtml = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');


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
    const meta: FontMeta = FONT_REGISTRY[r.fonts[role]];
    const pkgDir = path.join(root, 'node_modules', '@fontsource', meta.pkg);
    let ranges: Record<string, string> = {};
    try {
      ranges = JSON.parse(readFileSync(path.join(pkgDir, 'unicode.json'), 'utf8')) as Record<string, string>;
    } catch {
      fail(`[inject-config-og] Thiếu @fontsource/${meta.pkg} (font "${meta.family}"). Chạy npm install.`);
      continue;
    }
    for (const face of meta.faces) {
      for (const subset of FONT_SUBSETS) {
        const file = fontsourceFile(meta.pkg, subset, face);
        const abs = path.join(pkgDir, 'files', file);
        if (!existsSync(abs) || !ranges[subset]) continue;
        const name = file.replace(/\.woff2$/, `.${hash8(readFileSync(abs))}.woff2`);
        fonts.push({ url: `/fonts/${name}`, abs, family: meta.family, weight: face.weight, style: face.style, subset, range: ranges[subset]!, role });
      }
    }
  }

  const ornAbs = path.join(root, 'src', 'guest', 'theme-assets', 'ornaments', `${r.ornamentSet}.svg`);
  const ornament: Asset = { abs: ornAbs, url: existsSync(ornAbs) ? `/ornaments/${r.ornamentSet}.${hash8(readFileSync(ornAbs))}.svg` : '' };

  const stacks = { heading: fontStack(r.fonts.heading), script: fontStack(r.fonts.script), body: fontStack(r.fonts.body) };
  const vars = themeCssVars(r, stacks);
  const faces = fonts
    .map((f) => `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${f.url}) format('woff2');unicode-range:${f.range}}`)
    .join('');
  const styleText = `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}${faces}`;
  const styleHash = createHash('sha256').update(styleText, 'utf8').digest('base64');
  return { config, resolved: { ...r, warnings, ornamentUrl: ornament.url }, warnings, fonts, ornament, styleText, styleHash };
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

  function headTags(s: State, bundle?: Record<string, { type: string; fileName: string; facadeModuleId?: string | null }>): string {
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
        ...r.particles.types.map((t) => `/particles/types/${t}.ts`),
      ];
      for (const ch of Object.values(bundle)) {
        const id = (ch.facadeModuleId ?? '').replace(/\\/g, '/');
        if (ch.type === 'chunk' && want.some((w) => id.endsWith(w))) out.push(`<link rel="modulepreload" href="/${ch.fileName}">`);
      }
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
          server.ws.send({ type: 'full-reload' });
        }
      });
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]!;
        if (!state || !(url.startsWith('/fonts/') || url.startsWith('/ornaments/'))) return next();
        const hit = [...state.fonts, state.ornament].find((a) => a.url === url);
        if (!hit) return next();
        res.setHeader('Content-Type', url.endsWith('.svg') ? 'image/svg+xml' : 'font/woff2');
        res.end(readFileSync(hit.abs));
      });
    },
    generateBundle(_o, bundle) {
      if (!state) return;
      for (const f of state.fonts) this.emitFile({ type: 'asset', fileName: f.url.slice(1), source: readFileSync(f.abs) });
      if (state.ornament.url) this.emitFile({ type: 'asset', fileName: state.ornament.url.slice(1), source: readFileSync(state.ornament.abs) });

      // phân loại chunk cho size-limit
      const initialJs = new Set<string>();
      const initialCss = new Set<string>();
      const open: string[] = [];
      const particle: string[] = [];
      const lazy: string[] = [];
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
      for (const ch of chunks) {
        if (ch.type !== 'chunk') continue;
        const id = (ch.facadeModuleId ?? '').replace(/\\/g, '/');
        if (ch.isEntry && id.endsWith('/src/guest/main.ts')) visit(ch.fileName);
      }
      const r = state.resolved;
      for (const ch of chunks) {
        if (ch.type !== 'chunk' || ch.isEntry) continue;
        const id = (ch.facadeModuleId ?? '').replace(/\\/g, '/');
        if (id.includes('/cover/styles/')) {
          open.push(ch.fileName);
          if (id.endsWith(`/cover/styles/${r.openStyle}.ts`)) visit(ch.fileName);
        } else if (id.includes('/particles/types/')) {
          particle.push(ch.fileName);
          if (r.particles.types.some((t) => id.endsWith(`/particles/types/${t}.ts`))) visit(ch.fileName);
        } else if (!initialJs.has(ch.fileName)) lazy.push(ch.fileName);
      }
      budget = { initialJs: [...initialJs], initialCss: [...initialCss], openStyle: open, particle, lazy: lazy.filter((x) => !initialJs.has(x)) };
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
