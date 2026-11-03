# Task 2 Brief: Kamus Teks Sentral Penataan Urutan (`text_plotting.ts`)

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Kamus Teks Sentral: Dilarang hardcode string antarmuka di komponen UI. Seluruh teks modal penataan urutan dan tombol floating action bar didefinisikan di sini.
- TDD: Perbarui unit test `src/constants/texts/texts.test.ts` untuk memverifikasi teks baru.

## Files
- Modify: `src/constants/texts/text_plotting.ts`
- Test: `src/constants/texts/texts.test.ts`

## Requirements
Tambahkan konstanta dan fungsi template berikut pada `TEXT_PLOTTING`:
1. Di dalam `TEXT_PLOTTING.ORDER_MODAL`:
   - `TITLE_SINGLE`: `(unit: string, currentOrder: number) => string` (contoh: `Atur Posisi ${unit} (#${currentOrder})`)
   - `TITLE_MULTI`: `(count: number) => string` (contoh: `Atur Posisi ${count} Unit Terpilih`)
   - `QUICK_TOP`: `'⤒ Paling Depan (#1)'`
   - `QUICK_BOTTOM`: `'⤓ Paling Belakang'`
   - `RELATIVE_HEADER`: `'Atau selipkan posisi relatif:'`
   - `DIR_ABOVE`: `'Di Atas Unit'`
   - `DIR_BELOW`: `'Di Bawah Unit'`
   - `REF_LABEL`: `'Pilih Unit Acuan:'`
   - `REF_PLACEHOLDER`: `'-- Pilih unit acuan target --'`
   - `SUBMIT`: `'Terapkan Posisi'`
   - `APPLY_SUCCESS`: `(count: number) => string` (contoh: `Posisi ${count} unit berhasil diperbarui`)
2. Di dalam `TEXT_PLOTTING.ACTIONS`:
   - `BULK_REORDER`: `(count: number) => string` (contoh: `⇅ Atur Posisi (${count})`)

## Acceptance Criteria
- `src/constants/texts/texts.test.ts` menguji keberadaan seluruh entri kamus `TEXT_PLOTTING.ORDER_MODAL` dan `TEXT_PLOTTING.ACTIONS.BULK_REORDER`.
- Jalankan test `pnpm vitest run src/constants/texts/texts.test.ts` dan pastikan 100% lulus.
- Commit dengan judul: `feat: kamus teks modal penempatan urutan plotting`.
