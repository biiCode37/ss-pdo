# Audit Temuan Refact 40: Dekomposisi God File `AllRouteMonitoringPage.tsx` (~1.157 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap god file `src/components/AllRouteMonitoringPage.tsx` yang memuat logika presentasional masif, helpers format tanggal/angka, visualisasi KPI wilayah, filter tab pengawas, dan kartu rute terintegrasi dalam satu file monolitik.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF40-ARCH-001: God File `src/components/AllRouteMonitoringPage.tsx` (1.157 baris)

- **Lokasi Kode**: `src/components/AllRouteMonitoringPage.tsx` (1.157 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu komponen bertanggung jawab atas 6 domain tanggung jawab sekaligus:
  1. Helper utilitas parsing dan format lokal (`formatIndonesianDateLabel`, `formatNumber`, `formatDecimal`).
  2. Definisi tab pengawas dan predikat pencarian substring nama (`SUPERVISOR_TABS`, `matchesSupervisorTab`).
  3. Header sticky navigasi tanggal dan kontrol aksi laporan WA (`MonitoringHeader`).
  4. Banner progress kesiapan 18 rute beserta bar legend breakdown status (`MonitoringReadinessBanner`).
  5. Empat kartu KPI agregasi wilayah operasional (Armada, Penumpang, KM Tempuh, Distribusi Shift) (`MonitoringKpiCards`).
  6. Filter tab segmented korlap (`MonitoringSupervisorTabs`).
  7. Komponen kartu rute regional mandiri (`RouteCardItem`) dengan status badges, 3-column metric box, peringatan macet, kendala, headway, dan aksi verifikasi laporan pengawas.
  8. State skeleton loader dan error retry dialog (`MonitoringStates`).
- **Dampak User & Pengembang**:
  - Peninjauan perubahan kode (*code review*) dan penambahan metrik regional baru menjadi sangat rentan merusak komponen kartu rute.
  - Pengujian visual (light & dark mode) dan responsivitas mobile sulit diisolasi per komponen.
- **Mitigasi**:
  Dekomposisi menjadi 7 modul domain terisolasi di folder `src/components/monitoring/`:
  - `monitoringUtils.ts`: Kamus tab pengawas, fungsi filter, dan helper pemformatan lokal.
  - `MonitoringHeader.tsx`: Header sticky, date step button, input tanggal, tombol refresh, dan trigger modal laporan WA.
  - `MonitoringReadinessBanner.tsx`: Indikator persentase kelengkapan laporan wilayah.
  - `MonitoringKpiCards.tsx`: 4 kartu metrik KPI agregasi wilayah.
  - `MonitoringSupervisorTabs.tsx`: Baris tab filter korlap yang dapat digeser (*horizontal scroll*).
  - `MonitoringRouteCard.tsx`: Komponen kartu rute regional dengan badges dan tombol verifikasi.
  - `MonitoringStates.tsx`: Skeleton loading & error handling view.
  `AllRouteMonitoringPage.tsx` direfaktor menjadi orchestrator ramping (~140 baris) dengan re-export publik lengkap untuk mempertahankan integritas *Zero Breaking Change*.
