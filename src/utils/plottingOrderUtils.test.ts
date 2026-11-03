import { describe, it, expect } from 'vitest';
import { reorderUnitsRelative } from './plottingOrderUtils';
import type { UnitPlottingItem } from '@/types/supabase';

describe('plottingOrderUtils - reorderUnitsRelative', () => {
  const sample: UnitPlottingItem[] = [
    { unit: 'U1', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U2', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U3', order: 3, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U4', order: 4, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'U5', order: 5, start_point: 'A', target_ritase: 7.5, status: 'READY' },
  ];

  it('memindahkan 1 unit ke paling depan (TOP)', () => {
    const res = reorderUnitsRelative(sample, ['U4'], 'TOP');
    expect(res.map((u) => u.unit)).toEqual(['U4', 'U1', 'U2', 'U3', 'U5']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan 1 unit ke paling belakang (BOTTOM)', () => {
    const res = reorderUnitsRelative(sample, ['U2'], 'BOTTOM');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U3', 'U4', 'U5', 'U2']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan 1 unit tepat di atas unit acuan (ABOVE)', () => {
    const res = reorderUnitsRelative(sample, ['U5'], 'ABOVE', 'U2');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U5', 'U2', 'U3', 'U4']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan 1 unit tepat di bawah unit acuan (BELOW)', () => {
    const res = reorderUnitsRelative(sample, ['U1'], 'BELOW', 'U3');
    expect(res.map((u) => u.unit)).toEqual(['U2', 'U3', 'U1', 'U4', 'U5']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan rombongan multi-unit dengan mempertahankan urutan relatif (Preserve Relative Order)', () => {
    const res = reorderUnitsRelative(sample, ['U2', 'U4'], 'BELOW', 'U5');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U3', 'U5', 'U2', 'U4']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan rombongan multi-unit ke paling depan (TOP)', () => {
    const res = reorderUnitsRelative(sample, ['U3', 'U5'], 'TOP');
    expect(res.map((u) => u.unit)).toEqual(['U3', 'U5', 'U1', 'U2', 'U4']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memindahkan rombongan multi-unit ke paling belakang (BOTTOM)', () => {
    const res = reorderUnitsRelative(sample, ['U1', 'U3'], 'BOTTOM');
    expect(res.map((u) => u.unit)).toEqual(['U2', 'U4', 'U5', 'U1', 'U3']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('mengembalikan array asli dinormalisasi jika unitsToMove kosong', () => {
    const unnormalizedSample = [
      { unit: 'U1', order: 10, start_point: 'A' as const, target_ritase: 7.5, status: 'READY' as const },
      { unit: 'U2', order: 20, start_point: 'A' as const, target_ritase: 7.5, status: 'READY' as const },
    ];
    const res = reorderUnitsRelative(unnormalizedSample, [], 'TOP');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U2']);
    expect(res.map((u) => u.order)).toEqual([1, 2]);
  });

  it('mengembalikan array asli dinormalisasi jika tidak ada unit yang cocok', () => {
    const res = reorderUnitsRelative(sample, ['UNKNOWN'], 'TOP');
    expect(res.map((u) => u.unit)).toEqual(['U1', 'U2', 'U3', 'U4', 'U5']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('menangani referenceUnit yang tidak ditemukan dengan fallback ke BOTTOM', () => {
    const res = reorderUnitsRelative(sample, ['U1'], 'ABOVE', 'NON_EXISTENT');
    expect(res.map((u) => u.unit)).toEqual(['U2', 'U3', 'U4', 'U5', 'U1']);
    expect(res.map((u) => u.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('menangani array kosong dengan aman', () => {
    const res = reorderUnitsRelative([], ['U1'], 'TOP');
    expect(res).toEqual([]);
  });
});
