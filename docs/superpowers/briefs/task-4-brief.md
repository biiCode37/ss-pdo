# Task 4 Brief: Optimalisasi `PlottingUnitCard.tsx` (Clean Selection & Interactive Order Badge)

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Semantic Color Tokens: Gunakan CSS variables dari `src/styles/tokens/semantic.css`.
- TDD: Perbarui unit test `src/components/plotting/PlottingUnitCard.test.tsx` terlebih dahulu.

## Files
- Modify: `src/components/plotting/PlottingUnitCard.tsx`
- Modify: `src/components/plotting/PlottingUnitCard.test.tsx`

## Requirements
1. **Clean Selection:**
   - Hapus bulatan checkbox `○` abu-abu saat kartu dalam kondisi tidak terpilih (idle).
   - Ketika `isSelectedForMultiSelect === true`, tampilkan centang mini halus (`CheckCircle2` ukuran 15px berwarna `var(--color-action-primary-bg, #38bdf8)`) di samping nomor urut/nama unit sebagai konfirmasi ganda bersama border neon.
   - Seluruh bodi kartu dapat disentuh untuk memicu `onToggleSelect(item.unit)`.
   - Pastikan atribut `data-testid="btn-select-${item.unit}"` tetap ada pada elemen pemicu/indikator seleksi agar kompatibel dengan existing unit test.
2. **Hapus Drag Handle:**
   - Hapus ikon `GripVertical` (`[::]`) untuk menyederhanakan antarmuka ponsel.
3. **Interactive Order Badge:**
   - Tambahkan prop opsional pada `PlottingUnitCardProps`:
     `onOpenOrderModal?: (unit: string) => void;`
   - Jadikan badge nomor urut `[ 1 ]` (`data-testid="badge-order-${item.unit}"`) dapat di-klik:
     - `cursor: 'pointer'`
     - Efek visual halus (hover/focus)
     - `title: 'Klik untuk mengatur posisi urutan unit ini'`
     - Saat diklik (`e.stopPropagation()`): memanggil `onOpenOrderModal?.(item.unit)`.

## Acceptance Criteria
- `src/components/plotting/PlottingUnitCard.test.tsx` menguji:
  - Lingkaran checkbox idle TIDAK muncul saat `isSelectedForMultiSelect === false`.
  - Centang mini muncul saat `isSelectedForMultiSelect === true`.
  - Klik bodi kartu memicu `onToggleSelect`.
  - Klik badge urutan memicu `onOpenOrderModal`.
  - Drag handle `GripVertical` tidak lagi dirender.
- `pnpm vitest run src/components/plotting/PlottingUnitCard.test.tsx` lulus 100%.
- Commit dengan judul: `feat: clean selection dan interactive order badge plotting card`.
