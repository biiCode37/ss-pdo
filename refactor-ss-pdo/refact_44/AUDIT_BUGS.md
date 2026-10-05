# Audit Temuan Refact 44: Dekomposisi Komponen Daftar Bus `BusList.tsx` (~881 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap komponen `src/components/BusList.tsx` yang memuat logika penentuan kelengkapan bus harian, status operasional SGO/non-SGO, modal bulk trip, modal bulk copy KM, indikator progress hairline harian, dan orkestrasi kartu bus dalam satu file monolitik.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF44-ARCH-001: God File `src/components/BusList.tsx` (881 baris)

- **Lokasi Kode**: `src/components/BusList.tsx` (881 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu komponen memegang tanggung jawab atas beragam domain operasional:
  1. Definisi kategori fokus kolom dan predikat validasi operasional unit (`isUnitAllowedForInput`, `isBusFilled`).
  2. Dialog massal penentuan target trip operasional rute (`handleOpenBulkTripModal`, integrasi `showBulkTripModal`, mutasi spreadsheet & antrean offline).
  3. Dialog massal penyalinan KM S1 ke KM S2 (`handleBulkCopyKmS1`, integrasi `showBulkCopyKmModal`, mutasi spreadsheet & antrean offline).
  4. Banner peringatan rekap akumulasi dan banner penguncian armada shift yang belum dikonfirmasi (`shift-lock-banner`).
  5. Indikator progress bar hairline beresolusi desimal/persentase.
  6. Kontrol antarmuka (search bar, filter sisa unit belum lengkap, dan dropdown fokus kolom).
  7. Aksi kontekstual baris salin KM dan loop auto-next Mode Satset.
- **Dampak User & Pengembang**:
  - Penyesuaian aturan filter SGO atau kategori kolom baru rawan merusak event handler bulk trip atau progress bar.
  - Komponen terlalu panjang sehingga menyulitkan proses review dan optimasi performa render di smartphone.
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/busList/`:
  - `busListUtils.ts`: Daftar kategori `BUS_CATEGORIES`, fungsi `isUnitAllowedForInput`, dan fungsi `isBusFilled`.
  - `useBulkOperations.ts`: Custom hook untuk mendeteksi target trip, bulk target trip modal, dan bulk copy KM S1 modal.
  - `BusListHeader.tsx`: Komponen sticky header yang merangkum banner akumulasi, hairline progress indicator, shift lock banner, baris kontrol (bulk trip, dropdown, search, filter sisa unit), serta aksi kontekstual salin KM.
  - `index.ts`: Barrel export terpusat.
  - `BusList.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~200 baris** dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
