# Audit Review Revisi Fase 3 Batch 3.1

**Status:** `REVISION_REQUIRED`. Review dilakukan pada branch `devmode`. Kode R102-01 dan R102-02 telah diperbaiki menurut diff dan tes terkait; gerbang tes standar proyek masih gagal karena temuan berikut.

## R104-01 — Tes reproduksi historis ikut dieksekusi oleh perintah tes standar

- **Lokasi kode:** `refactor-ss-pdo/refact_103/evidence/reproduction-r102.test.tsx:99,146`; penemuan tes oleh `pnpm run test` (`vitest run`) dari `package.json`.
- **Keparahan:** Sedang (quality gate dan kesiapan pipeline).
- **Deskripsi:** Berkas bukti sengaja mengharapkan perilaku bug lama (`hasCrossDayError === false` dan checkbox hilang). Karena berakhiran `.test.tsx` dan berada dalam jangkauan penemuan Vitest, `pnpm run test` menjalankannya bersama tes aplikasi. Kode baru yang benar membuat dua ekspektasi historis tersebut gagal.
- **Dampak user/tim:** Perintah tes standar proyek dan pipeline yang memakainya gagal meskipun 604 tes aplikasi pada `src/` lulus. Kontributor berikutnya mendapat sinyal kualitas palsu dan dapat salah menganggap regresi aplikasi.
- **Mitigasi:** Keluarkan `refactor-ss-pdo/**` dari penemuan tes Vitest, sambil mempertahankan pola default untuk tes aplikasi dan tes lain yang sah. Arsip `refact_103` tetap utuh sebagai bukti. Verifikasi `pnpm run test` tanpa filter exit 0, `pnpm run test src/` tetap lulus, dan build lulus. Jangan mengubah ekspektasi bukti historis menjadi perilaku baru.

## Bukti review

- `pnpm run test` independen: **84 file lulus, 1 file gagal; 606 tes lulus, 2 tes gagal**, exit 1. Kedua kegagalan berasal dari `reproduction-r102.test.tsx` di arsip bukti.
- `pnpm run test src/` independen: **83 file / 604 tes lulus**, exit 0.
- `pnpm run build` independen: **exit 0**; hanya peringatan ukuran chunk Vite.
- Tidak ada kode aplikasi atau arsip lama yang diubah pada putaran review ini.
