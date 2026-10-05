# Paket Revisi Gemini — Fase 3 Batch 3.2

Perbaiki **R108-01** dan dokumentasikan errata **R108-02**. Baca `refactor-ss-pdo/refact_108/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`. Tetap pada branch `devmode`; pertahankan seluruh perubahan lokal dan arsip. Buat folder revisi baru bernomor berikutnya, jangan edit `refact_107` atau `refact_108`.

## Reproduksi dan perbaikan minimum

1. Tambahkan tes sub-hook yang mula-mula gagal: `previousDayKmAkhir2 = "292990"`, `kmAwal1 = "292003"`, `kmAwal2 = "292003"`, tab aktif `shift1`. Saran rollover `293003` muncul untuk Shift 1. Setelah `applyRollover()`, **`kmAwal1` harus `293003`**, `kmAwal2` harus tetap `292003`, dan pasangan KM Akhir S1/S2 hanya berubah sesuai aturan yang relevan.
2. Perbaiki pemilihan target dengan identitas shift eksplisit. Gunakan identitas yang sama untuk menentukan nilai sumber saran dan field yang diperbarui; jangan membandingkan angka KM Awal S1/S2 untuk memilih shift. Uji juga tab/fokus Shift 2 yang memang dituju, keadaan kedua nilai berbeda, dan efek pembersihan error di `useBusInputForm`.
3. Jaga return API `useBusInputForm`, sanitasi payload, bypass lintas hari, copy antarshift, dan seluruh tes Batch 3.1. Jangan mengerjakan Batch 3.3–3.5.

## Errata laporan

Pada `REPAIR_REPORT.md` folder revisi baru, koreksi klaim `refact_107`: sub-hook saat review berisi **445 baris**, hook form **722 baris**, dan `resetOdometerStates` **tidak ada**. Jelaskan lifecycle modal aktual. Jangan menambah fungsi reset tanpa kebutuhan yang terbukti; tujuan revisi ini adalah akurasi laporan dan target rollover.

## Gerbang

Jalankan tes sub-hook/hook/modal terkait, `pnpm run test` tanpa filter, `pnpm run test src/`, lint terarah (0 warning `react-hooks/exhaustive-deps` tetap), `pnpm run build`, dan `graphify update .`. Dokumentasikan `AUDIT_BUGS.md` (ID/lokasi/keparahan/deskripsi/dampak/mitigasi), `REPAIR_REPORT.md` (**Before vs After** dan **Case: Skenario Lapangan**), serta bukti log pada folder baru. Laporkan `READY_FOR_REVIEW` hanya jika skenario rollover dua shift bernilai sama lulus.
