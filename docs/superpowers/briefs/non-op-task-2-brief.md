# Task 2 Brief: Kamus Teks Sentral Banner & Tombol Pembuka Kunci

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Kamus Teks Sentral: Dilarang hardcode string UI di komponen form atau modal. Seluruh pesan banner dan dialog aktivasi input didefinisikan di `src/constants/texts/text_alerts.ts`.
- TDD: Perbarui unit test `src/constants/texts/texts.test.ts` terlebih dahulu.

## Files
- Modify: `src/constants/texts/text_alerts.ts`
- Test: `src/constants/texts/texts.test.ts`

## Requirements
Tambahkan konstanta teks berikut pada `TEXT_ALERTS.BUS_INPUT_MODAL`:
1. `NON_OPERATIONAL_BANNER_EMPTY_RITASE`:
   `'Unit tidak memiliki target Ritase (Tidak Beroperasi) - Hanya kolom Keterangan yang dapat diedit/diisi.'`
2. `NON_OPERATIONAL_BANNER_OFF_LIBUR`:
   `'Unit tidak memiliki target Ritase dan berstatus "OFF (Libur)" - Hanya kolom Keterangan yang dapat diedit/diisi.'`
3. `BTN_ACTIVATE_INPUT`:
   `'🔓 Aktifkan Input'`
4. `ACTIVATE_INPUT_PROMPT_TITLE`:
   `'Aktifkan Input Unit'`
5. `ACTIVATE_INPUT_PROMPT_LABEL`:
   `'Masukkan target ritase unit untuk membuka kunci input:'`
6. `ACTIVATE_INPUT_SUCCESS`:
   `'Unit berhasil diaktifkan. Kolom input angka telah terbuka.'`
7. `ACTIVATE_INPUT_INVALID_RITASE`:
   `'Nilai ritase harus lebih besar dari 0 untuk mengaktifkan unit.'`

## Acceptance Criteria
- `src/constants/texts/texts.test.ts` memverifikasi seluruh string baru tersebut.
- Jalankan test `pnpm vitest run src/constants/texts/texts.test.ts` dan pastikan 100% lulus.
- Commit dengan judul: `feat: kamus teks banner proteksi non-operasional dan aktivasi`.
