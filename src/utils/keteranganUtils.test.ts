import { describe, it, expect } from 'vitest';
import {
  normalizeKeterangan,
  parseKeterangan,
  filterBusesForKmCopy,
  combineShiftKeterangan,
  splitShiftKeterangan,
} from './keteranganUtils';

describe('keteranganUtils - normalizeKeterangan', () => {
  it('normalizes various formats of BA.01 without details', () => {
    expect(normalizeKeterangan('BA01')).toBe('BA.01');
    expect(normalizeKeterangan('ba01')).toBe('BA.01');
    expect(normalizeKeterangan('BA1')).toBe('BA.01');
    expect(normalizeKeterangan('ba 1')).toBe('BA.01');
    expect(normalizeKeterangan('BA 01')).toBe('BA.01');
    expect(normalizeKeterangan('BA-01')).toBe('BA.01');
    expect(normalizeKeterangan('ba-1')).toBe('BA.01');
    expect(normalizeKeterangan('BA_01')).toBe('BA.01');
    expect(normalizeKeterangan('BA:01')).toBe('BA.01');
    expect(normalizeKeterangan('BA.1')).toBe('BA.01');
    expect(normalizeKeterangan('BA.01')).toBe('BA.01');
  });

  it('normalizes various formats of BA.02, BA.03, BA.04', () => {
    expect(normalizeKeterangan('BA02')).toBe('BA.02');
    expect(normalizeKeterangan('ba 2')).toBe('BA.02');
    expect(normalizeKeterangan('ba-03')).toBe('BA.03');
    expect(normalizeKeterangan('BA.3')).toBe('BA.03');
    expect(normalizeKeterangan('ba04')).toBe('BA.04');
    expect(normalizeKeterangan('BA 4')).toBe('BA.04');
    expect(normalizeKeterangan('BA.04')).toBe('BA.04');
  });

  it('normalizes BA.02 with NP1 and NP2 options', () => {
    expect(normalizeKeterangan('BA02 NP1')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('ba 2 np 1')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('BA.02 np-2')).toBe('BA.02 NP2');
    expect(normalizeKeterangan('np 1')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('NP-1')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('NP1')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('np 2')).toBe('BA.02 NP2');
    expect(normalizeKeterangan('NP.2')).toBe('BA.02 NP2');
  });

  it('normalizes BA codes with follow-up details', () => {
    expect(normalizeKeterangan('BA01 Rusak transmisi')).toBe('BA.01 Rusak transmisi');
    expect(normalizeKeterangan('ba 2 ban pecah')).toBe('BA.02 ban pecah');
    expect(normalizeKeterangan('BA-03: mogok pul')).toBe('BA.03 mogok pul');
    expect(normalizeKeterangan('ba04 - overhaul mesin')).toBe('BA.04 overhaul mesin');
    expect(normalizeKeterangan('BA.01 Supir Sakit')).toBe('BA.01 Supir Sakit');
  });

  it('normalizes fixed status presets (OFF, TO EVDAL)', () => {
    expect(normalizeKeterangan('off')).toBe('OFF');
    expect(normalizeKeterangan('OFF')).toBe('OFF');
    expect(normalizeKeterangan('to evdal')).toBe('TO EVDAL');
    expect(normalizeKeterangan('TO-EVDAL')).toBe('TO EVDAL');
  });

  it('preserves non-BA free text notes intact', () => {
    expect(normalizeKeterangan('Servis AC berkala')).toBe('Servis AC berkala');
    expect(normalizeKeterangan('Baterai lemah')).toBe('Baterai lemah');
    expect(normalizeKeterangan('')).toBe('');
    expect(normalizeKeterangan(null)).toBe('');
    expect(normalizeKeterangan(undefined)).toBe('');
  });

  it('does not incorrectly match non-BA words starting with BA (e.g. BATAL, BAIK, BANDARA)', () => {
    expect(normalizeKeterangan('BATAL JALAN')).toBe('BATAL JALAN');
    expect(normalizeKeterangan('BAIK')).toBe('BAIK');
    expect(normalizeKeterangan('BANDARA SOETTA')).toBe('BANDARA SOETTA');
    expect(normalizeKeterangan('BA05')).toBe('BA05'); // Only 1-4 are valid BA codes
  });
});

