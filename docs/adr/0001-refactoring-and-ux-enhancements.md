# ADR 0001: Refactoring Antrean Sync Offline, Autentikasi, dan Dynamic UX Card

## Status
Approved / Implemented

## Konteks
Aplikasi SS_PDO (Sistem Pencatatan Shift Bus Mobile) diaudit dan diperbaiki dalam dokumen audit/refactor di `refactor-ss-pdo/refact_N/`. Setiap folder `refact_N` berisi `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` sesuai aturan dokumentasi proyek. Permasalahan utama mencakup:
1. Race condition dan head-of-line blocking pada antrean sync offline (`useOfflineSync.ts`).
2. Tombol login gapi/GIS macet saat popup ditutup user.
3. False-positive status collision usai sync offline.
4. Tampilan badge status "Tersimpan" / "Selesai" yang statis dan menyesatkan saat cell di spreadsheet asli kosong/dihapus.
5. Pembacaan format shorthand `KM 1` / `KM 2` (misal `14.011`) yang belum terurai jika rumus spreadsheet belum dievaluasi.

## Keputusan Arsitektur & Teknikal

### 1. Atomic Queue Operations & Collision Guard
- **Atomic read-modify-write:** Pengelolaan antrean di `useOfflineSync.ts` kini selalu membaca ulang `localStorage` secara atomik di setiap iterasi per-item untuk mencegah overwrite edit baru.
- **Collision detection:** Setiap `SyncItem` menyimpan `originalSnapshot`. Sebelum menulis data antrean offline ke Google Sheets, `processQueue` melakukan pre-flight check via `getBusRowData`.
- **Status Antrean:** Menambahkan status `'conflict'` dan `'failed'` pada `SyncItem`.
- **Conflict handling:**
  - Konflik online: User dapat menggabungkan data server dengan input lokalnya lalu menyimpan tanpa mengetik ulang.
  - Konflik offline: Item ditandai `conflict` dan dikeluarkan dari proses otomatis sampai user memilih retry, gunakan data server, atau force-save.
- **Retry mechanism:** Retry otomatis berjalan saat event `online` dan scheduler 45 detik untuk item `pending`; setelah 5 kali gagal item berubah menjadi `failed`.
- **Rate limit:** Ada jeda 2 detik antar item sukses untuk mengurangi risiko rate limit Google Sheets.

### 2. Robust Google API Auth Lifecycle
- Menambahkan `error_callback` pada `google.accounts.oauth2.initTokenClient` dan timeout pengaman 20 detik pada Promise `signIn()` dan `reauthenticateSession()`.
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
  - Race condition antrean berkurang melalui atomic read-modify-write.
  - Item konflik disimpan sebagai `conflict`; user memiliki kontrol eksplisit atas resolusi (gabungkan, force-save, atau retry).
  - Pengguna mendapatkan kejelasan data server secara real-time langsung dari subtitle card tanpa harus meng-expand form.
- **Netral:**
  - `SyncItem` membutuhkan sedikit memori tambahan di `localStorage` untuk menyimpan `originalSnapshot` dan `retryCount`. Data lama otomatis dimigrasikan dengan aman.
- **Status Verifikasi:** `npm run test` (22 file, 203 test), `npm run build`, dan `npm run lint` tidak menunjukkan error baru. Detail kondisi awal (sebelum ADR) dan setelah ADR dilaporkan di setiap `REPAIR_REPORT.md`.
