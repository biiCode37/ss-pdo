# Spesifikasi Desain: Hak Akses Granular Per-Role & Per-Akun Serta Multi-Select Bulk Action pada Manajemen Halaman

**Tanggal:** 2026-10-31  
**Status:** Disetujui (Approved)  
**Tipe:** Ekstensi Fitur & Peningkatan Keamanan (Superadmin Only)  
**Target Branch:** `devmode`  

---

## 1. Latar Belakang & Tujuan
Sebelumnya, fitur "Manajemen Halaman" hanya mengatur status aktif/pemeliharaan (*master switch*) secara global, dengan aturan izin akses per peran (*role*) yang masih terikat secara statis (*hardcoded* di `canAccessPage`).

Untuk memberikan fleksibilitas operasional penuh tanpa mengorbankan stabilitas sistem, fitur ini diperluas menjadi:
1. **Kontrol Akses Berbasis Peran (*Role Baseline*):** Superadmin dapat menentukan peran mana saja (`admin`, `korwil`, `korlap`, `pdo`) yang diizinkan mengakses halaman/fitur tertentu secara dinamis.
2. **Pengecualian Khusus Per-Akun (*Granular User Overrides - Whitelist & Blacklist*):**
   * **Whitelist (Izin Tambahan):** Memberikan akses ke akun tertentu meskipun perannya secara default dilarang.
   * **Blacklist (Pembatasan Khusus):** Mencabut akses dari akun tertentu meskipun perannya secara default diizinkan.
   * **Safety Warning Dialog:** Setiap pemberian izin yang bertentangan dengan aturan default peran wajib disertai dialog konfirmasi keselamatan sebelum dieksekusi.
3. **Pencarian Pengguna Terdaftar (*Typo-Proof User Selector*):** Pemilihan akun dilakukan melalui daftar pengguna terdaftar dari `user_profiles` lengkap dengan badge peran dan pencarian instan nama/email.
4. **Multi-Select & Bulk Action Bar:** Superadmin dapat mencentang beberapa halaman sekaligus untuk:
   * Mengaktifkan status banyak halaman serempak (*Enable All*).
   * Menomaktifkan status banyak halaman serempak (*Disable / Maintenance All*).
   * Mengatur izin role massal (*Bulk Role Assignment*).
   * Mengembalikan konfigurasi halaman terpilih ke aturan standar (*Reset to Default*).
5. **Transparansi Akses Terbatas (*Human-Friendly Access Denied*):** Pengguna yang dilarang mengakses halaman akan melihat informasi ramah yang menampilkan daftar nama personil Superadmin aktif yang dapat dihubungi.

---

## 2. Batasan Kritis & Mitigasi Risiko

1. **Perlindungan Akun Superadmin & Self-Lockout Prevention:**
   * Peran `superadmin` memiliki akses mutlak (*master bypass*) ke seluruh halaman dan fitur.
   * Peran `superadmin` tidak dapat dihapus dari daftar `allowed_roles` halaman mana pun.
   * Halaman sistem `page_management` terkunci permanen dan dikecualikan dari fitur multi-select / bulk action.
2. **Keamanan Database & Anti-Privilege Escalation:**
   * Seluruh mutasi izin wajib dieksekusi melalui fungsi PostgreSQL `SECURITY DEFINER` (RPC) yang memvalidasi bahwa pemanggil adalah Superadmin aktif (`user_profiles.is_active = true` AND `roles.code = 'superadmin'`).
   * Tabel `app_page_settings` tetap berstatus *Read-Only* bagi publik dan authenticated biasa.
3. **Sanitasi Anti-XSS (SweetAlert2 & Modal Templates):**
   * Semua data dinamis (nama pengguna, email, peran, nama halaman) yang disuntikkan ke dalam dialog konfirmasi SweetAlert2 atau template HTML wajib melalui fungsi pembersih `escapeHtml()`.
4. **Ketahanan Jaringan Lapangan (Offline-First Resilience):**
   * Perubahan izin langsung diperbarui di `localStorage` (*optimistic update*).
   * Jika jaringan internet terputus, aplikasi tetap berjalan stabil menggunakan data cache lokal terakhir dengan fallback ke `DEFAULT_PAGE_SETTINGS`.
5. **Standar Desain Mobile-First & Aksesibilitas WCAG:**
   * Dilarang menggunakan nilai warna mentah (*hardcoded hex/rgb*). Wajib merujuk ke token semantik `src/styles/tokens/semantic.css` yang telah teruji rasio kontras WCAG AA/AAA di Light Mode dan Dark Mode.
   * Ukuran area sentuh tombol minimum 44px dengan transisi pegas iOS `cubic-bezier(0.32, 0.72, 0, 1)`.
6. **Kamus Teks Sentral (No Hardcoded UI Strings):**
   * Seluruh teks antarmuka, label, dialog SweetAlert2, dan notifikasi wajib tersentralisasi di `src/constants/texts/text_page_management.ts`.

