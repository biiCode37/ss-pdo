import { describe, it, expect } from 'vitest';
import { resolveRouteFleetStatus } from './fleetResolutionService';
import type { DailyFleetShiftWithUnits } from '../types/supabase';
import type { BusData } from './googleSheets';

describe('fleetResolutionService - resolveRouteFleetStatus', () => {
  const mockRoute = { id: 1, route_code: 'JAK.15', default_renops: 30 };
  const mockDate = '2026-10-11';

  it('Prioritas 1: Menggunakan Laporan A2 jika tersedia di DB', () => {
    const dbShift: DailyFleetShiftWithUnits = {
      id: 10,
      route_id: 1,
      route_code: 'JAK.15',
      date: mockDate,
      shift: 1,
      target_renops: 30,
      realops: 28,
      total_units: 30,
      sgo_count: 28,
      to_count: 1,
      off_count: 1,
      so_count: 0,
      other_count: 0,
      is_confirmed: true,
      source_type: 'pdo_a2',
      submitted_by_role: 'pdo',
      confirmed_at: '2026-10-11T07:30:00Z',
      non_sgo_units: [
        { id: 1, fleet_shift_id: 10, unit_body: 'TS.01', status_id: 2, status_code: 'TO', note: 'EVDAL', created_at: '' },
      ],
    };

    const res = resolveRouteFleetStatus(mockRoute, mockDate, 1, dbShift, null);
    expect(res.sourceType).toBe('pdo_a2');
    expect(res.isComplete).toBe(true);
    expect(res.realops).toBe(28);
    expect(res.targetRenops).toBe(30);
    expect(res.sourceLabel).toBe('Laporan A2 Petugas');
    expect(res.nonSgoUnits).toHaveLength(1);
    expect(res.nonSgoUnits[0].unit_body).toBe('TS.01');
  });

  it('Prioritas 1b: Menggunakan Input Korlap jika tersedia di DB', () => {
    const dbShift: DailyFleetShiftWithUnits = {
      id: 11,
      route_id: 1,
      route_code: 'JAK.15',
      date: mockDate,
      shift: 1,
      target_renops: 30,
      realops: 26,
      total_units: 30,
      sgo_count: 26,
      to_count: 2,
      off_count: 2,
      so_count: 0,
      other_count: 0,
      is_confirmed: true,
      source_type: 'korlap_manual',
      submitted_by_role: 'korlap',
      non_sgo_units: [],
    };

    const res = resolveRouteFleetStatus(mockRoute, mockDate, 1, dbShift, null);
    expect(res.sourceType).toBe('korlap_manual');
    expect(res.isComplete).toBe(true);
    expect(res.realops).toBe(26);
    expect(res.sourceLabel).toBe('Input Manual Korlap');
  });

  it('Prioritas 2: Fallback otomatis membaca kolom ritase > 0 dari spreadsheet jika DB kosong', () => {
    const mockBuses: Partial<BusData>[] = [
      { rowIndex: 2, unit: 'TS.01', tripPergi: '3', tripPulang: '3', keterangan: '' },
      { rowIndex: 3, unit: 'TS.02', tripPergi: '4', tripPulang: '4', keterangan: 'BA.01 Radiator' },
      { rowIndex: 4, unit: 'TS.03', tripPergi: '0', tripPulang: '0', keterangan: 'OFF' },
      { rowIndex: 5, unit: 'TS.04', tripPergi: '', tripPulang: '', keterangan: '' },
    ];

    const res = resolveRouteFleetStatus(mockRoute, mockDate, 1, null, mockBuses as BusData[]);
    expect(res.sourceType).toBe('spreadsheet_auto');
    expect(res.isComplete).toBe(true);
    expect(res.realops).toBe(2); // TS.01 dan TS.02
    expect(res.targetRenops).toBe(30);
    expect(res.sourceLabel).toBe('Otomatis Spreadsheet');
    expect(res.nonSgoUnits.some((u) => u.unit_body === 'TS.02' && u.note.includes('Radiator'))).toBe(true);
  });

  it('Prioritas 3: Menandai status empty jika DB kosong dan spreadsheet tidak memiliki ritase', () => {
    const mockBusesEmpty: Partial<BusData>[] = [
      { rowIndex: 2, unit: 'TS.01', tripPergi: '0', tripPulang: '0', keterangan: '' },
      { rowIndex: 3, unit: 'TS.02', tripPergi: '', tripPulang: '', keterangan: 'OFF' },
    ];

    const res = resolveRouteFleetStatus(mockRoute, mockDate, 1, null, mockBusesEmpty as BusData[]);
    expect(res.sourceType).toBe('empty');
    expect(res.isComplete).toBe(false);
    expect(res.realops).toBe(0);
    expect(res.sourceLabel).toBe('Belum Ada Data');
  });

  it('Aturan Kumulatif Harian: Realops Shift 2 tidak boleh berkurang dari Shift 1', () => {
    const mockBusesS2: Partial<BusData>[] = [
      { rowIndex: 2, unit: 'TS.01', tripPergi: '1', tripPulang: '1', keterangan: '' },
    ];
    // Shift 1 sebelumnya mencatat 27 unit
    const res = resolveRouteFleetStatus(mockRoute, mockDate, 2, null, mockBusesS2 as BusData[], 27);
    expect(res.realops).toBe(27); // Dijaga minimal sama dengan Shift 1
  });

  it('Aturan Kumulatif Harian: Realops Shift 2 bertambah jika ada unit tambahan yang beroperasi di Shift 2', () => {
    // Di shift 2, unit TS.01 (shift 1) + TS.02 (baru jalan di shift 2)
    const mockBusesS2: Partial<BusData>[] = [
      { rowIndex: 2, unit: 'TS.01', tripPergi: '4', tripPulang: '4', keterangan: '' },
      { rowIndex: 3, unit: 'TS.02', tripPergi: '2', tripPulang: '2', keterangan: 'BA.02 NP1' },
      { rowIndex: 4, unit: 'TS.03', tripPergi: '3', tripPulang: '3', keterangan: '' },
    ];
    // Shift 1 sebelumnya 2 unit, sekarang di shift 2 ada 3 unit beritase
    const res = resolveRouteFleetStatus(mockRoute, mockDate, 2, null, mockBusesS2 as BusData[], 2);
    expect(res.realops).toBe(3);
  });
});
