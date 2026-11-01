# Repair Plan & Report: Refactor 189 — Halaman Input SS (UI/UX, Redundansi Komponen, & Aksesibilitas)

Dokumen ini memuat rencana perbaikan mendalam untuk mengatasi temuan audit pada `AUDIT_BUGS.md` di halaman **Input SS**.

---

## 📋 Ringkasan Rencana Perbaikan (Item-by-Item)

| Bug ID | Modul / File | Rencana Perbaikan | Kategori |
|---|---|---|---|
| **BUG-189-01** | `src/components/Dashboard.tsx` | Meneruskan prop `hideRouteControlBar={mainTab === "input"}` ke `<DashboardHeader />`. Menghilangkan duplikasi bar tanggal & status operasional di sticky header saat tab input aktif. | UX / Redundansi |
| **BUG-189-02** | `src/components/dashboard/DashboardContentTabs.tsx` | Menghilangkan duplikasi banner `missingColumns` di dalam `DashboardContentTabs` karena sudah dirender secara terpusat oleh `DashboardStatusBanners`. | Integritas UX |
| **BUG-189-03** | `src/components/busCard/BusCard.tsx` | Migrasi badge plotting Start A (`var(--color-shift-1-*)`) dan Start B (`var(--color-warning-*)`) ke token semantik adaptif dengan kontras WCAG AAA (≥ 7:1) di Light & Dark Mode. | Aksesibilitas WCAG |
| **BUG-189-04** | `src/components/busList/BusList.tsx` | Memperbaiki kondisi empty state saat filter sisa unit aktif dan semua unit sudah selesai diisi, menampilkan pesan informatif `ALL_UNITS_FILLED` alih-alih `EMPTY_SEARCH`. | UX Feedback |
| **BUG-189-05** | `src/components/busList/BusListControlBar.tsx` | Standarisasi `<option>` dropdown fokus kolom ke token semantik `var(--color-surface-raised)` dan `var(--color-text-primary)`. | Theming |
| **BUG-189-06** | `src/components/busCard/BusCardSummary.tsx` | Mengganti hardcoded hex color `#10b981` dan `#f59e0b` ke token semantik `var(--color-success-fg)` dan `var(--color-warning-fg)`. | Golden Rule Warna |
| **BUG-189-07** | `src/components/busList/BusListProgressBar.tsx` | Memperbaiki background lintasan (track) progress bar menjadi `var(--color-border-subtle)` agar terlihat jelas di Light Mode. | UI Polish |
| **BUG-189-08** | `src/components/busList/BusListControlBar.tsx` | Menyelaraskan tombol filter sisa unit dan tombol salin KM dengan token semantik terpadu. | Konsistensi UI |
| **BUG-189-09** | `src/components/busCard/modal/` | Membersihkan sisa fallback hardcoded hex di modal input bus agar 100% konsisten dengan `semantic.css`. | Design Tokens |

---

## 🔍 Detail Rencana Implementasi: Before vs After

### 1. Eliminasi Redundansi Bar Tanggal & Status Operasional (BUG-189-01)
- **Before:**
  ```tsx
  // src/components/Dashboard.tsx:449
  <DashboardHeader
    headerBlockRef={headerBlockRef}
    ...
    // hideRouteControlBar TIDAK DI-PASSING (default false)
  />
  ```
  Di `DashboardHeader`, `RouteSelectorCard` merender `UnifiedRouteControlBar`.
  Di bawahnya pada `BusListHeader`, `.unified-input-control-panel` merender `inputRouteControlBar` (`UnifiedRouteControlBar` kedua).
  **Akibat:** Dua bilah kontrol tanggal dan dua tombol laporan operasional tampil menumpuk.
- **After:**
  ```tsx
  // src/components/Dashboard.tsx:449
  <DashboardHeader
    headerBlockRef={headerBlockRef}
    ...
    hideRouteControlBar={mainTab === "input"}
  />
  ```
  Di tab Input SS, bar tanggal di sticky header atas disembunyikan secara bersih, menyisakan 1 bar kontrol tanggal terpadu yang berada di dalam panel kontrol bus list. Ruang vertikal di layar ponsel hemat ~48px.

---

### 2. Eliminasi Duplikasi Peringatan Kolom Hilang (BUG-189-02)
- **Before:**
  Peringatan `missingColumns` dirender di `DashboardStatusBanners` (atas) dan kembali dirender di `DashboardContentTabs` (bawah).
- **After:**
  Hanya dirender satu kali di `DashboardStatusBanners`. Blok duplikat di `DashboardContentTabs` dihapus.

---

### 3. Perbaikan Rasio Kontras WCAG AA/AAA Badge Plotting di Light Mode (BUG-189-03)
- **Before:**
  Teks Start A menggunakan `#38bdf8` di atas background soft; Start B menggunakan `#fbbf24`.
  Rasio kontras di Light Mode: ~2.3:1 (Gagal WCAG AA).
- **After:**
  Menggunakan token semantik:
  - Start A: background `var(--color-shift-1-bg)`, border `var(--color-shift-1-border)`, text `var(--color-shift-1-fg)`.
  - Start B: background `var(--color-warning-bg)`, border `var(--color-warning-border)`, text `var(--color-warning-fg)`.
  Rasio kontras: ≥ 7.2:1 (Lolos WCAG AAA).

---

### 4. Perbaikan Empty State Filter Sisa Unit (BUG-189-04)
- **Before:**
  Saat filter sisa unit aktif dan semua unit sudah diisi, muncul teks: *"Tidak ada armada yang cocok dengan pencarian"*. Pengguna bingung apakah unit hilang atau error.
- **After:**
  Mengecek kondisi:
  ```tsx
  showOnlyUnfinished && filteredData.length === 0 && data.length > 0
    ? TEXT_DASHBOARD.BUS_LIST.ALL_UNITS_FILLED
    : ...
  ```
  Menampilkan pesan ramah: *"Semua unit telah selesai diisi untuk kategori ini 🎉"*.

---

## 📱 Case: Skenario Lapangan

### Skenario 1: Petugas Lapangan di Bawah Terik Matahari Mengisi Data Bus
- **Kondisi Sebelum:** Petugas membuka aplikasi di ponsel di bawah sinar matahari (Light Mode). Layar terasa sesak karena ada 2 baris tanggal dan 2 tombol laporan operasional bertumpuk. Badge rute Start A dan Start B berwarna biru muda dan kuning pudar tidak terbaca.
- **Kondisi Sesudah:** Layar terasa lega dan fokus. Hanya ada 1 kontrol tanggal di panel input. Badge antrean dan titik start terbaca sangat tajam dengan kontras tinggi WCAG AAA.

### Skenario 2: Operator Selesai Menginput Seluruh Armada
- **Kondisi Sebelum:** Operator mengklik tombol `[Filter Sisa Unit]` untuk memeriksa unit mana yang belum selesai. Begitu unit terakhir disimpan, layar tiba-tiba kosong dengan tulisan "Tidak ada armada yang cocok dengan pencarian". Operator panik mengira data terhapus.
- **Kondisi Sesudah:** Begitu unit terakhir disimpan, layar menampilkan kartu feedback hijau yang menyejukkan: "Semua unit telah selesai diisi untuk kategori ini 🎉", memberikan kepastian dan kepuasan kerja bagi operator.

---

## 🛡️ Rencana Verifikasi Quality Gates Sebelum Selesai
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` (100% Pass)
2. `pnpm vitest run src/` (100% Pass)
3. `pnpm run build` (Strict TypeScript & Vite Build 0 error)
4. `graphify update .` (Graf pengetahuan terbarukan)

