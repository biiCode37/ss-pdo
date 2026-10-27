# Laporan Perbaikan: Penyelarasan Renops Dinamis (Kategori Hari & Libur Nasional) pada Monitoring Wilayah & Ingestion (Refactor 161)

## Ringkasan Perbaikan
Refactor 161 menuntaskan akar masalah inkonsistensi target Rencana Operasi (Renops) antara database Supabase (`routes`) dan tampilan antarmuka (monitoring wilayah & laporan WhatsApp). Di database, target renops telah dikonfigurasi dinamis per kategori hari (`renops_weekday`, `renops_saturday`, `renops_sunday`, `renops_holiday`). Namun pipeline monitoring dan ingestion sebelumnya masih mengambil kolom statis `default_renops` (contoh: 30 untuk rute JAK.115 di hari Minggu, padahal target Minggu resminya adalah 23), yang menyebabkan sistem mencatat selisih 7 unit tidak beroperasi dan memberi label **"TIDAK LENGKAP ✖️"**.

Melalui perbaikan ini, fungsi sentral `getRenopsForDate(route, dateStr)` kini diintegrasikan secara komprehensif ke seluruh pipeline data: modul monitoring wilayah, pipeline ingestion Google Sheets, skrip otomatisasi CLI, serta Edge Function webhook.

---

## Rincian Perubahan (Before vs After)

### 1. Modul Monitoring Wilayah (`src/services/allRouteMonitoringService.ts`)
- **Before:**
  ```ts
  const renopsS1 = todayReport?.renops_shift1 ?? (fsS1?.target_renops ?? (r.default_renops || 0));
  const renopsS2 = todayReport?.renops_shift2 ?? (fsS2?.target_renops ?? (r.default_renops || 0));
  const totalRenops = renopsS1 || renopsS2 ? Math.max(renopsS1, renopsS2) : (r.default_renops || 0);
  ...
  defaultRenops: Number(r.default_renops) || 0,
  ```
  Nilai `r.default_renops` (statis 30) selalu menjadi acuan meskipun tanggal yang dibuka adalah hari Minggu (target 23). Selain itu, jika laporan di database terlanjur terisi angka statis 30 dari sinkronisasi lama, angka 30 tersebut tetap ditampilkan.

- **After:**
  ```ts
  const dynamicRenopsInfo = getRenopsForDate(r, dateStr);
  const dynamicRenops = dynamicRenopsInfo.renops;

  const isReportS1StaleDefault = todayReport?.renops_shift1 === r.default_renops && dynamicRenops !== r.default_renops;
  const renopsS1 = (todayReport?.renops_shift1 && !isReportS1StaleDefault)
    ? todayReport.renops_shift1
    : (fsS1?.target_renops ?? dynamicRenops);

  const isReportS2StaleDefault = todayReport?.renops_shift2 === r.default_renops && dynamicRenops !== r.default_renops;
  const renopsS2 = (todayReport?.renops_shift2 && !isReportS2StaleDefault)
    ? todayReport.renops_shift2
    : (fsS2?.target_renops ?? dynamicRenops);

  const totalRenops = Math.max(renopsS1, renopsS2, dynamicRenops);
  ...
  defaultRenops: dynamicRenops,
  ```
  Target renops kini otomatis mengikuti hari kalender (Minggu = 23, Sabtu = 26, Libur Nasional = sesuai hari libur). Jika database menyimpan data lama yang terlanjur terisi 30 statis di hari non-weekday, sistem mendeteksinya dan otomatis mengoreksi menjadi 23.

---

### 2. Pipeline Ingestion Rute Individu (`src/services/regionalIngestionService.ts`)
- **Before:**
  ```ts
  const defaultRenops = route.default_renops || 0;
  const renopsShift1 = defaultRenops;
  const renopsShift2 = defaultRenops;
  ```
  Saat menarik data dari Google Sheets rute individu, sistem selalu menuliskan `default_renops` (30) ke tabel `daily_route_reports`.

- **After:**
  ```ts
  const dynamicRenopsInfo = getRenopsForDate(route, dateStr);
  const targetRenops = dynamicRenopsInfo.renops;
  const renopsShift1 = targetRenops;
  const renopsShift2 = targetRenops;
  ```
  Sinkronisasi rute sekarang mengevaluasi tanggal tab sheet (`dateStr`). Jika tab yang ditarik adalah tanggal hari Minggu, `renops_shift1` dan `renops_shift2` yang disimpan ke Supabase adalah 23.

---

### 3. Skrip Otomasi Ingestion Cron (`scripts/ingest-regional.mjs`) & Edge Function Webhook
- **Before:**
  - `ingest-regional.mjs`: `renops_shift1: route.default_renops || 0`
  - `sheet-sync-webhook`: Hanya `select("..., default_renops")` dan menulis `routeData.default_renops`.
- **After:**
  - `ingest-regional.mjs`: Menggunakan fungsi pembantu `getDynamicRenops(route, curDate)` untuk mengevaluasi hari Minggu (`renops_sunday`), Sabtu (`renops_saturday`), dan Hari Kerja (`renops_weekday`).
  - `sheet-sync-webhook`: Menyeleksi seluruh kolom renops kategori hari dan menghitung `dynamicTargetRenops` secara akurat sebelum upsert ke Supabase.

---

### 4. Generator & Tab Laporan WhatsApp (`src/components/monitoring/tabs/MonitoringWaReportTab.tsx`)
- **Before:**
  Target renops jatuh ke 30 pada hari Minggu, sehingga dengan realops 23:
  $$routeTidakOps = 30 - 23 = 7 \text{ Unit}$$
  Status menjadi `TIDAK LENGKAP ✖️`.
- **After:**
  Target renops membaca `effectiveRenops` yang bernilai 23:
  $$routeTidakOps = 23 - 23 = 0 \text{ Unit}$$
  Status rute JAK.115 tercetak dengan benar: `LENGKAP ✅`.

---

## Case: Skenario Lapangan

### Skenario 1: Operasional Hari Minggu (Sunday) Rute JAK.115
- **Kondisi:**
  - Hari: Minggu, 25 Oktober 2026.
  - Database: `default_renops = 30`, `renops_sunday = 23`.
  - Fisik Beroperasi di Lapangan: 23 unit bus aktif.
- **Sebelum Perbaikan:**
  - Dashboard Monitoring menampilkan Armada: **23/30**.
  - Laporan WhatsApp Format 3 mencatat:
    ```text
    Target SGO    : 30 Unit
    Realisasi Ops : 23 Unit
    Tidak Ops     : 7 Unit
    Status        : TIDAK LENGKAP ✖️
    ```
  - Dampak: Pengawas ditegur pimpinan karena rute dikira kurang 7 bus.
- **Setelah Perbaikan:**
  - Dashboard Monitoring menampilkan Armada: **23/23**.
  - Laporan WhatsApp Format 3 mencatat:
    ```text
    Target SGO    : 23 Unit
    Realisasi Ops : 23 Unit
    Tidak Ops     : 0 Unit
    Status        : LENGKAP ✅
    ```
  - Dampak: Data akurat, KPI tercapai 100%, dan status operasional benar.

### Skenario 2: Operasional Hari Sabtu (Saturday) & Libur Nasional
- **Kondisi:** Rute dengan target khusus Sabtu (misal 26 unit) atau Libur Nasional (misal 20 unit).
- **Hasil:** Sistem otomatis memilih angka 26 di hari Sabtu dan angka 20 di Hari Libur Nasional secara mandiri tanpa memerlukan intervensi manual dari pengguna.
