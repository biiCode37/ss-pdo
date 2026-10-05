# 🛠️ Repair Report: Refactor 71 — Penyelesaian Grafik TOA 18 Rute 1-Frame & Dynamic Parser Spreadsheet Global

Dokumen ini merangkum perbaikan teknis, komparasi *Before vs After*, serta skenario pengujian lapangan untuk Refactor 71.

---

## 1. Ringkasan Implementasi

### A. Komponen UI Grafik TOA (`src/components/monitoring/tabs/MonitoringToaBarChart.tsx`)
- **Pembersihan Label Rute:** Menggunakan ekspresi reguler `/^(JAK|J)\.?/i` untuk menghapus awalan `JAK.` atau `J.`. Hasilnya label rute menjadi bersih dan ringkas (contoh: `JAK.01` menjadi `01`, `JAK 110A` menjadi `110A`, `J.10` menjadi `10`).
- **Single-Frame Zero Horizontal Scroll:**
  - Menghilangkan `overflowX: 'auto'` dan menggantinya dengan `width: '100%'`, `overflow: 'hidden'`, `justifyContent: 'space-between'`, `gap: '2px'`.
  - Mengonfigurasi child item batang dengan `flex: '1 1 0'`, `minWidth: 0`, dan `maxWidth: '18px'` sehingga 18 batang terdistribusi merata dan proporsional dalam kontainer mobile selebar 360px–430px.
- **Tipografi Nilai Mikro & Notasi Ringkas:**
  - Nilai di atas batang menggunakan font `7.5px` dengan format ringkas `k` jika $\ge 1.000$ (misal: `2.3k`), format angka bulat jika $< 1.000$, atau `-` jika bernilai 0.
  - Label kode rute di bawah batang menggunakan ukuran `8px` (atau `7px` untuk kode dengan 4+ karakter seperti `110A`).
- **Sentralisasi Kamus Teks:** Seluruh teks tooltip dan judul metrik dipindahkan ke `src/constants/texts/text_monitoring.ts` (`CHART_TOOLTIP_SHIFT`, `CHART_TOA_UNIT`, `CHART_TARGET_PCT`, `CHART_TARGET_ZERO`, `CHART_BAR_TITLE`).

### B. Parser Spreadsheet Global Wilayah (`src/services/googleSheets/globalReportReader.ts`)
- **Dynamic Relative Column Scanner:** Menggantikan pembacaan kolom indeks statis `row[2]` dengan pemindaian baris secara dinamis untuk menemukan kolom rute `JAK` (`findRouteColumn`).
- **Offset Relatif:** Seluruh kolom data operasional dihitung relatif terhadap kolom rute yang ditemukan:
  - `col_route + 1`: Renops
  - `col_route + 2`: Realops
  - `col_route + 3`: KM Tempuh
  - `col_route + 4`: TOA Shift 1
  - `col_route + 5`: Manual Shift 1
  - `col_route + 6`: Total Shift 1
  - `col_route + 7`: TOA Shift 2
  - `col_route + 8`: Manual Shift 2
  - `col_route + 9`: Total Shift 2
  - `col_route + 10`: Total Pelanggan
  - `col_route + 17`: Total Ritase
- **Hasil:** 100% dari 18 rute (JAK 01 s/d JAK 120) berhasil terbaca tanpa ada rute yang terlewat akibat pergeseran kolom kosong di awal baris.

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Tampilan Bar Chart** | Memerlukan scroll horizontal (`overflowX: auto`), batang terpotong di layar HP | 100% muat dalam 1 frame layar ponsel tanpa scroll horizontal (`overflow: hidden`) |
| **Label Kode Rute** | Mengandung `J.` atau `JAK.` (contoh: `J.01`, `JAK.110A`) | Murni nomor rute tanpa inisial (contoh: `01`, `110A`, `120`) |
| **Label Nilai Batang** | Ukuran font besar (9px) yang saling tumpang tindih saat rute banyak | Font mikro 7.5px dengan notasi ringkas ribuan (`k`) dan penanganan nilai 0 (`-`) |
| **Parser Spreadsheet Global** | Indeks statis `row[2]`; hanya 6 rute yang terbaca karena pergeseran kolom sel kosong | Dynamic scanner; seluruh 18 rute terbaca presisi dari spreadsheet global |
| **Kamus UI String** | Beberapa teks pada tooltip masih berupa hardcoded string | 100% terdaftar pada `TEXT_MONITORING.DASHBOARD` dan teruji di `texts.test.ts` |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Evaluasi Kilat Kinerja 18 Rute oleh Korlap di Lapangan
- **Kondisi:** Korlap membuka tab Dashboard Monitoring Wilayah menggunakan ponsel di halte/terminal.
- **Aksi:** Memperhatikan grafik Tren TOA Penumpang per Rute.
- **Hasil:** Ke-18 batang rute tampil rapi berdampingan dalam satu layar penuh tanpa perlu menggeser layar ke samping. Label nomor rute `01`, `02`, `05`, `110A`, dst. langsung terbaca jelas dan batang dengan capaian tertinggi/terendah terlihat seketika.

### Skenario 2: Inspeksi Detail Rute Melalui Interaksi Tap
- **Kondisi:** Korlap ingin memeriksa rincian shift rute dengan lonjakan penumpang (misal `110A`).
- **Aksi:** Mengetuk batang `110A`.
- **Hasil:** Batang rute beranimasi menyala hijau terang (*accent glow*), dan kotak tooltip detail terbuka di atas grafik menampilkan breakdown: `TOA Shift 1: 1.200 • Shift 2: 1.100`, total `2.300 TOA`, serta persentase capaian target harian. Mengetuk kembali batang tersebut menutup tooltip dengan mulus.

### Skenario 3: Sinkronisasi Metrik 18 Rute dari Spreadsheet Capaian Global
- **Kondisi:** Petugas melakukan sinkronisasi data global wilayah dari spreadsheet Google Sheets bulanan.
- **Aksi:** Klik "Tarik Data Global" untuk tanggal yang dipilih.
- **Hasil:** Parser secara adaptif mendeteksi kolom `JAK` pada setiap baris meskipun baris memiliki jumlah kolom kosong di awal yang bervariasi. Seluruh 18 rute tersimpan lengkap ke database tanpa kehilangan data rute mana pun.

---

## 4. Status Quality Gates

- ✅ **Unit Tests:** `70 test files passed (100%)`, `503 unit tests passed (100%)`.
- ✅ **TypeScript & Build:** `tsc -b && vite build` lulus 0 error.
- ✅ **Graphify:** Knowledge graph terbarukan (`4175 nodes, 5382 edges, 367 communities`).
