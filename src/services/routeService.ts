import { supabase, isSupabaseConfigured } from './supabase';
import type { Route, UserProfile, ActivityLog, SyncQueueBackup } from '../types/supabase';

const CACHE_KEY_ROUTES = 'PDO_CACHE_ROUTES';

export async function fetchRoutesWithSheets(): Promise<Route[]> {
  // Jika Supabase belum dikonfigurasi, langsung fallback ke cache lokal
  if (!isSupabaseConfigured) {
    const cached = localStorage.getItem(CACHE_KEY_ROUTES);
    return cached ? JSON.parse(cached) : [];
  }

  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*, route_sheets(*)')
      .eq('is_active', true)
      .order('route_code', { ascending: true });

    if (error) throw error;
    if (data) {
      localStorage.setItem(CACHE_KEY_ROUTES, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[RouteService] Offline/Error fetching from Supabase, loading local cache:', err);
    const cached = localStorage.getItem(CACHE_KEY_ROUTES);
    return cached ? JSON.parse(cached) : [];
  }

  return [];
}

export async function verifyUserProfile(email: string): Promise<{ isAllowed: boolean; profile?: UserProfile; message?: string }> {
  // Jika Supabase belum dikonfigurasi, tolak login demi keamanan (fail-closed)
  if (!isSupabaseConfigured) {
    console.error('[RouteService] Supabase is not configured. Failing closed for security.');
    return {
      isAllowed: false,
      message: 'Sistem verifikasi otorisasi akun belum dikonfigurasi. Silakan hubungi Admin PUSM.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return {
        isAllowed: false,
        message: `Akun Google Anda (${email}) belum terdaftar dalam sistem PUSM. Silakan hubungi Admin untuk pendaftaran akses.`,
      };
    }

    if (!data.is_active) {
      return {
        isAllowed: false,
        message: `Akun Google Anda (${email}) sedang dinonaktifkan oleh Admin. Silakan hubungi pengawas PUSM.`,
      };
    }

    // Update last_login_at timestamp asynchronously (fire-and-forget)
    // ponytail: bungkus IIFE async karena Supabase PromiseLike tidak punya .catch()
    (async () => {
      try {
        await supabase
          .from('user_profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('email', email);
      } catch (_e) { /* silent */ }
    })();

    return {
      isAllowed: true,
      profile: data as UserProfile,
    };
  } catch (err) {
    console.error('[RouteService] Error verifying user profile (fail-closed):', err);
    return {
      isAllowed: false,
      message: 'Tidak dapat memverifikasi akun Anda saat ini karena gangguan sistem/koneksi. Silakan coba beberapa saat lagi atau hubungi Admin PUSM.',
    };
  }
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { email: string; full_name: string }): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase.from('user_profiles').upsert(
      [
        {
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'email' }
    );
    if (error) console.error('[RouteService] Error upserting user profile:', error);
  } catch (err) {
    console.warn('[RouteService] Failed to upsert user profile (offline?):', err);
  }
}

export async function logActivity(log: ActivityLog): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('activity_logs').insert([log]);
  } catch (err) {
    console.error('[RouteService] Failed to log activity:', err);
  }
}

export async function backupSyncQueue(queueItem: SyncQueueBackup): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('sync_queue_backups').insert([queueItem]);
  } catch (err) {
    console.error('[RouteService] Failed to backup sync queue:', err);
  }
}

/**
 * Buat rute baru beserta spreadsheet period-nya.
 * Jika route_code sudah ada, gunakan route yang sudah ada (upsert rute, insert sheet).
 * Jika sheet dengan route_id + year + month sudah ada, akan error (unique constraint).
 */
export async function createRouteWithSheet(params: {
  routeCode: string;
  routeName?: string;
  year: number;
  month: number;
  sheetUrl: string;
  spreadsheetId: string;
}): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Layanan Supabase belum dikonfigurasi.' };
  }

  const finalRouteName = params.routeName || params.routeCode;

  try {
    // 1. Cek apakah route sudah ada berdasarkan route_code
    const { data: existingRoute } = await supabase
      .from('routes')
      .select('id')
      .eq('route_code', params.routeCode)
      .single();

    let routeId: number;

    if (existingRoute) {
      routeId = existingRoute.id;
      // Update nama rute jika berubah
      await supabase
        .from('routes')
        .update({ route_name: finalRouteName, updated_at: new Date().toISOString() })
        .eq('id', routeId);
    } else {
      // Insert route baru
      const { data: newRoute, error: routeError } = await supabase
        .from('routes')
        .insert([{
          route_code: params.routeCode,
          route_name: finalRouteName,
          is_active: true,
        }])
        .select('id')
        .single();

      if (routeError || !newRoute) {
        return { success: false, message: `Gagal membuat rute: ${routeError?.message || 'Unknown error'}` };
      }
      routeId = newRoute.id;
    }

    // 2. Insert route_sheet
    const { error: sheetError } = await supabase
      .from('route_sheets')
      .insert([{
        route_id: routeId,
        year: params.year,
        month: params.month,
        spreadsheet_id: params.spreadsheetId,
        sheet_url: params.sheetUrl,
        tab_name: 'PDO',
      }]);

    if (sheetError) {
      // Unique constraint violation = sheet untuk periode ini sudah ada
      if (sheetError.code === '23505') {
        return { success: false, message: `Rute ${params.routeCode} sudah memiliki data untuk periode ${params.month}/${params.year}.` };
      }
      return { success: false, message: `Gagal menyimpan data sheet: ${sheetError.message}` };
    }

    // 3. Refresh cache lokal
    await fetchRoutesWithSheets();

    return { success: true };
  } catch (err: any) {
    console.error('[RouteService] Failed to create route with sheet:', err);
    return { success: false, message: 'Gagal menyimpan rute. Periksa koneksi internet Anda.' };
  }
}

/**
 * Hapus satu route_sheet berdasarkan ID.
 * Jika route parent sudah tidak punya sheet lain, route juga dihapus.
 */
export async function deleteRouteSheet(sheetId: number, routeId: number): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Layanan Supabase belum dikonfigurasi.' };
  }

  try {
    // 1. Hapus route_sheet
    const { error } = await supabase
      .from('route_sheets')
      .delete()
      .eq('id', sheetId);

    if (error) {
      return { success: false, message: `Gagal menghapus data sheet: ${error.message}` };
    }

    // 2. Cek apakah route masih punya sheet lain
    const { data: remainingSheets } = await supabase
      .from('route_sheets')
      .select('id')
      .eq('route_id', routeId);

    // Jika tidak ada sheet tersisa, hapus route-nya juga
    if (!remainingSheets || remainingSheets.length === 0) {
      await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);
    }

    // 3. Refresh cache lokal
    await fetchRoutesWithSheets();

    return { success: true };
  } catch (err: any) {
    console.error('[RouteService] Failed to delete route sheet:', err);
    return { success: false, message: 'Gagal menghapus rute. Periksa koneksi internet Anda.' };
  }
}

