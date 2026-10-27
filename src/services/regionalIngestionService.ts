import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';
import { getBusData } from './googleSheets/core';
import { parseIndonesianNumber } from '../utils/numberUtils';
import { getRenopsForDate } from '../utils/holidayUtils';
import type { Route, RouteSheet, FleetUnitStatusDetail } from '../types/supabase';
import type { BusData } from './googleSheets/types';

export interface IngestionResult {
  success: boolean;
  syncedFromSheet: number;
  skippedFromApp: number;
  skippedExisting?: number;
  totalCandidates?: number;
  allUpToDate?: boolean;
  errors: string[];
}

export interface IngestionRangeOptions {
  force?: boolean;
}

export interface IngestionProgress {
  currentRouteCode?: string;
  processedCount: number;
  totalToSync: number;
  percent: number;
  stepMessage: string;
  totalDays?: number;
  totalRoutes?: number;
}

/**
 * Mengambil tanggal hari ini dalam zona waktu operasional Asia/Jakarta (WIB: YYYY-MM-DD)
 */
export function getWibTodayString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

/**
 * Mengecek apakah laporan rute di database sudah dianggap lengkap dan tidak perlu ditarik ulang secara default.
 * - Berstatus 'submitted' atau 'verified': selalu di-skip (sudah final via app).
 * - Berstatus 'draft' / 'sheet_ingestion':
 *   - Jika tanggal lampau (< todayStr WIB) dan sudah memiliki aktivitas operasional tercatat.
 */
export function isReportCompleteAndFresh(
  report: {
    status?: string;
    data_source?: string;
    last_synced_at?: string | null;
    total_passengers?: number | null;
    total_km?: number | null;
    realops_shift1?: number | null;
    realops_shift2?: number | null;
    is_fleet_confirmed_s1?: boolean;
    is_fleet_confirmed_s2?: boolean;
  } | undefined,
  dateStr: string,
  todayStr: string
): boolean {
  if (!report) return false;
  // Status final verified selalu di-skip (sudah disahkan Pengawas Wilayah)
  if (report.status === 'verified') return true;

  // Status submitted hanya di-skip jika BUKAN dari sheet_ingestion (artinya berasal dari input manual aplikasi / korlap)
  const isFromSheet = report.data_source === 'sheet_ingestion';
  if (report.status === 'submitted' && !isFromSheet) return true;

  // Untuk tanggal lampau (< todayStr), jika sudah ada data operasional valid dari tarikan sheet
  const isPastDate = dateStr < todayStr;
  const hasActivity =
    (report.total_passengers !== null && report.total_passengers !== undefined && Number(report.total_passengers) > 0) ||
    (report.total_km !== null && report.total_km !== undefined && Number(report.total_km) > 0) ||
    (report.realops_shift1 !== null && report.realops_shift1 !== undefined && Number(report.realops_shift1) > 0) ||
    (report.realops_shift2 !== null && report.realops_shift2 !== undefined && Number(report.realops_shift2) > 0);

  if (isPastDate && hasActivity && report.last_synced_at) {
    return true;
  }

  return false;
}

/**
 * Membagi array menjadi beberapa chunk dengan ukuran tertentu untuk pembatasan konkurensi
 */
function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Jeda asinkron untuk menjaga jarak antar batch request
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ekstraksi metrik capaian harian dan daftar unit Non-SGO dari data sheet rute
 */
