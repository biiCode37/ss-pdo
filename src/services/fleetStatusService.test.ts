import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchFleetStatusesMaster,
  fetchDailyFleetShift,
  upsertDailyFleetShift,
  fetchDailyFleetShiftsByDate,
} from './fleetStatusService';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('fleetStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchFleetStatusesMaster', () => {
    it('returns active statuses ordered by sort_order ascending', async () => {
      const mockStatuses = [
        { id: 1, code: 'SGO', name: 'Siap Guna Operasi', default_note: '', is_operational: true, is_editable_note: false, sort_order: 1, is_active: true },
        { id: 2, code: 'TO', name: 'T.O', default_note: 'EVDAL', is_operational: false, is_editable_note: true, sort_order: 2, is_active: true },
        { id: 3, code: 'OFF', name: 'Libur', default_note: 'LIBUR', is_operational: false, is_editable_note: false, sort_order: 3, is_active: true },
        { id: 4, code: 'SO', name: 'Stop Operasi', default_note: '', is_operational: false, is_editable_note: true, sort_order: 4, is_active: true },
      ];

      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockResolvedValue({ data: mockStatuses, error: null });

      (supabase.from as any).mockReturnValue(chain);

      const result = await fetchFleetStatusesMaster();
      expect(supabase.from).toHaveBeenCalledWith('fleet_statuses');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result).toHaveLength(4);
      expect(result[0].code).toBe('SGO');
      expect(result[3].code).toBe('SO');
    });

    it('returns fallback default statuses when query fails or error occurs', async () => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });

      (supabase.from as any).mockReturnValue(chain);

      const result = await fetchFleetStatusesMaster();
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.some(s => s.code === 'SGO')).toBe(true);
      expect(result.some(s => s.code === 'SO')).toBe(true);
    });
  });

  describe('fetchDailyFleetShift', () => {
    it('returns shift header with its non-SGO units', async () => {
      const mockShift = {
        id: 101,
        route_id: 1,
        route_code: 'JAK.01',
        date: '2026-09-21',
        shift: 1,
        target_renops: 20,
        realops: 18,
        total_units: 20,
        sgo_count: 18,
        to_count: 1,
        off_count: 1,
        so_count: 0,
        other_count: 0,
        is_confirmed: true,
        confirmed_by: 'pengawas@example.com',
        confirmed_at: '2026-09-21T06:30:00Z',
      };

      const mockUnits = [
        { id: 1, fleet_shift_id: 101, unit_body: 'KWK 222177', status_id: 2, status_code: 'TO', note: 'EVDAL' },
        { id: 2, fleet_shift_id: 101, unit_body: 'KWK 222180', status_id: 3, status_code: 'OFF', note: 'LIBUR' },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        if (table === 'daily_fleet_shifts') {
          chain.maybeSingle = vi.fn().mockResolvedValue({ data: mockShift, error: null });
        } else if (table === 'daily_fleet_non_sgo_units') {
          chain.order = vi.fn().mockResolvedValue({ data: mockUnits, error: null });
        }
        return chain;
      });

      const result = await fetchDailyFleetShift(1, '2026-09-21', 1);
      expect(result).not.toBeNull();
      expect(result?.route_code).toBe('JAK.01');
      expect(result?.is_confirmed).toBe(true);
      expect(result?.non_sgo_units).toHaveLength(2);
      expect(result?.non_sgo_units[0].unit_body).toBe('KWK 222177');
    });

    it('returns null if shift report is not found', async () => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as any).mockReturnValue(chain);

      const result = await fetchDailyFleetShift(99, '2026-09-21', 1);
      expect(result).toBeNull();
    });
  });

  describe('upsertDailyFleetShift', () => {
    it('upserts header and replaces non-SGO units', async () => {
      const shiftInput = {
        route_id: 1,
        route_code: 'JAK.01',
        date: '2026-09-21',
        shift: 1 as const,
        target_renops: 20,
        realops: 19,
        total_units: 20,
        sgo_count: 19,
        to_count: 1,
        off_count: 0,
        so_count: 0,
        other_count: 0,
        is_confirmed: true,
        confirmed_by: 'pengawas@example.com',
        confirmed_at: '2026-09-21T07:00:00Z',
      };

      const nonSgoUnitsInput = [
        { unit_body: 'KWK 222177', status_id: 2, status_code: 'TO', note: 'EVDAL' },
      ];

      const savedShift = { id: 200, ...shiftInput };

      (supabase.from as any).mockImplementation((table: string) => {
        const chain: any = {};
        chain.upsert = vi.fn().mockReturnValue(chain);
        chain.select = vi.fn().mockReturnValue(chain);
        chain.single = vi.fn().mockResolvedValue({ data: savedShift, error: null });
        chain.delete = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockResolvedValue({ error: null });
        chain.insert = vi.fn().mockReturnValue(chain);
        return chain;
      });

      const result = await upsertDailyFleetShift(shiftInput, nonSgoUnitsInput);
      expect(result.id).toBe(200);
      expect(result.realops).toBe(19);
      expect(result.non_sgo_units).toHaveLength(1);
      expect(result.non_sgo_units[0].unit_body).toBe('KWK 222177');
    });
  });

  describe('fetchDailyFleetShiftsByDate', () => {
    it('returns array of shifts with units for given date', async () => {
      const mockShifts = [
        { id: 101, route_id: 1, route_code: 'JAK.01', date: '2026-09-21', shift: 1, target_renops: 20, realops: 18, is_confirmed: true },
        { id: 102, route_id: 2, route_code: 'JAK.15', date: '2026-09-21', shift: 1, target_renops: 60, realops: 58, is_confirmed: true },
      ];
      const mockUnits = [
        { id: 1, fleet_shift_id: 101, unit_body: 'KWK 222177', status_id: 2, status_code: 'TO', note: 'EVDAL' },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockImplementation(() => chain);
        chain.in = vi.fn().mockResolvedValue({ data: mockUnits, error: null });
        chain.then = (resolve: any) => Promise.resolve({ data: mockShifts, error: null }).then(resolve);
        return chain;
      });

      const result = await fetchDailyFleetShiftsByDate('2026-09-21', 1);
      expect(result).toHaveLength(2);
      expect(result[0].route_code).toBe('JAK.01');
      expect(result[0].non_sgo_units).toHaveLength(1);
      expect(result[1].route_code).toBe('JAK.15');
      expect(result[1].non_sgo_units).toHaveLength(0);
    });
  });
});
