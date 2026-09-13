# Audit Temuan Refact 47: Dekomposisi Komponen Selektor Rute `RouteSelectorCard.tsx` (~740 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap komponen pengontrol rute dan tanggal operasional `src/components/RouteSelectorCard.tsx` yang memuat logika cascade pemilihan 4 tingkat (Tahun → Bulan → Rute → Tanggal), pemulihan cache localStorage (`PDO_LAST_VISITED`), live spreadsheet checking & inspection, pencegahan duplikasi rute proaktif, single smart pill bar, dan dialog tambah rute.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF47-ARCH-001: God File `src/components/RouteSelectorCard.tsx` (740 baris)

- **Lokasi Kode**: `src/components/RouteSelectorCard.tsx` (740 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu berkas memegang banyak domain state dan alur data operasional:
  1. Cascade pemilihan 4 tingkat (Tahun, Bulan, Rute, Tanggal) dengan opsi yang terfilter bertingkat dari `flatSheets`.
  2. Pemulihan riwayat sesi dari `localStorage` (`PDO_LAST_VISITED`) dengan sinkronisasi tanggal cerdas (otomatis ke tanggal hari ini jika periode aktif, atau tanggal tersimpan jika arsip lampau).
  3. Form penambahan rute baru dengan live inspection Google Sheets (`inspectSpreadsheetHeader`), debounce 600ms, token pembatal anti-stale, dan sanitasi prefix rute `JAK.`.
  4. Deteksi duplikasi rute atau link spreadsheet proaktif secara real-time.
  5. Rendering unified control bar (pill cerdas atas) dengan format tanggal Indonesia, tombol keluar akumulasi, atau status laporan armada rute (`reportStatus`).
  6. Orkestrasi drawer bottom sheet (`RouteSelectorSheet`) dan modal tambah rute (`AddRouteModal`).
- **Dampak User & Pengembang**:
  - Penyesuaian logika validasi form tambah rute berisiko mengganggu event handler cascade dropdown tanggal atau tombol keluar akumulasi.
  - Berkas terlalu panjang dengan percampuran hook state, timer inspeksi, dan rendering kontrol.
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/routeSelector/`:
  - `types.ts`: Interface tipe `RouteSelectorCardProps` dan `FlatRouteSheet`.
  - `dateUtils.ts`: Kamus konstanta `MONTH_NAMES_ID`, `INDO_DAYS`, `INDO_MONTHS_SHORT`.
  - `useRouteCascade.ts`: Hook untuk tata kelola cascade 4 tingkat, pemulihan `localStorage`, sinkronisasi sheet baru, dan handler perubahan level.
  - `useAddRouteForm.ts`: Hook untuk isolasi form tambah rute, live checking spreadsheet Google dengan token anti-stale, dan deteksi duplikasi proaktif.
  - `UnifiedRouteControlBar.tsx`: Komponen smart pill bar atas (badge tanggal statis, tombol keluar akumulasi, atau tombol status laporan operasional).
  - `index.ts`: Barrel export terpusat.
  - `RouteSelectorCard.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~180 baris** dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
