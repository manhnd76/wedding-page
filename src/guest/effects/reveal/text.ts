/** Đo chữ cho chốt chặn nguyên tử (solution-v4a-2a.md 2.3, 2.5) - entry, thuần. */

const GRAPHEME = /\P{M}\p{M}*/gu;

/** Số grapheme (NFC, bỏ khoảng trắng) - dấu tiếng Việt không bị đếm riêng. */
export const graphemeCount = (s: string): number => (s.normalize('NFC').replace(/\s+/g, '').match(GRAPHEME) ?? []).length;
export const wordCount = (s: string): number => s.split(/\s+/).filter(Boolean).length;
export const hasLetters = (s: string): boolean => /\p{L}/u.test(s);
