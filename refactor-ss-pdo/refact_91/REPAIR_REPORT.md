# Keputusan review Batch 2.2 — Refact 91

Tanggal: 27 September 2026. Branch: `devmode`. Pelaksana: Codex (orchestrator).

**Status: REVISE terbatas.** Ekstraksi `BusFormField` dan `ShiftOptionChip` mempunyai pemakai nyata di kedua Shift dan arah arsitekturnya diterima. R91-01 sampai R91-03 perlu ditutup sebelum Batch 2.2 PASS. Codex tidak mengubah source aplikasi atau arsip `refact_90`.

## Implementasi review dan Before vs After

| Aspek | Before (kiriman `refact_90`) | After (keputusan review) |
| --- | --- | --- |
| Reuse UI | Style input/chip disalin pada dua Shift | Komponen bersama dipakai; ekstraksi diterima secara struktur |
| Aksesibilitas chip | Status hanya lewat gaya; laporan mengklaim `aria-pressed` | R91-01 meminta atribut nyata dan tes |
| Tes interaksi | 40 tes target lulus, tetapi Enter hanya memanggil spy dan beberapa alur Shift 2 belum diuji | R91-02 meminta bukti perilaku pada alur risiko utama |
| Visual tema/mobile | Laporan menyatakan tema adaptif tanpa screenshot atau catatan keterbatasan preview | R91-02 meminta bukti visual atau batas verifikasi yang jujur |
| Ketepatan laporan | Beberapa contoh Before/After tidak berasal dari source aktual | R91-03 meminta koreksi dalam laporan baru, menjaga arsip lama |
| Kerapian diff | Dua blank line ekstra di EOF file Shift | R91-03 meminta `git diff --check` bersih |

## Case: Skenario Lapangan

### Petugas memakai pembaca layar untuk memilih Manual

Tombol dapat diklik dan menerima fokus keyboard, tetapi status terpilih tidak diumumkan karena `aria-pressed` hilang. Revisi menambahkan status toggle tanpa mengganti elemen `<button>` native.

### Petugas menekan Enter dan membuka Shift 2

Tes sekarang membuktikan handler `onKeyDown` diteruskan, tetapi belum membuktikan submit melalui `requestSubmit()`. Tes revisi memeriksa jalur itu serta toggle dan input KM terkunci pada Shift 2 agar perilaku lapangan tetap utuh setelah ekstraksi.

### Pemilik proyek meninjau klaim tema terang

Gaya input baru menggunakan token `--input-bg`, sedangkan versi sebelumnya memakai `rgba` gelap. Perubahan ini perlu dilihat pada layar ponsel terang dan gelap; bila preview tidak tersedia, laporan harus menyatakan bahwa visual belum diverifikasi, tanpa mengklaim hasil tampilan tertentu.

## Verifikasi

- Branch `devmode`.
- Tes target mandiri: **3 file / 40 tes lulus**, exit 0.
- Lint terarah: `pnpm run lint src/components/busCard/modal/fields src/components/busCard/modal/BusInputModalShift1.tsx src/components/busCard/modal/BusInputModalShift2.tsx`, exit 0 tanpa output warning.
- Evidence executor: full suite **75 file / 541 tes lulus**, build exit 0. Keduanya tidak dijalankan ulang oleh Codex pada review ini.
- `git diff --check`: blank line baru di EOF pada dua file Shift; peringatan normalisasi LF/CRLF terpisah dari error tersebut.

Paket revisi untuk Gemini: `GEMINI_PHASE_02_BATCH_02_REVISION.md`. Batch 2.3 menunggu review revisi.
