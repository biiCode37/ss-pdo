# Audit Review Revisi Fase 3 Batch 3.2

**Status:** `REVISION_REQUIRED`. Review pada branch `devmode`; Codex tidak mengubah kode aplikasi atau arsip terdahulu.

## R110-01 — Aksi rollover menghapus error KM pair yang masih berlaku

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:273-284`; pesan validator pada `src/constants/texts/text_alerts.ts:107-110`.
- **Keparahan:** Sedang (kejelasan validasi operasional).
- **Deskripsi:** Setelah `odometer.applyRollover()` berhasil, `handleApplyRollover` memfilter setiap error yang memuat fragmen `"tidak boleh lebih kecil dari"`. Fragmen ini dipakai oleh **dua jenis error berbeda**: KM Awal < KM hari sebelumnya (lintas hari) dan KM Akhir < KM Awal (pasangan dalam shift). Karena itu error pasangan yang masih berlaku ikut hilang.
- **Dampak user:** Form dapat tampak bebas error dan tombol Simpan terlihat aktif setelah koreksi rollover, padahal KM Akhir masih lebih kecil dari KM Awal. Submit berikutnya memvalidasi ulang dan menolak, sehingga petugas mendapat umpan balik yang membingungkan.
- **Mitigasi:** Saat tombol rollover ditekan, identifikasi pesan lintas hari yang aktif dari validator yang sama sebelum state KM berubah, lalu hapus **hanya** pesan tersebut dengan pencocokan tepat. Pertahankan error KM pair, TOA, dan pesan lain. Tambahkan tes form dengan error lintas hari dan KM pair bersamaan.

## R110-02 — Klaim laporan tentang preservasi error lain belum benar

- **Lokasi dokumen:** `refactor-ss-pdo/refact_109/REPAIR_REPORT.md`, bagian Case 3 dan Before vs After.
- **Keparahan:** Rendah (akurasi audit).
- **Deskripsi:** Laporan menyatakan `handleApplyRollover` mempertahankan error validasi lain, tetapi implementasi saat review menghapus error KM pair yang memiliki fragmen teks sama.
- **Dampak user/tim:** Bukti kualitas memberi kesimpulan terlalu luas dibanding skenario yang benar-benar diuji.
- **Mitigasi:** Catat errata dan hasil tes campuran pada laporan revisi baru; jangan mengubah `refact_109`.

## Gerbang yang sudah lulus

- Perbaikan identitas `rolloverTargetShift` R108-01 telah diperiksa dan tes kesamaan KM Awal dua shift lulus.
- `pnpm run test` independen: **84 file/620 tes lulus**, exit 0.
- `pnpm run build` independen: **exit 0**; peringatan ukuran chunk Vite tidak terkait.
- Lint terarah independen: exit 0; bukti Gemini mencatat 6 warning aturan lain dan 0 warning `react-hooks/exhaustive-deps`.
- Belum ada tes yang menegaskan error KM pair tetap tampil setelah tombol rollover.
