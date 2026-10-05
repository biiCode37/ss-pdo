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

## 4. Tab 2: Rute (Daftar 18 Rute & Verifikasi Laporan) [TERKUNCI]

Tab kedua ini merupakan ruang kerja harian bagi Korwil dan Korlap untuk memeriksa kesiapan masing-masing rute, memverifikasi laporan operasional, dan mengakses rute individu.

### 4.1. Toolbar Pencarian & Filter Cepat
- **Input Pencarian:** Real-time filter untuk mencari kode rute (`JAK.XX`), nama lintasan, atau operator.
- **Filter Status Laporan (Segmented Chips):**
  - `Semua (18)`
  - `Perlu Verifikasi` *(Status `submitted`, menunggu tindakan Korwil)*
  - `Belum Lengkap` *(Status `draft` atau `empty`)*
  - `Terverifikasi` *(Status `verified`)*
- **Filter Korlap:** Tab filter nama pengawas Korlap (Ranto Lumban Toruan, Abdul Manan, dll).
- **Tombol Bulk Verify:**
  - Terletak di sisi kanan toolbar.
  - Aktif secara dinamis jika terdapat rute berstatus `submitted`.
  - Dilengkapi dialog konfirmasi SweetAlert2: *"Verifikasi X rute yang telah disubmit sekaligus?"*.

### 4.2. Kartu Rute Modern Ringkas (Modern Card View)
Mengadopsi format Opsi A (Kartu Modern Ringkas) dengan ergonomi sentuh mobile:
- **Header Kartu:**
  - Badge kode rute (`JAK.XX`) dengan aksen warna rute.
  - Nama operator dan nama Korlap penanggung jawab.
  - Status Badge resmi: `Draft` (Amber), `Submitted` (Sky Blue), `Verified` (Emerald Green), `Belum Ada Data` (Muted Zinc).
- **Metrik Inti 3 Kolom:**
  - *Armada:* Realops / Target Renops (rincian S1 & S2).
  - *Pelanggan:* Total penumpang hari ini (TOA + Tiket Manual).
  - *Ritase:* Total ritase operasional terselesaikan.
- **Action Bar Kartu:**
  - Tombol `[Verifikasi Laporan]`: Muncul aktif saat status `submitted`.
  - Tombol `[Buka Rute]`: Navigasi instan ke dashboard rute individu.

---

## 5. Tab 3: Status Armada (Monitoring Unit Non-SGO 18 Rute) [TERKUNCI]

Tab ketiga ini berfungsi memantau unit bus yang mengalami kendala operasional (TO, OFF, SO, dll) di seluruh 18 rute, terintegrasi langsung dengan database Supabase (`daily_fleet_shifts` & `daily_fleet_non_sgo_units`).

### 5.1. Ringkasan Makro Armada Wilayah (Top Stats Bar)
- **Total Armada Wilayah:** Akumulasi total unit yang terdaftar di wilayah.
- 🟢 **SGO (Siap Guna Operasi):** Total unit siap jalan & persentase ketercapaian.
- ⚠️ **Non-SGO (Kendala Operasional):** Total unit non-SGO dengan breakdown angka instan: `TO: X` • `OFF: Y` • `SO: Z`.

### 5.2. Kontrol Filter Shift & Status
- **Segmented Shift:** `Shift 1` • `Shift 2` • `Gabungan (Semua Shift)`.
- **Filter Tipe Status:** `Semua Non-SGO` • `TO (Tukar Operasi)` • `OFF (Libur)` • `SO (Stop Operasi)`.

### 5.3. Format Tampilan Daftar Bus Kendala (Opsi A - Grouped by Route)
- **Penyaringan Cerdas:** Hanya rute yang memiliki unit non-SGO yang ditampilkan dalam daftar. Rute yang 100% SGO secara otomatis disembunyikan agar layar tetap bersih dan fokus pada mitigasi kendala.
- **Header Grup Rute:**
  - Badge kode rute (`JAK.XX`) & nama operator.
  - Total unit kendala pada rute tersebut (contoh: `JAK.15 (2 Bus Kendala)`).
- **Kartu Unit Bus Non-SGO:**
  - Nomor Body Bus berukuran jelas dan kontras (contoh: `KWK 222177`).
  - Badge tipe status dengan warna standar: `TO` (Amber/Oranye), `OFF` (Rose/Merah), `SO` (Purple/Ungu).
  - Alasan / catatan kendala dari pengawas (contoh: *"Perbaikan Radiator di Bengkel"*, *"Kurang Pramudi"*, dll).
  - Shift operasional (`Shift 1` atau `Shift 2`).

### 5.4. Empty State (Saat Operasional Lancar)
- Jika seluruh rute 100% beroperasi tanpa satu pun bus non-SGO, tampilkan visual elegan bernuansa hijau emerald:
  *"Seluruh armada 18 rute berstatus SGO (Siap Guna Operasi) tanpa kendala."*

---

## 6. Tab 4: Laporan WA (Generator Format WhatsApp Wilayah) [TERKUNCI]

Tab keempat ini berfungsi sebagai *Dedicated Report Studio* untuk menghasilkan format teks laporan resmi siap kirim ke grup WhatsApp Pimpinan dan Manajemen Operasional, tanpa lagi menggunakan modal popup sempit.

