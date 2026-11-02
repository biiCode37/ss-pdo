import type { BusData } from '../services/googleSheets';

// ponytail: directly export array, eliminate redundant getter wrapper
export const EDITABLE_BUS_FIELDS: (keyof BusData)[] = [
  'toaShift1',
  'toaShift2',
  'manualShift1',
  'manualShift2',
  'totalToa',
  'kmAwal1',
  'kmAkhir1',
  'kmAwal2',
  'kmAkhir2',
  'keterangan',
];

/**
 * Menggabungkan data bus remote dengan pembaruan lokal berdasarkan daftar EDITABLE_BUS_FIELDS.
 *
 * @param remoteData Nilai bus dari Google Sheets (server)
 * @param localUpdates Nilai bus hasil input pengguna (lokal)
 * @param priority Menentukan data mana yang diutamakan jika terjadi benturan ('local' | 'remote'). Default: 'local'.
 */
export function mergeRemoteBusDataWithLocalUpdates(
  remoteData: Partial<BusData>,
  localUpdates: Partial<BusData>,
  priority: 'local' | 'remote' = 'local',
): Partial<BusData> {
  const merged: Partial<BusData> = {};
  for (const field of EDITABLE_BUS_FIELDS) {
    const remoteValue = remoteData[field];
    const localValue = localUpdates[field];
    if (priority === 'remote') {
      if (localValue !== undefined) merged[field] = localValue as never;
      if (remoteValue !== undefined) merged[field] = remoteValue as never;
    } else {
      if (remoteValue !== undefined) merged[field] = remoteValue as never;
      if (localValue !== undefined) merged[field] = localValue as never;
    }
  }
  return merged;
}
