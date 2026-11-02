# 🛡️ Panduan Konfigurasi Sistem Pencadangan Ganda Otomatis (Dual-Engine Backup Guide)

Dokumen ini berisi panduan lengkap untuk mengaktifkan dan mengelola sistem pencadangan otomatis skala industri pada proyek **SS_PDO**. Sistem ini mencadangkan **dua sumber data sekaligus**:
1. **Engine A (Database Supabase):** Struktur skema relasional, tabel user, rute, rekap laporan, status armada, dan jejak audit.
2. **Engine B (Google Sheets SSOT):** Seluruh 18 file spreadsheet rute resmi format Microsoft Excel (`.xlsx`) lengkap dengan tab tanggal 1 s/d 31 dan rumus spreadsheet asli.

Hasil cadangan dikemas ke dalam arsip ZIP tunggal dan disimpan secara ganda di **GitHub Artifacts** dan **Google Drive Pribadi Anda**.

---

## 📁 1. Langkah Menghubungkan Google Drive Pribadi Anda

Ikuti 3 langkah mudah berikut untuk memberi izin bot pencadangan mengantar file cadangan ke Google Drive Anda:

### Langkah 1: Buat Folder Khusus di Google Drive
1. Buka [Google Drive](https://drive.google.com/) menggunakan akun Google Anda.
2. Klik tombol **+ Baru (+ New)** ➔ pilih **Folder baru**.
3. Beri nama folder, misalnya: `SS_PDO_Backups`.
4. Buka folder yang baru dibuat tersebut.

### Langkah 2: Salin ID Folder (Folder ID)
1. Perhatikan bilah alamat peramban (*address bar*) di bagian atas browser Anda:
   ```
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345
   ```
2. Salin kode acak setelah `/folders/` (contoh: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ12345`). Ini adalah **`GDRIVE_BACKUP_FOLDER_ID`** Anda.

### Langkah 3: Bagikan (*Share*) Folder ke Service Account
1. Di dalam Google Drive, klik nama folder `SS_PDO_Backups` di bagian atas atau klik kanan foldernya ➔ pilih **Bagikan (*Share*)** ➔ **Bagikan (*Share*)**.
2. Masukkan alamat email **Google Service Account** Anda (email ini tercantum di dalam file JSON kredensial proyek, berakhiran `@...iam.gserviceaccount.com`).
3. Pastikan perannya disetel sebagai **Editor** (wajib Editor agar bot dapat mengunggah file).
4. Hapus centang pada opsi *"Beri tahu orang (Notify people)"*.
5. Klik **Kirim / Bagikan (*Send / Share*)**.

> 💡 **Selesai!** Mulai saat ini, Google Service Account resmi diizinkan mengunggah file cadangan harian ke dalam folder tersebut tanpa Anda perlu login ulang.

---

## 🔐 2. Konfigurasi GitHub Repository Secrets

Agar GitHub Actions dapat menjalankan tugas pencadangan setiap malam, pastikan variabel rahasia (*Secrets*) berikut telah terisi di repositori GitHub Anda:

1. Buka repositori GitHub proyek SS_PDO di browser.
2. Masuk ke tab **Settings** (di bilah menu repositori) ➔ pilih menu **Secrets and variables** di sebelah kiri ➔ klik **Actions**.
3. Pastikan 5 variabel berikut tersedia di bagian **Repository secrets** (klik *New repository secret* jika belum ada):

| Nama Secret | Deskripsi & Lokasi Pengambilan |
| :--- | :--- |
| `SUPABASE_DB_URL` | *Connection String* PostgreSQL Supabase.<br>Ambil dari: **Supabase Studio** ➔ **Project Settings** ➔ **Database** ➔ **Connection String** ➔ pilih mode **URI** (ganti `[YOUR-PASSWORD]` dengan password database Anda). |
| `SUPABASE_URL` | URL endpoint Supabase resmi (contoh: `https://sejttnsanzogsykmtwym.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci *service_role* Supabase (dari menu **Project Settings** ➔ **API**). |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Isi teks lengkap dari file JSON kunci Google Service Account. |
| `GDRIVE_BACKUP_FOLDER_ID` | ID Folder Google Drive yang Anda salin pada **Langkah 1** di atas. |

---

## ⚡ 3. Cara Menjalankan Backup Manual (1-Klik via GitHub Actions)

Selain berjalan otomatis setiap hari pukul **02.00 WIB**, Anda atau tim admin dapat memicu pencadangan kapan saja secara manual:

1. Buka tab **Actions** di repositori GitHub Anda.
2. Pada panel sebelah kiri, klik alur kerja **Nightly Dual-Engine Backup**.
3. Klik tombol **Run workflow** di sebelah kanan atas.
4. Klik tombol hijau **Run workflow**.
5. Tunggu sekitar 1–2 menit hingga muncul ikon centang hijau (✅).
6. File cadangan akan langsung masuk ke folder Google Drive Anda dan muncul di daftar *Artifacts* GitHub.

---

## 🔄 4. Prosedur Pemulihan Darurat (Disaster Recovery)

Jika terjadi insiden kehilangan data atau kerusakan server:

### A. Memulihkan Database Supabase:
1. Buka file arsip ZIP cadangan, ekstrak file `database/supabase_backup.sql.gz`.
2. Buka terminal komputer Anda dan jalankan perintah:
   ```bash
   # Ekstrak file gzip
   gzip -d supabase_backup.sql.gz
   
   # Restore ke database Supabase
   psql "<SUPABASE_DB_URL>" -f supabase_backup.sql
   ```
3. Seluruh tabel, akun pengguna, relasi rute, dan riwayat laporan akan kembali utuh 100%.

### B. Memulihkan File Spreadsheet Rute:
1. Di dalam arsip ZIP, buka folder `spreadsheets/`.
2. Anda akan menemukan ke-18 file Excel rute (misal: `JAK.01_2026-11.xlsx`, `JAK.60_2026-11.xlsx`).
3. Seluruh tab tanggal 1 s/d 31 beserta seluruh angka dan formulanya dapat dibuka langsung di Microsoft Excel atau diunggah kembali ke Google Drive.
