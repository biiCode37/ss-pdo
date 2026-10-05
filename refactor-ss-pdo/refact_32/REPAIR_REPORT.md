# REPAIR REPORT: RESTORASI IKON VISUAL & AFEKSI IDENTITAS ARMADA (REFACTOR 32)

Laporan ini merangkum proses pengembalian (*rollback/revert*) pemangkasan ikon visual dari Refactor 31 kembali ke kondisi stabil Refactor 30, sesuai preferensi visual dan kenyamanan penggunaan antarmuka di lapangan.

---

## 1. DAFTAR PERUBAHAN & IMPLEMENTASI

### 🔹 1.1 Restorasi Ikon pada Kartu Armada (`BusCard.tsx` & `UnitCard.tsx`)
- **Lokasi File:** `src/components/BusCard.tsx` & `src/components/UnitCard.tsx`
- **Rincian Implementasi:**
  - Mengembalikan ikon `Navigation` pada indikator KM, `Users` pada jumlah penumpang, `Repeat` pada capaian ritase, dan `ArrowRightLeft` pada kontrol filter modal trip.
  - Mengembalikan ikon `Bus` di samping penomoran unit armada pada `UnitCard`.
  - Mengembalikan indikator visual peringatan defisit ritase dengan emoji `⚠️`.

### 🔹 1.2 Restorasi Badge Ikon pada Header Kartu KPI (`KPICard.tsx`)
- **Lokasi File:** `src/components/KPICard.tsx`
- **Rincian Implementasi:**
  - Mengembalikan badge kontainer ikon di sudut kanan atas kartu KPI (`Gauge`, `Users`, `Bus`, `UserCheck`).

### 🔹 1.3 Restorasi Ikon Grafik & Kotak Ringkasan (`DailyToaTrendCard.tsx`)
- **Lokasi File:** `src/components/DailyToaTrendCard.tsx`
- **Rincian Implementasi:**
  - Mengembalikan ikon SVG melayang di puncak bar chart dan ikon `Award`, `Zap`, `TrendingDown` pada 3 kotak stat ringkasan harian.

### 🔹 1.4 Restorasi Ikon Modal Detail & Laporan Operasional
- **Lokasi File:**
  - `src/components/UnitDetailModal.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
  - `src/components/WaReportModal.tsx`
  - `src/components/ShiftComparisonCard.tsx`
  - `src/components/CompletionStatusCard.tsx`
- **Rincian Implementasi:**
  - Merestorasi seluruh ikon pendukung pada modal header, kartu shift, section catatan operasional, dan pemilih format WhatsApp.

---

## 2. BEFORE VS AFTER

| Komponen / Fitur | Refactor 31 (Tipografi Murni) | Refactor 32 (Ikon Terestorasi) |
| :--- | :--- | :--- |
| **Kartu Bus & Unit** | Angka strip tanpa ikon (`124.5 KM • 382 Pnp`). Hemat ruang namun minim visual anchor. | Ikon `Navigation`, `Users`, `Repeat`, dan `Bus` aktif kembali sebagai penanda visual instan. |
| **Kartu KPI** | Murni tipografi Linear/Stripe tanpa badge ikon kanan atas. | Badge lingkaran ikon kanan atas (`Gauge`, `Users`, dll.) tampil kembali. |
| **Grafik Bar Harian** | Puncak bar murni teks angka tanpa ornamen grafis. | Ikon SVG melayang di puncak bar chart dan ikon stat boxes aktif kembali. |
| **Header Modal & Kartu** | Header polos tanpa ikon dekoratif. | Ikon `Bus`, `Sun`, `FileText`, dan `Clock` terpasang kembali. |

---

## 3. CASE: SKENARIO LAPANGAN RELEVAN

### Skenario Lapangan: Pengenalan Cepat Metrik oleh Petugas Pengawas
- **Kondisi Lapangan:** Petugas di halte sibuk memeriksa pergantian shift bus di bawah sinar matahari dan membutuhkan navigasi visual instan tanpa harus membaca kata per kata.
- **Dampak Restorasi:** Kembalinya ikon `Navigation` (biru/cyan) dan `Users` (abu-abu/putih) memudahkan otak memproses kategori data secara visual dalam hitungan milidetik (*glanceability*), sesuai dengan kebiasaan interaksi pengguna yang sudah terbentuk sebelumnya.
