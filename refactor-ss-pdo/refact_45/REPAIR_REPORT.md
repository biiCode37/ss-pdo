# Repair Report Refact 45: Modularisasi & Dekomposisi Lembar Menu Profil (ProfileMenuSheet)

Dokumen ini memuat laporan teknis implementasi dekomposisi `ProfileMenuSheet.tsx` menjadi submodul-submodul terisolasi di `src/components/profileMenu/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/profileMenu/`)
1. **`types.ts`**:
   - Mendefinisikan tipe `ProfileMenuSheetProps` dan `UserProfileState` untuk konsistensi kontrak data antarkomponen.
2. **`useProfileData.ts`**:
   - Mengisolasi pemuatan data profil pengguna dari `localStorage`.
   - Mengelola fallback otomatis foto profil Google melalui `fetchGoogleUserProfile()` dan sinkronisasi ke Supabase via `upsertUserProfile()`.
   - Melakukan verifikasi hak akses pengguna secara asinkron melalui `verifyUserProfile()`.
3. **`useSheetGesture.ts`**:
   - Mengisolasi penanganan interaksi sentuh fisik (touch drag-to-dismiss):
     - Deteksi posisi awal (`touchStartYRef`) dan waktu sentuhan (`touchStartTimeRef`).
     - Perhitungan perpindahan interaktif dan peredam skala (`scale(Math.max(0.95, 1 - diff / 2000))`).
     - Pengenalan kecepatan geser (*swipe velocity threshold* > 0.35) untuk pelepasan instan dengan kurva pegas Apple `cubic-bezier(0.32, 0.72, 0, 1)`.
4. **`ProfileUserCard.tsx`**:
   - Mengisolasi handle bar drag sentuh atas.
   - Menampilkan foto profil pengguna dengan proteksi fallback `onError` ke ikon User jika avatar gagal dimuat (mencegah broken image).
   - Menampilkan nama pengguna, alamat email, badge peran `RoleBadge`, dan tombol silang tutup (dismiss).
5. **`ProfileAdminSection.tsx`**:
   - Menampilkan navigasi administrasi sistem khusus pengguna berhak akses `superadmin` dan `admin`.
   - Menu Kelola Pengguna terhubung langsung ke aksi `onOpenUserManagement`.
   - Tombol Log Aktivitas terkunci aman (*disabled coming soon*) sesuai kebijakan produksi.
6. **`ProfileFeaturesSection.tsx`**:
   - Navigasi Monitoring Wilayah 18 Rute (`Globe`).
   - Navigasi Rekap Akumulasi Lintas Periode (`Layers`).
   - Fitur Rapikan & Format Spreadsheet (`Sparkles`) dengan validasi kesiapan data, dialog konfirmasi SweetAlert2, dan notifikasi proses format.
   - Tombol pengalih tema Light/Dark Mode dengan badge status.
   - Kartu peringatan status antrean sinkronisasi offline jika pengguna tidak terhubung internet atau terdapat antrean tertunda.
7. **`ProfileMenuFooter.tsx`**:
   - Menampilkan catatan transparansi waktu aktif sesi operasional pengguna.
   - Tombol Logout akun dengan konfirmasi modal SweetAlert2 (`showLogoutConfirm()`).
8. **`ProfileMenuSheet.tsx` (Root Orchestrator)**:
   - Berkurang dari 828 baris menjadi **~140 baris** (penurunan -688 baris kode / 83%).
   - Berfungsi sebagai orkestrator ramping yang mengelola portal, transisi mount/unmount, dan listener tombol Escape.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 45 (Before) | Sesudah Refactor 45 (After) |
| :--- | :--- | :--- |
| **Ukuran `ProfileMenuSheet.tsx`** | 828 baris (Monolitik masif) | **~140 baris** (Penurunan -688 baris kode / 83%) |
| **Struktur Subkomponen** | Profil, gesture, admin menu, fitur, logout menyatu | 7 file terdedikasi di `src/components/profileMenu/` |
| **Pemisahan Logika & UI** | Sinkronisasi Supabase/Google & gesture bercampur | `useProfileData` & `useSheetGesture` terisolasi murni |
| **Integritas Unit Test** | - | **4/4 tests `ProfileMenuSheet.test.tsx` passed**, **42/42 test files passed (335 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.07s)** |
| **Knowledge Graph** | - | Graphify 3.310 nodes, 4.302 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengguna Menggeser Layar Turun (Swipe Down to Dismiss)
- **Kondisi**: Petugas operasional di lapangan sedang membuka menu profil di smartphone, lalu menggeser layar ke bawah dengan cepat untuk menutup menu tanpa harus menekan tombol silang kecil.
- **Before**: Logika event sentuh bercampur dengan ratusan baris JSX rendering tombol dan sinkronisasi API.
- **After**: `useSheetGesture.ts` menangani gesture secara fluid dengan kurva fisik pegas, mendeteksi velocity dengan akurat, dan menutup sheet secara instan tanpa lag.

### Case 2: Penyesuaian Fitur Spreadsheet dan Monitoring Wilayah
- **Kondisi**: Pengembang ingin menambahkan parameter baru pada pemanggilan format spreadsheet atau memperbarui label menu monitoring wilayah.
- **Before**: Pengembang harus mencari baris di antara 800+ baris kode yang sarat dengan logika profil dan CSS inline.
- **After**: Cukup buka `ProfileFeaturesSection.tsx`, semua aksi terfokus, bersih, dan menggunakan konstanta kamus teks sentral `TEXT_DASHBOARD.PROFILE_MENU.*`.
