import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchRoutesWithSheets, upsertUserProfile, logActivity, backupSyncQueue } from './routeService';
import { supabase } from './supabase';

// Mock localStorage in Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('routeService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('fetchRoutesWithSheets returns cached data when offline or error occurs', async () => {
    const mockCachedData = [
      {
        id: 1,
        uuid: 'test-uuid-1',
        route_code: 'R01',
        route_name: 'Koridor 1',
        is_active: true,
        created_at: '2026-08-04T00:00:00Z',
        updated_at: '2026-08-04T00:00:00Z',
        route_sheets: [],
      },
    ];

    localStorage.setItem('PDO_CACHE_ROUTES', JSON.stringify(mockCachedData));

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
    });

    const routes = await fetchRoutesWithSheets();
    expect(routes).toEqual(mockCachedData);
  });

  it('fetchRoutesWithSheets stores fetched data to local storage on success', async () => {
    const mockData = [
      {
        id: 2,
        uuid: 'test-uuid-2',
        route_code: 'R02',
        route_name: 'Koridor 2',
        is_active: true,
        created_at: '2026-08-04T00:00:00Z',
        updated_at: '2026-08-04T00:00:00Z',
        route_sheets: [],
      },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const routes = await fetchRoutesWithSheets();
    expect(routes).toEqual(mockData);
    expect(localStorage.getItem('PDO_CACHE_ROUTES')).toBe(JSON.stringify(mockData));
  });

  it('upsertUserProfile invokes supabase upsert correctly', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      upsert: mockUpsert,
    });

    await upsertUserProfile({ email: 'petugas@pusm.id', full_name: 'Petugas Test' });

    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
    expect(mockUpsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          email: 'petugas@pusm.id',
          full_name: 'Petugas Test',
        }),
      ],
      { onConflict: 'email' }
    );
  });

  it('logActivity invokes supabase insert with activity payload', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    const logItem = {
      user_email: 'admin@pusm.id',
      action: 'UPDATE_SHIFT',
      route_code: 'R01',
      details: { row: 5 },
    };

    await logActivity(logItem);

    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(mockInsert).toHaveBeenCalledWith([logItem]);
  });

  it('backupSyncQueue invokes supabase insert with backup payload', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    const backupItem = {
      user_email: 'petugas@pusm.id',
      spreadsheet_id: 'sheet-123',
      tab_name: 'PDO',
      row_index: 10,
      payload: { unit: 'BUS-01' },
      status: 'pending' as const,
    };

    await backupSyncQueue(backupItem);

    expect(supabase.from).toHaveBeenCalledWith('sync_queue_backups');
    expect(mockInsert).toHaveBeenCalledWith([backupItem]);
  });
});
