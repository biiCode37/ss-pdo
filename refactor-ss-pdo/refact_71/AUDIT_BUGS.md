# 📋 Audit Bugs: Refactor 71 — Perbaikan Grafik Tren TOA 18 Rute (Single Frame Zero-Scroll) & Robust Dynamic Parser Spreadsheet Global

Dokumen audit ini mencatat analisis akar penyebab bug pada grafik Tren TOA dashboard monitoring wilayah serta kegagalan pembacaan data rute pada spreadsheet capaian global.

---

## Daftar Temuan Masalah

### BUG-71-01: Label Kode Rute Mengandung Inisial "JAK."/"J." & Grafik Membutuhkan Scroll Horizontal
- **Lokasi Kode:** `src/components/monitoring/tabs/MonitoringToaBarChart.tsx`
- **Keparahan:** 🟡 Sedang (Medium / Mobile UX Degradation).
- **Deskripsi:** 
  1. Bar chart sebelumnya disetel dengan `overflowX: 'auto'` dan ukuran batang tetap (`flex: '1 0 32px'`, `minWidth: '28px'`). Akibatnya, pada perangkat mobile atau layar dengan lebar normal (360px - 412px), hanya sebagian rute yang terlihat dan pengguna terpaksa menggeser/scroll layar ke samping untuk melihat sisa rute.
  2. Label rute di bawah batang menampilkan inisial `J.` atau `JAK.`, menghabiskan ruang horizontal yang sangat sempit dan membuat teks terpotong atau berantakan.
- **Dampak User:** Pimpinan dan Korlap tidak dapat mengevaluasi perbandingan capaian TOA 18 rute secara cepat dalam satu pandangan (*at-a-glance*) di lapangan.
- **Mitigasi:**
  1. Hapus seluruh inisial `JAK.` dan `J.` dari label kode rute menggunakan regex `route.routeCode.replace(/^(JAK|J)\.?/i, "").trim()`, sehingga hanya menampilkan nomor rute (misal: `01`, `02`, `110A`, `120`).
  2. Rancang kontainer grafik menjadi zero-scroll (`width: 100%`, `overflow: hidden`, `justifyContent: space-between`, `gap: 2px`).
  3. Konfigurasikan setiap batang dengan elastisitas `flex: 1 1 0`, `minWidth: 0`, batas maksimal lebar batang `18px`, serta tipografi nilai mikro (`7.5px` dengan notasi ringkas `k` untuk ribuan) sehingga seluruh 18 batang muat presisi dalam 1 frame layar ponsel.

---

### BUG-71-02: Parsing Posisi Kolom Statis Mengabaikan Data Sebagian Besar Rute dari Spreadsheet Global
- **Lokasi Kode:** `src/services/googleSheets/globalReportReader.ts`
- **Keparahan:** 🔴 Tinggi (High / Data Incompleteness & Inaccurate Analytics).
- **Deskripsi:**
  Fungsi parser spreadsheet `parseDailyRouteReportsFromGlobalSheet` sebelumnya mengekstrak kode rute menggunakan indeks kolom statis `row[2]`. Pada struktur baris Google Sheets riil, sel awal kolom A sering kali kosong sehingga array elemen tergeser dan rute berada di `row[1]`. Pengecekan `if (!rawRoute || !rawRoute.toUpperCase().includes('JAK'))` menyebabkan baris yang tergeser tersebut langsung di-skip. Dari 18 rute yang tersedia pada sheet, hanya sekitar 6 rute yang berhasil terbaca, sementara 12 rute lainnya hilang dan menghasilkan nilai 0 di database dan grafik.
- **Dampak User:** Grafik Tren TOA dan dashboard monitoring wilayah menampilkan banyak rute kosong/0 meskipun data di spreadsheet capaian global sudah terisi lengkap.
- **Mitigasi:**
  1. Terapkan algoritma **Dynamic Relative Column Scanner**: Telusuri kolom baris data untuk mendeteksi indeks kolom yang mengandung kode `JAK` (`findRouteColumn`), lalu petakan metrik operasional (Renops, Realops, KM, TOA S1/S2, Total Pelanggan, Ritase) secara relatif terhadap kolom rute (`routeIdx + offset`).
  2. Tambahkan pencarian dinamis header tanggal jika blok 27 baris bergeser, serta sanitasi nilai angka menggunakan utilitas angka standar proyek.
