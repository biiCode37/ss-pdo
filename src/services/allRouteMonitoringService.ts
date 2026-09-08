import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';
import type { Route, DailyRouteReport, DailyUnitSummary } from '../types/supabase';

export interface RegionalRouteItem {
  id: number;
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
  // Bus summaries stats
  todayPassengers: number;
  yesterdayPassengers: number;
  lastWeekPassengers: number;
  totalKm: number;
  achievementKm: number; // KM/Bus
  toaShift1: number;
  manualShift1: number;
  totalShift1: number;
  toaShift2: number;
  manualShift2: number;
  totalShift2: number;
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

    // Laporan hari ini
    const todayReport = reports.find((rep) => rep.route_code === code && rep.date === dateStr);

    // Filter summaries per tanggal
    const todaySums = summaries.filter(
      (s) => s.route_code === code && s.year === pToday.year && s.month === pToday.month && s.day === pToday.day
    );
    const yestSums = summaries.filter(
      (s) => s.route_code === code && s.year === pYest.year && s.month === pYest.month && s.day === pYest.day
    );
    const lastSums = summaries.filter(
      (s) => s.route_code === code && s.year === pLast.year && s.month === pLast.month && s.day === pLast.day
    );

    // Hitung akumulasi penumpang & KM
    const todayPassengers = todaySums.reduce((acc, cur) => acc + (Number(cur.total_passengers) || 0), 0);
    const yesterdayPassengers = yestSums.reduce((acc, cur) => acc + (Number(cur.total_passengers) || 0), 0);
    const lastWeekPassengers = lastSums.reduce((acc, cur) => acc + (Number(cur.total_passengers) || 0), 0);

    const totalKm = todaySums.reduce((acc, cur) => acc + (Number(cur.total_km) || 0), 0);
    const toaShift1 = todaySums.reduce((acc, cur) => acc + (Number(cur.toa_shift1) || 0), 0);
    const manualShift1 = todaySums.reduce((acc, cur) => acc + (Number(cur.manual_shift1) || 0), 0);
    const totalShift1 = toaShift1 + manualShift1;

    const toaShift2 = todaySums.reduce((acc, cur) => acc + (Number(cur.toa_shift2) || 0), 0);
    const manualShift2 = todaySums.reduce((acc, cur) => acc + (Number(cur.manual_shift2) || 0), 0);
    const totalShift2 = toaShift2 + manualShift2;

    const renopsS1 = todayReport?.renops_shift1 ?? (r.default_renops || 0);
    const realopsS1 = todayReport?.realops_shift1 ?? 0;
    const renopsS2 = todayReport?.renops_shift2 ?? (r.default_renops || 0);
    const realopsS2 = todayReport?.realops_shift2 ?? 0;

    const totalRenops = renopsS1 || renopsS2 ? Math.max(renopsS1, renopsS2) : (r.default_renops || 0);
    const totalRealops = realopsS1 || realopsS2 ? Math.max(realopsS1, realopsS2) : 0;

    const achievementKm = totalRealops > 0 ? totalKm / totalRealops : 0;

    // Tentukan status kelengkapan
    let status: 'draft' | 'submitted' | 'verified' | 'empty' = 'empty';
    if (todayReport) {
      status = todayReport.status || 'draft';
    } else if (todaySums.length > 0 && todayPassengers > 0) {
      status = 'draft';
    }

    return {
      id: r.id,
      routeCode: r.route_code,
      routeName: r.route_name,
      operatorName: r.operator_name || 'Mikrotrans',
      isLooping: !!r.is_looping,
      kmBaku: Number(r.km_baku) || 0,
      targetHk: Number(r.target_hk) || 0,
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
      todayPassengers,
      yesterdayPassengers,
      lastWeekPassengers,
      totalKm,
      achievementKm,
      toaShift1,
      manualShift1,
      totalShift1,
      toaShift2,
      manualShift2,
      totalShift2
    };
  });

  // 5. Hitung Agregat Wilayah
  const totals = calculateRegionalTotals(routeItems, summaries, pYest, pLast);

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
  pLast: { year: number; month: number; day: number }
) {
  const totalRenops = routes.reduce((acc, r) => acc + r.totalRenops, 0);
  const totalRealops = routes.reduce((acc, r) => acc + r.totalRealops, 0);
  const totalTodayPassengers = routes.reduce((acc, r) => acc + r.todayPassengers, 0);
  const totalTargetPassengers = routes.reduce((acc, r) => acc + r.targetHk, 0);
  const totalYesterdayPassengers = routes.reduce((acc, r) => acc + r.yesterdayPassengers, 0);
  const totalLastWeekPassengers = routes.reduce((acc, r) => acc + r.lastWeekPassengers, 0);
  const totalKm = routes.reduce((acc, r) => acc + r.totalKm, 0);
  const averageKmPerBus = totalRealops > 0 ? totalKm / totalRealops : 0;

  const tomShift1 = routes.reduce((acc, r) => acc + r.toaShift1, 0);
  const manualShift1 = routes.reduce((acc, r) => acc + r.manualShift1, 0);
  const totalShift1 = tomShift1 + manualShift1;

  const tomShift2 = routes.reduce((acc, r) => acc + r.toaShift2, 0);
  const manualShift2 = routes.reduce((acc, r) => acc + r.manualShift2, 0);
  const totalShift2 = tomShift2 + manualShift2;

  // Riwayat Shift Kemarin & Minggu Lalu
  const yestSums = summaries.filter(
    (s) => s.year === pYest.year && s.month === pYest.month && s.day === pYest.day
  );
  const lastSums = summaries.filter(
    (s) => s.year === pLast.year && s.month === pLast.month && s.day === pLast.day
  );

  const yesterdayShift1 = yestSums.reduce(
    (acc, s) => acc + (Number(s.toa_shift1) || 0) + (Number(s.manual_shift1) || 0),
    0
  );
  const yesterdayShift2 = yestSums.reduce(
    (acc, s) => acc + (Number(s.toa_shift2) || 0) + (Number(s.manual_shift2) || 0),
    0
  );

  const lastWeekShift1 = lastSums.reduce(
    (acc, s) => acc + (Number(s.toa_shift1) || 0) + (Number(s.manual_shift1) || 0),
    0
  );
  const lastWeekShift2 = lastSums.reduce(
    (acc, s) => acc + (Number(s.toa_shift2) || 0) + (Number(s.manual_shift2) || 0),
    0
  );

  const submittedCount = routes.filter((r) => r.status === 'submitted' || r.status === 'verified').length;
  const verifiedCount = routes.filter((r) => r.status === 'verified').length;
  const draftCount = routes.filter((r) => r.status === 'draft').length;
  const emptyCount = routes.filter((r) => r.status === 'empty').length;

  return {
    totalRenops,
    totalRealops,
    totalTodayPassengers,
    totalTargetPassengers,
    totalYesterdayPassengers,
    totalLastWeekPassengers,
    totalKm,
    averageKmPerBus,
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
    totalRoutesCount: routes.length
  };
}
