// ponytail: clean pure functional service for multi-source fleet status resolution
import type { DailyFleetShiftWithUnits, DailyFleetNonSgoUnit, FleetSourceType } from '../types/supabase';
import type { BusData } from './googleSheets';
import { parseIndonesianNumber } from '../utils/numberUtils';

export interface RouteRef {
  id: number;
  route_code: string;
  default_renops?: number;
}

export type ResolvedSourceType = FleetSourceType | 'empty';

export interface ResolvedRouteFleetStatus {
  sourceType: ResolvedSourceType;
  sourceLabel: string;
  isComplete: boolean;
  targetRenops: number;
  realops: number;
  nonSgoUnits: DailyFleetNonSgoUnit[];
}

/**
 * Menyelesaikan penetapan status armada (Renops & Realops) per rute dan per shift
 * berdasarkan hierarki 3 jalur:
 * 1. Prioritas 1: Laporan A2 Petugas PDO atau Input Korlap di Database
 * 2. Prioritas 2: Deteksi otomatis unit dengan ritase > 0 dari spreadsheet asli
 * 3. Prioritas 3: Status empty (memerlukan keputusan/input Korlap)
 *
 * Menerapkan aturan kumulatif harian non-decreasing: Realops Shift 2 >= Realops Shift 1.
 */
export function resolveRouteFleetStatus(
  route: RouteRef,
  _date: string,
  shift: 1 | 2,
  dbShift: DailyFleetShiftWithUnits | null,
  buses: BusData[] | null,
  shift1Realops?: number
): ResolvedRouteFleetStatus {
  // 1. Prioritas 1: Data tersimpan di DB (Laporan A2 atau Input Korlap)
  if (dbShift && (dbShift.is_confirmed || (dbShift.realops !== undefined && dbShift.realops > 0))) {
    const sourceType: FleetSourceType =
      dbShift.source_type || (dbShift.submitted_by_role === 'korlap' ? 'korlap_manual' : 'pdo_a2');
    const sourceLabel = sourceType === 'korlap_manual' ? 'Input Manual Korlap' : 'Laporan A2 Petugas';

    let realops = dbShift.realops ?? 0;
    if (shift === 2 && shift1Realops !== undefined) {
      realops = Math.max(realops, shift1Realops);
    }

    return {
      sourceType,
      sourceLabel,
      isComplete: true,
      targetRenops: dbShift.target_renops || route.default_renops || 0,
      realops,
      nonSgoUnits: dbShift.non_sgo_units || [],
    };
  }

  // 2. Prioritas 2: Deteksi otomatis kolom ritase/trip > 0 dari spreadsheet asli
  if (buses && buses.length > 0) {
    let operatingCount = 0;
    const nonSgoList: DailyFleetNonSgoUnit[] = [];

    for (const bus of buses) {
      const tripPergi = parseIndonesianNumber(bus.tripPergi || '');
      const tripPulang = parseIndonesianNumber(bus.tripPulang || '');
      const hasRitase = tripPergi > 0 || tripPulang > 0;

      if (hasRitase) {
        operatingCount++;
      }

      // Kumpulkan catatan unit yang memiliki keterangan non-kosong
      const note = (bus.keterangan || '').trim();
      if (note && note !== '-' && note !== '') {
        nonSgoList.push({
          unit_body: bus.unit,
          status_id: 0,
          status_code: 'CATATAN',
          note,
        });
      }
    }

    if (operatingCount > 0) {
      let realops = operatingCount;
      if (shift === 2 && shift1Realops !== undefined) {
        realops = Math.max(realops, shift1Realops);
      }

      return {
        sourceType: 'spreadsheet_auto',
        sourceLabel: 'Otomatis Spreadsheet',
        isComplete: true,
        targetRenops: route.default_renops || 0,
        realops,
        nonSgoUnits: nonSgoList,
      };
    }
  }

  // 3. Prioritas 3: Belum Ada Data (Empty)
  return {
    sourceType: 'empty',
    sourceLabel: 'Belum Ada Data',
    isComplete: false,
    targetRenops: route.default_renops || 0,
    realops: 0,
    nonSgoUnits: [],
  };
}
