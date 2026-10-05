# Laporan Perbaikan & Implementasi Fase 3 Batch 3.2: Sub-hook Odometer

**Status:** `READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_107/`

---

## 1. Ringkasan Eksekutif

Pada Batch 3.2 ini, tanggung jawab domain odometer telah berhasil dipisahkan dari god-hook `useBusInputForm.ts` ke dalam sub-hook terfokus `src/components/busCard/modal/useBusModalOdometer.ts`.

Seluruh fungsionalitas odometer yang meliputi:
1. Pengelolaan 4 state KM (`kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`),
2. Evaluasi status draf 3-digit (`isKmAwal1DraftOnly`, `isKmAkhir1DraftOnly`, `isKmAwal2DraftOnly`, `isKmAkhir2DraftOnly`),
3. Validitas & lock berantai antar-field (`isKmAwal1Valid`, `isKmAkhir1Locked`, `isKmAwal2Valid`, `isKmAkhir2Locked`),
4. Sinkronisasi reaktif data H-1 asinkron dan pasangan KM,
5. Aksi salin KM Akhir S1 ke KM Awal S2 (`handleCopyKmAkhir1ToAwal2`),
6. Kalkulasi live KM dan estimasi Trip secara real-time,
7. Deteksi dan aplikasi smart rollover (`rolloverSuggestionS1`, `rolloverSuggestionS2`, `applyRolloverS1`, `applyRolloverS2`),

kini terkonsolidasi rapi dalam `useBusModalOdometer.ts`.

Empat (4) warning `react-hooks/exhaustive-deps` yang sebelumnya ada pada efek-efek KM berhasil dieliminasi secara semantis menjadi **0 warning** tanpa menggunakan directive `eslint-disable`. Seluruh kontrak return `useBusInputForm` dipertahankan 100% sehingga tidak ada breaking change pada `BusInputModal`, field input, maupun tes integrasi yang ada.

---

## 2. Before vs After

| Aspek | Sebelum Refactor (Batch 3.1) | Sesudah Refactor (Batch 3.2) |
|---|---|---|
| **Struktur Modul** | Seluruh logika KM, draf, lock berantai, rollover, dan kalkulasi jarak menumpuk di `useBusInputForm.ts` (~385 baris). | Logika KM didelegasikan ke sub-hook `useBusModalOdometer.ts` (190 baris logika murni). Ukuran `useBusInputForm.ts` turun menjadi ~235 baris. |
| **Pemisahan Tanggung Jawab** | `useBusInputForm` merangkap state odometer, error validasi form, submit payload, dan koordinasi modal. | Odometer berdiri sebagai domain sub-hook mandiri dengan input props dan return yang jelas dan terisolasi. |
| **Linter Warnings (`exhaustive-deps`)** | **4 warning** `react-hooks/exhaustive-deps` pada efek sinkronisasi KM awal/akhir. | **0 warning**. Diselesaikan secara semantis melalui React functional state updater (`setKm(curr => ...)`). |
| **Stabilitas Input Pengguna** | Menambahkan variabel KM ke dependency array efek secara membabi buta akan memicu penimpaan input saat user mengosongkan/backspace field. | Functional updater membaca state saat ini tanpa mendaftarkannya sebagai dependensi efek. Pengguna bebas menghapus/mengoreksi tanpa tertimpa draf prefill berulang. |
| **Pengujian Sub-hook** | Tidak ada pengujian unit terisolasi untuk state odometer; hanya diuji lewat form besar. | Tersedia rangkaian uji unit & integrasi terdedikasi `useBusModalOdometer.test.tsx` (8 tes) dan `useBusInputForm.test.tsx` (19 tes). |
| **Total Test Suite** | 84 berkas / 604 tes lulus. | 84 berkas / **615 tes lulus** (+11 tes baru untuk odometer dan form). |

---

## 3. Case: Skenario Lapangan

