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

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    rpc: vi.fn(),
  },
  isSupabaseConfigured: true,
}));

describe('pageManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('mengambil settings dari supabase dan menyimpannya di localStorage', async () => {
    const mockData = [
      {
        page_key: 'input',
        page_name: 'Form Input',
        category: 'tab',
        is_enabled: true,
        disabled_message: 'Maintenance',
      },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }),
    });

    const result = await fetchPageSettings();
    expect(result).toHaveLength(1);
    expect(result[0].page_key).toBe('input');
    expect(localStorage.getItem('APP_PAGE_SETTINGS')).toContain('input');
  });

  it('menggunakan fallback localStorage jika supabase error', async () => {
    const cached = [
      {
        page_key: 'analytics',
        page_name: 'Analitik',
        category: 'tab',
        is_enabled: false,
        disabled_message: 'Maintenance',
      },
    ];
    localStorage.setItem('APP_PAGE_SETTINGS', JSON.stringify(cached));

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      }),
    });

    const result = await fetchPageSettings();
    expect(result).toHaveLength(1);
    expect(result[0].page_key).toBe('analytics');
    expect(result[0].is_enabled).toBe(false);
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

  it('updatePageSetting mengupdate status di localStorage dan database', async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const success = await updatePageSetting('input', false, 'super@pusm.id');
    expect(success).toBe(true);

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

  it('updatePagePermissions memanggil rpc admin_update_page_permissions dan mengupdate cache', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

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
    expect(supabase.rpc).toHaveBeenCalledWith('admin_update_page_permissions', {
      p_acting_email: 'superadmin@transjakarta.co.id',
      p_page_key: 'input',
      p_allowed_roles: roles,
      p_allowed_user_emails: whitelist,
      p_denied_user_emails: blacklist,
    });

    const cached = getCachedSettings();
    const item = cached.find((c) => c.page_key === 'input');
    expect(item?.allowed_roles).toEqual(roles);
    expect(item?.allowed_user_emails).toEqual(whitelist);
    expect(item?.denied_user_emails).toEqual(blacklist);
  });

  it('bulkUpdatePageSettings memanggil rpc admin_bulk_update_page_settings dan memperbarui cache', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

    const success = await bulkUpdatePageSettings(
      ['input', 'analytics'],
      'set_status',
      { is_enabled: false },
      'superadmin@transjakarta.co.id'
    );

    expect(success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('admin_bulk_update_page_settings', {
      p_acting_email: 'superadmin@transjakarta.co.id',
      p_page_keys: ['input', 'analytics'],
      p_action: 'set_status',
      p_is_enabled: false,
      p_allowed_roles: null,
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
    expect(result[0].full_name).toBe('Bpk. Superadmin 1');
  });
});
