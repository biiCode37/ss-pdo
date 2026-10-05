# Laporan Perbaikan Revisi Fase 3 Batch 3.2: Sub-hook Odometer

**Status:** `READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_109/`

---

## 1. Ringkasan Eksekutif

Revisi ini menuntaskan dua temuan review Codex dari `refact_108`:
1. **R108-01 (Koreksi Logika Pemilihan Target Rollover):** Mengganti mekanisme pemilihan target pembaruan rollover dari perbandingan kesamaan nilai string (`targetKmAwalForRollover === kmAwal2`) menjadi identitas shift eksplisit (`rolloverTargetShift: "shift1" | "shift2" | null`). Kini saat modal berada di tab Shift 1 dan nilai KM Awal kedua shift sama (`kmAwal1 === kmAwal2`), penerapan saran rollover secara deterministik hanya memperbarui Shift 1 dan mempertahankan nilai Shift 2.
2. **R108-02 (Errata Laporan & Lifecycle Modal):** Memberikan koreksi faktual atas ukuran baris berkas aktual (`useBusModalOdometer.ts`: **451 baris**, `useBusInputForm.ts`: **722 baris**) dan meluruskan bahwa fungsi `resetOdometerStates` fiktif memang tidak ada serta tidak dibutuhkan karena arsitektur lifecycle modal yang berbasis *fresh mount* kondisional pada `BusCard.tsx`.

Seluruh quality gates telah terpenuhi (84 file / 620 tests passed, 0 error linter, build lulus).

---

## 2. Before vs After

| Aspek | Kondisi Saat Review (`refact_107` / `refact_108`) | Kondisi Setelah Revisi (`refact_109`) |
|---|---|---|
| **Penentuan Target Rollover** | Menggunakan kesamaan nilai string `targetKmAwalForRollover === kmAwal2` untuk menentukan apakah Shift 2 yang diperbarui. | Menggunakan identitas shift eksplisit `rolloverTargetShift: "shift1" | "shift2" | null` yang diturunkan dari mode/tab aktif. |
| **Kasus Nilai KM Awal Sama (`kmAwal1 === kmAwal2`)** | Petugas menekan saran rollover Shift 1, tetapi `kmAwal2` yang berubah ke `293003`, sedangkan `kmAwal1` tertinggal pada `292003`. | Petugas menekan saran rollover Shift 1, `kmAwal1` berubah ke `293003`, dan `kmAwal2` **tetap `292003`** secara utuh. |
| **Rollover Shift 2 (Dinas Siang Saja)** | Berpotensi tertukar jika nilai identik dengan draf Shift 1. | `rolloverTargetShift === "shift2"` secara terisolasi memperbarui `kmAwal2` tanpa menyentuh Shift 1. |
| **Pembersihan Error di Form** | Koordinasi `handleApplyRollover` diuji pada kasus sederhana. | Diperkuat dengan pengujian form ketika kedua shift terisi dan memastikan error rollover dibersihkan tanpa menghilangkan pesan validasi shift lain. |
| **Akurasi Ukuran Berkas** | Diklaim 190 baris (`useBusModalOdometer.ts`) dan 235 baris (`useBusInputForm.ts`). | **Errata dicatat:** Berkas aktual masing-masing adalah **451 baris** dan **722 baris**. |
| **Klaim Fungsi Reset Odometer** | Diklaim menyediakan helper `resetOdometerStates`. | **Errata dicatat:** Fungsi tidak ada dan tidak diperlukan karena modal di-mount ulang secara segar saat dibuka/berganti unit. |
| **Cakupan Pengujian** | 84 berkas / 615 tes lulus. | 84 berkas / **620 tes lulus** (+5 tes regresi & karakterisasi baru). |

---

## 3. Case: Skenario Lapangan

### Case 1: Tab Shift 1 Aktif dengan KM Awal Shift 1 & 2 Bernilai Sama
- **Skenario Lapangan:** Petugas membuka form bus yang kemarin mencatat KM Akhir `292990`. Di lapangan, KM Awal Shift 1 dan 2 sama-sama terisi `292003` (misal karena hasil copy KM sebelumnya atau pengisian parsial). Tab yang sedang aktif adalah Shift 1. Form mendeteksi lompatan angka ribuan dan menampilkan tombol saran rollover: `"Gunakan 293003 (+13 KM)"`.
- **Before:** Petugas mengklik tombol saran rollover Shift 1. Karena kode mengecek `targetKmAwalForRollover === kmAwal2`, kondisi tersebut bernilai `true` (`"292003" === "292003"`). Sistem justru mengubah KM Awal Shift 2 menjadi `293003`, sedangkan KM Awal Shift 1 yang bermasalah tetap `292003`.
- **After:** Sistem mengevaluasi `rolloverTargetShift` yang menghasilkan `"shift1"`. Saat saran diaplikasikan, `setKmAwal1("293003")` dipanggil. `kmAwal1` menjadi `293003`, `kmAkhir1` disiapkan prefill `293`, dan `kmAwal2` **tetap `292003`** tanpa mengalami mutasi apa pun.
- **Verifikasi:** Terbukti gagal pada `refactor-ss-pdo/refact_109/evidence/reproduction-r108-01.txt` sebelum perbaikan, dan kini lulus 100% pada Test 9 `useBusModalOdometer.test.tsx` serta uji form `useBusInputForm.test.tsx`.

