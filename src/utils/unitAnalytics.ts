import type { BusData } from '../services/googleSheets';

export interface UnitSummaryItem {
  unit: string;
  totalToa: number;
  isFilled: boolean;
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

export function extractUnitList(data: BusData[]): UnitSummaryItem[] {
  if (!data || data.length === 0) return [];
  
  return data.map((b) => {
    const totalToaNum = parseInt(String(b.totalToa || '0'), 10) || 0;
    const hasNote = !!(b.keterangan && String(b.keterangan).trim() !== '');
    const isFilled = !!(b.toaShift1 || b.totalToa || b.kmAwal1);
    
    return {
      unit: b.unit || 'Tanpa Nama',
      totalToa: totalToaNum,
      isFilled,
      noteCount: hasNote ? 1 : 0,
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

  const toaShift1 = parseInt(String(item.toaShift1 || '0'), 10) || 0;
  const manualShift1 = parseInt(String(item.manualShift1 || '0'), 10) || 0;
  const totalShift1Pnp = toaShift1 + manualShift1;

  const totalToaRaw = parseInt(String(item.totalToa || '0'), 10) || 0;
  const toaShift2 = Math.max(0, totalToaRaw - toaShift1);
  const manualShift2 = parseInt(String(item.manualShift2 || '0'), 10) || 0;
  const totalShift2Pnp = toaShift2 + manualShift2;

  const totalToa = totalToaRaw > 0 ? totalToaRaw : (toaShift1 + toaShift2);
  const totalPassengers = totalToa + manualShift1 + manualShift2;

  const kmAwal1Num = parseFloat(String(item.kmAwal1 || '0')) || 0;
  const kmAkhir1Num = parseFloat(String(item.kmAkhir1 || '0')) || 0;
  const kmShift1 = kmAkhir1Num > kmAwal1Num ? kmAkhir1Num - kmAwal1Num : 0;

  const kmAwal2Num = parseFloat(String(item.kmAwal2 || '0')) || 0;
  const kmAkhir2Num = parseFloat(String(item.kmAkhir2 || '0')) || 0;
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
