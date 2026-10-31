import { describe, it, expect } from 'vitest';
import {
  normalizeKeterangan,
  extractKeteranganTokens,
  formatKeteranganTokens,
  parseKeterangan,
  filterBusesForKmCopy,
  combineShiftKeterangan,
  splitShiftKeterangan,
  hasMeaningfulNote,
  getCurrentOperationalShift,
  getDefaultModalTab,
  toSmartTitleCase,
  isUnitOff,
  isUnitTo,
  isUnitOffOrToEvdal,
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

  it('normalizes BA.02 with NP1 and NP2 options, and keeps standalone NP1/NP2 separate from BA.02', () => {
    expect(normalizeKeterangan('BA02 NP1')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('ba 2 np 1')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('BA.02 np-2')).toBe('BA.02 NP2');
    expect(normalizeKeterangan('np 1')).toBe('NP1');
    expect(normalizeKeterangan('NP-1')).toBe('NP1');
    expect(normalizeKeterangan('NP1')).toBe('NP1');
    expect(normalizeKeterangan('np 2')).toBe('NP2');
    expect(normalizeKeterangan('NP.2')).toBe('NP2');
  });

  it('normalizes BA codes with follow-up details', () => {
    expect(normalizeKeterangan('BA01 Rusak transmisi')).toBe('BA.01 Rusak Transmisi');
    expect(normalizeKeterangan('ba 2 ban pecah')).toBe('BA.02 Ban Pecah');
    expect(normalizeKeterangan('BA-03: mogok pul')).toBe('BA.03 Mogok Pul');
    expect(normalizeKeterangan('ba04 - overhaul mesin')).toBe('BA.04 Overhaul Mesin');
    expect(normalizeKeterangan('BA.01 Supir Sakit')).toBe('BA.01 Supir Sakit');
  });

  it('normalizes fixed status presets (OFF, TO EVDAL, OKB, Renop)', () => {
    expect(normalizeKeterangan('off')).toBe('OFF');
    expect(normalizeKeterangan('OFF')).toBe('OFF');
    expect(normalizeKeterangan('to evdal')).toBe('TO EVDAL');
    expect(normalizeKeterangan('TO-EVDAL')).toBe('TO EVDAL');
    expect(normalizeKeterangan('okb')).toBe('OKB');
    expect(normalizeKeterangan('OKB')).toBe('OKB');
    expect(normalizeKeterangan('renop')).toBe('Renop');
    expect(normalizeKeterangan('RENOP')).toBe('Renop');
  });

  it('strips standalone SGO or SGO in pipe-separated notes', () => {
    expect(normalizeKeterangan('SGO')).toBe('');
    expect(normalizeKeterangan('sgo')).toBe('');
    expect(normalizeKeterangan('BA.02 NP1 | SGO')).toBe('BA.02 NP1');
    expect(normalizeKeterangan('SGO | BA.02 NP2')).toBe('BA.02 NP2');
    expect(normalizeKeterangan('SGO | SGO')).toBe('');
    expect(normalizeKeterangan('OFF | SGO')).toBe('OFF');
    expect(normalizeKeterangan('SGO | OFF')).toBe('OFF');
  });

  it('formats non-BA free text notes with Title Case', () => {
    expect(normalizeKeterangan('Servis AC berkala')).toBe('Servis AC Berkala');
    expect(normalizeKeterangan('Baterai lemah')).toBe('Baterai Lemah');
    expect(normalizeKeterangan('')).toBe('');
    expect(normalizeKeterangan(null)).toBe('');
    expect(normalizeKeterangan(undefined)).toBe('');
  });

  it('does not incorrectly match non-BA words starting with BA (e.g. BATAL, BAIK, BANDARA)', () => {
    expect(normalizeKeterangan('BATAL JALAN')).toBe('Batal Jalan');
    expect(normalizeKeterangan('BAIK')).toBe('Baik');
    expect(normalizeKeterangan('BANDARA SOETTA')).toBe('Bandara Soetta');
    expect(normalizeKeterangan('BA05')).toBe('BA05'); // Only 1-4 are valid BA codes
  });
});