### Case 1: Data KM H-1 Tiba Asinkron Setelah Modal Dirender
- **Skenario Lapangan:** Petugas di lapangan membuka modal bus saat koneksi internet lambat. Data pembacaan KM Akhir kemarin (`previousDayKmAkhir2`) baru selesai dimuat 500ms setelah modal terbuka di layar.
- **Before:** Jika efek membaca state secara closure lama atau dependensi hilang, prefill dapat gagal masuk atau sebaliknya menimpa angka yang sudah diketik petugas selama 500ms pertama tersebut.
- **After:** Efek `previousDayKmAkhir2` pada `useBusModalOdometer` menggunakan functional updater `setKmAwal1(current => (!current ? prefill : current))`. Jika field masih kosong dan belum ada nilai tersimpan di database, draf 3-digit otomatis terisi. Jika petugas sudah mulai mengetik atau unit sudah memiliki KM Awal tersimpan, input petugas aman 100% dan tidak pernah tertimpa.
- **Verifikasi:** Diuji pada `useBusModalOdometer.test.tsx` ("updates draft prefill when previousDayKmAkhir2 arrives asynchronously while field is empty") dan `useBusInputForm.test.tsx` ("handles late arriving previousDayKmAkhir2 without overwriting user typed values").

### Case 2: Petugas Melakukan Koreksi / Backspace pada KM Awal
- **Skenario Lapangan:** Petugas salah memasukkan KM Awal Shift 1, lalu menekan Backspace berulang kali hingga kotak input kosong untuk mengetik ulang dari awal.
- **Before:** Jika dependensi `kmAwal1` ditambahkan ke `useEffect`, transisi ke string kosong `""` akan memicu kembali efek prefill secara agresif, sehingga draf 3 digit lama langsung muncul kembali dan mengunci cursor pengguna dalam siklus yang menjengkelkan.
- **After:** Efek reaktivitas hanya bereaksi terhadap perubahan status validitas `isKmAwal1Valid`. Saat `kmAwal1` menjadi tidak valid / kosong, efek secara deterministik mereset KM Akhir 1 ke string kosong dan mengunci kembali input KM Akhir 1 (`isKmAkhir1Locked = true`). Tidak terjadi re-prefill berulang atau loop render tak terhingga.
- **Verifikasi:** Diuji pada `useBusModalOdometer.test.tsx` ("locks and clears kmAkhir1 when kmAwal1 is cleared or invalid (backspace)") dan `useBusInputForm.test.tsx` ("locks and clears paired KM Akhir when user backspaces KM Awal without re-prefill loops").

### Case 3: Bus Dinas Siang Saja (Shift 2 Mandiri)
- **Skenario Lapangan:** Bus cadangan hanya beroperasi pada Shift 2 (Shift 1 tidak jalan / kosong). Petugas membuka form untuk mengisi KM Shift 2.
- **Before:** Logika Skenario B bercampur di hook form dan berisiko terblokir oleh validasi Shift 1 yang kosong.
- **After:** Sub-hook `useBusModalOdometer` secara cerdas mendeteksi `!isS1Started`. Field KM Awal 2 otomatis terbuka dan mengambil draf prefill 3-digit dari `previousDayKmAkhir2`. Jika terdapat deviasi lintas hari antara KM Akhir kemarin dan KM Awal 2, checkbox bypass lintas hari tetap muncul secara konsisten (mempertahankan fix R102-01).
- **Verifikasi:** Diuji pada `useBusModalOdometer.test.tsx` ("Scenario B: bus operating only Shift 2 gets draft from previousDayKmAkhir2").

