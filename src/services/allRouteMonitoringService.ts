import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';
import { fetchGlobalReportDailyMetrics } from './googleSheets';
import { extractSpreadsheetId } from '../utils/sheetIdentity';
import { TEXT_ERRORS } from '../constants/texts';
import type { Route, DailyRouteReport, DailyUnitSummary, FleetUnitStatusDetail } from '../types/supabase';

export const SUPERVISORS = [
  'Ranto Lumban Toruan',
  'Abdul Manan',
  'Moamar Z.A. Mahu'
] as const;

export interface RegionalRouteItem {
  id: number;
  reportId?: number;
  routeCode: string;
  routeName: string;
  operatorName: string;
  isLooping: boolean;
  kmBaku: number;
  targetHk: number;
  bestRecord: number;
  supervisorName: string;
  defaultRenops: number;
  // Daily input stats
  renopsShift1: number;
  realopsShift1: number;
  renopsShift2: number;
  realopsShift2: number;
  totalRenops: number;
  totalRealops: number;
  headwayFastest: number;
  headwaySlowest: number;
  trafficJamSpots: string[];
  operationalIssues: string;
  status: 'draft' | 'submitted' | 'verified' | 'empty';
  // Fleet status snapshot & confirmation
  fleetStatusShift1?: FleetUnitStatusDetail[];
  fleetStatusShift2?: FleetUnitStatusDetail[];
  isFleetConfirmedS1?: boolean;
  isFleetConfirmedS2?: boolean;
  fleetConfirmedS1At?: string;
  fleetConfirmedS2At?: string;
  // Bus summaries stats
  todayPassengers: number;
  yesterdayPassengers: number;
  lastWeekPassengers: number;
  totalKm: number;
  achievementKm: number; // KM/Bus
  totalTrips?: number;
  toaShift1: number;
  manualShift1: number;
  totalShift1: number;
  toaShift2: number;
  manualShift2: number;
  totalShift2: number;
  // 21 Metrik Operasional & Provenance
  dataSource?: 'app_input' | 'sheet_ingestion' | 'empty';
  targetPercentage?: number;
  targetPassengersPerKm?: number;
  passengersPerKm?: number;
  passengersPerKmPercentage?: number;
  tripsPerBus?: number;
  passengersPerBus?: number;
}

export interface RegionalMonitoringResult {
  date: string;
  yesterdayDate: string;
  lastWeekDate: string;
  routes: RegionalRouteItem[];
  // Totals
  totalRenops: number;
  totalRealops: number;
  totalTodayPassengers: number;
  totalTargetPassengers: number;
  totalYesterdayPassengers: number;
  totalLastWeekPassengers: number;
  totalKm: number;
  averageKmPerBus: number;
  totalTrips?: number;
  averageTripsPerBus?: number;
  // Shift Totals
  tomShift1: number;
  manualShift1: number;
  totalShift1: number;
  yesterdayShift1: number;
  lastWeekShift1: number;
  tomShift2: number;
  manualShift2: number;
  totalShift2: number;
  yesterdayShift2: number;
  lastWeekShift2: number;
  // Status counts
  submittedCount: number;
  verifiedCount: number;
  draftCount: number;
  emptyCount: number;
  totalRoutesCount: number;
  // Provenance counts
  appInputCount?: number;
  sheetSyncCount?: number;
  emptySourceCount?: number;
}

/**
 * Menghitung tanggal relatif (offset dalam jumlah hari) dari tanggal acuan ISO
 */
export function getRelativeDate(dateStr: string, offsetDays: number): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parsing string YYYY-MM-DD menjadi { year, month, day } numerik
 */
function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/**
 * Mengambil data komprehensif monitoring seluruh rute untuk tanggal aktif
 * beserta riwayat komparasi H-1 (Kemarin) dan H-7 (Minggu Lalu).
 */
