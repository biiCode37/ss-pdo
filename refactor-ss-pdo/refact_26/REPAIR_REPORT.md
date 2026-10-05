# REPAIR REPORT: UNIFIED SMART PILL & INTEGRATED FLEET-REPORT OVERHAUL (REFACTOR 26)

Dokumen ini mencatat implementasi pembaruan UI/UX arsitektur kontrol rute terpadu (Unified Smart Pill), penertiban palet warna, penghapusan *capsule inception*, dan integrasi alur Status Armada ke dalam Laporan Operasional pada SS_PDO.

---

## 1. IMPLEMENTASI PERBAIKAN

### 1.1 Kedaulatan Nama Rute & Tipografi Inline yang Bersih
- **File Diubah:** `src/components/RouteSelectorCard.tsx`
- **Tindakan:**
  - Menghapus kotak nested `.morph-pill-badge` berkotak cyan ganda.
  - Memisahkan kode rute dan label tanggal menjadi tipografi inline yang mengalir bebas:
    - Kode Rute: `displayRouteCode` (misal `JAK.115`), `13.5px`, `fontWeight: 700`, warna kontras utama.
    - Bullet Pemisah: `•`, `fontSize: 12px`, `opacity: 0.45`.
    - Label Tanggal: `displayDateLabel` (misal `Tgl 9` atau `Akumulasi`), `12.5px`, `fontWeight: 500`.
    - Chevron Penutup: `ChevronDown`, `14px`, `opacity: 0.7`.
  - Memberikan `flex: 1` dan `minWidth: 0` penuh pada segmen kiri sehingga teks nama rute tidak akan pernah terpotong di layar ponsel selebar 360px ke atas.

### 1.2 Konsolidasi Tombol Aksi Kanan Menjadi Tombol Laporan Tunggal
- **File Diubah:** `src/components/RouteSelectorCard.tsx` & `src/components/Dashboard.tsx`
- **Tindakan:**
  - Menghapus tombol `[ 🚌 Armada ]` dari bar horizontal atas untuk membebaskan ruang horizontal.
  - Mengonsolidasikan aksi kanan menjadi satu pill tunggal:
    - Normal: `[ ⚡ Laporan ▾ ]` dengan status dot (Hijau: Terverifikasi, Biru: Terkirim, Amber: Draft).
    - Mode Akumulasi: `[ ✕ Keluar Akumulasi ]`.
  - Mengurangi lebar horizontal tombol kanan dari sebelumnya ~180px menjadi hanya ~85px, memberikan lebih dari 70% lebar layar untuk segmen identitas rute di kiri.

### 1.3 Penyelarasan Palet Warna & Pembersihan Header
- **File Diubah:** `src/components/Dashboard.tsx`
- **Tindakan:**
  - Memperbarui tombol switcher `[ 🌐 Wilayah ]`:
    - Mengganti border dan background biru jenuh tebal (`rgba(59, 130, 246, 0.1)`) dengan token netral `var(--input-bg)` dan `var(--border-color)`.
    - Menggunakan teks netral sekunder `var(--text-secondary)` dengan ikon globe aksen emerald (`var(--accent-color, #3ECF8E)`).
  - Mengeliminasi efek "Karnaval Warna" sehingga antarmuka tampak tenang, rapi, dan konsisten di Light Mode maupun Dark Mode.

### 1.4 Integrasi Akses Status Armada ke Drawer Laporan Operasional
- **File Diubah:** `src/components/RouteOperationalReportCard.tsx` & `src/components/Dashboard.tsx`
- **Tindakan:**
  - Menambahkan prop `onOpenFleetStatus` pada `RouteOperationalReportCard`.
  - Menambahkan Segmented Control di bawah header drawer:
    - Tab `[ 🚌 Status Armada ]` (memicu pembukaan modal armada).
    - Tab `[ ⚡ Laporan Operasional ]` (tampilan aktif form).
  - Menambahkan tombol aksi cepat `[ 🚌 Atur Unit Armada → ]` tepat pada header seksi **ARMADA PER SHIFT** di dalam form laporan operasional.
  - Memastikan alur kerja petugas sangat alami: buka laporan ➔ periksa/atur status armada jika ada perubahan ➔ lengkapi catatan jalan & headway ➔ kirim laporan.

