import { describe, it, expect } from 'vitest';
import { resolveSyncTargetDate } from '../../../supabase/functions/_shared/syncDate.ts';

describe('resolveSyncTargetDate (webhook sheet-sync)', () => {
  const todayWib = '2026-11-08';

  it('tanggal eksplisit (dari aplikasi / Cek ulang) selalu diutamakan', () => {
    expect(resolveSyncTargetDate({ date: '2026-11-05', tabName: '7', sheetYear: 2026, sheetMonth: 11, todayWib })).toBe('2026-11-05');
  });

  it('edit tab tanggal lama memakai nama tab, bukan tanggal hari ini (kasus JAK.115 tab 7 pada 8 Nov)', () => {
    expect(resolveSyncTargetDate({ tabName: '7', sheetYear: 2026, sheetMonth: 11, todayWib })).toBe('2026-11-07');
  });

  it('tahun/bulan diambil dari file sheet: edit file Oktober di awal November tetap ke Oktober', () => {
    expect(resolveSyncTargetDate({ tabName: '31', sheetYear: 2026, sheetMonth: 10, todayWib })).toBe('2026-10-31');
    expect(resolveSyncTargetDate({ tabName: '31', sheetYear: 2026, sheetMonth: 12, todayWib: '2027-01-01' })).toBe('2026-12-31');
  });

  it('tanpa info file sheet memakai bulan berjalan (WIB)', () => {
    expect(resolveSyncTargetDate({ tabName: '3', todayWib })).toBe('2026-11-03');
    expect(resolveSyncTargetDate({ tabName: ' 07 ', sheetYear: null, sheetMonth: null, todayWib })).toBe('2026-11-07');
  });

  it('tab tidak valid atau tanggal tidak ada di bulan itu → hari ini (perilaku lama)', () => {
    expect(resolveSyncTargetDate({ tabName: 'Rekap', sheetYear: 2026, sheetMonth: 11, todayWib })).toBe(todayWib);
    expect(resolveSyncTargetDate({ tabName: '31', sheetYear: 2026, sheetMonth: 11, todayWib })).toBe(todayWib);
    expect(resolveSyncTargetDate({ tabName: '0', todayWib })).toBe(todayWib);
    expect(resolveSyncTargetDate({ tabName: '30', sheetYear: 2026, sheetMonth: 2, todayWib })).toBe(todayWib);
    expect(resolveSyncTargetDate({ todayWib })).toBe(todayWib);
  });

  it('tanggal eksplisit yang formatnya salah diabaikan', () => {
    expect(resolveSyncTargetDate({ date: '7/11/2026', tabName: '7', sheetYear: 2026, sheetMonth: 11, todayWib })).toBe('2026-11-07');
  });
});
