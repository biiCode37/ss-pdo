import type { BusData } from '../services/googleSheets';
import { parseIndonesianNumber } from './numberUtils';

export type UnitShiftStatus = 'FULL_COMPLETE' | 'SHIFT_1_ONLY' | 'SHIFT_2_ONLY' | 'INCOMPLETE' | 'EMPTY';

export interface UnitSummaryItem {
  unit: string;
  totalToa: number;
  totalPassengers: number;
  totalKm: number;
  isFilled: boolean;
  shiftStatus: UnitShiftStatus;
  notes: string[];
  noteCount: number;
}

export interface UnitSummaryMetrics {
  unit: string;
  toaShift1: number;
  manualShift1: number;
  totalShift1Pnp: number;
  toaShift2: number;
  manualShift2: number;
  totalShift2Pnp: number;
  totalToa: number;
  totalPassengers: number;
  kmAwal1: string;
  kmAkhir1: string;
  kmShift1: number;
  kmAwal2: string;
  kmAkhir2: string;
  kmShift2: number;
  totalKm: number;
  notes: string[];
}

export function getUnitShiftStatus(b: BusData): UnitShiftStatus {
  const hasValue = (val: any) => val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-';

  const hasS1Toa = hasValue(b.toaShift1);
  const hasS1KmAwal = hasValue(b.kmAwal1);
  const hasS1KmAkhir = hasValue(b.kmAkhir1);
  const hasS1Manual = hasValue(b.manualShift1);

  const hasS1 = hasS1Toa || hasS1KmAwal || hasS1KmAkhir || hasS1Manual;
  const isS1Complete = (hasS1Toa || hasValue(b.totalToa)) && hasS1KmAwal && hasS1KmAkhir;

  const hasS2KmAwal = hasValue(b.kmAwal2);
  const hasS2KmAkhir = hasValue(b.kmAkhir2);
  const hasS2Manual = hasValue(b.manualShift2);
  const totalToaNum = parseIndonesianNumber(b.totalToa);
  const s1ToaNum = parseIndonesianNumber(b.toaShift1);
  const hasS2Toa = totalToaNum > s1ToaNum || (totalToaNum > 0 && !hasS1Toa);

  const hasS2 = hasS2Toa || hasS2KmAwal || hasS2KmAkhir || hasS2Manual;
  const isS2Complete = (hasS2Toa || totalToaNum > 0) && hasS2KmAwal && hasS2KmAkhir;

  if (isS1Complete && isS2Complete) return 'FULL_COMPLETE';
  if (hasS1 && !hasS2) return 'SHIFT_1_ONLY';
  if (!hasS1 && hasS2) return 'SHIFT_2_ONLY';
  if (hasS1 || hasS2) return 'INCOMPLETE';
  return 'EMPTY';
}

export function extractUnitList(data: BusData[]): UnitSummaryItem[] {
  if (!data || data.length === 0) return [];
  
  return data.map((b) => {
    const metrics = calculateUnitMetrics(data, b.unit || '');
    return {
      unit: b.unit || 'Tanpa Nama',
      totalToa: metrics.totalToa,
      totalPassengers: metrics.totalPassengers,
      totalKm: metrics.totalKm,
      isFilled: metrics.totalPassengers > 0 || metrics.totalKm > 0 || metrics.notes.length > 0 || metrics.kmAwal1 !== '-',
      shiftStatus: getUnitShiftStatus(b),
      notes: metrics.notes,
      noteCount: metrics.notes.length,
    };
  });
}

export function calculateUnitMetrics(data: BusData[], targetUnit: string): UnitSummaryMetrics {
  const defaultResult: UnitSummaryMetrics = {
    unit: targetUnit,
    toaShift1: 0,
    manualShift1: 0,
    totalShift1Pnp: 0,
    toaShift2: 0,
    manualShift2: 0,
    totalShift2Pnp: 0,
    totalToa: 0,
    totalPassengers: 0,
    kmAwal1: '-',
    kmAkhir1: '-',
    kmShift1: 0,
    kmAwal2: '-',
    kmAkhir2: '-',
    kmShift2: 0,
    totalKm: 0,
    notes: [],
  };

  if (!data || !targetUnit) return defaultResult;

  const item = data.find((b) => b.unit === targetUnit);
  if (!item) return defaultResult;

  const toaShift1 = parseIndonesianNumber(item.toaShift1);
  const manualShift1 = parseIndonesianNumber(item.manualShift1);
  const totalShift1Pnp = toaShift1 + manualShift1;

  const totalToaRaw = parseIndonesianNumber(item.totalToa);
  const toaShift2 = Math.max(0, totalToaRaw - toaShift1);
  const manualShift2 = parseIndonesianNumber(item.manualShift2);
  const totalShift2Pnp = toaShift2 + manualShift2;

  const totalToa = totalToaRaw > 0 ? totalToaRaw : (toaShift1 + toaShift2);
  const totalPassengers = totalToa + manualShift1 + manualShift2;

  const kmAwal1Num = parseIndonesianNumber(item.kmAwal1);
  const kmAkhir1Num = parseIndonesianNumber(item.kmAkhir1);
  const kmShift1 = kmAkhir1Num > kmAwal1Num ? kmAkhir1Num - kmAwal1Num : 0;

  const kmAwal2Num = parseIndonesianNumber(item.kmAwal2);
  const kmAkhir2Num = parseIndonesianNumber(item.kmAkhir2);
  const kmShift2 = kmAkhir2Num > kmAwal2Num ? kmAkhir2Num - kmAwal2Num : 0;

  const notes: string[] = [];
  if (item.keterangan && String(item.keterangan).trim() !== '') {
    notes.push(String(item.keterangan).trim());
  }

  return {
    unit: targetUnit,
    toaShift1,
    manualShift1,
    totalShift1Pnp,
    toaShift2,
    manualShift2,
    totalShift2Pnp,
    totalToa,
    totalPassengers,
    kmAwal1: item.kmAwal1 || '-',
    kmAkhir1: item.kmAkhir1 || '-',
    kmShift1,
    kmAwal2: item.kmAwal2 || '-',
    kmAkhir2: item.kmAkhir2 || '-',
    kmShift2,
    totalKm: kmShift1 + kmShift2,
    notes,
  };
}
