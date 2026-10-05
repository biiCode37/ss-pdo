# 📋 Audit Bugs: Refactor 72 — Postgres 22P02 Type Integer Mismatch pada Total Ritase & Sentralisasi URL Spreadsheet Global

Dokumen audit ini mencatat analisis akar penyebab kegagalan penyimpanan data rute ke Supabase dan arsitektur penyimpanan link spreadsheet laporan global wilayah.

---

## Daftar Temuan Masalah

### BUG-72-01: Galat Postgres `22P02: invalid input syntax for type integer: "214.5"` Menolak 12 Rute Ber-ritase Desimal
- **Lokasi Kode:** `supabase/migrations/20260914000001_add_daily_route_reports_metrics.sql` (skema lama) & `src/services/allRouteMonitoringService.ts`.
- **Keparahan:** 🔴 Kritis (High / Data Loss & Upsert Blocker).
- **Deskripsi:** 
  1. Pada tabel `public.daily_route_reports`, kolom `total_trip` sebelumnya didefinisikan sebagai `integer` (`total_trip integer DEFAULT 0`).
  2. Pada spreadsheet operasional nyata Transjakarta, kolom *TOTAL RITASE* mencatat ritase parsial / setengah ritase (0.5 trip) bagi armada yang menyelesaikan separuh perjalanan pada jam penutupan operasi (contoh nyata pada 19 September 2026: JAK 01 = `214,5`, JAK 05 = `167,8`, JAK 15 = `317,9`, JAK 29 = `259,5`, JAK 76 = `260,3`, JAK 77 = `222,4`, JAK 87 = `125,9`, JAK 88 = `192,9`, JAK 89 = `200,3`, JAK 90 = `134,8`, JAK 113 = `215,8`, JAK 117 = `194,4`).
  3. Ketika sistem menyinkronkan data dari spreadsheet global ke Supabase via REST API (`/rest/v1/daily_route_reports`), PostgreSQL melempar galat `400 Bad Request` dengan pesan:
     `{code: '22P02', message: 'invalid input syntax for type integer: "214.5"'}`.
  4. Akibatnya, dari 18 rute, **12 rute gagal di-upsert**, dan hanya 6 rute yang kebetulan ber-ritase bilangan bulat (JAK 58: 197.0, JAK 60: 159.0, JAK 110A: 113.0, JAK 115: 155.0, JAK 118: 182.0, JAK 120: 53.0) yang berhasil disimpan ke database.
- **Dampak User:** Dashboard Monitoring Wilayah dan Grafik TOA hanya menampilkan 6 rute, sedangkan 12 rute lainnya kosong (0 / strip) meskipun data di spreadsheet global sudah lengkap terisi.
- **Mitigasi:**
  1. Migrasikan tipe kolom `total_trip` di database PostgreSQL Supabase dari `integer` menjadi `numeric` (`ALTER TABLE public.daily_route_reports ALTER COLUMN total_trip TYPE numeric USING total_trip::numeric`).
  2. Catat file migrasi resmi pada `supabase/migrations/20260921000002_alter_daily_route_reports_total_trip_and_app_settings.sql`.

---

### BUG-72-02: Fragmentasi Penyimpanan URL Spreadsheet Global di `localStorage` Peranti Lokal
- **Lokasi Kode:** `src/utils/modals/regionalSyncModal.ts`.
- **Keparahan:** 🟡 Sedang (Medium / Operational Fragility & Multi-Device Friction).
- **Deskripsi:**
  URL spreadsheet laporan global wilayah sebelumnya hanya disimpan di `localStorage` peranti browser pengguna yang menekan tombol "Tarik Data Global". Jika pengguna lain (seperti Pimpinan atau Korlap lain) membuka aplikasi dari ponsel/laptop berbeda, atau jika cache browser terhapus, input link spreadsheet menjadi kosong dan pengguna dipaksa mencari serta menyalin-tempel (copy-paste) link spreadsheet Google Drive secara manual.
- **Dampak User:** Risiko salah menempelkan link spreadsheet draft/salah periode, serta friksi operasional bagi pimpinan yang sering berganti perangkat pemantau.
- **Mitigasi:**
  1. Buat tabel konfigurasi terpusat di Supabase: `public.app_settings` (key-value store dengan RLS publik read/write).
  2. Buat servis `appSettingsService.ts` dengan fungsi `getRegionalGlobalSheetUrl()` dan `setRegionalGlobalSheetUrl(url)` yang memadukan penyimpanan cloud database Supabase dengan caching lokal instan.
  3. Integrasikan `regionalSyncModal.ts` sehingga modal otomatis terisi dengan link spreadsheet resmi yang tersimpan di Supabase untuk seluruh perangkat pengguna.
