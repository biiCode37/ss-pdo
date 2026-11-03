# Task 1 Brief: Logika Pemindahan Array Urutan Relatif (`plottingOrderUtils.ts`)

## Global Constraints
- Strictdevmode: Bekerja hanya pada branch `devmode`.
- TDD: Tulis test terlebih dahulu, pastikan gagal (RED), tulis implementasi, pastikan lulus (GREEN).
- Zero External Dependency: Gunakan murni TypeScript/standard array manipulation.

## Files
- Create: `src/utils/plottingOrderUtils.ts`
- Test: `src/utils/plottingOrderUtils.test.ts`

## Requirements
Implementasikan fungsi `reorderUnitsRelative`:
```ts
import type { UnitPlottingItem } from '@/types/supabase';

export type RelativePlacement = 'TOP' | 'BOTTOM' | 'ABOVE' | 'BELOW';

export function reorderUnitsRelative(
  currentUnits: UnitPlottingItem[],
  unitsToMove: string[],
  placement: RelativePlacement,
  referenceUnit?: string
): UnitPlottingItem[];
```

### Logika Pemindahan:
1. `unitsToMove` dapat berisi 1 atau banyak unit.
2. Urutan relatif asal di antara unit-unit yang dipindahkan tetap terjaga (*Preserve Relative Order*).
3. Jika `placement === 'TOP'`, seluruh unit yang dipindah ditempatkan di paling awal array.
4. Jika `placement === 'BOTTOM'`, seluruh unit yang dipindah ditempatkan di paling akhir array.
5. Jika `placement === 'ABOVE'` dan ada `referenceUnit`, rombongan unit diselipkan tepat sebelum `referenceUnit`.
6. Jika `placement === 'BELOW'` dan ada `referenceUnit`, rombongan unit diselipkan tepat setelah `referenceUnit`.
7. Setelah disusun, properti `.order` pada setiap elemen array dinormalisasi ulang menjadi urutan berurutan `1..N`.
8. Jika `unitsToMove` kosong atau tidak ada yang cocok, kembalikan array asli yang dinormalisasi.

## Acceptance Criteria
- File `src/utils/plottingOrderUtils.test.ts` memverifikasi seluruh skenario (TOP, BOTTOM, ABOVE, BELOW, multi-unit block shift).
- Semua test lulus dengan `pnpm vitest run src/utils/plottingOrderUtils.test.ts`.
- Commit perubahan dengan judul ringkas: `feat: logika pemindahan urutan relatif plotting`.
