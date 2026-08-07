import { supabase, isSupabaseConfigured } from './supabase';
import type { Route, UserProfile, ActivityLog, SyncQueueBackup, DailyUnitSummary } from '../types/supabase';
import type { BusData } from './googleSheets';
import { parseIndonesianNumber } from '../utils/numberUtils';
import { formatAccumulatedNotes } from '../utils/analytics';

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

    // ISS-10 fix: Awaited last_login_at update — kegagalan tidak blocking login
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


