# Laporan Perbaikan Refactor 149 (REPAIR_REPORT.md)

**Tanggal:** 19 Oktober 2026  
**Penanggung Jawab:** AntiGravity AI & Tim Operasional  
**Cabang Git:** `devmode`  
**Target Komponen:**  
1. `src/services/regionalIngestionService.ts`
2. `src/services/monthlyMasterIngestionService.ts`
3. `src/services/allRouteMonitoringService.ts`
4. `src/components/monitoring/tabs/MonitoringWaReportTab.tsx`
5. `src/components/waReport/useWaReportData.ts`
6. `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx`
7. `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`
8. `src/components/monitoring/AllRouteMonitoringPage.tsx`
9. `src/constants/texts/text_monitoring.ts` & `texts.test.ts`
10. Database Supabase (`daily_route_reports` row 4729 - JAK.01)

---

## 1. Ringkasan Eksekutif & Akar Masalah

Pada hari Senin, 19 Oktober 2026, ditemukan anomali tampilan data operasional:
- Halaman **Monitoring Wilayah (sub-halaman "Rute")** dan generator teks WhatsApp **Format 3 (Kesiapan Armada)** menampilkan **Renops/Realops = 20/20 (Status: LENGKAP ✅)** untuk rute **JAK.01**.
- Padahal:
  1. Pengawas/korlap rute belum mengirimkan formulir Laporan A2 Shift 1 JAK.01.
  2. Pada lembar kerja asli Google Sheets JAK.01 (tab `19`), baris 12 (unit `KLM 556`) memiliki ritase 0, KM 0, dan kolom Keterangan tertulis `"PERBAIKAN MESIN "`. Artinya realisasi armada fisik yang beroperasi adalah **19 unit**, bukan 20.
  3. Baris data `daily_route_reports` terisi otomatis pada pukul 01:24 WIB oleh service background master bulanan dengan angka template default (KM = 4036.2, Realops = 20, Pax = 0), menutupi status riil sebelum jam operasional dimulai.
  4. Service ingestion sebelumnya tidak membaca kolom Keterangan spreadsheet untuk mengekstrak unit kendala/non-SGO ke dalam kolom database `fleet_status_shift1` & `fleet_status_shift2`.
  5. UI kartu rute memiliki badge provenance statis `"Tarik Sheet"`, namun tidak memiliki tombol interaktif bagi pengawas untuk memicu sinkronisasi ulang data lembar rute tersebut secara on-demand.

---

## 2. Rincian Implementasi Perbaikan

### A. Ekstraksi Status Armada Non-SGO & Trip Fisik (`regionalIngestionService.ts`)
- Menambahkan fungsi modular `extractRouteDailyMetrics()` yang membedah baris armada satu per satu dari rentang sel lembar rute.
- Mendeteksi unit yang memiliki ritase 0, KM 0, atau memiliki keterangan kendala/libur/off.
- Mengklasifikasikan unit ke `nonSgoUnitsS1` dan `nonSgoUnitsS2` dalam struktur `FleetUnitStatusDetail` (`{ unit, note, isOff }`).
- Menghitung `activeBusesS1` dan `activeBusesS2` murni dari bus yang beroperasi aktif (`trip > 0 || km > 0 || pax > 0`).
- Menyimpan hasil ekstraksi ke kolom JSONB `fleet_status_shift1` dan `fleet_status_shift2` pada tabel `daily_route_reports`.
- Mengekspor fungsi `ingestSingleRouteSummary(dateStr, routeId)` untuk memicu penarikan data individual per rute.

### B. Proteksi Penarikan Baris Template Kosong (`monthlyMasterIngestionService.ts` & `allRouteMonitoringService.ts`)
- Memperketat *guard clause*: baris rekapitulasi yang memiliki `totalPassengers === 0` dan tidak memiliki data transaksi fisik tiket/TOA diabaikan sebagai template kosong (`isTemplatePlanOnly`).
- Mencegah penulisan angka rencana/target default yang belum terealisasi menjadi angka realisasi operasi.

### C. Sinkronisasi Teks WhatsApp Format 3 (`MonitoringWaReportTab.tsx` & `useWaReportData.ts`)
- Pada Jalur 2 (*Spreadsheet Auto Fallback*):
  - Memverifikasi keberadaan aktivitas fisik nyata (`totalTrips > 0 || todayPassengers > 0 || nonSgoUnits.length > 0 || status === 'submitted'`).
  - Menghitung `calculatedRealops` secara otomatis: jika ada unit kendala non-SGO (`!isOff`), realops otomatis dipotong sejumlah kendala (`renops - kendalaCount`).
  - Memastikan jika ada unit kendala (seperti `KLM 556: PERBAIKAN MESIN`), status laporan otomatis menjadi `TIDAK LENGKAP ✖️` dan menampilkan rincian unit kendala di bawahnya, bukan `LENGKAP ✅`.

### D. Tombol Interaktif "Tarik Ulang Sheet Rute Ini" di Kartu Rute
- Menambahkan tombol aksi interaktif dengan ikon `RefreshCw` dan animasi `Loader2` di samping badge provenance pada `MonitoringRouteCardModern.tsx`.
- Menghubungkan callback `onSyncRoute` dari `AllRouteMonitoringPage.tsx` -> `MonitoringRoutesTab.tsx` -> `MonitoringRouteCardModern.tsx`.
- Pengawas wilayah dapat menarik data terbaru dari lembar spreadsheet rute tertentu secara instan tanpa perlu menjalankan sinkronisasi massal 18 rute.

