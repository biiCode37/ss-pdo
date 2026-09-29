# Laporan Perbaikan Revisi Fase 3 Batch 3.2: Pembersihan Error Rollover

**Status:** `READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_111/`

---

## 1. Ringkasan Eksekutif

Revisi ini menuntaskan dua temuan review Codex dari `refact_110`:
1. **R110-01 (Koreksi Logika Pembersihan Error Rollover):** Mengganti pembersihan error berbasis pencocokan substring fragmen umum (`!err.includes("tidak boleh lebih kecil dari")`) menjadi pembersihan berbasis identitas pesan tepat yang dihasilkan validator lintas hari aktif (`getCrossDayValidationErrors(false)`) sebelum state KM berubah. Kini saat petugas menekan tombol rollover, **hanya pesan kesalahan lintas hari yang dibersihkan**, sedangkan pesan kesalahan pasangan KM dalam shift (`KM Akhir < KM Awal`), kesalahan antar-shift, atau kesalahan TOA yang masih berlaku **tetap dipertahankan secara utuh**.
2. **R110-02 (Errata Laporan Preservasi Error Lain):** Memberikan koreksi faktual atas klaim pada laporan `refact_109` yang menyatakan bahwa error validasi lain dipertahankan, meluruskan penyebab terjadinya over-filtering pada kode terdahulu, dan menyajikan bukti pengujian form campuran yang tuntas.

Seluruh quality gates telah terpenuhi (84 berkas / 622 tes lulus, 0 error linter, build lulus).

---

## 2. Before vs After

| Aspek | Kondisi Saat Review (`refact_110`) | Kondisi Setelah Revisi (`refact_111`) |
|---|---|---|
| **Metode Pembersihan Error** | Memfilter array error dengan memeriksa ketiadaan substring `"tidak boleh lebih kecil dari"` dan `"Periksa kemungkinan kepala angka"`. | Mengekstrak pesan aktif secara eksak via `getCrossDayValidationErrors(false)` sebelum rollover, lalu menghapus **hanya** pesan yang cocok persis (`!activeCrossDayErrors.includes(err)`). |
| **Pesan Error Pasangan KM (`KM Akhir < KM Awal`)** | Turut terhapus secara keliru karena templat pesannya juga mengandung kalimat `"tidak boleh lebih kecil dari"`. | **Tetap dipertahankan 100%** di dalam `validationErrors` selama angka KM Akhir belum diperbaiki oleh petugas. |
| **Pesan Error Non-KM (TOA / Trip)** | Berpotensi terhapus jika mengandung frasa yang sama (seperti `TOTAL_TOA_LESS_THAN_S1`). | Aman dari filter rollover karena pesan error non-KM tidak pernah ada dalam `activeCrossDayErrors`. |
| **Status Form Pasca-Rollover** | Form tampak valid sesaat dan tombol Simpan terlihat siap diklik, namun submit berikutnya mendadak ditolak kembali karena KM Akhir masih salah. | Form secara transparan tetap menampilkan pesan bahwa KM Akhir masih lebih kecil dari KM Awal baru, dan submit tetap ditolak hingga KM Akhir diperbaiki. |
| **Pembersihan Saat Submit Sukses** | State `validationErrors` tidak dibersihkan saat submit berhasil tanpa error. | Menambahkan `setValidationErrors([])` pada `handleFormSubmit` saat `errors.length === 0` sebelum `onSave`. |
| **Cakupan Pengujian** | 84 berkas / 620 tes lulus. Belum ada tes campuran error lintas hari + KM pair. | 84 berkas / **622 tes lulus** (+2 tes form campuran & pemulihan input baru). |

---

## 3. Case: Skenario Lapangan

### Case 1: Form Mode All dengan Error Lintas Hari & Error KM Pair Bersamaan
- **Skenario Lapangan:** Petugas di lapangan mengisi form bus pada tab Shift 1 dengan KM Awal `292003` dan KM Akhir `291900` (KM Akhir H-1 adalah `292990`). Petugas mencoba menekan tombol submit.
- **Sebelum Koreksi:** Submit ditolak dan menampilkan dua pesan kesalahan:
  1. `KM Awal Shift 1 (292003) tidak boleh lebih kecil dari Kemarin (292990)...` (lintas hari)
  2. `KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (292003)!` (pasangan KM)
  Petugas lalu menekan tombol saran rollover `"Gunakan 293003"`. Fungsi `handleApplyRollover` lama menghapus seluruh error yang memuat `"tidak boleh lebih kecil dari"`. Akibatnya, kedua pesan hilang, padahal KM Akhir `291900` jelas masih lebih kecil dari KM Awal baru `293003`! Form terlihat bersih, namun begitu tombol Simpan ditekan kembali, form langsung menolak lagi dengan error nomor 2, membuat petugas bingung.
