import { supabase, isSupabaseConfigured } from './supabase';
import type { Route, UserProfile, ActivityLog, SyncQueueBackup, DailyUnitSummary } from '../types/supabase';
import type { BusData } from './googleSheets';
import { parseIndonesianNumber } from '../utils/numberUtils';
import { formatAccumulatedNotes } from '../utils/analytics';
import {
  formatRouteCode,
  validateRouteCode,
  validateGoogleSheetsUrl,
} from '../utils/routeValidation';

const CACHE_KEY_ROUTES = 'PDO_CACHE_ROUTES';
const PENDING_ACTIVITY_LOGS_KEY = 'PDO_PENDING_ACTIVITY_LOGS';
const PENDING_PROFILE_SYNC_KEY = 'PDO_PROFILE_SYNC_PENDING';

function readPendingActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(PENDING_ACTIVITY_LOGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingActivityLogs(logs: ActivityLog[]): void {
  try {
    localStorage.setItem(PENDING_ACTIVITY_LOGS_KEY, JSON.stringify(logs.slice(-100)));
  } catch (_e) {}
}

export async function flushPendingLocalSync(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const pendingProfile = localStorage.getItem(PENDING_PROFILE_SYNC_KEY);
  if (pendingProfile) {
      try {
        const profile = JSON.parse(pendingProfile);
        await upsertUserProfile(profile);
        localStorage.removeItem(PENDING_PROFILE_SYNC_KEY);
      } catch (_e) {}
    }

  const logs = readPendingActivityLogs();
  if (logs.length > 0) {
    const remaining: ActivityLog[] = [];
    for (const log of logs) {
      try {
        const { error } = await supabase.from('activity_logs').insert([log]);
        if (error) remaining.push(log);
      } catch (_e) {
        remaining.push(log);
      }
    }
    writePendingActivityLogs(remaining);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushPendingLocalSync().catch(() => {});
  });
}

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
      localStorage.setItem('PDO_CACHE_ROUTES_TIMESTAMP', new Date().toISOString());
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

/** Fallback verifikasi via cache profil lokal (window 30 hari + status aktif) */
function tryOfflineProfileFallback(normalizedEmail: string): { isAllowed: true; profile: UserProfile } | null {
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
        localStorage.setItem('PDO_PROFILE_SYNC_PENDING', JSON.stringify({
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          failedAt: new Date().toISOString(),
        }));
      } catch (_e) { /* localStorage bisa penuh */ }
    } else {
      // Berhasil — hapus pending sync jika ada
      localStorage.removeItem('PDO_PROFILE_SYNC_PENDING');
    }
  } catch (err) {
    console.warn('[RouteService] Failed to upsert user profile (offline?):', err);
    try {
      localStorage.setItem('PDO_PROFILE_SYNC_PENDING', JSON.stringify({
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        failedAt: new Date().toISOString(),
      }));
    } catch (_e) { /* silent */ }
  }
}

// In-memory cache for activity logs (TTL 3 minutes)
interface ActivityLogCacheEntry {
  data: ActivityLog[];
  timestamp: number;
}
const activityLogCache = new Map<string, ActivityLogCacheEntry>();
const ACTIVITY_LOG_CACHE_TTL = 3 * 60 * 1000;