### 6.1. Pemilih Format Laporan (Segmented Tabs)
1. **Format 1 (Laporan Wilayah Lengkap):**
   - Rekapitulasi operasional harian komprehensif di akhir hari.
   - Menyajikan 18 rute lengkap: Realisasi Penumpang vs Target HK, Pencapaian KM vs KM Baku, Renops vs Realops, Kendala Operasional, Titik Kemacetan, dan Headway (Tercepat & Terlama).
2. **Format 2 (Laporan Penumpang Rincian Shift):**
   - Rekapitulasi penumpang per shift: `[TOA] + [MANUAL] = JUMLAH`.
   - Menampilkan perbandingan beban kerja Shift 1 dan Shift 2 per rute serta total wilayah (dibandingkan dengan data kemarin & minggu lalu).
3. **Format 3 (Laporan Status Kesiapan Armada):**
   - Apel kesiapan awal shift (Shift 1 pukul 05.00 WIB atau Shift 2 pukul 13.00 WIB).
   - Rangkuman wilayah: Target SGO, Realisasi Ops, Tidak Ops, dan Ketercapaian.
   - Rincian unit non-SGO (TO, OFF, SO) bersumber dari tabel database `daily_fleet_shifts`.

### 6.2. Standar Redesain Format Teks WA (Opsi A - Rapi, Elegan, Tanpa Teks Terpotong)
- **Header Korporat:** Judul resmi wilayah, hari & tanggal Indonesia lengkap, dan perihal laporan.
- **Rangkuman Eksekutif:** Menampilkan metrik makro di bagian atas sebelum masuk ke rincian rute.
- **Struktur Rute Teratur:** Menggunakan bullet titik (`•`), penomoran 2 digit (`01. JAK.01`), dan eliminasi blok monospace yang terlalu lebar guna mencegah *text-wrapping* acak pada layar ponsel pengguna.
- **Pemisah Garis Elegan:** Garis pemisah konsisten (`━━━━━━━━━━━━━━━━━━━`) yang rapi di semua peranti.

### 6.3. Live Text Preview Box & Action Bar
- **Pratinjau Monospace Responsif:** Kotak pratinjau teks bertema WhatsApp dengan font monospace yang nyaman dibaca dan mendukung tema Terang / Gelap.
- **Sticky Action Bar:**
  - 📋 **Tombol [Salin Teks]:** Menyalin teks laporan ke clipboard dengan umpan balik visual toast.
  - 🚀 **Tombol [Kirim ke WhatsApp]:** Membuka aplikasi WhatsApp langsung dengan parameter teks terisi otomatis (`https://wa.me/?text=...` atau Web Share API).

---

## 7. Arsitektur Bottom Navigation Monitoring Wilayah

Bottom Navigation bar dibuat mandiri dan independen, hanya aktif di dalam ruang lingkup halaman Monitoring Wilayah:

```
┌─────────────────────────────────────────────────────────────┐
│                 MONITORING WILAYAH BOTTOM NAV               │
├─────────────┬─────────────┬──────────────────┬──────────────┤
│ 📊 Dashboard│   🚍 Rute    │ ⚠️ Status Armada │ 📱 Laporan WA│
└─────────────┴─────────────┴──────────────────┴──────────────┘
```

1. **Desain Mobile-First & Touch Targets:**
   - Tinggi bar: `64px` dengan `padding-bottom: env(safe-area-inset-bottom)`.
   - Ukuran touch target tab: minimal `48px x 48px` untuk kenyamanan jempol.
   - Indikator tab aktif: Efek *pill backdrop* dengan warna aksen emerald (`#10b981`) dan label tebal.
   - Animasi transisi tab: Menggunakan kurva pegas iOS `cubic-bezier(0.32, 0.72, 0, 1)`.
2. **State Management:**
   - State aktif: `activeTab: 'dashboard' | 'routes' | 'fleet_status' | 'wa_report'`.
   - Navigasi tanggal dipertahankan konsisten antar seluruh tab (mengubah tanggal di tab Dashboard akan otomatis menyinkronkan data di tab Rute, Status Armada, dan Laporan WA).

---

## 8. Integrasi Navigasi Global di Menu Profil

Menghilangkan tombol kembali fisik di header dan memindahkan pintu masuk/keluar ke Menu Profil (`UserProfileModal` / `ProfileMenu`):
- **Saat di Halaman Rute Individu:**
  - Menu Profil menampilkan opsi: **"Monitoring Wilayah"** (khusus role `korlap`, `korwil`, `admin`, `superadmin`).
- **Saat di Halaman Monitoring Wilayah:**
  - Menu Profil secara otomatis berganti menampilkan opsi: **"Kembali ke Rute Individu"**.
- Header Monitoring Wilayah murni memuat: *Badge Wilayah, Stepper Tanggal, Kalender Picker, dan Tombol Refresh*.

---

## 9. Quality Gates & Verifikasi

1. **Kamus Teks Sentral:**
   - Seluruh teks UI baru wajib didefinisikan di `src/constants/texts/text_monitoring.ts` dan `src/constants/texts/text_wa_report.ts`.
   - Diuji via `src/constants/texts/texts.test.ts`.
2. **Unit Testing:**
   - Pengujian komponen tab baru dan verifikasi `pnpm vitest run src/` lulus 100%.
3. **Build & Typecheck:**
   - `pnpm run build` (`tsc -b && vite build`) lulus 0 error.
4. **Knowledge Graph:**
   - `graphify update .` dijalankan setelah seluruh kode rampung.



