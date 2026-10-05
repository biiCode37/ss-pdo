import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRelativeDate,
  fetchRegionalMonitoringData,
  syncRegionalDailyFromGlobalSheet
} from './allRouteMonitoringService';
import { supabase } from './supabase';
import * as dailyReportService from './dailyRouteReportService';
import * as googleSheetsService from './googleSheets';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

vi.mock('./dailyRouteReportService', () => ({
  fetchRouteMasterList: vi.fn(),
  syncRouteMetricsToReport: vi.fn(),
}));

vi.mock('./googleSheets', () => ({
  fetchGlobalReportDailyMetrics: vi.fn(),
}));

describe('allRouteMonitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates yesterday and last week dates correctly across months', () => {
    expect(getRelativeDate('2026-09-02', -1)).toBe('2026-09-01');
    expect(getRelativeDate('2026-09-02', -7)).toBe('2026-08-26');
    expect(getRelativeDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(getRelativeDate('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('aggregates route items and regional totals correctly', async () => {
    const mockRoutes = [
      {
        id: 1,
        route_code: 'JAK.01',
        route_name: 'TG. PRIOK - PLUMPANG',
        operator_name: 'KOLAMAS',
        is_looping: true,
        km_baku: 14.415,
        target_hk: 5161,
        best_record: 5201,
        default_renops: 20,
        supervisor_name: 'MOAMAR. Z.A. MAHU',
        default_traffic_jam_spots: ['Pasar Warakas']
      },
      {
        id: 2,
        route_code: 'JAK.15',
        route_name: 'TG. PRIOK - RUSUN MARUNDA',
        operator_name: 'KWK',
        is_looping: false,
        km_baku: 29.603,
        target_hk: 11164,
        best_record: 10207,
        default_renops: 60,
        supervisor_name: 'ABDUL MANAN',
        default_traffic_jam_spots: ['Jl. Jampea']
      }
    ];

    (dailyReportService.fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

    // Mock reports
    const mockReports = [
      {
        route_id: 1,
        route_code: 'JAK.01',
        date: '2026-09-02',
        renops_shift1: 20,
        realops_shift1: 20,
        renops_shift2: 20,
        realops_shift2: 20,
        headway_fastest: 2,
        headway_slowest: 16,
        traffic_jam_spots: ['Pasar Warakas'],
        operational_issues: '',
        status: 'submitted'
      }
    ];

    // Mock summaries
    const mockSummaries = [
      {
        route_code: 'JAK.01',
        year: 2026,
        month: 9,
        day: 2,
        total_km: 3500,
        toa_shift1: 1873,
        manual_shift1: 0,
        toa_shift2: 3204,
        manual_shift2: 0,
        total_passengers: 5077
      },
      {
        route_code: 'JAK.01',
        year: 2026,
        month: 9,
        day: 1,
        total_passengers: 4937
      },
      {
        route_code: 'JAK.01',
        year: 2026,
        month: 8,
        day: 26,
        total_passengers: 5189
      }
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'daily_route_reports') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockReports, error: null })
        };
      }
      if (table === 'daily_unit_summaries') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockResolvedValue({ data: mockSummaries, error: null })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const result = await fetchRegionalMonitoringData('2026-09-02');

    expect(result.date).toBe('2026-09-02');
    expect(result.yesterdayDate).toBe('2026-09-01');
    expect(result.lastWeekDate).toBe('2026-08-26');
    expect(result.routes).toHaveLength(2);

    const jak01 = result.routes.find(r => r.routeCode === 'JAK.01');
    expect(jak01).toBeDefined();
    expect(jak01?.todayPassengers).toBe(5077);
    expect(jak01?.yesterdayPassengers).toBe(4937);
    expect(jak01?.lastWeekPassengers).toBe(5189);
    expect(jak01?.totalRenops).toBe(20);
    expect(jak01?.totalRealops).toBe(20);
    expect(jak01?.status).toBe('submitted');

    const jak15 = result.routes.find(r => r.routeCode === 'JAK.15');
    expect(jak15?.status).toBe('empty');

    expect(result.submittedCount).toBe(1);
    expect(result.emptyCount).toBe(1);
    expect(result.totalTodayPassengers).toBe(5077);
  });

  it('prioritizes pre-synced metrics from daily_route_reports over unit summaries', async () => {
    const mockRoutes = [
      {
        id: 1,
        route_code: 'JAK.01',
        route_name: 'TG. PRIOK - PLUMPANG',
        operator_name: 'KOLAMAS',
        is_looping: true,
        km_baku: 14.415,
        target_hk: 5161,
        best_record: 5201,
        default_renops: 20,
        supervisor_name: 'MOAMAR. Z.A. MAHU',
        default_traffic_jam_spots: []
      }
    ];

    (dailyReportService.fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

    // Pre-synced metrics di daily_route_reports
    const mockReports = [
      {
        route_id: 1,
        route_code: 'JAK.01',
        date: '2026-09-02',
        renops_shift1: 20,
        realops_shift1: 20,
        toa_shift1: 1900,
        manual_shift1: 10,
        toa_shift2: 3200,
        manual_shift2: 20,
        total_passengers: 5130,
        total_km: 3600,
        achievement_km: 180,
        total_trip: 250,
        status: 'verified'
      }
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'daily_route_reports') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockReports, error: null })
        };
      }
      if (table === 'daily_unit_summaries') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const result = await fetchRegionalMonitoringData('2026-09-02');
    const jak01 = result.routes[0];

    expect(jak01.todayPassengers).toBe(5130);
    expect(jak01.totalKm).toBe(3600);
    expect(jak01.toaShift1).toBe(1900);
    expect(jak01.manualShift1).toBe(10);
    expect(jak01.totalShift1).toBe(1910);
    expect(jak01.achievementKm).toBe(180);
    expect(result.totalTodayPassengers).toBe(5130);
    expect(result.totalKm).toBe(3600);
  });

  it('syncs 18 routes from global spreadsheet to daily_route_reports', async () => {
    const mockRoutes = [
      { id: 1, route_code: 'JAK.01' },
      { id: 2, route_code: 'JAK.05' }
    ];
    (dailyReportService.fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

    const mockMetricsMap = new Map();
    mockMetricsMap.set('JAK.01', {
      routeCode: 'JAK.01',
      renops: 20,
      realops: 20,
      kmTempuh: 3560.96,
      toaShift1: 1873,
      manualShift1: 0,
      totalShift1: 1873,
      toaShift2: 3204,
      manualShift2: 0,
      totalShift2: 3204,
      totalPassengers: 5077,
      kmPerBus: 178.05,
      targetPassengers: 5161,
      totalRitase: 247,
    });

    (googleSheetsService.fetchGlobalReportDailyMetrics as any).mockResolvedValue(mockMetricsMap);

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'daily_route_reports') {
        return {
          upsert: mockUpsert
        };
      }
      return {};
    });

    const syncResult = await syncRegionalDailyFromGlobalSheet(
      '2026-09-02',
      'https://docs.google.com/spreadsheets/d/test-global-id/edit',
      'SEPTEMBER 2026'
    );

    expect(syncResult.success).toBe(true);
    expect(syncResult.syncedCount).toBe(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        route_id: 1,
        route_code: 'JAK.01',
        date: '2026-09-02',
        total_passengers: 5077,
        total_km: 3560.96,
        total_trip: 247
      }),
      { onConflict: 'route_id,date' }
    );
  });

  it('maps 21 metric columns including pure computation ratios and dataSource provenance', async () => {
    const mockRoutes = [
      {
        id: 1,
        route_code: 'JAK.01',
        route_name: 'TG. PRIOK - PLUMPANG',
        operator_name: 'KOLAMAS',
        target_hk: 5000,
        km_baku: 14.5,
        default_renops: 20,
      },
      {
        id: 2,
        route_code: 'JAK.15',
        route_name: 'TG. PRIOK - RUSUN MARUNDA',
        operator_name: 'KWK',
        target_hk: 10000,
        km_baku: 29.6,
        default_renops: 60,
      }
    ];

    (dailyReportService.fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

    const mockReports = [
      {
        route_id: 1,
        route_code: 'JAK.01',
        date: '2026-09-02',
        renops_shift1: 20,
        realops_shift1: 20,
        renops_shift2: 20,
        realops_shift2: 20,
        total_passengers: 5000,
        total_km: 2500,
        total_trip: 200,
        data_source: 'sheet_ingestion',
        status: 'draft',
      },
      {
        route_id: 2,
        route_code: 'JAK.15',
        date: '2026-09-02',
        renops_shift1: 50,
        realops_shift1: 50,
        renops_shift2: 50,
        realops_shift2: 50,
        total_passengers: 8000,
        total_km: 4000,
        total_trip: 400,
        status: 'submitted', // no explicit data_source -> defaults to 'app_input'
      }
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'daily_route_reports') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockReports, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const result = await fetchRegionalMonitoringData('2026-09-02');
    const jak01 = result.routes.find((r) => r.routeCode === 'JAK.01')!;
    const jak15 = result.routes.find((r) => r.routeCode === 'JAK.15')!;

    // Provenance
    expect(jak01.dataSource).toBe('sheet_ingestion');
    expect(jak15.dataSource).toBe('app_input');

    // 21 columns / pure computation ratios:
    expect(jak01.targetPercentage).toBe(100);
    expect(jak01.targetPassengersPerKm).toBe(1.5);
    expect(jak01.passengersPerKm).toBe(2);
    expect(jak01.passengersPerKmPercentage).toBeCloseTo(133.33, 1);
    expect(jak01.totalTrips).toBe(200);
    expect(jak01.tripsPerBus).toBe(10);
    expect(jak01.passengersPerBus).toBe(250);

    // Aggregates
    expect(result.sheetSyncCount).toBe(1);
    expect(result.appInputCount).toBe(1);
  });
});
