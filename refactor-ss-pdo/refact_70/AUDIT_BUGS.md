# 📋 Audit Bugs: Refactor 70 — Redesain Komprehensif Halaman Monitoring Wilayah 18 Rute

Dokumen audit ini mendokumentasikan temuan kelemahan UI/UX, arsitektural, dan inefisiensi alur kerja operasional pimpinan/korlap pada halaman lama *Monitoring Wilayah 18 Rute*.

---

## Daftar Temuan Masalah & Keterbatasan

### BUG-70-01: Desain Navigasi Header Monolitik & Tombol Kembali Fisik Rawan Disorientasi
- **Lokasi Kode:** `src/components/monitoring/MonitoringHeader.tsx` (versi lama) & `src/components/dashboard/Dashboard.tsx`.
- **Keparahan:** 🟡 Sedang (Medium / UX Disorientation & Clutter).
- **Deskripsi:** Pada header monitoring sebelumnya, terdapat tombol fisik `[Kembali ke Operasi Rute]` yang bersanding rapat dengan tombol sinkronisasi global, navigasi tanggal, dan tombol refresh. Tombol fisik ini membuat header tampak penuh (cluttered) di layar ponsel pintar (mobile-first), serta berisiko tertekan secara tidak sengaja oleh pengguna saat mengganti tanggal atau melakukan refresh data.
- **Dampak User:** Korlap/Pimpinan yang sedang memantau rekapitulasi wilayah kerap kali terlempar kembali ke rute tunggal secara tidak sengaja saat menavigasi tanggal di lapangan.
- **Mitigasi:** Alihkan gerbang keluar-masuk antara *Rute Tunggal* dan *Monitoring Wilayah* sepenuhnya ke dalam Menu Profil (`ProfileMenuSheet` / `ProfileFeaturesSection`). Header Monitoring dibuat bersih dan fokus pada identitas korwil, navigasi tanggal, tombol sinkronisasi global, dan foto profil/avatar.

---

### BUG-70-02: Ketiadaan Navigasi Terstruktur untuk 4 Domain Monitoring Wilayah (Monolitik Page)
- **Lokasi Kode:** `src/components/monitoring/AllRouteMonitoringPage.tsx` (lama).
- **Keparahan:** 🟡 Sedang (Medium / Information Overload & Scroll Fatigue).
- **Deskripsi:** Halaman lama menumpuk seluruh informasi (KPI makro, grafik batang TOA, daftar 18 rute, status armada, dan generator laporan WA) ke dalam satu halaman vertikal yang sangat panjang tanpa segmentasi jelas.
- **Dampak User:** Korlap harus melakukan scrolling berulang kali dan mengalami kelelahan visual (scroll fatigue) hanya untuk mencari status armada bus non-SGO atau meng-copy format laporan WhatsApp.
- **Mitigasi:** Rancang arsitektur Bottom Navigation independen (`MonitoringBottomNav`) dengan 4 Tab terisolasi dan spesifik:
  1. **Tab 1: Dashboard** (Executive overview: Readiness bar, Macro KPI, Tren TOA 18 rute, Shift Split, Leaderboard).
  2. **Tab 2: Rute** (Card 18 rute modern dengan filter pengawas dan aksi verifikasi per rute).
  3. **Tab 3: Status Armada** (Rekap real-time armada Non-SGO dikelompokkan per rute).
  4. **Tab 4: Laporan WA** (Studio generator laporan teks WhatsApp resmi wilayah).

---

### BUG-70-03: Ketiadaan Fitur Verifikasi Massal (Bulk Verify) Laporan PDO Wilayah
- **Lokasi Kode:** `src/components/monitoring/AllRouteMonitoringPage.tsx` & `src/services/dailyRouteReportService.ts`.
- **Keparahan:** 🟡 Sedang (Medium / Operational Inefficiency).
- **Deskripsi:** Ketika seluruh atau sebagian besar dari 18 rute telah mengumpulkan laporan harian (`submitted`), Korlap harus membuka dan mengklik tombol verifikasi satu per satu untuk setiap rute.
- **Dampak User:** Membuang waktu signifikan bagi pimpinan/korlap pada malam hari saat batas verifikasi operasional harus segera diselesaikan.
- **Mitigasi:** Tambahkan tombol dan alur kerja **Bulk Verify** pada Tab Rute (`MonitoringRoutesTab.tsx`). Korlap dapat memverifikasi seluruh rute yang berstatus *submitted* dalam satu ketukan dengan konfirmasi SweetAlert2 terproteksi dan feedback toast informatif.

---

### BUG-70-04: Format Teks Laporan WhatsApp Wilayah yang Kurang Rapi dan Sulit Dicerna
- **Lokasi Kode:** `src/utils/waReportGenerator.ts`.
- **Keparahan:** 🟡 Sedang (Medium / Communication Standard & Readability).
- **Deskripsi:** Generator teks laporan WhatsApp sebelumnya menggabungkan metrik secara rapat tanpa hierarki visual yang jelas, pembatas emotikon yang proporsional, atau ringkasan per kelompok pengawas.
- **Dampak User:** Pesan laporan di grup koordinasi WhatsApp Transjakarta terlihat padat, sulit dipindai dengan cepat oleh manajemen, dan rawan salah interpretasi saat membidik rute dengan kendala non-SGO.
- **Mitigasi:** Redesain template laporan WhatsApp menjadi 3 format profesional:
  - **Format 1 (Format Standar Operasional Wilayah):** Header resmi, Kesiapan Laporan, Rekapitulasi Makro, Rincian 18 Rute, Rekapitulasi Non-SGO terperinci, dan Catatan Lapangan.
  - **Format 2 (Ringkasan Eksekutif):** Ringkas dan padat untuk laporan cepat pimpinan.
  - **Format 3 (Kelompok Pengawas / Korlap):** Dikelompokkan per nama pengawas rute.
  Lengkap dengan tombol *Salin Format* dan *Kirim ke WhatsApp* (URL encode aman).
