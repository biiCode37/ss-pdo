# Audit Temuan Bug & Glitch Tampilan Header Input SS (Refactor 187)

Dokumen ini mencatat audit komprehensif terhadap permasalahan tampilan antarmuka (UI/UX), komponen duplikat/redundansi, dan tabrakan elemen sticky header pada halaman **Input SS**.

---

## Daftar Temuan & Defek UI/UX

### BUG-187-01: Redundansi Komponen Tanggal & Status Laporan (`UnifiedRouteControlBar`)
- **Lokasi Kode:** `src/components/Dashboard.tsx`, `src/components/busList/BusListHeader.tsx`
- **Tingkat Keparahan:** HIGH
- **Deskripsi:** Komponen kontrol tanggal dan tombol laporan operasional (`UnifiedRouteControlBar`) dirender dua kali berturut-turut di layar yang sama:
  1. Pertama di dalam header global aplikasi (`DashboardHeader.tsx` via `RouteSelectorCard.tsx`).
  2. Kedua di dalam kartu panel kontrol input armada (`BusListHeader.tsx` via `routeControlBar={inputRouteControlBar}`).
- **Dampak User:** Pengguna disajikan dua elemen tanggal identik (`Minggu, 01 Nov 2026`) dan dua pill tombol status laporan identik (`● Laporan A2 v`) yang bertumpuk secara vertikal. Hal ini membingungkan alur pikir pengguna, merusak estetika desain mobile, dan membuang 45–50px ruang vertikal yang sangat berharga.
- **Mitigasi:** Mengeliminasi penyuntikan `routeControlBar` ke `BusListHeader`. Mempertahankan `UnifiedRouteControlBar` murni pada tempat aslinya di `DashboardHeader` sebagai SSOT kontrol navigasi tanggal dan laporan rute.

---

### BUG-187-02: Kartu Unit Bus Paling Atas Tertutup oleh Floating Panel Sticky yang Tebal
- **Lokasi Kode:** `src/index.css`, `src/components/busList/BusListHeader.tsx`
- **Tingkat Keparahan:** CRITICAL
- **Deskripsi:** Pada siklus sebelumnya, seluruh kontrol daftar armada (datepicker duplikat, progres harian, tombol bulk set trip, dropdown fokus kolom, tab pangkalan, dan kolom pencarian) dibungkus ke dalam satu kartu mengambang (`.unified-input-control-panel`) dengan `border-radius: 14px`, `box-shadow` tebal, dan latar belakang kartu terang di dalam kontainer `.sticky-buslist-header`. Saat pengguna men-scroll daftar armada, kontainer sticky setinggi ~260px ini bertindak seperti lempengan pulau melayang di tengah layar yang menutupi setengah bagian atas kartu unit pertama yang sedang di-scroll (nomor bodi, urutan plotting, dan badge terpotong horizontal).
- **Dampak User:** Nomor bodi armada (misal: "KWK 222153") dan nomor urutan plotting (#9) terpotong dan tertutup separuh di balik kartu melayang. Pengguna kesulitan membaca identitas armada dan tidak dapat mengetuk area atas kartu armada secara nyaman di layar sentuh ponsel.
- **Mitigasi:**
  1. Menghapus pembungkus pulau melayang `.unified-input-control-panel` dan mengembalikan `.sticky-buslist-header` ke format solid edge-to-edge (`margin: 0 -16px; padding: 8px 16px; background: var(--color-bg-base)`).
  2. Menyelaraskan border bawah halus (`border-bottom: 1px solid var(--color-border-subtle)`) dan bayangan lembut (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06)`).
  3. Memastikan kartu armada yang di-scroll menghilang secara mulus dan bersih di balik garis batas horizontal header solid layaknya aplikasi iOS native.
  4. Menambahkan `scroll-margin-top` yang proporsional pada kartu unit agar aksi fokus otomatis tidak menyembunyikan kepala kartu di balik header.

---

### BUG-187-03: Kepadatan Vertikal Ekstrem & Header Menguras 50% Layar Ponsel
- **Lokasi Kode:** `src/index.css`, `src/components/dashboard/DashboardHeader.tsx`, `src/components/busList/BusListHeader.tsx`
- **Tingkat Keparahan:** HIGH
- **Deskripsi:** Kombinasi `sticky-top-block` (header rute, profil, tanggal 1) dan `sticky-buslist-header` (tanggal 2, progres, trip, kolom, pangkalan, search) menghasilkan tumpukan sticky setinggi ~360px. Pada layar iPhone standar (tinggi ~844–852px), tumpukan ini menyita 45–50% ruang pandang vertikal. Ditambah bilah navigasi bawah (~70px), ruang tersisa untuk daftar kartu unit kurang dari 400px (hanya muat 2–3 kartu).
- **Dampak User:** Halaman terasa sangat sesak, berantakan (*cluttered*), dan pengguna harus terus-menerus men-scroll mikro untuk melihat status unit armada.
- **Mitigasi:**
  1. Mengeliminasi baris tanggal duplikat (menghemat ~45px).
  2. Mengoptimalkan jarak antar-baris (*padding* dan *gap*) menjadi proporsional (`8px gap`, `8px padding`).
  3. Menurunkan total tinggi blok kontrol dari ~260px menjadi ~140px, membebaskan lebih dari 120px ruang vertikal untuk melihat daftar unit bus.
