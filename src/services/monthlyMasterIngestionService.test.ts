import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ingestMonthlyMasterSheet,
  parseMonthAndYearFromTab,
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
(globalThis as any).fetch = mockFetch;

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

  describe('parseMonthAndYearFromTab', () => {
    it('parses standard Indonesian month names and 4-digit years', () => {
      const res = parseMonthAndYearFromTab('SEPTEMBER 2026', 2026, 10);
      expect(res.month).toBe(9);
      expect(res.year).toBe(2026);
      expect(res.monthName).toBe('September');
      expect(res.isDetected).toBe(true);
    });

    it('parses abbreviations and lowercase formats', () => {
      const res1 = parseMonthAndYearFromTab('agu 2026');
      expect(res1.month).toBe(8);
      expect(res1.year).toBe(2026);
      expect(res1.isDetected).toBe(true);

      const res2 = parseMonthAndYearFromTab('Sept 2025');
      expect(res2.month).toBe(9);
      expect(res2.year).toBe(2025);
      expect(res2.isDetected).toBe(true);
    });

    it('falls back to default month and year when tab name is generic', () => {
      const res = parseMonthAndYearFromTab('Data Wilayah', 2026, 10);
      expect(res.month).toBe(10);
      expect(res.year).toBe(2026);
      expect(res.isDetected).toBe(false);
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

      const nowDateOverride = new Date(2026, 9, 14);

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
      expect(res.savedCount).toBe(2);
      expect(res.skippedCount).toBe(1);
      expect(res.errors).toEqual([]);
      expect(progressSteps.length).toBeGreaterThan(0);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('smartly ingests full past month (September) even if caller passed currentMonth=10', async () => {
      (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

      const mockSelect = vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({
            data: [],
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

      // Sample CSV for September with Day 1 and Day 30
      const septCsv = `
"Selasa, 01 September 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.229","0","2.229","2.661","47","2.708","4.937","196,76","5161","95,66%","1,5","83,64%","1,255","273,0"
"Rabu, 30 September 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.100","0","2.100","2.600","0","2.600","4.700","196,76","5161","95,66%","1,5","83,64%","1,255","273,0"
`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(septCsv),
      });

      // When caller accidentally passes targetMonth = 10 and targetYear = 2026,
      // but sheetTabName is "SEPTEMBER 2026"
      const nowDateOverride = new Date(2026, 9, 14); // 14 Oct 2026
      const res = await ingestMonthlyMasterSheet(
        'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit',
        'SEPTEMBER 2026',
        2026,
        10, // Passed 10, but tab is September
        undefined,
        nowDateOverride
      );

      expect(res.success).toBe(true);
      // Both Day 1 and Day 30 of September are saved because September is full past month
      expect(res.savedCount).toBe(2);
      expect(res.errors).toEqual([]);
    });

    it('auto-corrects month/year from dominant CSV headers if tab name has non-standard name', async () => {
      (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

      const mockSelect = vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({
            data: [],
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

      const septCsv = `
"Selasa, 01 September 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.229","0","2.229","2.661","47","2.708","4.937","196,76","5161","95,66%","1,5","83,64%","1,255","273,0"
`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(septCsv),
      });

      // Tab name is generic "Lembar Operasional" with targetMonth=10
      const nowDateOverride = new Date(2026, 9, 14);
      const res = await ingestMonthlyMasterSheet(
        'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit',
        'Lembar Operasional',
        2026,
        10,
        undefined,
        nowDateOverride
      );

      expect(res.success).toBe(true);
      expect(res.savedCount).toBe(1);
    });

    it('rejects future month with informative error message', async () => {
      (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

      const mockFetchFuture = `
"Senin, 02 November 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.229","0","2.229","2.661","47","2.708","4.937","196,76","5161","95,66%","1,5","83,64%","1,255","273,0"
`;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(mockFetchFuture),
      });

      const nowDateOverride = new Date(2026, 9, 14); // 14 Oct 2026
      const res = await ingestMonthlyMasterSheet(
        'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit',
        'NOVEMBER 2026',
        2026,
        11,
        undefined,
        nowDateOverride
      );

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('masa depan');
    });

    it('ignores TOTAL summary rows at the bottom of the sheet to prevent duplicate records', async () => {
      (fetchRouteMasterList as any).mockResolvedValue(mockRoutes);

      let upsertedRecords: any[] = [];
      const mockUpsert = vi.fn().mockImplementation((chunk: any[]) => {
        upsertedRecords = upsertedRecords.concat(chunk);
        return Promise.resolve({ error: null });
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'daily_route_reports') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
            upsert: mockUpsert,
          };
        }
        return {};
      });

      const csvWithTotal = `
"Rabu, 30 September 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","20","20","3.791,76","2.100","0","2.100","2.600","0","2.600","4.700","196,76","5161","95,66%","1,5","83,64%","1,255","273,0"
"","2","JAK 05","33","33","6.390,97","2.870","95","2.965","3.104","184","3.288","6.253","193,67","6238","100,24%","1,5","97,84%","1,468","206,8"
"TOTAL SEPTEMBER 2026","","RUTE","","","","","","","","","","","","","","","","","","","","","",""
"","1","JAK 01","564","555","100.000,00","50.000","0","50.000","60.000","0","60.000","110.000","196,76","5161","95,66%","1,5","83,64%","1,255","273,0"
"","2","JAK 05","926","921","200.000,00","60.000","0","60.000","70.000","0","70.000","130.000","193,67","6238","100,24%","1,5","97,84%","1,468","206,8"
`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(csvWithTotal),
      });

      const res = await ingestMonthlyMasterSheet(
        'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit',
        'SEPTEMBER 2026',
        2026,
        9
      );

      expect(res.success).toBe(true);
      // Only 2 daily records from Sept 30 should be saved. The TOTAL rows MUST be excluded.
      expect(res.savedCount).toBe(2);
      expect(upsertedRecords.length).toBe(2);
      expect(upsertedRecords[0].realops_shift1).toBe(20); // Daily realops, not monthly 555!
    });

    it('returns user-friendly error message when network fetch throws Failed to fetch', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const res = await ingestMonthlyMasterSheet(
        'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit',
        'SEPTEMBER 2026',
        2026,
        9
      );

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Koneksi internet terputus atau gagal terhubung');
    });
  });
});
