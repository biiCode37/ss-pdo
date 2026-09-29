# Audit dan Status Bug Revisi Fase 3 Batch 3.2: Sub-hook Odometer

**Status Akhir:** `RESOLVED / READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_107/`

Dokumen ini mencatat resolusi tuntas atas temuan arsitektural **R100-03** dan penyelesaian seluruh lingkup kerja **Fase 3 Batch 3.2 (Sub-hook Odometer)** sesuai dengan `refactor-ss-pdo/refact_100/PHASE_03_BATCH_PLAN.md` dan `refact_106/GEMINI_PHASE_03_BATCH_02.md`.

---

## 1. R100-03 — Ekstraksi Sub-hook Odometer & Resolusi Semantis 4 Warning `exhaustive-deps` (CLOSED)

- **Status:** **CLOSED**
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusModalOdometer.ts` (Sub-hook baru mandiri)
  - `src/components/busCard/modal/useBusInputForm.ts` (Integrasi dan pendelegasian tanggung jawab)
  - `src/components/busCard/modal/useBusModalOdometer.test.tsx` (Uji unit & integrasi sub-hook)
  - `src/components/busCard/modal/useBusInputForm.test.tsx` (Uji regresi form modal)
- **Keparahan:** Tinggi (Arsitektur State, Reaktivitas Odometer, & Stabilitas Form Input)
- **Akar Masalah:**
  1. **God-Hook & Tanggung Jawab Campur Aduk:** Hook `useBusInputForm.ts` menampung lebih dari 380 baris kode yang mencampuradukkan manajemen 4 state KM, status draf prefill 3 digit, validitas/lock berantai Shift 1 & 2, kalkulasi jarak live, saran smart rollover, sanitasi input, validasi submit lintas hari, keyboard/focus orchestration, serta pengiriman payload `onSave`.
  2. **Empat Warning `react-hooks/exhaustive-deps`:** Terdapat 4 peringatan linter React Hooks pada efek sinkronisasi KM:
     - `kmAwal1` dibaca di dalam efek sinkronisasi `previousDayKmAkhir2`.
     - `kmAkhir1` dibaca di dalam efek reaktivitas `kmAwal1`.
     - `kmAkhir2` dibaca di dalam efek reaktivitas `kmAwal2`.
     - `kmAwal2` dibaca di dalam efek sinkronisasi Shift 2 mandiri (Skenario B).
  3. **Risiko Regresi UX bila Dependensi Ditambahkan Membabi Buta:** Jika state KM langsung dimasukkan ke dalam dependency array efek, setiap kali pengguna menghapus atau mengoreksi angka (misal menekan Backspace hingga input kosong), efek akan terpicu ulang pada render berikutnya dan secara agresif menimpa input kosong tersebut kembali dengan draf prefill 3 digit.
- **Implementasi Perbaikan:**
  1. **Pembuatan Sub-hook `useBusModalOdometer`:**
     - Mengisolasi 4 state KM: `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`.
     - Mengisolasi status draf 3 digit: `isKmAwal1DraftOnly`, `isKmAkhir1DraftOnly`, `isKmAwal2DraftOnly`, `isKmAkhir2DraftOnly`.
     - Mengisolasi validitas dan lock berantai: `isKmAwal1Valid`, `isKmAkhir1Locked`, `isKmAwal2Valid`, `isKmAkhir2Locked`.
     - Mengisolasi kalkulasi jarak live dan estimasi trip: `liveKmS1`, `liveTripS1`, `liveKmS2`, `liveTripS2`.
     - Mengisolasi aksi salin KM: `handleCopyKmAkhir1ToAwal2` (menyalin KM Akhir S1 ke Awal S2).
     - Mengisolasi deteksi & aplikasi smart rollover: `rolloverSuggestionS1`, `rolloverSuggestionS2`, `applyRolloverS1`, `applyRolloverS2`.
     - Menyediakan fungsi reset: `resetOdometerStates` saat modal berganti unit bus.
  2. **Resolusi Semantis 4 Warning `exhaustive-deps` (0 Warning, 0 `eslint-disable`):**
     - Menggunakan React functional updater `setKm((current: string) => { ... })` di dalam seluruh efek sinkronisasi.
     - Variabel state lokal `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2` tidak lagi dibaca pada scope penutupan luar efek, sehingga linter tidak menuntut variabel state masuk ke dependency array.
     - Dependensi efek murni hanya bereaksi terhadap masukan eksternal dan transisi status validitas:
       - Prefill KM Awal S1: `[previousDayKmAkhir2, bus.kmAwal1]`
       - Prefill KM Akhir S1: `[isKmAwal1Valid, kmAwal1]`
       - Prefill KM Akhir S2: `[isKmAwal2Valid, kmAwal2]`
       - Prefill KM Awal S2 (Shift 2 mandiri): `[!isS1Started, bus.kmAwal2, previousDayKmAkhir2]`
     - **Hasil:** 4 warning `exhaustive-deps` hilang 100% tanpa satu pun directive `eslint-disable`.
  3. **Pemberian Proteksi Anti-Overwrite & Siklus Backspace:**
     - Functional updater memeriksa kondisi nilai saat ini: jika pengguna sedang mengosongkan field (`current === ""` atau pengguna telah mengisi nilai penuh), efek tidak memaksakan draf kembali.
     - Transisi dari valid ke tidak valid (misal pengguna menghapus KM Awal) secara otomatis mereset dan mengunci kembali field KM Akhir pasangannya secara deterministik tanpa loop render.
  4. **Preservasi Kontrak Return & Arsitektur Form:**
     - Kontrak pengembalian `useBusInputForm` dipertahankan 100% identik sehingga seluruh komponen konsumen (`BusInputModal.tsx`, field-field input, tombol Salin KM, alert rollover, serta tes integrasi) berfungsi tanpa perubahan antarmuka.
     - Pembersihan error validasi saat rollover diaplikasikan (`handleApplyRollover`) tetap ditangani pada lapisan form hook melalui koordinasi hasil kembalian sub-hook odometer.

---

## 2. Matriks Status Temuan Fase 3

| ID Temuan | Komponen / Berkas | Deskripsi Singkat | Status Siklus |
|---|---|---|---|
| **R100-01** | `BusInputModal.tsx` | Mutasi langsung `validationErrors.length = 0` | **CLOSED** (Batch 3.1) |
| **R100-02** | `useBusInputForm.ts` $\to$ `busModalOdometer.ts` | Duplikasi logika sanitasi KM awal/akhir | **CLOSED** (Batch 3.1) |
| **R100-03** | `useBusInputForm.ts` $\to$ `useBusModalOdometer.ts` | Sub-hook odometer & 4 `useEffect` exhaustive-deps | **CLOSED** (Batch 3.2) |
| **R100-04** | `BusInputModal.tsx`, `useBusInputForm.ts` | Fallback hardcoded label trip | **CLOSED** (Batch 3.1) |
| **R100-05** | `BusInputModal.tsx` | Migrasi ke `ModalShell` standar | **TRACKED** (Batch 3.5) |
| **R102-01** | `useBusInputForm.ts` | Checkbox bypass tidak muncul pada Shift 1 parsial S2 | **CLOSED** (Batch 3.1 Rev) |
| **R102-02** | `BusInputModal.tsx` | Checkbox bypass unmount saat error lintas hari dicentang | **CLOSED** (Batch 3.1 Rev) |
| **R104-01** | `vite.config.ts` | Berkas bukti `refactor-ss-pdo/**` terpindai oleh `pnpm run test` | **CLOSED** (Batch 3.1 Gate) |

---

## 3. Bukti Verifikasi Pengujian & Kualitas

Seluruh berkas bukti eksekusi disimpan pada folder `refactor-ss-pdo/refact_107/evidence/`:
1. `targeted-tests.txt`: Eksekusi 12 berkas tes terkait odometer, form modal, kartu bus, dan save (12 files, 127 tests passed, 0 failed).
2. `src-tests.txt`: Eksekusi `pnpm run test src/` (84 test files, 615 tests passed, 0 failed).
3. `standard-tests.txt`: Eksekusi `pnpm run test` tanpa filter (84 test files, 615 tests passed, 0 failed).
4. `targeted-lint.txt`: Eksekusi oxlint pada berkas yang disentuh (0 error, 0 warning `exhaustive-deps`).
5. `build.txt`: Eksekusi `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false` (exit code 0, 2043 modules transformed).
6. `git-status.txt`: Snapshot status git branch `devmode`.
