import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';
import { fetchGlobalReportDailyMetrics } from './googleSheets';
import { extractSpreadsheetId } from '../utils/sheetIdentity';
import { getRenopsForDate } from '../utils/holidayUtils';
import { sortRoutesByCode } from '../utils/routeSorting';
import { TEXT_ERRORS } from '../constants/texts';
import type { Route, DailyRouteReport, DailyUnitSummary, FleetUnitStatusDetail, DailyFleetNonSgoUnit, DailyFleetShiftWithUnits } from '../types/supabase';

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
  bestRecordDate?: string;
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
  // Aliases & PP metrics
  targetPax?: number;
  paxPercentage?: number;
  kmPerBus?: number;
  targetPaxPerKm?: number;
  paxPerKm?: number;
  paxPerKmPercentage?: number;
  totalRitasePp?: number;
  ritasePerBus?: number;
  paxPerBus?: number;
}

export type MonitoringPeriodMode = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface MonitoringPeriodFilter {
  mode: MonitoringPeriodMode;
  date: string;
  startDate: string;
  endDate: string;
  label: string;
}

export interface SupervisorTeamSummary {
  id: string; // 'RANTO' | 'ABDUL' | 'MOAMAR'
  name: string;
  routes: RegionalRouteItem[];
  totalRenops: number;
  totalRealops: number;
  totalKm: number;
  averageKmPerBus: number;
  totalTodayPassengers: number;
  totalTargetPassengers: number;
  targetAchievementPercentage: number;
  totalRitasePp: number;
  averageRitasePerBus: number;
  passengersPerKm: number;
  passengersPerBus: number;
}

export const SUPERVISOR_TEAMS = [
  { id: 'RANTO', name: 'Ranto Lumban Toruan', match: (n: string) => (n || '').toUpperCase().includes('RANTO') },
  { id: 'ABDUL', name: 'Abdul Manan', match: (n: string) => (n || '').toUpperCase().includes('ABDUL') },
  { id: 'MOAMAR', name: 'Moamar Z.A. Mahu', match: (n: string) => (n || '').toUpperCase().includes('MOAMAR') },
] as const;

export function calculateSupervisorSummaries(routes: RegionalRouteItem[]): SupervisorTeamSummary[] {
  return SUPERVISOR_TEAMS.map((team) => {
    const teamRoutes = sortRoutesByCode(routes.filter((r) => team.match(r.supervisorName)));
    const totalRenops = teamRoutes.reduce((acc, r) => acc + (r.totalRenops || 0), 0);
    const totalRealops = teamRoutes.reduce((acc, r) => acc + (r.totalRealops || 0), 0);
    const totalKm = teamRoutes.reduce((acc, r) => acc + (r.totalKm || 0), 0);
    const averageKmPerBus = totalRealops > 0 ? totalKm / totalRealops : 0;
    const totalTodayPassengers = teamRoutes.reduce((acc, r) => acc + (r.todayPassengers || 0), 0);
    const totalTargetPassengers = teamRoutes.reduce((acc, r) => acc + (r.targetHk || 0), 0);
    const targetAchievementPercentage = totalTargetPassengers > 0
      ? (totalTodayPassengers / totalTargetPassengers) * 100
      : 0;
    const totalRitasePp = teamRoutes.reduce((acc, r) => {
      if (r.totalRitasePp !== undefined && r.totalRitasePp !== null) return acc + r.totalRitasePp;
      if (r.kmBaku > 0) return acc + (r.totalKm / r.kmBaku);
      return acc + ((r.totalTrips || 0) / 2);
    }, 0);
    const averageRitasePerBus = totalRealops > 0 ? totalRitasePp / totalRealops : 0;
    const passengersPerKm = totalKm > 0 ? totalTodayPassengers / totalKm : 0;
    const passengersPerBus = totalRealops > 0 ? totalTodayPassengers / totalRealops : 0;

    return {
      id: team.id,
      name: team.name,
      routes: teamRoutes,
      totalRenops,
      totalRealops,
      totalKm,
      averageKmPerBus,
      totalTodayPassengers,
      totalTargetPassengers,
      targetAchievementPercentage,
      totalRitasePp,
      averageRitasePerBus,
      passengersPerKm,
      passengersPerBus,
    };
  });
}

