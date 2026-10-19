import { supabase, isSupabaseConfigured } from './supabase';
import type { AppPageSetting, PageKey } from '@/types/pageManagement';
import { DEFAULT_PAGE_SETTINGS } from '@/types/pageManagement';

const CACHE_KEY = 'APP_PAGE_SETTINGS';

/**
 * Mengambil daftar konfigurasi halaman dari Supabase dengan fallback ke cache lokal.
 */
export async function fetchPageSettings(): Promise<AppPageSetting[]> {
  if (!isSupabaseConfigured) {
    return getCachedSettings();
  }

  try {
    const { data, error } = await supabase
      .from('app_page_settings')
      .select('*')
      .order('page_name', { ascending: true });

    if (error || !data || data.length === 0) {
      return getCachedSettings();
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
    return data as AppPageSetting[];
  } catch (err) {
    console.warn('[pageManagementService] Gagal fetch settings, fallback cache:', err);
    return getCachedSettings();
  }
}

/**
 * Mengambil konfigurasi dari localStorage jika offline atau fallback ke default.
 */
export function getCachedSettings(): AppPageSetting[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AppPageSetting[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // Abaikan parse error, gunakan default
  }
  return DEFAULT_PAGE_SETTINGS;
}

/**
 * Mengubah status aktif/pemeliharaan suatu halaman (khusus Superadmin).
 * Menerapkan optimistic update ke localStorage terlebih dahulu.
 */
export async function updatePageSetting(
  pageKey: PageKey,
  isEnabled: boolean,
  updatedBy: string
): Promise<boolean> {
  // Guard khusus: cegah mutasi pada halaman manajemen itu sendiri
  if (pageKey === ('page_management' as PageKey)) {
    return false;
  }

  // Update cache lokal langsung (optimistic)
  const current = getCachedSettings();
  const updated = current.map((item) =>
    item.page_key === pageKey
      ? {
          ...item,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        }
      : item
  );
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  }

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('app_page_settings')
      .update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      })
      .eq('page_key', pageKey);

    if (error) {
      console.warn('[pageManagementService] Gagal update status di database:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[pageManagementService] Error updating page setting:', err);
    return false;
  }
}

/**
 * Berlangganan perubahan data tabel app_page_settings via Supabase Realtime WebSocket.
 */
export function subscribeToPageSettings(
  onChange: (setting: AppPageSetting) => void
): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('realtime:app_page_settings')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_page_settings',
      },
      (payload: any) => {
        if (payload?.new && typeof payload.new === 'object') {
          const newSetting = payload.new as AppPageSetting;
          onChange(newSetting);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
