// Modul murni: menentukan tanggal laporan yang disinkronkan sheet-sync-webhook.
// Sebelumnya webhook mengabaikan nama tab dari Apps Script dan selalu memakai "hari ini" (WIB),
// sehingga edit di tab tanggal lama (mis. membetulkan data kemarin lewat tengah malam) tercatat ke
// tanggal yang salah (refact_226).

export interface SyncDateInput {
  /** Tanggal eksplisit YYYY-MM-DD (dari aplikasi / tombol Cek ulang) — selalu diutamakan */
  date?: unknown;
  /** Nama tab sheet yang diedit (Apps Script onEdit), mis. "7" */
  tabName?: unknown;
  /** Tahun & bulan file sheet (dari route_sheets berdasarkan spreadsheetId), bila diketahui */
  sheetYear?: number | null;
  sheetMonth?: number | null;
  /** Tanggal hari ini WIB (YYYY-MM-DD) sebagai fallback */
  todayWib: string;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function resolveSyncTargetDate(input: SyncDateInput): string {
  const explicit = String(input.date ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;

  const tab = String(input.tabName ?? '').trim();
  if (!/^\d{1,2}$/.test(tab)) return input.todayWib;
  const day = parseInt(tab, 10);

  const [todayYear, todayMonth] = input.todayWib.split('-').map(Number);
  const validSheet =
    Number.isInteger(input.sheetYear) && Number.isInteger(input.sheetMonth) &&
    (input.sheetMonth as number) >= 1 && (input.sheetMonth as number) <= 12;
  const year = validSheet ? (input.sheetYear as number) : todayYear;
  const month = validSheet ? (input.sheetMonth as number) : todayMonth;

  if (day < 1 || day > daysInMonth(year, month)) return input.todayWib;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
