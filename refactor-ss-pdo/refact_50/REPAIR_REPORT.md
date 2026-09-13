# Repair Report Refact 50: Modularisasi & Dekomposisi Generator Laporan WhatsApp (WaReportModal)

Dokumen ini memuat laporan teknis implementasi dekomposisi `WaReportModal.tsx` menjadi submodul-submodul terisolasi di `src/components/waReport/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/waReport/`)
1. **`types.ts`**:
   - Mendefinisikan kontrak interface `WaReportModalProps`, `FormatType`, dan `SupervisorFilter`.
2. **`useWaReportData.ts`**:
   - Mengelola state pemilihan format laporan, shift aktif, filter korlap, dan status salin pesan.
   - Mengisolasi filtering rute korlap (`filteredRoutes`).
   - Mengevaluasi status kelengkapan konfirmasi armada 18 rute wilayah (`unconfirmedRoutes`, `isFormat3Blocked`).
   - Memetakan data operasional ke format `RouteWaData[]`.
   - Menghitung kalkulasi subtotal penumpang regional maupun korlap (`RegionTotals`).
   - Memicu generator laporan WhatsApp teks (`generateWaReportFormat1`, `generateWaReportFormat2`, `generateWaReportFormat3`).
   - Mengelola aksi salin teks clipboard dan tombol pembuka WhatsApp (`openWhatsApp`).
3. **`WaReportHeader.tsx`**:
   - Menampilkan icon brand `Share2`, judul modal, subtitle modal, dan tombol silang penutup modal.
4. **`WaReportFormatTabs.tsx`**:
   - Grid 3-kolom pemilih format laporan (Format 1: Pelanggan, Format 2: Rincian Shift, Format 3: Status Armada).
   - Sub-selector shift (☀️ Shift 1 / 🌙 Shift 2) adaptif dengan warna semantik shift.
   - Chips horizontal filter lingkup korlap (Semua, Ranto, Abdul, Moamar) untuk Format 1 & 2.
   - Banner peringatan rute yang belum mengirimkan laporan operasional harian.
   - Panel peringatan pemblokiran Format 3 jika ada rute yang belum konfirmasi armada lengkap dengan badges kode rute.
5. **`WaReportPreview.tsx`**:
   - Kontainer kotak monospace pratinjau teks pesan dengan format baris pre-wrap.
   - Tombol aksi interaktif Salin Teks dengan feedback icon centang hijau.
   - Tombol aksi utama Buka WhatsApp dengan proteksi pemblokiran jika Format 3 belum memenuhi syarat konfirmasi.
6. **`WaReportModal.tsx` (Root Orchestrator)**:
   - Berkurang dari 621 baris menjadi **~98 baris** (penurunan -523 baris kode / 84%).
   - Berfungsi sebagai orchestrator bersih yang merakit hooks dan subkomponen.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 50 (Before) | Sesudah Refactor 50 (After) |
| :--- | :--- | :--- |
| **Ukuran `WaReportModal.tsx`** | 621 baris (Monolitik masif) | **~98 baris** (Penurunan -523 baris kode / 84%) |
| **Struktur Subkomponen** | Filter, totals, generator, tabs, preview menyatu | 5 file terdedikasi di `src/components/waReport/` |
| **Pemisahan Logika & UI** | Logika kalkulasi & filter bercampur dengan render UI | `useWaReportData` terisolasi murni |
| **Kamus Teks Sentral** | - | 100% konsisten menggunakan `TEXT_WA_REPORT` |
| **Integritas Unit Test** | - | **4/4 tests `WaReportModal.test.tsx` passed**, **44/44 test files passed (340 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.11s)** |
| **Knowledge Graph** | - | Graphify 3.459 nodes, 4.429 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Wilayah Membuka Generator Laporan WhatsApp Format 3 di Sore Hari
- **Kondisi**: Pengawas membuka modal pada pukul 16:30 untuk mengecek kesiapan armada Shift 2 (Siang).
- **Before**: Logika inisialisasi default shift berdasarkan jam sistem menyatu dengan JSX rendering modal.
- **After**: `useWaReportData` secara otomatis memilih Shift 2 sesuai waktu operasional berjalan (`new Date().getHours() >= 14 ? 2 : 1`), dan langsung melakukan pengecekan status konfirmasi seluruh rute wilayah untuk shift 2.

### Case 2: Upaya Mengirim Format 3 Ketika Ada Rute Belum Konfirmasi Armada
- **Kondisi**: Petugas operasional mencoba menyalin atau membuka WhatsApp Format 3 padahal ada 2 rute (misal: JAK.15 dan JAK.115) yang belum melakukan konfirmasi armada shift terkait.
- **Before**: Logika penonaktifan tombol dan daftar rute unconfirmed bercampur dengan selector korlap dan layouting form.
- **After**: `isFormat3Blocked` langsung menonaktifkan tombol Salin Teks dan Buka WhatsApp secara aman, sementara `WaReportFormatTabs` menampilkan panel peringatan yang jelas memuat daftar rute yang belum tuntas, menjaga integritas pelaporan ke pimpinan Transjakarta.

### Case 3: Koordinator Lapangan Memfilter Laporan Khusus Wilayah Pengawasannya
- **Kondisi**: Korlap Ranto ingin menarik rekapitulasi 6 rute yang berada di bawah pengawasannya untuk dikirim ke grup operasional internal.
- **Before**: Perhitungan subtotal per korlap dan filtering teks berulang kali dihitung dalam komponen monolitik.
- **After**: `useWaReportData` mengisolasi `filteredRoutes` dan menghitung `regionTotals` secara terpisah, menghasilkan teks laporan WhatsApp yang akurat seketika.
