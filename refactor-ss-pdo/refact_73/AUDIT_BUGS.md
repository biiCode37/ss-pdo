# 📋 Audit Bugs: Refactor 73 — Direct Ingestion 18 Rute Individu ke Supabase & Eliminasi Ketergantungan SS Global

Dokumen audit ini mencatat analisis akar masalah arsitektur pembacaan Spreadsheet Global Wilayah dan transformasi menuju Direct Ingestion rute individu ke tabel Supabase `daily_route_reports`.

---

## Daftar Temuan Masalah

### BUG-73-01: Ketergantungan Rapuh pada Dokumen SS Global Tidak Resmi & Inkonsistensi Ground Truth
- **Lokasi Kode:** `src/services/googleSheets/globalReportReader.ts`, `src/services/allRouteMonitoringService.ts`.
- **Keparahan:** 🔴 Kritis (High / Data Inconsistency & Single Point of Failure).
- **Deskripsi:** 
  1. Sebelumnya, halaman Monitoring Wilayah bergantung pada Spreadsheet Global Wilayah (`SS Global`) untuk membaca rekap harian 18 rute.
  2. Berdasarkan investigasi lapangan, SS Global bukanlah format resmi kantor Transjakarta, melainkan spreadsheet inisiatif internal korwil/korlap. Sebagian petugas lapangan mengisi laporan di Google Sheet rute masing-masing (ground truth), sedangkan SS Global sering terlambat diperbarui atau memiliki rumus referensi eksternal yang rentan rusak.
  3. Pimpinan dan korlap hanya memerlukan angka ringkasan harian yang akurat tanpa peduli dari spreadsheet mana data tersebut ditarik.
- **Dampak User:** Jika pembuat SS Global terlambat meng-copy data atau link tab berubah, dashboard monitoring wilayah kosong atau usang meskipun petugas di lapangan sudah mengisi Google Sheet rute masing-masing.
- **Mitigasi:**
  1. Bangun engine penarikan langsung (*Direct Ingestion*) dari 18 Google Sheet rute individu yang terdaftar pada tabel `route_sheets` ke tabel Supabase `daily_route_reports`.
  2. Implementasikan mekanisme *Smart Skip*: lewati penarikan spreadsheet untuk rute yang sudah berstatus `submitted` atau `verified` di aplikasi guna menghemat kuota Google Sheets API dan mencegah data tertimpa.

---

### BUG-73-02: Friksi Operasional Modal Input URL Manual & Risiko Human-Error
- **Lokasi Kode:** `src/utils/modals/regionalSyncModal.ts`, `src/components/monitoring/MonitoringHeader.tsx`, `src/components/monitoring/AllRouteMonitoringPage.tsx`.
- **Keparahan:** 🟡 Sedang (Medium / UX Friction & Operational Risk).
- **Deskripsi:**
  Sebelumnya, sinkronisasi data wilayah mengharuskan pengguna membuka modal SweetAlert2, memeriksa input URL spreadsheet dan nama lembar, lalu menekan tombol konfirmasi. Alur ini menambah beban kerja kognitif bagi korlap di lapangan dan rentan salah input nama lembar (misal saltik "SEPTEMBER 2026").
- **Dampak User:** Korlap harus mengetik atau memverifikasi link di layar ponsel saat sedang mobile di lapangan.
- **Mitigasi:**
  1. Sediakan tombol aksi langsung 1-klik `[🔄 Tarik 18 Rute]` di header monitoring.
  2. Tombol berstatus disabled dan menampilkan indikator loading selama proses penarikan berlangsung tanpa timer cooldown buatan, dan otomatis re-enabled begitu hasil sinkronisasi selesai.

---

### BUG-73-03: Ketiadaan Indikator Asal Data (Data Provenance) & Hilangnya Rasio 21 Metrik Transjakarta
- **Lokasi Kode:** `src/components/monitoring/MonitoringRouteCard.tsx`, `src/services/allRouteMonitoringService.ts`.
- **Keparahan:** 🟡 Sedang (Medium / Operational Traceability & Transparency).
- **Deskripsi:**
  Sebelumnya, pengguna tidak dapat membedakan mana rute yang datanya berasal dari pengisian langsung petugas operasional di aplikasi web (`Input App`) dan mana yang ditarik dari spreadsheet rute (`Tarik Sheet`). Selain itu, metrik rasio operasional (Pnp/KM, Ritase/Bus, Pnp/Bus, % Capaian) tidak tersedia secara terstruktur.
- **Dampak User:** Korlap sulit menelusuri rute mana yang stafnya aktif melapor via aplikasi dan rute mana yang masih mengandalkan rekap spreadsheet manual.
- **Mitigasi:**
  1. Tambahkan kolom `data_source` (`'app_input' | 'sheet_ingestion'`) pada tabel `daily_route_reports`.
  2. Tampilkan pil lencana asal data (*Data Provenance Badge*) pada kartu rute: `Input App` (hijau emerald) dan `Tarik Sheet` (biru langit).
  3. Lengkapi penghitungan rasio murni 21 kolom metrik Transjakarta pada `allRouteMonitoringService` dan ringkasan kesiapan operasional `SUMMARY_DETAILED`.
