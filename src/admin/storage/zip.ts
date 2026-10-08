/**
 * Ghi file .zip tối giản (phương thức STORE, không nén - ảnh/nhạc đã nén sẵn), UTF-8 tên file.
 * Đủ cho "Tải gói xuất bản (.zip)" của chế độ không kết nối; không thêm thư viện.
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry { path: string; data: Uint8Array }

function dosTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export function zip(entries: ZipEntry[], now = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const { time, date } = dosTime(now);
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.path);
    const crc = crc32(e.data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // UTF-8
    lh.setUint16(8, 0, true); // STORE
    lh.setUint16(10, time, true);
    lh.setUint16(12, date, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, e.data.length, true);
    lh.setUint32(22, e.data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    const local = concat([new Uint8Array(lh.buffer), name, e.data]);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true);
    ch.setUint16(14, date, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, e.data.length, true);
    ch.setUint32(24, e.data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    centrals.push(concat([new Uint8Array(ch.buffer), name]));
    locals.push(local);
    offset += local.length;
  }
  const cd = concat(centrals);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cd.length, true);
  end.setUint32(16, offset, true);
  return concat([...locals, cd, new Uint8Array(end.buffer)]);
}

/** Đọc lại zip STORE (dùng cho test và "Nhập gói"). */
export function unzip(b: Uint8Array): ZipEntry[] {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const dec = new TextDecoder();
  const out: ZipEntry[] = [];
  let p = 0;
  while (p + 30 <= b.length && dv.getUint32(p, true) === 0x04034b50) {
    const size = dv.getUint32(p + 18, true);
    const nlen = dv.getUint16(p + 26, true);
    const xlen = dv.getUint16(p + 28, true);
    const path = dec.decode(b.subarray(p + 30, p + 30 + nlen));
    const start = p + 30 + nlen + xlen;
    out.push({ path, data: b.slice(start, start + size) });
    p = start + size;
  }
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((s, x) => s + x.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const x of parts) { out.set(x, o); o += x.length; }
  return out;
}
