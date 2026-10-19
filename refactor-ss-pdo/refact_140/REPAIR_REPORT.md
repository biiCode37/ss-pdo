# REPAIR REPORT: Perombakan Konsep UI Minimalis & Dashboard KPI Eksekutif (Fase 2)

## Informasi Refactor
- **ID Refactor:** `refact_140`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Terkait Temuan:** BUG-140-01, BUG-140-02, BUG-140-03

---

## Implementasi Perbaikan

### 1. Modernisasi Kartu Indikator Utama (`KPICard`)
- **Struktur Simetris 2x2 (*Executive 4-Grid*):**
  - Menggantikan tata letak 2 box + 2 list row lama dengan grid simetris 2x2 (`.kpi-modern-grid`).
  - 4 metrik eksekutif utama:
    1. **Total KM Tempuh:** Format desimal presisi murni dari SSOT, aksen Emerald (`var(--success-color)`).
    2. **Total Pelanggan TOA:** Format ribuan bulat, aksen Teal/Emerald (`var(--accent-color)`).
    3. **Rata-Rata KM per Bus:** Rasio jarak tempuh armada aktif, aksen Sky Blue (`#38bdf8`).
    4. **Pelanggan per KM:** Rasio kepadatan produktivitas penumpang per kilometer, aksen Violet/Purple (`#a78bfa`).
- **Preservasi SSOT Angka Desimal Murni:**
  - Tetap menggunakan `safeFormatNumber(val, 0, { maximumFractionDigits: 10 })` tanpa pembulatan sepihak untuk menjamin kepatuhan absolut pada SSOT Google Sheets.
- **Micro-Typography & Tabular Numerals:**
  - Setiap cell dilengkapi label mikro berbobot tinggi (9.5px, uppercase, letter-spacing 0.04em) dan angka `tabular-nums` agar tidak ada layout shifting.

---

### 2. Peningkatan Visualisasi Komparasi Shift (`ShiftComparisonCard`)
- **Visual Distribution Bar (Rasio Penumpang Shift 1 vs Shift 2):**
  - Menambahkan bar proporsi visual ramping di bagian atas kartu yang merefleksikan perbandingan volume penumpang riil antara Shift 1 (Sun - Oranye hangat) dan Shift 2 (Moon - Lavender/Ungu).
  - Dilengkapi persentase kontribusi masing-masing shift secara dinamis.
- **Tata Letak Tabular Rapi:**
  - Menata rincian TOA, Tiket Manual, dan Total dalam grid bersih dengan font angka berimbang dan pemisah border subtil.

---

### 3. Kerapian Kartu Catatan Armada (`CompletionStatusCard`)
- **Visual List Refinement:**
  - Mengganti styling tombol unit dengan badge elegan yang serasi dengan tema aplikasi.
  - Interaksi tap unit dengan animasi spring iOS responsif.

---

## Perbandingan Before vs After

| Parameter | Sebelum Refactor (Before) | Sesudah Refactor (After) |
|---|---|---|
| **Layout KPI Analytics** | Kotak bertingkat terbelah (2 box atas + 2 baris list bawah) | 4-Grid simetris (2x2) eksekutif yang rapi dan ringkas |
| **Glanceability Metrik** | Sulit dibaca serentak karena ukuran font dan format tidak seimbang | 4 metrik terpapar sejajar dengan hierarki label mikro & angka tegas |
| **Komparasi Shift** | Angka mentah terpisah tanpa visualisasi perbandingan | Dilengkapi visual distribution ratio bar (proporsi %) Shift 1 vs Shift 2 |
| **Kepatuhan SSOT** | Angka desimal presisi murni dipertahankan | Angka desimal presisi murni tetap dipertahankan hingga 10 digit desimal |

---

## Case: Skenario Lapangan

### Skenario 1: Evaluasi Kilat Performa Rute oleh Koordinator Wilayah
- **Sebelum Perbaikan:** Koordinator harus membaca 2 kotak atas lalu menggulir ke 2 baris teks bawah untuk melihat rasio efisiensi KM/Bus dan Penumpang/KM.
- **Sesudah Perbaikan:** Keempat metrik inti terpampang simetris dalam satu pandangan mata tanpa perlu scrolling, dengan aksen warna semantik yang kontras di kondisi lapangan terik maupun malam.

### Skenario 2: Analisis Beban Jam Sibuk Shift 1 vs Shift 2
- **Sebelum Perbaikan:** Petugas harus membandingkan angka ribuan total penumpang Shift 1 dan Shift 2 secara manual dalam kepala.
- **Sesudah Perbaikan:** Bilah rasio visual langsung menunjukkan persentase distribusi penumpang (misal 58% Shift 1 vs 42% Shift 2), memudahkan evaluasi penempatan armada tambahan.
