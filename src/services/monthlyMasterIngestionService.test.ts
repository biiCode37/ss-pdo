import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ingestMonthlyMasterSheet,
  parseCSV,
  normalizeRouteCode,
} from './monthlyMasterIngestionService';
import { supabase } from './supabase';
import { fetchRouteMasterList } from './dailyRouteReportService';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('./dailyRouteReportService', () => ({
  fetchRouteMasterList: vi.fn(),
}));

// Mock global fetch for CSV
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('monthlyMasterIngestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSV Parser & Route Code Normalization', () => {
    it('normalizes route codes with dots, spaces, or cases', () => {
      expect(normalizeRouteCode('JAK.01')).toBe('JAK01');
      expect(normalizeRouteCode('JAK 01')).toBe('JAK01');
      expect(normalizeRouteCode('jak 110a')).toBe('JAK110A');
      expect(normalizeRouteCode('JAK.110A')).toBe('JAK110A');
    });

    it('parses CSV with quoted strings and commas correctly', () => {
      const csv = `"Kamis, 01 Oktober 2026","","RUTE","","","",""\n"","1","JAK 01","20","20","3.791,76","2.148","25"`;
      const rows = parseCSV(csv);
      expect(rows.length).toBe(2);
      expect(rows[0][0]).toBe('Kamis, 01 Oktober 2026');
      expect(rows[1][2]).toBe('JAK 01');
      expect(rows[1][5]).toBe('3.791,76');
    });
  });

  describe('ingestMonthlyMasterSheet', () => {
    const mockRoutes = [
      { id: 1, route_code: 'JAK.01', route_name: 'Tanjung Priok', default_renops: 20, km_baku: 14.4 },
      { id: 2, route_code: 'JAK.05', route_name: 'Semper', default_renops: 33, km_baku: 30.9 },
    ];

    it('returns error if spreadsheet URL is invalid', async () => {
      const res = await ingestMonthlyMasterSheet('invalid-url', 'OKTOBER 2026', 2026, 10);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Link spreadsheet tidak valid');
    });

    it('returns error if sheetTabName is empty', async () => {
      const res = await ingestMonthlyMasterSheet(
        'https://docs.google.com/spreadsheets/d/1DJUzeOvjNn170K0LTnJt3s_UWsazDfohyzmxfsdLsYs/edit',
        '',
        2026,
        10
      );
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Nama lembar');
    });

    it('successfully parses master sheet, filters future dates, applies smart skip, and upserts', async () => {
      (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

      // Existing report for JAK 01 on Day 1 is submitted -> must be skipped!
      const mockSelect = vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({
            data: [
              { id: 101, route_id: 1, route_code: 'JAK.01', date: '2026-10-01', status: 'submitted' },
            ],
            error: null,
          }),
        }),
      });

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'daily_route_reports') {
          return {
            select: mockSelect,
            upsert: mockUpsert,
          };
        }
        return {};
      });

      // Sample CSV with Day 1 (1 Okt), Day 2 (2 Okt), and Day 15 (15 Okt)
      const sampleCsv = `
"Kamis, 01 Oktober 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.148","25","2.173","2.883","0","2.883","5.056","189,59","5161","97,97%","1,5","88,89%","1,333","263,0"
"","2","JAK 05","33","33","6.390,97","2.870","95","2.965","3.104","184","3.288","6.253","193,67","6238","100,24%","1,5","97,84%","1,468","206,8"
"Jumat, 02 Oktober 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.000","0","2.000","2.500","0","2.500","4.500","189,59","5161","97,97%","1,5","88,89%","1,333","263,0"
"","2","JAK 05","33","0","0","0","0","0","0","0","0","0","0","0","0%","1,5","0%","0","0"
"Kamis, 15 Oktober 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.148","25","2.173","2.883","0","2.883","5.056","189,59","5161","97,97%","1,5","88,89%","1,333","263,0"
`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(sampleCsv),
      });

      // Override "now" as 14 Oktober 2026
      const nowDateOverride = new Date(2026, 9, 14); // month is 0-indexed in JS Date: 9 = Oktober

      const progressSteps: any[] = [];
      const res = await ingestMonthlyMasterSheet(
        'https://docs.google.com/spreadsheets/d/1DJUzeOvjNn170K0LTnJt3s_UWsazDfohyzmxfsdLsYs/edit',
        'OKTOBER 2026',
        2026,
        10,
        (p) => progressSteps.push(p),
        nowDateOverride
      );

      expect(res.success).toBe(true);
      // Day 1: JAK 01 is skipped (submitted in app), JAK 05 is saved -> 1 saved, 1 skipped
      // Day 2: JAK 01 is saved, JAK 05 has 0 realops and 0 km -> activity guard skips it -> 1 saved
      // Day 15: filtered out because 15 > 14 (nowDateOverride)
      // Total saved = 2 (JAK 05 on Oct 1, JAK 01 on Oct 2)
      // Total skipped = 1 (JAK 01 on Oct 1)
      expect(res.savedCount).toBe(2);
      expect(res.skippedCount).toBe(1);
      expect(res.errors).toEqual([]);
      expect(progressSteps.length).toBeGreaterThan(0);
      expect(mockUpsert).toHaveBeenCalled();
    });
  });
});
