import { fetchSpreadsheetMeta } from '../services/googleSheets/transport';

export interface BulkRouteItem {
  id: string;
  sheetUrl: string;
  spreadsheetTitle?: string;
  routeCode?: string;
  routeName?: string;
  month: number;
  year: number;
  status: 'pending' | 'inspecting' | 'ready' | 'duplicate' | 'error';
  errorMessage?: string;
  selected: boolean;
}

const MONTH_MAP: Record<string, number> = {
  JANUARI: 1,
  JAN: 1,
  FEBRUARI: 2,
  FEB: 2,
  MARET: 3,
  MAR: 3,
  APRIL: 4,
  APR: 4,
  MEI: 5,
  MAY: 5,
  JUNI: 6,
  JUN: 6,
  JULI: 7,
  JUL: 7,
  AGUSTUS: 8,
  AGU: 8,
  AGS: 8,
  SEPTEMBER: 9,
  SEP: 9,
  OKTOBER: 10,
  OKT: 10,
  NOVEMBER: 11,
  NOV: 11,
  DESEMBER: 12,
  DES: 12,
};

/**
 * Mengekstrak kode rute, bulan, dan tahun dari judul spreadsheet.
 * Contoh judul: "JAK.77_OKTOBER_2026", "JAK.15_OKTOBER._2026", "JAK.115".
 */
export function extractRoutePeriodFromTitle(
  title: string,
  fallbackMonth: number,
  fallbackYear: number
): { routeCode?: string; month: number; year: number } {
  if (!title) return { month: fallbackMonth, year: fallbackYear };

  // Pola lengkap: (JAK.77) _ (OKTOBER) ._ (2026)
  const pattern = /(JAK\.\d+[A-Z]?)[_-\s]+([A-Z]+)[._-\s]+(\d{4})/i;
  const match = title.match(pattern);

  if (match) {
    const routeCode = match[1].toUpperCase();
    const rawMonth = match[2].toUpperCase().replace(/[^A-Z]/g, '');
    const detectedMonth = MONTH_MAP[rawMonth] || fallbackMonth;
    const detectedYear = parseInt(match[3], 10) || fallbackYear;

    return { routeCode, month: detectedMonth, year: detectedYear };
  }

  // Coba cari kode JAK saja jika format bulan/tahun tidak baku
  const routeOnlyMatch = title.match(/(JAK\.\d+[A-Z]?)/i);
  return {
    routeCode: routeOnlyMatch ? routeOnlyMatch[1].toUpperCase() : undefined,
    month: fallbackMonth,
    year: fallbackYear,
  };
}

/**
 * Menjalankan inspeksi metadata spreadsheet secara concurrent (maksimal 4 request paralel).
 */
export async function inspectBulkRoutesWithConcurrency(
  items: Array<{ id: string; cleanUrl: string }>,
  fallbackMonth: number,
  fallbackYear: number,
  existingSheets: Array<{ routeCode: string; sheet: { month: number; year: number } }>,
  onItemUpdate: (updatedItem: BulkRouteItem, index: number) => void
): Promise<BulkRouteItem[]> {
  const initialItems: BulkRouteItem[] = items.map((it) => ({
    id: it.id,
    sheetUrl: it.cleanUrl,
    month: fallbackMonth,
    year: fallbackYear,
    status: 'pending',
    selected: false,
  }));

  const CONCURRENCY = 4;
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      const item = items[idx];

      const inspectingItem: BulkRouteItem = {
        ...initialItems[idx],
        status: 'inspecting',
      };
      initialItems[idx] = inspectingItem;
      onItemUpdate(inspectingItem, idx);

      try {
        const meta = await fetchSpreadsheetMeta(item.id, 'properties.title');
        const title: string =
          meta.result?.properties?.title || meta.properties?.title || '';

        const { routeCode, month, year } = extractRoutePeriodFromTitle(
          title,
          fallbackMonth,
          fallbackYear
        );

        if (!routeCode) {
          const invalidItem: BulkRouteItem = {
            ...inspectingItem,
            spreadsheetTitle: title || 'Tanpa Judul',
            status: 'error',
            errorMessage:
              'Kode rute (misal: JAK.77) tidak ditemukan pada judul spreadsheet.',
            selected: false,
          };
          initialItems[idx] = invalidItem;
          onItemUpdate(invalidItem, idx);
          continue;
        }

        // Cek duplikasi terhadap database yang sudah dimuat
        const isDuplicate = existingSheets.some(
          (ex) =>
            ex.routeCode === routeCode &&
            ex.sheet.month === month &&
            ex.sheet.year === year
        );

        const finalizedItem: BulkRouteItem = {
          ...inspectingItem,
          spreadsheetTitle: title,
          routeCode,
          routeName: routeCode,
          month,
          year,
          status: isDuplicate ? 'duplicate' : 'ready',
          errorMessage: isDuplicate
            ? `Rute ${routeCode} periode ${month}/${year} sudah tersimpan di database.`
            : undefined,
          selected: !isDuplicate,
        };

        initialItems[idx] = finalizedItem;
        onItemUpdate(finalizedItem, idx);
      } catch (err: any) {
        const errItem: BulkRouteItem = {
          ...inspectingItem,
          status: 'error',
          errorMessage:
            err?.message ||
            'Akses ditolak (pastikan telah dibagikan ke Service Account).',
          selected: false,
        };
        initialItems[idx] = errItem;
        onItemUpdate(errItem, idx);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, items.length) },
    () => worker()
  );
  await Promise.all(workers);

  return initialItems;
}
