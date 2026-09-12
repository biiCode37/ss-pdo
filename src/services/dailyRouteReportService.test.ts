import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchRouteMasterList,
  fetchDailyRouteReport,
  fetchDailyRouteReportsByDate,
  upsertDailyRouteReport,
  verifyDailyRouteReport,
  recordFleetStatusAuditLog,
  fetchFleetStatusAuditLogs
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

  it('fetchRouteMasterList returns active routes ordered by route_code with route_operators join', async () => {
    const mockData = [
      {
        id: 1,
        route_code: 'JAK.01',
        route_name: 'TANJUNG PRIOK - PLUMPANG',
        km_baku: 14.415,
        target_hk: 5161,
        route_operators: [
          { operator_id: 1, operators: { operator_code: 'KLM', operator_name: 'KOLAMAS JAYA' } }
        ]
      },
      {
        id: 2,
        route_code: 'JAK.15',
        route_name: 'TANJUNG PRIOK - RUSUN MARUNDA',
        km_baku: 29.603,
        target_hk: 11164,
        route_operators: [
          { operator_id: 2, operators: { operator_code: 'KWK', operator_name: 'KOPERASI WAHANA KALPIKA' } }
        ]
      },
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
    expect(mockSelect).toHaveBeenCalledWith('*, route_operators(operator_id, operators(*))');
    expect(routes).toHaveLength(2);
    expect(routes[0].route_code).toBe('JAK.01');
    expect(routes[0].km_baku).toBe(14.415);
    expect(routes[0].operators).toHaveLength(1);
    expect(routes[0].operator_name).toContain('KOLAMAS JAYA (KLM)');
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

  it('fetchDailyRouteReportsByDate returns array of reports', async () => {
    const mockReports = [
      { id: 10, route_code: 'JAK.15', date: '2026-09-02' },
      { id: 11, route_code: 'JAK.01', date: '2026-09-02' }
    ];

    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockResolvedValue({ data: mockReports, error: null });
    (supabase.from as any).mockReturnValue(chain);

    const results = await fetchDailyRouteReportsByDate('2026-09-02');
    expect(results).toHaveLength(2);
  });

  it('verifyDailyRouteReport updates report status to verified', async () => {
    const chain: any = {};
    chain.update = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue(chain);

    const ok = await verifyDailyRouteReport(10, 'korlap@transjakarta.co.id');
    expect(ok).toBe(true);
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

  it('upsertDailyRouteReport saves fleet status snapshots and confirmation flags', async () => {
    const inputWithFleet = {
      route_id: 1,
      route_code: 'JAK.01',
      date: '2026-09-10',
      renops_shift1: 15,
      realops_shift1: 14,
      renops_shift2: 15,
      realops_shift2: 15,
      headway_fastest: 3,
      headway_slowest: 10,
      traffic_jam_spots: [],
      status: 'draft' as const,
      fleet_status_shift1: [
        { unit: 'TJ-001', note: 'TO.EVDAL', isOff: false },
        { unit: 'TJ-002', note: 'OFF', isOff: true }
      ],
      is_fleet_confirmed_s1: true,
      fleet_confirmed_s1_at: '2026-09-10T05:30:00Z',
    };

    const chain: any = {};
    chain.upsert = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: { id: 101, ...inputWithFleet }, error: null });
    (supabase.from as any).mockReturnValue(chain);

    const saved = await upsertDailyRouteReport(inputWithFleet);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        route_code: 'JAK.01',
        is_fleet_confirmed_s1: true,
        fleet_status_shift1: [
          { unit: 'TJ-001', note: 'TO.EVDAL', isOff: false },
          { unit: 'TJ-002', note: 'OFF', isOff: true }
        ],
      }),
      { onConflict: 'route_id,date' }
    );
    expect(saved.fleet_status_shift1).toHaveLength(2);
  });

  describe('fleet_status_logs audit trail', () => {
    it('recordFleetStatusAuditLog performs insert without mutation', async () => {
      const mockPayload = {
        route_id: 1,
        route_code: 'JAK.01',
        date: '2026-09-12',
        shift: 1 as const,
        sgo_count: 18,
        to_count: 1,
        off_count: 1,
        total_units: 20,
        fleet_status: [
          { unit: 'JAK.01-02', note: 'OFF', isOff: true }
        ],
        confirmed_by: 'petugas@transjakarta.co.id'
      };

      const chain: any = {};
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.select = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: { id: 1, ...mockPayload }, error: null });
      (supabase.from as any).mockReturnValue(chain);

      const res = await recordFleetStatusAuditLog(mockPayload);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          route_code: 'JAK.01',
          sgo_count: 18,
          to_count: 1,
          off_count: 1,
        })
      );
      expect(res).not.toBeNull();
      expect(res?.id).toBe(1);
    });

    it('fetchFleetStatusAuditLogs retrieves logs ordered by created_at desc', async () => {
      const mockLogs = [
        { id: 2, route_code: 'JAK.01', shift: 2 },
        { id: 1, route_code: 'JAK.01', shift: 1 }
      ];

      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockResolvedValue({ data: mockLogs, error: null });
      (supabase.from as any).mockReturnValue(chain);

      const logs = await fetchFleetStatusAuditLogs(1, '2026-09-12');
      expect(logs).toHaveLength(2);
      expect(logs[0].id).toBe(2);
    });
  });
});
