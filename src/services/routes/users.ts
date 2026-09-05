import { supabase, isSupabaseConfigured } from '../supabase';
import type { UserProfile } from '../../types/supabase';
import { logActivity } from './audit';

const PENDING_PROFILE_SYNC_KEY = 'PDO_PROFILE_SYNC_PENDING';

/** Fallback verifikasi via cache profil lokal (window 30 hari + status aktif) */
export function tryOfflineProfileFallback(normalizedEmail: string): { isAllowed: true; profile: UserProfile } | null {
  if (!normalizedEmail) return null;
  try {
    const cachedRaw = localStorage.getItem(`PDO_LAST_VERIFIED_PROFILE_${normalizedEmail}`);
    if (!cachedRaw) return null;
    const { profile, verifiedAt } = JSON.parse(cachedRaw);
    const daysSince = (Date.now() - new Date(verifiedAt).getTime()) / 86400000;
    // Valid jika masih dalam window 30 hari dan status aktif
    if (daysSince <= 30 && profile && profile.is_active) {
      console.log('[RouteService] User profile verified via offline cache fallback.');
      return {
        isAllowed: true,
        profile: profile as UserProfile,
      };
    }
  } catch (_cacheErr) {}
  return null;
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

  const normalizedEmail = email.trim().toLowerCase();
  const cacheKey = `PDO_LAST_VERIFIED_PROFILE_${normalizedEmail}`;

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    // BUG-45: Bedakan "belum terdaftar" (PGRST116 = no rows) dari error
    // jaringan/server. Sebelumnya SEMUA error dianggap belum terdaftar,
    // sehingga fallback cache offline di catch() tidak pernah terjangkau —
    // petugas yang sudah terdaftar tetap ditolak saat sinyal lemah.
    if (error || !data) {
      const errorCode = (error as any)?.code;
      if (!errorCode || errorCode === 'PGRST116') {
        // PGRST116: benar-benar tidak ada baris untuk email ini
        return {
          isAllowed: false,
          message: `Akun Google Anda (${email}) belum terdaftar dalam sistem PUSM. Silakan hubungi Admin untuk pendaftaran akses.`,
        };
      }

      // Error lain (jaringan/server) → coba fallback cache offline
      const fallback = tryOfflineProfileFallback(normalizedEmail);
      if (fallback) return fallback;

      return {
        isAllowed: false,
        message: 'Tidak dapat memverifikasi akun Anda saat ini karena gangguan koneksi. Pastikan perangkat Anda terhubung ke internet.',
      };
    }

    if (!data.is_active) {
      return {
        isAllowed: false,
        message: `Akun Google Anda (${email}) sedang dinonaktifkan oleh Admin. Silakan hubungi pengawas PUSM.`,
      };
    }

    // Simpan cache profil yang berhasil diverifikasi untuk offline fallback
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        profile: data,
        verifiedAt: new Date().toISOString(),
      }));
    } catch (_e) {}

    // Awaited last_login_at update — kegagalan tidak blocking login
    try {
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('email', email);
    } catch (_e) {
      console.warn('[RouteService] last_login_at update failed (non-blocking):', _e);
    }

    return {
      isAllowed: true,
      profile: data as UserProfile,
    };
  } catch (err) {
    console.warn('[RouteService] Error verifying user profile, checking offline cache fallback:', err);

    // Fail-graceful: Cek cache profil lokal jika terjadi gangguan koneksi/offline
    const fallback = tryOfflineProfileFallback(normalizedEmail);
    if (fallback) return fallback;

    return {
      isAllowed: false,
      message: 'Tidak dapat memverifikasi akun Anda saat ini karena gangguan koneksi. Pastikan perangkat Anda terhubung ke internet untuk verifikasi pertama.',
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
    if (error) {
      console.error('[RouteService] Error upserting user profile:', error);
      // ISS-10 fix: Simpan pending sync ke localStorage agar bisa di-retry
      try {
        localStorage.setItem(PENDING_PROFILE_SYNC_KEY, JSON.stringify({
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          failedAt: new Date().toISOString(),
        }));
      } catch (_e) { /* localStorage bisa penuh */ }
    } else {
      // Berhasil — hapus pending sync jika ada
      localStorage.removeItem(PENDING_PROFILE_SYNC_KEY);
    }
  } catch (err) {
    console.warn('[RouteService] Failed to upsert user profile (offline?):', err);
    try {
      localStorage.setItem(PENDING_PROFILE_SYNC_KEY, JSON.stringify({
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        failedAt: new Date().toISOString(),
      }));
    } catch (_e) { /* silent */ }
  }
}

