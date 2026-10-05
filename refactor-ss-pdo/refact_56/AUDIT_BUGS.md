# Audit Temuan Refact 56: Dekomposisi Modal Operasi Massal & Utilitas Alert `alertUtils.ts` (~510 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap modul utilitas modal dan alert aplikasi `src/utils/alertUtils.ts` yang memuat konfigurasi dasar SweetAlert2/Toast, notifikasi toast, dialog konfirmasi sederhana, serta modal form massal yang kompleks (`showBulkTripModal`, `showBulkCopyKmModal`, `showFormatSheetConfirm`).

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF56-ARCH-001: God File Utility `src/utils/alertUtils.ts` (510 baris)

- **Lokasi Kode**: `src/utils/alertUtils.ts` (510 baris)
- **Tingkat Keparahan**: **MEDIUM-HIGH** (Separation of Concerns & Maintainability)
- **Deskripsi Masalah**:
  Modul `alertUtils.ts` bertindak sebagai pintu gerbang alert sistem, namun menggabungkan banyak lapisan tanggung jawab yang tidak seimbang:
  1. **Konfigurasi Dasar SweetAlert2 & Toast**: Inisialisasi mixin `pdoSwal`, `pdoToast`, serta fungsi deteksi tema `getCurrentTheme`.
  2. **Notifikasi Toast Ringan**: Fungsi non-blocking `showToast`, `showSuccessToast`, `showErrorToast`, `showWarningToast`, dan `showInfoToast`.
  3. **Dialog Konfirmasi Umum**: Dialog konfirmasi logout (`showLogoutConfirm`), hapus antrean offline (`showDeleteQueueConfirm`), error alert (`showErrorAlert`), sesi kedaluwarsa (`showAuthExpiredAlert`), dan resolusi konflik sinkronisasi (`showQueueConflictDialog`).
  4. **Modal Form Massal Kompleks**:
     - `showBulkTripModal`: Form kompleks SweetAlert2 untuk mengisi kuota trip pergi dan pulang massal ke seluruh unit bus dengan validasi angka desimal, auto-focus, keyboard navigation, dan batasan operasional ($\le 20$).
     - `showBulkCopyKmModal`: Form kompleks SweetAlert2 dengan opsi radio button dinamis ("Hanya Unit Kosong" vs "Timpa Seluruh Armada") beserta rincian unit yang memiliki catatan kendala.
     - `showFormatSheetConfirm`: Dialog konfirmasi penerapan standarisasi format spreadsheet.

- **Dampak User & Pengembang**:
  - `alertUtils.ts` menjadi god file utilitas yang berat dan memuat ratusan baris HTML string SweetAlert2.
  - Berpotensi menimbulkan ketergantungan melingkar (*circular dependency*) jika modul modal lain membutuhkan instance `pdoSwal`.
  - Kurangnya pemisahan antara alert dialog umum dan alur kerja operasional massal data armada.

- **Mitigasi**:
  1. **`src/utils/swalBase.ts`** (~65 baris):
     - Mengisolasi inisialisasi murni `pdoSwal`, `pdoToast`, dan `getCurrentTheme` tanpa dependensi lain.
  2. **`src/utils/modals/bulkModals.ts`** (~260 baris):
     - Mengisolasi modal operasional massal: `showBulkTripModal`, `showBulkCopyKmModal`, dan `showFormatSheetConfirm` beserta tipe parameternya.
  3. **`src/utils/alertUtils.ts`** (~230 baris):
     - Dirampingkan dari 510 baris menjadi **~230 baris** (penurunan -280 baris / 55%) yang fokus pada toast notifikasi dan dialog konfirmasi sistem.
     - Menyediakan re-export transparan untuk menjamin 100% kompatibilitas pemanggilan (*Zero Breaking Change*).
  4. **Pengujian Unit Mandiri**:
     - `src/utils/modals/bulkModals.test.ts` (6 pengujian terdedikasi lulus 100%).
