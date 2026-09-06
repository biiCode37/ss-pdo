import { isAuthError } from '../../utils/errorClassifier';
import { parseIndonesianNumber } from '../../utils/numberUtils';
import { normalizeKeterangan } from '../../utils/keteranganUtils';
import { extractSpreadsheetId } from '../../utils/sheetIdentity';
import { getRoutesFromCache, findSheetInRoutes } from '../../utils/cacheUtils';
import { upsertDailyUnitSummaries } from '../routeService';
import type { DailyUnitSummary } from '../../types/supabase';
import type { BusData, HeaderMap } from './types';
import { fetchSpreadsheetMeta, fetchSheetValues } from './transport';

// Function to normalize header strings for fuzzy matching
export const normalizeString = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Map keywords to standard fields
export const HEADER_KEYWORDS: Record<string, string[]> = {
  unit: ['nobody', 'unit', 'bus', 'body'],
  toaShift1: ['toashift1', 'toashifti', 'toas1', 'toasi'],
  toaShift2: ['toashift2', 'toashiftii', 'toas2', 'toasii'],
  manualShift1: ['manualshift1', 'manualshifti', 'manual1', 'manuals1', 'manualsi'],
  manualShift2: ['manualshift2', 'manualshiftii', 'manual2', 'manuals2', 'manualsii'],
  totalToa: ['totaltoa', 'total'],
  kmAwal1: ['kilometerawalshift1', 'kmawalshift1', 'kmawal1', 'kmawalshifti', 'kmawals1', 'kmawalsi'],
  kmAkhir1: ['kilometerakhirshift1', 'kmakhirshift1', 'kmakhir1', 'kmakhirshifti', 'kmakhirs1', 'kmakhirsi'],
  kmAwal2: ['kilometerawalshift2', 'kmawalshift2', 'kmawal2', 'kmawalshiftii', 'kmawals2', 'kmawalsii'],
  kmAkhir2: ['kilometerakhirshift2', 'kmakhirshift2', 'kmakhir2', 'kmakhirshiftii', 'kmakhirs2', 'kmakhirsii'],
  totalKmShift1: ['totalkilometershift1', 'totalkmshift1', 'totalkm1', 'totalkms1'],
  totalKmShift2: ['totalkilometershift2', 'totalkmshift2', 'totalkm2', 'totalkms2'],
  keterangan: ['keterangan', 'ket', 'notes', 'catatan'],
};

export const findColumnIndex = (headers: string[], keywords: string[]): number => {
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeString(headers[i]);
    if (keywords.some(kw => header.includes(kw))) {
      return i;
    }
  }
  return -1;
};

