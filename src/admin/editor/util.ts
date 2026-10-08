import { saveFile } from '../storage/local-adapters';

const TZ = 'Asia/Ho_Chi_Minh';

/** "14:32, 07/10/2026" giờ Việt Nam. */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const t = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(d);
  const day = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(d);
  return `${t}, ${day}`;
}

export function downloadJson(v: unknown, name: string): void {
  saveFile(new Blob([`${JSON.stringify(v, null, 2)}\n`], { type: 'application/json' }), name);
}

export const today = () => new Date().toISOString().slice(0, 10);
