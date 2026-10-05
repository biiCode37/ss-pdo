# Paket Koreksi Gerbang Gemini — Fase 3 Batch 3.1

Perbaiki **R104-01 saja**. Baca `refactor-ss-pdo/refact_104/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`. Tetap di branch `devmode` dan pertahankan seluruh perubahan lokal serta folder `refact_N` yang sudah diserahkan.

`pnpm run test` saat ini gagal pada 2 ekspektasi perilaku lama di `refactor-ss-pdo/refact_103/evidence/reproduction-r102.test.tsx`; `pnpm run test src/` lulus 604/604 dan `pnpm run build` lulus. Berkas reproduksi adalah bukti sejarah, bukan tes produk aktif.

1. Atur penemuan Vitest agar `refactor-ss-pdo/**` tidak dijalankan oleh `pnpm run test`. Pertahankan default exclude Vitest dan tes sah lainnya; hindari membatasi tes hanya ke `src/` jika itu menghilangkan cakupan lain. Jangan ubah atau hapus bukti di `refact_103`.
2. Buktikan `pnpm run test` tanpa filter exit 0, `pnpm run test src/` tetap 604 tes lulus atau lebih, dan `pnpm run build` exit 0. Jalankan lint pada file konfigurasi yang disentuh dan `graphify update .` setelah perubahan kode/konfigurasi.
3. Dokumentasikan pada folder revisi baru: `AUDIT_BUGS.md`, `REPAIR_REPORT.md` dengan **Before vs After** dan **Case: Skenario Lapangan**, serta log gate. Jangan memulai Batch 3.2 sebelum review Codex.

Laporkan `READY_FOR_REVIEW` hanya setelah perintah tes standar juga lulus.
