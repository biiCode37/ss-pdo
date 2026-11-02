# Laporan Implementasi Sistem Pencadangan Ganda Otomatis (Refactor 194)

Dokumen ini mencatat implementasi sistem pencadangan skala industri **Refactor 194: Unified Dual-Engine Backup Pipeline (Supabase PostgreSQL + 18 Google Sheets SSOT) via GitHub Actions & Google Drive Offsite Storage** pada proyek **SS_PDO**.

---

## 1. ARCH-194-01: Pembangunan Mesin Pencadangan Ganda Terpadu

- **Komponen Utama:**
  1. `scripts/backup/run-backup.mjs` (Mesin pengumpul aset cadangan)
  2. `scripts/backup/gdrive-uploader.mjs` (Modul pengunggah Google Drive & rotasi 30 hari)
  3. `.github/workflows/nightly-backup.yml` (Workflow otomasi GitHub Actions)
  4. `docs/BACKUP_SETUP_GUIDE.md` (Panduan operasional setup pengguna)
- **Sebelum Perbaikan:**
  - Status pencadangan di dashboard Supabase: `LAST BACKUP: No backups`.
  - Tidak ada cadangan berkala untuk database relasional Supabase.
  - Tidak ada mekanisme ekspor offline untuk ke-18 file spreadsheet Google Sheets rute resmi.
  - Risiko kehilangan data atau waktu henti (*downtime*) tinggi jika terjadi kegagalan infrastruktur.
- **Sesudah Perbaikan:**
  - Terpasang alur kerja otomatis GitHub Actions yang dieksekusi setiap hari pukul **02.00 WIB** (19:00 UTC) serta dapat dipicu manual 1-klik melalui tombol *workflow_dispatch*.
  - **Engine A:** Melakukan dump native PostgreSQL via `pg_dump` ke dalam format teks SQL terkompresi `gzip` (`supabase_backup.sql.gz`).
  - **Engine B:** Menarik daftar rute aktif secara dinamis dari tabel `route_sheets` (Single Source of Truth), lalu mengekspor seluruh 18 file spreadsheet ke dalam format Microsoft Excel (`.xlsx`), mempertahankan seluruh tab tanggal 1 s/d 31 beserta rumus spreadsheet aslinya.
  - **Packaging & Manifest:** Menyatukan seluruh file SQL, 18 Excel, dan file `manifest.json` ke dalam arsip ZIP tunggal `SS_PDO_BACKUP_YYYY-MM-DD_HHmmss.zip`.
  - **Penyimpanan Ganda (*Dual Offsite Storage*):**
    1. Disimpan di **GitHub Actions Artifacts** (retensi 30 hari).
    2. Diunggah langsung ke **Folder Google Drive Pribadi Pengguna** menggunakan otorisasi Service Account, dilengkapi fitur **Auto-Pruning 30 Hari** agar kapasitas ruang Google Drive pengguna tetap bersih dan terjaga.
- **Before vs After:**
  - *Sebelum:* 0 pencadangan otomatis (ketergantungan 100% pada ketahanan cloud pihak ketiga tanpa snapshot offline).
  - *Sesudah:* 2 lapisan cadangan independen setiap hari (GitHub + Google Drive pribadi), siap di-restore dalam hitungan menit kapan saja.
- **Case: Skenario Lapangan:**
  - *Kasus 1 (Pemulihan Skema Akun):* Seorang admin tidak sengaja menghapus tabel konfigurasi atau role user terkorupsi. Admin cukup mengunduh arsip ZIP dari Google Drive atau GitHub Artifacts, mengekstrak `supabase_backup.sql.gz`, lalu menjalankan 1 perintah `psql` untuk mengembalikan seluruh akun dan konfigurasi rute seperti sedia kala.
  - *Kasus 2 (Audit Offline Operasional):* Manajemen atau auditor pengawas memerlukan data operasional bulan berjalan tanpa harus membuka internet atau meminta izin akses ke Google Sheets satu per satu. Admin cukup membuka folder `SS_PDO_Backups` di Google Drive dan membuka file `.xlsx` rute yang bersangkutan langsung di laptop secara offline.

---

## 2. Pengujian Unit & Verifikasi Otomatis

Seluruh logika mesin pencadangan telah diuji menggunakan unit test otomatis Vitest:
- `scripts/backup/__tests__/backup-engine.test.ts`:
  - Perhitungan waktu WIB (UTC+7) deterministik ➔ **PASSED**
  - Standarisasi nama file cadangan ➔ **PASSED**
  - Pembuatan manifest metadata ➔ **PASSED**
  - Kueri dinamis `route_sheets` dari Supabase ➔ **PASSED**
  - Ekspor spreadsheet ke buffer biner `.xlsx` ➔ **PASSED**
- `scripts/backup/__tests__/gdrive-uploader.test.ts`:
  - Filter masa kedaluwarsa retensi > 30 hari ➔ **PASSED**
  - Unggahan multipart Google Drive API v3 ➔ **PASSED**
  - Pembersihan otomatis (*pruning*) file lama via DELETE API ➔ **PASSED**
