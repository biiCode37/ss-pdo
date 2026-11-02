# Audit Keamanan: Verifikasi Identitas Server-Side & Eliminasi Pemalsuan Akses Administratif

Tanggal: 2 November 2026. Branch: `devmode`.  
Lingkup: Keamanan otorisasi RPC PostgreSQL Supabase, integrasi Google Identity Services (GIS), Edge Function Gateway, dan manajemen hak istimewa pengguna/halaman.

| ID | Lokasi kode | Keparahan | Deskripsi | Dampak user | Mitigasi |
| --- | --- | --- | --- | --- | --- |
| SS191-SEC-01 | `supabase/migrations/20261021000001_security_critical_hardening.sql`, `supabase/migrations/20261031000001_granular_page_access_and_bulk_action.sql`, `src/services/routes/users.ts`, `src/services/pageManagementService.ts` | Kritis | Identitas pengguna tidak diverifikasi oleh server. Login memakai Google OAuth di peramban, sedangkan koneksi database menggunakan Anon Key tanpa sesi Supabase Auth. Fungsi administrasi (`admin_update_user_role`, `admin_toggle_user_status`, `set_app_page_setting`, `admin_update_page_permissions`, `admin_bulk_update_page_settings`) bertipe `SECURITY DEFINER` dan menerima parameter teks email pemanggil (`p_acting_email`) dari klien, serta dibuka hak eksekusinya ke `anon` dan `PUBLIC`. | Pihak yang mengetahui kunci publik aplikasi (`VITE_SUPABASE_ANON_KEY`) dan email seorang Superadmin dapat memalsukan permintaan administratif langsung via cURL/REST API untuk eskalasi hak istimewa (*Privilege Escalation*) atau sabotase akun. | 1. Cabut izin `EXECUTE` pada seluruh RPC administratif dari `PUBLIC, anon, authenticated` dan batasi eksklusif untuk `service_role`.<br>2. Deploy Supabase Edge Function `admin-action` yang memvalidasi Google Access Token pemanggil secara kriptografis ke endpoint resmi Google Identity (`oauth2.googleapis.com/tokeninfo`).<br>3. Tambahkan fungsi RPC aman `admin_add_user_profile` berizin `service_role`.<br>4. Alirkan seluruh mutasi administratif frontend melalui `adminActionService.ts`. |

## Bukti dan cakupan

- **Bukti Eksploitasi Teoritis (Sebelum Mitigasi):**
  Sebelum perbaikan, fungsi PostgreSQL memiliki `grantee = PUBLIC` dan `grantee = anon`. Request HTTP langsung ke endpoint `/rest/v1/rpc/admin_update_user_role` dengan menyertakan `p_acting_email: superadmin@gmail.com` akan dieksekusi oleh Postgres tanpa memvalidasi apakah pengirim memiliki token atau kata sandi dari email tersebut.
- **Pemeriksaan Database Nyata:**
  Setelah eksekusi migrasi `20261102000001_restrict_admin_rpcs_to_service_role.sql` pada basis data tertaut (`sejttnsanzogsykmtwym`), query `information_schema.routine_privileges` membuktikan bahwa `PUBLIC`, `anon`, dan `authenticated` telah dicabut sepenuhnya. Hanya `postgres` dan `service_role` yang memiliki izin `EXECUTE`.
- **Pengujian Unit Test Fail-Closed:**
  Pengujian tanpa token Google atau dengan token palsu pada `adminActionService.test.ts` langsung gagal dan mengembalikan pesan ramah pengguna tanpa membocorkan detail sensitif basis data.

## Batas dampak mutasi

Tidak ada modifikasi pada formula lembar kerja spreadsheet asli (`SSOT`), kalkulasi ritase PP/trip, atau struktur data operasional armada (`BusData`, `daily_route_reports`, `daily_fleet_shifts`). Sesi login Google Identity Services (GIS) tetap permanen tanpa batas waktu (*no timeout*), mematuhi Golden Rules arsitektur SS_PDO.
