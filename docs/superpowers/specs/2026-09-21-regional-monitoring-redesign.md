# 📋 Spesifikasi Desain: Redesign Halaman Monitoring Wilayah 18 Rute

**Tanggal Pembuatan:** 2026-09-21  
**Status:** Draf Perancangan (Tahap Brainstorming & Penguncian Desain)  
**Branch Wajib:** `devmode`  

---

## 1. Latar Belakang & Tujuan

Halaman **Monitoring Wilayah** adalah pusat komando (*command center*) bagi Koordinator Wilayah (Korwil), Koordinator Lapangan (Korlap), Admin, dan Superadmin untuk memantau performa operasional 18 rute secara makro dalam satu layar.

Perombakan ini bertujuan untuk:
1. Menghilangkan *scrolling fatigue* di layar ponsel melalui arsitektur modular berbasis **Bottom Navigation khusus (independen)** di halaman Monitoring Wilayah.
2. Memisahkan antara ringkasan makro pimpinan (Dashboard), pemantauan rute individu (Rute), rekap armada bermasalah (Status Armada), dan pelaporan (Laporan WA).
3. Mengadopsi prinsip **Mobile-First**, ergonomi iOS modern, kontras tinggi untuk 2 tema (**Light Mode & Dark Mode**), dan kepatuhan penuh pada kamus teks sentral `src/constants/texts/text_monitoring.ts`.

---

## 2. Navigasi Global & Hak Akses

### 2.1. Hak Akses (Role-Based Access Control)
- **Role yang Diizinkan:** `korlap`, `korwil`, `admin`, `superadmin`.
- User dengan role `pdo` / petugas lapangan biasa tidak memiliki akses ke halaman ini.

### 2.2. Navigasi Masuk & Keluar (Menu Profil)
- **Header Bersih Tanpa Tombol Kembali:** Header Monitoring Wilayah TIDAK memuat tombol kembali ke rute individu agar ruang vertikal tetap lega.
- **Transisi Antar Halaman di Menu Profil:**
  - Saat user berada di **Halaman Rute Individu**: Menu profil menampilkan tombol **"Monitoring Wilayah"**.
  - Saat user berada di **Halaman Monitoring Wilayah**: Menu profil secara otomatis berganti menampilkan tombol **"Kembali ke Rute"**.

---

## 3. Tab 1: Dashboard (Overview Makro) [TERKUNCI]

Tab pertama ini berfungsi sebagai layar utama eksekutif untuk melihat denyut operasional 18 rute dalam hitungan detik.

### 3.1. Header Ringkas
- **Navigasi Tanggal Stepper:** Tombol `<` (kemarin), `Hari Ini`, dan `>` (besok).
- **Date Picker Kalender:** Input tanggal langsung.
- **Tombol Refresh:** Memuat ulang data secara *real-time* dengan animasi putar halus.
- Bebas dari tombol kembali fisik.

### 3.2. Progress Bar Konfirmasi Status Armada PDO (18 Rute)
- Menampilkan metrik kesiapan armada yang telah dikonfirmasi oleh pengawas PDO melalui tabel Supabase `daily_fleet_shifts` (`is_confirmed = true`).
- Format: `X / 18 Rute Terkonfirmasi (Y%)`.
- Progress bar dengan animasi pegas iOS (*spring bezier*) dan indikator warna dinamis.

### 3.3. Grafik Tren TOA 18 Rute (Bar Chart)
- Visualisasi 18 batang grafik kode rute (`JAK.01` s/d `JAK.120`).
- Sumbu X: Kode rute.
- Sumbu Y: Jumlah penumpang / TOA.
- Interaktif: Dapat di-tap untuk melihat *tooltip* detail penumpang Shift 1 dan Shift 2.

### 3.4. Komponen Kinerja di Bawah Grafik
Bersumber dari data agregat spreadsheet global laporan operasi wilayah (`LAPORAN OPERASI WIL UTARA JULI-DESEMBER_2026.xlsx`):

1. **4 Card Metrik Kinerja Makro Wilayah (High-Level KPI):**
   - 👥 **Total Pelanggan:** Angka riil penumpang wilayah + persentase ketercapaian target (`TOTAL PELANGGAN` / `TARGET PELANGGAN`).
   - 🔄 **Total Ritase:** Total ritase wilayah + rata-rata ritase per bus (`RITASE / BUS`).
   - 🛣️ **Total KM Tempuh:** Total kilometer wilayah + rata-rata KM per bus (`KILOMETER / BUS`).
   - 📈 **Produktivitas / Load Factor:** Penumpang per bus (`PELANGGAN / BUS`) dan penumpang per KM (`PELANGGAN / KM`).

2. **Perbandingan Beban Operasional Shift 1 vs Shift 2 (Shift Ratio Bar):**
   - Visualisasi rasio beban kerja dua warna:
     - **Shift 1 (Pagi):** Total Penumpang S1 (`TOA SHIFT 1` + `MANUAL SHIFT 1`) & persentase.
     - **Shift 2 (Siang/Sore):** Total Penumpang S2 (`TOA SHIFT 2` + `MANUAL SHIFT 2`) & persentase.

3. **Leaderboard Kinerja Rute (Top 3 & Bottom 3):**
   - **Top 3 Rute Tertinggi:** 3 rute dengan jumlah penumpang terbesar hari ini.
   - **3 Rute Butuh Perhatian:** 3 rute dengan ketercapaian terendah terhadap targetnya untuk evaluasi cepat Korwil.

---

## 4. Tab Selanjutnya (Dalam Pembahasan)
- **Tab 2: Rute (Daftar 18 Rute & Verifikasi Laporan)**
- **Tab 3: Status Armada (Monitoring Unit Non-SGO 18 Rute)**
- **Tab 4: Laporan WA (Generator Format WhatsApp Wilayah)**
