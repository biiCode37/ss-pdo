# Audit Temuan Bug & Keamanan: Eliminasi Permintaan Login Ulang Tak Terduga Saat Simpan Pengaturan Halaman (Refactor 196)

**Tanggal:** 3 November 2026  
**Auditor:** Expert Senior Software Engineering / Cyber Security Specialist  
**Konteks Target:** SS_PDO (Sistem Pemantauan Data Operasional Bus & Supabase Admin Actions)  
**Branch:** `devmode`  

---

## Ringkasan Eksekutif

Ketika pengguna berwenang (Superadmin) melakukan konfigurasi izin granular pada halaman **Manajemen Halaman** (seperti menambahkan akun ke dalam *Whitelist* atau *Blacklist*) lalu menekan tombol **"Simpan Pengaturan"**, aplikasi secara tiba-tiba memunculkan dialog/popup login akun Google (*interactive OAuth re-login*). Apabila popup tersebut dibatalkan, ditutup, atau diblokir oleh peramban, penyimpanan pengaturan gagal dengan respons HTTP `401 Unauthorized` dari Supabase Edge Function `admin-action` dan memicu toast error *"Gagal menyimpan pengaturan izin halaman"*.

Masalah ini berakar dari ketergantungan kriptografis mutasi administratif pada Google OAuth Access Token (GIS implicit token flow) yang memiliki masa berlaku terbatas (maksimal 60 menit / 1 jam) tanpa *refresh token*. Hal ini bertentangan dengan **Golden Rule #3 (Sesi Login Pengguna Permanen Tanpa Batas Waktu)**.

---

## Tabel Temuan Audit

| ID Temuan | Lokasi Kode | Keparahan | Kategori | Deskripsi Singkat | Dampak Pengguna & Sistem | Rekomendasi Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-196-01** | `src/services/adminActionService.ts`<br>`src/services/googleSheets/authSession.ts` | 🔴 **HIGH** (UX & Session Violation) | Unexpected Re-auth Interruption | Pemanggilan `getGoogleAccessToken(true)` memicu `client.requestAccessToken()` secara interaktif di tengah proses simpan form ketika token > 1 jam | Pengguna terkejut dan terganggu oleh popup akun Google saat menekan "Simpan Pengaturan"; jika popup diblokir peramban, penyimpanan gagal | 1. Implementasikan HMAC-SHA256 Admin Session Token yang tahan lama (1 tahun/permanen) di Edge Function `admin-action`.<br>2. Hapus pemanggilan popup otomatis tanpa izin dari `getGoogleAccessToken`.<br>3. Sediakan konfirmasi ramah pengguna sebelum re-autentikasi jika kredensial benar-benar habis. |
| **AUTH-196-02** | `supabase/functions/admin-action/index.ts` | 🟠 **HIGH** (Architectural Rigidity) | Single-Point Token Expiration | Edge Function `admin-action` hanya memverifikasi token via Google Tokeninfo (`oauth2.googleapis.com/tokeninfo`). Setelah 60 menit, semua aksi admin gagal 401 | Admin yang sudah login seharian di lapangan tidak dapat mengubah status halaman atau izin tanpa login ulang Google berulang kali | Tambahkan dukungan dual-auth: periksa `x-admin-session-token` (HMAC JWT) terlebih dahulu, fallback ke `x-google-token`, dan otomatis terbitkan session token baru pada respon sukses. |
| **AUTH-196-03** | `src/services/googleSheets/authSession.ts` | 🟡 **MEDIUM** (Performance & UX Freeze) | Silent Refresh Hang & Missing Account Hint | `refreshTokenInteractiveOrSilent` memanggil `client.requestAccessToken({ prompt: "" })` tanpa parameter `hint: userEmail` dan menunggu timeout 8 detik | Proses penyimpanan mengalami jeda beku (*freeze*) selama 8 detik sebelum akhirnya gagal atau memicu popup; peramban mendeteksi kehilangan *transient user activation* sehingga memblokir popup Google | 1. Sematkan `hint: userEmail` dari `PDO_USER_EMAIL` agar GIS mengenali akun yang dituju.<br>2. Kurangi timeout silent refresh menjadi 3.000 ms. |
| **AUTH-196-04** | `supabase/functions/admin-action/index.ts` | 🔴 **CRITICAL** (Auth Bypass & Infinite 401 Loop) | Fallback Anon Key Injection to Google Auth | Ketika header `x-google-token` tidak terbaca dari peramban, Edge Function fallback memeriksa `Authorization: Bearer ...`. Karena Supabase JS selalu menyertakan Supabase Anon Key pada header `Authorization`, Anon Key tersebut dikirim ke API Google OAuth, memicu penolakan 401 berulang | Konfirmasi akun Google selalu gagal 401 meskipun pengguna telah berhasil memilih akun di popup berkali-kali, mengurung admin dalam loop tanpa jalan keluar | 1. Hapus fallback `Authorization: Bearer` yang menyamakan Supabase Anon Key dengan Google Token.<br>2. Baca token langsung dari body payload (`admin_session_token`, `google_token`). |
| **AUTH-196-05** | `src/services/adminActionService.ts` | 🟠 **HIGH** (Header Stripping & Swallowed Error) | Fragile Custom Headers & Uncloned Response Body | Kredensial hanya dikirim melalui custom HTTP headers (`x-admin-session-token`, `x-google-token`) yang rentan dipangkas oleh proxy/gateway. Error body `res.json()` juga gagal terbaca karena response stream telah terkunci | Header tidak sampai ke Edge Runtime dan pesan error detail tertutup oleh string generik *"Edge Function returned a non-2xx status code"* | 1. Kirim token autentikasi di headers DAN di JSON request body.<br>2. Kloning response stream (`res.clone().json()`) sebelum membaca body error. |
