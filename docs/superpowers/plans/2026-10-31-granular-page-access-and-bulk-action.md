# Rencana Implementasi: Hak Akses Granular Per-Role & Per-Akun Serta Multi-Select Bulk Action

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperluas fitur Manajemen Halaman agar Superadmin dapat mengatur izin akses dinamis berbasis peran (Role Baseline), memberikan pengecualian khusus per-akun (Whitelist & Blacklist) dengan dialog konfirmasi keselamatan, serta menyediakan antarmuka Multi-Select dengan Floating Bulk Action Bar dan layar akses dibatasi yang menampilkan kontak nama Superadmin aktif.

**Architecture:** 
1. Database: Kolom native array (`allowed_roles`, `allowed_user_emails`, `denied_user_emails`) pada `public.app_page_settings` diproteksi fungsi PostgreSQL `SECURITY DEFINER` (`admin_update_page_permissions` & `admin_bulk_update_page_settings`).
2. Data Layer: Servis `pageManagementService.ts` memfasilitasi mutasi terotorisasi dan sinkronisasi realtime WebSocket Supabase dengan cache fallback lokal.
3. Access Engine: `PageAccessContext.tsx` mengevaluasi hak akses secara hierarkis (Superadmin bypass $\rightarrow$ Master maintenance $\rightarrow$ Blacklist $\rightarrow$ Whitelist $\rightarrow$ Role baseline).
4. UI/UX: `PageManagementPage.tsx` dengan mode multi-select, `FloatingBulkActionBar.tsx`, modal konfigurasi `PageAccessConfigModal.tsx` dengan pencarian akun terdaftar (`UserPickerModal.tsx`), serta layar ramah `AccessRestrictedState.tsx` dengan daftar nama Superadmin aktif.

**Tech Stack:** React 18, TypeScript Strict, Supabase Realtime (`@supabase/supabase-js`), Lucide React, SweetAlert2 (anti-XSS sanitasi via `escapeHtml`), Vitest, Testing Library.

## Global Constraints
- Seluruh teks antarmuka (label, pesan, notifikasi, template dialog) WAJIB didefinisikan di `src/constants/texts/text_page_management.ts` (dilarang *hardcoded string*).
- Pewarnaan wajib merujuk ke token semantik CSS `src/styles/tokens/semantic.css` dan lolos rasio kontras WCAG AA/AAA. Dilarang kode warna mentah (*hex/rgb*).
- Peran `superadmin` memiliki akses mutlak (*master bypass*) dan halaman sistem `page_management` terkunci permanen.
- Dialog konfirmasi SweetAlert2 WAJIB membungkus seluruh data dinamis dengan `escapeHtml()`.
- Format judul commit wajib ringkas (≤ 50 karakter) menggunakan Conventional Commits.
- Setiap task berakhir dengan verifikasi pengujian independen.

---

### Task 1: Kamus Teks Sentral (`text_page_management.ts`) & Uji Integritas

**Files:**
- Modify: `src/constants/texts/text_page_management.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_PAGE_MANAGEMENT` diperluas dengan konstanta untuk:
  - `CONFIG_MODAL`: Label modal pengaturan izin, tab peran, tab whitelist, tab blacklist, tombol tambah akun, chip status.
  - `USER_PICKER`: Judul pemilih akun, input cari, status kosong.
  - `SAFETY_DIALOGS`: Judul & template pesan konfirmasi keselamatan (Whitelist & Blacklist warning).
  - `BULK_ACTION`: Label tombol mode seleksi, counter terpilih, tombol pilih semua/batal, aksi massal aktifkan, nonaktifkan, atur role bersama, dan reset standar.
  - `ACCESS_DENIED`: Judul akses dibatasi, pesan non-teknis, teks pengantar daftar Superadmin aktif, fallback pesan.

