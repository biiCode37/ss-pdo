# 📋 Implementation Plan: Manajemen Role Pengguna (Superadmin, Admin, Petugas) & Audit Trail

**Tanggal:** 23 Agustus 2026  
**Status:** Siap Dieksekusi  
**Branch:** `devmode`  

---

## 1. Global Constraints & Quality Gates
- **Branch:** Seluruh pengerjaan pada branch `devmode`.
- **Mobile-First UX:** Tata letak responsif untuk Android/iOS dengan spring animations dan scrollbar tersembunyi (`.no-scrollbar`).
- **Dual Theming:** Seluruh komponen mendukung Light Mode dan Dark Mode dengan token CSS.
- **Sanitasi Wajib Anti-XSS:** Seluruh template HTML SweetAlert2 wajib menggunakan `escapeHtml()`.
- **Quality Gates:**
  1. `pnpm vitest run src/` ➔ 100% lulus.
  2. `pnpm run build` ➔ 0 error (TypeScript strict).
  3. `graphify update .` ➔ Terbarui.

---

## 2. Rincian Task Implementasi

### Task 1: Pembaruan TypeScript Types (`src/types/supabase.ts`)
- Ubah `UserProfile.role` menjadi `'superadmin' | 'admin' | 'petugas'`.
- Tambahkan properti `created_by?: string`, `notes?: string`.

### Task 2: Service Layer & Audit Log Functions (`src/services/routeService.ts`)
- Fungsi `fetchAllUserProfiles()`: Mengambil daftar semua user dari Supabase.
- Fungsi `addUserProfile({ email, full_name, role, notes, created_by })`: Menambahkan user baru dan mencatat activity log `USER_ADDED`.
- Fungsi `updateUserProfileRole(targetEmail, newRole, updatedBy)`: Mengubah role user dan mencatat activity log `USER_ROLE_CHANGED`.
- Fungsi `toggleUserProfileStatus(targetEmail, isActive, updatedBy)`: Mengubah status aktif dan mencatat activity log `USER_STATUS_CHANGED`.
- Fungsi `revokeUserProfile(targetEmail, revokedBy)`: Menghapus/mencabut akun dan mencatat activity log `USER_REVOKED`.
- Fungsi `fetchActivityLogs({ limit, category, userEmail })`: Mengambil entri log audit dari `activity_logs`.
- Unit test komprehensif di `src/services/routeService.test.ts`.

### Task 3: Komponen Presentasional `RoleBadge.tsx` & Integrasi `ProfileMenuSheet.tsx`
- Buat `src/components/RoleBadge.tsx` dengan varian `superadmin`, `admin`, `petugas`.
- Perbarui `src/components/ProfileMenuSheet.tsx` untuk menampilkan `RoleBadge` pada profil pengguna dan menampilkan tombol menu "Kelola Pengguna" serta "Log Aktivitas & Audit" (hanya untuk `superadmin` dan `admin`).

### Task 4: Komponen Sheet `UserManagementSheet.tsx`
- Tampilan list pengguna dengan counter status, input pencarian, dan segmented tabs filter.
- Form modal tambah pengguna (Email Google, Nama, Role, Catatan).
- Toggle switch aktif/nonaktif instan.
- Menu aksi per user (Ganti Role, Cabut Akses) dengan proteksi anti-self-lockout untuk Superadmin.
- Proteksi otorisasi: Admin hanya bisa mengelola akun Petugas, Superadmin bisa mengelola semua akun.

### Task 5: Komponen Sheet `AuditLogSheet.tsx`
- Timeline riwayat audit dengan badge kategori, filter jenis aksi, dan bahasa non-teknis.

### Task 6: Integrasi ke `App.tsx` & Quality Gates Verifikasi
- Sambungkan state pembukaan `UserManagementSheet` dan `AuditLogSheet` dari `ProfileMenuSheet`.
- Jalankan vitest, build tsc, dan graphify update.
