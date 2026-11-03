# Sistem Pencadangan Ganda Otomatis (Unified Dual-Engine Backup) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun sistem pencadangan harian otomatis skala industri (*Enterprise-Grade Dual-Engine Backup*) menggunakan GitHub Actions untuk mencadangkan basis data PostgreSQL Supabase dan ke-18 file spreadsheet Google Sheets (SSOT) ke dalam arsip terpadu, yang disimpan ganda di GitHub Artifacts dan folder Google Drive pribadi pengguna.

**Architecture:**
1. **Engine A (Supabase Database Dump):** Menjalankan utilitas native `pg_dump` di runner GitHub Actions untuk mengekstrak seluruh skema relasional, tabel (`user_profiles`, `routes`, `route_sheets`, `daily_route_reports`, `daily_fleet_shifts`, `activity_logs`), dan fungsi RPC ke dalam `supabase_backup.sql.gz`.
2. **Engine B (Google Sheets SSOT Exporter):** Mengambil daftar 18 `spreadsheet_id` aktif secara dinamis dari tabel `route_sheets` via Supabase REST API, lalu menggunakan Google Service Account untuk mengekspor ke-18 dokumen spreadsheet ke format Microsoft Excel (`.xlsx`), mempertahankan seluruh tab harian (1–31) dan formula kalkulasi.
3. **Penyimpanan Ganda & Otomatisasi (Dual Storage & Rotation):** Membungkus seluruh aset ke dalam 1 file arsip ZIP `SS_PDO_BACKUP_YYYY-MM-DD_HHmmss.zip`. Arsip disimpan di GitHub Actions Artifacts dan diunggah langsung ke folder Google Drive pengguna via Google Drive API v3 dengan retensi rotasi otomatis 30 hari.
4. **Dokumentasi & Panduan Setup:** Menyediakan panduan langkah demi langkah bagi pengguna non-teknis untuk menghubungkan folder Google Drive dan menyetel GitHub Secrets.

**Tech Stack:** Node.js (ESM), PostgreSQL Client CLI (`pg_dump`), Google APIs Client (`google-auth-library`), GitHub Actions Workflow, Zlib.

## Global Constraints

