// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAppSetting, getRegionalGlobalSheetUrl, setRegionalGlobalSheetUrl, SETTING_KEYS } from './appSettingsService';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('appSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('reads setting from Supabase and caches it to localStorage', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { value: 'https://docs.google.com/test-url' },
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });

    const url = await getRegionalGlobalSheetUrl();
    expect(url).toBe('https://docs.google.com/test-url');
    expect(localStorage.getItem(`pdo_app_setting_${SETTING_KEYS.REGIONAL_GLOBAL_SHEET_URL}`)).toBe(
      'https://docs.google.com/test-url'
    );
  });

  it('falls back to default value if Supabase and localStorage are empty', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });

    const val = await getAppSetting('unknown_key', 'fallback_val');
    expect(val).toBe('fallback_val');
  });

  it('saves setting to both Supabase and localStorage', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as any).mockReturnValue({
      upsert: mockUpsert,
    });

    const success = await setRegionalGlobalSheetUrl('https://docs.google.com/new-url');
    expect(success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: SETTING_KEYS.REGIONAL_GLOBAL_SHEET_URL,
        value: 'https://docs.google.com/new-url',
      }),
      { onConflict: 'key' }
    );
    expect(localStorage.getItem(`pdo_app_setting_${SETTING_KEYS.REGIONAL_GLOBAL_SHEET_URL}`)).toBe(
      'https://docs.google.com/new-url'
    );
  });
});
