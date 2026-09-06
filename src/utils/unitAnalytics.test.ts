import { describe, it, expect } from 'vitest';
import {
  extractUnitList,
  calculateUnitMetrics,
  calculateUnitMetricsFromRow,
  detectTargetTrip,
} from './unitAnalytics';
import type { BusData } from '../services/googleSheets';

const mockBusData: BusData[] = [
  {
    rowIndex: 2,
    unit: 'SAF-001',
    toaShift1: '50',
    toaShift2: '70',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '120',
    kmAwal1: '100',
    kmAkhir1: '150',
    kmAwal2: '150',
    kmAkhir2: '200',
    keterangan: 'Servis AC',
    originalRow: [],
  },
  {
    rowIndex: 3,
    unit: 'SAF-002',
    toaShift1: '40',
    toaShift2: '40',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '80',
    kmAwal1: '50',
    kmAkhir1: '90',
    kmAwal2: '',
    kmAkhir2: '',
    keterangan: '',
    originalRow: [],
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

  it('correctly parses Indonesian formatted numbers with dot thousand separators and comma decimals (BUG-45)', () => {
    const formattedData: BusData[] = [
      {
        rowIndex: 2,
        unit: 'SAF-003',
        toaShift1: '1.200',
        toaShift2: '800',
        manualShift1: '50',
        manualShift2: '0',
        totalToa: '2.000',
        kmAwal1: '1.000,5',
        kmAkhir1: '1.150,5',
        kmAwal2: '1.150,5',
        kmAkhir2: '1.250,5',
        keterangan: '',
        originalRow: [],
      },
    ];

    const metrics = calculateUnitMetrics(formattedData, 'SAF-003');
    expect(metrics.toaShift1).toBe(1200);
    expect(metrics.totalToa).toBe(2000);
    expect(metrics.kmShift1).toBe(150);
    expect(metrics.kmShift2).toBe(100);
    expect(metrics.totalKm).toBe(250);
  });

  it('calculates metrics directly from row in O(1) time (BUG-46)', () => {
    const row = mockBusData[0];
    const metrics = calculateUnitMetricsFromRow(row);
    expect(metrics.unit).toBe('SAF-001');
    expect(metrics.totalToa).toBe(120);
    expect(metrics.totalKm).toBe(100);
  });

  const createMockBus = (partial: Partial<BusData>): BusData => ({
    rowIndex: 2,
    unit: 'TEST-01',
    toaShift1: '0',
    toaShift2: '0',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '0',
    kmAwal1: '0',
    kmAkhir1: '0',
    kmAwal2: '0',
    kmAkhir2: '0',
    keterangan: '',
    originalRow: [],
    ...partial,
  });

  it('extracts tripPergi and tripPulang in unit summary and metrics', () => {
    const tripData: BusData[] = [
      createMockBus({
        rowIndex: 2,
        unit: 'SAF-010',
        tripPergi: '7',
        tripPulang: '7',
      }),
    ];
    const list = extractUnitList(tripData);
    expect(list[0].tripPergi).toBe('7');
    expect(list[0].tripPulang).toBe('7');

    const metrics = calculateUnitMetrics(tripData, 'SAF-010');
    expect(metrics.tripPergi).toBe('7');
    expect(metrics.tripPulang).toBe('7');
  });

  it('detectTargetTrip correctly identifies route target and ignores OFF units', () => {
    const routeData: BusData[] = [
      createMockBus({ rowIndex: 2, unit: 'U1', tripPergi: '7', tripPulang: '7' }),
      createMockBus({ rowIndex: 3, unit: 'U2', tripPergi: '7', tripPulang: '7' }),
      createMockBus({ rowIndex: 4, unit: 'U3', tripPergi: '5', tripPulang: '5', keterangan: 'Macet' }),
      createMockBus({ rowIndex: 5, unit: 'U4', tripPergi: '10', tripPulang: '10', keterangan: 'OFF' }),
    ];
    const target = detectTargetTrip(routeData);
    expect(target).toEqual({ pergi: 7, pulang: 7 });
  });
});
