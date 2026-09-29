# Audit dan Status Bug Revisi Fase 3 Batch 3.2: Pembersihan Error Rollover

**Status Akhir:** `RESOLVED / READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_111/`

Dokumen ini mencatat resolusi atas temuan audit Codex dari `refact_110` (**R110-01** dan **R110-02**) terkait pembersihan error validasi saat smart rollover diaplikasikan serta koreksi errata atas klaim laporan sebelumnya.

---

## 1. R110-01 — Pembersihan Error Rollover Menggunakan Substring Fragmen Umum Menghapus Error KM Pair (CLOSED)

- **Status:** **CLOSED**
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts:273-284`
  - `src/components/busCard/modal/useBusInputForm.test.tsx` (Uji form-level error campuran & pemulihan)
- **Keparahan:** Sedang (Kejelasan Validasi Operasional & Integritas Status Form)
- **Akar Masalah:**
  - Pada implementasi sebelumnya, `handleApplyRollover` membersihkan error dengan mencocokkan potongan string umum:
    ```typescript
    prev.filter(
      (err) =>
        !err.includes("tidak boleh lebih kecil dari") &&
        !err.includes("Periksa kemungkinan kepala angka"),
    )
    ```
  - Frasa `"tidak boleh lebih kecil dari"` digunakan oleh **dua jenis pesan validasi yang berbeda**:
    1. Error lintas hari: `KM Awal Shift 1 (292003) tidak boleh lebih kecil dari Kemarin (292990)...` (`TEXT_ALERTS.BUS_INPUT_MODAL.KM_AWAL_LESS_THAN_PREVIOUS_DAY`)
    2. Error KM pair dalam shift: `KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (292003)!` (`TEXT_ALERTS.BUS_INPUT_MODAL.KM_AKHIR_LESS_THAN_AWAL`)
    3. Error TOA: `Total TOA (...) tidak boleh lebih kecil dari TOA Shift 1 (...)`
  - Jika seorang petugas mengisi KM Awal `292003` dan KM Akhir `291900` pada saat H-1 `292990`, kedua error (lintas hari dan KM pair) muncul saat submit.
  - Ketika petugas mengklik tombol "Gunakan 293003", filter string umum tersebut menghapus **KEDUA** error, padahal KM Akhir `291900` masih lebih kecil dari KM Awal baru `293003` dan belum diperbaiki. Form tampak bebas error sesaat, namun tombol submit berikutnya tetap menolak, menimbulkan kebingungan bagi pengguna.
- **Implementasi Perbaikan:**
  1. **Pencocokan Pesan Tepat dengan SSOT (`getCrossDayValidationErrors`):**
     - Sebelum `odometer.applyRollover()` mengubah state KM, tangkap daftar pesan error lintas hari yang aktif menggunakan validator yang sama:
       ```typescript
       const handleApplyRollover = () => {
         // 1. Dapatkan pesan error lintas hari aktif sebelum state KM berubah (R110-01)
         const activeCrossDayErrors = getCrossDayValidationErrors(false);
         
         // 2. Terapkan pembaruan rollover pada sub-hook odometer
         const applied = odometer.applyRollover();
         
         // 3. Bersihkan HANYA pesan error lintas hari tersebut dengan pencocokan tepat
         if (applied) {
           setValidationErrors((prev) =>
             prev.filter((err) => !activeCrossDayErrors.includes(err)),
           );
         }
       };
       ```
  2. **Preservasi Error Validasi Lain:**
     - Error KM pair (`validateKmPair`), error antar-shift (`validateKmCrossShift`), error TOA, dan error trip tidak berada di dalam `activeCrossDayErrors`, sehingga tidak pernah terhapus secara tidak sengaja.
  3. **Pembersihan State pada Submit Sukses:**
     - Menambahkan pemanggilan `setValidationErrors([])` pada `handleFormSubmit` saat seluruh validasi lolos (`errors.length === 0`), sehingga form bersih setelah penyimpanan berhasil.
- **Dampak User & Mitigasi:**
  - Petugas mendapatkan umpan balik yang akurat: error lintas hari hilang setelah saran rollover diterapkan, tetapi error KM Akhir < KM Awal (jika ada) tetap terlihat jelas hingga angka KM Akhir diperbaiki.

---

## 2. R110-02 — Errata Laporan Terkait Preservasi Error Lain (CLOSED)

- **Status:** **CLOSED (ERRATA TERCATAT)**
- **Lokasi Dokumen:**
  - `refactor-ss-pdo/refact_109/REPAIR_REPORT.md`, bagian Case 3 dan Before vs After
- **Keparahan:** Rendah (Akurasi Dokumentasi & Audit Kualitas)
- **Koreksi Fakta (Errata):**
  - Pada laporan `refact_109`, dinyatakan bahwa `handleApplyRollover` mempertahankan pesan kesalahan validasi field lain. Klaim ini belum sepenuhnya tepat pada saat review karena filter string `"tidak boleh lebih kecil dari"` secara tidak sengaja ikut menghapus error KM pair yang mengandung frasa yang sama.
  - Melalui revisi `refact_111`, klaim ini kini telah terbukti secara spesifik dan lulus pengujian form campuran dengan bukti tes terdedikasi (`useBusInputForm.test.tsx`).

---

## 3. Matriks Status Temuan Fase 3

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
| **R108-01** | `useBusModalOdometer.ts` | Kesamaan string KM Awal memicu target rollover salah | **CLOSED** (Batch 3.2 Rev) |
| **R108-02** | `AUDIT_BUGS.md` / `REPAIR_REPORT.md` | Errata klaim baris kode & fungsi reset fiktif | **CLOSED** (Batch 3.2 Rev) |
| **R110-01** | `useBusInputForm.ts` | Aksi rollover menghapus error KM pair yang masih berlaku | **CLOSED** (Batch 3.2 Final) |
| **R110-02** | `REPAIR_REPORT.md` | Errata klaim preservasi error lain di `refact_109` | **CLOSED** (Batch 3.2 Final) |

---

## 4. Bukti Verifikasi Pengujian & Kualitas

Seluruh berkas bukti eksekusi disimpan pada folder `refactor-ss-pdo/refact_111/evidence/`:
1. `reproduction-r110-01.txt`: Bukti kegagalan tes reproduksi sebelum perbaikan R110-01 dieksekusi.
2. `targeted-tests.txt`: Eksekusi 10 berkas tes terkait odometer, form modal, kartu bus, dan save (10 files, 123 tests passed, 0 failed).
3. `standard-tests.txt`: Eksekusi `pnpm run test` tanpa filter (84 test files, 622 tests passed, 0 failed).
4. `src-tests.txt`: Eksekusi `pnpm run test src/` (84 test files, 622 tests passed, 0 failed).
5. `targeted-lint.txt`: Eksekusi oxlint pada berkas yang disentuh (0 error, 0 warning `exhaustive-deps`).
6. `build.txt`: Eksekusi `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false` (exit code 0, 2043 modules transformed).
7. `git-status.txt`: Snapshot status git branch `devmode`.
