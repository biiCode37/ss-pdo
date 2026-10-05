# Repair Report Refact 53: Modularisasi & Dekomposisi Header Daftar Armada (BusListHeader)

Dokumen ini memuat laporan teknis implementasi dekomposisi `BusListHeader.tsx` menjadi subkomponen-subkomponen terisolasi di `src/components/busList/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/busList/`)
1. **`BusListAccumulationBanner.tsx`**:
   - Menampilkan banner peringatan mode akumulasi lintas tanggal dengan deteksi rentang tanggal satu bulan maupun lintas bulan/tahun.
   - Menyediakan tombol pintas "Kembali ke Harian ➔" yang memanggil callback `onExitAccumulation`.
2. **`BusListShiftLockBanner.tsx`**:
   - Menampilkan banner peringatan `.shift-lock-banner` jika shift aktif belum dikonfirmasi status armadanya.
   - Menyediakan tombol interaktif `onOpenFleetStatus` untuk langsung membuka modal penentuan status armada.
3. **`BusListProgressBar.tsx`**:
   - Menampilkan label kolom aktif dinamis (`ALL` ➔ Progres Harian, spesifik ➔ Kolom: [Label]).
   - Menampilkan rasio jumlah armada terisi terhadap total armada beserta persentase progres.
   - Menampilkan bar progres hairline 3px beranimasi fluida kurva pegas Apple.
4. **`BusListControlBar.tsx`**:
   - Row 1: Tombol Set Jumlah Trip (dengan indikator kuota trip dan loader) serta dropdown pilihan kolom aktif ber-styling custom select.
   - Row 2: Input pencarian nomor bodi unit cepat dan tombol toggle filter sisa unit belum terisi (*unfinished filter*).
   - Contextual Action: Chip aksi cepat salin massal KM Akhir S1 ke KM Awal S2 saat kolom `kmAwal2` dipilih.
5. **`BusListHeader.tsx` (Root Orchestrator)**:
   - Berkurang dari 497 baris menjadi **~95 baris** (penurunan -402 baris kode / 81%).
   - Merakit seluruh subkomponen di dalam kontainer `sticky-buslist-header`.
6. **Unit Test Baru (`src/components/busList/BusListHeader.test.tsx`)**:
   - Menguji rendering progress bar dan total unit saat shift terkonfirmasi.
   - Menguji rendering banner mode akumulasi dan navigasi kembali ke harian.
   - Menguji rendering shift lock banner dan trigger pembukaan modal armada.
   - Menguji event pencarian bodi bus dan tombol filter sisa unit.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 53 (Before) | Sesudah Refactor 53 (After) |
| :--- | :--- | :--- |
| **Ukuran `BusListHeader.tsx`** | 497 baris (Monolitik masif) | **~95 baris** (Penurunan -402 baris kode / 81%) |
| **Struktur Subkomponen** | Banners, progress, controls, bulk copy menyatu | 4 subkomponen terdedikasi di `src/components/busList/` |
| **Pemisahan Tanggung Jawab** | Semua seksi HTML di satu file | Setiap seksi terisolasi rapi dan teruji mandiri |
| **Kamus Teks Sentral** | - | 100% menggunakan entri kamus terpusat di `text_dashboard.ts` & `text_fleet_status.ts` |
| **Integritas Unit Test** | Belum memiliki unit test header khusus | **4/4 tests `BusListHeader.test.tsx` passed**, **46/46 test files passed (349 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.10s)** |
| **Knowledge Graph** | - | Graphify 3.539 nodes, 4.533 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Lapangan Membuka Rute yang Shift-nya Belum Dikonfirmasi
- **Kondisi**: Pengawas membuka rute JAK.15 pada pukul 06:00 pagi saat status armada belum diinput.
- **Before**: Shift lock banner tertanam di dalam komponen monolitik besar dengan berbagai kondisi bercabang.
- **After**: `BusListShiftLockBanner` secara terisolasi menampilkan peringatan oranye yang tegas, dan tombol aksi langsung membuka modal status armada dalam satu ketukan tanpa beban rendering yang tidak perlu.

### Case 2: Petugas Ingin Menyalin KM Akhir Shift 1 ke KM Awal Shift 2 Secara Massal
- **Kondisi**: Memasuki pergantian shift siang, petugas ingin menyalin seluruh odometer bus Shift 1 ke Shift 2.
- **Before**: Logika aksi kontekstual bercampur di bagian paling bawah header.
- **After**: `BusListControlBar` mendeteksi pemilihan kategori `kmAwal2`, dan seketika menyajikan chip aksi salin massal dengan rincian unit siap salin dan unit yang dilewati karena memiliki catatan kendala.
