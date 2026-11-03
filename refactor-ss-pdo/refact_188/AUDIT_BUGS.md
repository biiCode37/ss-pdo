# Audit Temuan Bug & Defek Tata Letak 1 Parent Shell Input SS (Refactor 188)

Dokumen ini mencatat audit atas permasalahan pemisahan komponen pembungkus datepicker dengan progres harian yang menyisakan ruang kosong, serta tabrakan batas bawah search bar terhadap kartu armada teratas.

---

## Daftar Temuan & Defek UI/UX

### BUG-188-01: Pemisahan Blok Datepicker dan Progres Harian Menyebabkan Ruang Kosong Terputus
- **Lokasi Kode:** `src/components/dashboard/DashboardHeader.tsx`, `src/components/busList/BusListHeader.tsx`
- **Tingkat Keparahan:** HIGH
- **Deskripsi:** Komponen datepicker (`UnifiedRouteControlBar`) dibungkus terpisah di dalam `DashboardHeader`, sementara komponen progres bar harian hingga search bar dibungkus di dalam `BusListHeader`. Pemisahan ini menciptakan sekat visual berupa garis border pemisah dan celah kosong (*empty space*) di antara tanggal dan progres bar, memboroskan ruang vertikal di layar ponsel.
- **Dampak User:** Di layar ponsel yang sempit, pengguna melihat kontrol input terpecah menjadi dua kompartemen berbeda dengan celah kosong yang tidak estetis dan memakan ketinggian viewport yang berharga.
- **Mitigasi:** Mengintegrasikan datepicker (`UnifiedRouteControlBar`), bar progres harian (`BusListProgressBar`), set trip & dropdown kolom, tab pangkalan, hingga kolom pencarian & filter ke dalam **SATU KOMPONEN PEMBUNGKUS (1 Parent Shell)** `.unified-input-control-panel`. Di tab input, `DashboardHeader` hanya menampilkan baris navigasi rute dan profil (`hideRouteControlBar={true}`).

---

### BUG-188-02: Kartu Unit Teratas Tertutup / Tertindih Komponen Search Input + Filter
- **Lokasi Kode:** `src/index.css`, `src/components/busList/BusList.tsx`
- **Tingkat Keparahan:** HIGH
- **Deskripsi:** Jarak clearance antara batas bawah komponen pencarian/filter dengan kartu unit bus teratas (`KMJ 1986`) sangat minim (`padding-top: 6px` dan `margin-bottom: 8px`). Akibatnya, pada tampilan awal maupun scrolling awal, bagian atas kartu unit pertama (border atas dan sebagian teks nomor unit) tertutup dan tertindih oleh tepi bawah kontainer search input + filter.
- **Dampak User:** Nomor bodi unit pertama terpotong sebagian dan border kartu tidak terlihat utuh, menimbulkan kesan glitch visual seolah komponen menimpa kartu di bawahnya.
- **Mitigasi:**
  1. Menetapkan margin pemisah proporsional pada pembungkus panel kontrol: `.sticky-buslist-header { margin-bottom: 14px; }`.
  2. Memberikan padding atas proporsional pada daftar bus: `.bus-list { padding-top: 6px; }`.
  3. Total clearance menjadi 20px, menjamin kartu unit teratas tampil 100% utuh dengan border, background, dan nomor unit yang jelas tanpa tertutup atau tertindih.