export async function fetchRegionalMonitoringData(
  dateStr: string
): Promise<RegionalMonitoringResult> {
  const yesterdayDate = getRelativeDate(dateStr, -1);
  const lastWeekDate = getRelativeDate(dateStr, -7);

  // 1. Ambil daftar master rute
  const routes = await fetchRouteMasterList();

  // 2. Ambil daily_route_reports untuk 3 tanggal (H, H-1, H-7)
  let reports: DailyRouteReport[] = [];
  try {
    const { data: reportData } = await supabase
      .from('daily_route_reports')
      .select('*')
      .in('date', [dateStr, yesterdayDate, lastWeekDate]);
    if (reportData) reports = reportData as DailyRouteReport[];
  } catch (err) {
    console.warn('[allRouteMonitoringService] Gagal fetch daily_route_reports:', err);
  }

  // 3. Ambil daily_unit_summaries untuk 3 tanggal
  const pToday = parseDateParts(dateStr);
  const pYest = parseDateParts(yesterdayDate);
  const pLast = parseDateParts(lastWeekDate);

  let summaries: DailyUnitSummary[] = [];
  try {
    const { data: summaryData } = await supabase
      .from('daily_unit_summaries')
      .select('*')
      .or(
        `and(year.eq.${pToday.year},month.eq.${pToday.month},day.eq.${pToday.day}),` +
        `and(year.eq.${pYest.year},month.eq.${pYest.month},day.eq.${pYest.day}),` +
        `and(year.eq.${pLast.year},month.eq.${pLast.month},day.eq.${pLast.day})`
      );
    if (summaryData) summaries = summaryData as DailyUnitSummary[];
  } catch (err) {
    console.warn('[allRouteMonitoringService] Gagal fetch daily_unit_summaries:', err);
  }

  // 4. Petakan dan gabungkan per rute
  const routeItems: RegionalRouteItem[] = routes.map((r: Route) => {
    const code = r.route_code;

    // Laporan hari ini, kemarin, dan minggu lalu
    const todayReport = reports.find((rep) => rep.route_code === code && rep.date === dateStr);
    const yesterdayReport = reports.find((rep) => rep.route_code === code && rep.date === yesterdayDate);
    const lastWeekReport = reports.find((rep) => rep.route_code === code && rep.date === lastWeekDate);

    // Filter summaries per tanggal (sebagai fallback jika laporan metrik belum tersinkron)
    const todaySums = summaries.filter(
      (s) => s.route_code === code && s.year === pToday.year && s.month === pToday.month && s.day === pToday.day
    );
    const yestSums = summaries.filter(
      (s) => s.route_code === code && s.year === pYest.year && s.month === pYest.month && s.day === pYest.day
    );
    const lastSums = summaries.filter(
      (s) => s.route_code === code && s.year === pLast.year && s.month === pLast.month && s.day === pLast.day
    );

    // Akumulasi fallback dari unit summaries
    const sumTodayPassengers = todaySums.reduce((acc, cur) => acc + (Number(cur.total_passengers) || 0), 0);
    const sumYesterdayPassengers = yestSums.reduce((acc, cur) => acc + (Number(cur.total_passengers) || 0), 0);
    const sumLastWeekPassengers = lastSums.reduce((acc, cur) => acc + (Number(cur.total_passengers) || 0), 0);

    const sumTotalKm = todaySums.reduce((acc, cur) => acc + (Number(cur.total_km) || 0), 0);
    const sumToaShift1 = todaySums.reduce((acc, cur) => acc + (Number(cur.toa_shift1) || 0), 0);
    const sumManualShift1 = todaySums.reduce((acc, cur) => acc + (Number(cur.manual_shift1) || 0), 0);
    const sumToaShift2 = todaySums.reduce((acc, cur) => acc + (Number(cur.toa_shift2) || 0), 0);
    const sumManualShift2 = todaySums.reduce((acc, cur) => acc + (Number(cur.manual_shift2) || 0), 0);

    // Prioritaskan nilai capaian dari daily_route_reports jika tersedia
    const todayPassengers = (todayReport?.total_passengers !== undefined && todayReport.total_passengers !== null && Number(todayReport.total_passengers) > 0)
      ? Number(todayReport.total_passengers)
      : sumTodayPassengers;

    const yesterdayPassengers = (yesterdayReport?.total_passengers !== undefined && yesterdayReport.total_passengers !== null && Number(yesterdayReport.total_passengers) > 0)
      ? Number(yesterdayReport.total_passengers)
      : sumYesterdayPassengers;

    const lastWeekPassengers = (lastWeekReport?.total_passengers !== undefined && lastWeekReport.total_passengers !== null && Number(lastWeekReport.total_passengers) > 0)
      ? Number(lastWeekReport.total_passengers)
      : sumLastWeekPassengers;

    const totalKm = (todayReport?.total_km !== undefined && todayReport.total_km !== null && Number(todayReport.total_km) > 0)
      ? Number(todayReport.total_km)
      : sumTotalKm;

    const toaShift1 = (todayReport?.toa_shift1 !== undefined && todayReport.toa_shift1 !== null)
      ? Number(todayReport.toa_shift1)
      : sumToaShift1;
    const manualShift1 = (todayReport?.manual_shift1 !== undefined && todayReport.manual_shift1 !== null)
      ? Number(todayReport.manual_shift1)
      : sumManualShift1;
    const totalShift1 = toaShift1 + manualShift1;

    const toaShift2 = (todayReport?.toa_shift2 !== undefined && todayReport.toa_shift2 !== null)
      ? Number(todayReport.toa_shift2)
      : sumToaShift2;
    const manualShift2 = (todayReport?.manual_shift2 !== undefined && todayReport.manual_shift2 !== null)
      ? Number(todayReport.manual_shift2)
      : sumManualShift2;
    const totalShift2 = toaShift2 + manualShift2;

    const renopsS1 = todayReport?.renops_shift1 ?? (r.default_renops || 0);
    const realopsS1 = todayReport?.realops_shift1 ?? 0;
    const renopsS2 = todayReport?.renops_shift2 ?? (r.default_renops || 0);
    const realopsS2 = todayReport?.realops_shift2 ?? 0;

    const totalRenops = renopsS1 || renopsS2 ? Math.max(renopsS1, renopsS2) : (r.default_renops || 0);
    const totalRealops = realopsS1 || realopsS2 ? Math.max(realopsS1, realopsS2) : 0;

    const achievementKm = (todayReport?.achievement_km !== undefined && todayReport.achievement_km !== null && Number(todayReport.achievement_km) > 0)
      ? Number(todayReport.achievement_km)
      : (totalRealops > 0 ? totalKm / totalRealops : 0);

    // Tentukan status kelengkapan
    let status: 'draft' | 'submitted' | 'verified' | 'empty' = 'empty';
    if (todayReport) {
      status = todayReport.status || 'draft';
    } else if (todayPassengers > 0) {
      status = 'draft';
    }

    // Hitung 21 Kolom & Rasio Murni
    const targetHk = Number(r.target_hk) || 0;
    const targetPercentage = targetHk > 0 ? (todayPassengers / targetHk) * 100 : 0;
    const targetPassengersPerKm = 1.5;
    const passengersPerKm = totalKm > 0 ? todayPassengers / totalKm : 0;
    const passengersPerKmPercentage = totalKm > 0 ? (passengersPerKm / 1.5) * 100 : 0;
    const totalTrips = todayReport?.total_trip || 0;
    const tripsPerBus = totalRealops > 0 ? totalTrips / totalRealops : 0;
    const passengersPerBus = totalRealops > 0 ? todayPassengers / totalRealops : 0;

    // Tentukan asal data (provenance)
    let dataSource: 'app_input' | 'sheet_ingestion' | 'empty' = 'empty';
    if (todayReport?.data_source) {
      dataSource = todayReport.data_source;
    } else if (todayReport?.status === 'submitted' || todayReport?.status === 'verified') {
      dataSource = 'app_input';
    } else if (todayPassengers > 0) {
      dataSource = 'app_input';
    }

    return {
      id: r.id,
      reportId: todayReport?.id,
      routeCode: r.route_code,
      routeName: r.route_name,
      operatorName: r.operator_name || 'Mikrotrans',
      isLooping: !!r.is_looping,
      kmBaku: Number(r.km_baku) || 0,
      targetHk,
      bestRecord: Number(r.best_record) || 0,
      supervisorName: r.supervisor_name || 'Pengawas Wilayah',
      defaultRenops: Number(r.default_renops) || 0,
      renopsShift1: renopsS1,
      realopsShift1: realopsS1,
      renopsShift2: renopsS2,
      realopsShift2: realopsS2,
      totalRenops,
      totalRealops,
      headwayFastest: todayReport?.headway_fastest || 3,
      headwaySlowest: todayReport?.headway_slowest || 10,
      trafficJamSpots: todayReport?.traffic_jam_spots || r.default_traffic_jam_spots || [],
      operationalIssues: todayReport?.operational_issues || '',
      status,
      fleetStatusShift1: todayReport?.fleet_status_shift1 || [],
      fleetStatusShift2: todayReport?.fleet_status_shift2 || [],
      isFleetConfirmedS1: !!todayReport?.is_fleet_confirmed_s1,
      isFleetConfirmedS2: !!todayReport?.is_fleet_confirmed_s2,
      fleetConfirmedS1At: todayReport?.fleet_confirmed_s1_at,
      fleetConfirmedS2At: todayReport?.fleet_confirmed_s2_at,
      todayPassengers,
      yesterdayPassengers,
      lastWeekPassengers,
      totalKm,
      achievementKm,
      totalTrips,
      toaShift1,
      manualShift1,
      totalShift1,
      toaShift2,
      manualShift2,
      totalShift2,
      dataSource,
      targetPercentage,
      targetPassengersPerKm,
      passengersPerKm,
      passengersPerKmPercentage,
      tripsPerBus,
      passengersPerBus
    };
  });

  // 5. Hitung Agregat Wilayah
  const totals = calculateRegionalTotals(routeItems, summaries, pYest, pLast, reports, yesterdayDate, lastWeekDate);

  return {
    date: dateStr,
    yesterdayDate,
    lastWeekDate,
    routes: routeItems,
    ...totals
  };
}

