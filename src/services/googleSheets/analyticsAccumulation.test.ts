import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccumulatedBusData } from './analytics';

vi.mock('./transport', () => ({
  fetchSheetValuesBatch: vi.fn(),
  fetchSheetValues: vi.fn(),
  fetchSpreadsheetMeta: vi.fn(),
}));

import { fetchSheetValuesBatch } from './transport';

describe('getAccumulatedBusData - Trip Accumulation Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly detects tripPergi & tripPulang columns and accumulates trip counts across days in batch mode', async () => {
    const mockValueRanges = [
      {
        range: '1!A1:ZZ',
        values: [
          // Header Row 1 (subheaders)
          ['No Body', 'Lebak Bulus - Ragunan', 'Ragunan - Lebak Bulus', 'Shift 1', 'Shift 2', 'Total', 'KM 1', 'KM 1', 'KM 2', 'KM 2', 'Keterangan'],
          // Header Row 2 (composite subheader - baris 1 dan 2 merge di kolom unit)
          ['', 'Trip Pergi', 'Trip Pulang', 'TOA S1', 'TOA S2', 'Total TOA', 'KM Awal 1', 'KM Akhir 1', 'KM Awal 2', 'KM Akhir 2', 'Keterangan'],
          // Data Day 1
          ['KWK 222158', '7', '7', '50', '60', '110', '1000', '1100', '1100', '1200', ''],
          ['KWK 222159', '6', '6', '40', '50', '90', '2000', '2090', '2090', '2180', ''],
        ],
      },
      {
        range: '2!A1:ZZ',
        values: [
          // Header Row 1
          ['No Body', 'Trip Pergi', 'Trip Pulang', 'Shift 1', 'Shift 2', 'Total', 'KM 1', 'KM 1', 'KM 2', 'KM 2', 'Keterangan'],
          // Header Row 2
          ['', 'Lebak Bulus', 'Ragunan', 'TOA S1', 'TOA S2', 'Total TOA', 'KM Awal 1', 'KM Akhir 1', 'KM Awal 2', 'KM Akhir 2', 'Keterangan'],
          // Data Day 2
          ['KWK 222158', '7', '6', '55', '65', '120', '1200', '1300', '1300', '1400', ''],
          ['KWK 222159', '7', '7', '45', '55', '100', '2180', '2280', '2280', '2380', 'OFF'],
        ],
      },
    ];

    (fetchSheetValuesBatch as any).mockResolvedValueOnce({
      result: {
        valueRanges: mockValueRanges,
      },
    });

    const result = await getAccumulatedBusData('sheet-abc', 2, 1);
    expect(result.data).toHaveLength(2);

    const bus158 = result.data.find((b) => b.unit === 'KWK 222158');
    expect(bus158).toBeDefined();
    // 7 + 7 = 14 trip pergi
    expect(bus158?.tripPergi).toBe('14');
    // 7 + 6 = 13 trip pulang
    expect(bus158?.tripPulang).toBe('13');
    // 110 + 120 = 230 total toa
    expect(bus158?.totalToa).toBe('230');

    const bus159 = result.data.find((b) => b.unit === 'KWK 222159');
    expect(bus159).toBeDefined();
    // 6 + 7 = 13 trip pergi
    expect(bus159?.tripPergi).toBe('13');
    // 6 + 7 = 13 trip pulang
    expect(bus159?.tripPulang).toBe('13');
  });
});
