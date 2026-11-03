# Task 5 Brief: Integrasi Penuh pada `DailyPlottingPage.tsx`

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Kamus Teks Sentral: Gunakan `TEXT_PLOTTING.ACTIONS.BULK_REORDER` dan `TEXT_PLOTTING.ORDER_MODAL.APPLY_SUCCESS`.
- TDD: Perbarui unit test `src/components/plotting/DailyPlottingPage.test.tsx` terlebih dahulu.

## Files
- Modify: `src/components/plotting/DailyPlottingPage.tsx`
- Modify: `src/components/plotting/DailyPlottingPage.test.tsx`

## Requirements
1. Tambahkan state `orderModal: { isOpen: boolean; units: string[] }`.
2. Sambungkan handler `handleOpenOrderModal(unit: string)` ke prop `onOpenOrderModal` pada setiap `PlottingUnitCard`.
3. Pada Floating Action Bar saat `selectedUnits.size > 0`:
   - Tambahkan tombol aksi `data-testid="btn-bulk-reorder"`.
   - Menampilkan teks: `TEXT_PLOTTING.ACTIONS.BULK_REORDER(selectedUnits.size)` (misal `⇅ Atur Posisi (2)`).
   - Menekan tombol ini memanggil `handleOpenBulkOrderModal()`.
4. Handler `handleApplyOrderMove(unitsToMove, placement, referenceUnit)`:
   - Menggunakan `reorderUnitsRelative` dari `@/utils/plottingOrderUtils` untuk menyusun ulang unit pada base aktif.
   - Normalisasi urutan base dengan `normalizeBaseOrders`.
   - Mengosongkan `selectedUnits` (unselect all).
   - Menutup `orderModal`.
   - Menampilkan `showSuccessToast(TEXT_PLOTTING.ORDER_MODAL.APPLY_SUCCESS(unitsToMove.length))`.
5. Render komponen `PlottingOrderModal`:
   - `isOpen={orderModal.isOpen}`
   - `unitsToMove={orderModal.units}`
   - `allBaseUnits={currentBaseUnits}`
   - `onClose={() => setOrderModal({ isOpen: false, units: [] })}`
   - `onApplyMove={handleApplyOrderMove}`
6. Update unit test `DailyPlottingPage.test.tsx`:
   - Test 1: Menguji klik badge urutan `badge-order-TJ-02` membuka modal posisi satuan dan memindahkan ke paling depan (`TOP`).
   - Test 2: Menguji seleksi 2 unit, menekan tombol `btn-bulk-reorder` di floating action bar, dan memindahkan rombongan ke urutan target.

## Acceptance Criteria
- `pnpm vitest run src/components/plotting/DailyPlottingPage.test.tsx` lulus 100%.
- Seluruh 6 test files di `src/components/plotting/` lulus 100%.
- Commit dengan judul: `feat: integrasi penempatan urutan relatif satuan dan rombongan`.
