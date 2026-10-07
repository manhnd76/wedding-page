/** Tạo file .ics phía client (solution 8.5). */
export interface IcsEvent {
  uid: string;
  title: string;
  startAt: string; // ISO có offset
  endAt?: string | null;
  location?: string;
  description?: string;
  url?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toIcsUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Gập dòng > 75 octet theo RFC 5545 (gập theo ký tự, an toàn với UTF-8 đa byte). */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function eventEnd(startAt: string, endAt?: string | null): Date {
  if (endAt) { const e = new Date(endAt); if (!Number.isNaN(e.getTime())) return e; }
  return new Date(new Date(startAt).getTime() + 3 * 3600_000);
}

export function buildIcs(ev: IcsEvent, now = new Date()): string {
  const start = new Date(ev.startAt);
  if (Number.isNaN(start.getTime())) throw new Error('startAt không hợp lệ');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//wedding-page//vi', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(eventEnd(ev.startAt, ev.endAt))}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    ...(ev.location ? [`LOCATION:${escapeIcs(ev.location)}`] : []),
    ...(ev.description ? [`DESCRIPTION:${escapeIcs(ev.description)}`] : []),
    ...(ev.url ? [`URL:${ev.url}`] : []),
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${escapeIcs(ev.title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Link Google Calendar dự phòng. */
export function googleCalendarUrl(ev: IcsEvent): string {
  const start = new Date(ev.startAt);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${toIcsUtc(start)}/${toIcsUtc(eventEnd(ev.startAt, ev.endAt))}`,
    ...(ev.location ? { location: ev.location } : {}),
    ...(ev.description ? { details: ev.description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
