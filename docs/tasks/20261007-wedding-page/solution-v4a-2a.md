# Solution v4a-2a: B1 reveal theo section + 4 gói reveal + kiểu nguyên tử chưa bật + 10 micro còn lại

> Task `20261007-wedding-page` · solution-designer · 2026-10-09.
> Nguồn: `design-v4a-2a.md` (đã duyệt, gồm Phụ lục A và R2A-01..08), `design-report-v4a-2a.md`, `decisions.md` mục "Cổng 1 v4a-2b/2c + duyệt thiết kế v4a-2a (2026-10-09)" (7 giả định đã đồng ý), `solution-v4a-2bc.md` (Bước 0 mục 0, bản đồ sở hữu mục 3), `solution.md` §5, §8.4, §9.1 (chỉ đọc, đang có Rev 5), `status.md` mục 8, code hiện tại (đường dẫn ghi ở từng mục).
> **Tiền đề:** Bước 0 (`solution-v4a-2bc.md` mục 0) đã merge vào branch phiên trước khi tách `wt/v4a-2a`. Kế hoạch này dùng đúng các khớp nối của Bước 0: `src/shared/caps/v4a-2a.ts`, `fx/reveal-block.tsx`, `fx/micro-block.tsx`, vùng `// [v4a-2a] >>>/<<<`, helper `tests/e2e/fx-helpers.ts` (`bootPreview`, `strongDevice`, `fxSnap`, `watchConsole`).
> Không sửa `solution.md`. Mục "Bàn giao cho solution.md" ở cuối liệt kê các dòng cần cập nhật khi Rev 5 xong.

---

## 📋 Tóm tắt yêu cầu

- **B1:** reveal không còn một gói cho cả trang. Mỗi section nhận một "gói hiệu lực" theo thứ tự ưu tiên ghim của section > ghi đè vai trò cấp trang > xen kẽ tự động (mặc định) hoặc giống nhau. Kết quả tất định, guest và preview admin cho cùng kết quả. Schema thêm `effects.reveal.mode` và `effects.reveal.sections`, không tăng `schemaVersion`.
- **4 gói + 6 nguyên tử:** bật `editorial`, `letter`, `playful`, `cinematic` và `mask-up`, `wipe`, `blur-in`, `split-words`, `split-chars`, `parallax-layers`, kèm chốt chặn tiếng Việt (không lộ dấu khi ẩn, không clip ở trạng thái cuối), hạ cấp theo cường độ, máy yếu, giảm chuyển động và bước FPS mới `revealLite`.
- **10 micro còn lại:** `btn-shine`, `photo-tilt`, `countdown-odometer`, `slide`, `scroll-progress`, `name-sparkle`, `music-ripple`, `gift-shake`, `calendar-flip`, `couple-heart-tap`, theo §4 design (đã sửa R2A-05, R2A-07). Admin thêm điều khiển ở màn "Hiệu ứng" (route lười) và nhãn ghim nhỏ ở "Các phần & thứ tự".

---

## 🔍 Phân tích

### Tái sử dụng được
| Thành phần | File | Dùng cho |
|---|---|---|
| Engine reveal hiện có: `atomFor`, `prepareReveal`, `startReveal` (IO `threshold .15`, `rootMargin 0 0 -10% 0`), `revealAll` | `src/guest/effects/reveal.ts` | Giữ khung, mở rộng theo section |
| Bảng `REVEAL_PACKS` đủ 6 gói (đúng design 5.8) | `src/shared/theme/resolve.ts` dòng 39, 60-68 | Chuyển sang `src/shared/reveal-plan.ts`, `resolve.ts` re-export |
| `MATRIX` (`reveal`, `split`, `svgDraw`, `attention`, `press`, `photoTilt`, `countdown`, `scrollProgress`), `computeIntensity` (`lowEnd`, `reduced`) | `src/guest/effects/intensity.ts` | Chỉ sửa dòng `scrollProgress` |
| `DEGRADE_ORDER`, `startPerfProbe` | `src/guest/effects/perf-probe.ts` | Thêm `revealLite` cuối |
| `applyFxClasses` (`data-fx`, `fx-attn`, `fx-press`), `setupParallax` (1 listener cuộn passive + rAF), `afterOpen`, `setGuestFx` | `src/guest/effects/service.ts` | Gắn micro, `--fx-slow`, lớp parallax |
| `EffectRegistry` (`register/play/setTimeScale`, `timeScale`) | `src/guest/effects/registry.ts` | Đăng ký `micro:*` cho preview; đọc `timeScale` để đặt `--fx-slow` |
| `planSections()` (lọc bật + không rỗng, thứ tự) | `src/shared/sections/meta.ts` | Admin tính plan; guest tính từ DOM (cùng kết quả cho section expressive) |
| `capOr`, `isSupported`, `CAPABILITIES` (đã nằm trong entry guest qua `countdown.ts`) | `src/shared/capabilities.ts` | Lọc ghim, bộ hài hoà |
| Phần tử đã đánh dấu `data-rv` (`.sec-head` eyebrow/h2/`.sec-orn`, `framed()`, `.al-tile` có `--i`, `.person`, `.fam-col`, `.hero-names`, `.ty-sig[data-sig]`, divider) | `src/guest/sections/*.ts` | Không cần sửa markup; vai trò/ngữ cảnh đọc từ class |
| `css()`/`h()` (CSSOM, hợp CSP) | `src/guest/dom.ts` | Mọi biến `--stagger`, `--ln`, `--k`, `--rv-ps`, `--p`, `--gx` |
| Preview: `fx:replay` nạp lại khung với stash, `previewAfterOpen`, `boot.fx.speed` -> `EffectRegistry.setTimeScale` | `src/guest/bootstrap.ts`, `src/guest/preview-bridge.ts` | `reveal`, `reveal:<id>`, `micro:*`; `preview-bridge.ts` **không cần sửa** (target là chuỗi tự do) |
| Admin `preview.replay(target, label)` (nhãn "Đang xem" truyền từ nơi gọi), `peek()`, `toast(msg, { action })`, `Segmented`, `Select`, `Details`, `Toggle` | `src/admin/editor/preview.tsx`, `src/admin/ui/ui.tsx` | Khối reveal + micro; `preview.tsx` **không cần sửa** |
| Nhóm `reveal` trong đổi theme (Q17) | `src/admin/draft/ops.ts` dòng 113-114, 131 | Thêm `mode`, `sections` |
| Nhãn `REVEAL_LABEL`, `COUNTDOWN_STYLE_LABEL` (đã có `slide`, `odometer`), `enumLabel`, `labelForPath` | `src/shared/labels.ts`, `src/shared/config/schema-meta.ts` | Nhãn mode + diff ghim |
| Icon `sparkle`, `heart`, `calendar` | `src/guest/icons.ts` | name-sparkle, heart-tap, calendar-flip |

### Khoảng trống phát hiện khi đọc code
1. `resolveTheme` gộp ghi đè vai trò vào gói (`reveal.heading = override ?? pack.heading`), nên guest không biết phần tử nào bị ghi đè. Cần tách `overrides` riêng (thứ tự ưu tiên 2.2 cần biết).
2. Guest **không** import tĩnh `resolve.ts` (chỉ lười khi thiếu inline). Nếu engine import `REVEAL_PACKS` từ `resolve.ts` thì cả resolver bị kéo vào entry. Phải chuyển bảng gói sang file riêng nhẹ.
3. `atomFor` hiện đổi `blur-in` thành `fade-up` ở Vừa (R2A-02) và `tests/intensity.test.ts` dòng 111 đang khoá hành vi này: test phải đổi theo spec mới.
4. `previewAfterOpen` coi `reveal` là "cuộn tới section có ảnh đầu tiên"; `MICRO_SECTION.photoTilt = 'album'`, `buttonShine = 'hero'` (khác design 5.4). Preview không có cơ chế phát lại một section.
5. `fx:done` chỉ gửi lên `window.parent`; trang mở trực tiếp (e2e dùng `bootPreview`) không quan sát được. Cần hook debug ghi lại `fx:done` khi `?debug=fx`.
6. Diff "Xem thay đổi": `labelForPath('effects.reveal.sections.families')` rơi về "Hiện nội dung khi cuộn › sections.families"; `enumLabel` không biết đường dẫn động. Ngoài ra `flatten()` ghi lá cho object rỗng, nên ghim đầu tiên sinh thêm dòng "… xoá {}" (cùng hiện tượng với `theme.overrides` hiện có).
7. `perf-probe` có bước `photoTilt` nhưng `service.ts` chưa xử lý bước này.
8. `.ty-sig` (chữ ký) giữ `clip-path` vĩnh viễn ở trạng thái cuối (`fx.css` dòng 32), đây là R2A-03.
9. `checklist.ts` dòng 79 chỉ cảnh báo tổ hợp nặng khi **gói chính** là `cinematic`; ghim `cinematic` không được tính.

### Cần tạo mới (tóm tắt)
- Shared: `src/shared/reveal-plan.ts` (gói, phân loại section, bộ hài hoà, thuật toán, ưu tiên vai trò).
- Guest entry: tách engine thành `src/guest/effects/reveal/{atoms,text,mask-lines,wipe-queue}.ts` + `reveal.ts` điều phối.
- Guest lười: `reveal/reveal-split.ts`, `reveal/parallax-layers.ts`, `reveal/fx-preview.ts`, `micro/micro-attn.ts`, `micro/photo-tilt.ts`, `micro/heart-tap.ts`, `micro/scroll-progress.ts`, `micro/odometer.ts`.
- Admin: nội dung mới trong `fx/reveal-block.tsx` + `fx/reveal-block.css`, `fx/micro-block.tsx`.
- Test: `tests/reveal-plan.test.ts`, `tests/reveal-atoms.test.ts`, `tests/v4a2a-schema.test.ts`, `tests/micro.test.ts`, `tests/e2e/v4a-2a.spec.ts`.

### Rủi ro / edge case chính
- **Lộ dấu hoặc cắt dấu tiếng Việt** (mask-up, wipe, split): xử lý bằng R2A-01/03/04 + e2e so ảnh + gỡ wrapper ở trạng thái cuối.
- **CLS** khi tách dòng/từ: wrapper có `margin-block` âm bù `padding-block`, span không có padding; e2e đo CLS < 0.05.
- **Font chưa tải xong** khi tách dòng: chỉ đo sau `document.fonts.ready`; chưa xong mà phần tử vào màn thì dùng `fade-up`.
- **Ngân sách entry** (JS ban đầu 31.22/60 KB, sau Bước 0 lệch ≤ 0.3 KB): reveal ≤ +2.5 KB, phần micro trong entry ≤ +0.6 KB, còn lại lười.
- **Xung đột merge** với v4a-1 ở `resolve.ts`, `merge.ts`, `labels.ts`, `schema-meta.ts`, `ops.ts` (đợt 2a merge sau v4a-1, xem mục 6).
- **Hành vi đổi sau deploy**: config cũ không có `mode` thành `"auto"` (Q1 đã đồng ý). `public/content/config.json` (Trầm Vàng) sẽ hiện xen kẽ ngay.
- Safari < 16 không có `overflow: clip`; Safari < 14.1, Firefox < 125 không có `Intl.Segmenter`; `animation-timeline` chưa có trên Safari/Firefox: đều có fallback (mục 3.4).

