# Audit Temuan Bug (Refactor 151)

## Ringkasan Eksekutif

Audit ini diinisiasi setelah ditemukan error pada konsol browser dan toast antarmuka saat Superadmin mengoperasikan fitur Manajemen Halaman & Fitur:
- `GET https://sejttnsanzogsykmtwym.supabase.co/rest/v1/app_page_settings?select=*&order=page_name.asc 404 (Not Found)`
- `PATCH https://sejttnsanzogsykmtwym.supabase.co/rest/v1/app_page_settings?page_key=eq.regional_monitoring 404 (Not Found)`
- Error PostgREST: `PGRST205: Could not find the table 'public.app_page_settings' in the schema cache. Hint: Perhaps you meant the table 'public.app_settings'`
- Notifikasi UI: *"Gagal memperbarui status halaman"*

---

## Tabel Temuan

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi | Dampak Pengguna | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-151-01** | `supabase/migrations/20261019000001_create_app_page_settings.sql`<br>Database Supabase Remote (`sejttnsanzogsykmtwym`) | 🔴 **CRITICAL** | Tabel `public.app_page_settings` belum terbentuk di remote database Supabase dan RLS policy awal menggunakan `auth.jwt()` yang selalu null pada client anon | Gagal memuat dan memperbarui status aktif/pemeliharaan halaman; perubahan switch toggle ditolak server 404 | Eksekusi DDL pembentukan tabel di Supabase remote, sesuaikan policy RLS untuk role `anon`/`authenticated`, daftarkan ke publikasi realtime, reload schema cache PostgREST, dan catat ke `schema_migrations` |

---

## Analisis Akar Masalah (Root Cause Analysis)

1. **Migrasi Belum Ter-apply di Remote:**
   File migrasi `supabase/migrations/20261019000001_create_app_page_settings.sql` dibuat pada siklus implementasi sebelumnya secara lokal, namun belum didorong/dieksekusi ke instans database Supabase produksi/development (`sejttnsanzogsykmtwym`). Akibatnya, PostgREST tidak menemukan tabel `app_page_settings` dan memunculkan error `PGRST205 (404 Not Found)`.

2. **Inkompatibilitas RLS Policy dengan Skema Auth SS_PDO:**
   Skema RLS awal pada file migrasi menggunakan filter:
   ```sql
   WHERE user_profiles.email = auth.jwt() ->> 'email'
   ```
   Aplikasi SS_PDO mengautentikasi pengguna di level frontend menggunakan Google Identity Services (GIS OAuth) dan memverifikasi profil terhadap tabel `user_profiles` secara mandiri. Seluruh koneksi browser ke Supabase menggunakan anonymous key (`anon`) tanpa sesi Supabase Auth JWT. Akibatnya, `auth.jwt()` selalu bernilai `null` sehingga operasi mutasi data akan selalu tertolak oleh RLS.