export async function sendUserHeartbeat(userEmail: string, secondsInterval: number = 180): Promise<void> {
  if (!isSupabaseConfigured || !userEmail) return;

  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('total_active_seconds')
      .eq('email', userEmail)
      .single();

    const currentSeconds = Number(data?.total_active_seconds || 0);

    await supabase
      .from('user_profiles')
      .update({
        last_active_at: new Date().toISOString(),
        total_active_seconds: currentSeconds + secondsInterval,
        updated_at: new Date().toISOString(),
      })
      .eq('email', userEmail);
  } catch (_err) {
    /* Non-blocking fail-safe */
  }
}

/**
 * Mengambil seluruh profil pengguna dari Supabase
 */
export async function fetchAllUserProfiles(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[RouteService] Error fetching user profiles:', error);
      return [];
    }
    return (data as UserProfile[]) || [];
  } catch (err) {
    console.error('[RouteService] Failed to fetch user profiles:', err);
    return [];
  }
}

/**
 * Menambahkan user baru ke whitelist sistem
 */
export async function addUserProfile(params: {
  email: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'petugas';
  notes?: string;
  created_by?: string;
}): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Koneksi database tidak terkonfigurasi.' };
  }
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    // Validasi format email ketat di service layer (UI hanya includes('@'))
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      return { success: false, message: 'Format email tidak valid.' };
    }
    const { data, error } = await supabase.from('user_profiles').insert([
      {
        email: cleanEmail,
        full_name: params.full_name.trim(),
        role: params.role,
        notes: params.notes?.trim() || null,
        created_by: params.created_by || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).select('email');

    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'Email tersebut sudah terdaftar di sistem.' };
      }
      return { success: false, message: `Gagal menambahkan pengguna: ${error.message}` };
    }

    // BUG-65: Deteksi zero-row — RLS bisa memfilter INSERT tanpa error dan
    // menghasilkan 0 baris; ini menjadikannya kegagalan yang terlihat
    // konsisten (NOT NULL email membuat data selalu berisi saat berhasil).
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `Tidak ada baris yang tersimpan untuk ${cleanEmail}. Kemungkinan policy database memblokir operasi ini.`,
      };
    }

    // Catat ke audit trail
    await logActivity({
      user_email: params.created_by || 'system',
      action: 'USER_ADDED',
      details: {
        target_email: cleanEmail,
        target_name: params.full_name,
        assigned_role: params.role,
        notes: params.notes,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
  }
}

/**
 * Mengubah role akun pengguna
 */
export async function updateUserProfileRole(
  targetEmail: string,
  newRole: 'superadmin' | 'admin' | 'petugas',
  updatedBy: string,
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: false, message: 'Koneksi database tidak terkonfigurasi.' };
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('email', targetEmail)
      .select('email');

    if (error) {
      return { success: false, message: `Gagal mengubah peran: ${error.message}` };
    }

    // BUG-63: RLS bisa memfilter operasi TANPA error (PostgREST sukses
    // dengan 0 baris). Tanpa cek ini, UI menampilkan sukses palsu.
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `Tidak dapat menemukan akun dengan email ${targetEmail} atau akses ditolak. Silakan coba lagi.`,
      };
    }

    await logActivity({
      user_email: updatedBy,
      action: 'USER_ROLE_CHANGED',
      details: {
        target_email: targetEmail,
        new_role: newRole,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan.' };
  }
}

/**
 * Mengaktifkan atau menonaktifkan akun pengguna
 */
export async function toggleUserProfileStatus(
  targetEmail: string,
  isActive: boolean,
  updatedBy: string,
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: false, message: 'Koneksi database tidak terkonfigurasi.' };
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('email', targetEmail)
      .select('email');

    if (error) {
      return { success: false, message: `Gagal mengubah status akun: ${error.message}` };
    }

    // BUG-63: Deteksi zero-row — blokir silent RLS tidak boleh tampil sukses
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `Tidak dapat menemukan akun dengan email ${targetEmail} atau akses ditolak. Silakan coba lagi.`,
      };
    }

    await logActivity({
      user_email: updatedBy,
      action: 'USER_STATUS_CHANGED',
      details: {
        target_email: targetEmail,
        new_status: isActive ? 'active' : 'inactive',
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan.' };
  }
}

/**
 * Mencabut / menonaktifkan akses pengguna dari sistem (Soft Delete / is_active: false)
 */
export async function revokeUserProfile(
  targetEmail: string,
  revokedBy: string,
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: false, message: 'Koneksi database tidak terkonfigurasi.' };
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('email', targetEmail)
      .select('email');

    if (error) {
      return { success: false, message: `Gagal mencabut akses pengguna: ${error.message}` };
    }

    // Deteksi zero-row — RLS policy memblokir atau akun tidak ditemukan
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `Tidak dapat menemukan akun dengan email ${targetEmail} atau akses ditolak. Silakan coba lagi.`,
      };
    }

    await logActivity({
      user_email: revokedBy,
      action: 'USER_REVOKED',
      details: {
        target_email: targetEmail,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan.' };
  }
}