export function detectHeaderRowAndBuildComposite(rows: any[][]): { headerRowIndex: number; isSubHeader: boolean; compositeHeaders: string[] } {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    if (findColumnIndex(row, HEADER_KEYWORDS.unit) !== -1) {
      // BUG-10: Validasi tambahan — baris header seharusnya berisi mayoritas teks (≥50%), bukan angka murni
      const nonEmptyCells = row.filter((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '');
      const textCells = nonEmptyCells.filter((cell: any) => isNaN(Number(String(cell).trim())));
      if (nonEmptyCells.length === 0 || textCells.length / nonEmptyCells.length >= 0.5) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    return { headerRowIndex: -1, isSubHeader: false, compositeHeaders: [] };
  }

  let isSubHeader = false;
  if (headerRowIndex + 1 < rows.length) {
    const nextRow = rows[headerRowIndex + 1];
    const unitColIdx = findColumnIndex(rows[headerRowIndex], HEADER_KEYWORDS.unit);
    const unitNextVal = nextRow && nextRow[unitColIdx] ? String(nextRow[unitColIdx]).trim() : '';
    if (unitNextVal === '') {
      isSubHeader = true;
    }
  }

  const compositeHeaders: string[] = [];
  const maxCols = Math.max(
    rows[headerRowIndex].length,
    isSubHeader ? (rows[headerRowIndex + 1]?.length || 0) : 0
  );

  let lastMainHeader = '';
  for (let j = 0; j < maxCols; j++) {
    let mainHeaderVal = rows[headerRowIndex][j] ? String(rows[headerRowIndex][j]).trim() : '';
    if (mainHeaderVal !== '') {
      lastMainHeader = mainHeaderVal;
    } else {
      mainHeaderVal = lastMainHeader;
    }
    
    let headerText = mainHeaderVal;
    if (isSubHeader && rows[headerRowIndex + 1] && rows[headerRowIndex + 1][j]) {
      const subHeaderVal = String(rows[headerRowIndex + 1][j]).trim();
      if (subHeaderVal !== '') {
        headerText += ' ' + subHeaderVal;
      }
    }
    
    compositeHeaders[j] = headerText;
  }

  return { headerRowIndex, isSubHeader, compositeHeaders };
}

export const numberToColumnName = (num: number): string => {
  let col = '';
  let n = num + 1; // 1-based
  while (n > 0) {
    let mod = (n - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    n = Math.floor((n - mod) / 26);
  }
  return col;
};

const tabGidCache = new Map<string, number>();

export function clearTabGidCache(): void {
  tabGidCache.clear();
}

/**
 * Mendapatkan numeric sheetId / gid untuk tab tertentu di spreadsheet
 */
export const getTabGid = async (
  sheetId: string,
  tabName: string,
): Promise<number | null> => {
  if (tabGidCache.size > 50) {
    tabGidCache.clear();
  }
  const cacheKey = `${sheetId}:${tabName}`;
  if (tabGidCache.has(cacheKey)) {
    return tabGidCache.get(cacheKey)!;
  }

  try {
    const res = await fetchSpreadsheetMeta(
      sheetId,
      "sheets(properties(sheetId,title))"
    );
    const sheets = res.result?.sheets || res.sheets || [];
    for (const s of sheets) {
      if (
        s.properties?.title === tabName &&
        typeof s.properties?.sheetId === "number"
      ) {
        tabGidCache.set(cacheKey, s.properties.sheetId);
        return s.properties.sheetId;
      }
    }
  } catch (e) {
    console.warn("[GoogleSheets] Failed to fetch tab GID for cell formatting:", e);
  }
  return null;
};

/**
 * @deprecated Gunakan extractSpreadsheetId() dari utils/sheetIdentity.ts.
 * Dipertahankan untuk backward compat — delegasi ke helper canonical.
 */
export const extractSheetId = (urlOrId: string): string => {
  if (!urlOrId) return '';
  return extractSpreadsheetId(urlOrId) ?? urlOrId;
};

export const getBusData = async (sheetId: string, tabName: string): Promise<{ data: BusData[], headerMap: HeaderMap, missingColumns: string[], sheetSummary: Record<string, number> }> => {
  try {
    const response = await fetchSheetValues(sheetId, `${tabName}!A1:ZZ`);
    const rows = response.result?.values || response.values;
    if (!rows || rows.length === 0) {
      throw new Error('Tidak ada data di sheet ini.');
    }

      // BUG-26: Use unified header detection with BUG-10 text validation
      const { headerRowIndex, isSubHeader, compositeHeaders } = detectHeaderRowAndBuildComposite(rows);

      if (headerRowIndex === -1) {
        throw new Error('Tidak bisa menemukan kolom "No Body / Unit". Pastikan header berisikan kata "No Body" atau "Unit".');
      }
      
      const unitIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit);
      let tripPergiIdx = -1;
      let tripPulangIdx = -1;
      if (unitIdx !== -1) {
        if (compositeHeaders[unitIdx + 1] && !compositeHeaders[unitIdx + 1].toLowerCase().includes("toa")) {
          tripPergiIdx = unitIdx + 1;
        }
        if (compositeHeaders[unitIdx + 2] && !compositeHeaders[unitIdx + 2].toLowerCase().includes("toa")) {
          tripPulangIdx = unitIdx + 2;
        }
      }

      const headerMap: HeaderMap = {
        unit: unitIdx,
        tripPergi: tripPergiIdx,
        tripPulang: tripPulangIdx,
        tripPergiLabel: tripPergiIdx !== -1 ? compositeHeaders[tripPergiIdx] : 'Trip Pergi',
        tripPulangLabel: tripPulangIdx !== -1 ? compositeHeaders[tripPulangIdx] : 'Trip Pulang',
        toaShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift1),
        toaShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift2),
        manualShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1),
        manualShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2),
        totalToa: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalToa),
        kmAwal1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal1),
        kmAkhir1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir1),
        kmAwal2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal2),
        kmAkhir2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir2),
        totalKmShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalKmShift1),
        totalKmShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalKmShift2),
        keterangan: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.keterangan),
      };

      // BUG-05: Validasi SEMUA field, bukan hanya 'unit'
      const FIELD_LABELS: Record<string, string> = {
        toaShift1: 'TOA Shift 1',
        manualShift1: 'Manual Shift 1',
        manualShift2: 'Manual Shift 2',
        totalToa: 'Total TOA',
        kmAwal1: 'KM Awal Shift 1',
        kmAkhir1: 'KM Akhir Shift 1',
        kmAwal2: 'KM Awal Shift 2',
        kmAkhir2: 'KM Akhir Shift 2',
        keterangan: 'Keterangan',
      };
      const missingColumns: string[] = [];
      for (const [key, label] of Object.entries(FIELD_LABELS)) {
        if (headerMap[key] === -1) {
          missingColumns.push(label);
        }
      }

      const getValue = (row: any[], idx: number) => {
        if (idx === -1) return '';
        const val = row[idx];
        return val !== undefined && val !== null ? String(val) : '';
      };

      const km1Idx = findColumnIndex(compositeHeaders, ['km1']);
      const km2Idx = findColumnIndex(compositeHeaders, ['km2']);

      const data: BusData[] = [];
      const sheetSummary: Record<string, number> = {};

      // Data starts after the header(s)
      const dataStartIndex = isSubHeader ? headerRowIndex + 2 : headerRowIndex + 1;
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const unitVal = row[headerMap.unit];
        
        // If unit is present, parse bus data
        if (unitVal && String(unitVal).trim() !== '') {
          let kmAwal1Val = getValue(row, headerMap.kmAwal1);
          let kmAkhir1Val = getValue(row, headerMap.kmAkhir1);
          let kmAwal2Val = getValue(row, headerMap.kmAwal2);
          let kmAkhir2Val = getValue(row, headerMap.kmAkhir2);

          // Fallback: If individual KM fields are empty, parse from KM 1 or KM 2 if available
          if ((!kmAwal1Val || !kmAkhir1Val) && km1Idx !== -1) {
            const rawKm1 = getValue(row, km1Idx);
            if (rawKm1 && rawKm1.includes('.')) {
              const parts = rawKm1.split('.');
              if (!kmAwal1Val) kmAwal1Val = parts[0];
              if (!kmAkhir1Val) kmAkhir1Val = parts[1];
            }
          }

          if ((!kmAwal2Val || !kmAkhir2Val) && km2Idx !== -1) {
            const rawKm2 = getValue(row, km2Idx);
            if (rawKm2 && rawKm2.includes('.')) {
              const parts = rawKm2.split('.');
              if (!kmAwal2Val) kmAwal2Val = parts[0];
              if (!kmAkhir2Val) kmAkhir2Val = parts[1];
            }
          }

          let toaShift1Val = getValue(row, headerMap.toaShift1);
          let toaShift2Val = getValue(row, headerMap.toaShift2);
          let totalToaVal = getValue(row, headerMap.totalToa);

          if (!toaShift2Val && totalToaVal && toaShift1Val) {
            const tot = parseIndonesianNumber(totalToaVal);
            const t1 = parseIndonesianNumber(toaShift1Val);
            toaShift2Val = Math.max(0, tot - t1).toString();
          }

          data.push({
            rowIndex: i + 1, // Sheets API uses 1-based index (A1)
            unit: String(unitVal),
            tripPergi: getValue(row, headerMap.tripPergi),
            tripPulang: getValue(row, headerMap.tripPulang),
            toaShift1: toaShift1Val,
            toaShift2: toaShift2Val || '0',
            manualShift1: getValue(row, headerMap.manualShift1),
            manualShift2: getValue(row, headerMap.manualShift2),
            totalToa: totalToaVal,
            kmAwal1: kmAwal1Val,
            kmAkhir1: kmAkhir1Val,
            kmAwal2: kmAwal2Val,
            kmAkhir2: kmAkhir2Val,
            keterangan: normalizeKeterangan(getValue(row, headerMap.keterangan)),
            originalRow: row
          });
        } else {
          // Scan summary rows below table
          row.forEach((cellVal: any, colIdx: number) => {
            if (!cellVal) return;
            const cleanStr = String(cellVal).replace(/\s+/g, ' ').trim().toLowerCase();

            let key = '';
            if (cleanStr.includes('pelanggan/km') || cleanStr.includes('pelanggan / km') || cleanStr.includes('pelanggan/ km')) {
              key = 'passengersPerKm';
            } else if (cleanStr.includes('km/bus') || cleanStr.includes('km / bus') || cleanStr.includes('km /bus') || cleanStr.includes('km/ bus')) {
              key = 'kmPerBus';
            } else if (cleanStr.includes('total pelanggan')) {
              key = 'totalPassengers';
            } else if (cleanStr.includes('total km')) {
              key = 'totalKm';
            } else if (cleanStr.includes('toa shift 1') || cleanStr.includes('toa s1')) {
              key = 'totalToaShift1';
            } else if (cleanStr.includes('manual shift 1') || cleanStr.includes('manual s1')) {
              key = 'totalManualShift1';
            } else if (cleanStr.includes('shift 1') || cleanStr.includes('total s1')) {
              key = 'totalShift1';
            } else if (cleanStr.includes('toa shift 2') || cleanStr.includes('toa s2')) {
              key = 'totalToaShift2';
            } else if (cleanStr.includes('manual shift 2') || cleanStr.includes('manual s2')) {
              key = 'totalManualShift2';
            } else if (cleanStr.includes('shift 2') || cleanStr.includes('total s2')) {
              key = 'totalShift2';
            } else if (cleanStr === 'total toa' || cleanStr.startsWith('total toa')) {
              key = 'grandTotalToa';
            } else if (cleanStr === 'total manual' || cleanStr.startsWith('total manual')) {
              key = 'grandTotalManual';
            }

            if (key && sheetSummary[key] === undefined) {
              for (let offset = 1; offset <= 3; offset++) {
                const nextVal = row[colIdx + offset];
                const parsedNum = parseIndonesianNumber(nextVal);
                if (!isNaN(parsedNum)) {
                  sheetSummary[key] = parsedNum;
                  break;
                }
              }
            }
          });
        }
      }

      // ponytail: auto-sync ringkasan unit ke Supabase daily_unit_summaries secara background (fire-and-forget)
      (async () => {
        try {
          if (tabName && !isNaN(parseInt(tabName, 10))) {
            const day = parseInt(tabName, 10);
            const match = findSheetInRoutes(getRoutesFromCache(), sheetId);
            if (match) {
              const { route: matchRoute, sheet: matchSheet } = match;
              const summaries: DailyUnitSummary[] = data.map((bus) => {
                const kmA1 = parseIndonesianNumber(bus.kmAwal1);
                const kmAkh1 = parseIndonesianNumber(bus.kmAkhir1);
                const kmA2 = parseIndonesianNumber(bus.kmAwal2);
                const kmAkh2 = parseIndonesianNumber(bus.kmAkhir2);
                const kmS1 = kmAkh1 > kmA1 ? kmAkh1 - kmA1 : 0;
                const kmS2 = kmAkh2 > kmA2 ? kmAkh2 - kmA2 : 0;

                const toa1 = parseIndonesianNumber(bus.toaShift1);
                const man1 = parseIndonesianNumber(bus.manualShift1);
                const toa2 = parseIndonesianNumber(bus.toaShift2);
                const man2 = parseIndonesianNumber(bus.manualShift2);
                const totToa = parseIndonesianNumber(bus.totalToa) || (toa1 + toa2);

                return {
                  route_sheet_id: matchSheet.id,
                  route_code: matchRoute.route_code,
                  year: matchSheet.year,
                  month: matchSheet.month,
                  day,
                  unit: bus.unit,
                  total_km: kmS1 + kmS2,
                  toa_shift1: toa1,
                  manual_shift1: man1,
                  toa_shift2: toa2,
                  manual_shift2: man2,
                  total_toa: totToa,
                  total_passengers: totToa + man1 + man2,
                  keterangan: bus.keterangan || undefined,
                };
              });
              try {
                await upsertDailyUnitSummaries(summaries);
              } catch (upsertErr) {
                // 1x retry setelah 3 detik jika gagal (SOL-R6-009)
                setTimeout(() => {
                  upsertDailyUnitSummaries(summaries).catch((retryErr) => {
                    console.warn('[GoogleSheets] upsertDailyUnitSummaries retry also failed:', retryErr);
                  });
                }, 3000);
              }
            }
          }
        } catch (_e) {}
      })();

      return { data, headerMap, missingColumns, sheetSummary };
    } catch (error: any) {
      console.error('Error fetching data', error);
      if (isAuthError(error)) {
        throw error;
      }
      throw new Error(error?.result?.error?.message || error?.message || 'Gagal mengambil data dari Google Sheets. Pastikan link benar dan Anda memiliki akses.');
    }
};

