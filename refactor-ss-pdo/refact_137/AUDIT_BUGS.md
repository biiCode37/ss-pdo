# Audit Temuan: Implementasi Otomasi Penarikan Data (Tahap 2 - Regional Ingestion Cron)

## Ringkasan Eksekutif
Dalam rangka mengimplementasikan Tahap 2 (Otomasi Penarikan Data dari 18 Google Sheets Rute ke Supabase secara Terjadwal / Server-Side Cron), dilakukan audit komprehensif terhadap kesiapan infrastruktur backend, service account, rate limit, dan format data spreadsheet.

---

### Temuan Masalah & Analisis Risiko

#### 1. BUG-137-01: Potensi Kegagalan Akses Google Service Account pada Cron Mandiri
- **Lokasi:** Backend Runner / Ingestion Engine
- **Keparahan:** CRITICAL
- **Deskripsi:** Sinkronisasi di frontend saat ini bergantung pada interaksi pengguna via Google Identity Services (`gis_access_token`). Eksekusi backend terjadwal (*zero-touch*) tidak memiliki antarmuka manusia dan wajib menggunakan Google Service Account. Jika Service Account tidak memiliki akses Viewer ke 18 spreadsheet rute anak, cron akan melempar HTTP 403 / 404.
- **Dampak User:** Data rekap wilayah dan Korwil tidak pernah terbarui secara otomatis di database Supabase.
- **Mitigasi:** Verifikasi handshake menyeluruh terhadap 18 Spreadsheet ID menggunakan kredensial `ss-pdo-ce9a8a2f7815.json` (`pusm-service-google-acc@ss-pdo.iam.gserviceaccount.com`). Hasil audit: 18 dari 18 rute terbukti memiliki akses valid (100% PASS).

#### 2. BUG-137-02: Kerentanan Limit Timeout Supabase Edge Function untuk Pemrosesan Multi-Sheet
- **Lokasi:** Engine Penjadwal (Supabase `pg_cron` vs GitHub Actions)
- **Keparahan:** HIGH
- **Deskripsi:** Supabase Edge Function Free Tier memiliki limitasi timeout eksekusi ketat maksimal 150 detik. Membaca 18 spreadsheet berturut-turut dengan latensi jaringan Google API rawan terputus paksa jika salah satu sheet mengalami perlambatan. Selain itu, pemantauan log eksekusi `pg_cron` di PostgreSQL rumit dan tidak ramah pengguna.
- **Dampak User:** Laporan terputus di tengah jalan, status cron sulit dipantau jika terjadi kendala.
- **Mitigasi:** Membangun runner mandiri `scripts/ingest-regional.mjs` yang didukung GitHub Actions Workflow (`.github/workflows/regional-ingestion-cron.yml`). Menyediakan riwayat eksekusi visual di tab Actions GitHub dan batas waktu aman hingga 6 jam tanpa risiko timeout.

#### 3. BUG-137-03: Ketiadaan Kolom Odometer Fisik pada Sebagian Sheet (Contoh: JAK 15)
- **Lokasi:** `scripts/ingest-regional.mjs`
- **Keparahan:** MEDIUM
- **Deskripsi:** Sebagian spreadsheet rute anak (seperti JAK 15) tidak mengisi kolom odometer fisik harian (Kilometer Awal/Akhir Shift), melainkan langsung menghitung total kilometer di kolom "TOTAL KM" (Kolom Q). Jika parser hanya mengandalkan selisih odometer fisik, akumulasi KM akan menjadi 0.
- **Dampak User:** Nilai Total KM dan Ritase PP tercatat 0 padahal armada beroperasi penuh.
- **Mitigasi:** Menambahkan logika fallback cerdas: parser mengutamakan selisih odometer fisik; jika bernilai 0 namun kolom "TOTAL KM" pada baris sheet memiliki angka valid, parser otomatis menggunakan nilai total KM sheet tersebut.

#### 4. BUG-137-04: Ketidaksinkronan Kamus Teks `TEXT_MONITORING.HEADER.SUBTITLE`
- **Lokasi:** `src/components/monitoring/MonitoringHeader.tsx`, `src/constants/texts/text_monitoring.ts`
- **Keparahan:** HIGH
- **Deskripsi:** Komponen `MonitoringHeader.tsx` merujuk ke properti `TEXT_MONITORING.HEADER.SUBTITLE`, namun properti tersebut belum terdefinisi di `text_monitoring.ts`, menyebabkan kegagalan build TypeScript Strict (`tsc -b`).
- **Dampak User:** Build produksi gagal deploy.
- **Mitigasi:** Menambahkan konstanta `SUBTITLE: "18 Rute Operasional"` ke `TEXT_MONITORING.HEADER` di `src/constants/texts/text_monitoring.ts` dan memverifikasi unit test.
