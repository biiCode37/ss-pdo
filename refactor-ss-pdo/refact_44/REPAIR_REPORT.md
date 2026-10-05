# Repair Report Refact 44: Modularisasi & Dekomposisi Komponen Daftar Bus (BusList)

Dokumen ini memuat laporan teknis implementasi dekomposisi `BusList.tsx` menjadi submodul-submodul terisolasi di `src/components/busList/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/busList/`)
1. **`busListUtils.ts`**:
   - Mengekstrak konstanta `BUS_CATEGORIES` (ALL, trip, toaShift1, totalToa, kmAwal1, kmAkhir1, kmAwal2, kmAkhir2).
   - Mengekstrak fungsi `isUnitAllowedForInput()`: Memvalidasi apakah suatu unit diperbolehkan untuk diinput berdasarkan status SGO pada shift terkait (S1/S2).
   - Mengekstrak fungsi `isBusFilled()`: Memvalidasi apakah field data bus sudah lengkap sesuai kategori aktif.
2. **`useBulkOperations.ts`**:
   - Mengisolasi tata kelola aksi massal:
     - Deteksi target trip operasional rute (`targetTrip`).
     - Modal dan mutasi massal target trip (`handleOpenBulkTripModal`).
     - Filter unit yang memenuhi syarat salin KM S1 (`availableKmS1Buses`, `skippedWithNotesCount`, `emptyKmAwal2Count`).
     - Modal dan mutasi massal salin KM S1 ke KM S2 (`handleBulkCopyKmS1`).
3. **`BusListHeader.tsx`**:
   - Mengisolasi tata letak sticky header daftar bus:
     - Banner peringatan mode akumulasi tanggal.
     - Indikator hairline progress bar harian (`[data-testid="daily-progress-container"]`).
     - Banner peringatan shift belum dikonfirmasi (`.shift-lock-banner`).
     - Tombol buka modal bulk target trip dan dropdown fokus kolom.
     - Input pencarian unit bus dan tombol toggle filter sisa unit belum lengkap.
     - Aksi kontekstual baris salin KM S1 ke S2 saat tab `kmAwal2` aktif.
4. **`BusList.tsx` (Root Orchestrator)**:
   - Berkurang dari 881 baris menjadi **~200 baris** (penurunan -681 baris kode / 77%).
   - Mempertahankan integritas loop auto-next Mode Satset, skeleton rendering, dan mapping kartu bus.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 44 (Before) | Sesudah Refactor 44 (After) |
| :--- | :--- | :--- |
| **Ukuran `BusList.tsx`** | 881 baris (Monolitik masif) | **~200 baris** (Penurunan -681 baris kode / 77%) |
| **Struktur Subkomponen** | Validasi bus, bulk modal, header, filter menyatu | 4 file terdedikasi di `src/components/busList/` |
| **Pemisahan Logika & UI** | Bulk batch updates, progress bar, sorting bercampur | Single Responsibility Principle murni per modul |
| **Integritas Unit Test** | - | **6/6 tests `BusList.test.tsx` passed**, **41/41 test files passed (331 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.15s)** |
| **Knowledge Graph** | - | Graphify 3.277 nodes, 4.275 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Menyalin KM Akhir Shift 1 ke KM Awal Shift 2 Secara Massal
- **Kondisi**: Petugas operasional di depo pada pergantian shift (pukul 13:30 WIB) ingin menyalin kilometer akhir shift 1 ke kilometer awal shift 2 untuk 20 bus sekaligus.
- **Before**: Logika modal `showBulkCopyKmModal`, filter bus berstatus OFF, dan pengiriman batch update bercampur aduk di dalam file komponen visual kartu.
- **After**: Seluruh alur kerja dieksekusi via `useBulkOperations.ts`. Bus yang berstatus trouble atau libur otomatis dilewati secara aman, dan notifikasi toast sukses muncul seketika.

### Case 2: Mode Satset Pengisian Cepat di Lapangan
- **Kondisi**: Petugas melakukan input data TOA satu per satu secara cepat. Mode Satset aktif agar setelah simpan, modal otomatis membuka unit berikutnya yang belum terisi.
- **Before**: Handler pencarian unit berikutnya (`handleSaveAndNext`) bergantung pada fungsi kelengkapan yang tertanam di god file.
- **After**: Logika `isBusFilled` dan `isUnitAllowedForInput` kini berada di `busListUtils.ts`, teruji, dan memiliki waktu eksekusi yang sangat cepat tanpa kalkulasi ulang yang berat.
