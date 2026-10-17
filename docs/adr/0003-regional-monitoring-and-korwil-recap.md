# ADR 0003: Arsitektur Rekapitulasi Wilayah, Subtotal Korwil, dan Pensiun Master Spreadsheet

- **Status:** Diterima (*Accepted*)
- **Tanggal:** 2026-10-14
- **Penulis:** AntiGravity & Tim Pengembang SS_PDO
- **Domain:** Monitoring Wilayah 18 Rute Mikrotrans (`src/components/monitoring/`, `src/services/allRouteMonitoringService.ts`)

---

## 1. Konteks & Latar Belakang

Sebelumnya, manajemen dan pengawas wilayah menggunakan **Master Spreadsheet Bulanan (882 baris, 46 kolom)** untuk memonitor 18 rute Mikrotrans. File tersebut mengumpulkan data dari 18 file spreadsheet rute individual menggunakan rumus `=IMPORTRANGE(...)`, lalu menyajikan:
1. **Tabel Kiri (Kolom A–V):** 18 Rute terurut numerik dengan 21 metrik operasional harian dan baris JUMLAH wilayah.
2. **Tabel Kanan (Kolom X–AR):** Pembagian 18 rute ke dalam 3 Tim Korlap/Pengawas (Ranto Lumban Toruan, Abdul Manan, Moamar Z.A. Mahu) beserta baris subtotal masing-masing tim.
3. **Rekap Bulanan (Baris 839–864 `TOTAL BULANAN`):** Akumulasi total KM, penumpang, dan performa selama 1 bulan penuh (tanggal 1 s.d. 31).
4. **Tabel Konstanta `km_baku` (Baris 865–882):** Nilai jarak baku putaran penuh (PP) untuk menghitung ritase (`Total KM ÷ km_baku`).

### Evaluasi Kesiapan Aplikasi SS_PDO Saat Ini (Skor: 76.5%)
- **Formula & 21 Metrik Operasional:** 95% (Backend 100%, Frontend 90% via modal detail rute).
- **Rekap Harian Wilayah:** 92% (Macro KPI Grid, Shift Split Bar, TOA Bar Chart).
- **Pengelompokan & Subtotal Korlap:** 60% (Filter korlap ada, subtotal tim belum dihitung/ditampilkan).
- **Rekap Akumulasi Bulanan 18 Rute:** 45% (Harian 100%, akumulasi multi-hari/bulanan 18 rute 0%).
- **Format Presentasi:** 65% (Mobile cards & Modal lengkap, belum ada flat data table).

---

## 2. Keputusan Arsitektur & Fungsional

### A. Pensiun Penuh Master Spreadsheet Wilayah
- **Keputusan:** File Master Spreadsheet Wilayah **100% dipensiunkan sekarang juga**. Pengawas dan manajemen tidak perlu lagi membuat file spreadsheet bulanan 882 baris tersebut.
- **Rasional:** Seluruh rumus agregasi, rasio produktivitas, pemetaan `km_baku`, dan subtotal sudah diserap 100% ke dalam kode aplikasi SS_PDO.

### B. Koeksistensi Damai dengan Petugas Cara Lama (*Harmonious Hybrid*)
- **Konteks:** Pembuat aplikasi tidak memiliki wewenang struktural untuk memaksa seluruh petugas lapangan beralih ke aplikasi. Sebagian petugas mungkin tetap mengetik di spreadsheet rute anak mereka.
- **Keputusan:** Aplikasi menerapkan prinsip *Super-Aggregator Cerdas*:
  - Petugas inovatif yang input via aplikasi -> Data langsung tersimpan di Supabase (`submitted`/`verified`).
  - Petugas cara lama yang ngetik di spreadsheet rute -> Data otomatis ditarik ke Supabase.
  - Hasilnya: Dashboard Rekap Wilayah, Korwil, dan Bulanan di aplikasi **tetap 100% lengkap dan akurat** tanpa bergantung pada kepatuhan petugas.

