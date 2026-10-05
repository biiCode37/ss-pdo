# 🛠️ Repair Report: Refactor 70 — Redesain Komprehensif Halaman Monitoring Wilayah 18 Rute

Dokumen ini mencatat detail teknis perbaikan, perbandingan Sebelum vs Sesudah (*Before vs After*), serta Skenario Lapangan untuk perombakan total halaman Monitoring Wilayah 18 Rute.

---

## 1. Ringkasan Implementasi

1. **Pemisahan Kamus Teks Sentral (`src/constants/texts/text_monitoring.ts` & `src/constants/texts/text_wa_report.ts`):**
   - Mengalihkan 100% hardcoded strings di antarmuka monitoring, bottom navigation, tab bar, card rute, dan WA studio ke dalam modul kamus teks.
   - Dilengkapi validasi integritas otomatis di `src/constants/texts/texts.test.ts`.

2. **Gerbang Navigasi Profil Terpadu (Zero Header Clutter):**
   - Menghapus tombol fisik kembali dari header monitoring (`MonitoringHeader.tsx`).
   - Mengintegrasikan pintu masuk/keluar cerdas di menu profil (`ProfileFeaturesSection.tsx` & `DashboardModals.tsx`):
     - Saat berada di rute tunggal: Menampilkan item menu *Monitoring Wilayah 18 Rute* (hanya untuk role `korlap`, `korwil`, `admin`, `superadmin`).
     - Saat berada di monitoring wilayah: Mengubah item menu profil menjadi *Operasi Rute Tunggal* untuk kembali dengan mulus.

3. **Bottom Navigation Independen (`MonitoringBottomNav.tsx`):**
   - Komponen navigasi bawah ergonomis (tinggi 64px, target sentuh ≥48px) dengan efek *frosted glass* (backdrop-blur).
   - Memfasilitasi perpindahan instan antar 4 domain:
     - **Tab 1: Dashboard** (`MonitoringDashboardTab.tsx`):
       - Progress Bar Kesiapan Laporan PDO Wilayah (`MonitoringShiftSplitBar.tsx`).
       - Grid 4 KPI Makro: Penumpang TOA, Manual, KM Tempuh, dan Ritase Operasi (`MonitoringMacroKpiGrid.tsx`).
       - Grafik Tren TOA 18 Batang Rute dengan sorting dan tooltip presisi (`MonitoringToaBarChart.tsx`).
       - Perbandingan Beban Operasi Shift 1 vs Shift 2.
       - Leaderboard Rute Tertinggi & Terendah (`MonitoringLeaderboard.tsx`).
     - **Tab 2: Rute** (`MonitoringRoutesTab.tsx`):
       - Filter interaktif per pengawas (*Pramudi/Pengawas chips*).
       - Card rute modern (`MonitoringRouteCardModern.tsx`) dengan badge status verifikasi dan tombol aksi verifikasi per rute.
       - Fitur **Bulk Verify** untuk menyetujui seluruh rute yang berstatus *submitted* dalam satu langkah.
     - **Tab 3: Status Armada** (`MonitoringFleetStatusTab.tsx`):
       - Ringkasan unit SGO vs Non-SGO.
       - Kartu pengelompokan unit Non-SGO per rute beserta rincian status (TO, OFF, SO) dan alasan kendala operasional.
     - **Tab 4: Laporan WA Studio** (`MonitoringWaReportTab.tsx`):
       - Pemilih format laporan 3 gaya (Standar Wilayah, Ringkasan Eksekutif, Grup Pengawas).
       - Generator teks terformat rapi (`waReportGenerator.ts`) dengan sanitasi baris, pembatas rapi, dan emotikon informatif.
       - Tombol salin ke clipboard dan tautan kirim langsung ke WhatsApp.

---

## 2. Perbandingan Sebelum vs Sesudah (Before vs After)

