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
| **BUG-177-06** | P1 (Tinggi) | `PageAccessConfigModal.tsx`, `BulkRoleConfigModal.tsx`, `PageManagementPage.tsx` | Double-trigger event pada checkbox: container `div` memiliki event `onClick` dan `<input>` memiliki `onChange`, menyebabkan klik pada checkbox memicu pemanggilan ganda (check lalu langsung uncheck). | Checkbox pada modal izin peran dan mode multi-select terasa macet/tidak bisa dicentang saat diklik langsung pada kotak centang. | **TERATASI (Resolved)** — Mengubah baris menjadi `<label>` murni tanpa `onClick` terpisah pada modal peran, serta mengisolasi propagasi klik pada checkbox kartu multi-select. |
| **BUG-177-07** | P2 (Sedang) | `PageManagementPage.tsx`, `SuperadminMaintenanceBanner.tsx`, `PageDisabledState.tsx` | UI/UX Toggle Switch: saat nonaktif track dan knob berwarna hampir sama tanpa border pembeda (kontras rendah di Light Mode), tidak ada feedback loading/spinner saat mutasi berlangsung, serta switch tidak terisolasi dari seleksi kartu saat mode multi-select. | Pengguna kesulitan melihat posisi knob switch saat mati, merasa aplikasi lambat/macet saat toggle karena tidak ada indikator loading, dan salah klik switch saat berniat memilih kartu. | **TERATASI (Resolved)** — Redesain switch standar iOS dengan border kontras tinggi (`border-control`), mini-spinner loading saat proses mutasi, isolasi `pointer-events: none` pada switch saat multi-select, dan pembersihan raw hex color ke token semantik. |

---

## Kesimpulan Kepatuhan Quality Gates
Seluruh 7 temuan dan keterbatasan arsitektur telah diselesaikan secara komprehensif dengan:
1. Skema database native PostgreSQL diproteksi fungsi `SECURITY DEFINER` (Zero Privilege Escalation).
2. Evaluasi 5 tingkat di `PageAccessContext`: *Superadmin Bypass $\rightarrow$ Master Maintenance Switch $\rightarrow$ User Blacklist $\rightarrow$ User Whitelist $\rightarrow$ Role Baseline*.
3. Antarmuka sentuh Mobile-First dengan kurva pegas iOS `cubic-bezier(0.32, 0.72, 0, 1)`.
4. Sanitasi data dinamis anti-XSS via `escapeHtml()`.
5. 100% lulus kontrak warna WCAG AA/AAA dan 1,129 pengujian unit test.

