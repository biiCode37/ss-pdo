import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';
import { getBusData } from './googleSheets/core';
import { parseIndonesianNumber } from '../utils/numberUtils';
import type { Route, RouteSheet, FleetUnitStatusDetail } from '../types/supabase';
import type { BusData } from './googleSheets/types';

export interface IngestionResult {
  success: boolean;
  syncedFromSheet: number;
  skippedFromApp: number;
  errors: string[];
}

export interface IngestionProgress {
  currentRouteCode?: string;
  processedCount: number;
  totalToSync: number;
  percent: number;
  stepMessage: string;
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
  dateStr: string
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

    const trip1 = parseIndonesianNumber(bus.tripPergi);
    const trip2 = parseIndonesianNumber(bus.tripPulang);
    const tripTotal = trip1 + trip2;
    calcTrips += tripTotal;

    const ketUpper = (bus.keterangan || '').toUpperCase().trim();
    const isExplicitOff =
      ketUpper.includes('OFF') ||
      ketUpper.includes('LIBUR') ||
      ketUpper.includes('MOGOK') ||
      ketUpper.includes('RUSAK') ||
      ketUpper.includes('LAKA') ||
      ketUpper.includes('BAP') ||
      ketUpper.includes('SERVICE') ||
      ketUpper.includes('PERBAIKAN');

    // Unit aktif Shift 1: memiliki ritase/trip fisik di Shift 1, atau jika total trip > 0 & ada pergerakan KM/TOA, dan bukan status off/kendala
    const hasActivityS1 = (trip1 > 0 || (tripTotal > 0 && km1 > 0) || toaS1 > 0 || manS1 > 0) && !isExplicitOff;
    if (hasActivityS1) {
      activeBusesS1++;
    } else {
      nonSgoUnitsS1.push({
        unit: bus.unit,
        note: bus.keterangan ? bus.keterangan.trim() : (isExplicitOff ? 'OFF' : 'TIDAK OPERASI'),
        isOff: true,
      });
    }

    // Unit aktif Shift 2
    const hasActivityS2 = (trip2 > 0 || (tripTotal > 0 && km2 > 0) || toaS2 > 0 || manS2 > 0) && !isExplicitOff;
    if (hasActivityS2) {
      activeBusesS2++;
    } else {
      nonSgoUnitsS2.push({
        unit: bus.unit,
        note: bus.keterangan ? bus.keterangan.trim() : (isExplicitOff ? 'OFF' : 'TIDAK OPERASI'),
        isOff: true,
      });
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

  const defaultRenops = route.default_renops || 0;
  const renopsShift1 = defaultRenops;
  const renopsShift2 = defaultRenops;

  const realopsShift1 = rawBuses.length > 0 ? activeBusesS1 : 0;
  // Shift 2 dihitung aktif jika ada aktivitas atau penumpang di Shift 2
  const isShift2Started = (calcToaS2 + calcManualS2 + calcTrips) > 0 && activeBusesS2 > 0;
  const realopsShift2 = isShift2Started ? activeBusesS2 : (rawBuses.length > 0 && activeBusesS1 > 0 ? activeBusesS1 : 0);

  const maxRealops = Math.max(realopsShift1, realopsShift2);
  const achievementKm = (sheetSummary?.kmPerBus !== undefined && sheetSummary.kmPerBus > 0)
    ? sheetSummary.kmPerBus
    : (maxRealops > 0 ? totalKm / maxRealops : 0);

  // ponytail: 1 Ritase = 2 Trip (PP / Pulang-Pergi).
  const kmBaku = Number(route.km_baku) || 0;
  const totalRitase = kmBaku > 0 && totalKm > 0
    ? Number((totalKm / kmBaku).toFixed(1))
    : Number((calcTrips / 2).toFixed(1));

  const payload = {
    route_id: route.id,
    route_code: route.route_code,
    date: dateStr,
    renops_shift1: renopsShift1,
    realops_shift1: realopsShift1,
    renops_shift2: renopsShift2,
    realops_shift2: realopsShift2,
    toa_shift1: toaS1,
    manual_shift1: manS1,
    toa_shift2: toaS2,
    manual_shift2: manS2,
    total_passengers: totalPassengers,
    total_km: totalKm,
    achievement_km: achievementKm,
    total_trip: totalRitase,
    status: 'draft',
    data_source: 'sheet_ingestion',
    fleet_status_shift1: nonSgoUnitsS1,
    fleet_status_shift2: nonSgoUnitsS2,
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
  onProgress?: (progress: IngestionProgress) => void
): Promise<IngestionResult> {
  const errors: string[] = [];
  let syncedFromSheet = 0;
  let skippedFromApp = 0;

  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const tabName = String(day);

    // 1. Ambil seluruh master rute aktif
    const routes = await fetchRouteMasterList();
    if (!routes || routes.length === 0) {
      return { success: false, syncedFromSheet: 0, skippedFromApp: 0, errors: ['Daftar rute tidak ditemukan.'] };
    }

    // 2. Ambil laporan tanggal aktif di Supabase untuk Smart Skip
    const { data: existingReports } = await supabase
      .from('daily_route_reports')
      .select('id, route_id, route_code, status, date')
      .eq('date', dateStr);

    const reportStatusMap = new Map<number, string>();
    (existingReports || []).forEach((rep: any) => {
      reportStatusMap.set(rep.route_id, rep.status);
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

    // 4. Pisahkan rute: lewati yang sudah submit dari app, siapkan rute yang perlu ditarik dari sheet
    const routesToSync: Route[] = [];

    for (const route of routes) {
      const status = reportStatusMap.get(route.id);
      if (status === 'submitted' || status === 'verified') {
        skippedFromApp++;
      } else {
        routesToSync.push(route);
      }
    }

    if (routesToSync.length === 0) {
      onProgress?.({
        processedCount: 0,
        totalToSync: 0,
        percent: 100,
        stepMessage: 'Seluruh rute telah terisi melalui aplikasi.',
      });
      return { success: true, syncedFromSheet: 0, skippedFromApp, errors: [] };
    }

    onProgress?.({
      processedCount: 0,
      totalToSync: routesToSync.length,
      percent: 5,
      stepMessage: `Menyiapkan sinkronisasi ${routesToSync.length} rute...`,
    });

    let processedCount = 0;

    // 5. Eksekusi batching dengan ukuran chunk = 4 rute per putaran
    const chunks = chunkArray(routesToSync, 4);

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
            // Ambil data bus dan rangkuman harian dari spreadsheet rute individu
            const { data: busDataList, sheetSummary } = await getBusData(sheet.spreadsheet_id, tabName);

            const { payload } = extractRouteDailyMetrics(
              route,
              busDataList,
              sheetSummary,
              dateStr
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

      // Jeda halus antar batch untuk keselamatan rate limit Google API
      if (c < chunks.length - 1) {
        await sleep(250);
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
      errors,
    };
  } catch (globalErr: any) {
    console.warn('[regionalIngestionService] Exception:', globalErr);
    return {
      success: false,
      syncedFromSheet,
      skippedFromApp,
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

    const { data: busDataList, sheetSummary } = await getBusData(sheetData.spreadsheet_id, tabName);
    const { payload, activeBusesS1, nonSgoUnitsS1 } = extractRouteDailyMetrics(
      route,
      busDataList,
      sheetSummary,
      dateStr
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
