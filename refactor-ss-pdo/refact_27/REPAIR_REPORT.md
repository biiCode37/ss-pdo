# REPAIR REPORT: BIDIRECTIONAL SHEET NAVIGATION & UI/UX CLEANUP (REFACTOR 27)

Dokumen ini mencatat implementasi pembaruan UI/UX arsitektur navigasi dua arah (Bidirectional Sheet Navigation), eliminasi redundansi tombol aksi armada di form laporan, perbaikan duplikasi teks label headway `(Menit) (Menit)`, serta penyelarasan visual kontainer modal pada SS_PDO.

---

## 1. IMPLEMENTASI PERBAIKAN

### 1.1 Navigasi 2-Arah Mulus (Status Armada ⟷ Laporan Operasional)
- **File Diubah:** `src/components/fleetStatus/FleetStatusModal.tsx` & `src/components/Dashboard.tsx`
- **Tindakan:**
  - Menambahkan prop `onNavigateToReport?: () => void` pada interface `FleetStatusModalProps`.
  - Mengimplementasikan Segmented Control identik di bagian atas modal Status Armada:
    - Tab 1: `[ 🚌 Status Armada ]` (Status aktif, elevasi kontras).
    - Tab 2: `[ 📋 Laporan Operasional ]` (Interaktif, memanggil `onNavigateToReport` seketika saat di-klik).
  - Mengubah alur tombol simpan bawah:
    - Jika dibuka dari form laporan (`onNavigateToReport` aktif), tombol bertuliskan `✓ Konfirmasi & Lanjut ke Laporan →`.
    - Setelah menyimpan ke Google Sheets dan Supabase, modal otomatis beralih ke form Laporan Operasional tanpa terlempar ke dashboard.
  - Menambahkan reload report listener pada `RouteOperationalReportCard` agar perubahan status bus dari `FleetStatusModal` otomatis ter-sinkronisasi seketika saat sheet laporan dibuka kembali.

### 1.2 Eliminasi Redundansi Tombol di Form Laporan Operasional
- **File Diubah:** `src/components/RouteOperationalReportCard.tsx`
- **Tindakan:**
  - Menghapus tombol duplikat `[ Atur Unit Armada → ]` pada header Seksi 1 (Armada).
  - Menjadikan Segmented Control di baris atas formulir sebagai satu-satunya pengendali peralihan sheet armada yang rapi, bersih, dan konsisten (*KISS / DRY*).

### 1.3 Perbaikan Teks Label Headway Tanpa Duplikasi
- **File Diubah:** `src/components/RouteOperationalReportCard.tsx`
- **Tindakan:**
  - Menghilangkan kata `(Menit)` manual dari `{TEXT_PDO_FORM.HEADWAY.FASTEST_LABEL}` dan `{TEXT_PDO_FORM.HEADWAY.SLOWEST_LABEL}`.
  - Teks kini tampil presisi: `Headway Tercepat (Menit)` dan `Headway Terlama (Menit)`.

### 1.4 Penyelarasan Dimensi & Semantik Visual Modal
- **File Diubah:** `src/components/RouteOperationalReportCard.tsx` & `src/components/fleetStatus/FleetStatusModal.tsx`
- **Tindakan:**
  - Menyeragamkan `maxWidth` kontainer dialog kedua sheet menjadi `580px` (sebelumnya melompat antara 560px dan 720px), mengeliminasi lonjakan layout saat beralih view.
  - Mengganti ikon tab Laporan Operasional dari ikon `Send` (pesawat kertas rotasi -20deg) menjadi teks rapi tanpa polusi ikon.

### 1.5 Eliminasi Polusi Ikon Dekoratif & Penghapusan Label "KUAS:"
- **File Diubah:** `src/components/fleetStatus/FleetStatusModal.tsx` & `src/components/RouteOperationalReportCard.tsx`
- **Tindakan:**
  - Menghapus label teks `"KUAS:"` sehingga baris status murni berisi tombol filter `[SGO]`, `[OFF]`, `[T.O]`, `[BA / Kendala]`.
  - Menghapus seluruh ikon dekoratif dan emoji:
    - Menghapus kotak ikon bus besar (38x38px) di header.
    - Menghapus ikon bus dan clipboard di segmented control tab.
    - Menghapus emoji matahari `🌅` dan `🌇` di tombol shift.
    - Menghapus emoji lingkaran `🟢`, `🟡`, `🔴`, `🔵` di chip status dan baris ringkasan bawah.
    - Menghapus ikon `<Sparkles>` ✨ pada tombol `SGO Semua Unit`.
    - Menghapus ikon `<Check>` ✓ pada tombol konfirmasi.
  - Mempertahankan ikon fungsional `✕` (Tutup) di pojok kanan atas untuk navigasi keluar modal yang ergonomis.

