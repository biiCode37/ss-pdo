# Audit Bugs: Refactor 173 — Integrasi Status Kesiapan Armada Bus pada Tab Operasional Bottom Sheet Rute & Standarisasi Ketelitian Global

## Ringkasan Eksekutif
Audit ini dilakukan menyusul evaluasi alur pengguna (*user journey*) pada dashboard **Monitoring Wilayah 18 Rute**. 

Sebelumnya, pengguna yang membuka menu **Rute** dan mengetuk kartu rute (misalnya: JAK.87) untuk memeriksa detail via bottom sheet `MonitoringRouteDetailModal` hanya melihat metrik agregat angka pada Tab **Operasional** (misal: Renops: 10, Realops: 8, Kesiapan: 80%). Pengguna sama sekali tidak mengetahui nomor bodi bus mana yang tidak jalan, apa status kendalanya (BA, TO, OFF, SO, atau Teknis), dan apa catatan kronologinya tanpa harus berpindah ke tab terpisah **Status Armada**.

Selain itu, user menginstruksikan penguatan **Standar Ketelitian & Optimalisasi Multi-Dimensi Skala Industri Global (Zero-Mistake Quality Gates)** yang diintegrasikan ke aturan global (`GEMINI.md`) dan aturan proyek (`AGENTS.md` & `.agents/AGENTS.md`) agar AI selalu bekerja dengan teliti, hati-hati, dan mengoptimalkan setiap pekerjaan dari sudut keamanan, performa, UI/UX, dan integritas data.

---

## Daftar Temuan Masalah

### 1. BUG-173-01: Ketiadaan Rincian Unit Kendala pada Tab Operasional Modal Rute (Information Blind-Spot)
- **Lokasi Kode:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` & `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`.
- **Keparahan:** 🟡 Sedang (Medium Severity - User Experience Gap / Fragmented Context).
- **Deskripsi:** 
  Pada tab *Operasional*, modal hanya menyajikan angka makro (Renops, Realops, Rasio Kesiapan, KM Tempuh, dan Pelanggan/KM). Tidak ada visualisasi unit armada yang beroperasi maupun yang mengalami kendala teknis atau perizinan.
- **Dampak Pengguna:** 
  Petugas atau pimpinan yang sedang membedah rute tertentu di Menu Rute harus keluar dari modal, berpindah ke menu lain (Status Armada), dan mencari rute tersebut kembali hanya untuk melihat nomor bodi bus yang mogok/libur. Alur ini menimbulkan gesekan navigasi (*high friction*) dan fragmentasi data.
- **Mitigasi:** 
  Menambahkan seksi **Status Kesiapan Armada Bus** langsung di dalam Tab Operasional modal rute dengan resolusi ganda (*dual-source resolution* dari Supabase `fleetShifts` dan fallback ke data spreadsheet). Seksi ini menyajikan daftar unit kendala lengkap dengan nomor bodi, catatan kendala, badge status (`BA`, `TEKNIS`, `TO`, `OFF`, `SO`), dan pill shift (`S1`, `S2`). Jika 0 kendala, tampil badge hijau `100% Siap Jalan` yang informatif.

---

### 2. BUG-173-02: Duplikasi Logika Ekstraksi Unit Kendala & Potensi Divergensi Kode
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`.
- **Keparahan:** 🟡 Sedang (Code Duplication / Maintainability Debt).
- **Deskripsi:** 
  Fungsi inferensi status (`inferStatusCode`), pembersih catatan (`formatUnitNote`), dan deduplikasi bodi bus antar-shift awalnya terkurung di dalam komponen `MonitoringFleetStatusTab.tsx` dan tidak dapat diakses oleh komponen modal rute tanpa menduplikasi kode.
- **Dampak Pengguna:** 
  Jika di kemudian hari ada penambahan kode status kendala baru (misal kode BA baru atau status pemeliharaan baru), perubahan hanya terjadi di satu komponen sementara komponen modal rute akan menampilkan hasil yang berbeda.
- **Mitigasi:** 
  Mengekstrak fungsi-fungsi murni ini ke modul sentral `src/components/monitoring/monitoringUtils.ts` (`inferStatusCode`, `formatUnitNote`, dan `extractRouteTroubledUnits`) dengan uji unit terdedikasi (`monitoringUtils.test.ts`), sehingga seluruh komponen monitoring berbagi logika yang 100% konsisten (DRY & SSOT).

---

### 3. BUG-173-03: Kerapuhan Regex Parsing BA Code pada Format Spasi Lapangan (`BA 01` vs `BA.01`)
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` (sebelumnya baris 111) & `src/components/monitoring/monitoringUtils.ts`.
- **Keparahan:** 🟢 Rendah (Low Severity - Edge Case Text Parsing).
- **Deskripsi:** 
  Pola regex lama `\bBA\.?0?([1-6])\b` hanya mencocokkan titik (`BA.01`) atau tanpa pemisah (`BA01`). Ketika pengawas lapangan mengetik dengan spasi seperti `BA 01 Sakit` atau `BA 02 Laka`, sistem gagal mengenali kode BA dan jatuh ke fallback kata pertama (`BA`).
- **Dampak Pengguna:** 
  Label badge menjadi generic `BA` dengan warna kuning, bukan kode spesifik `BA.01` atau `BA.02` dengan warna oranye standar operasional.
- **Mitigasi:** 
  Menyempurnakan regex menjadi `\bBA[\s.]?0?([1-6])\b` yang secara fleksibel dan akurat mengenali format `BA.01`, `BA01`, maupun `BA 01`.
