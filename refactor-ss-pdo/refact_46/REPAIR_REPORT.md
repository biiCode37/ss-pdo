# Repair Report Refact 46: Modularisasi & Dekomposisi Grafik Tren Pelanggan Harian (DailyToaTrendCard)

Dokumen ini memuat laporan teknis implementasi dekomposisi `DailyToaTrendCard.tsx` menjadi submodul-submodul terisolasi di `src/components/dailyToaTrend/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/dailyToaTrend/`)
1. **`types.ts`**:
   - Mendefinisikan interface data `DailyToaTrendCardProps`, `TrendItem`, `TrendBarData`, dan `TrendChartMetrics`.
2. **`useMonthlyTrendData.ts`**:
   - Mengisolasi helper `parseSelectedDay(tab)` yang ramah mode akumulasi tanggal.
   - Mengelola pembaruan rentang maksimum hari (`chartMaxDay`) agar grafik mempertahankan skala penuh ketika pengguna memilih bar tanggal di masa lalu.
   - Mengisolasi penarikan data asinkron `getMonthlyToaTrend()` dengan pembersihan state saat komponen unmount.
3. **`useTrendMetrics.ts`**:
   - Mengisolasi kalkulasi murni agregasi metrik statistik:
     - Nilai puncak (*Peak*) dan tanggal pencapaiannya.
     - Nilai terendah non-nol (*Lowest*) beserta tanggalnya.
     - Rata-rata pelanggan per hari (*Average*).
   - Menghitung koordinat piksel SVG untuk setiap bar: lebar bar dinamis berdasarkan jumlah data `N`, pergeseran `x`, tinggi bar `barHeight`, dan klasifikasi arah tren (`up`, `slight_down`, `drastic_down`).
4. **`ToaTrendHeader.tsx`**:
   - Menampilkan judul kartu dengan ikon `BarChart2`.
   - Menampilkan filter unit bus aktif (jika ada) dan label bulan kalender.
5. **`ToaExecutiveStats.tsx`**:
   - Menampilkan kartu ringkasan eksekutif 3-kolom modern:
     - Kartu Puncak (*Award* icon, warna hijau aksen).
     - Kartu Terendah (*TrendingDown* icon, warna merah aksen).
     - Kartu Rata-rata (*Zap* icon, warna biru info).
6. **`ToaTrendLegend.tsx`**:
   - Menampilkan legenda penjelas indikator tren (Naik, Turun Landai, Turun Drastis).
7. **`ToaBarChart.tsx`**:
   - Menangani rendering visual SVG murni:
     - Definisi gradien SVG dinamis berbasis ID unik (`idPrefix`) untuk mencegah tabrakan filter pada render multipel.
     - Garis kisi halus (*subtle grid lines*).
     - Kolom bar dengan animasi kemunculan staggered (`animationDelay`).
     - Ikon penanda puncak dan terendah langsung di atas bar.
     - Callout badge floating tooltip saat suatu tanggal ditekan (menampilkan nilai TOA terformat dan navigasi langsung ke tab tanggal tersebut).
     - Label nomor tanggal sumbu X.
8. **`ToaTrendErrorState.tsx`**:
   - Menampilkan kartu error informatif ramah pengguna ketika terjadi kegagalan jaringan spreadsheet.
9. **`DailyToaTrendCard.tsx` (Root Orchestrator)**:
   - Berkurang dari 798 baris menjadi **~100 baris** (penurunan -698 baris kode / 87%).
   - Mengatur state interaksi tooltip lokal dan delegasi seleksi tab global.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 46 (Before) | Sesudah Refactor 46 (After) |
| :--- | :--- | :--- |
| **Ukuran `DailyToaTrendCard.tsx`** | 798 baris (Monolitik masif) | **~100 baris** (Penurunan -698 baris kode / 87%) |
| **Struktur Subkomponen** | Fetching data, kalkulasi SVG, stats, legenda, chart menyatu | 8 file terdedikasi di `src/components/dailyToaTrend/` |
| **Pemisahan Logika & UI** | Matematika kalkulasi SVG bar bercampur dengan template JSX | `useMonthlyTrendData` & `useTrendMetrics` terpisah murni |
| **Integritas Unit Test** | Belum ada pengujian komponen | **2/2 tests `DailyToaTrendCard.test.tsx` passed**, **43/43 test files passed (337 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.09s)** |
| **Knowledge Graph** | - | Graphify 3.347 nodes, 4.367 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Mengetuk Tanggal Masa Lalu di Grafik
- **Kondisi**: Pengawas operasional membuka grafik pada tanggal 25, lalu mengetuk bar tanggal 5 untuk melihat jumlah penumpang pada hari tersebut.
- **Before**: Logika rentang grafik berpotensi mereset skala dan menyebabkan grafik menyusut menjadi hanya 5 hari.
- **After**: `useMonthlyTrendData.ts` mempertahankan `chartMaxDay` stabil sehingga grafik tetap menampilkan rentang 25 hari penuh sementara tooltip floating badge muncul secara presisi di atas bar tanggal 5.

### Case 2: Kegagalan Koneksi Jaringan Spreadsheet Saat Memuat Grafik
- **Kondisi**: Petugas di depo mengalami gangguan sinyal seluler saat grafik sedang memuat data historis.
- **Before**: Penanganan error bercampur di dalam ratusan baris SVG, berpotensi menghasilkan unhandled rejection atau blank screen.
- **After**: `ToaTrendErrorState.tsx` secara otomatis menampilkan banner peringatan ramah pengguna dengan pesan non-teknis standar tanpa merusak sisa dashboard lainnya.
