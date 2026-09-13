# Repair Report Refact 47: Modularisasi & Dekomposisi Komponen Selektor Rute (RouteSelectorCard)

Dokumen ini memuat laporan teknis implementasi dekomposisi `RouteSelectorCard.tsx` menjadi submodul-submodul terisolasi di `src/components/routeSelector/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/routeSelector/`)
1. **`types.ts`**:
   - Mendefinisikan interface `RouteSelectorCardProps` dan `FlatRouteSheet` untuk kontrak data terpadu antarkomponen.
2. **`dateUtils.ts`**:
   - Memusatkan kamus nama bulan (`MONTH_NAMES_ID`), hari (`INDO_DAYS`), dan singkatan bulan Indonesia (`INDO_MONTHS_SHORT`).
3. **`useRouteCascade.ts`**:
   - Mengisolasi tata kelola hierarki 4 tingkat (Tahun → Bulan → Rute → Tanggal).
   - Mengelola komputasi turunan opsi `availableYears`, `availableMonths`, `availableRouteCodes`, serta flag aktivasi (`monthEnabled`, `routeEnabled`, `dateEnabled`).
   - Memulihkan riwayat sesi dari `localStorage` (`PDO_LAST_VISITED`) dengan sinkronisasi tanggal otomatis jika membuka rute periode bulan berjalan.
   - Mengisolasi sinkronisasi data sheet saat `currentSheetId` selesai dimuat (`prevLoadedSheetIdRef`).
   - Menyediakan handler event perubahan tingkat yang me-reset level di bawahnya secara bersih.
4. **`useAddRouteForm.ts`**:
   - Mengisolasi tata kelola form modal tambah rute:
     - Sanitasi input kode rute (otomatis menghapus dan menambahkan prefix `JAK.`).
     - Inspeksi link Google Sheets live asinkron dengan jeda debounce 600ms dan token anti-stale request.
     - Pengecekan duplikasi rute dan link spreadsheet proaktif secara real-time.
     - Validasi tahun (rentang 2020-2099) dan kode rute sebelum penyimpanan ke Supabase via `createRouteWithSheet()`.
5. **`UnifiedRouteControlBar.tsx`**:
   - Menangani presentasi bar kapsul cerdas (*single smart pill*) di bagian atas halaman:
     - Badge penampil tanggal informatif (`displayDateLabel`, ikon `Calendar`).
     - Tombol kontekstual keluar dari mode akumulasi (*exit accumulation*).
     - Tombol status laporan operasional armada rute (`reportStatus`: Terverifikasi, Terkirim, atau Laporan) dengan dot warna status.
6. **`RouteSelectorCard.tsx` (Root Orchestrator)**:
   - Berkurang dari 740 baris menjadi **~180 baris** (penurunan -560 baris kode / 75%).
   - Mengorkestrasi interaksi antara smart pill bar, bottom sheet drawer pemilih rute, dan modal tambah rute baru.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 47 (Before) | Sesudah Refactor 47 (After) |
| :--- | :--- | :--- |
| **Ukuran `RouteSelectorCard.tsx`** | 740 baris (Monolitik masif) | **~180 baris** (Penurunan -560 baris kode / 75%) |
| **Struktur Subkomponen** | Cascade, localStorage, live check, pill bar menyatu | 6 file terdedikasi di `src/components/routeSelector/` |
| **Pemisahan Logika & UI** | Debounce timer & form validation bercampur dengan pill bar | `useRouteCascade` & `useAddRouteForm` terisolasi murni |
| **Integritas Unit Test** | - | **8/8 tests `RouteSelectorCard.test.tsx` passed**, **43/43 test files passed (337 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.01s)** |
| **Knowledge Graph** | - | Graphify 3.373 nodes, 4.388 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Membuka Aplikasi di Pagi Hari
- **Kondisi**: Pengawas membuka aplikasi pada jam 06:00 WIB setelah hari sebelumnya memeriksa data tanggal 10.
- **Before**: Logika pemulihan rute dari `localStorage` tertanam di dalam komponen visual, rentan salah mengeset tanggal lama alih-alih tanggal hari ini.
- **After**: `useRouteCascade.ts` mengecek apakah rute tersimpan adalah periode bulan berjalan. Jika ya, tanggal otomatis disinkronkan ke tanggal hari ini (today) sehingga pengawas langsung melihat data operasional terkini tanpa langkah manual.

### Case 2: Petugas Menambahkan Link Google Sheets Baru
- **Kondisi**: Petugas menempelkan link Google Sheets baru di dialog tambah rute.
- **Before**: Timer inspeksi header spreadsheet dapat menghasilkan balikan yang terlambat (*race condition*) jika link diedit beberapa kali secara cepat.
- **After**: `useAddRouteForm.ts` menggunakan token pembanding `newRouteUrl !== checkedUrl` untuk membatalkan hasil inspeksi yang telah kedaluwarsa, memastikan nama rute yang terdeteksi selalu akurat.
