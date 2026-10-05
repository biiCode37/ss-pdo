# Laporan Review Fase 3 Batch 3.2

**Status:** `REVISION_REQUIRED / BATCH_3_3_HOLD`.

## Implementasi yang ditinjau

Gemini memisahkan state dan perilaku KM dari `useBusInputForm` ke `useBusModalOdometer`; empat warning `exhaustive-deps` hilang. Codex melakukan review dan verifikasi independen tanpa mengubah kode aplikasi. Gerbang fungsional belum lulus karena R108-01; dokumentasi implementasi juga perlu errata R108-02.

## Before vs After yang diperlukan

| Aspek | Kondisi saat review | Target revisi |
|---|---|---|
| Pemilihan target rollover | Kesamaan nilai KM Awal S2 dengan target dipakai sebagai identitas shift. | Identitas Shift 1/2 ditentukan eksplisit dan dipakai saat saran diterapkan. |
| Kedua KM Awal sama | Klik saran Shift 1 dapat mengubah KM Shift 2. | Hanya KM Shift 1 dan pasangan draf KM Akhir 1 yang berubah. |
| Akurasi laporan | Mengklaim fungsi reset yang tidak ada dan ukuran file 190/235 baris. | Errata menyebut API aktual serta ukuran 445/722 baris pada baseline review. |

## Case: Skenario Lapangan

Petugas membuka tab Shift 1. KM Awal Shift 1 dan Shift 2 sama-sama `292003` karena data parsial atau copy sebelumnya, sedangkan KM akhir H-1 `292990`. UI menyarankan rollover `293003` untuk Shift 1. Saat tombol diterapkan, kondisi `targetKmAwalForRollover === kmAwal2` bernilai benar sehingga kode sekarang mengganti KM Awal Shift 2, bukan Shift 1. Revisi harus membuat saran Shift 1 mengubah Shift 1 saja dan mempertahankan nilai Shift 2.

## Verifikasi review

- Branch aktif: `devmode`.
- `pnpm run test`: **84 file/615 tes lulus**, exit 0. Log Happy DOM tes auth tidak menyebabkan kegagalan.
- `pnpm run build`: **lulus**, exit 0.
- Lint terarah: exit 0; empat warning dependensi efek KM selesai. Bukti Gemini masih menunjukkan 6 warning dari aturan lain.
- Reproduksi R108-01 diturunkan langsung dari percabangan target berdasarkan kesamaan string pada kode; tambahkan tes gagal sebelum fix dalam revisi.

## Keputusan

Batch 3.2 **perlu revisi terarah**. Batch 3.1 tetap PASS; Batch 3.3 belum dibuka. Paket revisi ada pada `GEMINI_PHASE_03_BATCH_02_REVISION.md`.
