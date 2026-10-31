# REPAIR REPORT — Refactor 177: Granular Page Access Control & Multi-Select Bulk Action

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Status Verifikasi:** 100% Lulus (131 test files, 1,126 tests passed, TypeScript 0 error, Vite build sukses)  

---

## 1. Ringkasan Implementasi Arsitektur

Refactor 177 memperluas kemampuan modul **Manajemen Halaman** khusus Superadmin dengan fondasi multi-dimensi skala industri global:
1. **Database & Backend Security (`supabase/migrations/20261031000001_granular_page_access_and_bulk_action.sql`):**
   * Penambahan kolom native array: `allowed_roles text[]`, `allowed_user_emails text[]`, dan `denied_user_emails text[]` pada tabel `public.app_page_settings`.
   * Dua fungsi PostgreSQL `SECURITY DEFINER`:
     * `public.admin_update_page_permissions`: Memutasi izin role dan user overrides untuk 1 halaman dengan validasi Superadmin aktif dan proteksi lockout halaman sistem.
     * `public.admin_bulk_update_page_settings`: Mengeksekusi mutasi massal (`set_status`, `set_roles`, `reset_default`) pada sekumpulan halaman terpilih sekaligus.
2. **Access Engine Terstruktur (`src/context/PageAccessContext.tsx`):**
   * Evaluasi hak akses 5 tingkat berurutan:
     1. Superadmin Bypass (Akses Mutlak).
     2. Master Switch (Mode Pemeliharaan Global).
     3. User Blacklist (Explicit Deny per-Akun).
     4. User Whitelist (Explicit Allow per-Akun).
     5. Role Baseline (Daftar Peran yang Diizinkan).
   * Fallback otomatis ke `localStorage.getItem('PDO_USER_EMAIL')` demi kompatibilitas penuh tanpa *breaking changes*.
3. **Pencarian Pengguna & Dialog Keselamatan:**
   * Modal `UserPickerModal.tsx`: Memuat data dari `user_profiles` dengan pencarian instan nama/email, avatar, dan `RoleBadge` semantik (*typo-proof*).
   * Helper `pageAccessSafetyDialog.ts`: Dialog SweetAlert2 bernada peringatan jika penugasan akun bertentangan dengan aturan default perannya, diproteksi sanitasi anti-XSS `escapeHtml()`.
4. **Antarmuka Mobile-First & Bulk Action Bar:**
   * `PageManagementPage.tsx`: Tombol toggle mode seleksi di header, checkbox beranimasi geser halus, badge peran dan indikator akun khusus (+N Whitelist / -N Blacklist), serta tombol "Atur Akses".
   * `FloatingBulkActionBar.tsx`: Bar mengambang di bawah layar ponsel saat kartu dipilih, menyediakan aksi: Aktifkan Semua, Nonaktifkan Semua, Izin Role Bersama, dan Reset Standar.
   * `BulkRoleConfigModal.tsx`: Dialog penetapan peran serentak ke seluruh halaman terpilih.
5. **Transparansi Akses Terbatas (`AccessRestrictedState.tsx`):**
   * Menampilkan daftar nama personil Superadmin aktif dari `user_profiles` lengkap dengan badge resmi agar operator lapangan mengetahui secara pasti siapa yang harus dihubungi.
6. **Kamus Teks Sentral & Token Warna Semantik:**
   * Seluruh teks tersentralisasi di `src/constants/texts/text_page_management.ts`.
   * Seluruh styling JSX/CSS merujuk ke token semantik `src/styles/tokens/semantic.css` yang lulus uji rasio kontras WCAG AA/AAA.

---

## 2. Before vs After & Skenario Lapangan

### Perbaikan 1: Evaluasi Izin Dinamis vs Hardcoded Role Guard (BUG-177-01)
* **Before:**
  ```typescript
  // Hardcoded di PageAccessContext.tsx
  if (
    (pageKey === 'regional_monitoring' ||
      pageKey === 'regional_summary' ||
      pageKey === 'regional_wa_report') &&
    (userRole === 'pdo' || userRole === 'petugas')
  ) {
    return false;
  }
  ```