export function extractRouteDailyMetrics(
  route: Route,
  busDataList: BusData[] | null,
  sheetSummary: Record<string, number> | null,
  dateStr: string,
  existingReport?: any
): {
  payload: any;
  activeBusesS1: number;
  activeBusesS2: number;
  nonSgoUnitsS1: FleetUnitStatusDetail[];
  nonSgoUnitsS2: FleetUnitStatusDetail[];
} {
  let calcKm = 0;
  let calcToaS1 = 0;
  let calcManualS1 = 0;
  let calcToaS2 = 0;
  let calcManualS2 = 0;
  let calcTrips = 0;

  let activeBusesS1 = 0;
  let activeBusesS2 = 0;
  const nonSgoUnitsS1: FleetUnitStatusDetail[] = [];
  const nonSgoUnitsS2: FleetUnitStatusDetail[] = [];

  const rawBuses = busDataList || [];

  rawBuses.forEach((bus) => {
    const kmA1 = parseIndonesianNumber(bus.kmAwal1);
    const kmAkh1 = parseIndonesianNumber(bus.kmAkhir1);
    const kmA2 = parseIndonesianNumber(bus.kmAwal2);
    const kmAkh2 = parseIndonesianNumber(bus.kmAkhir2);
    const km1 = kmAkh1 > kmA1 ? kmAkh1 - kmA1 : 0;
    const km2 = kmAkh2 > kmA2 ? kmAkh2 - kmA2 : 0;
    calcKm += (km1 + km2);

    const toaS1 = parseIndonesianNumber(bus.toaShift1);
    const manS1 = parseIndonesianNumber(bus.manualShift1);
    const toaS2 = parseIndonesianNumber(bus.toaShift2);
    const manS2 = parseIndonesianNumber(bus.manualShift2);
    calcToaS1 += toaS1;
    calcManualS1 += manS1;
    calcToaS2 += toaS2;
    calcManualS2 += manS2;

    const tripPergi = parseIndonesianNumber(bus.tripPergi);
    const tripPulang = parseIndonesianNumber(bus.tripPulang);
    const totalTrip = tripPergi + tripPulang;
    calcTrips += totalTrip;

    const rawNote = (bus.keterangan || '').trim();
    const ketUpper = rawNote.toUpperCase();
    const hasExplicitNote = rawNote.length > 0 && rawNote !== '-' && rawNote !== '0';
    const isExplicitOff = /(^|[^A-Z])(OFF|LIBUR|SPARE|CADANGAN)([^A-Z]|$)/.test(ketUpper);

    // ponytail: Penentu mutlak status operasi bus adalah akumulasi kolom trip fisik 1 hari (tripPergi + tripPulang).
    // Jika totalTrip > 0 (atau ada pergerakan KM/penumpang), unit BEROPERASI.
    // Dilarang keras mencap unit beroperasi sebagai 'OFF' hanya karena input Shift 2 belum masuk.
    const isOperating = totalTrip > 0 || km1 > 0 || km2 > 0 || toaS1 > 0 || toaS2 > 0 || manS1 > 0 || manS2 > 0;

    if (isOperating) {
      activeBusesS1++;
      activeBusesS2++;

      // Catat jika unit beroperasi namun memiliki keterangan khusus di spreadsheet
      if (hasExplicitNote) {
        const operatingItem: FleetUnitStatusDetail = {
          unit: bus.unit,
          note: rawNote,
          isOff: false,
          isOperatingWithNote: true,
        };
        nonSgoUnitsS1.push(operatingItem);
        nonSgoUnitsS2.push(operatingItem);
      }
    } else {
      // Unit tidak beroperasi: jika eksplisit OFF/LIBUR atau tidak ada keterangan -> isOff: true (Unit Libur)
      // Jika memiliki catatan kendala/alasan lain -> isOff: false (Rincian Tidak Ops)
      const isOffStatus = isExplicitOff || !hasExplicitNote;
      const nonOperatingItem: FleetUnitStatusDetail = {
        unit: bus.unit,
        note: hasExplicitNote ? rawNote : 'OFF',
        isOff: isOffStatus,
        isOperatingWithNote: false,
      };

      nonSgoUnitsS1.push(nonOperatingItem);
      nonSgoUnitsS2.push(nonOperatingItem);
    }
  });

  const totalKm = (sheetSummary?.totalKm !== undefined && sheetSummary.totalKm > 0)
    ? sheetSummary.totalKm
    : calcKm;

  const toaS1 = (sheetSummary?.totalToaShift1 !== undefined && sheetSummary.totalToaShift1 >= 0)
    ? sheetSummary.totalToaShift1
    : calcToaS1;

  const manS1 = (sheetSummary?.totalManualShift1 !== undefined && sheetSummary.totalManualShift1 >= 0)
    ? sheetSummary.totalManualShift1
    : calcManualS1;

  const toaS2 = (sheetSummary?.totalToaShift2 !== undefined && sheetSummary.totalToaShift2 >= 0)
    ? sheetSummary.totalToaShift2
    : calcToaS2;

  const manS2 = (sheetSummary?.totalManualShift2 !== undefined && sheetSummary.totalManualShift2 >= 0)
    ? sheetSummary.totalManualShift2
    : calcManualS2;

  const totalPassengers = (sheetSummary?.totalPassengers !== undefined && sheetSummary.totalPassengers > 0)
    ? sheetSummary.totalPassengers
    : (toaS1 + manS1 + toaS2 + manS2);

  const dynamicRenopsInfo = getRenopsForDate(route, dateStr);
  const targetRenops = dynamicRenopsInfo.renops;
  const renopsShift1 = targetRenops;
  const renopsShift2 = targetRenops;

  const realopsShift1 = rawBuses.length > 0 ? activeBusesS1 : 0;
  const realopsShift2 = rawBuses.length > 0 ? activeBusesS2 : 0;

  const maxRealops = Math.max(realopsShift1, realopsShift2);
  const achievementKm = (sheetSummary?.kmPerBus !== undefined && sheetSummary.kmPerBus > 0)
    ? sheetSummary.kmPerBus
    : (maxRealops > 0 ? totalKm / maxRealops : 0);

  // ponytail: 1 Ritase = 2 Trip (PP / Pulang-Pergi).
  const kmBaku = Number(route.km_baku) || 0;
  const totalRitase = kmBaku > 0 && totalKm > 0
    ? Number((totalKm / kmBaku).toFixed(1))
    : Number((calcTrips / 2).toFixed(1));

  // Safe Realtime Guard: Lindungi data unit jika sudah dikonfirmasi resmi oleh Korlap di aplikasi
  const isS1Confirmed = Boolean(existingReport?.is_fleet_confirmed_s1);
  const isS2Confirmed = Boolean(existingReport?.is_fleet_confirmed_s2);
  const isAppManual = existingReport?.data_source === 'app_input' && (existingReport?.status === 'submitted' || existingReport?.status === 'verified');

  const finalFleetStatusS1 = (isS1Confirmed || isAppManual) && existingReport?.fleet_status_shift1 && existingReport.fleet_status_shift1.length > 0
    ? existingReport.fleet_status_shift1
    : nonSgoUnitsS1;

  const finalFleetStatusS2 = (isS2Confirmed || isAppManual) && existingReport?.fleet_status_shift2 && existingReport.fleet_status_shift2.length > 0
    ? existingReport.fleet_status_shift2
    : nonSgoUnitsS2;

  const finalRealopsS1 = isS1Confirmed && existingReport?.realops_shift1 !== undefined
    ? existingReport.realops_shift1
    : realopsShift1;

  const finalRealopsS2 = isS2Confirmed && existingReport?.realops_shift2 !== undefined
    ? existingReport.realops_shift2
    : realopsShift2;

  const finalStatus = (isAppManual || isS1Confirmed || isS2Confirmed)
    ? (existingReport?.status || 'submitted')
    : (existingReport?.status === 'verified' ? 'verified' : 'draft');

  const finalDataSource = isAppManual
    ? (existingReport?.data_source || 'app_input')
    : (existingReport?.data_source || 'sheet_ingestion');

  const payload = {
    route_id: route.id,
    route_code: route.route_code,
    date: dateStr,
    renops_shift1: renopsShift1,
    realops_shift1: finalRealopsS1,
    renops_shift2: renopsShift2,
    realops_shift2: finalRealopsS2,
    toa_shift1: toaS1,
    manual_shift1: manS1,
    toa_shift2: toaS2,
    manual_shift2: manS2,
    total_passengers: totalPassengers,
    total_km: totalKm,
    achievement_km: achievementKm,
    total_trip: totalRitase,
    status: finalStatus,
    data_source: finalDataSource,
    fleet_status_shift1: finalFleetStatusS1,
    fleet_status_shift2: finalFleetStatusS2,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    payload,
    activeBusesS1,
    activeBusesS2,
    nonSgoUnitsS1,
    nonSgoUnitsS2,
  };
}