/**
 * Kalkulasi agregasi statistik total wilayah
 */
export function calculateRegionalTotals(
  routes: RegionalRouteItem[],
  summaries: DailyUnitSummary[],
  pYest: { year: number; month: number; day: number },
  pLast: { year: number; month: number; day: number },
  reports?: DailyRouteReport[],
  yesterdayDate?: string,
  lastWeekDate?: string
) {
  const totalRenops = routes.reduce((acc, r) => acc + r.totalRenops, 0);
  const totalRealops = routes.reduce((acc, r) => acc + r.totalRealops, 0);
  const totalTodayPassengers = routes.reduce((acc, r) => acc + r.todayPassengers, 0);
  const totalTargetPassengers = routes.reduce((acc, r) => acc + r.targetHk, 0);
  const totalYesterdayPassengers = routes.reduce((acc, r) => acc + r.yesterdayPassengers, 0);
  const totalLastWeekPassengers = routes.reduce((acc, r) => acc + r.lastWeekPassengers, 0);
  const totalKm = routes.reduce((acc, r) => acc + r.totalKm, 0);
  const averageKmPerBus = totalRealops > 0 ? totalKm / totalRealops : 0;
  const totalTrips = routes.reduce((acc, r) => acc + (r.totalTrips || 0), 0);
  const averageTripsPerBus = totalRealops > 0 ? totalTrips / totalRealops : 0;

  const tomShift1 = routes.reduce((acc, r) => acc + r.toaShift1, 0);
  const manualShift1 = routes.reduce((acc, r) => acc + r.manualShift1, 0);
  const totalShift1 = tomShift1 + manualShift1;

  const tomShift2 = routes.reduce((acc, r) => acc + r.toaShift2, 0);
  const manualShift2 = routes.reduce((acc, r) => acc + r.manualShift2, 0);
  const totalShift2 = tomShift2 + manualShift2;

  // Riwayat Shift Kemarin & Minggu Lalu (prioritaskan laporan harian jika ada, fallback ke summaries)
  const yestReports = reports?.filter(r => r.date === yesterdayDate) || [];
  const lastReports = reports?.filter(r => r.date === lastWeekDate) || [];

  const yestSums = summaries.filter(
    (s) => s.year === pYest.year && s.month === pYest.month && s.day === pYest.day
  );
  const lastSums = summaries.filter(
    (s) => s.year === pLast.year && s.month === pLast.month && s.day === pLast.day
  );

  const yestRepS1 = yestReports.reduce((acc, r) => acc + (Number(r.toa_shift1) || 0) + (Number(r.manual_shift1) || 0), 0);
  const yestSumS1 = yestSums.reduce((acc, s) => acc + (Number(s.toa_shift1) || 0) + (Number(s.manual_shift1) || 0), 0);
  const yesterdayShift1 = yestRepS1 > 0 ? yestRepS1 : yestSumS1;

  const yestRepS2 = yestReports.reduce((acc, r) => acc + (Number(r.toa_shift2) || 0) + (Number(r.manual_shift2) || 0), 0);
  const yestSumS2 = yestSums.reduce((acc, s) => acc + (Number(s.toa_shift2) || 0) + (Number(s.manual_shift2) || 0), 0);
  const yesterdayShift2 = yestRepS2 > 0 ? yestRepS2 : yestSumS2;

  const lastRepS1 = lastReports.reduce((acc, r) => acc + (Number(r.toa_shift1) || 0) + (Number(r.manual_shift1) || 0), 0);
  const lastSumS1 = lastSums.reduce((acc, s) => acc + (Number(s.toa_shift1) || 0) + (Number(s.manual_shift1) || 0), 0);
  const lastWeekShift1 = lastRepS1 > 0 ? lastRepS1 : lastSumS1;

  const lastRepS2 = lastReports.reduce((acc, r) => acc + (Number(r.toa_shift2) || 0) + (Number(r.manual_shift2) || 0), 0);
  const lastSumS2 = lastSums.reduce((acc, s) => acc + (Number(s.toa_shift2) || 0) + (Number(s.manual_shift2) || 0), 0);
  const lastWeekShift2 = lastRepS2 > 0 ? lastRepS2 : lastSumS2;

  const submittedCount = routes.filter((r) => r.status === 'submitted' || r.status === 'verified').length;
  const verifiedCount = routes.filter((r) => r.status === 'verified').length;
  const draftCount = routes.filter((r) => r.status === 'draft').length;
  const emptyCount = routes.filter((r) => r.status === 'empty').length;

  const appInputCount = routes.filter((r) => r.dataSource === 'app_input').length;
  const sheetSyncCount = routes.filter((r) => r.dataSource === 'sheet_ingestion').length;
  const emptySourceCount = routes.filter((r) => !r.dataSource || r.dataSource === 'empty').length;

  return {
    totalRenops,
    totalRealops,
    totalTodayPassengers,
    totalTargetPassengers,
    totalYesterdayPassengers,
    totalLastWeekPassengers,
    totalKm,
    averageKmPerBus,
    totalTrips,
    averageTripsPerBus,
    tomShift1,
    manualShift1,
    totalShift1,
    yesterdayShift1,
    lastWeekShift1,
    tomShift2,
    manualShift2,
    totalShift2,
    yesterdayShift2,
    lastWeekShift2,
    submittedCount,
    verifiedCount,
    draftCount,
    emptyCount,
    totalRoutesCount: routes.length,
    appInputCount,
    sheetSyncCount,
    emptySourceCount
  };
}

