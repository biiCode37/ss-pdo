# Design Document: Regional Monitoring & WA Report Generator v2 (Hybrid Fast-Lane)

## Metadata
- **Tanggal**: 14 September 2026
- **Topik**: Modernisasi Arsitektur Monitoring Wilayah 18 Rute & Generator Laporan WhatsApp
- **Status**: Approved (Brainstorming Selesai)
- **Branch**: `devmode`

---

## 1. Konteks & Latar Belakang

Aplikasi SS_PDO mengelola operasional 18 rute Mikrotrans Wilayah Jakarta Utara. Setiap rute memiliki Google Spreadsheet harian masing-masing (SS per rute) yang memuat data per unit bus. Selain itu, manajemen wilayah memiliki satu berkas **Spreadsheet Global Wilayah** (contoh: `LAPORAN OPERASI WIL UTARA JULI-DESEMBER_2026.xlsx`) yang merangkum capaian seluruh 18 rute menggunakan formula `=IMPORTRANGE()` dari ke-18 spreadsheet rute tersebut.

### Masalah yang Dihadapi:
1. **Beban API & Latensi Klien**:
   Saat ini, untuk menampilkan halaman Monitoring Wilayah atau membuat Laporan WhatsApp 18 rute dengan perbandingan historis (H, H-1, H-7), sistem harus menembak Google Sheets API per rute ($18 \times 3 = 54$ pemanggilan terpisah) atau menarik ribuan baris dari tabel `daily_unit_summaries` lalu menjalankan komputasi agregasi berat `reduce()` di memori ponsel pengawas.
2. **Ketiadaan Kolom Metrik Capaian di `daily_route_reports`**:
   Tabel `daily_route_reports` saat ini hanya mencatat kondisi operasional (renops, realops, headway, titik macet, status armada), belum menyimpan ringkasan angka capaian (TOA, Manual, KM, Ritase).
3. **Format Teks WhatsApp yang Kurang Rapi di Ponsel**:
   Template pesan WhatsApp yang lama menggunakan karakter tabulasi literal (`\t`) yang rentan berantakan dan patah di layar smartphone pengawas lapangan, serta belum mencerminkan susunan resmi dinas (TOM, perincian shift, unit OFF terpisah).

---

## 2. Keputusan Arsitektur Utama

### Keputusan 1: Pengayaan Tabel `daily_route_reports` (Tanpa Tabel Baru)
Sesuai prinsip **YAGNI & Ponytail**, kita **tidak membuat tabel database baru terpisah**. Kita memperkaya tabel `public.daily_route_reports` yang sudah ada (yang sudah memiliki *unique constraint* `route_id, date`) dengan 8 kolom metrik capaian:
- `toa_shift1` (integer DEFAULT 0)
- `manual_shift1` (integer DEFAULT 0)
- `toa_shift2` (integer DEFAULT 0)
- `manual_shift2` (integer DEFAULT 0)
- `total_passengers` (integer DEFAULT 0)
- `total_km` numeric DEFAULT 0
- `achievement_km` numeric DEFAULT 0 (KM per bus)
- `total_trip` integer DEFAULT 0 (total ritase)
- `last_synced_at` timestamptz DEFAULT now()

**Dampak Performa**: Halaman monitoring cukup membaca **18 baris teragregasi** dari Supabase (maksimal 54 baris untuk 3 tanggal pembanding H, H-1, H-7), membuat pemuatan data instan (< 300ms).

### Keputusan 2: Pendekatan Hibrida Spreadsheet (Dual-Link Fast-Lane)
- **Fast-Lane Primer (Spreadsheet Global)**:
  Sistem menyediakan field konfigurasi `global_monitoring_sheet_url` (disimpan di `app_settings` / `routes_config`). Halaman Monitoring Wilayah cukup membaca 1 file spreadsheet global dalam **1 panggilan API** untuk mengambil data 18 rute sekaligus pada tanggal H, H-1, dan H-7.
- **Fallback Terjamin (Spreadsheet Per Rute)**:
  Jika Spreadsheet Global belum disetel atau rumusnya sedang loading/error, sistem secara otomatis *fallback* membaca dari spreadsheet rute masing-masing.

