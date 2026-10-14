import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';
import { parseIndonesianNumber } from '../utils/numberUtils';
import { extractSpreadsheetId } from '../utils/sheetIdentity';
import type { Route } from '../types/supabase';

export interface MonthlyMasterIngestionProgress {
  percent: number;
  stepMessage: string;
  currentDay?: number;
  processedRecords: number;
  totalRecords: number;
}

export interface MonthlyMasterIngestionResult {
  success: boolean;
  savedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Normalisasi kode rute agar tahan terhadap perbedaan spasi atau titik.
 * Contoh: "JAK.01", "JAK 01", "jak 01" -> "JAK01"
 */
export function normalizeRouteCode(code: string): string {
  if (!code) return '';
  return code.replace(/[\.\s]/g, '').toUpperCase();
}

/**
 * Parser CSV ringan dan handal (RFC 4180 compliant)
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(current);
      lines.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (row.length > 0 || current !== '') {
    row.push(current);
    lines.push(row);
  }

  return lines;
}

export const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDONESIAN_MONTH_MAP: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  agu: 8,
  agt: 8,
  sep: 9,
  sept: 9,
  okt: 10,
  oct: 10,
  nov: 11,
  des: 12,
  dec: 12,
};

export interface DetectedMonthYear {
  month: number;
  year: number;
  monthName: string;
  isDetected: boolean;
}

/**
 * Deteksi nama bulan dan tahun dari nama tab sheet secara cerdas dan fleksibel.
 * Mendukung nama panjang (September) maupun singkatan (Sept, Sep), serta tahun 4 digit.
 */
export function parseMonthAndYearFromTab(
  tabName: string,
  defaultYear?: number,
  defaultMonth?: number
): DetectedMonthYear {
  const fallbackYear = defaultYear || new Date().getFullYear();
  const fallbackMonth = defaultMonth || new Date().getMonth() + 1;
  const fallbackMonthName = INDONESIAN_MONTH_NAMES[fallbackMonth - 1] || 'Oktober';

  if (!tabName || typeof tabName !== 'string') {
    return {
      month: fallbackMonth,
      year: fallbackYear,
      monthName: fallbackMonthName,
      isDetected: false,
    };
  }

  const clean = tabName.trim().toLowerCase();

  // Ekstrak 4 digit tahun (contoh: 2024, 2025, 2026)
  const yearMatch = clean.match(/\b(20\d\d)\b/);
  const detectedYear = yearMatch ? parseInt(yearMatch[1], 10) : fallbackYear;

  // Cari kecocokan bulan (prioritaskan key yang lebih panjang untuk mencegah prefix false-positive)
  const sortedKeys = Object.keys(INDONESIAN_MONTH_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(clean) || clean.includes(key)) {
      const monthNum = INDONESIAN_MONTH_MAP[key];
      return {
        month: monthNum,
        year: detectedYear,
        monthName: INDONESIAN_MONTH_NAMES[monthNum - 1],
        isDetected: true,
      };
    }
  }

  return {
    month: fallbackMonth,
    year: detectedYear,
    monthName: fallbackMonthName,
    isDetected: false,
  };
}

interface DayBlock {
  dayNum: number;
  monthNum: number;
  yearNum: number;
  dateStr: string; // YYYY-MM-DD
  rowStartIdx: number;
  rowEndIdx: number;
}

/**
 * Tarik seluruh data 18 rute dari Spreadsheet Rekap Master Wilayah (1 Bulan Sekaligus)
 * dan simpan ke Supabase `daily_route_reports`.
 */