export interface RegionalMonitoringResult {
  date: string;
  yesterdayDate: string;
  lastWeekDate: string;
  routes: RegionalRouteItem[];
  supervisorSummaries?: SupervisorTeamSummary[];
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

  // 2. Ambil daily_route_reports untuk 3 tanggal (H, H-1, H-7) dengan silent retry (mitigasi fluktuasi QUIC/jaringan)
  let reports: DailyRouteReport[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data: reportData, error } = await supabase
        .from('daily_route_reports')
        .select('*')
        .in('date', [dateStr, yesterdayDate, lastWeekDate]);
      if (!error && reportData) {
        reports = reportData as DailyRouteReport[];
        break;
      }
      if (error && attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      } else {
        console.warn('[allRouteMonitoringService] Gagal fetch daily_route_reports:', err);
      }
    }
  }

  // 3. Ambil daily_unit_summaries untuk 3 tanggal dengan field projection & silent retry (mitigasi QUIC UDP drop)
  const pToday = parseDateParts(dateStr);
  const pYest = parseDateParts(yesterdayDate);
  const pLast = parseDateParts(lastWeekDate);

  let summaries: DailyUnitSummary[] = [];
  const unitSummaryColumns = 'route_code, year, month, day, total_passengers, total_km, toa_shift1, manual_shift1, toa_shift2, manual_shift2';

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data: summaryData, error } = await supabase
        .from('daily_unit_summaries')
        .select(unitSummaryColumns)
        .or(
          `and(year.eq.${pToday.year},month.eq.${pToday.month},day.eq.${pToday.day}),` +
          `and(year.eq.${pYest.year},month.eq.${pYest.month},day.eq.${pYest.day}),` +
          `and(year.eq.${pLast.year},month.eq.${pLast.month},day.eq.${pLast.day})`
        );
      if (!error && summaryData) {
        summaries = summaryData as DailyUnitSummary[];
        break;
      }
      if (error && attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      } else {
        console.warn('[allRouteMonitoringService] Gagal fetch daily_unit_summaries:', err);
      }
    }
  }

  // 3b. Ambil daily_fleet_shifts untuk tanggal aktif (fallback defensif armada A2) beserta non_sgo_units dengan silent retry
  let fleetShifts: DailyFleetShiftWithUnits[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data: fsData, error } = await supabase
        .from('daily_fleet_shifts')
        .select('*')
        .eq('date', dateStr);
      if (!error && fsData) {
        const shiftIds = fsData.map((s: any) => s.id);
        const unitsByShiftId: Record<number, DailyFleetNonSgoUnit[]> = {};
        if (shiftIds.length > 0) {
          const { data: unitsData, error: unitsError } = await supabase
            .from('daily_fleet_non_sgo_units')
            .select('*')
            .in('fleet_shift_id', shiftIds);
          if (!unitsError && unitsData) {
            for (const u of unitsData) {
              if (!unitsByShiftId[u.fleet_shift_id]) {
                unitsByShiftId[u.fleet_shift_id] = [];
              }
              unitsByShiftId[u.fleet_shift_id].push(u as DailyFleetNonSgoUnit);
            }
          }
        }
        fleetShifts = fsData.map((s: any) => ({
          ...s,
          non_sgo_units: unitsByShiftId[s.id] || [],
        })) as DailyFleetShiftWithUnits[];
        break;
      }
      if (error && attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      } else {
        console.warn('[allRouteMonitoringService] Gagal fetch daily_fleet_shifts:', err);
      }
    }
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

    // Fallback defensif dari daily_fleet_shifts jika daily_route_reports belum disinkronkan
    const fsS1 = fleetShifts.find((fs) => fs.route_id === r.id && fs.shift === 1);
    const fsS2 = fleetShifts.find((fs) => fs.route_id === r.id && fs.shift === 2);

    // ponytail: Target renops dinamis berdasarkan kalender operasional rute (Minggu, Sabtu, Libur, Hari Kerja)
    const dynamicRenopsInfo = getRenopsForDate(r, dateStr);
    const dynamicRenops = dynamicRenopsInfo.renops;

    // Evaluasi renopsShift1 & renopsShift2:
    // Deteksi jika report tersimpan nilai default_renops statis lama pada hari non-weekday (Sabtu/Minggu/Libur).
    // Jika ya, gunakan dynamicRenops agar akurat sesuai kalender operasional.
    const isReportS1StaleDefault = todayReport?.renops_shift1 === r.default_renops && dynamicRenops !== r.default_renops;
    const renopsS1 = (todayReport?.renops_shift1 && !isReportS1StaleDefault)
      ? todayReport.renops_shift1
      : (fsS1?.target_renops ?? dynamicRenops);
    const realopsS1 = (todayReport?.realops_shift1 !== undefined && todayReport.realops_shift1 !== null && todayReport.realops_shift1 > 0)
      ? todayReport.realops_shift1
      : (fsS1?.realops ?? 0);

    const isReportS2StaleDefault = todayReport?.renops_shift2 === r.default_renops && dynamicRenops !== r.default_renops;
    const renopsS2 = (todayReport?.renops_shift2 && !isReportS2StaleDefault)
      ? todayReport.renops_shift2
      : (fsS2?.target_renops ?? dynamicRenops);
    const realopsS2 = (todayReport?.realops_shift2 !== undefined && todayReport.realops_shift2 !== null && todayReport.realops_shift2 > 0)
      ? todayReport.realops_shift2
      : (fsS2?.realops ?? 0);

    const totalRenops = Math.max(renopsS1, renopsS2, dynamicRenops);
    const totalRealops = realopsS1 || realopsS2 ? Math.max(realopsS1, realopsS2) : 0;

    const achievementKm = (todayReport?.achievement_km !== undefined && todayReport.achievement_km !== null && Number(todayReport.achievement_km) > 0)
      ? Number(todayReport.achievement_km)
      : (totalRealops > 0 ? totalKm / totalRealops : 0);

    const isFleetConfirmedS1 = Boolean(todayReport?.is_fleet_confirmed_s1 || fsS1?.is_confirmed);
    const isFleetConfirmedS2 = Boolean(todayReport?.is_fleet_confirmed_s2 || fsS2?.is_confirmed);

    // Tentukan status kelengkapan
    let status: 'draft' | 'submitted' | 'verified' | 'empty' = 'empty';
    if (todayReport) {
      status = todayReport.status || 'draft';
    } else if (isFleetConfirmedS1 || isFleetConfirmedS2) {
      status = 'submitted';
    } else if (todayPassengers > 0 || fsS1 || fsS2) {
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
    } else if (todayReport?.status === 'submitted' || todayReport?.status === 'verified' || isFleetConfirmedS1 || isFleetConfirmedS2) {
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
      bestRecordDate: r.best_record_date || undefined,
      supervisorName: r.supervisor_name || 'Pengawas Wilayah',
      defaultRenops: dynamicRenops,
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
      fleetStatusShift1: (todayReport?.fleet_status_shift1 && todayReport.fleet_status_shift1.length > 0)
        ? todayReport.fleet_status_shift1
        : (fsS1?.non_sgo_units?.map((u) => ({
            unit: u.unit_body,
            note: u.note || u.status_code,
            isOff: u.status_code === 'OFF',
            isOperatingWithNote: false,
          })) || []),
      fleetStatusShift2: (todayReport?.fleet_status_shift2 && todayReport.fleet_status_shift2.length > 0)
        ? todayReport.fleet_status_shift2
        : (fsS2?.non_sgo_units?.map((u) => ({
            unit: u.unit_body,
            note: u.note || u.status_code,
            isOff: u.status_code === 'OFF',
            isOperatingWithNote: false,
          })) || []),
      isFleetConfirmedS1,
      isFleetConfirmedS2,
      fleetConfirmedS1At: todayReport?.fleet_confirmed_s1_at || fsS1?.confirmed_at,
      fleetConfirmedS2At: todayReport?.fleet_confirmed_s2_at || fsS2?.confirmed_at,
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
      passengersPerBus,
      // PP metrics & aliases
      totalRitasePp: (Number(r.km_baku) || 0) > 0 ? totalKm / (Number(r.km_baku) || 0) : ((totalTrips || 0) / 2),
      ritasePerBus: realopsS1 > 0 ? ((Number(r.km_baku) || 0) > 0 ? totalKm / (Number(r.km_baku) || 0) : ((totalTrips || 0) / 2)) / realopsS1 : 0,
      kmPerBus: achievementKm,
      paxPerBus: passengersPerBus,
      targetPax: targetHk,
      paxPercentage: targetPercentage,
      paxPerKm: passengersPerKm,
      targetPaxPerKm: targetPassengersPerKm,
      paxPerKmPercentage: passengersPerKmPercentage,
    };
  });

  // 5. Urutkan rute secara natural alphanumeric
  const sortedRouteItems = sortRoutesByCode(routeItems);

  // 6. Hitung Agregat Wilayah
  const totals = calculateRegionalTotals(sortedRouteItems, summaries, pYest, pLast, reports, yesterdayDate, lastWeekDate);

  return {
    date: dateStr,
    yesterdayDate,
    lastWeekDate,
    routes: sortedRouteItems,
    supervisorSummaries: calculateSupervisorSummaries(sortedRouteItems),
    ...totals
  };
}