* **After:**
  ```typescript
  // Evaluasi dinamis berbasis kolom database allowed_roles
  if (Array.isArray(setting.allowed_roles) && setting.allowed_roles.length > 0) {
    if (!role) return false;
    const normalizedRole = role === 'petugas' ? 'pdo' : role;
    return setting.allowed_roles.some(
      (r) => r.toLowerCase().trim() === normalizedRole
    );
  }
  ```
* **Case: Skenario Lapangan:**
  Di lapangan, pimpinan operasional ingin peran `korlap` dapat melihat Tab Analitik & Capaian Rute, sementara peran `pdo` diizinkan melihat daftar unit bus. Sebelumnya hal ini membutuhkan revisi kode program dan deployment ulang. Sekarang, Superadmin cukup membuka Manajemen Halaman di ponselnya, mengetuk tombol "Atur Akses", mencentang peran yang diinginkan, dan seluruh pengguna langsung tersinkronisasi realtime tanpa reload.

---

### Perbaikan 2: Pengecualian Khusus Akun Whitelist & Blacklist (BUG-177-02 & BUG-177-05)
* **Before:**
  Tidak ada konsep user override. Akses pengguna 100% identik dengan rolenya. Untuk memberikan akses fitur khusus, akun harus diubah perannya menjadi admin secara berlebihan (*privilege creep*).
* **After:**
  * **Whitelist:** Akun `budi@transjakarta.co.id` (role `pdo`) dapat diizinkan membuka Monitoring Wilayah khusus penugasan pengawasan.
  * **Blacklist:** Akun `ani@transjakarta.co.id` (role `admin`) dapat dibatasi aksesnya dari Form Input jika fokus tugasnya hanya audit pelaporan.
  * **Safety Warning Dialog:** Jika akun PDO dimasukkan ke Whitelist, sistem menampilkan konfirmasi peringatan SweetAlert2:
    > *"Akun Budi Santoso memiliki peran PDO yang secara default tidak memiliki akses ke Monitoring 18 Rute Wilayah. Apakah Anda yakin ingin memberikan pengecualian izin akses (Whitelist)?"*
* **Case: Skenario Lapangan:**
  Petugas Data Operasional senior ditugaskan sementara membantu memantau capaian ritase 18 rute wilayah. Superadmin tidak perlu menjadikannya Admin atau Korwil (yang berisiko membuka akses edit konfigurasi sistem). Cukup tambahkan email petugas ke Whitelist halaman Monitoring Wilayah.

---

### Perbaikan 3: Multi-Select Mode & Floating Bulk Action Bar (BUG-177-03)
* **Before:**
  Jika Superadmin ingin melakukan pemeliharaan server pada 5 sub-halaman/fitur, Superadmin harus menggulir layar HP dan mengetuk toggle satu per satu secara berulang.
* **After:**
  Superadmin mengetuk **"Pilih Banyak"** di header, mencentang 5 halaman yang diinginkan (atau mengetuk **"Pilih Semua"**), lalu pada *Floating Bulk Action Bar* di bawah layar cukup menekan tombol **"Nonaktifkan"** atau **"Izin Role"**. Dalam 1 detik, seluruh 5 halaman langsung diperbarui serempak via RPC `admin_bulk_update_page_settings`.
* **Case: Skenario Lapangan:**
  Saat pergantian shift tengah malam atau persiapan rilis fitur baru, Superadmin perlu menutup sementara seluruh tab analitik dan rekapitulasi. Dengan Bulk Action, seluruh tab tertutup dalam 1 kali klik, dan dibuka kembali serempak begitu rilis selesai.

---

### Perbaikan 4: Human-Friendly Access Restricted Screen (BUG-177-04)
* **Before:**
  Tampilan pemeliharaan dan tampilan akses ditolak tercampur aduk menggunakan `PageDisabledState` dengan teks samar: *"Silakan hubungi Superadmin"*. Pengguna tidak tahu siapa Superadmin yang berwenang.
