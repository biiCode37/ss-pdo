import { supabase, isSupabaseConfigured } from '../supabase';
import { invokeAdminAction } from '../adminActionService';
import type { UserProfile, UserRole, Role } from '../../types/supabase';
import { logActivity } from './audit';
import { formatUserError } from '../../utils/errorFormatter';
import { TEXT_USER_MANAGEMENT } from '../../constants/texts/text_user_management';

export const ROLE_CODE_TO_ID: Record<string, number> = {
  superadmin: 1,
  admin: 2,
  korwil: 3,
  korlap: 4,
  pdo: 5,
  petugas: 5, // backward-compat alias
};

export const ROLE_ID_TO_CODE: Record<number, UserRole> = {
  1: 'superadmin',
  2: 'admin',
  3: 'korwil',
  4: 'korlap',
  5: 'pdo',
};

const PENDING_PROFILE_SYNC_KEY = 'PDO_PROFILE_SYNC_PENDING';

/**
 * Menghasilkan checksum anti-tamper untuk cache profil offline (SEC-154-04).
 * Mencegah manipulasi manual di localStorage untuk eskalasi hak akses offline.
 */
export function generateProfileChecksum(
  email: string,
  role: string,
  roleId: number,
  isActive: boolean,
  verifiedAt: string
): string {
  const pepper = 'pusm_pdo_sec_v1_integrity_hash';
  const str = `${email.trim().toLowerCase()}|${role}|${roleId}|${isActive}|${verifiedAt}|${pepper}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Sanitasi pesan error teknis database agar ramah pengguna (SEC-154-05).
 */
export function sanitizeDatabaseError(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'object' && error !== null) {
    const msg = (error as any).message;
    if (typeof msg === 'string') {
      if (msg.includes('Akses ditolak')) {
        return msg;
      }
      if (msg.includes('duplicate key') || msg.includes('23505') || msg.includes('unique constraint')) {
        return 'Email tersebut sudah terdaftar di sistem.';
      }
    }
  }
  return formatUserError(error, fallbackMessage) || fallbackMessage;
}


/** Fallback verifikasi via cache profil lokal (window 30 hari + status aktif) */
export function tryOfflineProfileFallback(normalizedEmail: string): { isAllowed: true; profile: UserProfile } | null {
  if (!normalizedEmail) return null;
  try {
    const cachedRaw = localStorage.getItem(`PDO_LAST_VERIFIED_PROFILE_${normalizedEmail}`);
    if (!cachedRaw) return null;
    const { profile, verifiedAt, checksum } = JSON.parse(cachedRaw);
    if (!profile || !verifiedAt || !profile.email) return null;

    const daysSince = (Date.now() - new Date(verifiedAt).getTime()) / 86400000;
    if (daysSince > 30 || !profile.is_active) return null;

    // SEC-154-04: Verifikasi checksum integritas data profil offline
    const expectedChecksum = generateProfileChecksum(
      profile.email,
      profile.role || 'pdo',
      profile.role_id || 5,
      profile.is_active,
      verifiedAt
    );

    if (checksum) {
      if (checksum !== expectedChecksum) {
        console.warn('[RouteService] Deteksi manipulasi cache profil offline (checksum mismatch). Akses ditolak.');
        return null;
      }
    } else {
      // Jika cache lama tanpa checksum mencoba mengklaim peran administratif, tolak demi keamanan
      if (profile.role === 'superadmin' || profile.role === 'admin') {
        console.warn('[RouteService] Cache profil tanpa tanda tangan mencoba klaim peran istimewa offline. Ditolak.');
        return null;
      }
    }

    console.log('[RouteService] User profile verified via offline cache fallback.');
    return {
      isAllowed: true,
      profile: profile as UserProfile,
    };
  } catch (_cacheErr) {
    return null;
  }
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
      .select('*, roles(id, uuid, code, name, description)')
      .eq('email', normalizedEmail)
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

    const roleCode = ((data.roles as any)?.code || ROLE_ID_TO_CODE[data.role_id] || 'pdo') as UserRole;
    const profile: UserProfile = {
      ...data,
      role: roleCode,
    };

    // Simpan cache profil yang berhasil diverifikasi untuk offline fallback dengan checksum (SEC-154-04)
    try {
      const verifiedAt = new Date().toISOString();
      const checksum = generateProfileChecksum(
        profile.email,
        profile.role || 'pdo',
        profile.role_id,
        profile.is_active ?? true,
        verifiedAt
      );
      localStorage.setItem(cacheKey, JSON.stringify({
        profile,
        verifiedAt,
        checksum,
      }));
    } catch (_e) {}

    // Awaited last_login_at update — kegagalan tidak blocking login
    try {
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('email', normalizedEmail);
    } catch (_e) {
      console.warn('[RouteService] last_login_at update failed (non-blocking):', _e);
    }

    return {
      isAllowed: true,
      profile,
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
  const cleanEmail = userEmail.trim().toLowerCase();

  try {
    // Pulsa tanpa durasi (mount/tab kembali aktif) cukup memperbarui last_active_at: 1 request, bukan baca + tulis (BUG-QUOTA-203-02)
    if (secondsInterval <= 0) {
      await supabase
        .from('user_profiles')
        .update({ last_active_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('email', cleanEmail);
      return;
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('total_active_seconds')
      .eq('email', cleanEmail)
      .single();

    const currentSeconds = Number(data?.total_active_seconds || 0);

    await supabase
      .from('user_profiles')
      .update({
        last_active_at: new Date().toISOString(),
        total_active_seconds: currentSeconds + secondsInterval,
        updated_at: new Date().toISOString(),
      })
      .eq('email', cleanEmail);
  } catch (_err) {
    /* Non-blocking fail-safe */
  }
}

/**
 * Mengambil seluruh profil pengguna dari Supabase beserta data relasi roles
 */
export async function fetchAllUserProfiles(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, roles(id, uuid, code, name, description)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[RouteService] Error fetching user profiles:', error);
      return [];
    }
    return (data || []).map((u: any) => ({
      ...u,
      role: (u.roles?.code || ROLE_ID_TO_CODE[u.role_id] || 'pdo') as UserRole,
    }));
  } catch (err) {
    console.error('[RouteService] Failed to fetch user profiles:', err);
    return [];
  }
}

/**
 * Mengambil master data peran (roles) dari database
 */
export async function fetchMasterRoles(): Promise<Role[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      console.error('[RouteService] Error fetching master roles:', error);
      return [];
    }
    return (data as Role[]) || [];
  } catch (err) {
    console.error('[RouteService] Failed to fetch master roles:', err);
    return [];
  }
}

/**
 * Menambahkan user baru ke whitelist sistem
 */
export async function addUserProfile(params: {
  email: string;
  full_name?: string;
  role?: UserRole | 'petugas';
  role_id?: number;
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

    const assignedRoleId =
      params.role_id || (params.role ? ROLE_CODE_TO_ID[params.role] : 5) || 5;

    const res = await invokeAdminAction('add_user_profile', {
      email: cleanEmail,
      fullName: params.full_name?.trim() || cleanEmail.split('@')[0],
      roleId: assignedRoleId,
      notes: params.notes?.trim() || null,
    });

    if (!res.success) {
      return { success: false, message: res.message || TEXT_USER_MANAGEMENT.ALERTS.ADD_FAILED_MSG };
    }

    const assignedRoleCode = ROLE_ID_TO_CODE[assignedRoleId] || params.role || 'pdo';

    // Catat ke audit trail
    await logActivity({
      user_email: res.verifiedEmail || params.created_by || 'system',
      action: 'USER_ADDED',
      details: {
        target_email: cleanEmail,
        target_name: params.full_name,
        assigned_role: assignedRoleCode,
        assigned_role_id: assignedRoleId,
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
  newRole: UserRole | 'petugas' | number,
  updatedBy: string,
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: false, message: 'Koneksi database tidak terkonfigurasi.' };
  try {
    const cleanTarget = targetEmail.trim().toLowerCase();
    const roleId = typeof newRole === 'number' ? newRole : (ROLE_CODE_TO_ID[newRole] || 5);

    const res = await invokeAdminAction('update_user_role', {
      targetEmail: cleanTarget,
      newRoleId: roleId,
    });

    if (!res.success) {
      return { success: false, message: res.message || TEXT_USER_MANAGEMENT.ALERTS.EDIT_ROLE_FAILED_MSG };
    }

    const assignedRoleCode = ROLE_ID_TO_CODE[roleId] || 'pdo';

    await logActivity({
      user_email: res.verifiedEmail || updatedBy,
      action: 'USER_ROLE_CHANGED',
      details: {
        target_email: cleanTarget,
        new_role: assignedRoleCode,
        new_role_id: roleId,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan.' };
  }
}

/**
 * Mengaktifkan atau menonaktifkan akun pengguna via secure Edge Function (Refactor 191)
 */
export async function toggleUserProfileStatus(
  targetEmail: string,
  isActive: boolean,
  updatedBy: string,
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: false, message: 'Koneksi database tidak terkonfigurasi.' };
  try {
    const cleanTarget = targetEmail.trim().toLowerCase();

    const res = await invokeAdminAction('toggle_user_status', {
      targetEmail: cleanTarget,
      isActive,
    });

    if (!res.success) {
      return { success: false, message: res.message || TEXT_USER_MANAGEMENT.ALERTS.TOGGLE_STATUS_FAILED_MSG };
    }

    await logActivity({
      user_email: res.verifiedEmail || updatedBy,
      action: 'USER_STATUS_CHANGED',
      details: {
        target_email: cleanTarget,
        new_status: isActive ? 'active' : 'inactive',
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan.' };
  }
}

/**
 * Mencabut / menonaktifkan akses pengguna dari sistem via secure Edge Function (Refactor 191)
 */
export async function revokeUserProfile(
  targetEmail: string,
  revokedBy: string,
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: false, message: 'Koneksi database tidak terkonfigurasi.' };
  try {
    const cleanTarget = targetEmail.trim().toLowerCase();

    const res = await invokeAdminAction('toggle_user_status', {
      targetEmail: cleanTarget,
      isActive: false,
    });

    if (!res.success) {
      return { success: false, message: res.message || TEXT_USER_MANAGEMENT.ALERTS.DELETE_USER_FAILED_MSG };
    }

    await logActivity({
      user_email: res.verifiedEmail || revokedBy,
      action: 'USER_REVOKED',
      details: {
        target_email: cleanTarget,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan.' };
  }
}

/**
 * Mengambil ID pengguna saat ini dari localStorage atau cache profil user.
 */
export function getCurrentUserId(): number | null {
  const cachedId = localStorage.getItem('PDO_USER_ID');
  if (cachedId) {
    const parsed = parseInt(cachedId, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const email = localStorage.getItem('PDO_USER_EMAIL');
  if (email) {
    try {
      const cached = localStorage.getItem(`PDO_LAST_VERIFIED_PROFILE_${email.trim().toLowerCase()}`);
      if (cached) {
        const { profile } = JSON.parse(cached);
        if (profile?.id) {
          localStorage.setItem('PDO_USER_ID', String(profile.id));
          return Number(profile.id);
        }
      }
    } catch {}
  }
  return null;
}