---

## 🏗️ Giải pháp

### Database
Không có DB (site tĩnh). Phần "schema" là config JSON, chốt ở mục 1.

#### 1. Schema cuối (KHÔNG tăng `schemaVersion`)

**1.1 Config** (`WeddingConfig.effects.reveal`)
| Field | Kiểu / enum | Mặc định | Ghi chú |
|---|---|---|---|
| `effects.reveal.style` | `"theme"` · `RevealStyle` | `"theme"` | Giữ. Là gói chính **A** |
| `effects.reveal.mode` **(mới)** | `"auto"` · `"uniform"` | `"auto"` | Nhãn: "Xen kẽ tự động" / "Giống nhau mọi phần" |
| `effects.reveal.sections` **(mới)** | `{ [sectionId: string]: RevealStyle }` | `{}` | Khoá = `sections.items[].id`. Không có khoá = theo `mode`. Ghim bằng A vẫn có nghĩa (khoá section đó ở A khi `auto`) |
| `effects.reveal.heading/block/image/ornament` | `RevealAtom \| null` | `null` | Giữ. Ưu tiên dưới ghim, trên auto/uniform. Chưa có UI (v4b, Q4) nhưng runtime tôn trọng |

- `enums.ts` (vùng `[v4a-2a]` sau `REVEAL_ATOMS`): `export const REVEAL_MODES = ['auto', 'uniform'] as const; export type RevealMode = (typeof REVEAL_MODES)[number];`
- `types.ts` (vùng `[v4a-2a]` trong `effects.reveal`): `mode: RevealMode; sections: Record<string, RevealStyle>;`
- `defaults.ts` (vùng `[v4a-2a]`): `mode: 'auto', sections: {}`. `deepMerge` coi `{}` là "map mở" (giữ khoá lạ), đúng nhu cầu.

**1.2 Sanitize trong `merge.ts`** (khối mới đặt **sau** `s.items = normalizeSectionItems(...)` vì cần danh sách id; sai thì về mặc định + `warnings`)
| Trường hợp | Kết quả |
|---|---|
| `mode` ngoài `REVEAL_MODES` | `"auto"` + cảnh báo (`fix()` sẵn có) |
| `sections` không phải object thuần (mảng, chuỗi, null) | `{}` (`deepMerge` đã giữ base); có giá trị mà bị bỏ thì cảnh báo |
| Khoá không có trong `sections.items[].id` | bỏ khoá + cảnh báo `config.effects.reveal.sections.<k>: không có phần này -> bỏ` |
| Giá trị ngoài `REVEAL_STYLES` | bỏ khoá + cảnh báo |
| Section đang **tắt** (`enabled: false`) | **giữ** ghim (bật lại vẫn còn) |
- Dựng lại object bằng `Object.fromEntries(entries hợp lệ)` (không gán động `out[k]`, tránh khoá `__proto__`).
- Không đổi `migrations.ts`: import v0 (`effects.scrollReveal.*`) vẫn bỏ qua như hiện tại; config v0/v1 thiếu field được merge thành `mode: "auto"`, `sections: {}`. `CURRENT_SCHEMA_VERSION` giữ 1.
- Tương thích ngược: bản v2.3 đọc config mới thì `deepMerge` giữ khoá lạ, resolver cũ bỏ qua, vô hại.

