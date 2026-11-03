# Laporan Penyatuan 1 Parent Shell Kontrol Input SS & Penataan Jarak Kartu Teratas (Refactor 188)

## Ringkasan Pelaksanaan

Siklus **Refactor 188** menyempurnakan struktur layout halaman **Input SS** sesuai arahan langsung pengguna:

1. **Penyatuan 1 Komponen Pembungkus (1 Parent Shell):**
   - Menyatukan Datepicker & Status Laporan (`UnifiedRouteControlBar`), Bar Progres Harian (`BusListProgressBar`), Set Jumlah Trip, Fokus Kolom, Tab Pangkalan Segmented, hingga Search Bar & Tombol Filter ke dalam **SATU KOMPONEN PEMBUNGKUS (1 Parent Shell)** `.unified-input-control-panel`.
   - Mengeliminasi garis sekat dan ruang hampa kosong di antara datepicker dan progres harian.
   - Di tab Input SS, `DashboardHeader` hanya menampilkan bilah atas navigasi rute (`< Wilayah`, `📍 JAK.88 v`, profil pengguna) dan menyembunyikan datepicker terpisah (`hideRouteControlBar={true}`).
2. **Desain Terpadu Internal Panel (`isInsidePanel`):**
   - Menambahkan prop `isInsidePanel` pada `UnifiedRouteControlBar` sehingga saat berada di dalam 1 parent shell, datepicker memiliki latar belakang transparan tanpa double-border, diakhiri dengan garis batas halus (`border-bottom: 1px solid var(--color-border-subtle)`) sebelum mengalir mulus ke progres bar.
   - Jarak antar komponen di dalam parent shell diatur secara proporsional (`gap: 8px`, `padding: 10px 12px`), padat, dan hemat ruang di layar mobile.
3. **Pemberian Jarak Proporsional Kartu Unit Teratas (Zero Clipping / Zero Overlap):**
   - Memberikan clearance proporsional sebesar 20px (`margin-bottom: 14px` pada `.sticky-buslist-header` + `padding-top: 6px` pada `.bus-list`).
   - Kartu unit paling atas (misal: `KMJ 1986`) tampil 100% utuh dengan border atas melengkung, badge, dan nomor bodi yang jelas terbaca tanpa ada bagian yang tertutup atau tertindih oleh komponen search bar + filter.

---

## Matriks Perubahan: Before vs After

| Area / Komponen | Sebelum Refactor 188 | Sesudah Refactor 188 |
| :--- | :--- | :--- |
| **Struktur Pembungkus Kontrol Input SS** (`DashboardHeader.tsx`, `BusListHeader.tsx`, `index.css`) | Terpisah menjadi 2 blok berbeda: Datepicker di dalam `DashboardHeader`, sedangkan Progres Harian s/d Search Bar di dalam `BusListHeader`, menciptakan sekat dan ruang kosong di antara keduanya. | **1 Komponen Pembungkus Terpadu (1 Parent Shell):** Datepicker, Progres Harian, Set Trip, Fokus Kolom, Tab Pangkalan, dan Search Bar menyatu dalam `.unified-input-control-panel`. Tidak ada space kosong yang boros layout. |
| **Bilah Header Navigasi di Tab Input** (`DashboardHeader.tsx`) | Menampilkan baris navigasi rute DAN bilah datepicker terpisah di bawahnya. | Sangat ramping (~48px): hanya menampilkan bilah navigasi rute & profil pengguna. Datepicker langsung menyatu di puncak parent shell di bawahnya. |
| **Integrasi Visual Datepicker di Dalam Panel** (`UnifiedRouteControlBar.tsx`) | Menggunakan kapsul terpisah dengan border dan background sendiri. | Mendukung mode `isInsidePanel={true}`: borderless, bergaris pembatas bawah lembut 1px, mengalir secara mulus ke bar progres harian. |
| **Visibilitas Kartu Unit Teratas** (`BusCard.tsx`, `index.css`) | Kepala kartu unit teratas (misal `KMJ 1986`) tertutup sebagian di bawah batas search bar + filter karena clearance minim. | Diberi jarak proporsional bersih 20px. Kartu unit teratas tampil 100% utuh, rapi, dan tidak ada komponen yang tertutup/tertindih. |

---

## Case: Skenario Lapangan

### Skenario: Pengoperasian Input Harian Lapangan di Rute JAK.88
1. **Konteks:** Petugas Pengawas (PDO) membuka aplikasi di ponsel untuk mencatat operasional armada rute JAK.88 (`KMJ 1986`, `KMJ 1987`, `KMJ 1988`, dst.).
2. **Kondisi Sebelum Perbaikan:**
   - Di bagian atas, datepicker terpisah dari progres harian dengan celah ruang kosong di antaranya.
   - Kartu pertama `KMJ 1986` tertutup sebagian kepalanya oleh search bar + filter.
3. **Kondisi Sesudah Perbaikan:**
   - Seluruh kontrol dari Datepicker, Progres Harian (0/22 Unit), Set Trip, Tab Pangkalan (Semua, Priok, Ancol), hingga Search Bar berada dalam 1 kartu pembungkus terpadu yang padat, presisi, dan sangat indah.
   - Tidak ada celah kosong yang memboroskan layar ponsel.
   - Kartu pertama `KMJ 1986` berdiri dengan jarak 20px yang sangat rapi di bawah search bar, terlihat utuh sempurna dengan border melengkung dan teks nomor armada yang jelas.