- [ ] **Step 1: Tulis tes kamus teks baru di `src/constants/texts/texts.test.ts`**
Tambahkan pengujian untuk memastikan seluruh properti teks baru terdefinisi dan fungsi template menghasilkan teks yang benar.
```typescript
describe('TEXT_PAGE_MANAGEMENT Granular & Bulk Extensions', () => {
  it('harus mendefinisikan kamus konfigurasi izin, modal, dan bulk action', () => {
    expect(TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.TITLE).toBeDefined();
    expect(TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.ROLE_TAB).toBeDefined();
    expect(TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.WHITELIST_TAB).toBeDefined();
    expect(TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BLACKLIST_TAB).toBeDefined();
    expect(TEXT_PAGE_MANAGEMENT.BULK_ACTION.SELECT_MODE_BTN).toBeDefined();
    expect(TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.TITLE).toBeDefined();
  });

  it('harus memformat fungsi template dialog konfirmasi keselamatan secara benar', () => {
    const wlMsg = TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.WHITELIST_WARNING_MSG(
      'Budi',
      'PDO',
      'Monitoring Wilayah'
    );
    expect(wlMsg).toContain('Budi');
    expect(wlMsg).toContain('PDO');
    expect(wlMsg).toContain('Monitoring Wilayah');
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: FAIL (properti teks belum terdefinisi).

- [ ] **Step 3: Implementasi pembaruan pada `src/constants/texts/text_page_management.ts`**
Tambahkan semua konstanta teks yang dibutuhkan sesuai standar domain bahasa Indonesia.

- [ ] **Step 4: Jalankan tes dan pastikan lulus**
Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: PASS 100%.

- [ ] **Step 5: Commit perubahan Task 1**
Run: `git add src/constants/texts/; git commit -m "feat: text constants for granular page access"`

---

### Task 2: Skema Database & Migrasi SQL Supabase

**Files:**
- Create: `supabase/migrations/20261031000001_granular_page_access_and_bulk_action.sql`

**Interfaces:**
- Produces:
  - Kolom `allowed_roles`, `allowed_user_emails`, `denied_user_emails` pada `public.app_page_settings`.
  - Fungsi PostgreSQL `public.admin_update_page_permissions(p_acting_email text, p_page_key text, p_allowed_roles text[], p_allowed_user_emails text[], p_denied_user_emails text[]) RETURNS boolean`.
  - Fungsi PostgreSQL `public.admin_bulk_update_page_settings(p_acting_email text, p_page_keys text[], p_action text, p_is_enabled boolean, p_allowed_roles text[]) RETURNS boolean`.

- [ ] **Step 1: Tulis skrip migrasi SQL lengkap**
Buat file `supabase/migrations/20261031000001_granular_page_access_and_bulk_action.sql` berisi:
  - `ALTER TABLE public.app_page_settings ADD COLUMN IF NOT EXISTS ...`
  - Inisialisasi data default per kategori halaman (PDO dibatasi dari monitoring wilayah, user_management hanya admin & superadmin).
  - Definisi fungsi `SECURITY DEFINER` dengan validasi Superadmin aktif dan pencegahan self-lockout.
  - `GRANT EXECUTE` ke role `anon` dan `authenticated`.
  - Pencatatan ke `supabase_migrations.schema_migrations`.

- [ ] **Step 2: Verifikasi sintaks SQL**
Periksa keselarasan tipe parameter dan return value dengan skema database sebelumnya di `supabase/migrations/20261021000001_security_critical_hardening.sql`.

- [ ] **Step 3: Commit perubahan Task 2**
Run: `git add supabase/migrations/; git commit -m "feat: db migration for granular page access"`

---

### Task 3: Tipe Data TypeScript & Modul Servis (`pageManagementService.ts`)

**Files:**
- Modify: `src/types/pageManagement.ts`
- Modify: `src/services/pageManagementService.ts`
- Modify: `src/services/pageManagementService.test.ts`

**Interfaces:**
- Consumes: Migrasi skema DB & `TEXT_PAGE_MANAGEMENT`.
- Produces:
  - Interface `AppPageSetting` diperluas dengan `allowed_roles: string[]`, `allowed_user_emails: string[]`, `denied_user_emails: string[]`.
  - `DEFAULT_PAGE_SETTINGS` memuat array peran standar per halaman.
  - `updatePagePermissions()`: Memanggil RPC `admin_update_page_permissions` dengan optimistic update.
  - `bulkUpdatePageSettings()`: Memanggil RPC `admin_bulk_update_page_settings` dengan optimistic update.
  - `fetchActiveSuperadmins()`: Mengambil daftar nama dan email Superadmin aktif dari `user_profiles`.

- [ ] **Step 1: Tulis unit test untuk fungsi servis baru di `src/services/pageManagementService.test.ts`**
Buat uji untuk:
  - `updatePagePermissions`: memastikan parameter terkirim ke RPC dan fallback cache berfungsi.
  - `bulkUpdatePageSettings`: menguji aksi `set_status`, `set_roles`, dan `reset_default`.
  - `fetchActiveSuperadmins`: memastikan kueri menyaring `role_id = 1` dan `is_active = true`.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/services/pageManagementService.test.ts`  
