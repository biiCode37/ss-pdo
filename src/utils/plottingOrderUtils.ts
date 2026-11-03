import type { UnitPlottingItem } from '@/types/supabase';

export type RelativePlacement = 'TOP' | 'BOTTOM' | 'ABOVE' | 'BELOW';

/**
 * Menyusun ulang posisi unit-unit dalam daftar plotting dengan mempertahankan
 * urutan relatif antar-unit yang dipindahkan (Preserve Relative Order) dan
 * menormalisasi nomor urut (order) menjadi 1..N.
 */
export function reorderUnitsRelative(
  currentUnits: UnitPlottingItem[],
  unitsToMove: string[],
  placement: RelativePlacement,
  referenceUnit?: string
): UnitPlottingItem[] {
  if (currentUnits.length === 0) return [];

  const moveSet = new Set(unitsToMove);
  // Ambil elemen yang dipindah dengan menjaga urutan aslinya
  const movingItems = currentUnits.filter((u) => moveSet.has(u.unit));

  // Jika tidak ada unit yang dipindah atau tidak ada yang cocok, kembalikan array asli dinormalisasi
  if (movingItems.length === 0) {
    return currentUnits.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
  }

  // Sisa elemen yang tidak dipindah
  const remaining = currentUnits.filter((u) => !moveSet.has(u.unit));

  let result: UnitPlottingItem[] = [];

  if (placement === 'TOP') {
    result = [...movingItems, ...remaining];
  } else if (placement === 'BOTTOM') {
    result = [...remaining, ...movingItems];
  } else if (referenceUnit) {
    const refIdx = remaining.findIndex((u) => u.unit === referenceUnit);
    if (refIdx === -1) {
      result = [...remaining, ...movingItems];
    } else if (placement === 'ABOVE') {
      result = [
        ...remaining.slice(0, refIdx),
        ...movingItems,
        ...remaining.slice(refIdx),
      ];
    } else {
      // BELOW
      result = [
        ...remaining.slice(0, refIdx + 1),
        ...movingItems,
        ...remaining.slice(refIdx + 1),
      ];
    }
  } else {
    result = [...remaining, ...movingItems];
  }

  // Normalisasi order 1..N
  return result.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
}
