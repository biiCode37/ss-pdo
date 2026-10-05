# Repair Report Refact 40: Modularisasi & Dekomposisi Halaman Monitoring Wilayah 18 Rute

Dokumen ini memuat laporan teknis implementasi dekomposisi god file `AllRouteMonitoringPage.tsx` menjadi modul-modul terisolasi di `src/components/monitoring/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/monitoring/`)
1. **`monitoringUtils.ts`**:
   - Mengekstrak konstanta `SUPERVISOR_TABS` (ALL, Ranto, Abdul, Moamar).
   - Mengekstrak fungsi pencocokan substring nama pengawas `matchesSupervisorTab()`.
   - Mengekstrak fungsi format lokal Indonesia: `formatIndonesianDateLabel()`, `formatNumber()`, dan `formatDecimal()`.
2. **`MonitoringHeader.tsx`**:
   - Mengisolasi sticky top header, tombol kembali ke rute tunggal, kontrol navigasi tanggal harian (tombol `-1/+1` hari dan date picker native), tombol refresh sinkronisasi, dan tombol pemicu generator laporan WhatsApp.
3. **`MonitoringReadinessBanner.tsx`**:
   - Mengisolasi perhitungan persentase kelengkapan laporan wilayah (X / Y Rute Siap), visualisasi progress bar gradien fluid, serta status breakdown legend (Verified, Submitted, Draft, Empty).
4. **`MonitoringKpiCards.tsx`**:
   - Mengisolasi grid 4 kartu metrik regional:
     - Armada Wilayah (Realops / Renops, persentase ketercapaian, breakdown S1/S2).
     - Total Pelanggan (Agregasi penumpang hari ini, breakdown S1/S2).
     - Total KM Tempuh (Total kilometer seluruh armada, rata-rata KM per bus).
     - Distribusi Shift (Proporsi penumpang Shift 1 vs Shift 2).
5. **`MonitoringSupervisorTabs.tsx`**:
   - Mengisolasi tab horizontal filter korlap dengan indikator jumlah rute dinamis per pengawas.
6. **`MonitoringRouteCard.tsx`**:
   - Mengisolasi komponen kartu rute regional mandiri (`RouteCardItem`), badge status laporan, 3-column metric box, tag peringatan titik macet & kendala operasional, informasi headway, serta tombol verifikasi laporan.
7. **`MonitoringStates.tsx`**:
   - Mengisolasi tampilan animasi skeleton loading berdenyut (*pulse animation*) dan kotak penanganan error dengan tombol coba lagi (*retry*).
8. **`AllRouteMonitoringPage.tsx` (Root Orchestrator)**:
   - Berkurang drastis dari 1.157 baris menjadi **142 baris**.
   - Re-export `SUPERVISOR_TABS` dan `matchesSupervisorTab` tetap dipertahankan untuk menjamin kompatibilitas 100% (*Zero Breaking Change*).

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 40 (Before) | Sesudah Refactor 40 (After) |
| :--- | :--- | :--- |
| **Ukuran `AllRouteMonitoringPage.tsx`** | 1.157 baris (God File monolitik) | **142 baris** (Penurunan -1.015 baris kode) |
| **Struktur Subkomponen** | Semua markup dan helper bercampur aduk dalam 1 file | 7 file modular terdedikasi di `src/components/monitoring/` |
| **Pemisahan Logika & UI** | Formatters, cards, progress bar, tabs menyatu | Single Responsibility Principle murni per komponen |
| **Integritas Unit Test** | - | **5/5 tests `AllRouteMonitoringPage.test.tsx` lulus 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.14s)** |
| **Knowledge Graph** | - | Graphify 3.165 nodes, 4.194 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Wilayah Memeriksa Kelengkapan 18 Rute Operasional
- **Kondisi**: Kepala wilayah operasional membuka halaman monitoring pada pukul 14:00 WIB untuk melihat rute mana saja yang laporannya sudah dikirimkan oleh pengawas koridor dan siap diverifikasi.
- **Before**: Rendering pohon DOM raksasa dalam 1 file 1.157 baris dapat membebani peranti seluler saat pengguna men-scroll daftar 18 kartu rute.
- **After**: Subkomponen `MonitoringReadinessBanner` dan `MonitoringRouteCard` kini terisolasi rapi dengan memoization React yang efisien. Aksi verifikasi satu rute (`handleVerifyRoute`) tidak memicu re-render yang tidak perlu pada seluruh pohon visual header.

### Case 2: Filter Rute Berdasarkan Korlap (Ranto / Abdul / Moamar)
- **Kondisi**: Pengawas Abdul Manan ingin memfilter tampilan agar hanya rute binaannya yang muncul di layar.
- **Before**: Fungsi `matchesSupervisorTab` dan `SUPERVISOR_TABS` tertanam di dalam god file bersama ratusan baris SVG icon dan styling inline.
- **After**: Tab korlap diisolasi di `MonitoringSupervisorTabs.tsx` dan utilitas pencocokan nama di `monitoringUtils.ts`. Filter berjalan sangat cepat dan mudah diuji secara mandiri dalam unit test.