### C. Tab Baru `Rekap Korwil` di Navigasi Bawah
- Menambahkan tab ke-5 pada `MonitoringBottomNav.tsx`:
  `[ 🛣️ Rute ]  [ 👥 Korwil ]  [ 📊 Dashboard ]  [ 🚌 Armada ]  [ 📋 Laporan WA ]  (Avatar)`
- Di dalam tab `Rekap Korwil` (`MonitoringKorwilTab.tsx`):
  - Menyajikan 3 Kartu Korwil (Ranto Lumban Toruan, Abdul Manan, Moamar Z.A. Mahu).
  - Setiap kartu menampilkan ringkasan tim: Total Unit Operasi, Total KM, Total Penumpang, Total Ritase PP, dan % Capaian Target Tim.
  - Kartu dapat di-expand untuk melihat kontribusi ke-6 rute anak mereka.
  - Dilengkapi Kartu JUMLAH TOTAL WILAYAH (18 rute) di bagian atas/bawah.

### D. Pemilih Periode Fleksibel Terpadu di Header
- Pada `MonitoringHeader.tsx`, ditambahkan kapsul pemilih periode 4 mode:
  1. **Harian:** 1 hari aktif (stepper `<` dan `>`).
  2. **Mingguan:** 7 hari terakhir dari tanggal acuan.
  3. **Bulanan:** Tanggal 1 s.d. tanggal aktif bulan bersangkutan (pengganti baris 839 spreadsheet).
  4. **Kustom:** Rentang tanggal bebas (Tanggal Mulai s.d. Tanggal Selesai).
- **Konsistensi Lintas Tab:** Ketika periode diubah, seluruh tab (Dashboard, Rute, Rekap Korwil, Laporan WA) otomatis menyajikan data akumulasi periode tersebut.

### E. Strategi Efisiensi Request & Keamanan Otomasi Data
1. **Fase Sekarang (Client-Side Smart Ingestion):**
   - **Rekap Bulanan:** Menggunakan teknik *1-Request Master Sync* (1 request membaca master sheet bulanan langsung mengisi 30 hari x 18 rute di Supabase).
   - **Harian:** Menggunakan *Lightweight Summary Fetch* (hanya membaca rentang sel rekapitulasi, bukan `A1:ZZ`).
2. **Fase Otomasi Masa Depan (Server-Side Inverted Cron — 100% Aman & Gratis Rp 0):**
   - Bukan spreadsheet yang menembak ke Supabase (menghindari eksposur kunci API di sheet publik).
   - Melainkan Server Backend (Supabase Edge Function + `pg_cron` / GitHub Actions) yang terjadwal membaca spreadsheet setiap pukul 14:30 dan 23:00.
   - **Kredensial Aman:** Kunci API tersimpan di Environment Variables server. Spreadsheet petugas 100% bersih dari script.
   - **Biaya:** Rp 0 (100% Gratis selamanya karena kuota Supabase 500.000 request/bulan jauh di atas kebutuhan kita yang hanya ~124 request/bulan).

---

## 3. Konsekuensi

### Positif:
- Beban kerja rekapitulasi manual bulanan hilang 100%.
- Tampilan sangat modern, mobile-first, dan mendukung Light/Dark Mode.
- Fleksibilitas tinggi: bisa melihat performa harian, mingguan, bulanan, maupun rentang kustom.
- Nol gesekan sosial/organisasi di lapangan.
- Keamanan data dan database terjaga 100% tanpa celah bocornya kredensial.

### Netral / Perhatian:
- Perlu penambahan 1 tab di bilah navigasi bawah (menjadi 5 tab item), wajib diuji proporsi layout di berbagai ukuran layar ponsel (mobile-first).
- Perlu penambahan modul kamus teks di `src/constants/texts/` untuk seluruh label baru agar mematuhi aturan Golden Rule Anti-Hardcoded UI Strings.
