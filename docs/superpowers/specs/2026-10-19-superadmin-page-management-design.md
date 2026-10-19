# Spesifikasi Desain: Fitur Manajemen Halaman Superadmin (Realtime Page Access Control)

**Tanggal:** 2026-10-19  
**Status:** Disetujui (Approved)  
**Tipe:** Fitur Baru (Superadmin Only)  
**Target Branch:** `devmode`  

---

## 1. Latar Belakang & Tujuan
Untuk memudahkan pemeliharaan, pengujian bertahap, dan mitigasi kendala operasional lapangan, Superadmin memerlukan kemampuan untuk mengaktifkan (*enable*) atau menonaktifkan (*disable*) halaman atau sub-halaman aplikasi secara dinamis.

Perubahan status harus disinkronkan ke seluruh pengguna secara **realtime**. Pengguna biasa (role selain `superadmin`) yang membuka halaman nonaktif akan mendapatkan pesan informatif dan ramah:
> *"Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan"*

Sementara itu, Superadmin tetap memiliki akses penuh (*bypass*) untuk keperluan verifikasi dan pengujian, disertai indikator visual pemeliharaan.

---

## 2. Batasan Kritis & Mitigasi Risiko
1. **Pencegahan Self-Lockout:**
   Halaman Manajemen Halaman (*Page Management*) itu sendiri dikecualikan secara permanen dari opsi penonaktifan. Halaman ini hanya dapat diakses oleh pengguna dengan role `superadmin`.
2. **Perlindungan Data Operasional Lapangan:**
   Penonaktifan form input bus tidak akan menghapus antrean data lokal (*offline queue*) di peranti pengguna yang belum sempat terunggah ke Google Sheets.
3. **Keandalan Jaringan Lapangan:**
   Status halaman disimpan dalam *local cache* (`localStorage`) sebagai *fallback*. Jika koneksi WebSocket Supabase Realtime terputus di area sinyal lemah, aplikasi tetap stabil menggunakan status terakhir.
4. **Isolasi Role Ketat:**
   Pintu masuk menu Manajemen Halaman disembunyikan 100% dari pengguna non-superadmin baik di navigasi maupun sheet profil.

---

## 3. Arsitektur Data & Sinkronisasi Realtime

### 3.1 Skema Database Supabase (`app_page_settings`)
Tabel baru dibuat melalui migrasi SQL:
```sql
CREATE TABLE IF NOT EXISTS public.app_page_settings (
  page_key text PRIMARY KEY,
  page_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('page', 'tab', 'modal')),
  is_enabled boolean NOT NULL DEFAULT true,
  disabled_message text DEFAULT 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- RLS: Read untuk semua user, Mutasi hanya Superadmin
ALTER TABLE public.app_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read app_page_settings for authenticated"
  ON public.app_page_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow modify app_page_settings for superadmin only"
  ON public.app_page_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.email = auth.jwt() ->> 'email'
        AND user_profiles.role_id = 1
        AND user_profiles.is_active = true
    )
  );

-- Aktifkan Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_page_settings;
```

### 3.2 Katalog Halaman & Fitur Default (Initial Seed)
| `page_key` | `page_name` | `category` | `is_enabled` |
| :--- | :--- | :--- | :--- |
| `dashboard` | Dashboard Operasional Rute | page | `true` |
| `regional_monitoring` | Monitoring 18 Rute Wilayah | page | `true` |
| `user_management` | Manajemen Pengguna RBAC | page | `true` |
| `input` | Form Input Bus SS PDO | tab | `true` |
| `analytics` | Analitik & Capaian Rute | tab | `true` |
| `units` | Daftar Unit Armada | tab | `true` |
| `regional_summary` | Tab Rekap Wilayah | tab | `true` |
| `regional_wa_report` | Tab Generator Laporan WA | tab | `true` |
| `a2_report` | Form Laporan Operasional A2 | modal | `true` |
| `accumulation` | Rekap Akumulasi Periode | modal | `true` |