export async function ingestMonthlyMasterSheet(
  spreadsheetUrlOrId: string,
  sheetTabName: string,
  targetYear?: number,
  targetMonth?: number, // 1-12
  onProgress?: (progress: MonthlyMasterIngestionProgress) => void,
  nowDateOverride?: Date
): Promise<MonthlyMasterIngestionResult> {
  const errors: string[] = [];
  let savedCount = 0;
  let skippedCount = 0;

  try {
    // 1. Validasi Input Dasar
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrlOrId);
    if (!spreadsheetId) {
      return {
        success: false,
        savedCount: 0,
        skippedCount: 0,
        errors: ['Link spreadsheet tidak valid atau kosong.'],
      };
    }

    const trimmedTab = sheetTabName?.trim();
    if (!trimmedTab) {
      return {
        success: false,
        savedCount: 0,
        skippedCount: 0,
        errors: ['Nama lembar (tab bulan) wajib diisi.'],
      };
    }

    onProgress?.({
      percent: 5,
      stepMessage: 'Mengunduh data spreadsheet master...',
      processedRecords: 0,
      totalRecords: 0,
    });

    // 2. Fetch CSV dari Google Sheets gviz endpoint
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      trimmedTab
    )}`;

    const response = await fetch(gvizUrl);
    if (!response.ok) {
      return {
        success: false,
        savedCount: 0,
        skippedCount: 0,
        errors: [`Gagal mengunduh spreadsheet (Status ${response.status}: ${response.statusText})`],
      };
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (!rows || rows.length === 0) {
      return {
        success: false,
        savedCount: 0,
        skippedCount: 0,
        errors: ['Data spreadsheet kosong atau tidak dapat diuraikan.'],
      };
    }

    onProgress?.({
      percent: 15,
      stepMessage: 'Menganalisis baris data 18 rute per tanggal...',
      processedRecords: 0,
      totalRecords: 0,
    });

    // 3. Ambil Master Rute dari Database
    const routes = await fetchRouteMasterList();
    if (!routes || routes.length === 0) {
      return {
        success: false,
        savedCount: 0,
        skippedCount: 0,
        errors: ['Daftar master rute tidak ditemukan di database.'],
      };
    }

    const routeMap = new Map<string, Route>();
    routes.forEach((r) => {
      routeMap.set(normalizeRouteCode(r.route_code), r);
    });

    // 4. Pindai Seluruh Header Tanggal dari CSV untuk Menetapkan Batas Baris yang Presisi
    interface RawDayHeader {
      dayNum: number;
      monthNum: number;
      yearNum: number;
      rowIdx: number;
    }
    const allHeaders: RawDayHeader[] = [];
    for (let r = 0; r < rows.length; r++) {
      const firstCell = rows[r][0] ? rows[r][0].trim() : '';
      const match = firstCell.match(/^([A-Za-z]+),\s*(\d{1,2})\s*([A-Za-z]+)\s*(\d{4})/);
      if (match) {
        const dayNum = parseInt(match[2], 10);
        const monthName = match[3].toLowerCase();
        const yearNum = parseInt(match[4], 10);
        const parsedMonth = INDONESIAN_MONTH_MAP[monthName];
        if (parsedMonth) {
          allHeaders.push({ dayNum, monthNum: parsedMonth, yearNum, rowIdx: r });
        }
      }
    }

    // 5. Resolusi Cerdas Bulan & Tahun (Smart Auto-Resolution)
    // A. Prioritas 1: Deteksi dari nama tab (misal "SEPTEMBER 2026")
    const detectedFromTab = parseMonthAndYearFromTab(trimmedTab, targetYear, targetMonth);
    let resolvedYear = detectedFromTab.isDetected
      ? detectedFromTab.year
      : targetYear || new Date().getFullYear();
    let resolvedMonth = detectedFromTab.isDetected
      ? detectedFromTab.month
      : targetMonth || new Date().getMonth() + 1;

    // B. Prioritas 2 (Koreksi Mandiri): Jika kombinasi tidak ada di CSV, ambil kombinasi dominan dari CSV
    const matchingHeaderCount = allHeaders.filter(
      (h) => h.yearNum === resolvedYear && h.monthNum === resolvedMonth
    ).length;

    if (matchingHeaderCount === 0 && allHeaders.length > 0) {
      const freqMap = new Map<string, { year: number; month: number; count: number }>();
      allHeaders.forEach((h) => {
        const key = `${h.yearNum}-${h.monthNum}`;
        const existing = freqMap.get(key) || { year: h.yearNum, month: h.monthNum, count: 0 };
        existing.count++;
        freqMap.set(key, existing);
      });

      let maxCount = 0;
      let dominant: { year: number; month: number } | null = null;
      for (const item of freqMap.values()) {
        if (item.count > maxCount) {
          maxCount = item.count;
          dominant = item;
        }
      }

      if (dominant) {
        resolvedYear = dominant.year;
        resolvedMonth = dominant.month;
      }
    }

    // 6. Hitung Batas Hari Secara Fleksibel (Date Limit Filter)
    const now = nowDateOverride || new Date();
    const isCurrentMonth =
      now.getFullYear() === resolvedYear && now.getMonth() + 1 === resolvedMonth;
    const isFutureMonth =
      resolvedYear > now.getFullYear() ||
      (resolvedYear === now.getFullYear() && resolvedMonth > now.getMonth() + 1);

    const daysInMonth = new Date(resolvedYear, resolvedMonth, 0).getDate();

    let maxDayAllowed = daysInMonth;
    if (isCurrentMonth) {
      // Bulan berjalan: dibatasi s.d. tanggal hari ini
      maxDayAllowed = Math.min(now.getDate(), daysInMonth);
    } else if (isFutureMonth) {
      const futureMonthName = INDONESIAN_MONTH_NAMES[resolvedMonth - 1] || `${resolvedMonth}`;
      return {
        success: false,
        savedCount: 0,
        skippedCount: 0,
        errors: [
          `Bulan ${futureMonthName} ${resolvedYear} berada di masa depan dan belum memiliki data operasional.`,
        ],
      };
    } else {
      // Bulan lalu: AMBIL LENGKAP SELURUH HARI (1 s.d. 30/31)!
      maxDayAllowed = daysInMonth;
    }

    const dayBlocks: DayBlock[] = [];
    for (let h = 0; h < allHeaders.length; h++) {
      const header = allHeaders[h];
      const nextRowIdx = h < allHeaders.length - 1 ? allHeaders[h + 1].rowIdx : rows.length;
      if (
        header.yearNum === resolvedYear &&
        header.monthNum === resolvedMonth &&
        header.dayNum <= maxDayAllowed
      ) {
        const dateStr = `${header.yearNum}-${String(header.monthNum).padStart(2, '0')}-${String(
          header.dayNum
        ).padStart(2, '0')}`;
        dayBlocks.push({
          dayNum: header.dayNum,
          monthNum: header.monthNum,
          yearNum: header.yearNum,
          dateStr,
          rowStartIdx: header.rowIdx,
          rowEndIdx: nextRowIdx,
        });
      }
    }

    if (dayBlocks.length === 0) {
      return {
        success: false,
        savedCount: 0,
        skippedCount: 0,
        errors: [
          `Tidak ditemukan blok tanggal yang valid untuk ${trimmedTab} (Batas s.d. tanggal ${maxDayAllowed}).`,
        ],
      };
    }

    // 6. Ambil Data yang Sudah Disubmit dari App untuk Smart Skip
    const minDateStr = dayBlocks[0].dateStr;
    const maxDateStr = dayBlocks[dayBlocks.length - 1].dateStr;

    const { data: existingReports } = await supabase
      .from('daily_route_reports')
      .select('id, route_id, route_code, date, status')
      .gte('date', minDateStr)
      .lte('date', maxDateStr);

    const submittedSet = new Set<string>();
    (existingReports || []).forEach((rep: any) => {
      if (rep.status === 'submitted' || rep.status === 'verified') {
        submittedSet.add(`${rep.route_id}_${rep.date}`);
      }
    });

    // 7. Ekstraksi Data Tiap Rute di Dalam Blok Tanggal
    const recordsToUpsert: any[] = [];
    const totalPotential = dayBlocks.length * routes.length;

    for (let b = 0; b < dayBlocks.length; b++) {
      const block = dayBlocks[b];

      for (let r = block.rowStartIdx + 1; r < block.rowEndIdx; r++) {
        const row = rows[r];
        if (!row || row.length < 3) continue;

        const rawRouteCode = row[2] ? row[2].trim() : '';
        if (!rawRouteCode || !rawRouteCode.toUpperCase().startsWith('JAK')) continue;

        const matchedRoute = routeMap.get(normalizeRouteCode(rawRouteCode));
        if (!matchedRoute) continue;

        // Cek Smart Skip
        const skipKey = `${matchedRoute.id}_${block.dateStr}`;
        if (submittedSet.has(skipKey)) {
          skippedCount++;
          continue;
        }

        // Parse Kolom-Kolom Metrik
        const renops = Math.round(parseIndonesianNumber(row[3])) || (matchedRoute.default_renops || 0);
        const realops = Math.round(parseIndonesianNumber(row[4])) || 0;
        const totalKm = parseIndonesianNumber(row[5]);
        const toaS1 = parseIndonesianNumber(row[6]);
        const manS1 = parseIndonesianNumber(row[7]);
        const toaS2 = parseIndonesianNumber(row[9]);
        const manS2 = parseIndonesianNumber(row[10]);
        const totalPax = parseIndonesianNumber(row[12]) || (toaS1 + manS1 + toaS2 + manS2);
        const ritaseCol = parseIndonesianNumber(row[19]);

        // Activity Guard: Jika belum ada realisasi apa pun, lewati
        if (realops === 0 && totalKm === 0 && totalPax === 0) {
          continue;
        }

        // ponytail: 1 Ritase = Pulang-Pergi (PP). Gunakan km_baku jika ada.
        const kmBaku = Number(matchedRoute.km_baku) || 0;
        const totalRitase =
          kmBaku > 0 && totalKm > 0
            ? Number((totalKm / kmBaku).toFixed(1))
            : Number((ritaseCol || 0).toFixed(1));

        const achievementKm = realops > 0 ? totalKm / realops : 0;

        recordsToUpsert.push({
          route_id: matchedRoute.id,
          route_code: matchedRoute.route_code,
          date: block.dateStr,
          renops_shift1: renops,
          realops_shift1: realops,
          renops_shift2: renops,
          realops_shift2: realops,
          toa_shift1: toaS1,
          manual_shift1: manS1,
          toa_shift2: toaS2,
          manual_shift2: manS2,
          total_passengers: totalPax,
          total_km: totalKm,
          achievement_km: achievementKm,
          total_trip: totalRitase,
          status: 'draft',
          data_source: 'sheet_ingestion',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // 8. Bulk Upsert ke Supabase dalam Chunks
    const CHUNK_SIZE = 50;
    for (let i = 0; i < recordsToUpsert.length; i += CHUNK_SIZE) {
      const chunk = recordsToUpsert.slice(i, i + CHUNK_SIZE);
      const percent = Math.min(
        95,
        Math.round(20 + (i / Math.max(1, recordsToUpsert.length)) * 75)
      );

      onProgress?.({
        percent,
        stepMessage: `Menyimpan data ke database (${i + chunk.length}/${recordsToUpsert.length})...`,
        processedRecords: i + chunk.length,
        totalRecords: recordsToUpsert.length,
      });

      const { error: upsertErr } = await supabase
        .from('daily_route_reports')
        .upsert(chunk, { onConflict: 'route_id,date' });

      if (upsertErr) {
        errors.push(`Gagal menyimpan batch data: ${upsertErr.message}`);
      } else {
        savedCount += chunk.length;
      }
    }

    onProgress?.({
      percent: 100,
      stepMessage: `Sinkronisasi selesai! ${savedCount} laporan rute berhasil disimpan.`,
      processedRecords: savedCount,
      totalRecords: totalPotential,
    });

    return {
      success: errors.length === 0,
      savedCount,
      skippedCount,
      errors,
    };
  } catch (err: any) {
    console.warn('[monthlyMasterIngestionService] Exception:', err);
    return {
      success: false,
      savedCount,
      skippedCount,
      errors: [err?.message || 'Terjadi kesalahan sistem saat sinkronisasi bulanan.'],
    };
  }
}
