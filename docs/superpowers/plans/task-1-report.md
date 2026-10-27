# Task 1 Report: Kamus Teks Sentral & Definisi Opsi BA

## Status: DONE
- **Commit**: `b26c86d` (`feat: add central texts for keterangan presets`)
- **Branch**: `devmode`

## Perubahan File:
1. `src/constants/texts/text_alerts.ts`:
   - Menambahkan objek `PRESETS` ke dalam `TEXT_ALERTS.BUS_INPUT_MODAL` yang memuat seluruh konstanta teks:
     - `BTN_BA`: "BA"
     - `BTN_OFF`: "OFF"
     - `BTN_TO_EVDAL`: "TO EVDAL"
     - `BTN_CLEAR`: "Normal (SGO)"
     - `SELECT_BA_DEFAULT`: "-- Pilih Jenis BA --"
     - `BA_TYPES`: Opsi jenis BA `01` s/d `04`
     - `BTN_NP1`: "NP1"
     - `BTN_NP2`: "NP2"
     - `LABEL_SHIFT1_NOTE`: "Catatan Shift 1"
     - `LABEL_SHIFT2_NOTE`: "Catatan Shift 2"
     - `PREVIEW_SSOT_LABEL`: "Hasil Format Spreadsheet:"
     - `APPLY_ALL_SHIFTS`: "Terapkan ke Kedua Shift"
2. `src/constants/texts/texts.test.ts`:
   - Menambahkan pengujian integritas kamus teks untuk `TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS` dan memastikan seluruh key dan nilainya valid.

## Hasil Verifikasi:
- **Vitest**: `pnpm vitest run src/constants/texts/texts.test.ts` ➔ 24 passed (100%)
- **TypeScript Strict**: `pnpm tsc -b` ➔ Exit code 0, 0 error
