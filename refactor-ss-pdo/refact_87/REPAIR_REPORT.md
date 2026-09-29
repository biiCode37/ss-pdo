# Keputusan review `refact_86` — Refact 87

Tanggal: 27 September 2026. Branch: `devmode`. Pelaksana: Codex (orchestrator).

**Status: REVISE terbatas.** Perbaikan R85-01 dan R85-03 diterima; R85-02 belum selesai karena R87-01. Tidak ada kode aplikasi yang diubah dalam review ini. Paket untuk Gemini ada di `GEMINI_PHASE_02_BATCH_01_FINAL_REVISION.md`.

## Implementasi review dan Before vs After

| Aspek | Before (`refact_86`) | After (keputusan review) |
| --- | --- | --- |
| Tes nol ritase | Kartu total ritase diperiksa dengan nilai persis, bukan substring seluruh modal | **PASS**; hasil salah `50 Rit` dibedakan dari `0 Rit` |
| Presisi dan prioritas sumber | `totalTrips / 2`; `ritasePerBus` tanpa `.toFixed(1)`; nilai eksplisit diprioritaskan | **PASS** setelah pemeriksaan diff dan full suite |
| Teks UI target | Fallback hook dan unit metrik yang terdaftar telah memakai kamus; `S1/S2`, `Target/Cap`, `Capaian` masih literal | **REVISE** khusus R87-01; pertahankan angka dan copy |
| ID temuan | R79-06 dan R83-02 telah dipetakan ke topik yang benar | **PASS**; arsip `refact_84` tetap utuh |
| Gates | Executor melaporkan 531 tes, lint 72 warning, build sukses | Codex menjalankan ulang full suite, lint, dan build; semuanya exit 0 |

## Case: Skenario Lapangan

### Pengawas membandingkan shift operasi

Modal menampilkan realops Shift 1 dan Shift 2 sebagai `S1: ... • S2: ...`. Setelah istilah shift di kamus diperbarui, bagian ini akan tetap memakai singkatan lama bila label JSX tidak ikut dipusatkan. Revisi memindahkan template tampilan ke kamus tanpa mengubah angka realops.

### Pengawas membaca target pelanggan

Modal menampilkan `Target: ... • Cap: ...` dan `Capaian: ...%` di dua kartu. Revisi menempatkan copy tersebut dalam kamus domain, menjaga nilai target, capaian, dan format yang terlihat tetap sama.

## Verifikasi

| Gate | Hasil review |
| --- | --- |
| Branch | `devmode` |
| Full suite | 74 file, 531 tes lulus, exit 0 |
| Lint | exit 0; 72 warning dilaporkan executor, tidak ada error |
| Build | exit 0; `tsc -b` dan Vite lulus |
| Graphify | output `refact_86` terlihat di `graphify-out/`, 4615 nodes/5823 edges; tidak dijalankan ulang |

Batch 2.2 tetap menunggu penutupan R87-01 dan review singkat berikutnya.
