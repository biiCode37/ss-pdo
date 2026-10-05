import { supabase } from './supabase';
import type {
  FleetStatusMaster,
  DailyFleetShift,
  DailyFleetNonSgoUnit,
  DailyFleetShiftWithUnits,
} from '../types/supabase';

/**
 * Fallback master status armada bawaan jika database tidak terjangkau (offline / cold start).
 */
export const FALLBACK_FLEET_STATUSES: FleetStatusMaster[] = [
  { id: 1, code: 'SGO', name: 'Siap Guna Operasi', default_note: '', is_operational: true, is_editable_note: false, sort_order: 1, is_active: true },
  { id: 2, code: 'TO', name: 'T.O (Tukar Operasi)', default_note: 'EVDAL', is_operational: false, is_editable_note: true, sort_order: 2, is_active: true },
  { id: 3, code: 'OFF', name: 'Libur (OFF)', default_note: 'LIBUR', is_operational: false, is_editable_note: false, sort_order: 3, is_active: true },
  { id: 4, code: 'SO', name: 'Stop Operasi (SO)', default_note: '', is_operational: false, is_editable_note: true, sort_order: 4, is_active: true },
];

/**
 * Mengambil daftar seluruh master status armada aktif terurut berdasarkan sort_order.
 */
export async function fetchFleetStatusesMaster(): Promise<FleetStatusMaster[]> {
  try {
    const { data, error } = await supabase
      .from('fleet_statuses')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('[fleetStatusService] Gagal mengambil master status armada:', error);
      return FALLBACK_FLEET_STATUSES;
    }

    return (data && data.length > 0) ? (data as FleetStatusMaster[]) : FALLBACK_FLEET_STATUSES;
  } catch (err) {
    console.warn('[fleetStatusService] Exception fetchFleetStatusesMaster:', err);
    return FALLBACK_FLEET_STATUSES;
  }
}

/**
 * Mengambil data status armada shift tertentu pada rute dan tanggal tertentu,
 * beserta daftar detail unit non-SGO.
 */
export async function fetchDailyFleetShift(
  routeId: number,
  date: string,
  shift: 1 | 2
): Promise<DailyFleetShiftWithUnits | null> {
  try {
    const { data: shiftData, error: shiftError } = await supabase
      .from('daily_fleet_shifts')
      .select('*')
      .eq('route_id', routeId)
      .eq('date', date)
      .eq('shift', shift)
      .maybeSingle();

    if (shiftError) {
      console.warn(`[fleetStatusService] Gagal mengambil shift route ${routeId} date ${date} s${shift}:`, shiftError);
      return null;
    }

    if (!shiftData) {
      return null;
    }

    const { data: unitsData, error: unitsError } = await supabase
      .from('daily_fleet_non_sgo_units')
      .select('*')
      .eq('fleet_shift_id', shiftData.id)
      .order('unit_body', { ascending: true });

    if (unitsError) {
      console.warn(`[fleetStatusService] Gagal mengambil non-sgo units shift ID ${shiftData.id}:`, unitsError);
    }

    return {
      ...(shiftData as DailyFleetShift),
      non_sgo_units: (unitsData || []) as DailyFleetNonSgoUnit[],
    };
  } catch (err) {
    console.warn('[fleetStatusService] Exception fetchDailyFleetShift:', err);
    return null;
  }
}

/**
 * Menyimpan / memperbarui ringkasan status armada per shift beserta unit non-SGO.
 * Mengganti (replace) seluruh data unit non-SGO untuk shift yang bersangkutan.
 */
