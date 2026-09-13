# Audit Temuan Refact 50: Dekomposisi Generator Laporan WhatsApp `WaReportModal.tsx` (~621 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap komponen modal generator laporan WhatsApp `src/components/WaReportModal.tsx` yang memuat logika filter rute korlap, kalkulasi subtotal regional/korlap, deteksi rute belum konfirmasi armada (*Format 3 blocking rules*), generator pesan teks WhatsApp Transjakarta, dan antarmuka pratinjau pesan.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF50-ARCH-001: God File `src/components/WaReportModal.tsx` (621 baris)

- **Lokasi Kode**: `src/components/WaReportModal.tsx` (621 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Single Responsibility Principle)
- **Deskripsi Masalah**:
  Satu berkas modal menangani percampuran tanggung jawab:
  1. Pengelolaan state pemilihan format laporan (`format1`, `format2`, `format3`), filter shift (Shift 1 Pagi / Shift 2 Siang), filter lingkup korlap (Semua, Ranto, Abdul, Moamar), dan status salin clipboard.
  2. Logika filtering rute regional berdasarkan nama pengawas operasional (`filteredRoutes`).
  3. Logika evaluasi status konfirmasi armada 18 rute wilayah untuk memblokir Format 3 jika ada rute yang belum selesai konfirmasi armada (`unconfirmedRoutes`, `isFormat3Blocked`).
  4. Transformasi data rute mentah menjadi struktur `RouteWaData[]` dan kalkulasi subtotal penumpang regional/korlap (`RegionTotals`).
  5. Pembangkitan teks laporan WhatsApp melalui fungsi generator terpisah (`generateWaReportFormat1`, `generateWaReportFormat2`, `generateWaReportFormat3`).
  6. Presentasi visual: tab grid 3-kolom, sub-selector shift, chips filter korlap, banner rute unsubmitted, alert blocking rute belum konfirmasi dengan daftar badges rute, kotak textarea monospace, serta tombol aksi Salin Teks dan Buka WhatsApp.
- **Dampak User & Pengembang**:
  - Berkas panjang menyulitkan modifikasi format laporan WhatsApp atau penyesuaian aturan blocking.
  - Perubahan tampilan tab atau tata letak mobile berisiko memengaruhi logika kalkulasi subtotal atau validasi konfirmasi rute.
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/waReport/`:
  - `types.ts`: Definisi interface `WaReportModalProps`, `FormatType`, dan `SupervisorFilter`.
  - `useWaReportData.ts`: Hook untuk state dan logika filter korlap, deteksi blocking rute belum konfirmasi, kalkulasi subtotal penumpang, dan generator teks pesan.
  - `WaReportHeader.tsx`: Komponen header modal dengan icon `Share2`, judul, subtitle, dan tombol dismiss.
  - `WaReportFormatTabs.tsx`: Komponen pemilih format 1/2/3, sub-selector shift adaptif, chips filter korlap, banner unsubmitted, dan panel blocking alert rute belum konfirmasi.
  - `WaReportPreview.tsx`: Komponen tampilan pratinjau teks pesan monospace serta tombol interaktif Salin Teks dan Buka WhatsApp.
  - `index.ts`: Barrel export terpusat.
  - `WaReportModal.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~98 baris** (penurunan -523 baris kode / 84%) dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
