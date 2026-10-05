# Keputusan review Batch 2.1 — Refact 85

Tanggal: 27 September 2026. Branch: `devmode`. Pelaksana: Codex (orchestrator).

**Status: REVISE.** Perubahan inti perhitungan ritase sesuai aturan PP dan tes target lulus, tetapi R85-01 sampai R85-03 harus ditutup sebelum Batch 2.1 dinyatakan PASS. Belum ada perubahan kode aplikasi oleh Codex pada review ini; `refact_84` tidak diedit.

## Implementasi review dan Before vs After

| Aspek | Before (kiriman `refact_84`) | After (review `refact_85`) |
| --- | --- | --- |
| Perhitungan ritase | `totalTrips / 2`, prioritas nilai eksplisit, dan tiga cabang ritase per bus tanpa pembulatan sudah diterapkan | Diperiksa terhadap diff; arah implementasi diterima |
| Bukti tes nol | Asersi `toContain("0 Rit")` terhadap seluruh modal | R85-01 meminta asersi nilai metrik yang tepat sebelum PASS |
| Kamus teks | 9 label Shift/TOA dipusatkan; beberapa teks UI lain tetap literal dalam dua file yang disentuh | R85-02 menginventaris lokasi dan meminta migrasi terbatas tanpa mengubah logika metrik |
| Ketertelusuran temuan | R79-06 ditautkan ke ritase per bus | R85-03 menjelaskan pemetaan yang benar; arsip lama dipertahankan |
| Verifikasi lokal | Executor melaporkan 531 tes, 72 warning lint, build lulus | Codex menjalankan ulang tes target: 3 file, 40 tes lulus; full suite/lint/build masih berdasarkan laporan executor |

## Case: Skenario Lapangan

### R85-01 — Rute dengan 0 ritase eksplisit dan 100 trip parsial

Nilai sumber `totalRitasePp = 0` wajib menang atas fallback 100 trip. Asersi lama juga lolos jika modal keliru menampilkan `50 Rit`, karena teks itu mengandung `0 Rit`. Tes revisi harus membaca nilai total ritase di kartu yang tepat dan membuktikan hasil persis 0.

### R85-02 — Petugas melihat kesalahan odometer dan unit metrik

Pesan lintas hari bisa menampilkan label `Kemarin`, dan header trip bisa menampilkan `Trip Pergi`/`Trip Pulang`. Pengawas melihat unit `Rit/Bus`, `Org/Bus`, dan `Org/KM` di modal. Semua teks tersebut harus berasal dari kamus domain agar perubahan copy berlaku konsisten; angka yang dihitung tetap sama.

### R85-03 — Project owner menelusuri R79-06

R79-06 semula menunjuk label validasi di hook. Laporan `refact_84` menghubungkannya ke presisi ritase, sehingga status bisa tampak selesai walau literal lain belum ditangani. Laporan revisi perlu menyatakan R79-06 berkaitan dengan label validasi, sedangkan R83-02 berkaitan dengan presisi ritase per bus.

## Verifikasi

- Branch: `devmode`.
- `pnpm run test --dir src src/constants/texts/texts.test.ts src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx`: **3 file, 40 tes lulus, exit 0**.
- `git diff --check`: tidak ada error whitespace; Git mengeluarkan peringatan normalisasi LF/CRLF.
- Paket revisi untuk Gemini: `GEMINI_PHASE_02_BATCH_01_REVISION.md`.

Keputusan berikutnya menunggu diff revisi dan dokumentasi pada folder urutan baru.
