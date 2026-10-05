# Audit dan Status Bug Revisi Fase 3 Batch 3.1

**Status Akhir:** `RESOLVED / READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_103/`

Dokumen ini melacak resolusi tuntas atas temuan audit Codex dari `refact_102` (R102-01 dan R102-02) serta status temuan dari paket awal `refact_100` pada siklus Fase 3 Batch 3.1.

---

## 1. R102-01 — Error Lintas Hari Shift 2 Tanpa Checkbox Bypass (CLOSED)

- **Status:** **CLOSED**
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts` (`getCrossDayValidationErrors`, `hasCrossDayError`, `handleToggleBypassOdometerReset`, dan `handleFormSubmit`)
- **Keparahan:** Sedang (Operasional Lapangan & Integritas Validasi)
- **Akar Masalah:**
  - Pada mode fokus tunggal (`kmAwal2` atau `kmAkhir2`) dengan kondisi Shift 1 parsial (`kmAwal1` kosong atau draf lokal $\le$ 3 digit, `kmAkhir1` terisi angka penuh `100000`, `kmAwal2` diinput `90000`, KM akhir H-1 `120000`), submit handler mengevaluasi bahwa Shift 1 belum aktif dan memicu validasi lintas hari untuk Shift 2.
  - Sebaliknya, fungsi derivasi error lintas hari `getCrossDayValidationErrors` menganggap Shift 1 sudah aktif hanya karena `kmAkhir1` memiliki nilai, sehingga melewati evaluasi Shift 2.
  - Akibatnya, `hasCrossDayError` menghasilkan `false`, dan checkbox bypass odometer reset tidak dirender sama sekali meskipun error lintas hari Shift 2 muncul di antarmuka pengguna.
- **Implementasi Perbaikan:**
  - Menyatukan predikat Shift 1 aktif secara seragam antara derivasi error, pembersihan error saat dicentang, dan submit handler:
    ```typescript
    const hasShift1 =
      (bus.kmAwal1 && bus.kmAwal1.trim() !== "") ||
      (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3);
    ```
  - Menjadikan `getCrossDayValidationErrors(bypass)` sebagai Single Source of Truth (SSOT) untuk validasi lintas hari:
    - `hasCrossDayError` dan `handleToggleBypassOdometerReset` memanggil `getCrossDayValidationErrors(false)`.
    - `handleFormSubmit` memanggil `getCrossDayValidationErrors(bypassOdometerReset)` baik pada mode single focus maupun mode All.
- **Dampak User & Mitigasi:**
  - Petugas yang menginput data Shift 2 pada bus dengan data Shift 1 parsial kini dapat melihat checkbox bypass reset odometer, mencentangnya secara sah jika ada penggantian speedometer, dan menyimpan data tanpa terblokir.

---

## 2. R102-02 — Checkbox Bypass Hilang Jika Hanya Ada Satu Error Lintas Hari (CLOSED)

- **Status:** **CLOSED**
- **Lokasi Kode:**
  - `src/components/busCard/BusInputModal.tsx` (baris 196–292)
  - `src/components/busCard/modal/useBusInputForm.ts` (`hasCrossDayError`, `handleToggleBypassOdometerReset`)
- **Keparahan:** Sedang (UX & Kendali Interaktif Form)
- **Akar Masalah:**
  - Seluruh panel kontainer alert error dibungkus dengan kondisi guard tunggal `{form.validationErrors.length > 0 && (...) }`.
  - Ketika submit hanya menghasilkan satu-satunya error (yaitu error lintas hari), saat petugas mencentang checkbox bypass, error lintas hari tersebut dibersihkan dari state sehingga `validationErrors.length === 0`.
  - Hal ini menyebabkan kontainer parent langsung unmount dari DOM dan menghilangkan seluruh elemen di dalamnya, termasuk checkbox bypass itu sendiri. Pengguna kehilangan kontrol untuk melihat status bypass dan tidak bisa melepas centang (uncheck).
- **Implementasi Perbaikan:**
  - Memperluas kondisi render kontainer panel menjadi:
    ```tsx
    {(form.validationErrors.length > 0 || form.hasCrossDayError) && (
      ...
    )}
    ```
  - Memisahkan render daftar teks alert error (`<ul>`) dan header `AlertCircle` agar hanya muncul jika `form.validationErrors.length > 0`.
  - Menyesuaikan styling panel secara dinamis:
    - Merah lembut (`rgba(239, 68, 68, 0.15)`) jika masih ada error aktif.
    - Biru info lembut (`rgba(56, 189, 248, 0.1)`) jika daftar error sudah bersih tetapi checkbox bypass masih aktif.
  - Mempertahankan checkbox bypass tetap ada di DOM dengan status checked saat bypass aktif, sehingga pengguna dapat melepas centang kapan saja. Melepas centang dan men-submit ulang akan mengevaluasi kembali error lintas hari secara akurat.
- **Dampak User & Mitigasi:**
  - Pengguna memiliki kendali penuh dua arah: checkbox bypass tetap terlihat dan interaktif setelah dicentang; jika batal, pengguna cukup melepas centang dan submit ulang.

---

## 3. Matriks Status Seluruh Temuan Fase 3 Batch 3.1

| ID Temuan | Komponen / Berkas | Deskripsi Singkat | Status Batch 3.1 |
|---|---|---|---|
| **R100-01** | `BusInputModal.tsx` | Mutasi langsung `validationErrors.length = 0` | **CLOSED** (diganti updater fungsional) |
| **R100-02** | `useBusInputForm.ts` $\to$ `busModalOdometer.ts` | Duplikasi logika sanitasi KM awal/akhir | **CLOSED** (diekstraksi & diuji unit 100%) |
| **R100-03** | `useBusInputForm.ts` | 4 `useEffect` prefill/sinkronisasi bertumpuk | **TRACKED** (dialokasikan ke Batch 3.2) |
| **R100-04** | `BusInputModal.tsx`, `useBusInputForm.ts` | Fallback hardcoded label trip | **CLOSED** (dimigrasikan ke `text_alerts.ts`) |
| **R100-05** | `BusInputModal.tsx` | Migrasi ke `ModalShell` standar | **TRACKED** (dialokasikan ke Batch 3.5) |
| **R102-01** | `useBusInputForm.ts` | Checkbox bypass tidak muncul pada Shift 1 parsial S2 | **CLOSED** (SSOT `getCrossDayValidationErrors`) |
| **R102-02** | `BusInputModal.tsx` | Checkbox bypass unmount saat error lintas hari dicentang | **CLOSED** (panel tetap mounted saat bypass aktif) |

---

## 4. Bukti Verifikasi Pengujian

Seluruh bukti verifikasi disimpan pada subdirektori `refactor-ss-pdo/refact_103/evidence/`:
1. `reproduction-r102.test.tsx`: Pengujian perilaku bug sebelum perbaikan.
2. `repro-failing-before-fix.log`: Log kegagalan 2 tes ekspektasi sebelum perbaikan.
3. `targeted-tests.txt`: Hasil pengujian terarah (5 berkas, 80 tes lulus 100%).
4. `full-suite-tests.txt`: Hasil pengujian seluruh vitest suite (83 berkas, 604 tes lulus 100%).
5. `targeted-lint.txt`: Laporan oxlint terarah (0 error, 11 baseline warning terjaga).
6. `build.txt`: Hasil build produksi TypeScript + Vite (`pnpm exec vite build --emptyOutDir false`, exit code 0).
7. `git-status.txt`: Snapshot status git branch `devmode`.