Expected: FAIL (fungsi belum diimplementasikan).

- [ ] **Step 3: Perbarui `src/types/pageManagement.ts`**
Tambahkan kolom baru ke `AppPageSetting` dan inisialisasi `DEFAULT_PAGE_SETTINGS`.

- [ ] **Step 4: Implementasi fungsi di `src/services/pageManagementService.ts`**
Implementasikan `updatePagePermissions`, `bulkUpdatePageSettings`, dan `fetchActiveSuperadmins`.

- [ ] **Step 5: Jalankan tes dan pastikan lulus 100%**
Run: `pnpm vitest run src/services/pageManagementService.test.ts`  
Expected: PASS 100%.

- [ ] **Step 6: Commit perubahan Task 3**
Run: `git add src/types/pageManagement.ts src/services/pageManagementService.ts src/services/pageManagementService.test.ts; git commit -m "feat: service methods for granular page access"`

---

### Task 4: Evaluasi Hak Akses Granular (`PageAccessContext.tsx`)

**Files:**
- Modify: `src/context/PageAccessContext.tsx`
- Modify: `src/context/PageAccessContext.test.tsx`

**Interfaces:**
- Consumes: Servis `pageManagementService.ts` & tipe `PageKey`.
- Produces:
  - `canAccessPage(pageKey: PageKey, userRole?: string | null, userEmail?: string | null): boolean`
  - `activeSuperadmins: { email: string; full_name: string }[]`
  - `updatePermissions(pageKey, roles, allowedEmails, deniedEmails): Promise<boolean>`
  - `bulkUpdate(pageKeys, action, options): Promise<boolean>`

- [ ] **Step 1: Tulis unit test komprehensif di `src/context/PageAccessContext.test.tsx`**
Uji setiap cabang prioritas:
  1. Superadmin selalu memiliki akses (`true`), bahkan jika `is_enabled === false` atau ada di blacklist.
  2. Master switch `is_enabled === false` menolak semua user non-superadmin.
  3. User di `denied_user_emails` (Blacklist) ditolak (`false`) meskipun rolenya diizinkan.
  4. User di `allowed_user_emails` (Whitelist) diizinkan (`true`) meskipun rolenya tidak diizinkan.
  5. User role di `allowed_roles` diizinkan (`true`).
  6. User role di luar `allowed_roles` ditolak (`false`).
  7. Fallback email otomatis ke `localStorage.getItem('PDO_USER_EMAIL')`.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/context/PageAccessContext.test.tsx`  
Expected: FAIL (evaluasi blacklist/whitelist belum diimplementasikan).

- [ ] **Step 3: Implementasi alur 5 tingkat evaluasi di `src/context/PageAccessContext.tsx`**
Perbarui `canAccessPage`, integrasikan pemanggilan `fetchActiveSuperadmins` saat mount, dan tambahkan `updatePermissions` serta `bulkUpdate`.

- [ ] **Step 4: Jalankan tes dan pastikan lulus 100%**
Run: `pnpm vitest run src/context/PageAccessContext.test.tsx`  
Expected: PASS 100%.

- [ ] **Step 5: Commit perubahan Task 4**
Run: `git add src/context/PageAccessContext.tsx src/context/PageAccessContext.test.tsx; git commit -m "feat: 5-stage hierarchical page access evaluation"`

---

### Task 5: Komponen Layar Akses Dibatasi (`AccessRestrictedState.tsx`)

**Files:**
- Create: `src/components/pageManagement/AccessRestrictedState.tsx`
- Create: `src/components/pageManagement/AccessRestrictedState.test.tsx`

**Interfaces:**
- Consumes: `usePageAccess()` (`activeSuperadmins`), `TEXT_PAGE_MANAGEMENT`.
- Produces: Komponen presentasional yang menampilkan ilustrasi gembok/akses terbatas, pesan ramah non-teknis, daftar nama Superadmin aktif yang bisa dihubungi, dan tombol "Kembali ke Dashboard".

- [ ] **Step 1: Tulis unit test untuk `AccessRestrictedState.test.tsx`**
Uji:
  - Render judul dan pesan akses dibatasi.
  - Menampilkan daftar nama personil Superadmin aktif jika tersedia.
  - Fallback teks jika daftar Superadmin kosong/offline.
  - Tombol kembali ke Dashboard memicu callback `onBack`.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/components/pageManagement/AccessRestrictedState.test.tsx`  
