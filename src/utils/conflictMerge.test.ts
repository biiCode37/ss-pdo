import { describe, expect, it } from 'vitest';
import {
  EDITABLE_BUS_FIELDS,
  mergeRemoteBusDataWithLocalUpdates,
} from './conflictMerge';

describe('mergeRemoteBusDataWithLocalUpdates', () => {
  it('returns empty object when both inputs are empty', () => {
    expect(mergeRemoteBusDataWithLocalUpdates({}, {})).toEqual({});
  });

  it('uses remote values when local updates are empty', () => {
    const remote = {
      toaShift1: '12',
      keterangan: 'BA.01',
      kmAkhir2: '1540',
    };
    expect(mergeRemoteBusDataWithLocalUpdates(remote, {})).toEqual(remote);
  });

  it('uses local updates when remote values are missing', () => {
    const local = {
      kmAkhir1: '1234',
      manualShift1: '5',
    };
    expect(mergeRemoteBusDataWithLocalUpdates({}, local)).toEqual(local);
  });

  it('merges remote Petugas A values with local Petugas B updates', () => {
    const remotePetugasA = {
      toaShift1: '10',
      manualShift1: '3',
      totalToa: '15',
      kmAwal1: '100',
      kmAkhir1: '125',
      keterangan: 'BA.01 (Mogok)',
    };
    const localPetugasB = {
      toaShift1: '10',
      manualShift1: '3',
      totalToa: '15',
      kmAwal1: '125',
      kmAkhir1: '140',
      manualShift2: '2',
      toaShift2: '5',
    };

    const merged = mergeRemoteBusDataWithLocalUpdates(
      remotePetugasA,
      localPetugasB,
    );

    expect(merged.keterangan).toBe('BA.01 (Mogok)');
    expect(merged.kmAwal1).toBe('125');
    expect(merged.kmAkhir1).toBe('140');
    expect(merged.manualShift2).toBe('2');
    expect(merged.toaShift2).toBe('5');
    expect(merged.totalToa).toBe('15');
    expect(merged.manualShift1).toBe('3');
  });

  it('local updates override remote values when both exist', () => {
    const merged = mergeRemoteBusDataWithLocalUpdates(
      { kmAkhir1: '125', keterangan: 'A' },
      { kmAkhir1: '130', keterangan: 'B' },
    );
    expect(merged.kmAkhir1).toBe('130');
    expect(merged.keterangan).toBe('B');
  });

  it('exposes editable fields including all operational columns', () => {
    expect(EDITABLE_BUS_FIELDS).toEqual(
      expect.arrayContaining([
        'toaShift1',
        'manualShift1',
        'manualShift2',
        'totalToa',
        'kmAwal1',
        'kmAkhir1',
        'kmAwal2',
        'kmAkhir2',
        'keterangan',
      ]),
    );
  });
});
