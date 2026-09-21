import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestRegionalRouteSummaries } from './regionalIngestionService';
import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';
import { getBusData } from './googleSheets/core';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  isSupabaseConfigured: true,
}));

vi.mock('./dailyRouteReportService', () => ({
  fetchRouteMasterList: vi.fn(),
}));

vi.mock('./googleSheets/core', () => ({
  getBusData: vi.fn(),
}));

describe('regionalIngestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips routes that are already submitted or verified (Smart Skip)', async () => {
    const mockRoutes = [
      { id: 1, route_code: 'JAK 01', route_name: 'Tanjung Priok', default_renops: 20 },
      { id: 2, route_code: 'JAK 05', route_name: 'Semper', default_renops: 33 },
    ];
    (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

    // Mock supabase daily_route_reports: JAK 01 is submitted, JAK 05 is empty
    const mockExistingReports = [
      { id: 101, route_id: 1, route_code: 'JAK 01', date: '2026-09-21', status: 'submitted' },
    ];

    const mockRouteSheets = [
      { id: 501, route_id: 2, year: 2026, month: 9, spreadsheet_id: 'sheet-jak05' },
    ];

    const mockFrom = vi.fn((table: string) => {
      if (table === 'daily_route_reports') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockExistingReports, error: null }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'route_sheets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockRouteSheets, error: null }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });
    (supabase.from as any).mockImplementation(mockFrom);

    (getBusData as any).mockResolvedValue({
      data: [
        { unit: '01', kmAwal1: '100', kmAkhir1: '200', toaShift1: '50', manualShift1: '5', toaShift2: '60', manualShift2: '10', totalToa: '110', tripPergi: '2', tripPulang: '2' }
      ],
      headerMap: {} as any,
      missingColumns: [],
      sheetSummary: {
        totalKm: 3500,
        totalPassengers: 5000,
        totalToaShift1: 2200,
        totalManualShift1: 100,
        totalToaShift2: 2600,
        totalManualShift2: 100,
      },
    });

    const result = await ingestRegionalRouteSummaries('2026-09-21');

    expect(result.success).toBe(true);
    expect(result.skippedFromApp).toBe(1); // JAK 01 skipped
    expect(result.syncedFromSheet).toBe(1); // JAK 05 synced
    expect(getBusData).toHaveBeenCalledTimes(1);
    expect(getBusData).toHaveBeenCalledWith('sheet-jak05', '21');
  });

  it('tolerates partial sheet fetch errors without failing entire batch', async () => {
    const mockRoutes = [
      { id: 1, route_code: 'JAK 01', route_name: 'Tanjung Priok', default_renops: 20 },
      { id: 2, route_code: 'JAK 05', route_name: 'Semper', default_renops: 33 },
    ];
    (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

    const mockFrom = vi.fn((table: string) => {
      if (table === 'daily_route_reports') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'route_sheets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 501, route_id: 1, year: 2026, month: 9, spreadsheet_id: 'sheet-jak01' },
                  { id: 502, route_id: 2, year: 2026, month: 9, spreadsheet_id: 'sheet-broken' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });
    (supabase.from as any).mockImplementation(mockFrom);

    (getBusData as any).mockImplementation((sheetId: string) => {
      if (sheetId === 'sheet-broken') {
        throw new Error('Spreadsheet access denied');
      }
      return Promise.resolve({
        data: [{ unit: '01', tripPergi: '2', tripPulang: '2' }],
        headerMap: {} as any,
        missingColumns: [],
        sheetSummary: { totalKm: 2000, totalPassengers: 3000 },
      });
    });

    const result = await ingestRegionalRouteSummaries('2026-09-21');

    expect(result.success).toBe(true);
    expect(result.syncedFromSheet).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('JAK 05');
  });
});