/**
 * Menarik ringkasan data harian dari 18 Google Sheet rute individu ke tabel Supabase `daily_route_reports`.
 * Menggunakan prinsip:
 * 1. Smart Skip: Melewati rute yang sudah berstatus 'submitted' atau 'verified' dari aplikasi.
 * 2. Controlled Concurrency: Memproses dalam batch 4 rute secara bergantian dengan jeda 250ms.
 * 3. Partial Tolerance: Jika 1 rute gagal, rute lainnya tetap berhasil diproses.
 */
export async function ingestRegionalRouteSummaries(
  dateStr: string,
  onProgress?: (progress: IngestionProgress) => void,
  options?: IngestionRangeOptions
): Promise<IngestionResult> {
  const errors: string[] = [];
  let syncedFromSheet = 0;
  let skippedFromApp = 0;
  let skippedExisting = 0;
  const isForce = Boolean(options?.force);

  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const tabName = String(day);
    const todayWib = getWibTodayString();

    // 1. Ambil seluruh master rute aktif
    const routes = await fetchRouteMasterList();
    if (!routes || routes.length === 0) {
      return { success: false, syncedFromSheet: 0, skippedFromApp: 0, errors: ['Daftar rute tidak ditemukan.'] };
    }

    // 2. Ambil laporan tanggal aktif di Supabase untuk Smart Skip
    const { data: existingReports } = await supabase
      .from('daily_route_reports')
      .select('id, route_id, route_code, status, date, data_source, last_synced_at, total_passengers, total_km, realops_shift1, realops_shift2, is_fleet_confirmed_s1, is_fleet_confirmed_s2, fleet_status_shift1, fleet_status_shift2')
      .eq('date', dateStr);

    const reportMap = new Map<number, any>();
    (existingReports || []).forEach((rep: any) => {
      reportMap.set(rep.route_id, rep);
    });

    // 3. Ambil konfigurasi route_sheets untuk tahun dan bulan bersangkutan
    const { data: routeSheetsData } = await supabase
      .from('route_sheets')
      .select('*')
      .eq('year', year)
      .eq('month', month);

    const routeSheetMap = new Map<number, RouteSheet>();
    (routeSheetsData || []).forEach((sheet: RouteSheet) => {
      routeSheetMap.set(sheet.route_id, sheet);
    });

    // 4. Pisahkan rute: lewati yang sudah submit dari app atau sudah lengkap (incremental)
    const routesToSync: Route[] = [];

    for (const route of routes) {
      const rep = reportMap.get(route.id);
      const status = rep?.status;
      const isFromSheet = rep?.data_source === 'sheet_ingestion';

      // Hanya skip jika verified atau (submitted bukan dari sheet ingestion)
      if (!isForce && (status === 'verified' || (status === 'submitted' && !isFromSheet))) {
        skippedFromApp++;
      } else if (!isForce && isReportCompleteAndFresh(rep, dateStr, todayWib)) {
        skippedExisting++;
      } else {
        routesToSync.push(route);
      }
    }

    if (routesToSync.length === 0) {
      onProgress?.({
        processedCount: routes.length,
        totalToSync: routes.length,
        percent: 100,
        stepMessage: 'Seluruh data rute pada tanggal ini sudah lengkap di database.',
      });
      return {
        success: true,
        syncedFromSheet: 0,
        skippedFromApp,
        skippedExisting,
        totalCandidates: routes.length,
        allUpToDate: true,
        errors: [],
      };
    }

    onProgress?.({
      processedCount: 0,
      totalToSync: routesToSync.length,
      percent: 5,
      stepMessage: `Menyiapkan sinkronisasi ${routesToSync.length} rute...`,
    });

    let processedCount = 0;

    // 5. Eksekusi batching dengan ukuran chunk = 2 rute per putaran (pacing ramah kuota Google Sheets)
    const chunks = chunkArray(routesToSync, 2);

    for (let c = 0; c < chunks.length; c++) {
      const currentChunk = chunks[c];
      const chunkNames = currentChunk.map((r) => r.route_code).join(', ');

      onProgress?.({
        currentRouteCode: currentChunk[0]?.route_code,
        processedCount,
        totalToSync: routesToSync.length,
        percent: Math.min(95, Math.round(5 + (processedCount / routesToSync.length) * 90)),
        stepMessage: `Mengambil data rute: ${chunkNames}...`,
      });

      await Promise.all(
        currentChunk.map(async (route) => {
          const sheet = routeSheetMap.get(route.id);
          if (!sheet || !sheet.spreadsheet_id) {
            errors.push(`${route.route_code}: Konfigurasi spreadsheet belum terdaftar`);
            return;
          }

          try {
            // Ambil data bus dan rangkuman harian dengan retry halus bila terkena rate limit transient
            let busResult;
            try {
              busResult = await getBusData(sheet.spreadsheet_id, tabName);
            } catch (firstErr: any) {
              const errStr = (firstErr?.message || '').toLowerCase();
              if (errStr.includes('429') || errStr.includes('too many') || errStr.includes('non-2xx')) {
                await sleep(2000);
                busResult = await getBusData(sheet.spreadsheet_id, tabName);
              } else {
                throw firstErr;
              }
            }

            const { data: busDataList, sheetSummary } = busResult;

            const rep = reportMap.get(route.id);
            const { payload } = extractRouteDailyMetrics(
              route,
              busDataList,
              sheetSummary,
              dateStr,
              rep
            );

            const { error: upsertError } = await supabase
              .from('daily_route_reports')
              .upsert(payload, { onConflict: 'route_id,date' });

            if (upsertError) {
              errors.push(`${route.route_code}: Gagal menyimpan ke database (${upsertError.message})`);
            } else {
              syncedFromSheet++;
            }
          } catch (fetchErr: any) {
            errors.push(`${route.route_code}: ${fetchErr?.message || 'Gagal membaca sheet'}`);
          } finally {
            processedCount++;
          }
        })
      );

      onProgress?.({
        processedCount,
        totalToSync: routesToSync.length,
        percent: Math.min(95, Math.round(5 + (processedCount / routesToSync.length) * 90)),
        stepMessage: `Telah memproses ${processedCount} dari ${routesToSync.length} rute...`,
      });

      // Jeda halus antar batch untuk keselamatan rate limit Google API (1.000 ms)
      if (c < chunks.length - 1) {
        await sleep(1000);
      }
    }

    onProgress?.({
      processedCount: routesToSync.length,
      totalToSync: routesToSync.length,
      percent: 100,
      stepMessage: `Sinkronisasi selesai! ${syncedFromSheet} rute berhasil ditarik.`,
    });

    return {
      success: true,
      syncedFromSheet,
      skippedFromApp,
      skippedExisting,
      totalCandidates: routes.length,
      allUpToDate: routesToSync.length === 0,
      errors,
    };
  } catch (globalErr: any) {
    console.warn('[regionalIngestionService] Exception:', globalErr);
    return {
      success: false,
      syncedFromSheet,
      skippedFromApp,
      skippedExisting,
      totalCandidates: 0,
      errors: [globalErr?.message || 'Terjadi kesalahan sistem saat sinkronisasi'],
    };
  }
}

