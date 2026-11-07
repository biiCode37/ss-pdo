// Modul murni: aturan validasi konfirmasi "Siap Dikirim" (dipakai route-confirmation, diuji Vitest).

export const REASON_MIN_LENGTH = 5;
export const REASON_MAX_LENGTH = 300;
export const MAX_CONFIRM_BACK_DAYS = 7;

export function wibTodayString(now: Date = new Date()): string {
  // en-CA menghasilkan format YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function shiftDateString(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function validateConfirmationDate(
  date: string,
  todayWib: string,
  maxBackDays: number = MAX_CONFIRM_BACK_DAYS,
): 'ok' | 'invalid' | 'future' | 'too_old' {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(`${date}T00:00:00Z`))) return 'invalid';
  if (date > todayWib) return 'future';
  if (date < shiftDateString(todayWib, -maxBackDays)) return 'too_old';
  return 'ok';
}

// Karakter kontrol (U+0000–U+001F, U+007F) diganti spasi agar alasan aman ditampilkan & disimpan
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export function sanitizeReason(raw: unknown): string {
  return String(raw ?? '')
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, REASON_MAX_LENGTH);
}
