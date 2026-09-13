# Audit Temuan Refact 46: Dekomposisi Grafik Tren Pelanggan Harian `DailyToaTrendCard.tsx` (~798 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap komponen grafik tren pelanggan harian `src/components/DailyToaTrendCard.tsx` yang memadukan pengambilan data Google Sheets, pelacakan rentang hari maksimum (`chartMaxDay`), kalkulasi geometri SVG pill bar, kartu ringkasan eksekutif 3-kolom, indikator legenda tren, dan visualisasi grafik interaktif dalam satu file monolitik.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF46-ARCH-001: God File `src/components/DailyToaTrendCard.tsx` (798 baris)

- **Lokasi Kode**: `src/components/DailyToaTrendCard.tsx` (798 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu berkas memegang banyak domain dan kalkulasi matematika yang kompleks:
  1. Pengambilan data tren bulanan dari Google Sheets (`getMonthlyToaTrend`) beserta pengelolaan siklus hidup, pembatalan saat unmount, dan error catching.
  2. Pelacakan dinamis batas hari maksimum grafik (`chartMaxDay`) agar kartu tidak mengecil secara mendadak ketika pengguna mengetuk bar hari sebelumnya.
  3. Komputasi metrik agregasi (nilai puncak/tertinggi, nilai terendah non-nol, rata-rata bulanan) dan geometri koordinat SVG (tinggi bar, rasio, padding horizontal, lebar bar dinamis berdasarkan jumlah hari).
  4. Penentuan klasifikasi tren visual per hari (`up`, `slight_down`, `drastic_down` dengan ambang batas perubahan persentase).
  5. Antarmuka ringkasan eksekutif 3-kolom (Puncak, Terendah, Rata-rata) dengan ikon semantik.
  6. Visualisasi bar chart SVG kustom berfitur interaktif: gradien multi-stop per arah tren, filter glowing drop shadow, ikon penanda puncak/terendah di atas bar, floating metric badge callout, dan label sumbu X.
  7. Tampilan status galat (*error state*) dan skeleton pemuatan data.
- **Dampak User & Pengembang**:
  - Kode SVG yang sangat panjang (~300 baris) membuat berkas sulit dipahami dan rawan regresi ketika melakukan penyesuaian gaya visual atau logika tooltip.
  - Kurangnya unit test terisolasi untuk menguji kalkulasi agregasi metrik dan penanganan kegagalan jaringan.
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/dailyToaTrend/`:
  - `types.ts`: Interface tipe `DailyToaTrendCardProps`, `TrendItem`, `TrendBarData`, dan `TrendChartMetrics`.
  - `useMonthlyTrendData.ts`: Hook untuk parsing hari aktif, pelacakan `chartMaxDay`, pemanggilan data `getMonthlyToaTrend`, serta status loading/error.
  - `useTrendMetrics.ts`: Hook kalkulasi murni untuk memproses peak, lowest, average, dan geometri SVG bar.
  - `ToaTrendHeader.tsx`: Komponen header kartu dengan judul `BarChart2`, filter unit bus, dan label bulan kalender.
  - `ToaExecutiveStats.tsx`: Komponen ringkasan 3-kolom eksekutif (Puncak, Terendah, Rata-rata).
  - `ToaTrendLegend.tsx`: Komponen penunjuk legenda arah tren (hijau naik, oranye turun landai, merah turun drastis).
  - `ToaBarChart.tsx`: Komponen visualisasi SVG grafik bar dengan interaktivitas tap bar dan floating metric badge.
  - `ToaTrendErrorState.tsx`: Komponen penanganan tampilan galat saat gagal memuat tren.
  - `index.ts`: Barrel export terpusat.
  - `DailyToaTrendCard.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~100 baris** dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