export async function upsertDailyFleetShift(
  shiftData: Omit<DailyFleetShift, 'id' | 'created_at' | 'updated_at'>,
  nonSgoUnits: Array<{
    unit_body: string;
    status_id: number;
    status_code: string;
    note: string;
  }>
): Promise<DailyFleetShiftWithUnits> {
  const payload = {
    ...shiftData,
    updated_at: new Date().toISOString(),
  };

  const { data: savedHeader, error: headerError } = await supabase
    .from('daily_fleet_shifts')
    .upsert(payload, { onConflict: 'route_id,date,shift' })
    .select('*')
    .single();

  if (headerError || !savedHeader) {
    console.warn('[fleetStatusService] Gagal upsert daily_fleet_shifts:', headerError);
    throw new Error(`Gagal menyimpan data status armada shift: ${headerError?.message || 'Unknown error'}`);
  }

  const shiftId = savedHeader.id;

  // 1. Hapus unit non-SGO lama untuk shift ini
  const { error: deleteError } = await supabase
    .from('daily_fleet_non_sgo_units')
    .delete()
    .eq('fleet_shift_id', shiftId);

  if (deleteError) {
    console.warn(`[fleetStatusService] Gagal membersihkan unit non-sgo lama shift ID ${shiftId}:`, deleteError);
  }

  // 2. Masukkan unit non-SGO yang baru
  let savedUnits: DailyFleetNonSgoUnit[] = [];
  if (nonSgoUnits.length > 0) {
    const unitsPayload = nonSgoUnits.map((u) => ({
      fleet_shift_id: shiftId,
      unit_body: u.unit_body,
      status_id: u.status_id,
      status_code: u.status_code,
      note: u.note || '',
      created_at: new Date().toISOString(),
    }));

    const { data: insertedUnits, error: insertError } = await supabase
      .from('daily_fleet_non_sgo_units')
      .insert(unitsPayload)
      .select('*');

    if (insertError) {
      console.warn(`[fleetStatusService] Gagal menyisipkan non-sgo units shift ID ${shiftId}:`, insertError);
    } else if (insertedUnits) {
      savedUnits = insertedUnits as DailyFleetNonSgoUnit[];
    }
  }

  return {
    ...(savedHeader as DailyFleetShift),
    non_sgo_units: savedUnits.length > 0 ? savedUnits : nonSgoUnits.map((u, idx) => ({ id: idx + 1, fleet_shift_id: shiftId, ...u })),
  };
}

/**
 * Mengambil seluruh laporan status armada untuk tanggal tertentu (seluruh rute).
 * Digunakan untuk generator laporan wilayah atau rekapitulasi harian.
 */
export async function fetchDailyFleetShiftsByDate(
  date: string,
  shift?: 1 | 2
): Promise<DailyFleetShiftWithUnits[]> {
  try {
    let query = supabase
      .from('daily_fleet_shifts')
      .select('*')
      .eq('date', date);

    if (shift) {
      query = query.eq('shift', shift);
    }

    const { data: shifts, error: shiftsError } = await query;

    if (shiftsError || !shifts) {
      console.warn(`[fleetStatusService] Gagal mengambil shift tanggal ${date}:`, shiftsError);
      return [];
    }

    const shiftIds = shifts.map((s: any) => s.id);
    let unitsByShiftId: Record<number, DailyFleetNonSgoUnit[]> = {};

    if (shiftIds.length > 0) {
      const { data: units, error: unitsError } = await supabase
        .from('daily_fleet_non_sgo_units')
        .select('*')
        .in('fleet_shift_id', shiftIds);

      if (!unitsError && units) {
        for (const u of units) {
          if (!unitsByShiftId[u.fleet_shift_id]) {
            unitsByShiftId[u.fleet_shift_id] = [];
          }
          unitsByShiftId[u.fleet_shift_id].push(u as DailyFleetNonSgoUnit);
        }
      }
    }

    return shifts.map((s: any) => ({
      ...s,
      non_sgo_units: unitsByShiftId[s.id] || [],
    })) as DailyFleetShiftWithUnits[];
  } catch (err) {
    console.warn('[fleetStatusService] Exception fetchDailyFleetShiftsByDate:', err);
    return [];
  }
}
