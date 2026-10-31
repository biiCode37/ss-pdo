// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRollingFromYesterday,
  calculateAutoInheritedStartPoints,
  fetchDailyPlotting,
  saveDailyPlotting,
} from './dailyPlottingService';
import { supabase } from './supabase';
import type { DailyRoutePlotting, UnitPlottingItem } from '@/types/supabase';
import type { BusData } from './googleSheets';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('dailyPlottingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('generateRollingFromYesterday', () => {
    it('memutar unit #1 ke urutan paling akhir untuk masing-masing titik start A dan B', () => {
      const yesterdayUnits: UnitPlottingItem[] = [
        { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-02', order: 2, start_point: 'A', target_ritase: 7.0, status: 'READY' },
        { unit: 'TJ-03', order: 3, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-04', order: 1, start_point: 'B', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-05', order: 2, start_point: 'B', target_ritase: 7.0, status: 'READY' },
      ];

      const rolled = generateRollingFromYesterday(yesterdayUnits);

      // Titik A: TJ-01 (tadinya #1) harus pindah ke paling akhir (#3). TJ-02 naik jadi #1, TJ-03 naik jadi #2
      const unitsA = rolled.filter((u) => u.start_point === 'A').sort((a, b) => a.order - b.order);
      expect(unitsA[0].unit).toBe('TJ-02');
      expect(unitsA[0].order).toBe(1);
      expect(unitsA[1].unit).toBe('TJ-03');
      expect(unitsA[1].order).toBe(2);
      expect(unitsA[2].unit).toBe('TJ-01');
      expect(unitsA[2].order).toBe(3);

      // Titik B: TJ-04 (tadinya #1) harus pindah ke paling akhir (#2). TJ-05 naik jadi #1
      const unitsB = rolled.filter((u) => u.start_point === 'B').sort((a, b) => a.order - b.order);
      expect(unitsB[0].unit).toBe('TJ-05');
      expect(unitsB[0].order).toBe(1);
      expect(unitsB[1].unit).toBe('TJ-04');
      expect(unitsB[1].order).toBe(2);
    });

    it('menangani kasus jika pangkalan hanya memiliki 1 unit tanpa error', () => {
      const singleUnit: UnitPlottingItem[] = [
        { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.0, status: 'READY' },
      ];

      const rolled = generateRollingFromYesterday(singleUnit);
      expect(rolled).toHaveLength(1);
      expect(rolled[0].unit).toBe('TJ-01');
      expect(rolled[0].order).toBe(1);
    });
  });

  describe('calculateAutoInheritedStartPoints', () => {
    it('menentukan titik start hari ini berdasarkan hukum ritase kemarin (bulat = tetap, setengah = seberang)', () => {
      const yesterdayPlotting: DailyRoutePlotting = {
        route_id: 1,
        route_code: 'JAK.115',
        date: '2026-10-30',
        units_data: [
          { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
          { unit: 'TJ-02', order: 2, start_point: 'A', target_ritase: 7.0, status: 'READY' },
          { unit: 'TJ-03', order: 1, start_point: 'B', target_ritase: 7.5, status: 'READY' },
        ],
      };

      const yesterdayBuses: Partial<BusData>[] = [
        // TJ-01: kemarin start di A, dapat 7.5 rit (15 trip) -> tidur di B -> hari ini start di B
        { unit: 'TJ-01', tripPergi: '8', tripPulang: '7' },
        // TJ-02: kemarin start di A, dapat 7.0 rit (14 trip) -> tidur di A -> hari ini tetap start di A
        { unit: 'TJ-02', tripPergi: '7', tripPulang: '7' },
        // TJ-03: kemarin start di B, dapat 7.5 rit (15 trip) -> tidur di A -> hari ini start di A
        { unit: 'TJ-03', tripPergi: '7', tripPulang: '8' },
      ];

      const inherited = calculateAutoInheritedStartPoints(
        yesterdayPlotting,
        yesterdayBuses as BusData[],
      );

      expect(inherited.get('TJ-01')).toBe('B');
      expect(inherited.get('TJ-02')).toBe('A');
      expect(inherited.get('TJ-03')).toBe('A');
    });
  });

  describe('fetchDailyPlotting & saveDailyPlotting', () => {
    it('menyimpan ke local storage dan memanggil supabase upsert', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            route_id: 1,
            route_code: 'JAK.115',
            date: '2026-10-31',
            units_data: [],
          },
          error: null,
        }),
      });

      const mockUpsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert,
      });

      const payload = {
        route_id: 1,
        route_code: 'JAK.115',
        date: '2026-10-31',
        endpoint_a_name: 'Priok',
        endpoint_b_name: 'IGI',
        units_data: [
          { unit: 'TJ-01', order: 1, start_point: 'A' as const, target_ritase: 7.5, status: 'READY' as const },
        ],
      };

      const saved = await saveDailyPlotting(payload);
      expect(saved.route_code).toBe('JAK.115');

      // Cek localStorage fallback tersimpan
      const localCached = localStorage.getItem('SS_PLOTTING_1_2026-10-31');
      expect(localCached).toBeDefined();
      expect(JSON.parse(localCached || '{}').route_code).toBe('JAK.115');
    });

    it('memuat data dari local storage jika supabase gagal/offline', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network offline' } }),
            }),
          }),
        }),
      });

      // Simpan di cache lokal
      localStorage.setItem(
        'SS_PLOTTING_1_2026-10-31',
        JSON.stringify({
          id: 99,
          route_id: 1,
          route_code: 'JAK.115',
          date: '2026-10-31',
          units_data: [{ unit: 'TJ-LOCAL', order: 1, start_point: 'A', target_ritase: 7.0, status: 'READY' }],
        }),
      );

      const result = await fetchDailyPlotting(1, '2026-10-31');
      expect(result).not.toBeNull();
      expect(result?.units_data[0].unit).toBe('TJ-LOCAL');
    });
  });
});
