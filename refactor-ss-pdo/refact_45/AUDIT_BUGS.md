# Audit Temuan Refact 45: Dekomposisi Lembar Menu Profil `ProfileMenuSheet.tsx` (~828 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap komponen bottom sheet profil pengguna `src/components/ProfileMenuSheet.tsx` yang menangani profil pengguna Google/Supabase, gesture swipe/drag-to-dismiss, kontrol administrasi sistem, navigasi fitur operasional, format spreadsheet, toggle tema tampilan, dan antrean sinkronisasi offline.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF45-ARCH-001: God File `src/components/ProfileMenuSheet.tsx` (828 baris)

- **Lokasi Kode**: `src/components/ProfileMenuSheet.tsx` (828 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu komponen memegang tanggung jawab atas beragam domain operasional dan teknis:
  1. Sinkronisasi identitas pengguna dari `localStorage`, Google UserInfo API (`fetchGoogleUserProfile`), dan Supabase Database (`verifyUserProfile` & `upsertUserProfile`).
  2. Penanganan gesture sentuh drag-to-dismiss iOS-style (`touchStartYRef`, `touchStartTimeRef`, velocity calculation, pegas Apple `cubic-bezier(0.32, 0.72, 0, 1)`, dan opasitas overlay dinamis).
  3. Bagian navigasi administrasi sistem (RBAC check khusus Superadmin/Admin: Kelola Pengguna dan Log Aktivitas).
  4. Bagian navigasi fitur & utilitas (Monitoring Wilayah 18 Rute, Rekap Akumulasi Lintas Periode, Format Spreadsheet Otomatis, dan Toggle Dark/Light Mode).
  5. Status antrean sinkronisasi data offline.
  6. Catatan transparansi sesi dan dialog konfirmasi logout akun.
- **Dampak User & Pengembang**:
  - Penyesuaian antarmuka menu atau penambahan fitur baru berisiko merusak gesture sentuh swipe-down atau logika sinkronisasi profil Google.
  - Kesulitan pengujian unit secara terisolasi karena logika data, gesture fisik, dan presentasi UI terkunci dalam satu berkas besar.
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/profileMenu/`:
  - `types.ts`: Interface tipe `ProfileMenuSheetProps` dan `UserProfileState`.
  - `useProfileData.ts`: Hook untuk membaca cache lokal, fetch profil Google, dan verifikasi Supabase.
  - `useSheetGesture.ts`: Hook untuk mengisolasi logika gesture touch drag-to-dismiss, velocity threshold, dan kurva pegas.
  - `ProfileUserCard.tsx`: Komponen kartu profil pengguna, avatar fallback, badge peran (RoleBadge), dan tombol dismiss.
  - `ProfileAdminSection.tsx`: Komponen menu khusus hak akses Superadmin & Admin (Kelola Pengguna & Audit Log).
  - `ProfileFeaturesSection.tsx`: Komponen menu fitur operasional (Monitoring Wilayah, Rekap Akumulasi, Format Spreadsheet, Toggle Tema, dan Indikator Offline).
  - `ProfileMenuFooter.tsx`: Komponen catatan transparansi sesi dan tombol konfirmasi logout akun.
  - `index.ts`: Barrel export terpusat.
  - `ProfileMenuSheet.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~140 baris** dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
