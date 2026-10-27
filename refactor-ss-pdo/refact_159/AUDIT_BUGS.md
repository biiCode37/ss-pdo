# Audit Temuan: Penanganan Bottleneck Multi-Hari (Smart Incremental Sync & Bulk Ingestion Server-Side)

## Ringkasan Eksekutif
Berdasarkan hasil investigasi mendalam terhadap proses sinkronisasi periode Mingguan (7 hari) dan Bulanan (31 hari) pada halaman Monitoring Wilayah, ditemukan inefisiensi arsitektur yang menyebabkan kelebihan kuota request (HTTP 429) dan waktu tunggu yang sangat lama pada perangkat pengguna (mobile-first).

---

## Temuan Masalah & Analisis Risiko

### 1. BUG-159-01: Inefisiensi Brute-Force Multi-Day Ingestion pada Frontend
- **Lokasi:** `src/services/regionalIngestionService.ts` (`ingestRegionalRouteSummariesForRange`)
- **Keparahan:** High (Performa & Kuota)
- **Deskripsi:**
  Ketika pengguna menekan tombol "Tarik Mingguan" atau rentang tanggal, sistem melakukan penarikan ke Google Sheets secara berurutan untuk setiap tanggal dan setiap rute ($18 \text{ rute} \times 7 \text{ hari} = 126$ request, atau $18 \times 31 = 558$ request untuk bulanan).
  Padahal, data rute tanggal-tanggal lampau sebagian besar **sudah tersinkronkan** ke tabel `daily_route_reports` Supabase melalui Webhook Realtime (`sheet-sync-webhook`) dan GitHub Actions Cron (`regional-ingestion-cron.yml`).
- **Dampak User:**
  Waktu tunggu penarikan sangat lama (hingga 5–10 menit), boros baterai dan kuota internet seluler di lapangan, serta rawan memicu HTTP 429 (*Too Many Requests*) dari Google Sheets API.
- **Mitigasi:**
  Menerapkan **Smart Incremental Sync**: Sebelum melakukan request ke Google Sheets, sistem melakukan *pre-check* ke database Supabase. Slot tanggal/rute yang sudah memiliki data valid langsung dilewati (*skipped*). Sistem hanya menarik tanggal/rute yang datanya belum ada di Supabase, kecuali jika pengguna memilih opsi *Force Sync* (Tarik Ulang Paksa).

### 2. BUG-159-02: Ketiadaan Dukungan Rentang Tanggal pada Server-Side Runner (`scripts/ingest-regional.mjs`)
- **Lokasi:** `scripts/ingest-regional.mjs` dan `.github/workflows/regional-ingestion-cron.yml`
- **Keparahan:** Medium (Kemudahan Operasional)
- **Deskripsi:**
  Script mandiri `scripts/ingest-regional.mjs` dan GitHub Actions workflow saat ini hanya menerima satu tanggal tunggal (`--date=YYYY-MM-DD`). Jika tim operasional membutuhkan penarikan ulang/rekapitulasi data 1 bulan penuh secara masif di sisi server, mereka terpaksa mengeksekusi script 31 kali secara manual.
- **Dampak User:**
  Admin/developer kesulitan melakukan inisialisasi atau rekap bulanan historis tanpa membebani browser pengguna.
- **Mitigasi:**
  Menambahkan parameter `--start-date` dan `--end-date` pada `scripts/ingest-regional.mjs` serta parameter input rentang tanggal pada `workflow_dispatch` GitHub Actions.

### 3. BUG-159-03: Ketiadaan Konfirmasi Cerdas Saat Data Database Sudah 100% Lengkap
- **Lokasi:** `src/components/monitoring/AllRouteMonitoringPage.tsx`
- **Keparahan:** Low (UX & Transparansi)
- **Deskripsi:**
  Jika seluruh data 18 rute untuk 7 hari sudah lengkap tersimpan di database, pengguna yang menekan tombol "Tarik Mingguan" tidak diberi tahu secara transparan bahwa data sudah lengkap, melainkan langsung menjalankan modal proses.
- **Dampak User:**
  Pengguna bingung apakah data yang ditampilkan sudah mutakhir atau perlu ditarik ulang secara paksa.
- **Mitigasi:**
  Menyediakan dialog konfirmasi SweetAlert2 ramah pengguna yang menginformasikan bahwa data sudah 100% lengkap di database, dan menawarkan tombol untuk melakukan pembaruan paksa (*Force Sync*) jika memang ada revisi di spreadsheet Google.
