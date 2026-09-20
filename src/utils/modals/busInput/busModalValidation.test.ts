import { describe, it, expect } from 'vitest';
import { validateKmPair, validateKmCrossShift, validateKmCrossDay, detectSmartRollover } from './busModalValidation';

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

describe('busModalValidation - validateKmCrossDay', () => {
  it('allows KM Awal when equal or greater than previous day', () => {
    // Normal progress (+13 KM)
    expect(validateKmCrossDay('293003', '292990', 'Shift 1', 'Kemarin')).toBeNull();
    // Identik (bus menginap di halte)
    expect(validateKmCrossDay('292990', '292990', 'Shift 1', 'Kemarin')).toBeNull();
  });

  it('bypasses cross-day validation if either value is empty or draft prefill (<= 3 digits)', () => {
    expect(validateKmCrossDay('292', '292990', 'Shift 1', 'Kemarin')).toBeNull();
    expect(validateKmCrossDay('', '292990', 'Shift 1', 'Kemarin')).toBeNull();
    expect(validateKmCrossDay('293003', '', 'Shift 1', 'Kemarin')).toBeNull();
    expect(validateKmCrossDay('293003', undefined, 'Shift 1', 'Kemarin')).toBeNull();
  });

  it('bypasses cross-day validation when bypassReset is true (speedometer replaced/reset)', () => {
    expect(validateKmCrossDay('001200', '292990', 'Shift 1', 'Kemarin', true)).toBeNull();
  });

  it('returns error when kmAwal is smaller than previous day (accidental backwards odometer)', () => {
    // Kasus riil user: kemarin 292990, terinput 292003 (-987 KM)
    const err = validateKmCrossDay('292003', '292990', 'Shift 1', 'Kemarin');
    expect(err).toContain('tidak boleh lebih kecil dari Kemarin');
    expect(err).toContain('292003');
    expect(err).toContain('292990');
    expect(err).toContain('987');
  });
});

describe('busModalValidation - detectSmartRollover', () => {
  it('detects rollover from 292990 to 293003 (+13 KM) when user typed 292003', () => {
    const result = detectSmartRollover('292003', '292990');
    expect(result).toEqual({
      suggestedKm: '293003',
      diff: 13,
    });
  });

  it('detects rollover from 145980 to 146025 (+45 KM) when user typed 145025', () => {
    const result = detectSmartRollover('145025', '145980');
    expect(result).toEqual({
      suggestedKm: '146025',
      diff: 45,
    });
  });

  it('returns null when kmAwal is already forward (no backward discrepancy)', () => {
    expect(detectSmartRollover('293003', '292990')).toBeNull();
    expect(detectSmartRollover('292990', '292990')).toBeNull();
  });

  it('returns null when forward diff after rollover exceeds 100 KM (random typo, not rollover)', () => {
    // Kemarin 292100, user ketik 290100 -> next prefix 291 -> 291100 < 292100 -> null
    expect(detectSmartRollover('290100', '292100')).toBeNull();
  });

  it('returns null when input is too short or empty', () => {
    expect(detectSmartRollover('292', '292990')).toBeNull();
    expect(detectSmartRollover('', '292990')).toBeNull();
  });
});
