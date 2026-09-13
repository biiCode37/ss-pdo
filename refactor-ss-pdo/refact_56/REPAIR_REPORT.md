# Repair Report Refact 56: Dekomposisi Modal Operasi Massal & Utilitas Alert (alertUtils)

Dokumen ini memuat laporan teknis implementasi modularisasi `src/utils/alertUtils.ts` menjadi submodul mandiri `src/utils/swalBase.ts` dan `src/utils/modals/bulkModals.ts`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Modul Terfokus

1. **`src/utils/swalBase.ts`**:
   - Menyediakan instance `pdoSwal` (SweetAlert2 dengan styling custom tema SS_PDO, kurva animasi Apple, tombol borderless).
   - Menyediakan instance `pdoToast` (Toast non-blocking dengan timer 3 detik dan pause on hover).
   - Menyediakan utilitas `getCurrentTheme` untuk membaca tema aktif dari atribut DOM `data-theme`.

2. **`src/utils/modals/bulkModals.ts`**:
   - `showBulkTripModal`: Form SweetAlert2 untuk pengisian kuota trip operasional massal (Trip Pergi & Trip Pulang) ke seluruh armada aktif, dilengkapi validasi batasan ritase maksimal 20 trip.
   - `showBulkCopyKmModal`: Form radio selector interaktif untuk menyalin KM Akhir Shift 1 ke KM Awal Shift 2 secara massal, mendeteksi unit yang memiliki catatan kendala/BAP.
   - `showFormatSheetConfirm`: Dialog konfirmasi untuk standarisasi styling spreadsheet tab Google Sheets.

3. **`src/utils/alertUtils.ts` (Orchestrator Toast & Dialog Ringan)**:
   - Berkurang dari 510 baris menjadi **230 baris** (penurunan -280 baris / 55%).
   - Murni menangani notifikasi toast (`showToast`, `showSuccessToast`, `showErrorToast`, `showWarningToast`, `showInfoToast`) dan dialog konfirmasi sistem (`showLogoutConfirm`, `showDeleteQueueConfirm`, `showErrorAlert`, `showAuthExpiredAlert`, `showQueueConflictDialog`).
   - Menyediakan re-export lengkap dari `swalBase.ts` dan `bulkModals.ts` sehingga seluruh pemanggilan di seluruh aplikasi tetap bekerja 100% tanpa perubahan.

4. **Pengujian Unit Mandiri**:
   - `src/utils/modals/bulkModals.test.ts`: 6 skenario pengujian komprehensif (konfirmasi dan pembatalan trip massal, opsi radio copy KM, serta konfirmasi format sheet).

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 56 (Before) | Sesudah Refactor 56 (After) |
| :--- | :--- | :--- |
| **Ukuran `alertUtils.ts`** | 510 baris (God file gabungan alert & form) | **230 baris** (Penurunan -280 baris / 55%) |
| **Pemisahan Base SweetAlert** | Tertanam langsung di `alertUtils.ts` | Diisolasi bersih di `src/utils/swalBase.ts` |
| **Pemisahan Modal Operasi Massal** | HTML string trip & copy KM bercampur di alert umum | Diisolasi penuh ke `src/utils/modals/bulkModals.ts` |
| **Kamus Teks Sentral** | - | 100% menggunakan entri kamus terpusat di `text_alerts.ts` |
| **Integritas Unit Test** | - | **6/6 tests passed** pada `bulkModals.test.ts`, total **51/51 test files passed (375 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (940ms)** |
| **Knowledge Graph** | - | Graphify 3.599 nodes, 4.627 edges, 323 communities terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Mengisi Target Ritase Harian ke Seluruh Armada Bus Sekaligus
- **Kondisi**: Petugas operasional di awal hari ingin menetapkan target 2 trip pergi dan 2 trip pulang untuk 15 armada bus rute JAK.15.
- **Before**: Form trip massal dieksekusi dari file monolitik alert umum yang padat.
- **After**: `showBulkTripModal` dari `bulkModals.ts` menampilkan formulir beranimasi pegas dengan kontras warna light/dark yang indah, memvalidasi kuota secara presisi, dan mengirimkan hasil trip yang siap disebarkan ke seluruh baris armada dalam hitungan detik.

### Case 2: Pergantian Shift Siang Menuntut Salin Odometer Massal
- **Kondisi**: Petugas shift 2 ingin menyalin angka KM Akhir Shift 1 ke KM Awal Shift 2 untuk armada yang masih kosong, tanpa menimpa unit yang sudah memiliki catatan perbaikan di bengkel.
- **After**: `showBulkCopyKmModal` menyajikan ringkasan unit yang memenuhi syarat beserta peringatan unit yang dilewati karena memiliki catatan kendala, memberikan pilihan kontrol penuh kepada pengawas di lapangan.