/**
 * Menarik data harian dari satu spreadsheet rute individu secara langsung ke database
 */
export async function ingestSingleRouteSummary(
  dateStr: string,
  routeId: number
): Promise<{ success: boolean; error?: string; realopsS1?: number; nonSgoCount?: number }> {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const tabName = String(day);

    const routes = await fetchRouteMasterList();
    const route = routes.find((r) => r.id === routeId);
    if (!route) {
      return { success: false, error: 'Rute tidak ditemukan' };
    }

    const { data: sheetData } = await supabase
      .from('route_sheets')
      .select('*')
      .eq('route_id', routeId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (!sheetData || !sheetData.spreadsheet_id) {
      return { success: false, error: `Konfigurasi spreadsheet rute ${route.route_code} belum terdaftar` };
    }

    const { data: existingReport } = await supabase
      .from('daily_route_reports')
      .select('id, status, data_source, is_fleet_confirmed_s1, is_fleet_confirmed_s2, fleet_status_shift1, fleet_status_shift2, realops_shift1, realops_shift2')
      .eq('route_id', routeId)
      .eq('date', dateStr)
      .maybeSingle();

    const { data: busDataList, sheetSummary } = await getBusData(sheetData.spreadsheet_id, tabName);
    const { payload, activeBusesS1, nonSgoUnitsS1 } = extractRouteDailyMetrics(
      route,
      busDataList,
      sheetSummary,
      dateStr,
      existingReport
    );

    const { error: upsertError } = await supabase
      .from('daily_route_reports')
      .upsert(payload, { onConflict: 'route_id,date' });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    return {
      success: true,
      realopsS1: activeBusesS1,
      nonSgoCount: nonSgoUnitsS1.length,
    };
  } catch (err: any) {
    console.warn(`[regionalIngestionService] Gagal ingest single route ${routeId}:`, err);
    return { success: false, error: err?.message || 'Gagal membaca sheet rute' };
  }
}

