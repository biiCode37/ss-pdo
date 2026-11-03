# Audit Temuan Bug (Refactor 182)

## Ringkasan Eksekutif

Audit ini diinisiasi setelah muncul notifikasi kesalahan (error toast) pada aplikasi seluler saat Superadmin menyimpan konfigurasi izin akses halaman (misal: menambahkan akun `miqdads92@gmail.com` ke dalam daftar Whitelist pada halaman "Monitoring 18 Rute Wilayah"):
- Pesan Toast: *"Gagal menyimpan pengaturan izin halaman"*
- Fungsi Pemicu: `handleSavePermissions` di `src/components/pageManagement/PageManagementPage.tsx`
- Servis Terkait: `updatePagePermissions` di `src/services/pageManagementService.ts`

---

## Tabel Temuan

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi | Dampak Pengguna | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-182-01** | `supabase/migrations/20261031000001_granular_page_access_and_bulk_action.sql`<br>Database Supabase Remote (`sejttnsanzogsykmtwym`) | 🔴 **CRITICAL** | File migrasi skema izin granular dan fungsi RPC `admin_update_page_permissions` serta `admin_bulk_update_page_settings` belum dieksekusi ke remote database Supabase | Superadmin gagal menyimpan perubahan izin granular per-role maupun override whitelist/blacklist akun pada Manajemen Halaman; request RPC gagal dengan error 404/function not found | Eksekusi DDL migrasi ke instans Supabase remote, tambahkan kolom `allowed_roles`, `allowed_user_emails`, `denied_user_emails` pada tabel `public.app_page_settings`, deploy fungsi `SECURITY DEFINER` RPC, dan reload cache PostgREST |

---

## Analisis Akar Masalah (Root Cause Analysis)

1. **Migrasi Granular Access Belum Ter-deploy ke Remote:**
   Pada siklus pengembangan fitur izin granular per-halaman (Refactor 177), file migrasi `supabase/migrations/20261031000001_granular_page_access_and_bulk_action.sql` dibuat secara lokal. Namun saat pengujian di peranti, migrasi tersebut belum dieksekusi ke database remote Supabase aktif (`sejttnsanzogsykmtwym`).
2. **Ketiadaan Kolom & Fungsi RPC di Supabase PostgREST:**
   - Tabel `public.app_page_settings` di remote database belum memiliki kolom array: `allowed_roles text[]`, `allowed_user_emails text[]`, dan `denied_user_emails text[]`.
   - Fungsi PostgreSQL `SECURITY DEFINER`:
     - `public.admin_update_page_permissions(...)`
     - `public.admin_bulk_update_page_settings(...)`
     belum terdaftar di database.
   - Ketika tombol **"Simpan Pengaturan"** ditekan, frontend memanggil `supabase.rpc('admin_update_page_permissions', ...)`. Karena fungsi tersebut tidak ditemukan oleh PostgREST schema cache, permintaan gagal dan mengembalikan error, yang memicu munculnya toast merah *"Gagal menyimpan pengaturan izin halaman"*.
