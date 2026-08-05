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
  toaShift2: number;
  totalToa: number;
  kmShift1: number;
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
    toaShift2: 0,
    totalToa: 0,
    kmShift1: 0,
    kmShift2: 0,
    totalKm: 0,
    notes: [],
  };

  if (!data || !targetUnit) return defaultResult;

  const item = data.find((b) => b.unit === targetUnit);
  if (!item) return defaultResult;

  const toaShift1 = parseInt(String(item.toaShift1 || '0'), 10) || 0;
  const totalToa = parseInt(String(item.totalToa || '0'), 10) || 0;
  const toaShift2 = Math.max(0, totalToa - toaShift1);

  const kmAwal1 = parseFloat(String(item.kmAwal1 || '0')) || 0;
  const kmAkhir1 = parseFloat(String(item.kmAkhir1 || '0')) || 0;
  const kmShift1 = kmAkhir1 > kmAwal1 ? kmAkhir1 - kmAwal1 : 0;

  const kmAwal2 = parseFloat(String(item.kmAwal2 || '0')) || 0;
  const kmAkhir2 = parseFloat(String(item.kmAkhir2 || '0')) || 0;
  const kmShift2 = kmAkhir2 > kmAwal2 ? kmAkhir2 - kmAwal2 : 0;

  const notes: string[] = [];
  if (item.keterangan && String(item.keterangan).trim() !== '') {
    notes.push(String(item.keterangan).trim());
  }

  return {
    unit: targetUnit,
    toaShift1,
    toaShift2,
    totalToa,
    kmShift1,
    kmShift2,
    totalKm: kmShift1 + kmShift2,
    notes,
  };
}
