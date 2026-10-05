# AUDIT BUGS: MODULAR LOGIN SCREEN & COMPLIANCE BOTTOM SHEET (REFACTOR 21)

Dokumen ini mencatat temuan audit UI/UX dan arsitektur kode pada layar autentikasi (`LoginScreen.tsx`), mengidentifikasi beban monolithic god-file, dinding teks scroll berlebih pada mobile, serta kurangnya pemisahan antara alur aksi utama (Google Sign-In) dengan dokumen edukasi dan transparansi kepatuhan Google OAuth.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :---: | :---: |
| **UI-21-01** | `src/components/LoginScreen.tsx`<br>`src/components/login/*` | 🔴 **HIGH** (Monolithic God-File & Dinding Teks Mobile) | Terselesaikan |
| **UI-21-02** | `src/components/LoginScreen.tsx`<br>`src/components/login/LoginInfoModal.tsx` | 🟡 **MEDIUM** (Aksesibilitas Edukasi & Google OAuth Compliance) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 UI-21-01: Layar Masuk Menampung 1.132 Baris Kode dalam Satu God-File Monolith

- **ID Temuan:** `UI-21-01`
- **Lokasi Kode:**
  - `src/components/LoginScreen.tsx` (1.132 baris sebelum refactor)
- **Keparahan:** **HIGH** (Arsitektur Anti-Pattern & Kelelahan Pengguna Mobile)
- **Deskripsi Masalah:**
  1. File `LoginScreen.tsx` bertindak sebagai *god-file* raksasa yang menggabungkan:
     - Logika state OAuth & verifikasi profil Supabase.
     - Card branding dan tombol login Google.
     - Tiga seksi teks panjang: Tentang PUSM, komparasi Google Sheets vs PUSM, dan transparansi scope izin Google Spreadsheet.
     - Tiga kartu fitur utama.
     - Footer legal dan handling URL Hash.
  2. Dari sudut pandang pengguna lapangan di smartphone, halaman ini memaksa scroll vertikal yang sangat panjang (~1.100 baris DOM). Padahal 95% kebutuhan petugas yang membuka aplikasi hanya butuh **satu aksi instan: klik tombol Masuk Akun Google**.
- **Dampak ke Pengguna Lapangan (User Impact):**
  - Tampilan terasa berat, penuh teks (*visual clutter*), dan membingungkan petugas operasional yang membutuhkan alur masuk cepat saat pergantian shift kerja di pool bus.
  - Beban kompilasi dan pemeliharaan kode oleh pengembang menjadi rentan regresi karena logika autentikasi bercampur aduk dengan markup presentasional ratusan baris.
- **Mitigasi:**
  - Pecah komponen menjadi arsitektur modular yang rapi:
    - `src/components/LoginScreen.tsx` (Controller ringkas < 180 baris).
    - `src/components/login/LoginHeroCard.tsx` (Fokus aksi login Google, branding tajam, hint akun).
    - `src/components/login/LoginFeatureCards.tsx` (Ringkasan 3 pilar fitur dalam kartu modern).
    - `src/components/login/LoginInfoModal.tsx` (Bottom sheet untuk edukasi & transparansi izin).
    - `src/components/login/LoginFooter.tsx` (Tautan legal & copyright).

---

### 🟡 UI-21-02: Dinding Teks Komparasi & Transparansi Izin Spreadsheet Mencemari Tampilan Utama

- **ID Temuan:** `UI-21-02`
- **Lokasi Kode:**
  - `src/components/LoginScreen.tsx`
  - `src/components/login/LoginInfoModal.tsx`
- **Keparahan:** **MEDIUM** (Kerapian UX & Kepatuhan Audit Google OAuth)
- **Deskripsi Masalah:**
  Penjelasan komparasi fitur (Spreadsheet biasa vs PUSM) dan transparansi izin OAuth wajib disediakan demi kepatuhan verifikasi Google Cloud Console, namun meletakkannya secara mentah dan terbuka penuh di layar utama membuat tata letak aplikasi kehilangan fokus utamanya.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Petugas di lapangan merasa bingung dengan banyaknya teks perbandingan dan accordion izin yang meregangkan layar.
- **Mitigasi:**
  - Bungkus seluruh informasi edukasi, komparasi tabel, dan transparansi izin Google ke dalam **Bottom Sheet interaktif** (`LoginInfoModal`) yang dapat dipicu melalui tombol elegan: *"ℹ️ Pelajari Aplikasi & Izin Akses"*.
  - Pertahankan dukungan URL Hash `#privacy`, `#terms`, `#developer`, dan `#info` agar crawler verifikasi Google tetap dapat mengakses seluruh dokumen legal secara instan.