**1.3 `ResolvedTheme.reveal`** (`resolve.ts`, inline trong `#wp-resolved`, preview tính lúc chạy)
```ts
// src/shared/reveal-plan.ts
export type RevealRole = 'heading' | 'block' | 'image' | 'ornament';
export interface RevealPack { heading: RevealAtom; block: RevealAtom; image: RevealAtom; ornament: RevealAtom; stagger: number }
// src/shared/theme/resolve.ts
export interface ResolvedReveal extends RevealPack {   // các field cũ GIỮ NGUYÊN nghĩa: gói A đã áp ghi đè (tương thích test, theme.tsx, checklist)
  style: RevealStyle;                                   // A
  mode: RevealMode;
  overrides: Record<RevealRole, RevealAtom | null>;     // ghi đè cấp trang sau capability; null = theo gói
  pins: Record<string, RevealStyle>;                    // ghim đã lọc capability
  harmony: RevealStyle[];                               // [A, ...đồng hành] đã lọc capability (≥ 1 phần tử)
}
```
- `pins`: giá trị ngoài `capabilities.revealStyle` thì **bỏ ghim** (section đó theo tự động) + cảnh báo `"<gói>" (revealStyle) chưa có ở bản <STAGE> -> phần <id> theo tự động`. Khác Phụ lục A ("capOr fallback"): fallback `soft` sẽ ghim nhầm sang một gói người dùng không chọn (câu hỏi #1).
- `harmony = revealHarmony(A, CAPABILITIES.revealStyle.supported)`. `applyCapabilities: false` (admin xem dữ liệu thô): `pins` giữ nguyên, `harmony` không lọc.
- `REVEAL_PACKS` + `RevealPack` chuyển sang `reveal-plan.ts`; `resolve.ts` giữ `export { REVEAL_PACKS, type RevealPack } from '../reveal-plan.ts'` (test và code cũ không đổi import).
- Kích thước inline tăng khoảng 150 byte.

**1.4 Quan hệ với đổi theme (`src/admin/draft/ops.ts`, nhóm `reveal`)**
- `customizedGroups`: nhóm `reveal` là "đã chỉnh riêng" khi `style !== 'theme'` **hoặc** `mode !== 'auto'` **hoặc** `Object.keys(sections ?? {}).length > 0` **hoặc** có vai trò khác `null` (design 5.2).
- `resetGroup('reveal')` ("Dùng trọn gói"): `{ style: 'theme', mode: 'auto', sections: {}, heading: null, block: null, image: null, ornament: null }`. Phải đặt đủ 7 field, nếu không literal hiện tại (dòng 131) sẽ **xoá** `mode`/`sections` khỏi nháp.
- `changeTheme(keep)` không đổi: chỉ ghi `theme.preset`, ghim giữ nguyên.

**1.5 Capability (`src/shared/caps/v4a-2a.ts`, chỉ file này)**
```ts
export const CAPS_V4A_2A: CapsAddon = {
  revealAtom: ['mask-up', 'wipe', 'blur-in', 'split-words', 'split-chars', 'parallax-layers'],
  revealStyle: ['editorial', 'letter', 'playful', 'cinematic'],
  countdownStyle: ['slide', 'odometer'],
};
```
- Thêm id vào file **khi module đạt tiêu chí** (mục 9), thứ tự: nguyên tử trước, gói sau. Không cần key mới nên vùng `[v4a-2a] keys` trong `capabilities.ts` và `caps/types.ts` để trống. `STAGE` do orchestrator đặt.

**1.6 Nhãn**
- `labels.ts`: `REVEAL_MODE_LABEL: Record<RevealMode, string> = { auto: 'Xen kẽ tự động', uniform: 'Giống nhau mọi phần' }`; `BY_PATH['effects.reveal.mode'] = REVEAL_MODE_LABEL`; `enumLabel()` thêm nhánh: `path.startsWith('effects.reveal.sections.')` thì tra `REVEAL_LABEL`.
- `schema-meta.ts`: `EXTRA_LABELS['effects.reveal.mode'] = 'Cách áp dụng hiện nội dung'`, `EXTRA_LABELS['effects.reveal.sections'] = 'Kiểu hiện từng phần'`; `labelForPath()` thêm 1 nhánh đầu hàm: `effects.reveal.sections.<id>` thành `Kiểu hiện · <groupById(id)?.title ?? id>`.

### API Endpoints
Không có HTTP endpoint. Dưới đây là **contract nội bộ** (FE được đổi tên biến nội bộ, không đổi hình dạng public).

| Contract | File | Hình dạng |
|---|---|---|
| Bảng gói | `src/shared/reveal-plan.ts` | `REVEAL_PACKS: Record<RevealStyle, RevealPack>` (giá trị như hiện tại) |
| Phân loại section | `reveal-plan.ts` | `REVEAL_TIER: Record<SectionType, 'opening' \| 'expressive' \| 'functional'>`; `REVEAL_AFFINITY: Partial<Record<SectionType, readonly RevealStyle[]>>` (chỉ 6 section expressive, đúng bảng design 2.3) |
| Bộ hài hoà | `reveal-plan.ts` | `REVEAL_HARMONY: Record<RevealStyle, readonly [RevealStyle, RevealStyle]>` (bảng design 2.4); `revealHarmony(main, supported): RevealStyle[]` |
| Thuật toán | `reveal-plan.ts` | `revealPlan(secs: readonly { id: string; type: SectionType }[], inp: { main: RevealStyle; mode: RevealMode; pins: Readonly<Record<string, RevealStyle>>; harmony: readonly RevealStyle[] }): Record<string, { pack: RevealStyle; src: 'pinned' \| 'main' \| 'auto' }>` |
| Ưu tiên theo vai trò | `reveal-plan.ts` | `roleAtom(entry, role, main, overrides): { atom: RevealAtom; from: RevealStyle \| 'override' }`; `sectionStagger(entry, main): number` |
| Nguyên tử theo cấp + chốt chặn | `src/guest/effects/reveal/atoms.ts` | `atomFor(role, pack, state, c?: Partial<AtomCtx>): RevealAtom \| 'fade-fast'` (tham số thứ 4 tuỳ chọn, test cũ vẫn chạy); `AtomCtx = { lowEnd; script; nested; tile; pairCol; emptyFrame; graphemes; words; wide; blurUsed }` |
| Đo chữ (thuần) | `reveal/text.ts` | `graphemeCount(s)` (NFC, regex `/\P{M}\p{M}*/gu`, bỏ khoảng trắng), `wordCount(s)`, `hasLetters(s)` |
| Tách dòng (thuần phần gom) | `reveal/mask-lines.ts` | `groupLines(tops: number[]): number[]` (chỉ số dòng cho từng từ; sai lệch ≤ 2 px coi cùng dòng) + phần DOM `splitLines(el)`, `restore(el)` |
| Hàng đợi wipe (thuần, đồng hồ tiêm vào) | `reveal/wipe-queue.ts` | `class WipeQueue { constructor(cap: number, maxWaitMs = 600, now = performance.now) ; request(id): 'run' \| 'wait'; release(id): string[] /* id được chạy */; expired(): string[] /* chờ > 600 ms -> fade */ }` |
| Engine | `src/guest/effects/reveal.ts` | Giữ chữ ký `prepareReveal(root, rv: ResolvedReveal, state: FxState)` (lowEnd đọc `ctx.fx.lowEnd`), `startReveal(root)`, `revealAll(root)`; thêm `revealLite(root)`, `rearm(el)` (cho preview), `currentPlan(): Record<string, PlanEntry>` |
| Tách chữ (lười) | `reveal/reveal-split.ts` | `segment(text, kind: 'words' \| 'chars', useSegmenter = true): string[][]` (thuần, test được trong node); `split(el, kind)`, `restore(el)` |
| Preview / debug (lười) | `reveal/fx-preview.ts` | `runFxPreview(target, { speed, done })`; `installDebug()` gắn `window.__wpReveal = { plan, hold(id), play(id), rearmAll() }` và `window.__wpFxDone: { target: string; at: number }[]` (chỉ khi `?debug=fx`) |
| Micro đăng ký phát lại | các module micro | `EffectRegistry.register('micro:<mã>', { play, reset? })`; preview gọi `EffectRegistry.play('micro:<mã>')` |
| postMessage preview | không đổi kiểu | `fx:replay.target` thêm `reveal:<sectionId>`; `micro:<mã>` ánh xạ mới theo design 5.4 (`photoTilt` -> `couple`, `buttonShine` -> nút CTA hiển thị đầu tiên) |
| DOM (cho CSS và e2e) | guest | `section[data-rvp="<gói>"][data-rvs="auto\|pinned\|main"]`; phần tử `[data-rva]` + `[data-rvk="<gói nguồn>"]` (không có khi lấy từ ghi đè); trạng thái `.is-in`, `.rv-done`; mask/split chờ: `data-rvw="<nguyên tử muốn>"` |
| Deep link admin | admin | `sessionStorage['wp_fx_focus_v1'] = 'reveal:<id>' \| 'reveal-sections'`, `reveal-block.tsx` đọc rồi xoá khi mount |

**Ví dụ `#wp-resolved` (phần reveal, Trầm Vàng mặc định):**
```json
{ "reveal": { "style": "soft", "mode": "auto", "heading": "fade-up", "block": "fade-up", "image": "photo-settle",
  "ornament": "svg-draw", "stagger": 80, "overrides": { "heading": null, "block": null, "image": null, "ornament": null },
  "pins": {}, "harmony": ["soft", "editorial", "letter"] } }
```

### Data Flow
**Guest (trang thật):**
1. `bootstrap` render landing (đang `display:none` dưới cover) -> `prepareReveal(main, ctx.resolved.reveal, ctx.fx.state)` (lời gọi giữ nguyên chữ).
2. `prepareReveal`: đọc `main.querySelectorAll('.sec')` thành `{ id, type: dataset.type }[]` -> `revealPlan()` -> mỗi section đặt `data-rvp`, `data-rvs`, `--stagger` (`css()`); mỗi `[data-rv]` -> `roleAtom()` -> `atomFor()` với ngữ cảnh đọc từ DOM (mục 2.3) -> `data-rva`, `data-rvk`. Heading cần `mask-up`/`split-*`: đặt tạm `data-rva="fade-up"` + `data-rvw`. Có heading split thì `import('./reveal/reveal-split')` ngay (lúc cover đang hiện) và tách xong thì đổi `data-rva` (chỉ khi chưa `is-in`, tắt transition 1 frame bằng class `rv-swap`).
3. Khách chạm mở -> `afterOpen()` -> `startReveal()`: IO reveal (giữ tham số) + IO chuẩn bị mask-up (`rootMargin "0px 0px 100% 0px"`, chờ `document.fonts.ready`; heading đã nằm trong màn đầu thì tách đồng bộ nếu `document.fonts.status === 'loaded'`) + listener `transitionend` ủy quyền 1 chỗ (gắn `rv-done`, gỡ `will-change`, khôi phục chuỗi, giải phóng hàng đợi wipe) + hẹn giờ dự phòng.
4. Song song: `mountMicro()` (mục 3.3), parallax-layers (nếu đủ điều kiện), perf-probe (thêm `revealLite`, `photoTilt`).

**Preview admin:** đổi config -> khung nạp lại với stash -> như trên (resolve lúc chạy). `fx:replay` `reveal` / `reveal:<id>` / `micro:<mã>` -> `previewAfterOpen` -> `import('./effects/reveal/fx-preview')` -> `revealAll()` (ngắt IO) -> phát -> `fx:done` (+ ghi `__wpFxDone` khi debug).

**Admin:** `reveal-block.tsx` tính `revealPlan(planSections(draft,'none').map(...), resolved)` để hiện nhãn "Tự động · Từng chữ" và tóm tắt; ghi `effects.reveal.mode` / `effects.reveal.sections.<id>` bằng `store.setPath`/`store.update`; gọi `preview.replay(...)`.

### Business Logic

#### 2. Thuật toán, thứ tự ưu tiên, hạ cấp

**2.1 `revealPlan` (tất định, thuần)**
```
H = inp.harmony                                   // [A, ...đồng hành] đã lọc capability
prev = null                                       // gói của section expressive gần nhất (kể cả đã ghim)
for s in secs (thứ tự hiển thị):
  if pins[s.id]:                       e = { pack: pins[s.id], src: 'pinned' }
  else if mode == 'uniform':           e = { pack: A, src: 'main' }
  else if TIER[s.type] != 'expressive': e = { pack: A, src: 'main' }      // opening (hero) + functional
  else:
    cands = AFFINITY[s.type].filter(p => H.includes(p))                   // giữ thứ tự ưu tiên
    e = { pack: cands.find(p => p != prev) ?? A, src: 'auto' }
  if TIER[s.type] == 'expressive': prev = e.pack
  out[s.id] = e
```
- Phần functional trung tính (không đổi `prev`). Hero (`opening`) không đổi `prev`.
- `H` chỉ có A (đồng hành chưa bật) -> mọi phần expressive = A, không lỗi.
- Guest lấy danh sách từ DOM, admin từ `planSections`. Hai nguồn có thể lệch ở section **functional** (vd đếm ngược `hideAfter`), nhưng functional không ảnh hưởng `prev` nên kết quả cho section expressive luôn trùng.

**2.2 Thứ tự ưu tiên của một phần tử (`roleAtom`)**
| Bước | Điều kiện | Nguyên tử | `data-rvk` | Stagger section |
|---|---|---|---|---|
| 1 | `src = pinned` | `PACKS[pin][role]` (trọn gói, cả 4 vai trò) | pin | `PACKS[pin].stagger` |
| 2 | `overrides[role] != null` | override | (không đặt) | `A.stagger` |
| 3 | `src = auto` và role ∈ {heading, image} | `PACKS[auto][role]` | auto | `A.stagger` |
| 4 | còn lại (block, ornament, uniform, functional, hero) | `PACKS[A][role]` | A | `A.stagger` |
| 5 | Hạ cấp theo state/máy/FPS (2.4) | `atomFor` | | |
| 6 | Chốt chặn nội dung (2.3) | `atomFor` | | |
- Divider (ngoài section): `overrides.ornament ?? A.ornament`, stagger trên `<html>` = `A.stagger`.
- Bước 5-6 áp cả cho phần đã ghim.

**2.3 `atomFor` - thứ tự áp (thuần, test đủ)**
1. `MATRIX.reveal[state]`: `none` -> `none`; `fade200` -> `fade-fast`; `gentle` -> `heading/block/image = fade`, `ornament = none` (giữ hành vi hiện tại, câu hỏi #2).
2. Không hợp vai trò: ảnh không nhận `mask-up`/`split-*`/`blur-in` -> `fade-up`; vai trò khác `image` không nhận `parallax-layers` (merge đã chặn, giữ phòng xa) -> `fade-up`.
3. `pack-` (Vừa): `blur-in` -> `mask-up` (**R2A-02**, thay `fade-up` hiện tại); `parallax-layers` -> `photo-settle`.
4. `blur-in` ở Nhiều: `!wide` (`matchMedia('(min-width: 1024px)')` lúc chuẩn bị) hoặc `blurUsed >= 3` (đếm theo thứ tự DOM, chỉ phần tử thực nhận `blur-in`) hoặc `lowEnd` -> `mask-up`.
5. Heading font script (`script = el.matches('.h2-script, .hero-names, [data-sig]')`): `mask-up`/`split-words`/`split-chars` -> `wipe`. `blur-in` giữ.
6. `split-chars`: `graphemes > 40` hoặc `lowEnd` -> `split-words`.
7. `split-words`: `words > 20` hoặc chuỗi không có chữ (`!hasLetters`) -> `fade-up`. Áp lại cho `split-chars` khi chuỗi rỗng.
8. `!MATRIX.split[state]` và `split-*` -> `fade` (giữ).
9. Ảnh lồng trong khối có reveal (`nested = !!el.parentElement?.closest('[data-rv]')`): chỉ nhận `photo-settle`, `wipe`, `fade`, `fade-fast`, `none`; còn lại -> `photo-settle` (design 2.5).
10. Khung rỗng (`.frame.is-empty`) + `wipe`/`photo-settle` -> `fade` (không có `<img>` để clip/scale).
11. Ô album (`tile = el.matches('.al-tile')`): `wipe` + `lowEnd` -> `photo-settle`.
12. Cặp cột đối xứng (`pairCol = el.matches('.person, .fam-col')`) ở `high` với `fade`/`fade-up` -> `slide-side`.
13. `svg-draw` + `MATRIX.svgDraw = static` -> `none` (giữ).

**2.4 Hạ cấp**
| Tình huống | Gói chính | Xen kẽ / ghim | Ghi chú code |
|---|---|---|---|
| Tắt (`off`) | hiện ngay | không tác dụng | `MATRIX.reveal = none` |
| Nhẹ | mọi gói -> `gentle` | không tác dụng (plan vẫn tính, `data-rvp` vẫn đặt cho e2e, nguyên tử giống nhau) | bước 1 |
| Vừa | `pack-` | có | bước 3 |
| Nhiều | đầy đủ | có | |
| reduced-motion | `fade-fast` ≤ 200 ms, không tách chữ/dòng, không dịch | không tác dụng | CSS `@media (prefers-reduced-motion)` giữ; engine không gọi split/mask ở `reduced` |
| `lowEnd` | cấp đã hạ 1 bậc | có nếu cấp sau hạ ≥ Vừa | `split-chars` -> `split-words`; `wipe` ô album -> `photo-settle`; hàng đợi wipe trần 2 |
| FPS < 45, bước **`revealLite`** (cuối `DEGRADE_ORDER`) | phần tử **chưa** `is-in` có `split-*`/`wipe`/`mask-up`/`blur-in` (kể cả `data-rvw`) -> `fade-up`; phần tử đã hiện giữ nguyên | | `revealLite(document)` + `html.fx-rv-lite` |
| Khách bấm "Bật hiệu ứng" khi máy giảm chuyển động | theo cấp đã chọn, plan không đổi | | `computeIntensity` sẵn có |

- `perf-probe.ts`: `DEGRADE_ORDER = ['wind', 'halfParticles', 'parallaxLayers', 'particles', 'kenBurns', 'photoTilt', 'revealLite']`. `service.ts` xử lý thêm `photoTilt` (`html.fx-no-tilt` + `EffectRegistry.reset('micro:photoTilt')`) và `revealLite`.
- `intensity.ts`: `scrollProgress: row<boolean | 'config'>(false, false, 'config', 'config', 'config')` (**R2A-05**). Hàm thuần `scrollProgressOn(state, cfg) = fx('scrollProgress', state) === 'config' && cfg`.

**2.5 Chốt chặn tiếng Việt (bắt buộc, kiểm bằng unit + e2e)**
- Không clip ở **trạng thái cuối**: mask-up/split khôi phục chuỗi gốc; `wipe` (chữ, ảnh, ô album, `.ty-sig`) về `clip-path: none` khi `rv-done`; `blur-in` về `filter: none`.
- Trong lúc chạy, vùng clip dọc chừa ≥ .3em: `.rv-ln { padding-block: .3em; margin-block: -.3em }`, wipe chữ biên `-.5em`.
- Tách: NFC + `Intl.Segmenter('vi', { granularity: 'grapheme' })`, fallback `/\P{M}\p{M}*/gu`. Chuỗi kiểm thử: `Nguyễn Thuỳ Linh · Đặng Hữu Phước · Hường · Quỳnh · Ngọc Ẩn · ẦẪỂỖỮ`.
- Cấu trúc a11y khi tách: `<span class="sr-only">chuỗi gốc</span><span class="rv-vis" aria-hidden="true">…</span>`; phần tử con inline (vd `<span lang="en">`) coi là một khối; bỏ qua `.sr-only`/`[aria-hidden]` khi đo.

#### 3. Module, chunk, CSS, preview

**3.1 Bố trí file và ngân sách (gzip)**
| Module | Vị trí | Tải | Ngân sách |
|---|---|---|---|
| `reveal-plan.ts` | `src/shared/` | entry (tĩnh) | gộp vào dòng dưới |
| Engine: `reveal.ts` + `reveal/{atoms,text,mask-lines,wipe-queue}.ts` | `src/guest/effects/` | entry | **reveal-plan + engine ≤ +2.5 KB** so với số đo sau Bước 0 |
| Micro trong entry: `mountMicro()` (bộ nạp, trong `service.ts`), ripple nhạc (`floating.ts`), calendar-flip (`events.ts` + `icons.ts`), `slide` (`countdown.ts`), `--fx-slow` | các file sẵn có | entry | **≤ +0.6 KB** |
| `reveal/reveal-split.ts` | lười, import trong `prepareReveal` khi plan có heading split | trong lúc cover hiện | ≤ 3 KB |
| `reveal/parallax-layers.ts` | lười, chỉ `high` + `effects.parallax` + hero/thankyou có gói `cinematic` (hoặc ghi đè image = `parallax-layers`) | sau mở | ≤ 1.5 KB |
| `reveal/fx-preview.ts` | lười, chỉ preview `reveal*`/`micro:*` hoặc `?debug=fx` | | ≤ 4 KB (không vào JS ban đầu) |
| `micro/micro-attn.ts` (btn-shine, name-sparkle, gift-shake + bộ giới hạn đợt) | lười, `requestIdleCallback` (timeout 1.5 s; Safari: `setTimeout`) sau mở, khi `MATRIX.attention[state]` | | ≤ 2 KB |
| `micro/photo-tilt.ts` | lười, `pointerover` đầu tiên lên ứng viên, chỉ `(hover:hover) and (pointer:fine)` | | ≤ 2 KB |
| `micro/heart-tap.ts` | lười, sau mở, khi `micro.coupleHeartTap` và state ≠ `off` | | ≤ 1 KB |
| `micro/scroll-progress.ts` | lười, sau mở, khi `scrollProgressOn()` | | ≤ 1 KB |
| `micro/odometer.ts` | lười, khi `countdown.style = odometer` và cấp ≠ instant, IO `rootMargin 600px` | | ≤ 2 KB |
| CSS (reveal mới + micro) | **chỉ** `src/guest/styles/fx.css` | ban đầu | **≤ +3 KB** (hiện 11.36/25) |
| Admin `fx/reveal-block.tsx` + `.css`, `fx/micro-block.tsx` | route `effects` lười | | route `effects` tăng ≤ +2.5 KB (≤ 15 KB) |
| Admin ban đầu (`sections.tsx`, `merge.ts`, `labels.ts`, `ops.ts`, `defaults.ts`) | | | **≤ +0.8 KB** (riêng `sections.tsx` ≤ +0.4 KB); không import `reveal-plan` vào `sections.tsx` |
- Tên file lười **đặt riêng** như trên vì chunk lấy tên theo tên file (`reveal-split-<hash>.js`), dùng cho size-limit.
- Không thêm dependency. Plugin `inject-config-og.ts` **không cần sửa**: các chunk mới tự vào nhóm `lazy`. Ngân sách chặt hơn 15 KB cần 1 hunk ở `.size-limit.cjs` (mục 6.3, yêu cầu orchestrator).

**3.2 CSS (thêm vào `fx.css`, không dùng thuộc tính `style`, biến qua CSSOM)**
Lấy khung design §3.9, chốt các điểm sau:
- Mọi thời lượng/độ trễ reveal: `calc(<ms> * var(--rv-k, 1) * var(--fx-slow, 1))`; độ trễ phần tử `calc(min(var(--i, 0), 8) * var(--stagger) * var(--fx-slow, 1))`. Sửa luôn các rule cũ (`[data-rva]`, `photo-settle`, `svg-draw`, `.ty-sig`).
- Hệ số theo gói gắn trên **phần tử** (thay `.sec[data-rvp]` của design, vì trong chế độ auto block/ornament theo A còn heading/image theo gói tự động): `[data-rvk="cinematic"] { --rv-k: 1.25 }`; `[data-rvk="playful"][data-rva="zoom-in"] { transition-timing-function: var(--ease-pop) }`; `[data-rvk="cinematic"][data-rva="photo-settle"]` 1400 ms + `scale(1.15)`; `[data-rvk="cinematic"][data-rva="svg-draw"]` kẹp 1800 ms.
- `mask-up`: `.rv-ln { display: block; overflow: hidden; overflow: clip; padding-block: .3em; margin-block: -.3em }` (dòng `hidden` là fallback Safari < 16); `.rv-li` ẩn `translateY(calc(100% + .55em))` + `opacity: 0`; độ trễ dòng `min(var(--ln), 3) * 90ms`.
- `wipe` chữ, ảnh (clip trên `<img>` trong `.frame`, không trên khung), ô album (450 ms, độ trễ `min(--i, 8) * 150ms`), `.rv-done` -> `clip-path: none; transition: none`; `.ty-sig[data-rva].rv-done { clip-path: none }`.
- `split-*`: `.rv-w { display: inline-block; white-space: nowrap }`, `.rv-c { display: inline-block; transform-origin: 50% 100% }`, **không** `padding-block`, không `overflow` ở span và tổ tiên gần.
- `blur-in` + `.rv-done { filter: none }`; `will-change` chỉ gắn bằng JS lúc chạy.
- `.rv-replay [data-rva], .rv-replay [data-rva] *, .rv-swap { transition: none !important }`.
- R2A-08: `.sec-head > .eyebrow { --i: 0 } .sec-head > .h2 { --i: 1 } .sec-head > .sec-orn { --i: 2 }`.
- Cột đối xứng: thêm `.fam-col:last-child[data-rva="slide-side"]:not(.is-in) { transform: translateX(32px) }`. Ô album `rise-tilt` chẵn `rotate(4deg)`.
- `parallax-layers` L0: `.sec-hero::before, .sec-thankyou::before { translate: 0 var(--plx0, 0px) }` (biến đặt trên section).
- Micro: mục 4.

**3.3 Gắn micro sau khi mở (`service.ts` `mountMicro()`, gọi cuối `afterOpen`)**
| Điều kiện | Việc |
|---|---|
| `MATRIX.attention[state]` và có ít nhất một ứng viên (`micro.buttonShine` + CTA; `.hero-names .nm-amp`; `.gift-art:not(.gift-songhy)`) | rIC -> `import('./micro/micro-attn')` -> `mount()` |
| `matchMedia('(hover:hover) and (pointer:fine)')` + `micro.photoTilt` + `MATRIX.photoTilt[state]` + có `.person-photo, .frame--polaroid, .al-tile` | 1 listener `pointerover` ủy quyền trên `#main` (once) -> `import('./micro/photo-tilt')` |
| `micro.coupleHeartTap` + state ≠ `off` + có `.person-photo` | `html.fx-hearttap` + rIC -> `import('./micro/heart-tap')` |
| `scrollProgressOn(state, micro.scrollProgress)` | rIC -> `import('./micro/scroll-progress')` |
- `applyFxClasses` thêm: `fx-shine` = `MATRIX.attention[state] && micro.buttonShine` (CSS vệt sáng cover dùng class này vì chạy trước khi mở); `--fx-slow` trên `<html>` khi `ctx.preview && EffectRegistry.timeScale < 1` (= `1 / timeScale`), ngược lại gỡ (**R2A-06**). `bootstrap` đã gọi `setTimeScale` (dòng 114) trước `applyFxClasses` (dòng 132), nên **không cần sửa bootstrap** cho 0.5x.

**3.4 Fallback trình duyệt**
| Tính năng | Thiếu thì |
|---|---|
| `Intl.Segmenter` | regex `/\P{M}\p{M}*/gu` |
| `overflow: clip` | `overflow: hidden` (khai báo trước) |
| `animation-timeline: scroll()` | listener cuộn passive + rAF ghi `--p` (trong chunk `scroll-progress`) |
| `IntersectionObserver` | hiện tất cả (giữ) |
| `requestIdleCallback` | `setTimeout(fn, 1)` |
| `ResizeObserver` (mask-up chưa hiện) | bỏ tách lại theo resize (đã hiện thì không cần) |

**3.5 Preview `fx:replay` (`reveal/fx-preview.ts`)**
`bootstrap.ts` `previewAfterOpen`: thay nhánh `target === 'reveal'` (dòng 236-245) và nhánh `micro:` + hằng `MICRO_SECTION` (dòng 246-256) bằng:
```ts
if (target === 'reveal' || target.startsWith('reveal:') || target.startsWith('micro:')) {
  void import('./effects/reveal/fx-preview').then((m) => m.runFxPreview(target, { speed: boot.fx?.speed ?? 1, done: () => bridge.post({ type: 'fx:done', target }) }));
  return;
}
```
Nhánh "tên section" (cuộn tới + `done(900)`) giữ. Không đổi dòng `target === 'cover'` (2b) và dòng `animateReveal` (dòng 127).

| `target` | Hành vi | `fx:done` |
|---|---|---|
| `reveal` | `revealAll()` (ngắt IO). **Tour:** 3 section expressive hiển thị đầu tiên (theo `REVEAL_TIER`), thiếu thì lấy section kế tiếp sau hero. Với mỗi phần: `scrollTo(0, sec.offsetTop - innerHeight * .15)` (tức thì), `replaySection`, chờ `estimateSectionMs(sec) + 400` (× `1/speed`), sang phần sau | sau phần cuối; tổng ≤ 8 s (× `1/speed`) |
| `reveal:<id>` | Section không có trong DOM -> `done` ngay. Có: cuộn như trên, `replaySection` 1 lần | sau `estimateSectionMs + 400` |
| `micro:buttonShine` | cuộn tới CTA hiển thị đầu tiên (`.gift-btn` -> `.gb-form [type=submit]` -> `.rsvp-card [type=submit]`), `EffectRegistry.play('micro:buttonShine')` (1 vệt, bỏ giới hạn phiên) | 1300 ms |
| `micro:photoTilt` | cuộn tới `couple`, chạy kịch bản nghiêng trên `.person-photo` đầu tiên (cả khung mobile) | 1900 ms |
| `micro:scrollProgress` | về đầu landing, cuộn mượt 1.5 màn | 1800 ms |
| `micro:coupleHeartTap` | cuộn tới `couple`, thả 1 tim giữa ảnh đầu | 900 ms |
| `micro:countdown` | cuộn tới `countdown`, 4 ô chạy 1 nhịp giả theo kiểu đã chọn (cả giây) | 900 ms |
| `micro:<khác>` (`wishFly`, `rsvp`, `fireworks`…) | giữ ánh xạ cũ (bảng `MICRO_SECTION` chuyển vào module), cuộn + `done(900)` | 900 ms |
- `replaySection(sec)`: gắn `.rv-replay`; mọi `[data-rva]` trong section bỏ `is-in`, `rv-done`; phần tử mask/split đã khôi phục thì tách lại (`rearm`); đọc `sec.offsetWidth` (ép reflow); gỡ `.rv-replay`; rAF kế tiếp gắn `is-in` (bỏ qua hàng đợi wipe). Mô phỏng máy yếu/giảm chuyển động lấy theo config preview.
- `estimateSectionMs(sec)`: max(độ trễ + thời lượng) theo bảng thời lượng nguyên tử (design 3.1), kẹp ≤ 2200 ms; hàm thuần, test.
- Debug (`?debug=fx`): `service.afterOpen` -> `import('./reveal/fx-preview').then(m => m.installDebug())`. `__wpReveal.hold(id)`: đưa section về trạng thái ẩn đã chuẩn bị (đã tách, chưa `is-in`) để chụp; `play(id)`; `rearmAll()`: đưa mọi section về ẩn + bật lại IO (cho test CLS); `plan`. Mỗi lần `done` còn đẩy `{ target, at }` vào `__wpFxDone`.

#### 4. Admin

**4.1 `fx/reveal-block.tsx` (route `effects` lười; CSS riêng `fx/reveal-block.css` import từ khối, không thêm vào `admin.css`)**
Theo design 5.2, chốt:
- **Gói chính:** chip `role="radiogroup"` (giữ code Bước 0 chuyển sang). Đổi -> `preview.replay('reveal', 'Hiện nội dung · 3 phần')`.
- **Cách áp dụng:** `Segmented` (`legend="Cách áp dụng"`, `name="rvmode"`) ghi `effects.reveal.mode`. Câu trợ giúp: `auto` -> "Tiêu đề và ảnh ở các phần nổi bật đổi kiểu trong bộ <nhãn của `harmony` nối bằng ' · '>. Phần thông tin (Sự kiện, Mừng cưới, Xác nhận…) giữ <A> cho dễ đọc."; `uniform` -> "Mọi phần dùng <A>. Có thể chọn riêng vài phần bên dưới." Đổi -> replay `reveal`.
- **Ghi chú theo cấp** ngay dưới: `low` -> "Ở cấp Nhẹ, mọi phần chỉ mờ dần; xen kẽ và chọn riêng chỉ thấy từ cấp Vừa."; `off` -> "Cấp Tắt: nội dung hiện ngay, không có hiệu ứng." Không khoá điều khiển.
- Nút **"↻ Xem thử 3 phần"** -> replay `reveal`.
- **"Từng phần":** `<details id="reveal-sections">` mặc định đóng; `summary` **không** `display:flex`: "Từng phần · n phần khác gói chính · m phần chọn riêng" (n = số section hiển thị có `pack ≠ A`; m = số ghim của section đang hiển thị). Danh sách = `planSections(draft, 'none')`, đúng thứ tự và số thứ tự. Bố cục 2 dòng/khối ở mọi bề rộng (design 5.2 rút ra từ mock): dòng 1 số + tên (`groupById(type)?.title ?? SECTION_META.label`) + badge; dòng 2 native `<select>` cao 48 px rộng hết khối + nút "▶ Xem" 44×44 có chữ.
  - `<select id="rv-sec-<id>" aria-label="Kiểu hiện của phần <tên>">`: option đầu `value=""` = "Tự động · <gói>" (auto) hoặc "Theo gói chính · <A>" (uniform), trong đó <gói> = kết quả `revealPlan` khi **bỏ ghim của chính section này**; tiếp theo là `CAPABILITIES.revealStyle.supported` với nhãn `REVEAL_LABEL`. Chọn gói -> `store.setPath('effects.reveal.sections.<id>', v)`; chọn option đầu -> xoá khoá bằng `store.update` (dựng object mới). Sau đó `preview.replay('reveal:<id>', 'Hiện nội dung · <tên> (<gói>)')` + `peek()` (toast mobile [Xem ↗]).
  - Nút Xem: `aria-label="Xem thử kiểu hiện phần <tên>"`, gọi cùng replay.
  - Badge (luôn có chữ): "Chọn riêng" khi có ghim; "Phần thông tin" khi `mode = auto`, chưa ghim, tier `functional` (help: "giữ gói chính cho dễ đọc").
  - "Bỏ chọn riêng ở mọi phần (m)" chỉ khi m ≥ 1: `sections = {}` + `toast('Đã bỏ chọn riêng ở m phần', { action: { label: 'Hoàn tác', run } })`.
  - Dòng cuối: "k phần đang tắt hoặc chưa có nội dung không có trong danh sách." (k = số item không có trong plan).
- **Mount:** đọc `sessionStorage['wp_fx_focus_v1']`; `reveal:<id>` -> mở details, `scrollIntoView`, focus `#rv-sec-<id>`; `reveal-sections` -> mở details + cuộn; xoá khoá sau khi đọc.
- **Không** làm UI "Ghi đè cho cả trang theo vai trò" (Q4: để v4b).
- Chữ hiển thị không được lộ mã thô (`auto`, `uniform`, `editorial`…): giữ đúng quy tắc A07 mà `tests/e2e/admin-v22.spec.ts` kiểm.

**4.2 `fx/micro-block.tsx`** (design 5.3)
- 4 `Toggle`: "Nút chính có vệt sáng lướt" (`micro.buttonShine` -> replay `micro:buttonShine`), "Ảnh nghiêng theo chuột" + help "Chỉ trên máy tính có chuột; điện thoại không nghiêng." (`micro.photoTilt`), "Thanh tiến độ đọc ở mép trên" + help "Hiện ở cấp Vừa và Nhiều (và khi khách giảm chuyển động)." (`micro.scrollProgress`), "Chạm đúp ảnh cô dâu, chú rể để thả tim" + help "Bất ngờ nhỏ, khách không được báo trước." (`micro.coupleHeartTap`). Nhãn "Đang xem" lần lượt: "Vệt sáng trên nút", "Ảnh nghiêng", "Thanh tiến độ", "Chạm đúp thả tim".
- "Kiểu số đếm ngược" giữ `Select` từ `CAPABILITIES.countdownStyle` (sau 2a có đủ 4), replay `micro:countdown` nhãn "Đếm ngược · <kiểu>". "Pháo hoa đếm ngược" giữ.
- Không thêm công tắc cho `name-sparkle`, `music-ripple`, `gift-shake`, `calendar-flip`.

**4.3 `routes/sections.tsx` (bundle admin ban đầu, ≤ +0.4 KB)**
- Dòng có `draft.effects.reveal.sections[it.id]`: thêm trong `.sec-name` một `<button type="button" class="btn btn-link sec-pin">Hiện: {REVEAL_LABEL[v]}</button>` (chữ, không chỉ màu; `REVEAL_LABEL` đã ở bundle ban đầu qua `labels.ts`). Bấm -> `sessionStorage.setItem('wp_fx_focus_v1', 'reveal:' + it.id)` -> `p.go('effects')`.
- Dưới danh sách: `<button class="btn btn-link">Kiểu hiện khi cuộn của từng phần ›</button>` -> `reveal-sections` + `go('effects')`.
- Không import `reveal-plan`; không hiện nhãn "tự động". Dùng class sẵn có, không thêm CSS (nếu cần 1 rule căn lề thì đặt trong vùng `[v4a-2a]` của `admin.css`).

**4.4 Checklist** (`src/admin/draft/checklist.ts` dòng 79, xin orchestrator 1 hunk): điều kiện thành `c.effects.intensity === 'high' && (r.reveal.style === 'cinematic' || Object.values(r.reveal.pins).includes('cinematic')) && r.openStyle === 'light-gather'`. (Sau 2b có `OPEN_META` thì "kiểu mở Cao" có thể đọc `OPEN_META[id].cost === 'high'`; việc đó thuộc 2b, không làm ở 2a.)

#### 5. Sửa 8 lỗi R2A-01..08
| ID | File | Cách sửa | Kiểm |
|---|---|---|---|
| R2A-01 `mask-up` lộ dấu | `reveal/mask-lines.ts`, `reveal.ts`, `fx.css` | Tách dòng JIT sau `fonts.ready` (IO trước 1 màn); `.rv-ln` padding/margin ±.3em; `.rv-li` ẩn `translateY(calc(100% + .55em))` + `opacity: 0`; gỡ wrapper khi `transitionend` dòng cuối hoặc hẹn giờ dự phòng (độ trễ + thời lượng + 100 ms); `ResizeObserver` tách lại (debounce 150 ms) trước khi hiện; chưa tách xong mà vào màn -> `fade-up` | e2e T2 (so ảnh), T3 (không còn `.rv-ln`), T6 (CLS) |
| R2A-02 fallback `blur-in` | `reveal/atoms.ts` | Vừa / mobile < 1024 px / phần tử thứ 4+ / `lowEnd` -> `mask-up` (script -> `wipe`) | unit `reveal-atoms`, sửa `intensity.test.ts` dòng 111 thành `mask-up` |
| R2A-03 `wipe` cắt nét script ở trạng thái cuối | `fx.css`, `reveal.ts` | Biên chữ `-.5em`/`-.25em`; `.rv-done` -> `clip-path: none`; `.ty-sig` cũng vậy | e2e T3 (`clip-path` computed = `none`) |
| R2A-04 padding span gây CLS | `fx.css`, `reveal/reveal-split.ts` | Không `padding-block` trên `.rv-w`/`.rv-c`; khôi phục chuỗi gốc khi xong | e2e T6 |
| R2A-05 `scrollProgress` | `intensity.ts`, `tests/intensity.test.ts` | `row(false, false, 'config', 'config', 'config')` | unit MATRIX |
| R2A-06 0.5x không áp lên reveal | `service.ts` (`applyFxClasses`), `fx.css` | `--fx-slow` trên `<html>` khi preview `timeScale < 1`; mọi thời lượng CSS nhân biến | unit (hàm thuần `fxSlow(timeScale)`), kiểm tay |
| R2A-07 `btn-shine`, `name-sparkle` > 5 s | `micro/micro-attn.ts` | Lịch theo §4.1/4.6 design; bộ giới hạn chung ≤ 5 s/đợt, ≤ 3 đợt/phiên/phần tử, đợt mới khi rời rồi vào lại sau ≥ 20 s | unit `micro.test.ts` |
| R2A-08 không stagger trong `.sec-head` | `fx.css` | `--i` 0/1/2 cho eyebrow/h2/`.sec-orn` | unit `estimateSectionMs` ≤ 1.8/2.2 s, designer xem |

#### 6. Micro-interaction (10 mã)
Quy tắc chung (design §4): tự chạy thuộc `attention` (Vừa/Nhiều), mỗi đợt ≤ 5 s, ≤ 3 đợt/phiên/phần tử, đợt mới chỉ khi rời viewport rồi vào lại sau ≥ 20 s, không chạy khi `fxBlocked()`; do khách bấm thì theo `press`; phần tử thêm vào DOM `aria-hidden="true"` + `pointer-events: none`; tạo bằng `h()`, biến qua `css()`.

| Mã | File | Kỹ thuật chốt | Cấp / config | Preview |
|---|---|---|---|---|
| `btn-shine` | `micro/micro-attn.ts`, `fx.css` | `::after` của `.gift-btn`, `.gb-form [type=submit]`, `.rsvp-card [type=submit]` (không `.btn-outline`); IO `threshold .6` giữ 400 ms -> chạy ở 0.4 s và 2.9 s (class `is-shine` 900 ms); hover/focus-visible 1 lần, cách ≥ 2 s; bỏ qua `disabled`/`aria-busy`. Cover: CSS thuần `.fx-shine .cv-cta.is-breathe::after` 1 lần, trễ 1.2 s (selector nằm trong `fx.css`, không sửa `cover.css`) | `attention` + `micro.buttonShine` | `micro:buttonShine` |
| `photo-tilt` | `micro/photo-tilt.ts`, `fx.css` | `.person-photo`, `.frame--polaroid` ≤ 6°, `.al-tile` ≤ 4°; chỉ gắn khi `.rv-done`; `transform: perspective(800px) rotateX() rotateY()` (độ nghiêng polaroid ở thuộc tính `rotate`, không mất); `span.tilt-glare`; lerp .12/frame, rời chuột về 0 trong 400 ms; bấm ô album reset; bàn phím không nghiêng; `html.fx-no-tilt` (bước FPS) gỡ | `photoTilt` + `micro.photoTilt` + `pointer: fine` | `micro:photoTilt` |
| `countdown-odometer` | `micro/odometer.ts`, `sections/countdown.ts`, `fx.css` | `.cd-v` -> N `.od-win` (1em, `overflow: hidden`, chỉ chữ số nên an toàn) chứa `.od-strip` 11 ô `9* 0..9`; hiện d = `translateY(calc(-1em * (d + 1)))`; lùi 450 ms `--ease-inout`, quay vòng 0 -> 9 qua ô `9*` rồi nhảy tức thì; hàng chục trễ 60 ms; giây: Vừa crossfade 200 ms, Nhiều quay 300 ms; số chữ số giảm thì cửa sổ đầu mờ 300 ms rồi bỏ; Nhẹ crossfade; Tắt/reduced tức thì. Hàm thuần `odometerSteps(from, to)` | `countdown` | `micro:countdown` (đăng ký từ `countdown.ts`) |
| `slide` | `sections/countdown.ts`, `fx.css` | `.cd-v` cửa sổ 1em; bản sao giá trị cũ tuyệt đối `translateY(0 -> 100%)` + mờ, bản mới `translateY(-100% -> 0)`; WAAPI 320 ms `--ease-out`, xoá bản sao khi xong; giây như odometer | `countdown` | `micro:countdown` |
| `scroll-progress` | `micro/scroll-progress.ts`, `fx.css` | `div.scroll-prog` fixed top `env(safe-area-inset-top)`, 2 px, `scaleX(var(--p))`, `--c-accent` (`son-do`: `--c-primary`), `z-index: calc(var(--z-petals) + 1)`, `aria-hidden`; `@supports (animation-timeline: scroll())` CSS thuần, ngược lại rAF; ẩn khi `cover-on`/`lb-on`; hiện mờ 300 ms sau mở | `scrollProgressOn()` (Vừa, Nhiều, reduced) | `micro:scrollProgress` |
| `name-sparkle` | `micro/micro-attn.ts`, `fx.css` | Chèn 3 `span.spk` (icon `sparkle`) vào `.hero-names .nm-amp` + class `has-spk` (`position: relative`, không sửa `cover.css`/`basic.ts`); vị trí/cỡ theo design 4.6; đợt 600 ms, 3 đốm lệch 120 ms; đợt 1 = 0.8 s sau khi tên hiện xong, đợt 2 sau 3 s (≈ 4.7 s), đợt 3 khi cuộn lại hero sau ≥ 20 s; bỏ nếu `document.fonts.check` font script chưa xong | `attention` | (không) |
| `music-ripple` | `floating/floating.ts`, `fx.css` | Trong `sync()`: chuyển sang `playing` từ trạng thái khác, ≥ 10 s từ lần trước, `MATRIX.attention[state]` -> chèn 2 `span.fl-ripple` vào `.fl-music-wrap`, keyframe `scale(1 -> 1.9)` + mờ .55 -> 0, 1200 ms, vòng 2 trễ 300 ms, xoá ở `animationend`. Code trong entry (≈ 0.15 KB) để không lỡ lần phát đầu ngay sau mở | `attention` | (không) |
| `gift-shake` | `micro/micro-attn.ts`, `fx.css` | `.gift-art:not(.gift-songhy)`; keyframe 500 ms `--ease-inout`, gốc `50% 90%`, ±6° -> ±4°; 1 lần 200 ms sau `rv-done` của hình; desktop hover/focus-visible `.gift-btn` lắc, cách ≥ 2 s | `attention` | (không) |
| `calendar-flip` | `icons.ts` (export mới `calendarFlipIcon(size)`), `sections/events.ts`, `fx.css` | SVG 2 phần `g.cal-body` + `g.cal-page` (`transform-box: fill-box; transform-origin: 50% 0`); bấm -> class `is-flip`: `scaleY(1 -> 0)` 150 ms `cubic-bezier(.55,0,1,.45)` rồi `0 -> 1` 150 ms `--ease-out`; chạy ngay, không chờ `.ics`; reduced: opacity .15 -> .35 -> .15 | `press` (Nhẹ trở lên) | (không) |
| `couple-heart-tap` | `micro/heart-tap.ts`, `fx.css` | `.person-photo` (không album); `.fx-hearttap .person-photo { touch-action: manipulation }`; 2 `pointerup` ≤ 300 ms, lệch ≤ 24 px (chuột `dblclick`); tim 56 px (icon `heart`) tại điểm chạm, `scale(0 -> 1.2 -> 1)` 300 ms rồi bay lên + mờ 400 ms; ≤ 3 tim; reduced tim tĩnh mờ 200 ms. Hàm thuần `isDoubleTap(a, b)` | từ Nhẹ, `micro.coupleHeartTap` | `micro:coupleHeartTap` |
- `micro-attn.ts` export hàm thuần cho test: `attentionPlan(kind): number[]` (mốc ms của từng đợt), `SessionLimiter` (≤ 3 đợt, ≥ 20 s, ≤ 5 s/đợt).
- `countdown.ts` thay nhánh animate (dòng 74-80) bằng bảng theo `style`: `flip` giữ, `slide` trong file, `odometer` gọi module lười (chưa tải thì crossfade); đăng ký `micro:countdown` khi `ctx.preview`.

#### 7. Danh sách file sửa/tạo, đối chiếu bản đồ sở hữu (`solution-v4a-2bc.md` mục 3.2)

**7.1 File của 2a (đúng bản đồ)**
| File | Loại | Phạm vi sửa |
|---|---|---|
| `src/shared/caps/v4a-2a.ts` | sửa | mục 1.5 |
| `src/shared/config/enums.ts` | vùng `[v4a-2a]` | `REVEAL_MODES`, `RevealMode` |
| `src/shared/config/types.ts`, `defaults.ts` | vùng `[v4a-2a]` | `mode`, `sections` |
| `src/shared/config/merge.ts` | khối mới sau `normalizeSectionItems` (Bước 0 không chèn vùng ở file này) | sanitize 1.2 + import `REVEAL_MODES` |
| `src/shared/config/schema-meta.ts` | 2 khoá `EXTRA_LABELS` + 1 nhánh trong `labelForPath` | 1.6 |
| `src/shared/theme/resolve.ts` | xoá dòng 39 + 60-68 (chuyển sang `reveal-plan.ts`, re-export), khối reveal dòng 142-150, dòng 160 `reveal:` | 1.3 |
| `src/shared/labels.ts` | `REVEAL_MODE_LABEL`, 1 khoá `BY_PATH`, nhánh trong `enumLabel` | 1.6 |
| `src/shared/reveal-plan.ts` | **mới** | |
| `src/guest/effects/reveal.ts`, `reveal/*` (mới), `micro/*` (mới), `intensity.ts`, `perf-probe.ts`, `service.ts` | sửa / mới | |
| `src/guest/styles/fx.css` | sửa (rule over-cover của Bước 0 giữ nguyên) | |
| `src/guest/sections/countdown.ts`, `events.ts` | sửa (sections/* = 1, 2a; v4a-1 không đụng 2 file này theo `solution.md` 10.9) | |
| `src/guest/floating/floating.ts` | sửa | ripple |
| `src/guest/bootstrap.ts` | sửa dòng 236-256 (`previewAfterOpen` nhánh `reveal`/`micro:` + `MICRO_SECTION`); **không** sửa lời gọi `prepareReveal`, dòng `animateReveal`, dòng `target === 'cover'`. Vùng `[v4a-2a]` trước `prepareReveal` để trống | |
| `src/admin/editor/routes/effects.tsx` | sửa (chỉ bố cục/props khối) | |
| `src/admin/editor/fx/reveal-block.tsx` (+ `reveal-block.css` mới), `fx/micro-block.tsx` | sửa / mới | |
| `src/admin/editor/routes/sections.tsx` | sửa | 4.3 |
| `tests/intensity.test.ts` | sửa | `scrollProgress`, `atomFor(cinematic, medium) = mask-up`, `DEGRADE_ORDER` |
| `tests/reveal-plan.test.ts`, `reveal-atoms.test.ts`, `v4a2a-schema.test.ts`, `micro.test.ts`, `tests/e2e/v4a-2a.spec.ts` | **mới** | |
| `docs/tasks/20261007-wedding-page/frontend-report-v4a-2a.md` | **mới** | report tiến độ |

**7.2 File chưa có trong bản đồ hoặc thuộc đợt khác: cần orchestrator xử lý**
| File | Chủ theo bản đồ | 2a cần gì | Đề xuất |
|---|---|---|---|
| `src/admin/draft/ops.ts` | không có trong 3.2 (v4a-1 sửa nhóm `motif` theo `solution.md` 10.1) | dòng 113-114 (`customizedGroups`) và dòng 131 (`resetGroup` case `reveal`) | Giao 2a đúng 2 hunk này; 2a merge sau v4a-1 nên FE-2a giải xung đột (giữ cả `motif` lẫn `reveal`) |
| `src/admin/draft/checklist.ts` | "-" | 1 hunk dòng 79 (mục 4.4) | Cho phép 1 hunk |
| `.size-limit.cjs` | 0 -> "-" | 1 hunk dòng `lazy`: `limit: TIGHT[base(f)] ?? '15 KB'` với `TIGHT = { 'reveal-split': '3 KB', 'parallax-layers': '1.5 KB', 'micro-attn': '2 KB', 'photo-tilt': '2 KB', 'heart-tap': '1 KB', 'scroll-progress': '1 KB', 'odometer': '2 KB' }` | Orchestrator thêm (hoặc cho 2a thêm 1 hunk). Không được thì FE ghi số đo vào report |
| `src/guest/icons.ts` | không có trong 3.2 (v4a-1 không đụng theo 10.9) | thêm 1 export `calendarFlipIcon` cuối file | Giao 2a, chỉ thêm |
| `src/admin/draft/diff.ts` | không có | (tuỳ chọn) `flatten()` không ghi lá cho object rỗng khi phía kia có con, để ghim đầu tiên không sinh dòng "Kiểu hiện từng phần: xoá {}" | Câu hỏi #3 |
| `src/shared/theme/resolve.ts`, `merge.ts`, `labels.ts`, `schema-meta.ts` | 1 + 2a | như 7.1 | Đúng thứ tự merge 3.4 (v4a-1 trước 2a); FE-2a giải xung đột "giữ cả hai" |

**7.3 2a không đụng** (khác dự kiến trong design §7, để giảm xung đột): `src/shared/sections/meta.ts` (phân loại section nằm trong `reveal-plan.ts`), `src/guest/sections/common.ts` (`shell()` không cần sửa: `data-rvp`/`--stagger` do engine đặt, stagger `.sec-head` bằng CSS), `sections/basic.ts`, `sections/gift.ts`, `sections/album.ts` (micro chèn lúc chạy), `src/guest/styles/{cover,sections,base,tokens}.css`, `src/guest/preview-bridge.ts`, `src/admin/editor/preview.tsx`, `src/admin/admin.css` (trừ khi cần 1 rule trong vùng `[v4a-2a]`), `scripts/vite-plugins/*`, `vite.config.ts`, `package*.json`, `public/content/config.json`, `tests/resolve.test.ts` (Bước 0.9 đã làm test fallback không phụ thuộc capability), `tests/e2e/{guest,admin,admin-v22,helpers,fx-helpers}.ts`, `STAGE`.

#### 8. Kiểm thử

**8.1 Unit (vitest, môi trường `node`)**
| File | Nội dung |
|---|---|
| `tests/reveal-plan.test.ts` | (1) Ra đúng bảng design 2.4 cho `soft`/Trầm Vàng, `cinematic`/Đêm Nhung, `playful`/Đất Nung, `gentle`/Sen Chàm (thứ tự mặc định, loveStory tắt), và Đất Nung + loveStory bật = couple `letter`, families `soft`, announcement `letter`, loveStory `playful`, album `soft`, thankyou `letter`. (2) Property: 200 hoán vị ngẫu nhiên (PRNG seed cố định, hero đầu footer cuối, ngẫu nhiên bật/tắt) × 6 gói chính, `harmony` đủ 3: không có 2 section expressive liền kề (bỏ qua functional) cùng gói. (3) Ghim thắng auto; ghim bằng A giữ A; `uniform` -> mọi phần chưa ghim = A; hero và functional luôn A. (4) `revealHarmony` lọc đồng hành chưa hỗ trợ (vd supported = `['soft','gentle']` -> `['soft']`, mọi phần = A, không lỗi). (5) `roleAtom` đủ 4 bậc ưu tiên + `sectionStagger` |
| `tests/reveal-atoms.test.ts` | `atomFor` theo design §6 mục 4: script -> `wipe` (cả từ `mask-up`, `split-*`); > 40 grapheme -> `split-words`; > 20 từ -> `fade-up`; chuỗi không có chữ -> `fade-up`; `lowEnd` `split-chars` -> `split-words`; ảnh lồng -> `photo-settle`; khung rỗng -> `fade`; ô album `wipe` + `lowEnd` -> `photo-settle`; `blur-in` ở Vừa / `wide=false` / `blurUsed=3` / `lowEnd` -> `mask-up` (script -> `wipe`); `pairCol` ở `high` -> `slide-side`; reduced -> `fade-fast`; Nhẹ -> `gentle`. `graphemeCount` với chuỗi kiểm thử tiếng Việt (bằng nhau khi dùng Segmenter và regex, cả chuỗi NFD đầu vào). `segment()` của `reveal-split.ts`: ghép lại đúng chuỗi NFC, không tách dấu khỏi nguyên âm. `groupLines`. `WipeQueue` (đồng hồ giả): trần 3 / 2, chờ > 600 ms -> trả về để dùng `fade`. `estimateSectionMs` ≤ 1800 ms cho mỗi gói ở Vừa với section mẫu (head 3 + 4 khối + 2 ảnh + 9 ô album), ≤ 2200 ms với `cinematic`. `fxSlow(0.5) = 2` |
| `tests/intensity.test.ts` (sửa) | `scrollProgress` = `[false, false, 'config', 'config', 'config']`; `DEGRADE_ORDER.at(-1) === 'revealLite'`; dòng 111 thành `mask-up` |
| `tests/v4a2a-schema.test.ts` | Merge: mặc định `mode 'auto'`, `sections {}`; `mode` lạ; `sections` là mảng/chuỗi; khoá không có id; giá trị lạ; ghim section tắt được giữ; `schemaVersion` vẫn 1; config v1 thiếu field và import v0 (`config.js` cũ) -> mặc định. Resolve: `pins` lọc capability + cảnh báo, `harmony`, `overrides` tách riêng, các field cũ không đổi (Trầm Vàng mặc định như `resolve.test.ts` dòng 19). Ops: `customizedGroups` bật bởi từng field trong 4 loại; `resetGroup('reveal')` đủ 7 field; `changeTheme(keep)` giữ ghim, `full` xoá. Labels: `REVEAL_MODE_LABEL`, `enumLabel('effects.reveal.sections.families','editorial') === 'Tạp chí'`, `labelForPath` |
| `tests/micro.test.ts` | `attentionPlan('btnShine')` = `[400, 2900]`, mỗi đợt kết thúc ≤ 5000 ms; `attentionPlan('nameSparkle')` = `[800, 3800]` (≤ 4.7 s); `SessionLimiter`: đợt 4 bị từ chối, đợt mới trước 20 s bị từ chối; `odometerSteps(10, 9)` (hàng chục và đơn vị cùng đổi, trễ 60 ms), `odometerSteps(0, 9)` quay vòng qua ô `9*`, 100 -> 99 bỏ cửa sổ đầu; `isDoubleTap` (300 ms / 24 px); `scrollProgressOn` 5 state × bật/tắt |

**8.2 E2E chọn lọc: `tests/e2e/v4a-2a.spec.ts`** (dùng helper Bước 0; không sửa spec khác; `watchConsole(page)` mọi test, 0 lỗi console)
| # | Tên (`-g`) | Cách chạy | Khẳng định |
|---|---|---|---|
| T1 | `B1 data-rvp Tram Vang` | `bootPreview(page, { cover: { enabled: false } })`, 375×740 | `section[data-rvp]` khớp cột Trầm Vàng ở design 2.4; functional = `soft`; `#couple[data-rvs="auto"]` |
| T2 | `mask-up khong lo dau` | `bootPreview` tram-vang + `effects: { intensity: 'medium', reveal: { style: 'editorial', mode: 'uniform' } }`, `content.announcement.heading = 'ẦẪỂỖỮ Thuỳ Ngọc'`, `?debug=fx` | `__wpReveal.hold('announcement')`, chờ có `.rv-ln`; chụp vùng hộp heading nới .6em (ảnh A); đặt `visibility: hidden` cho heading bằng CSSOM, chụp lại (ảnh B); `A.equals(B)` (không có pixel mực, không cần thư viện giải PNG) |
| T3 | `trang thai cuoi khong clip` | bản build thường: `strongDevice(page)`, `/?cover=0`, cuộn từng bước hết trang, chờ 2.5 s | không còn `.rv-ln`, `.rv-vis`, `.rv-w`; mọi `[data-rva="wipe"]` và `img` con có `clip-path` computed = `none`; mọi `[data-rva="blur-in"]` có `filter: none` |
| T4 | `reduced motion` | bản build, `page.emulateMedia({ reducedMotion: 'reduce' })`, `strongDevice`, `/?cover=0`, cuộn hết | không có `.rv-w`/`.rv-c`/`.rv-ln`; không heading nào có `filter` khác `none`; `[data-rva]` chỉ là `fade-fast` hoặc không có |
| T5 | `fx replay reveal` | `bootPreview(page, {}, { target: 'reveal:families' })` và `{ target: 'reveal' }`, `?debug=fx` | `__wpFxDone` có `reveal:families`; tour có `reveal` trong ≤ 9 s |
| T6 | `CLS letter editorial` | `bootPreview` `cover.enabled=false`, `intensity: 'high'`, `reveal: { style: 'letter' \| 'editorial', mode: 'uniform' }`, 1280×800 và 375×740; `__wpReveal.rearmAll()`, cuộn hết | tổng `layout-shift` (PerformanceObserver, `buffered: true`, bỏ `hadRecentInput`) < 0.05 |
| T7 | `admin reveal block` | admin trên `vite preview` (đăng nhập bằng `fresh`/`login`/`offline` của `helpers.ts`), route `#/effects` | có radiogroup "Cách áp dụng"; mở "Từng phần", chọn Tạp chí cho Hai bên gia đình -> summary có "1 phần chọn riêng"; khung preview có `#families[data-rvp="editorial"]`; sang `#/sections` thấy "Hiện: Tạp chí", bấm -> về Hiệu ứng, `#rv-sec-families` được focus; "Bỏ chọn riêng ở mọi phần" + Hoàn tác khôi phục |
| T8 | `micro smoke` | `bootPreview` các biến thể | `micro.scrollProgress=true`: có `.scroll-prog` ở `medium` và `reduced` (`simulate.reducedMotion`), không có ở `low`; `{ target: 'micro:buttonShine' }` -> CTA đầu có `is-shine`; `countdown.style='odometer'` -> có `.od-win`; `'slide'` không lỗi; `micro.coupleHeartTap=true` + `dblclick` `.person-photo` -> có tim rồi tự xoá ≤ 1 s |
- Không chụp màn hình ngoài T2. Ảnh designer review lưu `screenshots/design-review-v4a-2a/<ID>.png` (bước 4).

**8.3 Lệnh (cổng do orchestrator gán theo `status.md` mục 8: FE-1 `4273/5275`, FE-2 `4373/5375`, FE-3 `4473/5475`; không dùng 5173)**
```bash
# trong worktree wt/v4a-2a (đã npm ci, đã merge branch phiên sau Bước 0)
npm test -- tests/reveal-plan.test.ts tests/reveal-atoms.test.ts tests/intensity.test.ts tests/v4a2a-schema.test.ts tests/micro.test.ts
npm run build
PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium PW_PREVIEW_PORT=<P> PW_DEV_PORT=<D> \
  npx playwright test tests/e2e/v4a-2a.spec.ts -g "mask-up khong lo dau"
# cuối đợt, 1 lần
npm run build && PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium PW_PREVIEW_PORT=<P> PW_DEV_PORT=<D> npm run test:e2e
```
- Đo ngân sách tổ hợp nặng: dùng lại fixture của 2b (`tests/fixtures/config-heavy-2b.json`, có `reveal.style: cinematic`) nếu 2b đã merge; chưa có thì FE-2a tạo `tests/fixtures/config-heavy-2a.json` (`dem-nhung` + `high` + `cinematic` + `micro.scrollProgress/coupleHeartTap = true` + `countdown.style = odometer`), chạy `WP_CONFIG_PATH=… npx vite build && npx size-limit`, rồi `npm run build` lại trước e2e.

#### 9. Tiêu chí hoàn thành đo được
| # | Tiêu chí | Cách đo |
|---|---|---|
| 1 | `caps/v4a-2a.ts` có 4 gói, 6 nguyên tử, 2 kiểu đếm ngược; `resolveTheme` với từng giá trị không cảnh báo; admin không còn "phần còn lại sẽ có ở bản sau" cho gói reveal | unit |
| 2 | Schema: mặc định, sanitize, không tăng version, import v0, đổi theme đúng 1.2-1.4 | unit `v4a2a-schema` |
| 3 | `revealPlan` đúng 5 bảng ví dụ + property 200 × 6; ưu tiên 4 bậc | unit `reveal-plan` |
| 4 | `atomFor` đủ ca hạ cấp/chốt chặn mục 2.3; `MATRIX.scrollProgress` mới; `DEGRADE_ORDER` kết thúc `revealLite` | unit |
| 5 | JS ban đầu (cấu hình mặc định) tăng ≤ +3.1 KB so với số đo sau Bước 0 (reveal ≤ 2.5 + micro ≤ 0.6) và tổng ≤ 60 KB kể cả tổ hợp nặng; CSS ban đầu tăng ≤ +3 KB; `reveal-split` ≤ 3 KB, `parallax-layers` ≤ 1.5, `micro-attn` ≤ 2, `photo-tilt` ≤ 2, `heart-tap` ≤ 1, `scroll-progress` ≤ 1, `odometer` ≤ 2; admin ban đầu tăng ≤ +0.8 KB (≤ 80 KB); route `effects` ≤ 15 KB | `size-limit` trong `npm run build` + số đo trong report |
| 6 | Không lộ dấu khi ẩn (T2), không clip/không wrapper ở trạng thái cuối (T3), reduced không tách/không filter (T4), CLS < 0.05 (T6) | e2e |
| 7 | `fx:replay` `reveal:<id>` và tour `reveal` ≤ 9 s có `fx:done` (T5); 0.5x kéo dài thời lượng CSS gấp 2 (kiểm tay trong admin) | e2e + kiểm tay |
| 8 | 10 micro chạy đúng cấp (T8 + unit `micro`); mọi hiệu ứng tự chạy ≤ 5 s/đợt, ≤ 3 đợt/phiên | unit + e2e |
| 9 | Admin: "Cách áp dụng", "Từng phần" (summary, badge, Xem, Bỏ chọn riêng + Hoàn tác), nhãn ghim ở "Các phần & thứ tự" + deep link focus; không lộ mã thô (A07, `admin-v22.spec.ts` vẫn xanh) | e2e T7 + toàn bộ e2e |
| 10 | `npm test` xanh; toàn bộ `npm run test:e2e` xanh 1 lần; 0 lỗi console | lệnh |
| 11 | ui-ux-designer review: 0 điểm Cao/Vừa còn mở; ảnh 4 theme × 375 px giữa reveal của couple/announcement/album/thankyou; heading có dấu chồng ở 4 gói mới; admin "Từng phần" ở 360 px | designer |
| 12 | Kiểm tay: Safari iOS (mask-up với `overflow: hidden` fallback, `clip-path` transition, Segmenter), Android tầm thấp (FPS, `revealLite`), webview Zalo/Facebook | người duyệt/thiết bị thật |

### Data/ETL
Không liên quan.

---

## 👥 Phân công
- **Backend (backend-developer):** không cần (không có backend).
- **Frontend (frontend-developer):** 1 FE trên `wt/v4a-2a` (slot trống đầu tiên, cặp cổng do orchestrator gán), sau khi Bước 0 merge. Thứ tự đề xuất, mỗi bước ghi report `frontend-report-v4a-2a.md`:
  1. Schema + `reveal-plan.ts` + resolve/merge/labels/ops + unit (`reveal-plan`, `v4a2a-schema`).
  2. Engine entry (`atoms`, `text`, `wipe-queue`, `mask-lines`, `reveal.ts`) + CSS reveal + R2A-01..04, 06, 08 + unit `reveal-atoms`.
  3. `reveal-split`, `parallax-layers`, `revealLite`, bật capability nguyên tử rồi gói.
  4. Preview `fx-preview` + `bootstrap` + debug hook.
  5. Micro (10) + `micro.test.ts` + R2A-05, 07 + `countdownStyle`.
  6. Admin (`reveal-block`, `micro-block`, `sections.tsx`, checklist nếu được phép).
  7. E2E `v4a-2a.spec.ts`, đo ngân sách, toàn bộ e2e 1 lần.
- **Cần ui-ux-designer: Có**, chỉ ở bước 4 (review visual theo design §6 "Designer review"); spec và asset đã đủ.
- **Có thể làm song song BE và FE: Có** (không có BE). 2a chạy song song với 2b/2c được nhờ bản đồ sở hữu; với v4a-1 chạy song song được nhưng **merge sau v4a-1** (mục 7.2).

---

## ⚠️ Lưu ý kỹ thuật
- **CSP:** không `innerHTML`, không thuộc tính `style`; biến qua `css()`/`element.style.setProperty` (CSSOM, hợp CSP như code hiện tại); tạo span bằng `h()`/`document.createElement`; khôi phục chuỗi bằng cách giữ node gốc (WeakMap) rồi `replaceChildren`, không ghép HTML.
- **Hiệu năng:** chỉ `transform`/`opacity` + ngoại lệ đã ghi (`clip-path` wipe, `filter` blur-in ≤ 3); `will-change` gắn lúc `is-in`, gỡ ở `rv-done`, ≤ 6 phần tử; không thêm vòng rAF thường trực (trừ parallax-layers ở Nhiều, dùng chung listener `setupParallax`, và fallback scroll-progress); không tạo lại span khi cuộn; không thêm dependency.
- **A11y:** chuỗi tách có `sr-only` + `aria-hidden`; nhãn select/nút Xem đầy đủ; hiệu ứng tự chạy ≤ 5 s (WCAG 2.2.2); chạm đúp chỉ khoá zoom trên `.person-photo` khi bật (vẫn chụm 2 ngón được, WCAG 1.4.4).
- **Thay đổi hành vi khi deploy (không phá schema):** config không có `mode` thành "Xen kẽ tự động" (Q1 đã đồng ý); Trầm Vàng hiện tại sẽ có tiêu đề "Cô Dâu & Chú Rể" hiện từng chữ, gia đình mask-up, album wipe. Ghi vào ghi chú phát hành.
- **Lệch nhỏ so với design (đã cân nhắc, không đổi trải nghiệm):** (1) `revealTier`/`revealAffinity` đặt trong `reveal-plan.ts`, không trong `SECTION_META`, để `meta.ts` không bị đụng; (2) guest tính plan từ DOM thay cho `PlannedSection[]` (cùng kết quả cho section expressive); (3) hệ số gói/easing gắn `data-rvk` trên phần tử thay `.sec[data-rvp]` (vì auto chỉ đổi heading/image); `data-rvp` vẫn đặt trên section; (4) ghim gói chưa hỗ trợ thì bỏ ghim (câu hỏi #1); (5) `music-ripple` nằm trong entry (≈ 0.15 KB) để không lỡ lần phát đầu; (6) e2e gộp vào `v4a-2a.spec.ts` thay `reveal-b1.spec.ts`.
- **Test cũ có thể đổi:** `tests/intensity.test.ts` (2a sở hữu) dòng 32 và 111. Không test e2e hiện có nào kiểm `data-rva`/text heading (đã grep), nên chuỗi tách không làm vỡ `guest.spec.ts`.
- **Bàn giao cho `solution.md` (khi Rev 5 xong, người sở hữu cập nhật, không phải 2a):** §4.3 thêm `reveal:<sectionId>`; §5.5/5.6 thêm `effects.reveal.mode`, `effects.reveal.sections`, `REVEAL_MODES`; §8.4 dòng "Reveal" bỏ `padding-block:.2em` (R2A-04), `blur-in` fallback `mask-up` (R2A-02), thêm B1 + `revealLite`, `scrollProgress` theo config (R2A-05); §8.4 dòng FPS thêm `revealLite`; §9.1 thêm các chunk lười mục 3.1. Trỏ sang file này.

---

## ❓ Phần nào chưa rõ ràng, cần confirm
1. **Ghim một gói chưa có trong capabilities** (chỉ xảy ra khi config tạo từ bản mới hơn hoặc trước khi 2a bật đủ gói). - Giả định: bỏ ghim, section đó theo tự động + cảnh báo (Phụ lục A ghi "capOr fallback", tức ghim sang `soft`).
2. **Hoạ tiết ở cấp Nhẹ:** bảng design 3.7 ghi `svg-draw`, nhưng cùng mục ghi "cột Nhẹ là `gentle`" (gói `gentle` không có hoạ tiết) và code hiện tại cho `none`. - Giả định: giữ hiện trạng (Nhẹ: hoạ tiết hiện ngay, không vẽ nét).
3. **Dòng diff thừa** "Kiểu hiện từng phần: xoá {}" khi thêm ghim đầu tiên (`diff.ts` chưa có chủ). - Giả định: orchestrator cho 2a sửa 1 hunk `flatten()` (bỏ lá object rỗng khi phía kia có con); không cho thì chấp nhận (giống `theme.overrides` hiện nay).
4. **Quyền sửa file ngoài bản đồ:** `ops.ts` (2 hunk), `checklist.ts` (1 hunk), `.size-limit.cjs` (1 hunk ngân sách chặt), `icons.ts` (1 export). - Giả định: orchestrator đồng ý cả 4, 2a merge sau v4a-1.
5. **Ngân sách entry cho micro** (≤ +0.6 KB, ngoài +2.5 KB của reveal mà design ghi). - Giả định: đồng ý; phần micro nặng đều lười.

---

## ✅ Checklist trước khi implement
- [ ] Người duyệt/orchestrator xác nhận câu hỏi #1-#5
- [ ] Bước 0 đã merge; `wt/v4a-2a` tách từ branch phiên sau đó; `npm ci`
- [ ] Review schema 1.1-1.4 (không tăng `schemaVersion`, không migration)
- [ ] Xác nhận contract nội bộ (bảng API) và DOM (`data-rvp`, `data-rvk`, `data-rvw`, `rv-done`, `__wpReveal`, `__wpFxDone`)
- [ ] Orchestrator gán cặp cổng e2e; FE tạo `frontend-report-v4a-2a.md` ngay khi bắt đầu
- [ ] Thứ tự merge: v4a-1 trước 2a (xung đột ở `resolve.ts`, `merge.ts`, `labels.ts`, `schema-meta.ts`, `ops.ts` giữ cả hai)
