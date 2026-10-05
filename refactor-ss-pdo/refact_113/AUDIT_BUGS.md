# Audit dan Resolusi — Fase 3 Batch 3.3: Validasi dan Payload Simpan

**Branch:** `devmode`  
**Status:** `READY_FOR_REVIEW`  
**Fase:** Fase 3 (Modularisasi Bus Input Modal) — Batch 3.3  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_113/`

---

## 1. Resolusi Temuan Sebelumnya

### R112-01 — Angka pada Pesan Error KM Pair Tidak Disegarkan Sesudah Rollover: RESOLVED

- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts:268-313`
  - `src/components/busCard/modal/busInputValidation.ts:124-298`
  - `src/components/busCard/modal/useBusModalOdometer.ts:69,449`
- **Lokasi Uji Kontrak:**
  - `src/components/busCard/modal/useBusInputForm.test.tsx:821-878`
- **Keparahan:** Rendah (ketepatan umpan balik form; validasi simpan tetap menolak nilai salah).
- **Deskripsi Masalah:**
  Sebelum perbaikan, ketika form memiliki dua error bersamaan (error lintas hari `KM Awal < KM Kemarin` dan error KM pair `KM Akhir < KM Awal`), menekan tombol saran rollover memperbarui nilai input `kmAwal1` dari `292003` menjadi `293003`. Namun, error KM pair lama yang dipertahankan di dalam state `validationErrors` masih memuat teks angka acuan lama:
  `KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (292003)!`
  Pesan tidak disegarkan ke angka terbaru `(293003)` sampai pengguna melakukan submit ulang.
- **Dampak Pengguna:**
  Petugas di lapangan membaca angka KM Awal acuan yang sudah usang saat hendak memperbaiki angka KM Akhir.
- **Mitigasi Terverifikasi:**
  1. Pada modul `useBusModalOdometer`, identitas shift target eksplisit `rolloverTargetShift` diekspos sebagai bagian dari kontrak hook.
  2. Pada handler `handleApplyRollover` di `useBusInputForm.ts`, jika terdapat `validationErrors.length > 0` saat rollover diterapkan, form mengevaluasi ulang pesan kesalahan menggunakan fungsi validasi murni yang sama (`validateBusInputForm`) dengan nilai KM terkini (`nextKmAwal1`, `nextKmAkhir1`, `nextKmAwal2`, `nextKmAkhir2`).
  3. Error lintas hari secara otomatis hilang karena angka baru memenuhi aturan (`293003 >= 292990`), sementara error KM pair yang masih berlaku langsung diperbarui memuat angka acuan terkini `(293003)`.
  4. Penyegaran ini tidak menggunakan pencocokan substring/fragmen teks sama sekali, melainkan evaluasi murni dari SSOT validator.
  5. Pengujian `useBusInputForm.test.tsx` ("R112-01: handleApplyRollover menyegarkan angka KM Awal pada pesan error KM pair yang masih berlaku") membuktikan bahwa sebelum rollover pesan memuat `(292003)`, dan setelah rollover pesan memuat `(293003)` serta pesan lintas hari hilang.

---

## 2. Cakupan Ekstraksi Batch 3.3

### 2.1. Ekstraksi Validasi Murni (`busInputValidation.ts`)
- Fungsi `validateBusInputForm(params)`:
  - Memvalidasi Single Focus Mode sesuai kategori aktif (`trip`, `toaShift1`, `totalToa`, `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`).
  - Memvalidasi Mode All mencakup seluruh kolom (trip, TOA, manual, KM pair, cross-shift, cross-day).
  - Menggunakan validator murni yang sudah ada di `@/utils/modals/busInput/busModalValidation`.
  - Parsing angka spreadsheet format Indonesia via `parseIndonesianNumber`.
  - Mendukung label kustom trip via `headerMap`.
- Fungsi `getCrossDayValidationErrors(params)`:
  - Ekstraksi helper pengecekan error lintas hari aktif untuk Shift 1 dan Shift 2 (Skenario B) yang digunakan bersama oleh submit validation, bypass toggle, dan indikator `hasCrossDayError`.

### 2.2. Ekstraksi Pembentukan Payload Murni (`busInputPayload.ts`)
- Fungsi `buildBusInputPayload(params)`:
  - Mengembalikan `Partial<BusData>` yang murni dan terisolasi.
  - Menjaga semantik **Scoped Updates**:
    - Single Focus: hanya kolom kategori aktif yang dikirim (+ `keterangan` jika chip `showKeterangan` dibuka). Field di luar kategori tidak pernah ada di objek payload (tidak menimpa field lain).
    - Mode All: mengirim seluruh kolom yang berhak diisi.
  - Sanitasi KM via `sanitizeKmAwal` dan `sanitizeKmAkhir`.
  - Menghormati penguncian berantai: `kmAkhir1` kosong jika `!isKmAwal1Valid`, `kmAwal2` kosong jika `isKmAwal2Locked`, `kmAkhir2` kosong jika `!isKmAwal2Valid`.
  - Pengosongan manual field jika `!showManual1` atau `!showManual2`.
- Fungsi `computeEffectiveTotalToa(...)`:
  - Menghitung jumlah numerik Shift 1 + Shift 2 jika keduanya valid dan > 0, atau fallback ke `totalToa` manual jika tidak ada penjumlahan shift.

### 2.3. Penyederhanaan Hook Utama (`useBusInputForm.ts`)
- Ukuran hook berkurang secara signifikan (~260 baris logika validasi & pembuatan payload diekstrak ke modul murni).
- Hook berfokus murni pada:
  - State React, event handlers, keyboard navigation/focus, viewport scroll, dan toggle satset.
  - Delegasi validasi submit ke `validateBusInputForm`.
  - Delegasi pembentukan payload ke `buildBusInputPayload`.
  - Eksekusi `onSave(updates)` dan `onDismiss()` dengan urutan dan kontrak yang tidak berubah.

---

## 3. Matriks Hasil Quality Gates

| Gate | Target Kontrak | Hasil Aktual | Status |
|---|---|---|---|
| **Targeted Modal Tests** | File tes di `src/components/busCard/modal/` | 5 berkas, 73 tes lulus, 0 gagal | **PASS** |
| **Standard Suite (`pnpm run test`)** | Seluruh unit test proyek | 86 berkas, 650 tes lulus, 0 gagal | **PASS** |
| **Workspace Suite (`pnpm run test src/`)** | Seluruh test di direktori `src/` | 86 berkas, 650 tes lulus, 0 gagal | **PASS** |
| **Targeted Linter (oxlint)** | Modul modal bus card | 0 error, 0 warning `exhaustive-deps` | **PASS** |
| **TypeScript Strict (`tsc -b`)** | Kompilasi tipe proyek | Exit code 0, 0 error | **PASS** |
| **Production Build (`vite build`)** | Bundle produksi client | Exit code 0, asset bundle terbangun | **PASS** |
| **Knowledge Graph (`graphify`)** | Sinkronisasi graf AST | AST terbarui (6263 node, 10162 edge) | **PASS** |
