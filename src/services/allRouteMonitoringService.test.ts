import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRelativeDate,
  fetchRegionalMonitoringData
} from './allRouteMonitoringService';
import { supabase } from './supabase';
import * as dailyReportService from './dailyRouteReportService';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

vi.mock('./dailyRouteReportService', () => ({
  fetchRouteMasterList: vi.fn(),
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
});