---

## 3. Arsitektur Data & Keamanan Database

### 3.1 Migrasi Skema Supabase (`public.app_page_settings`)
Menambahkan kolom native PostgreSQL:
```sql
ALTER TABLE public.app_page_settings
ADD COLUMN IF NOT EXISTS allowed_roles text[] NOT NULL DEFAULT ARRAY['superadmin', 'admin', 'korwil', 'korlap', 'pdo']::text[],
ADD COLUMN IF NOT EXISTS allowed_user_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS denied_user_emails text[] NOT NULL DEFAULT ARRAY[]::text[];
```

Pengaturan nilai default per kategori halaman:
* **Halaman Umum** (`dashboard`, `input`, `analytics`, `units`):
  `allowed_roles = ARRAY['superadmin', 'admin', 'korwil', 'korlap', 'pdo']`
* **Halaman Monitoring Wilayah** (`regional_monitoring`, `regional_summary`, `regional_wa_report`):
  `allowed_roles = ARRAY['superadmin', 'admin', 'korwil', 'korlap']` (PDO dibatasi secara default)
* **Halaman Manajemen Pengguna** (`user_management`):
  `allowed_roles = ARRAY['superadmin', 'admin']`
* **Form & Modal Operasional** (`a2_report`, `accumulation`):
  `allowed_roles = ARRAY['superadmin', 'admin', 'korwil', 'korlap', 'pdo']`

### 3.2 Fungsi PostgreSQL `SECURITY DEFINER` (RPC)

1. **`admin_update_page_permissions`:**
   * Mengubah hak akses role dan override user untuk 1 halaman.
   * Memvalidasi pemanggil adalah Superadmin aktif.
   * Menolak jika `superadmin` tidak disertakan di `allowed_roles`.
   * Menolak perubahan pada `page_key = 'page_management'`.

2. **`admin_bulk_update_page_settings`:**
   * Menjalankan mutasi massal pada daftar `page_keys[]`.
   * Aksi yang didukung:
     * `'set_status'`: Mengubah kolom `is_enabled` serentak.
     * `'set_roles'`: Mengubah kolom `allowed_roles` serentak (memastikan `superadmin` selalu ada).
     * `'reset_default'`: Mengembalikan kolom `allowed_roles`, `allowed_user_emails`, dan `denied_user_emails` ke standar sistem.

---

## 4. Logika Evaluasi Hak Akses & Urutan Prioritas

Di dalam `src/context/PageAccessContext.tsx`, fungsi evaluasi diimplementasikan sebagai:
```typescript
canAccessPage(
  pageKey: PageKey, 
  userRole?: string | null, 
  userEmail?: string | null
): boolean
```
Jika `userEmail` tidak dioper, fungsi otomatis mengambil email dari `localStorage.getItem('PDO_USER_EMAIL')` demi kompatibilitas penuh.

### Alur Evaluasi (5 Langkah Berurutan):
```
[Evaluasi canAccessPage]
        │
        ├─ 1. Apakah userRole === 'superadmin'?
        │     └── YES ──► IZINKAN (Akses Penuh Superadmin)
        │
        ├─ 2. Apakah setting.is_enabled === false?
        │     └── YES ──► TOLAK (Mode Pemeliharaan Aktif)
        │
        ├─ 3. Apakah email ada di denied_user_emails?
        │     └── YES ──► TOLAK (Blacklist Spesifik Akun)
        │
        ├─ 4. Apakah email ada di allowed_user_emails?
        │     └── YES ──► IZINKAN (Whitelist Spesifik Akun)
        │
        ├─ 5. Apakah userRole ada di setting.allowed_roles?
        │     ├── YES ──► IZINKAN (Izin Standar Peran)
        │     └── NO  ──► TOLAK (Peran Tidak Diizinkan)
        ▼
   [Selesai]
```

---

## 5. Komponen Antarmuka Pengguna (UI/UX)

### 5.1 Peningkatan `PageManagementPage.tsx`
* **Header:**
  * Tombol toggle **"Pilih Banyak"** / **"Selesai"**.
  * Saat mode seleksi aktif: menampilkan hitungan *"N Halaman Dipilih"*, tombol *"Pilih Semua"*, dan *"Batalkan Pilihan"*.
* **Kartu Halaman:**
  * Checkbox di sisi kiri kartu dengan transisi pegas mulus saat mode seleksi aktif.
  * Halaman sistem `page_management` tidak memiliki checkbox (dilindungi).
  * Menampilkan badge ringkasan peran (misal: *"Admin, Korwil, Korlap"*).
  * Menampilkan badge pengecualian akun jika ada:
    * Hijau: *"+2 Akun Khusus"* (Whitelist).
    * Oranye: *"-1 Akun Dibatasi"* (Blacklist).
  * Tombol **"Atur Akses"** (`SlidersHorizontal`) untuk membuka modal perizinan.