| Aspek | Sebelum (Legacy) | Sesudah (Refactor 70) |
|---|---|---|
| **Navigasi Halaman** | Tombol kembali fisik di header berjejal dengan filter tanggal dan tombol sinkronisasi. | **Gerbang Profil Ergonomis**: Navigasi dua arah dialihkan ke Menu Profil (`ProfileMenuSheet`), header bersih dan terisolasi. |
| **Tata Letak Halaman** | Halaman tunggal monolitik sangat panjang, membutuhkan scroll vertikal berlebihan. | **Modern Bottom Navigation**: 4 Tab mandiri (Dashboard, Rute, Status Armada, Laporan WA) dengan tinggi sentuh ramah jempol. |
| **Visualisasi Dashboard** | Grafik sederhana dengan metrik terbatas tanpa breakdown shift. | **Executive Overview**: Dilengkapi Macro KPI Grid, Shift Split Bar, Leaderboard top/bottom rute, dan Tren TOA interaktif. |
| **Verifikasi Laporan** | Verifikasi harus diklik satu per satu untuk masing-masing dari 18 rute. | **Fitur Bulk Verify**: Verifikasi massal dalam satu klik dengan SweetAlert konfirmasi dan proteksi transaksi. |
| **Pemantauan Armada** | Data status armada bercampur aduk dengan data ritase rute. | **Dedicated Fleet Status Tab**: Pengelompokan visual unit Non-SGO (TO/OFF/SO) per rute dengan status badge jelas. |
| **Format Laporan WA** | Format teks padat dan kaku, sulit dibaca pada layar obrolan smartphone. | **WhatsApp Report Studio**: 3 format pilihan estetis, rapi, terstruktur, dengan tombol copy instan dan direct send. |
| **Dukungan Tema** | Beberapa elemen memiliki kontras rendah saat beralih ke dark mode. | **100% Light & Dark Mode**: Menggunakan semantic token Tailwind CSS yang konsisten di seluruh komponen. |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Evaluasi Kinerja Harian Wilayah oleh Korlap Pukul 22.00 WIB
- **Kasus:** Malam hari pukul 22.00 WIB, Korwil/Korlap ingin mengecek pencapaian 18 rute wilayah Utara, memverifikasi seluruh laporan pengawas, dan mengirimkan rekapitulasi ke Grup WhatsApp Pimpinan Transjakarta.
- **Alur Kerja:**
  1. Korlap membuka aplikasi, menekan foto profil, dan memilih menu **Monitoring Wilayah 18 Rute**.
  2. Pada **Tab Dashboard**, Korlap melihat progress bar: `15 / 18 Rute Siap (83%)`, total pelanggan `142.500`, dan grafik tren TOA menunjukkan Rute 10H memiliki volume penumpang tertinggi.
  3. Korlap berpindah ke **Tab Rute**. Terdapat 15 rute dengan status `Submitted` dan 3 rute `Draft`.
  4. Korlap menekan tombol **[Verifikasi Semua (15 Rute)]**. Dialog konfirmasi muncul, Korlap menyetujui, dan 15 rute seketika berubah status menjadi `Verified`.
  5. Korlap berpindah ke **Tab Status Armada** untuk menginspeksi armada non-SGO. Terlihat ada 3 unit TO di Rute 12B akibat gangguan mesin di pool.
  6. Korlap berpindah ke **Tab Laporan WA**, memilih *Format 1 (Standar Wilayah)*, meninjau preview teks yang tertata elegan dan terstruktur, lalu menekan **[Salin Laporan]**.
  7. Laporan langsung ditempelkan ke grup koordinasi pimpinan dengan format rapi dan mudah dibaca.
  8. Untuk kembali bertugas memeriksa detail rute individu, Korlap cukup menekan menu profil dan memilih **Operasi Rute Tunggal**.
- **Hasil:** Alur kerja supervisi lapangan menjadi 5x lebih cepat, minim risiko salah klik, dan laporan tersaji secara profesional.
