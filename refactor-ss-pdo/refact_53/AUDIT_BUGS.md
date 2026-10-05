# Audit Temuan Refact 53: Dekomposisi Header Daftar Armada Bus `BusListHeader.tsx` (~497 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap komponen header daftar armada `src/components/busList/BusListHeader.tsx` yang memuat logika banner peringatan akumulasi lintas periode, banner status armada belum konfirmasi (*shift lock*), indikator hairline progres harian, kontrol pencarian unit, filter sisa unit, set ritase massal, dan aksi kontekstual salin KM Shift 1 ke Shift 2.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF53-ARCH-001: God File `src/components/busList/BusListHeader.tsx` (497 baris)

- **Lokasi Kode**: `src/components/busList/BusListHeader.tsx` (497 baris)
- **Tingkat Keparahan**: **MEDIUM-HIGH** (Maintainability & Component Modularity)
- **Deskripsi Masalah**:
  Komponen header daftar unit bus menangani banyak elemen antarmuka yang saling bertumpuk:
  1. Banner peringatan mode rekapitulasi akumulasi dengan kalkulasi format tanggal rentang awal-akhir dan tombol keluar dari mode akumulasi.
  2. Banner peringatan shift terkunci (*shift-lock-banner*) jika status armada belum dikonfirmasi oleh pengawas.
  3. Hairline progress bar 3px yang dinamis menampilkan rasio unit terisi terhadap total armada dan label nama kolom aktif.
  4. Baris kontrol formulir: tombol trigger modal set trip massal, dropdown pemilih fokus kolom aktif, input pencarian bodi unit, dan tombol filter sisa unit belum terisi.
  5. Banner aksi kontekstual salin massal KM Akhir Shift 1 ke KM Awal Shift 2 saat berada di fokus kolom `kmAwal2`.
- **Dampak User & Pengembang**:
  - Berkas yang padat menyulitkan refaktor visual tata letak mobile atau pembaruan alur kerja filter.
  - Komponen header belum memiliki unit test mandiri terisolasi.
- **Mitigasi**:
  Dekomposisi menjadi subkomponen mandiri di folder `src/components/busList/`:
  - `BusListAccumulationBanner.tsx`: Komponen banner peringatan mode akumulasi lintas tanggal dan tombol navigasi kembali ke mode harian.
  - `BusListShiftLockBanner.tsx`: Komponen banner penguncian pengisian data sebelum status armada dikonfirmasi.
  - `BusListProgressBar.tsx`: Komponen hairline progress bar 3px dan teks label kolom aktif.
  - `BusListControlBar.tsx`: Komponen baris kontrol ganda (trip massal, dropdown kolom, input pencarian, filter sisa unit, dan chip salin KM massal).
  - `BusListHeader.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~95 baris** (penurunan -402 baris kode / 81%) dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
  - Pembuatan unit test terdedikasi `src/components/busList/BusListHeader.test.tsx` (4 tests passed).
