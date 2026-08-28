import type { BusData } from '../services/googleSheets';

const EDITABLE_BUS_FIELDS: (keyof BusData)[] = [
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

export function getEditableBusFields(): (keyof BusData)[] {
  return EDITABLE_BUS_FIELDS;
}

export function mergeRemoteBusDataWithLocalUpdates(
  remoteData: Partial<BusData>,
  localUpdates: Partial<BusData>,
): Partial<BusData> {
  const merged: Partial<BusData> = {};
  for (const field of EDITABLE_BUS_FIELDS) {
    const remoteValue = remoteData[field];
    const localValue = localUpdates[field];
    if (remoteValue !== undefined) merged[field] = remoteValue as never;
    if (localValue !== undefined) merged[field] = localValue as never;
  }
  return merged;
}
