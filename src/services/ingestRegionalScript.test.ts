import { describe, it, expect } from 'vitest';
import { parseIndonesianNumber } from '../utils/numberUtils';

describe('Regional Ingestion Logic & Domain Rules', () => {
  it('correctly parses Indonesian decimal and thousands numbers', () => {
    expect(parseIndonesianNumber('16,904')).toBe(16.904);
    expect(parseIndonesianNumber('207,221')).toBe(207.221);
    expect(parseIndonesianNumber('1.234,56')).toBe(1234.56);
    expect(parseIndonesianNumber('-')).toBe(0);
    expect(parseIndonesianNumber('')).toBe(0);
    expect(parseIndonesianNumber(null)).toBe(0);
  });

  it('calculates total ritase (PP) according to domain rule: 1 Ritase = 2 Trip', () => {
    // Kasus 1: Menggunakan km_baku
    const totalKm = 2088;
    const kmBaku = 14.42;
    const totalRitaseWithKmBaku = Number((totalKm / kmBaku).toFixed(1));
    expect(totalRitaseWithKmBaku).toBe(144.8);

    // Kasus 2: Fallback trip / 2 jika km_baku tidak ada
    const calcTrips = 28; // 14 pergi + 14 pulang
    const totalRitaseFallback = Number((calcTrips / 2).toFixed(1));
    expect(totalRitaseFallback).toBe(14);
  });

  it('prioritizes physical odometer difference over sheet totalKm, with sheet totalKm as fallback', () => {
    // Skenario A: Odometer terisi
    const kmAwal1 = 1000;
    const kmAkhir1 = 1100;
    const kmAwal2 = 1100;
    const kmAkhir2 = 1250;
    const sheetColKm = 200; // nilai kolom sheet

    const km1 = kmAkhir1 > kmAwal1 ? kmAkhir1 - kmAwal1 : 0;
    const km2 = kmAkhir2 > kmAwal2 ? kmAkhir2 - kmAwal2 : 0;
    const kmPhysical = km1 + km2;
    const finalKmA = kmPhysical > 0 ? kmPhysical : sheetColKm;
    expect(finalKmA).toBe(250); // odometer prioritas

    // Skenario B: Odometer kosong (seperti pada beberapa unit JAK 15)
    const kmPhysicalB = 0;
    const finalKmB = kmPhysicalB > 0 ? kmPhysicalB : sheetColKm;
    expect(finalKmB).toBe(200); // fallback ke totalKm sheet
  });

  it('calculates active buses by excluding OFF status when no activity', () => {
    const bus1 = { keterangan: 'SIAP OPERASI', km: 100, passengers: 50 };
    const bus2 = { keterangan: 'OFF REGULER', km: 0, passengers: 0 };
    const bus3 = { keterangan: 'OFF SAKIT', km: 10, passengers: 5 }; // OFF tapi ada km

    const isActive = (b: { keterangan: string; km: number; passengers: number }) => {
      const isOff = b.keterangan.toUpperCase().includes('OFF');
      const hasActivity = b.km > 0 || b.passengers > 0;
      return !isOff && hasActivity;
    };

    expect(isActive(bus1)).toBe(true);
    expect(isActive(bus2)).toBe(false);
    expect(isActive(bus3)).toBe(false); // OFF tetap dianggap non-aktif
  });
});
