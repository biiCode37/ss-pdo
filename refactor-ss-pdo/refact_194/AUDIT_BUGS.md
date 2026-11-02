# Audit Temuan Ketiadaan Sistem Pencadangan Database & Spreadsheet - Refactor 194

Dokumen ini mencatat audit arsitektur ketahanan data (*disaster recovery & backup resilience*) pada proyek **SS_PDO**.

---

## Ringkasan Temuan Audit

| ID Temuan | Lokasi Kode / Infra | Kategori | Keparahan | Deskripsi & Dampak Pengguna/Sistem | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCH-194-01** | Dashboard Supabase / Infra | Disaster Recovery & Backup | 🔴 **High** | **Ketiadaan Mekanisme Backup Database & Spreadsheet (No Backups):** Dashboard Supabase menampilkan status `LAST BACKUP: No backups` karena akun berada pada Free Plan. Tidak ada mekanisme otomatis untuk mencadangkan data relasional (akun pengguna RBAC, pengaturan halaman, relasi 18 rute, status armada, dan audit trail) maupun ke-18 file Google Sheets yang menjadi Single Source of Truth (SSOT).<br><br>*Dampak:* Jika terjadi insiden kerusakan database, manipulasi data yang tidak sengaja, atau korupsi spreadsheet di Google Drive, organisasi tidak memiliki *point-in-time snapshot* untuk memulihkan sistem secara cepat. | 1. Bangun pipeline pencadangan ganda (*Unified Dual-Engine Backup*) menggunakan GitHub Actions Cron malam hari (02:00 WIB).<br>2. Engine A: Dump database Supabase via `pg_dump` ke `supabase_backup.sql.gz`.<br>3. Engine B: Ekspor 18 Google Sheets secara dinamis dari `route_sheets` ke format `.xlsx`.<br>4. Kemas seluruh aset ke file ZIP dengan `manifest.json`.<br>5. Simpan secara ganda di GitHub Artifacts dan unggah otomatis ke Google Drive pengguna via Service Account dengan retensi rotasi 30 hari. |
