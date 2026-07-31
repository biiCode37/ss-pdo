# ADR 0001: Refactoring Antrean Sync Offline, Autentikasi, dan Dynamic UX Card

## Status
Approved / Implemented

## Konteks
Aplikasi SS_PDO (Sistem Pencatatan Shift Bus Mobile) memiliki 16 bug yang diidentifikasi dalam dokumen audit `refactor-ss-pdo/01-daftar-masalah.md`. Permasalahan utama mencakup:
1. Race condition dan head-of-line blocking pada antrean sync offline (`useOfflineSync.ts`).
2. Tombol login gapi/GIS macet saat popup ditutup user.
3. False-positive status collision usai sync offline.
4. Tampilan badge status "Tersimpan" / "Selesai" yang statis dan menyesatkan saat cell di spreadsheet asli kosong/dihapus.
5. Pembacaan format shorthand `KM 1` / `KM 2` (misal `14.011`) yang belum terurai jika rumus spreadsheet belum dievaluasi.

## Keputusan Arsitektur & Teknikal

### 1. Atomic Queue Operations & Collision Guard
- **Atomic read-modify-write:** Pengelolaan antrean di `useOfflineSync.ts` kini selalu membaca ulang `localStorage` secara atomik di setiap iterasi per-item untuk mencegah overwrite edit baru.
- **Collision detection:** Setiap `SyncItem` menyimpan `originalSnapshot`. Sebelum menulis data antrean offline ke Google Sheets, `processQueue` melakukan pre-flight check via `getBusRowData`.
- **Status Antrean:** Menambahkan status `'conflict'` dan `'failed'` pada `SyncItem`. Error non-auth menggunakan `continue` (bukan `break`) dengan strategi backoff bertahap (2s -> 5s -> 15s -> 60s).

### 2. Robust Google API Auth Lifecycle
- Menambahkan `error_callback` pada `google.accounts.oauth2.initTokenClient` dan timeout pengaman 60 detik pada Promise `signIn()`.
- Menambahkan timer refresh token proaktif yang melakukan silent refresh 5 menit sebelum token OAuth kedaluwarsa.

### 3. Fallback Parsing `KM 1` & `KM 2`
- Di `googleSheets.ts`, fungsi `getBusData` memiliki logika fallback: Jika kolom `kmAwal1`/`kmAkhir1` atau `kmAwal2`/`kmAkhir2` kosong, aplikasi otomatis memecah substring dari kolom `KM 1` / `KM 2` (misalnya `14.011` -> `kmAwal1: "14"`, `kmAkhir1: "011"`).

### 4. Visual UX Redesign: Subtitle Dinamis per-Tab Kategori
- **Hapus Badge Statis:** Badge "Selesai" dan "Tersimpan" dihapus dari header card.
- **Subtitle Live Server Dinamis:** Subtitle pada header card (saat tertutup) berubah secara otomatis menyesuaikan tab kategori yang aktif (`activeCategory`):
  - Tab `ALL`: Menampilkan ringkasan (misal `KM S1: 14011-14025 | TOA S1: 5`).
  - Tab Spesifik (misal `toaShift1`): Menampilkan nilai spesifik kolom tersebut (misal `TOA S1: 5`).
  - Cell Kosong: Menampilkan teks **`Belum Terisi`** dengan warna merah soft (`#f87171`).
- **Pembersihan Form Expanded:** Menghapus label helper/placeholder dari dalam input form agar tampilan form tetap bersih dan fokus pada input data.

## Konsekuensi
- **Positif:** 
  - Tidak ada lagi data hilang akibat race condition antrean.
  - Pengguna mendapatkan kejelasan data server secara real-time langsung dari subtitle card tanpa harus meng-expand form.
  - Pengalaman login dan penanganan offline menjadi stabil dan handal.
- **Netral:**
  - `SyncItem` membutuhkan sedikit memori tambahan di `localStorage` untuk menyimpan `originalSnapshot` dan `retryCount`. Data lama otomatis dimigrasikan dengan aman.
