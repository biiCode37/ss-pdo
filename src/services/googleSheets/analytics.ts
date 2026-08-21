import { gapi } from 'gapi-script';
import { isAuthError } from '../../utils/errorClassifier';
import { parseIndonesianNumber } from '../../utils/numberUtils';
import { formatAccumulatedNotes } from '../../utils/analytics';
import { extractRouteNameFromHeaders } from '../../utils/routeValidation';
import type { BusData, HeaderMap, SpreadsheetInspectionResult } from './types';
import { withAuthRetry } from './auth';
import {
  HEADER_KEYWORDS,
  findColumnIndex,
  detectHeaderRowAndBuildComposite,
  getBusData,
} from './core';

export const monthlyToaTrendCache = new Map<string, { day: string; totalToa: number }[]>();

export function clearMonthlyToaTrendCache(): void {
  monthlyToaTrendCache.clear();
}

export const getMonthlyToaTrend = async (
  sheetId: string, 
  maxDay: number,
  unitFilter?: string,
  bypassCache = false
): Promise<{ day: string; totalToa: number }[]> => {
  const cacheKey = `${sheetId}_${maxDay}_${unitFilter || 'ALL'}`;
  if (!bypassCache && monthlyToaTrendCache.has(cacheKey)) {
    return monthlyToaTrendCache.get(cacheKey)!;
  }

  return withAuthRetry(async () => {
    const trendData: { day: string; totalToa: number }[] = [];
    
    if (!sheetId || maxDay < 1) return trendData;

    const ranges: string[] = [];
    for (let day = 1; day <= maxDay; day++) {
      ranges.push(`${day}!A1:ZZ100`);
    }

    try {
      const response = await (gapi.client as any).sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges: ranges,
      });

      const valueRanges = response?.result?.valueRanges || [];
      const normalizedUnitFilter = unitFilter ? unitFilter.trim().toLowerCase() : null;

      for (let idx = 0; idx < maxDay; idx++) {
        const dayStr = (idx + 1).toString();
        const vr = valueRanges[idx];
        const rows = vr?.values;

        if (!rows || rows.length === 0) {
          trendData.push({ day: dayStr, totalToa: 0 });
          continue;
        }

        // BUG-26: Use unified header detection with text cell percentage check
        const { headerRowIndex, isSubHeader, compositeHeaders } = detectHeaderRowAndBuildComposite(rows);

        if (headerRowIndex === -1) {
          trendData.push({ day: dayStr, totalToa: 0 });
          continue;
        }

        const unitColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit);
        const toaShift1ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift1);
        const toaShift2ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift2);
        const totalToaColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalToa);
        const manualShift1ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1);
        const manualShift2ColIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2);

        const startRowIdx = headerRowIndex + (isSubHeader ? 2 : 1);
        const tabSummary: Record<string, number> = {};
        let totalToaShift1 = 0;
        let totalManualShift1 = 0;
        let totalToaShift2 = 0;
        let totalManualShift2 = 0;
        let unitDayTotal = 0;
        let unitFound = false;

        for (let r = startRowIdx; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const unitVal = unitColIdx !== -1 && row[unitColIdx] ? String(row[unitColIdx]).trim() : '';

          if (unitVal !== '') {
            if (normalizedUnitFilter) {
              if (unitVal.toLowerCase() === normalizedUnitFilter) {
                unitFound = true;
                let tot = totalToaColIdx !== -1 ? parseIndonesianNumber(row[totalToaColIdx], NaN) : NaN;
                let toa1 = toaShift1ColIdx !== -1 ? parseIndonesianNumber(row[toaShift1ColIdx], NaN) : NaN;
                let toa2 = toaShift2ColIdx !== -1 ? parseIndonesianNumber(row[toaShift2ColIdx], NaN) : NaN;
                let man1 = manualShift1ColIdx !== -1 ? parseIndonesianNumber(row[manualShift1ColIdx], NaN) : NaN;
                let man2 = manualShift2ColIdx !== -1 ? parseIndonesianNumber(row[manualShift2ColIdx], NaN) : NaN;

                if (!isNaN(tot)) {
                  unitDayTotal += tot;
                } else {
                  const s1 = isNaN(toa1) ? 0 : toa1;
                  const s2 = isNaN(toa2) ? 0 : toa2;
                  const m1 = isNaN(man1) ? 0 : man1;
                  const m2 = isNaN(man2) ? 0 : man2;
                  unitDayTotal += (s1 + s2 + m1 + m2);
                }
              }
            } else {
              // Bus data row for overall route
              let toa1 = toaShift1ColIdx !== -1 ? parseIndonesianNumber(row[toaShift1ColIdx], NaN) : NaN;
              let man1 = manualShift1ColIdx !== -1 ? parseIndonesianNumber(row[manualShift1ColIdx], NaN) : NaN;
              let toa2 = toaShift2ColIdx !== -1 ? parseIndonesianNumber(row[toaShift2ColIdx], NaN) : NaN;
              let man2 = manualShift2ColIdx !== -1 ? parseIndonesianNumber(row[manualShift2ColIdx], NaN) : NaN;

              if (!isNaN(toa1)) totalToaShift1 += toa1;
              if (!isNaN(man1)) totalManualShift1 += man1;
              if (!isNaN(toa2)) totalToaShift2 += toa2;
              if (!isNaN(man2)) totalManualShift2 += man2;
            }
          } else if (!normalizedUnitFilter) {
            // Summary row below table
            row.forEach((cellVal: any, colIdx: number) => {
              if (!cellVal) return;
              const cleanStr = String(cellVal).replace(/\s+/g, ' ').trim().toLowerCase();

              let key = '';
              if (cleanStr.includes('total pelanggan') || cleanStr === 'total pnp') {
                key = 'totalPassengers';
              } else if (cleanStr === 'total toa' || cleanStr.startsWith('total toa')) {
                key = 'grandTotalToa';
              }

              if (key && tabSummary[key] === undefined) {
                for (let offset = 1; offset <= 3; offset++) {
                  const nextVal = row[colIdx + offset];
                  const parsedNum = parseIndonesianNumber(nextVal);
                  if (!isNaN(parsedNum)) {
                    tabSummary[key] = parsedNum;
                    break;
                  }
                }
              }
            });
          }
        }

        if (normalizedUnitFilter) {
          trendData.push({ day: dayStr, totalToa: unitFound ? unitDayTotal : 0 });
        } else {
          const calculatedTotalPassengers = totalToaShift1 + totalManualShift1 + totalToaShift2 + totalManualShift2;
          const finalDayTotal = tabSummary['totalPassengers'] !== undefined && !isNaN(tabSummary['totalPassengers'])
            ? tabSummary['totalPassengers']
            : calculatedTotalPassengers;

          // BUG-21: Preserve pure raw decimal SSOT value without rounding in service layer
          trendData.push({ day: dayStr, totalToa: finalDayTotal });
        }
      }
    } catch (error) {
      console.error('Error fetching batch monthly TOA trend:', error);
      throw error;
    }

    if (trendData.length > 0) {
      monthlyToaTrendCache.set(cacheKey, trendData);
    }
    return trendData;
  });
};

