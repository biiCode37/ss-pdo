import type { BusData } from '../services/googleSheets';

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
}

export function calculateAnalytics(busData: BusData[]): AnalyticsSummary {
  let totalKm = 0;
  let totalToaShift1 = 0;
  let totalManualShift1 = 0;
  let totalToaShift2 = 0;
  let totalManualShift2 = 0;
  let filledBuses = 0;
  const unfilledUnits: string[] = [];

  busData.forEach((bus) => {
    const kmAwal1 = parseFloat(bus.kmAwal1) || 0;
    const kmAkhir1 = parseFloat(bus.kmAkhir1) || 0;
    const kmAwal2 = parseFloat(bus.kmAwal2) || 0;
    const kmAkhir2 = parseFloat(bus.kmAkhir2) || 0;

    const kmShift1 = kmAkhir1 > kmAwal1 ? kmAkhir1 - kmAwal1 : 0;
    const kmShift2 = kmAkhir2 > kmAwal2 ? kmAkhir2 - kmAwal2 : 0;
    const busTotalKm = kmShift1 + kmShift2;
    totalKm += busTotalKm;

    const toa1 = parseInt(bus.toaShift1, 10) || 0;
    const man1 = parseInt(bus.manualShift1, 10) || 0;
    const toa2 = parseInt(bus.toaShift2, 10) || 0;
    const man2 = parseInt(bus.manualShift2, 10) || 0;

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
  });

  const totalShift1 = totalToaShift1 + totalManualShift1;
  const totalShift2 = totalToaShift2 + totalManualShift2;
  const grandTotalToa = totalToaShift1 + totalToaShift2;
  const grandTotalManual = totalManualShift1 + totalManualShift2;
  const totalPassengers = grandTotalToa + grandTotalManual;

  const totalBuses = busData.length;
  const unfilledBuses = totalBuses - filledBuses;
  const completionPercentage = totalBuses > 0 ? Math.round((filledBuses / totalBuses) * 100) : 0;
  const kmPerBus = filledBuses > 0 ? parseFloat((totalKm / filledBuses).toFixed(2)) : 0;
  const passengersPerKm = totalKm > 0 ? parseFloat((totalPassengers / totalKm).toFixed(3)) : 0;

  return {
    totalKm: parseFloat(totalKm.toFixed(2)),
    totalPassengers,
    passengersPerKm,
    kmPerBus,
    totalToaShift1,
    totalManualShift1,
    totalShift1,
    totalToaShift2,
    totalManualShift2,
    totalShift2,
    grandTotalToa,
    grandTotalManual,
    totalBuses,
    filledBuses,
    unfilledBuses,
    unfilledUnits,
    completionPercentage
  };
}
