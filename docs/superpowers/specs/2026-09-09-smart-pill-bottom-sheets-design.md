# Technical Specification: Clean Single Pill + Contextual Bottom Sheets (Opsi 1)

**Date:** 2026-09-09  
**Status:** Approved  
**Target Branch:** `devmode`  

---

## 1. Overview
Halaman Dashboard operasional saat ini memiliki dua kartu form besar di bagian atas:
1. `RouteSelectorCard` (pemilihan tahun, bulan, rute, tanggal).
2. `RouteOperationalReportCard` (input renops, realops shift 1 & 2, headway, titik macet, kendala).

Ketika kedua komponen ini terbuka atau bergantian dibuka, keduanya memakan ruang vertikal 400–700px di layar smartphone pengguna operasional lapangan. Hal ini memadati layout dan memaksa pengguna menggulir jauh ke bawah sebelum dapat melihat data inti (kartu bus, ringkasan, analitik).

Solusi **Clean Single Pill + Contextual Bottom Sheets** menyatukan kontrol navigasi ke dalam **1 Kapsul Pintar Ringkas (Unified Smart Pill)** setinggi ~46px yang selalu rapi di atas layar, dan memindahkan form interaktif ke dalam **2 Contextual Bottom Sheets** bergaya iOS native (`RouteSelectorSheet` & `RouteOperationalReportSheet`).

---

## 2. Architecture & Component Hierarchy

```
Dashboard.tsx
 ├── UnifiedRouteControlBar (Smart Pill Bar - H: ~46px)
 │    ├── Left Segment: Route & Date trigger [📍 JAK.115 • Tgl 9 Sep ▾]
 │    └── Right Segment: Operational Report trigger [⚡ Laporan: Draft ▾] (or Exit Accumulation)
 ├── RouteSelectorSheet (Bottom Sheet Drawer)
 │    ├── Handle Bar & Header
 │    ├── 4-Level Cascade (Year → Month → Route → Date)
 │    ├── AddRouteModal trigger
 │    └── Load Data Action Button
 ├── RouteOperationalReportSheet (Bottom Sheet Drawer)
 │    ├── Handle Bar & Header + Status Badge
 │    ├── Shift 1 & 2 Renops / Realops Input
 │    ├── Headway Fastest & Slowest
 │    ├── Traffic Jam Spot Chips + Custom Adder
 │    ├── Operational Issues Textarea
 │    └── Submit Button
 └── Core Content (BusList / Analytics / Units)
```

---

## 3. Detailed Component Specifications

### 3.1 `UnifiedRouteControlBar`
- **Tampilan:** Glassmorphic bar dengan sudut `border-radius: 14px`, border subtle, dan padding vertikal minimal (`6px 10px`).
- **Left Trigger:**
  - Ikon MapPin dengan warna aksen (`var(--accent-color)`).
  - Teks Rute aktif (contoh: `JAK.115 (Sep 2026)` atau `JAK.115`).
  - Badge tanggal aktif (contoh: `Tgl 9` atau `Akumulasi (01/09 - 05/09)`).
  - Chevron subtle `▾`.
  - On click: membuka `isRouteSheetOpen = true`.
- **Right Trigger:**
  - Hanya muncul saat `matchedRoute` ada dan bukan mode akumulasi kosong.
  - Menampilkan ikon kilat / status: `⚡ Laporan • Draft` (amber), `⚡ Laporan • Terkirim` (biru), atau `⚡ Laporan • Terverifikasi` (hijau).
  - Jika sedang mode `AKUMULASI`, berubah menjadi tombol mini `✕ Keluar Akumulasi` (`data-testid="exit-accumulation-btn"`).
  - On click: membuka `isReportSheetOpen = true`.

### 3.2 `RouteSelectorSheet`
- **Tipe:** Bottom sheet drawer dengan backdrop overlay semi-transparan (`rgba(0,0,0,0.5)` + `backdrop-filter: blur(4px)`).
- **Animasi:** `cubic-bezier(0.32, 0.72, 0, 1)` slide-up dari bawah layar.
- **Header:** Judul "Pilih Rute & Tanggal" dengan tombol tutup `✕`.
- **Konten:**
  - Grid cascade dropdown 4-level yang sudah terbukti andal:
    - Tahun
    - Bulan
    - Rute
    - Tanggal (mendukung opsi `AKUMULASI` jika aktif).
  - Tombol `+ Tambah Rute Baru` membuka modal `AddRouteModal`.
  - Tombol utama `Muat Data`.
- **UX dismiss:** Tap backdrop, tombol tutup `✕`, atau tombol hardware back via `useMobileBackHandler`.

### 3.3 `RouteOperationalReportSheet`
- **Tipe:** Bottom sheet drawer scrollable.
- **Header:** Ikon bus, judul "Laporan Kondisi & Armada", kode rute aktif, badge status laporan saat ini (`draft`, `submitted`, `verified`), dan tombol tutup `✕`.
- **Konten:**
  - Grid Shift 1 (Renops & Realops).
  - Grid Shift 2 (Renops & Realops).
  - Headway Tercepat & Terlambat.
  - Chip Titik Kemacetan + input tambah titik kustom.
  - Textarea Catatan Masalah Operasional.
  - Tombol simpan/kirim `Kirim Laporan Operasional`.
- **Reaktivitas:** Saat laporan berhasil disimpan (`upsertDailyRouteReport`), state lokal status laporan diupdate menjadi `submitted`, toast sukses ditampilkan, dan pill kanan pada dashboard langsung memperbarui indikator statusnya.

---

## 4. Test Compatibility & Backward Compatibility
Komponen `RouteSelectorCard` dan `RouteOperationalReportCard` tetap dipertahankan ekspornya untuk backward-compatibility dan test suite:
- `RouteSelectorCard.test.tsx` menguji keberadaan dropdown `<select>` dan tombol `data-testid="exit-accumulation-btn"`.
- `RouteOperationalReportCard.test.tsx` menguji input `#realops-s1`, toggle chip titik macet, dan pengiriman laporan.
- Kita menyempurnakan implementasi internalnya dan menghubungkannya dengan `UnifiedRouteControlBar` di `Dashboard.tsx` tanpa merusak kontrak pengujian yang sudah ada.

---

## 5. Verification Plan
1. `pnpm vitest run src/` ➔ 34 test files lulus 100%.
2. `pnpm run build` ➔ TypeScript strict mode dan Vite build lulus 0 error.
3. Cek responsivitas Mobile-First dan kontras Light/Dark theme.
4. Dokumentasi di `refactor-ss-pdo/refact_23/` (`AUDIT_BUGS.md` & `REPAIR_REPORT.md`).
5. `graphify update .`