export const getBusRowData = async (
  sheetId: string, 
  tabName: string, 
  rowIndex: number, 
  headerMap: HeaderMap
): Promise<Partial<BusData>> => {
  try {
    const response = await fetchSheetValues(
      sheetId,
      `${tabName}!A${rowIndex}:ZZ${rowIndex}`
    );

    const rows = response.result?.values || response.values;
    if (!rows || rows.length === 0) {
      return {}; // Row is empty
    }

    const row = rows[0];
    
    const getValue = (idx: number) => {
      if (idx === -1) return '';
      const val = row[idx];
      return val !== undefined && val !== null ? String(val) : '';
    };

    return {
      tripPergi: getValue(headerMap.tripPergi),
      tripPulang: getValue(headerMap.tripPulang),
      toaShift1: getValue(headerMap.toaShift1),
      manualShift1: getValue(headerMap.manualShift1),
      manualShift2: getValue(headerMap.manualShift2),
      totalToa: getValue(headerMap.totalToa),
      kmAwal1: getValue(headerMap.kmAwal1),
      kmAkhir1: getValue(headerMap.kmAkhir1),
      kmAwal2: getValue(headerMap.kmAwal2),
      kmAkhir2: getValue(headerMap.kmAkhir2),
      keterangan: normalizeKeterangan(getValue(headerMap.keterangan)),
    };
  } catch (error: any) {
    throw new Error(error?.result?.error?.message || error?.message || 'Gagal melakukan pengecekan data.');
  }
};