### Case 2: Bus Dinas Siang Saja (Shift 2 Mandiri)
- **Skenario Lapangan:** Bus cadangan hanya beroperasi siang (Shift 1 kosong murni). Petugas berada di tab Shift 2 atau mode Single Focus `kmAwal2`, memasukkan `292003` saat H-1 `292990`.
- **Before:** Penentuan target mengandalkan perbandingan nilai yang rawan bug jika draf Shift 1 tidak kosong.
- **After:** Evaluasi `rolloverTargetShift` memeriksa `hasShift1`: karena Shift 1 kosong, target ditentukan secara eksplisit sebagai `"shift2"`. Saat saran diterapkan, hanya `kmAwal2` yang diubah ke `293003`, sementara `kmAwal1` tetap pada draf prefill H-1 tanpa terpengaruh.
- **Verifikasi:** Diuji pada Test 10 dan Test 11 `useBusModalOdometer.test.tsx`.

### Case 3: Pembersihan Error di Form Hook (`useBusInputForm`)
- **Skenario Lapangan:** Form submit ditolak karena error lintas hari (`292003 < 292990`). Petugas mengklik tombol saran rollover.
- **Before:** Perlu kepastian bahwa error rollover terhapus dari `validationErrors` tanpa menghapus error validasi bisnis lainnya (seperti "KM Akhir Shift 1 wajib diisi sebelum Shift 2").
- **After:** `handleApplyRollover` mengeksekusi `odometer.applyRollover()` dan membersihkan pesan kesalahan yang berkaitan dengan perbandingan kemarin (`!err.includes("tidak boleh lebih kecil dari")`), sementara pesan kesalahan validasi field lain tetap dipertahankan.
- **Verifikasi:** Diuji pada `useBusInputForm.test.tsx` ("R108-01: handleApplyRollover pada form ketika kmAwal1 dan kmAwal2 bernilai sama (292003)...").

---

## 4. Klarifikasi Lifecycle Modal Aktual (Errata R108-02)

Pada dokumen `refact_107`, sempat disebutkan adanya fungsi `resetOdometerStates` untuk mereset odometer saat unit bus berganti. Klaim ini adalah keliru (**errata**) karena:
1. **Pola Rendering Conditional Modal:**
   Pada [BusCard.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/BusCard.tsx#L178-L192):
   ```tsx
   {isModalOpen && (
     <BusInputModal
       isOpen={isModalOpen}
       onClose={handleCloseModal}
       bus={{ ...bus, ...formData }}
       // ...
     />
   )}
   ```
   Modal tidak pernah dibiarkan tetap mounted saat tertutup untuk menunggu unit lain.
2. **Fresh Mount Lifecycle:**
   Setiap kali modal dibuka untuk unit bus mana pun, React memasang instance baru `BusInputModal`. Hook `useBusInputForm` dan `useBusModalOdometer` diinisialisasi ulang dari awal (*initial state evaluation*) menggunakan nilai props `bus` saat itu.
3. **Prinsip YAGNI & Zero Over-Engineering:**
   Karena siklus unmount/mount telah menjamin isolasi state antar-unit bus, penambahan fungsi reset manual adalah kode mati (*dead code*) yang tidak memiliki pemanggil sah dan tidak diperlukan.

---

## 5. Hasil Quality Gates & Verifikasi

Seluruh quality gates telah dijalankan dan lulus 100%:

1. **Targeted Tests:**
   - Perintah: `pnpm exec vitest run src/components/busCard/modal/useBusModalOdometer.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx src/components/busCard/modal/fields/ src/utils/modals/busInput/ src/components/busCard/BusInputModal.test.tsx src/components/busCard/useBusCardSave.test.ts`
   - Hasil: **10 test files, 121 tests passed, 0 failed** (`refactor-ss-pdo/refact_109/evidence/targeted-tests.txt`).
2. **Standard Test Suite (`pnpm run test`):**
   - Perintah: `pnpm run test`
   - Hasil: **84 test files, 620 tests passed, 0 failed** (`refactor-ss-pdo/refact_109/evidence/standard-tests.txt`).
3. **Full Workspace Tests (`pnpm run test src/`):**
   - Perintah: `pnpm run test src/`
   - Hasil: **84 test files, 620 tests passed, 0 failed** (`refactor-ss-pdo/refact_109/evidence/src-tests.txt`).
4. **Targeted Linter (oxlint):**
   - Perintah: `pnpm dlx oxlint src/components/busCard/modal/useBusModalOdometer.ts src/components/busCard/modal/useBusInputForm.ts src/components/busCard/modal/useBusModalOdometer.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx`
   - Hasil: **0 errors, 0 warnings `react-hooks/exhaustive-deps`** (`refactor-ss-pdo/refact_109/evidence/targeted-lint.txt`).
5. **TypeScript Strict & Production Build:**
   - Perintah: `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false`
   - Hasil: **Exit code 0**, 2043 modules transformed, bundle artifacts generated successfully (`refactor-ss-pdo/refact_109/evidence/build.txt`).
6. **Knowledge Graph (Graphify):**
   - Perintah: `graphify update .`
   - Hasil: AST re-extracted, code graph updated (AST-only, 0 cost).

---

## 6. Batasan & Kesiapan Review

- **Tetap di Branch `devmode`:** Tidak ada modifikasi ke branch lain. Seluruh arsip lama (`refact_1` s.d. `refact_108`) dan direktori `dist_old/` tetap utuh.
- **Cakupan Terisolasi:** Hanya menyentuh perbaikan R108-01 dan errata R108-02. Tidak menyentuh pekerjaan Batch 3.3, 3.4, atau 3.5.

Pekerjaan revisi Batch 3.2 dinyatakan selesai dan **READY_FOR_REVIEW**.