describe('keteranganUtils - parseKeterangan', () => {
  it('parses un-normalized BA raw strings into structured prefix and detail', () => {
    const res = parseKeterangan('ba01 pecah kaca');
    expect(res.prefix).toBe('BA.01');
    expect(res.detail).toBe('Pecah Kaca');
    expect(res.isFixed).toBe(false);
    expect(res.normalized).toBe('BA.01 Pecah Kaca');
  });

  it('parses NP1 and NP2 as standalone notes, or as BA details when specified', () => {
    const res1 = parseKeterangan('np 1');
    expect(res1.prefix).toBeNull();
    expect(res1.detail).toBe('NP1');
    expect(res1.isFixed).toBe(false);
    expect(res1.normalized).toBe('NP1');

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

    it('returns single note if both shifts have identical notes and status is OFF or TO EVDAL', () => {
      expect(combineShiftKeterangan('OFF', 'OFF')).toBe('OFF');
      expect(combineShiftKeterangan('TO EVDAL', 'TO EVDAL')).toBe('TO EVDAL');
      expect(combineShiftKeterangan('ba 02 np 1', 'BA.02 NP1')).toBe('S1: BA.02 NP1 | S2: BA.02 NP1');
    });

    it('returns note with S1: prefix when only shift 1 has note, and S2: when only shift 2 has note', () => {
      expect(combineShiftKeterangan('', 'BA.02 NP1')).toBe('S2: BA.02 NP1');
      expect(combineShiftKeterangan('SGO', 'OFF')).toBe('S2: OFF');
      expect(combineShiftKeterangan('BA.01 Radiator', '')).toBe('S1: BA.01 Radiator');
      expect(combineShiftKeterangan('TO EVDAL', 'SGO')).toBe('S1: TO EVDAL');
    });

    it('combines differing notes using pipe separator with S1: and S2: prefix', () => {
      expect(combineShiftKeterangan('ba01 bocor', 'to evdal')).toBe('S1: BA.01 Bocor | S2: TO EVDAL');
      expect(combineShiftKeterangan('OFF', 'ba 02 np 1')).toBe('S1: OFF | S2: BA.02 NP1');
    });
  });

  describe('splitShiftKeterangan', () => {
    it('splits combined string with S1: and S2: prefixes', () => {
      const res = splitShiftKeterangan('S1: BA.01 bocor | S2: TO EVDAL');
      expect(res.s1).toBe('BA.01 Bocor');
      expect(res.s2).toBe('TO EVDAL');

      // Dukungan urutan terbalik
      const resRev = splitShiftKeterangan('S2: TO EVDAL | S1: BA.01 bocor');
      expect(resRev.s1).toBe('BA.01 Bocor');
      expect(resRev.s2).toBe('TO EVDAL');
    });

    it('splits combined string without S1/S2 prefixes (legacy pipe separator)', () => {
      const res = splitShiftKeterangan('BA.01 bocor | TO EVDAL');
      expect(res.s1).toBe('BA.01 Bocor');
      expect(res.s2).toBe('TO EVDAL');
    });

    it('correctly parses single string with S1: or S2: prefix', () => {
      const res1 = splitShiftKeterangan('S1: BA.01 Radiator bocor');
      expect(res1.s1).toBe('BA.01 Radiator Bocor');
      expect(res1.s2).toBe('');

      const res2 = splitShiftKeterangan('S2: BA.02 NP2');
      expect(res2.s1).toBe('');
      expect(res2.s2).toBe('BA.02 NP2');
    });

    it('correctly parses SGO in pipe separated string', () => {
      const res1 = splitShiftKeterangan('SGO | TO EVDAL');
      expect(res1.s1).toBe('');
      expect(res1.s2).toBe('TO EVDAL');

      const res2 = splitShiftKeterangan('OFF | SGO');
      expect(res2.s1).toBe('OFF');
      expect(res2.s2).toBe('');
    });

    it('returns identical value for both shifts if no pipe separator and no shift prefix', () => {
      const res = splitShiftKeterangan('OFF');
      expect(res.s1).toBe('OFF');
      expect(res.s2).toBe('OFF');
    });

    it('routes NP1 note to Shift 1 only and NP2 note to Shift 2 only when single', () => {
      const res1 = splitShiftKeterangan('BA.02 NP1');
      expect(res1.s1).toBe('BA.02 NP1');
      expect(res1.s2).toBe('');

      const res2 = splitShiftKeterangan('BA.02 NP2');
      expect(res2.s1).toBe('');
      expect(res2.s2).toBe('BA.02 NP2');
    });

    it('returns empty for both shifts if string is empty', () => {
      const res = splitShiftKeterangan('');
      expect(res.s1).toBe('');
      expect(res.s2).toBe('');
    });
  });

  describe('operational shift and default tab based on hour', () => {
    it('returns shift 1 before 14:00', () => {
      const morning = new Date('2026-10-27T08:30:00');
      expect(getCurrentOperationalShift(morning)).toBe(1);
      expect(getDefaultModalTab(morning)).toBe('shift1');

      const beforeCutoff = new Date('2026-10-27T13:59:59');
      expect(getCurrentOperationalShift(beforeCutoff)).toBe(1);
      expect(getDefaultModalTab(beforeCutoff)).toBe('shift1');
    });

    it('returns shift 2 starting at 14:00 and onwards', () => {
      const cutoff = new Date('2026-10-27T14:00:00');
      expect(getCurrentOperationalShift(cutoff)).toBe(2);
      expect(getDefaultModalTab(cutoff)).toBe('shift2');

      const evening = new Date('2026-10-27T20:15:00');
      expect(getCurrentOperationalShift(evening)).toBe(2);
      expect(getDefaultModalTab(evening)).toBe('shift2');
    });

    it('honors overrideShift when provided to getDefaultModalTab', () => {
      const morning = new Date('2026-10-27T09:00:00');
      expect(getDefaultModalTab(morning, 2)).toBe('shift2');

      const afternoon = new Date('2026-10-27T15:00:00');
      expect(getDefaultModalTab(afternoon, 1)).toBe('shift1');
    });
  });

  describe('hasMeaningfulNote', () => {
    it('returns false for empty, null, or undefined strings', () => {
      expect(hasMeaningfulNote(null)).toBe(false);
      expect(hasMeaningfulNote(undefined)).toBe(false);
      expect(hasMeaningfulNote('')).toBe(false);
      expect(hasMeaningfulNote('   ')).toBe(false);
    });

    it('returns false for pure status notes (OFF, TO, TO EVDAL, SO, SGO)', () => {
      expect(hasMeaningfulNote('OFF')).toBe(false);
      expect(hasMeaningfulNote('off')).toBe(false);
      expect(hasMeaningfulNote('TO')).toBe(false);
      expect(hasMeaningfulNote('T.O')).toBe(false);
      expect(hasMeaningfulNote('TO EVDAL')).toBe(false);
      expect(hasMeaningfulNote('to evdal')).toBe(false);
      expect(hasMeaningfulNote('SO')).toBe(false);
      expect(hasMeaningfulNote('SGO')).toBe(false);
      expect(hasMeaningfulNote('OFF | OFF')).toBe(false);
      expect(hasMeaningfulNote('SGO | OFF')).toBe(false);
      expect(hasMeaningfulNote('TO | OFF')).toBe(false);
    });

    it('returns true for notes with actual operational details or BA codes', () => {
      expect(hasMeaningfulNote('BA.02 NP1')).toBe(true);
      expect(hasMeaningfulNote('BA.01 Rusak transmisi')).toBe(true);
      expect(hasMeaningfulNote('OFF - Rusak AC')).toBe(true);
      expect(hasMeaningfulNote('Mogok radiator')).toBe(true);
      expect(hasMeaningfulNote('OFF | Rusak Ban')).toBe(true);
      expect(hasMeaningfulNote('BA.01')).toBe(true);
      expect(hasMeaningfulNote('Cadangan')).toBe(true);
      expect(hasMeaningfulNote('OKB')).toBe(true);
      expect(hasMeaningfulNote('Renop')).toBe(true);
    });
  });

  describe('toSmartTitleCase', () => {
    it('capitalizes the first letter of each word for manual user notes', () => {
      expect(toSmartTitleCase('ban bocor di tol rawamangun')).toBe('Ban Bocor Di Tol Rawamangun');
      expect(toSmartTitleCase('pramudi sakit tiba tiba')).toBe('Pramudi Sakit Tiba Tiba');
      expect(toSmartTitleCase('oli rem bocor')).toBe('Oli Rem Bocor');
    });

    it('converts ALL CAPS sentences into Title Case while preserving known acronyms', () => {
      expect(toSmartTitleCase('BAN BOCOR DI TOL')).toBe('Ban Bocor Di Tol');
      expect(toSmartTitleCase('MOGOK RADIATOR PANAS')).toBe('Mogok Radiator Panas');
    });

    it('preserves operational fleet acronyms in all caps (Opsi B)', () => {
      expect(toSmartTitleCase('ac kurang dingin')).toBe('AC Kurang Dingin');
      expect(toSmartTitleCase('AC mati total')).toBe('AC Mati Total');
      expect(toSmartTitleCase('cctv mati dan spbu tutup')).toBe('CCTV Mati Dan SPBU Tutup');
      expect(toSmartTitleCase('pramudi belum sim')).toBe('Pramudi Belum SIM');
      expect(toSmartTitleCase('kso arimbi')).toBe('KSO Arimbi');
      expect(toSmartTitleCase('ganti unit tj-0123')).toBe('Ganti Unit TJ-0123');
      expect(toSmartTitleCase('okb')).toBe('OKB');
      expect(toSmartTitleCase('renop')).toBe('Renop');
    });
  });

  describe('parseKeterangan - OKB and Renop presets', () => {
    it('parses OKB as fixed preset', () => {
      const res = parseKeterangan('okb');
      expect(res.isFixed).toBe(true);
      expect(res.fixedValue).toBe('OKB');
      expect(res.normalized).toBe('OKB');
    });

    it('parses Renop as fixed preset', () => {
      const res = parseKeterangan('renop');
      expect(res.isFixed).toBe(true);
      expect(res.fixedValue).toBe('Renop');
      expect(res.normalized).toBe('Renop');
    });
  });

  describe('isUnitOff', () => {
    it('identifies pure OFF status in various casings and spaces', () => {
      expect(isUnitOff('OFF')).toBe(true);
      expect(isUnitOff('off')).toBe(true);
      expect(isUnitOff('Off')).toBe(true);
      expect(isUnitOff('  OFF  ')).toBe(true);
    });

    it('identifies OFF with shift prefixes and notes', () => {
      expect(isUnitOff('S1: OFF')).toBe(true);
      expect(isUnitOff('S2: OFF')).toBe(true);
      expect(isUnitOff('OFF - BAN PECAH')).toBe(true);
      expect(isUnitOff('OFF (SPARE)')).toBe(true);
      expect(isUnitOff('S1: OFF | S2: SGO')).toBe(true);
    });

    it('rejects non-OFF status or incidental substrings', () => {
      expect(isUnitOff('OFFICER TRANSJAKARTA')).toBe(false);
      expect(isUnitOff('TO EVDAL')).toBe(false);
      expect(isUnitOff('T.O')).toBe(false);
      expect(isUnitOff('BA.02 KENDALA MESIN (TEMPERATUR RADIATOR MENYALA)')).toBe(false);
      expect(isUnitOff('SGO')).toBe(false);
      expect(isUnitOff('')).toBe(false);
      expect(isUnitOff(null)).toBe(false);
    });
  });

  describe('isUnitTo', () => {
    it('identifies exact TO and T.O variations as specified', () => {
      expect(isUnitTo('TO')).toBe(true);
      expect(isUnitTo('T.O')).toBe(true);
      expect(isUnitTo('T.O.')).toBe(true);
      expect(isUnitTo('to')).toBe(true);
      expect(isUnitTo('t.o')).toBe(true);
      expect(isUnitTo('TO EVDAL')).toBe(true);
      expect(isUnitTo('T.O EVDAL')).toBe(true);
      expect(isUnitTo('TO-EVDAL')).toBe(true);
      expect(isUnitTo('T.O. EVDAL')).toBe(true);
      expect(isUnitTo('S1: TO')).toBe(true);
      expect(isUnitTo('S2: T.O')).toBe(true);
      expect(isUnitTo('S1: TO EVDAL')).toBe(true);
      expect(isUnitTo('TO (SANKSI)')).toBe(true);
      expect(isUnitTo('T.O - CADANGAN')).toBe(true);
      expect(isUnitTo('BA.02 - TO')).toBe(true);
      expect(isUnitTo('BA.02 - T.O')).toBe(true);
      expect(isUnitTo('S1: T.O | S2: SGO')).toBe(true);
    });

    it('strictly rejects non-TO descriptions and words containing TO substrings (RADIATOR, TEMPERATUR, MOTOR, TOA, etc.)', () => {
      expect(isUnitTo('BA.02 KENDALA MESIN (TEMPERATUR RADIATOR MENYALA)')).toBe(false);
      expect(isUnitTo('KENDALA MESIN (TEMPERATUR RADIATOR MENYALA)')).toBe(false);
      expect(isUnitTo('RADIATOR')).toBe(false);
      expect(isUnitTo('TEMPERATUR')).toBe(false);
      expect(isUnitTo('MOTOR')).toBe(false);
      expect(isUnitTo('TOKO')).toBe(false);
      expect(isUnitTo('OTOMATIS')).toBe(false);
      expect(isUnitTo('FOTO')).toBe(false);
      expect(isUnitTo('TOA')).toBe(false);
      expect(isUnitTo('T.O.A')).toBe(false);
      expect(isUnitTo('T.O.A.')).toBe(false);
      expect(isUnitTo('BA.01 Ban Bocor')).toBe(false);
      expect(isUnitTo('BA.02 NP1')).toBe(false);
      expect(isUnitTo('OKB')).toBe(false);
      expect(isUnitTo('Renop')).toBe(false);
      expect(isUnitTo('OFF')).toBe(false);
      expect(isUnitTo('SGO')).toBe(false);
      expect(isUnitTo('')).toBe(false);
      expect(isUnitTo(null)).toBe(false);
    });
  });

  describe('isUnitOffOrToEvdal', () => {
    it('returns true for pure OFF status in various casings and spaces', () => {
      expect(isUnitOffOrToEvdal('OFF')).toBe(true);
      expect(isUnitOffOrToEvdal('off')).toBe(true);
      expect(isUnitOffOrToEvdal('Off')).toBe(true);
      expect(isUnitOffOrToEvdal('  OFF  ')).toBe(true);
    });

    it('returns true for OFF with shift prefixes', () => {
      expect(isUnitOffOrToEvdal('S1: OFF')).toBe(true);
      expect(isUnitOffOrToEvdal('S2: OFF')).toBe(true);
      expect(isUnitOffOrToEvdal('s1: off')).toBe(true);
      expect(isUnitOffOrToEvdal('s2: off')).toBe(true);
      expect(isUnitOffOrToEvdal('S1: OFF | S2: OFF')).toBe(true);
    });

    it('returns true for OFF with note descriptions or parentheses', () => {
      expect(isUnitOffOrToEvdal('OFF - BAN PECAH')).toBe(true);
      expect(isUnitOffOrToEvdal('OFF (SPARE)')).toBe(true);
      expect(isUnitOffOrToEvdal('OFF - RUSAK RADIATOR')).toBe(true);
    });

    it('returns true for TO EVDAL in various formats and casings', () => {
      expect(isUnitOffOrToEvdal('TO EVDAL')).toBe(true);
      expect(isUnitOffOrToEvdal('to evdal')).toBe(true);
      expect(isUnitOffOrToEvdal('To Evdal')).toBe(true);
      expect(isUnitOffOrToEvdal('TO-EVDAL')).toBe(true);
      expect(isUnitOffOrToEvdal('T.O EVDAL')).toBe(true);
      expect(isUnitOffOrToEvdal('T.O. EVDAL')).toBe(true);
      expect(isUnitOffOrToEvdal('TO EVDAL (SANKSI)')).toBe(true);
    });

    it('returns true for TO EVDAL with shift prefixes', () => {
      expect(isUnitOffOrToEvdal('S1: TO EVDAL')).toBe(true);
      expect(isUnitOffOrToEvdal('S2: TO EVDAL')).toBe(true);
      expect(isUnitOffOrToEvdal('s1: to evdal')).toBe(true);
      expect(isUnitOffOrToEvdal('S1: TO EVDAL | S2: TO EVDAL')).toBe(true);
    });

    it('returns true for standalone TO / T.O (pure non-operational)', () => {
      expect(isUnitOffOrToEvdal('TO')).toBe(true);
      expect(isUnitOffOrToEvdal('T.O')).toBe(true);
      expect(isUnitOffOrToEvdal('to')).toBe(true);
      expect(isUnitOffOrToEvdal('t.o')).toBe(true);
      expect(isUnitOffOrToEvdal('S1: TO')).toBe(true);
      expect(isUnitOffOrToEvdal('S2: T.O')).toBe(true);
      expect(isUnitOffOrToEvdal('TO (SANKSI)')).toBe(true);
    });

    it('returns true if any shift contains OFF or TO EVDAL in multi-shift combination', () => {
      expect(isUnitOffOrToEvdal('S1: BA.01 Bocor | S2: OFF')).toBe(true);
      expect(isUnitOffOrToEvdal('S1: OFF | S2: BA.01 Bocor')).toBe(true);
      expect(isUnitOffOrToEvdal('S1: BA.01 Bocor | S2: TO EVDAL')).toBe(true);
      expect(isUnitOffOrToEvdal('S1: TO EVDAL | S2: BA.02 NP2')).toBe(true);
    });

    it('returns false for operating units (SGO, BA notes, OKB, Renop, empty)', () => {
      expect(isUnitOffOrToEvdal('BA.01 Ban Bocor')).toBe(false);
      expect(isUnitOffOrToEvdal('BA.02 NP1')).toBe(false);
      expect(isUnitOffOrToEvdal('BA.02 NP2')).toBe(false);
      expect(isUnitOffOrToEvdal('OKB')).toBe(false);
      expect(isUnitOffOrToEvdal('Renop')).toBe(false);
      expect(isUnitOffOrToEvdal('SGO')).toBe(false);
      expect(isUnitOffOrToEvdal('Pramudi Meriang')).toBe(false);
      expect(isUnitOffOrToEvdal('S1: BA.01 Bocor | S2: BA.02 NP2')).toBe(false);
      expect(isUnitOffOrToEvdal('')).toBe(false);
      expect(isUnitOffOrToEvdal('   ')).toBe(false);
      expect(isUnitOffOrToEvdal(null)).toBe(false);
      expect(isUnitOffOrToEvdal(undefined)).toBe(false);
    });

    it('does not falsely trigger on words containing off or to as substrings', () => {
      expect(isUnitOffOrToEvdal('OFFICER TRANSJAKARTA')).toBe(false);
      expect(isUnitOffOrToEvdal('TOKO SPAREPART')).toBe(false);
      expect(isUnitOffOrToEvdal('FOTO KERUSAKAN')).toBe(false);
    });
  });
  describe('extractKeteranganTokens & formatKeteranganTokens (Multi-Select Presets)', () => {
    it('extracts single tokens accurately', () => {
      expect(extractKeteranganTokens('OKB')).toEqual({
        isOkb: true,
        isRenop: false,
        baCode: null,
        isOff: false,
        isToEvdal: false,
        detail: '',
      });
      expect(extractKeteranganTokens('Renop')).toEqual({
        isOkb: false,
        isRenop: true,
        baCode: null,
        isOff: false,
        isToEvdal: false,
        detail: '',
      });
      expect(extractKeteranganTokens('OFF')).toEqual({
        isOkb: false,
        isRenop: false,
        baCode: null,
        isOff: true,
        isToEvdal: false,
        detail: '',
      });
      expect(extractKeteranganTokens('TO EVDAL')).toEqual({
        isOkb: false,
        isRenop: false,
        baCode: null,
        isOff: false,
        isToEvdal: true,
        detail: '',
      });
      expect(extractKeteranganTokens('BA.02 NP1')).toEqual({
        isOkb: false,
        isRenop: false,
        baCode: '02',
        isOff: false,
        isToEvdal: false,
        detail: 'NP1',
      });
    });

    it('extracts multi-tokens combinations (e.g. OKB + BA.02 NP1, OKB + Pramudi Sakit)', () => {
      const case1 = extractKeteranganTokens('OKB - Pramudi Sakit');
      expect(case1.isOkb).toBe(true);
      expect(case1.detail).toBe('Pramudi Sakit');

      const case2 = extractKeteranganTokens('OKB - BA.02 NP1');
      expect(case2.isOkb).toBe(true);
      expect(case2.baCode).toBe('02');
      expect(case2.detail).toBe('NP1');

      const case3 = extractKeteranganTokens('OKB - OFF');
      expect(case3.isOkb).toBe(true);
      expect(case3.isOff).toBe(true);
      expect(case3.detail).toBe('');

      const case4 = extractKeteranganTokens('Renop - BA.01 Pintu Rusak');
      expect(case4.isRenop).toBe(true);
      expect(case4.baCode).toBe('01');
      expect(case4.detail).toBe('Pintu Rusak');
    });

    it('formats tokens into canonical string with proper ordering', () => {
      expect(
        formatKeteranganTokens({
          isOkb: true,
          isRenop: false,
          baCode: null,
          isOff: false,
          isToEvdal: false,
          detail: 'Pramudi Sakit',
        })
      ).toBe('OKB - Pramudi Sakit');

      expect(
        formatKeteranganTokens({
          isOkb: true,
          isRenop: false,
          baCode: '02',
          isOff: false,
          isToEvdal: false,
          detail: 'NP1',
        })
      ).toBe('OKB - BA.02 NP1');

      expect(
        formatKeteranganTokens({
          isOkb: true,
          isRenop: false,
          baCode: null,
          isOff: true,
          isToEvdal: false,
          detail: '',
        })
      ).toBe('OKB - OFF');

      expect(
        formatKeteranganTokens({
          isOkb: false,
          isRenop: true,
          baCode: '01',
          isOff: false,
          isToEvdal: false,
          detail: 'Pintu Rusak',
        })
      ).toBe('Renop - BA.01 Pintu Rusak');

      expect(
        formatKeteranganTokens({
          isOkb: false,
          isRenop: false,
          baCode: null,
          isOff: false,
          isToEvdal: false,
          detail: '',
        })
      ).toBe('');
    });
  });
});
