import { describe, it, expect } from 'vitest';
import { calculateAnalytics, formatAccumulatedNotes } from './analytics';
import type { BusData } from '../services/googleSheets';

const mockBusData: BusData[] = [
  {
    rowIndex: 2,
    unit: 'KMJ 1986',
    toaShift1: '83',
    toaShift2: '127',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '210',
    kmAwal1: '100',
    kmAkhir1: '200',
    kmAwal2: '200',
    kmAkhir2: '300',
    keterangan: '',
    originalRow: []
  },
  {
    rowIndex: 3,
    unit: 'KMJ 1987 (Mogok)',
    toaShift1: '0',
    toaShift2: '0',
    manualShift1: '0',
    manualShift2: '0',
    totalToa: '0',
    kmAwal1: '',
    kmAkhir1: '',
    kmAwal2: '',
    kmAkhir2: '',
    keterangan: 'NP 1',
    originalRow: []
  }
];

describe('calculateAnalytics', () => {
  it('correctly calculates local summary with AVERAGEIF(KM > 0)', () => {
    const localSummary = calculateAnalytics(mockBusData);
    expect(localSummary.totalKm).toBe(200);
    expect(localSummary.kmPerBus).toBe(200);
    expect(localSummary.passengersPerKm).toBe(1.05);
  });

  it('preserves exact raw unrounded SSOT values from sheetSummary', () => {
    const ssotSummary = calculateAnalytics(mockBusData, {
      totalKm: 5589.06,
      totalPassengers: 4670,
      kmPerBus: 192.72620689655172,
      passengersPerKm: 0.8355601120404863
    });

    expect(ssotSummary.totalKm).toBe(5589.06);
    expect(ssotSummary.kmPerBus).toBe(192.72620689655172);
    expect(ssotSummary.passengersPerKm).toBe(0.8355601120404863);
  });

  it('correctly parses Indonesian formatted numbers (BUG-20 fix)', () => {
    const indonesianData: BusData[] = [
      {
        rowIndex: 2,
        unit: 'JAK.76',
        toaShift1: '1.234', // 1234
        toaShift2: '45,5',  // 45.5 -> parsed as 45.5
        manualShift1: '0',
        manualShift2: '0',
        totalToa: '1.279,5',
        kmAwal1: '1.000',
        kmAkhir1: '1.250,5', // 250.5 km
        kmAwal2: '',
        kmAkhir2: '',
        keterangan: '',
        originalRow: []
      }
    ];

    const summary = calculateAnalytics(indonesianData);
    expect(summary.totalKm).toBe(250.5);
    expect(summary.totalToaShift1).toBe(1234);
    expect(summary.totalToaShift2).toBe(45.5);
    expect(summary.totalPassengers).toBe(1280); // Math.round(1234 + 45.5) = 1280
  });
});

describe('formatAccumulatedNotes', () => {
  it('formats consecutive and non-consecutive days with Opsi C style', () => {
    const notes = [
      { day: 2, note: 'Mogok' },
      { day: 3, note: 'Mogok' },
      { day: 5, note: 'Perbaikan AC' },
      { day: 6, note: 'Mogok' },
    ];
    expect(formatAccumulatedNotes(notes)).toBe('Tgl 2-3, 6: Mogok • Tgl 5: Perbaikan AC');
  });

  it('returns empty string for empty input', () => {
    expect(formatAccumulatedNotes([])).toBe('');
  });
});
