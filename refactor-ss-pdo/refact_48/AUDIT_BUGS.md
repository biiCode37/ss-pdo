# Audit Temuan Refact 48: Dekomposisi Lembar Rekapitulasi Akumulasi `AccumulationSheet.tsx` (~665 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap komponen bottom sheet rekapitulasi data akumulasi lintas periode `src/components/AccumulationSheet.tsx` yang memuat logika rentang tanggal dinamis, pencegahan tanggal mustahil (31 Februari), sinkronisasi set bulan/tahun dari database Supabase/cache, gesture fisik drag-to-dismiss iOS-style, dan kontrol terapkan rentang akumulasi.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF48-ARCH-001: God File `src/components/AccumulationSheet.tsx` (665 baris)

- **Lokasi Kode**: `src/components/AccumulationSheet.tsx` (665 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu berkas bottom sheet memegang beragam tanggung jawab fungsional:
  1. Pengambilan dan ekstraksi periode database Supabase/cache lokal (`fetchRoutesWithSheets`, `getRoutesFromCache`) untuk menentukan himpunan bulan dan tahun yang valid.
  2. Kalkulasi validasi batas hari riil per bulan/tahun (`getDaysInMonth`) untuk mencegah pemilihan tanggal tidak valid seperti 31 Februari atau 31 April.
  3. Logika reset penuh state tanggal saat sheet dibuka (`BUG-52`) serta penyesuaian otomatis batas akhir hari ke hari ini jika membuka periode bulan berjalan.
  4. Penanganan gesture sentuh drag-to-dismiss interaktif dengan velocity threshold, peredam kurva pegas Apple, dan peredup overlay dinamis.
  5. Antarmuka formulir pemilih periode berjenjang (Tanggal, Bulan, Tahun) untuk sisi "Dari Periode" dan "Sampai Periode".
  6. Validasi rentang tanggal terbalik (`startNum > endNum`) dan penampil pesan galat interaktif.
  7. Penampil badge pratinjau rentang teks dan tombol reset mode akumulasi.
- **Dampak User & Pengembang**:
  - Berkas panjang dengan percampuran logika gesture fisik sentuh dan pemilih dropdown kalender membuat pengujian fungsional dan perbaikan bug rentang tanggal rawan regresi.
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/accumulation/`:
  - `types.ts`: Interface tipe `AccumulationSheetProps`.
  - `useAccumulationRange.ts`: Hook untuk state rentang tanggal, pemuatan periode DB/cache, kalkulasi hari riil per bulan, dan validasi rentang.
  - `useAccumulationGesture.ts`: Hook untuk isolasi gesture sentuh swipe down/drag-to-dismiss fisik iOS.
  - `AccumulationHeader.tsx`: Komponen top drag handle, judul `Layers`, tombol dismiss, dan deskripsi tujuan rekap.
  - `AccumulationPeriodSelector.tsx`: Komponen dropdown pemilih periode 3-kolom untuk sisi "Dari Periode" dan "Sampai Periode".
  - `AccumulationFooter.tsx`: Komponen badge pratinjau rentang, banner peringatan error, tombol Terapkan, dan tombol Reset Mode Akumulasi.
  - `index.ts`: Barrel export terpusat.
  - `AccumulationSheet.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~150 baris** dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