### Keputusan 3: Alur Sinkronisasi Cerdas
1. **Background Sync**: Otomatis meng-upsert metrik ke `daily_route_reports` saat kartu bus disimpan di dashboard rute.
2. **Batch Sync Manual**: Tombol "Sinkronkan Ulang 18 Rute" di halaman Monitoring Wilayah untuk menarik data terbaru dari Google Sheets secara massal dalam hitungan detik.
3. **Penyelarasan Historis**: Data KEMAREN (H-1) dan MINGGU LALU (H-7) ditarik relasional dari `daily_route_reports` dengan fallback pembacaan sheet jika belum ada di database.

### Keputusan 4: Tipografi Laporan WhatsApp Elegan & Profesional
Menghapus seluruh karakter tabulasi liar (`\t`). Menggunakan blok kode monospace WhatsApp (```) dengan perataan spasi presisi (*fixed-width columnar alignment*) yang dijamin tidak akan pecah di layar ponsel jenis apa pun, tanpa mengurangi satu pun variabel dinas resmi:
- **Format 1 (Komprehensif)**: Target HK, Best Record, Persentase Capaian, Pencapaian KM/Bus, KM Baku, Renops, Realisasi, Kendala Titik Macet, Headway Tercepat/Terlama.
- **Format 2 (Pelanggan Shift)**: Format `[TOM] + [MANUAL] = JUMLAH`, rincian rute 01–18, dan rekap wilayah (Shift 1, Shift 2, Total Wilayah).
- **Format 3 (Status Armada)**: Target SGO, Realisasi Ops, Tidak Ops, Status LENGKAP/TIDAK LENGKAP, rincian kendala non-SGO bernomor, dan blok khusus `DATA UNIT LIBUR (OFF)`.

---

## 3. Rincian Perubahan Kode & File

### 3.1 Database & Layer Tipe
- **[NEW] `supabase/migrations/20260914000001_add_daily_route_reports_metrics.sql`**:
  Menambahkan 8 kolom metrik capaian ke tabel `public.daily_route_reports`.
- **[MODIFY] `src/types/supabase.ts`**:
  Memperbarui interface `DailyRouteReport` dengan tipe kolom-kolom baru.

### 3.2 Service Layer & Adapter
- **[NEW] `src/services/googleSheets/globalReportReader.ts`**:
  Parser khusus untuk membaca layout tabel blok 27-baris per tanggal dari Spreadsheet Global Wilayah.
- **[MODIFY] `src/services/dailyRouteReportService.ts`**:
  Menambahkan fungsi `syncRouteMetricsToReport()` untuk upsert metrik ke DB.
- **[MODIFY] `src/services/allRouteMonitoringService.ts`**:
  Mengoptimasi `fetchRegionalMonitoringData()` agar membaca langsung dari `daily_route_reports` dan mendukung sinkronisasi massal via Spreadsheet Global.

### 3.3 Generator Teks WhatsApp
- **[MODIFY] `src/utils/waReportGenerator.ts`**:
  Memperbarui `generateWaReportFormat1`, `generateWaReportFormat2`, dan `generateWaReportFormat3` dengan format elegan, monospace rapi, perataan presisi, dan istilah dinas resmi (TOM, unit OFF).
- **[MODIFY] `src/constants/texts/text_wa_report.ts`**:
  Menyelaraskan kamus teks template laporan WhatsApp.

### 3.4 Antarmuka Pengguna (UI)
- **[MODIFY] `src/components/monitoring/AllRouteMonitoringPage.tsx`**:
  Menambahkan tombol aksi "Sinkronkan Ulang 18 Rute" dengan status loading/progress yang elegan.
- **[MODIFY] `src/components/waReport/WaReportModal.tsx`**:
  Menghubungkan data capaian dan opsi generator ke modal WhatsApp.

---

## 4. Quality Gates & Verifikasi

1. **Unit Testing**:
   - `src/services/allRouteMonitoringService.test.ts`
   - `src/utils/waReportGenerator.test.ts`
   - `src/constants/texts/texts.test.ts`
   - Seluruh test suite wajib lulus 100% (`pnpm vitest run src/`).
2. **Build Verification**:
   - `pnpm run build` (`tsc -b && vite build`) wajib 0 error.
3. **Knowledge Graph**:
   - `graphify update .` wajib dijalankan setelah modifikasi selesai.
4. **Dokumentasi**:
   - `refactor-ss-pdo/refact_61/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`.
