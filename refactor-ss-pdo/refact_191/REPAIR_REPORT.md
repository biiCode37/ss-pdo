# Repair Report: Verifikasi Server-Side Identitas Pengguna & Otorisasi Administratif

Tanggal: 2 November 2026. Branch: `devmode`.

## Implementasi

1. **Restriksi Basis Data (PostgreSQL Migration):**
   - Berkas: `supabase/migrations/20261102000001_restrict_admin_rpcs_to_service_role.sql`
   - Menjalankan pencabutan izin eksekusi (`REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`) pada seluruh fungsi RPC administratif:
     - `admin_update_user_role`
     - `admin_toggle_user_status`
     - `set_app_page_setting`
     - `admin_update_page_permissions`
     - `admin_bulk_update_page_settings`
   - Mengalokasikan izin eksekusi secara eksklusif ke `service_role`.
   - Menambahkan fungsi `public.admin_add_user_profile` bertipe `SECURITY DEFINER` dengan izin eksklusif `service_role` dan guard ketat (Admin biasa tidak dapat membuat akun Superadmin).
   - Migrasi telah dieksekusi dan diverifikasi pada basis data Supabase tertaut (`sejttnsanzogsykmtwym`).

2. **Supabase Edge Function Gateway (`admin-action`):**
   - Berkas: `supabase/functions/admin-action/index.ts` & `deno.json`
   - Menyediakan serverless gateway aman yang memverifikasi Google Access Token pengguna ke endpoint resmi Google Identity (`https://oauth2.googleapis.com/tokeninfo`).
   - Memvalidasi bahwa token aktif, belum kedaluwarsa, dan mengekstrak `verified_email` resmi dari Google.
   - Menginisialisasi Supabase Client dengan `SUPABASE_SERVICE_ROLE_KEY` di server dan meneruskan `p_acting_email = verified_email` ke RPC target.
   - Edge Function telah di-deploy dan berstatus aktif pada proyek Supabase.

3. **Client Token Extractor & Kamus Teks Sentral:**
   - Berkas: `src/services/googleSheets/authSession.ts` & `src/constants/texts/text_auth.ts`
   - Menambahkan fungsi pembantu `getGoogleAccessToken()` yang memvalidasi ketersediaan sesi dan melakukan *silent refresh* proaktif jika masa aktif mendekati habis.
   - Menambahkan konstanta pesan ramah pengguna non-teknis ke kamus sentral `TEXT_AUTH`.

4. **Admin Action Service Layer:**
   - Berkas: `src/services/adminActionService.ts` & `src/services/adminActionService.test.ts`
   - Mengintegrasikan pemanggilan Edge Function, sanitasi galat, penanganan status HTTP 401/403/500, dan pengujian unit test menyeluruh (TDD).

5. **Refactoring Pemanggil Aksi Administratif:**
   - Berkas: `src/services/routes/users.ts` & `src/services/pageManagementService.ts`
   - Memigrasikan seluruh pemanggilan mutasi (`addUserProfile`, `updateUserProfileRole`, `toggleUserProfileStatus`, `revokeUserProfile`, `updatePageSetting`, `updatePagePermissions`, `bulkUpdatePageSettings`) agar mengalir melalui `invokeAdminAction()`.
   - Memperbarui unit test pada `users.test.ts` dan `pageManagementService.test.ts`.

---

## Before vs After

| Aspek | Before (Rentan) | After (Aman & Terverifikasi) |
| --- | --- | --- |
| **Verifikasi Server-Side** | Server tidak memverifikasi identitas pengguna; mempercayai parameter string `p_acting_email` dari klien. | Server (Edge Function) memverifikasi Google Access Token secara independen ke Google Tokeninfo API dan mengekstrak `verified_email`. |
| **Izin Eksekusi RPC Database** | Diberikan ke `PUBLIC` dan `anon` (`GRANT EXECUTE ... TO anon`). | Dicabut total dari `PUBLIC`, `anon`, dan `authenticated`; hanya boleh dipanggil oleh `service_role`. |
| **Eksploitasi cURL Anonim** | Siapa saja dengan anon key publik dapat memanggil RPC dan memalsukan email Superadmin. | cURL langsung dengan anon key diblokir seketika oleh PostgreSQL (`403 Permission Denied`). |
| **Penambahan Akun Baru** | Memakai direct `INSERT` ke tabel `user_profiles` dari klien tanpa validasi peran di server. | Melewati RPC `admin_add_user_profile` via Edge Function dengan proteksi anti-eskalasi peran Superadmin. |
| **Ketergantungan Sesi** | Tidak ada validasi token Google pada operasi administratif. | Token Google wajib aktif dan terverifikasi sah milik Superadmin/Admin saat mutasi dilakukan. |
| **Pengalaman Pengguna (UX)** | Pesan error teknis database dapat bocor ke antarmuka pengguna. | Seluruh galat otentikasi dan otorisasi disanitasi menjadi pesan non-teknis yang ramah pengguna. |

---

## Case: Skenario Lapangan

- **Skenario 1: Penyerang mencoba memalsukan identitas Superadmin via cURL**
  - *Tindakan:* Penyerang mengirim POST ke `/rest/v1/rpc/admin_update_user_role` dengan `apikey = ANON_KEY` dan parameter `p_acting_email = "superadmin@transjakarta.co.id"`.
  - *Hasil:* PostgreSQL mengembalikan `403 Forbidden` / `permission denied for function admin_update_user_role`. Serangan gagal total.
- **Skenario 2: Penyerang mengirim token acak atau kedaluwarsa ke Edge Function**
  - *Tindakan:* Penyerang menembak endpoint `admin-action` dengan header `x-google-token: fake_token_abc`.
  - *Hasil:* Edge Function memvalidasi ke Google Tokeninfo, mendeteksi token tidak valid, dan mengembalikan HTTP 401: *"Token Google tidak valid atau telah kedaluwarsa"*.
- **Skenario 3: Superadmin sah mengubah peran pengguna dari dashboard manajemen**
  - *Tindakan:* Superadmin aktif memilih unit dan mengubah peran pengguna Budi menjadi Korlap.
  - *Hasil:* Frontend mengambil Google Token yang aktif dari penyimpanan lokal peramban, Edge Function memverifikasi kepemilikan email Superadmin, mencocokkan hak peran di database, dan mutasi berhasil dilakukan dalam hitungan milidetik.
- **Skenario 4: Administrator biasa mencoba membuat akun Superadmin**
  - *Tindakan:* Pengguna dengan peran Admin mencoba menambahkan user baru dengan peran Superadmin (`role_id: 1`).
  - *Hasil:* Fungsi database `admin_add_user_profile` mendeteksi bahwa pemanggil bukan Superadmin dan menolak operasi: *"Akses ditolak: Administrator tidak dapat menambahkan akun dengan peran Superadmin."*

---

## Batas Dampak Mutasi

- **Formula Spreadsheet (SSOT):** Aman 100%. Tidak ada interaksi, mutasi, atau penimpaan kolom rumus spreadsheet bawaan.
- **Kalkulasi Domain:** Tidak mengubah definisi ritase PP (2 trip) maupun `km_baku`.
- **Sesi Pengguna:** Sesi login pengguna operasional Mikrotrans tetap permanen (*no timeout*), tidak terganggu oleh masa aktif token Supabase Auth.
