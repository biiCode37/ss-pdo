import { supabase } from './supabase';
import type { Route, DailyRouteReport } from '../types/supabase';

/**
 * Mengambil daftar seluruh master rute aktif beserta konfigurasi spesifikasi
 * (KM baku, target HK, best record, supervisor, dan default titik macet).
 */
export async function fetchRouteMasterList(): Promise<Route[]> {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .order('route_code', { ascending: true });

    if (error) {
      console.warn('[dailyRouteReportService] Gagal mengambil daftar rute:', error);
      return [];
    }

    return (data || []) as Route[];
  } catch (err) {
    console.warn('[dailyRouteReportService] Exception mengambil daftar rute:', err);
    return [];
  }
}

/**
 * Mengambil laporan operasional harian untuk rute dan tanggal tertentu.
 */
export async function fetchDailyRouteReport(
  routeId: number,
  date: string
): Promise<DailyRouteReport | null> {
  try {
    const { data, error } = await supabase
      .from('daily_route_reports')
      .select('*')
      .eq('route_id', routeId)
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.warn(`[dailyRouteReportService] Gagal mengambil laporan rute ID ${routeId} tanggal ${date}:`, error);
      return null;
    }

    return data as DailyRouteReport | null;
  } catch (err) {
    console.warn('[dailyRouteReportService] Exception fetchDailyRouteReport:', err);
    return null;
  }
}

/**
 * Mengambil seluruh laporan operasional harian 18 rute untuk tanggal tertentu.
 */
export async function fetchDailyRouteReportsByDate(date: string): Promise<DailyRouteReport[]> {
  try {
    const { data, error } = await supabase
      .from('daily_route_reports')
      .select('*')
      .eq('date', date);

    if (error) {
      console.warn(`[dailyRouteReportService] Gagal mengambil laporan tanggal ${date}:`, error);
      return [];
    }

    return (data || []) as DailyRouteReport[];
  } catch (err) {
    console.warn('[dailyRouteReportService] Exception fetchDailyRouteReportsByDate:', err);
    return [];
  }
}

/**
 * Menyimpan / memperbarui laporan operasional harian yang diisi oleh petugas PDO.
 */
export async function upsertDailyRouteReport(
  report: Partial<DailyRouteReport> & { route_id: number; route_code: string; date: string }
): Promise<DailyRouteReport> {
  const payload = {
    ...report,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('daily_route_reports')
    .upsert(payload, { onConflict: 'route_id,date' })
    .select('*')
    .single();

  if (error) {
    console.warn('[dailyRouteReportService] Gagal upsertDailyRouteReport:', error);
    throw new Error(`Gagal menyimpan laporan operasional rute: ${error.message}`);
  }

  return data as DailyRouteReport;
}

/**
 * Konfirmasi / verifikasi laporan rute oleh pimpinan / Korlap.
 */
export async function verifyDailyRouteReport(
  reportId: number,
  verifiedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('daily_route_reports')
      .update({
        status: 'verified',
        verified_by: verifiedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) {
      console.warn(`[dailyRouteReportService] Gagal verifikasi laporan ID ${reportId}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[dailyRouteReportService] Exception verifyDailyRouteReport:', err);
    return false;
  }
}
