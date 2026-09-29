# Laporan Review Fase 3 Batch 3.1

**Status:** `REVISION_REQUIRED / BATCH_3_2_HOLD`.

## Implementasi dan keputusan

Pada putaran ini Codex melakukan review; tidak mengubah kode aplikasi. Mutasi state R100-01 sudah hilang, dan ekstraksi sanitizer R100-02 serta fallback teks R100-04 telah diperiksa. Dua jalur UI belum memenuhi kontrak bypass (R102-01 dan R102-02), sehingga Batch 3.1 belum PASS. Paket revisi tersedia pada `GEMINI_PHASE_03_BATCH_01_REVISION.md`.

## Before vs After yang diperlukan

| Aspek | Kondisi saat review | Target setelah revisi |
|---|---|---|
| Pemilihan error lintas hari S2 | Helper menganggap `kmAkhir1` penuh sebagai aktivitas S1; submit mode fokus S2 tidak. | Predikat derivasi error dan submit sama untuk mode terkait. |
| Checkbox bypass | Dapat tersembunyi sementara error lintas hari S2 tampil. | Tampil untuk setiap error lintas hari yang benar-benar dihasilkan submit dan tetap tersedia saat dicentang. |
| Pembersihan error | Error S2 tidak termasuk dalam daftar error yang dibersihkan pada kondisi parsial ini. | Hanya error lintas hari yang relevan hilang; error TOA/KM pair tetap. |
| Parent panel error | Seluruh panel hilang bila error terakhir dibersihkan, termasuk checkbox yang masih aktif. | Pesan alert tampil hanya saat ada error; kontrol bypass tetap terlihat selama aktif agar dapat dilepas. |

## Case: Skenario Lapangan

Baris bus memiliki `kmAwal1` kosong, `kmAkhir1` terisi `100000`, KM akhir H-1 `120000`, dan petugas membuka fokus `kmAwal2` lalu memasukkan `90000`. Prefill KM Awal S1 masih berupa draf tiga digit `120`. Submit mode fokus S2 mengevaluasi lintas hari karena tidak ada KM Awal S1 penuh, lalu menampilkan error. Helper checkbox justru menandai Shift 1 aktif dari `kmAkhir1`, melewati error S2, sehingga petugas tidak dapat memilih bypass reset odometer. Setelah revisi, checkbox muncul, hanya error lintas hari yang dibersihkan saat dicentang, dan submit tetap memeriksa error lain.

Pada baris dengan data KM S1 lengkap tetapi lebih kecil dari KM akhir H-1, submit dapat menghasilkan **hanya** satu error lintas hari. Saat petugas mencentang bypass, error tersebut terhapus. Kondisi render panel `validationErrors.length > 0` menjadi false sehingga checkbox ikut hilang, padahal state bypass masih true. Setelah revisi, checkbox tetap tampak dan dapat dilepas; submit berikutnya tanpa bypass kembali menampilkan error lintas hari.

## Verifikasi review

- `git branch --show-current`: `devmode`.
- `pnpm run test src/`: **83 file, 601 tes lulus**, exit 0. Ada log Happy DOM untuk pemuatan skrip Google API pada tes auth, tetapi hasil akhir lulus.
- `pnpm run build`: **lulus**, exit 0; Vite memberi peringatan ukuran chunk yang tidak terkait Batch 3.1.
- R102-01 dan R102-02 diturunkan dari perbandingan cabang kondisi dan struktur render pada kode aktual. Tambahkan reproduksi otomatis pada revisi sebelum menyatakan PASS.

## Keputusan gerbang

Batch 3.1 **perlu revisi terarah**. Fase yang selesai tetap 2 dari 6; Batch 3.2 belum dibuka.