* **After:**
  Jika halaman aktif namun akun pengguna tidak diizinkan, aplikasi menampilkan komponen `AccessRestrictedState`:
  * Ikon perisai wibawa amber (`var(--color-role-superadmin-bg)`).
  * Pesan sopan: *"Akses Halaman Dibatasi: Akun Anda tidak memiliki izin untuk mengakses halaman atau fitur ini."*
  * Kotak info kontak transparan:
    > *"Silakan hubungi Superadmin aktif berikut untuk permohonan akses operasional:"*
    > * 👤 **Bpk. Abi** (`abi@transjakarta.co.id`)
    > * 👤 **Ibu Ratna** (`ratna@transjakarta.co.id`)
  * Tombol kembali ke Dashboard.
* **Case: Skenario Lapangan:**
  Seorang petugas baru yang mencoba membuka menu manajemen pengguna tidak lagi bingung atau menduga aplikasi sedang rusak (*crash*). Layar secara elegan memberi tahu bahwa akses dibatasi dan langsung menampilkan nama personil Superadmin yang bertugas untuk dihubungi via WhatsApp/kantor.

---

### Perbaikan 5: Pencegahan Double-Trigger Event pada Checkbox/Checklist (BUG-177-06)
* **Before:**
  Di `PageAccessConfigModal.tsx` dan `BulkRoleConfigModal.tsx`, baris peran dibungkus `div` dengan `onClick={() => toggleRole(role.code)}`, sementara elemen anak `<input type="checkbox">` memiliki `onChange={() => toggleRole(role.code)}`. Saat pengguna mengklik langsung kotak centang (checkbox), kedua event terpanggil berurutan, menyebabkan status peran ter-toggle dua kali (checked lalu langsung unchecked kembali, atau sebaliknya). Checkbox terasa macet.
* **After:**
  Baris peran diubah menggunakan elemen semantik `<label>` murni tanpa event `onClick` pada kontainer. Hanya elemen `<input type="checkbox">` yang mendengarkan event `onChange`. Klik pada kotak centang maupun label teks/badge kini hanya memicu mutasi status tepat 1 kali. Di `PageManagementPage.tsx`, checkbox kartu multi-select dibungkus dengan isolasi `onClick={(e) => e.stopPropagation()}` agar tidak bertabrakan dengan klik seleksi kartu.
* **Case: Skenario Lapangan:**
  Superadmin yang membuka modal penetapan izin peran di layar ponsel berukuran kecil sering mengetuk tepat di kotak centang checkbox. Sebelumnya kotak centang tampak tidak merespons. Setelah perbaikan, checkbox mencentang secara instan dan mulus pada ketukan pertama.

---

### Perbaikan 6: Redesain UI/UX iOS Toggle Switch & Eliminasi Hardcoded Colors (BUG-177-07)
* **Before:**
  * Toggle switch saat non-aktif memiliki warna latar `var(--color-surface-subtle)` tanpa border penegas dengan tombol bulat knob putih `#ffffff`. Pada tema Light Mode, track dan knob membaur (*blend-in*) tanpa kontras visual yang memadai.
  * Tidak ada feedback transisi/loading mikro saat mutasi status ke Supabase sedang berlangsung.
  * Saat mode multi-select aktif, switch individu terlihat identik dan tidak terisolasi dari seleksi kartu.
  * File `SuperadminMaintenanceBanner.tsx` dan `PageDisabledState.tsx` memiliki warna mentah *hardcoded hex* (`#78350f`, `#b45309`, `#f59e0b`, dll).
* **After:**
  * Switch didesain ulang mengikuti standar iOS: saat mati (non-aktif), track memiliki border tegas `2px solid var(--color-border-control)` dan latar `var(--color-surface-subtle)`. Knob memiliki bayangan elevasi `0 2px 5px var(--color-shadow)` dan garis tepi halus, menghasilkan kontras tajam di Light Mode maupun Dark Mode.
  * Indikator *mini-spinner* berputar (`@keyframes pmSpin`) muncul di dalam knob saat `togglingKey === setting.page_key` untuk memberi umpan balik visual instan selama request berlangsung.
  * Pada mode multi-select, switch individu otomatis diberi `opacity: 0.35` dan `pointerEvents: 'none'`, sehingga mengetuk area switch secara aman dan konsisten memilih kartu tersebut.
  * Kartu sistem yang terkunci (`page_management`) kini dikecualikan secara ketat dari `filteredSettings` agar tidak pernah terduplikasi atau muncul sebagai kartu yang bisa di-toggle.
  * Empty state elegan ditambahkan jika filter kategori yang dipilih menghasilkan 0 halaman.
  * Seluruh *hardcoded hex* pada banner dan disabled state dimigrasikan ke token semantik CSS (`var(--color-warning-*)`, `var(--color-surface-*)`).
