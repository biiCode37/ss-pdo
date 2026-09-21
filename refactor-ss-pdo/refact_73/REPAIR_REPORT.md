# 🛠️ Repair Report: Refactor 73 — Direct Ingestion 18 Rute Individu ke Supabase & Eliminasi Ketergantungan SS Global

Dokumen ini merangkum perbaikan teknis, Before vs After, serta skenario pengujian lapangan untuk Refactor 73.

---

## 1. Rincian Implementasi

### A. Engine Penarikan Rute Individu (`src/services/regionalIngestionService.ts`)
- **Penarikan 1-Klik Direct:** Mengambil URL spreadsheet dari tabel `route_sheets` untuk setiap rute master, lalu membaca baris rekapitulasi pada lembar tanggal aktif secara langsung.
- **Smart Skip:** Memeriksa status laporan harian di Supabase. Rute yang sudah berstatus `submitted` atau `verified` dilewati secara otomatis (skip), memangkas panggilan API hingga 100% jika seluruh rute sudah diisi via aplikasi.
- **Controlled Concurrency Batching:** Mengeksekusi penarikan dalam batch per 4 rute dengan jeda 250ms antar-batch untuk menghindari lonjakan kuota batas Google Sheets API (300 read/menit).
- **Upsert Otomatis Supabase:** Data hasil penarikan di-upsert ke `public.daily_route_reports` dengan penanda `data_source: 'sheet_ingestion'`.

### B. Pemetaan 21 Kolom & Komputasi Murni Rasio (`src/services/allRouteMonitoringService.ts`)
- **Preservasi 21 Metrik Transjakarta:**
  - Metrik Primer: `renops`, `realops`, `toa_shift1`, `manual_shift1`, `toa_shift2`, `manual_shift2`, `total_passengers`, `total_km`, `total_trip`.
  - Rasio Murni:
    - `targetPercentage`: `(todayPassengers / targetHk) * 100`
    - `targetPassengersPerKm`: `1.5`
    - `passengersPerKm`: `todayPassengers / totalKm`
    - `passengersPerKmPercentage`: `(passengersPerKm / 1.5) * 100`
    - `tripsPerBus`: `totalTrips / totalRealops`
    - `passengersPerBus`: `todayPassengers / totalRealops`
- **Pelabelan Provenance:** Memetakan status `dataSource` (`'app_input' | 'sheet_ingestion' | 'empty'`) serta menghitung agregat wilayah (`appInputCount`, `sheetSyncCount`, `emptySourceCount`).

### C. Pembaruan Antarmuka Pengguna & Komponen Mobile-First
- **Header Action Button (`MonitoringHeader.tsx`):**
  - Menggantikan tombol modal lama dengan tombol direct action `[🔄 Tarik 18 Rute]`.
  - Tombol disabled selama proses berjalan tanpa timer cooldown buatan; spinner aktif berputar dan teks berubah menjadi `"Menyinkronkan..."`.
- **Data Provenance Badges (`MonitoringRouteCard.tsx` & `MonitoringRouteCardModern.tsx`):**
  - Menampilkan badge pill status asal data: `Input App` (hijau emerald) dan `Tarik Sheet` (biru langit).
- **Kesiapan Wilayah Terperinci (`MonitoringReadinessBanner.tsx`):**
  - Menampilkan ringkasan kesiapan cerdas: `${filled}/${total} Rute Terisi • ${app} Input App • ${sheet} Tarik Sheet`.
- **Halaman Utama Monitoring (`AllRouteMonitoringPage.tsx`):**
  - Terhubung langsung ke `ingestRegionalRouteSummaries()` dengan notifikasi toast informatif.

### D. Kamus Teks Sentral (`src/constants/texts/text_monitoring.ts`)
- Seluruh teks antarmuka (label tombol, tooltip, toast keberhasilan, peringatan parsial, badge asal data) didefinisikan secara tersentralisasi tanpa string hardcoded di komponen.

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Sumber Data 18 Rute** | Spreadsheet Global Wilayah (tidak resmi, rentan rumus rusak) | Google Sheet Rute Individu via `route_sheets` (Ground Truth) |
| **Alur Sinkronisasi** | Modal popup SweetAlert2 meminta konfirmasi URL & nama sheet | Tombol 1-klik `[🔄 Tarik 18 Rute]` di Header tanpa dialog popup |
| **Proteksi Kuota API** | Menarik seluruh rute tanpa filter | *Smart Skip* (melewati rute yang sudah `submitted`/`verified`) |
| **Kontrol Konkurensi** | Request tak terkendali berpotensi kena rate limit 429 | Batching per 4 rute dengan delay 250ms |
| **Transparansi Asal Data** | Tidak diketahui apakah data dari app atau dari sheet | Badge pill jelas: `Input App` vs `Tarik Sheet` |
| **Kalkulasi Metrik** | Hanya metrik dasar | 21 Kolom lengkap termasuk rasio Pnp/KM, Ritase/Bus, % Capaian |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Lapangan Sudah Mengisi di Aplikasi Web
- **Kondisi:** Petugas rute JAK 01 dan JAK 15 telah menginput data shift 1 & 2 via aplikasi web SS_PDO dan menekan *Submit Laporan*.
- **Aksi:** Korlap wilayah utara membuka halaman Monitoring Wilayah dan menekan tombol `[🔄 Tarik 18 Rute]`.
- **Hasil:** Engine *Smart Skip* mendeteksi status JAK 01 dan JAK 15 sudah `submitted`. Kedua rute dilewati tanpa memanggil Google Sheets API. Hanya 16 rute lainnya yang ditarik dari spreadsheet masing-masing. Notifikasi toast menampilkan: *"Berhasil menyinkronkan: 2 rute dari App, 16 rute dari Sheet."*

### Skenario 2: Pemantauan Real-Time Pimpinan & Korlap
- **Kondisi:** Pimpinan divisi operasi ingin melihat apakah data yang tersaji berasal dari input langsung petugas atau tarikan spreadsheet.
- **Aksi:** Pimpinan melihat daftar kartu rute di tab *Rute*.
- **Hasil:** Setiap kartu rute menampilkan lencana visual yang jelas: badge `Input App` menandakan staf disiplin mengisi aplikasi, sedangkan badge `Tarik Sheet` menandakan data ditarik dari Google Sheet rute. Banner atas merangkum: *"18/18 Rute Terisi • 12 Input App • 6 Tarik Sheet"*.

---

## 4. Status Quality Gates

- **Unit Testing:** `pnpm vitest run src/` ➔ **72 test files passed, 511 tests passed (100%)**.
- **TypeScript & Build:** `pnpm run build` ➔ **0 errors, bundle berhasil digenerate dalam 2.61s**.
- **Knowledge Graph:** `graphify update .` ➔ **4.246 nodes, 5.478 edges terbarui**.
- **Branch:** Seluruh pekerjaan terisolasi pada branch `devmode`.
