import { supabase, isSupabaseConfigured } from './supabase';
import type { AppPageSetting, PageKey, BulkActionType } from '@/types/pageManagement';
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

    // Normalisasi fallback kolom array jika data lama dari DB belum memiliki kolom baru
    const normalizedData: AppPageSetting[] = data.map((item: any) => ({
      ...item,
      allowed_roles: Array.isArray(item.allowed_roles) && item.allowed_roles.length > 0
        ? item.allowed_roles
        : (DEFAULT_PAGE_SETTINGS.find((d) => d.page_key === item.page_key)?.allowed_roles || [
            'superadmin',
            'admin',
            'korwil',
            'korlap',
            'pdo',
          ]),
      allowed_user_emails: Array.isArray(item.allowed_user_emails)
        ? item.allowed_user_emails
        : [],
      denied_user_emails: Array.isArray(item.denied_user_emails)
        ? item.denied_user_emails
        : [],
    }));

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(normalizedData));
    }
    return normalizedData;
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
          return parsed.map((item) => ({
            ...item,
            allowed_roles: Array.isArray(item.allowed_roles)
              ? item.allowed_roles
              : (DEFAULT_PAGE_SETTINGS.find((d) => d.page_key === item.page_key)?.allowed_roles || [
                  'superadmin',
                  'admin',
                  'korwil',
                  'korlap',
                  'pdo',
                ]),
            allowed_user_emails: Array.isArray(item.allowed_user_emails)
              ? item.allowed_user_emails
              : [],
            denied_user_emails: Array.isArray(item.denied_user_emails)
              ? item.denied_user_emails
              : [],
          }));
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
    // Coba eksekusi melalui secure RPC function (SECURITY DEFINER)
    try {
      if (typeof (supabase as any)?.rpc === 'function') {
        const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc('set_app_page_setting', {
          p_acting_email: updatedBy,
          p_page_key: pageKey,
          p_is_enabled: isEnabled,
        });
        if (!rpcErr && rpcRes === true) {
          return true;
        }
      }
    } catch {
      // Fallback ke direct update jika RPC belum tersedia
    }

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
 * Mengubah konfigurasi izin granular peran & override per-akun untuk 1 halaman.
 */
export async function updatePagePermissions(
  pageKey: PageKey,
  allowedRoles: string[],
  allowedUserEmails: string[],
  deniedUserEmails: string[],
  updatedBy: string
): Promise<boolean> {
  if (pageKey === ('page_management' as PageKey)) {
    return false;
  }

  // Jamin superadmin selalu diizinkan
  const finalRoles = allowedRoles.includes('superadmin')
    ? allowedRoles
    : ['superadmin', ...allowedRoles];

  // Optimistic cache update
  const current = getCachedSettings();
  const updated = current.map((item) =>
    item.page_key === pageKey
      ? {
          ...item,
          allowed_roles: finalRoles,
          allowed_user_emails: allowedUserEmails,
          denied_user_emails: deniedUserEmails,
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
    const { data, error } = await (supabase as any).rpc('admin_update_page_permissions', {
      p_acting_email: updatedBy,
      p_page_key: pageKey,
      p_allowed_roles: finalRoles,
      p_allowed_user_emails: allowedUserEmails,
      p_denied_user_emails: deniedUserEmails,
    });

    if (error || data === false) {
      console.warn('[pageManagementService] Gagal update permissions via RPC:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[pageManagementService] Error updating permissions:', err);
    return false;
  }
}

/**
 * Menjalankan operasi massal (Bulk Action) pada sekumpulan halaman.
 */
export async function bulkUpdatePageSettings(
  pageKeys: PageKey[],
  action: BulkActionType,
  options: { is_enabled?: boolean; allowed_roles?: string[] },
  updatedBy: string
): Promise<boolean> {
  const validKeys = pageKeys.filter((k) => k !== ('page_management' as PageKey));
  if (validKeys.length === 0) return false;

  // Optimistic update
  const current = getCachedSettings();
  const updated = current.map((item) => {
    if (!validKeys.includes(item.page_key)) return item;

    if (action === 'set_status' && typeof options.is_enabled === 'boolean') {
      return {
        ...item,
        is_enabled: options.is_enabled,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      };
    }

    if (action === 'set_roles' && options.allowed_roles) {
      const finalRoles = options.allowed_roles.includes('superadmin')
        ? options.allowed_roles
        : ['superadmin', ...options.allowed_roles];
      return {
        ...item,
        allowed_roles: finalRoles,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      };
    }

    if (action === 'reset_default') {
      const def = DEFAULT_PAGE_SETTINGS.find((d) => d.page_key === item.page_key);
      return {
        ...item,
        allowed_roles: def ? def.allowed_roles : ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'],
        allowed_user_emails: [],
        denied_user_emails: [],
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      };
    }

    return item;
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  }

  if (!isSupabaseConfigured) return true;

  try {
    const { data, error } = await (supabase as any).rpc('admin_bulk_update_page_settings', {
      p_acting_email: updatedBy,
      p_page_keys: validKeys,
      p_action: action,
      p_is_enabled: options.is_enabled ?? null,
      p_allowed_roles: options.allowed_roles ?? null,
    });

    if (error || data === false) {
      console.warn('[pageManagementService] Gagal bulk update via RPC:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[pageManagementService] Error bulk updating page settings:', err);
    return false;
  }
}

/**
 * Mengambil daftar pengguna aktif yang memiliki peran Superadmin untuk ditampilkan pada layar akses terbatas.
 */
export async function fetchActiveSuperadmins(): Promise<{ email: string; full_name: string }[]> {
  if (!isSupabaseConfigured) {
    return [{ email: 'admin@transjakarta.co.id', full_name: 'Administrator Transjakarta' }];
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('role_id', 1)
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      return [{ email: 'superadmin@transjakarta.co.id', full_name: 'Superadmin Sistem' }];
    }

    return data as { email: string; full_name: string }[];
  } catch (err) {
    console.warn('[pageManagementService] Gagal fetch active superadmins:', err);
    return [{ email: 'superadmin@transjakarta.co.id', full_name: 'Superadmin Sistem' }];
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
          const raw = payload.new as any;
          const normalized: AppPageSetting = {
            ...raw,
            allowed_roles: Array.isArray(raw.allowed_roles) && raw.allowed_roles.length > 0
              ? raw.allowed_roles
              : (DEFAULT_PAGE_SETTINGS.find((d) => d.page_key === raw.page_key)?.allowed_roles || [
                  'superadmin',
                  'admin',
                  'korwil',
                  'korlap',
                  'pdo',
                ]),
            allowed_user_emails: Array.isArray(raw.allowed_user_emails)
              ? raw.allowed_user_emails
              : [],
            denied_user_emails: Array.isArray(raw.denied_user_emails)
              ? raw.denied_user_emails
              : [],
          };
          onChange(normalized);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