describe('keteranganUtils - parseKeterangan', () => {
  it('parses un-normalized BA raw strings into structured prefix and detail', () => {
    const res = parseKeterangan('ba01 pecah kaca');
    expect(res.prefix).toBe('BA.01');
    expect(res.detail).toBe('pecah kaca');
    expect(res.isFixed).toBe(false);
    expect(res.normalized).toBe('BA.01 pecah kaca');
  });

  it('parses NP1 and NP2 as BA.02 sub-options', () => {
    const res1 = parseKeterangan('np 1');
    expect(res1.prefix).toBe('BA.02');
    expect(res1.detail).toBe('NP1');
    expect(res1.isFixed).toBe(false);
    expect(res1.normalized).toBe('BA.02 NP1');

    const res2 = parseKeterangan('BA.02 NP2');
    expect(res2.prefix).toBe('BA.02');
    expect(res2.detail).toBe('NP2');
    expect(res2.isFixed).toBe(false);
    expect(res2.normalized).toBe('BA.02 NP2');
  });

  it('parses fixed values like OFF, TO EVDAL', () => {
    const res = parseKeterangan('to evdal');
    expect(res.isFixed).toBe(true);
    expect(res.fixedValue).toBe('TO EVDAL');
    expect(res.prefix).toBe(null);
    expect(res.normalized).toBe('TO EVDAL');
  });
});

describe('keteranganUtils - filterBusesForKmCopy', () => {
  it('includes units with kmAkhir1 and empty keterangan', () => {
    const buses = [
      { unit: 'B1', kmAkhir1: '120.5', keterangan: '' },
      { unit: 'B2', kmAkhir1: '130', keterangan: '   ' },
    ];
    const { eligibleBuses, skippedWithNotesCount } = filterBusesForKmCopy(buses);
    expect(eligibleBuses).toHaveLength(2);
    expect(eligibleBuses.map((b) => b.unit)).toEqual(['B1', 'B2']);
    expect(skippedWithNotesCount).toBe(0);
  });

  it('skips units that have keterangan populated (e.g. OFF, BA.01, Mogok)', () => {
    const buses = [
      { unit: 'B1', kmAkhir1: '120', keterangan: '' },
      { unit: 'B2', kmAkhir1: '130', keterangan: 'OFF' },
      { unit: 'B3', kmAkhir1: '140', keterangan: 'BA.02 NP1' },
      { unit: 'B4', kmAkhir1: '150', keterangan: 'Mogok radiator' },
    ];
    const { eligibleBuses, skippedWithNotesCount } = filterBusesForKmCopy(buses);
    expect(eligibleBuses).toHaveLength(1);
    expect(eligibleBuses[0].unit).toBe('B1');
    expect(skippedWithNotesCount).toBe(3);
  });

  it('ignores units without kmAkhir1 even if keterangan is empty or populated', () => {
    const buses = [
      { unit: 'B1', kmAkhir1: '', keterangan: '' },
      { unit: 'B2', kmAkhir1: '  ', keterangan: 'OFF' },
      { unit: 'B3', kmAkhir1: undefined, keterangan: '' },
      { unit: 'B4', kmAkhir1: '100', keterangan: '' },
    ];
    const { eligibleBuses, skippedWithNotesCount } = filterBusesForKmCopy(buses);
    expect(eligibleBuses).toHaveLength(1);
    expect(eligibleBuses[0].unit).toBe('B4');
    expect(skippedWithNotesCount).toBe(0);
  });

  it('correctly matches user field scenario: 23 with kmS1, 10 notes (7 OFF, 3 notes with kmS1), yielding exactly 20 eligible units', () => {
    const buses = [
      // 20 unit normal tanpa keterangan
      ...Array.from({ length: 20 }, (_, i) => ({
        unit: `BUS-${i + 1}`,
        kmAkhir1: '150',
        kmAwal2: '',
        keterangan: '',
      })),
      // 7 unit OFF tanpa kmAkhir1
      ...Array.from({ length: 7 }, (_, i) => ({
        unit: `BUS-OFF-${i + 1}`,
        kmAkhir1: '',
        kmAwal2: '',
        keterangan: 'OFF',
      })),
      // 3 unit punya kmAkhir1 tapi berketerangan (1 sudah ada kmAwal2, 2 masih kosong)
      { unit: 'BUS-NOTE-1', kmAkhir1: '120', kmAwal2: '120', keterangan: 'BA.01 Mogok transmisi' },
      { unit: 'BUS-NOTE-2', kmAkhir1: '130', kmAwal2: '', keterangan: 'BA.02 NP1' },
      { unit: 'BUS-NOTE-3', kmAkhir1: '140', kmAwal2: '', keterangan: 'Servis AC bengkel' },
    ];

    const { eligibleBuses, skippedWithNotesCount } = filterBusesForKmCopy(buses);
    // Tepat 20 unit yang eligible disalin
    expect(eligibleBuses).toHaveLength(20);
    // Tepat 3 unit dengan kmS1 yang dilewati karena berketerangan
    expect(skippedWithNotesCount).toBe(3);

    // Dari 20 unit eligible, semuanya masih kosong KM Awal S2-nya
    const emptyKmAwal2Count = eligibleBuses.filter((b) => !b.kmAwal2 || String(b.kmAwal2).trim() === '').length;
    expect(emptyKmAwal2Count).toBe(20);
  });
});

