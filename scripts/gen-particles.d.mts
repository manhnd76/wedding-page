/** Kiểu cho `gen-particles.mjs` (unit test TS import script). */
export declare const ROOT: string;
export declare const JSON_PATH: string;
export declare const OUT_DIR: string;
export declare const TONES: Record<string, { tones: string[]; tonesDark?: string[] }>;
export declare function lit(v: unknown): string;
export declare function applyOverrides<T extends { id: string }>(items: T[], overrides?: unknown): T[];
export declare function renderItem(it: unknown, overrides?: unknown): string;
export declare function renderAll(jsonPath?: string): Record<string, string>;
