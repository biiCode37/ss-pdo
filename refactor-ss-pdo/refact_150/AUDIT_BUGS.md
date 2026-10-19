# Audit Bugs: Fitur Page Management Superadmin & Realtime Access Control

**ID Refactor:** `refact_150`  
**Tanggal:** 19 Oktober 2026  
**Branch:** `devmode`  
**Fitur:** Superadmin Page Management & Realtime Page Access Control  

---

## 1. Daftar Temuan Audit & Kebutuhan Fitur

### BUG/REQ-150-01: Ketiadaan Kontrol Akses Halaman Terpusat & Realtime
- **Lokasi Kode:** `src/App.tsx`, `src/components/Dashboard.tsx`, `src/components/profileMenu/`
- **Keparahan:** High / Architectural Feature Gap
- **Deskripsi:** Sebelumnya, aplikasi tidak memiliki mekanisme bagi `superadmin` untuk menonaktifkan atau mengaktifkan halaman/sub-halaman/fitur modal secara granular saat sedang dalam tahap pemeliharaan, perbaikan darurat, atau rilis bertahap. Jika ada fitur yang sedang mengalami kendala di lapangan, fitur tersebut tetap terbuka bagi seluruh pengguna dan dapat memicu kebingungan atau kesalahan input data operasional.
- **Dampak User:** Pengguna lapangan (koordinator, admin, pengawas) bisa mengakses halaman atau tab yang sedang diperbaiki atau belum siap, berisiko mengacaukan integritas data operasional.
- **Mitigasi:**
  1. Buat tabel database `app_page_settings` di Supabase dengan RLS dan Realtime replication.
  2. Implementasikan servis `pageManagementService.ts` dengan *optimistic local cache* (`localStorage`) dan *Supabase postgres_changes listener*.
  3. Sediakan `PageAccessContext` untuk menyediakan helper `canAccessPage()`, `isUnderMaintenance()`, dan `togglePageStatus()`.

---

### BUG/REQ-150-02: Resiko Self-Lockout (Terkunci Sendiri oleh Superadmin)
- **Lokasi Kode:** `src/types/pageManagement.ts`, `src/services/pageManagementService.ts`, `src/components/pageManagement/PageManagementPage.tsx`
- **Keparahan:** Critical
- **Deskripsi:** Jika superadmin secara tidak sengaja menonaktifkan halaman "Manajemen Halaman" itu sendiri, tidak ada seorang pun yang dapat mengakses antarmuka kontrol untuk mengaktifkannya kembali melalui aplikasi (terkunci permanen).
- **Dampak User:** Superadmin kehilangan kontrol atas manajemen akses aplikasi dan harus mengedit database secara manual melalui dashboard SQL Supabase.
- **Mitigasi:**
  1. Halaman Manajemen Halaman diberi bendera `is_locked: true` permanen.
  2. Guard mutasi di `pageManagementService.updatePageSetting` secara ketat menolak mutasi jika target halaman adalah `page_management`.
  3. Toggle switch pada baris Manajemen Halaman di UI di-render dalam status disabled/locked dengan badge khusus `"DIKUNCI OLEH SISTEM"`.

---

### BUG/REQ-150-03: Ketiadaan Layar Pemeliharaan Ramah Pengguna & Akses Pratinjau Superadmin
- **Lokasi Kode:** `src/components/pageManagement/PageDisabledState.tsx`, `src/components/pageManagement/SuperadminMaintenanceBanner.tsx`
- **Keparahan:** Medium / UX
- **Deskripsi:** Pengguna biasa membutuhkan pesan yang sopan, profesional, dan non-teknis ketika suatu halaman dinonaktifkan: *"Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan"*, sementara Superadmin harus tetap memiliki akses *bypass* penuh untuk menguji dan memverifikasi perbaikan di lingkungan produksi sebelum mengaktifkannya kembali untuk publik.
- **Dampak User:** Tanpa pemisahan ini, pengguna akan melihat layar kosong atau error teknis, sedangkan superadmin tidak bisa menguji halaman yang sedang dalam pemeliharaan.
- **Mitigasi:**
  1. Komponen `PageDisabledState` menampilkan ilustrasi ramah, teks baku, dan tombol navigasi kembali ke dashboard utama.
  2. `canAccessPage(key, role)` selalu mengembalikan `true` jika `role === 'superadmin'`.
  3. Komponen `SuperadminMaintenanceBanner` ditampilkan secara sticky di bagian atas saat superadmin sedang melakukan pratinjau halaman yang berstatus *disabled*.

---

### BUG/REQ-150-04: Pelanggaran verbatimModuleSyntax & Peringatan Ineffective Dynamic Import
- **Lokasi Kode:** `src/components/Dashboard.tsx`, `src/components/pageManagement/index.ts`, `src/context/PageAccessContext.tsx`, `src/services/pageManagementService.ts`
- **Keparahan:** Medium / Build & Bundle Quality
- **Deskripsi:** Penggunaan `import` type tanpa modifier `type` memicu error kompilasi `tsc -b` dengan `verbatimModuleSyntax: true`. Selain itu, mengekspor `PageManagementPage` dari file barrel `index.ts` menyebabkan dynamic import `lazy(() => import(...))` di `Dashboard.tsx` tidak efektif (modul ditarik ke static bundle).
- **Dampak Developer/Perf:** Kompilasi build gagal dan ukuran bundle inisial membesar karena komponen admin yang jarang dikunjungi tidak terpisah ke lazy chunk.
- **Mitigasi:**
  1. Pisahkan seluruh type import menjadi `import type { ... }`.
  2. Keluarkan `PageManagementPage` dari `src/components/pageManagement/index.ts` agar di-lazy import secara mandiri (`dist/assets/PageManagementPage-*.js`, 7.90 kB).
