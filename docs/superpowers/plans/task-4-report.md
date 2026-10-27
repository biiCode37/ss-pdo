# Task 4 Report: Integrasi Form Shift 1 & Shift 2 dengan KeteranganPresetBar

## Status: DONE
- **Commit**: `e9624e0` (`feat: embed KeteranganPresetBar in Shift 1 & 2 forms`)
- **Branch**: `devmode`

## Perubahan File:
1. `src/components/busCard/modal/BusInputModalShift1.tsx`:
   - Mengimpor komponen `KeteranganPresetBar` dari `./notes/KeteranganPresetBar`.
   - Menggunakan `keteranganS1` dan `setKeteranganS1` dari `form`.
   - Di dalam blok catatan collapsible (`{showKeterangan && ( ... )}`):
     - Memasang `<KeteranganPresetBar value={keteranganS1} onChange={setKeteranganS1} shiftLabel={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT1_NOTE} />`.
     - Menghubungkan `textarea` ke `value={keteranganS1}`, `onChange={(e) => setKeteranganS1(e.target.value)}`, serta menambahkan `aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT1_NOTE}` untuk aksesibilitas.
2. `src/components/busCard/modal/BusInputModalShift2.tsx`:
   - Mengimpor komponen `KeteranganPresetBar` dari `./notes/KeteranganPresetBar`.
   - Menggunakan `keteranganS2` dan `setKeteranganS2` dari `form`.
   - Di dalam blok catatan collapsible (`{showKeterangan && ( ... )}`):
     - Memasang `<KeteranganPresetBar value={keteranganS2} onChange={setKeteranganS2} shiftLabel={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT2_NOTE} />`.
     - Menghubungkan `textarea` ke `value={keteranganS2}`, `onChange={(e) => setKeteranganS2(e.target.value)}`, serta menambahkan `aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT2_NOTE}` untuk aksesibilitas.
3. `src/components/busCard/BusInputModal.test.tsx`:
   - Menambahkan describe block `Shift 1 & Shift 2 KeteranganPresetBar Integration` dengan 3 test baru:
     - Memverifikasi `KeteranganPresetBar` ter-render di dalam collapsible notes Shift 1 saat chip Catatan dibuka.
     - Memverifikasi `KeteranganPresetBar` ter-render di dalam collapsible notes Shift 2 saat chip Catatan dibuka.
     - Memverifikasi penekanan tombol preset (misal `[OFF]`) di Shift 1 memperbarui `keteranganS1` tanpa mengubah `keteranganS2`, dan payload yang disimpan menggabungkan kedua shift secara kanonik (`"OFF | SGO"`).

## Hasil Verifikasi:
- **TDD Test Failing Step**: Terbukti gagal sebelum implementasi di `BusInputModalShift1` & `BusInputModalShift2`.
- **BusInputModal Tests**: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx` ➔ 35 passed (100%)
- **All busCard Tests**: `pnpm vitest run src/components/busCard/` ➔ 166 passed (100% across 14 test files)
- **TypeScript Strict**: `pnpm tsc -b` ➔ Exit code 0, 0 error
- **Graphify Knowledge Graph**: `graphify update .` ➔ Rebuilt 6,324 nodes, 7,806 edges, 606 communities.
