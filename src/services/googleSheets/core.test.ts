import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBusRowData } from './core';
import type { HeaderMap } from './types';

vi.mock('./transport', () => ({
  fetchSheetValues: vi.fn(),
  fetchSpreadsheetMeta: vi.fn(),
}));

import { fetchSheetValues } from './transport';

describe('getBusRowData - Symmetric Schema & toaShift2 Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const headerMap: HeaderMap = {
    unit: 0,
    tripPergi: 1,
    tripPulang: 2,
    toaShift1: 3,
    toaShift2: 4,
    manualShift1: 5,
    manualShift2: 6,
    totalToa: 7,
    kmAwal1: 8,
    kmAkhir1: 9,
    kmAwal2: 10,
    kmAkhir2: 11,
    keterangan: 12,
  };

  it('reads toaShift2 directly when column is mapped in header', async () => {
    (fetchSheetValues as any).mockResolvedValueOnce({
      result: {
        values: [
          [
            'KWK 222171', // 0 unit
            '4',          // 1 tripPergi
            '4',          // 2 tripPulang
            '120',        // 3 toaShift1
            '80',         // 4 toaShift2
            '10',         // 5 manualShift1
            '5',          // 6 manualShift2
            '200',        // 7 totalToa
            '300100',     // 8 kmAwal1
            '300180',     // 9 kmAkhir1
            '300180',     // 10 kmAwal2
            '300260',     // 11 kmAkhir2
            'BA.01',      // 12 keterangan
          ],
        ],
      },
    });

    const result = await getBusRowData('sheet-123', '05', 6, headerMap);

    expect(result.toaShift1).toBe('120');
    expect(result.toaShift2).toBe('80');
    expect(result.totalToa).toBe('200');
    expect(result.kmAwal1).toBe('300100');
    expect(result.keterangan).toBe('BA.01');
  });

  it('derives toaShift2 from totalToa - toaShift1 when toaShift2 column is empty but totalToa exists', async () => {
    const derivedHeaderMap: HeaderMap = {
      ...headerMap,
      toaShift2: -1, // No explicit toaShift2 column
    };

    (fetchSheetValues as any).mockResolvedValueOnce({
      result: {
        values: [
          [
            'KWK 222171',
            '4',
            '4',
            '150', // toaShift1
            '',    // not used
            '0',
            '0',
            '250', // totalToa (250 - 150 = 100)
            '300100',
            '300180',
            '',
            '',
            '',
          ],
        ],
      },
    });

    const result = await getBusRowData('sheet-123', '05', 6, derivedHeaderMap);

    expect(result.toaShift1).toBe('150');
    expect(result.toaShift2).toBe('100');
    expect(result.totalToa).toBe('250');
  });

  it('defaults toaShift2 to "0" when both toaShift2 and totalToa are empty (symmetric with fetchSheetData)', async () => {
    (fetchSheetValues as any).mockResolvedValueOnce({
      result: {
        values: [
          [
            'KWK 222171',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
          ],
        ],
      },
    });

    const result = await getBusRowData('sheet-123', '05', 6, headerMap);

    expect(result.toaShift2).toBe('0');
    expect(result.kmAwal1).toBe('');
  });
});
