# Solution v4a-2b + v4a-2c (+ bản đồ sở hữu file cho FE song song)

> Task `20261007-wedding-page` · solution-designer · 2026-10-09.
> Nguồn: `solution.md` Rev 4 (§5.5–5.6, §8.1, §8.4, §9.1, "Kế hoạch triển khai" dòng v4, "Còn mở" #4), `design.md` §3.4/3.4b/3.4c, §5.6/5.7/5.10, §8.13, `design-review-envelopes.md` E12, `decisions.md` (2026-10-09), `status.md` mục 8, code hiện tại (đường dẫn ghi ở từng mục).
> **Chưa có** `design-v4a-2bc.md` và `assets/v4a-2/` (ui-ux-designer B đang làm). Mọi chỗ phụ thuộc asset/spec của designer B ghi rõ **[GĐ-B]** = giả định, designer B được quyền ghi đè; FE đọc `design-v4a-2bc.md` khi có, chỗ nào lệch thì theo design và ghi vào report.
> Không đổi schema. Không đổi `solution.md`.

---

## 📋 Tóm tắt yêu cầu

- **v4a-2b**: thêm 13 module kiểu mở thiệp (`curtain`, `wax-seal`, `origami`, `double-door`, `flower-gate`, `scroll`, `card-3d`, `light-gather`, `gift-box`, `moon-gate`, `book`, `ink-spread`, `polaroid`), mỗi module lazy ≤ 4 KB gz, chạy được ở 5 trạng thái (Tắt / Nhẹ / Vừa / Nhiều / reduced-motion), tua nhanh ≤ 300 ms khi chạm lần 2, tự hạ cấp trên máy yếu; thêm cấp "Nhiều" riêng cho 6 mẫu phong thư (E12). Admin hiển thị đủ 17 kiểu.
- **v4a-2c**: thêm 16 loại hạt nền (≤ 1.5 KB gz/loại) và 4 burst (`confetti`, `gold`, `red-paper`, `heart-burst`) tải lười sau khi mở thiệp; màu theo theme/multi/hex; admin hiển thị đủ 21 loại hạt và 5 lựa chọn "Sau khi mở".
- Ba đợt FE chạy song song trên 3 git worktree (v4a-1, 2b, 2c; sau đó 2a). Vì vậy tài liệu này chốt **bản đồ sở hữu file** và một **Bước 0** dựng sẵn các "khớp nối" dùng chung trước khi tách nhánh, để mỗi đợt chủ yếu chỉ tạo file mới.

---

## 🔍 Phân tích

### Tái sử dụng được (đã có trong code)
| Thành phần | File | Dùng cho |
|---|---|---|
| Registry kiểu mở + `fade-zoom`/`fade200` trong entry | `src/guest/cover/open-registry.ts` | 2b thêm 13 loader |
| WAAPI timeline + tua nhanh (`runSteps`, `FAST_FORWARD_MS=300`, `MAX_OPEN_MS=2400`) | `src/guest/cover/anim.ts` | mọi module 2b dùng DOM/WAAPI |
| Luồng cover: chuẩn bị (≤ 300 ms hiện "Đang chuẩn bị…", ≤ 4 s vẫn cho mở), chạm lần 2 = `fastForward()`, `.cv-actions` rút đi, fallback `fadeZoom` khi module lỗi | `src/guest/cover/cover.ts` | giữ nguyên, mở rộng |
| Ma trận cấp: `MATRIX.openStyle` = `fade200/light/full/full+/fade200`; `burstOnOpen`; `BURST_COUNTS` đủ cả 5 burst (`confetti 0/80/120`, `gold 0/60/100`, `red-paper 0/80/120`, `heart-burst 0/8/12`) | `src/guest/effects/intensity.ts` | 2b/2c **không cần sửa** |
| Tự hạ cấp phần cứng (`isLowEnd`, `computeIntensity`), đo FPS (`measureFps`, `FPS_THRESHOLD=45`) | `intensity.ts`, `perf-probe.ts` | 2b dùng `measureFps` cho `light-gather` |
| ParticleField 1 canvas, sprite 2 cỡ, `makeSprite()` public, `addBurst()`, trần 40 + 120, 4 mô hình chuyển động | `src/guest/effects/particles/field.ts`, `kind.ts` | 2c thêm loại; 2b dùng cho hạt trên cover |
| Mẫu module loại hạt (`ParticleKind` + `draw()`) | `particles/types/firefly.ts`, `petal-rose.ts`… | khuôn cho 16 loại mới |
| Burst `petals` | `effects/burst/petals.ts` | khuôn cho 4 burst |
| Skin phong bì + `EnvelopeSkin.unlock()` | `cover/skins/kit.ts`, `cover/styles/envelope.ts` | E12 |
| Nhãn tiếng Việt cho **mọi** enum (17 kiểu mở, 21 hạt, 5 burst) | `src/shared/labels.ts` | 2b/2c **không cần sửa** |
| Enum đủ từ v1 (`OPEN_STYLES`, `PARTICLE_TYPES`, `BURSTS_ON_OPEN`) | `src/shared/config/enums.ts` | không sửa |
| Gợi ý theo theme (`suggest.openStyle/burstOnOpen/particles`) đã đủ 12 theme | `src/shared/theme/presets.ts` | không sửa |
| Plugin: `modulepreload` module openStyle + loại hạt đang dùng; phân loại chunk cho size-limit | `scripts/vite-plugins/inject-config-og.ts`, `.size-limit.cjs` | Bước 0 mở rộng chung |
| Checklist cảnh báo tổ hợp nặng (`high` + `cinematic` + `light-gather`) | `src/admin/draft/checklist.ts` | đã có |
| Preview: `fx:replay` target `cover`/`burst`/`particles`, "Mô phỏng máy yếu/giảm chuyển động" ép `deviceInfo` | `bootstrap.ts`, `effects/service.ts`, `preview-bridge.ts` | dùng cho e2e (mục 4) |
| E2E cổng tham số hoá `PW_PREVIEW_PORT`/`PW_DEV_PORT`, `PW_EXECUTABLE_PATH` | `playwright.config.ts` | giữ |

### Khoảng trống phát hiện khi đọc code (ảnh hưởng thiết kế)
1. **`cover.ts` `stage()` cứng 3 dạng DOM** (`envelope` / `card-flip` / `plain`). Kiểu mở mới phải tự dựng lớp hình trong `prepare()` (giống skin phong bì), dựa trên khung `plain`.
2. **Hạt không chạy được khi cover còn hiện**: `fxBlocked()` trả `true` khi `!ctx.opened`; `.cover-on .fx-canvas{opacity:0}`; `--z-petals: 20` < `--z-cover: 80`. E12, `flower-gate`, `gift-box`, `wax-seal`, `double-door`, `moon-gate` đều cần hạt **trên** cover -> cần chế độ "over cover" cho ParticleField (Bước 0).
3. **`BURST_HARD_CAP = 120`**: `light-gather` cần 400/700 hạt -> không dùng được ParticleField (lệch solution 8.1 "dùng canvas của ParticleField"). Đề xuất canvas riêng nằm trong `.cover`, chỉ sống ≤ 2.4 s (câu hỏi #3).
4. **`service.afterOpen()` cứng `petals`** -> cần registry burst (Bước 0) để 2c thêm burst mà không sửa `service.ts`.
5. **`loadKinds()` âm thầm rơi về `petal-rose`** khi id chưa có loader -> hạt trên cover phải tự kiểm `id in PARTICLE_LOADERS` để rơi về loại của theme, không thành cánh hồng.
6. **`addBurst` chỉ lật giả khi sprite key bắt đầu bằng `k`** -> confetti cần cờ `flip` riêng (2c sửa `field.ts`).
7. **Plugin xếp mọi chunk có `facadeModuleId` chứa `/cover/styles/` vào nhóm openStyle 4 KB**; chưa có `manualChunks`. Helper dùng chung phải nằm ngoài `styles/` và có nhóm ngân sách riêng.
8. **E12**: `MATRIX.openStyle.high = 'full+'` đã truyền vào `play()`, nhưng `envelope.ts` coi mọi cấp khác `light` là đầy đủ. Skin `lace` chưa có 6 cánh hoa ở mức Vừa (design 3.4c).
9. **Test sẽ vỡ khi bật capability** (nam châm xung đột): `tests/resolve.test.ts` "giá trị config chưa có ở v1 -> fallback" (ghim `hong-phan`, `polaroid`, `light-gather`, `prata`, `snow`, `cinematic`, `split-chars`, 7 cảnh báo) vỡ ở **cả v4a-1, 2a, 2b, 2c**; `tests/e2e/admin-v22.spec.ts` dòng 62–68 ("Cuộn thư sẽ có ở bản sau") vỡ khi 2b bật `scroll`.
10. **Gợi ý theme đổi kết quả khi bật capability**: config đang để `"theme"` sẽ đổi hình sau deploy (vd `son-do` -> `scroll` + `red-paper`; `dem-nhung` -> `light-gather` + `gold`; `hong-phan` -> `flower-gate`…). Đúng thiết kế nhưng cần báo người duyệt (câu hỏi #6).
11. **Preview mode tự coi là máy khoẻ** (`deviceInfo()` trả 8 nhân trừ khi `simulate.lowEnd`) -> test 13 kiểu mở chạy bằng preview stash không cần giả lập phần cứng; chỉ test chạy trên bản build thường mới cần `addInitScript` `hardwareConcurrency=8`.
12. **`routes/effects.tsx` một file chứa cả kiểu mở (2b), hạt + "Sau khi mở" (2c), reveal + chi tiết nhỏ (2a)**, cùng chung dòng import -> cần tách thành khối (Bước 0).

### Cần tạo mới (tóm tắt)
- 2b: 13 file `src/guest/cover/styles/<id>.ts` (+ `<id>.css`), thư mục helper `src/guest/cover/open-kit/` (≤ 3 KB), `src/shared/open-styles.ts` (meta chi phí/thời lượng + hàm hạ cấp thuần), asset kiểu mở `src/guest/cover/assets/` **[GĐ-B]**, khối admin `src/admin/editor/fx/open-block.tsx` + `open-mini.css`, E12 trong `skins/*.ts` + `envelope.ts`.
- 2c: 16 file `particles/types/<id>.ts`, `particles/sprite-kit.ts`, 4 file `burst/<id>.ts`, khối admin `fx/particles-block.tsx`.
- Bước 0: `src/shared/caps/*`, `effects/burst/registry.ts`, hook over-cover trong `field.ts`, tách `effects.tsx`, mở rộng plugin/size-limit/vite config, `tests/e2e/fx-helpers.ts`, làm `resolve.test.ts` không phụ thuộc capability.

### Rủi ro / edge case chính
- Tên khách/cặp đôi bị che hoặc bị clip khi kiểu mở "đóng" thiệp (rèm, cửa, sách, hộp, polaroid úp…) -> quy tắc ở 1.2.
- 3D trên Safari iOS (`backface-visibility` cần tiền tố `-webkit-` với Safari 14), `clip-path` animate bằng WAAPI trên webview cũ -> kiểm tay.
- `light-gather` tốn pin trước khi chạm (hạt trôi liên tục) -> dừng sau 5 s (WCAG 2.2.2).
- 2b phụ thuộc mềm vào 2c (sprite `red-paper`, `petal-lotus`, `leaf-green`, `sparkle`, burst `confetti`): 2b code theo id và **fallback** về loại hạt của theme khi 2c chưa merge.
- Xung đột merge ở file dùng chung -> mục 3.

---

## 🏗️ Giải pháp

### Database
Không có DB (site tĩnh). **Config schema: KHÔNG đổi** cho 2b, 2c và E12:
- Mọi giá trị đã hợp lệ từ v1 (`cover.openStyle` 17 + `theme`, `effects.particles.types` 21, `effects.burst.onOpen` 5 + `theme`).
- E12 dùng `effects.intensity = high` (đã map sang `full+`) + `cover.envelope.style` sẵn có; không thêm field.
- `heart-burst` không phải giá trị `burst.onOpen` (đúng enum), chỉ là module dùng bởi lời chúc (v3) và mô phỏng preview.
- Bật tính năng = thêm id vào file capability của đợt (mục 0.1). Không migration, không bump `schemaVersion`.

### API Endpoints
Không có HTTP endpoint. Dưới đây là **contract nội bộ** để 2b, 2c và Bước 0 làm song song. Chữ ký là spec, FE được đổi tên biến nội bộ nhưng không đổi hình dạng public.

| Contract | File (chủ sở hữu) | Hình dạng |
|---|---|---|
| Capability add-on theo đợt | `src/shared/caps/types.ts` (Bước 0) | `interface CapsAddon { theme?: readonly ThemeId[]; openStyle?: readonly OpenStyle[]; particle?: readonly ParticleType[]; burstOnOpen?: readonly BurstOnOpen[]; revealStyle?; revealAtom?; ornamentSet?; texture?; photoFrame?; divider?; countdownStyle?; font?; envelopeStyle? }` |
| Module kiểu mở v2 | `cover/open-registry.ts` (2b) | `interface OpenPrepareInfo { mode: 'fade200'\|'light'\|'full'\|'full+'; lowEnd: boolean; preview: boolean }` · `interface OpenModule { prepare?(cover: HTMLElement, info: OpenPrepareInfo): Promise<void>; play(cover: HTMLElement, c: OpenLevelCtx): OpenRun; dispose?(): void }` |
| Lần chạy | `cover/anim.ts` (2b) | `interface OpenRun { finished: Promise<void>; fastForward(): void; totalMs: number; remainingMs(): number }` · `OpenLevelCtx` thêm `tap?: { x: number; y: number }`, `lowEnd: boolean` |
| Meta kiểu mở (thuần, dùng chung guest + admin) | `src/shared/open-styles.ts` (Bước 0 tạo khung, 2b điền) | `OPEN_META: Record<OpenStyle, { cost: 'low'\|'medium'\|'high'; ms: number; usesParticles: boolean }>` · `effectiveOpen(id, mode, lowEnd): { id: OpenStyle; mode }` |
| Burst | `effects/burst/registry.ts` (Bước 0 tạo, 2c sở hữu) | `interface BurstOpts { count: number; origin?: { x: number; y: number }; from?: { left: number; top: number; right: number; bottom: number }; kindCount: number }` · `interface BurstModule { play(field: ParticleField, o: BurstOpts): number }` (trả số hạt đã thêm) · `playBurst(id: string, field, o): Promise<number>` (id chưa có loader -> `petals`) · `scheduleOnOpenBurst(field, id, state, kindCount): void` |
| Hạt trên cover | `particles/field.ts` (Bước 0 thêm hook) | `field.setOverCover(on: boolean): void` - bật: canvas class `is-over-cover`, vòng lặp chỉ dừng khi tab ẩn (bỏ điều kiện `!ctx.opened`); hạt nền (`target()`) luôn 0 khi `!ctx.opened` |
| Hạt trên cover (tiện ích 2b) | `cover/open-kit/sparks.ts` (2b) | `coverSparks(r: { kind?: ParticleType; burst?: string; count: number; origin: Element \| { x: number; y: number }; at?: number }): Promise<void>` - `kind` chưa có loader -> dùng loại hạt `k0` của theme; `burst` chưa có -> `petals` |
| `ParticleKind` mở rộng | `particles/kind.ts` (2c) | thêm tuỳ chọn `alpha?: number` (trần opacity riêng), `sway?: [number, number]`, `drift?: number` (px/s ngang cho "fall + drift"), `depth?: boolean` (cỡ nhỏ -> chậm + mờ), `twinkle?: boolean` (nhấp nháy kèm `fall`) |
| `BurstParticle` mở rộng | `particles/field.ts` (2c) | thêm `flip?: boolean` (thay suy luận theo tiền tố `k`) |
| postMessage preview | không đổi | `fx:replay` `target: 'cover' \| 'burst' \| 'particles'` giữ nguyên; `fx:done` cho `cover` lấy theo `OPEN_META[id].ms + 300` |
| Hook debug (chỉ `?debug=fx`) | 2b: `cover.ts`; 2c: `burst/registry.ts` | `window.__wpCover = { style, effective, level, totalMs, remainingMs() }` · `window.__wpBurst = (id, opts) => Promise<number>`; `__wpFx.snapshot()` giữ nguyên |

### Data Flow
**Mở thiệp (2b):**
1. `bootstrap` -> `mountCover()`; `effectiveOpen(r.openStyle, fx('openStyle', state), ctx.fx.lowEnd)` quyết định module thật + cấp (vd `light-gather` + máy yếu -> `fade-zoom`).
2. Cover render khung `plain` ngay (tên cặp đôi + "Kính gửi …" đọc được trước khi module tải) -> `loadOpenModule(id)` (đã `modulepreload` + CSS `<link>` + ảnh `preload` do plugin chèn) -> `prepare(cover, info)` dựng lớp hình (chạy cả ở `fade200` để hình tĩnh đúng kiểu, trừ phần động như canvas của `light-gather`).
3. Kiểu có hạt ở cấp hiện tại (`OPEN_META.usesParticles` + cấp ≥ Vừa): trong `prepare` gọi `getField()` (lazy) để canvas sẵn sàng; khi phát thì `field.setOverCover(true)`.
4. Chạm (handler đồng bộ): nhạc `play()` -> `run = play(cover, { level, tap, lowEnd, greeting, timeScale })` -> chạm lần 2 = `run.fastForward()` -> `run.finished` -> gỡ cover, `setOverCover(false)`, `dispose()` -> `afterOpen()`.

**Sau khi mở (2c):** `afterOpen()` -> `getField()` -> `scheduleOnOpenBurst(field, r.burstOnOpen, state, kindCount)`: `requestIdleCallback(..., { timeout: 300 })` (Safari không có rIC -> `setTimeout(…, 1)`) -> `import()` module burst -> `play()`; nếu module về muộn hơn 1000 ms sau khi mở thì **bỏ** (không bắn burst trễ) -> `field.start()` hạt nền (1–2 loại, module đã `modulepreload`).

### Business Logic
Chi tiết ở mục 1 (2b) và 2 (2c). Tóm tắt các quy tắc cứng:
- Kiểu mở: tổng ≤ 2400 ms ở mọi cấp; chạm lần 2 -> phần còn lại ≤ 300 ms; chỉ `transform`/`opacity` (+ `clip-path` có biên ±0.3em, `z-index` rời rạc, canvas cho `light-gather`); Tắt/reduced = fade 200 ms; máy yếu: chi phí Cao -> `fade-zoom`, chi phí Vừa -> bản Nhẹ.
- Hạt: số hạt = `8/16/28 × hệ số loại × densityFactor theme × hệ số section`, ≤ 40 (máy yếu ≤ 12); burst ≤ 120 hạt cộng dồn; mọi hạt `aria-hidden`, không nhận chạm; không tạo canvas khi Tắt/reduced.
- Không đổi schema; không thêm dependency; không `innerHTML`, không thuộc tính `style` (dùng `h()`/`css()`/CSSOM).

---

### 0. Bước 0 - khung chung (làm TRƯỚC khi tách worktree 2b/2c)

Mục tiêu: dựng sẵn mọi "khớp nối" ở file dùng chung để sau đó mỗi đợt gần như chỉ tạo file mới. **Không đổi hành vi**. Ước lượng ≈ 0.5 ngày. Đề xuất giao FE-2 làm trên `wt/v4a-2-0`, merge vào branch phiên, rồi `wt/v4a-2b`, `wt/v4a-2c` (và `wt/v4a-1` nếu đã tách thì merge vào) tách từ đó (câu hỏi #1).

| # | Việc | File |
|---|---|---|
| 0.1 | Tách capability theo đợt: `capabilities.ts` ghép `supported` = danh sách gốc (v2.3) + add-on của 4 file đợt. Tạo `src/shared/caps/{types,v4a-1,v4a-2a,v4a-2b,v4a-2c}.ts` (4 file đợt rỗng `{}`), import có đuôi `.ts` (plugin chạy trong Node). Thêm vùng đánh dấu `// [v4a-1] keys >>>/<<<` và `// [v4a-2a] keys >>>/<<<` cuối object `CAPABILITIES` cho key **mới** (vd `motifSet`). `STAGE` để orchestrator sửa lúc merge. | `src/shared/capabilities.ts`, `src/shared/caps/*` |
| 0.2 | Khung `src/shared/open-styles.ts`: `OPEN_META` đủ 17 id (4 id đang có điền thật; 13 id điền theo bảng 1.1, `usesParticles` theo bảng) + `effectiveOpen()` thuần + unit test. Admin `OPEN_COST` chuyển sang đọc từ đây. | `src/shared/open-styles.ts`, `tests/open-styles.test.ts` |
| 0.3 | Registry burst: `effects/burst/registry.ts` với `BURST_LOADERS = { petals }`, `playBurst`, `scheduleOnOpenBurst`; `petals.ts` đổi sang `BurstModule`; `service.afterOpen()` gọi `scheduleOnOpenBurst` thay cho khối `if (burst === 'petals')` (giữ đăng ký `EffectRegistry 'burst'`). | `effects/burst/registry.ts`, `burst/petals.ts`, `effects/service.ts` |
| 0.4 | Hook over-cover: `field.setOverCover(on)`; `ensureRunning/syncPause` dùng `blocked()` = `overCover ? document.hidden : fxBlocked()`; `target()` = 0 khi `!ctx.opened`. CSS: `.cover-on .fx-canvas.is-over-cover{opacity:1; z-index:calc(var(--z-cover) + 1)}`. | `particles/field.ts`, `styles/fx.css` |
| 0.5 | Tách `routes/effects.tsx` thành khối (chỉ di chuyển code, giữ nguyên `data-testid`): `fx/intensity-block.tsx`, `fx/open-block.tsx` (+ `EnvelopeGallery`), `fx/particles-block.tsx` (gồm "Sau khi mở"), `fx/reveal-block.tsx`, `fx/micro-block.tsx` (chi tiết nhỏ + nâng cao), `fx/autoscroll-block.tsx`. Chuyển rule `.omini*` (admin.css dòng 298–308) sang `fx/open-mini.css` import từ `open-block.tsx`. | `src/admin/editor/routes/effects.tsx`, `src/admin/editor/fx/*`, `src/admin/admin.css` |
| 0.6 | Vite: gom `src/guest/cover/open-kit/**` thành 1 chunk tên `open-kit` (`build.rollupOptions.output.manualChunks` dạng hàm; nếu Vite 8/Rolldown báo deprecated thì dùng `advancedChunks.groups` tương đương). Kiểm: build ra đúng 1 chunk, không bị chép vào chunk kiểu mở. | `vite.config.ts` |
| 0.7 | Plugin (chung, không theo đợt): (a) phân loại chunk mới: `open-kit` (theo `ch.name`/`moduleIds`, không theo `facadeModuleId`), `burst` (`/effects/burst/` trừ `fireworks*`), CSS riêng của từng kiểu mở (`importedCss` của chunk `/cover/styles/*`); (b) với chunk kiểu mở đang dùng: thêm `modulepreload` cho `ch.imports` (open-kit), `<link rel="stylesheet">` cho `importedCss`, `<link rel="preload" as="image">` cho `importedAssets` là ảnh. | `scripts/vite-plugins/inject-config-og.ts` |
| 0.8 | size-limit: thêm nhóm `open-kit` ≤ 3 KB, `openStyle CSS: <id>` ≤ 1.5 KB/kiểu, `burst: <id>` ≤ 3 KB/burst (chặt hơn 15 KB lazy chung). | `.size-limit.cjs` |
| 0.9 | Test không phụ thuộc capability: viết lại test "giá trị config chưa có ở v1 -> fallback" trong `resolve.test.ts` để **tự chọn** giá trị chưa hỗ trợ từ enum − `CAPABILITIES` (bỏ qua nhóm đã đủ), số cảnh báo tính động. | `tests/resolve.test.ts` |
| 0.10 | Helper e2e dùng chung (chỉ thêm, sau Bước 0 không ai sửa): `bootPreview(page, patch, fx?)` - đọc `public/content/config.json`, deep-merge `patch`, `addInitScript` ghi `sessionStorage['wp_preview_boot_v1'] = { config, assets: {}, options: {}, fx, href }` rồi `goto('/?preview=1&debug=fx')` (đúng cơ chế `readStash()`; không cần khung admin; preview tự coi máy khoẻ, `fx.simulate` ép máy yếu/giảm chuyển động); `strongDevice(page)` (`hardwareConcurrency`/`deviceMemory` = 8 cho test chạy bản build thường); `coverTiming(page)` (bấm mở, `pause()` mọi animation trong `.cover`, trả `endTime` lớn nhất hoặc `__wpCover.totalMs`); `remainingAfterFastForward(page, atMs)`; `fxSnap(page)`; `watchConsole(page)`. | `tests/e2e/fx-helpers.ts` |
| 0.11 | Chèn vùng đánh dấu rỗng cho file v4a-1 và 2a cùng sửa (mục 3.3). | `bootstrap.ts`, `enums.ts`, `config/types.ts`, `config/defaults.ts`, `styles/tokens.css`, `styles/base.css`, `styles/sections.css`, `admin/admin.css` |

**Tiêu chí xong Bước 0:** `npm run build` xanh, kích thước JS/CSS ban đầu lệch ≤ 0.3 KB so với v2.3; `npm test` xanh; toàn bộ `npm run test:e2e` xanh 1 lần; diff không đổi giao diện admin/guest (cùng testid).

---

### 1. Kế hoạch kỹ thuật v4a-2b

#### 1.1 Module từng kiểu mở
Vị trí: `src/guest/cover/styles/<id>.ts` + `<id>.css` (import trong module, CSS chỉ tải khi dùng). Đăng ký: thêm 1 dòng vào `OPEN_LOADERS` (`open-registry.ts`) và id vào `src/shared/caps/v4a-2b.ts` **khi module đạt tiêu chí** (mục 5). DOM dựng trong `prepare()` bằng `h()`/`svg()`; lớp hình `aria-hidden`; CSS chọn theo `.cover[data-open="<id>"]`.

| id | Lớp hình dựng trong `prepare` | Vừa (ms) | Nhẹ | Nhiều | Chi phí | Hạt / asset (fallback khi 2c chưa có) |
|---|---|---|---|---|---|---|
| `curtain` | 2 nửa rèm `.op-l/.op-r` (gradient vải + ornament góc từ sprite theme) phủ thẻ | 1200: rèm `translateX(∓100%)` 900 + cover fade 300 | 700, không ornament trượt | **[GĐ-B]** + dải sáng khe giữa + 12 `gold-dust` ở khe | Thấp | `gold-dust` (đã có) |
| `wax-seal` | thiệp gập 2 cánh + dấu sáp 96 px 2 nửa (SVG zíc-zắc **[GĐ-B]**) + 6 mảnh vụn | 1700: rung 2×120, nứt + rơi, 2 cánh `rotateY(±160)` 600 `--ease-inout`, zoom-fade 400 | dấu fade, cánh mở, không vụn | + 12 `gold-dust` ở vết nứt | Vừa | `gold-dust` |
| `origami` | 4 cánh tam giác 2 mặt (`backface-visibility:hidden`, mặt sau hoạ tiết theme) chụm giữa | 1800: 4 cánh 380, stagger 120, giấy scale lấp màn + fade | 4 cánh cùng lúc, không bóng | + lớp bóng nếp gấp (opacity gradient) | Vừa | - |
| `double-door` | 2 cánh cửa (CSS theo theme) + lớp ánh sáng khe | 1600: `rotateY(±105)` 900, sáng 0→.8→0, `scale 1→1.15` | cánh trượt `translateX` như rèm | + 16 hạt sáng bay ra từ khe | Vừa | `sparkle` (2c) -> fallback `gold-dust` |
| `flower-gate` | cổng vòm + 2 cụm hoa (2 ảnh WebP ≤ 80 KB **[GĐ-B]**, import `?url`, plugin preload) | 1800: 2 cụm trượt chéo + xoay ±8° 800, 24 cánh hoa bung giữa, cổng scale vượt màn | chỉ trượt, không hạt | 40 cánh + lá rơi tiếp 2 s | Vừa | cánh: loại hạt `k0` của theme; lá: `leaf-green` (2c) -> fallback `k0` |
| `scroll` | cuộn giấy + 2 trục + ruy băng; nội dung là thẻ `plain` | 2100: ruy băng 300, trục dưới `translateY` đồng bộ `clip-path: inset(-.3em -.3em 100% -.3em)` -> `inset(-.3em)` 900, giữ 500, fade | trải 500, không giữ | trục xoay theo quãng lăn | Vừa (repaint) | - |
| `card-3d` | thẻ + bóng đổ (phần tử riêng) | 1400: xoay `rotateY(360)` 900 + bóng co giãn, lao tới `scale 1.6` + fade 400. Trước chạm: nghiêng theo con trỏ ±10° (`pointer: fine`), mobile lắc ±3° 3 s rồi dừng | lật 180°, không nghiêng/lắc | + vệt sáng lướt mặt thẻ | Thấp | - |
| `light-gather` | canvas riêng `.op-lg` trong `.cover` (không dùng ParticleField, mục 1.5) | 2400: tụ thành tên 1100 `--ease-out`, giữ 600 sáng nhẹ, tản 700 | (luôn) `fade-zoom` + 12 hạt lấp lánh | 700 hạt | **Cao** | 12 hạt Nhẹ: `sparkle` (2c) -> fallback `gold-dust` |
| `gift-box` | hộp line-art SVG + nơ (path `stroke-dashoffset`) **[GĐ-B]** | 1900: nơ tuột 400, nắp bật xoay 15° 500 `--ease-pop`, thiệp nhô 500, confetti nhỏ, zoom-fade | không confetti, nắp chỉ fade | confetti 80 | Vừa | burst `confetti` (2c) -> fallback `petals`; Vừa **[GĐ-B]** 24 mảnh |
| `moon-gate` | vách gỗ 2 nửa + khung tròn chứa ảnh (nguồn ảnh: 1.2) | 1600: 2 nửa trượt 700, ảnh `clip-path: circle(30%)` -> `circle(150%)` 700 | bỏ bước nở tròn, fade | + cánh sen rơi 1.5 s | Vừa | `petal-lotus` (2c) -> fallback `k0` |
| `book` | bìa + trang trong "Trân trọng kính mời {khách}" (lấy `content.announcement.inviteLine` đã thay `{guest}`) | 1800: bìa `rotateY(-180)` quanh gáy 700, giữ 700, zoom-fade | lật 400, không giữ | + trang lót lật theo | Thấp | - |
| `ink-spread` | vệt mép loang SVG **[GĐ-B]** đặt tại điểm chạm | 1200: lộ landing bằng vòng tròn nở từ điểm chạm + vệt mép scale cùng nhịp | loang từ giữa màn, 600 | + 2 vệt phụ trễ 150 | Vừa | - |
| `polaroid` | tấm polaroid úp (mặt sau giấy), ảnh + lớp trắng đục + lớp sepia, dải tên viết tay | 2200: lật ngửa `rotateY` 500, "rửa ảnh" (2 lớp giảm opacity 1200, **không animate filter**), tên hiện bằng clip-wipe (biên ±0.3em), bay lên khỏi màn | bỏ bước rửa ảnh | + 2 tấm phụ trượt ra lệch góc | Thấp | - |

Ghi chú kỹ thuật:
- **`ink-spread`** - kỹ thuật A (khuyến nghị): lúc chạm nâng `#main` lên trên cover (class tạm `is-ink-reveal`: `position:relative; z-index:calc(var(--z-cover) + 1)`) và animate `clip-path: circle(0 at x y)` -> `circle(150% at x y)` với toạ độ theo hộp của `#main` (`y + scrollY`); vệt mép là phần tử `fixed` trên cùng. Kỹ thuật B (fallback nếu A lỗi trên Safari): lớp mực `accent` hình tròn `scale` từ điểm chạm phủ màn rồi mờ đi. Chạm bằng bàn phím (không có toạ độ) -> giữa màn. FE prototype A trước, ghi kết quả vào report (câu hỏi #10).
- **Tiền tố 3D**: build target có `safari14` -> kiểm CSS đầu ra có `-webkit-backface-visibility` cho `origami`, `double-door`, `card-3d`, `book`, `polaroid`, `wax-seal`.
- `will-change` gắn lúc chạy, gỡ khi xong, ≤ 6 phần tử cùng lúc.
- Mọi lớp tạo bằng `h()`/`svg()`; màu theo biến CSS theme; màu tự chọn qua `css()` (CSSOM).

#### 1.2 Quy tắc chung cho module 2b
- **Tên luôn đọc được trước khi chạm.** Kiểu có "vật đóng" che thẻ (`curtain`, `wax-seal`, `origami`, `double-door`, `flower-gate`, `scroll`, `gift-box`, `moon-gate`, `book`, `polaroid`): tên cặp đôi đặt ở `.cv-head` phía trên (như phong bì), "Kính gửi + tên khách" in trên mặt vật đóng hoặc ngay dưới vật **[GĐ-B]** (câu hỏi #2). Giữ nguyên node `.cv-names`/`.cv-guest` (di chuyển, không chép chuỗi) để `fitEnvGuest`-kiểu tự giảm cỡ và a11y vẫn đúng. Không `line-clamp`/`overflow:hidden` sát chữ; `clip-path` trên vùng chữ luôn có biên ±0.3em.
- **Ảnh cho `moon-gate`/`polaroid`**: `cover.backgroundImage` (khi `cover.background = image`) -> `content.hero.image` (đã preload) -> nền `accent` + monogram. Không thêm preload mới.
- `prepare()` chạy cả khi `fade200` để hình tĩnh đúng kiểu; phần động trước chạm (`card-3d` lắc, `light-gather` hạt trôi) **không** chạy ở `fade200`/Nhẹ.
- Mỗi module export thêm hàm thuần `timeline(level, geom): { steps: StepSpec[]; totalMs: number }` (khoá theo tên lớp, không phải Element) để unit test trong môi trường `node` (vitest không có DOM); `play()` chỉ ánh xạ tên lớp -> phần tử rồi gọi `runSteps`.
- Mức `full+` không được kéo dài tổng quá 2400 ms: phần "Nhiều" chạy song song (hạt trên canvas vẫn bay tiếp sau khi cover gỡ là chấp nhận được, canvas về `z-petals`).

#### 1.3 Helper dùng chung `open-kit` (≤ 3 KB gz, 1 chunk)
`src/guest/cover/open-kit/` - chỉ module kiểu mở mới import tĩnh. **`envelope.ts` và `skins/*` không import tĩnh open-kit** (giữ JS ban đầu của cấu hình mặc định), E12 import động `open-kit/sparks.ts` khi cần.
| File | Nội dung |
|---|---|
| `layers.ts` | `layer(stage, cls, ...kids)`, `halves(stage, cls)` (2 nửa trái/phải cho rèm/cửa/vách/dấu sáp), `face2(el, front, back)` (thẻ 2 mặt + backface), `moveNames(cover)` (đưa `.cv-names` lên `.cv-head` theo 1.2) |
| `clip.ts` | `safeInset(t, r, b, l)` (chuỗi `inset()` có biên ±0.3em ở trục chữ), `circleFrom(x, y, from, to)` |
| `motion.ts` | `withWillChange(els, ms)`, `idleWiggle(el, deg, ms)` (dừng sau ≤ 5 s), `tapPoint(e)` |
| `photo.ts` | `coverPhoto(): ImageRef \| null` theo chuỗi ưu tiên 1.2 |
| `sparks.ts` | `coverSparks()` (contract ở bảng API): `getField()` -> `setOverCover(true)` -> sprite từ `PARTICLE_LOADERS[kind]` nếu có, ngược lại `k0`; hoặc `playBurst()` |
`anim.ts` (`runSteps`) đã ở entry, không chuyển vào open-kit.

#### 1.4 Tua nhanh khi chạm lần 2 (≤ 300 ms)
- WAAPI: giữ cơ chế `runSteps.fastForward()` (tăng `playbackRate` để phần còn lại xong trong 300 ms). Thêm `totalMs`, `remainingMs()` vào `OpenRun`.
- Canvas/JS timeline (`light-gather`, rAF của `card-3d` nghiêng): module tự giữ đồng hồ `t`; `fastForward()` đặt hệ số thời gian `k = remaining / 300` cho phần còn lại.
- Hạt trên cover (canvas) không chặn việc gỡ cover; `finished` chỉ chờ phần DOM/timeline chính.
- Đo trong test bằng thời gian animation (không đo đồng hồ treo tường): ngay sau chạm lần 2, `remainingMs() ≤ 300` (WAAPI: max `(endTime − currentTime) / playbackRate` của mọi animation trong `.cover`).

#### 1.5 Cấp Nhẹ/Vừa/Nhiều/Tắt/reduced + tự hạ cấp
`effectiveOpen(id, mode, lowEnd)` trong `src/shared/open-styles.ts` (thuần, unit test đủ bảng):
| Điều kiện | Kết quả |
|---|---|
| `mode = fade200` (Tắt, reduced-motion) | giữ `id` để `prepare` vẽ hình tĩnh, `play = fade200` (200 ms) |
| `lowEnd` (= `autoDowngrade` && máy yếu) và `cost = high` | `{ id: 'fade-zoom' }` + 12 hạt lấp lánh (`light-gather` Nhẹ) |
| `lowEnd` và `cost = medium` | `mode = 'light'` (kể cả khi `high` đã bị hạ còn `medium`) - design 3.4b |
| còn lại | theo `MATRIX.openStyle` |
| module lỗi tải | `fade-zoom` (đã có) |

**`light-gather` - giả định cho "Còn mở #4" (ngưỡng ≥ 45 fps):**
- Mẫu điểm: sau `waitNameFont()` (≤ 1.5 s), vẽ tên cặp đôi lên canvas phụ bằng font script đã resolve, bước 3 px (2 px với font script để dấu không thưa), lấy ngẫu nhiên đủ 400 (Vừa) / 700 (Nhiều) điểm. DPR ≤ 2, hạt là `fillRect` 1–2 px (không `shadowBlur`).
- Trước chạm: hạt trôi lờ đờ, **dừng sau 5 s** (đứng yên, vẫn đẹp). Trong 1 s đầu đo `measureFps(1000)`: ≥ 45 -> giữ; < 45 -> giảm còn 250 hạt (Vừa) và đo tiếp 1 s; vẫn < 45 hoặc lần đầu < 30 -> chuyển sang nhánh `fade-zoom` + 12 hạt lấp lánh. Quyết định xong trước khi nút "Chạm để mở" bật (nằm trong ngân sách chuẩn bị ≤ 4 s); quá hạn thì dùng mức đang có.
- Tên thật vẫn nằm trong DOM (`.cv-names`, `opacity:0` trong lúc tụ) cho trình đọc màn hình; canvas `aria-hidden`.
- Cảnh báo admin khi chọn kiểu Cao: "Hiệu ứng này đẹp nhưng nặng; máy yếu sẽ tự dùng kiểu đơn giản" (design 3.4b).

#### 1.6 Preload qua plugin
Không cần sửa plugin trong 2b (Bước 0 đã làm chung): `modulepreload` chunk kiểu mở đang dùng + chunk `open-kit` nó import; `<link rel="stylesheet">` CSS riêng của kiểu; `<link rel="preload" as="image">` cho ảnh import trong module (vd 2 WebP của `flower-gate`). Font tên cover đã preload sẵn. `envelope`: giữ preload skin như cũ.

#### 1.7 Admin picker
- `src/admin/editor/fx/open-block.tsx` (2b): gallery `role="radiogroup"` "Theo theme (…)" + 17 thẻ từ `CAPABILITIES.openStyle`; nhãn từ `OPEN_STYLE_LABEL`; badge "Đang dùng ✓", "Gợi ý cho theme", "Nặng ⚠" (từ `OPEN_META.cost`); chọn kiểu Cao -> dòng ghi chú (1.5). Giữ `data-testid="open-<id>"`.
- Hoạt ảnh thu nhỏ CSS thuần 120×160 trong `fx/open-mini.css` (1 khối rule/kiểu, chỉ chạy khi hover/focus/đang chọn; `prefers-reduced-motion` tắt). Nếu designer B giao poster SVG thì dùng poster tĩnh + rule động.
- Chọn = `preview.replay('cover', …)` như hiện tại; `bootstrap.previewAfterOpen` báo `fx:done` sau `OPEN_META[id].ms + 300` (2b chỉ sửa đúng dòng `target === 'cover'`).
- Khối "Mẫu phong bì" (`envelope-gallery.tsx`) giữ nguyên; tuỳ chọn thêm 1 dòng trợ giúp "Mức Nhiều: thêm hạt lấp lánh khi mở".

#### 1.8 E12 - mức "Nhiều" riêng từng mẫu phong thư
**Không đổi schema, không thêm capability.** Dữ liệu: dùng `effects.intensity = high` (-> `full+`) và `cover.envelope.style`. Thay đổi:
| File | Thay đổi |
|---|---|
| `cover/skins/kit.ts` | `EnvelopeSkin` thêm tuỳ chọn `rich?(p: EnvParts): { sparks: SparkPlan[]; steps?: Step[] }` (`SparkPlan = { at: number; kind?: ParticleType; burst?: string; count: number; origin: 'seal' \| 'flap' \| 'card' }`); mặc định (skin không khai báo) = 12 `gold-dust` lóe ở seal tại mốc tách (design 3.4 "Nhiều: + 12 hạt bụi vàng") |
| `cover/styles/envelope.ts` | ở `full+`: chạy `rich()`; `prepare` (khi `mode = full+`, hoặc `lace` ở Vừa) import động `open-kit/sparks.ts` + `getField()`; hạt chạy song song, tổng thời lượng **không đổi** (±50 ms) |
| `skins/classic.ts` | mặc định (12 `gold-dust` ở seal) |
| `skins/song-hy.ts` | `rich`: burst `red-paper` 24 mảnh từ huy hiệu 囍 (~200 ms); fallback `petals` khi 2c chưa merge |
| `skins/lace.ts` | Vừa 6 / Nhiều 12 cánh hoa (loại `k0` của theme) rơi từ cụm hoa ép (~260 ms) - **Vừa hiện còn thiếu, làm luôn** |
| `skins/velvet.ts` | `rich`: 16 `gold-dust` từ seal (~260 ms), giữ vệt sáng |
| `skins/kraft.ts`, `skins/minimal.ts` | mặc định 12 `gold-dust` ở nút nơ / sticker **[GĐ-B]** (câu hỏi #7) |
Mỗi skin vẫn ≤ 1.5 KB gz. Tắt/reduced: fade, không hạt. Máy yếu: `high` bị hạ còn `medium` nên không có phần Nhiều.

---

### 2. Kế hoạch kỹ thuật v4a-2c

#### 2.1 Module từng loại hạt (≤ 1.5 KB gz/loại)
Vị trí `src/guest/effects/particles/types/<id>.ts`, export `kind: ParticleKind`; đăng ký 1 dòng ở `PARTICLE_LOADERS` (`particles/types.ts`) + id vào `src/shared/caps/v4a-2c.ts` khi đạt tiêu chí. Sprite: path từ SVG của designer B -> `Path2D` (hoặc vẽ thủ tục bằng `arc/bezier`), vẽ 1 lần vào canvas phụ (cơ chế `makeSprite` sẵn có). Helper chung (`rgba()`, `mix()`, vẽ cánh đối xứng) ở `particles/sprite-kit.ts` ≤ 0.5 KB.

| id | Chuyển động (`motion` + tuỳ chọn) | Hệ số | Cỡ px **[GĐ-B]** | Màu tự nhiên khi `color = theme` **[GĐ-B]** | Ghi chú |
|---|---|---|---|---|---|
| `petal-sakura` | `fall` chậm, `sway [24,44]`, `flip` | 1.0 | 10–16 | `#F6C6D0`, `#FBE3E8` | 5 thuỳ có khía |
| `petal-lotus` | `fall` rất chậm, `spin` thấp | 0.5 | 24–36 | `#F4B6C2`, `#FBE1E6` | |
| `petal-dried` | `fall` + `drift: 18` | 0.8 | 10–16 | `#B7825A`, `#D9B48F` | mép nhăn |
| `petal-watercolor` | `fall`, `alpha: .8` | 0.8 | 12–20 | `null` (theo theme) | vẽ thủ tục mép loang (không raster) |
| `plumeria` | `fall`, `spin` | 0.6 | 16–24 | `#FFFFFF`, `#F6D365` | cần viền mảnh để thấy trên nền sáng |
| `paper-heart` | `fall`, `flip` (2 mặt) | 0.8 | 12–18 | `null` | |
| `leaf-green` | `drift` + rơi (`vy` > 0) | 0.8 | 12–20 | `#7FA37A`, `#A9C4A0` | xô thơm |
| `leaf-eucalyptus` | `fall`, `spin` nhanh | 0.8 | 10–16 | `#8FA9A0`, `#B9CCC4` | |
| `leaf-maple` | `drift` | 0.7 | 14–22 | `#D2691E`, `#B3401F` | |
| `pampas` | `drift` chậm, `sway` nhỏ | 0.6 | 18–30 | `#E8DCC4`, `#F5EEDF` | sợi lông |
| `snow` | `fall` chậm, `depth: true` | 1.5 | 2–6 | `#FFFFFF`, `#EAF2FA` | cỡ nhỏ -> chậm + mờ (lớp sâu) |
| `bubble` | `float-up`, `sway` | 0.7 | 10–20 | `null` | vòng viền mảnh + điểm sáng |
| `sparkle` | `twinkle` | 1.2 | 6–12 | `null` | sao 4 cánh có lõi sáng |
| `ink-dot` | `fall` rất chậm, `alpha: .15` | 0.6 | 3–8 | `#1C1C1A` | |
| `dust-mote` | `drift` lờ đờ, `alpha: .6` | 1.0 | 2–5 | `#FFF3D6` | |
| `red-paper` | `fall` nhanh, `flip` | 1.0 | 6–10 | `#C8102E`, `#A3201D` | chữ nhật nhỏ |
Bảng hệ số lấy nguyên văn design 5.7 (không đổi). Cỡ/màu là giả định đến khi có `design-v4a-2bc.md`.

#### 2.2 Mở rộng engine (2c sở hữu `kind.ts`, `field.ts` sau Bước 0)
- `ParticleKind`: `alpha`, `sway`, `drift`, `depth`, `twinkle` (contract ở bảng API). `spawnBg()`/`step()` đọc các tuỳ chọn; mặc định = hành vi hiện tại (5 loại cũ không đổi - unit test so ảnh chụp tham số).
- `BurstParticle.flip`; bỏ suy luận theo tiền tố `k` (giữ tương thích: `petals` truyền `flip: true`).
- Giữ nguyên: trần 40/120, DPR ≤ 2 (máy yếu 1), ngân sách 2 ms/frame + giảm 25%, 5 lớp bảo vệ, hook over-cover của Bước 0.

#### 2.3 Burst (4 module, lazy)
`src/guest/effects/burst/<id>.ts` implement `BurstModule`, đăng ký ở `BURST_LOADERS` (`burst/registry.ts`), id `confetti`/`gold`/`red-paper` vào `caps/v4a-2c.ts` (`burstOnOpen`).
| id | Hình | Thời lượng | Số hạt (Nhẹ/Vừa/Nhiều) | Màu |
|---|---|---|---|---|
| `confetti` | giấy chữ nhật + tròn, bắn từ 2 góc dưới theo parabol, rơi lật (`flip`) | 1800 | 0/80/120 (`BURST_COUNTS`); RSVP 0/40/60 (v3 gọi) | `accent`, `accent2`, `primary`, `mix(accent,#fff,.45)` |
| `gold` | bụi vàng + sao 4 cánh toả tròn từ tâm, tắt dần | 1400 | 0/60/100 | theme tối: `#D9B77E`, `#FFE7A8`; theme sáng: `accent` + `mix(accent,#fff,.45)` (tránh "bụi bẩn", như R04) |
| `red-paper` | xác pháo đỏ (sprite loại `red-paper`) rơi từ trên xuống | 1800 | 0/80/120 | `#C8102E`, `#A3201D`, 1/5 vàng `#D4A23C` |
| `heart-burst` | 8–12 tim bung từ `from` (rect nút gửi) | 1200 | 0/8/12 | `primary`, `accent` |
- Mọi burst: `life ≤ thời lượng`, cộng dồn ≤ 120, sprite riêng đăng ký bằng `field.makeSprite('b:<id>:<n>', …)`, không chuyển thành hạt nền (trừ `petals`).
- Thời điểm: `scheduleOnOpenBurst` (Data Flow) - rIC timeout 300 ms sau khi mở, bỏ nếu > 1000 ms.
- `heart-burst` và confetti RSVP: 2c chỉ làm module + hook debug `__wpBurst`; móc vào nút "Gửi lời chúc"/"Tôi sẽ đến" là việc v3 (câu hỏi #8).

#### 2.4 Màu theme / multi / hex
Giữ `particleColors()`: `theme` = `accent` + `primaryDecor`, loại có `natural` dùng màu tự nhiên; `multi` = `accent` + `accent2`; hex = 1 màu. Burst theo bảng 2.3 (không theo `particles.color`, vì design gắn burst với theme). Loại màu trắng/rất sáng (`snow`, `plumeria`, `bubble`, `dust-mote`) trên theme sáng: sprite tự vẽ viền/bóng mảnh `rgba(text,.18)` để thấy được **[GĐ-B]**.

#### 2.5 Admin picker
`src/admin/editor/fx/particles-block.tsx` (2c):
- "Sau khi mở": `Select` từ `CAPABILITIES.burstOnOpen` (đã generic) - không cần sửa logic, chỉ kiểm nhãn.
- Chip loại hạt: hiện trước 8 chip (loại gợi ý của theme đứng đầu + `petal-rose`, `heart`, `snow`, `firefly`, `leaf-green`, `bubble`), phần còn lại trong "Xem thêm (13)" (`Details`), tối đa 2 (giữ hành vi bỏ loại cũ nhất), `aria-pressed`. Nhãn từ `PARTICLE_LABEL`.
- Chọn = `preview.replay('particles')` như hiện tại.

---

### 3. Bản đồ sở hữu file cho FE song song

#### 3.1 Nguyên tắc
1. **Một file - một chủ.** Đợt khác cần sửa -> ghi yêu cầu vào report của mình + báo orchestrator; chủ sở hữu sửa, hoặc orchestrator cho phép 1 hunk cụ thể.
2. **Ưu tiên file mới theo đợt** (capability add-on, khối admin, module, spec e2e) thay cho vùng đánh dấu.
3. **Vùng đánh dấu** chỉ dùng ở file mà ≥ 2 đợt bắt buộc sửa: mỗi đợt chỉ thêm dòng **bên trong** cặp `// [<đợt>] >>>` … `// [<đợt>] <<<` (CSS: `/* [<đợt>] >>> */`), không sắp xếp lại, không đổi dòng ngoài vùng. Các cặp vùng cách nhau ≥ 1 dòng không đổi -> git tự merge.
4. **Không ai** sửa: `public/content/config.json`, `STAGE` trong `capabilities.ts` (orchestrator đặt lúc merge), `package.json`/`package-lock.json` (trừ v4a-1 thêm 14 font), `playwright.config.ts`, `tests/e2e/fx-helpers.ts` (sau Bước 0).
5. Test cũ vỡ **do đợt X bật capability** -> đợt X sửa đúng assertion đó, ghi trong report.

#### 3.2 Bảng file -> đợt
Ký hiệu: **0** = Bước 0; **1** = v4a-1; **2a / 2b / 2c**; **v3** = để v3; "-" = không ai sửa trong v4a-2.
| File / thư mục | Chủ | Ghi chú |
|---|---|---|
| `src/shared/capabilities.ts` | 0 | sau đó chỉ vùng `[v4a-1] keys` (1), `[v4a-2a] keys` (2a) |
| `src/shared/caps/types.ts` | 0 | key mới: vùng (1)/(2a) |
| `src/shared/caps/v4a-1.ts` · `v4a-2a.ts` · `v4a-2b.ts` · `v4a-2c.ts` | 1 · 2a · 2b · 2c | |
| `src/shared/config/enums.ts` | 1, 2a (vùng) | 2b/2c không sửa |
| `src/shared/config/types.ts`, `defaults.ts`, `merge.ts`, `schema-meta.ts`, `migrations.ts` | 1 (cây `theme.motif`), 2a (B1) - vùng | 2b/2c không sửa; không bump `schemaVersion` |
| `src/shared/theme/presets.ts`, `derive.ts`, `fonts/registry.ts` | 1 | |
| `src/shared/theme/resolve.ts` | 1 (motif), 2a (B1) | 2a merge sau 1 |
| `src/shared/labels.ts` | 1, 2a | 2b/2c không cần |
| `src/shared/sections/meta.ts` | 1 / 2a | |
| `src/shared/open-styles.ts` | 0 tạo -> 2b | |
| `src/shared/envelope.ts` | 2b | nếu E12 cần mốc toạ độ |
| `src/guest/cover/cover.ts`, `open-registry.ts`, `anim.ts` | 2b | |
| `src/guest/cover/styles/*` (13 mới + `envelope.ts`, `card-flip.ts`) | 2b | |
| `src/guest/cover/skins/*` | 2b | E12 |
| `src/guest/cover/open-kit/*`, `src/guest/cover/assets/*` | 2b | |
| `src/guest/styles/cover.css` | 2b | v4a-1/2a cần -> yêu cầu |
| `src/guest/styles/fx.css` | 0 (rule over-cover) -> 2a | 2c không cần CSS |
| `src/guest/styles/tokens.css`, `base.css`, `sections.css` | 1, 2a (vùng) | |
| `src/guest/theme-assets/**` | 1 | |
| `src/guest/effects/service.ts` | 0 -> 2a | 2b chỉ import `getField` |
| `src/guest/effects/intensity.ts`, `perf-probe.ts`, `reveal.ts`, `reveal/*`, `micro/*` | 2a | 2b/2c chỉ đọc |
| `src/guest/effects/registry.ts`, `context.ts` | - | |
| `src/guest/effects/burst/registry.ts`, `petals.ts` | 0 -> 2c | |
| `src/guest/effects/burst/{confetti,gold,red-paper,heart-burst}.ts` | 2c | |
| `src/guest/effects/burst/fireworks*.ts` | - | |
| `src/guest/effects/particles/field.ts` | 0 (hook) -> 2c | |
| `src/guest/effects/particles/kind.ts`, `types.ts`, `types/*`, `sprite-kit.ts`, `geometry.ts` | 2c | |
| `src/guest/bootstrap.ts` | vùng: 1 (motif), 2a (reveal B1), 2b (đúng 1 dòng `target === 'cover'`) | 2c không sửa |
| `src/guest/preview-bridge.ts` | 1 | |
| `src/guest/sections/common.ts`, `sections/*.ts` | 1 (divider, frame), 2a (micro/reveal) | 2a merge sau 1; `guestbook.ts`/`rsvp.ts` hook burst = v3 |
| `src/guest/floating/*`, `music/*` | 2a | |
| `src/admin/editor/routes/effects.tsx` | 0 -> 2a | chỉ còn bố cục |
| `src/admin/editor/fx/intensity-block.tsx`, `autoscroll-block.tsx` | 0 -> - | |
| `src/admin/editor/fx/open-block.tsx`, `open-mini.css`, `envelope-gallery.tsx` | 2b | |
| `src/admin/editor/fx/particles-block.tsx` (+ `particles-block.css` nếu cần) | 2c | |
| `src/admin/editor/fx/reveal-block.tsx`, `micro-block.tsx` | 2a | |
| `src/admin/editor/routes/theme.tsx` | 1 | |
| `src/admin/editor/routes/sections.tsx` | 2a | |
| `src/admin/admin.css` | 1, 2a (vùng) | 2b/2c dùng file CSS riêng |
| `src/admin/draft/checklist.ts` | - | đã có cảnh báo tổ hợp nặng |
| `vite.config.ts`, `.size-limit.cjs` | 0 -> - | cần đổi -> yêu cầu orchestrator |
| `scripts/vite-plugins/inject-config-og.ts` | 0 -> 1 | 2b/2c không sửa |
| `package.json`, `package-lock.json` | 1 | |
| `tests/e2e/fx-helpers.ts` | 0 -> - | |
| `tests/e2e/guest.spec.ts`, `admin.spec.ts` | - | |
| `tests/e2e/admin-v22.spec.ts` | 2b (chỉ dòng 62–68) | |
| `tests/e2e/v4a-1*.spec.ts` · `v4a-2a-*.spec.ts` · `v4a-2b-*.spec.ts` · `v4a-2c-*.spec.ts` | 1 · 2a · 2b · 2c | |
| `tests/resolve.test.ts` | 0 -> 1 (khối `describe` motif riêng) | |
| `tests/intensity.test.ts` | 2a | |
| `tests/open-styles.test.ts`, `open-kit.test.ts`, `envelope-e12.test.ts` | 0 tạo `open-styles.test.ts` -> 2b | |
| `tests/particle-kinds.test.ts`, `bursts.test.ts`, `burst-registry.test.ts` | 2c | |
| `tests/fixtures/config-heavy-2b.json` · `config-heavy-2c.json` | 2b · 2c | |
| `docs/tasks/<id>/frontend-report-v4a-2b.md` · `-2c.md` · `-1.md` | 2b (gồm mục Bước 0) · 2c · 1 | |

#### 3.3 Vùng đánh dấu do Bước 0 chèn sẵn
| File | Vùng |
|---|---|
| `capabilities.ts` (cuối object) | `[v4a-1] keys`, `[v4a-2a] keys` |
| `caps/types.ts` | `[v4a-1]`, `[v4a-2a]` |
| `config/enums.ts` | `[v4a-1]` sau `DIVIDERS`; `[v4a-2a]` sau `REVEAL_ATOMS` |
| `config/types.ts`, `config/defaults.ts` | `[v4a-1]` trong `theme`; `[v4a-2a]` trong `sections`/`effects.reveal` |
| `bootstrap.ts` | `[v4a-1]` sau `prepareReveal(main, …)`; `[v4a-2a]` ngay trước `prepareReveal` |
| `styles/tokens.css`, `base.css`, `sections.css`, `admin/admin.css` | `[v4a-1]`, `[v4a-2a]` cuối file |

#### 3.4 Thứ tự merge và xử lý xung đột
1. **Bước 0** merge trước tiên; mọi worktree `git merge <branch-phiên>` ngay sau đó.
2. Các đợt merge theo thứ tự **xong cổng duyệt** (designer review đạt). Nếu xong cùng lúc: **v4a-1 -> 2c -> 2b -> 2a**. Lý do: v4a-1 đổi schema/preset/plugin (phạm vi ảnh hưởng lớn nhất, nền cho 2a); 2c cung cấp sprite/burst mà 2b đang dùng fallback; 2a bắt đầu muộn nhất và đụng `sections/*`/`resolve.ts` của v4a-1.
3. Trước khi xin merge, FE của đợt: `git merge <branch-phiên>` vào `wt/<đợt>`, giải xung đột theo bảng 3.2 (file mình sở hữu: giữ bản mình + phần của Bước 0; vùng đánh dấu: giữ cả hai), chạy `npm test`, `npm run build`, spec e2e của đợt, rồi toàn bộ `npm run test:e2e` **1 lần**.
4. Sau mỗi merge, orchestrator (hoặc FE vừa merge) chạy lại toàn bộ unit + e2e trên branch phiên để bắt **xung đột ngữ nghĩa** (vd theme mới của v4a-1 gợi ý kiểu mở/hạt của 2b/2c: kiểm vòng lặp 12 theme trong `resolve.test.ts` không cảnh báo, và chuỗi "sẽ có ở bản sau" biến mất đúng chỗ).
5. Xung đột còn lại hay gặp và cách xử lý: `package-lock.json` - chỉ v4a-1 sửa, đợt khác không chạy `npm install <pkg>`; `.wp-build/`, `dist/` - đã gitignore, build lại; báo cáo/ảnh chụp - file riêng theo đợt; nếu 2 đợt lỡ sửa cùng hunk ngoài vùng -> chủ sở hữu theo bảng 3.2 thắng, đợt kia làm lại phần của mình trên bản đã merge.
6. Designer review 2b trước khi 2c merge sẽ thấy sprite fallback (`gold-dust`/`petals`/loại của theme). Nếu 2c đã qua cổng, orchestrator dựng nhánh tạm `int/2b-2c` (merge cả hai) cho designer chụp; không merge nhánh tạm.

---

### 4. Kiểm thử

#### 4.1 Unit test (vitest, môi trường `node`)
| Đợt | File | Nội dung |
|---|---|---|
| 0 | `tests/open-styles.test.ts` | `effectiveOpen()` đủ bảng 1.5 (17 id × 5 trạng thái × lowEnd); `OPEN_META` đủ 17 id, `ms ≤ 2400` |
| 0 | `tests/resolve.test.ts` (sửa) | fallback tính động theo capability |
| 0 | `tests/burst-registry.test.ts` | id chưa có -> `petals`; `scheduleOnOpenBurst` bỏ burst khi trễ > 1000 ms (fake timers) |
| 2b | `tests/open-styles.test.ts` (thêm) | với mỗi kiểu: `timeline(level)` có `totalMs ≤ 2400` ở `light/full/full+`, `light < full`, `full+ − full ≤ 50 ms`; chỉ thuộc tính `transform/opacity/clipPath/zIndex/translate/scale/rotate`; `clip-path` trên lớp chứa chữ có biên ≥ 0.3em |
| 2b | `tests/open-kit.test.ts` | `runSteps.fastForward()` với animation giả: phần còn lại ≤ 300 ms ở mọi mốc; `safeInset`; `coverPhoto` chuỗi ưu tiên; `light-gather` lấy mẫu điểm (hàm thuần trên mảng alpha giả: bước 2/3 px, đủ 400/700, chính sách FPS 45/30) |
| 2b | `tests/envelope-e12.test.ts` | `rich()` 6 skin: số hạt (classic/kraft/minimal 12, song-hy 24, lace 6/12, velvet 16), mốc `at` nằm trong pha unlock, không đổi `totalMs` |
| 2c | `tests/particle-kinds.test.ts` | mỗi loại (21): `id` khớp tên file, `motion` hợp lệ, `density` đúng bảng design 5.7, cỡ trong giới hạn (gold-dust ≤ 4 px, snow 2–6, lotus 24–36), `draw()` không ném lỗi với context giả ghi lệnh (+ stub `Path2D`), 5 loại cũ giữ tham số; `targetParticleCount` mỗi loại ở 3 cấp ≤ 40, máy yếu ≤ 12 |
| 2c | `tests/bursts.test.ts` | số hạt theo `burstCount` (gồm cắt ở 120 khi cộng dồn); `confetti` gốc ở 2 góc dưới (x trong 15% mép, `vy < 0`); `red-paper` gốc phía trên; `heart-burst` gốc trong rect `from`; `life ≤` thời lượng; màu theo `mode` |

#### 4.2 E2E chọn lọc (file riêng theo đợt, không sửa `guest.spec.ts`)
Phần lớn chạy bằng `bootPreview()` (preview stash, mục 0.10) trên bản build để thử mọi giá trị mà không build lại; preview coi máy khoẻ nên không cần giả lập phần cứng. Test nào chạy trên bản build thường (`/?to=…`) phải gọi `strongDevice(page)` trước `goto` (máy cloud 4 nhân bị tự hạ cấp -> sai thời lượng mức Vừa).

**2b - `tests/e2e/v4a-2b-open.spec.ts`** (vòng lặp 13 kiểu, viewport 360×740):
1. Vừa: `coverTiming` ≤ 2400 ms và trong ±15% thời lượng design; `__wpCover.level === 'full'`; không lỗi console.
2. Tua nhanh: chạm mở, tới ~30% thời lượng chạm lần 2 -> `remainingMs() ≤ 300`; cover gỡ trong ≤ 450 ms đồng hồ thật.
3. Nhẹ (`intensity: low`): `level === 'light'`, tổng < Vừa; kiểu có hạt: `fxSnap().bursts.length === 0`.
4. Nhiều (`intensity: high`): `level === 'full+'`, tổng ≤ 2400; kiểu có hạt: `bursts.length` ≥ số spec (hoặc ≥ 12 khi đang fallback).
5. Tắt và `simulate.reducedMotion`: animation trong `.cover` ≤ 200 ms, không có `.fx-canvas`, lớp hình của kiểu vẫn có (`prepare` đã chạy).
6. `simulate.lowEnd`: `light-gather` -> `__wpCover.effective === 'fade-zoom'`; kiểu chi phí Vừa ở `high` -> `level === 'light'`.
7. Lấy mẫu mỗi 100 ms: hộp `.cv-names`, `.cv-guest` (và lời mời trong `book`) khi `opacity > .1` nằm trọn trong viewport; thuộc tính được animate chỉ thuộc tập cho phép.
8. Module lỗi tải (`page.route` chặn chunk) -> mở bằng `fade-zoom`, không lỗi console ngoài `warn`.

**2b - `tests/e2e/v4a-2b-e12.spec.ts`**: 6 mẫu × `high`: sau chạm 600 ms `bursts.length` ≥ mức 1.8; tổng thời lượng lệch ≤ 50 ms so với `medium`; `lace` ở `medium` có 6 hạt. Test phong bì 360×740 cũ trong `guest.spec.ts` vẫn xanh (không sửa).

**2b - `tests/e2e/v4a-2b-admin.spec.ts`**: 17 thẻ + "Theo theme"; badge "Nặng ⚠" ở `light-gather`, chọn -> có dòng cảnh báo; chọn `wax-seal` -> khung preview có `.cover[data-open="wax-seal"]`. Sửa `admin-v22.spec.ts` dòng 62–68 theo nhãn mới ("Theo theme (Cuộn thư)").

**2c - `tests/e2e/v4a-2c-particles.spec.ts`**: 16 loại × `medium`, `types: [id]`: sau mở 3 s `bg.length > 0`, mọi `a ≤ 1`; `snow` (hệ số 1.5) và `bubble` (`float-up`): 0 hạt vẽ trong vùng loại trừ form RSVP/lời chúc (dùng lại cách đọc `__wpFx.snapshot().zones` như test cũ); Tắt/reduced: không có canvas.

**2c - `tests/e2e/v4a-2c-burst.spec.ts`**: `confetti`/`gold`/`red-paper` qua `fx:replay` target `burst` (preview stash `fx: { target: 'burst' }`): đỉnh `bursts.length` ≈ `burstCount` ±10% (≤ 120), về 0 trước thời lượng + 300 ms; `low` -> 0; request chunk burst xuất hiện **sau** khi `.cover` bị gỡ (ghi thứ tự `page.on('request')`); `heart-burst` qua `__wpBurst('heart-burst', …)` ra 8 (Vừa)/12 (Nhiều) hạt.

**2c - `tests/e2e/v4a-2c-admin.spec.ts`**: 8 chip + "Xem thêm" mở ra đủ 21; chọn loại thứ 3 bỏ loại cũ nhất; "Sau khi mở" có 5 lựa chọn + "Theo theme (…)".

#### 4.3 Chạy trên cloud
- Chromium: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Cổng theo `status.md` mục 8: **FE-2 (2b) `PW_PREVIEW_PORT=4373 PW_DEV_PORT=5375`**, **FE-3 (2c) `4473 / 5475`**, FE-1 `4273 / 5275`. Không dùng 5173.
- Mỗi worktree `npm ci` riêng. Trong lúc làm chỉ chạy unit + e2e chọn lọc; **toàn bộ** e2e chạy **1 lần** ở cuối (quy ước CLAUDE.md).
```bash
# FE-2 (2b) - trong worktree wt/v4a-2b
npm test -- tests/open-styles.test.ts tests/open-kit.test.ts
npm run build
PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium PW_PREVIEW_PORT=4373 PW_DEV_PORT=5375 \
  npx playwright test tests/e2e/v4a-2b-open.spec.ts -g "wax-seal"
# ngân sách tổ hợp nặng (ghi đè dist -> build lại bản thường trước khi chạy e2e)
WP_CONFIG_PATH=tests/fixtures/config-heavy-2b.json npx vite build && npx size-limit
npm run build
# cuối đợt, 1 lần
PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium PW_PREVIEW_PORT=4373 PW_DEV_PORT=5375 npm run test:e2e
```
FE-3 (2c) tương tự với `4473/5475`, fixture `config-heavy-2c.json`.
- Fixture tổ hợp nặng: 2b = `dem-nhung` + `light-gather` + `high` + `reveal.style: cinematic` (đang fallback tới khi 2a) + hạt `gold-dust` + `firefly`; 2c = `tram-vang` + `high` + 2 loại lớn nhất (dự kiến `petal-watercolor` + `plumeria`) + burst `confetti`.
- Không đổi branch khi dev server đang chạy (status mục 6).

---

### 5. Tiêu chí hoàn thành đo được

**v4a-2b**
| # | Tiêu chí | Cách đo |
|---|---|---|
| 1 | 13 id có trong `caps/v4a-2b.ts`; `resolveTheme` với từng id không cảnh báo; 12 theme "Theo theme" không còn "sẽ có ở bản sau" cho kiểu mở | unit |
| 2 | Mỗi module kiểu mở ≤ 4 KB gz; `open-kit` ≤ 3 KB; CSS mỗi kiểu ≤ 1.5 KB; skin phong bì ≤ 1.5 KB | `size-limit` trong `npm run build` |
| 3 | Tổ hợp nặng (`dem-nhung` + `light-gather` + `high` + `cinematic`): JS ban đầu ≤ 60 KB, CSS ban đầu ≤ 25 KB; cấu hình mặc định (`tram-vang` + `envelope`) JS ban đầu tăng ≤ 0.5 KB so với v2.3 | `size-limit` với fixture + bản thường |
| 4 | Cả 13 kiểu ở Vừa: ≤ 2400 ms, trong ±15% thời lượng design 3.4b | e2e 4.2 #1 |
| 5 | Chạm lần 2: phần còn lại ≤ 300 ms | unit + e2e #2 |
| 6 | Nhẹ / Nhiều đúng bảng 1.1 (Nhẹ ngắn hơn, không hạt; Nhiều có phần thêm, vẫn ≤ 2400 ms) | e2e #3, #4 |
| 7 | Tắt + reduced: fade ≤ 200 ms, không canvas, hình tĩnh đúng kiểu | e2e #5 |
| 8 | Máy yếu (mô phỏng): `light-gather` -> `fade-zoom`; kiểu chi phí Vừa -> bản Nhẹ | e2e #6 |
| 9 | Tên cặp đôi/khách luôn trong viewport khi hiện; chỉ animate thuộc tính cho phép; module lỗi tải vẫn mở được | e2e #7, #8 |
| 10 | E12: 6 mẫu ở Nhiều có hạt đúng số (hoặc fallback khi chưa có 2c), thời lượng lệch ≤ 50 ms; `lace` Vừa 6 cánh; test phong bì cũ xanh | e2e E12 |
| 11 | Admin: 17 thẻ + "Theo theme", badge/cảnh báo kiểu Cao, chọn = phát trong preview; chunk route Hiệu ứng ≤ 15 KB | e2e admin + `size-limit` |
| 12 | `npm test` xanh; toàn bộ `npm run test:e2e` xanh 1 lần; 0 lỗi console | lệnh |
| 13 | ui-ux-designer review: 0 điểm Cao/Vừa còn mở; ảnh "Nguyễn Thuỳ Linh" giữa animation không mất dấu | designer |
| 14 | **Kiểm tay**: `light-gather` ≥ 45 fps ở Vừa trên Android tầm trung; Safari iOS (3D backface, `clip-path` WAAPI: `scroll`, `moon-gate`, `ink-spread`, `polaroid`); Android tầm thấp; webview Zalo/Facebook/Messenger | người duyệt/thiết bị thật |

**v4a-2c**
| # | Tiêu chí | Cách đo |
|---|---|---|
| 1 | 16 loại trong `caps/v4a-2c.ts` (`particle`) + `confetti`, `gold`, `red-paper` (`burstOnOpen`); `heart-burst` có module | unit |
| 2 | Mỗi loại hạt ≤ 1.5 KB gz; mỗi burst ≤ 3 KB gz; chunk burst **không** nằm trong JS ban đầu (`budget.json`); tổ hợp nặng 2c: JS ban đầu ≤ 60 KB | `size-limit` |
| 3 | Tham số mỗi loại khớp design 5.7 (motion, hệ số); 5 loại cũ không đổi | unit |
| 4 | Mỗi loại hiện hạt ở Vừa trong 3 s; số hạt ≤ 40 (máy yếu ≤ 12); 0 hạt trong vùng form; không canvas khi Tắt/reduced | unit + e2e |
| 5 | Burst: số hạt đúng `BURST_COUNTS` ±10%, cộng dồn ≤ 120, tắt hết trong thời lượng + 300 ms; Nhẹ = 0; tải sau khi mở thiệp | e2e |
| 6 | Màu: `theme` (màu tự nhiên cho loại có `natural`), `multi`, hex; burst theo `mode` theme | unit |
| 7 | Admin: đủ 21 chip (8 + "Xem thêm"), tối đa 2; "Sau khi mở" 5 + "Theo theme" | e2e |
| 8 | `npm test` xanh; toàn bộ e2e xanh 1 lần; designer review 0 điểm Cao/Vừa | lệnh + designer |
| 9 | **Kiểm tay**: ≤ 2 ms/frame với 40 hạt trên Android tầm thấp (DevTools Performance); loại trắng (`snow`, `plumeria`, `bubble`) thấy rõ trên theme sáng | thiết bị thật |

### Data/ETL
Không liên quan.

---

## 👥 Phân công
- **Backend (backend-developer)**: không cần (không có backend).
- **Frontend (frontend-developer)**:
  - FE-2: **Bước 0** (mục 0, ≈ 0.5 ngày, merge trước) rồi **v4a-2b** (mục 1) trên `wt/v4a-2b`, cổng e2e 4373/5375, report `frontend-report-v4a-2b.md` (ghi tiến độ từng kiểu mở/từng mẫu E12).
  - FE-3: **v4a-2c** (mục 2) trên `wt/v4a-2c` tách sau khi Bước 0 merge, cổng 4473/5475, report `frontend-report-v4a-2c.md` (ghi tiến độ từng loại hạt/burst).
  - Tối đa 2 FE cùng lúc (decisions 2026-10-09): nếu FE-1 (v4a-1) đang chạy thì 2c chờ slot.
- **Cần ui-ux-designer: Có** - designer B: asset + spec `design-v4a-2bc.md` cho mọi chỗ **[GĐ-B]** (lớp hình 13 kiểu mở, vị trí tên trên "vật đóng", 2 WebP `flower-gate`, dấu sáp nứt, hộp quà, vệt mực, mini-anim/poster admin, sprite 16 hạt + màu tự nhiên, Nhẹ/Nhiều của `curtain`, E12 kraft/minimal); sau đó review visual từng đợt (ảnh bằng chứng theo quy ước CLAUDE.md).
- **Có thể làm song song BE và FE: Có** (không có BE). **2b và 2c song song được** nhờ contract ở bảng API + Bước 0; 2b dùng fallback khi 2c chưa merge.

---

## ⚠️ Lưu ý kỹ thuật
- **CSP**: không `innerHTML`, không thuộc tính `style`; mọi giá trị động qua `css()`/CSSOM; ảnh asset cùng origin (`img-src 'self'`); CSS kiểu mở là file (`<link>`), không `<style>` mới (không phải thêm hash).
- **Hiệu năng**: chỉ `transform`/`opacity` (+ ngoại lệ đã ghi); `will-change` ≤ 6; `light-gather` dừng hạt trôi sau 5 s và có đo FPS; canvas DPR ≤ 2; burst ≤ 120; không thư viện animation (không thêm dependency).
- **A11y**: lớp trang trí `aria-hidden`; tên thật luôn trong DOM; hoạt ảnh trước chạm (`card-3d` lắc, `light-gather`) dừng ≤ 5 s (WCAG 2.2.2); pháo hoa/flash không áp dụng ở đây (burst không nháy cả màn).
- **Thay đổi hành vi khi deploy (không phải breaking schema)**: config đang để "Theo theme" sẽ đổi kiểu mở/burst/hạt khi capability được bật (câu hỏi #6). Nên ghi vào ghi chú phát hành.
- **Lệch so với solution.md**: `light-gather` dùng canvas riêng trong cover thay vì canvas ParticleField (khoảng trống #3) - cần người duyệt xác nhận; không sửa `solution.md` trong việc này.
- **Safari 14**: kiểm tiền tố `-webkit-backface-visibility`; `requestIdleCallback` không có -> fallback `setTimeout`.
- **Test hiệu năng trên máy cloud 4 nhân dễ nhiễu**: mọi số đo thời lượng dùng thời gian animation (WAAPI `endTime`/`remainingMs()`), không dùng đồng hồ treo tường, trừ ngưỡng gỡ cover có dung sai.

---

## ❓ Phần nào chưa rõ ràng, cần confirm
1. **Bước 0 do FE-2 làm trước khi tách 2b/2c** (≈ 0.5 ngày, không đổi hành vi). - Giả định: đồng ý; FE-1 (nếu đã tách) merge Bước 0 ngay.
2. **Vị trí tên cặp đôi/khách với kiểu "vật đóng"** (rèm, cửa, sách, hộp, polaroid úp…). - Giả định: tên cặp đôi lên `.cv-head` như phong bì; "Kính gửi + tên khách" in trên mặt vật đóng; designer B chốt trong `design-v4a-2bc.md`.
3. **`light-gather` dùng canvas riêng trong cover** (lệch solution 8.1 vì trần burst 120). - Giả định: đồng ý.
4. **Chính sách FPS `light-gather` (Còn mở #4)**: đo 1 s trước chạm; < 45 fps -> 250 hạt; vẫn < 45 hoặc < 30 -> `fade-zoom` + 12 hạt lấp lánh; hạt trôi dừng sau 5 s. - Giả định: đồng ý; ngưỡng ≥ 45 fps ở Vừa kiểm tay trên Android tầm trung.
5. **Kiểu chi phí Vừa trên máy yếu luôn chạy bản Nhẹ**, kể cả khi admin chọn Nhiều (design 3.4b). - Giả định: đồng ý.
6. **Config "Theo theme" đổi hình sau deploy** (vd Son Đỏ -> Cuộn thư + pháo giấy đỏ; Đêm Nhung -> Hạt sáng tụ lại + kim tuyến vàng; Hồng Phấn -> Cổng hoa khi v4a-1 bật theme). - Giả định: chấp nhận (đúng thiết kế), ghi vào ghi chú phát hành; không thêm migration ghim giá trị cũ.
7. **Spec thiếu**: `curtain` chưa có cột Nhẹ/Nhiều; `gift-box` số confetti ở Vừa; E12 cho `kraft`/`minimal`. - Giả định: `curtain` Nhẹ 700 ms, Nhiều + dải sáng khe + 12 bụi vàng; `gift-box` Vừa 24 mảnh; `kraft`/`minimal` Nhiều = 12 bụi vàng mặc định ở nút nơ/sticker. Designer B được ghi đè.
8. **`heart-burst` và confetti RSVP**: 2c chỉ làm module + hook debug; móc vào nút gửi lời chúc / "Tôi sẽ đến" để v3. - Giả định: đồng ý.
9. **Thời điểm burst sau khi mở**: import trong `requestIdleCallback` (timeout 300 ms) sau khi mở, bỏ nếu module về trễ > 1 s. - Giả định: đồng ý. Phương án khác: tải sẵn lúc cover đứng yên (burst bắn đúng lúc mở, đổi lại tải sớm ~2 KB).
10. **Kỹ thuật `ink-spread`**: nâng `#main` lên trên cover + `clip-path: circle()` nở từ điểm chạm (A); lỗi Safari thì lớp mực phủ rồi tan (B). - Giả định: FE thử A trước, ghi kết quả.
11. **`flower-gate` dùng 2 ảnh WebP màu cố định** (theo design 3.4b) hay SVG nhuộm theo theme. - Giả định: theo designer B; nếu WebP thì ≤ 80 KB/ảnh, chỉ tải khi đang dùng, preload qua plugin.
12. **Nguồn ảnh cho `moon-gate`/`polaroid`**: ảnh nền cover (nếu bật) -> ảnh hero -> nền accent + monogram. - Giả định: đồng ý (không thêm field schema).
13. **`STAGE` trong `capabilities.ts`** do orchestrator đặt lúc merge (vd `'v4a-2'`), các đợt không sửa. - Giả định: đồng ý.
14. **Màu tự nhiên của 16 loại hạt và viền cho loại màu trắng trên theme sáng**. - Giả định: dùng bảng 2.1 đến khi designer B chốt.

---

## ✅ Checklist trước khi implement
- [ ] Người duyệt confirm câu hỏi #1–#14 (ít nhất #1, #2, #3, #6)
- [ ] Review: không đổi schema (2b, 2c, E12); chỉ thêm capability
- [ ] Xác nhận contract nội bộ (bảng API): `OpenModule` v2, `OpenRun`, `BurstModule`/`playBurst`, `setOverCover`, `ParticleKind` mở rộng
- [ ] Xác nhận bản đồ sở hữu file (mục 3.2) và thứ tự merge (mục 3.4)
- [ ] Bước 0 merge xong trước khi tách `wt/v4a-2b`, `wt/v4a-2c`
- [ ] Có `design-v4a-2bc.md` + `assets/v4a-2/` (hoặc chấp nhận giả định [GĐ-B] để FE bắt đầu phần không phụ thuộc asset: khung module, timeline, test)
- [ ] Mỗi FE: worktree riêng, `npm ci`, đúng cặp cổng e2e, report ghi tiến độ liên tục
