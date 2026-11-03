# Task 3 Brief: Auto-Skip Mode Satset & Auto-Park to Bottom pada Input SS (`BusList.tsx` & `BusCard.tsx`)

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Golden Rule Ritase: Menggunakan `isBusNonOperational` dari `@/utils/operationalStatusUtils` sebagai SSOT evaluasi.
- TDD: Perbarui unit test `src/components/busList/BusList.test.tsx` dan `src/components/busCard/BusCard.test.tsx` terlebih dahulu.

## Files
- Modify: `src/components/busList/BusList.tsx`
- Modify: `src/components/busCard/BusCard.tsx`
- Modify: `src/components/busList/BusList.test.tsx`
- Modify: `src/components/busCard/BusCard.test.tsx`

## Requirements
1. **Auto-Skip Satset pada `BusList.tsx`:**
   - Import `isBusNonOperational` dari `@/utils/operationalStatusUtils`.
   - Di dalam `handleSaveAndNext(savedBus: BusData)`:
     Saat mencari `nextBus`, pastikan unit yang dipilih memenuhi kriteria:
     `!checkFilled(b) && !isBusNonOperational(b, plottingMap.get(b.unit?.trim().toUpperCase()))`.
   - Bus yang tidak beroperasi otomatis dilewati tanpa pernah dibuka oleh mode Satset.

2. **Auto-Park to Bottom pada `BusList.tsx`:**
   - Pada pengurutan `filteredData`:
     ```ts
     const aNonOp = isBusNonOperational(a, plottingMap.get(a.unit?.trim().toUpperCase()));
     const bNonOp = isBusNonOperational(b, plottingMap.get(b.unit?.trim().toUpperCase()));
     if (aNonOp !== bNonOp) {
       return aNonOp ? 1 : -1; // Unit non-operasional selalu berkumpul di paling bawah
     }
     ```
   - Pastikan aturan ini berlaku konsisten baik pada tampilan sheet view maupun base_a / base_b.

3. **Eksklusi Nomor Urut Antrean pada `BusCard.tsx`:**
   - Import `isBusNonOperational` dari `@/utils/operationalStatusUtils`.
   - Pada rendering badge urutan antrean `plotting-order-${bus.unit}`:
     Cek `const isNonOp = isBusNonOperational(bus, plottingItem);`
     - Jika `isNonOp === true`: Jangan render angka `#{plottingItem.order}`. Badge urutan tidak ditampilkan atau diganti dengan penanda non-operasi `-`.
     - Jika `isNonOp === false`: Render angka urutan `#{plottingItem.order}` seperti biasa.

4. **Unit Testing:**
   - `BusList.test.tsx`:
     - Test Satset auto-advance melewati bus yang ritasenya 0 / OFF dan langsung membuka bus beroperasi berikutnya.
     - Test daftar bus mengelompokkan bus non-operasional di urutan paling bawah.
   - `BusCard.test.tsx`:
     - Test unit non-operasional tidak menampilkan badge urutan nomor antrean `#order`.

## Acceptance Criteria
- Seluruh pengujian di `BusList.test.tsx` dan `BusCard.test.tsx` lulus 100%.
- Jalankan test `pnpm vitest run src/components/busList/BusList.test.tsx src/components/busCard/BusCard.test.tsx` dan pastikan 100% lulus.
- Commit dengan judul: `feat: auto-skip satset dan auto-park bawah input ss`.
