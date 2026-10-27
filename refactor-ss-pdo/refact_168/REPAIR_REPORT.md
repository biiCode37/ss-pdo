# Repair Report - Refactor 168

## Ringkasan Perbaikan

Siklus Refactor 168 mengimplementasikan pembeda prefix catatan shift (`S1:` / `S2:`) pada saat tersimpan ke Google Sheets (SSOT) serta penentuan otomatis shift operasional default berdasarkan waktu operasional (< 14:00 -> Shift 1, >= 14:00 -> Shift 2) untuk modal input mode "semua kolom" dan selector tab catatan.

---

### Implementasi Perbaikan

#### 1. Format Kanonikal Catatan Shift (`keteranganUtils.ts`)
- **Before**:
  `combineShiftKeterangan("BA.01 Ban bocor", "BA.02 NP2")` menghasilkan `"BA.01 Ban bocor | BA.02 NP2"`. Jika salah satu shift kosong, tidak ada indikator shift mana yang mengalami catatan.
- **After**:
  Menghasilkan `"S1: BA.01 Ban bocor | S2: BA.02 NP2"`. Jika hanya Shift 1: `"S1: BA.01 Ban bocor"`. Jika hanya Shift 2: `"S2: BA.02 NP2"`. Untuk status seharian penuh yang identik (`OFF` atau `TO EVDAL`), tetap ringkas tanpa prefix (`"OFF"` / `"TO EVDAL"`).
- **Case Skenario Lapangan**:
  Petugas di lapangan menginput armada TJ-0102 yang di Shift 1 beroperasi normal tanpa catatan, namun di Shift 2 mengalami ban pecah. Di spreadsheet SSOT kini tercatat jelas `S2: BA.01 Ban pecah`. Pengawas tidak lagi bingung apakah ban pecah terjadi di dinas pagi atau siang.

#### 2. Penentuan Shift & Tab Otomatis Berdasarkan Waktu (< 14:00 vs >= 14:00)
- **Before**:
  Form modal mode "semua kolom" dan selector catatan selalu default ke Shift 1 terlepas dari waktu petugas membuka aplikasi.
- **After**:
  Disediakan helper murni `getCurrentOperationalShift()` dan `getDefaultModalTab()`. Ketika formulir dibuka tanpa parameter tab spesifik:
  - Sebelum jam 14:00 -> otomatis membuka tab **Shift 1**.
  - Mulai jam 14:00 ke atas -> otomatis membuka tab **Shift 2**.
  - Pilihan ini hanya berupa default awal; pengguna bebas berpindah antar-tab sewaktu-waktu.
- **Case Skenario Lapangan**:
  Pukul 15:30 WIB, petugas shift sore membuka modal input bus mode "Semua Kolom". Form langsung siap di tab "Shift 2" tanpa perlu klik manual tombol Shift 2. Petugas menghemat waktu dan entri data menjadi jauh lebih sat-set.

#### 3. Resolusi Prioritas Shift pada SingleFocusNotes
- **Before**:
  `SingleFocusNotes` sempat menggunakan operator `||` sehingga di atas jam 14.00 selalu mengunci ke Shift 2 sekalipun form dipanggil untuk Shift 1.
- **After**:
  Menggunakan `(form.activeShift ?? getCurrentOperationalShift()) === 2`, menjamin integritas isolasi shift kapan pun diakses.

---

## Verifikasi & Quality Gates

1. **Vitest Unit Tests**:
   - `pnpm vitest run src/utils/keteranganUtils.test.ts` -> 32/32 tests lulus.
   - `pnpm vitest run src/components/busCard/` -> 14 test files (174 tests) lulus 100%.
   - `pnpm vitest run src/` -> 121 test files (910 tests) lulus 100% tanpa error.
2. **TypeScript & Build**:
   - `pnpm run build` (`tsc -b && vite build`) -> Berhasil 100% tanpa error kompilasi.
3. **Knowledge Graph**:
   - `graphify update .` -> 6372 nodes, 7856 edges, 614 communities terbarukan.
