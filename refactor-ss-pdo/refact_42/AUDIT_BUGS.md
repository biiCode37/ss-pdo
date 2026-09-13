# Audit Temuan Refact 42: Dekomposisi God File `RouteOperationalReportCard.tsx` (~979 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap god file `src/components/RouteOperationalReportCard.tsx` yang memuat logika formulir pelaporan operasional pengawas (Renops/Realops Shift 1 & 2, headway tercepat/terlama, manajemen chips titik kemacetan, catatan kendala operasional, integrasi modal sheet bottom-up, dan submit handler) dalam satu file monolitik.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF42-ARCH-001: God File `src/components/RouteOperationalReportCard.tsx` (979 baris)

- **Lokasi Kode**: `src/components/RouteOperationalReportCard.tsx` (979 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu file komponen menangani 6 domain tanggung jawab sekaligus:
  1. Presentasi badge status laporan operasional (`draft`, `submitted`, `verified`).
  2. Input perhitungan armada per shift (`renopsS1`, `realopsS1`, `renopsS2`, `realopsS2`).
  3. Input data headway bus menit tercepat dan menit terlama (`headwayFastest`, `headwaySlowest`).
  4. Manajemen pilihan chips titik kemacetan jalur beserta field penambahan custom spot baru via Enter/Plus button.
  5. Textarea catatan kendala operasional harian pengawas dan tombol kirim laporan dengan spinner loading.
  6. Kontainer modal bottom-up berbasis React Portal dengan scroll-locking dan integrasi hook navigasi `useMobileBackHandler`.
  7. Mode tampilan inline card dengan mekanisme buka-tutup accordion header.
- **Dampak User & Pengembang**:
  - Penyesuaian skema laporan operasional (seperti penambahan field shift atau validasi angka) sangat rawan memicu regresi pada layout modal atau input keyboard ponsel.
  - Berkas kode yang mendekati 1.000 baris menyulitkan navigasi pengembang dan memperberat pemeliharaan jangka panjang.
- **Mitigasi**:
  Dekomposisi menjadi 7 submodul modular di folder `src/components/pdoReport/`:
  - `ReportStatusBadge.tsx`: Visualisasi badge status laporan operasional (`draft`, `submitted`, `verified`).
  - `ReportArmadaSection.tsx`: Form input Renops & Realops Shift 1 dan Shift 2 dengan selector ID yang stabil.
  - `ReportHeadwaySection.tsx`: Form input headway tercepat dan terlama dalam menit.
  - `ReportTrafficJamsSection.tsx`: Selector chips titik kemacetan dan input custom spot.
  - `ReportIssuesSection.tsx`: Textarea kendala operasional dan tombol submit kirim laporan.
  - `ReportModalLayout.tsx`: Bottom sheet modal dengan React Portal, background overlay, scroll-lock, dan gesture back hardware.
  - `ReportAccordionHeader.tsx`: Header accordion untuk mode inline card.
  - `index.ts`: Barrel export terpusat.
  - `RouteOperationalReportCard.tsx`: Komponen orkestrator ramping (~210 baris) dengan mempertahankan kompatibilitas 100% (*Zero Breaking Change*).