### Case 4: Salin KM Akhir S1 ke Awal S2 & Smart Rollover
- **Skenario Lapangan:** Odometer bus berputar melewati angka 999.999 menjadi 000.003 (rollover fisik 1 juta KM), atau petugas menekan tombol cepat "Salin KM Akhir S1 ke Awal S2".
- **Before:** Aksi rollover dan salin KM memanipulasi state yang tersebar di form hook, dengan risiko mutasi parsial pada field lain.
- **After:** Aksi `handleCopyKmAkhir1ToAwal2` menyalin nilai valid KM Akhir 1 ke KM Awal 2 secara atomik di dalam sub-hook. Smart rollover mendeteksi pembacaan odometer yang melompat dan memberikan saran rollover prefix (`rolloverSuggestionS1` / `rolloverSuggestionS2`). Saat petugas mengklik "Gunakan Saran Rollover", nilai KM diperbarui di sub-hook odometer sementara error validasi submit terkait dibersihkan di parent form hook tanpa menyentuh field lain.
- **Verifikasi:** Diuji pada `useBusModalOdometer.test.tsx` ("copies kmAkhir1 to kmAwal2 with handleCopyKmAkhir1ToAwal2" & "detects smart rollover and applies suggestion atomically") serta `useBusInputForm.test.tsx`.

---

## 4. Hasil Quality Gates & Verifikasi

Semua quality gates pada Batch 3.2 telah dijalankan dan lulus 100%:

1. **Targeted Unit & Integration Tests:**
   - Command: `pnpm exec vitest run src/components/busCard/modal/useBusModalOdometer.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx src/components/busCard/modal/fields/ src/utils/modals/busInput/ src/components/busCard/BusInputModal.test.tsx src/components/busCard/useBusCardSave.test.ts`
   - Hasil: **12 test files, 127 tests passed, 0 failed** (`refactor-ss-pdo/refact_107/evidence/targeted-tests.txt`).
2. **Standard Test Suite (`pnpm run test`):**
   - Command: `pnpm run test`
   - Hasil: **84 test files, 615 tests passed, 0 failed** (`refactor-ss-pdo/refact_107/evidence/standard-tests.txt`).
3. **Full Workspace Tests (`pnpm run test src/`):**
   - Command: `pnpm run test src/`
   - Hasil: **84 test files, 615 tests passed, 0 failed** (`refactor-ss-pdo/refact_107/evidence/src-tests.txt`).
4. **Targeted Linter (oxlint):**
   - Command: `pnpm dlx oxlint src/components/busCard/modal/useBusModalOdometer.ts src/components/busCard/modal/useBusInputForm.ts src/components/busCard/modal/useBusModalOdometer.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx`
   - Hasil: **0 errors**, **0 warnings** `react-hooks/exhaustive-deps` (`refactor-ss-pdo/refact_107/evidence/targeted-lint.txt`).
5. **TypeScript Strict & Production Build:**
   - Command: `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false`
   - Hasil: **Exit code 0**, 2043 modules transformed, bundle artifacts generated successfully (`refactor-ss-pdo/refact_107/evidence/build.txt`).
6. **Knowledge Graph (Graphify):**
   - Command: `graphify update .`
   - Hasil: AST re-extracted, graph updated (AST-only, 0 cost).

---

## 5. Batas Visual & Keputusan Arsitektur

- **Tidak Ada Perubahan UI Visual:** Tampilan modal, styling, label, tombol, dan alur form tetap 100% konsisten dengan versi sebelumnya.
- **Pemisahan Tanggung Jawab:**
  - `useBusModalOdometer.ts`: Bertanggung jawab penuh atas 4 state KM, draf prefill, validitas/lock berantai, kalkulasi jarak live, salin KM, dan aplikasi smart rollover.
  - `useBusInputForm.ts`: Bertanggung jawab atas form submit validation, sanitasi payload, status bypass checkbox lintas hari, TOA/trip, koordinasi fokus/keyboard, dan `onSave`.
- **Persiapan Batch Berikutnya:**
  - Batch 3.3: Pemisahan validasi submit dan payload assembly.
  - Batch 3.4: Single Focus UI (fokus aktif per-field).
  - Batch 3.5: Shell modal terstandardisasi (`ModalShell`).

Pekerjaan Batch 3.2 dinyatakan selesai dan **READY_FOR_REVIEW**.
