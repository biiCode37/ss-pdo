import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ingestRegionalRouteSummaries,
  generateDateRange,
  ingestRegionalRouteSummariesForRange,
  ingestSingleRouteSummaryForRange,
  extractRouteDailyMetrics,
} from './regionalIngestionService';
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

  it('does NOT skip routes that have status submitted when data_source is sheet_ingestion (allows Load All to re-sync)', async () => {
    const mockRoutes = [
      { id: 1, route_code: 'JAK 01', route_name: 'Tanjung Priok', default_renops: 20 },
    ];
    (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

    // Mock existing report with status submitted but data_source: 'sheet_ingestion'
    const mockExistingReports = [
      { id: 101, route_id: 1, route_code: 'JAK 01', date: '2026-10-26', status: 'submitted', data_source: 'sheet_ingestion' },
    ];

    const mockRouteSheets = [
      { id: 501, route_id: 1, year: 2026, month: 10, spreadsheet_id: 'sheet-jak01' },
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
      data: [{ unit: '01', tripPergi: '2', tripPulang: '2' }],
      headerMap: {} as any,
      missingColumns: [],
      sheetSummary: { totalKm: 1500, totalPassengers: 2500 },
    });

    const result = await ingestRegionalRouteSummaries('2026-10-26');

    expect(result.success).toBe(true);
    expect(result.skippedFromApp).toBe(0); // NOT skipped!
    expect(result.syncedFromSheet).toBe(1); // Synced from sheet!
    expect(getBusData).toHaveBeenCalledTimes(1);
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

  describe('generateDateRange', () => {
    it('generates array of 7 consecutive dates for a weekly range', () => {
      const dates = generateDateRange('2026-10-18', '2026-10-24');
      expect(dates).toHaveLength(7);
      expect(dates[0]).toBe('2026-10-18');
      expect(dates[6]).toBe('2026-10-24');
    });

    it('returns a single date when start and end dates are identical', () => {
      const dates = generateDateRange('2026-10-24', '2026-10-24');
      expect(dates).toEqual(['2026-10-24']);
    });

    it('returns empty array when dates are invalid', () => {
      expect(generateDateRange('invalid', 'dates')).toEqual([]);
    });
  });

  describe('ingestRegionalRouteSummariesForRange', () => {
    it('returns failure when date range is invalid', async () => {
      const res = await ingestRegionalRouteSummariesForRange('invalid', 'dates');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Rentang tanggal tidak valid');
    });

    it('delegates to ingestRegionalRouteSummaries when start and end date are the same', async () => {
      const mockRoutes = [
        { id: 1, route_code: 'JAK 01', route_name: 'Tanjung Priok', default_renops: 20 },
      ];
      (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            data: [],
            error: null,
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const res = await ingestRegionalRouteSummariesForRange('2026-10-24', '2026-10-24');
      expect(res).toBeDefined();
    });

    it('returns allUpToDate: true immediately without calling Google Sheets when all slots are fresh', async () => {
      const mockRoutes = [
        { id: 1, route_code: 'JAK 01', default_renops: 20 },
        { id: 2, route_code: 'JAK 05', default_renops: 33 },
      ];
      (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

      // 2 hari: 2026-10-18 dan 2026-10-19. Keduanya adalah tanggal lampau.
      const mockExistingReports = [
        { route_id: 1, date: '2026-10-18', status: 'submitted', total_passengers: 1000, total_km: 1500, last_synced_at: '2026-10-18T20:00:00Z' },
        { route_id: 2, date: '2026-10-18', status: 'draft', total_passengers: 800, total_km: 1200, last_synced_at: '2026-10-18T20:00:00Z' },
        { route_id: 1, date: '2026-10-19', status: 'verified', total_passengers: 1100, total_km: 1600, last_synced_at: '2026-10-19T20:00:00Z' },
        { route_id: 2, date: '2026-10-19', status: 'draft', total_passengers: 950, total_km: 1300, last_synced_at: '2026-10-19T20:00:00Z' },
      ];

      const mockFrom = vi.fn((table: string) => {
        if (table === 'daily_route_reports') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: mockExistingReports, error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const res = await ingestRegionalRouteSummariesForRange('2026-10-18', '2026-10-19');
      expect(res.success).toBe(true);
      expect(res.allUpToDate).toBe(true);
      expect(res.syncedFromSheet).toBe(0);
      expect(res.skippedFromApp).toBe(2); // 1 submitted + 1 verified
      expect(res.skippedExisting).toBe(2); // 2 draft lampau yang lengkap
      // Dilarang memanggil getBusData jika semua data sudah lengkap!
      expect(getBusData).not.toHaveBeenCalled();
    });
  });

  describe('extractRouteDailyMetrics', () => {
    it('sets dynamic renops for Sunday (JAK.115 uses renops_sunday = 23 instead of default_renops = 30)', () => {
      const mockRoute = {
        id: 115,
        route_code: 'JAK.115',
        route_name: 'TERMINAL TANJUNG PRIOK - IGI',
        operator_name: 'KOMIDA',
        is_looping: false,
        km_baku: 20,
        default_renops: 30,
        renops_weekday: 30,
        renops_saturday: 26,
        renops_sunday: 23,
        renops_holiday: 23,
      } as any;

      // 2026-10-25 adalah hari Minggu
      const { payload } = extractRouteDailyMetrics(mockRoute, [], null, '2026-10-25');

      expect(payload.renops_shift1).toBe(23);
      expect(payload.renops_shift2).toBe(23);
      expect(payload.route_code).toBe('JAK.115');
    });

    it('sets dynamic renops for Saturday and Weekday appropriately', () => {
      const mockRoute = {
        id: 115,
        route_code: 'JAK.115',
        default_renops: 30,
        renops_weekday: 30,
        renops_saturday: 26,
        renops_sunday: 23,
      } as any;

      // 2026-10-24 adalah hari Sabtu
      const sat = extractRouteDailyMetrics(mockRoute, [], null, '2026-10-24');
      expect(sat.payload.renops_shift1).toBe(26);

      // 2026-10-23 adalah hari Jumat (Weekday)
      const fri = extractRouteDailyMetrics(mockRoute, [], null, '2026-10-23');
      expect(fri.payload.renops_shift1).toBe(30);
    });

    it('classifies unit status accurately into kendala, off, and operating with note', () => {
      const mockRoute = {
        id: 1,
        route_code: 'JAK.01',
        default_renops: 20,
      } as any;

      const mockBuses = [
        // Bus 1: Operating with note
        {
          unit: 'KLM 101',
          tripPergi: '3',
          tripPulang: '3',
          kmAwal1: '100',
          kmAkhir1: '150',
          toaShift1: '50',
          keterangan: 'AC mati siang hari',
        },
        // Bus 2: Kendala (Mogok)
        {
          unit: 'KLM 102',
          tripPergi: '0',
          tripPulang: '0',
          keterangan: 'Mogok di Plumpang',
        },
        // Bus 3: Explicit OFF
        {
          unit: 'KLM 103',
          tripPergi: '0',
          tripPulang: '0',
          keterangan: 'Libur (OFF)',
        },
        // Bus 4: Free-form dynamic note with 0 trips (classified as tidak ops)
        {
          unit: 'KLM 104',
          tripPergi: '0',
          tripPulang: '0',
          keterangan: 'Supir izin pulang kampung',
        },
        // Bus 5: Had trips > 0 but with trouble note (operating with note, counts towards realops)
        {
          unit: 'KLM 105',
          tripPergi: '2',
          tripPulang: '2',
          kmAwal1: '200',
          kmAkhir1: '250',
          toaShift1: '40',
          keterangan: 'Mogok di jalur sore',
        },
      ] as any[];

      const res = extractRouteDailyMetrics(mockRoute, mockBuses, null, '2026-10-26');
      const unitsS1 = res.nonSgoUnitsS1;

      // Bus 1: operating with note
      const b1 = unitsS1.find((u) => u.unit === 'KLM 101');
      expect(b1).toBeDefined();
      expect(b1?.isOperatingWithNote).toBe(true);
      expect(b1?.isOff).toBe(false);
      expect(b1?.note).toBe('AC mati siang hari');

      // Bus 2: kendala mogok trip 0 (isOff should be false -> Rincian Tidak Ops)
      const b2 = unitsS1.find((u) => u.unit === 'KLM 102');
      expect(b2).toBeDefined();
      expect(b2?.isOff).toBe(false);
      expect(b2?.isOperatingWithNote).toBe(false);
      expect(b2?.note).toBe('Mogok di Plumpang');

      // Bus 3: explicit off (isOff should be true -> Unit Libur)
      const b3 = unitsS1.find((u) => u.unit === 'KLM 103');
      expect(b3).toBeDefined();
      expect(b3?.isOff).toBe(true);
      expect(b3?.isOperatingWithNote).toBe(false);
      expect(b3?.note).toBe('Libur (OFF)');

      // Bus 4: free-form note trip 0 without keywords (isOff false -> Rincian Tidak Ops)
      const b4 = unitsS1.find((u) => u.unit === 'KLM 104');
      expect(b4).toBeDefined();
      expect(b4?.isOff).toBe(false);
      expect(b4?.isOperatingWithNote).toBe(false);
      expect(b4?.note).toBe('Supir izin pulang kampung');

      // Bus 5: operated 4 trips with trouble note (isOperatingWithNote true -> Catatan Khusus Unit Beroperasi)
      const b5 = unitsS1.find((u) => u.unit === 'KLM 105');
      expect(b5).toBeDefined();
      expect(b5?.isOperatingWithNote).toBe(true);
      expect(b5?.isOff).toBe(false);
      expect(b5?.note).toBe('Mogok di jalur sore');

      // Realops S1 and S2 should count Bus 1 and Bus 5 (2 operating buses)
      expect(res.activeBusesS1).toBe(2);
      expect(res.payload.realops_shift1).toBe(2);
      expect(res.activeBusesS2).toBe(2);
      expect(res.payload.realops_shift2).toBe(2);

      // S2 non-SGO units should match S1 and never mark operating buses as OFF
      const unitsS2 = res.nonSgoUnitsS2;
      const b1_s2 = unitsS2.find((u) => u.unit === 'KLM 101');
      expect(b1_s2?.isOff).toBe(false);
      expect(b1_s2?.isOperatingWithNote).toBe(true);

      const b5_s2 = unitsS2.find((u) => u.unit === 'KLM 105');
      expect(b5_s2?.isOff).toBe(false);
      expect(b5_s2?.isOperatingWithNote).toBe(true);
    });
  });

  describe('ingestSingleRouteSummaryForRange', () => {
    it('returns failure when date range is invalid', async () => {
      const res = await ingestSingleRouteSummaryForRange('invalid', 'dates', 1);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Rentang tanggal tidak valid');
    });
  });
});

