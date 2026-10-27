# Audit Bugs: Refactor 171 — Solusi Komprehensif Status Kesiapan Armada 18 Rute & Redesain Mobile-First

## Ringkasan Eksekutif
Audit ini dilakukan berdasarkan temuan anomali tampilan pada tab **Status Armada** di halaman **Monitoring Wilayah & Laporan WA**. Pada tanggal 27 Oktober 2026, aplikasi hanya menampilkan rute **JAK.87**, sementara 17 rute lainnya tidak tampil sama sekali. Selain itu, tata letak visual sangat boros ruang vertikal ponsel di mana 1 rute dengan 6 bus menyita hampir 100% tinggi layar. Tahap audit lanjutan menemukan 5 masalah tambahan terkait pengalaman pengguna di mobile, termasuk modal koreksi yang menghapus catatan eksisting dan kartu rute yang default terbuka penuh.

---

## Daftar Temuan Masalah

### 1. BUG-171-01: Data Ingestion Mismatch pada Tab Status Armada (Hanya JAK.87 Tampil)
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 42–110), `src/components/monitoring/AllRouteMonitoringPage.tsx` (baris 574).
- **Keparahan:** 🔴 Tinggi (High Severity - Data Disconnect).
- **Deskripsi:** 
  Ketika sinkronisasi "Load All" atau penarikan 18 Google Sheet rute dijalankan, data disimpan ke tabel `daily_route_reports` (termasuk snapshot bus kendala di kolom `fleet_status_shift1` & `fleet_status_shift2`). Namun komponen `MonitoringFleetStatusTab` saat itu hanya membaca `fleetShifts` dari tabel `daily_fleet_shifts` (yang hanya terisi jika ada input manual A2/Korlap).
- **Dampak Pengguna:** 
  Pada tanggal 27 Oktober, hanya JAK.87 yang pernah diisi melalui modal korlap, sehingga 17 rute lainnya yang sebenarnya sudah ditarik otomatis dari spreadsheet tidak terbaca sama sekali di tab ini. Pengguna mengira aplikasi error karena hanya 1 rute yang muncul.
- **Mitigasi:** 
  Menerapkan **Dual-Source Resolution** (arsitektur 2 jalur seperti pada mesin Laporan WA). Jika data `fleetShifts` belum diinput korlap, sistem otomatis membaca data snapshot kendala dari `routes` (`daily_route_reports`), sehingga seluruh 18 rute langsung terdata otomatis.

---

### 2. BUG-171-02: Pemborosan Ruang Layar Ponsel / Card Bloat (Pelanggaran Mobile-First)
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 680–780).
- **Keparahan:** 🟡 Sedang (Medium Severity - UX / Usability).
- **Deskripsi:** 
  Daftar unit bus menggunakan grid `minmax(280px, 1fr)` dan kartu besar terpisah dengan padding tebal. Pada layar ponsel (~360-400px), setiap unit memakan tinggi ~70px. Untuk 6 unit bus pada JAK.87 saja, ruang yang termakan mencapai >420px. Pengguna harus scroll panjang hanya untuk melihat 1 rute.
- **Dampak Pengguna:** 
  Layar terasa sesak, berantakan, dan kartu bus paling bawah terpotong oleh bilah navigasi bawah (*floating bottom navigation*).
- **Mitigasi:** 
  Merombak tampilan menjadi **Compact List Rows** (tinggi ~38px per unit) dan membungkus setiap rute dengan fitur **Akordeon Lipat (Collapsible Accordion)** serta tombol *Tutup Semua / Buka Semua*.

---

### 3. BUG-171-03: Badge Redundan `[CATATAN]` Tanpa Nilai Informasi
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 689–750).
- **Keparahan:** 🟢 Rendah (Low Severity - Information Hierarchy).
- **Deskripsi:** 
  Seluruh unit kendala yang bukan berstatus murni `TO`, `OFF`, atau `SO` diberi label badge abu-abu bertuliskan `[CATATAN]`, tepat di atas teks kendala `Kendala: BA.02 PROGRAM KEUR`.
- **Dampak Pengguna:** 
  Pengguna tidak mendapatkan informasi cepat mengenai jenis masalah bus karena semua tertulis "CATATAN".
- **Mitigasi:** 
  Membangun helper parser `inferStatusCode` yang secara cerdas mengekstrak kode masalah asli (`BA.01` s/d `BA.06`, `KEUR`, `TEKNIS`, `OFF`, `T.O`, `SO`, `OKB`, `RENOP`) lengkap dengan warna aksen badge yang sesuai standar UI Transjakarta.

---

### 4. BUG-171-04: Rute Normal / Siap Operasi Hilang Tanpa Jejak (*Silent Filter*)
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 80–105).
- **Keparahan:** 🟡 Sedang (Medium Severity - UX Misunderstanding).
- **Deskripsi:** 
  Rute yang memiliki 0 kendala (100% normal) langsung disembunyikan tanpa ada konfirmasi apapun di antarmuka. Pengguna tidak dapat membedakan apakah rute lain itu memang normal atau belum ada datanya.
- **Dampak Pengguna:** 
  Kebingungan di tingkat pengawas dan korwil wilayah mengenai status rute-rute yang tidak muncul.
- **Mitigasi:** 
  Menambahkan seksi khusus di bawah rute terkendala: **"Rute Beroperasi Penuh (Tanpa Kendala)"** yang menyajikan daftar chip ringkas hijau (`[JAK.01]`, `[JAK.02]`, dll.) serta seksi terpisah **"Menunggu Laporan / Sinkronisasi"** untuk rute yang belum ada data.

---

