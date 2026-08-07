import type { BusData } from '../services/googleSheets';
import { parseIndonesianNumber } from './numberUtils';

export interface BusNote {
  unit: string;
  keterangan: string;
}

export interface AnalyticsSummary {
  totalKm: number;
  totalPassengers: number;
  passengersPerKm: number;
  kmPerBus: number;
  
  // Shift 1
  totalToaShift1: number;
  totalManualShift1: number;
  totalShift1: number;

  // Shift 2
  totalToaShift2: number;
  totalManualShift2: number;
  totalShift2: number;

  // Grand Totals
  grandTotalToa: number;
  grandTotalManual: number;

  // Armada Status
  totalBuses: number;
  filledBuses: number;
  unfilledBuses: number;
  unfilledUnits: string[];
  completionPercentage: number;

  // Bus Keterangan / Notes
  busesWithNotes: BusNote[];
}

export function slugifyUnitId(unit: string): string {
  if (!unit) return 'unit';
  return unit.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

function getValidNumber(ssotVal: number | undefined, calculatedFallback: number): number {
  if (ssotVal !== undefined && !isNaN(ssotVal)) {
    return ssotVal;
  }
  return calculatedFallback;
}

const safeParseNumber = (val: any): number => {
  const num = parseIndonesianNumber(val);
  return isNaN(num) ? 0 : num;
};

export function calculateAnalytics(
  busData: BusData[],
  sheetSummary?: Record<string, number>
): AnalyticsSummary {
  let totalKm = 0;
  let totalToaShift1 = 0;
  let totalManualShift1 = 0;
  let totalToaShift2 = 0;
  let totalManualShift2 = 0;
  let filledBuses = 0;
  let activeBusCount = 0;
  const unfilledUnits: string[] = [];
  const busesWithNotes: BusNote[] = [];

  busData.forEach((bus) => {
    // BUG-20: Use parseIndonesianNumber instead of parseFloat/parseInt to correctly parse "1.234" as 1234
    const kmAwal1 = safeParseNumber(bus.kmAwal1);
    const kmAkhir1 = safeParseNumber(bus.kmAkhir1);
    const kmAwal2 = safeParseNumber(bus.kmAwal2);
    const kmAkhir2 = safeParseNumber(bus.kmAkhir2);

    const kmShift1 = kmAkhir1 > kmAwal1 ? kmAkhir1 - kmAwal1 : 0;
    const kmShift2 = kmAkhir2 > kmAwal2 ? kmAkhir2 - kmAwal2 : 0;
    const busTotalKm = kmShift1 + kmShift2;
    totalKm += busTotalKm;

    if (busTotalKm > 0) {
      activeBusCount += 1;
    }

    const toa1 = safeParseNumber(bus.toaShift1);
    const man1 = safeParseNumber(bus.manualShift1);
    const toa2 = safeParseNumber(bus.toaShift2);
    const man2 = safeParseNumber(bus.manualShift2);

    totalToaShift1 += toa1;
    totalManualShift1 += man1;
    totalToaShift2 += toa2;
    totalManualShift2 += man2;

    const isFilled = busTotalKm > 0 || (toa1 + man1 + toa2 + man2) > 0;
    if (isFilled) {
      filledBuses += 1;
    } else {
      unfilledUnits.push(bus.unit);
    }

    if (bus.keterangan && bus.keterangan.trim() !== '') {
      busesWithNotes.push({
        unit: bus.unit,
        keterangan: bus.keterangan.trim()
      });
    }
  });

  const totalShift1 = totalToaShift1 + totalManualShift1;
  const totalShift2 = totalToaShift2 + totalManualShift2;
  const grandTotalToa = totalToaShift1 + totalToaShift2;
  const grandTotalManual = totalManualShift1 + totalManualShift2;
  const totalPassengers = grandTotalToa + grandTotalManual;

  const totalBuses = busData.length;
  const unfilledBuses = totalBuses - filledBuses;
  const completionPercentage = totalBuses > 0 ? Math.round((filledBuses / totalBuses) * 100) : 0;

  // Priority SSOT: Use sheetSummary values if valid, fallback to local Excel formula emulation (AVERAGEIF(KM > 0))
  const finalTotalKm = getValidNumber(sheetSummary?.totalKm, totalKm);
  const finalTotalPassengers = getValidNumber(sheetSummary?.totalPassengers, totalPassengers);

  // AVERAGEIF(KM > 0): Only divide total KM by active operating buses (KM > 0)
  const calcKmPerBus = activeBusCount > 0 ? totalKm / activeBusCount : 0;
  const finalKmPerBus = getValidNumber(sheetSummary?.kmPerBus, calcKmPerBus);

  const calcPnpPerKm = finalTotalKm > 0 ? finalTotalPassengers / finalTotalKm : 0;
  const finalPnpPerKm = getValidNumber(sheetSummary?.passengersPerKm, calcPnpPerKm);

  return {
    totalKm: finalTotalKm,
    // BUG-36: totalPassengers is always an integer passenger count per product decision
    totalPassengers: Math.round(finalTotalPassengers),
    passengersPerKm: finalPnpPerKm,
    kmPerBus: finalKmPerBus,
    totalToaShift1: getValidNumber(sheetSummary?.totalToaShift1, totalToaShift1),
    totalManualShift1: getValidNumber(sheetSummary?.totalManualShift1, totalManualShift1),
    totalShift1: getValidNumber(sheetSummary?.totalShift1, totalShift1),
    totalToaShift2: getValidNumber(sheetSummary?.totalToaShift2, totalToaShift2),
    totalManualShift2: getValidNumber(sheetSummary?.totalManualShift2, totalManualShift2),
    totalShift2: getValidNumber(sheetSummary?.totalShift2, totalShift2),
    grandTotalToa: getValidNumber(sheetSummary?.grandTotalToa, grandTotalToa),
    grandTotalManual: getValidNumber(sheetSummary?.grandTotalManual, grandTotalManual),
    totalBuses,
    filledBuses,
    unfilledBuses,
    unfilledUnits,
    completionPercentage,
    busesWithNotes
  };
}

import type { Route } from '../types/supabase';

const MONTH_NAMES_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function extractMonthYearLabel(sheetUrl: string, routes?: Route[]): string {
  let routeList = routes;
  if (!routeList) {
    try {
      const cached = localStorage.getItem('PDO_CACHE_ROUTES');
      if (cached) routeList = JSON.parse(cached);
    } catch (_e) {}
  }

  if (routeList && Array.isArray(routeList)) {
    for (const r of routeList) {
      for (const s of r.route_sheets || []) {
        if (s.sheet_url === sheetUrl || (sheetUrl && (s.sheet_url.includes(sheetUrl) || sheetUrl.includes(s.spreadsheet_id)))) {
          const monthName = MONTH_NAMES_ID[s.month] || '';
          return monthName ? `${monthName} ${s.year}` : `${s.year}`;
        }
      }
    }
  }

  const now = new Date();
  const currentMonth = now.toLocaleString('id-ID', { month: 'long' });
  const capitalizedCurrentMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  const currentYear = now.getFullYear();
  return `${capitalizedCurrentMonth} ${currentYear}`;
}

export function calculateAccumulatedAnalytics(
  allDaysData: Record<string, BusData[]>,
  endDay: number
): AnalyticsSummary {
  const daysToInclude = Object.keys(allDaysData)
    .map((d) => parseInt(d, 10))
    .filter((d) => !isNaN(d) && d <= endDay)
    .sort((a, b) => a - b);

  if (daysToInclude.length === 0) {
    return calculateAnalytics([]);
  }

  const unitMap = new Map<string, BusData>();

  for (const day of daysToInclude) {
    const dayData = allDaysData[String(day)] || [];
    for (const bus of dayData) {
      if (!bus.unit) continue;
      const existing = unitMap.get(bus.unit);
      if (!existing) {
        unitMap.set(bus.unit, { ...bus });
      } else {
        const kmA1 = safeParseNumber(bus.kmAwal1);
        const kmAkh1 = safeParseNumber(bus.kmAkhir1);
        const kmA2 = safeParseNumber(bus.kmAwal2);
        const kmAkh2 = safeParseNumber(bus.kmAkhir2);
        const kmS1 = kmAkh1 > kmA1 ? kmAkh1 - kmA1 : 0;
        const kmS2 = kmAkh2 > kmA2 ? kmAkh2 - kmA2 : 0;

        const exKmA1 = safeParseNumber(existing.kmAwal1);
        const exKmAkh1 = safeParseNumber(existing.kmAkhir1);
        const exKmA2 = safeParseNumber(existing.kmAwal2);
        const exKmAkh2 = safeParseNumber(existing.kmAkhir2);
        const exKmS1 = exKmAkh1 > exKmA1 ? exKmAkh1 - exKmA1 : 0;
        const exKmS2 = exKmAkh2 > exKmA2 ? exKmAkh2 - exKmA2 : 0;

        existing.toaShift1 = (
          safeParseNumber(existing.toaShift1) + safeParseNumber(bus.toaShift1)
        ).toString();
        existing.manualShift1 = (
          safeParseNumber(existing.manualShift1) + safeParseNumber(bus.manualShift1)
        ).toString();
        existing.toaShift2 = (
          safeParseNumber(existing.toaShift2) + safeParseNumber(bus.toaShift2)
        ).toString();
        existing.manualShift2 = (
          safeParseNumber(existing.manualShift2) + safeParseNumber(bus.manualShift2)
        ).toString();
        existing.totalToa = (
          safeParseNumber(existing.totalToa) + safeParseNumber(bus.totalToa)
        ).toString();

        const totalBusKmS1 = exKmS1 + kmS1;
        const totalBusKmS2 = exKmS2 + kmS2;

        existing.kmAwal1 = "0";
        existing.kmAkhir1 = totalBusKmS1.toString();
        existing.kmAwal2 = "0";
        existing.kmAkhir2 = totalBusKmS2.toString();

        if (bus.keterangan && bus.keterangan.trim() !== "") {
          const exNotes = existing.keterangan ? existing.keterangan.split(" | ") : [];
          if (!exNotes.includes(bus.keterangan.trim())) {
            exNotes.push(bus.keterangan.trim());
            existing.keterangan = exNotes.join(" | ");
          }
        }
      }
    }
  }

  return calculateAnalytics(Array.from(unitMap.values()));
}