- **Setelah Koreksi:** Sebelum memanggil `applyRollover()`, sistem memanggil `getCrossDayValidationErrors(false)` yang hanya mengembalikan pesan nomor 1. Saat saran rollover diterapkan, `kmAwal1` menjadi `293003` dan `kmAkhir1` tetap `291900`. Filter hanya menghapus pesan nomor 1. Pesan kesalahan nomor 2 **tetap muncul di layar**:
  `KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (292003)!`
  Submit tetap ditolak hingga petugas memperbaiki KM Akhir (misal menjadi `293150`). Setelah diperbaiki, form berhasil disimpan dan `validationErrors` bersih menjadi `[]`.
- **Verifikasi:** Terbukti gagal pada `refactor-ss-pdo/refact_111/evidence/reproduction-r110-01.txt` sebelum perbaikan, dan kini lulus 100% pada `useBusInputForm.test.tsx` ("R110-01 REPRODUKSI: handleApplyRollover tidak boleh menghapus error KM Akhir < KM Awal saat membersihkan error lintas hari").

### Case 2: Error Non-KM (Nilai TOA Negatif)
- **Skenario Lapangan:** Petugas salah mengetik nilai TOA Shift 1 menjadi angka negatif (misal `-5`) bersamaan dengan KM Awal yang mengalami lompatan rollover.
- **Setelah Koreksi:** Saat submit dilakukan, muncul error lintas hari dan error `Nilai TOA Shift 1 harus berupa angka positif!`. Ketika saran rollover ditekan, hanya error lintas hari yang hilang; error TOA tetap bertahan dan memandu petugas untuk mengoreksi angka TOA terlebih dahulu.
- **Verifikasi:** Lulus pada `useBusInputForm.test.tsx` ("R110-01: handleApplyRollover mempertahankan error non-KM (seperti TOA negatif)").

---

## 4. Klarifikasi Errata R110-02

Pada laporan `refact_109` (Case 3 & Before vs After), tercatat klaim bahwa error validasi lain dipertahankan saat tombol rollover ditekan. Klaim tersebut dikoreksi sebagai **errata**:
- Implementasi saat itu menggunakan pencocokan substring `!err.includes("tidak boleh lebih kecil dari")`. Karena templat pesan `KM_AKHIR_LESS_THAN_AWAL` juga mengandung teks persis tersebut, pesan kesalahan pasangan KM ikut terhapus secara tidak sengaja.
- Dengan revisi `refact_111`, mekanisme filtering kini berbasis array identitas pesan tepat (`activeCrossDayErrors`), sehingga preservasi error non-lintas hari terbukti 100% akurat secara matematis dan telah dibuktikan melalui pengujian otomatis.

---

## 5. Hasil Quality Gates & Verifikasi

Seluruh quality gates telah dijalankan dan lulus 100%:

1. **Targeted Tests:**
   - Perintah: `pnpm exec vitest run src/components/busCard/modal/useBusModalOdometer.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx src/components/busCard/modal/fields/ src/utils/modals/busInput/ src/components/busCard/BusInputModal.test.tsx src/components/busCard/useBusCardSave.test.ts`
   - Hasil: **10 test files, 123 tests passed, 0 failed** (`refactor-ss-pdo/refact_111/evidence/targeted-tests.txt`).
2. **Standard Test Suite (`pnpm run test`):**
   - Perintah: `pnpm run test`
   - Hasil: **84 test files, 622 tests passed, 0 failed** (`refactor-ss-pdo/refact_111/evidence/standard-tests.txt`).
3. **Full Workspace Tests (`pnpm run test src/`):**
   - Perintah: `pnpm run test src/`
   - Hasil: **84 test files, 622 tests passed, 0 failed** (`refactor-ss-pdo/refact_111/evidence/src-tests.txt`).
4. **Targeted Linter (oxlint):**
   - Perintah: `pnpm dlx oxlint src/components/busCard/modal/useBusModalOdometer.ts src/components/busCard/modal/useBusInputForm.ts src/components/busCard/modal/useBusModalOdometer.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx`
   - Hasil: **0 errors, 0 warnings `react-hooks/exhaustive-deps`** (`refactor-ss-pdo/refact_111/evidence/targeted-lint.txt`).
5. **TypeScript Strict & Production Build:**
   - Perintah: `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false`
   - Hasil: **Exit code 0**, 2043 modules transformed, bundle artifacts generated successfully (`refactor-ss-pdo/refact_111/evidence/build.txt`).
6. **Knowledge Graph (Graphify):**
   - Perintah: `graphify update .`
   - Hasil: AST re-extracted, code graph updated (AST-only, 0 cost).

---

## 6. Batasan & Kesiapan Review

- **Isolasi Penuh di Branch `devmode`:** Tidak ada perubahan ke branch utama.
- **Integritas Arsip:** Seluruh folder dokumentasi historis (`refact_1` s.d. `refact_110`) dan `dist_old/` tetap utuh.
- **Batasan Fase:** Batch 3.3 (pemisahan validasi submit & payload), Batch 3.4 (Single Focus UI), dan Batch 3.5 (Shell modal) belum dimulai dan menunggu instruksi setelah review Batch 3.2.

Pekerjaan revisi Batch 3.2 dinyatakan selesai dan **READY_FOR_REVIEW**.
