# Keputusan review akhir Batch 2.1 — Refact 89

Tanggal: 27 September 2026. Branch: `devmode`. Pelaksana: Codex (orchestrator).

**Status: PASS untuk Fase 2, Batch 2.1.** `refact_88` menutup R87-01. Codex tidak mengubah kode aplikasi dalam review ini. Risiko graf R89-01 dicatat terpisah dan tidak menghalangi pilot UI Batch 2.2.

## Implementasi review dan Before vs After

| Aspek | Sebelum Batch 2.1 / revisi | Setelah review `refact_88` |
| --- | --- | --- |
| Total ritase PP | Fallback 101 trip dibulatkan menjadi 51 ritase | 101 / 2 = 50,5 ritase PP; nilai eksplisit 0 tetap diprioritaskan |
| Ritase per bus | Tiga cabang memakai `.toFixed(1)` | Presisi nilai sumber dan hasil bagi dipertahankan |
| Tes nilai nol | Pencocokan substring `"0 Rit"` juga menerima `"50 Rit"` | Asersi nilai kartu persis `"0 Rit"` |
| Teks modal dan validasi | Beberapa label berada langsung di hook/JSX | Label terinventaris dipindah ke modul domain dan uji integritas kamus |
| Dokumentasi ID | R79-06 pernah dikaitkan dengan presisi ritase | Pemetaan dikoreksi pada `refact_86` dan dikonfirmasi di review ini |
| Keluaran graf | Graphify diregenerasi | Ada edge menuju `dist_old/`; dicatat sebagai R89-01 untuk tindak lanjut tooling |

## Case: Skenario Lapangan

### Pengawas mengecek 101 trip dan 10 bus

Modal kini menampilkan 50,5 ritase PP dan 5,05 ritase per bus ketika keduanya dihitung dari data trip. Tidak ada pembulatan sepihak pada jalur ritase ini.

### Pengawas mengecek angka 0 dari sumber

Jika total ritase eksplisit 0 meski terdapat 100 trip parsial, kartu tetap menampilkan 0. Tes terbaru menolak hasil salah 50 secara tepat.

### Petugas dan pengawas membaca label form/modal

Label validasi bus serta subteks `S1/S2`, `Target/Cap`, dan `Capaian` pada modal berasal dari kamus domain. Revisi terakhir mempertahankan kata, tanda baca, urutan, dan nilai yang tampil.

## Verifikasi

- Branch: `devmode`.
- Diff `refact_88`: tiga template teks murni, tiga penggantian JSX, tiga asersi integritas kamus; rumus domain tidak berubah dalam revisi terakhir.
- Codex menjalankan ulang tes target: **2 file / 28 tes lulus**, exit 0.
- Bukti executor `refact_88/evidence/`: full suite **74 file / 531 tes lulus**, lint **72 warning / 0 error**, build exit 0. Full suite/lint/build tidak dijalankan ulang oleh Codex pada review ini; pada review `refact_86`, Codex menjalankan ketiganya dengan hasil lulus.
- `git diff --check` pada file revisi tidak menemukan error whitespace; Git memberi peringatan normalisasi LF/CRLF.
- `graphify-out/GRAPH_REPORT.md` menunjukkan keluaran pembaruan graf, dengan catatan R89-01.

Paket implementasi berikutnya: `GEMINI_PHASE_02_BATCH_02.md`. Mulai setelah pemilik proyek meneruskan paket kepada Gemini.
