import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('./audit', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { supabase } from '../supabase';
import { createBulkRoutesWithSheets, getCrossPeriodAccumulation, buildMonthRangeFilter } from './routes';

describe('createBulkRoutesWithSheets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('harus mengembalikan savedCount 0 jika array rute kosong', async () => {
    const res = await createBulkRoutesWithSheets([]);
    expect(res.success).toBe(true);
    expect(res.savedCount).toBe(0);
  });

  it('harus memproses batch rute dan mengembalikan savedCount yang berhasil', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'routes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 101 }, error: null }),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'route_sheets') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const input = [
      {
        routeCode: 'JAK.77',
        routeName: 'JAK.77',
        year: 2026,
        month: 10,
        sheetUrl: 'https://docs.google.com/spreadsheets/d/13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs',
        spreadsheetId: '13okpIzR7cBochPbB6K2iRC9XdMQf_vzE2N8XQImNZGs',
      },
    ];

    const res = await createBulkRoutesWithSheets(input);
    expect(res.success).toBe(true);
    expect(res.savedCount).toBe(1);
  });
});

describe('getCrossPeriodAccumulation (BUG-QUOTA-200-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockPagedSummaries(pages: any[][]) {
    const calls: { or: string; range: [number, number]; select: string }[] = [];
    (supabase.from as any).mockImplementation(() => {
      const call: any = {};
      const chain: any = {
        select: (cols: string) => { call.select = cols; return chain; },
        eq: () => chain,
        or: (f: string) => { call.or = f; return chain; },
        order: () => chain,
        range: (a: number, b: number) => {
          call.range = [a, b];
          calls.push(call);
          return Promise.resolve({ data: pages[calls.length - 1] ?? [], error: null });
        },
      };
      return chain;
    });
    return calls;
  }

  const row = (day: number, month = 10) => ({
    unit: 'BUS-1', year: 2026, month, day,
    toa_shift1: 10, manual_shift1: 0, toa_shift2: 5, manual_shift2: 0, total_toa: 15, total_km: 100, keterangan: '',
  });

  it('memfilter bulan di server dan tidak mengunduh select *', async () => {
    const calls = mockPagedSummaries([[row(14), row(20)]]);
    const res = await getCrossPeriodAccumulation('JAK.60', 2026, 10, 14, 2026, 10, 31);

    expect(calls).toHaveLength(1);
    expect(calls[0].or).toBe('and(year.eq.2026,month.eq.10)');
    expect(calls[0].select).not.toContain('*');
    expect(res?.totalDays).toBe(2);
    expect(res?.data[0].kmAkhir1).toBe('200');
  });

  it('mengambil halaman berikutnya bila hasil tepat 1.000 baris (tidak terpotong diam-diam)', async () => {
    const fullPage = Array.from({ length: 1000 }, () => row(15));
    const calls = mockPagedSummaries([fullPage, [row(16, 11)]]);
    const res = await getCrossPeriodAccumulation('JAK.60', 2026, 10, 1, 2026, 11, 30);

    expect(calls).toHaveLength(2);
    expect(calls[1].range).toEqual([1000, 1999]);
    expect(res?.totalDays).toBe(2);
  });
});

describe('buildMonthRangeFilter', () => {
  it('menyusun filter lintas tahun secara inklusif', () => {
    expect(buildMonthRangeFilter(2026, 11, 2027, 1)).toBe(
      'and(year.eq.2026,month.eq.11),and(year.eq.2026,month.eq.12),and(year.eq.2027,month.eq.1)'
    );
  });

  it('mengembalikan string kosong untuk rentang terbalik', () => {
    expect(buildMonthRangeFilter(2026, 11, 2026, 10)).toBe('');
  });
});
