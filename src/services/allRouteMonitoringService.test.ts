import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRelativeDate,
  fetchRegionalMonitoringData,
  syncRegionalDailyFromGlobalSheet,
  calculateSupervisorSummaries,
  fetchRegionalPeriodMonitoringData
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

  describe('calculateSupervisorSummaries', () => {
    it('groups routes and computes supervisor team summaries accurately', () => {
      const mockRoutes = [
        {
          id: 1,
          routeCode: 'JAK.60',
          routeName: 'Kelapa Gading - Rusun',
          operatorName: 'Mikrotrans',
          isLooping: true,
          kmBaku: 33.74,
          targetHk: 6853,
          bestRecord: 7000,
          supervisorName: 'Ranto Lumban Toruan',
          defaultRenops: 35,
          renopsShift1: 35,
          realopsShift1: 34,
          renopsShift2: 35,
          realopsShift2: 34,
          totalRenops: 35,
          totalRealops: 34,
          headwayFastest: 3,
          headwaySlowest: 10,
          trafficJamSpots: [],
          operationalIssues: '',
          status: 'submitted' as const,
          todayPassengers: 5297,
          yesterdayPassengers: 5000,
          lastWeekPassengers: 4800,
          totalKm: 6680.52,
          achievementKm: 196.49,
          totalTrips: 396,
          totalRitasePp: 198,
          toaShift1: 3078,
          manualShift1: 0,
          totalShift1: 3078,
          toaShift2: 1863,
          manualShift2: 356,
          totalShift2: 2219,
        },
        {
          id: 2,
          routeCode: 'JAK.05',
          routeName: 'Semper - Rorotan',
          operatorName: 'Mikrotrans',
          isLooping: false,
          kmBaku: 30.897,
          targetHk: 7315,
          bestRecord: 7500,
          supervisorName: 'Abdul Manan',
          defaultRenops: 33,
          renopsShift1: 33,
          realopsShift1: 33,
          renopsShift2: 33,
          realopsShift2: 33,
          totalRenops: 33,
          totalRealops: 33,
          headwayFastest: 3,
          headwaySlowest: 10,
          trafficJamSpots: [],
          operationalIssues: '',
          status: 'submitted' as const,
          todayPassengers: 6253,
          yesterdayPassengers: 6100,
          lastWeekPassengers: 5900,
          totalKm: 6390.97,
          achievementKm: 193.67,
          totalTrips: 414,
          totalRitasePp: 207,
          toaShift1: 2870,
          manualShift1: 95,
          totalShift1: 2965,
          toaShift2: 3104,
          manualShift2: 184,
          totalShift2: 3288,
        },
        {
          id: 3,
          routeCode: 'JAK.01',
          routeName: 'Tg Priok - Plumpang',
          operatorName: 'Mikrotrans',
          isLooping: true,
          kmBaku: 14.415,
          targetHk: 5161,
          bestRecord: 5200,
          supervisorName: 'Moamar Z.A. Mahu',
          defaultRenops: 20,
          renopsShift1: 20,
          realopsShift1: 20,
          renopsShift2: 20,
          realopsShift2: 20,
          totalRenops: 20,
          totalRealops: 20,
          headwayFastest: 2,
          headwaySlowest: 8,
          trafficJamSpots: [],
          operationalIssues: '',
          status: 'submitted' as const,
          todayPassengers: 5056,
          yesterdayPassengers: 4900,
          lastWeekPassengers: 4700,
          totalKm: 3791.76,
          achievementKm: 189.59,
          totalTrips: 526,
          totalRitasePp: 263,
          toaShift1: 2148,
          manualShift1: 25,
          totalShift1: 2173,
          toaShift2: 2883,
          manualShift2: 0,
          totalShift2: 2883,
        }
      ];

      const summaries = calculateSupervisorSummaries(mockRoutes as any);

      expect(summaries).toHaveLength(3);
      const ranto = summaries.find((s) => s.id === 'RANTO');
      const abdul = summaries.find((s) => s.id === 'ABDUL');
      const moamar = summaries.find((s) => s.id === 'MOAMAR');

      expect(ranto).toBeDefined();
      expect(ranto?.totalRenops).toBe(35);
      expect(ranto?.totalRealops).toBe(34);
      expect(ranto?.totalKm).toBeCloseTo(6680.52);
      expect(ranto?.totalTodayPassengers).toBe(5297);
      expect(ranto?.totalRitasePp).toBe(198);
      expect(ranto?.targetAchievementPercentage).toBeCloseTo((5297 / 6853) * 100, 1);

      expect(abdul).toBeDefined();
      expect(abdul?.totalRenops).toBe(33);
      expect(abdul?.totalRealops).toBe(33);
      expect(abdul?.totalKm).toBeCloseTo(6390.97);

      expect(moamar).toBeDefined();
      expect(moamar?.totalTodayPassengers).toBe(5056);
      expect(moamar?.totalRitasePp).toBe(263);
    });
  });

  describe('fetchRegionalPeriodMonitoringData', () => {
    it('aggregates multi-day reports across routes and computes supervisor summaries', async () => {
      vi.mocked(dailyReportService.fetchRouteMasterList).mockResolvedValue([
        {
          id: 1,
          route_code: 'JAK.60',
          route_name: 'Kelapa Gading - Rusun',
          operator_name: 'Mikrotrans',
          is_looping: true,
          km_baku: 33.74,
          target_hk: 6853,
          best_record: 7000,
          supervisor_name: 'Ranto Lumban Toruan',
          default_renops: 35,
        } as any,
      ]);

      const mockPeriodReports = [
        {
          id: 101,
          route_id: 1,
          route_code: 'JAK.60',
          date: '2026-10-01',
          renops_shift1: 35,
          realops_shift1: 34,
          renops_shift2: 35,
          realops_shift2: 34,
          total_passengers: 5000,
          total_km: 6600,
          total_trip: 390,
          toa_shift1: 3000,
          manual_shift1: 0,
          toa_shift2: 2000,
          manual_shift2: 0,
        },
        {
          id: 102,
          route_id: 1,
          route_code: 'JAK.60',
          date: '2026-10-02',
          renops_shift1: 35,
          realops_shift1: 35,
          renops_shift2: 35,
          realops_shift2: 35,
          total_passengers: 5200,
          total_km: 6700,
          total_trip: 396,
          toa_shift1: 3100,
          manual_shift1: 0,
          toa_shift2: 2100,
          manual_shift2: 0,
        },
      ];

      const mockGte = vi.fn().mockReturnThis();
      const mockLte = vi.fn().mockResolvedValue({ data: mockPeriodReports, error: null });
      const mockSelect = vi.fn().mockReturnValue({ gte: mockGte, lte: mockLte });
      mockGte.mockReturnValue({ lte: mockLte });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'daily_route_reports') {
          return { select: mockSelect } as any;
        }
        return { select: vi.fn().mockResolvedValue({ data: [] }) } as any;
      });

      const result = await fetchRegionalPeriodMonitoringData('2026-10-01', '2026-10-02');

      expect(result.date).toBe('2026-10-01 s.d. 2026-10-02');
      expect(result.routes).toHaveLength(1);
      expect(result.totalTodayPassengers).toBe(10200);
      expect(result.totalKm).toBe(13300);
      expect(result.totalTrips).toBe(786);
      expect(result.supervisorSummaries).toBeDefined();
      expect(result.supervisorSummaries).toHaveLength(3);

      const ranto = result.supervisorSummaries?.find((s) => s.id === 'RANTO');
      expect(ranto?.totalTodayPassengers).toBe(10200);
      expect(ranto?.totalKm).toBe(13300);
    });
  });
});