/**
 * Mengambil data agregasi monitoring regional untuk rentang periode (mingguan, bulanan, kustom)
 */
export async function fetchRegionalPeriodMonitoringData(
  startDate: string,
  endDate: string
): Promise<RegionalMonitoringResult> {
  if (startDate === endDate) {
    return fetchRegionalMonitoringData(startDate);
  }

  // 1. Ambil daftar master rute
  const routes = await fetchRouteMasterList();

  // 2. Ambil daily_route_reports untuk rentang tanggal dengan silent retry
  let reports: DailyRouteReport[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data: reportData, error } = await supabase
        .from('daily_route_reports')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      if (!error && reportData) {
        reports = reportData as DailyRouteReport[];
        break;
      }
      if (error && attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      } else {
        console.warn('[allRouteMonitoringService] Gagal fetch period daily_route_reports:', err);
      }
    }
  }

  // 3. Petakan akumulasi per rute
  const routeItems: RegionalRouteItem[] = routes.map((r: Route) => {
    const code = r.route_code;
    const routeReports = reports.filter((rep) => rep.route_code === code);

    const targetHkPerDay = Number(r.target_hk) || 0;
    const uniqueDays = new Set(routeReports.map((rep) => rep.date)).size || 1;
    const targetHk = targetHkPerDay * uniqueDays;

    const todayPassengers = routeReports.reduce((acc, cur) => acc + (Number(cur.total_passengers) || 0), 0);
    const totalKm = routeReports.reduce((acc, cur) => acc + (Number(cur.total_km) || 0), 0);
    const totalTrips = routeReports.reduce((acc, cur) => acc + (Number(cur.total_trip) || 0), 0);

    const renopsS1 = routeReports.reduce((acc, cur) => acc + (Number(cur.renops_shift1) || 0), 0);
    const realopsS1 = routeReports.reduce((acc, cur) => acc + (Number(cur.realops_shift1) || 0), 0);
    const renopsS2 = routeReports.reduce((acc, cur) => acc + (Number(cur.renops_shift2) || 0), 0);
    const realopsS2 = routeReports.reduce((acc, cur) => acc + (Number(cur.realops_shift2) || 0), 0);

    const totalRenops = Math.max(renopsS1, renopsS2);
    const totalRealops = Math.max(realopsS1, realopsS2);

    const toaShift1 = routeReports.reduce((acc, cur) => acc + (Number(cur.toa_shift1) || 0), 0);
    const manualShift1 = routeReports.reduce((acc, cur) => acc + (Number(cur.manual_shift1) || 0), 0);
    const totalShift1 = toaShift1 + manualShift1;

    const toaShift2 = routeReports.reduce((acc, cur) => acc + (Number(cur.toa_shift2) || 0), 0);
    const manualShift2 = routeReports.reduce((acc, cur) => acc + (Number(cur.manual_shift2) || 0), 0);
    const totalShift2 = toaShift2 + manualShift2;

    const kmBaku = Number(r.km_baku) || 0;
    const totalRitasePp = kmBaku > 0 ? totalKm / kmBaku : (totalTrips > 0 ? totalTrips / 2 : 0);
    const achievementKm = totalRealops > 0 ? totalKm / totalRealops : 0;
    const kmPerBus = achievementKm;
    const ritasePerBus = totalRealops > 0 ? totalRitasePp / totalRealops : 0;
    const targetPercentage = targetHk > 0 ? (todayPassengers / targetHk) * 100 : 0;
    const targetPassengersPerKm = 1.5;
    const passengersPerKm = totalKm > 0 ? todayPassengers / totalKm : 0;
    const passengersPerKmPercentage = targetPassengersPerKm > 0
      ? (passengersPerKm / targetPassengersPerKm) * 100
      : 0;
    const tripsPerBus = totalRealops > 0 ? totalTrips / totalRealops : 0;
    const passengersPerBus = totalRealops > 0 ? todayPassengers / totalRealops : 0;

    const status = routeReports.length > 0 ? 'submitted' : 'empty';
    const dataSource = routeReports.some((rep) => rep.last_synced_at) ? 'sheet_ingestion' : (routeReports.length > 0 ? 'app_input' : 'empty');

    return {
      id: r.id,
      routeCode: code,
      routeName: r.route_name || '',
      operatorName: r.operator_name || 'Mikrotrans',
      isLooping: !!r.is_looping,
      kmBaku,
      targetHk,
      bestRecord: Number(r.best_record) || 0,
      bestRecordDate: r.best_record_date || undefined,
      supervisorName: r.supervisor_name || 'Pengawas Wilayah',
      defaultRenops: Number(r.default_renops) || 0,
      renopsShift1: renopsS1,
      realopsShift1: realopsS1,
      renopsShift2: renopsS2,
      realopsShift2: realopsS2,
      totalRenops,
      totalRealops,
      headwayFastest: 3,
      headwaySlowest: 10,
      trafficJamSpots: r.default_traffic_jam_spots || [],
      operationalIssues: '',
      status,
      todayPassengers,
      yesterdayPassengers: 0,
      lastWeekPassengers: 0,
      totalKm,
      achievementKm,
      totalTrips,
      totalRitasePp,
      ritasePerBus,
      kmPerBus,
      paxPerBus: passengersPerBus,
      targetPax: targetHk,
      paxPercentage: targetPercentage,
      paxPerKm: passengersPerKm,
      targetPaxPerKm: targetPassengersPerKm,
      paxPerKmPercentage: passengersPerKmPercentage,
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
      passengersPerBus,
    };
  });

  const sortedRouteItems = sortRoutesByCode(routeItems);
  const supervisorSummaries = calculateSupervisorSummaries(sortedRouteItems);

  // Hitung total regional untuk rentang periode
  const totalRenops = sortedRouteItems.reduce((acc, r) => acc + r.totalRenops, 0);
  const totalRealops = sortedRouteItems.reduce((acc, r) => acc + r.totalRealops, 0);
  const totalTodayPassengers = sortedRouteItems.reduce((acc, r) => acc + r.todayPassengers, 0);
  const totalTargetPassengers = sortedRouteItems.reduce((acc, r) => acc + r.targetHk, 0);
  const totalKm = sortedRouteItems.reduce((acc, r) => acc + r.totalKm, 0);
  const averageKmPerBus = totalRealops > 0 ? totalKm / totalRealops : 0;
  const totalTrips = sortedRouteItems.reduce((acc, r) => acc + (r.totalTrips || 0), 0);
  const averageTripsPerBus = totalRealops > 0 ? totalTrips / totalRealops : 0;

  const tomShift1 = sortedRouteItems.reduce((acc, r) => acc + r.toaShift1, 0);
  const manualShift1 = sortedRouteItems.reduce((acc, r) => acc + r.manualShift1, 0);
  const totalShift1 = tomShift1 + manualShift1;

  const tomShift2 = sortedRouteItems.reduce((acc, r) => acc + r.toaShift2, 0);
  const manualShift2 = sortedRouteItems.reduce((acc, r) => acc + r.manualShift2, 0);
  const totalShift2 = tomShift2 + manualShift2;

  const submittedCount = sortedRouteItems.filter((r) => r.status === 'submitted' || r.status === 'verified').length;
  const verifiedCount = sortedRouteItems.filter((r) => r.status === 'verified').length;
  const draftCount = sortedRouteItems.filter((r) => r.status === 'draft').length;
  const emptyCount = sortedRouteItems.filter((r) => r.status === 'empty').length;

  const appInputCount = sortedRouteItems.filter((r) => r.dataSource === 'app_input').length;
  const sheetSyncCount = sortedRouteItems.filter((r) => r.dataSource === 'sheet_ingestion').length;
  const emptySourceCount = sortedRouteItems.filter((r) => !r.dataSource || r.dataSource === 'empty').length;

  return {
    date: `${startDate} s.d. ${endDate}`,
    yesterdayDate: '',
    lastWeekDate: '',
    routes: sortedRouteItems,
    supervisorSummaries,
    totalRenops,
    totalRealops,
    totalTodayPassengers,
    totalTargetPassengers,
    totalYesterdayPassengers: 0,
    totalLastWeekPassengers: 0,
    totalKm,
    averageKmPerBus,
    totalTrips,
    averageTripsPerBus,
    tomShift1,
    manualShift1,
    totalShift1,
    yesterdayShift1: 0,
    lastWeekShift1: 0,
    tomShift2,
    manualShift2,
    totalShift2,
    yesterdayShift2: 0,
    lastWeekShift2: 0,
    submittedCount,
    verifiedCount,
    draftCount,
    emptyCount,
    totalRoutesCount: routeItems.length,
    appInputCount,
    sheetSyncCount,
    emptySourceCount,
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

      // ponytail: Jangan sinkronisasi baris template global yang belum ada aktivitas penumpang sama sekali
      const hasActualActivity =
        metric.totalPassengers > 0 ||
        metric.toaShift1 + metric.manualShift1 + metric.toaShift2 + metric.manualShift2 > 0;
      if (!hasActualActivity && metric.totalPassengers === 0 && metric.kmTempuh === 0) {
        continue;
      }

      try {
        const expectedRenops = metric.renops > 0 ? metric.renops : getRenopsForDate(route, dateStr).renops;
        const payload = {
          route_id: route.id,
          route_code: route.route_code,
          date: dateStr,
          renops_shift1: expectedRenops,
          realops_shift1: metric.realops,
          renops_shift2: expectedRenops,
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
