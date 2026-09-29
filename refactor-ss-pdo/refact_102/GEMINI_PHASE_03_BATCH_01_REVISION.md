# Paket Revisi Gemini — Fase 3 Batch 3.1

Perbaiki **R102-01 dan R102-02** sebelum Batch 3.1 diajukan kembali. Baca `refactor-ss-pdo/refact_102/AUDIT_BUGS.md` dan `REPAIR_REPORT.md` serta paket awal di `refact_100`. Tetap di branch `devmode`; pertahankan seluruh perubahan lokal dan arsip. Buat folder dokumentasi baru bernomor berikutnya, jangan edit `refact_101` atau `refact_102`.

## Reproduksi wajib

Pada mode fokus `kmAwal2` atau `kmAkhir2`, siapkan bus dengan `kmAwal1: ""`, `kmAkhir1: "100000"`, `kmAwal2: "90000"`, `previousDayKmAkhir2: "120000"`. KM Awal S1 lokal dapat berupa draf prefill `"120"`. Submit menghasilkan error lintas hari S2, tetapi checkbox bypass saat ini tidak muncul. Buktikan melalui tes yang gagal sebelum perbaikan.

Pada kasus lain, hasil submit hanya mengandung satu error lintas hari. Centang bypass. Array error menjadi kosong dan parent panel `validationErrors.length > 0` menutup seluruh checkbox walaupun bypass masih aktif. Buktikan melalui tes komponen yang gagal sebelum perbaikan.

## Perbaikan minimum

1. Satukan syarat pemilihan KM Awal S1 versus KM Awal S2 untuk derivasi pesan bypass dan jalur submit terkait. Pertahankan semantik mode Single/All yang sudah berlaku; hindari refactor payload atau prefill yang dijadwalkan di batch berikutnya.
2. Pastikan checkbox tampil ketika error lintas hari S2 dihasilkan. Saat dicentang, hanya pesan lintas hari yang hilang, sedangkan error lain tetap terlihat dan memblokir simpan. Jika tidak ada error lain, checkbox harus **tetap terlihat dan checked** sehingga bisa dilepas; submit ulang setelah dilepas menguji lintas hari lagi.
3. Tambahkan tes hook dan komponen untuk kondisi Shift 1 parsial serta kasus hanya satu error lintas hari. Pertahankan tes campuran dan 3 digit yang sudah ada. Gunakan kamus `src/constants/texts/` untuk setiap teks UI baru serta tes integritasnya.
4. Jalankan tes target, `pnpm run test src/`, lint terarah, `pnpm run build`, dan `graphify update .`. Simpan `AUDIT_BUGS.md`, `REPAIR_REPORT.md` berisi **Before vs After** dan **Case: Skenario Lapangan**, serta bukti log pada folder revisi baru. Laporkan `READY_FOR_REVIEW` bila seluruh gate lulus.

Jangan memulai Batch 3.2 pada putaran revisi ini.