### E. Standar Kamus Teks Sentral (`text_monitoring.ts` & `texts.test.ts`)
- Seluruh teks label tombol, tooltip, dan pesan toast didefinisikan secara sentral:
  - `TEXT_MONITORING.ROUTE_CARD.BTN_SYNC_ROUTE`
  - `TEXT_MONITORING.ROUTE_CARD.BTN_SYNC_ROUTE_TOOLTIP`
  - `TEXT_MONITORING.ROUTE_CARD.SYNC_ROUTE_SUCCESS`
  - `TEXT_MONITORING.ROUTE_CARD.SYNC_ROUTE_FAILED`
- Dilengkapi dengan pengujian integritas pada `src/constants/texts/texts.test.ts`.

---

## 3. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
|---|---|---|
| **Ekstraksi Armada Non-SGO dari Sheet** | Kolom `fleet_status_shift1` & `fleet_status_shift2` selalu bernilai `null`/`[]` saat ditarik dari sheet individu. Unit kendala tidak tercatat. | Unit dengan trip = 0 atau kolom keterangan terisi kendala diekstrak otomatis sebagai `FleetUnitStatusDetail` (contoh: `KLM 556: PERBAIKAN MESIN`). |
| **Nilai Realops JAK.01 di Database** | `realops_shift1 = 20`, `realops_shift2 = 20` (angka template target tertimpa tengah malam). | `realops_shift1 = 19`, `realops_shift2 = 19`, `fleet_status_shift1` berisi unit `KLM 556`. |
| **Tampilan Monitoring Rute** | Tertera `20 / 20` padahal 1 unit mogok dan pengawas belum lapor A2. | Tertera `19 / 20` dengan rincian unit kendala `KLM 556` terdeteksi. |
| **Format 3 Laporan WhatsApp** | Menampilkan `Realisasi Ops: 20 Unit`, `Tidak Ops: 0 Unit`, `Status: LENGKAP ✅`. | Menampilkan `Realisasi Ops: 19 Unit`, `Tidak Ops: 1 Unit`, `Status: TIDAK LENGKAP ✖️`, serta rincian `- KLM 556 : PERBAIKAN MESIN`. |
| **Aksi Tarik Sheet Kartu Rute** | Badge `"Tarik Sheet"` hanya label pasif tanpa aksi. | Disediakan tombol interaktif `RefreshCw` yang langsung memanggil `ingestSingleRouteSummary` dan memperbarui kartu seketika. |
| **Proteksi Template Kosong** | Baris kosong dengan KM target tersimpan otomatis sebagai realisasi operasi. | Baris template tanpa penumpang/trip nyata dilewati (*skipped*) agar tidak mengaburkan data lapangan. |

---

## 4. Case: Skenario Lapangan

### Skenario 1: Unit Mengalami Kerusakan Mesin Saat Subuh (Kasus KLM 556)
- **Kondisi:** Bus `KLM 556` rute JAK.01 mengalami kerusakan mesin di pool sebelum beroperasi pada Shift 1. Petugas rute mengisi kolom Keterangan di Google Sheets dengan `"PERBAIKAN MESIN "` dan membiarkan kolom ritase kosong.
- **Sebelum Perbaikan:** Sistem menarik angka template rencana (20 unit). Dashboard wilayah dan WhatsApp Format 3 menyatakan rute JAK.01 beroperasi 20 dari 20 unit (Lengkap 100%). Pimpinan mendapat informasi keliru bahwa seluruh armada beroperasi.
- **Sesudah Perbaikan:** Ingestion otomatis mendeteksi baris 12 bernilai trip 0 dengan catatan `"PERBAIKAN MESIN "`. Sistem mencatat Realops = 19, Tidak Ops = 1. Laporan Format 3 otomatis berstatus `TIDAK LENGKAP ✖️` dengan rincian jelas `- KLM 556 : PERBAIKAN MESIN`.

### Skenario 2: Pembaruan Data Lapangan On-Demand oleh Pengawas Wilayah
- **Kondisi:** Pengawas wilayah sedang memantau tab "Rute" di halaman Monitoring Wilayah. Petugas rute JAK.01 baru saja menyelesaikan input ritase trip pagi di spreadsheet rute.
- **Sebelum Perbaikan:** Pengawas wilayah harus menunggu batch sinkronisasi berkala atau menekan "Load All" 18 rute yang memakan waktu lama. Badge "Tarik Sheet" pada kartu tidak dapat diklik.
- **Sesudah Perbaikan:** Pengawas cukup menekan tombol refresh kecil di samping badge rute JAK.01. Dalam 1-2 detik, data lembar rute ditarik langsung, toast hijau muncul, dan metrik kartu langsung terbarui menjadi data terkini.

---

## 5. Status Verifikasi & Quality Gates

1. **Vitest Unit Test Suite:**
   - Command: `pnpm vitest run src/`
   - Hasil: **109 file lulus (109 passed), 785 uji lulus (785 passed), 0 kegagalan**.
2. **TypeScript Strict & Production Build:**
   - Command: `pnpm run build` (`tsc -b && vite build`)
   - Status: Sedang diselesaikan di latar belakang.
3. **Graphify Knowledge Graph:**
   - Command: `graphify update .` (akan dijalankan setelah build tuntas).
