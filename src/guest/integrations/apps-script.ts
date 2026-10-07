/**
 * Client Google Apps Script (contract solution 4.4). Chunk lazy.
 * POST dùng Content-Type text/plain (tránh preflight CORS). Timeout 15s.
 */
export interface GbItem { name: string; message: string; createdAt: string }
export type AsResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const TIMEOUT = 15_000;

async function call<T>(url: string, init?: RequestInit): Promise<AsResult<T>> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal, redirect: 'follow' });
    if (!res.ok) return { ok: false, error: `HTTP_${res.status}` };
    const j = (await res.json()) as AsResult<T>;
    return j && typeof j === 'object' && 'ok' in j ? j : { ok: false, error: 'BAD_RESPONSE' };
  } catch (e) {
    return { ok: false, error: (e as Error).name === 'AbortError' ? 'TIMEOUT' : 'NETWORK' };
  } finally {
    clearTimeout(t);
  }
}

export function isAppsScriptUrl(u: string): boolean {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && (x.hostname === 'script.google.com' || x.hostname === 'script.googleusercontent.com');
  } catch { return false; }
}

export function fetchGuestbook(base: string, limit = 50, before?: string) {
  const u = new URL(base);
  u.searchParams.set('action', 'guestbook');
  u.searchParams.set('limit', String(limit));
  if (before) u.searchParams.set('before', before);
  return call<{ items: GbItem[]; hasMore: boolean }>(u.toString());
}

export function postGuestbook(base: string, body: { name: string; message: string; hp: string }) {
  return call(base, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'guestbook', ...body }) });
}

export interface RsvpBody {
  submissionId: string; name: string; guestLabel: string; attending: boolean; count: number; eventIds: string[]; note: string; hp: string;
}
export function postRsvp(base: string, body: RsvpBody) {
  return call(base, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'rsvp', ...body }) });
}
