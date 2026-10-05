import { parseIndonesianNumber } from '../../utils/numberUtils';
import { fetchSheetValues } from './transport';

export interface GlobalRouteDailyMetrics {
  routeCode: string;
  renops: number;
  realops: number;
  kmTempuh: number;
  toaShift1: number;
  manualShift1: number;
  totalShift1: number;
  toaShift2: number;
  manualShift2: number;
  totalShift2: number;
  totalPassengers: number;
  kmPerBus: number;
  targetPassengers: number;
  totalRitase: number;
}

/**
 * Menormalisasi berbagai variasi penulisan kode rute JAK menjadi format standar JAK.XX
 * Contoh: "JAK 01" -> "JAK.01", "JAK 110A" -> "JAK.110A", "JAK-120" -> "JAK.120"
 */
export function normalizeRouteCode(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(/^JAK[\s.\-_]*(\d+)\s*([A-Z]*)$/i);
  if (match) {
    const numPart = match[1].length === 1 ? `0${match[1]}` : match[1];
    const letterPart = match[2] || '';
    return `JAK.${numPart}${letterPart}`;
  }
  return trimmed;
}

/**
 * Membaca blok tanggal tertentu dari raw array data spreadsheet global operasi wilayah 18 rute.
 * Struktur spreadsheet template:
 * - Setiap tanggal memiliki blok 27 baris.
 * - Header tanggal dimulai pada indeks baris: 1 + (targetDay - 1) * 27
 * - Baris data rute dimulai pada headerRowIndex + 4
 */
export function parseGlobalSheetDateBlock(
  rows: any[][],
  targetDay: number
): Map<string, GlobalRouteDailyMetrics> {
  const resultMap = new Map<string, GlobalRouteDailyMetrics>();
  if (!rows || rows.length === 0 || targetDay < 1) {
    return resultMap;
  }

  // 1. Tentukan indeks baris awal blok tanggal target
  let headerRowIdx = 1 + (targetDay - 1) * 27;

  // Coba pencarian dinamis baris tanggal jika indeks statis tidak sesuai
  if (headerRowIdx >= rows.length || headerRowIdx < 0) {
    headerRowIdx = -1;
  }

  // Verifikasi apakah headerRowIdx memuat baris header tabel (NO / RUTE)
  let dataStartIdx = headerRowIdx >= 0 ? headerRowIdx + 4 : -1;

  // Jika dataStartIdx di luar batas atau tidak memuat rute, lakukan scan dinamis
  const isLikelyValid =
    dataStartIdx >= 0 &&
    dataStartIdx < rows.length &&
    rows.slice(dataStartIdx, dataStartIdx + 5).some((r) =>
      r?.some((c: any) => typeof c === 'string' && /JAK[\s.\-_]*\d+/i.test(c))
    );

  if (!isLikelyValid) {
    // Scan dinamis mencari header tanggal target
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const firstCell = String(row[0] || '').trim();
      const secondCell = String(row[1] || '').trim();
      // Periksa apakah sel memuat tanggal atau nomor hari target
      const matchDay =
        new RegExp(`(^|[^0-9])${targetDay}([^0-9]|$)`).test(firstCell) ||
        new RegExp(`(^|[^0-9])${targetDay}([^0-9]|$)`).test(secondCell);
      const isHeaderTable = row.some(
        (c: any) => typeof c === 'string' && (c.includes('RUTE') || c.includes('RENOPS'))
      );
      if (matchDay && isHeaderTable) {
        headerRowIdx = r;
        dataStartIdx = r + 4;
        break;
      }
    }
  }

  if (dataStartIdx < 0 || dataStartIdx >= rows.length) {
    return resultMap;
  }

  // Blok 18 rute (dengan toleransi pembacaan hingga 24 baris)
  for (let i = 0; i < 24; i++) {
    const r = dataStartIdx + i;
    if (r >= rows.length) break;

    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Robust relative finder: temukan indeks kolom yang berisi kode rute JAK
    let routeColIdx = -1;
    for (let c = 0; c < Math.min(row.length, 6); c++) {
      const cellVal = row[c];
      if (cellVal !== null && cellVal !== undefined) {
        const strVal = String(cellVal).trim();
        if (/^JAK[\s.\-_]*\d+/i.test(strVal) || strVal.toUpperCase().includes('JAK')) {
          routeColIdx = c;
          break;
        }
      }
    }

    if (routeColIdx === -1) continue;

    const rawRoute = String(row[routeColIdx]).trim();
    const routeCode = normalizeRouteCode(rawRoute);
    if (!routeCode) continue;

    // Baca metrik secara relatif terhadap letak kolom kode rute
    const renops = parseIndonesianNumber(row[routeColIdx + 1]);
    const realops = parseIndonesianNumber(row[routeColIdx + 2]);
    const kmTempuh = parseIndonesianNumber(row[routeColIdx + 3]);
    const toaShift1 = parseIndonesianNumber(row[routeColIdx + 4]);
    const manualShift1 = parseIndonesianNumber(row[routeColIdx + 5]);
    const totalShift1 = parseIndonesianNumber(row[routeColIdx + 6], toaShift1 + manualShift1);
    const toaShift2 = parseIndonesianNumber(row[routeColIdx + 7]);
    const manualShift2 = parseIndonesianNumber(row[routeColIdx + 8]);
    const totalShift2 = parseIndonesianNumber(row[routeColIdx + 9], toaShift2 + manualShift2);
    const totalPassengers = parseIndonesianNumber(row[routeColIdx + 10], totalShift1 + totalShift2);
    const kmPerBus = parseIndonesianNumber(row[routeColIdx + 11]);
    const targetPassengers = parseIndonesianNumber(row[routeColIdx + 12]);
    const totalRitase = parseIndonesianNumber(row[routeColIdx + 17]);

    resultMap.set(routeCode, {
      routeCode,
      renops,
      realops,
      kmTempuh,
      toaShift1,
      manualShift1,
      totalShift1,
      toaShift2,
      manualShift2,
      totalShift2,
      totalPassengers,
      kmPerBus,
      targetPassengers,
      totalRitase,
    });
  }

  return resultMap;
}

/**
 * Mengambil data capaian harian 18 rute langsung dari Google Spreadsheet Global Wilayah
 */
export async function fetchGlobalReportDailyMetrics(
  spreadsheetId: string,
  sheetName: string,
  targetDay: number
): Promise<Map<string, GlobalRouteDailyMetrics>> {
  const quotedSheetName = sheetName.includes(' ') && !sheetName.startsWith("'")
    ? `'${sheetName}'`
    : sheetName;
  const range = `${quotedSheetName}!A1:AT1000`;
  const response = await fetchSheetValues(spreadsheetId, range, 'FORMATTED_VALUE');
  const rows = response?.result?.values || [];
  return parseGlobalSheetDateBlock(rows, targetDay);
}