describe('keteranganUtils - multi-shift combine and split', () => {
  describe('combineShiftKeterangan', () => {
    it('returns empty string if both shifts are empty or SGO', () => {
      expect(combineShiftKeterangan('', '')).toBe('');
      expect(combineShiftKeterangan(null, undefined)).toBe('');
      expect(combineShiftKeterangan('SGO', 'SGO')).toBe('');
      expect(combineShiftKeterangan('sgo', '')).toBe('');
    });

    it('returns single note if both shifts have identical notes', () => {
      expect(combineShiftKeterangan('OFF', 'OFF')).toBe('OFF');
      expect(combineShiftKeterangan('ba 02 np 1', 'BA.02 NP1')).toBe('BA.02 NP1');
    });

    it('returns single note if only one shift has a note', () => {
      expect(combineShiftKeterangan('', 'BA.02 NP1')).toBe('BA.02 NP1');
      expect(combineShiftKeterangan('SGO', 'OFF')).toBe('OFF');
      expect(combineShiftKeterangan('BA.01 Radiator', '')).toBe('BA.01 Radiator');
      expect(combineShiftKeterangan('TO EVDAL', 'SGO')).toBe('TO EVDAL');
    });

    it('combines differing notes using pipe separator with normalization', () => {
      expect(combineShiftKeterangan('ba01 bocor', 'to evdal')).toBe('BA.01 bocor | TO EVDAL');
      expect(combineShiftKeterangan('OFF', 'ba 02 np 1')).toBe('OFF | BA.02 NP1');
    });
  });

  describe('splitShiftKeterangan', () => {
    it('splits combined string by pipe separator', () => {
      const res = splitShiftKeterangan('BA.01 bocor | TO EVDAL');
      expect(res.s1).toBe('BA.01 bocor');
      expect(res.s2).toBe('TO EVDAL');
    });

    it('returns identical value for both shifts if no pipe separator', () => {
      const res = splitShiftKeterangan('OFF');
      expect(res.s1).toBe('OFF');
      expect(res.s2).toBe('OFF');
    });

    it('returns empty for both shifts if string is empty', () => {
      const res = splitShiftKeterangan('');
      expect(res.s1).toBe('');
      expect(res.s2).toBe('');
    });
  });
});