Expected: FAIL (komponen belum dibuat).

- [ ] **Step 3: Implementasi `AccessRestrictedState.tsx`**
Gunakan CSS semantic tokens (`var(--color-surface-*)`, `var(--color-text-*)`, `var(--color-role-superadmin-*)`), tata letak mobile-first, dan dukungan 2 tema.

- [ ] **Step 4: Jalankan tes dan pastikan lulus**
Run: `pnpm vitest run src/components/pageManagement/AccessRestrictedState.test.tsx`  
Expected: PASS 100%.

- [ ] **Step 5: Commit perubahan Task 5**
Run: `git add src/components/pageManagement/AccessRestrictedState*; git commit -m "feat: human-friendly access restricted screen"`

---

### Task 6: Komponen Pemilih Akun & Dialog Konfirmasi Keselamatan

**Files:**
- Create: `src/components/pageManagement/UserPickerModal.tsx`
- Create: `src/components/pageManagement/UserPickerModal.test.tsx`
- Create: `src/utils/modals/pageAccessSafetyDialog.ts`
- Create: `src/utils/modals/pageAccessSafetyDialog.test.ts`

**Interfaces:**
- Consumes: `user_profiles`, `TEXT_PAGE_MANAGEMENT`, `sweetalert2`, `escapeHtml`.
- Produces:
  - `UserPickerModal`: Dialog pencarian pengguna aktif dengan filter/search instan nama atau email dan badge peran.
  - `confirmWhitelistOverride()`: Menampilkan SweetAlert2 bernada warning jika role belum diizinkan.
  - `confirmBlacklistOverride()`: Menampilkan SweetAlert2 bernada warning jika role sudah diizinkan.

- [ ] **Step 1: Tulis unit test untuk `pageAccessSafetyDialog.test.ts` dan `UserPickerModal.test.tsx`**
Uji:
  - Dialog Whitelist menampilkan nama, peran, dan halaman (dengan anti-XSS escapeHtml).
  - Dialog Blacklist menampilkan peringatan pencabutan izin.
  - UserPickerModal memfilter daftar user secara dinamis saat mengetik di input pencarian.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/utils/modals/pageAccessSafetyDialog.test.ts src/components/pageManagement/UserPickerModal.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementasi `pageAccessSafetyDialog.ts` dan `UserPickerModal.tsx`**
Lengkapi dialog konfirmasi dan modal pemilih pengguna dengan styling token semantik.

- [ ] **Step 4: Jalankan tes dan pastikan lulus 100%**
Run: `pnpm vitest run src/utils/modals/pageAccessSafetyDialog.test.ts src/components/pageManagement/UserPickerModal.test.tsx`  
Expected: PASS 100%.

- [ ] **Step 5: Commit perubahan Task 6**
Run: `git add src/components/pageManagement/UserPickerModal* src/utils/modals/pageAccessSafetyDialog*; git commit -m "feat: user picker modal and safety confirmation dialog"`

---

### Task 7: Modal Pengaturan Izin Per Halaman (`PageAccessConfigModal.tsx`)

**Files:**
- Create: `src/components/pageManagement/PageAccessConfigModal.tsx`
- Create: `src/components/pageManagement/PageAccessConfigModal.test.tsx`

