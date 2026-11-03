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

> 💡 **Pertanyaan Umum: Apakah Akun Google Drive Pemilik Folder Harus Sama dengan Akun Service Account?**
> **TIDAK PERLU SAMA.** Anda bebas menggunakan akun Google mana pun (Gmail pribadi, Google Workspace kantor, dll.) sebagai pemilik folder cadangan. Service Account bertindak seperti "bot / asisten otomatis" yang Anda undang masuk ke folder tersebut sebagai Editor. File cadangan akan tersimpan di Drive Anda dan langsung dapat Anda lihat di aplikasi Google Drive.

---

## 🗄️ 2. Kebijakan Retensi Cadangan (Default: 0 = Permanen / Abadi)

Sistem cadangan Google Drive SS_PDO dikonfigurasi dengan kebijakan retensi cerdas:
- **Default Retensi Google Drive = 0 (Permanen/Abadi):** Seluruh file cadangan ZIP harian yang diunggah ke Google Drive **TIDAK AKAN PERNAH DIHAPUS OTOMATIS**. Anda memiliki riwayat cadangan permanen tanpa batas waktu.
- **Kapasitas Penyimpanan Aman:** Ukuran arsip harian hanya berkisar **~4–5 MB** (~150 MB/bulan atau ~1.8 GB/tahun). Kapasitas Google Drive gratis (15 GB) dapat menampung arsip harian hingga **8–10 tahun ke depan** tanpa kehabisan ruang.
- **Kustomisasi Fleksibel (Opsional):** Jika di masa mendatang Anda ingin mengaktifkan batas waktu tertentu (misal: 60 hari atau 90 hari), Anda cukup menambahkan repository secret `BACKUP_RETENTION_DAYS` di GitHub dengan angka hari yang diinginkan.
- **GitHub Artifacts:** Khusus artefak internal di tab Actions GitHub, retensinya adalah 30 hari sesuai batas standar GitHub Actions.

---

## 🔐 3. Konfigurasi GitHub Repository Secrets

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
| `GDRIVE_APPSCRIPT_URL` | *(Sangat Direkomendasikan untuk akun Gmail personal)* URL Web App Google Apps Script penerima cadangan (lihat panduan di bawah) untuk mem-bypass pembatasan kuota 0-byte Service Account. |

---

## 🌐 4. Cara Menghubungkan Akun Gmail Pribadi via Google Apps Script (Bypass Kuota 0-Byte)

Google memberlakukan pembatasan bahwa Service Account bot memiliki kuota penyimpanan 0-byte untuk akun Gmail personal (`@gmail.com`). Agar file cadangan dapat langsung masuk ke Google Drive pribadi Anda tanpa batas:

1. Buka [Google Apps Script](https://script.google.com/) menggunakan akun Google pribadi Anda.
2. Klik **+ Proyek baru**.
3. Hapus semua kode default dan tempelkan kode skrip jembatan berikut:
   ```javascript
   function doPost(e) {
     try {
       var data = JSON.parse(e.postData.contents);
       var decoded = Utilities.base64Decode(data.base64Data);
       var blob = Utilities.newBlob(decoded, 'application/zip', data.fileName);
       var folder = data.folderId ? DriveApp.getFolderById(data.folderId) : DriveApp.getRootFolder();
       var file = folder.createFile(blob);
       return ContentService.createTextOutput(JSON.stringify({
         status: 'success',
         id: file.getId(),
         name: file.getName()
       })).setMimeType(ContentService.MimeType.JSON);
     } catch (err) {
       return ContentService.createTextOutput(JSON.stringify({
         status: 'error',
         message: err.toString()
       })).setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```
4. Klik tombol biru **Terapkan (Deploy)** di pojok kanan atas ➔ pilih **Penerapan baru (New deployment)**.
5. Klik ikon gerigi ⚙️ di samping "Select type" ➔ pilih **Aplikasi web (Web app)**:
   - Deskripsi: `SS_PDO Backup Receiver`
   - Jalankan sebagai (*Execute as*): **Saya (*Me*)**
   - Siapa yang memiliki akses (*Who has access*): **Siapa saja (*Anyone*)**
6. Klik **Terapkan (Deploy)** ➔ Berikan izin akses Google Drive saat diminta (*Authorize access*).
7. Salin **URL Aplikasi Web** yang berakhiran `/exec`.
8. Masukkan URL tersebut ke GitHub Secrets dengan nama **`GDRIVE_APPSCRIPT_URL`**.

> 💡 **Kenapa cara ini terbaik?** Karena Apps Script berjalan atas nama akun Anda sendiri, file cadangan otomatis memakai kuota 15 GB gratis akun Google Anda, tanpa batasan Service Account sama sekali!

---

## ⚡ 5. Cara Menjalankan Backup Manual (1-Klik via GitHub Actions)

Selain berjalan otomatis setiap hari pukul **02.00 WIB**, Anda atau tim admin dapat memicu pencadangan kapan saja secara manual:

1. Buka tab **Actions** di repositori GitHub Anda.
2. Pada panel sebelah kiri, klik alur kerja **Nightly Dual-Engine Backup**.
3. Klik tombol **Run workflow** di sebelah kanan atas.
4. Klik tombol hijau **Run workflow**.
5. Tunggu sekitar 1–2 menit hingga muncul ikon centang hijau (✅).
6. File cadangan akan langsung masuk ke folder Google Drive Anda dan muncul di daftar *Artifacts* GitHub.

---

## 🔄 6. Prosedur Pemulihan Darurat (Disaster Recovery)

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