/**
 * Menghasilkan daftar tanggal terurut (YYYY-MM-DD) antara dua tanggal
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const [sY, sM, sD] = startDate.split('-').map(Number);
  const [eY, eM, eD] = endDate.split('-').map(Number);
  const start = new Date(Date.UTC(sY, sM - 1, sD));
  const end = new Date(Date.UTC(eY, eM - 1, eD));

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  const from = start <= end ? start : end;
  const to = start <= end ? end : start;

  const dates: string[] = [];
  const cur = new Date(from.getTime());

  while (cur <= to) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cur.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Menarik ringkasan 18 rute untuk rentang tanggal (mingguan atau kustom)
 */
export async function ingestRegionalRouteSummariesForRange(
  startDate: string,
  endDate: string,
  onProgress?: (progress: IngestionProgress) => void,
  options?: IngestionRangeOptions
): Promise<IngestionResult> {
  const dates = generateDateRange(startDate, endDate);
  if (dates.length === 0) {
    return { success: false, syncedFromSheet: 0, skippedFromApp: 0, errors: ['Rentang tanggal tidak valid'] };
  }

  const isForce = Boolean(options?.force);

  if (dates.length === 1) {
    return ingestRegionalRouteSummaries(dates[0], onProgress, options);
  }

  // 1. Ambil seluruh master rute aktif
  const routes = await fetchRouteMasterList();
  if (!routes || routes.length === 0) {
    return { success: false, syncedFromSheet: 0, skippedFromApp: 0, errors: ['Daftar rute tidak ditemukan.'] };
  }

  const todayWib = getWibTodayString();
  const totalSlots = dates.length * routes.length;

  onProgress?.({
    processedCount: 0,
    totalToSync: totalSlots,
    totalDays: dates.length,
    totalRoutes: routes.length,
    percent: 2,
    stepMessage: 'Memeriksa kelengkapan data di database (Smart Pre-Check)...',
  });

  // 2. Ambil seluruh laporan existing untuk rentang tanggal dalam 1 kueri efisien
  let existingReports: any[] = [];
  try {
    const { data: repData } = await supabase
      .from('daily_route_reports')
      .select('route_id, date, status, data_source, last_synced_at, total_passengers, total_km, realops_shift1, realops_shift2, is_fleet_confirmed_s1, is_fleet_confirmed_s2, fleet_status_shift1, fleet_status_shift2')
      .gte('date', startDate)
      .lte('date', endDate);
    if (repData) existingReports = repData;
  } catch (err) {
    console.warn('[regionalIngestionService] Gagal pre-fetch existing daily_route_reports:', err);
  }

  const existingMap = new Map<string, any>();
  existingReports.forEach((r) => {
    existingMap.set(`${r.date}_${r.route_id}`, r);
  });

  // 3. Evaluasi tugas: kumpulkan slot yang benar-benar perlu ditarik
  const tasksToSync: Array<{ dateStr: string; route: Route }> = [];
  let skippedFromApp = 0;
  let skippedExisting = 0;

  for (const dateStr of dates) {
    for (const route of routes) {
      const rep = existingMap.get(`${dateStr}_${route.id}`);
      const status = rep?.status;
      const isFromSheet = rep?.data_source === 'sheet_ingestion';

      // Hanya skip jika verified atau (submitted bukan dari sheet ingestion)
      if (!isForce && (status === 'verified' || (status === 'submitted' && !isFromSheet))) {
        skippedFromApp++;
      } else if (!isForce && isReportCompleteAndFresh(rep, dateStr, todayWib)) {
        skippedExisting++;
      } else {
        tasksToSync.push({ dateStr, route });
      }
    }
  }

  // Jika semua data sudah lengkap, selesai instan tanpa request ke Google Sheets!
  if (tasksToSync.length === 0) {
    onProgress?.({
      processedCount: totalSlots,
      totalToSync: totalSlots,
      totalDays: dates.length,
      totalRoutes: routes.length,
      percent: 100,
      stepMessage: 'Seluruh data pada periode ini sudah lengkap tersimpan di database.',
    });

    return {
      success: true,
      syncedFromSheet: 0,
      skippedFromApp,
      skippedExisting,
      totalCandidates: totalSlots,
      allUpToDate: true,
      errors: [],
    };
  }

  // 4. Ambil konfigurasi route_sheets untuk seluruh bulan terkait
  const monthYears = Array.from(
    new Set(dates.map((d) => `${d.split('-')[0]}-${parseInt(d.split('-')[1], 10)}`))
  );

  const routeSheetMap = new Map<string, RouteSheet>();
  for (const my of monthYears) {
    const [yStr, mStr] = my.split('-');
    const { data: sheets } = await supabase
      .from('route_sheets')
      .select('*')
      .eq('year', parseInt(yStr, 10))
      .eq('month', parseInt(mStr, 10));
    (sheets || []).forEach((s: RouteSheet) => {
      routeSheetMap.set(`${yStr}-${mStr}_${s.route_id}`, s);
    });
  }

  // 5. Eksekusi penarikan batching (2 per chunk) hanya untuk tasksToSync
  const allErrors: string[] = [];
  let totalSynced = 0;
  let processedCount = 0;

  const chunks = chunkArray(tasksToSync, 2);

  for (let c = 0; c < chunks.length; c++) {
    const currentChunk = chunks[c];
    const chunkDesc = currentChunk.map((t) => `${t.route.route_code} (${t.dateStr})`).join(', ');

    onProgress?.({
      currentRouteCode: currentChunk[0]?.route.route_code,
      processedCount,
      totalToSync: tasksToSync.length,
      totalDays: dates.length,
      totalRoutes: routes.length,
      percent: Math.min(98, Math.round(5 + (processedCount / tasksToSync.length) * 92)),
      stepMessage: `Mengambil data: ${chunkDesc}...`,
    });

    await Promise.all(
      currentChunk.map(async ({ dateStr, route }) => {
        const [yearStr, monthStr, dayStr] = dateStr.split('-');
        const monthNum = parseInt(monthStr, 10);
        const tabName = String(parseInt(dayStr, 10));
        const sheetKey = `${yearStr}-${monthNum}_${route.id}`;
        const sheet = routeSheetMap.get(sheetKey);

        if (!sheet || !sheet.spreadsheet_id) {
          allErrors.push(`[${dateStr}] ${route.route_code}: Konfigurasi spreadsheet belum terdaftar`);
          processedCount++;
          return;
        }

        try {
          let busResult;
          try {
            busResult = await getBusData(sheet.spreadsheet_id, tabName);
          } catch (firstErr: any) {
            const errStr = (firstErr?.message || '').toLowerCase();
            if (errStr.includes('429') || errStr.includes('too many') || errStr.includes('non-2xx')) {
              await sleep(2000);
              busResult = await getBusData(sheet.spreadsheet_id, tabName);
            } else {
              throw firstErr;
            }
          }

          const { data: busDataList, sheetSummary } = busResult;
          const rep = existingMap.get(`${dateStr}_${route.id}`);
          const { payload } = extractRouteDailyMetrics(
            route,
            busDataList,
            sheetSummary,
            dateStr,
            rep
          );

          const { error: upsertError } = await supabase
            .from('daily_route_reports')
            .upsert(payload, { onConflict: 'route_id,date' });

          if (upsertError) {
            allErrors.push(`[${dateStr}] ${route.route_code}: Gagal menyimpan (${upsertError.message})`);
          } else {
            totalSynced++;
          }
        } catch (fetchErr: any) {
          allErrors.push(`[${dateStr}] ${route.route_code}: ${fetchErr?.message || 'Gagal membaca sheet'}`);
        } finally {
          processedCount++;
        }
      })
    );

    if (c < chunks.length - 1) {
      await sleep(1000);
    }
  }

  onProgress?.({
    processedCount: tasksToSync.length,
    totalToSync: tasksToSync.length,
    totalDays: dates.length,
    totalRoutes: routes.length,
    percent: 100,
    stepMessage: `Sinkronisasi selesai! ${totalSynced} laporan baru berhasil ditarik.`,
  });

  return {
    success: totalSynced > 0 || skippedFromApp > 0 || skippedExisting > 0,
    syncedFromSheet: totalSynced,
    skippedFromApp,
    skippedExisting,
    totalCandidates: totalSlots,
    allUpToDate: tasksToSync.length === 0,
    errors: allErrors,
  };
}

/**
 * Menarik data dari satu spreadsheet rute untuk seluruh hari dalam rentang periode
 */
export async function ingestSingleRouteSummaryForRange(
  startDate: string,
  endDate: string,
  routeId: number
): Promise<{ success: boolean; syncedDays: number; errors: string[] }> {
  const dates = generateDateRange(startDate, endDate);
  if (dates.length === 0) {
    return { success: false, syncedDays: 0, errors: ['Rentang tanggal tidak valid'] };
  }
  if (dates.length === 1) {
    const res = await ingestSingleRouteSummary(dates[0], routeId);
    return {
      success: res.success,
      syncedDays: res.success ? 1 : 0,
      errors: res.error ? [res.error] : [],
    };
  }

  let syncedDays = 0;
  const errors: string[] = [];

  for (const dateStr of dates) {
    const res = await ingestSingleRouteSummary(dateStr, routeId);
    if (res.success) {
      syncedDays++;
    } else if (res.error) {
      errors.push(`[${dateStr}] ${res.error}`);
    }
  }

  return {
    success: syncedDays > 0,
    syncedDays,
    errors,
  };
}

