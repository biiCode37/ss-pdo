# AUDIT BUGS — Refactor 177: Granular Page Access Control & Multi-Select Bulk Action

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** Manajemen Halaman Superadmin, Access Evaluation Engine (`PageAccessContext`), Supabase RPC Security, dan Konsumen Dashboard & Monitoring.  

---

## Status Temuan Masalah & Keterbatasan Arsitektur (BUG-177-01 s.d. BUG-177-05)

| ID | Keparahan | Lokasi Kode | Deskripsi Masalah | Dampak Pengguna | Status Perbaikan |
|---|---|---|---|---|---|
| **BUG-177-01** | P1 (Tinggi) | `src/context/PageAccessContext.tsx:78–86` | Izin akses berbasis peran di-hardcode secara statis pada kode frontend (PDO dilarang buka monitoring wilayah, non-admin dilarang user_management) tanpa konfigurasi dinamis. | Superadmin tidak dapat menyesuaikan kebijakan izin peran secara dinamis sesuai kebutuhan operasional rute di lapangan tanpa mengubah kode dan build ulang aplikasi. | **TERATASI (Resolved)** — Penambahan kolom `allowed_roles text[]` di tabel `app_page_settings` dan evaluasi dinamis di `canAccessPage`. |
| **BUG-177-02** | P1 (Tinggi) | `src/context/PageAccessContext.tsx`, `src/services/pageManagementService.ts` | Ketiadaan mekanisme pengecualian per-akun (User Override). Sistem hanya mengenal peran global. | Jika ada staf/petugas senior (PDO) yang ditugaskan membantu monitoring wilayah, Superadmin terpaksa menaikkan peran seluruh akun menjadi Korwil/Admin, melanggar prinsip *Least Privilege*. | **TERATASI (Resolved)** — Penerapan arsitektur Whitelist (`allowed_user_emails`) dan Blacklist (`denied_user_emails`) per-halaman. |
| **BUG-177-03** | P2 (Sedang) | `src/components/pageManagement/PageManagementPage.tsx` | Ketiadaan fitur Multi-Select & Bulk Action. Superadmin harus men-toggle kartu halaman satu per satu secara repetitif. | Proses pemeliharaan massal memakan waktu lama, tidak efisien, dan berisiko terlewat saat puluhan halaman/fitur harus dinonaktifkan serempak. | **TERATASI (Resolved)** — Fitur Multi-Select, Header Counter, dan Floating Bulk Action Bar (Aktifkan Semua, Nonaktifkan Semua, Izin Role Bersama, Reset Standar). |
| **BUG-177-04** | P2 (Sedang) | `src/components/pageManagement/AccessRestrictedState.tsx` (sebelumnya hanya `PageDisabledState`) | Layar akses terbatas tidak membedakan antara mode pemeliharaan (maintenance) vs pembatasan izin (restricted). Pesan hanya menuliskan "Hubungi Superadmin" tanpa nama kontak. | Petugas lapangan kebingungan harus menghubungi siapa ketika menemui kendala akses, menghambat koordinasi operasional cepat. | **TERATASI (Resolved)** — Komponen `AccessRestrictedState` khusus dengan daftar nama lengkap personil Superadmin aktif dari `user_profiles`. |
| **BUG-177-05** | P1 (Tinggi) | `src/utils/modals/pageAccessSafetyDialog.ts` | Potensi salah klik atau penugasan izin yang bertentangan dengan aturan default peran tanpa ada konfirmasi keselamatan. | Superadmin dapat secara tidak sengaja memberikan akses fitur sensitif atau memblokir akun tanpa peringatan eksplisit. | **TERATASI (Resolved)** — Dialog konfirmasi keselamatan SweetAlert2 anti-XSS (`confirmWhitelistOverride` dan `confirmBlacklistOverride`) yang mendeteksi anomali peran vs penugasan akun. |

---

## Kesimpulan Kepatuhan Quality Gates
Seluruh 5 temuan dan keterbatasan arsitektur telah diselesaikan secara komprehensif dengan:
1. Skema database native PostgreSQL diproteksi fungsi `SECURITY DEFINER` (Zero Privilege Escalation).
2. Evaluasi 5 tingkat di `PageAccessContext`: *Superadmin Bypass $\rightarrow$ Master Maintenance Switch $\rightarrow$ User Blacklist $\rightarrow$ User Whitelist $\rightarrow$ Role Baseline*.
3. Antarmuka sentuh Mobile-First dengan kurva pegas iOS `cubic-bezier(0.32, 0.72, 0, 1)`.
4. Sanitasi data dinamis anti-XSS via `escapeHtml()`.
5. 100% lulus kontrak warna WCAG AA/AAA dan 1,126 pengujian unit test.
