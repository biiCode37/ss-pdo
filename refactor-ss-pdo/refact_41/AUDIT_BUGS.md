# Audit Temuan Refact 41: Dekomposisi God File `UserManagementPage.tsx` (~1.009 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap god file `src/components/UserManagementPage.tsx` yang memuat logika presentasional masif, dialog modal administrasi RBAC (tambah user, ubah peran, toggle aktivasi), filter segmented tabs, avatar resolusi fallback, card metadata pengawas, dan state antarmuka dalam satu file monolitik.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF41-ARCH-001: God File `src/components/UserManagementPage.tsx` (1.009 baris)

- **Lokasi Kode**: `src/components/UserManagementPage.tsx` (1.009 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu komponen mengelola 6 tanggung jawab domain secara bersamaan:
  1. Dialog interaktif SweetAlert2 untuk penambahan user baru (`handleOpenAddUserModal` / `promptAddUserModal`).
  2. Dialog SweetAlert2 pemilihan peran bertingkat superadmin (`handleEditRole` / `promptEditRoleModal`).
  3. Dialog SweetAlert2 konfirmasi aktivasi / penonaktifan akun (`handleToggleStatus` / `promptToggleStatusModal`).
  4. Header sticky administrasi dengan counter pengguna aktif, refresh data, dan aksi penambahan user (`UserManagementHeader`).
  5. Kotak pencarian filter teks dan deretan tab horizontal segmented per peran (`UserManagementFilters`).
  6. Visualisasi kartu pengguna individu (`UserCardItem`) dengan avatar fallback Google Profile (`UserCardAvatar`), badge peran, badge "Anda", catatan operasional, metadata login terakhir & pembuat, serta toggle switch animasi fisik iOS.
  7. State skeleton grid dan empty state hasil filter/pencarian (`UserManagementStates`).
- **Dampak User & Pengembang**:
  - Penambahan validasi RBAC atau penyesuaian visual kartu pengguna berisiko tinggi merusak logika dialog SweetAlert2 atau tata letak navigasi header.
  - File yang terlalu besar (> 1.000 baris) menyulitkan proses peninjauan kode (*pull request review*) dan memperlambat navigasi pengembang pada arsitektur mobile-first.
- **Mitigasi**:
  Dekomposisi menjadi 6 modul terisolasi di folder `src/components/userManagement/`:
  - `UserCardAvatar.tsx`: Rendering gambar avatar Google dengan penanganan error gambar dan fallback inisial nama.
  - `userManagementModals.ts`: Fungsi-fungsi dialog SweetAlert2 terpisah (`promptAddUserModal`, `promptEditRoleModal`, `promptToggleStatusModal`).
  - `UserManagementHeader.tsx`: Sticky top header dengan tombol kembali, judul dinamis, status counter, tombol refresh, dan tombol tambah user.
  - `UserManagementFilters.tsx`: Search input box dan segmented filter tabs horizontal (all, superadmin, admin, korwil, korlap, pdo, inactive).
  - `UserCardItem.tsx`: Presentasi kartu profil individual beserta switch toggle iOS dan aksi perannya.
  - `UserManagementStates.tsx`: Skeleton loading grid (6 kartu) dan tampilan status kosong (*empty state*).
  - `index.ts`: Barrel export bersih untuk ekspor terpusat.
  - `UserManagementPage.tsx`: Dirampingkan menjadi komponen orkestrator murni (~280 baris) dengan zero breaking changes.
