# AUDIT BUGS: Perombakan Konsep UI Minimalis & Kontrol Header Rute/Tanggal (Fase 3)

## Informasi Refactor
- **ID Refactor:** `refact_141`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Domain:** Header Controls, Route & Date Selector Capsule, Filter Controls Bar, Mobile-First UI/UX

---

## Daftar Temuan Masalah

### 1. BUG-141-01: Kurangnya Polish Visual dan Konsistensi Spacing pada `UnifiedRouteControlBar`
- **Lokasi Kode:**
  - `src/components/routeSelector/UnifiedRouteControlBar.tsx` (baris 31–82)
- **Keparahan:** Low (Kerapian Visual Mobile & Konsistensi Bahasa Desain)
- **Deskripsi:**
  Kapsul baris kontrol tanggal dan status laporan rute (`UnifiedRouteControlBar`) memiliki padding vertikal dan styling teks tanggal yang belum menggunakan tipografi modern (kurang proporsional di layar ponsel kecil 360px-380px), serta badge status laporan pengawas (A2 Report) dan tombol keluar akumulasi masih menggunakan border-radius kaku.
- **Dampak User:**
  Kapsul tanggal di bawah header terasa agak berat dan kaku, serta teks tanggal rawan terpotong pada layar ponsel sempit.
- **Mitigasi:**
  1. Merapikan styling kapsul `UnifiedRouteControlBar` dengan padding seimbang (`6px 10px`), sudut lengkung lembut (`12px`), dan efek glassmorphism modern (`backdrop-filter: blur(16px)`).
  2. Mengoptimalkan tipografi label tanggal dengan font Plus Jakarta Sans berbobot 600 dan aksen warna hijau emerald tenang.

---

### 2. BUG-141-02: Styling Native Select dan Tombol Operasi Massal pada `BusListControlBar`
- **Lokasi Kode:**
  - `src/components/busList/BusListControlBar.tsx` (baris 51–153, 155–196)
- **Keparahan:** Medium (Kerapian Antarmuka & UX Ergonomi Mobile)
- **Deskripsi:**
  Elemen dropdown "Fokus Kolom" dan tombol "Set Jumlah Trip" menggunakan styling form input klasik dengan garis border yang kurang menyatu dengan kartu-kartu bus baru di Fase 1. Pada mode gelap, dropdown select native memiliki dropdown arrow dan kontras warna yang kurang berpadu halus. Selain itu, tombol filter sisa unit membutuhkan kontras visual yang lebih bersih saat aktif.
- **Dampak User:**
  Area pencarian dan filter di atas daftar armada terasa terpisah dari bahasa desain kartu bus minimalis baru.
- **Mitigasi:**
  1. Memodernisasi tombol "Set Jumlah Trip" dan dropdown "Fokus Kolom" dengan styling rounded kapsul modern, ikon responsif, dan interaksi hover/active yang halus.
  2. Memberikan indikator aktif yang tegas pada tombol filter "Sisa Unit" dengan aksen border dan latar transparan tematik.

---

### 3. BUG-141-03: Hierarki Label Mikro pada Cascade Selector Drawer (`RouteSelectorSheet`)
- **Lokasi Kode:**
  - `src/components/routeSelector/RouteSelectorSheet.tsx` (baris 255–343)
- **Keparahan:** Low (Kerapian Tipografi Drawer Mobile)
- **Deskripsi:**
  Drawer pemilih rute cascade 4 kolom (Tahun, Bulan, Rute, Tanggal) menggunakan label form standar dengan ukuran dan spacing yang memakan ruang drawer di layar HP.
- **Dampak User:**
  Pengguna merasa drawer agak sesak dan harus menggulir ke bawah untuk menekan tombol "Muat Data".
- **Mitigasi:**
  1. Merapikan label mikro pada keempat kolom dropdown (9.5px, uppercase, letter-spacing 0.04em).
  2. Menyelaraskan padding dan radius input select agar pas dalam sekali pandang tanpa scrolling berlebihan.