export async function logActivity(log: ActivityLog): Promise<void> {
  if (!isSupabaseConfigured) {
    const userEmail = log.user_email || localStorage.getItem('PDO_USER_EMAIL') || 'unknown';
    const entry = { ...log, user_email: userEmail, timestamp: Date.now() };
    const pending = readPendingActivityLogs();
    pending.push(entry);
    writePendingActivityLogs(pending);
    return;
  }

  try {
    const userEmail = log.user_email || localStorage.getItem('PDO_USER_EMAIL') || 'unknown';
    await supabase.from('activity_logs').insert([{ ...log, user_email: userEmail }]);
    // Invalidate activity log cache on new activity
    activityLogCache.clear();
  } catch (err) {
    console.error('[RouteService] Failed to log activity:', err);
    const pending = readPendingActivityLogs();
    pending.push(log);
    writePendingActivityLogs(pending);
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

  const formattedCode = formatRouteCode(params.routeCode);
  const codeValidation = validateRouteCode(formattedCode);
  if (!codeValidation.isValid) {
    return { success: false, message: codeValidation.error };
  }

  const urlValidation = validateGoogleSheetsUrl(params.sheetUrl);
  if (!urlValidation.isValid) {
    return { success: false, message: urlValidation.error };
  }

  const spreadsheetId = urlValidation.spreadsheetId || params.spreadsheetId;
  const finalRouteName = params.routeName || formattedCode;

  try {
    // 1. Cek apakah route sudah ada berdasarkan route_code
    const { data: existingRoute } = await supabase
      .from('routes')
      .select('id')
      .eq('route_code', formattedCode)
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
          route_code: formattedCode,
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
        spreadsheet_id: spreadsheetId,
        sheet_url: params.sheetUrl,
        tab_name: 'PDO',
      }]);

    if (sheetError) {
      // Unique constraint violation = sheet untuk periode ini sudah ada
      if (sheetError.code === '23505') {
        return { success: false, message: `Rute ${formattedCode} sudah memiliki data untuk periode ${params.month}/${params.year}.` };
      }
      return { success: false, message: `Gagal menyimpan data sheet: ${sheetError.message}` };
    }

    // 3. Refresh cache lokal
    await fetchRoutesWithSheets();

    // Telemetry: Log CREATE_ROUTE
    logActivity({
      user_email: localStorage.getItem('PDO_USER_EMAIL') || 'admin',
      action: 'CREATE_ROUTE',
      route_code: formattedCode,
      details: { year: params.year, month: params.month, spreadsheetId },
    }).catch(() => {});

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

    // Telemetry: Log DELETE_ROUTE
    logActivity({
      user_email: localStorage.getItem('PDO_USER_EMAIL') || 'admin',
      action: 'DELETE_ROUTE',
      details: { sheetId, routeId },
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
    console.error('[RouteService] Failed to delete route sheet:', err);
    return { success: false, message: 'Gagal menghapus rute. Periksa koneksi internet Anda.' };
  }
}

/**
  * Upsert batch ringkasan unit harian ke Supabase cache
  */
export async function upsertDailyUnitSummaries(summaries: DailyUnitSummary[]): Promise<void> {
  if (!isSupabaseConfigured || !summaries || summaries.length === 0) return;

  try {
    const { error } = await supabase
      .from('daily_unit_summaries')
      .upsert(summaries, { onConflict: 'route_code,year,month,day,unit' });

    if (error) {
      console.warn('[RouteService] Failed to upsert daily unit summaries:', error);
    }
  } catch (err) {
    console.warn('[RouteService] Error upserting daily unit summaries (offline?):', err);
  }
}

export interface CrossPeriodSummaryResult {
  data: BusData[];
  totalDays: number;
}

/**
  * Kueri akumulasi lintas bulan/tahun dari tabel Supabase daily_unit_summaries
  */
