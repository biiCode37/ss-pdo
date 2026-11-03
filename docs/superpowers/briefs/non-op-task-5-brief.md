# Task 5 Brief: Auto-Park to Bottom & Eksklusi Nomor Urutan pada Halaman Plotting

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Golden Rule Ritase: Unit dengan target_ritase = 0 atau status = 'OFF' mutlak tidak beroperasi.
- Eksklusi Nomor Urut: Nomor urut (1, 2, ... N) HANYA untuk armada yang beroperasi. Unit non-operasi mendapat `order: 0` dan badgenya menampilkan `-` atau `OFF`.
- Auto-Park to Bottom: Unit non-operasi selalu berada di bawah unit operasional di pangkalan terkait.
- TDD: Perbarui `src/components/plotting/DailyPlottingPage.test.tsx` dan `src/components/plotting/PlottingUnitCard.test.tsx` terlebih dahulu.

## Files
- Modify: `src/components/plotting/DailyPlottingPage.tsx`
- Modify: `src/components/plotting/PlottingUnitCard.tsx`
- Modify: `src/components/plotting/PlottingOrderModal.tsx`
- Modify: `src/components/plotting/DailyPlottingPage.test.tsx`
- Modify: `src/components/plotting/PlottingUnitCard.test.tsx`

## Requirements
1. **Modifikasi `normalizeBaseOrders` di `DailyPlottingPage.tsx`:**
   - Di setiap base (A dan B):
     - Unit operasional (`target_ritase > 0 && status !== 'OFF'`) diurutkan `1..N`.
     - Unit non-operasional (`target_ritase === 0 || status === 'OFF'`) diberi `order: 0`.
     - Susun: `[...operational, ...nonOperational]`.
   - Saat user mengubah status ke `OFF` atau ritase ke `0`:
     - Unit otomatis dinormalisasi dan terparkir di bawah.

2. **Modifikasi `PlottingUnitCard.tsx`:**
   - Tentukan `isNonOp = item.target_ritase === 0 || item.status === 'OFF' || item.order === 0;`
   - Pada badge urutan `data-testid="badge-order-${item.unit}"`:
     - Jika `isNonOp === true`:
       Tampilkan `-` atau `OFF` (bukan angka urutan antrean).
       Tooltip/title: `Unit Tidak Beroperasi (Tidak Masuk Antrean)`.
     - Jika `isNonOp === false`:
       Tampilkan `{item.order}` dan dukung klik untuk membuka `onOpenOrderModal`.
   - Tombol panah reorder `[ ↑ ] [ ↓ ]`:
     - Hanya tampil untuk unit operasional (`!isNonOp`).

3. **Modifikasi `PlottingOrderModal.tsx`:**
   - Dropdown unit acuan target HANYA menampilkan unit-unit operasional (`item.order > 0`).

4. **Pengujian Unit:**
   - `DailyPlottingPage.test.tsx`:
     - Test `normalizeBaseOrders` menempatkan unit OFF/target 0 di bawah dan memberi `order: 0`.
   - `PlottingUnitCard.test.tsx`:
     - Test kartu unit OFF / target ritase 0 menampilkan badge non-operasi tanpa nomor urutan dan menyembunyikan tombol panah reorder.

## Acceptance Criteria
- Seluruh pengujian di `DailyPlottingPage.test.tsx` dan `PlottingUnitCard.test.tsx` lulus 100%.
- Jalankan test `pnpm vitest run src/components/plotting/` dan pastikan 100% lulus.
- Commit dengan judul: `feat: auto-park bawah dan eksklusi nomor urut plotting`.