export const getAccumulatedBusData = async (
  sheetId: string,
  maxDay: number,
  startDay = 1
): Promise<{ data: BusData[]; headerMap: HeaderMap; missingColumns: string[]; sheetSummary: Record<string, number> }> => {
  return withAuthRetry(async () => {
    const targetEndDay = Math.max(1, maxDay);
    const targetStartDay = Math.max(1, Math.min(startDay, targetEndDay));

    const ranges = Array.from({ length: targetEndDay - targetStartDay + 1 }, (_, i) => `${targetStartDay + i}!A1:ZZ`);

    let valueRanges: any[] = [];
    try {
      const response = await (gapi.client as any).sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges,
      });
      valueRanges = response.result.valueRanges || [];
    } catch (_err) {
      console.warn('[GoogleSheets] batchGet failed for range accumulation, attempting per-day fallback:', _err);
      // ISS-03 FIX: Fallback sequential per-day fetch
      const fallbackUnitMap = new Map<string, BusData>();
      const fallbackNotesMap = new Map<string, { day: number; note: string }[]>();
      let fallbackHeaderMap: HeaderMap | null = null;

      for (let day = targetStartDay; day <= targetEndDay; day++) {
        try {
          const dayRes = await getBusData(sheetId, String(day));
          if (!fallbackHeaderMap && dayRes.headerMap) {
            fallbackHeaderMap = dayRes.headerMap;
          }
          for (const bus of dayRes.data) {
            const unitName = bus.unit;
            if (!unitName) continue;
            if (bus.keterangan) {
              const notesArr = fallbackNotesMap.get(unitName) || [];
              notesArr.push({ day, note: bus.keterangan });
              fallbackNotesMap.set(unitName, notesArr);
            }
            const existing = fallbackUnitMap.get(unitName);
            if (!existing) {
              fallbackUnitMap.set(unitName, { ...bus });
            } else {
              const exToa1 = parseIndonesianNumber(existing.toaShift1);
              const exMan1 = parseIndonesianNumber(existing.manualShift1);
              const exToa2 = parseIndonesianNumber(existing.toaShift2);
              const exMan2 = parseIndonesianNumber(existing.manualShift2);
              const exTotToa = parseIndonesianNumber(existing.totalToa);
              const exKmAkh1 = parseIndonesianNumber(existing.kmAkhir1);

              const newToa1 = exToa1 + parseIndonesianNumber(bus.toaShift1);
              const newMan1 = exMan1 + parseIndonesianNumber(bus.manualShift1);
              const newToa2 = exToa2 + parseIndonesianNumber(bus.toaShift2);
              const newMan2 = exMan2 + parseIndonesianNumber(bus.manualShift2);
              const newTotToa = exTotToa + parseIndonesianNumber(bus.totalToa);
              const newKmAkh1 = exKmAkh1 + parseIndonesianNumber(bus.kmAkhir1);

              existing.toaShift1 = newToa1 > 0 ? String(newToa1) : '';
              existing.manualShift1 = newMan1 > 0 ? String(newMan1) : '';
              existing.toaShift2 = newToa2 > 0 ? String(newToa2) : '';
              existing.manualShift2 = newMan2 > 0 ? String(newMan2) : '';
              existing.totalToa = newTotToa > 0 ? String(newTotToa) : '';
              existing.kmAkhir1 = newKmAkh1 > 0 ? String(newKmAkh1) : '0';
            }
          }
        } catch (_dayErr) {
          console.warn(`[GoogleSheets] Fallback fetch day ${day} skipped due to error:`, _dayErr);
        }
      }

      for (const bus of fallbackUnitMap.values()) {
        const rawNotes = fallbackNotesMap.get(bus.unit);
        if (rawNotes && rawNotes.length > 0) {
          bus.keterangan = formatAccumulatedNotes(rawNotes);
        }
      }

      return {
        data: Array.from(fallbackUnitMap.values()),
        headerMap: fallbackHeaderMap || { unit: 0, toaShift1: 1, toaShift2: 2, manualShift1: 3, manualShift2: 4, totalToa: 5, kmAwal1: 6, kmAkhir1: 7, kmAwal2: 8, kmAkhir2: 9, keterangan: 10 },
        missingColumns: [],
        sheetSummary: {},
      };
    }

    const unitMap = new Map<string, BusData>();
    const unitNotesMap = new Map<string, { day: number; note: string }[]>();
    let firstHeaderMap: HeaderMap | null = null;

    for (let idx = 0; idx < valueRanges.length; idx++) {
      const dayNum = targetStartDay + idx;
      const vr = valueRanges[idx];
      const rows = vr?.values;
      if (!rows || rows.length === 0) continue;

      const { headerRowIndex, isSubHeader, compositeHeaders } = detectHeaderRowAndBuildComposite(rows);
      if (headerRowIndex === -1) continue;

      const headerMap: HeaderMap = {
        unit: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit),
        toaShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift1),
        toaShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.toaShift2),
        manualShift1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift1),
        manualShift2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.manualShift2),
        totalToa: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.totalToa),
        kmAwal1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal1),
        kmAkhir1: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir1),
        kmAwal2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAwal2),
        kmAkhir2: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.kmAkhir2),
        keterangan: findColumnIndex(compositeHeaders, HEADER_KEYWORDS.keterangan),
      };

      if (!firstHeaderMap && headerMap.unit !== -1) {
        firstHeaderMap = headerMap;
      }

      const startRowIdx = headerRowIndex + (isSubHeader ? 2 : 1);

      for (let r = startRowIdx; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const getVal = (colIdx: number) => (colIdx !== -1 && row[colIdx] !== undefined ? String(row[colIdx]).trim() : "");
        const unitName = getVal(headerMap.unit);
        if (!unitName) continue;

        const kmA1 = parseIndonesianNumber(getVal(headerMap.kmAwal1));
        const kmAkh1 = parseIndonesianNumber(getVal(headerMap.kmAkhir1));
        const kmA2 = parseIndonesianNumber(getVal(headerMap.kmAwal2));
        const kmAkh2 = parseIndonesianNumber(getVal(headerMap.kmAkhir2));
        const kmS1 = kmAkh1 > kmA1 ? kmAkh1 - kmA1 : 0;
        const kmS2 = kmAkh2 > kmA2 ? kmAkh2 - kmA2 : 0;

        const toa1 = parseIndonesianNumber(getVal(headerMap.toaShift1));
        const man1 = parseIndonesianNumber(getVal(headerMap.manualShift1));
        const toa2 = parseIndonesianNumber(getVal(headerMap.toaShift2));
        const man2 = parseIndonesianNumber(getVal(headerMap.manualShift2));
        const totToa = parseIndonesianNumber(getVal(headerMap.totalToa));
        const ket = getVal(headerMap.keterangan);

        if (ket) {
          const notesArr = unitNotesMap.get(unitName) || [];
          notesArr.push({ day: dayNum, note: ket });
          unitNotesMap.set(unitName, notesArr);
        }

        const existing = unitMap.get(unitName);
        if (!existing) {
          unitMap.set(unitName, {
            rowIndex: r + 1,
            unit: unitName,
            toaShift1: toa1 > 0 ? toa1.toString() : "",
            manualShift1: man1 > 0 ? man1.toString() : "",
            toaShift2: toa2 > 0 ? toa2.toString() : "",
            manualShift2: man2 > 0 ? man2.toString() : "",
            totalToa: totToa > 0 ? totToa.toString() : (toa1 + toa2).toString(),
            kmAwal1: "0",
            kmAkhir1: kmS1.toString(),
            kmAwal2: "0",
            kmAkhir2: kmS2.toString(),
            keterangan: ket,
            originalRow: row.map(String),
          });
        } else {
          const exKmA1 = parseIndonesianNumber(existing.kmAwal1);
          const exKmAkh1 = parseIndonesianNumber(existing.kmAkhir1);
          const exKmA2 = parseIndonesianNumber(existing.kmAwal2);
          const exKmAkh2 = parseIndonesianNumber(existing.kmAkhir2);
          const exKmS1 = exKmAkh1 > exKmA1 ? exKmAkh1 - exKmA1 : 0;
          const exKmS2 = exKmAkh2 > exKmA2 ? exKmAkh2 - exKmA2 : 0;

          const newKmS1 = exKmS1 + kmS1;
          const newKmS2 = exKmS2 + kmS2;

          const exToa1 = parseIndonesianNumber(existing.toaShift1);
          const exMan1 = parseIndonesianNumber(existing.manualShift1);
          const exToa2 = parseIndonesianNumber(existing.toaShift2);
          const exMan2 = parseIndonesianNumber(existing.manualShift2);
          const exTotToa = parseIndonesianNumber(existing.totalToa);

          const sumToa1 = exToa1 + toa1;
          const sumMan1 = exMan1 + man1;
          const sumToa2 = exToa2 + toa2;
          const sumMan2 = exMan2 + man2;
          const sumTotToa = exTotToa + (totToa > 0 ? totToa : toa1 + toa2);

          existing.toaShift1 = sumToa1 > 0 ? sumToa1.toString() : "";
          existing.manualShift1 = sumMan1 > 0 ? sumMan1.toString() : "";
          existing.toaShift2 = sumToa2 > 0 ? sumToa2.toString() : "";
          existing.manualShift2 = sumMan2 > 0 ? sumMan2.toString() : "";
          existing.totalToa = sumTotToa > 0 ? sumTotToa.toString() : "";
          existing.kmAwal1 = "0";
          existing.kmAkhir1 = newKmS1.toString();
          existing.kmAwal2 = "0";
          existing.kmAkhir2 = newKmS2.toString();
        }
      }
    }

    // Format accumulated notes for each unit using Opsi C
    for (const bus of unitMap.values()) {
      const rawNotes = unitNotesMap.get(bus.unit);
      if (rawNotes && rawNotes.length > 0) {
        bus.keterangan = formatAccumulatedNotes(rawNotes);
      }
    }

    return {
      data: Array.from(unitMap.values()),
      headerMap: firstHeaderMap || { unit: 0, toaShift1: 1, toaShift2: 2, manualShift1: 3, manualShift2: 4, totalToa: 5, kmAwal1: 6, kmAkhir1: 7, kmAwal2: 8, kmAkhir2: 9, keterangan: 10 },
      missingColumns: [],
      sheetSummary: {},
    };
  });
};

