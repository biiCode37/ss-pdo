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
import { createBulkRoutesWithSheets } from './routes';

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
