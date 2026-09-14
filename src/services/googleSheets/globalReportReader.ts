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

  const headerRowIdx = 1 + (targetDay - 1) * 27;
  if (headerRowIdx < 0 || headerRowIdx >= rows.length) {
    return resultMap;
  }

  const dataStartIdx = headerRowIdx + 4;
  // Blok 18 rute (dengan toleransi pembacaan hingga 22 baris)
  for (let i = 0; i < 22; i++) {
    const r = dataStartIdx + i;
    if (r >= rows.length) break;

    const row = rows[r];
    if (!row || !row[2]) continue;

    const rawRoute = String(row[2]).trim();
    if (!rawRoute || !rawRoute.toUpperCase().includes('JAK')) continue;

    const routeCode = normalizeRouteCode(rawRoute);
    const renops = parseIndonesianNumber(row[3]);
    const realops = parseIndonesianNumber(row[4]);
    const kmTempuh = parseIndonesianNumber(row[5]);
    const toaShift1 = parseIndonesianNumber(row[6]);
    const manualShift1 = parseIndonesianNumber(row[7]);
    const totalShift1 = parseIndonesianNumber(row[8], toaShift1 + manualShift1);
    const toaShift2 = parseIndonesianNumber(row[9]);
    const manualShift2 = parseIndonesianNumber(row[10]);
    const totalShift2 = parseIndonesianNumber(row[11], toaShift2 + manualShift2);
    const totalPassengers = parseIndonesianNumber(row[12], totalShift1 + totalShift2);
    const kmPerBus = parseIndonesianNumber(row[13]);
    const targetPassengers = parseIndonesianNumber(row[14]);
    const totalRitase = parseIndonesianNumber(row[19]);

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
