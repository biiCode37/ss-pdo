# Audit Temuan Bug (Refactor 152)

## Ringkasan Eksekutif

Audit ini mencakup pembatasan hak akses operasional (Role-Based Access Control / RBAC) agar pengguna dengan peran `pdo` (Petugas Data Operasional) tidak lagi dapat melihat maupun mengakses fitur pengawasan tingkat koridor ("Monitoring Wilayah & Laporan WA").

---

## Tabel Temuan

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi | Dampak Pengguna | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-152-01** | `src/components/profileMenu/ProfileFeaturesSection.tsx`<br>`src/components/Dashboard.tsx`<br>`src/context/PageAccessContext.tsx` | 🟡 **MEDIUM** | Pelanggaran prinsip *Least Privilege*: Petugas PDO dapat melihat tombol "Monitoring Wilayah" di menu profil dan mengakses dashboard 18 rute wilayah | Petugas operasional lapangan dapat melihat rekapitulasi komprehensif wilayah dan fitur pengawas yang di luar wewenangnya | 1. Sembunyikan tombol dari Profile Menu untuk role `pdo`/`petugas`.<br>2. Nonaktifkan handler navigasi di `Dashboard.tsx`.<br>3. Terapkan guard RBAC di `canAccessPage` (`PageAccessContext.tsx`). |

---

## Analisis Akar Masalah (Root Cause Analysis)

1. **Komponen UI Profil Tanpa Filter Role:**
   `ProfileFeaturesSection.tsx` sebelumnya merender tombol navigasi "Monitoring Wilayah & Laporan WA" untuk seluruh peran pengguna selama `isInMonitoringView` bernilai `false`, tanpa memeriksa apakah pengguna yang aktif adalah petugas rute tunggal (`pdo`) atau jajaran pengawas/pimpinan.

2. **Guard Akses Halaman Terbuka untuk Semua Role Aktif:**
   Fungsi `canAccessPage` di `PageAccessContext.tsx` hanya memeriksa status aktif halaman di database tanpa melakukan verifikasi pembagian peran tingkat halaman (*page-level RBAC role matrix*), sehingga petugas berstatus PDO tetap diizinkan membuka tampilan `regional_monitoring`.
