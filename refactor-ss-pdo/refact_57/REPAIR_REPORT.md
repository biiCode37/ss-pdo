# Repair Report Refact 57: Dekomposisi Layanan Otentikasi Google (googleSheets/auth)

Dokumen ini memuat laporan teknis implementasi modularisasi `src/services/googleSheets/auth.ts` menjadi submodul mandiri `authGis.ts` dan `authSession.ts`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/services/googleSheets/`)

1. **`authGis.ts`**:
   - `initGoogleApi`: Pemuatan dinamis skrip Google Identity Services dan GAPI client dengan timeout pengaman 15 detik.
   - `signIn`: Membuka popup autentikasi Google OAuth dengan prompt consent dan fallback error handling ramah pengguna.
   - `signOut`: Menghapus seluruh flag sesi pengguna di `localStorage` dan merevoke token aktif secara aman.
   - Mengelola state `tokenClient` secara terisolasi via getter/setter.

2. **`authSession.ts`**:
   - `checkSignedInAsync`: Memvalidasi masa aktif token dan status login permanen pengguna saat cold-start sesuai Golden Rule #3.
   - `ensureValidToken` & `refreshTokenInteractiveOrSilent`: Logika silent token refresh di latar belakang tanpa mengganggu interaksi pengguna di UI.
   - `startTokenRefreshTimer` & `stopTokenRefreshTimer`: Timer proaktif yang menyegarkan token 5 menit sebelum kedaluwarsa.
   - `withAuthRetry`: Pembungkus eksekusi panggilan API Google Sheets dengan penanganan error 401/403 otomatis.

3. **`auth.ts` (Facade / Re-export)**:
   - Berkurang dari 569 baris menjadi **25 baris** (penurunan -544 baris / 95%).
   - Menyediakan re-export lengkap sehingga seluruh import di seluruh servis, hook, dan komponen tetap berjalan mulus tanpa perubahan.

4. **Pengujian Unit Mandiri**:
   - `src/services/googleSheets/auth.test.ts`: 7 pengujian komprehensif (ketersediaan GAPI, kredensial, resolve initGoogleApi, reject saat script gagal, checkSignedInAsync offline flag, needs_reauth, dan kontrol start/stop refresh timer).

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 57 (Before) | Sesudah Refactor 57 (After) |
| :--- | :--- | :--- |
| **Ukuran `auth.ts`** | 569 baris (God File Monolitik) | **25 baris** (Penurunan -544 baris / 95%) |
| **Pemisahan Logika GIS SDK** | Tergabung dengan manipulasi session storage | Terisolasi bersih di `src/services/googleSheets/authGis.ts` |
| **Pemisahan Siklus Token & Refresh** | Tergabung dengan pemuatan script DOM | Terisolasi penuh di `src/services/googleSheets/authSession.ts` |
| **Integritas Unit Test** | 3 tests | **7/7 tests passed**, total **51/51 test files passed (378 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.15s)** |
| **Knowledge Graph** | - | Graphify 3.615 nodes, 4.665 edges, 327 communities terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Petugas Membuka Aplikasi Saat Koneksi Internet Awal Lemah / Terputus
- **Kondisi**: Petugas di terminal membuka aplikasi saat sinyal seluler tidak stabil.
- **Before**: Inisialisasi GAPI dan GIS dapat memicu race condition dengan status token lokal.
- **After**: `authSession.ts.checkSignedInAsync` memeriksa status lokal terlebih dahulu dan mendeteksi ketersediaan proxy Service Account Supabase, memastikan sesi petugas tetap login permanen tanpa dipaksa login ulang.

### Case 2: Perpanjangan Token Otomatis Sebelum Masa Berlaku 1 Jam Berakhir
- **Kondisi**: Petugas menginput ritase bus secara maraton selama jam sibuk pagi hingga siang.
- **After**: `authSession.ts.startTokenRefreshTimer` secara otomatis menjalankan silent token refresh 5 menit sebelum masa aktif token habis, sehingga petugas tidak pernah mengalami kendala `401 Unauthorized` di tengah proses pengisian data bus.
