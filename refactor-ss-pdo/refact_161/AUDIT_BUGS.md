# Audit Temuan: Penyelarasan Renops Dinamis (Kategori Hari & Libur Nasional) pada Monitoring Wilayah & Ingestion (Refactor 161)

## Ringkasan Eksekutif
Berdasarkan investigasi operasional pada aplikasi SS_PDO, ditemukan anomali penetapan target Rencana Operasi (Renops) pada rute JAK.115 dan rute-rute lainnya di hari Minggu/akhir pekan/libur nasional. Di database Supabase tabel `public.routes`, target renops dinamis telah disimpan terpisah (`renops_weekday`, `renops_saturday`, `renops_sunday`, `renops_holiday`). Sebagai contoh, rute JAK.115 di hari Minggu memiliki target renops resmi = **23 unit**, sedangkan hari kerja = **30 unit**.
Namun pada frontend aplikasi (kartu rute, rekap monitoring wilayah, dan laporan WhatsApp Format 3), sistem menampilkan target renops = **30 unit**, sehingga dengan realisasi fisik 23 unit beroperasi, sistem menganggap ada 7 unit yang kurang dan menandai rute sebagai **"TIDAK LENGKAP ✖️"**.

---

## Temuan Masalah & Analisis Risiko

### 1. BUG-161-01: Modul Monitoring Wilayah Mengabaikan Kalender Operasional Dinamis
- **Lokasi:** `src/services/allRouteMonitoringService.ts` (baris 338, 343, 348, dan 400)
- **Keparahan:** High (Kesalahan Data Operasional & Indikator Kinerja)
- **Deskripsi:**
  Saat memetakan `RegionalRouteItem`, fungsi `fetchRegionalMonitoringData` mengambil fallback statis `r.default_renops || 0` (yang bernilai 30 untuk JAK.115) dan tidak memanggil fungsi sentral `getRenopsForDate(r, dateStr)` yang telah tersedia di `src/utils/holidayUtils.ts`.
- **Dampak User:**
  Target unit armada yang ditampilkan pada kartu rute, modal detail rute, dan bottom sheet pengawas di hari Minggu atau libur nasional selalu memakai angka hari kerja biasa (30), bukan 23.
- **Mitigasi:**
  Mengintegrasikan `getRenopsForDate(r, dateStr)` ke dalam `allRouteMonitoringService.ts` untuk menghitung `dynamicRenops`, mendeteksi jika data `todayReport` tersimpan nilai `default_renops` statis usang pada hari non-weekday, dan menetapkan target renops yang akurat.

### 2. BUG-161-02: Pipeline Ingestion Rute Menyimpan Nilai Statis `default_renops` ke Database
- **Lokasi:**
  - `src/services/regionalIngestionService.ts` (baris 215–217)
  - `scripts/ingest-regional.mjs` (baris 464–466)
  - `supabase/functions/sheet-sync-webhook/index.ts` (baris 265 & 500)
- **Keparahan:** High (Integritas Data Database)
- **Deskripsi:**
  Ketika rute ditarik dari Google Sheets individu (baik lewat UI Ingestion, cron CLI script, maupun webhook edit Google Sheets), sistem selalu menuliskan `route.default_renops` (statis 30) ke kolom `renops_shift1` dan `renops_shift2` tabel `daily_route_reports`, tanpa mengevaluasi hari dari `dateStr`.
- **Dampak User:**
  Database `daily_route_reports` menyimpan angka target yang salah untuk hari Sabtu, Minggu, dan Libur Nasional.
- **Mitigasi:**
  Menggunakan `getRenopsForDate(route, dateStr)` di `regionalIngestionService.ts`, helper `getDynamicRenops(route, curDate)` di `ingest-regional.mjs`, serta query kolom dinamis dan kalkulasi hari di Edge Function `sheet-sync-webhook`.

### 3. BUG-161-03: Generator Laporan WhatsApp Menandai Status Rute Keliru Menjadi "TIDAK LENGKAP"
- **Lokasi:**
  - `src/components/monitoring/tabs/MonitoringWaReportTab.tsx` (baris 106, 115, 160)
  - `src/components/waReport/useWaReportData.ts` (baris 149)
  - `src/utils/waReportGenerator.ts` (baris 335–341)
- **Keparahan:** High (Distorsi Laporan Manajemen Operasional)
- **Deskripsi:**
  Karena renops terbaca 30 dan realops di hari Minggu adalah 23, selisih unit tidak ops dihitung $30 - 23 = 7$ unit. Akibatnya status rute diberi label `TIDAK LENGKAP ✖️`, padahal 23 unit tersebut adalah 100% dari target operasional hari Minggu.
- **Dampak User:**
  Manajemen Transjakarta dan pengawas operasional menerima laporan WhatsApp harian yang salah bahwa rute kekurangan unit, padahal seluruh unit yang ditargetkan sudah beroperasi lengkap.
- **Mitigasi:**
  Memastikan target renops pada format laporan WA membaca nilai dinamis yang sesuai tanggal, sehingga $23 - 23 = 0$ unit tidak ops dan status tercetak `LENGKAP ✅`.