### 5.2 Modal Pengaturan Izin Halaman (`PageAccessConfigModal.tsx`)
* Dibuka saat Superadmin menekan tombol "Atur Akses" pada suatu halaman.
* **Bagian 1: Hak Akses Berdasarkan Peran (Role Baseline)**
  * Checklist interaktif: `Admin`, `Korwil`, `Korlap`, `PDO`.
  * `Superadmin` tercentang permanen dan berlabel *"Akses Wajib"*.
* **Bagian 2: Pengecualian Akses Per-Akun (User Overrides)**
  * Segmented Tabs: **"Izin Tambahan (Whitelist)"** vs **"Pembatasan Khusus (Blacklist)"**.
  * Tombol **"+ Tambah Akun"** membuka pemilih pengguna terdaftar (`UserPickerModal`).
  * Menampilkan kartu akun terdaftar dalam daftar override dengan opsi hapus (`X`).

### 5.3 Dialog Konfirmasi Keselamatan (*Safety Confirmation Dialog*)
* Dijalankan sebelum akun ditambahkan ke daftar Whitelist atau Blacklist:
  * **Whitelist Warning:** Akun memiliki peran yang belum diizinkan $\rightarrow$ Peringatan: *"Akun [Nama] memiliki peran [Role] yang secara default tidak memiliki akses. Berikan pengecualian izin?"*
  * **Blacklist Warning:** Akun memiliki peran yang sudah diizinkan $\rightarrow$ Peringatan: *"Akun [Nama] memiliki peran [Role] yang secara umum berhak mengakses. Yakin ingin memblokir akses akun ini?"*

### 5.4 Floating Bulk Action Bar (`FloatingBulkActionBar.tsx`)
* Muncul meluncur dari bawah layar saat minimal 1 halaman tercentang.
* Aksi:
  * **Aktifkan Semua:** Mengaktifkan status seluruh halaman terpilih.
  * **Nonaktifkan Semua:** Memasukkan seluruh halaman terpilih ke mode perbaikan.
  * **Atur Izin Role:** Membuka `BulkRoleConfigModal` untuk menetapkan peran yang diizinkan sekaligus.
  * **Reset ke Standar:** Mengembalikan halaman terpilih ke aturan default sistem setelah konfirmasi SweetAlert2.

### 5.5 Layar Informasi Akses Dibatasi (`AccessRestrictedState.tsx`)
* Ditampilkan saat pengguna non-superadmin membuka halaman/fitur yang dibatasi untuk peran/akunnya.
* Menampilkan pesan ramah: *"Akses Dibatasi: Akun Anda belum memiliki izin untuk mengakses halaman ini."*
* **Menampilkan Daftar Nama Superadmin Aktif:**
  * Mengambil nama lengkap personil Superadmin yang berstatus aktif (`user_profiles.role_id = 1` AND `is_active = true`).
  * *"Silakan hubungi Superadmin berikut untuk permohonan akses: Bpk. Abi, ..."*
* Tombol kembali ke Dashboard.

---

## 6. Kamus Teks Sentral (`src/constants/texts/text_page_management.ts`)
Semua string UI, notifikasi, toast, dan dialog konfirmasi didefinisikan secara sentral:
* Label tombol, header, deskripsi badge.
* Teks dialog konfirmasi Whitelist & Blacklist (template function dengan sanitasi).
* Teks konfirmasi aksi massal (*Bulk Action*).
* Pesan akses dibatasi beserta format daftar nama Superadmin.

---

## 7. Rencana Pengujian & Quality Gates

1. **Unit Test Vitest:**
   * `src/context/PageAccessContext.test.tsx`:
     * Superadmin selalu diizinkan (*master bypass*).
     * Mode pemeliharaan menolak peran lain.
     * Evaluasi Blacklist spesifik akun berhasil menolak akses.
     * Evaluasi Whitelist spesifik akun berhasil memberikan akses lintas peran.
     * Fallback default role baseline.
   * `src/services/pageManagementService.test.ts`:
     * RPC mutasi per-halaman & bulk update.
   * `src/components/pageManagement/PageManagementPage.test.tsx`:
     * Render daftar kartu dengan badge ringkasan izin.
     * Toggle mode multi-select dan aktivasi floating action bar.
     * Pencegahan pemilihan halaman sistem yang terkunci.
   * `src/constants/texts/texts.test.ts`:
     * Integritas seluruh entri kamus teks baru.
2. **Uji Kontrak Warna Token (Accessibility):**
   * `pnpm vitest run src/styles/tokens/color-contract.test.ts` lulus 100% (WCAG AA/AAA).
3. **TypeScript Strict & Production Build:**
   * `pnpm run build` lulus 0 error (`tsc -b` + Vite).
4. **Graf Pengetahuan Kode:**
   * `graphify update .` untuk menyinkronkan seluruh node arsitektur baru.
