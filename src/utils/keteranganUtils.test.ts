import { describe, it, expect } from 'vitest';
import { normalizeKeterangan, parseKeterangan } from './keteranganUtils';

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
