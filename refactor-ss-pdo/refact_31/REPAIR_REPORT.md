# REPAIR REPORT: PEMANGKASAN IKON TIDAK PENTING, REDUNDAN & POLUSI VISUAL (REFACTOR 31)

Laporan ini merangkum perbaikan UI/UX, pembersihan polusi visual ikon redundan (*decorative slop*), penggantian emoji mentah menjadi badge semantik elegan, serta adopsi desain tipografi murni (*typography-first*) pada aplikasi SS_PDO.

---

## 1. DAFTAR PERUBAHAN & IMPLEMENTASI

### 🔹 1.1 Pembersihan Ikon Redundan pada Kartu Armada (`BusCard.tsx` & `UnitCard.tsx`)
- **Lokasi File:** `src/components/BusCard.tsx` & `src/components/UnitCard.tsx`
- **Rincian Implementasi:**
  - Menghapus ikon `Navigation` (KM), `Users` (Pnp), `Repeat` (rit), dan `ArrowRightLeft` dari strip data ringkasan kartu.
  - Menghapus ikon `Bus` di samping penomoran armada pada `UnitCard`.
  - Mengganti emoji mentah `⚠️` pada peringatan selisih rit/KM menjadi teks badge semantik dengan dot indikator berlatar amber halus.
  - Mempertahankan aksesibilitas interaktif tombol modal trip (`.bus-card-badge-trip`) dengan styling murni tipografi berkelas.

### 🔹 1.2 Transformasi Tipografi Murni Kartu KPI (`KPICard.tsx`)
- **Lokasi File:** `src/components/KPICard.tsx`
- **Rincian Implementasi:**
  - Menghapus elemen kontainer badge ikon di sudut kanan atas kartu (`Gauge`, `Users`, `Bus`, `UserCheck`).
  - Menyelaraskan kartu KPI dengan desain dashboard modern Linear/Stripe: judul metrik uppercase berukuran 12px, angka nilai besar dengan font-weight tebal, dan badge delta persentase tren yang tajam.
  - Menghapus import ikon Lucide yang tidak lagi digunakan.

### 🔹 1.3 Eliminasi Visual Noise Grafik Tren TOA (`DailyToaTrendCard.tsx`)
- **Lokasi File:** `src/components/DailyToaTrendCard.tsx`
- **Rincian Implementasi:**
  - Menghapus elemen SVG ikon melayang yang sebelumnya dirender tepat di atas puncak batang bar chart. Nilai puncak kini tampil murni dan terbaca jelas tanpa tertutup grafis.
  - Menghapus ikon `Award`, `Zap`, `TrendingDown` dari 3 kotak ringkasan performa harian (Tertinggi, Terendah, Rata-rata), digantikan dengan dot aksen semantik minimalis.

