import { supabase } from './supabase';
import type { DailyRoutePlotting, UnitPlottingItem, PlottingStartPoint } from '../types/supabase';
import type { BusData } from './googleSheets';
import { parseIndonesianNumber } from '../utils/numberUtils';

function getLocalStorageKey(routeId: number, date: string): string {
  return `SS_PLOTTING_${routeId}_${date}`;
}

/**
 * Memuat data plotting harian rute untuk tanggal tertentu (Supabase dengan Offline Cache fallback).
 */
export async function fetchDailyPlotting(
  routeId: number,
  date: string,
): Promise<DailyRoutePlotting | null> {
  const localKey = getLocalStorageKey(routeId, date);

  try {
    const { data, error } = await supabase
      .from('daily_route_plottings')
      .select('*')
      .eq('route_id', routeId)
      .eq('date', date)
      .maybeSingle();

    if (!error && data) {
      const plotting = data as DailyRoutePlotting;
      // Sinkronkan cache lokal
      try {
        localStorage.setItem(localKey, JSON.stringify(plotting));
      } catch {
        // Abaikan jika quota storage penuh
      }
      return plotting;
    }
  } catch (err) {
    console.warn('[dailyPlottingService] Gagal fetch dari Supabase, beralih ke cache lokal:', err);
  }

  // Fallback ke localStorage
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      return JSON.parse(cached) as DailyRoutePlotting;
    }
  } catch (err) {
    console.warn('[dailyPlottingService] Gagal membaca localStorage:', err);
  }

  return null;
}

/**
 * Menyimpan data plotting harian (Offline-First: simpan ke localStorage seketika, lalu sinkronkan ke Supabase).
 */
export async function saveDailyPlotting(
  plotting: Omit<DailyRoutePlotting, 'id' | 'created_at' | 'updated_at'>,
): Promise<DailyRoutePlotting> {
  const localKey = getLocalStorageKey(plotting.route_id, plotting.date);
  const nowIso = new Date().toISOString();

  const completeData: DailyRoutePlotting = {
    ...plotting,
    updated_at: nowIso,
  };

  // 1. Simpan seketika di localStorage agar instan & tahan offline
  try {
    localStorage.setItem(localKey, JSON.stringify(completeData));
  } catch {
    // Abaikan jika quota storage penuh
  }

  // 2. Sinkronkan ke Supabase
  try {
    const { data, error } = await supabase
      .from('daily_route_plottings')
      .upsert(
        {
          route_id: plotting.route_id,
          route_code: plotting.route_code,
          date: plotting.date,
          endpoint_a_name: plotting.endpoint_a_name,
          endpoint_b_name: plotting.endpoint_b_name,
          units_data: plotting.units_data,
          updated_at: nowIso,
        },
        { onConflict: 'route_id,date' },
      )
      .select()
      .single();

    if (!error && data) {
      const saved = data as DailyRoutePlotting;
      try {
        localStorage.setItem(localKey, JSON.stringify(saved));
      } catch {
        // Abaikan
      }
      return saved;
    }
  } catch (err) {
    console.warn('[dailyPlottingService] Gagal upsert ke Supabase (tersimpan di lokal):', err);
  }

  return completeData;
}

/**
 * Memutar urutan unit (Rolling Harian / FIFO Cycle):
 * Unit urutan #1 kemarin diputar menjadi urutan terakhir hari ini pada masing-masing pangkalan.
 * Seluruh unit di bawahnya otomatis naik 1 tingkat.
 */
export function generateRollingFromYesterday(
  yesterdayUnits: UnitPlottingItem[],
): UnitPlottingItem[] {
  const result: UnitPlottingItem[] = [];

  const points: PlottingStartPoint[] = ['A', 'B'];

  points.forEach((point) => {
    const unitsAtPoint = yesterdayUnits
      .filter((u) => u.start_point === point)
      .sort((a, b) => a.order - b.order);

    if (unitsAtPoint.length <= 1) {
      result.push(...unitsAtPoint);
      return;
    }

    // Ambil unit #1 pertama
    const firstUnit = unitsAtPoint[0];
    const remainingUnits = unitsAtPoint.slice(1);

    // Geser unit lainnya naik: index 0 (tadinya #2) jadi #1, dst.
    const reordered: UnitPlottingItem[] = remainingUnits.map((u, idx) => ({
      ...u,
      order: idx + 1,
    }));

    // Unit pertama kemarin ditaruh di urutan paling akhir
    reordered.push({
      ...firstUnit,
      order: reordered.length + 1,
    });

    result.push(...reordered);
  });

  return result;
}

/**
 * Menghitung titik start otomatis (Smart Auto-Inherit) berdasarkan hukum fisik ritase kemarin:
 * - Jika total ritase kemarin genap/bulat (misal 7.0 rit) -> Unit tidur di titik awal -> Tetap start di titik awal.
 * - Jika total ritase kemarin ganjil/setengah (misal 7.5 rit) -> Unit tidur di titik seberang -> Start di titik seberang.
 */
export function calculateAutoInheritedStartPoints(
  yesterdayPlotting: DailyRoutePlotting | null,
  yesterdayBuses: BusData[],
): Map<string, PlottingStartPoint> {
  const map = new Map<string, PlottingStartPoint>();
  if (!yesterdayPlotting || !yesterdayPlotting.units_data) {
    return map;
  }

  const busMap = new Map<string, BusData>();
  yesterdayBuses.forEach((b) => {
    if (b.unit) busMap.set(b.unit.trim().toUpperCase(), b);
  });

  yesterdayPlotting.units_data.forEach((item) => {
    const unitKey = item.unit.trim().toUpperCase();
    const bus = busMap.get(unitKey);

    if (!bus) {
      map.set(item.unit, item.start_point);
      return;
    }

    const tp = parseIndonesianNumber(bus.tripPergi || '0');
    const tpl = parseIndonesianNumber(bus.tripPulang || '0');
    const totalTrips = tp + tpl;
    const totalRitase = totalTrips / 2;

    // Jika ritase setengah (misal 7.5 rit)
    if (totalRitase % 1 !== 0) {
      // Titik akhir adalah pangkalan seberang
      const nextPoint: PlottingStartPoint = item.start_point === 'A' ? 'B' : 'A';
      map.set(item.unit, nextPoint);
    } else {
      // Titik akhir kembali ke pangkalan awal
      map.set(item.unit, item.start_point);
    }
  });

  return map;
}
