/** Tiện ích byte dùng chung admin / plugin dev (WebCrypto có sẵn ở trình duyệt và Node >= 20). */

const subtle = () => globalThis.crypto.subtle;
const enc = new TextEncoder();

export const utf8 = (s: string): Uint8Array => enc.encode(s);

export function toHex(buf: ArrayBuffer | Uint8Array): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i]!.toString(16).padStart(2, '0');
  return s;
}

/** Ép về ArrayBuffer thuần (WebCrypto của TS 5.9 không nhận Uint8Array<SharedArrayBuffer>). */
export function ab(b: Uint8Array): ArrayBuffer {
  return b.buffer.byteLength === b.byteLength && b.byteOffset === 0 && b.buffer instanceof ArrayBuffer
    ? b.buffer
    : (b.slice().buffer as ArrayBuffer);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return toHex(await subtle().digest('SHA-256', ab(bytes)));
}

/** SHA-1 của git blob: sha1("blob <len>\0" + nội dung) - so khớp với sha trong tree GitHub. */
export async function gitBlobSha(bytes: Uint8Array): Promise<string> {
  const head = utf8(`blob ${bytes.length}\0`);
  const all = new Uint8Array(head.length + bytes.length);
  all.set(head, 0);
  all.set(bytes, head.length);
  return toHex(await subtle().digest('SHA-1', ab(all)));
}

export function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode(...bytes.subarray(i, i + CH));
  return btoa(s);
}

export function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64.replace(/\s+/g, ''));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Mime theo đuôi file. */
export function mimeOf(path: string): string {
  const ext = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase() ?? '';
  return ({
    webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', gif: 'image/gif',
    mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', json: 'application/json',
  } as Record<string, string>)[ext] ?? 'application/octet-stream';
}
