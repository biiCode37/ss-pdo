import { describe, it, expect } from 'vitest';
import { validateKmPair, validateKmCrossShift } from './busModalValidation';

describe('busModalValidation - validateKmPair', () => {
  it('bypasses validation if either kmAwal or kmAkhir is empty (morning input)', () => {
    expect(validateKmPair('300100', '', 'Shift 1')).toBeNull();
    expect(validateKmPair('', '300100', 'Shift 1')).toBeNull();
    expect(validateKmPair('', '', 'Shift 1')).toBeNull();
  });

  it('bypasses validation if either value is only 3 digits (draft prefill guard)', () => {
    // Kasus utama: KM Awal sudah diisi 300100, tapi KM Akhir masih draft 300
    expect(validateKmPair('300100', '300', 'Shift 1')).toBeNull();
    expect(validateKmPair('300', '300100', 'Shift 1')).toBeNull();
    expect(validateKmPair('300', '300', 'Shift 1')).toBeNull();
  });

  it('returns error when kmAkhir is smaller than kmAwal and both are full numbers (>3 digits)', () => {
    const err = validateKmPair('300100', '300050', 'Shift 1');
    expect(err).toContain('tidak boleh lebih kecil');
    expect(err).toContain('300050');
    expect(err).toContain('300100');
  });

  it('allows diff of 0 KM (standby / zero distance)', () => {
    expect(validateKmPair('300100', '300100', 'Shift 1')).toBeNull();
  });

  it('validates normal distance and rollover correctly', () => {
    // Normal 80 KM
    expect(validateKmPair('300100', '300180', 'Shift 1')).toBeNull();
    // Rollover kepala angka: 299980 -> 300100 (120 KM)
    expect(validateKmPair('299980', '300100', 'Shift 1')).toBeNull();
  });

  it('returns error when distance exceeds 400 KM', () => {
    const err = validateKmPair('300000', '300500', 'Shift 1');
    expect(err).toContain('melebihi batas maksimal wajar');
  });
});

describe('busModalValidation - validateKmCrossShift', () => {
  it('allows S2 when S1 is completely empty (Skenario B: dinas siang saja)', () => {
    expect(validateKmCrossShift('', '', '300100', '300200')).toBeNull();
    expect(validateKmCrossShift(undefined, undefined, '300100', '')).toBeNull();
  });

  it('allows S2 when S1 is properly closed (>3 digits)', () => {
    expect(validateKmCrossShift('300100', '300180', '300180', '300260')).toBeNull();
  });

  it('blocks S2 if S1 was started but not closed', () => {
    // S1 baru isi KM Awal 300100, KM Akhir masih kosong
    const err1 = validateKmCrossShift('300100', '', '300180', '');
    expect(err1).toContain('KM Akhir Shift 1 wajib diisi sebelum mengisi data Shift 2');

    // S1 baru isi KM Awal 300100, KM Akhir masih draft prefill 300
    const err2 = validateKmCrossShift('300100', '300', '300180', '');
    expect(err2).toContain('KM Akhir Shift 1 wajib diisi sebelum mengisi data Shift 2');
  });
});