* **Case: Skenario Lapangan:**
  Superadmin yang sedang berada di luar ruangan dengan pencahayaan matahari terik dapat dengan mudah melihat posisi aktif/nonaktif setiap saklar halaman berkat border penegas berstandar WCAG. Saat saklar ditekan, animasi putaran mikro langsung mengonfirmasi bahwa permintaan sedang dikirim ke server.

---

## 3. Daftar File yang Dibuat & Dimodifikasi

### File Baru:
1. `supabase/migrations/20261031000001_granular_page_access_and_bulk_action.sql`
2. `src/components/pageManagement/AccessRestrictedState.tsx`
3. `src/components/pageManagement/AccessRestrictedState.test.tsx`
4. `src/components/pageManagement/UserPickerModal.tsx`
5. `src/components/pageManagement/UserPickerModal.test.tsx`
6. `src/components/pageManagement/PageAccessConfigModal.tsx`
7. `src/components/pageManagement/PageAccessConfigModal.test.tsx`
8. `src/components/pageManagement/BulkRoleConfigModal.tsx`
9. `src/components/pageManagement/FloatingBulkActionBar.tsx`
10. `src/components/pageManagement/FloatingBulkActionBar.test.tsx`
11. `src/utils/modals/pageAccessSafetyDialog.ts`
12. `src/utils/modals/pageAccessSafetyDialog.test.ts`
13. `docs/superpowers/specs/2026-10-31-granular-page-access-and-bulk-action-design.md`
14. `docs/superpowers/plans/2026-10-31-granular-page-access-and-bulk-action.md`
15. `refactor-ss-pdo/refact_177/AUDIT_BUGS.md`
16. `refactor-ss-pdo/refact_177/REPAIR_REPORT.md`

### File Dimodifikasi:
1. `src/constants/texts/text_page_management.ts`
2. `src/constants/texts/texts.test.ts`
3. `src/types/pageManagement.ts`
4. `src/services/pageManagementService.ts`
5. `src/services/pageManagementService.test.ts`
6. `src/context/PageAccessContext.tsx`
7. `src/context/PageAccessContext.test.tsx`
8. `src/components/pageManagement/index.ts`
9. `src/components/pageManagement/PageManagementPage.tsx`
10. `src/components/pageManagement/PageManagementPage.test.tsx`
11. `src/components/pageManagement/SuperadminMaintenanceBanner.tsx`
12. `src/components/pageManagement/PageDisabledState.tsx`
13. `src/components/Dashboard.tsx`
14. `src/components/dashboard/DashboardContentTabs.tsx`
15. `src/components/monitoring/AllRouteMonitoringPage.tsx`

---

## 4. Hasil Verifikasi Quality Gates

1. **Uji Kontrak Warna Token (WCAG AA/AAA Accessibility):**
   * Perintah: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
   * Hasil: **114 passed (114 tests) — 100% PASS**.
2. **Uji Keseluruhan Test Suite Vitest:**
   * Perintah: `pnpm vitest run src/`
   * Hasil: **131 passed (131 test files), 1,129 passed (1,129 tests) — 100% PASS**.
3. **TypeScript Strict Mode & Production Build:**
   * Perintah: `pnpm run build` (`tsc -b && vite build`)
   * Hasil: **0 error — Build produksi sukses**.
4. **Pembaruan Knowledge Graph (Graphify):**
   * Perintah: `graphify update .`
   * Hasil: **6,701 nodes, 8,262 edges, 638 communities terbarui**.

