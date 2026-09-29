# Audit Review Fase 3 Batch 3.2 — Sub-hook Odometer

**Status:** `REVISION_REQUIRED`. Review pada branch `devmode`; kode aplikasi dan arsip `refact_107` tidak diubah oleh Codex.

## R108-01 — Rollover Shift 1 dapat mengubah Shift 2 ketika kedua angka sama

- **Lokasi kode:** `src/components/busCard/modal/useBusModalOdometer.ts:364-410`, khususnya pemilihan cabang pada baris 399; pemanggil `src/components/busCard/modal/useBusInputForm.ts:273-284`.
- **Keparahan:** Sedang–Tinggi (integritas data odometer).
- **Deskripsi:** `targetKmAwalForRollover` adalah **nilai string** KM dari shift yang sedang dituju. `applyRollover()` menentukan shift yang harus diperbarui dengan `targetKmAwalForRollover === kmAwal2`. Saat modal berada di tab Shift 1 dan `kmAwal1` sama dengan `kmAwal2`, perbandingan nilai ini benar meskipun target yang dipilih adalah Shift 1. Fungsi lalu mengubah `kmAwal2` dan mungkin `kmAkhir2`, sementara `kmAwal1` tetap salah.
- **Dampak user:** Petugas menekan saran koreksi rollover untuk Shift 1, tetapi angka Shift 2 berubah tanpa diminta. Data KM dapat tersimpan pada shift yang salah.
- **Mitigasi:** Tentukan target rollover berdasarkan identitas shift (`shift1`/`shift2`) yang eksplisit dari mode/tab/kondisi, lalu gunakan identitas itu untuk kalkulasi saran dan aplikasi. Jangan memakai kesamaan angka sebagai pemilih field. Tambahkan tes ketika kedua KM Awal identik dan tab aktif Shift 1, serta kasus Shift 2 yang memang dituju.

## R108-02 — Laporan implementasi melebihkan hasil ekstraksi

- **Lokasi dokumen:** `refactor-ss-pdo/refact_107/AUDIT_BUGS.md:36` dan `REPAIR_REPORT.md:32`.
- **Keparahan:** Rendah (akurasi audit).
- **Deskripsi:** Audit menyatakan sub-hook menyediakan `resetOdometerStates`, tetapi fungsi tersebut tidak ada pada API atau implementasi. Laporan menyebut `useBusModalOdometer.ts` sekitar 190 baris dan `useBusInputForm.ts` turun menjadi sekitar 235 baris; kode aktual masing-masing **445** dan **722** baris pada saat review.
- **Dampak user/tim:** Pemilik proyek mendapat gambaran keliru tentang tingkat modularisasi dan strategi reset ketika unit bus berganti.
- **Mitigasi:** Pada folder revisi baru, cantumkan errata dengan ukuran aktual dan jelaskan mekanisme lifecycle modal yang benar. Jangan menambah fungsi reset hanya untuk menyesuaikan dokumen; implementasikan hanya jika ada kebutuhan nyata yang dibuktikan tes.

## Gerbang yang sudah lulus

- `pnpm run test` independen: **84 file/615 tes lulus**, exit 0.
- `pnpm run build` independen: **exit 0**; peringatan ukuran chunk Vite tidak terkait.
- Lint terarah independen pada hook/form/tes: **exit 0**. Bukti Gemini menunjukkan 6 warning lain dan **0 warning `react-hooks/exhaustive-deps`**; empat warning target telah hilang.
- Tes yang ada belum mencakup tab Shift 1 dengan nilai `kmAwal1 === kmAwal2` saat rollover.
