# Task 2 Report: Komponen Reusable `KeteranganPresetBar`

## Status: DONE
- **Commit**: `a1a1e30` (`feat: implement KeteranganPresetBar component`)
- **Branch**: `devmode`

## Perubahan File:
1. `src/components/busCard/modal/notes/KeteranganPresetBar.tsx`:
   - Komponen reusable untuk preset keterangan operasional armada (BA, OFF, TO EVDAL, Normal SGO).
   - Props: `value: string`, `onChange: (newValue: string) => void`, `shiftLabel?: string`.
   - Tombol preset:
     - `[BA]`: Toggle prefix BA (default `"BA.01 "`). Menghilangkan prefix jika di-toggle off sambil mempertahankan detail.
     - `[OFF]`: Toggle `"OFF"`.
     - `[TO EVDAL]`: Toggle `"TO EVDAL"`.
     - `[Normal (SGO)]`: Reset nilai ke `""` (ditandai aktif saat nilai kosong / normal).
   - Dropdown jenis BA `<select id="select-ba-type">`:
     - Muncul otomatis saat status BA aktif.
     - Opsi jenis: default placeholder (`-- Pilih Jenis BA --`), `01`, `02`, `03`, `04`.
     - Saat berganti kode, mempertahankan alasan khusus yang sudah diketik (contoh: `"BA.01 Radiator bocor"` ➔ `"BA.03 Radiator bocor"`).
   - Shortcut chips `[NP1]` dan `[NP2]`:
     - Muncul otomatis saat kode `02` aktif.
     - Mengubah keterangan langsung ke `"BA.02 NP1"` atau `"BA.02 NP2"`.
   - Menggunakan CSS variables untuk mendukung Light Mode & Dark Mode tanpa hardcoded colors bertebaran.
   - Mengambil seluruh string UI dari `TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS` tanpa hardcoding string teks.
2. `src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx`:
   - Unit test komprehensif (10 test cases) mencakup:
     - Render tombol-tombol utama (BA, OFF, TO EVDAL, Normal).
     - Render `shiftLabel` opsional.
     - Klik BA mengaktifkan awalan `"BA.01 "`.
     - Toggle off BA jika sudah aktif.
     - Render dropdown opsi `01`, `02`, `03`, `04`.
     - Render dan interaksi shortcut `NP1` & `NP2` saat `BA.02` aktif.
     - Pergantian tipe BA via dropdown mempertahankan alasan custom.
     - Klik tombol `OFF` dan toggle off.
     - Klik tombol `TO EVDAL` dan toggle off.
     - Klik tombol `Normal (SGO)` membersihkan string menjadi `""`.

## Hasil Verifikasi:
- **Vitest**: `pnpm vitest run src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx` ➔ 10 passed (100%)
- **Central Text Dictionary Vitest**: `pnpm vitest run src/constants/texts/texts.test.ts` ➔ 24 passed (100%)
- **TypeScript Strict**: `pnpm tsc -b` ➔ Exit code 0, 0 error