- Wajib bekerja secara eksklusif di branch `devmode`.
- Kredensial rahasia (`SUPABASE_DB_URL`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GDRIVE_BACKUP_FOLDER_ID`) DILARANG KERAS di-hardcode di kode; wajib melalui GitHub Repository Secrets.
- Backup Google Sheets harus dinamis mengambil ID dari tabel `route_sheets` (Single Source of Truth), tidak boleh hardcode ID file.
- Format arsip harus mandiri dan mudah di-restore (Disaster Recovery < 5 menit).
- Wajib lulus seluruh Quality Gates sebelum penyelesaian:
  1. `pnpm vitest run src/styles/tokens/color-contract.test.ts`
  2. `pnpm vitest run src/`
  3. `pnpm run build`
  4. `graphify update .`

---

### Task 1: Script Mesin Pencadangan Database & Google Sheets (`scripts/backup/run-backup.mjs`)

**Files:**
- Create: `scripts/backup/run-backup.mjs`
- Test: `scripts/backup/__tests__/backup-engine.test.ts`

**Interfaces:**
- Consumes: Environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `BACKUP_OUTPUT_DIR`).
- Produces: File ZIP arsip terpadu `SS_PDO_BACKUP_[TIMESTAMP].zip` berisi:
  - `database/supabase_backup.sql.gz`
  - `spreadsheets/[ROUTE_CODE]_[PERIODE].xlsx` (18 file rute)
  - `manifest.json` (metadata tanggal, status rute, ukuran file, checksum).

- [ ] **Step 1: Tulis unit test untuk pengujian logika backup engine**
  Buat test `scripts/backup/__tests__/backup-engine.test.ts` yang memvalidasi fungsi ekstraksi rute aktif dari Supabase `route_sheets`, pemformatan nama file, dan pembuatan `manifest.json`.

- [ ] **Step 2: Jalankan test untuk memverifikasi kondisi awal (harus gagal/file belum ada)**
  Jalankan `pnpm vitest run scripts/backup/__tests__/backup-engine.test.ts`.

- [ ] **Step 3: Implementasikan `scripts/backup/run-backup.mjs`**
  1. Inisialisasi klien Supabase admin.
  2. Ambil tahun dan bulan aktif WIB, lalu query `route_sheets` untuk 18 rute.
  3. Autentikasi Google Service Account dengan scope Google Drive API (`https://www.googleapis.com/auth/drive.readonly`).
  4. Unduh 18 file spreadsheet via endpoint `https://www.googleapis.com/drive/v3/files/{id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  5. Satukan file SQL dump dan file Excel ke dalam arsip ZIP dengan `adm-zip` atau `archiver` bawaan Node.js `node:zlib` / `tar`.
  6. Buat file `manifest.json`.

- [ ] **Step 4: Jalankan unit test untuk memastikan logika engine bekerja 100%**
  Jalankan `pnpm vitest run scripts/backup/__tests__/backup-engine.test.ts`.

- [ ] **Step 5: Git commit task 1**
  Commit perubahan dengan pesan ringkas: `feat: add dual-engine backup pipeline script`.

---

### Task 2: Modul Pengunggah Google Drive & Rotasi Retensi 30 Hari (`scripts/backup/gdrive-uploader.mjs`)

**Files:**
- Create: `scripts/backup/gdrive-uploader.mjs`
- Test: `scripts/backup/__tests__/gdrive-uploader.test.ts`

**Interfaces:**
- Consumes: `GOOGLE_SERVICE_ACCOUNT_KEY`, `GDRIVE_BACKUP_FOLDER_ID`, path file ZIP.
- Produces: Unggahan langsung ke folder Google Drive pengguna + pembersihan otomatis file cadangan lama (> 30 hari).

- [ ] **Step 1: Tulis unit test untuk modul uploader & rotasi retensi**
  Buat pengujian mocking Google Drive API v3 untuk `files.create` (upload) dan `files.list` + `files.delete` (pruning backup > 30 hari).

- [ ] **Step 2: Implementasikan `scripts/backup/gdrive-uploader.mjs`**
  1. Buat token OAuth2 Google Service Account dengan scope `https://www.googleapis.com/auth/drive.file`.
  2. Implementasikan fungsi `uploadBackupToDrive(filePath, folderId)` menggunakan multipart upload API Google Drive.
  3. Implementasikan fungsi `pruneOldBackups(folderId, maxAgeDays = 30)` untuk menghapus cadangan yang lebih tua dari 30 hari agar kuota Drive pengguna tetap terjaga.

- [ ] **Step 3: Jalankan unit test untuk memastikan uploader lulus 100%**
  Jalankan `pnpm vitest run scripts/backup/__tests__/gdrive-uploader.test.ts`.

- [ ] **Step 4: Git commit task 2**
  Commit perubahan dengan pesan ringkas: `feat: add google drive backup uploader & pruning`.

---

### Task 3: GitHub Actions Workflow (`.github/workflows/nightly-backup.yml`)

**Files:**
- Create: `.github/workflows/nightly-backup.yml`

**Interfaces:**
- Consumes: GitHub Secrets (`SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GDRIVE_BACKUP_FOLDER_ID`).
- Produces: Eksekusi otomatis setiap malam pukul 02:00 WIB (19:00 UTC) serta dukungan tombol manual `workflow_dispatch` (1-Click Run).

- [ ] **Step 1: Buat file workflow GitHub Actions**
  Konfigurasikan job `backup` di `ubuntu-latest`:
  1. Pasang `postgresql-client` via `apt-get` untuk mendapatkan CLI `pg_dump`.
  2. Setup Node.js dan install dependencies.
  3. Eksekusi `pg_dump "$SUPABASE_DB_URL" | gzip > supabase_backup.sql.gz`.
  4. Jalankan `node scripts/backup/run-backup.mjs` untuk mengunduh 18 spreadsheet dan membungkus ZIP.
  5. Jalankan `node scripts/backup/gdrive-uploader.mjs` untuk mengunggah ZIP ke Google Drive.
  6. Gunakan `actions/upload-artifact@v4` untuk menyimpan file ZIP di GitHub Actions Artifacts (retensi 30 hari).

- [ ] **Step 2: Verifikasi sintaks workflow YAML**
  Pastikan format YAML valid, tidak ada salah indentasi atau sintaks shell yang rusak.

- [ ] **Step 3: Git commit task 3**
  Commit perubahan dengan pesan ringkas: `ci: add nightly dual-engine backup workflow`.

---

### Task 4: Panduan Setup Pengguna & Dokumentasi Audit Siklus `refact_194`

**Files:**
- Create: `docs/BACKUP_SETUP_GUIDE.md`
- Create: `refactor-ss-pdo/refact_194/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_194/REPAIR_REPORT.md`

**Interfaces:**
- Consumes: Langkah integrasi Google Drive, daftar GitHub Secrets, hasil pengujian, dan tata cara *Disaster Recovery*.
- Produces: Dokumentasi operasional resmi untuk tim dan kepatuhan siklus audit SS_PDO.

- [ ] **Step 1: Tulis panduan lengkap `docs/BACKUP_SETUP_GUIDE.md`**
  Sajikan instruksi bahasa Indonesia yang ramah non-teknis:
  - Cara membuat folder di Google Drive pribadi & mengambil ID Folder.
  - Cara menambahkan email Google Service Account sebagai **Editor** pada folder tersebut.
  - Daftar 5 GitHub Secrets yang perlu diisi di menu Settings repositori GitHub.
  - Cara mengetes tombol "Run workflow" untuk backup instan 1-klik.
  - Cara melakukan pemulihan (*restore*) darurat.

- [ ] **Step 2: Buat folder dokumentasi `refactor-ss-pdo/refact_194/`**
  - Tulis `AUDIT_BUGS.md` mengenai temuan ketiadaan backup otomatis untuk database dan spreadsheet.
  - Tulis `REPAIR_REPORT.md` mengenai arsitektur sistem cadangan ganda terpadu.

- [ ] **Step 3: Jalankan Quality Gates Lengkap**
  1. `pnpm vitest run src/styles/tokens/color-contract.test.ts`
  2. `pnpm vitest run src/`
  3. `pnpm run build`
  4. `graphify update .`

- [ ] **Step 4: Git commit dokumentasi siklus 194**
  Commit perubahan dengan pesan ringkas: `docs: refactor-194 backup system guide & report`.