### 5. BUG-171-05: Sisa Dead-Code Istilah SGO di Kamus Sentral
- **Lokasi Kode:** `src/constants/texts/text_dashboard.ts`, `src/constants/texts/text_fleet_status.ts`, `src/constants/texts/text_monitoring.ts`.
- **Keparahan:** 🟢 Rendah (Low Severity - Code Hygiene).
- **Deskripsi:** 
  Terdapat token-token lama yang tidak terpakai seperti `SGO_CONFIRM_TITLE`, `SGO_CONFIRM_BTN`, `SGO_ALL_BTN`, dan label tab monitoring yang masih memakai istilah teknis `(Non-SGO)`.
- **Dampak Pengguna:** 
  Ketidakkonsistenan istilah di antarmuka dan potensi kebingungan pengguna non-teknis.
- **Mitigasi:** 
  Pembersihan total dead-code dan peremajaan kamus teks sentral menjadi istilah ramah operasional: *"Status Kesiapan Armada Wilayah"*, *"Armada Beroperasi"*, dan *"Armada Terkendala"*.

---

### 6. BUG-171-06: Tombol Koreksi Memakan Ruang Horizontal Header Kartu
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 1236–1271).
- **Keparahan:** 🟡 Sedang (Medium Severity - Mobile Space Waste).
- **Deskripsi:** 
  Tombol koreksi modal korlap menampilkan teks lengkap `Koreksi` di samping badge kendala dan chevron. Pada layar berukuran 360px–390px, teks ini mendesak nama operator rute sehingga terpotong atau wrap ke baris baru secara tidak rapi.
- **Dampak Pengguna:** 
  Header kartu terlihat padat, sempit, dan terkesan AI slop yang tidak memprioritaskan kerapian mobile viewport.
- **Mitigasi:** 
  Menghapus teks `"Koreksi"` dan menggantinya murni dengan icon edit persegi ramping (`<Edit3 size={12} />`) berukuran 25x25px dengan tooltip dan `aria-label`.

---

### 7. BUG-171-07: Format Badge Kendala Memuat Ikon Bus Berlebihan
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 1273–1290).
- **Keparahan:** 🟢 Rendah (Low Severity - Visual Clutter).
- **Deskripsi:** 
  Badge unit kendala sempat menampilkan icon bus tambahan bersama angka dan icon warning, menghasilkan tumpukan icon yang redundant di samping judul rute.
- **Dampak Pengguna:** 
  Informasi visual terpecah dan memakan ruang horizontal yang berharga di layar ponsel.
- **Mitigasi:** 
  Menstandarkan badge kendala menjadi format presisi murni: `[jumlah] + icon warning` (contoh: `6 ⚠️`), tanpa icon bus.

---

### 8. BUG-171-08: Default Card Expanded Memenuhi Layar Sejak Awal
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 209–212).
- **Keparahan:** 🟡 Sedang (Medium Severity - UX Friction).
- **Deskripsi:** 
  Ketika state awal accordion diset terbuka (*expanded*), begitu pengguna membuka tab Status Armada, seluruh bus kendala langsung terbuka lebar. Pengguna harus scroll sangat jauh ke bawah untuk mengetahui rute lain yang ada.
- **Dampak Pengguna:** 
  Kehilangan gambaran besar (*high-level view*) dari kondisi wilayah saat pertama kali masuk halaman.
- **Mitigasi:** 
  Menetapkan default kartu dalam mode **terlipat (collapsed)** (`expandedRoutes = new Set()`). Pengguna dapat membuka kartu rute yang ingin diperiksa secara spesifik atau menggunakan tombol "Buka Semua".

---

### 9. BUG-171-09: Data-Wiping & Ketiadaan Pilihan Shift pada `QuickKorlapFleetModal`
- **Lokasi Kode:** `src/components/fleetStatus/QuickKorlapFleetModal.tsx` (baris 92–180).
- **Keparahan:** 🔴 Tinggi (High Severity - Data Overwrite / Loss).
- **Deskripsi:** 
  Saat modal koreksi korlap dibuka dari tab Status Armada: 1) `rawNotes` selalu diset kosong string `''`, sehingga jika user menyimpan, catatan kendala unit yang sudah ada sebelumnya terhapus bersih; 2) `targetRenops` selalu default ke 30 (bukan renops rute aktual); 3) Modal terkunci pada Shift 1 tanpa opsi beralih ke Shift 2.
- **Dampak Pengguna:** 
  Catatan kendala yang sudah diinput hilang secara diam-diam (*silent data loss*), dan korlap tidak bisa memperbarui data Shift 2.
- **Mitigasi:** 
  Menambahkan tombol segmented Shift 1 (Pagi) / Shift 2 (Siang), mengoper `initialNotes` dari unit yang ada sehingga teks kendala terisi otomatis, dan mengoper `defaultRenops` serta `initialRealops` aktual rute.

---

### 10. BUG-171-10: Redundansi Baris Unit pada Mode Filter "Semua Shift"
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (baris 416–458).
- **Keparahan:** 🟡 Sedang (Medium Severity - Data Duplicate).
- **Deskripsi:** 
  Jika bus yang sama (misal `SAF 05`) mengalami kendala di Shift 1 dan Shift 2, mode "Semua Shift" menampilkannya dua kali dalam dua baris terpisah.
- **Dampak Pengguna:** 
  Daftar terasa panjang dan membingungkan karena unit fisik yang sama muncul berkali-kali.
- **Mitigasi:** 
  Mengimplementasikan **Smart Unit Deduplication** berbasis map nomor bodi bus. Jika unit muncul di kedua shift, baris digabungkan menjadi satu dengan badge shift ganda `S1 • S2`.