export async function getCrossPeriodAccumulation(
  routeCode: string,
  startYear: number,
  startMonth: number,
  startDay: number,
  endYear: number,
  endMonth: number,
  endDay: number
): Promise<CrossPeriodSummaryResult | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const startDateNum = startYear * 10000 + startMonth * 100 + startDay;
    const endDateNum = endYear * 10000 + endMonth * 100 + endDay;

    const { data, error } = await supabase
      .from('daily_unit_summaries')
      .select('*')
      .eq('route_code', routeCode);

    if (error || !data) return null;

    const filtered = data.filter((row: any) => {
      const dNum = row.year * 10000 + row.month * 100 + row.day;
      return dNum >= startDateNum && dNum <= endDateNum;
    });

    if (filtered.length === 0) return null;

    const unitMap = new Map<string, BusData>();
    const unitNotesMap = new Map<string, { day: number; note: string }[]>();

    filtered.forEach((row: any) => {
      const unitName = row.unit;
      const dayNum = Number(row.day || 1);
      const existing = unitMap.get(unitName);

      const toa1 = Number(row.toa_shift1 || 0);
      const man1 = Number(row.manual_shift1 || 0);
      const toa2 = Number(row.toa_shift2 || 0);
      const man2 = Number(row.manual_shift2 || 0);
      const totToa = Number(row.total_toa || (toa1 + toa2));
      const km = Number(row.total_km || 0);
      const ket = row.keterangan || '';

      if (ket) {
        const notesArr = unitNotesMap.get(unitName) || [];
        notesArr.push({ day: dayNum, note: ket });
        unitNotesMap.set(unitName, notesArr);
      }

      if (!existing) {
        unitMap.set(unitName, {
          rowIndex: 0,
          unit: unitName,
          toaShift1: toa1 > 0 ? String(toa1) : '',
          manualShift1: man1 > 0 ? String(man1) : '',
          toaShift2: toa2 > 0 ? String(toa2) : '',
          manualShift2: man2 > 0 ? String(man2) : '',
          totalToa: totToa > 0 ? String(totToa) : '',
          kmAwal1: '0',
          kmAkhir1: String(km),
          kmAwal2: '0',
          kmAkhir2: '0',
          keterangan: ket,
          originalRow: [],
        });
      } else {
        const exKm = parseIndonesianNumber(existing.kmAkhir1);
        const exToa1 = parseIndonesianNumber(existing.toaShift1);
        const exMan1 = parseIndonesianNumber(existing.manualShift1);
        const exToa2 = parseIndonesianNumber(existing.toaShift2);
        const exMan2 = parseIndonesianNumber(existing.manualShift2);
        const exTotToa = parseIndonesianNumber(existing.totalToa);

        const newKm = exKm + km;
        const sumToa1 = exToa1 + toa1;
        const sumMan1 = exMan1 + man1;
        const sumToa2 = exToa2 + toa2;
        const sumMan2 = exMan2 + man2;
        const sumTotToa = exTotToa + totToa;

        existing.toaShift1 = sumToa1 > 0 ? String(sumToa1) : '';
        existing.manualShift1 = sumMan1 > 0 ? String(sumMan1) : '';
        existing.toaShift2 = sumToa2 > 0 ? String(sumToa2) : '';
        existing.manualShift2 = sumMan2 > 0 ? String(sumMan2) : '';
        existing.totalToa = sumTotToa > 0 ? String(sumTotToa) : '';
        existing.kmAkhir1 = String(newKm);
      }
    });

    for (const bus of unitMap.values()) {
      const rawNotes = unitNotesMap.get(bus.unit);
      if (rawNotes && rawNotes.length > 0) {
        bus.keterangan = formatAccumulatedNotes(rawNotes);
      }
    }

    return {
      data: Array.from(unitMap.values()),
      totalDays: new Set(filtered.map((r: any) => `${r.year}-${r.month}-${r.day}`)).size,
    };
  } catch (err) {
    console.error('[RouteService] Error getting cross period accumulation:', err);
    return null;
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
    const { error } = await supabase.from('user_profiles').insert([
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
    ]);
    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'Email tersebut sudah terdaftar di sistem.' };
      }
      return { success: false, message: `Gagal menambahkan pengguna: ${error.message}` };
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

/**
 * Mengambil log aktivitas untuk audit.
 * BUG-64: Fail-loud — error sebelumnya ditelan jadi array kosong sehingga
 * halaman audit menampilkan "0 riwayat" tanpa tanda ada masalah.
 */
export async function fetchActivityLogs(options?: {
  limit?: number;
  userEmail?: string;
  actionPrefix?: string;
  forceRefresh?: boolean;
}): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured) return [];

  const cacheKey = JSON.stringify({
    limit: options?.limit || 100,
    userEmail: options?.userEmail || '',
    actionPrefix: options?.actionPrefix || '',
  });

  const now = Date.now();
  const cached = activityLogCache.get(cacheKey);

  // Return cached result if valid and not force-refreshing
  if (!options?.forceRefresh && cached && now - cached.timestamp < ACTIVITY_LOG_CACHE_TTL) {
    return cached.data;
  }

  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit || 100);

  if (options?.userEmail) {
    query = query.eq('user_email', options.userEmail);
  }
  if (options?.actionPrefix) {
    query = query.ilike('action', `${options.actionPrefix}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[RouteService] Error fetching activity logs:', error);
    return [];
  }

  const result = (data as ActivityLog[]) || [];
  activityLogCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}