---

## 2. BEFORE VS AFTER

| Aspek | Sebelum Refactor 27 | Sesudah Refactor 27 |
| :--- | :--- | :--- |
| **Navigasi Antar Sheet** | Alur satu arah terputus: Dari Laporan bisa ke Armada, tapi dari Armada tidak ada tombol kembali ke Laporan. Klik simpan/tutup melempar user ke dashboard. | Navigasi dua arah (*true bidirectional tab switching*): Tab `[ Status Armada ]` dan `[ Laporan Operasional ]` tersedia di kedua modal. |
| **Tombol Aksi Armada di Laporan** | Redundan ganda: Ada tab Segmented Control di atas, dan ada tombol `[ Atur Unit Armada → ]` lagi tepat di bawahnya. | Bersih dan fokus: Tab Segmented Control menjadi pemicu tunggal, header Seksi 1 murni menampilkan judul seksi. |
| **Label Satuan Headway** | `Headway Tercepat (Menit) (Menit)` dan `Headway Terlama (Menit) (Menit)` (kata satuan dobel). | `Headway Tercepat (Menit)` dan `Headway Terlama (Menit)` (bersih dan baku). |
| **Ikon & Emoji di Sheet Armada** | Penuh polusi visual: Kotak bus hijau, emoji matahari `🌅`/`🌇`, emoji bulat `🟢🟡🔴🔵`, sparkle ✨, checkmark ✓, dan label jargon "KUAS:". | Ultra-clean & profesional: Tipografi tajam, warna aksen semantik murni, label "KUAS:" hilang, bebas polusi emoji. |
| **Dimensi Kontainer Modal** | Lebar melompat antara 560px (Laporan) dan 720px (Armada) pada layar desktop/tablet. | Seragam `580px` pada kedua modal, transisi terasa sangat mulus seperti satu kesatuan aplikasi iOS/Linear. |

---

## 3. CASE: SKENARIO LAPANGAN RELEVAN

### Skenario 1: Petugas Mengonfirmasi Armada Lalu Melengkapi Laporan Operasional
- **Kondisi:** Jam 05.15 pagi (awal Shift 1), petugas membuka rute JAK.15 dan membuka form laporan operasional.
- **Sebelum Perbaikan:** Petugas menekan tab Status Armada untuk menandai 2 unit bus OFF dan 1 unit bus TO. Setelah menekan konfirmasi, modal tiba-tiba tertutup rapat dan petugas terlempar ke dashboard utama. Petugas harus mengetuk tombol laporan di bar navigasi atas sekali lagi untuk mengisi data headway dan titik kemacetan.
- **Sesudah Perbaikan:** Petugas menekan tab Status Armada, menandai unit, lalu menekan `✓ Konfirmasi & Lanjut ke Laporan →`. Status armada tersimpan ke spreadsheet dan Supabase, lalu aplikasi langsung beralih kembali ke form Laporan Operasional dengan data Realops yang sudah ter-update secara otomatis.

### Skenario 2: Petugas Ingin Memeriksa Catatan Armada Saat Sedang Mengetik Isu Jalan
- **Kondisi:** Petugas sedang mengisi catatan masalah operasional di form Laporan Operasional, lalu ingin memastikan apakah bus JAK.15-03 tadi diberi keterangan OFF atau TO.
- **Sebelum Perbaikan:** Petugas beralih ke Status Armada, memeriksa bus JAK.15-03. Namun di layar tidak ada opsi untuk kembali ke Laporan, sehingga terpaksa menutup modal dan membuka ulang laporan dari nol.
- **Sesudah Perbaikan:** Petugas cukup mengetuk tab `[ 🚌 Status Armada ]` untuk melihat unit bus, lalu mengetuk kembali tab `[ 📋 Laporan Operasional ]` untuk melanjutkan pengetikan dengan mulus.

---

## 4. HASIL QUALITY GATES & VERIFIKASI

1. **Vitest Unit Tests:**
   - Command: `pnpm vitest run src/`
   - Hasil: **38 Test Files Passed (100%), 285 Tests Passed (100%)**.
2. **TypeScript Strict Mode & Vite Build:**
   - Command: `pnpm run build` (`tsc -b && vite build`)
   - Hasil: **0 Error, Build Selesai dalam 1.01 detik**.
3. **Dokumentasi & Git State:**
   - Branch: `devmode` (clean).
