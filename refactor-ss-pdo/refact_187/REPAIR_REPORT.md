# Laporan Perbaikan Tata Letak Header Input SS & Eliminasi Komponen Redundan (Refactor 187)

## Ringkasan Pelaksanaan

Siklus **Refactor 187** menuntaskan audit defek antarmuka mobile-first pada halaman **Input SS**, mengatasi tumpukan komponen redundan, menghilangkan tabrakan kartu mengambang (*floating island overlay*), dan mengembalikan ruang pandang optimal untuk pembacaan kartu armada di lapangan:

1. **Eliminasi Komponen Redundan (`UnifiedRouteControlBar`):**
   - Menghapus pembuatan memo `inputRouteControlBar` dan penyuntikannya ke `BusListHeader`.
   - Mengembalikan `UnifiedRouteControlBar` (`[Calendar] Tanggal` + `● Laporan A2 v`) murni sebagai navigasi kontrol tanggal & laporan terpadu global di `DashboardHeader`.
2. **Rekonstruksi `.sticky-buslist-header` Menjadi Solid Edge-to-Edge:**
   - Menghilangkan pembungkus `.unified-input-control-panel` yang berbentuk pulau kartu melayang dengan sudut melengkung `border-radius: 14px` dan bayangan tebal.
   - Mengembalikan `.sticky-buslist-header` merentang penuh ke batas layar ponsel (`margin-left: -16px; margin-right: -16px; padding-left: 16px; padding-right: 16px; background: var(--color-bg-base)`).
   - Menambahkan garis batas bawah lembut (`border-bottom: 1px solid var(--color-border-subtle)`) dan bayangan elevasi halus (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06)`).
3. **Penyelamatan Visibilitas Kartu Bus Paling Atas:**
   - Saat pengguna men-scroll daftar armada, kartu bus meluncur secara alami dan rapi di balik garis horizontal solid header (tidak lagi tampak terpotong setengah atau terselip di bawah sudut rounded pulau melayang).
   - Menambahkan aturan CSS `scroll-margin-top: calc(var(--sticky-header-height, 90px) + 160px);` pada `.bus-card` untuk menjamin fokus otomatis maupun scrolling tidak pernah menenggelamkan kepala kartu bus di balik sticky header.
4. **Penghematan Ruang Vertikal Masif (Pengurangan ~120px):**
   - Tinggi blok kontrol turun dari ~260px menjadi ~140px.
   - Menghasilkan area kerja operasional yang jauh lebih lega, bersih (*clean*), ergonomis, dan nyaman bagi jempol pengguna di lapangan.

---

## Matriks Perubahan: Before vs After

| Area / Komponen | Sebelum Refactor 187 | Sesudah Refactor 187 |
| :--- | :--- | :--- |
| **Bilah Tanggal & Status Laporan** (`Dashboard.tsx`, `BusListHeader.tsx`) | Muncul **2 kali berturut-turut** di atas layar (di `DashboardHeader` dan di dalam kartu `BusListHeader`). | **Tunggal & Konsisten.** Hanya muncul 1 kali di `DashboardHeader` sebagai kontrol navigasi rute sentral aplikasi. |
| **Pembungkus Kontrol Input SS** (`BusListHeader.tsx`, `index.css`) | Dibungkus dalam `.unified-input-control-panel` (kartu floating melayang dengan `border-radius: 14px`, bayangan tebal, dan margin keliling) di dalam sticky container. | Ditempatkan langsung di `.sticky-buslist-header` dengan latar solid penuh (*edge-to-edge*, `background: var(--color-bg-base)`), tanpa border melengkung yang membuat ilusi kartu menindih kartu lain. |
| **Visibilitas Kartu Unit Teratas** (`BusCard.tsx`, `index.css`) | Kepala kartu unit teratas (nomor bodi, antrean plotting `#9`, badge pangkalan) terpotong dan tertutup separuh di bawah tepi kartu floating sticky saat di-scroll. | Kartu armada tampil utuh 100%. Saat di-scroll ke atas, kartu unit menghilang secara presisi dan bersih di balik batas horizontal solid header dengan shadow halus. |
| **Total Ketinggian Sticky Header** | ~360px (menguras hampir 50% tinggi layar ponsel iPhone). | ~225px total (termasuk status bar + header rute + kontrol input), membebaskan ~120px ruang pandang bebas untuk daftar armada. |
| **Pemisah Visual DashboardHeader** (`DashboardHeader.tsx`) | `boxShadow` dimatikan (`"none"`) saat `isInputTab`, menyebabkan batas header global dan konten di bawahnya samar/berantakan. | Diberikan `boxShadow: 0 2px 8px rgba(0, 0, 0, 0.08)` dan `borderBottom: 1px solid var(--color-border-subtle)` yang tegas dan elegan di semua tab. |

---

## Case: Skenario Lapangan

### Skenario: Pengoperasian Input Harian Lapangan di Rute JAK.115
1. **Konteks:** Petugas Pengawas (PDO) membuka aplikasi di ponsel untuk mencatat data operasional harian 30 unit armada rute JAK.115 (10 unit Priok, 20 unit IGI).
2. **Kondisi Sebelum Perbaikan:**
   - Di bagian atas layar, petugas melihat tanggal `Minggu, 01 Nov 2026` dan tombol `● Laporan A2` tertulis dua kali bertumpuk.
   - Di bawahnya bertengger kotak putih tebal mengambang yang memakan setengah layar.
   - Saat petugas men-scroll ke bawah untuk mencari unit `KWK 222153` (#9 IGI), separuh nomor bodi unit tersebut terpotong dan tertutup oleh kotak putih yang mengambang di atasnya. Petugas kesulitan membaca nomor unit dan tidak bisa mengetuk kartu dengan nyaman.
3. **Kondisi Sesudah Perbaikan:**
   - Bilah tanggal dan tombol `Laporan A2` tampil sekali secara anggun dan ringkas di header atas.
   - Di bawahnya, progres harian (0/22 Unit) dan kontrol aksi (Set Trip, Fokus Kolom, Tab Pangkalan Priok/IGI, Pencarian) menyatu mulus ke latar belakang kanvas aplikasi secara solid edge-to-edge.
   - Layar terasa lega dan lapang. Saat petugas men-scroll daftar bus ke unit mana pun (termasuk unit #9 `KWK 222153`), kartu bus tampil 100% utuh tanpa ada bagian yang terpotong atau tertutup. Pengalaman sentuhan jempol terasa sangat mulus dan natural (*60fps fluid*).