### 🔹 1.4 Pembersihan Ikon Redundan Header Modal (`UnitDetailModal`, `RouteOperationalReportCard`, `WaReportModal`)
- **Lokasi File:**
  - `src/components/UnitDetailModal.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
  - `src/components/WaReportModal.tsx`
- **Rincian Implementasi:**
  - `UnitDetailModal`: Menghapus ikon `Bus` di samping nomor armada pada header modal, serta menghapus ikon `Navigation`, `Users`, `Repeat` pada kartu Shift 1, Shift 2, dan Total. Menghapus ikon `MessageSquare` pada bagian Catatan Operasional.
  - `RouteOperationalReportCard`: Menghapus ikon `Bus` pada header modal, menghapus ikon `Clock` pada metrik Headway, dan menghapus ikon `AlertTriangle` pada baris Kemacetan.
  - `WaReportModal`: Menghapus ikon `FileText` pada tombol tab pemilih format laporan (Ringkas vs Lengkap).

### 🔹 1.5 Eliminasi Ikon Header Kartu (`ShiftComparisonCard.tsx` & `CompletionStatusCard.tsx`)
- **Lokasi File:** `src/components/ShiftComparisonCard.tsx` & `src/components/CompletionStatusCard.tsx`
- **Rincian Implementasi:**
  - Menghapus ikon `Sun` pada judul perbandingan shift dan ikon `FileText` pada judul status pengisian form laporan.
  - Menstandarkan seluruh header kartu analitik agar seragam, tenang, dan profesional.

---

## 2. BEFORE VS AFTER

| Komponen / Area | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Data Strip Kartu Bus** (`BusCard.tsx`) | `[Nav] 124.5 KM • [Users] 382 Pnp` + emoji `⚠️` mentah yang memakan ~48px ruang horizontal. Teks rawan terpotong/wrapping di layar 360px. | `124.5 KM • 382 Pnp` dalam baris tipografi bersih dengan dot semantik amber. Hemat ruang horizontal dan nyaman dibaca. |
| **Kartu Metrik KPI** (`KPICard.tsx`) | Menampilkan badge lingkaran dengan ikon `Gauge`, `Users`, `Bus` di sudut kanan atas yang redundan dengan teks label. | Murni tipografi modern ala Linear/Stripe. Fokus visual langsung tertuju pada angka capaian dan tren delta. |
| **Grafik Batang Harian** (`DailyToaTrendCard.tsx`) | Ada ikon SVG melayang di atas setiap puncak bar yang menutupi angka metrik. 3 kotak stat memakai ikon `Award`, `Zap`, `TrendingDown`. | Batang grafik bersih tanpa ikon melayang, angka puncak terbaca jelas. Kotak stat ringkas dengan dot aksen semantik. |
| **Header Modal Detail & Laporan** | Header modal penuh ikon repetitif (`Bus TJ-123`, `[Clock] Headway`, `[Alert] Macet`, `[FileText] Format`). | Header modal bersih dan lugas, menampilkan identitas data tanpa ornamen berlebih. |
| **Header Kartu Dashboard** | Kartu perbandingan shift dan status pengisian form memakai ikon `Sun` dan `FileText` dekoratif. | Judul kartu berbobot semi-bold bersih tanpa ikon dekoratif yang mengalihkan perhatian. |

---

## 3. CASE: SKENARIO LAPANGAN RELEVAN

### Skenario Lapangan A: Pemeriksaan Cepat 25 Unit Armada di Bawah Sinar Matahari
- **Kondisi Lapangan:** Petugas pengawas rute memeriksa kelengkapan pengisian ritase dan KM dari 25 bus yang sedang aktif melayani penumpang di koridor utama menggunakan ponsel berlayar 375px di halte outdoor.
- **Sebelum Perbaikan:** Setiap baris kartu bus dipenuhi ikon-ikon kecil (ikon bus, ikon kompas navigasi, ikon orang, ikon panah). Di bawah terik matahari, ikon-ikon ini terlihat seperti bintik-bintik buram dan menyebabkan angka metrik berhimpitan atau turun baris (*wrapping*), memperlambat pembacaan.
- **Setelah Perbaikan:** Kartu bus menyajikan tipografi kontras tinggi yang lapang (`8/8 rit • 124.5 KM • 382 Pnp`). Mata petugas langsung tertuju pada angka metrik yang diinginkan dalam hitungan detik tanpa kelelahan visual (*zero icon fatigue*).

### Skenario Lapangan B: Evaluasi Grafik Tren Harian oleh Manajer Operasional
- **Kondisi Lapangan:** Manajer operasional membuka grafik tren TOA harian pada tanggal sibuk (weekend/libur nasional) untuk melihat fluktuasi penumpang antar hari.
- **Sebelum Perbaikan:** Ikon-ikon mini yang melayang di atas puncak batang grafik bertabrakan dengan label angka ketika dua hari berturut-turut memiliki volume penumpang yang mirip. Kotak ringkasan di bawah grafik penuh dengan ikon dekoratif.
- **Setelah Perbaikan:** Puncak batang grafik menampilkan angka penumpang harian secara murni dan presisi. Tiga kotak ringkasan performa (Tertinggi, Terendah, Rata-rata) tampak profesional dan langsung menyampaikan data esensial.

### Skenario Lapangan C: Generate & Salin Laporan WhatsApp Terburu-buru
- **Kondisi Lapangan:** Petugas patroli harus segera mengirimkan rekap operasional shift ke grup WhatsApp pimpinan sebelum pergantian shift jam 14:00.
- **Sebelum Perbaikan:** Tombol tab modal terisi ikon `FileText` ganda yang tidak memberikan petunjuk visual yang bermakna. Header modal laporan dijejali ikon jam dan segitiga peringatan.
- **Setelah Perbaikan:** Antarmuka modal WhatsApp bersih, fokus pada tombol pill tab teks yang tegas ("Format Ringkas" / "Format Lengkap"), meminimalisir kesalahan klik dan mempercepat pengiriman laporan.