**Interfaces:**
- Consumes: `AppPageSetting`, `UserPickerModal`, `pageAccessSafetyDialog`, `usePageAccess`.
- Produces: Modal Bottom Sheet untuk mengatur Role Baseline + Tab Whitelist & Tab Blacklist dengan interaksi sentuh pegas iOS.

- [ ] **Step 1: Tulis unit test untuk `PageAccessConfigModal.test.tsx`**
Uji:
  - Menampilkan checkbox semua peran (`superadmin` tercentang & terkunci).
  - Toggle checklist peran memperbarui state lokal.
  - Berpindah tab Whitelist / Blacklist.
  - Menambahkan akun memicu dialog keselamatan jika terjadi perbedaan aturan peran.
  - Menghapus akun dari chip daftar override.
  - Menyimpan konfigurasi memicu `updatePermissions`.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/components/pageManagement/PageAccessConfigModal.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementasi `PageAccessConfigModal.tsx`**
Implementasikan antarmuka lengkap dengan token semantik dan penanganan error ramah non-teknis.

- [ ] **Step 4: Jalankan tes dan pastikan lulus 100%**
Run: `pnpm vitest run src/components/pageManagement/PageAccessConfigModal.test.tsx`  
Expected: PASS 100%.

- [ ] **Step 5: Commit perubahan Task 7**
Run: `git add src/components/pageManagement/PageAccessConfigModal*; git commit -m "feat: modal page access configuration"`

---

### Task 8: Modal Izin Role Massal & Floating Bulk Action Bar

**Files:**
- Create: `src/components/pageManagement/BulkRoleConfigModal.tsx`
- Create: `src/components/pageManagement/FloatingBulkActionBar.tsx`
- Create: `src/components/pageManagement/FloatingBulkActionBar.test.tsx`

**Interfaces:**
- Consumes: `TEXT_PAGE_MANAGEMENT`, `usePageAccess`.
- Produces:
  - `FloatingBulkActionBar`: Bar mengambang di bawah layar ponsel ketika item dipilih, memiliki tombol Aktifkan, Nonaktifkan, Atur Role, dan Reset.
  - `BulkRoleConfigModal`: Dialog popup untuk menentukan peran yang serempak diterapkan ke halaman-halaman terpilih.

- [ ] **Step 1: Tulis unit test untuk `FloatingBulkActionBar.test.tsx`**
Uji:
  - Bar tersembunyi jika `selectedCount === 0`.
  - Bar tampil jika `selectedCount > 0` dengan teks jumlah item terpilih.
  - Mengklik tombol Aktifkan, Nonaktifkan, Role, dan Reset memicu callback masing-masing.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/components/pageManagement/FloatingBulkActionBar.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementasi `BulkRoleConfigModal.tsx` dan `FloatingBulkActionBar.tsx`**
Gunakan CSS semantic tokens, tinggi tombol minimum sentuh 44px, dan kurva pegas iOS.

- [ ] **Step 4: Jalankan tes dan pastikan lulus 100%**
Run: `pnpm vitest run src/components/pageManagement/FloatingBulkActionBar.test.tsx`  
Expected: PASS 100%.

- [ ] **Step 5: Commit perubahan Task 8**
Run: `git add src/components/pageManagement/BulkRoleConfigModal.tsx src/components/pageManagement/FloatingBulkActionBar*; git commit -m "feat: floating bulk action bar and bulk role modal"`

---

### Task 9: Integrasi Utama `PageManagementPage.tsx` & Refactor Card

**Files:**
- Modify: `src/components/pageManagement/PageManagementPage.tsx`
- Modify: `src/components/pageManagement/PageManagementPage.test.tsx`

**Interfaces:**
- Consumes: `PageAccessConfigModal`, `FloatingBulkActionBar`, `BulkRoleConfigModal`, `usePageAccess`.
- Produces: Antarmuka terpadu Manajemen Halaman dengan:
  - Toggle mode seleksi di header bar.
  - Checkbox per-kartu dengan animasi geser mulus saat mode seleksi aktif.
  - Proteksi kartu sistem `page_management` dari seleksi massal.
  - Badge ringkasan peran & indikator akun override (+N Whitelist / -N Blacklist).
  - Tombol "Atur Akses" di kartu halaman.
  - Penghapusan seluruh hardcoded hex color diganti dengan token semantik.

