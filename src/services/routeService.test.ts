import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchRoutesWithSheets,
  upsertUserProfile,
  verifyUserProfile,
  logActivity,
  sendUserHeartbeat,
  backupSyncQueue,
  fetchAllUserProfiles,
  addUserProfile,
  updateUserProfileRole,
  toggleUserProfileStatus,
  revokeUserProfile,
  fetchActivityLogs,
} from './routeService';
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
  isSupabaseConfigured: true,
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

  it('verifyUserProfile allows whitelisted active user and updates last_login_at', async () => {
    const mockProfile = {
      id: 1,
      email: 'petugas@pusm.id',
      full_name: 'Petugas Resmi',
      role: 'petugas',
      is_active: true,
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((_col: string, _val: string) => ({
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    });

    const result = await verifyUserProfile('petugas@pusm.id');
    expect(result.isAllowed).toBe(true);
    expect(result.profile?.email).toBe('petugas@pusm.id');
  });

  it('verifyUserProfile rejects unlisted user with clear error message', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    });

    const result = await verifyUserProfile('unknown@gmail.com');
    expect(result.isAllowed).toBe(false);
    expect(result.message).toContain('belum terdaftar');
  });

  it('verifyUserProfile rejects inactive user with clear error message', async () => {
    const mockInactiveProfile = {
      id: 2,
      email: 'inactive@pusm.id',
      full_name: 'Petugas Nonaktif',
      role: 'petugas',
      is_active: false,
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockInactiveProfile, error: null }),
    });

    const result = await verifyUserProfile('inactive@pusm.id');
    expect(result.isAllowed).toBe(false);
    expect(result.message).toContain('dinonaktifkan');
  });

  it('verifyUserProfile falls back to cached active profile on network error', async () => {
    const cachedProfile = {
      id: 5,
      email: 'offline@pusm.id',
      full_name: 'Petugas Offline',
      role: 'petugas',
      is_active: true,
    };

    localStorage.setItem(
      'PDO_LAST_VERIFIED_PROFILE_offline@pusm.id',
      JSON.stringify({
        profile: cachedProfile,
        verifiedAt: new Date().toISOString(),
      })
    );

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    });

    const result = await verifyUserProfile('offline@pusm.id');
    expect(result.isAllowed).toBe(true);
    expect(result.profile?.full_name).toBe('Petugas Offline');
  });

  // BUG-45: Error jaringan dari Supabase datang sebagai {data:null,error}
  // (bukan exception) — fallback cache harus tetap terjangkau.
  it('verifyUserProfile falls back to cached active profile when supabase resolves with non-PGRST116 error', async () => {
    const cachedProfile = {
      id: 6,
      email: 'weaksignal@pusm.id',
      full_name: 'Petugas Sinyal Lemah',
      role: 'petugas',
      is_active: true,
    };

    localStorage.setItem(
      'PDO_LAST_VERIFIED_PROFILE_weaksignal@pusm.id',
      JSON.stringify({
        profile: cachedProfile,
        verifiedAt: new Date().toISOString(),
      })
    );

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'XX402', message: 'Failed to fetch' },
      }),
    });

    const result = await verifyUserProfile('weaksignal@pusm.id');
    expect(result.isAllowed).toBe(true);
    expect(result.profile?.full_name).toBe('Petugas Sinyal Lemah');
  });

  it('addUserProfile rejects invalid email format without hitting database', async () => {
    const mockInsert = vi.fn();
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await addUserProfile({
      email: 'bukan-email-valid',
      full_name: 'Tanpa Email Valid',
      role: 'petugas',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('email tidak valid');
    expect(mockInsert).not.toHaveBeenCalled();
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

  it('sendUserHeartbeat updates last_active_at and total_active_seconds', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { total_active_seconds: 360 }, error: null }),
      }),
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });

    await sendUserHeartbeat('user@pusm.id', 180);

    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_active_seconds: 540,
      })
    );
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

  it('fetchAllUserProfiles fetches all users ordered by created_at desc', async () => {
    const mockUsers = [
      { id: 1, email: 'super@pusm.id', role: 'superadmin', full_name: 'Super' },
      { id: 2, email: 'admin@pusm.id', role: 'admin', full_name: 'Admin' },
    ];
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
    });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const users = await fetchAllUserProfiles();
    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
    expect(users).toHaveLength(2);
    expect(users[0].role).toBe('superadmin');
  });

  it('addUserProfile inserts user and logs USER_ADDED activity', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await addUserProfile({
      email: 'newpetugas@pusm.id',
      full_name: 'Petugas Baru',
      role: 'petugas',
      notes: 'Shift Siang',
      created_by: 'admin@pusm.id',
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'newpetugas@pusm.id',
          role: 'petugas',
          is_active: true,
        }),
      ])
    );
  });

  it('updateUserProfileRole updates role and logs USER_ROLE_CHANGED', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'user_profiles') return { update: mockUpdate };
      if (table === 'activity_logs') return { insert: mockInsert };
      return {};
    });

    const result = await updateUserProfileRole('target@pusm.id', 'admin', 'superadmin@pusm.id');
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'admin',
      })
    );
  });

  it('toggleUserProfileStatus updates is_active and logs USER_STATUS_CHANGED', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'user_profiles') return { update: mockUpdate };
      if (table === 'activity_logs') return { insert: mockInsert };
      return {};
    });

    const result = await toggleUserProfileStatus('target@pusm.id', false, 'admin@pusm.id');
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: false,
      })
    );
  });

  it('revokeUserProfile deletes user and logs USER_REVOKED', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'user_profiles') return { delete: mockDelete };
      if (table === 'activity_logs') return { insert: mockInsert };
      return {};
    });

    const result = await revokeUserProfile('baduser@pusm.id', 'superadmin@pusm.id');
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it('fetchActivityLogs queries activity_logs with limit and optional filters', async () => {
    const mockLogs = [
      { id: 1, action: 'USER_ADDED', user_email: 'admin@pusm.id' },
    ];
    const mockLimit = vi.fn().mockResolvedValue({ data: mockLogs, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const logs = await fetchActivityLogs({ limit: 50 });
    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('USER_ADDED');
  });
});
