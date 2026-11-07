# REPAIR REPORT: REFACTOR 226
**Modul:** Penentuan tanggal sinkron `sheet-sync-webhook`
**Tanggal:** 08 November 2026
**Status:** Kode selesai di `devmode` (`2d8fe42`, belum di-push). **Menunggu deploy ulang `sheet-sync-webhook` oleh pemilik**, lalu uji ulang edit tab "7" JAK.115.

---

## 1. Implementasi Perbaikan

### A. `supabase/functions/_shared/syncDate.ts` (baru) — BUG-SYNC-226-01
- `resolveSyncTargetDate({ date, tabName, sheetYear, sheetMonth, todayWib })`:
  1. `date` berformat YYYY-MM-DD → dipakai apa adanya (aplikasi / Cek ulang).
  2. `tabName` angka 1–31 → `sheetYear-sheetMonth-tab` (bila tahun/bulan file diketahui), atau bulan berjalan WIB.
  3. Selain itu, atau tanggal tidak ada di bulan itu (mis. tab "31" di November) → hari ini WIB.

### B. `sheet-sync-webhook/index.ts`
- Klien Supabase dibuat lebih awal agar bisa mencari `route_sheets(year, month)` berdasarkan `spreadsheetId` (hanya bila tidak ada tanggal eksplisit dan tab berupa angka).
- Hasil pencarian di-cache per `spreadsheetId` selama 1 jam di memori fungsi, sehingga edit beruntun tidak menambah request dan Log Ingestion.
- Perhitungan WIB manual diganti `wibTodayString()` bersama. Nama tab yang dibaca diturunkan dari tanggal target, jadi tab yang benar ikut terbaca.
- Apps Script **tidak perlu diubah** (sudah mengirim `spreadsheetId` dan `tabName`).

---

## 2. Before vs After

| Situasi | Before | After |
|---|---|---|
| Edit tab "7" pada 8 Nov pukul 01.25 WIB | Disinkron sebagai 8 Nov (membaca tab "8") | Disinkron sebagai **7 Nov** (membaca tab "7") |
| Edit file Oktober tab "31" pada awal November | Disinkron sebagai tanggal hari ini | **31 Okt** (bulan dari `route_sheets`) |
| Edit tab hari ini | Benar | Tetap benar |
| Cek ulang dari aplikasi (tanggal eksplisit) | Benar | Tetap benar |
| Request tambahan per edit | 0 | ±0 (lookup `route_sheets` di-cache 1 jam per file) |

---

## 3. Case: Skenario Lapangan

### Case BUG-SYNC-226-01: Korlap menemukan data kemarin belum lengkap pukul 00.30
- **Situasi:** Saat pengiriman malam lewat tengah malam, korlap meminta petugas mengisi Total TOA yang terlewat di tab tanggal kemarin.
- **Before:** Edit petugas tercatat ke tanggal hari ini; tab Siap Kirim untuk kemarin tetap menampilkan masalah lama, dan konfirmasi tidak menunjukkan "Berubah".
- **After:** Status kemarin terbarui dalam hitungan detik lewat Realtime, dan konfirmasi yang sudah ada menampilkan "Berubah setelah dikonfirmasi" bila data wajibnya berubah.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. Kontrak warna | Lulus | bagian dari suite penuh |
| 2. `pnpm vitest run src/` | Lulus | 152 file, 1.470/1.470 (+6 test `syncDate.test.ts`) |
| 3. `pnpm run build` | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | dijalankan sebelum commit dokumentasi |
| `deno check sheet-sync-webhook` | Lulus | tanpa `deno.lock` |

**Belum diverifikasi (menunggu deploy):** edit tab "7" JAK.115 memperbarui laporan 7 Nov dan memunculkan "Berubah setelah dikonfirmasi"; mengembalikan nilai menghapus tanda itu.
