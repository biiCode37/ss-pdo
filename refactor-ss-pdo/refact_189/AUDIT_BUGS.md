# Audit Bugs: Refactor 189 — Halaman Input SS (UI/UX, Redundansi Komponen, & Aksesibilitas)

Audit mendalam terhadap halaman **Input SS** (`Dashboard.tsx`, `BusList.tsx`, `BusListHeader.tsx`, `BusListControlBar.tsx`, `BusCard.tsx`, `BusInputModal.tsx`, dan sub-komponen terkait) menemukan 9 temuan kritis, mulai dari redundansi komponen antarmuka, kegagalan kontras WCAG AA di light mode, hingga inkonsistensi token semantik dan UX feedback.

---

## Daftar Temuan Masalah (Bug Audit)

### 1. BUG-189-01 (Kritis — Redundansi UI/UX & Pemborosan Ruang Layar)
- **Lokasi:** `src/components/Dashboard.tsx` (baris 449–491) & `src/components/dashboard/DashboardHeader.tsx` (baris 78 & 244)
- **Keparahan:** High / Kritis UX
- **Deskripsi:** Komponen `UnifiedRouteControlBar` (bar kontrol tanggal, selector tanggal, dan status Laporan Operasional / tombol Akumulasi) dirender **DUA KALI (DUPLIKAT)** pada halaman Input SS:
  1. Pertama kali di dalam sticky header via `<DashboardHeader />` -> `<RouteSelectorCard />`.
  2. Kedua kali di dalam panel input bus via `<BusListHeader />` -> `.unified-input-control-panel` -> `{routeControlBar}`.
- **Akar Masalah:** Di `src/components/Dashboard.tsx`, `<DashboardHeader>` tidak dipasangi prop `hideRouteControlBar={mainTab === "input"}`. Padahal prop `hideRouteControlBar` sudah disediakan di `DashboardHeaderProps` dan diteruskan ke `RouteSelectorCard`. Akibatnya, header selalu merender bar tanggal secara default, sehingga di tab Input SS terjadi penumpukan dua bar tanggal dan status laporan operasional identik secara vertikal.
- **Dampak Pengguna:** Pada layar ponsel, pengguna melihat 2 bilah tanggal dan 2 tombol laporan operasional bertumpuk. Ini memakan sekitar 45–50px ruang vertikal yang sangat berharga di peranti seluler dan membingungkan pengguna operasional lapangan.
- **Mitigasi:** Tambahkan prop `hideRouteControlBar={mainTab === "input"}` pada `<DashboardHeader />` di `src/components/Dashboard.tsx`.

---

### 2. BUG-189-02 (Sedang — Redundansi Banner Peringatan Kolom Hilang)
- **Lokasi:** `src/components/dashboard/DashboardStatusBanners.tsx` (baris 156–174) & `src/components/dashboard/DashboardContentTabs.tsx` (baris 110–143)
- **Keparahan:** Medium
- **Deskripsi:** Peringatan `missingColumns` (kolom sheet tidak terdeteksi) dirender di dua tempat sekaligus:
  1. Di `DashboardStatusBanners.tsx` (tepat di bawah header).
  2. Di `DashboardContentTabs.tsx` (tepat di atas container `BusList`).
- **Dampak Pengguna:** Jika terdapat ketidaksesuaian kolom di Google Sheets, pengguna melihat 2 kartu/banner peringatan kuning yang isinya sama persis secara berturut-turut.
- **Mitigasi:** Konsolidasikan peringatan kolom hilang hanya pada satu tempat (di `DashboardStatusBanners.tsx` sebagai level halaman global), dan hilangkan duplikasi di dalam `DashboardContentTabs.tsx`.

---

### 3. BUG-189-03 (Tinggi — WCAG AA Contrast Failure pada Badge Plotting di Light Mode)
- **Lokasi:** `src/components/busCard/BusCard.tsx` (baris 130–155)
- **Keparahan:** High / Aksesibilitas WCAG
- **Deskripsi:** Badge titik awal start antrean bus (Start A & Start B) menggunakan background soft dengan opacity 12% (`rgba(14, 165, 233, 0.12)` dan `rgba(245, 158, 11, 0.12)`) namun teksnya menggunakan warna terang (`#38bdf8` dan `#fbbf24`).
- **Dampak Pengguna:** Di Light Mode, teks `#38bdf8` (Light Sky Blue) dan `#fbbf24` (Amber Light) di atas latar putih/abu-abu terang memiliki rasio kontras < 2.5:1 (gagal total standar WCAG AA 4.5:1). Teks tidak terbaca sama sekali di bawah terik matahari oleh petugas lapangan.
- **Mitigasi:** Gunakan token semantik adaptif:
  - Start A: `var(--color-shift-1-bg)`, `var(--color-shift-1-fg)` (atau `var(--color-info-*)`).
  - Start B: `var(--color-warning-bg)`, `var(--color-warning-fg)`.
  - Di Light Mode, pastikan foreground menggunakan shade 700/800 agar kontras ≥ 7:1 (WCAG AAA).

---

