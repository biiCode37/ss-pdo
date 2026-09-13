# Repair Report Refact 48: Modularisasi & Dekomposisi Lembar Rekapitulasi Akumulasi (AccumulationSheet)

Dokumen ini memuat laporan teknis implementasi dekomposisi `AccumulationSheet.tsx` menjadi submodul-submodul terisolasi di `src/components/accumulation/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/accumulation/`)
1. **`types.ts`**:
   - Mendefinisikan interface `AccumulationSheetProps` untuk standardisasi kontrak props pemanggilan bottom sheet.
2. **`useAccumulationRange.ts`**:
   - Mengisolasi helper penentu jumlah hari riil per bulan `getDaysInMonth(month, year)`.
   - Mengelola pemuatan periode yang tersedia di database Supabase dan cache lokal (`availableMonths`, `availableYears`).
   - Mereset penuh nilai tanggal awal (tanggal 1) dan tanggal akhir (hari ini atau akhir bulan) setiap kali sheet dibuka.
   - Mengisolasi validasi batas rentang terbalik (`startNum > endNum`) dan penanganan eksekusi `onApply()`.
3. **`useAccumulationGesture.ts`**:
   - Mengisolasi penanganan interaksi fisik sentuh swipe-down / drag-to-dismiss:
     - Deteksi awal `touchStartYRef` dan `touchStartTimeRef`.
     - Perhitungan kecepatan geser (*velocity threshold*) dan kurva pegas fisik Apple `cubic-bezier(0.32, 0.72, 0, 1)`.
     - Penyesuaian opasitas overlay backdrop secara dinamis saat digeser.
4. **`AccumulationHeader.tsx`**:
   - Handle bar geser atas untuk panduan pengguna sentuh ponsel.
   - Judul kartu dengan ikon `Layers`, tombol silang tutup, dan teks deskripsi penjelasan rekapitulasi.
5. **`AccumulationPeriodSelector.tsx`**:
   - Grid 3-kolom tanggal, bulan, dan tahun yang rapi dan proporsional untuk perangkat mobile.
   - Opsi pilihan hari otomatis terkunci pada jumlah hari riil bulan tersebut (mencegah pilihan 31 Februari).
   - Menggunakan kamus bulan Indonesia sentral (`MONTH_NAMES_ID` dari `TEXT_COMMON.MONTHS`).
6. **`AccumulationFooter.tsx`**:
   - Badge pratinjau rentang tanggal informatif dengan ikon `Layers`.
   - Banner peringatan galat jika rentang tanggal terbalik.
   - Tombol "Terapkan Akumulasi" dan tombol opsional "Reset Mode Akumulasi".
7. **`AccumulationSheet.tsx` (Root Orchestrator)**:
   - Berkurang dari 665 baris menjadi **~150 baris** (penurunan -515 baris kode / 77%).
   - Mengelola portal render `createPortal`, transisi mount/unmount fluid, dan listener tombol Escape.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 48 (Before) | Sesudah Refactor 48 (After) |
| :--- | :--- | :--- |
| **Ukuran `AccumulationSheet.tsx`** | 665 baris (Monolitik masif) | **~150 baris** (Penurunan -515 baris kode / 77%) |
| **Struktur Subkomponen** | Rentang tanggal, DB sync, gesture, selector, footer menyatu | 6 file terdedikasi di `src/components/accumulation/` |
| **Pemisahan Logika & UI** | Logika gesture fisik sentuh & validasi tanggal bercampur | `useAccumulationRange` & `useAccumulationGesture` terisolasi murni |
| **Integritas Unit Test** | Belum ada unit test | **3/3 tests `AccumulationSheet.test.tsx` passed**, **44/44 test files passed (340 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (996ms)** |
| **Knowledge Graph** | - | Graphify 3.404 nodes, 4.425 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Petugas Ingin Menarik Rekapitulasi 3 Bulan Terakhir
- **Kondisi**: Petugas operasional di kantor wilayah membuka bottom sheet rekapitulasi akumulasi untuk menganalisis data triwulan (misal: 1 Juli hingga 30 September).
- **Before**: Logika kalkulasi hari dan validasi rentang tanggal bercampur aduk dengan listener gesture sentuh dan rendering HTML.
- **After**: `useAccumulationRange.ts` secara otomatis menyediakan daftar bulan dan tahun yang valid dari database, mengunci jumlah hari akhir bulan September ke 30 hari secara aman, dan langsung memicu kalkulasi rekapitulasi saat ditekan.

### Case 2: Petugas Tidak Sengaja Memilih Tanggal Awal Lebih Besar dari Tanggal Akhir
- **Kondisi**: Petugas keliru mengeset tanggal awal 25 September dan tanggal akhir 10 September.
- **Before**: Rentang terbalik dapat memicu error tak terduga pada query Google Sheets atau menghasilkan array data kosong tanpa kejelasan.
- **After**: Validasi `handleApply` secara instan menolak eksekusi dan memunculkan peringatan ramah pengguna `TEXT_DASHBOARD.ACCUMULATION_SHEET.ERROR_DATE_RANGE` tanpa menutup lembar menu.