/**
 * Memeriksa aksesibilitas dan membaca struktur header spreadsheet (termasuk deteksi nama trayek)
 */
export const inspectSpreadsheetHeader = async (
  sheetId: string,
): Promise<SpreadsheetInspectionResult> => {
  return withAuthRetry(async () => {
    try {
      const metaRes = await (gapi.client as any).sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: "sheets(properties(sheetId,title))",
      });

      const sheets = metaRes.result?.sheets || [];
      const tabNames = sheets
        .map((s: any) => s.properties?.title)
        .filter((t: any): t is string => Boolean(t));

      if (tabNames.length === 0) {
        return {
          success: false,
          tabNames: [],
          message: 'Spreadsheet tidak memiliki tab lembar kerja.',
        };
      }

      const firstTab = tabNames[0];
      const dataRes = await (gapi.client as any).sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${firstTab}!A1:ZZ5`,
      });

      const rows = dataRes.result?.values || [];
      let detectedRouteName: string | undefined;

      if (rows.length > 0) {
        const { headerRowIndex, compositeHeaders } = detectHeaderRowAndBuildComposite(rows);

        if (headerRowIndex !== -1 && compositeHeaders.length > 0) {
          const unitIdx = findColumnIndex(compositeHeaders, HEADER_KEYWORDS.unit);
          let tripPergiLabel: string | undefined;
          let tripPulangLabel: string | undefined;

          if (unitIdx !== -1) {
            if (compositeHeaders[unitIdx + 1] && !compositeHeaders[unitIdx + 1].toLowerCase().includes("toa")) {
              tripPergiLabel = compositeHeaders[unitIdx + 1];
            }
            if (compositeHeaders[unitIdx + 2] && !compositeHeaders[unitIdx + 2].toLowerCase().includes("toa")) {
              tripPulangLabel = compositeHeaders[unitIdx + 2];
            }
          }

          const extractedName = extractRouteNameFromHeaders(tripPergiLabel, tripPulangLabel);
          if (extractedName) {
            detectedRouteName = extractedName;
          }
        }
      }

      return {
        success: true,
        routeName: detectedRouteName,
        tabNames,
      };
    } catch (err: any) {
      console.warn('[GoogleSheets] Failed to inspect spreadsheet:', err);
      if (isAuthError(err)) {
        throw err;
      }
      return {
        success: false,
        tabNames: [],
        message:
          err?.result?.error?.message ||
          'Tidak dapat mengakses spreadsheet. Pastikan izin akses link dibuka untuk publik atau akun Anda telah terotorisasi.',
      };
    }
  });
};
