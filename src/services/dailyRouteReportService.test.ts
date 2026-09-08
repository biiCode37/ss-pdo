import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchRouteMasterList,
  fetchDailyRouteReport,
  fetchDailyRouteReportsByDate,
  upsertDailyRouteReport,
  verifyDailyRouteReport
} from './dailyRouteReportService';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

describe('dailyRouteReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchRouteMasterList returns active routes ordered by route_code', async () => {
    const mockData = [
      { id: 1, route_code: 'JAK.01', route_name: 'TANJUNG PRIOK - PLUMPANG', km_baku: 14.415, target_hk: 5161 },
      { id: 2, route_code: 'JAK.15', route_name: 'TANJUNG PRIOK - RUSUN MARUNDA', km_baku: 29.603, target_hk: 11164 },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
    });

    const routes = await fetchRouteMasterList();
    expect(supabase.from).toHaveBeenCalledWith('routes');
    expect(routes).toHaveLength(2);
    expect(routes[0].route_code).toBe('JAK.01');
    expect(routes[0].km_baku).toBe(14.415);
  });

  it('fetchDailyRouteReport returns single report for route and date', async () => {
    const mockReport = {
      id: 10,
      route_id: 2,
      route_code: 'JAK.15',
      date: '2026-09-02',
      renops_shift1: 60,
      realops_shift1: 58,
      renops_shift2: 60,
      realops_shift2: 58,
      status: 'submitted'
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq1 = vi.fn().mockReturnThis();
    const mockEq2 = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockReport, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: vi.fn().mockImplementation((col: string, val: any) => {
        if (col === 'route_id') return { eq: mockEq2 };
        return { maybeSingle: mockMaybeSingle };
      }),
    });
    // simpler chain mock
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: mockReport, error: null });
    (supabase.from as any).mockReturnValue(chain);

    const result = await fetchDailyRouteReport(2, '2026-09-02');
    expect(result).not.toBeNull();
    expect(result?.route_code).toBe('JAK.15');
    expect(result?.realops_shift1).toBe(58);
  });

  it('upsertDailyRouteReport saves report and returns updated record', async () => {
    const input = {
      route_id: 2,
      route_code: 'JAK.15',
      date: '2026-09-02',
      renops_shift1: 60,
      realops_shift1: 58,
      renops_shift2: 60,
      realops_shift2: 58,
      headway_fastest: 3,
      headway_slowest: 6,
      traffic_jam_spots: ['Jl. Jampea'],
      operational_issues: 'Realisasi berkurang',
      status: 'submitted' as const,
      submitted_by: 'pdo.jak15@transjakarta.co.id'
    };

    const chain: any = {};
    chain.upsert = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: { id: 99, ...input }, error: null });
    (supabase.from as any).mockReturnValue(chain);

    const saved = await upsertDailyRouteReport(input);
    expect(supabase.from).toHaveBeenCalledWith('daily_route_reports');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ route_code: 'JAK.15', status: 'submitted' }),
      { onConflict: 'route_id,date' }
    );
    expect(saved.id).toBe(99);
  });
});
