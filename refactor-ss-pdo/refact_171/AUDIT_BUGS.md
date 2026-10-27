# Audit Bugs: Refactor 171 — Solusi Komprehensif Status Kesiapan Armada 18 Rute & Redesain Mobile-First

## Ringkasan Eksekutif
Audit ini dilakukan berdasarkan temuan anomali tampilan pada tab **Status Armada** di halaman **Monitoring Wilayah & Laporan WA**. Pada tanggal 27 Oktober 2026, aplikasi hanya menampilkan rute **JAK.87**, sementara 17 rute lainnya tidak tampil sama sekali. Selain itu, tata letak visual sangat boros ruang vertikal ponsel di mana 1 rute dengan 6 bus menyita hampir 100% tinggi layar.

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
  Seluruh unit kendala yang bukan bertatus murni `TO`, `OFF`, atau `SO` diberi label badge abu-abu bertuliskan `[CATATAN]`, tepat di atas teks kendala `Kendala: BA.02 PROGRAM KEUR`.
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
  Menambahkan seksi khusus di bawah rute terkendala: **"Rute Beroperasi Penuh (Tanpa Kendala)"** yang menyajikan daftar chip ringkas hijau (`[JAK.01]`, `[JAK.02]`, dll.) sehingga pengawas mengetahui dengan pasti bahwa rute-rute tersebut 100% aman dan beroperasi normal.

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