---

## 2. BEFORE VS AFTER

| Aspek | Sebelum Refactor 26 | Sesudah Refactor 26 |
| :--- | :--- | :--- |
| **Keterbacaan Nama Rute di Ponsel** | Nama rute terpotong menjadi 0px (*invisible*) akibat dua tombol di kanan menyita >60% lebar layar. Hanya terlihat `[ 📅 Tgl 9 ] ▾`. | Nama rute (`JAK.115`) dan tanggal (`Tgl 9`) tampil berdampingan secara utuh, jelas, dan kontras tinggi di layar sempit sekalipun. |
| **Hierarki Bingkai (Border Soup)** | 3 lapis kotak bertingkat (Kontainer luar ➔ Pill kiri ➔ Badge kalender). Kaku dan sempit. | 0 lapis nested badge. Segmen kiri menyatu dengan kontainer bar secara elegan bergaya Apple/Linear native. |
| **Palet Warna Header** | 4 warna neon clashing (Biru Wilayah, Tosca Pin, Hijau Armada, Oranye Laporan). | Palet netral slate yang tenang. Aksen hijau mint terpadu dengan dot status semantik yang bermakna. |
| **Jumlah Tombol di Bar Atas** | 3 tombol berdesakan di bar selebar 360px, rawan salah ketuk (*mis-tap*). | 2 elemen terpadu: Segmen Kiri (Pilih Rute & Tanggal) + Segmen Kanan (Tombol Laporan Tunggal). Area sentuh lega. |
| **Alur Manajemen Armada** | Tombol Armada berdiri sendiri di bar atas, bersaing dengan Laporan. | Terintegrasi mulus di dalam drawer Laporan Operasional dan tetap dipicu otomatis oleh alert bar awal shift. |

---

## 3. CASE: SKENARIO LAPANGAN

### Kasus 1: Petugas di Lapangan Memeriksa Rute Aktif
- **Skenario:** Petugas sedang berdiri di pool memegang smartphone dengan satu tangan di bawah terik matahari.
- **Sebelum Perbaikan:** Di bar atas hanya tertulis `📍 [📅 Tgl 9] ▾` dan dua tombol warna-warni `[ 🚌 Armada ]` `[ Laporan ▾ ]`. Petugas tidak tahu rute mana yang sedang aktif tanpa harus mengetuk tombolnya.
- **Sesudah Perbaikan:** Bar atas langsung terbaca dengan jelas: `📍 JAK.115 • Tgl 9 ▾`. Petugas seketika yakin sedang melihat data rute JAK.115 hari ini.

### Kasus 2: Petugas Mengisi Laporan Harian Terpadu
- **Skenario:** Menjelang akhir shift, petugas ingin melaporkan headway, titik kemacetan, dan status unit.
- **Sebelum Perbaikan:** Petugas bingung apakah harus menekan tombol Armada atau tombol Laporan terlebih dahulu di bar atas yang berdesakan.
- **Sesudah Perbaikan:**
  1. Petugas menekan tombol tunggal `[ ⚡ Laporan ▾ ]`.
  2. Drawer terbuka. Di seksi Armada Per Shift, petugas melihat Realops Shift 1 dan Shift 2 sudah otomatis terisi.
  3. Jika ingin mengubah atau mengecek unit yang libur/mogok, petugas cukup menekan `[ 🚌 Atur Unit Armada → ]`.
  4. Laporan operasional selesai dan dikirim dengan alur yang sangat runtut.

### Kasus 3: Membuka Aplikasi di Pagi Hari (Shift 1)
- **Skenario:** Pukul 04.50 WIB, petugas shift pagi baru membuka aplikasi untuk pertama kali.
- **Sesudah Perbaikan:**
  1. Bar atas tetap sangat bersih (`📍 JAK.115 • Tgl 9 ▾` + `[ ⚡ Laporan ▾ ]`).
  2. Banner ramping `ShiftConfirmationAlertBar` muncul di bawah bar atas: *"Status armada Shift 1 belum terkonfirmasi"*.
  3. Petugas menekan `[ Konfirmasi ]` pada banner untuk langsung mewarnai status armada.
  4. Setelah disimpan, banner otomatis menghilang dan bar atas kembali minimalis tanpa clutter visual.
