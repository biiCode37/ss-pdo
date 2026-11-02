// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchPageSettings,
  updatePageSetting,
  updatePagePermissions,
  bulkUpdatePageSettings,
  fetchActiveSuperadmins,
  getCachedSettings,
  subscribeToPageSettings,
} from './pageManagementService';
import { supabase } from './supabase';
import { invokeAdminAction } from './adminActionService';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    rpc: vi.fn(),
  },
  isSupabaseConfigured: true,
}));

vi.mock('./adminActionService', () => ({
  invokeAdminAction: vi.fn().mockResolvedValue({ success: true, data: true }),
}));

describe('pageManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(invokeAdminAction).mockResolvedValue({ success: true, data: true });
  });

  it('mengambil settings dari supabase dan menyimpannya di localStorage', async () => {
    const mockData = [
      {
        page_key: 'dashboard',
        page_name: 'Dashboard',
        is_enabled: true,
        updated_at: '2026-10-19T00:00:00Z',
        updated_by: 'admin@pusm.id',
        allowed_roles: ['superadmin', 'admin'],
        allowed_user_emails: [],
        denied_user_emails: [],
      },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }),
    });

    const result = await fetchPageSettings();
    expect(result).toHaveLength(1);
    expect(result[0].page_key).toBe('dashboard');

    const cached = localStorage.getItem('APP_PAGE_SETTINGS');
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached!)).toHaveLength(1);
  });

  it('menggunakan fallback localStorage jika supabase error', async () => {
    const cachedData = [
      {
        page_key: 'monitoring',
        page_name: 'Monitoring',
        is_enabled: false,
        updated_at: '2026-10-19T00:00:00Z',
        updated_by: 'admin@pusm.id',
      },
    ];
    localStorage.setItem('APP_PAGE_SETTINGS', JSON.stringify(cachedData));

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      }),
    });

    const result = await fetchPageSettings();
    expect(result).toHaveLength(1);
    expect(result[0].page_key).toBe('monitoring');
  });

  it('mengembalikan default settings jika tidak ada cache dan supabase gagal', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Offline') }),
      }),
    });

    const result = await fetchPageSettings();
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((s) => s.page_key === 'dashboard')).toBe(true);
  });

  it('updatePageSetting mengupdate status di localStorage dan database via Edge Function', async () => {
    const success = await updatePageSetting('input', false, 'super@pusm.id');
    expect(success).toBe(true);

    expect(invokeAdminAction).toHaveBeenCalledWith('set_page_setting', {
      pageKey: 'input',
      isEnabled: false,
    });

    const cached = getCachedSettings();
    const updated = cached.find((c) => c.page_key === 'input');
    expect(updated?.is_enabled).toBe(false);
    expect(updated?.updated_by).toBe('super@pusm.id');
  });

  it('subscribeToPageSettings membuat channel realtime dan mengembalikan unbind function', () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    };
    (supabase.channel as any).mockReturnValue(mockChannel);

    const callback = vi.fn();
    const unsubscribe = subscribeToPageSettings(callback);

    expect(supabase.channel).toHaveBeenCalledWith('realtime:app_page_settings');
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('updatePagePermissions memanggil invokeAdminAction dan mengupdate cache', async () => {
    const roles = ['superadmin', 'admin', 'korwil'];
    const whitelist = ['user1@transjakarta.co.id'];
    const blacklist = ['user2@transjakarta.co.id'];

    const success = await updatePagePermissions(
      'input',
      roles,
      whitelist,
      blacklist,
      'superadmin@transjakarta.co.id'
    );

    expect(success).toBe(true);
    expect(invokeAdminAction).toHaveBeenCalledWith('update_page_permissions', {
      pageKey: 'input',
      allowedRoles: roles,
      allowedUserEmails: whitelist,
      deniedUserEmails: blacklist,
    });

    const cached = getCachedSettings();
    const item = cached.find((c) => c.page_key === 'input');
    expect(item?.allowed_roles).toEqual(roles);
    expect(item?.allowed_user_emails).toEqual(whitelist);
    expect(item?.denied_user_emails).toEqual(blacklist);
  });

  it('bulkUpdatePageSettings memanggil invokeAdminAction dan memperbarui cache', async () => {
    const success = await bulkUpdatePageSettings(
      ['input', 'analytics'],
      'set_status',
      { is_enabled: false },
      'superadmin@transjakarta.co.id'
    );

    expect(success).toBe(true);
    expect(invokeAdminAction).toHaveBeenCalledWith('bulk_update_page_settings', {
      pageKeys: ['input', 'analytics'],
      bulkAction: 'set_status',
      isEnabled: false,
      allowedRoles: null,
    });

    const cached = getCachedSettings();
    expect(cached.find((c) => c.page_key === 'input')?.is_enabled).toBe(false);
    expect(cached.find((c) => c.page_key === 'analytics')?.is_enabled).toBe(false);
  });

  it('fetchActiveSuperadmins mengambil daftar user dengan role_id 1 dan is_active true', async () => {
    const mockSuperadmins = [
      { email: 'super1@transjakarta.co.id', full_name: 'Bpk. Superadmin 1' },
      { email: 'super2@transjakarta.co.id', full_name: 'Bpk. Superadmin 2' },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockSuperadmins, error: null }),
        }),
      }),
    });

    const result = await fetchActiveSuperadmins();
    expect(result).toHaveLength(2);
    expect(result[0].email).toBe('super1@transjakarta.co.id');
    expect(result[1].email).toBe('super2@transjakarta.co.id');
  });
});
