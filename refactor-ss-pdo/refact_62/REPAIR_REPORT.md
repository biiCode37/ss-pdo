# Repair Report - Refactor 62 (Transformasi Pemblokir Status Armada Menjadi Soft Reminder)

Laporan komprehensif implementasi perbaikan, perbandingan Before vs After, dan skenario lapangan untuk Refactor 62.

---

## 1. Implementasi Teknis

### A. Pelepasan Pemblokir Hard-Block (`useBusCardModal.ts` & `useBulkOperations.ts`)
- Menghapus pengecekan `if (isShiftConfirmed === false)` yang sebelumnya memanggil `showWarningToast` dan `return;` di:
  1. `src/components/busCard/useBusCardModal.ts` pada fungsi `handleOpenModal`: Modal input kartu bus sekarang dapat dibuka langsung oleh pengguna tanpa terblokir.
  2. `src/components/busList/useBulkOperations.ts` pada fungsi `handleOpenBulkTripModal`: Pengguna dapat membuka dialog set target trip massal secara bebas.
  3. `src/components/busList/useBulkOperations.ts` pada fungsi `handleBulkCopyKmS1`: Pengguna dapat menyalin data KM Shift 1 ke Shift 2 secara massal.

### B. Indikator Visual Pengingat Ramah (*Soft Reminder*)
- **Banner Utama Dashboard (`BusListShiftLockBanner.tsx`)**:
  - Teks pengingat diperbarui dari kalimat bernada larangan ("Tentukan status armada terlebih dahulu untuk mulai mengisi data operasional") menjadi pengingat ramah:
    *"Pengingat: Status armada Shift {shift} belum dikonfirmasi. Anda tetap dapat menginput data, namun disarankan untuk segera mengonfirmasi status armada."*
  - Tombol aksi `Tentukan Status` tetap tersedia bagi pengguna untuk membuka modal status armada dengan 1-klik kapan pun siap.
- **Badge Kartu Bus (`BusCard.tsx`)**:
  - Mengubah badge dari gembok `🔒 Belum Konfirmasi` menjadi `⚠️ Belum Konfirmasi`.
  - Mengubah tooltip menjadi: *"Pengingat: Status armada belum dikonfirmasi. Disarankan untuk segera mengonfirmasi status armada."*
- **Aksen Visual Kartu Bus (`src/index.css`)**:
  - Menghapus efek `opacity: 0.72` pada `.bus-card.bus-card-locked` agar kartu tidak tampak mati/faded (*disabled*), sembari mempertahankan garis aksen amber (`border-left-color: var(--warning-color) !important`) sebagai pengingat visual yang estetis.
- **Banner Pengingat di Dalam Modal Input (`BusInputModal.tsx`)**:
  - Menambahkan bar pengingat amber di dalam modal input saat `isShiftConfirmed === false`:
    *"Pengingat: Status armada Shift {shift} belum dikonfirmasi. Disarankan untuk segera mengonfirmasi status armada."*
  - Pengguna tetap dapat menginput TOA, KM, Trip, dan Keterangan tanpa kendala.

### C. Standardisasi Kamus Teks Sentral (`src/constants/texts/`)
- Memperbarui `text_fleet_status.ts`:
  - `LOCK_BANNER_MESSAGE`: pesan pengingat ramah dinamis berbasis nomor shift.
  - `LOCK_CARD_TOOLTIP`: tooltip pengingat informatif.
  - `MODAL_REMINDER`: template teks pengingat untuk modal input bus.
- Memperbarui `text_dashboard.ts`:
  - `BUS_CARD_ACTIONS.UNCONFIRMED_BADGE`: `'⚠️ Belum Konfirmasi'`.

---

## 2. Before vs After

### BUG-62-01: Interaksi Kartu Bus & Modal Input

**Before:**
- Petugas mengklik kartu unit bus di dashboard.
- Aplikasi menampilkan toast peringatan kuning dan otomatis membuka paksa modal status armada.
- Modal input bus **TIDAK BISA DIBUKA** sama sekali sampai status armada shift dikonfirmasi.

**After:**
- Petugas mengklik kartu unit bus di dashboard.
- Modal input bus (`BusInputModal`) langsung terbuka secara mulus.
- Di dalam modal dan di kartu bus, terdapat strip peringatan ramah:
  `⚠️ Pengingat: Status armada Shift 1 belum dikonfirmasi. Disarankan untuk segera mengonfirmasi status armada.`
- Petugas dapat mengisi nilai TOA, KM, atau Keterangan dan menyimpannya ke spreadsheet secara normal.

---

### BUG-62-02: Operasi Massal (Bulk Trip & Copy KM S1)

**Before:**
- Mengklik tombol `Set Target Trip` atau `Salin KM S1 ke S2` ditolak langsung jika status armada belum dikonfirmasi.
- Muncul toast peringatan dan alur kerja massal terputus.

**After:**
- Tombol `Set Target Trip` dan `Salin KM S1 ke S2` dapat dijalankan langsung kapan saja sesuai kebutuhan operasional.

---

### BUG-62-03: Tampilan Visual Kartu Armada

**Before:**
- Kartu armada tampak redup dengan `opacity: 0.72` dan badge `🔒 Belum Konfirmasi`, memicu impresi bahwa sistem sedang rusak/terkunci mati.

**After:**
- Kartu armada tampil cerah 100% dengan badge `⚠️ Belum Konfirmasi` dan batas kiri amber yang tegas serta profesional.

---

## 3. Case: Skenario Lapangan

### Skenario Lapangan 1: Petugas Pos Lapangan Saat Pergantian Shift Sibuk
- **Kondisi:** Pukul 13:45 WIB di Pos Rute JAK.15, pengemudi Shift 1 berdatangan menyerahkan catatan KM akhir dan TOA, sementara pengawas wilayah belum sempat mengonfirmasi daftar status armada Shift 2 di sistem.
- **Dampak Sebelum Perbaikan:** Petugas loket tidak bisa menginput data ritase/KM pramudi sama sekali karena kartu bus terkunci. Antrean pengemudi menumpuk di pos.
- **Setelah Perbaikan:** Petugas loket dapat langsung membuka kartu unit JAK.15-01 dkk., menginput angka KM dan TOA dengan leluasa. Banner pengingat kuning tetap mengingatkan agar konfirmasi status armada dilakukan segera setelah antrean input selesai.

### Skenario Lapangan 2: Pengawas Menyiapkan Target Ritase Massal Pagi Hari
- **Kondisi:** Pukul 05:00 WIB sebelum seluruh bus keluar pool, pengawas ingin menyetel target trip 4/4 untuk seluruh unit via tombol `Set Target Trip`.
- **Dampak Sebelum Perbaikan:** Pengawas dipaksa menentukan status semua unit satu per satu sebelum bisa memasang target trip rute.
- **Setelah Perbaikan:** Pengawas dapat langsung menerapkan target trip secara massal dalam 2 detik, lalu melanjutkan penentuan status armada saat bus beroperasi.

---

## 4. Status Verifikasi Quality Gates

1. **Unit Test Suite:**
   - Command: `pnpm vitest run src/`
   - Hasil: **54 test files passed (401 tests passed, 0 failures)**.
2. **TypeScript Strict Mode & Production Build:**
   - Command: `pnpm run build`
   - Hasil: **TypeScript compiler (`tsc -b`) lulus 0 error, Vite build dist sukses**.
3. **Knowledge Graph:**
   - Command: `graphify update .`
   - Hasil: **AST Re-extracted 293/293 files, Knowledge Graph tersinkronisasi**.
