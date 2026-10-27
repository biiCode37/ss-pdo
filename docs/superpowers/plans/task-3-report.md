# Task 3 Report: State Pemisahan Shift & Payload Builder

## Status: DONE
- **Commit**: `7e69b0a` (`feat: split shift notes in form and payload builder`)
- **Branch**: `devmode`

## Perubahan File:
1. `src/components/busCard/modal/busInputPayload.ts`:
   - Menambahkan `keteranganS1?: string;` dan `keteranganS2?: string;` pada interface `BuildBusInputPayloadParams`.
   - Mengintegrasikan `combineShiftKeterangan` dari `src/utils/keteranganUtils.ts`.
   - Menghitung `resolvedKeterangan`: jika salah satu `keteranganS1` atau `keteranganS2` didefinisikan, gunakan `combineShiftKeterangan(keteranganS1, keteranganS2)`; jika tidak, fallback ke `(keterangan || "").trim()`.
   - Mengarahkan assignment payload `updates.keterangan = resolvedKeterangan` baik pada Single Focus mode (ketika `effectiveCategory === "keterangan"` atau `showKeterangan` aktif) maupun pada Mode All.
2. `src/components/busCard/modal/useBusInputForm.ts`:
   - Memecah inisialisasi catatan awal menggunakan `splitShiftKeterangan(bus.keterangan || "")` ke dalam dua state terpisah: `keteranganS1` dan `keteranganS2`.
   - Menyediakan sinkronisasi backward-compatible untuk `keterangan` (berdasarkan `activeTab` atau `combineShiftKeterangan`) dan handler `setKeterangan` cerdas.
   - Mengekspos `keteranganS1`, `setKeteranganS1`, `keteranganS2`, `setKeteranganS2`, `keterangan`, `setKeterangan` pada objek kembalian hook.
   - Meneruskan `keteranganS1` dan `keteranganS2` ke `buildBusInputPayload` pada `handleFormSubmit`.
3. `src/components/busCard/modal/busInputPayload.test.ts`:
   - Menambahkan 6 unit test baru untuk penggabungan kanonik shift notes di payload:
     - S1 ada, S2 kosong ➔ `"S1 | SGO"`
     - Catatan identik (misal `"OFF"`, `"OFF"`) ➔ `"OFF"`
     - Catatan keduanya kosong ➔ `""`
     - S1 kosong, S2 ada ➔ `"SGO | S2"`
     - Single focus mode pada kategori keterangan
     - Single focus mode dengan `showKeterangan` aktif
4. `src/components/busCard/modal/useBusInputForm.test.tsx`:
   - Menambahkan 3 unit test untuk inisialisasi `keteranganS1` & `keteranganS2`, penanganan all-day notes (`"OFF"`), serta update independen yang dikirimkan dalam format kanonik gabungan saat submit.
5. `src/components/busCard/modal/BusInputModalSingleFocus.test.tsx` & `src/components/busCard/modal/fields/BusFormField.test.tsx`:
   - Memperbarui mock `BusInputFormReturn` agar mencakup `keteranganS1`, `setKeteranganS1`, `keteranganS2`, `setKeteranganS2` untuk menjamin kepatuhan tipe TypeScript.

## Hasil Verifikasi:
- **Payload Tests**: `pnpm vitest run src/components/busCard/modal/busInputPayload.test.ts` ➔ 20 passed (100%)
- **Form Hook Tests**: `pnpm vitest run src/components/busCard/modal/useBusInputForm.test.tsx` ➔ 26 passed (100%)
- **Modal Suite Tests**: `pnpm vitest run src/components/busCard/modal/` ➔ 114 passed (100%)
- **All busCard Tests**: `pnpm vitest run src/components/busCard/` ➔ 163 passed (100%)
- **TypeScript Strict**: `pnpm tsc -b` ➔ Exit code 0, 0 error
