import { describe, it, expect } from 'vitest';
import { extractUnitList, calculateUnitMetrics } from './unitAnalytics';
import type { BusData } from '../services/googleSheets';

const mockBusData: BusData[] = [
  {
    rowIndex: 2,
    unit: 'SAF-001',
    toaShift1: '50',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '120',
    kmAwal1: '100',
    kmAkhir1: '150',
    kmAwal2: '150',
    kmAkhir2: '200',
    keterangan: 'Servis AC',
  },
  {
    rowIndex: 3,
    unit: 'SAF-002',
    toaShift1: '40',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '80',
    kmAwal1: '50',
    kmAkhir1: '90',
    kmAwal2: '',
    kmAkhir2: '',
    keterangan: '',
  },
];

describe('unitAnalytics helper', () => {
  it('extracts unique unit list with basic summary stats', () => {
    const list = extractUnitList(mockBusData);
    expect(list).toHaveLength(2);
    expect(list[0].unit).toBe('SAF-001');
    expect(list[0].totalToa).toBe(120);
    expect(list[0].noteCount).toBe(1);
  });

  it('calculates detailed metrics for a single unit', () => {
    const metrics = calculateUnitMetrics(mockBusData, 'SAF-001');
    expect(metrics.unit).toBe('SAF-001');
    expect(metrics.toaShift1).toBe(50);
    expect(metrics.totalToa).toBe(120);
    expect(metrics.kmShift1).toBe(50);
    expect(metrics.kmShift2).toBe(50);
    expect(metrics.totalKm).toBe(100);
    expect(metrics.notes).toHaveLength(1);
    expect(metrics.notes[0]).toBe('Servis AC');
  });
});
