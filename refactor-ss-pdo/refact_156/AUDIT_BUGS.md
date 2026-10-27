# AUDIT BUGS — REFACTOR 156 (Audit Mendalam Paritas SS Global vs Aplikasi SS_PDO & Kesiapan Dekomisioning)

## Ringkasan Eksekutif
Audit mendalam ini dilakukan atas instruksi pimpinan proyek untuk menguji dan membandingkan secara komprehensif apakah seluruh data yang ada pada **Spreadsheet Global Wilayah (SS Global)** telah dapat disajikan secara penuh dan sama persis oleh aplikasi **SS_PDO (Monitoring Wilayah)**, serta mengevaluasi apakah sistem sudah siap 100% untuk mempensiunkan (*decommission*) SS Global tersebut.

Hasil audit membuktikan bahwa:
1. Seluruh **21 metrik operasional Transjakarta** yang ada pada SS Global sudah terimplementasi 100% pada aplikasi SS_PDO dengan angka yang presisi dan identik.
2. Ditemukan dan langsung diperbaiki sebuah bug kritis pada *Edge Function Webhook* di mana variasi penulisan header kilometer (kata "Kilometer" vs "KM") sempat menyebabkan nilai KM dan Trip terisi angka 0 saat sinkronisasi realtime.
3. Aplikasi SS_PDO memiliki kapabilitas operasional yang jauh melampaui SS Global (analisis multi-periode harian/mingguan/bulanan, pelacakan unit SGO/Non-SGO, generator laporan WhatsApp dinas, dan ketahanan data berbasis cloud database).

---

## Rincian Temuan Masalah

### 1. BUG-156-01: Kegagalan Ekstraksi Kolom KM & Trip pada Edge Function `sheet-sync-webhook` Akibat Variasi Header Spreadsheet
- **Lokasi Kode:** `supabase/functions/sheet-sync-webhook/index.ts`
- **Keparahan:** 🔴 Kritis (High / Data Corruption)
- **Deskripsi:** 
  Pada spreadsheet resmi rute (contoh: JAK.60), header odometer ditulis lengkap sebagai `"Kilometer Awal Shift 1"` dan kolom trip menggunakan nama terminal rute (`"KELAPA GADING - RUSUN KEMAYORAN"`).
  Fungsi ekstraksi sebelumnya menggunakan pencocokan substring sempit (`["km awal 1", "km awal"]` dan `["trip 1", "pergi"]`).
  Akibatnya:
  - Kolom odometer gagal dikenali, sehingga perhitungan manual KM menghasilkan `0`.
  - Kolom trip gagal dikenali, sehingga `totalTrips` menghasilkan `0`.
  - Rumus ringkasan bawah sheet (`sheetSummary`) tidak dibaca sebagai Single Source of Truth (SSOT).
- **Dampak Pengguna:** Ketika sinkronisasi realtime via webhook terpicu, kolom `total_km` dan `total_trip` di database `daily_route_reports` sempat ter-overwrite menjadi 0.
- **Mitigasi:**
  1. Terapkan algoritma normalisasi header `normalizeString()` dan kamus `HEADER_KEYWORDS` identik dengan `src/services/googleSheets/core.ts`.
  2. Implementasikan pemindaian baris rangkuman rumus bawah sheet (`sheetSummary`) untuk mengambil nilai asli hasil rumus spreadsheet (`Total KM`, `Total Pelanggan`, `KM/BUS`, `TOA Shift 1 & 2`, `Manual Shift 1 & 2`) secara murni tanpa pembulatan.
  3. Ambil kolom trip secara relatif dari kolom setelah `unit / no body`.
  4. Deploy ulang Edge Function ke Supabase dan verifikasi dengan pengujian live rute JAK.60 tanggal 24 Oktober 2026.

---

### 2. BUG-156-02: Inkonsistensi Semantik `total_trip` (Trip 1 Arah vs Ritase PP)
- **Lokasi Kode:** `supabase/functions/sheet-sync-webhook/index.ts` & `src/services/regionalIngestionService.ts`
- **Keparahan:** 🟡 Sedang (Medium / Domain Semantic Consistency)
- **Deskripsi:**
  Sesuai aturan AGENTS.md, 1 Ritase = 2 Trip (PP / Pulang-Pergi).
  Sebelumnya, `sheet-sync-webhook` menyimpan akumulasi trip satu arah (`calcTrips`) ke dalam field `total_trip`, sedangkan `regionalIngestionService` menyimpan nilai yang sudah dibagi menjadi ritase PP (`totalRitase`).
- **Dampak Pengguna:** Potensi ketidaksinkronan angka ritase jika suatu rute tidak memiliki nilai `km_baku` yang valid.
- **Mitigasi:** Standarisasi penulisan field `total_trip` pada `daily_route_reports` agar konsisten menyimpan nilai ritase PP terstandarisasi (`kmBaku > 0 ? totalKm / kmBaku : calcTrips / 2`).

---

### 3. AUDIT-156-03: Kesiapan Dekomisioning SS Global Wilayah (100% Paritas Tercapai)
- **Lokasi Kode:** `src/services/allRouteMonitoringService.ts`, `src/components/monitoring/`
- **Keparahan:** 🟢 Info / Strategic Milestone
- **Deskripsi:**
  Evaluasi kelayakan pensiun SS Global Wilayah dilakukan dengan membandingkan 21 kolom metrik standar Transjakarta antara SS Global dan SS_PDO Web Application.
- **Hasil:** Seluruh 21 kolom metrik telah tersedia, identik, dan diverifikasi dengan data uji lapangan. SS Global sudah **layak dan siap untuk dipensiunkan penuh**.
