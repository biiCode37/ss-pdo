// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchPageSettings,
  updatePageSetting,
  getCachedSettings,
  subscribeToPageSettings,
} from './pageManagementService';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
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
});
