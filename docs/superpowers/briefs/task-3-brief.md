# Task 3 Brief: Komponen Modal `PlottingOrderModal.tsx`

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Mobile-First & Semantic Color Tokens: Gunakan CSS variables dari `src/styles/tokens/semantic.css` (`var(--color-surface-raised)`, `var(--color-text-primary)`, `var(--color-action-primary-bg)`, dll). Dilarang hardcode warna hex/rgb.
- Kamus Teks Sentral: Gunakan `TEXT_PLOTTING.ORDER_MODAL` dan `TEXT_COMMON.BUTTONS`.
- TDD: Buat file test `src/components/plotting/PlottingOrderModal.test.tsx` terlebih dahulu.

## Files
- Create: `src/components/plotting/PlottingOrderModal.tsx`
- Test: `src/components/plotting/PlottingOrderModal.test.tsx`

## Requirements
Komponen modal/bottom-sheet interaktif untuk memindahkan 1 atau banyak unit:
```ts
export interface PlottingOrderModalProps {
  isOpen: boolean;
  unitsToMove: string[]; // Array unit string (misal: ['KWK 222153'])
  allBaseUnits: UnitPlottingItem[]; // Seluruh unit yang ada di base aktif
  onClose: () => void;
  onApplyMove: (
    unitsToMove: string[],
    placement: 'TOP' | 'BOTTOM' | 'ABOVE' | 'BELOW',
    referenceUnit?: string
  ) => void;
}
```

### Fitur & Perilaku:
1. Jika `!isOpen` atau `unitsToMove.length === 0`, return `null`.
2. Header Modal:
   - Jika `unitsToMove.length === 1`: `TEXT_PLOTTING.ORDER_MODAL.TITLE_SINGLE(unit, currentOrder)`.
   - Jika `unitsToMove.length > 1`: `TEXT_PLOTTING.ORDER_MODAL.TITLE_MULTI(unitsToMove.length)`.
   - Tombol tutup silang (`X`).
3. Chips Unit Terpilih:
   - Menampilkan badges/chips unit yang akan dipindahkan.
4. Opsi Cepat 1-Ketuk:
   - Tombol `[ ⤒ Paling Depan (#1) ]` (data-testid="btn-order-top"): langsung memanggil `onApplyMove(unitsToMove, 'TOP')`.
   - Tombol `[ ⤓ Paling Belakang ]` (data-testid="btn-order-bottom"): langsung memanggil `onApplyMove(unitsToMove, 'BOTTOM')`.
5. Opsi Relatif:
   - Subtitle: `TEXT_PLOTTING.ORDER_MODAL.RELATIVE_HEADER`.
   - Segmented toggle / radio button arah:
     - `ABOVE` ("Di Atas Unit")
     - `BELOW` ("Di Bawah Unit", default)
   - Dropdown Select Unit Acuan (data-testid="select-ref-unit"):
     - Hanya menampilkan unit di `allBaseUnits` yang **BUKAN** anggota `unitsToMove` (*Smart Exclusion Guard*).
     - Label option: `#${item.order} • ${item.unit}`.
6. Tombol Aksi Bawah:
   - Tombol Batal (`TEXT_COMMON.BUTTONS.CANCEL`) -> `onClose()`.
   - Tombol Terapkan (`TEXT_PLOTTING.ORDER_MODAL.SUBMIT` - data-testid="btn-order-submit"):
     - Dinonaktifkan jika belum memilih unit acuan.
     - Saat diklik: memanggil `onApplyMove(unitsToMove, direction, selectedRefUnit)`.

## Acceptance Criteria
- Unit test `PlottingOrderModal.test.tsx` menguji:
  - Render judul single vs multi-unit.
  - Memanggil `onApplyMove` dengan 'TOP' saat tombol paling depan diklik.
  - Memanggil `onApplyMove` dengan 'BOTTOM' saat tombol paling belakang diklik.
  - Mengecualikan `unitsToMove` dari pilihan dropdown unit acuan.
  - Memanggil `onApplyMove` dengan 'ABOVE' atau 'BELOW' dan `referenceUnit` saat submit.
- `pnpm vitest run src/components/plotting/PlottingOrderModal.test.tsx` lulus 100%.
- Commit dengan judul: `feat: komponen modal penempatan urutan relatif plotting`.