- [ ] **Step 1: Tulis pengujian integrasi di `src/components/pageManagement/PageManagementPage.test.tsx`**
Uji:
  - Tombol "Pilih Banyak" mengaktifkan mode seleksi dan memunculkan checkbox.
  - Checkbox pada kartu sistem `page_management` tidak muncul.
  - Seleksi kartu memunculkan Floating Action Bar.
  - Membuka modal pengaturan akses saat tombol "Atur Akses" ditekan.
  - Eksekusi aksi massal aktifkan, nonaktifkan, dan reset.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan/perubahan**
Run: `pnpm vitest run src/components/pageManagement/PageManagementPage.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementasi perubahan pada `PageManagementPage.tsx`**
Ganti seluruh styling dengan token semantik CSS, integrasikan state multi-select dan komponen modal.

- [ ] **Step 4: Jalankan tes dan pastikan lulus 100%**
Run: `pnpm vitest run src/components/pageManagement/PageManagementPage.test.tsx`  
Expected: PASS 100%.

- [ ] **Step 5: Commit perubahan Task 9**
Run: `git add src/components/pageManagement/PageManagementPage*; git commit -m "feat: integrate multi-select and granular controls in page management"`

---

### Task 10: Integrasi Konsumen di Seluruh Aplikasi (`Dashboard.tsx`, `DashboardContentTabs.tsx`, dll)

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/dashboard/DashboardContentTabs.tsx`
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx`

**Interfaces:**
- Consumes: `usePageAccess()`, `AccessRestrictedState`, `PageDisabledState`.
- Produces:
  - Pembedaan tampilan: Jika halaman dinonaktifkan via master switch $\rightarrow$ tampilkan `PageDisabledState` (Maintenance). Jika halaman aktif tetapi peran/akun user dibatasi $\rightarrow$ tampilkan `AccessRestrictedState` (Akses Dibatasi dengan daftar kontak Superadmin).

- [ ] **Step 1: Periksa seluruh call-site konsumen `canAccessPage` dan `isUnderMaintenance`**
Pastikan konsumen membedakan antara status *maintenance* (`isUnderMaintenance(key)`) dan status *restricted* (`!canAccessPage(key)`).

- [ ] **Step 2: Implementasi conditional rendering di `Dashboard.tsx`, `DashboardContentTabs.tsx`, dan `AllRouteMonitoringPage.tsx`**
Tampilkan `AccessRestrictedState` saat akses ditolak karena batasan role/akun.

- [ ] **Step 3: Uji komponen konsumen dengan Vitest**
Run: `pnpm vitest run src/components/dashboard/ src/components/monitoring/`  
Expected: PASS 100%.

- [ ] **Step 4: Commit perubahan Task 10**
Run: `git add src/components/Dashboard.tsx src/components/dashboard/ src/components/monitoring/; git commit -m "feat: consume granular access in dashboard & monitoring"`

---

### Task 11: Quality Gates & Verifikasi Zero-Mistake

**Files:**
- All touched files.

- [ ] **Step 1: Uji Kontrak Warna Token (Accessibility WCAG AA/AAA)**
Run: `pnpm vitest run src/styles/tokens/color-contract.test.ts`  
Expected: PASS 100%.

- [ ] **Step 2: Uji Seluruh Test Suite Vitest**
Run: `pnpm vitest run src/`  
Expected: PASS 100% tanpa error atau kegagalan.

- [ ] **Step 3: TypeScript Strict Mode & Production Build**
Run: `pnpm run build`  
Expected: `tsc -b` lulus 0 error dan build Vite selesai sukses.

- [ ] **Step 4: Perbarui Graf Pengetahuan Kode (Graphify)**
Run: `graphify update .`  
Expected: Graf AST terbarukan.

- [ ] **Step 5: Buat Dokumentasi Refactor / Fitur di `refactor-ss-pdo/`**
Simpan `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` (Before vs After & Skenario Lapangan) sesuai aturan emas proyek.

- [ ] **Step 6: Commit Final Quality Gates**
Run: `git add .; git commit -m "chore: complete granular page access & bulk action"`

