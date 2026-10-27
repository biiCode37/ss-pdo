# Repair Report - Refactor 170

## Ringkasan Perbaikan

Siklus Refactor 170 menyesuaikan perhitungan target bar progres harian agar seluruh unit yang memiliki keterangan `OFF` atau `TO EVDAL` (dalam segala variasi dan kombinasi shift) secara ketat dikeluarkan dari target (`totalCount`), serta menghapus keterikatan statis quick pill `NP1` & `NP2` pada `BA.02` di modal input keterangan.

---

### Implementasi Perbaikan

#### 1. Pengecualian Ketat Unit OFF & TO EVDAL dari Target Bar Progres
- **Before**:
  Jika suatu bus memiliki catatan `S1: OFF`, `S2: OFF`, `TO EVDAL`, `S1: TO EVDAL`, atau `OFF - BAN PECAH`, evaluasi `isUnitAllowedForInput` sempat menganggap shift lainnya berstatus SGO (karena string shift lainnya kosong), sehingga unit tetap masuk ke target `totalCount` dan keliru ditampilkan sebagai belum selesai (*unfinished*).
- **After**:
  - Dibuat fungsi utilitas terpusat `isUnitOffOrToEvdal` pada `src/utils/keteranganUtils.ts`.
  - Pada `isUnitAllowedForInput` (`busListUtils.ts`), jika `isUnitOffOrToEvdal(bus.keterangan)` bernilai `true`, fungsi langsung mengembalikan `false`. Unit tidak masuk ke `totalCount`, tidak membebani persentase progres, dan disortir rapi di bagian bawah daftar armada.
  - Pada `isBusFilled`, unit berstatus OFF / TO EVDAL dianggap selesai (`true`) agar tidak berstatus bolong.
  - Penyesuaian juga disinkronkan ke `useBulkOperations` agar unit berstatus `OFF` atau `TO EVDAL` tidak ikut terisi trip massal, serta `detectTargetTrip` pada analitik armada.
- **Case Skenario Lapangan**:
  Dari 15 bus terdaftar pada suatu rute, 3 bus tidak beroperasi (misal 1 unit `OFF`, 1 unit `S1: OFF`, dan 1 unit `TO EVDAL`). Target bar progres harian kini menampilkan tepat **12 Unit** (bukan 15 unit). Ketika ke-12 bus dinas telah terisi lengkap, bar progres langsung mencapai **12/12 Unit (100%)** berwarna hijau sukses tanpa terhambat oleh unit yang libur/tidak operasi.

#### 2. Penghapusan Quick Pill NP1 & NP2 pada BA.02
- **Before**:
  Ketika pengguna menekan tombol `02` pada baris BA di `KeteranganPresetBar.tsx`, muncul sub-chip cepat `[NP1]` dan `[NP2]` yang memaksa teks menjadi `BA.02 NP1` atau `BA.02 NP2`. Input mandiri `NP1` pada normalisasi string juga otomatis diubah paksa menjadi `BA.02 NP1`.
- **After**:
  - Sub-chip `[NP1]` dan `[NP2]` pada `KeteranganPresetBar.tsx` dihapus sepenuhnya. Baris 2 kini hanya menampilkan 4 pill kode BA murni (`01`, `02`, `03`, `04`).
  - Fungsi `normalizeKeterangan` tidak lagi memaksakan prefix `BA.02` pada teks mandiri `NP1` / `NP2`. Jika pengawas mengetik `NP1`, teks tetap tersimpan rapi sebagai `NP1` (dan tetap terkapitalisasi penuh berkat set akronim armada `FLEET_ACRONYMS`).
- **Case Skenario Lapangan**:
  Pengawas lapangan mendapati pramudi tidak hadir (NP1), namun kendala tersebut tidak dilaporkan sebagai Berita Acara BA.02. Pengawas dapat mengetik `NP1` secara bebas di kolom catatan tanpa sistem memaksanya menjadi `BA.02 NP1`. Tampilan kartu bus tetap menampilkan badge biru muda `NP1` secara profesional.

---

## Verifikasi & Quality Gates

1. **Vitest Unit Tests**:
   - `pnpm vitest run src/utils/keteranganUtils.test.ts` -> 46/46 tests lulus (100%).
   - `pnpm vitest run src/components/busList/` -> 4 test files (26 tests) lulus 100%.
   - `pnpm vitest run src/components/busCard/` -> 14 test files (178 tests) lulus 100%.
   - `pnpm vitest run src/` -> 122 test files (941 tests) lulus 100% tanpa error.
2. **TypeScript Strict & Production Build**:
   - `pnpm run build` (`tsc -b && vite build`) -> Berhasil 100% tanpa error (0 errors, waktu 1.72s).
3. **Knowledge Graph**:
   - `graphify update .` -> Diperbarui (6403 nodes, 7892 edges, 613 communities).
