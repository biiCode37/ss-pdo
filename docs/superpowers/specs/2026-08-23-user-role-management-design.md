# 🛡️ Spesifikasi Desain: Manajemen Role Pengguna & Audit Trail (Superadmin, Admin, Petugas)

**Tanggal:** 23 Agustus 2026  
**Status:** Disetujui  
**Branch:** `devmode`  

---

## 1. Ringkasan & Tujuan
Sistem ini mengimplementasikan **Role-Based Access Control (RBAC) Berjenjang** untuk mengamankan operasional aplikasi SS_PDO, mengelola hak akses akun pengguna secara dinamis, dan menyediakan **Audit Trail** komprehensif atas seluruh tindakan pengguna tanpa menghambat kelancaran operasional di lapangan.

---

## 2. Hirarki & Matriks Hak Akses

| Hak Akses / Kemampuan | `superadmin` | `admin` | `petugas` |
| :--- | :---: | :---: | :---: |
| **Input & Edit Data Operasional Bus** | ✅ | ✅ | ✅ |
| **Pilih Rute & Tambah Rute/Sheet Baru** | ✅ | ✅ | ✅ |
| **Akses Ringkasan Unit & Analitik Harian** | ✅ | ✅ | ✅ |
| **Buka Panel Manajemen Pengguna** | ✅ *(Semua Role)* | ✅ *(Khusus Petugas)* | ❌ *(Disembunyikan)* |
| **Tambah User Baru** | ✅ *(Bebas Role)* | ✅ *(Hanya Petugas)* | ❌ |
| **Aktifkan / Nonaktifkan Akun User** | ✅ *(Semua Role)* | ✅ *(Hanya Petugas)* | ❌ |
| **Ubah Role User Lain** | ✅ *(Ke role apa pun)* | ❌ | ❌ |
| **Hapus Akses / Revoke User** | ✅ | ❌ | ❌ |
| **Buka Panel Audit Log & Telemetri** | ✅ *(Semua Log)* | ✅ *(Log Petugas)* | ❌ *(Disembunyikan)* |
| **Aksi Kritis (Format Sheet, Mass Reset)** | ✅ | ❌ | ❌ |

### Proteksi Keamanan Khusus (*Anti Self-Lockout*):
- Akun `superadmin` tidak dapat dinonaktifkan, di-downgrade, atau dihapus oleh `admin` biasa.
- Akun `superadmin` yang sedang login tidak dapat menonaktifkan atau menurunkan rolenya sendiri jika ia adalah satu-satunya superadmin aktif.

---

## 3. Desain Skema Database Supabase

### A. Pembaruan Tabel `user_profiles`
```sql
-- Memperbarui constraint role enum
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_role_check,
  ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('superadmin', 'admin', 'petugas'));

-- Menambahkan kolom pelacak asal pendaftaran dan catatan
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS notes text;
```

### B. Struktur Tabel `activity_logs`
Tabel `activity_logs` mencatat aksi administratif dan input data:
- `user_email`: Email pengguna yang melakukan aksi.
- `action`: Jenis aksi (`USER_ADDED`, `USER_STATUS_CHANGED`, `USER_ROLE_CHANGED`, `USER_REVOKED`, `BUS_INPUT`, dll).
- `details`: Metadata JSON (`target_email`, `previous_role`, `new_role`, `target_status`, `reason`, dll).
- `created_at`: Timestamp ISO.

---

## 4. Desain Antarmuka Pengguna (UI/UX)

### A. Badge Role Pengguna (`RoleBadge.tsx`)
Badge visual responsif untuk light & dark mode:
- **`superadmin`**: Gradien Ungu-Emas (`linear-gradient(135deg, #8b5cf6, #d97706)`), ikon `Crown` / `ShieldCheck`.
- **`admin`**: Gradien Biru-Cyan (`linear-gradient(135deg, #0284c7, #06b6d4)`), ikon `Shield`.
- **`petugas`**: Warna Hijau Emerald (`rgba(16, 185, 129, 0.15)` dengan teks `#10b981`), ikon `UserCheck`.

### B. Lembar Profil (`ProfileMenuSheet.tsx`)
- Menampilkan `RoleBadge` di samping nama/email pengguna.
- Menampilkan tombol aksi menu dinamis berdasarkan role:
  - Tombol **"Kelola Pengguna"** (Ikon `Users`, subteks *"Kelola akses & peran akun"*).
  - Tombol **"Log Aktivitas & Audit"** (Ikon `History`, subteks *"Riwayat tindakan & input data"*).

### C. Lembar Manajemen Pengguna (`UserManagementSheet.tsx`)
Bottom sheet modern dengan transisi fisik iOS:
1. **Header & Search Bar:**
   - Judul dan status counter user aktif.
   - Kolom pencarian realtime (cari nama / email).
   - Filter segmented tabs: `[Semua]` `[Superadmin]` `[Admin]` `[Petugas]` `[Nonaktif]`.
   - Tombol `+ Tambah Pengguna`.
2. **Kartu Akun Pengguna:**
   - Avatar Google, Nama Lengkap, Email, Waktu Terakhir Aktif.
   - Badge role dan status (`Aktif` / `Nonaktif`).
   - Info pendaftar: *"Didaftarkan oleh: admin1@... (12 Agu 2026)"*.
   - **Toggle Switch Status:** Menghidupkan / mematikan akses akun secara instan.
   - **Menu Aksi (...)**:
     - *Ubah Peran (Role)* ➔ Dialog pilihan role.
     - *Cabut Akses (Revoke)* ➔ Dialog konfirmasi SweetAlert2 dengan sanitasi `escapeHtml`.

### D. Lembar Log Aktivitas & Audit (`AuditLogSheet.tsx`)
1. **Timeline Log:**
   - Menampilkan kronologi tindakan dengan badge kategori warna.
   - Bahasa Indonesia non-teknis yang mudah dipahami pengawas.
2. **Filter Log:**
   - Filter berdasarkan kategori aksi dan email aktor.

---

## 5. Alur Data & Logika Layanan (`routeService.ts`)

Fungsi-fungsi baru yang disediakan pada layer data:
1. `fetchAllUserProfiles()`: Mengambil seluruh baris `user_profiles`.
2. `addUserProfile({ email, full_name, role, notes, created_by })`: Menambahkan email ke whitelist Supabase + catat log `USER_ADDED`.
3. `updateUserProfileRole(targetEmail, newRole, updatedBy)`: Mengubah role + catat log `USER_ROLE_CHANGED`.
4. `toggleUserProfileStatus(targetEmail, isActive, updatedBy)`: Mengubah `is_active` + catat log `USER_STATUS_CHANGED`.
5. `revokeUserProfile(targetEmail, revokedBy)`: Menghapus/mencabut akun + catat log `USER_REVOKED`.
6. `fetchActivityLogs({ limit, category, userEmail })`: Mengambil audit logs dengan pagination/limit.

---

## 6. Rencana Pengujian & Quality Gates

- **Unit Testing Vitest (`src/services/routeService.test.ts`, `src/components/*.test.tsx`):**
  - Uji otorisasi Superadmin vs Admin saat menambah user.
  - Uji penolakan self-deaktivasi Superadmin.
  - Uji pencatatan audit log otomatis pada setiap mutasi data user.
- **Sanitasi HTML (Anti-XSS):** Seluruh dialog SweetAlert2 wajib membungkus variabel dinamis dengan `escapeHtml()`.
- **TypeScript Strict Mode:** `pnpm run build` lulus 0 error.
- **Graf Pengetahuan:** `graphify update .` diperbarui.