---

## 4. Arsitektur Frontend & State Management

### 4.1 Modul Servis (`src/services/pageManagementService.ts`)
* `fetchPageSettings()`: Membaca seluruh data dari `app_page_settings` dengan fallback ke cache lokal jika offline.
* `updatePageSetting(pageKey, isEnabled, email)`: Mengupdate status halaman ke Supabase dan mencatat email pengubah.
* `subscribeToPageSettings(callback)`: Mendaftarkan listener WebSocket Supabase Realtime channel `public:app_page_settings` untuk event `UPDATE`, `INSERT`, dan `DELETE`.

### 4.2 State Management (`src/context/PageAccessContext.tsx`)
Menyediakan hooks `usePageAccess()`:
* `pageSettings`: Peta konfigurasi seluruh halaman.
* `canAccessPage(pageKey)`: Evaluasi izin:
  * Jika `currentUserRole === 'superadmin'` $\rightarrow$ selalu `true`.
  * Jika selain superadmin $\rightarrow$ mengikuti nilai `pageSettings[pageKey]?.is_enabled ?? true`.
* `isUnderMaintenance(pageKey)`: Mengembalikan `true` jika halaman sedang berstatus `is_enabled === false`.
* `togglePageStatus(pageKey, nextStatus)`: Mutasi status dengan *optimistic UI update*.

---

## 5. Komponen Antarmuka Pengguna (UI/UX)

### 5.1 Halaman Manajemen Halaman (`PageManagementPage.tsx`)
* **Akses:** Khusus Superadmin melalui Menu Profil.
* **Filter Segmented:** `[Semua]`, `[Halaman]`, `[Tab]`, `[Fitur Modal]`.
* **Daftar Kartu Pengaturan:**
  * Judul halaman & lokasi kategori.
  * Switch toggle fisik iOS-style dengan transisi halus (`cubic-bezier(0.32, 0.72, 0, 1)`).
  * Indikator status: Hijau (Aktif) / Oranye (Pemeliharaan).
  * Proteksi khusus: Halaman "Manajemen Halaman" dikunci permanen dengan status *Aktif (Terkunci)*.

### 5.2 Layar Pemeliharaan Pengguna Biasa (`PageDisabledState.tsx`)
* Ditampilkan menggantikan halaman/tab jika user bukan Superadmin dan fitur sedang dinonaktifkan.
* Menggunakan styling Mobile-First, Light Mode & Dark Mode.
* Teks antarmuka:
  * Judul: *"Sedang Dalam Pemeliharaan"*
  * Deskripsi: *"Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan"*
  * Tombol aksi: *"Kembali ke Dashboard"* (untuk level halaman).

### 5.3 Banner Pemeliharaan Superadmin (`SuperadminMaintenanceBanner.tsx`)
* Muncul sebagai *sticky banner* di bagian atas layar ketika Superadmin membuka halaman yang sedang dinonaktifkan:
  > 🟡 **Mode Pratinjau Superadmin:** Halaman ini sedang dinonaktifkan untuk pengguna lain.

---

## 6. Standar Kamus Teks Sentral (`src/constants/texts/`)
Dilarang ada *hardcoded string*. Seluruh teks didefinisikan pada:
* `src/constants/texts/text_page_management.ts`
* Unit test integritas pada `src/constants/texts/texts.test.ts`.

---

## 7. Rencana Pengujian & Verifikasi
1. **Unit Test:**
   * Servis `pageManagementService.test.ts`.
   * Hook & Context `usePageAccess.test.tsx`.
   * Komponen `PageDisabledState.test.tsx` dan `PageManagementPage.test.tsx`.
   * Uji integritas kamus teks pada `texts.test.ts`.
2. **Quality Gates:**
   * `pnpm vitest run src/` lulus 100%.
   * `pnpm run build` (`tsc -b` + Vite) lulus 0 error.
   * `graphify update .` untuk memperbarui graf pengetahuan kode.
