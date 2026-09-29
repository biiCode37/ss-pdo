# Paket Revisi Gemini — Fase 3 Batch 3.2, Pembersihan Error Rollover

Perbaiki **R110-01** dan catat errata **R110-02**. Baca `refactor-ss-pdo/refact_110/AUDIT_BUGS.md` dan `REPAIR_REPORT.md`. Tetap pada branch `devmode`, pertahankan seluruh perubahan lokal/arsip, dan gunakan folder `refact_N` baru untuk laporan. Jangan edit `refact_109` atau `refact_110`.

## Reproduksi wajib

Dalam form mode All, gunakan `previousDayKmAkhir2 = "292990"`, `kmAwal1 = "292003"`, `kmAkhir1 = "291900"`, tab `shift1`. Submit harus menghasilkan error lintas hari dan KM Akhir < KM Awal. Tekan `handleApplyRollover()`: KM Awal menjadi `293003`, tetapi KM Akhir tetap `291900`. Pada kode saat ini kedua error hilang; tes baru harus membuktikan kegagalan ini sebelum perbaikan.

## Perbaikan minimum

1. Hapus hanya error lintas hari yang dihasilkan validator aktif **sebelum** penerapan saran mengubah state KM. Gunakan identitas pesan tepat atau hasil `getCrossDayValidationErrors(false)` yang sudah tersedia; jangan cocokkan fragmen kalimat umum `"tidak boleh lebih kecil dari"`.
2. Pastikan error KM pair/TOA/lainnya tetap muncul dan tombol Simpan tetap disabled setelah rollover bila error itu masih berlaku. Pertahankan perbaikan target shift eksplisit R108-01 dan checkbox bypass Batch 3.1.
3. Tambahkan tes form campuran yang memeriksa dua pesan sebelum klik, hanya pesan lintas hari hilang sesudah klik, KM pair tetap ada, dan submit tetap ditolak sampai input diperbaiki. Pertahankan tes sub-hook Shift 1/2 yang sudah ada.
4. Di laporan revisi baru, koreksi klaim `refact_109` tentang preservasi error lain. Jangan mengubah arsip lama.

Jalankan tes target, `pnpm run test`, `pnpm run test src/`, lint terarah (empat warning `exhaustive-deps` tetap hilang), `pnpm run build`, dan `graphify update .`. Simpan `AUDIT_BUGS.md` (ID/lokasi/keparahan/deskripsi/dampak/mitigasi), `REPAIR_REPORT.md` (**Before vs After** dan **Case: Skenario Lapangan**), serta bukti log dalam folder revisi baru. Laporkan `READY_FOR_REVIEW` hanya bila seluruh gerbang lulus.
