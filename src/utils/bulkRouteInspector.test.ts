import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractRoutePeriodFromTitle,
  inspectBulkRoutesWithConcurrency,
  type BulkRouteItem,
} from './bulkRouteInspector';

vi.mock('../services/googleSheets/transport', () => ({
  fetchSpreadsheetMeta: vi.fn(),
}));

import { fetchSpreadsheetMeta } from '../services/googleSheets/transport';

describe('extractRoutePeriodFromTitle', () => {
  it('harus mengekstrak rute JAK, bulan, dan tahun dari format JAK.77_OKTOBER_2026', () => {
    const res = extractRoutePeriodFromTitle('JAK.77_OKTOBER_2026', 9, 2026);
    expect(res.routeCode).toBe('JAK.77');
    expect(res.month).toBe(10);
    expect(res.year).toBe(2026);
  });

  it('harus menangani titik/spasi ekstra seperti JAK.15_OKTOBER._2026', () => {
    const res = extractRoutePeriodFromTitle('JAK.15_OKTOBER._2026', 9, 2026);
    expect(res.routeCode).toBe('JAK.15');
    expect(res.month).toBe(10);
    expect(res.year).toBe(2026);
  });

  it('harus menggunakan fallbackMonth dan fallbackYear jika judul tidak memuat bulan/tahun', () => {
    const res = extractRoutePeriodFromTitle('JAK.115', 8, 2026);
    expect(res.routeCode).toBe('JAK.115');
    expect(res.month).toBe(8);
    expect(res.year).toBe(2026);
  });

  it('harus mengembalikan routeCode undefined jika format kode tidak ditemukan', () => {
    const res = extractRoutePeriodFromTitle('Spreadsheet Tanpa Kode Rute', 8, 2026);
    expect(res.routeCode).toBeUndefined();
  });
});

describe('inspectBulkRoutesWithConcurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('harus menginspeksi item dan mendeteksi item ready serta duplikat', async () => {
    (fetchSpreadsheetMeta as any)
      .mockResolvedValueOnce({ result: { properties: { title: 'JAK.77_OKTOBER_2026' } } })
      .mockResolvedValueOnce({ result: { properties: { title: 'JAK.15_OKTOBER_2026' } } });

    const items = [
      { id: 'sheet-77', cleanUrl: 'https://docs.google.com/spreadsheets/d/sheet-77' },
      { id: 'sheet-15', cleanUrl: 'https://docs.google.com/spreadsheets/d/sheet-15' },
    ];

    const existingSheets = [
      { routeCode: 'JAK.15', sheet: { month: 10, year: 2026 } },
    ];

    const updates: BulkRouteItem[] = [];
    const results = await inspectBulkRoutesWithConcurrency(
      items,
      10,
      2026,
      existingSheets,
      (updated) => updates.push(updated)
    );

    expect(results).toHaveLength(2);
    expect(results[0].routeCode).toBe('JAK.77');
    expect(results[0].status).toBe('ready');
    expect(results[0].selected).toBe(true);

    expect(results[1].routeCode).toBe('JAK.15');
    expect(results[1].status).toBe('duplicate');
    expect(results[1].selected).toBe(false);
  });

  it('harus menandai error jika API melempar exception (misal 403 akses ditolak)', async () => {
    (fetchSpreadsheetMeta as any).mockRejectedValueOnce(new Error('Permission denied'));

    const items = [
      { id: 'sheet-private', cleanUrl: 'https://docs.google.com/spreadsheets/d/sheet-private' },
    ];

    const results = await inspectBulkRoutesWithConcurrency(
      items,
      10,
      2026,
      [],
      () => {}
    );

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('error');
    expect(results[0].selected).toBe(false);
    expect(results[0].errorMessage).toContain('Permission denied');
  });
});