/**
 * Melakukan sinkronisasi massal data capaian 18 rute dari Spreadsheet Global Wilayah ke database.
 * Menyimpan data ke tabel `daily_route_reports` (1 rute = 1 baris per tanggal).
 */
export async function syncRegionalDailyFromGlobalSheet(
  dateStr: string,
  spreadsheetIdOrUrl: string,
  sheetName: string
): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  const errors: string[] = [];
  try {
    const parts = dateStr.split('-').map(Number);
    const targetDay = parts[2];
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;

    const metricsMap = await fetchGlobalReportDailyMetrics(
      spreadsheetId,
      sheetName,
      targetDay
    );

    if (metricsMap.size === 0) {
      return {
        success: false,
        syncedCount: 0,
        errors: [`Tidak ditemukan blok data untuk tanggal ${targetDay} pada lembar ${sheetName}`],
      };
    }

    const routes = await fetchRouteMasterList();
    let syncedCount = 0;

    for (const route of routes) {
      const metric = metricsMap.get(route.route_code);
      if (!metric) continue;

      try {
        const payload = {
          route_id: route.id,
          route_code: route.route_code,
          date: dateStr,
          renops_shift1: metric.renops,
          realops_shift1: metric.realops,
          renops_shift2: metric.renops,
          realops_shift2: metric.realops,
          toa_shift1: metric.toaShift1,
          manual_shift1: metric.manualShift1,
          toa_shift2: metric.toaShift2,
          manual_shift2: metric.manualShift2,
          total_passengers: metric.totalPassengers,
          total_km: metric.kmTempuh,
          achievement_km: metric.kmPerBus,
          total_trip: metric.totalRitase,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('daily_route_reports')
          .upsert(payload, { onConflict: 'route_id,date' });

        if (error) {
          console.warn(`[allRouteMonitoringService] Gagal menyimpan rute ${route.route_code}:`, error);
          if (error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
            errors.push(TEXT_ERRORS.SCHEMA_MIGRATION_REQUIRED);
            break; // Hindari request gagal berulang jika kolom database belum dimigrasi
          }
          errors.push(`Gagal menyimpan rute ${route.route_code}: ${error.message}`);
        } else {
          syncedCount++;
        }
      } catch (err: any) {
        console.warn(`[allRouteMonitoringService] Exception rute ${route.route_code}:`, err);
        errors.push(`Gagal memproses rute ${route.route_code}`);
      }
    }

    return {
      success: syncedCount > 0,
      syncedCount,
      errors,
    };
  } catch (err: any) {
    console.warn('[allRouteMonitoringService] Exception syncRegionalDailyFromGlobalSheet:', err);
    return {
      success: false,
      syncedCount: 0,
      errors: [err?.message || 'Terjadi kesalahan saat menyinkronkan data spreadsheet global'],
    };
  }
}