### 4. BUG-189-04 (Sedang — Empty State Menyesatkan saat Filter Sisa Unit Aktif)
- **Lokasi:** `src/components/busList/BusList.tsx` (baris 318–329)
- **Keparahan:** Medium / Logika UX
- **Deskripsi:** Saat pengguna mengaktifkan tombol `[Filter Sisa Unit Belum Selesai]` dan seluruh unit bus sudah berhasil diisi (progres 100%), area list bus menjadi kosong. Namun, pesan empty state yang ditampilkan fallback ke `TEXT_DASHBOARD.BUS_LIST.EMPTY_SEARCH("")` ("Tidak ada armada yang cocok dengan pencarian").
- **Dampak Pengguna:** Pengguna mengira data hilang atau pencarian rusak, padahal seluruh unit sudah selesai diisi.
- **Mitigasi:** Tambahkan cabang kondisi: jika `showOnlyUnfinished && filteredData.length === 0 && data.length > 0`, tampilkan pesan ucapan selamat/selesai: `TEXT_DASHBOARD.BUS_LIST.ALL_UNITS_FILLED` ("Semua unit telah selesai diisi untuk kategori ini").

---

### 5. BUG-189-05 (Rendah — Kontras Rendah Dropdown `<option>` Fokus Kolom pada OS Tertentu)
- **Lokasi:** `src/components/busList/BusListControlBar.tsx` (baris 147–148)
- **Keparahan:** Low / Theming
- **Deskripsi:** Elemen `<option>` pada select dropdown kategori menggunakan inline style hardcoded:
  `background: "var(--surface-color, #1e293b)", color: "var(--text-primary, #f8fafc)"`.
- **Dampak Pengguna:** Pada perangkat Android dengan tema Light Mode bawaan Chrome, dropdown options memaksa warna background gelap `#1e293b` dan teks putih padahal container sekitarnya terang, atau pada beberapa browser rendering native option bertabrakan.
- **Mitigasi:** Gunakan token semantik terstandar: `background: "var(--color-surface-raised)"` dan `color: "var(--color-text-primary)"`.

---

### 6. BUG-189-06 (Sedang — Hardcoded Hex Color di Ringkasan Metrik Bus Card)
- **Lokasi:** `src/components/busCard/BusCardSummary.tsx` (baris 77, 85, 96, 105)
- **Keparahan:** Medium / Standar Desain
- **Deskripsi:** Terdapat penggunaan warna mentah `#10b981` (hijau) dan `#f59e0b` (kuning) secara langsung di styling metrik ringkasan kartu bus, melanggar Golden Rule anti-hardcoded hex/rgb.
- **Dampak Pengguna:** Pewarnaan tidak mengikuti adaptasi dark/light mode dari token semantik sentral, berisiko kontras rendah di mode terang.
- **Mitigasi:** Migrasikan ke `var(--color-success-fg)` dan `var(--color-warning-fg)`.

---

### 7. BUG-189-07 (Rendah — Track Hairline Progress Bar Tidak Kontras di Light Mode)
- **Lokasi:** `src/components/busList/BusListProgressBar.tsx` (baris 64)
- **Keparahan:** Low / UI Polish
- **Deskripsi:** Background track progress bar menggunakan `rgba(255, 255, 255, 0.08)`. Di Dark Mode ini tampak transparan halus, tetapi di Light Mode warna putih semi-transparan ini menyatu total dengan kanvas putih, sehingga garis track progress tidak terlihat.
- **Dampak Pengguna:** Di mode terang, pengguna tidak melihat rel/lintasan progress bar, hanya melihat batang hijau yang melayang tanpa konteks total panjang.
- **Mitigasi:** Ganti menjadi `var(--color-border-subtle, rgba(0, 0, 0, 0.08))` atau token semantik track yang adaptif di 2 tema.

---

### 8. BUG-189-08 (Sedang — Inkonsistensi Token Semantik pada Tombol Kontrol Bar)
- **Lokasi:** `src/components/busList/BusListControlBar.tsx` (baris 340, 395)
- **Keparahan:** Medium / Standar Desain
- **Deskripsi:** Tombol `[Filter Sisa Unit]` dan banner/tombol `[Salin KM Akhir 1 ke KM Awal 2]` masih memakai variabel legacy `--input-bg`, `--card-border`, dan string hex statis.
- **Dampak Pengguna:** Inkonsistensi visual dengan tombol-tombol modern di bagian lain aplikasi (seperti di AllRouteMonitoring atau ProfileMenu).
- **Mitigasi:** Standarisasi styling menggunakan token semantik `var(--color-surface-raised)`, `var(--color-border-subtle)`, dan `var(--color-action-primary-*)`.

---

### 9. BUG-189-09 (Sedang — Hardcoded Styles & Kontras Modal Entri Bus)
- **Lokasi:** `src/components/busCard/BusInputModal.tsx`, `BusInputModalTabs.tsx`, `SingleFocusKm.tsx`
- **Keparahan:** Medium / Aksesibilitas
- **Deskripsi:** Masih ditemukan sisa inline style dengan fallback `#1e293b`, `#0f172a`, dan `#334155` pada modal input data bus dan tab single-focus.
- **Dampak Pengguna:** Di Light Mode, modal terasa kaku dan beberapa teks input memiliki bayangan gelap yang tidak alami.
- **Mitigasi:** Sinkronkan seluruh elemen modal dengan token CSS Variables semantik (`semantic.css`).

